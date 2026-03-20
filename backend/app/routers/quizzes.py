import random
import random
import string
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..db import get_db
from ..dependencies import get_current_user
from ..models import UserAccount, Quiz, QuizQuestion, QuizSession, QuizAnswer
from ..schemas import QuestionSchema, QuizCreateSchema, QuizDetailSchema, QuizAnswerSubmitSchema, QuizSessionDetailSchema

router = APIRouter(prefix="/api/quizzes", tags=["quizzes"])


def generate_access_code(length: int = 8) -> str:
    """Generate a random alphanumeric access code."""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))


@router.post("/create")
async def create_quiz(
    quiz_data: QuizCreateSchema,
    current_user: UserAccount = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new quiz (admin only)."""
    if current_user.role != 'admin':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can create quizzes")

    access_code = generate_access_code()

    quiz = Quiz(
        creator_id=current_user.id,
        title=quiz_data.title,
        description=quiz_data.description,
        access_code=access_code,
        time_limit_minutes=quiz_data.time_limit_minutes,
        test_type=quiz_data.test_type,
        is_active=True
    )
    db.add(quiz)
    await db.flush()
    
    for idx, question_data in enumerate(quiz_data.questions):
        question = QuizQuestion(
            quiz_id=quiz.id,
            question_text=question_data.question_text,
            choices=question_data.choices,
            correct_answer=question_data.correct_answer,
            order=idx
        )
        db.add(question)
    
    await db.commit()
    await db.refresh(quiz)
    
    return {
        "id": quiz.id,
        "title": quiz.title,
        "access_code": quiz.access_code,
        "time_limit_minutes": quiz.time_limit_minutes,
        "total_questions": len(quiz_data.questions),
        "created_at": quiz.created_at
    }


@router.get("/list")
async def list_my_quizzes(
    test_type: Optional[str] = None,
    current_user: UserAccount = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List all quizzes created by the current user (admin), optionally filtered by test_type."""
    if current_user.role != 'admin':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can view their quizzes")

    query = select(Quiz).where((Quiz.creator_id == current_user.id) & (Quiz.is_archived == False))

    # Filter by test_type if provided
    if test_type:
        query = query.where(Quiz.test_type == test_type)

    query = query.options(selectinload(Quiz.questions), selectinload(Quiz.sessions))

    result = await db.execute(query)
    quizzes = result.scalars().all()

    return {
        "quizzes": [
            {
                "id": quiz.id,
                "title": quiz.title,
                "description": quiz.description,
                "access_code": quiz.access_code,
                "time_limit_minutes": quiz.time_limit_minutes,
                "is_active": quiz.is_active,
                "total_questions": len(quiz.questions),
                "total_participants": len(quiz.sessions),
                "created_at": quiz.created_at,
                "expires_at": quiz.expires_at,
                "test_type": quiz.test_type
            }
            for quiz in quizzes
        ]
    }


@router.get("/join/{access_code}")
async def join_quiz_by_code(
    access_code: str,
    test_type: Optional[str] = None,
    current_user: UserAccount = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get quiz details and questions to join."""
    result = await db.execute(
        select(Quiz).where(Quiz.access_code == access_code)
    )
    quiz = result.scalars().first()

    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")

    if not quiz.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This quiz is not active")

    # Validate test type matches if provided
    if test_type and quiz.test_type != test_type:
        type_names = {
            'diagnostic-test': '🔍 Diagnostic Test',
            'drills': '⚙️ Drills',
            'short-quiz': '⏱️ Short Quiz',
            'preboard': '🏆 Pre-Board'
        }
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid code for {type_names.get(test_type, test_type)}. This code belongs to {type_names.get(quiz.test_type, quiz.test_type)}"
        )
    
    questions_result = await db.execute(
        select(QuizQuestion)
        .where(QuizQuestion.quiz_id == quiz.id)
        .order_by(QuizQuestion.order)
    )
    questions = questions_result.scalars().all()
    
    return {
        "id": quiz.id,
        "title": quiz.title,
        "description": quiz.description,
        "time_limit_minutes": quiz.time_limit_minutes,
        "total_questions": len(questions),
        "questions": [
            {
                "id": q.id,
                "question_text": q.question_text,
                "choices": q.choices,
                "order": q.order
            }
            for q in questions
        ]
    }


@router.post("/start-session/{quiz_id}")
async def start_quiz_session(
    quiz_id: str,
    current_user: UserAccount = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Start a new quiz session for the user."""
    quiz_result = await db.execute(
        select(Quiz).where(Quiz.id == quiz_id)
    )
    quiz = quiz_result.scalars().first()

    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")

    if not quiz.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This quiz is not active")

    # Check if user has already completed this quiz
    existing_session_result = await db.execute(
        select(QuizSession).where(
            (QuizSession.quiz_id == quiz_id) &
            (QuizSession.user_id == current_user.id) &
            (QuizSession.completed_at.isnot(None))
        )
    )
    existing_session = existing_session_result.scalars().first()

    if existing_session:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quiz already taken"
        )

    questions_result = await db.execute(
        select(func.count(QuizQuestion.id)).where(QuizQuestion.quiz_id == quiz_id)
    )
    total_questions = questions_result.scalar() or 0

    session = QuizSession(
        quiz_id=quiz_id,
        user_id=current_user.id,
        total_questions=total_questions
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)

    return {
        "session_id": session.id,
        "quiz_id": quiz.id,
        "started_at": session.started_at,
        "time_limit_minutes": quiz.time_limit_minutes
    }


@router.post("/submit-answer")
async def submit_answer(
    answer_data: QuizAnswerSubmitSchema,
    current_user: UserAccount = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Submit an answer for a quiz question."""
    session_result = await db.execute(
        select(QuizSession).where(QuizSession.id == answer_data.session_id)
    )
    session = session_result.scalars().first()

    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    if session.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")

    if session.completed_at:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Quiz session already completed")

    question_result = await db.execute(
        select(QuizQuestion).where(QuizQuestion.id == answer_data.question_id)
    )
    question = question_result.scalars().first()

    if not question:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")

    try:
        existing_answer_result = await db.execute(
            select(QuizAnswer).where(
                (QuizAnswer.session_id == answer_data.session_id) &
                (QuizAnswer.question_id == answer_data.question_id)
            )
        )
        existing_answer = existing_answer_result.scalars().first()

        if existing_answer:
            existing_answer.selected_answer = answer_data.selected_answer
            existing_answer.is_answered = True
            existing_answer.answered_at = datetime.now(timezone.utc)
        else:
            answer = QuizAnswer(
                session_id=answer_data.session_id,
                question_id=answer_data.question_id,
                selected_answer=answer_data.selected_answer,
                is_answered=True
            )
            db.add(answer)

        await db.commit()
    except Exception as e:
        await db.rollback()
        # If unique constraint is violated, try to update the existing answer
        if "UNIQUE constraint failed" in str(e) or "unique constraint" in str(e).lower():
            existing_answer_result = await db.execute(
                select(QuizAnswer).where(
                    (QuizAnswer.session_id == answer_data.session_id) &
                    (QuizAnswer.question_id == answer_data.question_id)
                )
            )
            existing_answer = existing_answer_result.scalars().first()
            if existing_answer:
                existing_answer.selected_answer = answer_data.selected_answer
                existing_answer.is_answered = True
                existing_answer.answered_at = datetime.now(timezone.utc)
                await db.commit()
        else:
            raise

    return {"status": "success", "message": "Answer submitted"}


@router.post("/submit-quiz/{session_id}")
async def submit_quiz(
    session_id: str,
    current_user: UserAccount = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Submit the entire quiz and calculate score."""
    session_result = await db.execute(
        select(QuizSession).where(QuizSession.id == session_id)
    )
    session = session_result.scalars().first()

    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    if session.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")

    if session.completed_at:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Quiz already submitted")

    questions_result = await db.execute(
        select(QuizQuestion).where(QuizQuestion.quiz_id == session.quiz_id)
    )
    questions = questions_result.scalars().all()

    answers_result = await db.execute(
        select(QuizAnswer).where(QuizAnswer.session_id == session_id)
    )
    answers = answers_result.scalars().all()

    # Find unanswered questions and create "no answer" entries
    answered_question_ids = {answer.question_id for answer in answers}
    for question in questions:
        if question.id not in answered_question_ids:
            # Create a "no answer" entry for unanswered questions
            no_answer = QuizAnswer(
                session_id=session_id,
                question_id=question.id,
                selected_answer="N",  # Placeholder for no answer
                is_answered=False
            )
            db.add(no_answer)

    await db.flush()

    # Recalculate answers after adding no answer entries
    answers_result = await db.execute(
        select(QuizAnswer).where(QuizAnswer.session_id == session_id)
    )
    answers = answers_result.scalars().all()

    score = 0
    for answer in answers:
        # Only count as correct if actually answered and correct
        if answer.is_answered:
            question = next((q for q in questions if q.id == answer.question_id), None)
            if question and answer.selected_answer == question.correct_answer:
                score += 1

    session.completed_at = datetime.now(timezone.utc)
    session.score = score
    await db.commit()
    await db.refresh(session)

    return {
        "session_id": session.id,
        "score": score,
        "total_questions": session.total_questions,
        "percentage": (score / session.total_questions * 100) if session.total_questions > 0 else 0,
        "completed_at": session.completed_at
    }


@router.get("/results/{session_id}")
async def get_session_results(
    session_id: str,
    current_user: UserAccount = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get detailed results of a completed quiz session."""
    session_result = await db.execute(
        select(QuizSession)
        .where(QuizSession.id == session_id)
        .options(
            selectinload(QuizSession.quiz),
            selectinload(QuizSession.answers).selectinload(QuizAnswer.question)
        )
    )
    session = session_result.scalars().first()
    
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    
    if session.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")
    
    answer_details = []
    for answer in sorted(session.answers, key=lambda a: a.answered_at):
        question = answer.question
        if question:
            is_correct = answer.selected_answer == question.correct_answer if answer.is_answered else False
            # Display "no answer" if question was not answered
            user_answer = answer.selected_answer if answer.is_answered else "no answer"
            answer_details.append({
                "question_id": answer.question_id,
                "question_text": question.question_text,
                "choices": question.choices,
                "user_answer": user_answer,
                "correct_answer": question.correct_answer,
                "is_correct": is_correct,
                "is_answered": answer.is_answered,
                "answered_at": answer.answered_at
            })
    
    quiz = session.quiz
    return {
        "session_id": session.id,
        "quiz_id": quiz.id if quiz else None,
        "quiz_title": quiz.title if quiz else "Quiz",
        "test_type": quiz.test_type if quiz else "diagnostic-test",
        "score": session.score,
        "total_questions": session.total_questions,
        "percentage": (session.score / session.total_questions * 100) if session.total_questions > 0 else 0,
        "started_at": session.started_at,
        "completed_at": session.completed_at,
        "answers": answer_details
    }


@router.get("/quiz/{quiz_id}/leaderboard")
async def get_quiz_leaderboard(
    quiz_id: str,
    current_user: UserAccount = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get leaderboard for a quiz (for quiz creator/admin) with categorized performance and answer details."""
    quiz_result = await db.execute(
        select(Quiz).where(Quiz.id == quiz_id)
    )
    quiz = quiz_result.scalars().first()

    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")

    if quiz.creator_id != current_user.id and current_user.role != 'admin':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")

    sessions_result = await db.execute(
        select(QuizSession)
        .where((QuizSession.quiz_id == quiz_id) & (QuizSession.completed_at.isnot(None)))
        .options(
            selectinload(QuizSession.user),
            selectinload(QuizSession.answers).selectinload(QuizAnswer.question)
        )
        .order_by(QuizSession.score.desc(), QuizSession.completed_at.asc())
    )
    sessions = sessions_result.scalars().all()

    leaderboard = []
    for session in sessions:
        user = session.user
        percentage = (session.score / session.total_questions * 100) if session.total_questions > 0 else 0

        # Build answer details - sort by question order
        answer_details = []
        session_answers = list(session.answers) if session.answers else []

        # Sort by answered_at timestamp (or use question order if timestamp is missing)
        session_answers_sorted = sorted(
            session_answers,
            key=lambda a: (a.answered_at or datetime.now(timezone.utc), a.question.order if a.question else 999)
        )

        for answer in session_answers_sorted:
            question = answer.question
            if question:
                is_correct = answer.selected_answer == question.correct_answer if answer.is_answered else False
                # Display "no answer" if question was not answered
                user_answer = answer.selected_answer if answer.is_answered else "no answer"
                answer_details.append({
                    "question_id": answer.question_id,
                    "question_text": question.question_text,
                    "user_answer": user_answer,
                    "correct_answer": question.correct_answer,
                    "is_correct": is_correct,
                    "is_answered": answer.is_answered,
                    "answered_at": str(answer.answered_at) if answer.answered_at else None
                })

        # Categorize performance
        performance_category = "Need Attention"
        if percentage >= 80:
            performance_category = "Best"
        elif percentage >= 60:
            performance_category = "Fair"

        leaderboard.append({
            "user_id": session.user_id,
            "username": user.username if user else "Unknown",
            "full_name": user.full_name if user else "Unknown",
            "score": session.score,
            "total_questions": session.total_questions,
            "percentage": percentage,
            "completed_at": session.completed_at,
            "time_taken_seconds": int((session.completed_at - session.started_at).total_seconds()) if session.completed_at else 0,
            "performance_category": performance_category,
            "answers": answer_details
        })

    return {"leaderboard": leaderboard}


@router.get("/list-archived")
async def list_archived_quizzes(
    current_user: UserAccount = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List archived quizzes for the current user."""
    if current_user.role != 'admin':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can view archived quizzes")

    result = await db.execute(
        select(Quiz)
        .where((Quiz.creator_id == current_user.id) & (Quiz.is_archived == True))
        .order_by(Quiz.updated_at.desc())
        .options(selectinload(Quiz.questions))
    )
    quizzes = result.scalars().all()

    quiz_list = []
    for quiz in quizzes:
        # Count participants
        sessions_result = await db.execute(
            select(func.count()).select_from(QuizSession).where(QuizSession.quiz_id == quiz.id)
        )
        total_participants = sessions_result.scalar() or 0

        quiz_list.append({
            "id": quiz.id,
            "title": quiz.title,
            "description": quiz.description,
            "access_code": quiz.access_code,
            "time_limit_minutes": quiz.time_limit_minutes,
            "total_questions": len(quiz.questions),
            "total_participants": total_participants,
            "is_archived": quiz.is_archived,
            "created_at": quiz.created_at,
            "updated_at": quiz.updated_at,
            "expires_at": quiz.expires_at,
        })

    return {"quizzes": quiz_list}


@router.post("/archive/{quiz_id}")
async def archive_quiz(
    quiz_id: str,
    current_user: UserAccount = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Archive a quiz."""
    quiz_result = await db.execute(
        select(Quiz).where(Quiz.id == quiz_id)
    )
    quiz = quiz_result.scalars().first()

    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")

    if quiz.creator_id != current_user.id and current_user.role != 'admin':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")

    quiz.is_archived = True
    await db.commit()

    return {"status": "success", "message": "Quiz archived"}


@router.post("/restore/{quiz_id}")
async def restore_quiz(
    quiz_id: str,
    current_user: UserAccount = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Restore an archived quiz."""
    quiz_result = await db.execute(
        select(Quiz).where(Quiz.id == quiz_id)
    )
    quiz = quiz_result.scalars().first()

    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")

    if quiz.creator_id != current_user.id and current_user.role != 'admin':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")

    quiz.is_archived = False
    await db.commit()

    return {"status": "success", "message": "Quiz restored"}


@router.delete("/delete/{quiz_id}")
async def delete_quiz(
    quiz_id: str,
    current_user: UserAccount = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Permanently delete a quiz and all related data."""
    quiz_result = await db.execute(
        select(Quiz).where(Quiz.id == quiz_id)
    )
    quiz = quiz_result.scalars().first()

    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")

    if quiz.creator_id != current_user.id and current_user.role != 'admin':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")

    # Delete all related answers, sessions, and questions (cascading delete will handle this)
    await db.delete(quiz)
    await db.commit()

    return {"status": "success", "message": "Quiz deleted successfully"}


@router.get("/user/sessions")
async def get_user_quiz_sessions(
    current_user: UserAccount = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all quiz sessions for the current user."""
    sessions_result = await db.execute(
        select(QuizSession)
        .where(QuizSession.user_id == current_user.id)
        .options(selectinload(QuizSession.quiz))
        .order_by(QuizSession.completed_at.desc(), QuizSession.started_at.desc())
    )
    sessions = sessions_result.scalars().all()

    return {
        "sessions": [
            {
                "session_id": session.id,
                "quiz_id": session.quiz_id,
                "quiz_title": session.quiz.title if session.quiz else "Quiz",
                "test_type": session.quiz.test_type if session.quiz else "diagnostic-test",
                "score": session.score or 0,
                "percentage": (session.score / session.total_questions * 100) if session.total_questions and session.score else 0,
                "total_questions": session.total_questions,
                "started_at": session.started_at,
                "completed_at": session.completed_at,
                "status": "completed" if session.completed_at else "in_progress"
            }
            for session in sessions
        ]
    }
