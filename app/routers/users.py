from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import schemas, services
from ..database import get_db
from ..dependencies import get_current_user
from ..models import StudentProfile, TeacherProfile, User

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=schemas.MeOut)
def me(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return services.build_me(db, user)


@router.put("/me", response_model=schemas.UserOut)
def update_me(payload: schemas.UserUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return user


@router.put("/me/student", response_model=schemas.StudentProfileOut)
def update_student(payload: schemas.StudentProfileUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = user.student_profile or StudentProfile(user_id=user.id)
    data = payload.model_dump(exclude_unset=True)
    if "language" in data and data["language"] is not None:
        data["language"] = data["language"].value
    for key, value in data.items():
        setattr(profile, key, value)
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


@router.put("/me/teacher", response_model=schemas.TeacherProfileOut)
def update_teacher(payload: schemas.TeacherProfileUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = user.teacher_profile or TeacherProfile(user_id=user.id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(profile, key, value)
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile
