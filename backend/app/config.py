"""
Backwards-compatible bridge for app.config.
Exports all canonical constants from app.core.config.settings while preserving
existing import references throughout the codebase.
"""

from app.core.config import (
    settings,
    PROJECT_ROOT,
    BACKEND_DIR,
    APP_DIR
)

# Directory constants
UPLOAD_DIR = settings.UPLOAD_DIR
STATIC_DIR = settings.STATIC_DIR
CHECKPOINTS_DIR = settings.CHECKPOINT_DIR
STORAGE_ROOT = settings.STORAGE_ROOT
REPORT_DIR = settings.REPORT_DIR
PATIENT_STORAGE_ROOT = settings.PATIENT_STORAGE_ROOT
PATIENTS_DIR = settings.PATIENTS_DIR
PATIENT_REPORTS_DIR = settings.PATIENT_REPORTS_DIR

# Checkpoint paths
MRI_MODEL_PATH = settings.MRI_MODEL_PATH
SPIRAL_MODEL_PATH = settings.SPIRAL_MODEL_PATH
VOICE_PYTORCH_PATH = settings.VOICE_PYTORCH_PATH
VOICE_CATBOOST_PATH = settings.VOICE_CATBOOST_PATH
VOICE_SCALER_PATH = settings.VOICE_SCALER_PATH
TELEMONITOR_PYTORCH_PATH = settings.TELEMONITOR_PYTORCH_PATH
TELEMONITOR_XGB_PATH = settings.TELEMONITOR_XGB_PATH
TELEMONITOR_SCALER_PATH = settings.TELEMONITOR_SCALER_PATH
FUSION_MODEL_PATH = settings.FUSION_MODEL_PATH

# Server parameters
HOST = settings.HOST
PORT = settings.PORT
APP_NAME = settings.APP_NAME
DEBUG = settings.DEBUG
