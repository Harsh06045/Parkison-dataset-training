"""
NeuroFusionAI API v1 Master Router Aggregator.
Collects and prefixes all modular diagnostic routers.
"""

from fastapi import APIRouter

from app.api import (
    health,
    parkinson,
    predict,
    fusion,
    reports,
    explain,
    testing,
    report
)
from app.api.v1 import assessments

api_v1_router = APIRouter(prefix="/v1")

# System health & readiness
api_v1_router.include_router(health.router, tags=["health"])

# Primary standardized Parkinson diagnostic suite
api_v1_router.include_router(parkinson.router, prefix="/parkinson", tags=["parkinson"])

# Predictions & Multimodal Attention Fusion
api_v1_router.include_router(predict.router, prefix="/predict", tags=["predictions"])
api_v1_router.include_router(fusion.router, prefix="/predict", tags=["multimodal-fusion"])

# Two-stage clinical patient reports
api_v1_router.include_router(reports.router, prefix="/reports", tags=["patient-reports"])
api_v1_router.include_router(report.router, prefix="/report", tags=["legacy-reports"])

# Patient Assessments Workflow & Isolated Storage Reports
api_v1_router.include_router(assessments.router, tags=["assessments"])

# Explainability (Grad-CAM & SHAP)
api_v1_router.include_router(explain.router, tags=["explainability"])

# Clinical validation & evaluation benchmarks
api_v1_router.include_router(testing.router, prefix="/testing", tags=["testing-dashboard"])

