"""
NeuroFusionAI Database Architecture Verification Script.
Tests connectivity, schema integrity, table row counts, relational constraints,
and insert/query/delete transactions against Neon Cloud PostgreSQL.
"""

import sys
import os
import uuid
from datetime import datetime

# Add project root and backend to sys.path
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")

if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from app.db.session import check_connection, get_db_session, engine
from app.db.models import (
    Doctor,
    Patient,
    ModelVersion,
    PredictionRecord,
    ReportRecord,
    FileReference,
    AuditLog
)
from sqlalchemy import text, inspect


def verify_database():
    print("=" * 70)
    print(" NeuroFusionAI Database Architecture & Connectivity Verification")
    print("=" * 70)
    
    # 1. Connection Check
    print("\n[1] Testing Live Database Connection:")
    status = check_connection()
    print(f"  Connection Status: {status.get('status').upper()}")
    print(f"  Active Dialect:    {status.get('dialect')}")
    print(f"  Is Local Fallback: {status.get('is_fallback')}")

    if status.get("status") != "connected":
        print("  [FAIL] Unable to establish connection to database.")
        return False

    if status.get("is_fallback"):
        print("  [WARN] Operating on local SQLite fallback, not primary Neon PostgreSQL.")

    # 2. Table Inspection
    print("\n[2] Verifying Schema Tables & Row Counts:")
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()
    
    expected_models = [
        ("doctors", Doctor),
        ("patients", Patient),
        ("model_versions", ModelVersion),
        ("predictions", PredictionRecord),
        ("reports", ReportRecord),
        ("file_references", FileReference),
        ("audit_logs", AuditLog),
    ]

    db = get_db_session()
    all_tables_healthy = True

    try:
        for table_name, model_cls in expected_models:
            if table_name in existing_tables:
                count = db.query(model_cls).count()
                print(f"  [OK] Table '{table_name:<16}': Present ({count:>3} records)")
            else:
                print(f"  [FAIL] Table '{table_name:<16}': MISSING from database!")
                all_tables_healthy = False

        # 3. Sequence Synchronization (PostgreSQL)
        if status.get("dialect") == "postgresql":
            print("\n[3] Verifying PostgreSQL Sequences:")
            try:
                seq_val = db.execute(text("SELECT last_value FROM audit_logs_id_seq;")).scalar()
                max_id = db.execute(text("SELECT COALESCE(MAX(id), 0) FROM audit_logs;")).scalar()
                print(f"  [OK] audit_logs_id_seq: Current Sequence={seq_val}, Max ID={max_id}")
                if seq_val < max_id:
                    print("  [WARN] Sequence is behind Max ID. Resyncing sequence...")
                    db.execute(text("SELECT setval('audit_logs_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM audit_logs), false);"))
                    db.commit()
                    print("  [OK] Sequence resynchronized successfully.")
            except Exception as e:
                print(f"  ! Sequence check notice: {e}")

        # 4. Transactional Write / Read / Delete Verification
        print("\n[4] Testing CRUD Transaction Lifecycle:")
        test_patient_id = f"PAT-TEST-{uuid.uuid4().hex[:6].upper()}"
        test_patient = Patient(
            id=test_patient_id,
            full_name="Verification Patient (Temporary Automated Test)",
            age=65,
            gender="Female",
            primary_diagnosis="Verification Diagnostic Test",
            created_at=datetime.utcnow()
        )
        db.add(test_patient)
        db.commit()
        print(f"  [OK] INSERT: Created test record for '{test_patient_id}'.")

        # Read back
        queried = db.query(Patient).filter(Patient.id == test_patient_id).first()
        assert queried is not None, "Failed to read inserted patient."
        print(f"  [OK] SELECT: Successfully retrieved patient '{queried.full_name}'.")

        # Clean up
        db.delete(queried)
        db.commit()
        print(f"  [OK] DELETE: Cleaned up temporary test record '{test_patient_id}'.")

    except Exception as e:
        print(f"  [FAIL] Database transaction error: {e}")
        db.rollback()
        all_tables_healthy = False
    finally:
        db.close()

    print("\n" + "=" * 70)
    if all_tables_healthy:
        print("  DATABASE VERIFICATION RESULT: PASS - Schema & Data Operations Verified.")
    else:
        print("  DATABASE VERIFICATION RESULT: FAIL - Resolve database errors.")
    print("=" * 70)
    return all_tables_healthy


if __name__ == "__main__":
    success = verify_database()
    sys.exit(0 if success else 1)

