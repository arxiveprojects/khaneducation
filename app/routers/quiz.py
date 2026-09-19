from datetime import datetime, timezone
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import schemas
from ..clients.slidegen import slidegen_client
from ..database import get_db
from ..dependencies import get_current_user
from ..models import Book, Chapter, Quiz, User

router = APIRouter(tags=["Quizzes"])
PASSING_SCORE = 70


@router.get("/chapters/{chapter_id}/quiz", response_model=schemas.QuizOut)
def start_quiz(chapter_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    chapter = db.get(Chapter, chapter_id)
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
    existing = (
        db.query(Quiz)
        .filter(Quiz.chapter_id == chapter_id, Quiz.student_user_id == user.id)
        .all()
    )
    version = max((item.quiz_version for item in existing), default=0) + 1
    if version > 3:
        raise HTTPException(status_code=400, detail="Quiz attempt limit reached for this chapter")

    questions = _questions_for_chapter(chapter)
    book = db.get(Book, chapter.book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    quiz = Quiz(
        student_user_id=user.id,
        subject_id=book.subject_id,
        chapter_id=chapter.id,
        chapter_title=chapter.title,
        quiz_version=version,
        questions_json=questions,
        responses_json=[],
    )
    db.add(quiz)
    db.commit()
    db.refresh(quiz)
    return schemas.QuizOut(
        id=quiz.id,
        chapter_id=chapter.id,
        chapter_title=chapter.title,
        quiz_questions=[schemas.QuizQuestion(**item) for item in questions],
        created_at=quiz.created_at,
    )


@router.get("/chapters/{chapter_id}/attempts", response_model=list[schemas.QuizAttemptOut])
def attempts(chapter_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    items = (
        db.query(Quiz)
        .filter(Quiz.chapter_id == chapter_id, Quiz.student_user_id == user.id)
        .order_by(Quiz.created_at.desc())
        .all()
    )
    return [_attempt_out(item) for item in items]


@router.post("/quizzes/{quiz_id}/submit", response_model=schemas.QuizSubmissionResponse)
def submit_quiz(
    quiz_id: str,
    responses: list[schemas.QuizResponseIn],
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    quiz = db.get(Quiz, quiz_id)
    if not quiz or quiz.student_user_id != user.id:
        raise HTTPException(status_code=404, detail="Quiz not found")

    stored = []
    correct = 0
    questions = {item["question_id"]: item for item in (quiz.questions_json or [])}
    for response in responses:
        question = questions.get(response.question_id)
        if not question:
            continue
        is_correct = response.student_answer.strip().lower() == str(question.get("correct_answer", "")).strip().lower()
        if is_correct:
            correct += 1
        stored.append(
            {
                "question_id": response.question_id,
                "question_text": question.get("question_text"),
                "question_type": question.get("question_type"),
                "student_answer": response.student_answer,
                "correct_answer": question.get("correct_answer"),
                "is_correct": is_correct,
            }
        )
    quiz.responses_json = stored
    quiz.end_time = datetime.now(timezone.utc)
    quiz.time_taken_minutes = round((quiz.end_time - quiz.start_time).total_seconds() / 60, 2)
    quiz.score = (correct / len(stored) * 100) if stored else 0
    quiz.passed = quiz.score >= PASSING_SCORE
    quiz.ai_feedback = "Review the cited book pages in the chapter before retrying." if not quiz.passed else "Strong work. Revisit the visualizations to lock the concept in."
    db.commit()
    attempt = _attempt_out(quiz)
    return schemas.QuizSubmissionResponse(attempt=attempt, ai_feedback=quiz.ai_feedback)


def _attempt_out(quiz: Quiz) -> schemas.QuizAttemptOut:
    return schemas.QuizAttemptOut(
        id=quiz.id,
        chapter_title=quiz.chapter_title,
        start_time=quiz.start_time,
        end_time=quiz.end_time,
        score=quiz.score,
        passed=quiz.passed,
        ai_feedback=quiz.ai_feedback,
        quiz_version=quiz.quiz_version,
        responses=quiz.responses_json or [],
    )


def _questions_for_chapter(chapter: Chapter) -> list[dict]:
    if chapter.vector_namespace:
        try:
            hits = slidegen_client.search(chapter.vector_namespace, f"quiz {chapter.title}", top_k=3)
            if hits:
                questions = []
                for hit in hits:
                    questions.append(
                        {
                            "question_id": str(uuid.uuid4()),
                            "question_text": f"What does the book say on page {hit.get('page')} about this idea?",
                            "question_type": "short_answer",
                            "options": [],
                            "correct_answer": (hit.get("excerpt") or hit.get("text") or "")[:80],
                        }
                    )
                return questions
        except Exception:
            pass
    pages = f"{chapter.page_start or 1}"
    return [
        {
            "question_id": str(uuid.uuid4()),
            "question_text": f"Which pages in the book cover “{chapter.title}”?",
            "question_type": "short_answer",
            "options": [],
            "correct_answer": pages,
        }
    ]
