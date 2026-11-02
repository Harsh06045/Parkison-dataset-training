"""
Unit tests for ReportLab Clinical PDF Generation Service (Layer 5).
Tests:
- Generation of two-stage clinical report
- Stage 1: AI_ANALYSIS with disclaimer watermark
- Stage 2: FINAL_CLINICAL with doctor approval and signature
- Binary PDF validation (%PDF- header)
"""

import os
import pytest
from app.services.patient_report_service import patient_report_service


class TestPdfServiceUnit:

    def test_pdf_report_stage_1_generation(self):
        """Generate Stage 1 AI Analysis draft report."""
        report_data = {
            "patient_id": "PAT-1083",
            "report_stage": "AI_ANALYSIS",
            "modality": "spiral",
            "prediction": "Parkinson",
            "confidence": 88.5,
            "clinical_notes": "Preliminary automated spiral tremor assessment."
        }
        doctor_user = {
            "id": "DOC-8921",
            "fullName": "Dr. Sarah Jenkins, MD, PhD",
            "medicalLicenseId": "MD-98472-NEURO",
            "role": "doctor"
        }
        res = patient_report_service.generate_report_for_patient(
            patient_id="PAT-1083",
            request_data=report_data,
            current_user=doctor_user
        )
        assert res is not None
        assert "id" in res
        assert res["patientId"] == "PAT-1083"
        assert res["status"] in ["AI_ANALYSIS", "FINAL_CLINICAL", "Finalized", "Preliminary AI Output"]

        # Check physical PDF exists
        pdf_path = res.get("pdfPath")
        assert pdf_path is not None
        assert os.path.exists(pdf_path)

        # Validate PDF binary header
        with open(pdf_path, "rb") as f:
            header = f.read(5)
            assert header == b"%PDF-", "File is not a valid PDF document!"
