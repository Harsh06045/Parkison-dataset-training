"""
End-to-End Workflow Test: Spiral Drawing Clinical Diagnostic Pipeline (Layer 6).
Executes complete clinical cycle:
1. Patient verification in registry
2. Spiral sketch upload and validation
3. Deep neural inference (ResNet18)
4. Grad-CAM visual attention overlay computation
5. Neon Cloud PostgreSQL record persistence
6. Durable storage of original image and overlay
7. Generation of downloadable ReportLab clinical PDF report
"""

import pytest


class TestSpiralWorkflowE2E:

    def test_full_spiral_patient_workflow(self, client, doctor_auth, sample_spiral_path):
        # 1. Verify Patient exists
        pat_resp = client.get("/patients/PAT-1083")
        assert pat_resp.status_code == 200
        patient = pat_resp.json()
        assert patient["id"] == "PAT-1083"

        # 2. Upload spiral image for prediction
        with open(sample_spiral_path, "rb") as f:
            pred_resp = client.post(
                "/api/parkinson/spiral/predict",
                files={"file": ("e2e_spiral.png", f, "image/png")},
                data={"patient_id": "PAT-1083"}
            )
        assert pred_resp.status_code == 200
        pred_data = pred_resp.json()
        assert "prediction" in pred_data
        assert "confidence" in pred_data
        assert "gradcam" in pred_data

        # 3. Retrieve stored overlay plot
        gradcam_val = pred_data["gradcam"]
        gradcam_url = gradcam_val.get("overlay") if isinstance(gradcam_val, dict) else gradcam_val
        img_resp = client.get(gradcam_url)
        assert img_resp.status_code == 200

        # 4. Generate Clinical PDF Report for this test
        rep_resp = client.post(
            "/api/reports/generate/PAT-1083",
            json={
                "report_stage": "AI_ANALYSIS",
                "modality": "spiral",
                "prediction": pred_data["prediction"],
                "confidence": pred_data["confidence"],
                "clinical_notes": "E2E automated validation test for spiral tremor."
            },
            headers=doctor_auth["headers"]
        )
        assert rep_resp.status_code == 201
        report = rep_resp.json()
        report_id = report["id"]

        # 5. Download and verify binary PDF
        dl_resp = client.get(f"/api/reports/{report_id}/download", headers=doctor_auth["headers"])
        assert dl_resp.status_code == 200
        assert dl_resp.content.startswith(b"%PDF-")
        assert len(dl_resp.content) > 1000
