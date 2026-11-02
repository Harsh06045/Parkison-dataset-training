"""
SQLAlchemy Data Models for Parkinson's Diagnostic Records and Clinical Persistence.
Supports doctors, patients, model versions, predictions, secure file references, and audit logs.
Includes composite indexes and soft deletion support.
"""

from datetime import datetime
import json
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    Boolean,
    DateTime,
    Text,
    ForeignKey,
    Index
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(String(64), primary_key=True)  # e.g., "DOC-8921"
    full_name = Column(String(128), nullable=False)
    license_id = Column(String(64), unique=True, nullable=False)
    department = Column(String(128), default="Neurology")
    email = Column(String(128), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    predictions = relationship("PredictionRecord", back_populates="doctor")

    def to_dict(self):
        return {
            "id": self.id,
            "full_name": self.full_name,
            "license_id": self.license_id,
            "department": self.department,
            "email": self.email,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class Patient(Base):
    __tablename__ = "patients"

    id = Column(String(64), primary_key=True)  # e.g., "PAT-1083"
    full_name = Column(String(128), nullable=False)
    age = Column(Integer, nullable=True)
    gender = Column(String(16), nullable=True)
    primary_diagnosis = Column(String(256), default="Suspected Parkinson's Disease")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    predictions = relationship("PredictionRecord", back_populates="patient")

    def to_dict(self):
        return {
            "id": self.id,
            "full_name": self.full_name,
            "age": self.age,
            "gender": self.gender,
            "primary_diagnosis": self.primary_diagnosis,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class ModelVersion(Base):
    __tablename__ = "model_versions"

    model_id = Column(String(64), primary_key=True)  # e.g., "resnet18-handpd-v1"
    modality = Column(String(32), nullable=False)    # voice, spiral, telemonitoring, fusion, mri
    architecture = Column(String(128), nullable=False)
    checkpoint_hash = Column(String(64), nullable=True)
    input_features = Column(Text, nullable=True)     # JSON string of input features
    metrics_json = Column(Text, nullable=True)       # JSON string of accuracy/sensitivity/F1
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    predictions = relationship("PredictionRecord", back_populates="model_version")

    def to_dict(self):
        return {
            "model_id": self.model_id,
            "modality": self.modality,
            "architecture": self.architecture,
            "checkpoint_hash": self.checkpoint_hash,
            "input_features": json.loads(self.input_features) if self.input_features else None,
            "metrics": json.loads(self.metrics_json) if self.metrics_json else None,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class PredictionRecord(Base):
    __tablename__ = "predictions"

    id = Column(String(64), primary_key=True)  # e.g., "PD-PRED-1001"
    patient_id = Column(String(64), ForeignKey("patients.id"), nullable=False, index=True)
    doctor_id = Column(String(64), ForeignKey("doctors.id"), nullable=True, index=True)
    model_version_id = Column(String(64), ForeignKey("model_versions.model_id"), nullable=True)

    modality = Column(String(32), nullable=False, index=True)  # voice, spiral, telemonitoring, fusion, mri
    disease = Column(String(64), default="Parkinson's Disease")
    prediction = Column(String(64), nullable=False)           # Parkinson, Normal, UPDRS Assessment
    confidence = Column(Float, nullable=False)
    uncertainty = Column(Float, default=0.0)

    # Quantitative Telemonitoring UPDRS scores
    motor_updrs = Column(Float, nullable=True)
    total_updrs = Column(Float, nullable=True)

    clinical_notes = Column(Text, nullable=True)
    details_json = Column(Text, nullable=True)

    # Soft deletion & Audit metadata
    is_deleted = Column(Boolean, default=False, nullable=False, index=True)
    deleted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Table Constraints & Composite Indexes for longitudinal performance
    __table_args__ = (
        Index("ix_predictions_patient_created", "patient_id", "created_at"),
        Index("ix_predictions_modality_created", "modality", "created_at"),
        Index("ix_predictions_deleted_created", "is_deleted", "created_at"),
    )

    # Relationships
    patient = relationship("Patient", back_populates="predictions")
    doctor = relationship("Doctor", back_populates="predictions")
    model_version = relationship("ModelVersion", back_populates="predictions")
    file_references = relationship("FileReference", back_populates="prediction", cascade="all, delete-orphan")

    def to_dict(self):
        details = {}
        if self.details_json:
            try:
                details = json.loads(self.details_json)
            except Exception:
                details = {"raw": self.details_json}

        return {
            "id": self.id,
            "patient_id": self.patient_id,
            "patient_name": self.patient.full_name if self.patient else f"Patient {self.patient_id}",
            "doctor_id": self.doctor_id,
            "doctor_name": self.doctor.full_name if self.doctor else "Dr. Clara Rodriguez",
            "model_version_id": self.model_version_id,
            "modality": self.modality,
            "disease": self.disease,
            "prediction": self.prediction,
            "confidence": float(round(self.confidence, 2)),
            "uncertainty": float(round(self.uncertainty, 2)) if self.uncertainty is not None else 0.0,
            "motor_updrs": float(round(self.motor_updrs, 2)) if self.motor_updrs is not None else None,
            "total_updrs": float(round(self.total_updrs, 2)) if self.total_updrs is not None else None,
            "clinical_notes": self.clinical_notes,
            "details": details,
            "files": [f.to_dict() for f in self.file_references] if self.file_references else [],
            "is_deleted": self.is_deleted,
            "deleted_at": self.deleted_at.isoformat() if self.deleted_at else None,
            "timestamp": self.created_at.isoformat() if self.created_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class FileReference(Base):
    __tablename__ = "file_references"

    id = Column(String(64), primary_key=True)  # e.g., "FILE-e8f9c0"
    prediction_id = Column(String(64), ForeignKey("predictions.id"), nullable=False, index=True)
    file_type = Column(String(32), nullable=False)  # audio_wav, spiral_png, mri_png, telemonitor_csv, gradcam_overlay, shap_summary
    original_filename = Column(String(256), nullable=False)
    storage_path = Column(String(512), nullable=False)
    file_size_bytes = Column(Integer, default=0)
    mime_type = Column(String(64), nullable=False)
    sha256_checksum = Column(String(64), nullable=False)
    access_token = Column(String(128), unique=True, nullable=False, index=True)
    token_expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    prediction = relationship("PredictionRecord", back_populates="file_references")

    def to_dict(self):
        return {
            "id": self.id,
            "prediction_id": self.prediction_id,
            "file_type": self.file_type,
            "original_filename": self.original_filename,
            "file_size_bytes": self.file_size_bytes,
            "mime_type": self.mime_type,
            "sha256_checksum": self.sha256_checksum,
            "access_token": self.access_token,
            "authenticated_url": f"/api/parkinson/files/{self.access_token}",
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    request_id = Column(String(64), index=True, nullable=True)
    actor_id = Column(String(64), default="DOC-8921", nullable=False)
    action = Column(String(64), nullable=False)  # CREATE_PREDICTION, GET_PREDICTION, SOFT_DELETE, ACCESS_FILE, BACKUP_EXPORT
    resource_type = Column(String(32), nullable=False)  # prediction, patient, doctor, file, system
    resource_id = Column(String(64), nullable=True)
    ip_address = Column(String(45), nullable=True)
    details_json = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    def to_dict(self):
        details = {}
        if self.details_json:
            try:
                details = json.loads(self.details_json)
            except Exception:
                details = {"raw": self.details_json}
        return {
            "id": self.id,
            "request_id": self.request_id,
            "actor_id": self.actor_id,
            "action": self.action,
            "resource_type": self.resource_type,
            "resource_id": self.resource_id,
            "ip_address": self.ip_address,
            "details": details,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None
        }


class ReportRecord(Base):
    __tablename__ = "reports"

    id = Column(String(64), primary_key=True)  # e.g., "REP-2026-A89F"
    analysis_id = Column(String(64), nullable=True, index=True)  # Linked verified analysis ID
    patient_id = Column(String(64), ForeignKey("patients.id"), nullable=False, index=True)
    doctor_id = Column(String(64), ForeignKey("doctors.id"), nullable=True, index=True)
    title = Column(String(256), default="NeuroFusionAI Patient Medical Report")
    report_stage = Column(String(32), default="AI_ANALYSIS", nullable=False, index=True)  # AI_ANALYSIS or FINAL_CLINICAL
    disease = Column(String(64), default="Neurodegenerative Assessment")
    modality = Column(String(64), default="MRI / Multimodal")
    prediction = Column(String(64), nullable=False)
    confidence = Column(Float, nullable=False)
    risk_level = Column(String(32), default="Moderate Risk")  # Low Risk, Moderate Risk, High Risk
    pdf_path = Column(String(512), nullable=False)
    file_size_bytes = Column(Integer, default=0)
    status = Column(String(32), default="Finalized")  # Finalized, Pending Review, Draft
    clinical_notes = Column(Text, nullable=True)
    is_approved = Column(Boolean, default=False, nullable=False)
    approved_by = Column(String(64), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    report_data_json = Column(Text, nullable=True)  # Full structured payload
    generated_by = Column(String(64), default="DOC-8921")
    is_deleted = Column(Boolean, default=False, nullable=False, index=True)
    deleted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    __table_args__ = (
        Index("ix_reports_patient_created", "patient_id", "created_at"),
        Index("ix_reports_doctor_created", "doctor_id", "created_at"),
        Index("ix_reports_deleted_created", "is_deleted", "created_at"),
    )

    # Relationships
    patient = relationship("Patient", backref="reports")
    doctor = relationship("Doctor", backref="reports")

    def to_dict(self):
        data = {}
        if self.report_data_json:
            try:
                data = json.loads(self.report_data_json)
            except Exception:
                data = {"raw": self.report_data_json}

        return {
            "id": self.id,
            "analysis_id": self.analysis_id,
            "patient_id": self.patient_id,
            "patient_name": self.patient.full_name if self.patient else f"Patient {self.patient_id}",
            "doctor_id": self.doctor_id,
            "doctor_name": self.doctor.full_name if self.doctor else "Dr. Sarah Jenkins, MD, PhD",
            "title": self.title,
            "report_stage": self.report_stage,
            "disease": self.disease,
            "modality": self.modality,
            "prediction": self.prediction,
            "confidence": float(round(self.confidence, 2)),
            "risk_level": self.risk_level,
            "pdf_path": self.pdf_path,
            "file_size_bytes": self.file_size_bytes,
            "status": self.status,
            "clinical_notes": self.clinical_notes,
            "is_approved": self.is_approved,
            "approved_by": self.approved_by,
            "approved_at": self.approved_at.isoformat() if self.approved_at else None,
            "download_url": f"/api/reports/{self.id}/download",
            "report_data": data,
            "generated_by": self.generated_by,
            "is_deleted": self.is_deleted,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

