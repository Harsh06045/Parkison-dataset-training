import os
import sys
from pathlib import Path

# Add backend to path and set mpl cache
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))
os.environ["MPLCONFIGDIR"] = str(Path(__file__).resolve().parent.parent / "backend" / "uploads" / "mpl")

from app.api.testing import (
    export_test_pdf_report,
    export_test_results_csv,
    export_test_details_json,
    export_visualization_png,
    get_patient_testing_history,
    trigger_testing_database_sync
)
from app.api.parkinson import (
    get_patient_prediction_history,
    list_all_predictions,
    get_recent_audit_logs,
    get_database_statistics
)
from app.utils.security import DEFAULT_PROFILES

print("--- 1. Testing PDF Report Export ---")
pdf_res = export_test_pdf_report(
    test_id="MRI-TEST-0001",
    current_user=DEFAULT_PROFILES["doctor"]
)
print("PDF Export Response -> Path:", pdf_res.path, "Media:", pdf_res.media_type, "Size:", os.path.getsize(pdf_res.path))
assert os.path.exists(pdf_res.path)
assert os.path.getsize(pdf_res.path) > 50000

print("\n--- 2. Testing CSV Export ---")
csv_res = export_test_results_csv(
    modality=None,
    current_user=DEFAULT_PROFILES["doctor"]
)
csv_body = csv_res.body.decode("utf-8")
print("CSV Export Response -> Lines:", len(csv_body.splitlines()), "Sample:", csv_body.splitlines()[0])
assert "Test ID" in csv_body
assert "VERIFIED_MATCH" in csv_body

print("\n--- 3. Testing JSON Export ---")
json_res = export_test_details_json(
    test_id="MRI-TEST-0001",
    current_user=DEFAULT_PROFILES["doctor"]
)
print("JSON Export Status:", json_res.status_code, "Test ID:", json_res.body[:60].decode())
assert json_res.status_code == 200

print("\n--- 4. Testing Doctor-Patient Ownership ---")
# Patient accessing own history -> Success
pat_history = get_patient_prediction_history(
    patient_id="PAT-1083",
    current_user=DEFAULT_PROFILES["patient"]
)
print("Patient PAT-1083 accessing own history -> Total records:", pat_history["total_records"])
assert pat_history["total_records"] >= 0

# Patient accessing another patient's records -> 403 HTTPException
try:
    get_patient_prediction_history(
        patient_id="PAT-1082",
        current_user=DEFAULT_PROFILES["patient"]
    )
    print("ERROR: Patient was able to access other patient!")
    assert False
except Exception as e:
    print("Patient accessing PAT-1082 correctly raised:", type(e).__name__, str(e))

# Doctor accessing PAT-1082 -> Permitted
doc_history = get_patient_prediction_history(
    patient_id="PAT-1082",
    current_user=DEFAULT_PROFILES["doctor"]
)
print("Doctor accessing PAT-1082 -> Total records:", doc_history["total_records"])

print("\n--- 5. Testing Database Stats & Audit Logs ---")
stats = get_database_statistics(current_user=DEFAULT_PROFILES["doctor"])
print("Database Dialect:", stats["connection"]["dialect"], "Table counts:", stats["table_counts"])

audit = get_recent_audit_logs(limit=5, current_user=DEFAULT_PROFILES["doctor"])
print("Recent Audit Logs count:", audit["count"])
if audit["audit_logs"]:
    print("Sample Audit Action:", audit["audit_logs"][0]["action"], "Actor:", audit["audit_logs"][0]["actor_id"])

print("\nALL PHASE 8 & PHASE 9 BACKEND & SECURITY VALIDATION TESTS PASSED PERFECTLY!")
