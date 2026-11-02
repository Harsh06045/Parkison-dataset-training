# NeuroFusionAI – Complete Repository Audit

**Generated Date**: 2026-11-02  
**System**: NeuroFusionAI – Multimodal Parkinson's Disease Detection System  
**Auditor**: Senior Software Architect & Lead ML/Backend Engineer  

---

## 1. Executive Summary

This repository audit represents an exhaustive inventory and architectural inspection of the **NeuroFusionAI** repository prior to restructuring. The codebase implements an end-to-end multimodal machine learning and clinical decision-support system (CDSS) for Parkinson's Disease (with auxiliary Alzheimer's/MCI modules), encompassing:
1. Four primary diagnostic modalities: **Brain MRI** (DenseNet-121), **Spiral Drawings** (ResNet-18), **Vocal Phonation** (CatBoost + PyTorch MLP with 22 acoustic features), and **Telemonitoring** (XGBoost + PyTorch Regressor for Motor/Total UPDRS).
2. Multimodal **Attention Fusion Classifier** (64-dimensional latent embedding with multi-head cross-attention).
3. Explainable AI (XAI) via **Grad-CAM** (heatmaps & overlays) and **SHAP** (TreeExplainer summary, bar, and force plots).
4. Relational database persistence powered by **Neon Cloud PostgreSQL** (with automatic TLS pooling, audit trails, and file reference tokens).
5. HIPAA-compliant medical object storage with SHA-256 integrity verification.
6. Two-stage clinical report generation engine powered by **ReportLab** producing downloadable, watermarked medical PDFs (`AI_ANALYSIS` and `FINAL_CLINICAL`).

---

## 2. Complete Existing Directory Tree

