from pydantic import BaseModel
from typing import Dict, Optional

class HealthResponse(BaseModel):
    status: str

class ImagePredictionResponse(BaseModel):
    prediction: str
    confidence: float
    gradcam: str

class ShapResponse(BaseModel):
    summary: str
    bar: str
    force: Optional[str] = None

class VoicePredictionResponse(BaseModel):
    prediction: str
    confidence: float
    shap: ShapResponse

class TelemonitorPredictionResponse(BaseModel):
    motor_updrs: float
    total_updrs: float
    shap: ShapResponse

class FusionPredictionResponse(BaseModel):
    prediction: str
    confidence: float
    fusion: bool
