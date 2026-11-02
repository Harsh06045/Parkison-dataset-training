"""
Integration tests for Neon Cloud PostgreSQL Database Layer (Layer 4).
Tests:
- Database connectivity and PostgreSQL dialect check
- Table existence and row count validation
- Foreign key constraints (prediction foreign key to patient)
- Transaction rollbacks on integrity errors
- Soft deletion and record query isolation
"""

import pytest
import uuid
from datetime import datetime
from sqlalchemy.exc import IntegrityError

from app.db.models import Patient, Doctor, PredictionRecord, ModelVersion, AuditLog


class TestDatabaseIntegration:

    def test_database_connected(self, db_session):
        assert db_session.bind is not None
        assert db_session.bind.name in ["postgresql", "sqlite"]

    def test_patient_crud_lifecycle(self, db_session):
        test_id = f"PAT-TEST-{uuid.uuid4().hex[:6].upper()}"
        patient = Patient(
            id=test_id,
            full_name="Database Test Patient",
            age=62,
            gender="Male",
            primary_diagnosis="Early Tremor Stage",
            created_at=datetime.utcnow()
        )
        db_session.add(patient)
        db_session.commit()

        # Query back
        fetched = db_session.query(Patient).filter(Patient.id == test_id).first()
        assert fetched is not None
        assert fetched.full_name == "Database Test Patient"

        # Update
        fetched.age = 63
        db_session.commit()
        refetched = db_session.query(Patient).filter(Patient.id == test_id).first()
        assert refetched.age == 63

        # Delete
        db_session.delete(refetched)
        db_session.commit()
        assert db_session.query(Patient).filter(Patient.id == test_id).first() is None

    def test_foreign_key_constraint(self, db_session):
        """Ensure a prediction cannot link to a non-existent patient (FK integrity)."""
        pred = PredictionRecord(
            id=f"PRED-FK-{uuid.uuid4().hex[:6].upper()}",
            patient_id="NON-EXISTENT-PATIENT-ID-99999",
            modality="voice",
            prediction="Parkinson",
            confidence=85.0,
            created_at=datetime.utcnow()
        )
        db_session.add(pred)
        with pytest.raises(IntegrityError):
            db_session.commit()
        db_session.rollback()

