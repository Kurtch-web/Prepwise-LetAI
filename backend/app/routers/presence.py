from datetime import datetime, timezone
from typing import Dict, List, Optional

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..dependencies import get_event_store, get_user_store, get_current_user
from ..schemas import OnlineUser, PresenceEvent, PresenceOverview, UserInfo
from ..services.events import EventStore
from ..services.presence import build_presence_overview
from ..services.users import UserStore
from ..models import UserAccount, Assessment
from ..db import get_db

router = APIRouter()


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
    """Get all users with their latest assessment data. If current user is an instructor, only returns their assigned students."""
    # Build query
    query = select(UserAccount).where(UserAccount.role == 'user')

    # If current user is an instructor, filter to only their students
    if current_user.role == 'admin' and current_user.username in ['crystal', 'matthew', 'ami', 'medine']:
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
            'targetExamDate': user.target_exam_date,
            'instructorId': user.instructor_id,
            'createdAt': user.created_at.isoformat(),
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


@router.get('/instructors')
async def list_instructors(
    db: AsyncSession = Depends(get_db),
) -> Dict[str, List]:
    """Get all available instructors (users with instructor_id that matches their id, or designated instructors)"""
    # Get designated instructors
    result = await db.execute(
        select(UserAccount)
        .where(UserAccount.username.in_(['crystal', 'matthew', 'ami', 'medine']))
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
