import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from app.db.session import engine
from sqlalchemy import text

with engine.connect() as conn:
    cols = [row[1] for row in conn.execute(text("PRAGMA table_info(reports);")).fetchall()]
    print("Existing cols:", cols)
    new_cols = [
        ("analysis_id", "VARCHAR(64)"),
        ("report_stage", "VARCHAR(32) DEFAULT 'AI_ANALYSIS'"),
        ("is_approved", "BOOLEAN DEFAULT 0"),
        ("approved_by", "VARCHAR(64)"),
        ("approved_at", "DATETIME")
    ]
    for col_name, col_type in new_cols:
        if col_name not in cols:
            conn.execute(text(f"ALTER TABLE reports ADD COLUMN {col_name} {col_type};"))
            print(f"Added column {col_name}")
    conn.commit()
    updated_cols = [row[1] for row in conn.execute(text("PRAGMA table_info(reports);")).fetchall()]
    print("Updated cols:", updated_cols)

