#!/usr/bin/env python3
"""
Migration script to add post moderation and category columns to the posts table.
This script handles PostgreSQL (Supabase) databases.

Usage:
    python add_post_moderation_columns.py
"""

import asyncio
import os
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.pool import NullPool

from app.config import DATABASE_URL, DB_CONNECT_TIMEOUT, ssl_context
from app.db import _coerce_database_url


async def run_migration():
    """Run database migration to add post moderation columns"""
    db_url, is_external = _coerce_database_url(DATABASE_URL)

    if not db_url.startswith('postgresql+asyncpg://'):
        print("✗ This migration only supports PostgreSQL databases")
        return

    connect_args = {
        'statement_cache_size': 0,
        'prepared_statement_cache_size': 0,
        'timeout': DB_CONNECT_TIMEOUT,
    }
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
            print("Adding post moderation and category columns...")

            # Add category column
            try:
                await conn.execute(text("""
                    ALTER TABLE posts
                    ADD COLUMN IF NOT EXISTS category VARCHAR(32) DEFAULT 'user' NOT NULL
                """))
                print("✓ Added category column")
            except Exception as e:
                print(f"Note: Could not add category column: {e}")

            # Add view_count column
            try:
                await conn.execute(text("""
                    ALTER TABLE posts
                    ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0 NOT NULL
                """))
                print("✓ Added view_count column")
            except Exception as e:
                print(f"Note: Could not add view_count column: {e}")

            # Add is_flagged column
            try:
                await conn.execute(text("""
                    ALTER TABLE posts
                    ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT FALSE NOT NULL
                """))
                print("✓ Added is_flagged column")
            except Exception as e:
                print(f"Note: Could not add is_flagged column: {e}")

            # Add flag_reason column
            try:
                await conn.execute(text("""
                    ALTER TABLE posts
                    ADD COLUMN IF NOT EXISTS flag_reason TEXT
                """))
                print("✓ Added flag_reason column")
            except Exception as e:
                print(f"Note: Could not add flag_reason column: {e}")

            # Add flagged_at column
            try:
                await conn.execute(text("""
                    ALTER TABLE posts
                    ADD COLUMN IF NOT EXISTS flagged_at TIMESTAMP WITH TIME ZONE
                """))
                print("✓ Added flagged_at column")
            except Exception as e:
                print(f"Note: Could not add flagged_at column: {e}")

            # Add has_appeal column
            try:
                await conn.execute(text("""
                    ALTER TABLE posts
                    ADD COLUMN IF NOT EXISTS has_appeal BOOLEAN DEFAULT FALSE NOT NULL
                """))
                print("✓ Added has_appeal column")
            except Exception as e:
                print(f"Note: Could not add has_appeal column: {e}")

            # Add appeal_text column
            try:
                await conn.execute(text("""
                    ALTER TABLE posts
                    ADD COLUMN IF NOT EXISTS appeal_text TEXT
                """))
                print("✓ Added appeal_text column")
            except Exception as e:
                print(f"Note: Could not add appeal_text column: {e}")

            # Add appeal_submitted_at column
            try:
                await conn.execute(text("""
                    ALTER TABLE posts
                    ADD COLUMN IF NOT EXISTS appeal_submitted_at TIMESTAMP WITH TIME ZONE
                """))
                print("✓ Added appeal_submitted_at column")
            except Exception as e:
                print(f"Note: Could not add appeal_submitted_at column: {e}")

            # Create indexes for better performance
            print("\nCreating indexes...")

            try:
                await conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS ix_posts_category ON posts(category)
                """))
                print("✓ Created index on category column")
            except Exception as e:
                print(f"Note: Could not create category index: {e}")

            try:
                await conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS ix_posts_is_flagged ON posts(is_flagged)
                """))
                print("✓ Created index on is_flagged column")
            except Exception as e:
                print(f"Note: Could not create is_flagged index: {e}")

            try:
                await conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS ix_posts_has_appeal ON posts(has_appeal)
                """))
                print("✓ Created index on has_appeal column")
            except Exception as e:
                print(f"Note: Could not create has_appeal index: {e}")

            try:
                await conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS ix_posts_flagged_at ON posts(flagged_at)
                """))
                print("✓ Created index on flagged_at column")
            except Exception as e:
                print(f"Note: Could not create flagged_at index: {e}")

    except Exception as e:
        print(f"✗ Migration failed: {e}")
        raise
    finally:
        await engine.dispose()


if __name__ == '__main__':
    print("Starting post moderation migration...")
    asyncio.run(run_migration())
    print("\n✓ Migration completed successfully!")