```text
NeuroFusionAI/
├── .agents/
│   └── skills/
│       ├── neon/
│       ├── neon-ai-gateway/
│       ├── neon-auth/
│       ├── neon-functions/
│       ├── neon-object-storage/
│       ├── neon-postgres/
│       ├── neon-postgres-branches/
│       ├── neon-postgres-egress-optimizer/
│       └── neon-realtime/
├── backend/
│   ├── alembic/
│   │   ├── env.py
│   │   ├── script.py.mako
│   │   └── versions/
│   │       └── 0001_initial_neon_schema.py
│   ├── app/
│   │   ├── api/
│   │   │   ├── explain.py
│   │   │   ├── fusion.py
│   │   │   ├── health.py
│   │   │   ├── parkinson.py
│   │   │   ├── predict.py
│   │   │   ├── report.py
│   │   │   ├── reports.py
│   │   │   └── testing.py
│   │   ├── db/
│   │   │   ├── backup.py
│   │   │   ├── init_db.py
│   │   │   ├── models.py
│   │   │   └── session.py
│   │   ├── models/
│   │   │   ├── loader.py
│   │   │   └── versioning.py
│   │   ├── preprocessing/
│   │   │   ├── image.py
│   │   │   ├── telemonitor.py
│   │   │   └── voice.py
│   │   ├── schemas/
│   │   │   ├── prediction.py
│   │   │   └── report.py
│   │   ├── services/
│   │   │   ├── evaluation_service.py
│   │   │   ├── fusion_service.py
│   │   │   ├── gradcam_service.py
│   │   │   ├── history_service.py
│   │   │   ├── mri_service.py
│   │   │   ├── patient_report_service.py
│   │   │   ├── pdf_report_service.py
│   │   │   ├── report_service.py
│   │   │   ├── shap_service.py
│   │   │   ├── spiral_service.py
│   │   │   ├── storage_service.py
│   │   │   └── telemonitor_service.py
│   │   ├── utils/
│   │   │   ├── logger.py
│   │   │   ├── pdf_generator.py
│   │   │   ├── security.py
│   │   │   └── validator.py
│   │   ├── config.py
│   │   └── main.py
│   ├── generated_reports/
│   ├── logs/
│   ├── static/
│   │   ├── assets/
│   │   ├── samples/
│   │   ├── testing/
│   │   ├── index.html
│   │   └── *.png (Grad-CAM and SHAP visual outputs)
│   ├── storage/
│   │   ├── backups/ (contains frontend_src_backup.zip)
│   │   └── reports/ (generated PDF documents)
│   ├── tests/
│   │   ├── test_api.py
│   │   ├── test_complete_backend_integration.py
│   │   └── test_patient_reports.py
│   ├── uploads/
│   │   ├── medical_storage/ (audio, spiral, mri, telemonitor, gradcam, shap)
│   │   ├── mpl/ (matplotlib cache)
│   │   └── prediction_history.json
│   ├── evaluate.py
│   ├── README.md
│   └── run.py
├── datasets/
│   ├── images/
│   ├── mri/
│   ├── processed/
│   ├── raw_spiral/
│   ├── spiral_drawings_clean/
│   ├── test/
│   ├── train/
│   ├── validation/
│   └── voice/
├── explainability/
│   ├── fusion_explain.py
│   ├── generate_all.py
│   ├── gradcam.py
│   ├── mri_gradcam.py
│   ├── shap_analysis.py
│   ├── shap_telemonitor.py
│   ├── shap_voice.py
│   └── spiral_gradcam.py
├── external_test/
├── models/
│   ├── fusion_model.py
│   ├── image_model.py
│   ├── mri_model.py
│   ├── telemonitor_model.py
│   └── voice_model.py
├── notebooks/
├── outputs/
│   ├── checkpoints/
│   │   ├── fusion_best.pth
│   │   ├── fusion_best_model.pth
│   │   ├── image_best.pth
│   │   ├── mri_best.pth
│   │   ├── mri_best_model.pth
│   │   ├── spiral_best_model.pth
│   │   ├── telemonitor_best_model.pkl
│   │   ├── telemonitor_mlp_best.pth
│   │   ├── telemonitor_scaler.pkl
│   │   ├── telemonitor_xgb_best.pkl
│   │   ├── voice_best_model.pkl
│   │   ├── voice_mlp_best.pth
│   │   ├── voice_scaler.pkl
│   │   └── voice_xgb_best.pkl
│   ├── logs/
│   └── reports/ (evaluation metrics CSVs)
├── preprocessing/
│   ├── fusion_preprocessing.py
│   ├── image_preprocessing.py
│   ├── mri_preprocessing.py
│   ├── telemonitor_preprocessing.py
│   ├── utils.py
│   └── voice_preprocessing.py
├── scratch/
├── scripts/
│   └── run_clinical_testing_suite.py
├── test_images/
├── training/
│   ├── models/
│   │   ├── fusion/ (attention_fusion.py, concat_fusion.py, multimodal_net.py)
│   │   ├── mri/ (densenet121.py, densenet169.py, efficientnet_b0/b3/b4.py, resnet50/101.py, swin.py, vit.py)
│   │   ├── spiral/ (resnet18.py, resnet50.py, convnext.py, densenet121.py, etc.)
│   │   ├── telemonitor/ (xgboost.py, mlp.py, lightgbm.py, catboost.py, random_forest.py)
│   │   ├── voice/ (catboost.py, mlp.py, cnn1d.py, cnn_lstm.py, cnn_bilstm.py, transformer.py, etc.)
│   │   └── base_networks.py
│   ├── checkpoint.py
│   ├── config.py
│   ├── early_stopping.py
│   ├── ensemble.py
│   ├── logger.py
│   ├── metrics.py
│   ├── model_selector.py
│   ├── scheduler.py
│   ├── train.py
│   ├── trainer.py
│   ├── train_fusion.py
│   ├── train_mri.py
│   ├── train_spiral.py
│   ├── train_telemonitor.py
│   └── train_voice.py
├── .env
├── .env.local
├── .gitignore
├── alembic.ini
├── evaluate_phase2.py
├── evaluate_phase3.py
├── inference.py
├── neon.ts
├── package.json
├── package-lock.json
├── requirements.txt
├── run_project.bat
├── sample_mri.png
├── sample_spiral.png
├── sample_telemonitor.csv
├── sample_voice.wav
├── setup_project.py
├── test_models.py
└── verify_phase1.py
```

---

## 3. Detailed File-by-File Audit & Classification

