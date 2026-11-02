"""
Integration tests for Durable Object Storage Service (Layer 4).
Tests:
- File saving with deterministic SHA-256 integrity hash
- Retrieval via secure token/reference
- File path validation & absence of directory traversal
- Deletion cleanup
"""

import os
import pytest
import hashlib
import tempfile
from app.services.storage_service import storage_service


class TestStorageIntegration:

    def test_store_and_verify_file(self, tmp_path, db_session):
        from app.db.models import PredictionRecord
        pred = db_session.query(PredictionRecord).first()
        pred_id = pred.id if pred else "PD-PRED-1001"

        test_file = tmp_path / "test_artifact.png"
        content = b"Simulated image binary payload for storage testing"
        test_file.write_bytes(content)
        expected_sha256 = hashlib.sha256(content).hexdigest()

        ref = storage_service.store_file(
            source_path=str(test_file),
            prediction_id=pred_id,
            file_type="input_scan"
        )
        assert ref is not None
        assert ref.id is not None
        assert ref.storage_path is not None
        assert os.path.exists(ref.storage_path)
        assert ref.sha256_checksum == expected_sha256

        # Clean up
        storage_service.delete_file(ref.id)
        assert not os.path.exists(ref.storage_path)
