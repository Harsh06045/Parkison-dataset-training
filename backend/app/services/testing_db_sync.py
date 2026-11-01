"""
Testing Result Database Persistence and Object Storage Synchronization.
Loads held-out clinical testing results and persists them into Neon PostgreSQL / resilient DB:
1. Registers patients and links test records to patient IDs.
2. Persists prediction metadata (prediction, confidence, uncertainty, ground truth, metrics).
3. Stores raw inputs and Grad-CAM/SHAP visualizations into durable medical object storage.
4. Generates cryptographic SHA-256 integrity checksums and signed access tokens.
5. Records audit events for regulatory compliance.
"""

import os
import json
import uuid
import logging
from datetime import datetime
from typing import Dict, Any

from app.config import STATIC_DIR, BACKEND_DIR, PROJECT_ROOT
from app.db.session import get_db_session
from app.db.models import Patient, Doctor, ModelVersion, PredictionRecord, FileReference, AuditLog
from app.services.storage_service import storage_service

logger = logging.getLogger("neurofusion.testing.dbsync")

RESULTS_FILE = os.path.join(STATIC_DIR, "testing", "clinical_testing_results.json")

# Mapping modalities to registered ModelVersion IDs
MODALITY_MODEL_MAP = {
    "mri": "mri-densenet-v2.0",
    "spiral": "spiral-resnet18-v2.0",
    "voice": "voice-catboost-v2.0",
    "telemonitoring": "telemonitor-xgb-v2.0",
    "fusion": "multimodal-attention-fusion-v2.0"
}


def sync_testing_results_to_database(max_samples_per_modality: int = 25) -> Dict[str, Any]:
    """
    Persist representative batches of test evaluations into the database with durable
    file references and audit logging.
    """
    if not os.path.exists(RESULTS_FILE):
        return {"status": "error", "message": "Clinical testing results not found."}

    with open(RESULTS_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    all_records = data.get("all_records", {})
    models_eval = data.get("models_evaluated", {})
    now = datetime.utcnow()

    db = get_db_session()
    synced_counts = {"mri": 0, "spiral": 0, "voice": 0, "telemonitoring": 0, "fusion": 0}
    stored_files_count = 0

    try:
        # 1. Ensure default doctor exists
        doctor = db.query(Doctor).filter(Doctor.id == "DOC-8921").first()
        if not doctor:
            doctor = Doctor(
                id="DOC-8921",
                full_name="Dr. Sarah Jenkins, MD, PhD",
                license_id="MD-98472-NEURO",
                department="Cognitive Neurology & Movement Disorders",
                email="dr.jenkins@neurofusion.ai",
                created_at=now
            )
            db.add(doctor)
            db.commit()

        # 2. Iterate each modality test records
        for mod, recs in all_records.items():
            model_id = MODALITY_MODEL_MAP.get(mod, "multimodal-attention-fusion-v2.0")
            
            # Update ModelVersion metrics if present
            if mod in models_eval:
                m_info = models_eval[mod]
                mv = db.query(ModelVersion).filter(ModelVersion.model_id == model_id).first()
                if mv:
                    mv.metrics_json = json.dumps(m_info.get("metrics", {}))
                    db.commit()

            # Process up to max_samples_per_modality
            subset = recs[:max_samples_per_modality]
            for r in subset:
                pid = r.get("patient_id") or f"PAT-{mod.upper()}-001"
                tid = r.get("test_id") or f"TEST-{uuid.uuid4().hex[:6].upper()}"

                # Ensure Patient exists
                patient = db.query(Patient).filter(Patient.id == pid).first()
                if not patient:
                    patient = Patient(
                        id=pid,
                        full_name=f"Clinical Patient {pid}",
                        age=68,
                        gender="Unspecified",
                        primary_diagnosis=f"Evaluated on {mod.capitalize()} Protocol",
                        created_at=now
                    )
                    db.add(patient)
                    db.commit()

                # Check if PredictionRecord exists
                existing_pred = db.query(PredictionRecord).filter(PredictionRecord.id == tid).first()
                if not existing_pred:
                    pred_rec = PredictionRecord(
                        id=tid,
                        patient_id=pid,
                        doctor_id="DOC-8921",
                        model_version_id=model_id,
                        modality=mod,
                        disease=r.get("disease", "Parkinson's Disease"),
                        prediction=r.get("prediction", "Unknown"),
                        confidence=float(r.get("confidence", 95.0)),
                        uncertainty=float(r.get("uncertainty", 5.0)),
                        motor_updrs=float(r.get("predicted_motor_updrs", 0.0)) if "predicted_motor_updrs" in r else None,
                        total_updrs=float(r.get("predicted_total_updrs", 0.0)) if "predicted_total_updrs" in r else None,
                        clinical_notes=r.get("clinical_review") or f"Held-out test sample {tid} evaluated.",
                        details_json=json.dumps(r),
                        is_deleted=False,
                        created_at=now
                    )
                    db.add(pred_rec)
                    db.commit()
                    synced_counts[mod] = synced_counts.get(mod, 0) + 1

                    # 3. Store visual and diagnostic artifacts in durable object storage
                    artifacts = r.get("artifacts", {})
                    for art_type, rel_or_abs in artifacts.items():
                        if not rel_or_abs:
                            continue
                        # Locate artifact path
                        src = rel_or_abs
                        if not os.path.isabs(src):
                            src = os.path.join(STATIC_DIR, rel_or_abs.lstrip("/"))
                        if not os.path.exists(src):
                            src = os.path.join(STATIC_DIR, "testing", os.path.basename(rel_or_abs))

                        if os.path.exists(src):
                            try:
                                storage_service.store_file(
                                    source_path=src,
                                    prediction_id=tid,
                                    file_type=f"{mod}_{art_type}",
                                    original_filename=os.path.basename(src),
                                    db=db
                                )
                                stored_files_count += 1
                            except Exception as fe:
                                logger.warning(f"Could not store artifact {src}: {fe}")

        # 4. Write audit log entry for database synchronization
        audit = AuditLog(
            request_id=f"SYNC-{uuid.uuid4().hex[:8].upper()}",
            actor_id="DOC-8921",
            action="TESTING_DB_SYNC",
            resource_type="testing_evaluation",
            resource_id="BATCH-01",
            details_json=json.dumps({
                "synced_counts": synced_counts,
                "stored_files_count": stored_files_count
            }),
            timestamp=now
        )
        db.add(audit)
        db.commit()

        return {
            "status": "success",
            "message": "Testing evaluation records synchronized to Neon PostgreSQL / database.",
            "synced_counts": synced_counts,
            "stored_files_count": stored_files_count,
            "timestamp": now.isoformat()
        }

    except Exception as e:
        db.rollback()
        logger.error(f"Failed to sync testing results to DB: {e}")
        return {"status": "error", "message": str(e)}
    finally:
        db.close()

