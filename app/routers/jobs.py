from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from .. import schemas, services
from ..database import get_db
from ..dependencies import get_current_user
from ..models import GenerationJob, User

router = APIRouter(tags=["Jobs"])


@router.get("/jobs/{job_id}", response_model=schemas.JobOut)
def get_job(job_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    job = db.get(GenerationJob, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


async def _request_body(request: Request) -> bytes:
    return await request.body()


@router.post("/internal/slidegen/webhook", response_model=schemas.JobOut)
def slidegen_webhook(
    request: Request,
    body: bytes = Depends(_request_body),
    db: Session = Depends(get_db),
):
    services.verify_slidegen_signature(body, request.headers.get("x-slidegen-signature"))
    payload = schemas.SlidegenWebhookIn.model_validate_json(body)
    return services.handle_slidegen_webhook(db, payload)
