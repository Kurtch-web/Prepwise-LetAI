#!/usr/bin/env python3
"""
Database migration script to handle schema updates.
This script handles both SQLite and PostgreSQL databases.

Usage:
    python migrations.py
"""

import asyncio
import os
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.pool import NullPool

from app.config import DATABASE_URL, DB_CONNECT_TIMEOUT, ssl_context
from app.db import Base, _coerce_database_url


async def run_migration():
    """Run database migration"""
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
        echo=True,
        connect_args=connect_args,
        poolclass=NullPool,
    )
    
    try:
        async with engine.begin() as conn:
            if db_url.startswith('postgresql+asyncpg://'):
                # PostgreSQL - Drop and recreate all tables
                print("Dropping tables (PostgreSQL)...")
                try:
                    await conn.execute(text("DROP TABLE IF EXISTS quiz_answers CASCADE"))
                    await conn.execute(text("DROP TABLE IF EXISTS quiz_sessions CASCADE"))
                    await conn.execute(text("DROP TABLE IF EXISTS quiz_questions CASCADE"))
                    await conn.execute(text("DROP TABLE IF EXISTS quizzes CASCADE"))
                    await conn.execute(text("DROP TABLE IF EXISTS assessments CASCADE"))
                    await conn.execute(text("DROP TABLE IF EXISTS flashcards CASCADE"))
                    await conn.execute(text("DROP TABLE IF EXISTS notifications CASCADE"))
                    await conn.execute(text("DROP TABLE IF EXISTS verification_codes CASCADE"))
                    await conn.execute(text("DROP TABLE IF EXISTS event_logs CASCADE"))
                    await conn.execute(text("DROP TABLE IF EXISTS user_accounts CASCADE"))
                    print("✓ Dropped all tables")
                except Exception as e:
                    print(f"Note: {e}")

                # Recreate tables from models
                print("Creating tables from models...")
                await conn.run_sync(Base.metadata.create_all)
                print("✓ Tables created successfully")
            else:
                # SQLite
                print("Dropping tables (SQLite)...")
                try:
                    await conn.execute(text("DROP TABLE IF EXISTS quiz_answers"))
                    await conn.execute(text("DROP TABLE IF EXISTS quiz_sessions"))
                    await conn.execute(text("DROP TABLE IF EXISTS quiz_questions"))
                    await conn.execute(text("DROP TABLE IF EXISTS quizzes"))
                    await conn.execute(text("DROP TABLE IF EXISTS assessments"))
                    await conn.execute(text("DROP TABLE IF EXISTS flashcards"))
                    await conn.execute(text("DROP TABLE IF EXISTS notifications"))
                    await conn.execute(text("DROP TABLE IF EXISTS verification_codes"))
                    await conn.execute(text("DROP TABLE IF EXISTS event_logs"))
                    await conn.execute(text("DROP TABLE IF EXISTS user_accounts"))
                    print("✓ Dropped all tables")
                except Exception as e:
                    print(f"Note: {e}")

                print("Creating tables from models...")
                await conn.run_sync(Base.metadata.create_all)
                print("✓ Tables created successfully")
    
    except Exception as e:
        print(f"✗ Migration failed: {e}")
        raise
    finally:
        await engine.dispose()


if __name__ == '__main__':
    print("Starting database migration...")
    asyncio.run(run_migration())
    print("Migration completed!")
