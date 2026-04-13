from __future__ import annotations

import random
import string
from datetime import datetime, timezone
from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..db import get_db
from ..dependencies import get_current_user
from ..models import PvpLobby, PvpParticipant, Quiz, QuizSession, UserAccount

router = APIRouter(prefix="/api/pvp", tags=["pvp"])


def _generate_lobby_code(length: int = 6) -> str:
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))


class CreateLobbyRequest(BaseModel):
    quiz_id: str
    max_players: int = Field(default=4, ge=2, le=4)


class JoinLobbyRequest(BaseModel):
    code: str


class ProgressUpdateRequest(BaseModel):
    current_question_index: int = Field(ge=0)


class FinishRequest(BaseModel):
    answers: Dict[str, str]


class ParticipantResponse(BaseModel):
    id: str
    user_id: int
    username: str
    full_name: Optional[str]
    joined_at: datetime
    current_question_index: int
    is_finished: bool
    finished_at: Optional[datetime]
    score: Optional[int]
    correct_count: Optional[int]
    total_questions: Optional[int]


class LobbyResponse(BaseModel):
    id: str
    code: str
    host_user_id: int
    quiz_id: str
    status: str
    max_players: int
    created_at: datetime
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    participants: List[ParticipantResponse]


class LobbyQuizQuestionResponse(BaseModel):
    id: str
    question_text: str
    choices: list
    order: int


class LobbyQuizResponse(BaseModel):
    id: str
    title: str
    time_limit_minutes: Optional[int]
    total_questions: int
    questions: List[LobbyQuizQuestionResponse]


async def _require_completed_quiz(db: AsyncSession, user_id: int, quiz_id: str) -> None:
    completed = await db.scalar(
        select(func.count(QuizSession.id)).where(
            (QuizSession.quiz_id == quiz_id)
            & (QuizSession.user_id == user_id)
            & (QuizSession.completed_at.isnot(None))
        )
    )
    if not completed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must complete this test before joining PvP",
        )


async def _serialize_lobby(db: AsyncSession, lobby: PvpLobby) -> LobbyResponse:
    participants_result = await db.execute(
        select(PvpParticipant).where(PvpParticipant.lobby_id == lobby.id).order_by(PvpParticipant.joined_at.asc())
    )
    participants = participants_result.scalars().all()

    return LobbyResponse(
        id=lobby.id,
        code=lobby.code,
        host_user_id=lobby.host_user_id,
        quiz_id=lobby.quiz_id,
        status=lobby.status,
        max_players=lobby.max_players,
        created_at=lobby.created_at,
        started_at=lobby.started_at,
        completed_at=lobby.completed_at,
        participants=[
            ParticipantResponse(
                id=p.id,
                user_id=p.user_id,
                username=p.username,
                full_name=p.full_name,
                joined_at=p.joined_at,
                current_question_index=p.current_question_index,
                is_finished=p.is_finished,
                finished_at=p.finished_at,
                score=p.score,
                correct_count=p.correct_count,
                total_questions=p.total_questions,
            )
            for p in participants
        ],
    )


@router.post("/lobbies", response_model=LobbyResponse)
async def create_lobby(
    payload: CreateLobbyRequest,
    current_user: UserAccount = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    quiz = await db.scalar(select(Quiz).where(Quiz.id == payload.quiz_id))
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")

    await _require_completed_quiz(db, current_user.id, payload.quiz_id)

    lobby: Optional[PvpLobby] = None
    last_error: Optional[Exception] = None

    for _ in range(10):
        code = _generate_lobby_code()
        lobby = PvpLobby(
            code=code,
            host_user_id=current_user.id,
            quiz_id=payload.quiz_id,
            max_players=payload.max_players,
            status='lobby',
        )
        db.add(lobby)
        try:
            await db.flush()
            break
        except IntegrityError as e:
            last_error = e
            await db.rollback()
            lobby = None

    if not lobby:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not create lobby: {last_error}",
        )

    participant = PvpParticipant(
        lobby_id=lobby.id,
        user_id=current_user.id,
        username=current_user.username,
        full_name=current_user.full_name,
        current_question_index=0,
        is_finished=False,
    )
    db.add(participant)
    await db.commit()

    return await _serialize_lobby(db, lobby)