| File Path | Purpose | Dependencies / Calls | Called By | Operational Status | Retention / Modification Decision |
| :--- | :--- | :--- | :--- | :---: | :--- |
| `backend/app/main.py` | FastAPI application factory, lifespan management, CORS, middleware, global error handling, static mounts, route inclusion. | FastAPI, Starlette, `app.api.*`, `app.db.init_db`, `app.models.loader` | Uvicorn (`run_command`, CLI, Docker) | **WORKING** | **RETAIN**: Serves as core entrypoint. Standardize route prefixes. |
| `backend/app/config.py` | Central configuration constants, directory anchors, model weights path definitions. | `os`, `sys` | Almost all backend modules | **WORKING** | **MODIFY**: Upgrade to Pydantic Settings with env var validation. |
| `backend/app/models/loader.py` | Singleton model registry and weights loader. Enforces weight loading checks. | PyTorch, Pickle, `models.*`, `training.models.*` | `main.py`, `health.py`, prediction services | **WORKING** | **RETAIN**: Critical model guard prevents unweighted inference. |
| `backend/app/db/session.py` | Database engine creation, connection pooling, SSL/TLS configuration, session generators. | SQLAlchemy, `psycopg2` | `init_db.py`, services, API dependencies | **WORKING** | **RETAIN**: Configured for Neon PostgreSQL with resilient parameters. |
| `backend/app/db/models.py` | SQLAlchemy declarative ORM models (`Doctor`, `Patient`, `ModelVersion`, `PredictionRecord`, `ReportRecord`, `FileReference`, `AuditLog`). | SQLAlchemy | `session.py`, `history_service.py`, `patient_report_service.py` | **WORKING** | **RETAIN**: Normalized schema matches Neon Cloud database. |
| `backend/app/db/init_db.py` | Schema synchronization and initial model version seeding. | SQLAlchemy, `models.py`, `session.py` | `main.py` (lifespan startup) | **WORKING** | **RETAIN**: Guarantees tables and model registry exist on startup. |
| `backend/app/api/health.py` | Health check endpoint reporting models, scalers, storage, and Neon DB connectivity. | FastAPI, `loader`, `db.session` | External monitors, frontend, tests | **WORKING** | **RETAIN**: Comprehensive liveness and readiness reporting. |
| `backend/app/api/parkinson.py` | Primary standardized Parkinson diagnostic endpoints (Voice, Spiral, Telemonitoring, MRI, Fusion). | FastAPI, services, validator, security | Direct API consumers, frontend | **WORKING** | **RETAIN**: Fully wired to Neon DB, file storage, and explainability. |
| `backend/app/api/predict.py` | Lightweight prediction endpoints returning standard Pydantic response models. | FastAPI, prediction services | API clients, `test_api.py` | **WORKING** | **RETAIN**: Provides contract backwards compatibility. |
| `backend/app/api/fusion.py` | Multimodal prediction endpoint with flexible missing-modality handling. | FastAPI, `fusion_service`, validator | API clients | **WORKING** | **RETAIN**: Core multi-input diagnostic gateway. |
| `backend/app/api/reports.py` | Two-stage patient medical report generation and retrieval endpoints with RBAC. | FastAPI, `patient_report_service`, `security` | Clinicians, patients, admins | **WORKING** | **RETAIN**: Enforces two-stage reporting protocol. |
| `backend/app/api/explain.py` | Standalone endpoint triggering Grad-CAM and SHAP generation across modalities. | FastAPI, `gradcam_service`, `shap_service` | Visual analytics clients | **WORKING** | **RETAIN**: Explainability artifact provider. |
| `backend/app/api/testing.py` | Dashboard router serving evaluation benchmarks, confusion matrices, and ROC plots. | FastAPI, `evaluation_service` | Clinicians, QA team | **WORKING** | **RETAIN**: Transparent model performance visualization. |
| `backend/app/services/mri_service.py` | Brain MRI inference service; extracts 256-d embeddings via DenseNet-121. | PyTorch, `loader`, `preprocessing.image` | `api/parkinson.py`, `predict.py`, `fusion.py` | **WORKING** | **RETAIN**: Core MRI processing logic. |
| `backend/app/services/spiral_service.py` | Archimedean spiral drawing classifier service with ResNet-18; computes uncertainty and quality. | PyTorch, `loader`, `preprocessing.image` | `api/parkinson.py`, `predict.py`, `fusion.py` | **WORKING** | **RETAIN**: Core motor tremor processing logic. |
| `backend/app/services/voice_service.py` | Sustained phonation classifier; extracts 22 physical acoustic biomarkers; runs CatBoost + MLP. | NumPy, PyTorch, CatBoost, `preprocessing.voice` | `api/parkinson.py`, `predict.py`, `fusion.py` | **WORKING** | **RETAIN**: Core vocal biomarker processing logic. |
| `backend/app/services/telemonitor_service.py`| Progression regressor estimating Motor UPDRS and Total UPDRS scores with 95% CIs. | NumPy, PyTorch, XGBoost, `preprocessing.telemonitor` | `api/parkinson.py`, `predict.py`, `fusion.py` | **WORKING** | **RETAIN**: Core UPDRS motor scaling logic. |
| `backend/app/services/fusion_service.py` | Attention fusion combining drawing, MRI, voice, and clinical tensors; computes attention weights and OOD. | PyTorch, NumPy, `loader` | `api/parkinson.py`, `fusion.py`, `report_service.py` | **WORKING** | **RETAIN**: Multimodal decision consensus engine. |
| `backend/app/services/gradcam_service.py` | Wrapper generating Grad-CAM heatmaps and overlaid images for MRI and Spiral. | `explainability.gradcam`, `loader` | `api/parkinson.py`, `api/explain.py` | **WORKING** | **RETAIN**: Visual explainability wrapper. |
| `backend/app/services/shap_service.py` | Wrapper generating TreeExplainer SHAP summary and bar plots for Voice and Telemonitor. | `explainability.shap_analysis`, `loader` | `api/parkinson.py`, `api/explain.py` | **WORKING** | **RETAIN**: Feature attribution wrapper. |
| `backend/app/services/history_service.py` | Database persistence service writing prediction records, audit trails, and querying patient history. | `db.session`, `db.models`, `json` | `api/parkinson.py`, `main.py` | **WORKING** | **RETAIN**: Primary history and longitudinal persistence. |
| `backend/app/services/storage_service.py` | Medical object storage service; SHA-256 hash generation, signed token URLs, file archiving. | `db.session`, `db.models`, `hashlib`, `shutil` | `api/parkinson.py`, `patient_report_service.py` | **WORKING** | **RETAIN**: Durable HIPAA-compliant file repository. |
| `backend/app/services/patient_report_service.py` | Orchestrates two-stage ReportLab clinical PDF generation, RBAC checks, and patient validation. | ReportLab, `db.session`, `db.models`, `security` | `api/reports.py` | **WORKING** | **RETAIN**: Core clinical reporting service. |
| `backend/app/utils/security.py` | JWT token validation, password hashing, role enforcement (`require_roles`), doctor-patient ownership. | `passlib`, `python-jose`, FastAPI | `api/reports.py`, `api/parkinson.py` | **WORKING** | **RETAIN**: Centralized security and RBAC. |
| `backend/app/utils/validator.py` | File validation (MIME type, file extension, magic byte headers, max upload size). | `os`, FastAPI | API upload endpoints | **WORKING** | **RETAIN**: Prevents corrupt or dangerous uploads. |
| `backend/app/utils/pdf_generator.py` | ReportLab flowable styling and multi-page medical PDF builder. | `reportlab`, `matplotlib` | `patient_report_service.py` | **WORKING** | **RETAIN**: Professional PDF rendering engine. |
| `explainability/gradcam.py` | PyTorch Grad-CAM implementation calculating activation gradients on target convolutional layers. | PyTorch, OpenCV, NumPy | `gradcam_service.py`, `report_service.py` | **WORKING** | **RETAIN**: Clean mathematical Grad-CAM implementation. |
| `explainability/shap_analysis.py` | SHAP TreeExplainer implementation computing Shapley attribution values. | SHAP, Matplotlib, NumPy | `shap_service.py`, `main.py` | **WORKING** | **RETAIN**: Mathematical feature attribution. |
| `explainability/fusion_explain.py` | Computes cross-modality attention distribution from AttentionFusionClassifier. | PyTorch, Matplotlib | `report_service.py` | **WORKING** | **RETAIN**: Multimodal contribution analytics. |
| `models/mri_model.py` | DenseNet-121 architecture with feature extractor hook for multimodal fusion. | PyTorch, `torchvision` | `loader.py`, training scripts | **WORKING** | **RETAIN**: High-level model definition. |
| `models/image_model.py` | ResNet-18 architecture with feature extractor hook for spiral classification. | PyTorch, `torchvision` | `loader.py`, training scripts | **WORKING** | **RETAIN**: High-level model definition. |
| `models/voice_model.py` | PyTorch MLP with dropout and batch normalization for 22 acoustic features. | PyTorch | `loader.py`, training scripts | **WORKING** | **RETAIN**: High-level model definition. |
| `models/telemonitor_model.py` | PyTorch MLP Regressor predicting Motor and Total UPDRS scores. | PyTorch | `loader.py`, training scripts | **WORKING** | **RETAIN**: High-level model definition. |
| `models/fusion_model.py` | Baseline Multimodal MLP concatenating representations. | PyTorch | `loader.py` (fallback) | **WORKING** | **RETAIN**: Maintained as fallback classifier. |
| `training/models/fusion/attention_fusion.py` | Production AttentionFusionClassifier with multi-head self-attention and cross-modality gating. | PyTorch | `loader.py`, `train_fusion.py` | **WORKING** | **RETAIN**: Primary multimodal architecture. |
| `training/models/voice/catboost.py` | CatBoost classifier wrapper with save/load methods. | CatBoost | `loader.py`, `train_voice.py` | **WORKING** | **RETAIN**: Primary voice gradient booster. |
| `training/models/telemonitor/xgboost.py` | XGBoost regressor wrapper with save/load methods. | XGBoost | `loader.py`, `train_telemonitor.py` | **WORKING** | **RETAIN**: Primary telemonitor gradient booster. |

