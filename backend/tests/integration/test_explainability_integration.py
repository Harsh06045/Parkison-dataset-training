"""
Integration tests for Explainability Modules (Grad-CAM + SHAP) (Layer 5).
Verifies:
- Grad-CAM heatmap overlays are saved to disk and accessible via static router
- SHAP summary and force plot files are generated and valid
"""

import os
import pytest
from app.services.gradcam_service import run_gradcam
from app.services.shap_service import run_shap_analysis


class TestExplainabilityIntegration:

    def test_spiral_gradcam_overlay_accessible(self, client, sample_spiral_path):
        res = run_gradcam("spiral", sample_spiral_path)
        overlay_url = res["overlay"]
        # Fetch through backend client
        resp = client.get(overlay_url)
        assert resp.status_code == 200
        assert resp.headers["content-type"].startswith("image/")

    def test_voice_shap_plots_generated(self, client, sample_voice_path):
        res = run_shap_analysis("voice", sample_voice_path)
        summary_url = res["summary"]
        resp = client.get(summary_url)
        assert resp.status_code == 200
        assert resp.headers["content-type"].startswith("image/")

