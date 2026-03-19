#!/usr/bin/env python3
"""
Seed script to create the default admin account.

Usage:
    python seed_admin.py
"""

import asyncio
import os
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import NullPool

from app.config import DATABASE_URL, DB_CONNECT_TIMEOUT, ssl_context
from app.db import Base, _coerce_database_url
from app.models import UserAccount
from app.security import hash_password


async def seed_admin():
    """Seed default admin account"""
    db_url, is_external = _coerce_database_url(DATABASE_URL)
    
    connect_args = {}
    if db_url.startswith('postgresql+asyncpg://'):
        connect_args['statement_cache_size'] = 0
        connect_args['prepared_statement_cache_size'] = 0
        connect_args['timeout'] = DB_CONNECT_TIMEOUT
        if is_external:
            connect_args['ssl'] = ssl_context
    
    engine = create_async_engine(
        db_url,
        echo=False,
        connect_args=connect_args,
        poolclass=NullPool,
    )
    
    try:
        async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        
        async with async_session() as session:
            # Get default credentials
            admin_username = os.getenv('ADMIN_DEFAULT_USERNAME', 'admin')
            admin_password = os.getenv('ADMIN_DEFAULT_PASSWORD', 'Admin@1234')
            
            # Check if admin already exists
            result = await session.execute(
                select(UserAccount).where(UserAccount.username == admin_username)
            )
            existing_admin = result.scalars().first()
            
            if existing_admin:
                print(f"✓ Admin account '{admin_username}' already exists")
                return
            
            # Create admin account
            admin_user = UserAccount(
                username=admin_username,
                password_hash=hash_password(admin_password),
                role='admin',
                full_name='System Administrator',
                email='admin@cvsu.edu.ph'
            )
            
            session.add(admin_user)
            await session.commit()
            
            print(f"✓ Admin account created successfully")
            print(f"  Username: {admin_username}")
            print(f"  Password: {admin_password}")
            print(f"  Role: admin")
    
    except Exception as e:
        print(f"✗ Seeding failed: {e}")
        raise
    finally:
        await engine.dispose()


if __name__ == '__main__':
    print("Starting admin seeding...")
    asyncio.run(seed_admin())
    print("Seeding completed!")
