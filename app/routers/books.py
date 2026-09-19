from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from .. import schemas, services
from ..database import get_db
from ..dependencies import get_current_user
from ..models import Book, GenerationJob, Subject, User

router = APIRouter(tags=["Books"])


@router.post("/subjects/{subject_id}/books", response_model=schemas.BookOut, status_code=201)
def upload_book(
    subject_id: str,
    title: str = Form(...),
    language: str = Form("English"),
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    subject = db.get(Subject, subject_id)
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    return services.create_book_from_upload(db, subject, user, title, language, file)


@router.get("/subjects/{subject_id}/books", response_model=list[schemas.BookOut])
def list_books(subject_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Book).filter(Book.subject_id == subject_id).order_by(Book.created_at.desc()).all()


@router.get("/books/{book_id}", response_model=schemas.BookOut)
def get_book(book_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    book = db.get(Book, book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    return book


@router.get("/books/{book_id}/jobs", response_model=list[schemas.JobOut])
def book_jobs(book_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    book = db.get(Book, book_id)
    items = (
        db.query(GenerationJob)
        .filter(GenerationJob.book_id == book_id)
        .order_by(GenerationJob.created_at.desc())
        .all()
    )
    return [
        schemas.JobOut.model_validate(job).model_copy(update={"book_title": book.title if book else None})
        for job in items
    ]
