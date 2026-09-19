from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import schemas, services
from ..database import get_db
from ..dependencies import get_current_user
from ..models import User

router = APIRouter(tags=["Assistant"])


@router.post("/assistant/query", response_model=schemas.AssistantResponse)
@router.post("/ai/assist", response_model=schemas.AssistantResponse)
def assistant_query(
    payload: schemas.AssistantRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return services.assistant_reply(db, user, payload)
