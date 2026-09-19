import secrets
from typing import Any, Optional

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings

_INSECURE_SECRET_KEYS = frozenset(
    {
        "",
        "change-me",
        "changeme",
        "dev-secret-key-change-me",
        "secret",
        "secret_key",
    }
)


def generate_secret_key() -> str:
    return secrets.token_urlsafe(48)


def _as_bool(value: Any, default: bool = True) -> bool:
    if value is None:
        return default
    if isinstance(value, bool):
        return value
    return str(value).strip().lower() in {"1", "true", "yes", "on"}


class Settings(BaseSettings):
    debug: bool = True
    secret_key: str = Field(default_factory=generate_secret_key)
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 30

    database_url: str = "postgresql+psycopg://khan:khan@localhost:5432/khaneducation"

    aws_access_key_id: Optional[str] = None
    aws_secret_access_key: Optional[str] = None
    aws_region: str = "us-east-1"

    s3_books_bucket: Optional[str] = None
    local_upload_dir: str = "uploads"

    slidegen_api_url: Optional[str] = None
    slidegen_api_key: Optional[str] = None
    slidegen_webhook_secret: str = "dev-slidegen-webhook-secret"
    slidegen_callback_base_url: str = "http://127.0.0.1:8000"

    sqs_slidegen_queue_url: Optional[str] = None
    sqs_slidegen_queue_name: str = "khaneducation-slidegen-jobs.fifo"

    gemini_api_key: Optional[str] = None
    public_app_origin: str = "http://localhost:5173"

    class Config:
        env_file = ".env"

    @model_validator(mode="before")
    @classmethod
    def prepare_secret_key(cls, data: Any) -> Any:
        if not isinstance(data, dict):
            return data
        debug = _as_bool(data.get("debug", data.get("DEBUG")), default=True)
        key = data.get("secret_key", data.get("SECRET_KEY"))
        key_str = key.strip() if isinstance(key, str) else ""
        if not debug and (not key_str or key_str.lower() in _INSECURE_SECRET_KEYS):
            raise ValueError(
                "SECRET_KEY must be set to a strong random value when DEBUG is false. "
                "Generate one with: openssl rand -base64 32"
            )
        if not key_str:
            data = dict(data)
            data["secret_key"] = generate_secret_key()
        return data


settings = Settings()
