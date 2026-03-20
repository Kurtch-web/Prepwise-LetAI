from __future__ import annotations

import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


class UserAccount(Base):
    __tablename__ = 'user_accounts'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=True)
    password_hash: Mapped[str] = mapped_column(String(256))
    full_name: Mapped[str] = mapped_column(String(255), nullable=True)
    review_type: Mapped[str] = mapped_column(String(16), default='GenEd', nullable=True)
    target_exam_date: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    role: Mapped[str] = mapped_column(String(16))
    instructor_id: Mapped[Optional[int]] = mapped_column(ForeignKey('user_accounts.id', ondelete='SET NULL'), index=True, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class EventLog(Base):
    __tablename__ = 'event_logs'

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    event_type: Mapped[str] = mapped_column(String(16), index=True)
    username: Mapped[str] = mapped_column(String(64), index=True)
    role: Mapped[str] = mapped_column(String(16))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)


class Notification(Base):
    __tablename__ = 'notifications'

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[int] = mapped_column(ForeignKey('user_accounts.id', ondelete='CASCADE'), index=True)
    type: Mapped[str] = mapped_column(String(64), index=True)
    data: Mapped[dict] = mapped_column(JSON, default=dict, server_default='{}')
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)
    read_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)


class Flashcard(Base):
    __tablename__ = 'flashcards'

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    uploader_id: Mapped[int] = mapped_column(ForeignKey('user_accounts.id', ondelete='CASCADE'), index=True)
    filename: Mapped[str] = mapped_column(String(255))
    category: Mapped[str] = mapped_column(String(128))
    storage_path: Mapped[str] = mapped_column(String(512))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)

    uploader: Mapped[UserAccount] = relationship('UserAccount')


class VerificationCode(Base):
    __tablename__ = 'verification_codes'

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[Optional[int]] = mapped_column(ForeignKey('user_accounts.id', ondelete='CASCADE'), index=True, nullable=True)
    code: Mapped[str] = mapped_column(String(6), index=True)
    is_used: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)

    user: Mapped[Optional[UserAccount]] = relationship('UserAccount')


