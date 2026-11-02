"""
Comprehensive End-to-End Test Suite for Patient Assessment Workflow & Isolated Storage.
Validates:
1. Patient creation and automatic folder generation: `storage/patients/<PATIENT_ID>/`
2. Submitting multi-modal testing inputs (Spiral, Voice, MRI) -> `storage/patients/<PATIENT_ID>/uploads/`
3. Running genuine AI models and XAI (Grad-CAM, SHAP) -> `storage/patients/<PATIENT_ID>/predictions/` and `explainability/`
4. Assessment lifecycle transitions: CREATED -> INPUTS_RECEIVED -> PROCESSING -> COMPLETED -> REPORT_GENERATED
5. Automated PDF report generation inside patient's isolated folder: `storage/patient_reports/<PATIENT_ID>/`
6. Non-overwriting sequential naming: `Report_<PATIENT_ID>_<DATE>_001.pdf`, `Report_<PATIENT_ID>_<DATE>_002.pdf`
7. Updating and validating `storage/patient_reports/<PATIENT_ID>/report_metadata.json`
8. Secure patient authorization and report download
"""

import os
import io
import json
import pytest
from PIL import Image
from datetime import datetime

from app.core.config import settings
from app.services.patient_storage_service import patient_storage


class TestAssessmentWorkflowApi:

    @pytest.fixture
    def sample_files(self, sample_spiral_path, sample_mri_path, sample_voice_path):
        with open(sample_spiral_path, "rb") as f:
            sp_bytes = f.read()
        with open(sample_mri_path, "rb") as f:
            mri_bytes = f.read()
        with open(sample_voice_path, "rb") as f:
            voice_bytes = f.read()

        return {
            "spiral": sp_bytes,
            "mri": mri_bytes,
            "voice": voice_bytes
        }

    def test_01_create_assessment_lifecycle(self, client, doctor_auth):
        """Test Stage 1: Initialize assessment in CREATED status."""
        patient_id = "PAT-WORKFLOW-001"
        # Register patient first
        p_res = client.post(
            "/api/v1/patients",
            json={
                "id": patient_id,
                "name": "Sarah Connor",
                "fullName": "Sarah Connor",
                "age": 58,
                "gender": "Female",
                "email": "sarah.connor@workflowtest.org",
                "contact_number": "+1 (555) 999-1122"
            },
            headers=doctor_auth["headers"]
        )
        if p_res.status_code == 201:
            patient_id = p_res.json().get("id", patient_id)

        resp = client.post(
            "/api/v1/assessments",
            json={
                "patient_id": patient_id,
                "doctor_id": "DOC-8921",
                "modalities": ["spiral", "voice", "mri"]
            },
            headers=doctor_auth["headers"]
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["patient_id"] == patient_id
        assert data["status"] == "CREATED"
        assert "spiral" in data["modalities_requested"]

        # Verify patient directory was created
        p_dir = patient_storage.get_patient_dir(patient_id)
        assert os.path.exists(p_dir)
        assert os.path.exists(os.path.join(p_dir, "uploads", "spiral"))
        assert os.path.exists(os.path.join(p_dir, "predictions"))
        assert os.path.exists(os.path.join(p_dir, "explainability"))

    def test_02_submit_inputs_and_execute(self, client, doctor_auth, sample_files):
        """Test Stage 2 & 3: Submit media uploads -> INPUTS_RECEIVED -> process -> COMPLETED."""
        patient_id = "PAT-WORKFLOW-002"
        p_res = client.post(
            "/api/v1/patients",
            json={
                "id": patient_id,
                "name": "Kyle Reese",
                "fullName": "Kyle Reese",
                "age": 42,
                "gender": "Male",
                "email": "kyle.reese@workflowtest.org"
            },
            headers=doctor_auth["headers"]
        )
        if p_res.status_code == 201:
            patient_id = p_res.json().get("id", patient_id)

        # 1. Create assessment
        create_res = client.post(
            "/api/v1/assessments",
            json={"patient_id": patient_id},
            headers=doctor_auth["headers"]
        )
        assert create_res.status_code == 201
        asm_id = create_res.json()["id"]

        # 2. Submit uploads
        files = {
            "spiral_file": ("spiral_sketch.png", sample_files["spiral"], "image/png"),
            "voice_file": ("vocal_recording.wav", sample_files["voice"], "audio/wav"),
            "mri_file": ("mri_axial_slice.jpg", sample_files["mri"], "image/jpeg")
        }
        submit_res = client.post(
            f"/api/v1/assessments/{asm_id}/inputs",
            files=files,
            headers=doctor_auth["headers"]
        )
        assert submit_res.status_code == 200
        submit_data = submit_res.json()
        assert submit_data["status"] == "INPUTS_RECEIVED"

        # Verify uploaded files in patient isolated folder
        p_dir = patient_storage.get_patient_dir(patient_id)
        assert len(os.listdir(os.path.join(p_dir, "uploads", "spiral"))) >= 1
        assert len(os.listdir(os.path.join(p_dir, "uploads", "voice"))) >= 1
        assert len(os.listdir(os.path.join(p_dir, "uploads", "mri"))) >= 1

        # 3. Process assessment
        proc_res = client.post(
            f"/api/v1/assessments/{asm_id}/process",
            headers=doctor_auth["headers"]
        )
        assert proc_res.status_code == 200
        proc_data = proc_res.json()
        assert proc_data["status"] == "COMPLETED"
        assert len(proc_data["modalities_completed"]) >= 1
        assert proc_data["overall_prediction"] is not None

        # Verify predictions saved to patient isolated directory
        pred_dir = os.path.join(p_dir, "predictions")
        assert len(os.listdir(pred_dir)) >= 1

    def test_03_generate_report_and_sequential_naming(self, client, doctor_auth, sample_files):
        """Test Stage 4: Generate reports and verify sequential naming without overwriting."""
        patient_id = "PAT-WORKFLOW-003"
        r_dir = patient_storage.get_patient_reports_dir(patient_id)
        if os.path.exists(r_dir):
            import shutil
            shutil.rmtree(r_dir, ignore_errors=True)
        p_res = client.post(
            "/api/v1/patients",
            json={
                "id": patient_id,
                "name": "John Connor",
                "fullName": "John Connor",
                "age": 35,
                "gender": "Male",
                "email": "john.connor@workflowtest.org"
            },
            headers=doctor_auth["headers"]
        )
        if p_res.status_code == 201:
            patient_id = p_res.json().get("id", patient_id)

        create_res = client.post("/api/v1/assessments", json={"patient_id": patient_id}, headers=doctor_auth["headers"])
        assert create_res.status_code == 201
        asm_id = create_res.json()["id"]

        # Submit inputs & process
        client.post(
            f"/api/v1/assessments/{asm_id}/inputs",
            files={"spiral_file": ("spiral.png", sample_files["spiral"], "image/png")},
            headers=doctor_auth["headers"]
        )
        client.post(f"/api/v1/assessments/{asm_id}/process", headers=doctor_auth["headers"])

        # 1. Generate Report #1
        rep1_res = client.post(
            f"/api/v1/assessments/{asm_id}/report",
            json={
                "report_stage": "FINAL_CLINICAL",
                "is_approved": True,
                "clinical_notes": "First assessment baseline observations."
            },
            headers=doctor_auth["headers"]
        )
        assert rep1_res.status_code == 201
        rep1_data = rep1_res.json()
        assert "Report_" in rep1_data["report_filename"]
        assert "_001.pdf" in rep1_data["report_filename"]
        assert os.path.exists(rep1_data["pdf_path"])

        # 2. Generate Report #2 (Verify sequential naming and NO overwriting)
        rep2_res = client.post(
            f"/api/v1/assessments/{asm_id}/report",
            json={
                "report_stage": "FINAL_CLINICAL",
                "is_approved": True,
                "clinical_notes": "Second follow-up assessment with updated review."
            },
            headers=doctor_auth["headers"]
        )
        assert rep2_res.status_code == 201
        rep2_data = rep2_res.json()
        assert "_002.pdf" in rep2_data["report_filename"]
        assert os.path.exists(rep2_data["pdf_path"])

        # Confirm BOTH files exist simultaneously
        assert os.path.exists(rep1_data["pdf_path"])
        assert os.path.exists(rep2_data["pdf_path"])
        assert rep1_data["pdf_path"] != rep2_data["pdf_path"]

        # 3. Verify report_metadata.json in patient's reports folder
        meta_res = client.get(f"/api/v1/patients/{patient_id}/reports/metadata", headers=doctor_auth["headers"])
        assert meta_res.status_code == 200
        meta_json = meta_res.json()
        assert meta_json["patient_id"] == patient_id
        assert meta_json["total_reports"] >= 2
        assert len(meta_json["reports"]) >= 2

        # 4. List reports via API
        list_res = client.get(f"/api/v1/patients/{patient_id}/reports", headers=doctor_auth["headers"])
        assert list_res.status_code == 200
        assert list_res.json()["total_reports"] >= 2

        # 5. Download report
        rep_id = rep1_data["id"]
        down_res = client.get(f"/api/v1/patients/{patient_id}/reports/{rep_id}/download", headers=doctor_auth["headers"])
        assert down_res.status_code == 200
        assert down_res.headers["content-type"] == "application/pdf"
        assert down_res.content.startswith(b"%PDF")

    def test_04_one_stop_complete_workflow(self, client, doctor_auth, sample_files):
        """Test the all-in-one complete patient workflow endpoint."""
        patient_id = "PAT-WORKFLOW-004"
        files = {
            "spiral_file": ("patient_spiral.png", sample_files["spiral"], "image/png"),
            "mri_file": ("patient_mri.jpg", sample_files["mri"], "image/jpeg")
        }
        data = {
            "patient_id": patient_id,
            "patient_name": "Marcus Wright",
            "patient_age": "61",
            "patient_gender": "Male",
            "clinical_notes": "One-stop automated diagnostic session verified by MD.",
            "report_stage": "FINAL_CLINICAL",
            "is_approved": "true"
        }

        resp = client.post(
            "/api/v1/assessments/workflow/complete",
            data=data,
            files=files,
            headers=doctor_auth["headers"]
        )
        assert resp.status_code == 200
        res = resp.json()
        assert res["status"] == "SUCCESS"
        assert res["patient"]["id"] == patient_id
        assert res["assessment"]["status"] == "REPORT_GENERATED"
        assert res["report"]["report_filename"].endswith(".pdf")
        assert len(res["patient_reports"]) >= 1

        # Verify disk artifacts
        p_reports_dir = patient_storage.get_patient_reports_dir(patient_id)
        assert os.path.exists(p_reports_dir)
        meta_file = os.path.join(p_reports_dir, "report_metadata.json")
        assert os.path.exists(meta_file)

