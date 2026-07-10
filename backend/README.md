# NeuroFusionAI — Parkinson's Disease FastAPI Backend

This is the production-ready backend inference engine for **NeuroFusionAI**, serving predictions and Explainable AI (XAI) reports from the multimodal Parkinson's disease classifiers.

---

## 📂 Project Structure

```text
backend/
├── app/
│   ├── api/             # API Router definitions (endpoints)
│   │   ├── health.py    # GET /health
│   │   ├── predict.py   # Individual modality predictions
│   │   ├── fusion.py    # Multimodal diagnostic fusion prediction
│   │   ├── explain.py   # Standalone explainability visualizations
│   │   └── report.py    # Structured PDF clinical reports
│   │
│   ├── services/        # Prediction, explanation, and report services
│   ├── models/          # Singleton startup model weight cache loader
│   ├── preprocessing/   # Signal and image transformations
│   ├── schemas/         # Pydantic input/output validation models
│   ├── utils/           # Centralized validator and logging module
│   │
│   ├── config.py        # Path resolution and server config
│   └── main.py          # FastAPI app config, lifespan hooks & CORS
│
├── logs/                # Server request, latency, and error logs
├── static/              # Directory for XAI Grad-CAM & SHAP plots
├── generated_reports/   # Directory for compiled patient PDF reports
├── tests/               # Integration test suite
│
├── evaluate.py          # Command-line dataset model validation tool
├── run.py               # FastAPI Uvicorn runner
└── requirements.txt     # Backend specific dependencies
```

---

## ⚙️ Setup and Installation

### 1. Install Dependencies
Run the installation in the project's virtual environment:
```bash
.venv\Scripts\python.exe -m pip install fastapi uvicorn python-multipart httpx
```

### 2. Verify Weights placement
Ensure model weights are located in the base project `outputs/checkpoints/` directory:
*   `mri_best.pth`
*   `image_best.pth`
*   `voice_mlp_best.pth`
*   `voice_best_model.pkl`
*   `telemonitor_mlp_best.pth`
*   `telemonitor_best_model.pkl`
*   `fusion_best.pth`

---

## 🚀 Running the Server

Start the backend on `http://127.0.0.1:8000`:
```bash
.venv\Scripts\python.exe backend/run.py
```

### OpenAPI Documentation
Once running, visit the interactive Swagger UI at:
👉 **[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)**

---

## 📡 REST API Documentation

### 1. Health Check
*   **URL**: `GET /health`
*   **Response**:
    ```json
    { "status": "running" }
    ```

### 2. MRI Prediction
*   **URL**: `POST /predict/mri`
*   **Body**: `multipart/form-data` with `image` (binary file)
*   **Response**:
    ```json
    {
      "prediction": "Normal",
      "confidence": 99.95,
      "gradcam": "/plots/mri_overlay.png"
    }
    ```

### 3. Spiral Prediction
*   **URL**: `POST /predict/spiral`
*   **Body**: `multipart/form-data` with `image` (binary file)
*   **Response**:
    ```json
    {
      "prediction": "Normal",
      "confidence": 99.74,
      "gradcam": "/plots/spiral_overlay.png"
    }
    ```

### 4. Voice Prediction
*   **URL**: `POST /predict/voice`
*   **Body**: `multipart/form-data` with `file` (.wav or features .csv)
*   **Response**:
    ```json
    {
      "prediction": "Parkinson",
      "confidence": 96.12,
      "shap": {
        "summary": "/plots/voice_shap_summary.png",
        "bar": "/plots/voice_shap_bar.png",
        "force": "/plots/voice_force_plot.png"
      }
    }
    ```

### 5. Telemonitor Score Estimation
*   **URL**: `POST /predict/telemonitor`
*   **Body**: `multipart/form-data` with `file` (.csv metrics)
*   **Response**:
    ```json
    {
      "motor_updrs": 15.42,
      "total_updrs": 24.18,
      "shap": {
        "summary": "/plots/telemonitor_shap_summary.png",
        "bar": "/plots/telemonitor_shap_bar.png",
        "force": "/plots/telemonitor_force_plot.png"
      }
    }
    ```

### 6. Multimodal Fusion Prediction
*   **URL**: `POST /predict/fusion`
*   **Body**: `multipart/form-data` containing all four files:
    *   `mri`
    *   `spiral`
    *   `voice`
    *   `telemonitor`
*   **Response**:
    ```json
    {
      "prediction": "Normal",
      "confidence": 99.92,
      "fusion": true
    }
    ```

### 7. Standalone Explainability
*   **URL**: `POST /explain`
*   **Body**: `multipart/form-data` containing any or all file uploads:
    *   `mri` (optional)
    *   `spiral` (optional)
    *   `voice` (optional)
    *   `telemonitor` (optional)
*   **Response**: Maps visual/beeswarm XAI plot locations for uploaded modalities.

### 8. PDF Clinical Report
*   **URL**: `POST /report`
*   **Body**: `multipart/form-data` containing `patient_id` (Form text) and any modality file uploads.
*   **Response**: Returns the compiled `patient_report.pdf` directly as a download stream.

---

## 📊 Model Evaluation CLI Tool

You can run validations against the internal test datasets from the command line:
```bash
# Evaluate all models
.venv\Scripts\python.exe backend/evaluate.py --modality all

# Evaluate MRI only
.venv\Scripts\python.exe backend/evaluate.py --modality mri
```
Calculates Accuracy, F1, ROC-AUC, MSE, and saves confusion matrix plots to `/plots` while logging metrics in `outputs/predictions/evaluation_test_results.csv`.

---

## 🧪 Testing

Execute the complete API integration test suite:
```bash
.venv\Scripts\python.exe -m unittest backend/tests/test_api.py
```
