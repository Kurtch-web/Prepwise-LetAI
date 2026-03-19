from __future__ import annotations

from datetime import datetime, timezone
from typing import Dict, List

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import get_db
from ..models import Notification, UserAccount
from ..schemas import NotificationList, NotificationOut

router = APIRouter()


@router.get('/notifications', response_model=NotificationList)
async def list_notifications(
    user_id: int = 1,
    db: AsyncSession = Depends(get_db),
) -> NotificationList:
    result = await db.execute(
        select(Notification)
        .where(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc())
        .limit(50)
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
    user_id: int = 1,
    db: AsyncSession = Depends(get_db),
) -> Response:
    notif = await db.scalar(
        select(Notification).where(Notification.id == notification_id, Notification.user_id == user_id)
    )
    if not notif:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Notification not found')
    notif.read_at = datetime.now(timezone.utc)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
