from datetime import datetime
from datetime import datetime
from typing import List, Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..db import get_db
from ..models import Video, UserAccount, VideoWatch
from ..services.storage import get_supabase_storage
from ..dependencies import get_current_user

router = APIRouter(prefix='/api/videos', tags=['videos'])


class VideoLinkRequest(BaseModel):
    title: str
    description: Optional[str] = None
    category: str
    file_url: str
    is_downloadable: bool = False


class VideoUploadInitRequest(BaseModel):
    """Request to initialize a video upload and get upload URL."""
    title: str
    description: Optional[str] = None
    category: str
    filename: str
    content_type: str = 'video/mp4'
    is_downloadable: bool = True


class VideoUploadCompleteRequest(BaseModel):
    """Request to complete a video upload and save metadata."""
    title: str
    description: Optional[str] = None
    category: str
    storage_path: str
    file_url: str
    is_downloadable: bool = True


def _sanitize_filename(filename: str) -> str:
    """Remove special characters from filename."""
    import re
    return re.sub(r'[^a-zA-Z0-9._-]', '_', filename)


def _get_file_type(filename: str) -> str:
    """Determine file type from filename."""
    filename_lower = filename.lower()
    if filename_lower.endswith(('.mp4', '.webm', '.mov', '.avi', '.mkv')):
        return 'video'
    return 'unknown'


async def _upload_video_file(video_id: str, file: UploadFile, category: str) -> tuple[str, str]:
    """Upload video file to Supabase storage and return storage path and file URL."""
    storage = get_supabase_storage()
    if not storage:
        raise HTTPException(status_code=500, detail='Storage service not configured')
    
    content = await file.read()
    safe_filename = _sanitize_filename(file.filename or 'video')
    date_str = datetime.now().strftime('%Y-%m-%d')
    storage_path = f"videos/{video_id}/{category}/{date_str}/{safe_filename}"
    
    storage.upload(
        path=storage_path,
        content=content,
        content_type=file.content_type or 'video/mp4',
        upsert=True
    )
    
    file_url = storage.public_url(storage_path)
    return storage_path, file_url


@router.post('/metadata', status_code=status.HTTP_201_CREATED)
async def save_video_metadata(
    request: VideoUploadCompleteRequest,
    db: AsyncSession = Depends(get_db),
    current_user: UserAccount = Depends(get_current_user)
):
    """Save video metadata after frontend uploads file directly to Supabase.

    This endpoint is called after the video file has been uploaded directly to Supabase from the frontend.
    It only saves the metadata to the database.
    """
    if not current_user or current_user.role != 'admin':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Only admins can create videos')

    # Extract video ID from storage path (format: videos/{video_id}/category/date/filename)
    try:
        video_id = request.storage_path.split('/')[1]
    except (IndexError, AttributeError):
        video_id = str(uuid4())

    video = Video(
        id=video_id,
        uploader_id=current_user.id,
        title=request.title.strip(),
        description=request.description.strip() if request.description else None,
        category=request.category.strip(),
        storage_path=request.storage_path,
        file_url=request.file_url,
        is_downloadable=request.is_downloadable
    )

    db.add(video)
    await db.commit()
    await db.refresh(video)

    return {
        'id': video.id,
        'title': video.title,
        'description': video.description,
        'category': video.category,
        'file_url': video.file_url,
        'is_downloadable': video.is_downloadable,
        'created_at': video.created_at,
        'uploader': {'id': current_user.id, 'username': current_user.username}
    }


@router.post('/upload', status_code=status.HTTP_201_CREATED)
async def upload_video(
    title: str = Form(...),
    description: Optional[str] = Form(None),
    category: str = Form(...),
    file: UploadFile = File(...),
    is_downloadable: bool = Form(default=True),
    db: AsyncSession = Depends(get_db),
    current_user: UserAccount = Depends(get_current_user)
):
    """Upload a video file directly. Backend handles Supabase upload.

    Note: For large files, use direct Supabase upload via /metadata endpoint instead.
    """
    if not current_user or current_user.role != 'admin':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Only admins can upload videos')

    if not file.filename:
        raise HTTPException(status_code=400, detail='File is required')

    if _get_file_type(file.filename) != 'video':
        raise HTTPException(status_code=400, detail='Only video files are allowed')

    storage = get_supabase_storage()
    if not storage:
        raise HTTPException(status_code=500, detail='Storage service not configured')

    # Upload to Supabase
    video_id = str(uuid4())
    storage_path, file_url = await _upload_video_file(video_id, file, category)

    # Save metadata to database
    video = Video(
        id=video_id,
        uploader_id=current_user.id,
        title=title.strip(),
        description=description.strip() if description else None,
        category=category.strip(),
        storage_path=storage_path,
        file_url=file_url,
        is_downloadable=is_downloadable
    )

    db.add(video)
    await db.commit()
    await db.refresh(video)

    return {
        'id': video.id,
        'title': video.title,
        'description': video.description,
        'category': video.category,
        'file_url': video.file_url,
        'is_downloadable': video.is_downloadable,
        'created_at': video.created_at,
        'uploader': {'id': current_user.id, 'username': current_user.username}
    }


