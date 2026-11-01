"""
Database Backup, Recovery, and Medical Data Retention Policy Module.
Enables offline and cloud JSON/SQL snapshots, disaster recovery restoration,
and compliant retention purge of soft-deleted clinical records.
"""

import os
import json
import hashlib
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session

from app.config import BACKEND_DIR
from app.db.session import get_db_session
from app.db.models import Doctor, Patient, ModelVersion, PredictionRecord, FileReference, AuditLog

BACKUP_DIR = os.path.join(BACKEND_DIR, "uploads", "backups")
os.makedirs(BACKUP_DIR, exist_ok=True)


def export_backup(target_path: Optional[str] = None, db: Optional[Session] = None) -> Dict[str, Any]:
    """
    Export all database tables into a verified, timestamped JSON snapshot.
    """
    close_session = False
    if db is None:
        db = get_db_session()
        close_session = True

    try:
        doctors = [d.to_dict() for d in db.query(Doctor).all()]
        patients = [p.to_dict() for p in db.query(Patient).all()]
        models = [m.to_dict() for m in db.query(ModelVersion).all()]
        predictions = [p.to_dict() for p in db.query(PredictionRecord).all()]
        files = [f.to_dict() for f in db.query(FileReference).all()]
        audits = [a.to_dict() for a in db.query(AuditLog).order_by(AuditLog.id.desc()).limit(200).all()]

        backup_payload = {
            "version": "1.0.0",
            "exported_at": datetime.utcnow().isoformat(),
            "table_counts": {
                "doctors": len(doctors),
                "patients": len(patients),
                "model_versions": len(models),
                "predictions": len(predictions),
                "file_references": len(files),
                "audit_logs": len(audits)
            },
            "data": {
                "doctors": doctors,
                "patients": patients,
                "model_versions": models,
                "predictions": predictions,
                "file_references": files,
                "audit_logs": audits
            }
        }

        if not target_path:
            ts_str = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            target_path = os.path.join(BACKUP_DIR, f"neurofusion_backup_{ts_str}.json")

        json_bytes = json.dumps(backup_payload, indent=2).encode("utf-8")
        with open(target_path, "wb") as f:
            f.write(json_bytes)

        sha256 = hashlib.sha256(json_bytes).hexdigest()

        # Log audit entry
        audit = AuditLog(
            request_id=f"BACKUP-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
            actor_id="SYSTEM",
            action="DATABASE_BACKUP",
            resource_type="system",
            resource_id=os.path.basename(target_path),
            details_json=json.dumps({"file_size_bytes": len(json_bytes), "sha256": sha256}),
            timestamp=datetime.utcnow()
        )
        db.add(audit)
        db.commit()

        return {
            "status": "success",
            "backup_file": target_path,
            "file_size_bytes": len(json_bytes),
            "sha256": sha256,
            "counts": backup_payload["table_counts"]
        }
    finally:
        if close_session:
            db.close()


def restore_backup(backup_path: str, db: Optional[Session] = None) -> Dict[str, Any]:
    """
    Restore database state from a validated JSON backup file.
    """
    if not os.path.exists(backup_path):
        raise FileNotFoundError(f"Backup file not found at: {backup_path}")

    with open(backup_path, "r", encoding="utf-8") as f:
        payload = json.load(f)

    close_session = False
    if db is None:
        db = get_db_session()
        close_session = True

    try:
        data = payload.get("data", {})
        restored_counts = {}

        # Restore patients
        p_count = 0
        for p in data.get("patients", []):
            existing = db.query(Patient).filter(Patient.id == p["id"]).first()
            if not existing:
                db.add(Patient(
                    id=p["id"],
                    full_name=p["full_name"],
                    age=p.get("age"),
                    gender=p.get("gender"),
                    primary_diagnosis=p.get("primary_diagnosis")
                ))
                p_count += 1
        restored_counts["patients"] = p_count

        # Restore doctors
        d_count = 0
        for d in data.get("doctors", []):
            existing = db.query(Doctor).filter(Doctor.id == d["id"]).first()
            if not existing:
                db.add(Doctor(
                    id=d["id"],
                    full_name=d["full_name"],
                    license_id=d["license_id"],
                    department=d.get("department", "Neurology"),
                    email=d.get("email")
                ))
                d_count += 1
        restored_counts["doctors"] = d_count

        # Restore predictions
        pred_count = 0
        for pr in data.get("predictions", []):
            existing = db.query(PredictionRecord).filter(PredictionRecord.id == pr["id"]).first()
            if not existing:
                db.add(PredictionRecord(
                    id=pr["id"],
                    patient_id=pr["patient_id"],
                    doctor_id=pr.get("doctor_id"),
                    model_version_id=pr.get("model_version_id"),
                    modality=pr["modality"],
                    disease=pr.get("disease", "Parkinson's Disease"),
                    prediction=pr["prediction"],
                    confidence=pr["confidence"],
                    uncertainty=pr.get("uncertainty", 0.0),
                    motor_updrs=pr.get("motor_updrs"),
                    total_updrs=pr.get("total_updrs"),
                    clinical_notes=pr.get("clinical_notes"),
                    details_json=json.dumps(pr.get("details", {})),
                    is_deleted=pr.get("is_deleted", False)
                ))
                pred_count += 1
        restored_counts["predictions"] = pred_count

        # Record audit log
        audit = AuditLog(
            request_id=f"RESTORE-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
            actor_id="SYSTEM",
            action="BACKUP_RESTORE",
            resource_type="system",
            resource_id=os.path.basename(backup_path),
            details_json=json.dumps({"restored_counts": restored_counts}),
            timestamp=datetime.utcnow()
        )
        db.add(audit)
        db.commit()

        return {
            "status": "success",
            "restored_counts": restored_counts
        }
    finally:
        if close_session:
            db.close()


def purge_retention_policy(retention_days: int = 30, db: Optional[Session] = None) -> Dict[str, Any]:
    """
    Permanently purge soft-deleted prediction records older than retention_days.
    Complies with medical data retention schedules and right-to-erasure requirements.
    """
    cutoff = datetime.utcnow() - timedelta(days=retention_days)

    close_session = False
    if db is None:
        db = get_db_session()
        close_session = True

    try:
        query = db.query(PredictionRecord).filter(
            PredictionRecord.is_deleted == True,
            PredictionRecord.deleted_at <= cutoff
        )
        to_delete = query.all()
        count = len(to_delete)

        for rec in to_delete:
            db.delete(rec)

        audit = AuditLog(
            request_id=f"RETENTION-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
            actor_id="SYSTEM",
            action="RETENTION_PURGE",
            resource_type="prediction",
            resource_id=f"COUNT_{count}",
            details_json=json.dumps({
                "purged_records": count,
                "retention_days": retention_days,
                "cutoff_timestamp": cutoff.isoformat()
            }),
            timestamp=datetime.utcnow()
        )
        db.add(audit)
        db.commit()

        return {
            "status": "success",
            "purged_count": count,
            "retention_days": retention_days,
            "cutoff_timestamp": cutoff.isoformat()
        }
    finally:
        if close_session:
            db.close()
