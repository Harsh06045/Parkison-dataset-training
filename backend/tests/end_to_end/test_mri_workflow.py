"""
End-to-End Workflow Test: Brain MRI Scan Clinical Diagnostic Pipeline (Layer 6).
Executes complete clinical cycle:
1. Patient verification
2. Brain MRI scan upload
3. DenseNet121 neural inference
4. Grad-CAM visual explanation overlay
5. Database record creation in Neon PostgreSQL
6. Downloadable ReportLab medical report
"""

import pytest


class TestMriWorkflowE2E:

    def test_full_mri_patient_workflow(self, client, doctor_auth, sample_mri_path):
        # 1. Patient verification
        pat_resp = client.get("/patients/PAT-1083")
        assert pat_resp.status_code == 200

        # 2. Upload MRI scan
        with open(sample_mri_path, "rb") as f:
            pred_resp = client.post(
                "/api/parkinson/mri/predict",
                files={"file": ("e2e_mri.png", f, "image/png")},
                data={"patient_id": "PAT-1083"}
            )
        assert pred_resp.status_code == 200
        pred_data = pred_resp.json()
        assert "prediction" in pred_data
        assert "confidence" in pred_data
        assert "gradcam" in pred_data

        # 3. Download Grad-CAM overlay
        gradcam_val = pred_data["gradcam"]
        gradcam_url = gradcam_val.get("overlay") if isinstance(gradcam_val, dict) else gradcam_val
        img_resp = client.get(gradcam_url)
        assert img_resp.status_code == 200

        # 4. Generate report
        rep_resp = client.post(
            "/api/reports/generate/PAT-1083",
            json={
                "report_stage": "AI_ANALYSIS",
                "modality": "mri",
                "prediction": pred_data["prediction"],
                "confidence": pred_data["confidence"],
                "clinical_notes": "E2E automated validation test for structural brain MRI."
            },
            headers=doctor_auth["headers"]
        )
        assert rep_resp.status_code == 201
        report_id = rep_resp.json()["id"]

        # 5. Download Report PDF
        dl_resp = client.get(f"/api/reports/{report_id}/download", headers=doctor_auth["headers"])
        assert dl_resp.status_code == 200
        assert dl_resp.content.startswith(b"%PDF-")
