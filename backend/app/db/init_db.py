"""
Database Initialization and Seeding Script.
Creates database schema, registers model versions from registry, seeds clinical staff,
test patients, and baseline longitudinal records.
"""

import os
import json
import logging
from datetime import datetime
from sqlalchemy.orm import Session

from app.config import PROJECT_ROOT
from app.db.session import engine, get_db_session
from app.db.models import Base, Doctor, Patient, ModelVersion, PredictionRecord, AuditLog

logger = logging.getLogger("neurofusion.db.init")

REGISTRY_PATH = os.path.join(PROJECT_ROOT, "outputs", "model_version_registry.json")


def init_db():
    """Create all schema tables in Neon PostgreSQL / SQLite."""
    logger.info("Creating database tables if not exist...")
    Base.metadata.create_all(bind=engine)
    # Ensure any recently added columns exist in older SQLite or PostgreSQL databases
    try:
        from sqlalchemy import text, inspect
        with engine.connect() as conn:
            insp = inspect(engine)
            for table_name, table in Base.metadata.tables.items():
                if table_name in insp.get_table_names():
                    existing_cols = {c["name"] for c in insp.get_columns(table_name)}
                    for col in table.columns:
                        if col.name not in existing_cols:
                            col_type = col.type.compile(engine.dialect)
                            conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {col.name} {col_type};"))
                            logger.info(f"Auto-migrated missing column {table_name}.{col.name} ({col_type})")
            conn.commit()
    except Exception as em:
        logger.warning(f"Schema column check: {em}")
    logger.info("Database tables initialized successfully.")


