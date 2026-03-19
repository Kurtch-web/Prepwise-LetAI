#!/usr/bin/env python3
"""
Migration script to add is_archived column to quizzes table.
This preserves existing data and only adds the new column.

Usage:
    python add_is_archived_column.py
"""

import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.pool import NullPool

from app.config import DATABASE_URL, DB_CONNECT_TIMEOUT, ssl_context
from app.db import _coerce_database_url


async def add_is_archived_column():
    """Add is_archived column to quizzes table if it doesn't exist"""
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
                # PostgreSQL - Add column with proper constraint
                print("Adding is_archived column to quizzes table (PostgreSQL)...")
                try:
                    # Check if column exists first
                    result = await conn.execute(text("""
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_name='quizzes' AND column_name='is_archived'
                    """))
                    column_exists = result.scalar() is not None
                    
                    if not column_exists:
                        await conn.execute(text("""
                            ALTER TABLE quizzes 
                            ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT false
                        """))
                        print("✓ Added is_archived column")
                        
                        # Create index for is_archived
                        await conn.execute(text("""
                            CREATE INDEX IF NOT EXISTS ix_quizzes_is_archived ON quizzes(is_archived)
                        """))
                        print("✓ Created index on is_archived")
                    else:
                        print("ℹ Column is_archived already exists")
                except Exception as e:
                    print(f"Error adding column: {e}")
                    raise
            else:
                # SQLite - Add column with proper constraint
                print("Adding is_archived column to quizzes table (SQLite)...")
                try:
                    # SQLite doesn't have easy way to check if column exists, so we just try to add it
                    await conn.execute(text("""
                        ALTER TABLE quizzes 
                        ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT 0
                    """))
                    print("✓ Added is_archived column")
                    
                    # Create index for is_archived
                    await conn.execute(text("""
                        CREATE INDEX IF NOT EXISTS ix_quizzes_is_archived ON quizzes(is_archived)
                    """))
                    print("✓ Created index on is_archived")
                except Exception as e:
                    # Column might already exist
                    if "duplicate column name" in str(e) or "already exists" in str(e):
                        print("ℹ Column is_archived already exists")
                    else:
                        print(f"Error adding column: {e}")
                        raise
    
    except Exception as e:
        print(f"✗ Migration failed: {e}")
        raise
    finally:
        await engine.dispose()


if __name__ == '__main__':
    print("Starting migration to add is_archived column...")
    asyncio.run(add_is_archived_column())
    print("Migration completed!")
