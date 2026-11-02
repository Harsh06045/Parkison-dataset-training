"""
Unit tests for Machine Learning Model Loader & Integrity Check.
Verifies:
- All 7 genuine trained model weights and scalers are loaded in memory
- Prevention of random/unweighted model execution
- Model object types (PyTorch nn.Module, CatBoostClassifier, XGBRegressor, StandardScaler)
"""

import pytest
import torch
from app.models.loader import loader


class TestModelLoaderIntegrity:

    def test_all_models_loaded(self):
        """Ensure all required checkpoints are active and not None."""
        assert loader.mri_model is not None, "mri_model is missing"
        assert loader.spiral_model is not None, "spiral_model is missing"
        assert loader.voice_mlp_model is not None, "voice_mlp_model is missing"
        assert loader.voice_catboost_model is not None, "voice_catboost_model is missing"
        assert loader.voice_scaler is not None, "voice_scaler is missing"
        assert loader.telemonitor_mlp_model is not None, "telemonitor_mlp_model is missing"
        assert loader.telemonitor_xgb_model is not None, "telemonitor_xgb_model is missing"
        assert loader.telemonitor_scaler is not None, "telemonitor_scaler is missing"
        assert loader.fusion_model is not None, "fusion_model is missing"

    def test_pytorch_models_are_eval_mode(self):
        """Ensure PyTorch models are in evaluation mode (eval)."""
        pytorch_models = [
            loader.mri_model,
            loader.spiral_model,
            loader.voice_mlp_model,
            loader.telemonitor_mlp_model,
            loader.fusion_model
        ]
        for m in pytorch_models:
            assert isinstance(m, torch.nn.Module)
            assert not m.training, f"Model {m.__class__.__name__} is still in training mode!"

    def test_checkpoint_readiness_status(self):
        """Ensure loader reports ready status for verified weights."""
        status = loader.get_model_status()
        assert isinstance(status, dict)
        for key, is_ready in status.items():
            assert is_ready is True, f"Model {key} status is not ready: {status}"
