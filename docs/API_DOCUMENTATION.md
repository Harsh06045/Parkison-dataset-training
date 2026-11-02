# NeuroFusionAI – Complete API Documentation

**System**: NeuroFusionAI REST API Reference  
**Base URL**: `http://127.0.0.1:8000`  
**API Specification**: OpenAPI 3.1.0 (Interactive Swagger UI available at `/docs`)  
**Generated**: 2026-11-02  

---

## 1. System Health & Probes

### `GET /api/health` or `GET /api/v1/health`
- **Description**: Comprehensive liveness and readiness probe reporting operational status of machine learning models, database connections, and storage mounts.
- **Auth**: None (Public)
- **Response**: `HTTP 200 OK`
```json
{
  "status": "healthy",
  "api_version": "2.0.0",
  "device": "cpu",
  "all_models_loaded": true,
  "database": {
    "status": "connected",
    "dialect": "postgresql",
    "is_fallback": false,
    "database_url_configured": true
  },
  "storage": {
    "upload_dir_writable": true,
    "static_dir_readable": true
  },
  "models": {
    "mri_classifier": true,
    "spiral_classifier": true,
    "voice_mlp": true,
    "voice_catboost": true,
    "telemonitor_mlp": true,
    "telemonitor_xgboost": true,
    "multimodal_fusion": true,
    "voice_scaler": true,
    "telemonitor_scaler": true
  }
}
```

---

## 2. Standard Parkinson Diagnostic Suite (`/api/v1/parkinson`)

### `POST /api/v1/parkinson/voice/predict`
- **Description**: Predicts Parkinson's from audio (`.wav`) or acoustic features (`.csv`). Computes 22 biomarkers, runs CatBoost/MLP inference, computes SHAP values, persists to Neon DB, and archives to medical storage.
- **Auth**: Bearer Token / Role: `doctor`, `admin`
- **Request Body**: `multipart/form-data`
  - `file`: UploadFile (Required)
  - `patient_id`: str (Default: `"PAT-1083"`)
- **Response**: `HTTP 200 OK`

### `POST /api/v1/parkinson/spiral/predict`
- **Description**: Predicts Parkinson's from Archimedean spiral drawing. Runs ResNet-18 inference, computes Grad-CAM heatmaps, persists to Neon DB, and archives to storage.
- **Auth**: Bearer Token / Role: `doctor`, `admin`
- **Request Body**: `multipart/form-data`
  - `image`: UploadFile (Required)
  - `patient_id`: str (Default: `"PAT-1083"`)
- **Response**: `HTTP 200 OK`

### `POST /api/v1/parkinson/telemonitoring/predict`
- **Description**: Predicts Motor UPDRS and Total UPDRS scores with 95% confidence intervals from telemonitoring clinical metrics.
- **Auth**: Bearer Token / Role: `doctor`, `admin`
- **Request Body**: `multipart/form-data`
  - `file`: UploadFile (Required, CSV)
  - `patient_id`: str (Default: `"PAT-1083"`)
- **Response**: `HTTP 200 OK`

### `POST /api/v1/parkinson/mri/predict`
- **Description**: Predicts structural neurodegeneration from brain MRI scan via DenseNet-121. Computes Grad-CAM overlays, persists to Neon DB, and archives scan.
- **Auth**: Bearer Token / Role: `doctor`, `admin`
- **Request Body**: `multipart/form-data`
  - `image`: UploadFile (Required)
  - `patient_id`: str (Default: `"PAT-1083"`)
- **Response**: `HTTP 200 OK`

### `POST /api/v1/parkinson/fusion/predict`
- **Description**: Multimodal Attention Fusion diagnostic endpoint. Accepts any combination of spiral drawing, brain MRI, vocal phonation, and telemonitoring metrics.
- **Auth**: Bearer Token / Role: `doctor`, `admin`
- **Request Body**: `multipart/form-data` (Supports missing modalities)
- **Response**: `HTTP 200 OK`

### `GET /api/v1/parkinson/history`
- **Description**: Retrieves longitudinal prediction history for patients.
- **Query Parameters**: `patient_id` (optional), `modality` (optional), `limit` (default: 50)
- **Response**: `HTTP 200 OK`

### `GET /api/v1/parkinson/storage/{file_id}`
- **Description**: Downloads token-authenticated medical artifacts.
- **Query Parameters**: `token` (Required if not authenticated as doctor/admin)
- **Response**: `FileResponse` (Binary stream with correct MIME type)

---

## 3. Patient Clinical Reports (`/api/v1/reports`)

### `POST /api/v1/reports/generate/{patient_id}`
- **Description**: Generates a verified ReportLab medical PDF report.
- **Auth**: Doctor or Admin required (`HTTP 403` for patients).
- **Request Body**: `application/json`
```json
{
  "disease_protocol": "parkinson",
  "report_stage": "FINAL_CLINICAL",
  "is_approved": true,
  "clinical_notes": "Clinical correlation verified with mild bilateral rest tremor."
}
```
- **Response**: `HTTP 201 Created`

### `GET /api/v1/reports/{report_id}`
- **Description**: Retrieves metadata and diagnostic summaries for a specific report.
- **Auth**: Authorized Doctor, Admin, or the owning Patient.
- **Response**: `HTTP 200 OK`

### `GET /api/v1/reports/{report_id}/download`
- **Description**: Streams the finalized ReportLab PDF document.
- **Auth**: Authorized Doctor, Admin, or the owning Patient.
- **Response**: `FileResponse (application/pdf)`

---

## 4. Patient Registry (`/api/v1/patients`)

### `GET /api/v1/patients`
- **Description**: Lists registered patients from Neon PostgreSQL.
- **Query Parameters**: `search` (filter by name or ID)
- **Response**: `HTTP 200 OK`

### `GET /api/v1/patients/{patient_id}`
- **Description**: Retrieves detailed patient profile, clinical intake history, and attending physician assignment.
- **Response**: `HTTP 200 OK`

