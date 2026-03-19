#!/usr/bin/env python3
"""
Database migration script to add is_answered column to answer tables.
This preserves existing data while adding the new column.

Usage:
    python add_is_answered_column.py
"""

import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.pool import NullPool

from app.config import DATABASE_URL, DB_CONNECT_TIMEOUT, ssl_context
from app.db import _coerce_database_url


async def run_migration():
    """Add is_answered column to existing tables"""
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
                print("Adding is_answered column to PostgreSQL tables...")
                
                # Add column to quiz_answers table
                try:
                    await conn.execute(text("""
                        ALTER TABLE quiz_answers 
                        ADD COLUMN is_answered BOOLEAN NOT NULL DEFAULT TRUE
                    """))
                    print("✓ Added is_answered column to quiz_answers table")
                except Exception as e:
                    if "already exists" in str(e).lower() or "column already exists" in str(e).lower():
                        print("✓ is_answered column already exists in quiz_answers table")
                    else:
                        raise
                
                # Add column to practice_quiz_answers table
                try:
                    await conn.execute(text("""
                        ALTER TABLE practice_quiz_answers 
                        ADD COLUMN is_answered BOOLEAN NOT NULL DEFAULT TRUE
                    """))
                    print("✓ Added is_answered column to practice_quiz_answers table")
                except Exception as e:
                    if "already exists" in str(e).lower() or "column already exists" in str(e).lower():
                        print("✓ is_answered column already exists in practice_quiz_answers table")
                    else:
                        raise
                        
            else:
                # SQLite
                print("Adding is_answered column to SQLite tables...")
                
                try:
                    await conn.execute(text("""
                        ALTER TABLE quiz_answers 
                        ADD COLUMN is_answered BOOLEAN NOT NULL DEFAULT 1
                    """))
                    print("✓ Added is_answered column to quiz_answers table")
                except Exception as e:
                    if "already exists" in str(e).lower() or "column already exists" in str(e).lower():
                        print("✓ is_answered column already exists in quiz_answers table")
                    else:
                        raise
                
                try:
                    await conn.execute(text("""
                        ALTER TABLE practice_quiz_answers 
                        ADD COLUMN is_answered BOOLEAN NOT NULL DEFAULT 1
                    """))
                    print("✓ Added is_answered column to practice_quiz_answers table")
                except Exception as e:
                    if "already exists" in str(e).lower() or "column already exists" in str(e).lower():
                        print("✓ is_answered column already exists in practice_quiz_answers table")
                    else:
                        raise
    
    except Exception as e:
        print(f"✗ Migration failed: {e}")
        raise
    finally:
        await engine.dispose()


if __name__ == '__main__':
    print("Starting database migration...")
    asyncio.run(run_migration())
    print("Migration completed!")