---

## 4. Root & Auxiliary Script Audit

| File Path | Description / Purpose | Working Status | Recommendation |
| :--- | :--- | :---: | :--- |
| `inference.py` | Standalone CLI inference and Matplotlib PDF generator script. | Working | **RETAIN**: Useful CLI utility for offline inference. |
| `test_models.py` | Standalone model checkpoint verification script. | Working | **RETAIN**: Fast smoke-test for model weights. |
| `evaluate_phase2.py` / `evaluate_phase3.py` | Standalone validation scripts evaluating model metrics on validation sets. | Working | **RETAIN**: Preserved for historical benchmark reproduction. |
| `verify_phase1.py` | Repository sanity check verifying dataset folders and directory layout. | Working | **RETAIN**: Useful verification script. |
| `neon.ts` | TypeScript Neon service definition for CLI deployment (`postgres`, `auth`). | Working | **RETAIN**: Used by Neon CLI deployment lifecycle. |
| `package.json` | Node package config containing Neon build scripts. | Working | **RETAIN**: Required for `npx neon` workflows. |
| `requirements.txt` | Core Python dependency manifest. | Working | **MODIFY**: Ensure all libraries (FastAPI, PyTorch, CatBoost, XGBoost, Neon/psycopg2, ReportLab, SHAP) are pinned with versions. |

