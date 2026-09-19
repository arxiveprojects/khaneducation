from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import schemas, services
from ..activity import log_activity
from ..database import get_db
from ..dependencies import get_current_user
from ..models import Book, Chapter, ChapterProgress, ChapterStatus, Subject, User

router = APIRouter(tags=["Chapters"])


@router.get("/books/{book_id}/chapters", response_model=list[schemas.ChapterOut])
def list_chapters(book_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    book = db.get(Book, book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    subject = db.get(Subject, book.subject_id)
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    return services.subject_detail_for_user(db, subject, user).chapters


@router.get("/chapters/{chapter_id}", response_model=schemas.ChapterOut)
def get_chapter(chapter_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    chapter = db.get(Chapter, chapter_id)
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
    embed = chapter.embed_url if chapter.status == ChapterStatus.READY else None
    return schemas.ChapterOut(
        id=chapter.id,
        book_id=chapter.book_id,
        title=chapter.title,
        order_index=chapter.order_index,
        page_start=chapter.page_start,
        page_end=chapter.page_end,
        status=chapter.status,
        embed_url=embed,
    )


@router.post("/chapters/{chapter_id}/progress")
def record_progress(
    chapter_id: str,
    payload: schemas.ChapterProgressIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    chapter = db.get(Chapter, chapter_id)
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
    row = (
        db.query(ChapterProgress)
        .filter(ChapterProgress.chapter_id == chapter_id, ChapterProgress.student_user_id == user.id)
        .first()
    )
    if not row:
        row = ChapterProgress(chapter_id=chapter_id, student_user_id=user.id)
        db.add(row)
    row.time_spent_seconds += max(payload.time_spent_seconds, 0)
    if payload.last_concept:
        row.last_concept = payload.last_concept
    if payload.completed:
        row.completed = True
        from ..models import utcnow

        row.completed_at = utcnow()
    book = db.get(Book, chapter.book_id)
    subject = db.get(Subject, book.subject_id) if book else None
    log_activity(
        db,
        actor_id=user.id,
        school_id=subject.school_id if subject else None,
        actor_role="student",
        verb="viewed_chapter",
        object_type="chapter",
        object_id=chapter_id,
        extra={"last_concept": payload.last_concept, "completed": payload.completed},
    )
    db.commit()
    return {"ok": True}
