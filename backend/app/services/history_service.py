"""
Prediction History and Audit Storage Service for Parkinson's Diagnostic Records.
Provides dual-mode persistence: primary relational persistence (Neon PostgreSQL / resilient DB)
and local JSON fallback, supporting soft deletion, longitudinal patient queries, and HIPAA audit trails.
"""

import os
import json
import uuid
import logging
from datetime import datetime
from threading import Lock
from typing import Optional, List, Dict, Any

from app.config import PROJECT_ROOT
from app.db.session import get_db_session
from app.db.models import PredictionRecord, Patient, Doctor, AuditLog, FileReference

logger = logging.getLogger("neurofusion.history")

HISTORY_FILE = os.path.join(PROJECT_ROOT, "backend", "uploads", "prediction_history.json")

_lock = Lock()


class PredictionHistoryService:
    def __init__(self, storage_path=HISTORY_FILE):
        self.storage_path = storage_path
        os.makedirs(os.path.dirname(self.storage_path), exist_ok=True)
        self.json_records = self._load_json()

    def _load_json(self) -> List[Dict[str, Any]]:
        with _lock:
            if os.path.exists(self.storage_path):
                try:
                    with open(self.storage_path, "r", encoding="utf-8") as f:
                        return json.load(f)
                except Exception:
                    pass
            return []

    def _save_json(self):
        with _lock:
            try:
                with open(self.storage_path, "w", encoding="utf-8") as f:
                    json.dump(self.json_records, f, indent=2)
            except Exception as e:
                logger.warning(f"Failed to persist local JSON fallback: {e}")

    def save_prediction(
        self,
        modality: str,
        prediction: str,
        confidence: float,
        patient_id: str = "PAT-1083",
        patient_name: Optional[str] = None,
        doctor_id: str = "DOC-8921",
        model_version_id: Optional[str] = None,
        uncertainty: float = 0.0,
        motor_updrs: Optional[float] = None,
        total_updrs: Optional[float] = None,
        details: Optional[Dict[str, Any]] = None,
        clinical_notes: Optional[str] = None,
        request_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Persist a new diagnostic prediction record to the database and update audit trail.
        """
        pred_id = f"PD-PRED-{uuid.uuid4().hex[:6].upper()}"
        now = datetime.utcnow()
        details = details or {}

        # 1. Database persistence
        db = get_db_session()
        record_dict = None
        try:
            # Ensure patient exists
            patient = db.query(Patient).filter(Patient.id == patient_id).first()
            if not patient:
                patient = Patient(
                    id=patient_id,
                    full_name=patient_name or f"Patient {patient_id}",
                    primary_diagnosis="Under Parkinson's Investigation",
                    created_at=now
                )
                db.add(patient)

            # Ensure doctor exists
            doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
            if not doctor:
                doctor = Doctor(
                    id=doctor_id,
                    full_name="Dr. Clara Rodriguez, MD",
                    license_id="MD-NEURO-77491",
                    department="Neurology",
                    created_at=now
                )
                db.add(doctor)

            db_record = PredictionRecord(
                id=pred_id,
                patient_id=patient_id,
                doctor_id=doctor_id,
                model_version_id=model_version_id,
                modality=modality.lower(),
                disease="Parkinson's Disease",
                prediction=prediction,
                confidence=float(round(confidence, 2)),
                uncertainty=float(round(uncertainty, 2)),
                motor_updrs=float(round(motor_updrs, 2)) if motor_updrs is not None else None,
                total_updrs=float(round(total_updrs, 2)) if total_updrs is not None else None,
                clinical_notes=clinical_notes or f"Automated {modality.capitalize()} diagnostic assessment completed.",
                details_json=json.dumps(details),
                is_deleted=False,
                created_at=now
            )
            db.add(db_record)

            # Audit trail entry
            audit = AuditLog(
                request_id=request_id or f"REQ-{uuid.uuid4().hex[:8].upper()}",
                actor_id=doctor_id,
                action="CREATE_PREDICTION",
                resource_type="prediction",
                resource_id=pred_id,
                details_json=json.dumps({
                    "modality": modality,
                    "prediction": prediction,
                    "confidence": confidence,
                    "patient_id": patient_id
                }),
                timestamp=now
            )
            db.add(audit)
            db.commit()
            db.refresh(db_record)
            record_dict = db_record.to_dict()
        except Exception as e:
            logger.error(f"Error persisting prediction to database: {e}")
            db.rollback()
        finally:
            db.close()

        # If DB write succeeded, construct return dict; otherwise assemble in-memory dict
        if not record_dict:
            record_dict = {
                "id": pred_id,
                "patient_id": patient_id,
                "patient_name": patient_name or f"Patient {patient_id}",
                "doctor_id": doctor_id,
                "doctor_name": "Dr. Clara Rodriguez",
                "disease": "Parkinson's Disease",
                "modality": modality,
                "timestamp": now.isoformat(),
                "created_at": now.isoformat(),
                "prediction": prediction,
                "confidence": float(round(confidence, 2)),
                "uncertainty": float(round(uncertainty, 2)),
                "motor_updrs": motor_updrs,
                "total_updrs": total_updrs,
                "clinical_notes": clinical_notes or f"Automated {modality.capitalize()} diagnostic assessment completed.",
                "details": details,
                "is_deleted": False
            }

        # Sync to local JSON fallback
        self.json_records.insert(0, record_dict)
        self._save_json()

        return record_dict

    def get_by_id(self, prediction_id: str, include_deleted: bool = False) -> Optional[Dict[str, Any]]:
        """Retrieve a specific prediction by its unique ID."""
        db = get_db_session()
        try:
            query = db.query(PredictionRecord).filter(PredictionRecord.id == prediction_id.upper())
            if not include_deleted:
                query = query.filter(PredictionRecord.is_deleted == False)
            record = query.first()
            if record:
                return record.to_dict()
        except Exception as e:
            logger.warning(f"DB read error in get_by_id: {e}")
        finally:
            db.close()

        # Fallback to JSON
        for r in self.json_records:
            if r["id"].upper() == prediction_id.upper():
                if include_deleted or not r.get("is_deleted", False):
                    return r
        return None

    def get_patient_history(self, patient_id: str, include_deleted: bool = False) -> List[Dict[str, Any]]:
        """Retrieve all longitudinal prediction records for a patient ordered by timestamp desc."""
        db = get_db_session()
        try:
            query = db.query(PredictionRecord).filter(
                PredictionRecord.patient_id == patient_id.upper()
            )
            if not include_deleted:
                query = query.filter(PredictionRecord.is_deleted == False)
            query = query.order_by(PredictionRecord.created_at.desc())
            results = query.all()
            if results:
                return [r.to_dict() for r in results]
        except Exception as e:
            logger.warning(f"DB read error in get_patient_history: {e}")
        finally:
            db.close()

        # Fallback to JSON
        return [
            r for r in self.json_records
            if r.get("patient_id", "").upper() == patient_id.upper()
            and (include_deleted or not r.get("is_deleted", False))
        ]

    def list_all(
        self,
        modality: Optional[str] = None,
        limit: int = 50,
        include_deleted: bool = False
    ) -> List[Dict[str, Any]]:
        """List recent predictions with optional modality filtering and soft deletion exclusion."""
        db = get_db_session()
        try:
            query = db.query(PredictionRecord)
            if not include_deleted:
                query = query.filter(PredictionRecord.is_deleted == False)
            if modality:
                query = query.filter(PredictionRecord.modality == modality.lower())
            query = query.order_by(PredictionRecord.created_at.desc()).limit(limit)
            results = query.all()
            if results:
                return [r.to_dict() for r in results]
        except Exception as e:
            logger.warning(f"DB read error in list_all: {e}")
        finally:
            db.close()

        # Fallback to JSON
        filtered = [
            r for r in self.json_records
            if (include_deleted or not r.get("is_deleted", False))
            and (not modality or r.get("modality", "").lower() == modality.lower())
        ]
        return filtered[:limit]

    def soft_delete(self, prediction_id: str, actor_id: str = "DOC-8921") -> bool:
        """
        Soft-delete a prediction record and record an audit trail event.
        """
        now = datetime.utcnow()
        deleted_success = False

        db = get_db_session()
        try:
            rec = db.query(PredictionRecord).filter(PredictionRecord.id == prediction_id.upper()).first()
            if rec and not rec.is_deleted:
                rec.is_deleted = True
                rec.deleted_at = now

                audit = AuditLog(
                    request_id=f"DEL-{uuid.uuid4().hex[:8].upper()}",
                    actor_id=actor_id,
                    action="SOFT_DELETE",
                    resource_type="prediction",
                    resource_id=prediction_id,
                    details_json=json.dumps({"reason": "Clinical record soft deletion requested"}),
                    timestamp=now
                )
                db.add(audit)
                db.commit()
                deleted_success = True
        except Exception as e:
            logger.error(f"Error in soft_delete DB execution: {e}")
            db.rollback()
        finally:
            db.close()

        # Update JSON memory
        for r in self.json_records:
            if r["id"].upper() == prediction_id.upper():
                r["is_deleted"] = True
                r["deleted_at"] = now.isoformat()
                deleted_success = True
                break
        if deleted_success:
            self._save_json()

        return deleted_success

    def get_audit_logs(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Retrieve recent HIPAA/clinical audit events."""
        db = get_db_session()
        try:
            logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit).all()
            return [l.to_dict() for l in logs]
        except Exception as e:
            logger.warning(f"Could not retrieve audit logs: {e}")
            return []
        finally:
            db.close()


history_service = PredictionHistoryService()
