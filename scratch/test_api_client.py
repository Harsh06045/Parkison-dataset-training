import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

res = client.get("/api/testing/summary")
print("GET /api/testing/summary -> Status:", res.status_code)
data = res.json()
print("Models in summary:", list(data.get("models", {}).keys()))

res_records = client.get("/api/testing/records?limit=5")
print("GET /api/testing/records?limit=5 -> Status:", res_records.status_code)
print("Records returned:", len(res_records.json().get("records", [])))

res_mri = client.get("/api/testing/mri?limit=2")
print("GET /api/testing/mri -> Status:", res_mri.status_code)

res_static = client.get("/static/testing/roc_curves_combined.png")
print("GET /static/testing/roc_curves_combined.png -> Status:", res_static.status_code, "Size:", len(res_static.content))

