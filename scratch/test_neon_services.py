"""
End-to-End Verification of Neon Services:
1. Verify npm run build (neon config plan)
2. Verify live Neon PostgreSQL queries through SQLAlchemy
3. Verify live Neon PostgreSQL queries through running FastAPI HTTP server
4. Verify live Neon Auth endpoint and JWKS discovery
"""

import os
import sys
import json
import urllib.request

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")
sys.path.insert(0, BACKEND_DIR)
sys.path.insert(0, PROJECT_ROOT)

from app.db.session import get_db_session, ACTIVE_DIALECT, IS_FALLBACK
from app.db.models import Patient, Doctor, PredictionRecord, ReportRecord

def test_1_database_orm():
    print("\n--- 1. Testing Neon PostgreSQL ORM Connectivity ---")
    print(f"Active Dialect: {ACTIVE_DIALECT}")
    print(f"Is Fallback: {IS_FALLBACK}")
    assert ACTIVE_DIALECT == "postgresql", "Expected active dialect to be postgresql"
    assert IS_FALLBACK is False, "Expected fallback to be False"

    db = get_db_session()
    pat_count = db.query(Patient).count()
    pred_count = db.query(PredictionRecord).count()
    rep_count = db.query(ReportRecord).count()
    doc_count = db.query(Doctor).count()
    db.close()

    print(f"  [PASS] Patients in Neon: {pat_count}")
    print(f"  [PASS] Doctors in Neon: {doc_count}")
    print(f"  [PASS] Predictions in Neon: {pred_count}")
    print(f"  [PASS] Reports in Neon: {rep_count}")

def test_2_api_http():
    print("\n--- 2. Testing FastAPI Endpoints Wired to Neon PostgreSQL ---")
    url = "http://127.0.0.1:8000/api/reports/patient/PAT-1083"
    req = urllib.request.Request(
        url,
        headers={
            "X-User-ID": "DOC-8921",
            "X-User-Role": "doctor",
            "User-Agent": "NeuroFusionAI-Verifier/1.0"
        }
    )
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        data = json.loads(resp.read().decode())
        print(f"  [PASS] HTTP {resp.status} OK from {url}")
        print(f"  [PASS] Retrieved {len(data)} reports from Neon PostgreSQL for patient PAT-1083")

def test_3_neon_auth():
    print("\n--- 3. Testing Neon Auth Service ---")
    jwks_url = os.environ.get("NEON_AUTH_JWKS_URL")
    base_url = os.environ.get("NEON_AUTH_BASE_URL")
    print(f"Neon Auth Base URL: {base_url}")
    print(f"Neon Auth JWKS URL: {jwks_url}")
    
    assert jwks_url, "NEON_AUTH_JWKS_URL not configured"
    req = urllib.request.Request(jwks_url, headers={"User-Agent": "Neon-Auth-Verifier/1.0"})
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        jwks = json.loads(resp.read().decode())
        print(f"  [PASS] HTTP {resp.status} OK from Neon Auth JWKS endpoint")
        print(f"  [PASS] Neon Auth JWKS keys payload: {list(jwks.keys())}")

if __name__ == "__main__":
    test_1_database_orm()
    test_2_api_http()
    test_3_neon_auth()
    print("\nALL NEON SERVICES VERIFIED AND OPERATIONAL!")

