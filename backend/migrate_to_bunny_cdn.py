#!/usr/bin/env python3
"""
Migration script to transform existing R2 video URLs to Bunny CDN URLs.

This script updates all video records in the database by converting R2 URLs
to Bunny CDN URLs based on the BUNNY_CDN_URL environment variable.

Usage:
    python migrate_to_bunny_cdn.py

The script will:
1. Check if BUNNY_CDN_URL is configured
2. Find all videos with R2 URLs (not YouTube videos)
3. Transform the URLs from R2 domain to Bunny CDN domain
4. Update the database with new URLs
"""

import asyncio
import os
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.pool import NullPool

from app.config import DATABASE_URL, DB_CONNECT_TIMEOUT, ssl_context
from app.db import Base, _coerce_database_url
from app.models import Video


def _transform_url_to_bunny_cdn(file_url: str) -> str:
    """Transform R2 URL to Bunny CDN URL if Bunny CDN is configured.
    
    Replaces the R2 domain with Bunny CDN domain while preserving the file path.
    Example: https://example.r2.cloudflarestorage.com/videos/123/file.mp4
             -> https://letvideoprepwise.b-cdn.net/videos/123/file.mp4
    
    If Bunny CDN is not configured, returns the original URL unchanged.
    """
    # Get Bunny CDN URL from environment
    bunny_cdn_url = os.getenv('BUNNY_CDN_URL', '').strip()
    
    # If Bunny CDN is not configured or it's a YouTube link, return original URL
    if not bunny_cdn_url or 'youtube' in file_url.lower():
        return file_url
    
    # Extract the path part from the URL
    # R2 URLs look like: https://domain.r2.cloudflarestorage.com/path/to/file
    # We want to preserve the /path/to/file part
    try:
        # Find the path part (everything after the domain)
        if '://' in file_url:
            _, rest = file_url.split('://', 1)
            _, path = rest.split('/', 1)
            # Construct Bunny CDN URL with the same path
            bunny_url = f"{bunny_cdn_url}/{path}"
            return bunny_url
    except (ValueError, IndexError):
        # If URL parsing fails, return original
        return file_url
    
    return file_url


async def run_migration():
    """Run Bunny CDN URL migration"""
    bunny_cdn_url = os.getenv('BUNNY_CDN_URL', '').strip()
    
    if not bunny_cdn_url:
        print("✗ BUNNY_CDN_URL environment variable not set")
        print("Please set BUNNY_CDN_URL before running this migration")
        return
    
    print(f"✓ Bunny CDN URL configured: {bunny_cdn_url}")
    print("Starting URL migration...\n")
    
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
        async with AsyncSession(engine) as session:
            # Get all videos
            result = await session.execute(select(Video))
            videos = result.scalars().all()
            
            if not videos:
                print("No videos found in database")
                return
            
            print(f"Found {len(videos)} videos in database\n")
            
            migrated_count = 0
            skipped_count = 0
            
            for video in videos:
                # Skip YouTube videos
                if 'youtube' in video.file_url.lower():
                    print(f"  ⊘ Skipping YouTube video: {video.id} ({video.title})")
                    skipped_count += 1
                    continue
                
                # Check if URL is already Bunny CDN
                if bunny_cdn_url in video.file_url:
                    print(f"  ⊘ Already Bunny CDN: {video.id} ({video.title})")
                    skipped_count += 1
                    continue
                
                # Transform URL
                old_url = video.file_url
                new_url = _transform_url_to_bunny_cdn(old_url)
                
                if old_url != new_url:
                    # Update the video
                    await session.execute(
                        update(Video).where(Video.id == video.id).values(file_url=new_url)
                    )
                    print(f"  ✓ Migrated: {video.id} ({video.title})")
                    print(f"    From: {old_url}")
                    print(f"    To:   {new_url}\n")
                    migrated_count += 1
                else:
                    print(f"  ⊘ No change needed: {video.id} ({video.title})")
                    skipped_count += 1
            
            # Commit all changes
            await session.commit()
            
            print(f"\nMigration Summary:")
            print(f"  ✓ Migrated: {migrated_count} videos")
            print(f"  ⊘ Skipped: {skipped_count} videos")
            print(f"  Total: {len(videos)} videos")

    except Exception as e:
        print(f"✗ Migration failed: {e}")
        raise
    finally:
        await engine.dispose()


if __name__ == '__main__':
    print("=" * 60)
    print("Bunny CDN URL Migration Script")
    print("=" * 60)
    asyncio.run(run_migration())
    print("\n" + "=" * 60)
    print("Migration completed!")
    print("=" * 60)
