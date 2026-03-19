from typing import Optional
import jwt
from datetime import datetime

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .db import AsyncSessionLocal, get_db
from .services.events import EventStore
from .services.users import UserStore
from .models import UserAccount

_user_store = UserStore(AsyncSessionLocal)
_event_store = EventStore(AsyncSessionLocal)

# JWT Configuration - Should match auth.py
SECRET_KEY = 'your-secret-key-change-in-production'
ALGORITHM = 'HS256'


def get_user_store() -> UserStore:
    return _user_store


def get_event_store() -> EventStore:
    return _event_store


async def get_current_user(
    authorization: Optional[str] = Header(None),
    session: AsyncSession = Depends(get_db)
) -> UserAccount:
    """Get current authenticated user from JWT token"""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='No authorization header provided'
        )

    try:
        # Handle "Bearer <token>" format
        token = authorization.replace('Bearer ', '') if authorization.startswith('Bearer ') else authorization
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get('sub')

        if not username:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail='Invalid token'
            )

        # Fetch user from database
        result = await session.execute(
            select(UserAccount).where(UserAccount.username == username)
        )
        user = result.scalars().first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail='User not found'
            )

        return user

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Token expired'
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Invalid token'
        )
