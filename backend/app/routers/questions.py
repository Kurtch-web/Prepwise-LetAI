from typing import List, Optional
import os
import tempfile

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload, joinedload

from ..db import get_db
from ..dependencies import get_current_user
from ..models import UserAccount, Question
from ..schemas import QuestionCreateSchema
from ..services.mcq_detector import MCQDetector

router = APIRouter(prefix="/api/questions", tags=["questions"])


@router.post("/create")
async def create_question(
    question_data: QuestionCreateSchema,
    current_user: UserAccount = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new question (admin only)."""
    if current_user.role != 'admin':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can create questions")
    
    question = Question(
        creator_id=current_user.id,
        question_text=question_data.question_text,
        choices=question_data.choices,
        correct_answer=question_data.correct_answer,
        category=question_data.category,
        batch_name=question_data.batch_name,
        source=question_data.source
    )
    db.add(question)
    await db.commit()
    await db.refresh(question)
    
    return {
        "id": question.id,
        "question_text": question.question_text,
        "choices": question.choices,
        "correct_answer": question.correct_answer,
        "category": question.category,
        "batch_name": question.batch_name,
        "source": question.source,
        "created_at": question.created_at
    }


@router.get("/list")
async def list_questions(
    category: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """List all questions, optionally filtered by category."""
    query = select(Question).options(joinedload(Question.creator))

    if category:
        query = query.where(Question.category == category)

    query = query.order_by(Question.created_at.desc())
    result = await db.execute(query)
    questions = result.scalars().unique().all()

    return {
        "questions": [
            {
                "id": q.id,
                "question_text": q.question_text,
                "choices": q.choices,
                "correct_answer": q.correct_answer,
                "category": q.category,
                "batch_name": q.batch_name,
                "source": q.source,
                "creator_username": q.creator.username if q.creator else "Unknown",
                "created_at": q.created_at.isoformat() if q.created_at else None
            }
            for q in questions
        ]
    }


@router.get("/categories")
async def get_categories(db: AsyncSession = Depends(get_db)):
    """Get all unique question categories."""
    result = await db.execute(select(Question.category).distinct())
    categories = result.scalars().all()
    
    return {"categories": list(set(categories)) if categories else ["General Education", "Professional Education"]}


@router.delete("/{question_id}")
async def delete_question(
    question_id: str,
    current_user: UserAccount = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a question (admin only)."""
    if current_user.role != 'admin':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can delete questions")

    result = await db.execute(select(Question).where(Question.id == question_id))
    question = result.scalars().first()

    if not question:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")

    if question.creator_id != current_user.id and current_user.role != 'admin':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")

    await db.delete(question)
    await db.commit()

    return {"status": "success", "message": "Question deleted"}


@router.delete("/folder/{batch_name}")
async def delete_folder(
    batch_name: str,
    current_user: UserAccount = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete all questions in a folder/batch (admin only)."""
    if current_user.role != 'admin':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can delete folders")

    result = await db.execute(select(Question).where(Question.batch_name == batch_name))
    questions = result.scalars().all()

    if not questions:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found")

    deleted_count = len(questions)
    for question in questions:
        await db.delete(question)

    await db.commit()

    return {"status": "success", "message": f"Deleted {deleted_count} questions from folder", "deleted_count": deleted_count}


@router.get("/download")
async def download_questions(
    category: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Download questions as JSON (accessible to all users)."""
    query = select(Question).options(selectinload(Question.creator))

    if category:
        query = query.where(Question.category == category)

    query = query.order_by(Question.created_at.desc())
    result = await db.execute(query)
    questions = result.scalars().all()

    return {
        "data": [
            {
                "id": q.id,
                "question": q.question_text,
                "choices": q.choices,
                "correct_answer": q.correct_answer,
                "category": q.category,
                "source": q.source,
                "created_by": q.creator.username,
                "created_at": q.created_at.isoformat() if q.created_at else None
            }
            for q in questions
        ],
        "total": len(questions),
        "category_filter": category or "all"
    }


@router.post("/detect-from-pdf")
async def detect_mcqs_from_pdf(
    file: UploadFile = File(...),
    category: str = "General Education",
    current_user: UserAccount = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload a PDF and automatically detect MCQs.
    Supports multiple question formats: A.B.C.D / a)b)c)d) / 1)2)3)4)

    Returns detected MCQs with metadata for review before saving.
    """
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can import questions"
        )

    # Validate file type
    if not file.filename or not file.filename.lower().endswith('.pdf'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are supported"
        )

    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_path = tmp_file.name

        # Detect MCQs from PDF
        mcqs, errors = MCQDetector.detect_mcqs_from_pdf(tmp_path, category)

        # Clean up temporary file
        os.unlink(tmp_path)

        if errors and not mcqs:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to extract MCQs: {', '.join(errors)}"
            )

        return {
            "status": "success",
            "total_detected": len(mcqs),
            "warnings": errors if errors else [],
            "mcqs": [
                {
                    "question_text": mcq['question_text'],
                    "choices": mcq['choices'],
                    "correct_answer": mcq['correct_answer'],
                    "category": mcq['category'],
                    "needs_review": mcq['needs_review'],
                    "source": "pdf_import"
                }
                for mcq in mcqs
            ],
            "message": f"Detected {len(mcqs)} MCQs. Review the answers before saving."
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing PDF: {str(e)}"
        )


@router.post("/save-detected-mcqs")
async def save_detected_mcqs(
    detected_mcqs: List[dict],
    current_user: UserAccount = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Save previously detected MCQs to database.
    Admin should review detection results before calling this.
    """
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can save questions"
        )

    saved_count = 0
    errors = []

    for mcq_data in detected_mcqs:
        try:
            question = Question(
                creator_id=current_user.id,
                question_text=mcq_data.get('question_text', ''),
                choices=mcq_data.get('choices', []),
                correct_answer=mcq_data.get('correct_answer', 'A'),
                category=mcq_data.get('category', 'General Education'),
                batch_name=mcq_data.get('batch_name'),
                source=mcq_data.get('source', 'pdf_import')
            )
            db.add(question)
            saved_count += 1
        except Exception as e:
            errors.append(f"Error saving MCQ: {str(e)}")

    await db.commit()

    return {
        "status": "success",
        "saved_count": saved_count,
        "errors": errors if errors else [],
        "message": f"Saved {saved_count} MCQs successfully"
    }
