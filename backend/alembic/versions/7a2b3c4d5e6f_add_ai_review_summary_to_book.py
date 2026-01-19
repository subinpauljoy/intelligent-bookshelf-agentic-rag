"""Add ai_review_summary to book

Revision ID: 7a2b3c4d5e6f
Revises: 39696b903567
Create Date: 2026-01-19 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '7a2b3c4d5e6f'
down_revision = '39696b903567'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('books', sa.Column('ai_review_summary', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('books', 'ai_review_summary')
