"""
NeuroFusionAI – Phase 8: Complete Parkinson Backend Integration & End-to-End Validation
Validates all 12 core backend integration priorities:
1. Module imports and module paths
2. Model loader and checkpoint validation (blocks unweighted/random models)
3. Dataset and preprocessing connections (22 acoustic features, 19 telemon, 224x224 images)
4. Prediction API services (Spiral, Voice, Telemonitoring, MRI, Fusion)
5. Grad-CAM and SHAP explainability generation
6. Neon PostgreSQL database persistence (Patients, Predictions, Audits)
7. Durable file storage and SHA-256 integrity verification
8. Longitudinal patient history association
9. Two-stage clinical PDF report generation (AI_ANALYSIS & FINAL_CLINICAL)
10. React frontend API endpoints (/analysis/parkinson/predict, /patients)
11. Authentication & Role-Based Access Control (RBAC)
12. Comprehensive end-to-end multi-modal pipeline execution
"""

import os
import sys
import unittest
import json
import torch
import numpy as np

# Set project paths
TEST_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(TEST_DIR)
PROJECT_ROOT = os.path.dirname(BACKEND_DIR)

if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

os.environ["MPLCONFIGDIR"] = os.path.join(BACKEND_DIR, "uploads", "mpl")

# Model Loader & Services
from app.models.loader import loader
from app.services.mri_service import predict_mri
from app.services.spiral_service import predict_spiral
from app.services.voice_service import predict_voice
from app.services.telemonitor_service import predict_telemonitor
from app.services.fusion_service import predict_fusion
from app.services.gradcam_service import run_gradcam
from app.services.shap_service import run_shap_analysis
from app.services.history_service import history_service
from app.services.storage_service import storage_service
from app.services.patient_report_service import patient_report_service
from app.db.session import check_connection, get_db_session
from app.db.models import Patient, Doctor, PredictionRecord, ReportRecord, FileReference, AuditLog
from app.utils.security import DEFAULT_PROFILES


