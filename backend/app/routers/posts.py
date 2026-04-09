import os
import uuid
from datetime import datetime
from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel
from sqlalchemy import and_, delete, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..db import get_db
from ..models import Comment, Like, Post, PostAttachment, UserAccount
from ..services.storage import get_supabase_storage, build_attachment_path, _sanitize_filename
from ..dependencies import get_current_user

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
    category: str
    attachments: List[AttachmentResponse]
    like_count: int
    comment_count: int
    user_liked: bool
    view_count: int
    is_flagged: bool
    flag_reason: Optional[str]
    has_appeal: bool
    appeal_text: Optional[str]
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
    category: str = Form(default='user'),
    files: List[UploadFile] = File(default=[]),
    db: AsyncSession = Depends(get_db),
    current_user: UserAccount = Depends(get_current_user),
) -> Dict:
    """Create a new post with optional attachments. 
    
    Categories:
    - 'user': Regular user posts
    - 'admin': Admin/news posts (admin only)
    - 'news': News posts (admin only)
    - 'important': Important announcements (admin only)
    """
    if not content.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Content cannot be empty',
        )

    # Only admins can create admin/news/important posts
    if category in ['admin', 'news', 'important'] and current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='Only admins can create admin/news/important posts',
        )

    # Validate category
    if category not in ['user', 'admin', 'news', 'important']:
        category = 'user'

    post = Post(
        id=str(uuid.uuid4()),
        author_id=current_user.id,
        content=content.strip(),
        category=category,
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
        'category': post.category,
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
    current_user: UserAccount = Depends(get_current_user),
) -> Dict[str, List]:
    """List posts filtered by visibility based on instructor assignment.

    Visibility rules:
    - If post author is an instructor, only their assigned students can see it
    - If post author is a regular user, all admins can see it, plus their instructor
    """
    # User is already authenticated via dependency injection

    # Build visibility query
    # Start with all posts with their authors loaded
    base_query = select(Post).options(
        selectinload(Post.author),
        selectinload(Post.attachments),
        selectinload(Post.likes).selectinload(Like.user),
        selectinload(Post.comments).selectinload(Comment.user),
    )

    # Filter posts based on visibility
    # If current user is admin, they can see all posts
    if current_user and current_user.role == 'admin':
        # Admins can see all posts
        pass
    elif current_user:
        # Regular users (students) can see:
        # 1. Posts from their assigned instructor
        # 2. Posts from other students (if they have the same instructor)
        # 3. Non-flagged posts OR their own flagged posts (so they can appeal)
        base_query = base_query.where(
            and_(
                or_(
                    # Posts from their assigned instructor
                    and_(
                        Post.author_id == current_user.instructor_id,
                        Post.author_id.isnot(None)
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
                ),
                or_(
                    Post.is_flagged == False,  # Show non-flagged posts
                    Post.author_id == current_user.id  # Show own flagged posts (for appeal)
                )
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
        user_liked = any(like.user_id == current_user.id for like in post.likes)
        posts_response.append({
            'id': post.id,
            'author_id': post.author_id,
            'author_username': post.author.username,
            'content': post.content,
            'category': post.category,
            'attachments': [
                {
                    'id': a.id,
                    'file_url': a.file_url,
                    'file_type': a.file_type,
                    'original_filename': a.original_filename,
                }
                for a in post.attachments
            ],
            'likes': [
                {
                    'id': like.id,
                    'user': {
                        'id': like.user.id,
                        'username': like.user.username,
                    } if like.user else None,
                    'created_at': like.created_at.isoformat(),
                }
                for like in post.likes[:20]  # Limit to first 20 likes
            ],
            'comments': [
                {
                    'id': comment.id,
                    'content': comment.content,
                    'author': {
                        'id': comment.user.id,
                        'username': comment.user.username,
                    } if comment.user else None,
                    'like_count': len(comment.likes) if hasattr(comment, 'likes') else 0,
                    'created_at': comment.created_at.isoformat(),
                }
                for comment in post.comments[:20]  # Limit to first 20 comments
            ],
            'like_count': len(post.likes),
            'comment_count': len(post.comments),
            'user_liked': user_liked,
            'view_count': post.view_count,
            'is_flagged': post.is_flagged,
            'flag_reason': post.flag_reason,
            'has_appeal': post.has_appeal,
            'appeal_text': post.appeal_text,
            'created_at': post.created_at.isoformat(),
            'updated_at': post.updated_at.isoformat(),
        })

    return {'posts': posts_response}


@router.get('/posts/{post_id}')
async def get_post(
    post_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: UserAccount = Depends(get_current_user),
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
    # Admins can see all posts
    if current_user.role != 'admin':
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

    user_liked = any(like.user_id == current_user.id for like in post.likes)

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
    current_user: UserAccount = Depends(get_current_user),
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
            and_(Like.post_id == post_id, Like.user_id == current_user.id)
        )
    )
    if existing_like:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail='You already liked this post',
        )

    like = Like(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        post_id=post_id,
    )
    db.add(like)
    await db.commit()

    return {'message': 'Post liked successfully'}


@router.delete('/posts/{post_id}/likes')
async def unlike_post(
    post_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: UserAccount = Depends(get_current_user),
) -> Dict[str, str]:
    """Unlike a post"""
    like = await db.scalar(
        select(Like).where(
            and_(Like.post_id == post_id, Like.user_id == current_user.id)
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
    current_user: UserAccount = Depends(get_current_user),
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

    comment = Comment(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
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
        'username': current_user.username,
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
    current_user: UserAccount = Depends(get_current_user),
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

    if comment.user_id != current_user.id and current_user.role != 'admin':
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
    current_user: UserAccount = Depends(get_current_user),
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

    if current_user.role != 'admin':
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


@router.post('/posts/{post_id}/flag')
async def flag_post(
    post_id: str,
    reason: str = Form(...),
    db: AsyncSession = Depends(get_db),
    current_user: UserAccount = Depends(get_current_user),
) -> Dict[str, str]:
    """Flag a post (admin only). Post will be hidden from regular users."""
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='Only admins can flag posts',
        )

    post = await db.scalar(select(Post).where(Post.id == post_id))
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Post not found',
        )

    if not reason.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Flag reason cannot be empty',
        )

    post.is_flagged = True
    post.flag_reason = reason.strip()
    post.flagged_at = datetime.utcnow()
    await db.commit()

    return {'message': 'Post flagged successfully'}


@router.delete('/posts/{post_id}/flag')
async def unflag_post(
    post_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: UserAccount = Depends(get_current_user),
) -> Dict[str, str]:
    """Unflag a post (admin only). Post will be visible to all users again."""
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='Only admins can unflag posts',
        )

    post = await db.scalar(select(Post).where(Post.id == post_id))
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Post not found',
        )

    post.is_flagged = False
    post.flag_reason = None
    post.flagged_at = None
    post.has_appeal = False
    post.appeal_text = None
    post.appeal_submitted_at = None
    await db.commit()

    return {'message': 'Post unflagged successfully'}


