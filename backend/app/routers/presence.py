from datetime import datetime, timezone
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..dependencies import get_event_store, get_user_store, get_current_user
from ..schemas import OnlineUser, PresenceEvent, PresenceOverview, UserInfo
from ..services.events import EventStore
from ..services.presence import build_presence_overview
from ..services.users import UserStore
from ..models import Assessment, EventLog, Flashcard, Post, PostAttachment, UserAccount, Video
from ..db import get_db
from ..services.email import email_service
from ..services.storage import build_attachment_path, get_r2_storage, get_supabase_storage
from .flashcards import get_flashcard_storage

router = APIRouter()
DESIGNATED_INSTRUCTOR_ADMINS = {'crystal', 'matthew', 'ami', 'medine', 'shane'}


def _utc_iso(value: Optional[datetime]) -> Optional[str]:
    if value is None:
        return None
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc).isoformat().replace('+00:00', 'Z')


@router.get('/admin/online-users', response_model=Dict[str, List[OnlineUser]])
async def list_online_users() -> Dict[str, List[OnlineUser]]:
    return {'users': []}


@router.get('/admin/presence-events', response_model=Dict[str, List[PresenceEvent]])
async def presence_events(
    event_store: EventStore = Depends(get_event_store),
) -> Dict[str, List[PresenceEvent]]:
    stored = await event_store.recent(limit=100)
    return {'events': stored}


@router.get('/presence/overview', response_model=PresenceOverview)
async def presence_overview(
    user_store: UserStore = Depends(get_user_store),
) -> PresenceOverview:
    return await build_presence_overview(user_store, [])


@router.get('/admin/stats', response_model=Dict[str, int])
async def stats(
    user_store: UserStore = Depends(get_user_store),
) -> Dict[str, int]:
    total_users = await user_store.count_users()
    return {
        'totalUsers': total_users,
        'activeAdmins': 0,
        'activeMembers': 0,
    }


@router.get('/admin/users', response_model=Dict[str, List[UserInfo]])
async def list_all_users(
    user_store: UserStore = Depends(get_user_store),
) -> Dict[str, List[UserInfo]]:
    overview = await build_presence_overview(user_store, [])
    combined = overview.admins + overview.users
    combined.sort(
        key=lambda item: (
            1 if item.online else 0,
            item.lastSeen or datetime.min.replace(tzinfo=timezone.utc),
        ),
        reverse=True,
    )
    return {'users': combined}


@router.get('/admin/users-profiles')
async def list_users_with_profiles(
    db: AsyncSession = Depends(get_db),
    current_user: UserAccount = Depends(get_current_user),
) -> Dict[str, List]:
    """Get all students with their latest assessment data."""
    if current_user.role != 'admin':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Only admins can view user profiles')

    # Build query
    query = select(UserAccount).where(UserAccount.role == 'user')

    # If current user is an instructor, filter to only their students
    if current_user.role == 'admin' and current_user.username in DESIGNATED_INSTRUCTOR_ADMINS:
        query = query.where(UserAccount.instructor_id == current_user.id)

    query = query.order_by(UserAccount.created_at.desc())

    result = await db.execute(query)
    users = result.scalars().all()

    users_data = []
    for user in users:
        # Get latest assessment
        assessment_result = await db.scalar(
            select(Assessment)
            .where(Assessment.user_id == user.id)
            .order_by(Assessment.created_at.desc())
            .limit(1)
        )

        user_data = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'fullName': user.full_name,
            'role': user.role,
            'reviewType': user.review_type,
            'major': user.major,
            'targetExamDate': user.target_exam_date,
            'instructorId': user.instructor_id,
            'createdAt': _utc_iso(user.created_at),
            'isArchived': user.is_archived,
            'archivedAt': _utc_iso(user.archived_at),
            'deletionScheduledAt': _utc_iso(user.deletion_scheduled_at),
            'assessment': None
        }

        if assessment_result:
            user_data['assessment'] = {
                'id': assessment_result.id,
                'responses': assessment_result.responses,
                'learningPreferences': assessment_result.learning_preferences,
                'recommendations': assessment_result.recommendations,
                'createdAt': assessment_result.created_at.isoformat(),
                'updatedAt': assessment_result.updated_at.isoformat(),
            }

        users_data.append(user_data)

    return {'users': users_data}


def _admin_user_response(user: UserAccount) -> Dict:
    return {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'fullName': user.full_name,
        'role': user.role,
        'reviewType': user.review_type,
        'major': user.major,
        'targetExamDate': user.target_exam_date,
        'instructorId': user.instructor_id,
        'createdAt': _utc_iso(user.created_at),
        'isArchived': user.is_archived,
        'archivedAt': _utc_iso(user.archived_at),
        'deletionScheduledAt': _utc_iso(user.deletion_scheduled_at),
        'assessment': None,
    }


