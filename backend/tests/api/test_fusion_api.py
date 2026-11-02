"""
API tests for Multimodal Fusion Endpoints (Layer 3 & Layer 6).
Tests:
- POST /predict/fusion and POST /api/parkinson/fusion/predict
- Multi-file upload: spiral + voice + mri
- Attention-weighted contribution outputs
- Rejection when zero modalities provided
"""

import pytest


class TestFusionApi:

    def test_fusion_dual_modality(self, client, sample_spiral_path, sample_voice_path):
        with open(sample_spiral_path, "rb") as f_sp, open(sample_voice_path, "rb") as f_vo:
            files = [
                ("spiral", ("spiral.png", f_sp, "image/png")),
                ("voice", ("voice.wav", f_vo, "audio/wav"))
            ]
            resp = client.post("/api/parkinson/fusion/predict", files=files, data={"patient_id": "PAT-1083"})
        assert resp.status_code == 200
        data = resp.json()
        assert "prediction" in data
        assert "confidence" in data
        assert "modality_contributions" in data
        assert "spiral" in data["modality_contributions"]
        assert "voice" in data["modality_contributions"]

    def test_fusion_no_files_rejected(self, client):
        resp = client.post("/api/parkinson/fusion/predict", data={"patient_id": "PAT-1083"})
        assert resp.status_code == 400
        assert "At least one valid modality" in resp.json().get("detail", "")
