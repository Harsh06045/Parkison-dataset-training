# NeuroFusionAI – Integration Gap Report & Vulnerability Analysis

**System**: NeuroFusionAI Parkinson's Disease Diagnostic System  
**Document**: Architectural & Integration Gaps Analysis  
**Generated**: 2026-11-02  

---

## 1. Executive Summary

During the repository audit and end-to-end inspection, several critical architectural gaps, configuration inconsistencies, and module redundancies were identified. While the core prediction pipeline and database persistence are operational, these gaps must be systematically addressed during restructuring to guarantee enterprise-grade maintainability, zero data leakage, and high reliability.

---

## 2. Inventory of Integration Gaps & Vulnerabilities

### Gap 1: Incomplete Model Guarding on Missing Checkpoints (RESOLVED)
- **Classification**: **CRITICAL** (Diagnostic Integrity)
- **Description**: Previously, `ModelLoader` instantiated neural network classes (e.g., `MRIClassifier`, `ImageDrawingClassifier`) before checking if checkpoint weights existed. If the weight file was missing or corrupt, an unweighted, randomly initialized model remained in memory, capable of making random diagnostic predictions.
- **Root Cause**: Checkpoint loading logic initialized the model class first and only checked file existence inside `_load_pytorch_weights()`.
- **Resolution Applied**: Checkpoint existence is strictly validated before instantiation. If weights fail to load, the model attribute is set to `None`. Added `loader.require_model(modality)` which raises `RuntimeError` before any forward pass, completely preventing untrained inference.

---

### Gap 2: PostgreSQL Sequence Collision Post-Migration (RESOLVED)
- **Classification**: **HIGH** (Database Reliability)
- **Description**: Migrating SQLite records with explicit integer IDs into Neon PostgreSQL left the PostgreSQL sequence `audit_logs_id_seq` at its initial state (`1`). Subsequent insertions produced `psycopg2.errors.UniqueViolation: duplicate key value violates unique constraint "audit_logs_pkey"`.
- **Root Cause**: Direct SQL `INSERT` statements with explicit primary keys do not automatically increment PostgreSQL `SERIAL` sequences.
- **Resolution Applied**: Executed `SELECT setval('audit_logs_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM audit_logs), false);` against Neon PostgreSQL, aligning the sequence with existing migrated records.

---

### Gap 3: Configuration Scattered Between Multiple Sources
- **Classification**: **HIGH** (Configuration Management)
- **Description**: Configuration variables, file paths, and database URLs are partially read from `.env`, `.env.local`, and hardcoded fallback strings in `backend/app/config.py`.
- **Impact**: Inconsistent path resolution across Windows and Linux, and lack of startup validation for missing secrets.
- **Target Restructuring**: Create a centralized Pydantic Settings class (`backend/app/core/config.py`) that loads from `.env`, validates types, provides safe defaults for non-sensitive values, and fails fast at startup if critical secrets or paths are invalid.

---

### Gap 4: Dual Preprocessing Codebases
- **Classification**: **MEDIUM** (Code Duplication & Maintenance)
- **Description**: Preprocessing routines exist in two separate locations:
  1. `preprocessing/` (root directory)
  2. `backend/app/preprocessing/` (backend package)
- **Impact**: Risk of logic drift between training preprocessing and inference preprocessing.
- **Target Restructuring**: Establish a unified ML preprocessing package (`ml/preprocessing/` or canonical `backend/app/preprocessing/`) with shared feature extraction routines, guaranteeing identical feature normalization and ordering across training and inference.

---

### Gap 5: Overlapping Prediction Routers
- **Classification**: **MEDIUM** (API Organization)
- **Description**: The repository currently exposes two sets of prediction routes:
  1. `/predict/*` (in `backend/app/api/predict.py`): Lightweight endpoints returning schema models.
  2. `/api/parkinson/*` (in `backend/app/api/parkinson.py`): Comprehensive endpoints writing to Neon DB, file storage, and audit logs.
- **Impact**: Client confusion regarding which endpoint to target; duplicate routing definitions.
- **Target Restructuring**: Group all production endpoints under versioned prefixes (`/api/v1/parkinson/*`), while maintaining `/predict/*` routes as lightweight pass-through aliases for backwards compatibility.

---

### Gap 6: Frontend Adapter Hardcoded Patients vs. Database Records
- **Classification**: **MEDIUM** (Data Synchronization)
- **Description**: The legacy frontend adapter `_frontend_patients()` in `backend/app/main.py` returned a hardcoded dictionary containing demo patients (`PAT-1083` Eleanor Vance, `PAT-1082` Robert Davis) instead of querying the Neon PostgreSQL `patients` table.
- **Impact**: New patients added via the database are not reflected in the legacy adapter endpoint unless queried via standard `/api/v1/patients`.
- **Target Restructuring**: Wire `_frontend_patients()` to read directly from `db.query(Patient).all()`, falling back to default clinical demo fixtures only if the database table is completely unseeded.

---

### Gap 7: Test Coverage & Async Deadlock on Windows Python 3.14
- **Classification**: **MEDIUM** (Automated QA)
- **Description**: Starlette's `TestClient` intermittently deadlocks with `anyio` on Python 3.14 under Windows when handling multipart file uploads inside unittest suites.
- **Impact**: Traditional `TestClient(app)` integration tests hang indefinitely.
- **Mitigation Applied**: Created `test_patient_reports.py` and `test_complete_backend_integration.py` which invoke endpoint and service functions directly with mock request contexts, and tested live HTTP requests against running uvicorn processes via `urllib.request`. All 25 combined integration tests pass.

---

## 3. Gap Remediation Matrix

| Gap ID | Description | Severity | Remediation Action | Target Phase |
| :---: | :--- | :---: | :--- | :---: |
| **GAP-01** | Untrained Model Guard | CRITICAL | Implement `require_model()` and strict checkpoint checks. | **Phase 1 (Completed)** |
| **GAP-02** | PostgreSQL Sequence Drift | HIGH | Align `audit_logs_id_seq` with `MAX(id) + 1`. | **Phase 1 (Completed)** |
| **GAP-03** | Scattered Configuration | HIGH | Create Pydantic Settings class with startup validation. | **Phase 3** |
| **GAP-04** | Dual Preprocessing Copies | MEDIUM | Unify preprocessing into single canonical module. | **Phase 2 & 6** |
| **GAP-05** | Overlapping Route Definitions | MEDIUM | Group production APIs under `/api/v1/` with aliases. | **Phase 2 & 10** |
| **GAP-06** | Hardcoded Demo Patient Lists | MEDIUM | Query Neon `Patient` ORM model in `/patients` endpoint. | **Phase 4 & 10** |
| **GAP-07** | Python 3.14 Windows Test Hangs | MEDIUM | Use direct service/endpoint testing & live HTTP scripts. | **Phase 11 (Completed)** |

