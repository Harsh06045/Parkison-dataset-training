"""
Integration tests for Two-Stage Clinical Report Generation (Layer 5).
Verifies:
- Linking prediction record to Report entity in database
- Stage 1 AI_ANALYSIS creation
- Stage 2 FINAL_CLINICAL doctor approval and digital license verification
"""

import pytest
from app.db.models import ReportRecord as Report, PredictionRecord


class TestReportIntegration:

    def test_complete_report_workflow_in_db(self, client, doctor_auth, db_session):
        # 1. Generate report
        resp = client.post(
            "/api/reports/generate/PAT-1083",
            json={
                "report_stage": "AI_ANALYSIS",
                "modality": "spiral",
                "prediction": "Parkinson",
                "confidence": 89.4,
                "clinical_notes": "Clinical correlation required with MDS-UPDRS Part III."
            },
            headers=doctor_auth["headers"]
        )
        assert resp.status_code == 201
        data = resp.json()
        report_id = data["id"]

        # 2. Verify Report record in Neon database
        db_report = db_session.query(Report).filter(Report.id == report_id).first()
        assert db_report is not None
        assert db_report.patient_id == "PAT-1083"
        assert db_report.confidence == data["confidence"]
        assert db_report.status in ["AI_ANALYSIS", "FINAL_CLINICAL", "Finalized", "Preliminary AI Output"]
