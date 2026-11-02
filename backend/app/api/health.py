import os
from fastapi import APIRouter
from app.models.loader import loader
from app.db.session import check_connection
from app.config import UPLOAD_DIR, STATIC_DIR

router = APIRouter()

@router.get("/health", tags=["health"])
def health_check():
    """
    Comprehensive system health check reporting operational status for:
    - Every individual machine learning model, scaler, and accelerator device
    - Primary Neon Cloud PostgreSQL database connection
    - Local medical storage paths
    """
    models_status = loader.get_model_status()
    all_models_ready = all(models_status.values())
    
    db_status = check_connection()
    db_healthy = db_status.get("status") == "connected"

    overall_healthy = all_models_ready and db_healthy

    return {
        "status": "healthy" if overall_healthy else "degraded",
        "api_version": "2.0.0",
        "device": str(loader.device),
        "all_models_loaded": all_models_ready,
        "database": db_status,
        "storage": {
            "upload_dir_writable": os.access(UPLOAD_DIR, os.W_OK) if os.path.exists(UPLOAD_DIR) else False,
            "static_dir_readable": os.access(STATIC_DIR, os.R_OK) if os.path.exists(STATIC_DIR) else False,
        },
        "models": models_status
    }
