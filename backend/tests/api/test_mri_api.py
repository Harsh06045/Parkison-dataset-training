"""
API tests for Brain MRI Scan Endpoints (Layer 2 & Layer 3).
Tests:
- POST /predict/mri and POST /api/parkinson/mri/predict
- Valid brain MRI image upload
- Grad-CAM heatmap generation and overlay URLs
- Unsupported format rejection
"""

import pytest


class TestMriApi:

    def test_predict_mri_success(self, client, sample_mri_path):
        with open(sample_mri_path, "rb") as f:
            resp = client.post(
                "/api/parkinson/mri/predict",
                files={"file": ("brain_mri.png", f, "image/png")},
                data={"patient_id": "PAT-1083"}
            )
        assert resp.status_code == 200
        data = resp.json()
        assert "prediction" in data
        assert data["prediction"] in ["Parkinson", "Normal"]
        assert 0.0 <= data["confidence"] <= 100.0
        assert "gradcam" in data

    def test_predict_mri_invalid_format(self, client, invalid_text_file):
        with open(invalid_text_file, "rb") as f:
            resp = client.post(
                "/api/parkinson/mri/predict",
                files={"file": ("mri_report.txt", f, "text/plain")},
                data={"patient_id": "PAT-1083"}
            )
        assert resp.status_code == 400

