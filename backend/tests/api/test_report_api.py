"""
API tests for Automated Patient PDF Reports & Approval Workflow (Layer 5).
Tests:
- POST /api/reports/generate/{patient_id} (Doctor role)
- GET /api/reports/{report_id}
- GET /api/reports/{report_id}/download (Binary PDF stream)
- Patient isolation: Patient attempting to delete reports is forbidden (403)
"""

import pytest


class TestReportApi:

    def test_generate_report_by_doctor(self, client, doctor_auth):
        payload = {
            "report_stage": "AI_ANALYSIS",
            "modality": "voice",
            "prediction": "Parkinson",
            "confidence": 91.2,
            "clinical_notes": "Automated vocal biomarker screen shows dysphonia."
        }
        resp = client.post(
            "/api/reports/generate/PAT-1083",
            json=payload,
            headers=doctor_auth["headers"]
        )
        assert resp.status_code == 201
        data = resp.json()
        assert "id" in data
        assert data.get("patient_id") == "PAT-1083" or data.get("patientId") == "PAT-1083"
        report_id = data["id"]

        # View details
        view_resp = client.get(f"/api/reports/{report_id}", headers=doctor_auth["headers"])
        assert view_resp.status_code == 200

        # Download PDF
        dl_resp = client.get(f"/api/reports/{report_id}/download", headers=doctor_auth["headers"])
        assert dl_resp.status_code == 200
        assert dl_resp.content.startswith(b"%PDF-")

    def test_patient_cannot_delete_report(self, client, patient_auth, doctor_auth):
        """Ensure patients cannot delete medical reports (403 Forbidden)."""
        # Create report as doctor
        create_resp = client.post(
            "/api/reports/generate/PAT-1083",
            json={"report_stage": "AI_ANALYSIS", "modality": "spiral", "prediction": "Normal", "confidence": 95.0},
            headers=doctor_auth["headers"]
        )
        report_id = create_resp.json()["id"]

        # Try to delete as patient
        del_resp = client.delete(f"/api/reports/{report_id}", headers=patient_auth["headers"])
        assert del_resp.status_code in [401, 403]