class AssessmentTemplate(Base):
    __tablename__ = 'assessment_templates'

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    creator_id: Mapped[int] = mapped_column(ForeignKey('user_accounts.id', ondelete='CASCADE'), index=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    questions: Mapped[list] = mapped_column(JSON, default=list, server_default='[]')
    is_active: Mapped[bool] = mapped_column(default=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    creator: Mapped[UserAccount] = relationship('UserAccount')


class Assessment(Base):
    __tablename__ = 'assessments'

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[int] = mapped_column(ForeignKey('user_accounts.id', ondelete='CASCADE'), index=True)
    template_id: Mapped[str] = mapped_column(ForeignKey('assessment_templates.id', ondelete='CASCADE'), index=True)
    responses: Mapped[dict] = mapped_column(JSON, default=dict, server_default='{}')
    learning_preferences: Mapped[dict] = mapped_column(JSON, default=dict, server_default='{}')
    recommendations: Mapped[dict] = mapped_column(JSON, default=dict, server_default='{}')
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user: Mapped[UserAccount] = relationship('UserAccount')
    template: Mapped[AssessmentTemplate] = relationship('AssessmentTemplate')


class Post(Base):
    __tablename__ = 'posts'

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    author_id: Mapped[int] = mapped_column(ForeignKey('user_accounts.id', ondelete='CASCADE'), index=True)
    content: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    author: Mapped[UserAccount] = relationship('UserAccount')
    attachments: Mapped[List['PostAttachment']] = relationship('PostAttachment', back_populates='post', cascade='all, delete-orphan')
    likes: Mapped[List['Like']] = relationship('Like', back_populates='post', cascade='all, delete-orphan')
    comments: Mapped[List['Comment']] = relationship('Comment', back_populates='post', cascade='all, delete-orphan')


class PostAttachment(Base):
    __tablename__ = 'post_attachments'

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    post_id: Mapped[str] = mapped_column(ForeignKey('posts.id', ondelete='CASCADE'), index=True)
    file_url: Mapped[str] = mapped_column(String(512))
    file_type: Mapped[str] = mapped_column(String(50))
    original_filename: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    post: Mapped['Post'] = relationship('Post', back_populates='attachments')


class Like(Base):
    __tablename__ = 'likes'

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[int] = mapped_column(ForeignKey('user_accounts.id', ondelete='CASCADE'), index=True)
    post_id: Mapped[str] = mapped_column(ForeignKey('posts.id', ondelete='CASCADE'), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped[UserAccount] = relationship('UserAccount')
    post: Mapped['Post'] = relationship('Post', back_populates='likes')


class Comment(Base):
    __tablename__ = 'comments'

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[int] = mapped_column(ForeignKey('user_accounts.id', ondelete='CASCADE'), index=True)
    post_id: Mapped[str] = mapped_column(ForeignKey('posts.id', ondelete='CASCADE'), index=True)
    content: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user: Mapped[UserAccount] = relationship('UserAccount')
    post: Mapped['Post'] = relationship('Post', back_populates='comments')


class Quiz(Base):
    __tablename__ = 'quizzes'

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    creator_id: Mapped[int] = mapped_column(ForeignKey('user_accounts.id', ondelete='CASCADE'), index=True)
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    access_code: Mapped[str] = mapped_column(String(8), unique=True, index=True)
    time_limit_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    is_active: Mapped[bool] = mapped_column(default=True, index=True)
    is_archived: Mapped[bool] = mapped_column(default=False, index=True)
    test_type: Mapped[str] = mapped_column(String(50), default='diagnostic-test', index=True)
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    creator: Mapped[UserAccount] = relationship('UserAccount')
    questions: Mapped[List['QuizQuestion']] = relationship('QuizQuestion', back_populates='quiz', cascade='all, delete-orphan')
    sessions: Mapped[List['QuizSession']] = relationship('QuizSession', back_populates='quiz', cascade='all, delete-orphan')


class QuizQuestion(Base):
    __tablename__ = 'quiz_questions'

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    quiz_id: Mapped[str] = mapped_column(ForeignKey('quizzes.id', ondelete='CASCADE'), index=True)
    question_text: Mapped[str] = mapped_column(Text)
    choices: Mapped[list] = mapped_column(JSON)
    correct_answer: Mapped[str] = mapped_column(String(1))
    order: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    quiz: Mapped['Quiz'] = relationship('Quiz', back_populates='questions')
    answers: Mapped[List['QuizAnswer']] = relationship('QuizAnswer', back_populates='question', cascade='all, delete-orphan')


class QuizSession(Base):
    __tablename__ = 'quiz_sessions'

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    quiz_id: Mapped[str] = mapped_column(ForeignKey('quizzes.id', ondelete='CASCADE'), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('user_accounts.id', ondelete='CASCADE'), index=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    total_questions: Mapped[int] = mapped_column(Integer)

    quiz: Mapped['Quiz'] = relationship('Quiz', back_populates='sessions')
    user: Mapped[UserAccount] = relationship('UserAccount')
    answers: Mapped[List['QuizAnswer']] = relationship('QuizAnswer', back_populates='session', cascade='all, delete-orphan')


class QuizAnswer(Base):
    __tablename__ = 'quiz_answers'
    __table_args__ = (UniqueConstraint('session_id', 'question_id', name='uq_quiz_answer_session_question'),)

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id: Mapped[str] = mapped_column(ForeignKey('quiz_sessions.id', ondelete='CASCADE'), index=True)
    question_id: Mapped[str] = mapped_column(ForeignKey('quiz_questions.id', ondelete='CASCADE'), index=True)
    selected_answer: Mapped[str] = mapped_column(String(1))
    is_answered: Mapped[bool] = mapped_column(default=True)
    answered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)

    session: Mapped['QuizSession'] = relationship('QuizSession', back_populates='answers')
    question: Mapped['QuizQuestion'] = relationship('QuizQuestion', back_populates='answers')


class Question(Base):
    __tablename__ = 'questions'

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    creator_id: Mapped[int] = mapped_column(ForeignKey('user_accounts.id', ondelete='CASCADE'), index=True)
    question_text: Mapped[str] = mapped_column(Text)
    choices: Mapped[list] = mapped_column(JSON)
    correct_answer: Mapped[str] = mapped_column(String(1))
    category: Mapped[str] = mapped_column(String(128), index=True)
    batch_name: Mapped[Optional[str]] = mapped_column(String(128), index=True, nullable=True)
    source: Mapped[str] = mapped_column(String(16))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)

    creator: Mapped[UserAccount] = relationship('UserAccount')


class Video(Base):
    __tablename__ = 'videos'

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    uploader_id: Mapped[int] = mapped_column(ForeignKey('user_accounts.id', ondelete='CASCADE'), index=True)
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    storage_path: Mapped[str] = mapped_column(String(512))
    file_url: Mapped[str] = mapped_column(String(512))
    category: Mapped[str] = mapped_column(String(128), index=True)
    duration_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    is_downloadable: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    uploader: Mapped[UserAccount] = relationship('UserAccount')
    watches: Mapped[List['VideoWatch']] = relationship('VideoWatch', back_populates='video', cascade='all, delete-orphan')


class VideoWatch(Base):
    __tablename__ = 'video_watches'

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[int] = mapped_column(ForeignKey('user_accounts.id', ondelete='CASCADE'), index=True)
    video_id: Mapped[str] = mapped_column(ForeignKey('videos.id', ondelete='CASCADE'), index=True)
    watched_seconds: Mapped[int] = mapped_column(Integer, default=0)
    is_completed: Mapped[bool] = mapped_column(default=False)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user: Mapped[UserAccount] = relationship('UserAccount')
    video: Mapped['Video'] = relationship('Video', back_populates='watches')


class PracticeQuiz(Base):
    __tablename__ = 'practice_quizzes'

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    creator_id: Mapped[int] = mapped_column(ForeignKey('user_accounts.id', ondelete='CASCADE'), index=True)
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(128), index=True)
    time_limit_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    difficulty: Mapped[str] = mapped_column(String(16), default='medium')
    is_active: Mapped[bool] = mapped_column(default=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    creator: Mapped[UserAccount] = relationship('UserAccount')
    questions: Mapped[List['PracticeQuizQuestion']] = relationship('PracticeQuizQuestion', back_populates='quiz', cascade='all, delete-orphan')
    sessions: Mapped[List['PracticeQuizSession']] = relationship('PracticeQuizSession', back_populates='quiz', cascade='all, delete-orphan')


class PracticeQuizQuestion(Base):
    __tablename__ = 'practice_quiz_questions'

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    quiz_id: Mapped[str] = mapped_column(ForeignKey('practice_quizzes.id', ondelete='CASCADE'), index=True)
    question_text: Mapped[str] = mapped_column(Text)
    choices: Mapped[list] = mapped_column(JSON)
    correct_answer: Mapped[str] = mapped_column(String(1))
    order: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    quiz: Mapped['PracticeQuiz'] = relationship('PracticeQuiz', back_populates='questions')
    answers: Mapped[List['PracticeQuizAnswer']] = relationship('PracticeQuizAnswer', back_populates='question', cascade='all, delete-orphan')


class PracticeQuizSession(Base):
    __tablename__ = 'practice_quiz_sessions'

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    quiz_id: Mapped[str] = mapped_column(ForeignKey('practice_quizzes.id', ondelete='CASCADE'), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('user_accounts.id', ondelete='CASCADE'), index=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    total_questions: Mapped[int] = mapped_column(Integer)

    quiz: Mapped['PracticeQuiz'] = relationship('PracticeQuiz', back_populates='sessions')
    user: Mapped[UserAccount] = relationship('UserAccount')
    answers: Mapped[List['PracticeQuizAnswer']] = relationship('PracticeQuizAnswer', back_populates='session', cascade='all, delete-orphan')


class PracticeQuizAnswer(Base):
    __tablename__ = 'practice_quiz_answers'
    __table_args__ = (UniqueConstraint('session_id', 'question_id', name='uq_practice_quiz_answer_session_question'),)

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id: Mapped[str] = mapped_column(ForeignKey('practice_quiz_sessions.id', ondelete='CASCADE'), index=True)
    question_id: Mapped[str] = mapped_column(ForeignKey('practice_quiz_questions.id', ondelete='CASCADE'), index=True)
    selected_answer: Mapped[str] = mapped_column(String(1))
    is_answered: Mapped[bool] = mapped_column(default=True)
    answered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)

    session: Mapped['PracticeQuizSession'] = relationship('PracticeQuizSession', back_populates='answers')
    question: Mapped['PracticeQuizQuestion'] = relationship('PracticeQuizQuestion', back_populates='answers')
