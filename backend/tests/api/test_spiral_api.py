"""
API tests for Spiral Drawing Prediction Endpoints (Layer 2 & Layer 3).
Tests:
- POST /predict/spiral and POST /api/parkinson/spiral/predict
- Valid PNG/JPG upload
- Unsupported format (.txt) rejection (400)
- Missing file payload rejection (400/422)
- Output contract: prediction, confidence (0-100), uncertainty, gradcam
"""

import pytest


class TestSpiralApi:

    def test_predict_spiral_success(self, client, sample_spiral_path):
        with open(sample_spiral_path, "rb") as f:
            resp = client.post(
                "/api/parkinson/spiral/predict",
                files={"file": ("spiral.png", f, "image/png")},
                data={"patient_id": "PAT-1083"}
            )
        assert resp.status_code == 200
        data = resp.json()
        assert "prediction" in data
        assert data["prediction"] in ["Parkinson", "Normal"]
        assert 0.0 <= data["confidence"] <= 100.0
        assert "gradcam" in data
        assert "uncertainty" in data

    def test_predict_spiral_invalid_extension(self, client, invalid_text_file):
        with open(invalid_text_file, "rb") as f:
            resp = client.post(
                "/api/parkinson/spiral/predict",
                files={"file": ("notes.txt", f, "text/plain")},
                data={"patient_id": "PAT-1083"}
            )
        assert resp.status_code == 400

    def test_predict_spiral_missing_file(self, client):
        resp = client.post("/api/parkinson/spiral/predict", data={"patient_id": "PAT-1083"})
        assert resp.status_code in [400, 422]
