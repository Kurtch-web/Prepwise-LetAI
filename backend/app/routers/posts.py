import os
import uuid
from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel
from sqlalchemy import and_, delete, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..db import get_db
from ..models import Comment, Like, Post, PostAttachment, UserAccount
from ..services.storage import get_supabase_storage, build_attachment_path, _sanitize_filename

router = APIRouter()


class AttachmentResponse(BaseModel):
    id: str
    file_url: str
    file_type: str
    original_filename: str


class CommentResponse(BaseModel):
    id: str
    user_id: int
    content: str
    username: str
    created_at: str

    class Config:
        from_attributes = True


class PostResponse(BaseModel):
    id: str
    author_id: int
    author_username: str
    content: str
    attachments: List[AttachmentResponse]
    like_count: int
    comment_count: int
    user_liked: bool
    created_at: str
    updated_at: str


class CreatePostRequest(BaseModel):
    content: str


def _get_file_type(filename: str) -> str:
    """Determine file type from extension"""
    filename_lower = filename.lower()
    if filename_lower.endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp')):
        return 'image'
    elif filename_lower.endswith(('.mp4', '.webm', '.mov', '.avi')):
        return 'video'
    elif filename_lower.endswith('.pdf'):
        return 'pdf'
    else:
        return 'file'


async def _upload_attachment(
    post_id: str,
    file: UploadFile,
    db: AsyncSession,
) -> Optional[PostAttachment]:
    """Upload file to Supabase storage"""
    try:
        content = await file.read()
        if not content:
            return None

        storage = get_supabase_storage()
        if not storage:
            return None

        attachment_id = str(uuid.uuid4())
        path = build_attachment_path(post_id, attachment_id, file.filename or 'file')

        storage.upload(
            path=path,
            content=content,
            content_type=file.content_type or 'application/octet-stream',
            upsert=True,
        )

        file_url = storage.public_url(path)
        file_type = _get_file_type(file.filename or '')

        attachment = PostAttachment(
            id=attachment_id,
            post_id=post_id,
            file_url=file_url,
            file_type=file_type,
            original_filename=file.filename or 'file',
        )
        db.add(attachment)
        return attachment

    except Exception as e:
        print(f"Error uploading attachment: {str(e)}")
        return None


@router.post('/posts', status_code=status.HTTP_201_CREATED)
async def create_post(
    content: str = Form(...),
    files: List[UploadFile] = File(default=[]),
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(lambda: 1),  # TODO: Get from auth token
) -> Dict:
    """Create a new post (admin only) with optional attachments"""
    user = await db.scalar(select(UserAccount).where(UserAccount.id == user_id))
    if not user or user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='Only admins can create posts',
        )

    if not content.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Content cannot be empty',
        )

    post = Post(
        id=str(uuid.uuid4()),
        author_id=user_id,
        content=content.strip(),
    )
    db.add(post)
    await db.flush()

    # Upload attachments
    for file in files:
        if file.filename:
            await _upload_attachment(post.id, file, db)

    await db.commit()
    await db.refresh(post, ['attachments'])

    return {
        'id': post.id,
        'message': 'Post created successfully',
        'attachments': [
            {
                'id': a.id,
                'file_url': a.file_url,
                'file_type': a.file_type,
                'original_filename': a.original_filename,
            }
            for a in post.attachments
        ],
    }


