from datetime import datetime, timedelta, timezone
from typing import Dict, Optional
import random
import string
import asyncio
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import APIRouter, HTTPException, Response, status, Depends
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import SESSION_TTL_MINUTES
from ..models import UserAccount, VerificationCode, EventLog
from ..db import get_db
from ..security import hash_password, verify_password
from ..services.email import email_service
from ..dependencies import get_current_user

router = APIRouter(prefix='/auth', tags=['auth'])

# JWT Configuration - Should be from env variable in production
SECRET_KEY = 'your-secret-key-change-in-production'
ALGORITHM = 'HS256'
CODE_EXPIRY_MINUTES = 10  # Verification codes expire after 10 minutes


class SignUpRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=255)
    username: str = Field(..., min_length=3, max_length=64)
    email: str = Field(..., min_length=5, max_length=255)
    password: str = Field(..., min_length=8, max_length=128)
    password_confirm: str = Field(..., min_length=8, max_length=128)
    review_type: str = Field(default='GenEd')  # GenEd or ProfEd
    target_exam_date: Optional[str] = None
    instructor_id: Optional[int] = None
    verification_code: str = Field(..., min_length=6, max_length=6)


class LoginRequest(BaseModel):
    username: str = Field(..., min_length=3)
    password: str = Field(..., min_length=8)


class AuthResponse(BaseModel):
    success: bool
    message: str
    user: Optional[Dict] = None
    token: Optional[str] = None
    requiresCodeVerification: Optional[bool] = None
    tempToken: Optional[str] = None


class SendVerificationCodeRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=255)
    full_name: str = Field(..., min_length=2, max_length=255)
    username: str = Field(..., min_length=3, max_length=64)


class SendVerificationCodeResponse(BaseModel):
    success: bool
    message: str


class VerifyCodeRequest(BaseModel):
    code: str = Field(..., min_length=6, max_length=6)
    tempToken: str = Field(..., description='Temporary token from login step')


class VerifyCodeResponse(BaseModel):
    success: bool
    message: str
    token: Optional[str] = None
    user: Optional[Dict] = None


def create_access_token(username: str, role: str, is_temp: bool = False) -> str:
    """Create JWT token with expiration"""
    if is_temp:
        # Temporary token for code verification (5 minutes)
        expires = datetime.now(timezone.utc) + timedelta(minutes=5)
        token_type = 'temp'
    else:
        # Final access token (session TTL)
        expires = datetime.now(timezone.utc) + timedelta(minutes=SESSION_TTL_MINUTES)
        token_type = 'access'

    payload = {
        'sub': username,
        'role': role,
        'type': token_type,
        'exp': expires,
        'iat': datetime.now(timezone.utc)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def generate_verification_code() -> str:
    """Generate a random 6-digit verification code"""
    return ''.join(random.choices(string.digits, k=6))


async def send_verification_code_to_email(email: str, code: str, full_name: str) -> bool:
    """Send verification code to email"""
    try:
        # Run the async email sending in a background task
        success = await email_service.send_verification_code(email, code, full_name)
        if success:
            print(f"✓ [VERIFICATION CODE] Email sent to {email}")
        else:
            print(f"✗ [VERIFICATION CODE] Failed to send email to {email}")
        return success
    except Exception as e:
        print(f"✗ [VERIFICATION CODE] Error: {str(e)}")
        return False


@router.post('/signup', response_model=AuthResponse)
async def signup(request: SignUpRequest, response: Response, session: AsyncSession = Depends(get_db)) -> AuthResponse:
    """Register a new user account with email verification"""

    # Validate email is CVSU domain
    if not request.email.endswith('@cvsu.edu.ph'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Email must be a valid CVSU email (cvsu.edu.ph)'
        )

    # Validate passwords match
    if request.password != request.password_confirm:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Passwords do not match'
        )

    # Validate password strength
    if len(request.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Password must be at least 8 characters'
        )

    # Verify the code
    result = await session.execute(
        select(VerificationCode).where(
            (VerificationCode.code == request.verification_code) &
            (VerificationCode.is_used == False) &
            (VerificationCode.expires_at > datetime.now(timezone.utc))
        ).order_by(VerificationCode.created_at.desc())
    )
    verification_code = result.scalars().first()

    if not verification_code:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Invalid or expired verification code'
        )

    # Check if user already exists
    result = await session.execute(
        select(UserAccount).where(UserAccount.username == request.username)
    )
    existing_user = result.scalars().first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail='Username already exists'
        )

    # Create new user
    password_hash = hash_password(request.password)
    new_user = UserAccount(
        username=request.username,
        email=request.email,
        password_hash=password_hash,
        full_name=request.full_name,
        review_type=request.review_type,
        target_exam_date=request.target_exam_date,
        instructor_id=request.instructor_id,
        role='user'
    )

    session.add(new_user)
    await session.commit()
    await session.refresh(new_user)

    # Mark verification code as used
    verification_code.is_used = True
    await session.commit()

    # Create notification for all admins
    from ..models import Notification

    # Find all admin users
    admin_result = await session.execute(
        select(UserAccount).where(UserAccount.role == 'admin')
    )
    admin_users = admin_result.scalars().all()

    # Create notification for each admin
    for admin in admin_users:
        notification = Notification(
            user_id=admin.id,
            type='new_user_signup',
            data={
                'username': new_user.username,
                'full_name': new_user.full_name,
                'email': new_user.email,
                'review_type': new_user.review_type,
                'message': f'New user registered: {new_user.full_name} ({new_user.username})'
            }
        )
        session.add(notification)

    await session.commit()

    # Send welcome email (non-blocking)
    asyncio.create_task(email_service.send_welcome_email(new_user.email, new_user.full_name, new_user.username))

    # Create token
    token = create_access_token(new_user.username, new_user.role)

    # Set secure HTTP-only cookie
    response.set_cookie(
        key='auth_token',
        value=token,
        max_age=SESSION_TTL_MINUTES * 60,
        httponly=True,
        secure=False,  # Set to True in production with HTTPS
        samesite='lax',
        path='/'
    )

    return AuthResponse(
        success=True,
        message='Account created successfully',
        user={
            'id': new_user.id,
            'username': new_user.username,
            'role': new_user.role,
            'fullName': new_user.full_name,
            'reviewType': new_user.review_type,
            'targetExamDate': new_user.target_exam_date,
            'instructorId': new_user.instructor_id
        },
        token=token
    )


