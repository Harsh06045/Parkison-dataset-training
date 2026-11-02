"""
Pydantic Schemas for NeuroFusionAI Automated Patient PDF Report Generation.
Supports AI Analysis Report vs. Final Clinical Report two-stage workflow,
disease-specific clinical validation protocols, and structured XAI/CDSS outputs.
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class EEGSignalInput(BaseModel):
    filename: Optional[str] = "patient_eeg_trace.edf"
    channel_count: Optional[int] = 8
    duration_sec: Optional[float] = 10.0
    sampling_rate_hz: Optional[int] = 256
    slowing_index: Optional[float] = 1.42
    dominant_band: Optional[str] = "Theta"
    delta_power: Optional[float] = 32.5
    theta_power: Optional[float] = 41.2
    alpha_power: Optional[float] = 18.7
    beta_power: Optional[float] = 7.6
    interpretation: Optional[str] = "Mild diffuse slowing consistent with frontotemporal/cortical dysfunction."


class GenerateReportRequest(BaseModel):
    doctor_id: Optional[str] = Field("DOC-8921", description="Assigned attending doctor ID")
    report_stage: Optional[str] = Field("FINAL_CLINICAL", description="Report stage: 'AI_ANALYSIS' or 'FINAL_CLINICAL'")
    disease: Optional[str] = Field("Parkinson's Disease", description="Alzheimer's or Parkinson's Disease")
    protocol: Optional[str] = Field("parkinson", description="Disease workflow protocol: 'alzheimer', 'parkinson', 'multimodal'")
    modality: Optional[str] = Field(None, description="Primary examination modality")
    prediction_id: Optional[str] = Field(None, description="Specific completed prediction/analysis ID to link")
    include_mri: Optional[bool] = Field(True, description="Include MRI and Grad-CAM findings if available")
    include_eeg: Optional[bool] = Field(False, description="Include EEG signal analysis (mandatory only if protocol requires EEG)")
    clinical_notes: Optional[str] = Field(None, description="Doctor's clinical impressions and instructions")
    is_approved: Optional[bool] = Field(False, description="Doctor's digital certification and approval flag")
    eeg_data: Optional[Dict[str, Any]] = Field(None, description="Optional custom EEG biomarkers")
    cdss_recommendations: Optional[List[str]] = Field(None, description="Optional custom CDSS clinical recommendations")
    hqdl_results: Optional[Dict[str, Any]] = Field(None, description="Optional Hybrid Quantum Decision Layer metrics")


class ReportResponse(BaseModel):
    id: str
    analysis_id: Optional[str] = None
    patient_id: str
    patient_name: str
    doctor_id: Optional[str] = None
    doctor_name: Optional[str] = None
    title: str
    report_stage: str = "AI_ANALYSIS"
    disease: str
    modality: str
    prediction: str
    confidence: float
    risk_level: str
    status: str
    is_approved: bool = False
    approved_by: Optional[str] = None
    approved_at: Optional[str] = None
    download_url: str
    created_at: Optional[str] = None


class ReportDetailResponse(ReportResponse):
    clinical_notes: Optional[str] = None
    file_size_bytes: int = 0
    generated_by: str
    report_data: Optional[Dict[str, Any]] = None