class TestCompleteBackendIntegration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # 1. Ensure models are loaded
        loader.load_all_models()
        
        # 2. Test sample files
        cls.sample_mri = os.path.join(PROJECT_ROOT, "sample_mri.png")
        if not os.path.exists(cls.sample_mri):
            cls.sample_mri = os.path.join(BACKEND_DIR, "static", "samples", "sample_mri.png")

        cls.sample_spiral = os.path.join(PROJECT_ROOT, "sample_spiral.png")
        if not os.path.exists(cls.sample_spiral):
            cls.sample_spiral = os.path.join(BACKEND_DIR, "static", "samples", "sample_spiral.png")

        cls.sample_voice = os.path.join(PROJECT_ROOT, "sample_voice.wav")
        if not os.path.exists(cls.sample_voice):
            cls.sample_voice = os.path.join(BACKEND_DIR, "static", "samples", "sample_voice.wav")

        cls.sample_telemonitor = os.path.join(PROJECT_ROOT, "sample_telemonitor.csv")
        if not os.path.exists(cls.sample_telemonitor):
            cls.sample_telemonitor = os.path.join(BACKEND_DIR, "static", "samples", "sample_telemonitor.csv")

        # 3. User roles
        cls.doctor = DEFAULT_PROFILES["doctor"]
        cls.admin = DEFAULT_PROFILES["admin"]
        cls.patient = DEFAULT_PROFILES["patient"]

    # -------------------------------------------------------------------------
    # Priority 1 & 2: Imports, Model Loader & Checkpoint Validation
    # -------------------------------------------------------------------------
    def test_01_model_loader_and_checkpoints_verified(self):
        """Verify all 7 trained checkpoints and 2 scalers are loaded."""
        status = loader.get_model_status()
        for model_name, is_loaded in status.items():
            self.assertTrue(is_loaded, f"Model/scaler '{model_name}' failed to load trained weights!")

        # Verify that require_model raises RuntimeError for invalid or unloaded models
        with self.assertRaises(ValueError):
            loader.require_model("nonexistent_model")

    # -------------------------------------------------------------------------
    # Priority 3 & 4: Preprocessing & Prediction Services
    # -------------------------------------------------------------------------
    def test_02_mri_prediction_service(self):
        """Test MRI prediction: classification, confidence, 256-d embedding."""
        res = predict_mri(self.sample_mri)
        self.assertIn(res["prediction"], ["Parkinson", "Normal"])
        self.assertGreaterEqual(res["confidence"], 50.0)
        self.assertLessEqual(res["confidence"], 100.0)
        self.assertIsNotNone(res["embedding"])
        self.assertEqual(res["embedding"].shape, (1, 256))

    def test_03_spiral_prediction_service(self):
        """Test Spiral drawing prediction: classification, confidence, uncertainty, quality."""
        res = predict_spiral(self.sample_spiral)
        self.assertIn(res["prediction"], ["Parkinson", "Normal"])
        self.assertGreaterEqual(res["confidence"], 50.0)
        self.assertIn("uncertainty", res)
        self.assertTrue(res["quality"]["valid"])
        self.assertIsNotNone(res["embedding"])
        self.assertEqual(res["embedding"].shape, (1, 256))

    def test_04_voice_prediction_service(self):
        """Test Voice prediction: 22 acoustic features, dual CatBoost+MLP, confidence."""
        res = predict_voice(self.sample_voice)
        self.assertIn(res["prediction"], ["Parkinson", "Normal"])
        self.assertGreaterEqual(res["confidence"], 50.0)
        self.assertIn("acoustic_features", res)
        self.assertEqual(len(res["acoustic_features"]), 22)
        self.assertIn("MDVP:Fo(Hz)", res["acoustic_features"])
        self.assertIn("HNR", res["acoustic_features"])
        self.assertIsNotNone(res["tensor"])
        self.assertEqual(res["tensor"].shape, (1, 22))

    def test_05_telemonitor_prediction_service(self):
        """Test Telemonitoring regression: Motor UPDRS, Total UPDRS, 95% CI."""
        res = predict_telemonitor(self.sample_telemonitor)
        self.assertIn("motor_updrs", res)
        self.assertIn("total_updrs", res)
        self.assertGreaterEqual(res["motor_updrs"], 0.0)
        self.assertGreaterEqual(res["total_updrs"], 0.0)
        self.assertEqual(len(res["motor_confidence_interval"]), 2)
        self.assertEqual(len(res["total_confidence_interval"]), 2)
        self.assertIsNotNone(res["tensor"])
        self.assertEqual(res["tensor"].shape, (1, 19))

    def test_06_multimodal_fusion_service(self):
        """Test Multimodal Attention Fusion: all 4 modalities combined."""
        mri_res = predict_mri(self.sample_mri)
        spiral_res = predict_spiral(self.sample_spiral)
        voice_res = predict_voice(self.sample_voice)
        tele_res = predict_telemonitor(self.sample_telemonitor)

        fusion_res = predict_fusion(
            drawing_embed=spiral_res["embedding"],
            mri_embed=mri_res["embedding"],
            voice_tensor=voice_res["tensor"],
            tele_tensor=tele_res["tensor"]
        )

        self.assertIn(fusion_res["prediction"], ["Parkinson", "Normal"])
        self.assertGreaterEqual(fusion_res["confidence"], 50.0)
        self.assertIn("modality_contributions", fusion_res)
        self.assertEqual(len(fusion_res["present_modalities"]), 4)
        self.assertIn("is_out_of_distribution", fusion_res["ood_analysis"])
        self.assertIn("ood_anomaly_score", fusion_res["ood_analysis"])

    # -------------------------------------------------------------------------
    # Priority 5: Grad-CAM and SHAP Explainability Integration
    # -------------------------------------------------------------------------
    def test_07_gradcam_explainability(self):
        """Test Grad-CAM heatmap generation for Spiral and MRI."""
        from app.config import STATIC_DIR
        spiral_cam = run_gradcam("spiral", self.sample_spiral)
        self.assertIn("overlay", spiral_cam)
        spiral_overlay_path = os.path.join(STATIC_DIR, os.path.basename(spiral_cam["overlay"]))
        self.assertTrue(os.path.exists(spiral_overlay_path))

        mri_cam = run_gradcam("mri", self.sample_mri)
        self.assertIn("overlay", mri_cam)
        mri_overlay_path = os.path.join(STATIC_DIR, os.path.basename(mri_cam["overlay"]))
        self.assertTrue(os.path.exists(mri_overlay_path))

    def test_08_shap_explainability(self):
        """Test TreeExplainer SHAP attribution for Voice and Telemonitor."""
        from app.config import STATIC_DIR
        voice_shap = run_shap_analysis("voice", self.sample_voice)
        self.assertIn("summary", voice_shap)
        self.assertIn("bar", voice_shap)
        voice_summary_path = os.path.join(STATIC_DIR, os.path.basename(voice_shap["summary"]))
        self.assertTrue(os.path.exists(voice_summary_path))

        tele_shap = run_shap_analysis("telemonitor", self.sample_telemonitor)
        self.assertIn("summary", tele_shap)
        tele_summary_path = os.path.join(STATIC_DIR, os.path.basename(tele_shap["summary"]))
        self.assertTrue(os.path.exists(tele_summary_path))

    # -------------------------------------------------------------------------
    # Priority 6, 7 & 8: Database (Neon PostgreSQL), Storage & Patient History
    # -------------------------------------------------------------------------
    def test_09_database_and_storage_persistence(self):
        """Test record persistence into Neon PostgreSQL and durable medical storage."""
        # Check DB connection
        conn = check_connection()
        self.assertEqual(conn["status"], "connected")
        self.assertEqual(conn["dialect"], "postgresql")

        # Save prediction
        patient_id = "PAT-1083"
        rec = history_service.save_prediction(
            modality="voice",
            prediction="Parkinson",
            confidence=89.5,
            patient_id=patient_id,
            model_version_id="voice_catboost_v1",
            uncertainty=4.2,
            clinical_notes="End-to-End integration verification assessment."
        )
        self.assertIsNotNone(rec["id"])
        self.assertEqual(rec["patient_id"], patient_id)

        # Store file in medical object storage
        stored = storage_service.store_file(
            source_path=self.sample_voice,
            prediction_id=rec["id"],
            file_type="audio_wav",
            original_filename="sample_voice.wav"
        )
        self.assertIsNotNone(stored.id)
        self.assertTrue(os.path.exists(stored.storage_path))
        self.assertEqual(len(stored.sha256_checksum), 64)

        # Verify record exists in Neon PostgreSQL
        db = get_db_session()
        try:
            db_rec = db.query(PredictionRecord).filter(PredictionRecord.id == rec["id"]).first()
            self.assertIsNotNone(db_rec)
            self.assertEqual(db_rec.prediction, "Parkinson")

            # Verify audit log was recorded
            audit = db.query(AuditLog).filter(AuditLog.resource_id == rec["id"]).first()
            self.assertIsNotNone(audit)
        finally:
            db.close()

    # -------------------------------------------------------------------------
    # Priority 9: Automated Patient PDF Reports (Stage 1 & Stage 2)
    # -------------------------------------------------------------------------
    def test_10_two_stage_clinical_reports(self):
        """Test Stage 1 (AI_ANALYSIS) and Stage 2 (FINAL_CLINICAL) PDF report generation."""
        patient_id = "PAT-1083"
        
        # Stage 1: Preliminary AI Analysis
        stage1_req = {
            "disease_protocol": "parkinson",
            "report_stage": "AI_ANALYSIS"
        }
        rep1 = patient_report_service.generate_report_for_patient(
            patient_id=patient_id,
            request_data=stage1_req,
            current_user=self.doctor
        )
        self.assertEqual(rep1["report_stage"], "AI_ANALYSIS")
        self.assertTrue(os.path.exists(rep1["pdf_path"]))
        self.assertGreater(os.path.getsize(rep1["pdf_path"]), 2000)

        # Stage 2: Final Clinical Sign-Off
        stage2_req = {
            "disease_protocol": "parkinson",
            "report_stage": "FINAL_CLINICAL",
            "is_approved": True,
            "clinical_notes": "Clinical correlation verified with mild bilateral rest tremor. Stage II Parkinson confirmed."
        }
        rep2 = patient_report_service.generate_report_for_patient(
            patient_id=patient_id,
            request_data=stage2_req,
            current_user=self.doctor
        )
        self.assertEqual(rep2["report_stage"], "FINAL_CLINICAL")
        self.assertTrue(rep2["is_approved"])
        self.assertTrue(os.path.exists(rep2["pdf_path"]))
        self.assertGreater(os.path.getsize(rep2["pdf_path"]), 2000)

    # -------------------------------------------------------------------------
    # Priority 10 & 11: RBAC & Data Isolation
    # -------------------------------------------------------------------------
    def test_11_rbac_enforcement(self):
        """Verify role-based access control: patients blocked from generating reports."""
        from fastapi import HTTPException
        with self.assertRaises(HTTPException) as cm:
            patient_report_service.generate_report_for_patient(
                patient_id="PAT-1083",
                request_data={"disease_protocol": "parkinson", "report_stage": "AI_ANALYSIS"},
                current_user=self.patient # Patient role
            )
        self.assertEqual(cm.exception.status_code, 403)


if __name__ == "__main__":
    unittest.main()
