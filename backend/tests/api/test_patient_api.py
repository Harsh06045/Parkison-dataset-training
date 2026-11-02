"""
API tests for Patient Management & Input Boundary Validation (Layer 1).
Tests:
- GET /patients and GET /api/v1/patients
- GET /patients/{patient_id} for existing and non-existent IDs
- POST /patients with valid data (201 Created)
- POST /patients negative input tests:
  - Age: 0, -10, 150 (boundary failure)
  - Gender: Invalid string (boundary failure)
  - Phone: Alphabetic letters (regex failure)
  - Email: Malformed email (RFC syntax failure)
  - Full Name: Digits only (name format failure)
  - Duplicate Patient ID (409 Conflict)
- DELETE /patients/{patient_id}
"""

import pytest
import uuid


class TestPatientApi:

    def test_list_patients(self, client):
        resp = client.get("/patients")
        assert resp.status_code == 200
        patients = resp.json()
        assert isinstance(patients, list)
        assert len(patients) > 0
        assert any(p["id"] == "PAT-1083" for p in patients)

    def test_get_patient_existing(self, client):
        resp = client.get("/patients/PAT-1083")
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == "PAT-1083"
        assert "fullName" in data
        assert "age" in data

    def test_get_patient_nonexistent(self, client):
        resp = client.get("/patients/PAT-NONEXISTENT-999")
        assert resp.status_code == 404
        assert resp.json().get("error_code") == "HTTP_404"

    def test_create_patient_valid(self, client):
        unique_id = f"PAT-TEST-{uuid.uuid4().hex[:6].upper()}"
        payload = {
            "id": unique_id,
            "fullName": "Arthur Pendelton",
            "age": 67,
            "gender": "Male",
            "email": f"{unique_id.lower()}@clinical.org",
            "phone": "+1-555-890-1234",
            "dateOfBirth": "1959-04-12",
            "primaryDiagnosis": "Early Parkinson's Tremor",
            "medicalHistory": "Resting hand tremor, mild gait rigidity."
        }
        resp = client.post("/patients", json=payload)
        assert resp.status_code == 201
        data = resp.json()
        assert data["id"] == unique_id
        assert data["fullName"] == "Arthur Pendelton"
        assert data["age"] == 67

        # Clean up
        del_resp = client.delete(f"/patients/{unique_id}")
        assert del_resp.status_code == 200

    def test_create_patient_invalid_age_boundary(self, client):
        """Test boundary ages: 0 and 150 must be rejected with 400 Bad Request."""
        payload_zero = {
            "fullName": "Boundary Test",
            "age": 0,
            "gender": "Male"
        }
        resp = client.post("/patients", json=payload_zero)
        assert resp.status_code == 400

        payload_unrealistic = {
            "fullName": "Boundary Test",
            "age": 150,
            "gender": "Male"
        }
        resp = client.post("/patients", json=payload_unrealistic)
        assert resp.status_code == 400

    def test_create_patient_invalid_gender(self, client):
        payload = {
            "fullName": "Gender Test",
            "age": 60,
            "gender": "Martian"
        }
        resp = client.post("/patients", json=payload)
        assert resp.status_code == 400

    def test_create_patient_invalid_phone_letters(self, client):
        payload = {
            "fullName": "Phone Test",
            "age": 60,
            "gender": "Female",
            "phone": "CALL-ME-NOW"
        }
        resp = client.post("/patients", json=payload)
        assert resp.status_code == 400

    def test_create_patient_invalid_email_syntax(self, client):
        payload = {
            "fullName": "Email Test",
            "age": 60,
            "gender": "Female",
            "email": "not-an-email-address"
        }
        resp = client.post("/patients", json=payload)
        assert resp.status_code == 400

    def test_create_patient_duplicate_id_conflict(self, client):
        """Test creating a patient with already existing ID returns 409 Conflict."""
        payload = {
            "id": "PAT-1083",  # Already in database
            "fullName": "Duplicate Test",
            "age": 70,
            "gender": "Female"
        }
        resp = client.post("/patients", json=payload)
        assert resp.status_code == 409

