from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import schemas, services
from ..database import get_db
from ..dependencies import get_current_user, require_school_staff
from ..models import School, SchoolMembership, User

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/student", response_model=schemas.StudentDashboard)
def student_dashboard(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return services.student_dashboard(db, user)


@router.get("/school/{school_id}", response_model=schemas.SchoolDashboard)
def school_dashboard(
    school_id: str,
    membership: SchoolMembership = Depends(require_school_staff),
    db: Session = Depends(get_db),
):
    school = db.get(School, school_id)
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    return services.school_dashboard(db, school)
