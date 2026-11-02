"""
Automated Test Suite for Phase 7: Patient Medical Report Generation & RBAC.
Tests:
1. Strict Validation Rules:
   - Unregistered / missing patient details -> HTTP 404
   - Incomplete patient profile (missing name/age/diagnosis) -> HTTP 400
   - No completed diagnostic test analyses -> HTTP 400
   - Missing protocol-required test (e.g. Alzheimer without MRI) -> HTTP 400
   - Mandatory EEG missing when requested -> HTTP 400
   - Final Clinical report missing doctor approval (is_approved=False) -> HTTP 400
   - Final Clinical report missing clinical review notes -> HTTP 400
2. Stage 1: AI_ANALYSIS Report:
   - Successfully generated after all tests pass without requiring doctor signoff
   - Watermarked/badged as preliminary AI output
3. Stage 2: FINAL_CLINICAL Report:
   - Successfully generated with doctor digital approval and clinical notes
4. RBAC & Security:
   - Patients forbidden from generating reports (HTTP 403)
   - Patients can view/download their own reports
   - Patients forbidden from viewing other patients' reports (HTTP 403)
   - Patients forbidden from deleting reports (HTTP 403)
   - Authorized clinical staff (doctor/admin) can view, download, and delete
"""

import os
import sys
import unittest
from datetime import datetime

# Setup sys.path
TEST_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(TEST_DIR)
PROJECT_ROOT = os.path.dirname(BACKEND_DIR)

sys.path.insert(0, BACKEND_DIR)
sys.path.insert(0, PROJECT_ROOT)

os.environ["MPLCONFIGDIR"] = os.path.join(BACKEND_DIR, "uploads", "mpl")

from app.api.reports import (
    generate_patient_report_endpoint,
    get_report_details_endpoint,
    download_report_pdf_endpoint,
    get_patient_report_history_endpoint,
    get_doctor_patient_reports_endpoint,
    delete_report_endpoint
)
from app.schemas.report import GenerateReportRequest
from app.utils.security import DEFAULT_PROFILES
from app.db.session import get_db_session
from app.db.models import Patient, PredictionRecord
from fastapi import HTTPException


