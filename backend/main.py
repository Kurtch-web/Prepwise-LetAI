import os

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import FRONTEND_ORIGINS
from app.db import init_models
from app.routers import presence, system, notifications, flashcards, auth, assessments, posts, quizzes, questions, videos, practice_quizzes

app = FastAPI(title='Presence Tracking Service', version='0.2.0')

app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allow_headers=['Content-Type', 'Authorization', 'Accept', '*'],
    max_age=86400,
)


@app.on_event('startup')
async def on_startup() -> None:
    await init_models()


app.include_router(auth.router)
app.include_router(presence.router)
app.include_router(system.router)
app.include_router(notifications.router)
app.include_router(flashcards.router)
app.include_router(assessments.router)
app.include_router(posts.router)
app.include_router(quizzes.router)
app.include_router(questions.router)
app.include_router(videos.router)
app.include_router(practice_quizzes.router)


if __name__ == '__main__':
    import uvicorn

    uvicorn.run(
        'main:app',
        host=os.getenv('HOST', '0.0.0.0'),
        port=int(os.getenv('PORT', '8000')),
        reload=os.getenv('RELOAD', 'false').lower() == 'true',
    )
