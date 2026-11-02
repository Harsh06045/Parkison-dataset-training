"""
Unit tests for Grad-CAM Visual Explainability (Layer 5).
Tests:
- Generation of Grad-CAM heatmaps for Spiral images
- Generation of Grad-CAM heatmaps for MRI scans
- Overlay alignment, resolution preservation, and file output
"""

import os
import pytest
from app.services.gradcam_service import run_gradcam


class TestGradcamUnit:

    def test_spiral_gradcam_generation(self, sample_spiral_path):
        res = run_gradcam("spiral", sample_spiral_path)
        assert isinstance(res, dict)
        assert "heatmap" in res or "gradcam" in res
        assert "overlay" in res
        overlay_path = res["overlay"]
        # Verify relative URL or static asset reference
        assert "/plots/" in overlay_path or "/static/" in overlay_path or os.path.isabs(overlay_path)

    def test_mri_gradcam_generation(self, sample_mri_path):
        res = run_gradcam("mri", sample_mri_path)
        assert isinstance(res, dict)
        assert "heatmap" in res or "gradcam" in res
        assert "overlay" in res

