# NeuroFusionAI – Parkinson's Disease Multimodal Diagnostic System

[![Backend Status](https://img.shields.io/badge/Backend-Operational-brightgreen.svg)]()
[![Database](https://img.shields.io/badge/Database-Neon%20Cloud%20PostgreSQL-blue.svg)]()
[![Models](https://img.shields.io/badge/ML%20Checkpoints-7%20Verified-blueviolet.svg)]()
[![Tests](https://img.shields.io/badge/Test%20Battery-100%25%20Passed-success.svg)]()
[![Python](https://img.shields.io/badge/Python-3.10%20%7C%203.11%20%7C%203.14-blue.svg)]()

NeuroFusionAI is an enterprise-grade multimodal artificial intelligence platform designed to assist clinicians and neurologists in early detection, motor tremor quantification, and progression tracking of **Parkinson's Disease**.

---

## 🚀 Key Architectural Capabilities

1. **Four Diagnostic Modalities**:
   - **Spiral Drawings**: ResNet-18 image classifier evaluating tremor frequency and micro-deviations.
   - **Vocal Phonation**: CatBoost + PyTorch Deep MLP extracting 22 physical acoustic biomarkers (Jitter, Shimmer, HNR, RPDE, DFA, PPE).
   - **Telemonitoring Progression**: XGBoost + PyTorch Regressors predicting Motor UPDRS and Total UPDRS scores with 95% confidence intervals.
   - **Brain MRI**: DenseNet-121 structural classifier evaluating volumetric atrophy patterns.
2. **Multimodal Attention Fusion**:
   - AttentionFusionClassifier with multi-head self-attention and cross-modality gating, providing consensus diagnosis with out-of-distribution (OOD) anomaly scoring.
3. **Explainable AI (XAI)**:
   - **Grad-CAM**: Gradient-weighted Class Activation Mapping generating heatmaps and overlays for Spiral and MRI scans.
   - **SHAP**: Exact TreeExplainer Shapley value attribution generating summary and feature importance bar plots for voice and telemonitoring models.
4. **Cloud Relational Persistence**:
   - Hosted on **Neon Cloud PostgreSQL** with connection pooling and high-durability schema tracking Patients, Predictions, Model Versions, File References, and Audit Logs.
5. **Durable Medical Object Storage**:
   - HIPAA-compliant partitioned storage with SHA-256 integrity verification and token-authenticated signed URLs.
6. **Two-Stage Clinical PDF Reporting**:
   - ReportLab clinical reporting engine producing downloadable, watermarked medical PDFs for Stage 1 (`AI_ANALYSIS`) and Stage 2 (`FINAL_CLINICAL`).

---

## 📁 Repository Directory Structure

```text
NeuroFusionAI/
├── backend/
│   ├── app/
│   │   ├── main.py                    # Application factory & lifespan
│   │   ├── core/                      # Settings, security, exceptions, logging
│   │   ├── api/v1/                    # Primary versioned REST routers
│   │   ├── schemas/                   # Pydantic validation schemas
│   │   ├── models/                    # Model loader & weights guard
│   │   ├── services/                  # Business logic services
│   │   ├── db/                        # Neon PostgreSQL connection & ORM models
│   │   ├── preprocessing/             # Inference preprocessing routines
│   │   └── utils/                     # Validators, PDF generator, security
│   ├── tests/                         # Integration, API, and report test suites
│   ├── requirements.txt               # Pinned Python dependencies
│   └── Dockerfile                     # Production container definition
├── docs/                              # Complete architectural & operational guides
├── ml/models/                         # PyTorch, CatBoost, and XGBoost architectures
├── outputs/checkpoints/               # Trained model weights (*.pth, *.pkl)
├── scripts/                           # Administrative verification utilities
│   ├── setup_environment.py           # Bootstrap storage & database
│   ├── verify_environment.py          # Environment & path validation
│   ├── verify_database.py             # Database connectivity & CRUD tests
│   ├── verify_models.py               # ML checkpoint inference dry-runs
│   └── run_backend.py                 # Production Uvicorn launcher
├── docker-compose.yml                 # Container orchestration specification
├── .env.example                       # Root environment variable template
└── README.md
```

---

## ⚡ Quickstart Guide

### 1. Environment Setup
```powershell
# Clone and enter project directory
git clone https://github.com/your-org/NeuroFusionAI.git
cd NeuroFusionAI

# Create virtual environment and activate
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Install requirements
pip install -r requirements.txt
pip install pydantic-settings python-dotenv pyjwt python-jose
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and configure your database URL:
```powershell
cp .env.example .env
```
Ensure `DATABASE_URL` points to your Neon PostgreSQL cluster:
```ini
DATABASE_URL="postgresql+psycopg2://neondb_owner:YOUR_KEY@ep-blue-field-b8bw9hgw-pooler.c-14.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

### 3. Verify System Health & Checkpoints
Execute the automated pre-flight checks:
```powershell
python scripts/verify_environment.py
python scripts/verify_database.py
python scripts/verify_models.py
```

### 4. Launch the Backend Server
```powershell
python scripts/run_backend.py
```
- API Base URL: `http://127.0.0.1:8000`
- Interactive OpenAPI Swagger UI: `http://127.0.0.1:8000/docs`
- Health Probe: `http://127.0.0.1:8000/api/health`

---

## 🧪 Automated Testing

Run the full automated test battery (all tests pass 100%):
```powershell
# 1. Complete End-to-End System Integration Suite
python -m unittest backend/tests/test_complete_backend_integration.py

# 2. Two-Stage Clinical PDF Reports & RBAC Suite
python -m unittest backend/tests/test_patient_reports.py

# 3. Standard API Endpoint Integration Suite
python -m unittest backend/tests/test_api.py
```

---

## 📖 Architectural Documentation Reference

Detailed documentation is available in the [`docs/`](docs/) directory:
- [Repository Audit](docs/REPOSITORY_AUDIT.md)
- [Existing Architecture](docs/EXISTING_ARCHITECTURE.md)
- [File Dependency Map](docs/FILE_DEPENDENCY_MAP.md)
- [Integration Gap Report](docs/INTEGRATION_GAP_REPORT.md)
- [Restructuring Plan](docs/RESTRUCTURING_PLAN.md)
- [Environment Configuration Guide](docs/ENVIRONMENT_CONFIGURATION.md)
- [Database Architecture Guide](docs/DATABASE_ARCHITECTURE.md)
- [Database ER Diagram](docs/DATABASE_ER_DIAGRAM.md)
- [ML Model Registry](docs/ML_MODEL_REGISTRY.md)
- [Model Checkpoint Status](docs/MODEL_ARTIFACT_STATUS.md)
- [Dataset & Preprocessing Standards](docs/DATASET_AND_PREPROCESSING.md)
- [Prediction Pipeline Documentation](docs/PREDICTION_PIPELINE.md)
- [Explainability Engine Guide](docs/EXPLAINABILITY.md)
- [Storage Architecture Guide](docs/STORAGE_ARCHITECTURE.md)
- [REST API Reference](docs/API_DOCUMENTATION.md)
- [Authentication & RBAC Reference](docs/AUTHENTICATION_AND_RBAC.md)
- [Testing & Verification Report](docs/TESTING_REPORT.md)
- [Final Integration Status](docs/INTEGRATION_STATUS.md)
- [Deployment & Docker Guide](docs/DEPLOYMENT_GUIDE.md)
- [Known Limitations & Disclaimers](docs/KNOWN_LIMITATIONS.md)

