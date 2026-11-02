"""
Unit tests for Diagnostic Prediction Services.
Tests:
- Spiral prediction service
- Voice prediction service
- MRI prediction service
- Telemonitoring prediction service (Motor UPDRS & Total UPDRS)
- Multimodal Attention Fusion service
"""

import pytest
import numpy as np
from app.services.spiral_service import predict_spiral
from app.services.voice_service import predict_voice
from app.services.mri_service import predict_mri
from app.services.telemonitor_service import predict_telemonitor
from app.services.fusion_service import predict_fusion


class TestPredictionServices:

    def test_spiral_service_output_contract(self, sample_spiral_path):
        res = predict_spiral(sample_spiral_path)
        assert set(["prediction", "confidence", "uncertainty", "raw_probability", "embedding"]).issubset(res.keys())
        assert res["prediction"] in ["Parkinson", "Normal"]
        assert 0.0 <= res["confidence"] <= 100.0

    def test_voice_service_output_contract(self, sample_voice_path):
        res = predict_voice(sample_voice_path)
        assert set(["prediction", "confidence", "features", "acoustic_features", "uncertainty"]).issubset(res.keys())
        assert res["prediction"] in ["Parkinson", "Normal"]

    def test_mri_service_output_contract(self, sample_mri_path):
        res = predict_mri(sample_mri_path)
        assert set(["prediction", "confidence", "embedding"]).issubset(res.keys())
        assert res["prediction"] in ["Parkinson", "Normal"]

    def test_telemonitor_service_output_contract(self, sample_telemonitor_path):
        res = predict_telemonitor(sample_telemonitor_path)
        assert "motor_updrs" in res
        assert "total_updrs" in res
        assert "confidence_intervals" in res
        assert 0.0 <= res["motor_updrs"] <= 108.0
        assert 0.0 <= res["total_updrs"] <= 176.0

    def test_fusion_service_all_modalities(self, sample_spiral_path, sample_voice_path, sample_mri_path, sample_telemonitor_path):
        """Test fusion model combining representations from modalities."""
        sp_res = predict_spiral(sample_spiral_path)
        mri_res = predict_mri(sample_mri_path)
        vo_res = predict_voice(sample_voice_path)
        tele_res = predict_telemonitor(sample_telemonitor_path)

        res = predict_fusion(
            drawing_embed=sp_res["embedding"],
            mri_embed=mri_res["embedding"],
            voice_tensor=vo_res["tensor"],
            tele_tensor=tele_res["tensor"]
        )
        assert "prediction" in res
        assert "confidence" in res
        assert "modality_contributions" in res
        assert len(res["modality_contributions"]) == 4
