"""
NeuroFusionAI Centralized Configuration Module.
Powered by Pydantic Settings with automatic environment file discovery (.env.local, .env),
type validation, path resolution, and enterprise production security defaults.
"""

import os
from typing import List, Optional
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Determine absolute anchors
CORE_DIR = os.path.dirname(os.path.abspath(__file__))
APP_DIR = os.path.dirname(CORE_DIR)
BACKEND_DIR = os.path.dirname(APP_DIR)
PROJECT_ROOT = os.path.dirname(BACKEND_DIR)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(
            os.path.join(PROJECT_ROOT, ".env.local"),
            os.path.join(PROJECT_ROOT, ".env"),
            os.path.join(BACKEND_DIR, ".env.local"),
            os.path.join(BACKEND_DIR, ".env")
        ),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # -------------------------------------------------------------------------
    # Application Configuration
    # -------------------------------------------------------------------------
    APP_NAME: str = Field(default="NeuroFusionAI - Parkinson Diagnostic Engine")
    APP_ENV: str = Field(default="production")
    DEBUG: bool = Field(default=False)
    HOST: str = Field(default="127.0.0.1")
    PORT: int = Field(default=8000)
    API_VERSION: str = Field(default="v1")
    LOG_LEVEL: str = Field(default="INFO")

    # -------------------------------------------------------------------------
    # Database Configuration (Neon Cloud PostgreSQL Primary)
    # -------------------------------------------------------------------------
    DATABASE_URL: Optional[str] = Field(
        default=None,
        description="Primary pooled PostgreSQL / Neon database connection string."
    )
    NEON_DATABASE_URL: Optional[str] = Field(
        default=None,
        description="Alias for Neon Cloud PostgreSQL URL."
    )
    SQLITE_DATABASE_PATH: str = Field(
        default=os.path.join(BACKEND_DIR, "uploads", "parkinson_neon_store.db"),
        description="Emergency offline local fallback database path."
    )
    DB_POOL_SIZE: int = Field(default=5)
    DB_MAX_OVERFLOW: int = Field(default=10)
    DB_POOL_TIMEOUT: int = Field(default=30)
    DB_POOL_RECYCLE: int = Field(default=300)

    # -------------------------------------------------------------------------
    # Security & Authentication Configuration
    # -------------------------------------------------------------------------
    JWT_SECRET_KEY: str = Field(
        default="neurofusion-production-jwt-ecdsa-key-98472-clinical-sec",
        description="Cryptographic secret key for signing JWT bearer tokens."
    )
    JWT_ALGORITHM: str = Field(default="HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=1440)  # 24 hours
    REFRESH_TOKEN_EXPIRE_MINUTES: int = Field(default=10080) # 7 days
    PASSWORD_HASH_ALGORITHM: str = Field(default="bcrypt")

    # -------------------------------------------------------------------------
    # Storage & Upload Paths
    # -------------------------------------------------------------------------
    STORAGE_ROOT: str = Field(default=os.path.join(BACKEND_DIR, "uploads", "medical_storage"))
    PATIENT_STORAGE_ROOT: str = Field(default=os.path.join(PROJECT_ROOT, "storage"))
    PATIENTS_DIR: str = Field(default=os.path.join(PROJECT_ROOT, "storage", "patients"))
    PATIENT_REPORTS_DIR: str = Field(default=os.path.join(PROJECT_ROOT, "storage", "patient_reports"))
    UPLOAD_DIR: str = Field(default=os.path.join(BACKEND_DIR, "uploads"))
    STATIC_DIR: str = Field(default=os.path.join(BACKEND_DIR, "static"))
    REPORT_DIR: str = Field(default=os.path.join(BACKEND_DIR, "storage", "reports"))
    PREDICTION_DIR: str = Field(default=os.path.join(BACKEND_DIR, "uploads", "predictions"))
    EXPLAINABILITY_DIR: str = Field(default=os.path.join(BACKEND_DIR, "uploads", "medical_storage", "gradcam"))
    MAX_UPLOAD_SIZE_MB: int = Field(default=25)
    TESTING_DIR: str = Field(default=os.path.join(PROJECT_ROOT, "testing"))
    TESTING_INPUTS_DIR: str = Field(default=os.path.join(PROJECT_ROOT, "testing", "inputs"))
    TESTING_RESULTS_DIR: str = Field(default=os.path.join(PROJECT_ROOT, "testing", "results"))

    # -------------------------------------------------------------------------
    # Machine Learning & Checkpoint Configuration
    # -------------------------------------------------------------------------
    MODEL_ROOT: str = Field(default=PROJECT_ROOT)
    CHECKPOINT_DIR: str = Field(default=os.path.join(PROJECT_ROOT, "outputs", "checkpoints"))

    MRI_MODEL_PATH: str = Field(
        default=os.path.join(PROJECT_ROOT, "outputs", "checkpoints", "mri_best.pth")
    )
    SPIRAL_MODEL_PATH: str = Field(
        default=os.path.join(PROJECT_ROOT, "outputs", "checkpoints", "image_best.pth")
    )
    VOICE_PYTORCH_PATH: str = Field(
        default=os.path.join(PROJECT_ROOT, "outputs", "checkpoints", "voice_mlp_best.pth")
    )
    VOICE_CATBOOST_PATH: str = Field(
        default=os.path.join(PROJECT_ROOT, "outputs", "checkpoints", "voice_best_model.pkl")
    )
    VOICE_SCALER_PATH: str = Field(
        default=os.path.join(PROJECT_ROOT, "outputs", "checkpoints", "voice_scaler.pkl")
    )
    TELEMONITOR_PYTORCH_PATH: str = Field(
        default=os.path.join(PROJECT_ROOT, "outputs", "checkpoints", "telemonitor_mlp_best.pth")
    )
    TELEMONITOR_XGB_PATH: str = Field(
        default=os.path.join(PROJECT_ROOT, "outputs", "checkpoints", "telemonitor_best_model.pkl")
    )
    TELEMONITOR_SCALER_PATH: str = Field(
        default=os.path.join(PROJECT_ROOT, "outputs", "checkpoints", "telemonitor_scaler.pkl")
    )
    FUSION_MODEL_PATH: str = Field(
        default=os.path.join(PROJECT_ROOT, "outputs", "checkpoints", "fusion_best.pth")
    )

    MODEL_DEVICE: str = Field(default="auto")  # 'auto', 'cuda', or 'cpu'
    MODEL_BATCH_SIZE: int = Field(default=1)
    MODEL_TIMEOUT_SECONDS: int = Field(default=30)

    # -------------------------------------------------------------------------
    # CORS & Application URLs
    # -------------------------------------------------------------------------
    FRONTEND_URL: str = Field(default="http://localhost:5173")
    ALLOWED_ORIGINS: List[str] = Field(
        default=[
            "http://localhost:5173",
            "http://localhost:3000",
            "http://localhost:8000",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:8000",
            "*"
        ]
    )

    def get_effective_database_url(self) -> str:
        """Resolve active database URL preferring Neon Cloud URL."""
        return self.NEON_DATABASE_URL or self.DATABASE_URL or ""

    def ensure_directories(self):
        """Create all required persistent directories safely."""
        for d in [
            self.UPLOAD_DIR,
            self.STATIC_DIR,
            self.REPORT_DIR,
            self.STORAGE_ROOT,
            self.PATIENT_STORAGE_ROOT,
            self.PATIENTS_DIR,
            self.PATIENT_REPORTS_DIR,
            os.path.join(self.STORAGE_ROOT, "audio"),
            os.path.join(self.STORAGE_ROOT, "spiral"),
            os.path.join(self.STORAGE_ROOT, "mri"),
            os.path.join(self.STORAGE_ROOT, "telemonitor"),
            os.path.join(self.STORAGE_ROOT, "gradcam"),
            os.path.join(self.STORAGE_ROOT, "shap"),
        ]:
            os.makedirs(d, exist_ok=True)


# Global settings singleton
settings = Settings()
settings.ensure_directories()

