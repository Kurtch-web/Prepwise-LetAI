from datetime import datetime
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..db import get_db
from ..dependencies import get_current_user
from ..models import UserAccount, PracticeQuiz, PracticeQuizQuestion, PracticeQuizSession, PracticeQuizAnswer

router = APIRouter(prefix="/api/practice-quizzes", tags=["practice_quizzes"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_practice_quiz(
    title: str,
    description: Optional[str] = None,
    category: str = "General",
    time_limit_minutes: Optional[int] = None,
    questions: List[dict] = None,
    current_user: UserAccount = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new practice quiz (admin only)."""
    if current_user.role != 'admin':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can create practice quizzes")

    if not title or not title.strip():
        raise HTTPException(status_code=400, detail="Quiz title is required")

    if not questions or len(questions) == 0:
        raise HTTPException(status_code=400, detail="At least one question is required")

    quiz = PracticeQuiz(
        creator_id=current_user.id,
        title=title.strip(),
        description=description.strip() if description else None,
        category=category.strip(),
        time_limit_minutes=time_limit_minutes,
        is_active=True
    )
    db.add(quiz)
    await db.flush()

    for idx, q in enumerate(questions):
        question = PracticeQuizQuestion(
            quiz_id=quiz.id,
            question_text=q.get('question_text', ''),
            choices=q.get('choices', []),
            correct_answer=q.get('correct_answer', 'A'),
            order=idx
        )
        db.add(question)

    await db.commit()
    await db.refresh(quiz)

    return {
        "id": quiz.id,
        "title": quiz.title,
        "category": quiz.category,
        "total_questions": len(questions),
        "created_at": quiz.created_at
    }


@router.get("")
async def list_practice_quizzes(
    category: Optional[str] = None,
    difficulty: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db)
):
    """List all practice quizzes."""
    query = select(PracticeQuiz).where(PracticeQuiz.is_active == True).order_by(PracticeQuiz.created_at.desc())
    
    if category:
        query = query.where(PracticeQuiz.category == category)
    if difficulty:
        query = query.where(PracticeQuiz.difficulty == difficulty)
    
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    quizzes = result.scalars().all()
    
    quizzes_list = []
    for quiz in quizzes:
        question_count = len(quiz.questions)
        session_count = len(quiz.sessions)
        avg_score = None
        
        if session_count > 0:
            completed_sessions = [s for s in quiz.sessions if s.completed_at]
            if completed_sessions:
                avg_score = sum(s.score for s in completed_sessions if s.score) / len(completed_sessions)
        
        quizzes_list.append({
            "id": quiz.id,
            "title": quiz.title,
            "description": quiz.description,
            "category": quiz.category,
            "time_limit_minutes": quiz.time_limit_minutes,
            "total_questions": question_count,
            "total_attempts": session_count,
            "average_score": round(avg_score, 2) if avg_score else None,
            "created_at": quiz.created_at,
            "creator": {"id": quiz.creator.id, "username": quiz.creator.username}
        })
    
    return {"quizzes": quizzes_list}


@router.get("/{quiz_id}")
async def get_practice_quiz(
    quiz_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific practice quiz with questions."""
    quiz = await db.scalar(
        select(PracticeQuiz)
        .where(PracticeQuiz.id == quiz_id)
        .options(selectinload(PracticeQuiz.questions))
    )
    
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    return {
        "id": quiz.id,
        "title": quiz.title,
        "description": quiz.description,
        "category": quiz.category,
        "time_limit_minutes": quiz.time_limit_minutes,
        "total_questions": len(quiz.questions),
        "questions": [
            {
                "id": q.id,
                "question_text": q.question_text,
                "choices": q.choices,
                "order": q.order
            }
            for q in sorted(quiz.questions, key=lambda x: x.order)
        ],
        "created_at": quiz.created_at,
        "creator": {"id": quiz.creator.id, "username": quiz.creator.username}
    }


@router.post("/{quiz_id}/start-session")
async def start_practice_quiz_session(
    quiz_id: str,
    current_user: UserAccount = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Start a new practice quiz session."""
    quiz = await db.scalar(
        select(PracticeQuiz).where(PracticeQuiz.id == quiz_id)
    )
    
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    if not quiz.is_active:
        raise HTTPException(status_code=400, detail="This quiz is not active")
    
    question_count = len(quiz.questions)
    
    session = PracticeQuizSession(
        quiz_id=quiz_id,
        user_id=current_user.id,
        total_questions=question_count
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    
    return {
        "session_id": session.id,
        "quiz_id": quiz.id,
        "started_at": session.started_at,
        "time_limit_minutes": quiz.time_limit_minutes,
        "total_questions": question_count
    }


@router.post("/{session_id}/submit-answer")
async def submit_practice_answer(
    session_id: str,
    question_id: str,
    selected_answer: str,
    current_user: UserAccount = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Submit an answer for a practice quiz question."""
    session = await db.scalar(select(PracticeQuizSession).where(PracticeQuizSession.id == session_id))
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    if session.completed_at:
        raise HTTPException(status_code=400, detail="Quiz session already completed")
    
    question = await db.scalar(select(PracticeQuizQuestion).where(PracticeQuizQuestion.id == question_id))
    
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    # Always delete existing answers and create a new one (prevents duplicates)
    from sqlalchemy import delete

    await db.execute(
        delete(PracticeQuizAnswer).where(
            (PracticeQuizAnswer.session_id == session_id) &
            (PracticeQuizAnswer.question_id == question_id)
        )
    )

    answer = PracticeQuizAnswer(
        session_id=session_id,
        question_id=question_id,
        selected_answer=selected_answer,
        is_answered=True
    )
    db.add(answer)
    await db.commit()
    
    return {"status": "success", "message": "Answer submitted"}


@router.post("/{session_id}/submit")
async def submit_practice_quiz(
    session_id: str,
    current_user: UserAccount = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Submit and finish a practice quiz session."""
    session = await db.scalar(
        select(PracticeQuizSession)
        .where(PracticeQuizSession.id == session_id)
        .options(selectinload(PracticeQuizSession.quiz).selectinload(PracticeQuiz.questions))
        .options(selectinload(PracticeQuizSession.answers))
    )

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    if session.completed_at:
        raise HTTPException(status_code=400, detail="Quiz already submitted")

    # Find unanswered questions and create "no answer" entries
    answered_question_ids = {answer.question_id for answer in session.answers}
    for question in session.quiz.questions:
        if question.id not in answered_question_ids:
            # Create a "no answer" entry for unanswered questions
            no_answer = PracticeQuizAnswer(
                session_id=session_id,
                question_id=question.id,
                selected_answer="N",  # Placeholder for no answer
                is_answered=False
            )
            db.add(no_answer)

    await db.flush()

    # Recalculate answers after adding no answer entries
    session = await db.scalar(
        select(PracticeQuizSession)
        .where(PracticeQuizSession.id == session_id)
        .options(selectinload(PracticeQuizSession.answers))
    )

    # Calculate score
    correct_count = 0
    for answer in session.answers:
        # Only count as correct if actually answered and correct
        if answer.is_answered:
            question = next((q for q in session.quiz.questions if q.id == answer.question_id), None)
            if question and answer.selected_answer.upper() == question.correct_answer.upper():
                correct_count += 1

    score_percentage = int((correct_count / session.total_questions * 100)) if session.total_questions > 0 else 0

    session.score = score_percentage
    session.completed_at = datetime.now(timezone.utc)
    await db.commit()

    return {
        "session_id": session.id,
        "score": score_percentage,
        "correct": correct_count,
        "total": session.total_questions,
        "completed_at": session.completed_at
    }


@router.get("/{session_id}/results")
async def get_practice_quiz_results(
    session_id: str,
    current_user: UserAccount = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get detailed results for a practice quiz session."""
    session = await db.scalar(
        select(PracticeQuizSession)
        .where(PracticeQuizSession.id == session_id)
        .options(selectinload(PracticeQuizSession.quiz).selectinload(PracticeQuiz.questions))
        .options(selectinload(PracticeQuizSession.answers))
    )
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    if not session.completed_at:
        raise HTTPException(status_code=400, detail="Quiz not yet completed")
    
    question_results = []
    for question in sorted(session.quiz.questions, key=lambda x: x.order):
        answer = next((a for a in session.answers if a.question_id == question.id), None)
        is_correct = answer and answer.is_answered and answer.selected_answer.upper() == question.correct_answer.upper()
        # Display "no answer" if question was not answered
        user_answer = answer.selected_answer if answer and answer.is_answered else "no answer" if answer else None

        question_results.append({
            "question_id": question.id,
            "question_text": question.question_text,
            "choices": question.choices,
            "correct_answer": question.correct_answer,
            "your_answer": user_answer,
            "is_answered": answer.is_answered if answer else False,
            "is_correct": is_correct,
            "order": question.order
        })
    
    return {
        "session_id": session.id,
        "quiz": {
            "id": session.quiz.id,
            "title": session.quiz.title,
            "category": session.quiz.category
        },
        "score": session.score,
        "correct": sum(1 for q in question_results if q["is_correct"]),
        "total": session.total_questions,
        "started_at": session.started_at,
        "completed_at": session.completed_at,
        "questions": question_results
    }


@router.get("/{quiz_id}/attempts")
async def get_practice_quiz_attempts(
    quiz_id: str,
    current_user: UserAccount = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all attempts by current user on a practice quiz."""
    sessions = await db.scalars(
        select(PracticeQuizSession)
        .where(
            (PracticeQuizSession.quiz_id == quiz_id) &
            (PracticeQuizSession.user_id == current_user.id)
        )
        .order_by(PracticeQuizSession.started_at.desc())
    )
    
    return {
        "attempts": [
            {
                "session_id": s.id,
                "score": s.score,
                "started_at": s.started_at,
                "completed_at": s.completed_at,
                "status": "completed" if s.completed_at else "in_progress"
            }
            for s in sessions
        ]
    }


@router.get("/user/sessions")
async def get_user_practice_quiz_sessions(
    current_user: UserAccount = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all practice quiz sessions for the current user."""
    sessions = await db.scalars(
        select(PracticeQuizSession)
        .where(PracticeQuizSession.user_id == current_user.id)
        .options(selectinload(PracticeQuizSession.quiz))
        .order_by(PracticeQuizSession.completed_at.desc(), PracticeQuizSession.started_at.desc())
    )

    return {
        "sessions": [
            {
                "session_id": s.id,
                "quiz_id": s.quiz_id,
                "quiz_title": s.quiz.title if s.quiz else "Practice Quiz",
                "category": s.quiz.category if s.quiz else None,
                "score": s.score or 0,
                "correct": sum(
                    1 for a in (s.answers or [])
                    for q in (s.quiz.questions if s.quiz else [])
                    if q.id == a.question_id and a.selected_answer.upper() == q.correct_answer.upper()
                ) if s.answers and s.quiz else 0,
                "total_questions": s.total_questions,
                "started_at": s.started_at,
                "completed_at": s.completed_at,
                "status": "completed" if s.completed_at else "in_progress"
            }
            for s in sessions
        ]
    }
