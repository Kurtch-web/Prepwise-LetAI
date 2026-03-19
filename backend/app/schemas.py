from datetime import datetime
from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, Field

UserRole = Literal['user', 'admin']


class OnlineUser(BaseModel):
    username: str
    role: UserRole
    lastSeen: datetime


class UserInfo(BaseModel):
    username: str
    role: UserRole
    online: bool
    lastSeen: Optional[datetime] = None


class PresenceOverview(BaseModel):
    admins: List[UserInfo]
    users: List[UserInfo]


class PresenceEvent(BaseModel):
    id: str
    username: str
    role: UserRole
    type: Literal['login', 'logout', 'signup', 'flashcard_upload']
    timestamp: datetime


class NotificationOut(BaseModel):
    id: str
    type: str
    data: Dict[str, object]
    createdAt: datetime
    readAt: Optional[datetime] = None


class NotificationList(BaseModel):
    notifications: List[NotificationOut]


class AssessmentQuestion(BaseModel):
    title: str
    description: Optional[str] = None
    choices: List[str]


class AssessmentTemplateCreate(BaseModel):
    name: str
    description: Optional[str] = None
    questions: List[AssessmentQuestion]


class AssessmentTemplateOut(BaseModel):
    id: str
    creator_id: int
    name: str
    description: Optional[str] = None
    questions: List[AssessmentQuestion]
    is_active: bool
    created_at: datetime
    updated_at: datetime


class AssessmentTemplateList(BaseModel):
    templates: List[AssessmentTemplateOut]


class AssessmentIn(BaseModel):
    template_id: str
    responses: Dict[str, object]


class LearningPreference(BaseModel):
    video: float = 0.0
    flashcards: float = 0.0
    practice_tests: float = 0.0
    study_guides: float = 0.0
    discussions: float = 0.0


class AssessmentRecommendation(BaseModel):
    primary_method: str
    secondary_methods: List[str]
    suggested_duration: str
    weak_areas: List[str]
    strengths: List[str]
    priority_guides: List[str]


class AssessmentOut(BaseModel):
    id: str
    template_id: str
    responses: Dict[str, object]
    learning_preferences: LearningPreference
    recommendations: AssessmentRecommendation
    createdAt: datetime
    updatedAt: datetime


class AssessmentList(BaseModel):
    assessments: List[AssessmentOut]


class QuestionSchema(BaseModel):
    question_text: str
    choices: List[str]
    correct_answer: str


class QuizCreateSchema(BaseModel):
    title: str
    description: Optional[str] = None
    questions: List[QuestionSchema]
    time_limit_minutes: Optional[int] = None
    test_type: str = 'diagnostic-test'  # diagnostic-test, drills, short-quiz, preboard


class QuizDetailSchema(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    access_code: str
    time_limit_minutes: Optional[int] = None
    total_questions: int
    created_at: datetime


class QuizAnswerSubmitSchema(BaseModel):
    session_id: str
    question_id: str
    selected_answer: str


class QuizSessionDetailSchema(BaseModel):
    session_id: str
    quiz_id: str
    started_at: datetime
    time_limit_minutes: Optional[int] = None


class QuestionCreateSchema(BaseModel):
    question_text: str
    choices: List[str]
    correct_answer: str
    category: str
    source: str
    batch_name: Optional[str] = None
