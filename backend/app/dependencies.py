from typing import Optional

from fastapi import Depends, Header, HTTPException, status

from .db import AsyncSessionLocal
from .services.events import EventStore
from .services.users import UserStore

_user_store = UserStore(AsyncSessionLocal)
_event_store = EventStore(AsyncSessionLocal)


def get_user_store() -> UserStore:
    return _user_store


def get_event_store() -> EventStore:
    return _event_store
