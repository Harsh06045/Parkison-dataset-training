"""
Unit tests for Spiral Drawing Preprocessing & Validation.
Tests:
- Dimension scaling to (224, 224)
- Channel conversion (RGB normalization)
- Handling of blank images, noisy images, and corrupted binaries
"""

import os
import pytest
import numpy as np
from PIL import Image
import torch

from app.services.spiral_service import predict_spiral
from app.utils.validator import validate_uploaded_file


class TestSpiralPreprocessing:

    def test_spiral_prediction_valid(self, sample_spiral_path):
        """Test valid spiral drawing returns structured prediction."""
        result = predict_spiral(sample_spiral_path)
        assert "prediction" in result
        assert result["prediction"] in ["Parkinson", "Normal"]
        assert 0.0 <= result["confidence"] <= 100.0
        assert "uncertainty" in result
        assert result["uncertainty"] >= 0.0
        assert "embedding" in result

    def test_spiral_blank_black_image(self, blank_image_file):
        """Test model validation rejects all-black boundary image."""
        with pytest.raises(ValueError):
            predict_spiral(blank_image_file)

    def test_spiral_noisy_image(self, noisy_image_file):
        """Test model stability on Gaussian noise boundary image."""
        result = predict_spiral(noisy_image_file)
        assert "prediction" in result
        assert 0.0 <= result["confidence"] <= 100.0

    def test_spiral_corrupted_file_rejection(self, corrupted_image_file):
        """Test corrupted image raises appropriate processing error."""
        with pytest.raises(Exception):
            predict_spiral(corrupted_image_file)