@router.post('', status_code=status.HTTP_201_CREATED)
async def create_video(
    title: str = Form(...),
    description: Optional[str] = Form(None),
    category: str = Form(...),
    file: UploadFile = File(...),
    is_downloadable: bool = Form(default=True),
    db: AsyncSession = Depends(get_db),
    current_user: UserAccount = Depends(get_current_user)
):
    """Create a new video lesson."""
    if not current_user or current_user.role != 'admin':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Only admins can create videos')

    if not file.filename:
        raise HTTPException(status_code=400, detail='File is required')

    if _get_file_type(file.filename) != 'video':
        raise HTTPException(status_code=400, detail='Only video files are allowed')

    video_id = str(uuid4())
    storage_path, file_url = await _upload_video_file(video_id, file, category)

    video = Video(
        id=video_id,
        uploader_id=current_user.id,
        title=title.strip(),
        description=description.strip() if description else None,
        category=category.strip(),
        storage_path=storage_path,
        file_url=file_url,
        is_downloadable=is_downloadable
    )

    db.add(video)
    await db.commit()
    await db.refresh(video)

    return {
        'id': video.id,
        'title': video.title,
        'description': video.description,
        'category': video.category,
        'file_url': video.file_url,
        'is_downloadable': video.is_downloadable,
        'created_at': video.created_at,
        'uploader': {'id': current_user.id, 'username': current_user.username}
    }


@router.post('/link', status_code=status.HTTP_201_CREATED)
async def create_video_from_link(
    request: VideoLinkRequest,
    db: AsyncSession = Depends(get_db),
    current_user: UserAccount = Depends(get_current_user)
):
    """Create a new video lesson from a YouTube link."""
    if not current_user or current_user.role != 'admin':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Only admins can create videos')

    if not request.file_url.strip():
        raise HTTPException(status_code=400, detail='YouTube link is required')

    # Validate that it's a youtube-nocookie embed URL
    if 'youtube-nocookie.com' not in request.file_url:
        raise HTTPException(status_code=400, detail='Invalid YouTube link format')

    video_id = str(uuid4())

    video = Video(
        id=video_id,
        uploader_id=current_user.id,
        title=request.title.strip(),
        description=request.description.strip() if request.description else None,
        category=request.category.strip(),
        storage_path='youtube-link',  # Mark as external link
        file_url=request.file_url.strip(),
        is_downloadable=request.is_downloadable
    )

    db.add(video)
    await db.commit()
    await db.refresh(video)

    return {
        'id': video.id,
        'title': video.title,
        'description': video.description,
        'category': video.category,
        'file_url': video.file_url,
        'is_downloadable': video.is_downloadable,
        'created_at': video.created_at,
        'uploader': {'id': current_user.id, 'username': current_user.username}
    }


@router.get('/categories/list')
async def get_categories(db: AsyncSession = Depends(get_db)):
    """Get all unique video categories."""
    categories = await db.scalars(
        select(Video.category).distinct().order_by(Video.category)
    )
    return {'categories': list(categories)}


@router.get('')
async def list_videos(
    category: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db)
):
    """List all videos, optionally filtered by category."""
    query = select(Video).order_by(Video.created_at.desc())

    if category:
        query = query.where(Video.category == category)

    query = query.offset(skip).limit(limit)
    videos = await db.scalars(query)
    videos_list = []

    for video in videos:
        uploader = await db.scalar(select(UserAccount).where(UserAccount.id == video.uploader_id))
        videos_list.append({
            'id': video.id,
            'title': video.title,
            'description': video.description,
            'category': video.category,
            'file_url': video.file_url,
            'is_downloadable': video.is_downloadable,
            'created_at': video.created_at,
            'updated_at': video.updated_at,
            'uploader': {'id': uploader.id, 'username': uploader.username} if uploader else None
        })

    return videos_list


@router.get('/{video_id}/download')
async def download_video(video_id: str, db: AsyncSession = Depends(get_db)):
    """Get download URL for a video (if downloadable)."""
    video = await db.scalar(select(Video).where(Video.id == video_id))

    if not video:
        raise HTTPException(status_code=404, detail='Video not found')

    if not video.is_downloadable:
        raise HTTPException(status_code=403, detail='This video is not available for download')

    return {
        'download_url': video.file_url,
        'title': video.title,
        'filename': video.storage_path.split('/')[-1]
    }


@router.get('/{video_id}')
async def get_video(video_id: str, db: AsyncSession = Depends(get_db)):
    """Get a specific video."""
    video = await db.scalar(select(Video).where(Video.id == video_id))

    if not video:
        raise HTTPException(status_code=404, detail='Video not found')

    uploader = await db.scalar(select(UserAccount).where(UserAccount.id == video.uploader_id))

    return {
        'id': video.id,
        'title': video.title,
        'description': video.description,
        'category': video.category,
        'file_url': video.file_url,
        'is_downloadable': video.is_downloadable,
        'created_at': video.created_at,
        'updated_at': video.updated_at,
        'uploader': {'id': uploader.id, 'username': uploader.username} if uploader else None
    }