@router.get('/posts')
async def list_posts(
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(lambda: 1),  # TODO: Get from auth token
) -> Dict[str, List]:
    """List posts filtered by visibility based on instructor assignment.

    Visibility rules:
    - If post author is an instructor (admin1-4), only their assigned students can see it
    - If post author is a regular user, all admins can see it, plus their instructor
    """
    # Get current user to check their role and instructor assignment
    current_user = await db.scalar(
        select(UserAccount).where(UserAccount.id == user_id)
    )

    # Build visibility query
    # Start with all posts with their authors loaded
    base_query = select(Post).options(
        selectinload(Post.author),
        selectinload(Post.attachments),
        selectinload(Post.likes),
        selectinload(Post.comments),
    )

    # Filter posts based on visibility
    # If current user is admin, they can see all posts
    if current_user and current_user.role == 'admin':
        # Admins can see all posts
        pass
    elif current_user:
        # Regular users (students) can only see:
        # 1. Posts from their assigned instructor
        # 2. Posts from other students (if they have the same instructor)
        base_query = base_query.where(
            or_(
                # Posts from their assigned instructor
                and_(
                    Post.author_id == current_user.instructor_id,
                    current_user.instructor_id.is_not(None)
                ),
                # Posts from other students with same instructor
                Post.author_id.in_(
                    select(UserAccount.id).where(
                        and_(
                            UserAccount.instructor_id == current_user.instructor_id,
                            UserAccount.role == 'user'
                        )
                    )
                ),
            )
        )

    result = await db.execute(
        base_query
        .order_by(Post.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    posts = result.scalars().all()

    posts_response = []
    for post in posts:
        user_liked = any(like.user_id == user_id for like in post.likes)
        posts_response.append({
            'id': post.id,
            'author_id': post.author_id,
            'author_username': post.author.username,
            'content': post.content,
            'attachments': [
                {
                    'id': a.id,
                    'file_url': a.file_url,
                    'file_type': a.file_type,
                    'original_filename': a.original_filename,
                }
                for a in post.attachments
            ],
            'like_count': len(post.likes),
            'comment_count': len(post.comments),
            'user_liked': user_liked,
            'created_at': post.created_at.isoformat(),
            'updated_at': post.updated_at.isoformat(),
        })

    return {'posts': posts_response}


@router.get('/posts/{post_id}')
async def get_post(
    post_id: str,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(lambda: 1),
) -> Dict:
    """Get a single post with all details. Enforces visibility rules based on instructor assignment."""
    post = await db.scalar(
        select(Post)
        .where(Post.id == post_id)
        .options(
            selectinload(Post.author),
            selectinload(Post.attachments),
            selectinload(Post.likes),
            selectinload(Post.comments).selectinload(Comment.user),
        )
    )

    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Post not found',
        )

    # Check visibility
    current_user = await db.scalar(
        select(UserAccount).where(UserAccount.id == user_id)
    )

    # Admins can see all posts
    if not current_user or current_user.role != 'admin':
        # Students can only see posts from their instructor or other students with same instructor
        post_author = post.author

        # Check if student can access this post
        can_view = False

        if current_user and current_user.instructor_id:
            # Can view posts from their instructor
            if post_author.id == current_user.instructor_id:
                can_view = True
            # Can view posts from other students with same instructor
            elif post_author.instructor_id == current_user.instructor_id and post_author.role == 'user':
                can_view = True

        if not can_view:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail='You do not have permission to view this post',
            )

    user_liked = any(like.user_id == user_id for like in post.likes)

    return {
        'id': post.id,
        'author_id': post.author_id,
        'author_username': post.author.username,
        'content': post.content,
        'attachments': [
            {
                'id': a.id,
                'file_url': a.file_url,
                'file_type': a.file_type,
                'original_filename': a.original_filename,
            }
            for a in post.attachments
        ],
        'comments': [
            {
                'id': c.id,
                'user_id': c.user_id,
                'content': c.content,
                'username': c.user.username,
                'created_at': c.created_at.isoformat(),
            }
            for c in post.comments
        ],
        'like_count': len(post.likes),
        'comment_count': len(post.comments),
        'user_liked': user_liked,
        'created_at': post.created_at.isoformat(),
        'updated_at': post.updated_at.isoformat(),
    }