@router.post('/posts/{post_id}/appeal')
async def submit_appeal(
    post_id: str,
    appeal_text: str = Form(...),
    db: AsyncSession = Depends(get_db),
    current_user: UserAccount = Depends(get_current_user),
) -> Dict[str, str]:
    """Submit an appeal for a flagged post."""
    post = await db.scalar(select(Post).where(Post.id == post_id))
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Post not found',
        )

    if post.author_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='You can only appeal your own posts',
        )

    if not post.is_flagged:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='This post is not flagged',
        )

    if not appeal_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Appeal text cannot be empty',
        )

    post.has_appeal = True
    post.appeal_text = appeal_text.strip()
    post.appeal_submitted_at = datetime.utcnow()
    await db.commit()

    return {'message': 'Appeal submitted successfully'}


@router.post('/posts/{post_id}/appeal/deny')
async def deny_appeal(
    post_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: UserAccount = Depends(get_current_user),
) -> Dict[str, str]:
    """Deny an appeal and delete the post (admin only)."""
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='Only admins can deny appeals',
        )

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

    if not post.has_appeal:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='This post does not have an appeal',
        )

    # Delete attachments from storage
    storage = get_supabase_storage()
    for attachment in post.attachments:
        try:
            if storage:
                storage.delete(f"community/{post_id}/{attachment.id}/{attachment.original_filename}")
        except Exception:
            pass

    # Delete the post
    await db.delete(post)
    await db.commit()

    return {'message': 'Appeal denied and post deleted successfully'}


@router.get('/posts/admin/moderation')
async def get_posts_for_moderation(
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: UserAccount = Depends(get_current_user),
) -> Dict[str, List]:
    """Get all posts for admin moderation (admin only)."""
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='Only admins can access moderation',
        )

    result = await db.execute(
        select(Post)
        .options(
            selectinload(Post.author),
            selectinload(Post.attachments),
            selectinload(Post.likes),
            selectinload(Post.comments),
        )
        .order_by(Post.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    posts = result.scalars().all()

    posts_response = []
    for post in posts:
        posts_response.append({
            'id': post.id,
            'author_id': post.author_id,
            'author_username': post.author.username,
            'content': post.content,
            'category': post.category,
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
            'user_liked': False,
            'view_count': post.view_count,
            'is_flagged': post.is_flagged,
            'flag_reason': post.flag_reason,
            'has_appeal': post.has_appeal,
            'appeal_text': post.appeal_text,
            'created_at': post.created_at.isoformat(),
            'updated_at': post.updated_at.isoformat(),
        })

    return {'posts': posts_response}