@router.get("/lobbies/{lobby_id}/quiz", response_model=LobbyQuizResponse)
async def get_lobby_quiz(
    lobby_id: str,
    current_user: UserAccount = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    lobby = await db.scalar(select(PvpLobby).where(PvpLobby.id == lobby_id))
    if not lobby:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lobby not found")

    is_member = await db.scalar(
        select(func.count(PvpParticipant.id)).where(
            (PvpParticipant.lobby_id == lobby.id) & (PvpParticipant.user_id == current_user.id)
        )
    )
    if not is_member:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a lobby participant")

    quiz = await db.scalar(
        select(Quiz)
        .where(Quiz.id == lobby.quiz_id)
        .options(selectinload(Quiz.questions))
    )
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")

    questions_sorted = sorted(list(quiz.questions or []), key=lambda q: q.order)

    return LobbyQuizResponse(
        id=quiz.id,
        title=quiz.title,
        time_limit_minutes=quiz.time_limit_minutes,
        total_questions=len(questions_sorted),
        questions=[
            LobbyQuizQuestionResponse(
                id=q.id,
                question_text=q.question_text,
                choices=q.choices,
                order=q.order,
            )
            for q in questions_sorted
        ],
    )


@router.post("/lobbies/join", response_model=LobbyResponse)
async def join_lobby(
    payload: JoinLobbyRequest,
    current_user: UserAccount = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    code = payload.code.strip().upper()
    lobby = await db.scalar(select(PvpLobby).where(PvpLobby.code == code))

    if not lobby:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lobby not found")

    if lobby.status != 'lobby':
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Lobby already started")

    await _require_completed_quiz(db, current_user.id, lobby.quiz_id)

    count = await db.scalar(select(func.count(PvpParticipant.id)).where(PvpParticipant.lobby_id == lobby.id))
    if count >= lobby.max_players:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Lobby is full")

    existing = await db.scalar(
        select(PvpParticipant).where(
            (PvpParticipant.lobby_id == lobby.id) & (PvpParticipant.user_id == current_user.id)
        )
    )
    if not existing:
        db.add(
            PvpParticipant(
                lobby_id=lobby.id,
                user_id=current_user.id,
                username=current_user.username,
                full_name=current_user.full_name,
                current_question_index=0,
                is_finished=False,
            )
        )
        await db.commit()

    return await _serialize_lobby(db, lobby)


@router.get("/lobbies/{lobby_id}", response_model=LobbyResponse)
async def get_lobby(
    lobby_id: str,
    current_user: UserAccount = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    lobby = await db.scalar(select(PvpLobby).where(PvpLobby.id == lobby_id))
    if not lobby:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lobby not found")

    is_member = await db.scalar(
        select(func.count(PvpParticipant.id)).where(
            (PvpParticipant.lobby_id == lobby.id) & (PvpParticipant.user_id == current_user.id)
        )
    )
    if not is_member:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a lobby participant")

    return await _serialize_lobby(db, lobby)


@router.post("/lobbies/{lobby_id}/leave")
async def leave_lobby(
    lobby_id: str,
    current_user: UserAccount = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    lobby = await db.scalar(select(PvpLobby).where(PvpLobby.id == lobby_id))
    if not lobby:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lobby not found")

    participant = await db.scalar(
        select(PvpParticipant).where(
            (PvpParticipant.lobby_id == lobby.id) & (PvpParticipant.user_id == current_user.id)
        )
    )
    if not participant:
        return {"message": "Not in lobby"}

    await db.delete(participant)

    if lobby.host_user_id == current_user.id:
        lobby.status = 'closed'
        lobby.completed_at = datetime.now(timezone.utc)

    await db.commit()

    return {"message": "Left lobby"}


@router.post("/lobbies/{lobby_id}/start", response_model=LobbyResponse)
async def start_lobby(
    lobby_id: str,
    current_user: UserAccount = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    lobby = await db.scalar(select(PvpLobby).where(PvpLobby.id == lobby_id))
    if not lobby:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lobby not found")

    if lobby.host_user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only host can start")

    if lobby.status != 'lobby':
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Lobby already started")

    count = await db.scalar(select(func.count(PvpParticipant.id)).where(PvpParticipant.lobby_id == lobby.id))
    if count < 2:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Need at least 2 players")

    lobby.status = 'in_progress'
    lobby.started_at = datetime.now(timezone.utc)
    await db.commit()

    return await _serialize_lobby(db, lobby)


@router.post("/lobbies/{lobby_id}/progress")
async def update_progress(
    lobby_id: str,
    payload: ProgressUpdateRequest,
    current_user: UserAccount = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    lobby = await db.scalar(select(PvpLobby).where(PvpLobby.id == lobby_id))
    if not lobby:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lobby not found")

    if lobby.status != 'in_progress':
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Lobby not in progress")

    participant = await db.scalar(
        select(PvpParticipant).where(
            (PvpParticipant.lobby_id == lobby.id) & (PvpParticipant.user_id == current_user.id)
        )
    )
    if not participant:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a lobby participant")

    if participant.is_finished:
        return {"message": "Already finished"}

    participant.current_question_index = payload.current_question_index
    await db.commit()

    return {"message": "Progress updated"}


@router.post("/lobbies/{lobby_id}/finish")
async def finish_match(
    lobby_id: str,
    payload: FinishRequest,
    current_user: UserAccount = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    lobby = await db.scalar(select(PvpLobby).where(PvpLobby.id == lobby_id))
    if not lobby:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lobby not found")

    if lobby.status != 'in_progress':
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Lobby not in progress")

    participant = await db.scalar(
        select(PvpParticipant).where(
            (PvpParticipant.lobby_id == lobby.id) & (PvpParticipant.user_id == current_user.id)
        )
    )
    if not participant:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a lobby participant")

    if participant.is_finished:
        return {"message": "Already finished"}

    quiz = await db.scalar(
        select(Quiz)
        .where(Quiz.id == lobby.quiz_id)
        .options(selectinload(Quiz.questions))
    )
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")

    questions_sorted = sorted(list(quiz.questions or []), key=lambda q: q.order)
    correct_by_id = {q.id: q.correct_answer for q in questions_sorted}

    correct_count = 0
    for q in questions_sorted:
        selected = payload.answers.get(q.id)
        if selected and selected == correct_by_id.get(q.id):
            correct_count += 1

    total_questions = len(questions_sorted)

    participant.is_finished = True
    participant.finished_at = datetime.now(timezone.utc)
    participant.score = correct_count
    participant.correct_count = correct_count
    participant.total_questions = total_questions
    participant.current_question_index = max(participant.current_question_index, total_questions)

    await db.flush()

    remaining = await db.scalar(
        select(func.count(PvpParticipant.id)).where(
            (PvpParticipant.lobby_id == lobby.id) & (PvpParticipant.is_finished == False)
        )
    )

    if remaining == 0:
        lobby.status = 'completed'
        lobby.completed_at = datetime.now(timezone.utc)

    await db.commit()

    return {"message": "Finished"}
