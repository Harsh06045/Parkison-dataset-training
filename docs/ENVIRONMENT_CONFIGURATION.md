# NeuroFusionAI – Environment Configuration Reference

**System**: NeuroFusionAI – Parkinson's Disease Diagnostic Platform  
**Document**: Centralized Environment Variables & Configuration Reference  
**Generated**: 2026-11-02  

---

## 1. Overview

NeuroFusionAI utilizes a centralized, typed configuration system implemented via **Pydantic Settings** in [`backend/app/core/config.py`](file:///d:/Parkison%20DATASET%20TRAINING/backend/app/core/config.py).

Settings are automatically discovered and merged from the following sources in precedence order:
1. Process environment variables (e.g. system environment or Docker environment)
2. `.env.local` in project root
3. `.env` in project root
4. `backend/.env.local`
5. `backend/.env`
6. Hardcoded safe production defaults

To test configuration validity without printing secret credentials, run:
```powershell
python scripts/verify_environment.py
```

---

## 2. Complete Environment Variable Catalog

| Variable Name | Purpose | Required / Optional | Default Value | Example Value | Consumed By | Sensitive / Secret |
| :--- | :--- | :---: | :--- | :--- | :--- | :---: |
| **`APP_NAME`** | Application title displayed in OpenAPI and headers | Optional | `"NeuroFusionAI - Parkinson Diagnostic Engine"` | `"NeuroFusionAI Hospital Deployment"` | `backend/app/core/config.py`, `backend/app/main.py` | No |
| **`APP_ENV`** | Execution stage (`development`, `staging`, `production`) | Optional | `"production"` | `"production"` | `backend/app/core/config.py` | No |
| **`DEBUG`** | Toggles debug mode and verbose stack traces | Optional | `False` | `False` | `backend/app/main.py` | No |
| **`HOST`** | Network bind interface for the FastAPI server | Optional | `"127.0.0.1"` | `"0.0.0.0"` | `backend/app/core/config.py`, `uvicorn` | No |
| **`PORT`** | Port number for the HTTP server | Optional | `8000` | `8000` | `backend/app/core/config.py`, `uvicorn` | No |
| **`API_VERSION`** | Active API version prefix | Optional | `"v1"` | `"v1"` | `backend/app/api/v1/router.py` | No |
| **`LOG_LEVEL`** | Application logging verbosity (`DEBUG`, `INFO`, `WARNING`, `ERROR`) | Optional | `"INFO"` | `"INFO"` | `backend/app/core/logging.py` | No |
| **`DATABASE_URL`** | Primary pooled connection string for Neon Cloud PostgreSQL | **Required** in Production | `None` | `postgresql+psycopg2://neondb_owner:npg_***@ep-blue-field-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require` | `backend/app/db/session.py` | **YES** |
| **`NEON_DATABASE_URL`** | Alternate alias for Neon PostgreSQL URL | Optional | `None` | Same as `DATABASE_URL` | `backend/app/db/session.py` | **YES** |
| **`SQLITE_DATABASE_PATH`**| Local high-durability SQLite fallback database path | Optional | `"backend/uploads/parkinson_neon_store.db"` | `"backend/uploads/parkinson_neon_store.db"` | `backend/app/db/session.py` | No |
| **`DB_POOL_SIZE`** | SQLAlchemy connection pool base capacity | Optional | `5` | `5` | `backend/app/db/session.py` | No |
| **`DB_MAX_OVERFLOW`** | Maximum temporary surge pool connections | Optional | `10` | `10` | `backend/app/db/session.py` | No |
| **`DB_POOL_TIMEOUT`** | Seconds to wait before timing out pool checkout | Optional | `30` | `30` | `backend/app/db/session.py` | No |
| **`DB_POOL_RECYCLE`** | Seconds before transparently recycling connections | Optional | `300` | `300` | `backend/app/db/session.py` | No |
| **`JWT_SECRET_KEY`** | Cryptographic secret for signing JWT bearer tokens | **Required** in Production | Developer fallback key | `b78e9f2a4c1d6e8b0a2c4e6f8d0b2a4c6e8f0a2c4e6f8d0b2a4c6e8f0a2c4e6f` | `backend/app/core/security.py` | **YES** |
| **`JWT_ALGORITHM`** | Cryptographic signing algorithm | Optional | `"HS256"` | `"HS256"` | `backend/app/core/security.py` | No |
| **`ACCESS_TOKEN_EXPIRE_MINUTES`** | JWT access token lifespan in minutes | Optional | `1440` (24h) | `1440` | `backend/app/core/security.py` | No |
| **`REFRESH_TOKEN_EXPIRE_MINUTES`**| Refresh token lifespan in minutes | Optional | `10080` (7d) | `10080` | `backend/app/core/security.py` | No |
| **`UPLOAD_DIR`** | Temporary file staging directory | Optional | `"backend/uploads"` | `"backend/uploads"` | `backend/app/utils/validator.py`, API upload endpoints | No |
| **`STORAGE_ROOT`** | Durable HIPAA medical object storage root | Optional | `"backend/uploads/medical_storage"` | `"/var/data/medical_storage"` | `backend/app/services/storage_service.py` | No |
| **`REPORT_DIR`** | Directory storing generated ReportLab PDF documents | Optional | `"backend/storage/reports"` | `"/var/data/reports"` | `backend/app/services/patient_report_service.py` | No |
| **`MAX_UPLOAD_SIZE_MB`** | Upload file size ceiling in megabytes | Optional | `25` | `25` | `backend/app/utils/validator.py` | No |
| **`MRI_MODEL_PATH`** | File path to DenseNet-121 checkpoint | Optional | `"outputs/checkpoints/mri_best.pth"` | `"outputs/checkpoints/mri_best.pth"` | `backend/app/models/loader.py` | No |
| **`SPIRAL_MODEL_PATH`** | File path to ResNet-18 checkpoint | Optional | `"outputs/checkpoints/image_best.pth"` | `"outputs/checkpoints/image_best.pth"` | `backend/app/models/loader.py` | No |
| **`VOICE_PYTORCH_PATH`**| File path to Voice PyTorch MLP checkpoint | Optional | `"outputs/checkpoints/voice_mlp_best.pth"` | `"outputs/checkpoints/voice_mlp_best.pth"` | `backend/app/models/loader.py` | No |
| **`VOICE_CATBOOST_PATH`**| File path to Voice CatBoost model | Optional | `"outputs/checkpoints/voice_best_model.pkl"` | `"outputs/checkpoints/voice_best_model.pkl"` | `backend/app/models/loader.py` | No |
| **`VOICE_SCALER_PATH`** | File path to Voice StandardScaler pickle | Optional | `"outputs/checkpoints/voice_scaler.pkl"` | `"outputs/checkpoints/voice_scaler.pkl"` | `backend/app/models/loader.py` | No |
| **`TELEMONITOR_PYTORCH_PATH`**| File path to Telemonitoring PyTorch MLP | Optional | `"outputs/checkpoints/telemonitor_mlp_best.pth"` | `"outputs/checkpoints/telemonitor_mlp_best.pth"` | `backend/app/models/loader.py` | No |
| **`TELEMONITOR_XGB_PATH`**| File path to Telemonitoring XGBoost model | Optional | `"outputs/checkpoints/telemonitor_best_model.pkl"` | `"outputs/checkpoints/telemonitor_best_model.pkl"` | `backend/app/models/loader.py` | No |
| **`TELEMONITOR_SCALER_PATH`**| File path to Telemonitoring StandardScaler pickle | Optional | `"outputs/checkpoints/telemonitor_scaler.pkl"` | `"outputs/checkpoints/telemonitor_scaler.pkl"` | `backend/app/models/loader.py` | No |
| **`FUSION_MODEL_PATH`** | File path to AttentionFusionClassifier checkpoint | Optional | `"outputs/checkpoints/fusion_best.pth"` | `"outputs/checkpoints/fusion_best.pth"` | `backend/app/models/loader.py` | No |
| **`MODEL_DEVICE`** | Inference accelerator (`auto`, `cuda`, `cpu`) | Optional | `"auto"` | `"cpu"` | `backend/app/models/loader.py` | No |
| **`FRONTEND_URL`** | URL of the frontend client for CORS and redirects | Optional | `"http://localhost:5173"` | `"https://neurofusion.hospital.org"` | `backend/app/main.py` | No |
| **`ALLOWED_ORIGINS`** | Comma-separated list of permitted CORS origins | Optional | `"*"` | `"http://localhost:5173,http://localhost:3000"` | `backend/app/main.py` | No |

---

## 3. Production Hardening Guidelines

1. **Secret Generation**: In production, generate a cryptographically strong 64-character hex string for `JWT_SECRET_KEY`:
   ```bash
   python -c "import secrets; print(secrets.token_hex(32))"
   ```
2. **Never Commit Secrets**: Ensure `.env` and `.env.local` are present in `.gitignore`.
3. **Database Security**: Always append `?sslmode=require` to `DATABASE_URL` when communicating with Neon Cloud PostgreSQL over external networks.

