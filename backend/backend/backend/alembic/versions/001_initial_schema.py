"""Initial schema

Revision ID: 001
Revises: 
Create Date: 2026-01-21
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create initial tables."""
    # Clusters table
    op.create_table(
        'clusters',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('region', sa.String(100), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    op.create_index('ix_clusters_name', 'clusters', ['name'])

    # DIET users table
    op.create_table(
        'diet_users',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('email', sa.String(200), nullable=False),
        sa.Column('role', sa.String(50), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email')
    )

    # Teacher queries table
    op.create_table(
        'teacher_queries',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('phone_hash', sa.String(64), nullable=True),
        sa.Column('cluster_id', sa.String(), nullable=False),
        sa.Column('topic_tag', sa.String(100), nullable=False),
        sa.Column('narrative_text', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('resolved', sa.Boolean(), nullable=True),
        sa.Column('flagged_for_crp', sa.Boolean(), nullable=True),
        sa.Column('consent_given', sa.Boolean(), nullable=True),
        sa.ForeignKeyConstraint(['cluster_id'], ['clusters.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_teacher_queries_phone_hash', 'teacher_queries', ['phone_hash'])
    op.create_index('ix_teacher_queries_cluster_id', 'teacher_queries', ['cluster_id'])
    op.create_index('ix_teacher_queries_topic_tag', 'teacher_queries', ['topic_tag'])
    op.create_index('ix_teacher_queries_created_at', 'teacher_queries', ['created_at'])

    # Micro modules table
    op.create_table(
        'micro_modules',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('cluster_id', sa.String(), nullable=False),
        sa.Column('topic_tag', sa.String(100), nullable=False),
        sa.Column('content_text', sa.Text(), nullable=True),
        sa.Column('slides_pptx_path', sa.String(500), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('generated_by', sa.String(), nullable=True),
        sa.ForeignKeyConstraint(['generated_by'], ['diet_users.id']),
        sa.PrimaryKeyConstraint('id')
    )

    # LFA designs table
    op.create_table(
        'lfa_designs',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('problem_statement', sa.Text(), nullable=False),
        sa.Column('student_change', sa.Text(), nullable=False),
        sa.Column('stakeholders_json', sa.Text(), nullable=True),
        sa.Column('practice_changes_json', sa.Text(), nullable=True),
        sa.Column('indicators_json', sa.Text(), nullable=True),
        sa.Column('exported_path', sa.String(500), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('created_by', sa.String(), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['diet_users.id']),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    """Drop all tables."""
    op.drop_table('lfa_designs')
    op.drop_table('micro_modules')
    op.drop_index('ix_teacher_queries_created_at', 'teacher_queries')
    op.drop_index('ix_teacher_queries_topic_tag', 'teacher_queries')
    op.drop_index('ix_teacher_queries_cluster_id', 'teacher_queries')
    op.drop_index('ix_teacher_queries_phone_hash', 'teacher_queries')
    op.drop_table('teacher_queries')
    op.drop_table('diet_users')
    op.drop_index('ix_clusters_name', 'clusters')
    op.drop_table('clusters')