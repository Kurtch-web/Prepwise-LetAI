#!/usr/bin/env python3
"""
Seed script to create default users including instructors.

Usage:
    python seed_users.py
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


async def seed_users():
    """Seed default users including instructors"""
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
            member_username = os.getenv('USER_DEFAULT_USERNAME', 'member')
            member_password = os.getenv('USER_DEFAULT_PASSWORD', 'Member@1234')
            
            users_to_create = [
                {
                    'username': admin_username,
                    'password': admin_password,
                    'full_name': 'System Administrator',
                    'role': 'admin',
                    'email': 'admin@cvsu.edu.ph'
                },
                {
                    'username': member_username,
                    'password': member_password,
                    'full_name': 'Test Member',
                    'role': 'user',
                    'email': 'member@cvsu.edu.ph'
                },
                {
                    'username': 'admin1',
                    'password': 'Instructor1@123',
                    'full_name': 'Instructor 1',
                    'role': 'admin',
                    'email': 'instructor1@cvsu.edu.ph'
                },
                {
                    'username': 'admin2',
                    'password': 'Instructor2@123',
                    'full_name': 'Instructor 2',
                    'role': 'admin',
                    'email': 'instructor2@cvsu.edu.ph'
                },
                {
                    'username': 'admin3',
                    'password': 'Instructor3@123',
                    'full_name': 'Instructor 3',
                    'role': 'admin',
                    'email': 'instructor3@cvsu.edu.ph'
                },
                {
                    'username': 'admin4',
                    'password': 'Instructor4@123',
                    'full_name': 'Instructor 4',
                    'role': 'admin',
                    'email': 'instructor4@cvsu.edu.ph'
                },
            ]
            
            created_count = 0
            for user_data in users_to_create:
                # Check if user already exists
                result = await session.execute(
                    select(UserAccount).where(UserAccount.username == user_data['username'])
                )
                existing_user = result.scalars().first()
                
                if existing_user:
                    print(f"✓ User '{user_data['username']}' already exists")
                    continue
                
                # Create user
                user = UserAccount(
                    username=user_data['username'],
                    password_hash=hash_password(user_data['password']),
                    role=user_data['role'],
                    full_name=user_data['full_name'],
                    email=user_data['email']
                )
                
                session.add(user)
                created_count += 1
                print(f"+ Created user '{user_data['username']}' ({user_data['full_name']})")
            
            if created_count > 0:
                await session.commit()
                print(f"\n✓ {created_count} user(s) created successfully")
            else:
                print("\n✓ All users already exist")
    
    except Exception as e:
        print(f"✗ Seeding failed: {e}")
        raise
    finally:
        await engine.dispose()


if __name__ == '__main__':
    print("Starting user seeding...\n")
    asyncio.run(seed_users())
    print("\nSeeding completed!")
