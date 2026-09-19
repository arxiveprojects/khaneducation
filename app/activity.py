from typing import Any, Optional

from sqlalchemy.orm import Session

from .models import ActivityEvent


def log_activity(
    db: Session,
    *,
    actor_id: str,
    verb: str,
    object_type: str,
    school_id: Optional[str] = None,
    actor_role: Optional[str] = None,
    object_id: Optional[str] = None,
    extra: Optional[dict[str, Any]] = None,
) -> ActivityEvent:
    event = ActivityEvent(
        school_id=school_id,
        actor_id=actor_id,
        actor_role=actor_role,
        verb=verb,
        object_type=object_type,
        object_id=object_id,
        extra=extra,
    )
    db.add(event)
    db.flush()
    return event
