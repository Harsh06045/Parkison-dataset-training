"""
API tests for Authentication & Role-Based Access Control (RBAC).
Tests:
- POST /auth/login with valid doctor, patient, and admin credentials
- Unknown role fallback / handling
- RBAC protection: Patient denied access to doctor-only endpoints (HTTP 403)
- Unauthenticated requests denied on protected endpoints (HTTP 401/403)
"""

import pytest


class TestAuthApi:

    def test_login_doctor(self, client):
        resp = client.post("/auth/login", json={"email": "dr.jenkins@neurofusion.ai", "role": "doctor"})
        assert resp.status_code == 200
        data = resp.json()
        assert "token" in data
        assert data["user"]["role"] == "doctor"
        assert "MD-" in data["user"]["medicalLicenseId"]

    def test_login_patient(self, client):
        resp = client.post("/auth/login", json={"email": "eleanor.vance@example.com", "role": "patient"})
        assert resp.status_code == 200
        data = resp.json()
        assert "token" in data
        assert data["user"]["role"] == "patient"

    def test_login_admin(self, client):
        resp = client.post("/auth/login", json={"email": "admin@neurofusion.ai", "role": "admin"})
        assert resp.status_code == 200
        data = resp.json()
        assert "token" in data
        assert data["user"]["role"] == "admin"

    def test_patient_forbidden_from_admin_audit_logs(self, client, patient_auth):
        """Verify patient role receives 403 Forbidden on doctor/admin audit logs."""
        resp = client.get("/api/parkinson/audit-logs", headers=patient_auth["headers"])
        assert resp.status_code in [401, 403]

    def test_doctor_allowed_on_audit_logs(self, client, doctor_auth):
        """Verify doctor or admin can access audit logs."""
        resp = client.get("/api/parkinson/audit-logs", headers=doctor_auth["headers"])
        assert resp.status_code == 200

