"""Initial Neon Schema for Parkinson's Diagnostic Records

Revision ID: 0001_initial_neon
Revises: 
Create Date: 2026-11-01 23:30:00

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0001_initial_neon'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Doctors table
    op.create_table(
        'doctors',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('full_name', sa.String(length=128), nullable=False),
        sa.Column('license_id', sa.String(length=64), unique=True, nullable=False),
        sa.Column('department', sa.String(length=128), server_default="Neurology"),
        sa.Column('email', sa.String(length=128), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'))
    )

    # 2. Patients table
    op.create_table(
        'patients',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('full_name', sa.String(length=128), nullable=False),
        sa.Column('age', sa.Integer(), nullable=True),
        sa.Column('gender', sa.String(length=16), nullable=True),
        sa.Column('primary_diagnosis', sa.String(length=256), server_default="Suspected Parkinson's Disease"),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'))
    )

    # 3. Model versions table
    op.create_table(
        'model_versions',
        sa.Column('model_id', sa.String(length=64), primary_key=True),
        sa.Column('modality', sa.String(length=32), nullable=False),
        sa.Column('architecture', sa.String(length=128), nullable=False),
        sa.Column('checkpoint_hash', sa.String(length=64), nullable=True),
        sa.Column('input_features', sa.Text(), nullable=True),
        sa.Column('metrics_json', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'))
    )

    # 4. Predictions table
    op.create_table(
        'predictions',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('patient_id', sa.String(length=64), sa.ForeignKey('patients.id'), nullable=False),
        sa.Column('doctor_id', sa.String(length=64), sa.ForeignKey('doctors.id'), nullable=True),
        sa.Column('model_version_id', sa.String(length=64), sa.ForeignKey('model_versions.model_id'), nullable=True),
        sa.Column('modality', sa.String(length=32), nullable=False),
        sa.Column('disease', sa.String(length=64), server_default="Parkinson's Disease"),
        sa.Column('prediction', sa.String(length=64), nullable=False),
        sa.Column('confidence', sa.Float(), nullable=False),
        sa.Column('uncertainty', sa.Float(), server_default="0.0"),
        sa.Column('motor_updrs', sa.Float(), nullable=True),
        sa.Column('total_updrs', sa.Float(), nullable=True),
        sa.Column('clinical_notes', sa.Text(), nullable=True),
        sa.Column('details_json', sa.Text(), nullable=True),
        sa.Column('is_deleted', sa.Boolean(), server_default="0", nullable=False),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False)
    )
    op.create_index('ix_predictions_patient_created', 'predictions', ['patient_id', 'created_at'])
    op.create_index('ix_predictions_modality_created', 'predictions', ['modality', 'created_at'])
    op.create_index('ix_predictions_deleted_created', 'predictions', ['is_deleted', 'created_at'])

    # 5. File references table
    op.create_table(
        'file_references',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('prediction_id', sa.String(length=64), sa.ForeignKey('predictions.id'), nullable=False),
        sa.Column('file_type', sa.String(length=32), nullable=False),
        sa.Column('original_filename', sa.String(length=256), nullable=False),
        sa.Column('storage_path', sa.String(length=512), nullable=False),
        sa.Column('file_size_bytes', sa.Integer(), server_default="0"),
        sa.Column('mime_type', sa.String(length=64), nullable=False),
        sa.Column('sha256_checksum', sa.String(length=64), nullable=False),
        sa.Column('access_token', sa.String(length=128), unique=True, nullable=False),
        sa.Column('token_expires_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'))
    )
    op.create_index('ix_file_references_access_token', 'file_references', ['access_token'])

    # 6. Audit logs table
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('request_id', sa.String(length=64), nullable=True),
        sa.Column('actor_id', sa.String(length=64), server_default="DOC-8921", nullable=False),
        sa.Column('action', sa.String(length=64), nullable=False),
        sa.Column('resource_type', sa.String(length=32), nullable=False),
        sa.Column('resource_id', sa.String(length=64), nullable=True),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('details_json', sa.Text(), nullable=True),
        sa.Column('timestamp', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'))
    )
    op.create_index('ix_audit_logs_timestamp', 'audit_logs', ['timestamp'])


def downgrade() -> None:
    op.drop_table('audit_logs')
    op.drop_table('file_references')
    op.drop_table('predictions')
    op.drop_table('model_versions')
    op.drop_table('patients')
    op.drop_table('doctors')

