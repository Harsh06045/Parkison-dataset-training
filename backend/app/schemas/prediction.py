from pydantic import BaseModel
from typing import Dict, Optional

class HealthResponse(BaseModel):
    status: str

class ImagePredictionResponse(BaseModel):
    prediction: str
    confidence: float
    gradcam: str
    uncertainty: Optional[float] = None
    quality: Optional[Dict] = None

class ShapResponse(BaseModel):
    summary: str
    bar: str
    force: Optional[str] = None

class VoicePredictionResponse(BaseModel):
    prediction: str
    confidence: float
    uncertainty: Optional[float] = None
    shap: ShapResponse
    acoustic_features: Optional[Dict] = None

class TelemonitorPredictionResponse(BaseModel):
    motor_updrs: float
    total_updrs: float
    motor_confidence_interval: Optional[list] = None
    total_confidence_interval: Optional[list] = None
    uncertainty_margin: Optional[float] = None
    clinical_data_type: Optional[str] = None
    shap: ShapResponse

class FusionPredictionResponse(BaseModel):
    prediction: str
    confidence: float
    fusion: bool
    uncertainty: Optional[float] = None
    modality_contributions: Optional[Dict[str, float]] = None
    present_modalities: Optional[list] = None
    missing_modalities: Optional[list] = None
    clinical_review: Optional[str] = None
    ood_analysis: Optional[Dict] = None
