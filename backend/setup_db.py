#!/usr/bin/env python3
"""
Combined database setup script - creates tables and seeds admin account.

Usage:
    python setup_db.py
"""

import asyncio
import os
from sqlalchemy import text, select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import NullPool

from app.config import DATABASE_URL, DB_CONNECT_TIMEOUT, ssl_context
from app.db import Base, _coerce_database_url
from app.models import UserAccount
from app.security import hash_password


async def setup_database():
    """Run migration and seed admin account in one transaction"""
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
        print("=" * 60)
        print("DATABASE SETUP")
        print("=" * 60)
        
        # Step 1: Drop and recreate tables
        print("\n[1/2] Creating database schema...")
        async with engine.begin() as conn:
            if db_url.startswith('postgresql+asyncpg://'):
                # PostgreSQL
                try:
                    await conn.execute(text("DROP TABLE IF EXISTS assessments CASCADE"))
                    await conn.execute(text("DROP TABLE IF EXISTS flashcards CASCADE"))
                    await conn.execute(text("DROP TABLE IF EXISTS notifications CASCADE"))
                    await conn.execute(text("DROP TABLE IF EXISTS verification_codes CASCADE"))
                    await conn.execute(text("DROP TABLE IF EXISTS event_logs CASCADE"))
                    await conn.execute(text("DROP TABLE IF EXISTS user_accounts CASCADE"))
                except Exception as e:
                    print(f"  Note: {e}")
            else:
                # SQLite
                try:
                    await conn.execute(text("DROP TABLE IF EXISTS assessments"))
                    await conn.execute(text("DROP TABLE IF EXISTS flashcards"))
                    await conn.execute(text("DROP TABLE IF EXISTS notifications"))
                    await conn.execute(text("DROP TABLE IF EXISTS verification_codes"))
                    await conn.execute(text("DROP TABLE IF EXISTS event_logs"))
                    await conn.execute(text("DROP TABLE IF EXISTS user_accounts"))
                except Exception as e:
                    print(f"  Note: {e}")
            
            # Create all tables from models
            await conn.run_sync(Base.metadata.create_all)
            print("  ✓ Database schema created")
        
        # Step 2: Seed admin account
        print("\n[2/2] Seeding admin account...")
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
                print(f"  ✓ Admin account '{admin_username}' already exists")
            else:
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
                
                print(f"  ✓ Admin account created")
        
        print("\n" + "=" * 60)
        print("SETUP COMPLETE!")
        print("=" * 60)
        print("\n✅ You can now sign in with:")
        print(f"  📧 Username: admin")
        print(f"  🔑 Password: Admin@1234")
        print("\n")
    
    except Exception as e:
        print(f"\n✗ Setup failed: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        await engine.dispose()


if __name__ == '__main__':
    asyncio.run(setup_database())