def seed_models(db: Session):
    """Seed model version registry entries into the database."""
    if not os.path.exists(REGISTRY_PATH):
        logger.warning(f"Model registry not found at {REGISTRY_PATH}")
        return

    try:
        with open(REGISTRY_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            models = data.get("models", {})
    except Exception as e:
        logger.warning(f"Could not load registry JSON: {e}")
        return

    for mid, mdata in models.items():
        existing = db.query(ModelVersion).filter(ModelVersion.model_id == mid).first()
        if not existing:
            rec = ModelVersion(
                model_id=mid,
                modality=mdata.get("modality", "multimodal"),
                architecture=mdata.get("architecture", "Custom"),
                checkpoint_hash=mdata.get("checkpoint_sha256"),
                input_features=json.dumps(mdata.get("input_features", [])),
                metrics_json=json.dumps(mdata.get("performance_metrics", {})),
                created_at=datetime.utcnow()
            )
            db.add(rec)
    db.commit()
    logger.info("Model versions synchronized from registry.")


def seed_clinical_entities(db: Session):
    """Seed primary clinical staff and sample test patients."""
    # Seed default doctor
    doc = db.query(Doctor).filter(Doctor.id == "DOC-8921").first()
    if not doc:
        doc = Doctor(
            id="DOC-8921",
            full_name="Dr. Clara Rodriguez, MD",
            license_id="MD-NEURO-77491",
            department="Neurology & Movement Disorders",
            email="c.rodriguez@neurofusion.hospital.org",
            created_at=datetime.utcnow()
        )
        db.add(doc)

    # Seed sample patients
    patients_data = [
        {
            "id": "PAT-1083",
            "full_name": "Eleanor Vance",
            "age": 67,
            "gender": "Female",
            "primary_diagnosis": "Parkinson's Disease (Hoehn & Yahr Stage II)"
        },
        {
            "id": "PAT-1082",
            "full_name": "Arthur Pendelton",
            "age": 71,
            "gender": "Male",
            "primary_diagnosis": "Early-Stage Parkinson's Assessment"
        },
        {
            "id": "PAT-2001",
            "full_name": "Sarah Connor",
            "age": 58,
            "gender": "Female",
            "primary_diagnosis": "Healthy Control Phonation & Kinetic Baseline"
        }
    ]

    for p in patients_data:
        existing = db.query(Patient).filter(Patient.id == p["id"]).first()
        if not existing:
            patient_rec = Patient(
                id=p["id"],
                full_name=p["full_name"],
                age=p["age"],
                gender=p["gender"],
                primary_diagnosis=p["primary_diagnosis"],
                created_at=datetime.utcnow()
            )
            db.add(patient_rec)

    db.commit()
    logger.info("Clinical staff and test patients seeded.")


def seed_baseline_predictions(db: Session):
    """Seed baseline historical predictions for patient PAT-1083 if none exist."""
    count = db.query(PredictionRecord).filter(PredictionRecord.patient_id == "PAT-1083").count()
    if count > 0:
        return

    records = [
        {
            "id": "PD-PRED-1001",
            "patient_id": "PAT-1083",
            "doctor_id": "DOC-8921",
            "model_version_id": "voice_catboost_v1",
            "modality": "voice",
            "disease": "Parkinson's Disease",
            "prediction": "Parkinson",
            "confidence": 94.20,
            "uncertainty": 5.80,
            "clinical_notes": "Acoustic phonation analysis with elevated jitter (0.84%) and reduced HNR (15.9 dB).",
            "details": {
                "acoustic_biomarkers": {"jitter": 0.0084, "shimmer_db": 0.046, "hnr_db": 15.9, "rpde": 0.58}
            },
            "created_at": datetime(2026, 8, 19, 11, 15, 0)
        },
        {
            "id": "PD-PRED-1002",
            "patient_id": "PAT-1083",
            "doctor_id": "DOC-8921",
            "model_version_id": "spiral_resnet18_v1",
            "modality": "spiral",
            "disease": "Parkinson's Disease",
            "prediction": "Parkinson",
            "confidence": 98.50,
            "uncertainty": 2.50,
            "clinical_notes": "Archimedean spiral drawing with marked kinetic micro-tremor along spiral loops.",
            "details": {
                "gradcam_overlay": "/plots/spiral_overlay.png"
            },
            "created_at": datetime(2026, 9, 2, 14, 30, 0)
        },
        {
            "id": "PD-PRED-1003",
            "patient_id": "PAT-1083",
            "doctor_id": "DOC-8921",
            "model_version_id": "telemonitor_xgboost_v1",
            "modality": "telemonitoring",
            "disease": "Parkinson's Disease",
            "prediction": "UPDRS Assessment",
            "confidence": 91.00,
            "uncertainty": 2.10,
            "motor_updrs": 21.22,
            "total_updrs": 27.39,
            "clinical_notes": "Predicted Motor UPDRS score: 21.22, Total UPDRS: 27.39.",
            "details": {
                "motor_updrs": 21.22,
                "total_updrs": 27.39,
                "clinical_type": "PREDICTED_UPDRS_ASSESSMENT"
            },
            "created_at": datetime(2026, 9, 20, 9, 45, 0)
        }
    ]

    for r in records:
        pred = PredictionRecord(
            id=r["id"],
            patient_id=r["patient_id"],
            doctor_id=r["doctor_id"],
            model_version_id=r["model_version_id"],
            modality=r["modality"],
            disease=r["disease"],
            prediction=r["prediction"],
            confidence=r["confidence"],
            uncertainty=r["uncertainty"],
            motor_updrs=r.get("motor_updrs"),
            total_updrs=r.get("total_updrs"),
            clinical_notes=r["clinical_notes"],
            details_json=json.dumps(r["details"]),
            is_deleted=False,
            created_at=r["created_at"]
        )
        db.add(pred)

    # Initial audit log
    audit = AuditLog(
        request_id="INIT-SYSTEM-001",
        actor_id="DOC-8921",
        action="INIT_SEED",
        resource_type="system",
        resource_id="ALL",
        details_json=json.dumps({"message": "Initial database schema initialized and seeded"}),
        timestamp=datetime.utcnow()
    )
    db.add(audit)
    db.commit()
    logger.info("Baseline historical predictions seeded.")


def initialize_all():
    """Run full schema creation and seeding."""
    init_db()
    db = get_db_session()
    try:
        seed_models(db)
        seed_clinical_entities(db)
        seed_baseline_predictions(db)
    finally:
        db.close()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    initialize_all()
    print("Database initialization and seeding completed successfully.")
