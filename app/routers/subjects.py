from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import schemas, services
from ..database import get_db
from ..dependencies import get_current_user
from ..models import ClassEnrollment, EnrollmentStatus, Subject, User

router = APIRouter(prefix="/subjects", tags=["Subjects"])


@router.get("/", response_model=list[schemas.SubjectOut])
def my_subjects(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    enrollments = (
        db.query(ClassEnrollment)
        .filter(ClassEnrollment.student_user_id == user.id, ClassEnrollment.status == EnrollmentStatus.ACTIVE)
        .all()
    )
    subjects = []
    for enrollment in enrollments:
        subject = db.get(Subject, enrollment.subject_id)
        if subject:
            subjects.append(services.subject_detail_for_user(db, subject, user))
    return subjects


@router.get("/{subject_id}", response_model=schemas.SubjectOut)
@router.get("/{subject_id}/details", response_model=schemas.SubjectDetail)
def subject_detail(subject_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    subject = db.get(Subject, subject_id)
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    return services.subject_detail_for_user(db, subject, user)
