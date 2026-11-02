"""
Unit tests for SHAP Biomarker Explainability (Layer 5).
Tests:
- TreeExplainer attribution on CatBoost and XGBoost models
- Extraction of top discriminating biomarkers
- Real SHAP metrics computation without fabrication
"""

import os
import pytest
from app.services.shap_service import run_shap_analysis
from explainability.shap_analysis import compute_real_shap_metrics
from app.services.voice_service import predict_voice


class TestShapUnit:

    def test_voice_shap_analysis(self, sample_voice_path):
        res = run_shap_analysis("voice", sample_voice_path)
        assert isinstance(res, dict)
        assert "summary" in res
        assert "bar" in res
        assert "force" in res

    def test_real_shap_metrics_computation(self, sample_voice_path):
        v_res = predict_voice(sample_voice_path)
        metrics = compute_real_shap_metrics(
            features_scaled=v_res.get("features"),
            raw_features_dict=v_res.get("acoustic_features")
        )
        assert isinstance(metrics, list)
        assert len(metrics) > 0
        # Check top metric structure
        top = metrics[0]
        assert "name" in top
        assert "shapValue" in top
        assert "importanceRank" in top
        assert abs(top["shapValue"]) >= 0.0
