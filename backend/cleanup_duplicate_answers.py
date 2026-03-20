#!/usr/bin/env python3
"""
Script to clean up duplicate quiz answers from the database.
This removes duplicate entries for the same question in the same session,
keeping only the most recent answer (by answered_at timestamp).
"""
import asyncio
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.db import DATABASE_URL
from app.models import QuizAnswer, PracticeQuizAnswer


async def cleanup_duplicate_answers():
    """Remove duplicate answers, keeping only the most recent for each question in each session."""
    engine = create_async_engine(DATABASE_URL)
    AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with AsyncSessionLocal() as db:
        # Clean up QuizAnswer duplicates
        print("Cleaning up duplicate QuizAnswer entries...")
        
        # Find all groups with duplicates
        duplicate_groups = await db.execute(
            select(QuizAnswer.session_id, QuizAnswer.question_id, func.count().label('count'))
            .group_by(QuizAnswer.session_id, QuizAnswer.question_id)
            .having(func.count() > 1)
        )
        
        duplicates = duplicate_groups.fetchall()
        
        if not duplicates:
            print("No duplicate QuizAnswer entries found.")
        else:
            print(f"Found {len(duplicates)} groups with duplicate answers.")
            
            for session_id, question_id, count in duplicates:
                print(f"  Processing session {session_id}, question {question_id} ({count} entries)")
                
                # Get all answers for this session and question, ordered by answered_at DESC
                answers_result = await db.execute(
                    select(QuizAnswer).where(
                        and_(
                            QuizAnswer.session_id == session_id,
                            QuizAnswer.question_id == question_id
                        )
                    ).order_by(QuizAnswer.answered_at.desc())
                )
                
                answers = answers_result.scalars().all()
                
                # Keep the most recent one, delete the rest
                if len(answers) > 1:
                    for answer in answers[1:]:  # Skip the first (most recent)
                        print(f"    Deleting answer {answer.id}")
                        await db.delete(answer)
        
        # Clean up PracticeQuizAnswer duplicates
        print("\nCleaning up duplicate PracticeQuizAnswer entries...")
        
        duplicate_groups = await db.execute(
            select(PracticeQuizAnswer.session_id, PracticeQuizAnswer.question_id, func.count().label('count'))
            .group_by(PracticeQuizAnswer.session_id, PracticeQuizAnswer.question_id)
            .having(func.count() > 1)
        )
        
        duplicates = duplicate_groups.fetchall()
        
        if not duplicates:
            print("No duplicate PracticeQuizAnswer entries found.")
        else:
            print(f"Found {len(duplicates)} groups with duplicate answers.")
            
            for session_id, question_id, count in duplicates:
                print(f"  Processing session {session_id}, question {question_id} ({count} entries)")
                
                # Get all answers for this session and question, ordered by answered_at DESC
                answers_result = await db.execute(
                    select(PracticeQuizAnswer).where(
                        and_(
                            PracticeQuizAnswer.session_id == session_id,
                            PracticeQuizAnswer.question_id == question_id
                        )
                    ).order_by(PracticeQuizAnswer.answered_at.desc())
                )
                
                answers = answers_result.scalars().all()
                
                # Keep the most recent one, delete the rest
                if len(answers) > 1:
                    for answer in answers[1:]:  # Skip the first (most recent)
                        print(f"    Deleting answer {answer.id}")
                        await db.delete(answer)
        
        # Commit all changes
        await db.commit()
        print("\n✓ Cleanup completed successfully!")
    
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(cleanup_duplicate_answers())
