from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import schemas, services
from ..database import get_db
from ..dependencies import get_current_user
from ..models import School, SchoolInvitation, User

router = APIRouter(prefix="/teacher", tags=["Teachers"])


@router.get("/invitations", response_model=list[schemas.InvitationOut])
def my_invitations(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    items = (
        db.query(SchoolInvitation)
        .filter(SchoolInvitation.teacher_user_id == user.id)
        .order_by(SchoolInvitation.created_at.desc())
        .all()
    )
    out = []
    for invitation in items:
        school = db.get(School, invitation.school_id)
        out.append(
            schemas.InvitationOut(
                id=invitation.id,
                school_id=invitation.school_id,
                school_name=school.name if school else None,
                teacher_user_id=invitation.teacher_user_id,
                teacher_email=user.email,
                status=invitation.status,
                message=invitation.message,
                created_at=invitation.created_at,
            )
        )
    return out


@router.post("/invitations/{invitation_id}/respond", response_model=schemas.InvitationOut)
def respond(invitation_id: str, accept: bool = True, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    invitation = db.get(SchoolInvitation, invitation_id)
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found")
    invitation = services.respond_invitation(db, invitation, user, accept)
    school = db.get(School, invitation.school_id)
    return schemas.InvitationOut(
        id=invitation.id,
        school_id=invitation.school_id,
        school_name=school.name if school else None,
        teacher_user_id=invitation.teacher_user_id,
        teacher_email=user.email,
        status=invitation.status,
        message=invitation.message,
        created_at=invitation.created_at,
    )
