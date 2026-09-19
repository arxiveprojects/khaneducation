from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, Path, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from .config import settings
from .database import get_db
from .models import MembershipRole, MembershipStatus, SchoolMembership, User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

STAFF_ROLES = {MembershipRole.OWNER, MembershipRole.ADMIN}
TEACHER_PLUS = STAFF_ROLES | {MembershipRole.TEACHER}


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=settings.access_token_expire_minutes))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        user_id = payload.get("user_id")
        if not user_id:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.get(User, user_id)
    if not user or not user.is_active:
        raise credentials_exception
    return user


def _membership(db: Session, school_id: str, user_id: str) -> SchoolMembership:
    membership = (
        db.query(SchoolMembership)
        .filter(
            SchoolMembership.school_id == school_id,
            SchoolMembership.user_id == user_id,
            SchoolMembership.status == MembershipStatus.ACTIVE,
        )
        .first()
    )
    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="School membership required")
    return membership


def require_school_member(
    school_id: str = Path(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SchoolMembership:
    return _membership(db, school_id, user.id)


def require_school_staff(
    school_id: str = Path(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SchoolMembership:
    membership = _membership(db, school_id, user.id)
    if membership.role not in STAFF_ROLES:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="School admin privileges required")
    return membership


def require_teacher_or_staff(
    school_id: str = Path(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SchoolMembership:
    membership = _membership(db, school_id, user.id)
    if membership.role not in TEACHER_PLUS:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Teacher or admin privileges required")
    return membership