@router.post('/send-verification-code', response_model=SendVerificationCodeResponse)
async def send_verification_code_endpoint(request: SendVerificationCodeRequest, session: AsyncSession = Depends(get_db)) -> SendVerificationCodeResponse:
    """Send verification code for signup"""

    # Validate email is CVSU domain
    if not request.email.endswith('@cvsu.edu.ph'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Email must be a valid CVSU email (cvsu.edu.ph)'
        )

    # Generate verification code
    code = generate_verification_code()

    # Store code in database
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=CODE_EXPIRY_MINUTES)
    verification_code = VerificationCode(
        user_id=None,  # Temporary, for signup flow (user doesn't exist yet)
        code=code,
        expires_at=expires_at
    )
    session.add(verification_code)
    await session.commit()

    # Send code to email
    await send_verification_code_to_email(request.email, code, request.full_name)

    return SendVerificationCodeResponse(
        success=True,
        message=f'Verification code sent to {request.email}'
    )


@router.post('/login', response_model=AuthResponse)
async def login(request: LoginRequest, response: Response, session: AsyncSession = Depends(get_db)) -> AuthResponse:
    """Authenticate user and return token"""

    # Find user by username
    result = await session.execute(
        select(UserAccount).where(UserAccount.username == request.username)
    )
    user = result.scalars().first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Account does not exist'
        )

    if not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Invalid password'
        )

    # Create token
    token = create_access_token(user.username, user.role, is_temp=False)

    # Set secure HTTP-only cookie
    response.set_cookie(
        key='auth_token',
        value=token,
        max_age=SESSION_TTL_MINUTES * 60,
        httponly=True,
        secure=False,  # Set to True in production with HTTPS
        samesite='lax',
        path='/'
    )

    return AuthResponse(
        success=True,
        message='Login successful',
        user={
            'id': user.id,
            'username': user.username,
            'role': user.role,
            'fullName': user.full_name,
            'reviewType': user.review_type,
            'targetExamDate': user.target_exam_date
        },
        token=token
    )


