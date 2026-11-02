"""
Migration script to add extended clinical columns to patients table in PostgreSQL/SQLite.
"""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.db.session import get_db_session
from sqlalchemy import text

def run_migration():
    db = get_db_session()
    engine = db.bind
    dialect = engine.dialect.name
    print(f"Running migration on dialect: {dialect}")

    columns = [
        ("date_of_birth", "DATE"),
        ("contact_number", "VARCHAR(64)"),
        ("email", "VARCHAR(128)"),
        ("risk_level", "VARCHAR(64) DEFAULT 'Moderate'"),
        ("stage", "VARCHAR(64) DEFAULT 'Stage I'"),
        ("last_analysis_date", "TIMESTAMP"),
        ("total_analyses", "INTEGER DEFAULT 0"),
        ("medical_history", "TEXT"),
        ("updrs_score", "FLOAT DEFAULT 0.0")
    ]

    for col_name, col_type in columns:
        try:
            if dialect == "postgresql":
                sql = f"ALTER TABLE patients ADD COLUMN IF NOT EXISTS {col_name} {col_type};"
            else:
                sql = f"ALTER TABLE patients ADD COLUMN {col_name} {col_type};"
            db.execute(text(sql))
            db.commit()
            print(f"  [OK] Column {col_name} checked/added.")
        except Exception as e:
            db.rollback()
            print(f"  [INFO] Column {col_name}: {e}")

    # Seed initial test patients with complete data if needed
    try:
        db.execute(text("""
            UPDATE patients SET 
                contact_number = '+1 (555) 876-5432',
                email = 'eleanor.vance@example.com',
                risk_level = 'Moderate',
                stage = 'Parkinson Stage II (Hoehn & Yahr)',
                total_analyses = 3,
                medical_history = 'Unilateral resting tremor, micrographia, mild bradykinesia and hypophonia.',
                updrs_score = 28.0
            WHERE id = 'PAT-1083' AND email IS NULL;
        """))
        db.commit()
        print("  [OK] Updated default patient PAT-1083 with extended profile.")
    except Exception as e:
        db.rollback()
        print(f"  [WARN] Patient PAT-1083 update: {e}")

    db.close()
    print("Migration finished successfully.")

if __name__ == "__main__":
    run_migration()

