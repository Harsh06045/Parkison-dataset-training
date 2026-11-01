import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_endpoints():
    print("Testing Backend Live Endpoints...")
    
    # 1. Health
    try:
        r = requests.get(f"{BASE_URL}/api/health", timeout=5)
        print(f"1. /api/health: {r.status_code} {r.json()}")
    except Exception as e:
        print(f"1. /api/health failed: {e}")
        return

    # 2. Voice prediction (with sample audio file)
    try:
        with open("backend/static/samples/sample_voice.wav", "rb") as f:
            r = requests.post(f"{BASE_URL}/api/predict/voice", files={"file": ("sample_voice.wav", f, "audio/wav")}, timeout=10)
        print(f"2. /api/predict/voice: {r.status_code}")
        if r.status_code == 200:
            data = r.json()
            print(f"   Prediction: {data.get('prediction')}, Confidence: {data.get('confidence')}%, Uncertainty: {data.get('uncertainty')}%")
            print(f"   Acoustic features count: {len(data.get('acoustic_features', {}))}")
        else:
            print(f"   Error: {r.text}")
    except Exception as e:
        print(f"2. /api/predict/voice failed: {e}")

    # 3. Spiral prediction (with normal and parkinson samples)
    try:
        with open("datasets/test/images/parkinson/H_P000-0001_static.png", "rb") as f:
            r = requests.post(f"{BASE_URL}/api/predict/spiral", files={"image": ("H_P000-0001_static.png", f, "image/png")}, timeout=10)
        print(f"3. /api/predict/spiral: {r.status_code}")
        if r.status_code == 200:
            data = r.json()
            print(f"   Prediction: {data.get('prediction')}, Confidence: {data.get('confidence')}%, GradCAM: {data.get('gradcam')}")
        else:
            print(f"   Error: {r.text}")
    except Exception as e:
        print(f"3. /api/predict/spiral failed: {e}")

    # 4. Telemonitoring prediction (with single-row CSV)
    try:
        # Create a small temp CSV with 1 row
        with open("scratch/sample_telemonitor.csv", "w") as out:
            with open("datasets/test/telemonitoring/telemonitor_test.csv", "r") as src:
                lines = src.readlines()
                out.write(lines[0])
                out.write(lines[1])
                
        with open("scratch/sample_telemonitor.csv", "rb") as f:
            r = requests.post(f"{BASE_URL}/api/predict/telemonitor", files={"file": ("sample_telemonitor.csv", f, "text/csv")}, timeout=10)
        print(f"4. /api/predict/telemonitor: {r.status_code}")
        if r.status_code == 200:
            data = r.json()
            print(f"   Motor UPDRS: {data.get('motor_updrs')} (CI: {data.get('motor_confidence_interval')})")
            print(f"   Total UPDRS: {data.get('total_updrs')} (CI: {data.get('total_confidence_interval')})")
            print(f"   Clinical Type: {data.get('clinical_data_type')}")
        else:
            print(f"   Error: {r.text}")
    except Exception as e:
        print(f"4. /api/predict/telemonitor failed: {e}")

if __name__ == "__main__":
    test_endpoints()
