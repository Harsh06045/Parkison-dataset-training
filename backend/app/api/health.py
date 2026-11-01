from fastapi import APIRouter
from app.models.loader import loader

router = APIRouter()

@router.get("/health", tags=["health"])
def health_check():
    """
    Comprehensive system health check reporting operational status for every
    individual machine learning model, scaler, and accelerator device.
    """
    models_status = {
        "mri_classifier": loader.mri_model is not None,
        "spiral_classifier": loader.spiral_model is not None,
        "voice_mlp": loader.voice_mlp_model is not None,
        "voice_catboost": loader.voice_catboost_model is not None,
        "telemonitor_mlp": loader.telemonitor_mlp_model is not None,
        "telemonitor_xgboost": loader.telemonitor_xgb_model is not None,
        "multimodal_fusion": loader.fusion_model is not None,
        "voice_scaler": loader.voice_scaler is not None,
        "telemonitor_scaler": loader.telemonitor_scaler is not None
    }

    all_models_ready = all(models_status.values())

    return {
        "status": "healthy" if all_models_ready else "degraded",
        "api_version": "2.0.0",
        "device": str(loader.device),
        "all_models_loaded": all_models_ready,
        "models": models_status
    }
