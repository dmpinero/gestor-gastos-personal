"""crear adjuntos movimiento

Revision ID: 0ade99ff0b4b
Revises: 01c260a16a5f
Create Date: 2026-10-08 19:04:05.231428

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0ade99ff0b4b'
down_revision: Union[str, Sequence[str], None] = '01c260a16a5f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "adjuntos_movimiento",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("movimiento_id", sa.Integer(), nullable=False),
        sa.Column("nombre_original", sa.String(length=255), nullable=False),
        sa.Column("nombre_almacenado", sa.String(length=64), nullable=False),
        sa.Column("tipo_mime", sa.String(length=255), nullable=True),
        sa.Column("tamanio_bytes", sa.Integer(), nullable=False),
        sa.Column("fecha_subida", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["movimiento_id"], ["movimientos.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table("adjuntos_movimiento")
