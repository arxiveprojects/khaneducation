from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import schemas, services
from ..database import get_db
from ..dependencies import create_access_token

router = APIRouter(tags=["Authentication"])


@router.post("/auth/register", response_model=schemas.UserOut, status_code=201)
def register(payload: schemas.UserCreate, db: Session = Depends(get_db)):
    return services.register_user(db, payload)


@router.post("/auth/login", response_model=schemas.Token)
@router.post("/login", response_model=schemas.Token)
def login(payload: schemas.UserLogin, db: Session = Depends(get_db)):
    user = services.authenticate_user(db, payload.email, payload.password)
    token = create_access_token(
        {
            "user_id": user.id,
            "email": user.email,
            "username": user.username,
            "account_type": user.account_type.value,
        }
    )
    return {"access_token": token, "token_type": "bearer"}
