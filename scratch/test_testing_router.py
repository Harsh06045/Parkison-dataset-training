import os
import sys
from pathlib import Path

# Add backend to path and set mpl cache
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))
os.environ["MPLCONFIGDIR"] = str(Path(__file__).resolve().parent.parent / "backend" / "uploads" / "mpl")

from fastapi import FastAPI
from fastapi.testclient import TestClient
from app.api.testing import router as testing_router
from app.api.parkinson import router as parkinson_router

test_app = FastAPI()
test_app.include_router(testing_router, prefix="/api/testing")
test_app.include_router(parkinson_router, prefix="/api/parkinson")

client = TestClient(test_app)

print("--- 1. Testing PDF Report Export ---")
res_pdf = client.get("/api/testing/export/pdf")
print("GET /api/testing/export/pdf -> Status:", res_pdf.status_code, "Content-Type:", res_pdf.headers.get("content-type"), "Size:", len(res_pdf.content))
assert res_pdf.status_code == 200
assert b"%PDF" in res_pdf.content[:10]

print("\n--- 2. Testing CSV Export ---")
res_csv = client.get("/api/testing/export/csv", headers={"X-User-Role": "doctor"})
print("GET /api/testing/export/csv (doctor) -> Status:", res_csv.status_code, "Size:", len(res_csv.content))
assert res_csv.status_code == 200
assert "Test ID" in res_csv.text

# Test role restriction: Patient trying to access CSV export gets 403
res_csv_pat = client.get("/api/testing/export/csv", headers={"X-User-Role": "patient"})
print("GET /api/testing/export/csv (patient) -> Status:", res_csv_pat.status_code)
assert res_csv_pat.status_code == 403

print("\n--- 3. Testing JSON Export ---")
res_json = client.get("/api/testing/export/json?test_id=TEST-SPIRAL-001", headers={"X-User-Role": "doctor"})
print("GET /api/testing/export/json -> Status:", res_json.status_code, "Record ID:", res_json.json().get("record", {}).get("test_id"))
assert res_json.status_code == 200

print("\n--- 4. Testing Doctor-Patient Ownership ---")
# Patient Eleanor Vance (PAT-1083) accessing her own history -> 200
res_own = client.get("/api/parkinson/patients/PAT-1083/history", headers={"X-User-Role": "patient", "X-User-ID": "PAT-1083"})
print("Patient PAT-1083 accessing own history -> Status:", res_own.status_code)
assert res_own.status_code == 200

# Patient Eleanor Vance (PAT-1083) accessing Arthur Pendelton (PAT-1082) -> 403 Forbidden!
res_other = client.get("/api/parkinson/patients/PAT-1082/history", headers={"X-User-Role": "patient", "X-User-ID": "PAT-1083"})
print("Patient PAT-1083 accessing PAT-1082 history -> Status:", res_other.status_code)
assert res_other.status_code == 403

# Doctor accessing PAT-1082 -> 200
res_doc = client.get("/api/parkinson/patients/PAT-1082/history", headers={"X-User-Role": "doctor"})
print("Doctor accessing PAT-1082 history -> Status:", res_doc.status_code)
assert res_doc.status_code == 200

print("\n--- 5. Testing Database Stats & Audit Logs ---")
res_stats = client.get("/api/parkinson/db/stats", headers={"X-User-Role": "doctor"})
print("GET /api/parkinson/db/stats -> Status:", res_stats.status_code, "Counts:", res_stats.json().get("table_counts"))

res_audit = client.get("/api/parkinson/audit-logs", headers={"X-User-Role": "doctor"})
print("GET /api/parkinson/audit-logs -> Status:", res_audit.status_code, "Count:", res_audit.json().get("count"))

print("\nALL PHASE 8 & PHASE 9 BACKEND & SECURITY TESTS PASSED SUCCESSFULLY!")