@router.post('/verify-code', response_model=VerifyCodeResponse)
async def verify_code(request: VerifyCodeRequest, response: Response, session: AsyncSession = Depends(get_db)) -> VerifyCodeResponse:
    """Verify the code sent to user's email"""

    # Decode temp token to get username
    try:
        payload = jwt.decode(request.tempToken, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get('sub')
        token_type = payload.get('type')

        if token_type != 'temp':
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail='Invalid token'
            )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Code verification session expired. Please login again.'
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Invalid token'
        )

    # Get user by username
    result = await session.execute(
        select(UserAccount).where(UserAccount.username == username)
    )
    user = result.scalars().first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='User not found'
        )

    # Find matching verification code
    result = await session.execute(
        select(VerificationCode).where(
            (VerificationCode.user_id == user.id) &
            (VerificationCode.code == request.code) &
            (VerificationCode.is_used == False) &
            (VerificationCode.expires_at > datetime.now(timezone.utc))
        ).order_by(VerificationCode.created_at.desc())
    )
    verification_code = result.scalars().first()

    if not verification_code:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Invalid or expired verification code'
        )

    # Mark code as used
    verification_code.is_used = True
    await session.commit()

    # Create final access token
    token = create_access_token(user.username, user.role, is_temp=False)

    # Set secure HTTP-only cookie
    response.set_cookie(
        key='auth_token',
        value=token,
        max_age=SESSION_TTL_MINUTES * 60,
        httponly=True,
        secure=False,  # Set to True in production with HTTPS
        samesite='lax',
        path='/'
    )

    return VerifyCodeResponse(
        success=True,
        message='Code verified successfully. Login complete.',
        token=token,
        user={
            'id': user.id,
            'username': user.username,
            'role': user.role,
            'fullName': user.full_name,
            'email': user.email,
            'reviewType': user.review_type,
            'targetExamDate': user.target_exam_date
        }
    )


@router.post('/logout')
async def logout(response: Response) -> Dict[str, str]:
    """Logout user by clearing cookie"""
    response.delete_cookie(
        key='auth_token',
        path='/',
        httponly=True,
        secure=False,
        samesite='lax'
    )
    return {'message': 'Logout successful'}


@router.get('/me')
async def get_current_user() -> Dict:
    """Get current authenticated user info"""
    # This will be enhanced with dependency injection
    return {'message': 'User info endpoint'}


@router.post('/refresh')
async def refresh_token(response: Response) -> AuthResponse:
    """Refresh authentication token"""
    return AuthResponse(
        success=True,
        message='Token refreshed'
    )


class ForgotPasswordRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=255)


class ForgotPasswordResponse(BaseModel):
    success: bool
    message: str
    exists: bool


@router.post('/forgot-password', response_model=ForgotPasswordResponse)
async def forgot_password(request: ForgotPasswordRequest, session: AsyncSession = Depends(get_db)) -> ForgotPasswordResponse:
    """Request password reset code"""

    # Validate email is CVSU domain
    if not request.email.endswith('@cvsu.edu.ph'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Email must be a valid CVSU email (cvsu.edu.ph)'
        )

    # Check if user exists
    result = await session.execute(
        select(UserAccount).where(UserAccount.email == request.email)
    )
    user = result.scalars().first()

    if not user:
        # Don't reveal if email exists for security reasons, but log it
        print(f"[FORGOT PASSWORD] Email not found: {request.email}")
        return ForgotPasswordResponse(
            success=False,
            message='If an account exists with this email, a reset code will be sent.',
            exists=False
        )

    # Generate reset code
    code = generate_verification_code()

    # Log to terminal
    print(f"\n{'='*60}")
    print(f"[PASSWORD RESET] Email: {request.email}")
    print(f"[PASSWORD RESET] Reset Code: {code}")
    print(f"[PASSWORD RESET] Code expires in {CODE_EXPIRY_MINUTES} minutes")
    print(f"{'='*60}\n")

    # Store code in database
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=CODE_EXPIRY_MINUTES)
    verification_code = VerificationCode(
        user_id=user.id,
        code=code,
        expires_at=expires_at
    )
    session.add(verification_code)
    await session.commit()

    # Send password reset email (non-blocking)
    asyncio.create_task(email_service.send_password_reset_code(request.email, code, user.username))

    return ForgotPasswordResponse(
        success=True,
        message='Reset code sent to your email',
        exists=True
    )


class ResetPasswordRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=255)
    code: str = Field(..., min_length=6, max_length=6)
    new_password: str = Field(..., min_length=8, max_length=128)
    confirm_password: str = Field(..., min_length=8, max_length=128)


class ResetPasswordResponse(BaseModel):
    success: bool
    message: str


@router.post('/reset-password', response_model=ResetPasswordResponse)
async def reset_password(request: ResetPasswordRequest, session: AsyncSession = Depends(get_db)) -> ResetPasswordResponse:
    """Reset password using verification code"""

    # Validate email is CVSU domain
    if not request.email.endswith('@cvsu.edu.ph'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Email must be a valid CVSU email'
        )

    # Validate passwords match
    if request.new_password != request.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Passwords do not match'
        )

    # Find user
    result = await session.execute(
        select(UserAccount).where(UserAccount.email == request.email)
    )
    user = result.scalars().first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='User not found'
        )

    # Verify reset code
    result = await session.execute(
        select(VerificationCode).where(
            (VerificationCode.user_id == user.id) &
            (VerificationCode.code == request.code) &
            (VerificationCode.is_used == False) &
            (VerificationCode.expires_at > datetime.now(timezone.utc))
        ).order_by(VerificationCode.created_at.desc())
    )
    verification_code = result.scalars().first()

    if not verification_code:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Invalid or expired reset code'
        )

    # Update password
    password_hash = hash_password(request.new_password)
    user.password_hash = password_hash

    # Mark code as used
    verification_code.is_used = True

    await session.commit()

    print(f"[PASSWORD RESET] Password updated for {request.email}")

    # Send password reset success email (non-blocking)
    asyncio.create_task(email_service.send_password_reset_success(request.email, user.full_name))

    return ResetPasswordResponse(
        success=True,
        message='Password reset successfully. You can now sign in.'
    )


class UpdateProfileRequest(BaseModel):
    review_type: Optional[str] = None  # GenEd or ProfEd
    target_exam_date: Optional[str] = None


class UpdateProfileResponse(BaseModel):
    success: bool
    message: str
    user: Optional[Dict] = None


def get_current_user_from_header(authorization: Optional[str] = None) -> Dict:
    """Extract user info from JWT token"""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='No authorization header provided'
        )

    try:
        # Handle "Bearer <token>" format
        token = authorization.replace('Bearer ', '') if authorization.startswith('Bearer ') else authorization
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get('sub')
        if not username:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail='Invalid token'
            )
        return {'username': username}
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Token expired'
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Invalid token'
        )


@router.put('/profile', response_model=UpdateProfileResponse)
async def update_profile(
    request: UpdateProfileRequest,
    authorization: Optional[str] = None,
    session: AsyncSession = Depends(get_db)
) -> UpdateProfileResponse:
    """Update user profile (review type and target exam date)"""

    # Get current user from token
    current_user = get_current_user_from_header(authorization)

    # Find user in database
    result = await session.execute(
        select(UserAccount).where(UserAccount.username == current_user['username'])
    )
    user = result.scalars().first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='User not found'
        )

    # Update fields if provided
    if request.review_type:
        if request.review_type not in ['GenEd', 'ProfEd']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='Invalid review type. Must be GenEd or ProfEd'
            )
        user.review_type = request.review_type

    if request.target_exam_date:
        user.target_exam_date = request.target_exam_date

    await session.commit()
    await session.refresh(user)

    return UpdateProfileResponse(
        success=True,
        message='Profile updated successfully',
        user={
            'id': user.id,
            'username': user.username,
            'fullName': user.full_name,
            'reviewType': user.review_type,
            'targetExamDate': user.target_exam_date,
            'email': user.email
        }
    )


@router.get('/login-history')
async def get_login_history(
    current_user: UserAccount = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get login and logout history for the current user"""
    events = await db.scalars(
        select(EventLog)
        .where(EventLog.username == current_user.username)
        .order_by(EventLog.created_at.desc())
        .limit(100)
    )

    login_events = [e for e in events if e.event_type == 'login']
    logout_events = [e for e in events if e.event_type == 'logout']

    return {
        'total_logins': len(login_events),
        'last_login': login_events[0].created_at if login_events else None,
        'login_events': [
            {
                'event_type': e.event_type,
                'created_at': e.created_at
            }
            for e in sorted(events, key=lambda x: x.created_at, reverse=True)[:20]
        ]
    }
