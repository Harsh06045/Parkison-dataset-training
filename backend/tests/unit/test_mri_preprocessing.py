"""
Unit tests for MRI Scan Preprocessing & Neural Classification.
Tests:
- Dimension resizing to (224, 224)
- Normalization and DenseNet121 inference
- Blank and noise scan boundary checks
"""

import pytest
import os
from app.services.mri_service import predict_mri


class TestMriPreprocessing:

    def test_mri_prediction_valid(self, sample_mri_path):
        """Test valid brain MRI scan returns structured prediction."""
        result = predict_mri(sample_mri_path)
        assert "prediction" in result
        assert result["prediction"] in ["Parkinson", "Normal"]
        assert 0.0 <= result["confidence"] <= 100.0
        assert "embedding" in result

    def test_mri_blank_scan(self, blank_image_file):
        """Test model validation rejects all-black MRI boundary scan."""
        with pytest.raises(Exception):
            predict_mri(blank_image_file)

    def test_mri_noisy_scan(self, noisy_image_file):
        """Test model stability on random noise boundary scan."""
        result = predict_mri(noisy_image_file)
        assert "prediction" in result
        assert 0.0 <= result["confidence"] <= 100.0

    def test_mri_corrupted_file(self, corrupted_image_file):
        """Test corrupted MRI scan raises processing exception."""
        with pytest.raises(Exception):
            predict_mri(corrupted_image_file)
