"""
API tests for Voice Phonation Prediction Endpoints (Layer 2 & Layer 3).
Tests:
- POST /predict/voice and POST /api/parkinson/voice/predict
- Valid WAV phonation file
- Biomarker extraction and TreeExplainer SHAP attribution
- Unsupported format (.txt) rejection (400)
- Missing file payload rejection (400/422)
"""

import pytest


class TestVoiceApi:

    def test_predict_voice_success(self, client, sample_voice_path):
        with open(sample_voice_path, "rb") as f:
            resp = client.post(
                "/api/parkinson/voice/predict",
                files={"file": ("voice.wav", f, "audio/wav")},
                data={"patient_id": "PAT-1083"}
            )
        assert resp.status_code == 200
        data = resp.json()
        assert "prediction" in data
        assert data["prediction"] in ["Parkinson", "Normal"]
        assert 0.0 <= data["confidence"] <= 100.0
        assert "acoustic_features" in data
        assert "shap" in data or "shap_explanation" in data

    def test_predict_voice_invalid_format(self, client, invalid_text_file):
        with open(invalid_text_file, "rb") as f:
            resp = client.post(
                "/api/parkinson/voice/predict",
                files={"file": ("recording.txt", f, "text/plain")},
                data={"patient_id": "PAT-1083"}
            )
        assert resp.status_code == 400

    def test_predict_voice_missing_file(self, client):
        resp = client.post("/api/parkinson/voice/predict", data={"patient_id": "PAT-1083"})
        assert resp.status_code in [400, 422]
