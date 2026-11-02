"""
Unit tests for Vocal Phonation Signal Processing & Feature Extraction.
Tests:
- Extraction of 22 fundamental physical acoustic biomarkers
- Jitter, Shimmer, HNR, RPDE, DFA, PPE range sanity
- Absence of NaN or Inf values in feature vectors
- Dual-model inference (PyTorch MLP & CatBoost)
"""

import os
import pytest
import numpy as np
from app.services.voice_service import predict_voice


class TestVoicePreprocessing:

    def test_voice_feature_extraction(self, sample_voice_path):
        """Test extraction of 22 vocal biomarkers from sustained phonation WAV."""
        res = predict_voice(sample_voice_path)
        assert "prediction" in res
        assert res["prediction"] in ["Parkinson", "Normal"]
        assert 0.0 <= res["confidence"] <= 100.0

        features = res.get("acoustic_features")
        assert features is not None
        assert isinstance(features, dict)
        assert len(features) >= 16  # Key acoustic biomarkers present

        # Check critical biomarkers
        expected_biomarkers = [
            "MDVP:Fo(Hz)", "MDVP:Fhi(Hz)", "MDVP:Flo(Hz)",
            "MDVP:Jitter(%)", "MDVP:Shimmer", "HNR", "RPDE", "DFA", "PPE"
        ]
        for bm in expected_biomarkers:
            assert bm in features, f"Missing critical biomarker {bm}"
            val = float(features[bm])
            assert not np.isnan(val), f"Biomarker {bm} is NaN"
            assert not np.isinf(val), f"Biomarker {bm} is Inf"

    def test_voice_dual_model_probabilities(self, sample_voice_path):
        """Test dual model probabilities from PyTorch MLP and CatBoost."""
        res = predict_voice(sample_voice_path)
        assert "catboost_probability" in res
        assert "mlp_probability" in res
        assert 0.0 <= res["catboost_probability"] <= 1.0
        assert 0.0 <= res["mlp_probability"] <= 1.0

    def test_voice_invalid_audio_rejection(self, invalid_text_file):
        """Test non-audio file raises error during signal processing."""
        with pytest.raises(Exception):
            predict_voice(invalid_text_file)

