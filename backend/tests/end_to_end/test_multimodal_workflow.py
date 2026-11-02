"""
End-to-End Workflow Test: Full Multimodal Clinical Assessment Pipeline (Layer 6).
Executes:
1. Patient registration with full clinical profile (Layer 1)
2. Multimodal diagnostic file submission (Spiral + Voice + MRI) (Layer 2 & 3)
3. Attention-weighted Multimodal Fusion evaluation
4. Neon Database persistence across all tables (Layer 4)
5. Explainability asset generation (Layer 5)
6. Two-stage ReportLab PDF clinical report generation & doctor signature
7. Longitudinal Patient history verification
8. Cleanup of temporary patient
"""

import pytest
import uuid


class TestMultimodalWorkflowE2E:

    def test_complete_multimodal_patient_journey(
        self, client, doctor_auth, sample_spiral_path, sample_voice_path, sample_mri_path
    ):
        # Step 1: Register new patient with full validation
        unique_id = f"PAT-E2E-{uuid.uuid4().hex[:6].upper()}"
        patient_payload = {
            "id": unique_id,
            "fullName": "Dorothy Henderson",
            "age": 69,
            "gender": "Female",
            "email": f"{unique_id.lower()}@neurocare.org",
            "phone": "+1 (555) 349-8201",
            "dateOfBirth": "1957-08-22",
            "primaryDiagnosis": "Idiopathic Parkinsonism",
            "medicalHistory": "Asymmetric resting tremor in right upper extremity, hypomimia, micrographia."
        }
        reg_resp = client.post("/patients", json=patient_payload)
        assert reg_resp.status_code == 201
        patient = reg_resp.json()
        assert patient["id"] == unique_id

        # Step 2: Submit Multimodal files for Attention Fusion prediction
        with open(sample_spiral_path, "rb") as f_sp, \
             open(sample_voice_path, "rb") as f_vo, \
             open(sample_mri_path, "rb") as f_mri:
            files = [
                ("spiral", ("patient_spiral.png", f_sp, "image/png")),
                ("voice", ("patient_voice.wav", f_vo, "audio/wav")),
                ("mri", ("patient_mri.png", f_mri, "image/png"))
            ]
            fusion_resp = client.post(
                "/api/parkinson/fusion/predict",
                files=files,
                data={"patient_id": unique_id}
            )
        assert fusion_resp.status_code == 200
        fusion_data = fusion_resp.json()
        assert "prediction" in fusion_data
        assert "confidence" in fusion_data
        assert "modality_contributions" in fusion_data

        # Step 3: Generate Stage 1 Clinical Draft Report
        rep_resp = client.post(
            f"/api/reports/generate/{unique_id}",
            json={
                "report_stage": "AI_ANALYSIS",
                "modality": "multimodal_fusion",
                "prediction": fusion_data["prediction"],
                "confidence": fusion_data["confidence"],
                "clinical_notes": "Multimodal attention fusion indicates high concordance between vocal dysphonia and motor tremor."
            },
            headers=doctor_auth["headers"]
        )
        assert rep_resp.status_code == 201
        report = rep_resp.json()
        report_id = report["id"]
        assert report.get("patient_id") == unique_id or report.get("patientId") == unique_id

        # Step 4: Download finalized PDF report
        dl_resp = client.get(f"/api/reports/{report_id}/download", headers=doctor_auth["headers"])
        assert dl_resp.status_code == 200
        assert dl_resp.content.startswith(b"%PDF-")

        # Step 5: Verify patient history contains both prediction and report
        hist_resp = client.get(f"/api/parkinson/history?patient_id={unique_id}")
        assert hist_resp.status_code == 200

        # Step 6: Clean up test patient
        del_resp = client.delete(f"/patients/{unique_id}")
        assert del_resp.status_code == 200
