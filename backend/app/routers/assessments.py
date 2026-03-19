from __future__ import annotations

from datetime import datetime
from typing import Dict, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import get_db
from ..models import Assessment, AssessmentTemplate, UserAccount
from ..schemas import (
    AssessmentIn,
    AssessmentList,
    AssessmentOut,
    LearningPreference,
    AssessmentRecommendation,
    AssessmentTemplateCreate,
    AssessmentTemplateOut,
    AssessmentTemplateList,
    AssessmentQuestion,
)
from ..dependencies import get_current_user

router = APIRouter()


def analyze_learning_preferences(responses: Dict[str, object]) -> Dict[str, object]:
    """
    Analyze assessment responses to determine learning preferences.
    Returns a score for each learning method (0.0 to 1.0).
    """
    preferences = {
        'video': 0.0,
        'flashcards': 0.0,
        'practice_tests': 0.0,
        'study_guides': 0.0,
        'discussions': 0.0,
    }

    # Q3: Which learning methods work best for you?
    learning_methods = responses.get('q3', [])
    if isinstance(learning_methods, list):
        method_map = {
            'Video lessons': 'video',
            'Flashcards and mnemonics': 'flashcards',
            'Practice problems and quizzes': 'practice_tests',
            'Reading textbooks and guides': 'study_guides',
            'Study groups and discussions': 'discussions',
        }
        for method in learning_methods:
            if method in method_map:
                preferences[method_map[method]] += 0.4

    # Q2: How much time do you have?
    time_available = responses.get('q2', '')
    time_weight = {
        'Less than 1 month': 0.3,
        '1-3 months': 0.2,
        '3-6 months': 0.1,
        'More than 6 months': 0.05,
    }
    time_score = time_weight.get(str(time_available), 0.0)

    # Q5: What challenges do you face?
    challenges = responses.get('q5', [])
    if isinstance(challenges, list):
        if 'Limited time for studying' in challenges:
            preferences['flashcards'] += 0.3
            preferences['practice_tests'] += 0.2
        if 'Difficulty understanding complex topics' in challenges:
            preferences['video'] += 0.3
            preferences['discussions'] += 0.2
        if 'Poor retention of information' in challenges:
            preferences['flashcards'] += 0.4
        if 'Lack of quality study materials' in challenges:
            preferences['study_guides'] += 0.3

    # Q4: Current study situation
    situation = responses.get('q4', '')
    if situation == 'Currently teaching':
        preferences['practice_tests'] += 0.2
        preferences['study_guides'] += 0.1
    elif situation == 'Recent education graduate':
        preferences['study_guides'] += 0.3

    # Q6: How often do you plan to study?
    study_frequency = responses.get('q6', '')
    if 'Daily' in str(study_frequency):
        preferences['practice_tests'] += 0.1
        preferences['flashcards'] += 0.1

    # Normalize scores to 0-1 range
    max_score = max(preferences.values()) if preferences else 1
    if max_score > 0:
        preferences = {k: min(1.0, v / max_score) for k, v in preferences.items()}

    return preferences


def generate_recommendations(responses: Dict[str, object], preferences: Dict[str, object]) -> Dict[str, object]:
    """Generate personalized recommendations based on assessment responses."""
    # Determine primary learning method
    primary_method = max(preferences, key=preferences.get) if preferences else 'flashcards'
    primary_map = {
        'video': '🎥 Video Lessons',
        'flashcards': '🎴 Flashcards',
        'practice_tests': '📝 Practice Tests',
        'study_guides': '📖 Study Guides',
        'discussions': '💬 Study Groups & Discussions',
    }
    primary_display = primary_map.get(primary_method, 'Study Guides')

    # Determine secondary methods
    sorted_preferences = sorted(
        [(k, v) for k, v in preferences.items() if k != primary_method],
        key=lambda x: x[1],
        reverse=True
    )
    secondary_methods = [primary_map.get(k, k) for k, _ in sorted_preferences[:2]]

    # Analyze weak areas and strengths
    weak_areas = []
    concerned_subject = responses.get('q1', '')
    if concerned_subject and concerned_subject != 'All subjects equally':
        weak_areas.append(str(concerned_subject))

    challenges = responses.get('q5', [])
    if isinstance(challenges, list) and challenges:
        weak_areas.extend([str(c) for c in challenges[:3]])

    strengths = ['General understanding of test format']
    if 'Practice problems and quizzes' in str(challenges):
        strengths.insert(0, 'Strong with hands-on practice')

    # Determine study duration
    time_map = {
        'Less than 1 month': 'Intensive (3-4 hours daily)',
        '1-3 months': 'Moderate (2-3 hours daily)',
        '3-6 months': 'Balanced (1-2 hours daily)',
        'More than 6 months': 'Flexible (as needed)',
    }
    suggested_duration = time_map.get(str(responses.get('q2', '')), 'Flexible')

    # Priority guides
    priority_guides = []
    concerned = responses.get('q1', '')
    if 'Professional Education' in str(concerned):
        priority_guides = ['Pedagogy and Teaching Methods', 'Educational Psychology']
    elif 'General Education' in str(concerned):
        priority_guides = ['English Language and Communication', 'Mathematics Fundamentals']
    else:
        priority_guides = ['Multiple Choice Strategy', 'Time Management Techniques']

    return {
        'primary_method': primary_display,
        'secondary_methods': secondary_methods,
        'suggested_duration': suggested_duration,
        'weak_areas': weak_areas[:3],
        'strengths': strengths,
        'priority_guides': priority_guides,
    }


