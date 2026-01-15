from datetime import datetime
from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, Field

UserRole = Literal['user', 'admin']


class OnlineUser(BaseModel):
    username: str
    role: UserRole
    lastSeen: datetime


class UserInfo(BaseModel):
    username: str
    role: UserRole
    online: bool
    lastSeen: Optional[datetime] = None


class PresenceOverview(BaseModel):
    admins: List[UserInfo]
    users: List[UserInfo]


class PresenceEvent(BaseModel):
    id: str
    username: str
    role: UserRole
    type: Literal['login', 'logout', 'signup', 'flashcard_upload']
    timestamp: datetime


class NotificationOut(BaseModel):
    id: str
    type: str
    data: Dict[str, object]
    createdAt: datetime
    readAt: Optional[datetime] = None


class NotificationList(BaseModel):
    notifications: List[NotificationOut]
