"""create refresh_tokens table

Revision ID: 9b33b44379eb
Revises: 9a29e372b292
Create Date: 2026-02-26 21:34:49.634940

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9b33b44379eb'
down_revision: Union[str, Sequence[str], None] = '9a29e372b292'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