def _require_admin_for_student(admin: UserAccount, student: UserAccount) -> None:
    if admin.role != 'admin':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Only admins can manage student accounts')
    if admin.username in DESIGNATED_INSTRUCTOR_ADMINS and student.instructor_id != admin.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='You can only manage your assigned students')


@router.post('/admin/users/{user_id}/archive')
async def archive_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: UserAccount = Depends(get_current_user),
) -> Dict:
    user = await db.scalar(select(UserAccount).where(UserAccount.id == user_id, UserAccount.role == 'user'))
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Student not found')
    _require_admin_for_student(current_user, user)

    if user.is_archived:
        return {'message': 'Student is already archived', 'user': _admin_user_response(user)}

    now = datetime.now(timezone.utc)
    user.is_archived = True
    user.archived_at = now
    user.deletion_scheduled_at = now + timedelta(days=7)
    await db.commit()
    await db.refresh(user)

    if user.email and user.deletion_scheduled_at:
        await email_service.send_account_archived_email(
            user.email,
            user.full_name,
            user.username,
            user.deletion_scheduled_at,
        )

    return {'message': 'Student archived successfully', 'user': _admin_user_response(user)}


@router.post('/admin/users/{user_id}/restore')
async def restore_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: UserAccount = Depends(get_current_user),
) -> Dict:
    user = await db.scalar(select(UserAccount).where(UserAccount.id == user_id, UserAccount.role == 'user'))
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Student not found')
    _require_admin_for_student(current_user, user)

    user.is_archived = False
    user.archived_at = None
    user.deletion_scheduled_at = None
    await db.commit()
    await db.refresh(user)
    return {'message': 'Student restored successfully', 'user': _admin_user_response(user)}


async def _delete_student_assets(db: AsyncSession, user: UserAccount) -> None:
    cleanup_errors = 0
    flashcards = (await db.scalars(select(Flashcard).where(Flashcard.uploader_id == user.id))).all()
    flashcard_storage = get_flashcard_storage()
    for flashcard in flashcards:
        if flashcard_storage and flashcard.storage_path:
            try:
                flashcard_storage.delete(flashcard.storage_path)
            except Exception:
                cleanup_errors += 1

    videos = (await db.scalars(select(Video).where(Video.uploader_id == user.id))).all()
    for video in videos:
        if video.storage_path and video.storage_path != 'youtube-link':
            for storage in (get_r2_storage(), get_supabase_storage()):
                if storage:
                    try:
                        storage.delete(video.storage_path)
                    except Exception:
                        cleanup_errors += 1

    posts = (await db.scalars(select(Post).where(Post.author_id == user.id))).all()
    post_storage = get_supabase_storage()
    for post in posts:
        attachments = (await db.scalars(select(PostAttachment).where(PostAttachment.post_id == post.id))).all()
        for attachment in attachments:
            if post_storage:
                try:
                    post_storage.delete(build_attachment_path(post.id, attachment.id, attachment.original_filename))
                except Exception:
                    cleanup_errors += 1

    if cleanup_errors:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail='Unable to remove all student files')

    await db.execute(delete(EventLog).where(EventLog.username == user.username))


@router.delete('/admin/users/{user_id}')
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: UserAccount = Depends(get_current_user),
) -> Dict[str, str]:
    user = await db.scalar(select(UserAccount).where(UserAccount.id == user_id, UserAccount.role == 'user'))
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Student not found')
    _require_admin_for_student(current_user, user)
    if not user.is_archived:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Archive the student before deleting the account')

    now = datetime.now(timezone.utc)
    scheduled_at = user.deletion_scheduled_at
    if scheduled_at is None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='Student has no deletion schedule')
    if scheduled_at.tzinfo is None:
        scheduled_at = scheduled_at.replace(tzinfo=timezone.utc)
    if scheduled_at > now:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='Student cannot be deleted until the seven-day archive period ends')

    await _delete_student_assets(db, user)
    await db.delete(user)
    await db.commit()
    return {'message': 'Student account deleted permanently'}


@router.get('/instructors')
async def list_instructors(
    db: AsyncSession = Depends(get_db),
) -> Dict[str, List]:
    """Get all available instructors (users with instructor_id that matches their id, or designated instructors)"""
    # Get designated instructors
    result = await db.execute(
        select(UserAccount)
        .where(UserAccount.username.in_(['crystal', 'matthew', 'ami', 'medine', 'shane']))
        .order_by(UserAccount.username)
    )
    instructors = result.scalars().all()

    instructors_data = [
        {
            'id': instructor.id,
            'username': instructor.username,
            'fullName': instructor.full_name or instructor.username,
        }
        for instructor in instructors
    ]

    return {'instructors': instructors_data}
