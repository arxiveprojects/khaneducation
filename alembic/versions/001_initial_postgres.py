"""initial postgres schema

Revision ID: 001_initial
Revises:
Create Date: 2026-09-19
"""

from typing import Sequence, Union

from alembic import op

from app.database import Base
from app import models  # noqa: F401

revision: str = "001_initial"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    Base.metadata.create_all(bind=op.get_bind())


def downgrade() -> None:
    Base.metadata.drop_all(bind=op.get_bind())
