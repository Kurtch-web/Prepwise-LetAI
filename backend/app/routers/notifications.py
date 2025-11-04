from __future__ import annotations

from typing import Dict, List, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Response
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..db import get_db
from ..dependencies import require_session
from ..models import Notification, UserAccount, CommunityPostReport, CommunityPost, CommunityAttachment
from ..schemas import NotificationList, NotificationOut
from ..services.sessions import Session
from ..services.storage import get_supabase_storage, build_attachment_path

router = APIRouter()


async def _get_user(session: Session, db: AsyncSession) -> UserAccount:
    user = await db.scalar(select(UserAccount).where(UserAccount.username == session.username))
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Account not found')
    return user


@router.get('/notifications', response_model=NotificationList)
async def list_notifications(
    session: Session = Depends(require_session),
    db: AsyncSession = Depends(get_db),
) -> NotificationList:
    user = await _get_user(session, db)
    result = await db.execute(
        select(Notification).where(Notification.user_id == user.id).order_by(Notification.created_at.desc()).limit(50)
    )
    items = [
        NotificationOut(
            id=n.id,
            type=n.type,
            data=n.data or {},
            createdAt=n.created_at,
            readAt=n.read_at,
        )
        for n in result.scalars().all()
    ]
    return NotificationList(notifications=items)


@router.post('/notifications/{notification_id}/read', status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
async def mark_notification_read(
    notification_id: str,
    session: Session = Depends(require_session),
    db: AsyncSession = Depends(get_db),
) -> Response:
    user = await _get_user(session, db)
    notif = await db.scalar(
        select(Notification).where(Notification.id == notification_id, Notification.user_id == user.id)
    )
    if not notif:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Notification not found')
    from datetime import datetime
    notif.read_at = datetime.utcnow()
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get('/admin/reported-posts', response_model=Dict[str, List[Dict[str, Any]]])
async def list_reported_posts(
    session: Session = Depends(require_session),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, List[Dict[str, Any]]]:
    if session.role != 'admin':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Admin only')

    result = await db.execute(
        select(CommunityPostReport)
        .options(
            selectinload(CommunityPostReport.post).selectinload(CommunityPost.author),
            selectinload(CommunityPostReport.post).selectinload(CommunityPost.attachments),
            selectinload(CommunityPostReport.reporter)
        )
        .order_by(CommunityPostReport.created_at.desc())
        .limit(50)
    )
    reports = result.scalars().unique().all()

    storage = get_supabase_storage()
    items = []
    for report in reports:
        post_author = report.post.author.username if report.post and report.post.author else 'Unknown'
        attachments = []
        if report.post and report.post.attachments:
            for att in report.post.attachments:
                att_url = None
                if storage:
                    att_url = storage.public_url(build_attachment_path(report.post_id, att.id, att.filename))
                else:
                    att_url = f"/api/community/attachments/{att.id}"
                attachments.append({
                    'id': att.id,
                    'filename': att.filename,
                    'contentType': att.content_type,
                    'url': att_url,
                })

        items.append({
            'id': report.id,
            'postId': report.post_id,
            'postAuthor': post_author,
            'postAuthorId': report.post.author_id if report.post and report.post.author_id else None,
            'postBody': report.post.body if report.post else 'Post deleted',
            'postCreatedAt': report.post.created_at.isoformat() if report.post else '',
            'attachments': attachments,
            'reportedBy': report.reporter.username,
            'category': report.category,
            'reason': report.reason,
            'createdAt': report.created_at.isoformat(),
        })

    return {'reports': items}


class DeleteReportedPostPayload(BaseModel):
    customReason: str = Field(default='', max_length=1000)


@router.post('/admin/reported-posts/{report_id}/delete-post', status_code=status.HTTP_204_NO_CONTENT)
async def delete_reported_post(
    report_id: str,
    payload: DeleteReportedPostPayload,
    session: Session = Depends(require_session),
    db: AsyncSession = Depends(get_db),
) -> Response:
    if session.role != 'admin':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Admin only')

    # Get the report
    report_result = await db.execute(
        select(CommunityPostReport)
        .options(
            selectinload(CommunityPostReport.post).selectinload(CommunityPost.author)
        )
        .where(CommunityPostReport.id == report_id)
    )
    report = report_result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Report not found')

    # Get post and author
    post = report.post
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Post not found')

    author = post.author
    if not author:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Author not found')

    # Delete the post (cascade will handle attachments and comments)
    await db.delete(post)
    await db.commit()

    # Build notification message with reason
    message = 'Your post has been removed as it violated our Community Guidelines. If you believe this is in error, please contact our support team for further assistance.'
    if payload.customReason:
        message = f'Your post has been removed for the following reason: {payload.customReason}\n\nIf you believe this is in error, please contact our support team for further assistance.'

    # Send notification to author
    notification = Notification(
        user_id=author.id,
        type='post_removed',
        data={
            'title': 'Post Removed',
            'message': message,
            'category': report.category,
            'reason': payload.customReason or report.reason,
            'removedAt': datetime.utcnow().isoformat(),
        }
    )
    db.add(notification)
    await db.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)