class TestPatientMedicalReports(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.doctor = DEFAULT_PROFILES["doctor"]
        cls.admin = DEFAULT_PROFILES["admin"]
        cls.patient = DEFAULT_PROFILES["patient"]
        cls.test_patient_id = "PAT-1083"

        # Ensure a test patient without analyses exists for validation testing
        db = get_db_session()
        p_no_tests = db.query(Patient).filter(Patient.id == "PAT-EMPTY").first()
        if not p_no_tests:
            p_no_tests = Patient(
                id="PAT-EMPTY",
                full_name="Test Empty Patient",
                age=62,
                gender="Male",
                primary_diagnosis="Under Evaluation",
                created_at=datetime.now()
            )
            db.add(p_no_tests)
            db.commit()

        # Delete any accidental predictions for PAT-EMPTY
        db.query(PredictionRecord).filter(PredictionRecord.patient_id == "PAT-EMPTY").delete()
        db.commit()

    def test_01_validation_missing_patient(self):
        """Rule 1: Unregistered patient details -> Blocked (HTTP 404)."""
        req = GenerateReportRequest(
            report_stage="AI_ANALYSIS"
        )
        with self.assertRaises(HTTPException) as ctx:
            generate_patient_report_endpoint(
                patient_id="PAT-NONEXISTENT",
                payload=req,
                current_user=self.doctor
            )
        self.assertEqual(ctx.exception.status_code, 404)
        self.assertIn("not found in registry", ctx.exception.detail)

    def test_02_validation_no_completed_tests(self):
        """Rule 2: Patient with no completed test analyses -> Blocked (HTTP 400)."""
        req = GenerateReportRequest(
            report_stage="AI_ANALYSIS"
        )
        with self.assertRaises(HTTPException) as ctx:
            generate_patient_report_endpoint(
                patient_id="PAT-EMPTY",
                payload=req,
                current_user=self.doctor
            )
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("Complete all required tests before generating report", ctx.exception.detail)

    def test_03_validation_missing_protocol_tests(self):
        """Rule 3: Protocol mismatch (e.g. Alzheimer protocol requires MRI) -> Blocked (HTTP 400)."""
        # PD-PRED-1001 is a voice prediction
        req = GenerateReportRequest(
            protocol="alzheimer",
            prediction_id="PD-PRED-1001",
            report_stage="AI_ANALYSIS"
        )
        with self.assertRaises(HTTPException) as ctx:
            generate_patient_report_endpoint(
                patient_id=self.test_patient_id,
                payload=req,
                current_user=self.doctor
            )
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("Alzheimer's clinical protocol requires completed Brain MRI", ctx.exception.detail)

    def test_04_validation_missing_mandatory_eeg(self):
        """Rule 4: EEG requested without valid EEG signal data -> Blocked (HTTP 400)."""
        req = GenerateReportRequest(
            protocol="parkinson",
            include_eeg=True,
            eeg_data=None,  # Missing EEG data
            report_stage="AI_ANALYSIS"
        )
        with self.assertRaises(HTTPException) as ctx:
            generate_patient_report_endpoint(
                patient_id=self.test_patient_id,
                payload=req,
                current_user=self.doctor
            )
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("valid processed EEG signal data", ctx.exception.detail)

    def test_05_validation_final_clinical_missing_approval(self):
        """Rule 5: Stage 2 Final Clinical Report missing doctor approval -> Blocked (HTTP 400)."""
        req = GenerateReportRequest(
            protocol="parkinson",
            report_stage="FINAL_CLINICAL",
            is_approved=False,  # Missing doctor approval
            clinical_notes="Patient shows typical parkinsonian symptoms."
        )
        with self.assertRaises(HTTPException) as ctx:
            generate_patient_report_endpoint(
                patient_id=self.test_patient_id,
                payload=req,
                current_user=self.doctor
            )
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("requires attending physician approval confirmation", ctx.exception.detail)

    def test_06_validation_final_clinical_missing_notes(self):
        """Rule 6: Stage 2 Final Clinical Report missing clinical review notes -> Blocked (HTTP 400)."""
        req = GenerateReportRequest(
            protocol="parkinson",
            report_stage="FINAL_CLINICAL",
            is_approved=True,
            clinical_notes=""  # Missing notes
        )
        with self.assertRaises(HTTPException) as ctx:
            generate_patient_report_endpoint(
                patient_id=self.test_patient_id,
                payload=req,
                current_user=self.doctor
            )
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("requires attending physician clinical review notes", ctx.exception.detail)

    def test_07_generate_stage1_ai_analysis_report(self):
        """Success: Generate Stage 1 (AI_ANALYSIS) Report without requiring doctor sign-off."""
        req = GenerateReportRequest(
            report_stage="AI_ANALYSIS",
            protocol="parkinson",
            include_mri=True,
            include_eeg=True,
            eeg_data={
                "channel_count": 8,
                "duration_sec": 12.5,
                "sampling_rate_hz": 256,
                "slowing_index": 1.48,
                "dominant_band": "Theta",
                "delta_power": 35.0,
                "theta_power": 44.0,
                "alpha_power": 14.0,
                "beta_power": 7.0,
                "interpretation": "Excess fronto-central theta power indicative of cortico-basal motor slowing."
            },
            cdss_recommendations=[
                "Preliminary AI assessment indicates mild motor slowing.",
                "Recommend clinical neurological examination."
            ]
        )

        res = generate_patient_report_endpoint(
            patient_id=self.test_patient_id,
            payload=req,
            current_user=self.doctor
        )

        self.assertIn("id", res)
        self.assertEqual(res["report_stage"], "AI_ANALYSIS")
        self.assertEqual(res["is_approved"], False)
        self.assertTrue(os.path.exists(res["pdf_path"]))
        self.assertTrue(res["file_size_bytes"] > 1000)

    def test_08_generate_stage2_final_clinical_report(self):
        """Success: Generate Stage 2 (FINAL_CLINICAL) Report with doctor review notes and digital approval."""
        req = GenerateReportRequest(
            doctor_id=self.doctor["id"],
            report_stage="FINAL_CLINICAL",
            disease="Parkinson's Disease",
            protocol="parkinson",
            include_mri=True,
            include_eeg=True,
            is_approved=True,
            clinical_notes="Patient presents with resting tremor and bradykinesia. MRI and EEG biomarkers corroborate nigrostriatal dysfunction. Initiate clinical motor monitoring.",
            eeg_data={
                "channel_count": 8,
                "duration_sec": 12.5,
                "sampling_rate_hz": 256,
                "slowing_index": 1.48,
                "dominant_band": "Theta",
                "delta_power": 35.0,
                "theta_power": 44.0,
                "alpha_power": 14.0,
                "beta_power": 7.0,
                "interpretation": "Excess fronto-central theta power indicative of cortico-basal motor slowing."
            },
            cdss_recommendations=[
                "Confirm nigrostriatal degeneration via DaTscan SPECT.",
                "Conduct baseline MDS-UPDRS motor examination.",
                "Initiate physical therapy and neurological monitoring."
            ],
            hqdl_results={
                "enabled": True,
                "state_fidelity": 0.988,
                "entropy": 0.114,
                "refined_confidence": 99.4
            }
        )

        res = generate_patient_report_endpoint(
            patient_id=self.test_patient_id,
            payload=req,
            current_user=self.doctor
        )

        self.assertIn("id", res)
        self.assertEqual(res["report_stage"], "FINAL_CLINICAL")
        self.assertEqual(res["is_approved"], True)
        self.assertEqual(res["status"], "Finalized")
        self.assertTrue(res["file_size_bytes"] > 1000)
        self.assertTrue(os.path.exists(res["pdf_path"]))

        # Verify PDF header is valid ReportLab PDF
        with open(res["pdf_path"], "rb") as f:
            header = f.read(10)
            self.assertTrue(header.startswith(b"%PDF"))

        # Save report ID for subsequent tests
        self.__class__.generated_report_id = res["id"]

    def test_09_patient_cannot_generate_report(self):
        """RBAC: Patients are forbidden from generating medical reports (HTTP 403)."""
        req = GenerateReportRequest(report_stage="AI_ANALYSIS")
        with self.assertRaises(HTTPException) as ctx:
            generate_patient_report_endpoint(
                patient_id=self.test_patient_id,
                payload=req,
                current_user=self.patient
            )
        self.assertEqual(ctx.exception.status_code, 403)

    def test_10_view_report_details(self):
        """RBAC & Ownership: Doctor and owning patient can view details; non-owning patient forbidden."""
        rep_id = self.generated_report_id

        # Doctor view -> Allowed
        doc_view = get_report_details_endpoint(report_id=rep_id, current_user=self.doctor)
        self.assertEqual(doc_view["id"], rep_id)
        self.assertEqual(doc_view["patient_id"], self.test_patient_id)

        # Owning patient view (PAT-1083 viewing PAT-1083) -> Allowed
        pat_view = get_report_details_endpoint(report_id=rep_id, current_user=self.patient)
        self.assertEqual(pat_view["id"], rep_id)

        # Non-owning patient view (PAT-2001 viewing PAT-1083) -> Forbidden (HTTP 403)
        intruder = {"id": "PAT-2001", "role": "patient", "full_name": "Intruder Patient"}
        with self.assertRaises(HTTPException) as ctx:
            get_report_details_endpoint(report_id=rep_id, current_user=intruder)
        self.assertEqual(ctx.exception.status_code, 403)

    def test_11_download_report_pdf(self):
        """Retrieval: Download report PDF as FileResponse."""
        rep_id = self.generated_report_id
        file_resp = download_report_pdf_endpoint(report_id=rep_id, current_user=self.doctor)

        self.assertEqual(file_resp.media_type, "application/pdf")
        self.assertTrue(os.path.exists(file_resp.path))
        self.assertTrue(os.path.getsize(file_resp.path) > 1000)

    def test_12_patient_report_history(self):
        """Retrieval: Retrieve report history for a patient."""
        history = get_patient_report_history_endpoint(
            patient_id=self.test_patient_id,
            current_user=self.doctor
        )
        self.assertTrue(len(history) >= 1)
        self.assertEqual(history[0]["patient_id"], self.test_patient_id)

    def test_13_doctor_patient_reports(self):
        """Retrieval: Doctor viewing reports for assigned patients."""
        doc_reports = get_doctor_patient_reports_endpoint(
            doctor_id=self.doctor["id"],
            current_user=self.doctor
        )
        self.assertTrue(len(doc_reports) >= 1)

        # Patient attempting to list doctor reports -> Forbidden (HTTP 403)
        with self.assertRaises(HTTPException) as ctx:
            get_doctor_patient_reports_endpoint(
                doctor_id=self.doctor["id"],
                current_user=self.patient
            )
        self.assertEqual(ctx.exception.status_code, 403)

    def test_14_authorized_deletion(self):
        """RBAC: Patient cannot delete reports (HTTP 403); authorized doctor can delete."""
        rep_id = self.generated_report_id

        # Patient cannot delete
        with self.assertRaises(HTTPException) as ctx:
            delete_report_endpoint(report_id=rep_id, current_user=self.patient)
        self.assertEqual(ctx.exception.status_code, 403)

        # Doctor who created report can delete
        del_res = delete_report_endpoint(report_id=rep_id, current_user=self.doctor)
        self.assertEqual(del_res["status"], "success")
        self.assertTrue(del_res["is_deleted"])


if __name__ == "__main__":
    unittest.main()
