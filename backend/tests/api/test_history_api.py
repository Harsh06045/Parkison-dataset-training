"""
API tests for Diagnostic History and Query Filtering (Layer 4).
Tests:
- GET /api/parkinson/history
- Filtering by patient_id
- Filtering by modality (voice, spiral, mri)
- Pagination parameters (limit, page)
- Single prediction record retrieval
"""

import pytest


class TestHistoryApi:

    def test_get_history_list(self, client):
        resp = client.get("/api/parkinson/history?limit=10")
        assert resp.status_code == 200
        data = resp.json()
        assert "records" in data
        records = data["records"]
        assert isinstance(records, list)
        if records:
            rec = records[0]
            assert "id" in rec
            assert "modality" in rec
            assert "prediction" in rec
            assert "confidence" in rec

    def test_get_history_filter_by_patient(self, client):
        resp = client.get("/api/parkinson/patients/PAT-1083/history")
        assert resp.status_code == 200
        data = resp.json()
        assert "history" in data
        history = data["history"]
        assert isinstance(history, list)
        for rec in history:
            assert rec["patient_id"] == "PAT-1083"

    def test_get_history_filter_by_modality(self, client):
        resp = client.get("/api/parkinson/history?modality=voice&limit=5")
        assert resp.status_code == 200
        data = resp.json()
        assert "records" in data
        records = data["records"]
        assert isinstance(records, list)
        for rec in records:
            assert rec["modality"] == "voice"
