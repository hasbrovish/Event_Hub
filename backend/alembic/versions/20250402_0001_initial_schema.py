"""Initial schema from reference_docs/db_design.md (PostgreSQL).

Revision ID: 20250402_0001
Revises:
Create Date: 2026-04-02

"""

from typing import Sequence, Union

from alembic import op

from app.database import Base
import app.models  # noqa: F401 — register tables on Base.metadata

# revision identifiers, used by Alembic.
revision: str = "20250402_0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    Base.metadata.create_all(bind)


def downgrade() -> None:
    bind = op.get_bind()
    Base.metadata.drop_all(bind)
