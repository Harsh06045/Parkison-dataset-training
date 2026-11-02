# NeuroFusionAI – Centralized Prediction Pipeline

**System**: NeuroFusionAI End-to-End Prediction Architecture  
**Document**: Prediction Pipeline, Preprocessing, Service Layer & Schema Standards  
**Generated**: 2026-11-02  

---

## 1. Architectural Pipeline Workflow

```text
API Request
    │
    ▼
Request & Header Validation (X-Request-ID, Content-Type, Magic Bytes, Max Size)
    │
    ▼
Patient Authorization & RBAC Check (Doctor, Admin, Patient Ownership)
    │
    ▼
Medical File Ingestion & Staging (Temporary staging in backend/uploads/)
    │
    ▼
Signal & Image Preprocessing (22 Acoustic Biomarkers, 19 Telemon, 224x224 RGB Normalization)
    │
    ▼
Model Loader Checkpoint Verification (require_model guard)
    │
    ▼
Parallel / Ensemble Model Inference
    ├── PyTorch Deep Neural Network (MLP / ResNet / DenseNet)
    └── Gradient Boosted Decision Trees (CatBoost / XGBoost)
    │
    ▼
Prediction Output Validation (Probabilities, UPDRS Scores, Epistemic Uncertainty)
    │
    ▼
Explainability Generation
    ├── Grad-CAM Heatmap & Overlay (for Spiral & MRI)
    └── TreeExplainer SHAP Attribution (for Voice & Telemonitor)
    │
    ▼
Database Persistence (Write PredictionRecord & AuditLog to Neon PostgreSQL)
    │
    ▼
Durable Medical Object Storage (Compute SHA-256 Checksum, Generate Signed Access Token)
    │
    ▼
HTTP Response Serialisation (Standardised Pydantic Response Schema)
```

---

## 2. Standardized Prediction Response Schemas

Every prediction response returned across the API follows standardized Pydantic models:

### 2.1 Image Modalities (Spiral Drawing & Brain MRI)
```json
{
  "prediction_id": "PD-PRED-F4FFF4",
  "patient_id": "PAT-1083",
  "modality": "spiral",
  "prediction": "Parkinson",
  "confidence": 87.36,
  "uncertainty": 4.41,
  "quality": {
    "valid": true,
    "width": 800,
    "height": 600,
    "aspect_ratio": 1.33
  },
  "files": [
    {
      "id": "FILE-4C672109",
      "file_type": "spiral_png",
      "original_filename": "sample_spiral.png",
      "storage_path": "backend/uploads/medical_storage/spiral/PD-PRED-F4FFF4_spiral_png_NlmbRfmc.png",
      "sha256_checksum": "a8f3b...",
      "access_token": "NlmbRfmc..."
    }
  ],
  "gradcam": {
    "original": "/plots/spiral_original.png",
    "heatmap": "/plots/spiral_gradcam.png",
    "overlay": "/plots/spiral_overlay.png"
  }
}
```

### 2.2 Acoustic Vocal Modality
```json
{
  "prediction_id": "PD-PRED-4AE366",
  "patient_id": "PAT-1083",
  "modality": "voice",
  "prediction": "Parkinson",
  "confidence": 69.13,
  "uncertainty": 5.12,
  "acoustic_features": {
    "MDVP:Fo(Hz)": 154.21,
    "MDVP:Jitter(%)": 0.0078,
    "MDVP:Shimmer(dB)": 0.042,
    "HNR": 16.4,
    "RPDE": 0.58,
    "DFA": 0.74,
    "PPE": 0.28
  },
  "shap_explanation": {
    "summary_plot": "/plots/voice_shap_summary.png",
    "bar_plot": "/plots/voice_shap_bar.png"
  }
}
```

### 2.3 Telemonitoring Modality (UPDRS Progression)
```json
{
  "prediction_id": "PD-PRED-50D622",
  "patient_id": "PAT-1083",
  "modality": "telemonitoring",
  "motor_updrs": 14.31,
  "total_updrs": 21.12,
  "motor_confidence_interval": [12.85, 15.77],
  "total_confidence_interval": [18.90, 23.34],
  "uncertainty_margin": 1.46
}
```

### 2.4 Multimodal Attention Fusion
```json
{
  "prediction": "Parkinson",
  "confidence": 91.55,
  "uncertainty": 3.82,
  "fusion": true,
  "present_modalities": ["spiral", "mri", "voice", "telemonitor"],
  "missing_modalities": [],
  "modality_contributions": {
    "spiral": 0.2257,
    "mri": 0.3132,
    "voice": 0.2289,
    "telemonitor": 0.2322
  },
  "ood_analysis": {
    "is_out_of_distribution": false,
    "ood_anomaly_score": 14.2
  }
}
```

