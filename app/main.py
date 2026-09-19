from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from mangum import Mangum

from .config import settings
from .database import init_db
from .routers import assistant, auth, books, chapters, dashboard, embed, jobs, quiz, schools, subjects, teachers, users

app = FastAPI(title="Khan Education", version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(schools.router)
app.include_router(teachers.router)
app.include_router(subjects.router)
app.include_router(books.router)
app.include_router(chapters.router)
app.include_router(jobs.router)
app.include_router(dashboard.router)
app.include_router(assistant.router)
app.include_router(quiz.router)
app.include_router(embed.router)


@app.on_event("startup")
def on_startup():
    if settings.debug:
        init_db()


@app.get("/")
def root():
    return RedirectResponse("/docs")


@app.get("/health")
def health():
    return {"ok": True}


@app.get("/languages")
def languages():
    return ["Arabic", "English", "Pashto", "Persian", "Urdu"]


handler = Mangum(app)