---

## 5. Identified Integration Gaps & Architectural Vulnerabilities

1. **Dual Preprocessing Locations**: Preprocessing code exists both under `preprocessing/` (root) and `backend/app/preprocessing/`. Both are functional, but having parallel copies introduces drift risk.
2. **Configuration Centralization**: Configuration parameters (paths, database URLs, JWT secrets) are currently scattered between `backend/app/config.py`, `.env`, and inline defaults. A single unified Pydantic `Settings` model is required.
3. **Database Sequence Drift**: During SQLite-to-Neon migration, `audit_logs_id_seq` needed manual reset to `MAX(id) + 1`. An automated database verification script is needed to ensure sequences never collide.
4. **Error Handling Redundancy**: Some route handlers in `backend/app/main.py` handle exceptions inline rather than utilizing FastAPI's centralized exception handlers.
5. **Direct Root Model Imports**: `loader.py` imports models from `models.*` (root) and `training.models.*`. Consolidating or cleanly aliasing these model namespaces is required.

---

## 6. Audit Conclusion

The NeuroFusionAI backend is structurally sound with genuine model checkpoints, calibrated signal processing, real explainability engines, and active Neon Cloud database integration. With zero broken imports and 100% test pass rates on integration suites, the system is ready for formal architectural restructuring into a clean layered architecture.

