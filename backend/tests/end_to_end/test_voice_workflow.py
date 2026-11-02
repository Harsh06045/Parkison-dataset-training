"""
End-to-End Workflow Test: Vocal Phonation Clinical Diagnostic Pipeline (Layer 6).
Executes complete clinical cycle:
1. Patient record check
2. Voice audio upload (.wav)
3. 22-biomarker physical feature extraction
4. Dual MLP + CatBoost model inference
5. TreeExplainer SHAP attribution & feature plot generation
6. Database persistence into Neon PostgreSQL
7. Clinical Report generation and verified PDF retrieval
"""

import pytest


class TestVoiceWorkflowE2E:

    def test_full_voice_patient_workflow(self, client, doctor_auth, sample_voice_path):
        # 1. Check patient
        pat_resp = client.get("/patients/PAT-1083")
        assert pat_resp.status_code == 200

        # 2. Upload voice recording
        with open(sample_voice_path, "rb") as f:
            pred_resp = client.post(
                "/api/parkinson/voice/predict",
                files={"file": ("e2e_voice.wav", f, "audio/wav")},
                data={"patient_id": "PAT-1083"}
            )
        assert pred_resp.status_code == 200
        pred_data = pred_resp.json()
        assert "prediction" in pred_data
        assert "confidence" in pred_data
        assert "acoustic_features" in pred_data
        assert "shap" in pred_data

        # 3. Retrieve SHAP summary plot
        summary_url = pred_data.get("shap", {}).get("summary") or pred_data.get("shap_explanation", {}).get("summary_plot")
        if summary_url:
            shap_img_resp = client.get(summary_url)
            assert shap_img_resp.status_code == 200

        # 4. Generate report
        rep_resp = client.post(
            "/api/reports/generate/PAT-1083",
            json={
                "report_stage": "AI_ANALYSIS",
                "modality": "voice",
                "prediction": pred_data["prediction"],
                "confidence": pred_data["confidence"],
                "clinical_notes": "E2E automated validation test for acoustic phonation."
            },
            headers=doctor_auth["headers"]
        )
        assert rep_resp.status_code == 201
        report_id = rep_resp.json()["id"]

        # 5. Download Report PDF
        dl_resp = client.get(f"/api/reports/{report_id}/download", headers=doctor_auth["headers"])
        assert dl_resp.status_code == 200
        assert dl_resp.content.startswith(b"%PDF-")