# User assessment endpoints
@router.post('/assessments', response_model=AssessmentOut, status_code=status.HTTP_201_CREATED)
async def submit_assessment(
    assessment_in: AssessmentIn,
    current_user: UserAccount = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AssessmentOut:
    """Submit assessment responses"""
    # Verify template exists
    template = await db.scalar(
        select(AssessmentTemplate).where(AssessmentTemplate.id == assessment_in.template_id)
    )
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Assessment template not found')

    # Analyze responses
    learning_preferences = analyze_learning_preferences(assessment_in.responses)
    recommendations = generate_recommendations(assessment_in.responses, learning_preferences)

    # Create assessment record
    assessment = Assessment(
        user_id=current_user.id,
        template_id=assessment_in.template_id,
        responses=assessment_in.responses,
        learning_preferences=learning_preferences,
        recommendations=recommendations,
    )

    db.add(assessment)
    await db.commit()
    await db.refresh(assessment)

    return AssessmentOut(
        id=assessment.id,
        template_id=assessment.template_id,
        responses=assessment.responses,
        learning_preferences=LearningPreference(**learning_preferences),
        recommendations=AssessmentRecommendation(**recommendations),
        createdAt=assessment.created_at,
        updatedAt=assessment.updated_at,
    )


@router.get('/assessments/templates', response_model=AssessmentTemplateList)
async def get_assessment_templates(db: AsyncSession = Depends(get_db)) -> AssessmentTemplateList:
    """Get all active assessment templates (public endpoint for students)"""
    result = await db.execute(
        select(AssessmentTemplate)
        .where(AssessmentTemplate.is_active == True)
        .order_by(AssessmentTemplate.created_at.desc())
    )
    templates = result.scalars().all()

    items = [
        AssessmentTemplateOut(
            id=t.id,
            creator_id=t.creator_id,
            name=t.name,
            description=t.description,
            questions=[AssessmentQuestion(**q) for q in t.questions],
            is_active=t.is_active,
            created_at=t.created_at,
            updated_at=t.updated_at,
        )
        for t in templates
    ]

    return AssessmentTemplateList(templates=items)


# Admin assessment endpoints
@router.post('/admin/assessment-templates', response_model=AssessmentTemplateOut, status_code=status.HTTP_201_CREATED)
async def create_assessment_template(
    template_in: AssessmentTemplateCreate,
    current_user: UserAccount = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AssessmentTemplateOut:
    """Create a new assessment template (admin only)"""
    # Verify creator is admin
    if current_user.role != 'admin':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Only admins can create assessment templates')

    # Create template
    template = AssessmentTemplate(
        creator_id=current_user.id,
        name=template_in.name,
        description=template_in.description,
        questions=[q.model_dump() for q in template_in.questions],
    )

    db.add(template)
    await db.commit()
    await db.refresh(template)

    return AssessmentTemplateOut(
        id=template.id,
        creator_id=template.creator_id,
        name=template.name,
        description=template.description,
        questions=[AssessmentQuestion(**q) for q in template.questions],
        is_active=template.is_active,
        created_at=template.created_at,
        updated_at=template.updated_at,
    )


@router.get('/admin/assessment-templates', response_model=AssessmentTemplateList)
async def list_assessment_templates(db: AsyncSession = Depends(get_db)) -> AssessmentTemplateList:
    """Get all assessment templates"""
    result = await db.execute(
        select(AssessmentTemplate)
        .where(AssessmentTemplate.is_active == True)
        .order_by(AssessmentTemplate.created_at.desc())
    )
    templates = result.scalars().all()

    items = [
        AssessmentTemplateOut(
            id=t.id,
            creator_id=t.creator_id,
            name=t.name,
            description=t.description,
            questions=[AssessmentQuestion(**q) for q in t.questions],
            is_active=t.is_active,
            created_at=t.created_at,
            updated_at=t.updated_at,
        )
        for t in templates
    ]

    return AssessmentTemplateList(templates=items)


@router.delete('/admin/assessment-templates/{template_id}', status_code=status.HTTP_200_OK)
async def delete_assessment_template(
    template_id: str,
    current_user: UserAccount = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Delete an assessment template (admin only)"""
    # Verify creator is admin
    if current_user.role != 'admin':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Only admins can delete assessment templates')

    # Get the template
    template = await db.scalar(select(AssessmentTemplate).where(AssessmentTemplate.id == template_id))
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Assessment template not found')

    # Delete the template
    await db.delete(template)
    await db.commit()

    return {'message': 'Assessment template deleted successfully'}


@router.get('/admin/assessment-insights')
async def get_assessment_insights(
    current_user: UserAccount = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    template_id: str | None = None,
):
    """Get insights on assessment responses (admin only)

    If template_id is provided, returns insights for that specific template.
    If not provided, returns a summary of all templates.
    """
    # Verify user is admin
    if current_user.role != 'admin':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Only admins can view assessment insights')

    # Build query
    query = select(Assessment).order_by(Assessment.created_at.desc())
    if template_id:
        query = query.where(Assessment.template_id == template_id)

    result = await db.execute(query)
    assessments = result.scalars().all()

    if not assessments:
        return {'questions': [], 'totalResponses': 0}

    # Aggregate responses
    question_stats = {}

    for assessment in assessments:
        responses = assessment.responses or {}

        # Process each question's response
        for key, value in responses.items():
            if key not in question_stats:
                question_stats[key] = {
                    'responses': {}
                }

            # Handle different response types
            if isinstance(value, list):
                # Multi-select responses
                for item in value:
                    item_str = str(item)
                    if item_str not in question_stats[key]['responses']:
                        question_stats[key]['responses'][item_str] = 0
                    question_stats[key]['responses'][item_str] += 1
            else:
                # Single select responses
                value_str = str(value)
                if value_str not in question_stats[key]['responses']:
                    question_stats[key]['responses'][value_str] = 0
                question_stats[key]['responses'][value_str] += 1

    # Calculate majority for each question
    questions_data = []
    for question_key in sorted(question_stats.keys()):
        stats = question_stats[question_key]
        responses = stats['responses']

        if responses:
            majority_answer = max(responses.items(), key=lambda x: x[1])[0]
            questions_data.append({
                'id': question_key,
                'responses': responses,
                'majority': majority_answer,
                'totalResponses': sum(responses.values())
            })

    return {
        'questions': questions_data,
        'totalResponses': len(assessments)
    }


@router.get('/admin/assessment-templates-summary')
async def get_assessment_templates_summary(
    current_user: UserAccount = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get summary of all assessment templates with response counts (admin only)"""
    # Verify user is admin
    if current_user.role != 'admin':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Only admins can view assessment insights')

    # Get all active templates
    result = await db.execute(
        select(AssessmentTemplate)
        .where(AssessmentTemplate.is_active == True)
        .order_by(AssessmentTemplate.created_at.desc())
    )
    templates = result.scalars().all()

    # Get response counts per template
    templates_summary = []
    for template in templates:
        # Count responses for this template
        count_result = await db.execute(
            select(Assessment).where(Assessment.template_id == template.id)
        )
        assessments = count_result.scalars().all()

        templates_summary.append({
            'id': template.id,
            'name': template.name,
            'description': template.description,
            'questions': [AssessmentQuestion(**q) for q in template.questions],
            'totalResponses': len(assessments),
            'created_at': template.created_at,
            'updated_at': template.updated_at,
        })

    return {'templates': templates_summary}
