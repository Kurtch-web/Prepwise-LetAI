from datetime import datetime, timezone
from typing import Dict, List

from fastapi import APIRouter, Depends

from ..dependencies import get_event_store, get_user_store
from ..schemas import OnlineUser, PresenceEvent, PresenceOverview, UserInfo
from ..services.events import EventStore
from ..services.presence import build_presence_overview
from ..services.users import UserStore

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
