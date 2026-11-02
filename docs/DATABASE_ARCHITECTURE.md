# NeuroFusionAI – Database Architecture Documentation

**System**: NeuroFusionAI – Multimodal Parkinson's Disease Diagnostic Platform  
**Database**: Neon Cloud Serverless PostgreSQL (`ep-blue-field-b8bw9hgw-pooler.c-14.us-east-1.aws.neon.tech/neondb`)  
**ORM**: SQLAlchemy 2.0  
**Driver**: `psycopg2` via connection pooling  
**Generated**: 2026-11-02  

---

## 1. Database Architecture Overview

NeuroFusionAI utilizes **Neon Cloud PostgreSQL** as its primary persistent relational store. The database provides:
- **Serverless Autoscaling**: Scales compute to match clinical traffic while persisting all diagnostic records and binary references.
- **Connection Pooling**: Uses Neon's pgbouncer connection pooler endpoint with keepalives (`pool_pre_ping=True`) and connection recycling (`pool_recycle=300`) to prevent dropped sessions across serverless sleeps.
- **Transparent Fallback**: A local high-durability SQLite database engine is maintained as a zero-downtime offline contingency fallback in case of wide-area network partition.
- **HIPAA Audit Compliance**: Every diagnostic inference, report generation, and file access event triggers an immutable write to the `audit_logs` table.

---

## 2. Entity Schemas & Column Definitions

### 2.1 `doctors` Table
Stores licensed medical practitioners authorized to review analyses and approve clinical reports.
```sql
CREATE TABLE doctors (
    id VARCHAR(64) PRIMARY KEY,
    full_name VARCHAR(128) NOT NULL,
    license_id VARCHAR(64) UNIQUE NOT NULL,
    department VARCHAR(128),
    hospital VARCHAR(128),
    email VARCHAR(128),
    phone VARCHAR(32),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 2.2 `patients` Table
Stores registered patients undergoing longitudinal monitoring.
```sql
CREATE TABLE patients (
    id VARCHAR(64) PRIMARY KEY,
    full_name VARCHAR(128) NOT NULL,
    date_of_birth DATE,
    age INTEGER,
    gender VARCHAR(16),
    contact_number VARCHAR(32),
    email VARCHAR(128),
    primary_diagnosis VARCHAR(128),
    stage VARCHAR(64),
    risk_level VARCHAR(32),
    updrs_score FLOAT,
    medical_history TEXT,
    doctor_id VARCHAR(64) REFERENCES doctors(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 2.3 `model_versions` Table
Maintains an immutable registry of machine learning model checkpoints, input shapes, and accuracy benchmarks.
```sql
CREATE TABLE model_versions (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    modality VARCHAR(128) NOT NULL,
    framework VARCHAR(64),
    accuracy FLOAT,
    f1_score FLOAT,
    auc_roc FLOAT,
    mae FLOAT,
    checkpoint_path VARCHAR(256),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 2.4 `predictions` Table
Central diagnostic inference records across all modalities.
```sql
CREATE TABLE predictions (
    id VARCHAR(64) PRIMARY KEY,
    patient_id VARCHAR(64) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id VARCHAR(64) REFERENCES doctors(id) ON DELETE SET NULL,
    model_version_id VARCHAR(64) REFERENCES model_versions(id) ON DELETE SET NULL,
    modality VARCHAR(128) NOT NULL,
    disease VARCHAR(64) DEFAULT 'Parkinson''s Disease',
    prediction VARCHAR(64) NOT NULL,
    confidence FLOAT NOT NULL,
    uncertainty FLOAT DEFAULT 0.0,
    motor_updrs FLOAT,
    total_updrs FLOAT,
    clinical_notes TEXT,
    details_json TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 2.5 `reports` Table
Stores generated medical PDF reports and clinical approval states.
```sql
CREATE TABLE reports (
    id VARCHAR(64) PRIMARY KEY,
    analysis_id VARCHAR(64) REFERENCES predictions(id) ON DELETE SET NULL,
    patient_id VARCHAR(64) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id VARCHAR(64) REFERENCES doctors(id) ON DELETE SET NULL,
    report_stage VARCHAR(32) NOT NULL,
    disease VARCHAR(64) NOT NULL,
    primary_diagnosis VARCHAR(128) NOT NULL,
    confidence_score FLOAT,
    pdf_path VARCHAR(512) NOT NULL,
    is_approved BOOLEAN DEFAULT FALSE,
    approved_by VARCHAR(64),
    approved_at TIMESTAMP WITHOUT TIME ZONE,
    clinical_notes TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 2.6 `file_references` Table
Maintains secure references, SHA-256 integrity hashes, and signed access tokens for uploaded files and explainability plots.
```sql
CREATE TABLE file_references (
    id VARCHAR(64) PRIMARY KEY,
    prediction_id VARCHAR(64) REFERENCES predictions(id) ON DELETE CASCADE,
    file_type VARCHAR(64) NOT NULL,
    original_filename VARCHAR(256) NOT NULL,
    storage_path VARCHAR(512) NOT NULL,
    file_size_bytes INTEGER NOT NULL,
    mime_type VARCHAR(64) NOT NULL,
    sha256_checksum VARCHAR(64) NOT NULL,
    access_token VARCHAR(64) NOT NULL,
    token_expires_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 2.7 `audit_logs` Table
Immutable HIPAA audit log tracking every diagnostic analysis and document creation.
```sql
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    request_id VARCHAR(64) NOT NULL,
    actor_id VARCHAR(64) NOT NULL,
    action VARCHAR(64) NOT NULL,
    resource_type VARCHAR(64) NOT NULL,
    resource_id VARCHAR(64) NOT NULL,
    ip_address VARCHAR(45),
    details_json TEXT,
    timestamp TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 3. Database Indexes & Performance Optimizations

1. `ix_predictions_patient_id`: B-Tree index on `predictions.patient_id` for $O(1)$ longitudinal history queries.
2. `ix_predictions_created_at`: B-Tree index for reverse chronological ordering.
3. `ix_file_references_access_token`: B-Tree index for token-authenticated file retrieval.
4. `ix_audit_logs_request_id`: B-Tree index for request correlation and security forensics.

