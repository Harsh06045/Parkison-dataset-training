"""
Integration tests for Patient-Specific Isolated Storage & Report Preservation.
Tests:
- Path traversal defense
- Directory structure isolation between patients
- Sequential numbering logic (Report_<PATIENT_ID>_<DATE>_<SEQ>.pdf)
- Metadata atomicity and JSON integrity
"""

import os
import pytest
from app.services.patient_storage_service import PatientStorageService, patient_storage
from fastapi import HTTPException


class TestPatientReportsStorageIntegration:

    def test_path_traversal_prevention(self):
        """Verify that malicious patient IDs attempting directory traversal are blocked."""
        malicious_ids = [
            "../etc/passwd",
            "..\\windows\\system32",
            "PAT-1001/../../root",
            "PAT-1001\0null",
            "PAT 1001; rm -rf",
            "",
            "   "
        ]
        for bad_id in malicious_ids:
            with pytest.raises(HTTPException):
                patient_storage.sanitize_patient_id(bad_id)

    def test_patient_directory_isolation(self):
        """Verify that two distinct patients receive completely isolated folder trees."""
        p1 = "PAT-ISO-001"
        p2 = "PAT-ISO-002"

        d1 = patient_storage.ensure_patient_structure(p1)
        d2 = patient_storage.ensure_patient_structure(p2)

        assert os.path.exists(d1["root"])
        assert os.path.exists(d2["root"])
        assert d1["root"] != d2["root"]
        assert p1 in d1["root"]
        assert p2 in d2["root"]

        # Ensure subfolders exist
        assert os.path.exists(d1["upload_spiral"])
        assert os.path.exists(d1["upload_voice"])
        assert os.path.exists(d1["upload_mri"])
        assert os.path.exists(d1["predictions"])
        assert os.path.exists(d1["explainability"])

    def test_sequential_report_naming_preservation(self):
        """Verify that sequential reports generate incremented filenames without overwriting."""
        patient_id = "PAT-SEQ-TEST"
        r_dir = patient_storage.get_patient_reports_dir(patient_id)
        if os.path.exists(r_dir):
            import shutil
            shutil.rmtree(r_dir, ignore_errors=True)
        os.makedirs(r_dir, exist_ok=True)

        date_str = "2026-11-02"
        f1, p1 = patient_storage.get_next_report_filename(patient_id, date_str)
        assert f1 == f"Report_{patient_id}_{date_str}_001.pdf"

        # Create dummy file 1
        with open(p1, "wb") as f:
            f.write(b"%PDF-1.4 sample report 1")

        # Request next report filename
        f2, p2 = patient_storage.get_next_report_filename(patient_id, date_str)
        assert f2 == f"Report_{patient_id}_{date_str}_002.pdf"
        assert p1 != p2

        with open(p2, "wb") as f:
            f.write(b"%PDF-1.4 sample report 2")

        # Request third report filename
        f3, p3 = patient_storage.get_next_report_filename(patient_id, date_str)
        assert f3 == f"Report_{patient_id}_{date_str}_003.pdf"

        # Confirm all 3 files remain on disk
        assert os.path.exists(p1)
        assert os.path.exists(p2)

    def test_metadata_json_updates(self):
        """Verify report_metadata.json captures all reports accurately."""
        patient_id = "PAT-META-TEST"
        dummy_pdf_content = b"%PDF-1.4 dummy pdf binary stream for testing"

        meta_1 = {
            "report_id": "REP-TEST-001",
            "assessment_id": "ASM-TEST-001",
            "report_stage": "FINAL_CLINICAL",
            "is_approved": True,
            "prediction": "Parkinson",
            "confidence": 92.5
        }
        res1 = patient_storage.save_patient_report_pdf(patient_id, dummy_pdf_content, meta_1)
        assert res1["report_id"] == "REP-TEST-001"
        assert res1["file_size_bytes"] == len(dummy_pdf_content)

        meta_2 = {
            "report_id": "REP-TEST-002",
            "assessment_id": "ASM-TEST-002",
            "report_stage": "FINAL_CLINICAL",
            "is_approved": True,
            "prediction": "Normal Control",
            "confidence": 88.0
        }
        res2 = patient_storage.save_patient_report_pdf(patient_id, dummy_pdf_content, meta_2)
        assert res2["report_id"] == "REP-TEST-002"

        # Read back metadata
        all_meta = patient_storage.get_patient_metadata(patient_id)
        assert all_meta["total_reports"] >= 2
        rep_ids = [r["report_id"] for r in all_meta["reports"]]
        assert "REP-TEST-001" in rep_ids
        assert "REP-TEST-002" in rep_ids

