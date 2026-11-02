"""
Migration script to provision the `assessments` table and extended columns
in `reports` on Neon Cloud PostgreSQL / Local Database Store.
"""

import os
import sys

# Ensure backend in path
sys.path.insert(0, os.path.abspath("backend"))

from sqlalchemy import text
from app.db.session import engine, ACTIVE_DIALECT
from app.db.models import Base

def run_migration():
    print(f"[*] Running database schema migration for Assessments & Reports on dialect: {ACTIVE_DIALECT}")
    
    # 1. Create any missing tables (specifically assessments)
    Base.metadata.create_all(bind=engine)
    print("[+] Base.metadata.create_all completed successfully.")

    # 2. Alter reports table to add new columns if they do not already exist
    with engine.connect() as conn:
        with conn.begin():
            if ACTIVE_DIALECT == "postgresql":
                conn.execute(text("ALTER TABLE reports ADD COLUMN IF NOT EXISTS assessment_id VARCHAR(64);"))
                conn.execute(text("ALTER TABLE reports ADD COLUMN IF NOT EXISTS relative_storage_path VARCHAR(512);"))
                conn.execute(text("ALTER TABLE reports ADD COLUMN IF NOT EXISTS report_filename VARCHAR(256);"))
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_reports_assessment_id ON reports (assessment_id);"))
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_assessments_patient_id ON assessments (patient_id);"))
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_assessments_status ON assessments (status);"))
            else: # sqlite
                cols = [c[1] for c in conn.execute(text("PRAGMA table_info(reports);")).fetchall()]
                if "assessment_id" not in cols:
                    conn.execute(text("ALTER TABLE reports ADD COLUMN assessment_id VARCHAR(64);"))
                if "relative_storage_path" not in cols:
                    conn.execute(text("ALTER TABLE reports ADD COLUMN relative_storage_path VARCHAR(512);"))
                if "report_filename" not in cols:
                    conn.execute(text("ALTER TABLE reports ADD COLUMN report_filename VARCHAR(256);"))

    print("[+] Migration completed successfully! Table `assessments` and columns in `reports` are active.")

if __name__ == "__main__":
    run_migration()

