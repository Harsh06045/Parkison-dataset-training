import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_phase4():
    print("=" * 75)
    print("PHASE 4 BACKEND INTEGRATION ENDPOINT TEST SUITE")
    print("=" * 75)

    session = requests.Session()

    # 1. Health Check with Individual Model Health Status
    print("\n1. Testing System & Model Health Check (/api/health & /api/v1/health)...")
    r = session.get(f"{BASE_URL}/api/health", timeout=5)
    print(f"  GET /api/health -> Status: {r.status_code}")
    assert r.status_code == 200
    h_data = r.json()
    print(f"  System Status: {h_data.get('status')}")
    print(f"  Device:        {h_data.get('device')}")
    print(f"  Model Status:  {h_data.get('models')}")
    print(f"  X-Request-ID:  {r.headers.get('X-Request-ID')}")

    # 2. Voice Prediction API
    print("\n2. Testing Voice Prediction API (POST /api/parkinson/voice/predict)...")
    with open("backend/static/samples/sample_voice.wav", "rb") as f:
        files = {"file": ("sample_voice.wav", f, "audio/wav")}
        data = {"patient_id": "PAT-1083"}
        r = session.post(f"{BASE_URL}/api/parkinson/voice/predict", files=files, data=data, timeout=10)
    print(f"  Status: {r.status_code}")
    assert r.status_code == 200
    v_data = r.json()
    voice_pred_id = v_data["prediction_id"]
    print(f"  Prediction ID: {voice_pred_id}")
    print(f"  Prediction:    {v_data.get('prediction')} ({v_data.get('confidence')}%)")
    print(f"  Uncertainty:   {v_data.get('uncertainty')}%")
    print(f"  Biomarkers:    {len(v_data.get('acoustic_features', {}))} physical parameters")
    print(f"  SHAP Top:      {v_data.get('shap_explanation', {}).get('top_biomarkers', [])[:2]}")

    # 3. Spiral Prediction API
    print("\n3. Testing Spiral Drawing API (POST /api/parkinson/spiral/predict)...")
    with open("datasets/test/images/parkinson/H_P000-0001_static.png", "rb") as f:
        files = {"image": ("H_P000-0001_static.png", f, "image/png")}
        data = {"patient_id": "PAT-1083"}
        r = session.post(f"{BASE_URL}/api/parkinson/spiral/predict", files=files, data=data, timeout=10)
    print(f"  Status: {r.status_code}")
    assert r.status_code == 200
    sp_data = r.json()
    spiral_pred_id = sp_data["prediction_id"]
    print(f"  Prediction ID: {spiral_pred_id}")
    print(f"  Prediction:    {sp_data.get('prediction')} ({sp_data.get('confidence')}%)")
    print(f"  Grad-CAM URL:  {sp_data.get('gradcam', {}).get('overlay')}")

    # 4. Telemonitoring Prediction API
    print("\n4. Testing Telemonitoring API (POST /api/parkinson/telemonitoring/predict)...")
    with open("scratch/sample_telemonitor.csv", "rb") as f:
        files = {"file": ("sample_telemonitor.csv", f, "text/csv")}
        data = {"patient_id": "PAT-1083"}
        r = session.post(f"{BASE_URL}/api/parkinson/telemonitoring/predict", files=files, data=data, timeout=10)
    print(f"  Status: {r.status_code}")
    assert r.status_code == 200
    t_data = r.json()
    tele_pred_id = t_data["prediction_id"]
    print(f"  Prediction ID: {tele_pred_id}")
    print(f"  Motor UPDRS:   {t_data.get('motor_updrs')} (95% CI: {t_data.get('motor_confidence_interval')})")
    print(f"  Total UPDRS:   {t_data.get('total_updrs')} (95% CI: {t_data.get('total_confidence_interval')})")
    print(f"  Clinical Type: {t_data.get('clinical_data_type')}")

    # 5. Multimodal Fusion Prediction API
    print("\n5. Testing Multimodal Fusion API (POST /api/parkinson/fusion/predict)...")
    with open("backend/static/samples/sample_voice.wav", "rb") as f_v, \
         open("datasets/test/images/parkinson/H_P000-0001_static.png", "rb") as f_s:
        files = {
            "voice": ("sample_voice.wav", f_v, "audio/wav"),
            "spiral": ("H_P000-0001_static.png", f_s, "image/png")
        }
        data = {"patient_id": "PAT-1083"}
        r = session.post(f"{BASE_URL}/api/parkinson/fusion/predict", files=files, data=data, timeout=15)
    print(f"  Status: {r.status_code}")
    assert r.status_code == 200
    fu_data = r.json()
    fusion_pred_id = fu_data["prediction_id"]
    print(f"  Prediction ID: {fusion_pred_id}")
    print(f"  Prediction:    {fu_data.get('prediction')} ({fu_data.get('confidence')}%)")
    print(f"  Uncertainty:   {fu_data.get('uncertainty')}%")
    print(f"  Present:       {fu_data.get('present_modalities')}")
    print(f"  Contributions: {fu_data.get('modality_contributions')}")

    # 6. Prediction Retrieval by ID
    print(f"\n6. Testing Result Retrieval by ID (GET /api/parkinson/predictions/{fusion_pred_id})...")
    r = session.get(f"{BASE_URL}/api/parkinson/predictions/{fusion_pred_id}", timeout=5)
    print(f"  Status: {r.status_code}")
    assert r.status_code == 200
    rec = r.json()
    print(f"  Retrieved ID:  {rec.get('id')}")
    print(f"  Patient ID:    {rec.get('patient_id')}")
    print(f"  Timestamp:     {rec.get('timestamp')}")
    print(f"  Modality:      {rec.get('modality')}")

    # 7. Patient Longitudinal History
    print("\n7. Testing Patient Longitudinal History (GET /api/parkinson/patients/PAT-1083/history)...")
    r = session.get(f"{BASE_URL}/api/parkinson/patients/PAT-1083/history", timeout=5)
    print(f"  Status: {r.status_code}")
    assert r.status_code == 200
    p_hist = r.json()
    print(f"  Total records for PAT-1083: {p_hist.get('total_records')}")
    for item in p_hist.get("history", [])[:3]:
        print(f"    • [{item.get('timestamp')[:10]}] Modality={item.get('modality'):12s} | Pred={item.get('prediction'):12s} | Conf={item.get('confidence')}%")

    # 8. Preserved Alzheimer's Prediction
    print("\n8. Verifying Preserved Alzheimer's Endpoint (POST /analysis/alzheimer/predict)...")
    import os
    sample_img = "backend/static/samples/sample_mri.png" if os.path.exists("backend/static/samples/sample_mri.png") else "datasets/test/images/parkinson/H_P000-0001_static.png"
    with open(sample_img, "rb") as f:
        files = {"file": ("test_mri.png", f, "image/png")}
        data = {"patientId": "PAT-1082", "modality": "MRI"}
        r = session.post(f"{BASE_URL}/analysis/alzheimer/predict", files=files, data=data, timeout=10)
    print(f"  Status: {r.status_code}")
    assert r.status_code == 200
    ad_data = r.json()
    print(f"  Disease:       {ad_data.get('disease')}")
    print(f"  Prediction:    {ad_data.get('prediction')} ({ad_data.get('confidence')}%)")
    print(f"  Grad-CAM:      {ad_data.get('gradCam', {}).get('overlayImageUrl')}")
    print("  [SUCCESS] Alzheimer endpoints fully functional and preserved.")

    print("\n" + "=" * 75)
    print("ALL PHASE 4 ENDPOINTS TESTED & VERIFIED OPERATIONAL!")
    print("=" * 75)

if __name__ == "__main__":
    test_phase4()