@router.put('/{video_id}')
async def update_video(
    video_id: str,
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    is_downloadable: Optional[bool] = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: UserAccount = Depends(get_current_user)
):
    """Update video metadata."""
    if not current_user or current_user.role != 'admin':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Only admins can update videos')

    video = await db.scalar(select(Video).where(Video.id == video_id))
    if not video:
        raise HTTPException(status_code=404, detail='Video not found')

    if title is not None:
        video.title = title.strip()
    if description is not None:
        video.description = description.strip()
    if category is not None:
        video.category = category.strip()
    if is_downloadable is not None:
        video.is_downloadable = is_downloadable

    video.updated_at = datetime.now()
    await db.commit()
    await db.refresh(video)

    uploader = await db.scalar(select(UserAccount).where(UserAccount.id == video.uploader_id))

    return {
        'id': video.id,
        'title': video.title,
        'description': video.description,
        'category': video.category,
        'file_url': video.file_url,
        'is_downloadable': video.is_downloadable,
        'created_at': video.created_at,
        'updated_at': video.updated_at,
        'uploader': {'id': uploader.id, 'username': uploader.username} if uploader else None
    }


@router.delete('/{video_id}')
async def delete_video(
    video_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: UserAccount = Depends(get_current_user)
):
    """Delete a video."""
    if not current_user or current_user.role != 'admin':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Only admins can delete videos')

    video = await db.scalar(select(Video).where(Video.id == video_id))
    if not video:
        raise HTTPException(status_code=404, detail='Video not found')

    storage = get_supabase_storage()
    if storage:
        try:
            storage.delete(video.storage_path)
        except Exception:
            pass  # Silently fail if storage deletion fails

    await db.delete(video)
    await db.commit()

    return {'message': 'Video deleted successfully'}


@router.post('/{video_id}/start-watch')
async def start_video_watch(
    video_id: str,
    current_user: UserAccount = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Start tracking a video watch session."""
    video = await db.scalar(select(Video).where(Video.id == video_id))
    if not video:
        raise HTTPException(status_code=404, detail='Video not found')

    # Check if there's an active watch session
    existing_watch = await db.scalar(
        select(VideoWatch).where(
            (VideoWatch.user_id == current_user.id) &
            (VideoWatch.video_id == video_id) &
            (VideoWatch.completed_at.is_(None))
        )
    )

    if existing_watch:
        return {
            'watch_id': existing_watch.id,
            'video_id': video_id,
            'started_at': existing_watch.started_at
        }

    watch = VideoWatch(
        user_id=current_user.id,
        video_id=video_id
    )
    db.add(watch)
    await db.commit()
    await db.refresh(watch)

    return {
        'watch_id': watch.id,
        'video_id': video_id,
        'started_at': watch.started_at
    }


@router.post('/{watch_id}/update-progress')
async def update_video_progress(
    watch_id: str,
    watched_seconds: int,
    current_user: UserAccount = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update progress for an active video watch session."""
    watch = await db.scalar(select(VideoWatch).where(VideoWatch.id == watch_id))
    if not watch:
        raise HTTPException(status_code=404, detail='Watch session not found')

    if watch.user_id != current_user.id:
        raise HTTPException(status_code=403, detail='Unauthorized')

    watch.watched_seconds = watched_seconds
    await db.commit()

    return {'status': 'success', 'watched_seconds': watched_seconds}


@router.post('/{watch_id}/complete')
async def complete_video_watch(
    watch_id: str,
    current_user: UserAccount = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Mark a video watch session as completed."""
    watch = await db.scalar(select(VideoWatch).where(VideoWatch.id == watch_id))
    if not watch:
        raise HTTPException(status_code=404, detail='Watch session not found')

    if watch.user_id != current_user.id:
        raise HTTPException(status_code=403, detail='Unauthorized')

    watch.is_completed = True
    watch.completed_at = datetime.now()
    await db.commit()

    return {'status': 'success', 'message': 'Video watch completed'}


@router.get('/user/watch-stats')
async def get_user_watch_stats(
    current_user: UserAccount = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get video watch statistics for the current user."""
    watches = await db.scalars(
        select(VideoWatch)
        .where(VideoWatch.user_id == current_user.id)
        .options(selectinload(VideoWatch.video))
        .order_by(VideoWatch.started_at.desc())
    )

    total_watched_seconds = 0
    videos_watched = []
    videos_list = []

    for watch in watches:
        if watch.video:
            total_watched_seconds += watch.watched_seconds
            if watch.video.id not in videos_watched:
                videos_watched.append(watch.video.id)

            videos_list.append({
                'video_id': watch.video.id,
                'video_title': watch.video.title,
                'category': watch.video.category,
                'watched_seconds': watch.watched_seconds,
                'video_duration': watch.video.duration_seconds,
                'is_completed': watch.is_completed,
                'started_at': watch.started_at,
                'completed_at': watch.completed_at
            })

    return {
        'total_videos_watched': len(videos_watched),
        'total_watch_time_seconds': total_watched_seconds,
        'total_watch_time_hours': round(total_watched_seconds / 3600, 2),
        'videos': videos_list
    }
