from __future__ import annotations

from typing import AsyncGenerator, Optional, Tuple
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

from sqlalchemy import NullPool
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from .config import (
    DATA_DIR,
    DATABASE_URL,
    DB_CONNECT_TIMEOUT,
    DB_MAX_OVERFLOW,
    DB_POOL_SIZE,
    IS_VERCEL,
    ssl_context,
)


class Base(DeclarativeBase):
    pass


def _coerce_database_url(raw: Optional[str]) -> Tuple[str, bool]:
    if raw:
        url = raw
        if url.startswith('postgres://'):
            url = url.replace('postgres://', 'postgresql+asyncpg://', 1)
        elif url.startswith('postgresql://'):
            url = url.replace('postgresql://', 'postgresql+asyncpg://', 1)
        return url, True
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    return f"sqlite+aiosqlite:///{(DATA_DIR / 'app.db').as_posix()}", False


DB_URL, IS_EXTERNAL_DB = _coerce_database_url(DATABASE_URL)

if DB_URL.startswith('postgresql+asyncpg://'):
    parsed = urlparse(DB_URL)
    qs = dict(parse_qsl(parsed.query))
    # Disable prepared statement caches for pgbouncer transaction/statement pooling
    qs['statement_cache_size'] = '0'
    qs['prepared_statement_cache_size'] = '0'
    DB_URL = urlunparse(parsed._replace(query=urlencode(qs)))

connect_args: dict = {}
if DB_URL.startswith('postgresql+asyncpg://'):
    connect_args['statement_cache_size'] = 0
    connect_args['prepared_statement_cache_size'] = 0
    connect_args['timeout'] = DB_CONNECT_TIMEOUT
    if IS_EXTERNAL_DB:
        connect_args['ssl'] = ssl_context

# For Vercel serverless, use NullPool to avoid connection pool issues
# NullPool creates a new connection for each request and closes it immediately
engine_kwargs = {
    'echo': False,
    'connect_args': connect_args,
    'pool_pre_ping': True,
}

if IS_VERCEL and DB_URL.startswith('postgresql+asyncpg://'):
    # Use NullPool for serverless environments to avoid connection pool exhaustion
    engine_kwargs['poolclass'] = NullPool
else:
    # Use regular pool for local/traditional deployments
    engine_kwargs['pool_size'] = DB_POOL_SIZE
    engine_kwargs['max_overflow'] = DB_MAX_OVERFLOW
    engine_kwargs['pool_recycle'] = 300

engine = create_async_engine(DB_URL, **engine_kwargs)

AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session


async def init_models() -> None:
    from . import models  # noqa: F401
    from sqlalchemy import text

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

        # Handle schema updates for existing databases
        if DB_URL.startswith('postgresql+asyncpg://'):
            # Check if is_archived column exists in quizzes table
            result = await conn.execute(text("""
                SELECT 1 FROM information_schema.columns
                WHERE table_name='quizzes' AND column_name='is_archived'
            """))
            if result.scalar() is None:
                try:
                    await conn.execute(text("""
                        ALTER TABLE quizzes
                        ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT false
                    """))
                    await conn.execute(text("""
                        CREATE INDEX IF NOT EXISTS ix_quizzes_is_archived ON quizzes(is_archived)
                    """))
                    print("✓ Added is_archived column to quizzes table")
                except Exception as e:
                    print(f"Note: Could not add is_archived column: {e}")

            # Check if expires_at column exists in quizzes table
            result = await conn.execute(text("""
                SELECT 1 FROM information_schema.columns
                WHERE table_name='quizzes' AND column_name='expires_at'
            """))
            if result.scalar() is None:
                try:
                    await conn.execute(text("""
                        ALTER TABLE quizzes
                        ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE
                    """))
                    await conn.execute(text("""
                        CREATE INDEX IF NOT EXISTS ix_quizzes_expires_at ON quizzes(expires_at)
                    """))
                    print("✓ Added expires_at column to quizzes table")
                except Exception as e:
                    print(f"Note: Could not add expires_at column: {e}")
        else:
            # SQLite
            try:
                await conn.execute(text("""
                    ALTER TABLE quizzes
                    ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT 0
                """))
                print("✓ Added is_archived column to quizzes table")
            except Exception as e:
                # Column might already exist - this is expected
                if "duplicate column name" not in str(e) and "already exists" not in str(e):
                    print(f"Note: {e}")

            try:
                await conn.execute(text("""
                    ALTER TABLE quizzes
                    ADD COLUMN expires_at DATETIME
                """))
                print("✓ Added expires_at column to quizzes table")
            except Exception as e:
                # Column might already exist - this is expected
                if "duplicate column name" not in str(e) and "already exists" not in str(e):
                    print(f"Note: {e}")

            try:
                await conn.execute(text("""
                    ALTER TABLE questions
                    ADD COLUMN batch_name VARCHAR(128)
                """))
                print("✓ Added batch_name column to questions table")
            except Exception as e:
                if "duplicate column name" not in str(e) and "already exists" not in str(e):
                    print(f"Note: {e}")