@router.post('/posts/{post_id}/likes')
async def like_post(
    post_id: str,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(lambda: 1),
) -> Dict[str, str]:
    """Like a post"""
    post = await db.scalar(select(Post).where(Post.id == post_id))
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Post not found',
        )

    existing_like = await db.scalar(
        select(Like).where(
            and_(Like.post_id == post_id, Like.user_id == user_id)
        )
    )
    if existing_like:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail='You already liked this post',
        )

    like = Like(
        id=str(uuid.uuid4()),
        user_id=user_id,
        post_id=post_id,
    )
    db.add(like)
    await db.commit()

    return {'message': 'Post liked successfully'}


@router.delete('/posts/{post_id}/likes')
async def unlike_post(
    post_id: str,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(lambda: 1),
) -> Dict[str, str]:
    """Unlike a post"""
    like = await db.scalar(
        select(Like).where(
            and_(Like.post_id == post_id, Like.user_id == user_id)
        )
    )
    if not like:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Like not found',
        )

    await db.delete(like)
    await db.commit()

    return {'message': 'Post unliked successfully'}


@router.post('/posts/{post_id}/comments')
async def create_comment(
    post_id: str,
    content: str = Form(...),
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(lambda: 1),
) -> Dict:
    """Add a comment to a post"""
    post = await db.scalar(select(Post).where(Post.id == post_id))
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Post not found',
        )

    if not content.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Comment cannot be empty',
        )

    user = await db.scalar(select(UserAccount).where(UserAccount.id == user_id))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='User not found',
        )

    comment = Comment(
        id=str(uuid.uuid4()),
        user_id=user_id,
        post_id=post_id,
        content=content.strip(),
    )
    db.add(comment)
    await db.commit()
    await db.refresh(comment)

    return {
        'id': comment.id,
        'user_id': comment.user_id,
        'content': comment.content,
        'username': user.username,
        'created_at': comment.created_at.isoformat(),
    }


@router.get('/posts/{post_id}/comments')
async def get_comments(
    post_id: str,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, List]:
    """Get comments for a post"""
    post = await db.scalar(select(Post).where(Post.id == post_id))
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Post not found',
        )

    result = await db.execute(
        select(Comment)
        .where(Comment.post_id == post_id)
        .options(selectinload(Comment.user))
        .order_by(Comment.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    comments = result.scalars().all()

    return {
        'comments': [
            {
                'id': c.id,
                'user_id': c.user_id,
                'content': c.content,
                'username': c.user.username,
                'created_at': c.created_at.isoformat(),
            }
            for c in comments
        ]
    }


@router.delete('/posts/{post_id}/comments/{comment_id}')
async def delete_comment(
    post_id: str,
    comment_id: str,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(lambda: 1),
) -> Dict[str, str]:
    """Delete a comment (user or admin only)"""
    comment = await db.scalar(
        select(Comment).where(
            and_(Comment.id == comment_id, Comment.post_id == post_id)
        )
    )
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Comment not found',
        )

    user = await db.scalar(select(UserAccount).where(UserAccount.id == user_id))
    if comment.user_id != user_id and (not user or user.role != 'admin'):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='You can only delete your own comments',
        )

    await db.delete(comment)
    await db.commit()

    return {'message': 'Comment deleted successfully'}


@router.delete('/posts/{post_id}')
async def delete_post(
    post_id: str,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(lambda: 1),
) -> Dict[str, str]:
    """Delete a post (admin only)"""
    post = await db.scalar(
        select(Post)
        .where(Post.id == post_id)
        .options(selectinload(Post.attachments))
    )
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Post not found',
        )

    user = await db.scalar(select(UserAccount).where(UserAccount.id == user_id))
    if not user or user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='Only admins can delete posts',
        )

    # Delete attachments from storage
    storage = get_supabase_storage()
    for attachment in post.attachments:
        try:
            if storage:
                storage.delete(f"community/{post_id}/{attachment.id}/{attachment.original_filename}")
        except Exception:
            pass

    await db.delete(post)
    await db.commit()

    return {'message': 'Post deleted successfully'}
