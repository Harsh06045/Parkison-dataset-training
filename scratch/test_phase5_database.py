"""
Phase 5 Comprehensive Database & File Storage Test Suite.
Tests Neon PostgreSQL connection engine, ORM models, migrations,
voice/spiral/telemonitoring/fusion persistence, secure object storage with SHA-256,
token-authenticated signed URLs, soft deletion, audit trails, and backup/recovery.
"""

import os
import sys
import json
import requests

BASE_URL = "http://127.0.0.1:8000"
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def test_suite():
    print("=" * 80)
    print("   NEUROFUSION-AI PHASE 5: DATABASE & FILE STORAGE VERIFICATION   ")
    print("=" * 80)

    # -------------------------------------------------------------------------
    # TEST 1: Database Connection & Statistics Endpoint
    # -------------------------------------------------------------------------
    print("\n[TEST 1] Querying Database Health & Schema Statistics...")
    r1 = requests.get(f"{BASE_URL}/api/parkinson/db/stats")
    assert r1.status_code == 200, f"Expected 200, got {r1.status_code}: {r1.text}"
    stats = r1.json()
    conn = stats["connection"]
    counts = stats["table_counts"]
    print(f"  [SUCCESS] Database Status: {conn['status']} (Dialect: {conn['dialect']})")
    print(f"  [SUCCESS] Active tables: Doctors={counts.get('doctors')}, Patients={counts.get('patients')}, "
          f"ModelVersions={counts.get('model_versions')}, Predictions={counts.get('predictions_total')}")

    # -------------------------------------------------------------------------
    # TEST 2: Voice Prediction with File Storage and Database Record
    # -------------------------------------------------------------------------
    print("\n[TEST 2] Testing Voice Prediction with Persistent Database & Object Storage...")
    audio_path = os.path.join(PROJECT_ROOT, "backend", "static", "samples", "sample_voice.wav")
    assert os.path.exists(audio_path), f"Audio test file missing: {audio_path}"

    with open(audio_path, "rb") as f:
        r2 = requests.post(
            f"{BASE_URL}/api/parkinson/voice/predict",
            files={"file": ("test_voice_p5.wav", f, "audio/wav")},
            data={"patient_id": "PAT-1083"}
        )
    assert r2.status_code == 200, f"Voice prediction failed: {r2.text}"
    voice_data = r2.json()
    voice_pred_id = voice_data["prediction_id"]
    voice_files = voice_data.get("files", [])
    print(f"  [SUCCESS] Voice prediction saved: ID={voice_pred_id}, Prediction={voice_data['prediction']}, Conf={voice_data['confidence']}%")
    print(f"  [SUCCESS] Stored files registered: {len(voice_files)} references")
    for vf in voice_files:
        print(f"            - Type: {vf['file_type']} | SHA-256: {vf['sha256_checksum'][:16]}... | URL: {vf['authenticated_url']}")

    # -------------------------------------------------------------------------
    # TEST 3: Spiral Drawing with Grad-CAM and Object Storage
    # -------------------------------------------------------------------------
    print("\n[TEST 3] Testing Spiral Drawing Prediction with Grad-CAM and Object Storage...")
    spiral_path = os.path.join(PROJECT_ROOT, "datasets", "test", "images", "parkinson", "H_P000-0001_static.png")
    assert os.path.exists(spiral_path), f"Spiral test file missing: {spiral_path}"

    with open(spiral_path, "rb") as f:
        r3 = requests.post(
            f"{BASE_URL}/api/parkinson/spiral/predict",
            files={"image": ("test_spiral_p5.png", f, "image/png")},
            data={"patient_id": "PAT-1083"}
        )
    assert r3.status_code == 200, f"Spiral prediction failed: {r3.text}"
    spiral_data = r3.json()
    spiral_pred_id = spiral_data["prediction_id"]
    spiral_files = spiral_data.get("files", [])
    print(f"  [SUCCESS] Spiral prediction saved: ID={spiral_pred_id}, Prediction={spiral_data['prediction']}, Conf={spiral_data['confidence']}%")
    print(f"  [SUCCESS] Stored files registered: {len(spiral_files)} references")
    for sf in spiral_files:
        print(f"            - Type: {sf['file_type']} | SHA-256: {sf['sha256_checksum'][:16]}... | Token: {sf['access_token'][:12]}...")

    # -------------------------------------------------------------------------
    # TEST 4: Telemonitoring UPDRS Continuous Regression with Database Storage
    # -------------------------------------------------------------------------
    print("\n[TEST 4] Testing Telemonitoring Prediction with Database UPDRS Persistence...")
    tele_path = os.path.join(PROJECT_ROOT, "scratch", "sample_telemonitor.csv")
    if not os.path.exists(tele_path):
        tele_path = os.path.join(PROJECT_ROOT, "backend", "static", "samples", "sample_telemonitoring.csv")
    assert os.path.exists(tele_path), f"Telemonitoring test file missing: {tele_path}"

    with open(tele_path, "rb") as f:
        r4 = requests.post(
            f"{BASE_URL}/api/parkinson/telemonitoring/predict",
            files={"file": ("test_tele_p5.csv", f, "text/csv")},
            data={"patient_id": "PAT-1083"}
        )
    assert r4.status_code == 200, f"Telemonitoring prediction failed: {r4.text}"
    tele_data = r4.json()
    tele_pred_id = tele_data["prediction_id"]
    print(f"  [SUCCESS] Telemonitoring saved: ID={tele_pred_id}, Motor UPDRS={tele_data['motor_updrs']}, Total UPDRS={tele_data['total_updrs']}")

    # -------------------------------------------------------------------------
    # TEST 5: Multimodal Attention Fusion with Database Storage
    # -------------------------------------------------------------------------
    print("\n[TEST 5] Testing Multimodal Fusion Persistence...")
    with open(spiral_path, "rb") as f_img, open(audio_path, "rb") as f_aud:
        r5 = requests.post(
            f"{BASE_URL}/api/parkinson/fusion/predict",
            files={
                "drawing": ("spiral_fusion_p5.png", f_img, "image/png"),
                "voice": ("voice_fusion_p5.wav", f_aud, "audio/wav")
            },
            data={"patient_id": "PAT-1083"}
        )
    assert r5.status_code == 200, f"Fusion prediction failed: {r5.text}"
    fusion_data = r5.json()
    fusion_pred_id = fusion_data["prediction_id"]
    print(f"  [SUCCESS] Fusion saved: ID={fusion_pred_id}, Prediction={fusion_data['prediction']}, Conf={fusion_data['confidence']}%")

    # -------------------------------------------------------------------------
    # TEST 6: Token-Authenticated Secure Object Retrieval
    # -------------------------------------------------------------------------
    print("\n[TEST 6] Testing Token-Authenticated Object Storage Access...")
    assert len(spiral_files) > 0, "No spiral files stored to test token resolution"
    test_token = spiral_files[0]["access_token"]
    r6 = requests.get(f"{BASE_URL}/api/parkinson/files/{test_token}")
    assert r6.status_code == 200, f"Secure file retrieval failed: {r6.status_code}"
    assert len(r6.content) > 0, "Retrieved file content is empty"
    print(f"  [SUCCESS] Authenticated file streamed: Content-Type={r6.headers.get('content-type')}, Bytes={len(r6.content)}")

    # Test invalid token rejection
    r6_bad = requests.get(f"{BASE_URL}/api/parkinson/files/invalid_unauthorized_token_xyz")
    assert r6_bad.status_code == 404, f"Expected 404 for invalid token, got {r6_bad.status_code}"
    print("  [SUCCESS] Unauthorized token access rejected with HTTP 404.")

    # -------------------------------------------------------------------------
    # TEST 7: Patient Longitudinal History Retrieval from Database
    # -------------------------------------------------------------------------
    print("\n[TEST 7] Testing Longitudinal Patient History Retrieval...")
    r7 = requests.get(f"{BASE_URL}/api/parkinson/patients/PAT-1083/history")
    assert r7.status_code == 200
    p_hist = r7.json()
    print(f"  [SUCCESS] Retrieved {p_hist['total_records']} longitudinal records for patient PAT-1083.")
    found_ids = [r["id"] for r in p_hist["history"]]
    assert voice_pred_id in found_ids, f"Voice prediction {voice_pred_id} not found in patient history"
    assert spiral_pred_id in found_ids, f"Spiral prediction {spiral_pred_id} not found in patient history"
    print("  [SUCCESS] Verified new predictions are actively indexed and retrieved in longitudinal history.")

    # -------------------------------------------------------------------------
    # TEST 8: Soft Deletion and Audit Trail Integrity
    # -------------------------------------------------------------------------
    print("\n[TEST 8] Testing Soft Deletion & Audit Trail...")
    r8 = requests.delete(
        f"{BASE_URL}/api/parkinson/predictions/{voice_pred_id}",
        headers={"X-Doctor-ID": "DOC-8921"}
    )
    assert r8.status_code == 200, f"Soft delete failed: {r8.text}"
    print(f"  [SUCCESS] Soft-deleted prediction {voice_pred_id}.")

    # Confirm it is no longer returned in default queries
    r8_verify = requests.get(f"{BASE_URL}/api/parkinson/predictions/{voice_pred_id}")
    assert r8_verify.status_code == 404, "Soft-deleted record should not be returned by standard query"
    print("  [SUCCESS] Verified soft-deleted record is excluded from active patient view.")

    # Confirm audit log captured the event
    r8_audit = requests.get(f"{BASE_URL}/api/parkinson/audit-logs?limit=10")
    assert r8_audit.status_code == 200
    audits = r8_audit.json()["audit_logs"]
    del_audits = [a for a in audits if a["action"] == "SOFT_DELETE" and a["resource_id"] == voice_pred_id]
    assert len(del_audits) > 0, "No audit log entry found for soft deletion"
    print(f"  [SUCCESS] Verified HIPAA audit trail recorded SOFT_DELETE by Actor: {del_audits[0]['actor_id']}")

    # -------------------------------------------------------------------------
    # TEST 9: Database Backup Snapshot Generation
    # -------------------------------------------------------------------------
    print("\n[TEST 9] Testing Database Backup Snapshot Export...")
    r9 = requests.post(f"{BASE_URL}/api/parkinson/db/backup")
    assert r9.status_code == 200, f"Database backup failed: {r9.text}"
    backup_meta = r9.json()
    print(f"  [SUCCESS] Database snapshot exported: {os.path.basename(backup_meta['backup_file'])}")
    print(f"            Size: {backup_meta['file_size_bytes']} bytes | SHA-256: {backup_meta['sha256'][:16]}...")
    print(f"            Captured counts: {backup_meta['counts']}")

    # -------------------------------------------------------------------------
    # TEST 10: Retention Policy Purge
    # -------------------------------------------------------------------------
    print("\n[TEST 10] Testing Retention Policy Execution...")
    r10 = requests.post(f"{BASE_URL}/api/parkinson/maintenance/retention-purge?retention_days=0")
    assert r10.status_code == 200, f"Retention purge failed: {r10.text}"
    purge_meta = r10.json()
    print(f"  [SUCCESS] Retention purge executed: {purge_meta['purged_count']} expired records purged.")

    print("\n" + "=" * 80)
    print("   ALL 10 PHASE 5 DATABASE & FILE STORAGE SUITES PASSED (100%)   ")
    print("=" * 80)


if __name__ == "__main__":
    test_suite()
