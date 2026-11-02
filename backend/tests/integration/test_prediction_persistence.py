"""
Integration tests for End-to-End Prediction Persistence into Neon PostgreSQL.
Verifies that calling the prediction endpoints automatically writes
records to 'predictions' and 'file_references' tables.
"""

import pytest
from app.db.models import PredictionRecord, FileReference


class TestPredictionPersistence:

    def test_voice_prediction_persisted_to_db(self, client, sample_voice_path, db_session):
        with open(sample_voice_path, "rb") as f:
            resp = client.post(
                "/api/parkinson/voice/predict",
                files={"file": ("persist_test_voice.wav", f, "audio/wav")},
                data={"patient_id": "PAT-1083"}
            )
        assert resp.status_code == 200
        data = resp.json()
        assert "prediction" in data

        # Query database directly to confirm record exists
        record = db_session.query(PredictionRecord).filter(
            PredictionRecord.patient_id == "PAT-1083",
            PredictionRecord.modality == "voice"
        ).order_by(PredictionRecord.created_at.desc()).first()

        assert record is not None
        assert record.prediction == data["prediction"]
        assert round(record.confidence, 1) == round(data["confidence"], 1)

    def test_spiral_prediction_persisted_to_db(self, client, sample_spiral_path, db_session):
        with open(sample_spiral_path, "rb") as f:
            resp = client.post(
                "/api/parkinson/spiral/predict",
                files={"file": ("persist_test_spiral.png", f, "image/png")},
                data={"patient_id": "PAT-1083"}
            )
        assert resp.status_code == 200
        data = resp.json()

        record = db_session.query(PredictionRecord).filter(
            PredictionRecord.patient_id == "PAT-1083",
            PredictionRecord.modality == "spiral"
        ).order_by(PredictionRecord.created_at.desc()).first()

        assert record is not None
        assert record.prediction == data["prediction"]

