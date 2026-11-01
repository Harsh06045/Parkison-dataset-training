import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_live_fusion():
    print("Testing Live Fusion Endpoint with Missing Modality Combinations...")
    
    # 1. Voice + Spiral only (Core Pair)
    with open("backend/static/samples/sample_voice.wav", "rb") as f_v, \
         open("datasets/test/images/parkinson/H_P000-0001_static.png", "rb") as f_s:
        files = {
            "voice": ("sample_voice.wav", f_v, "audio/wav"),
            "spiral": ("H_P000-0001_static.png", f_s, "image/png")
        }
        r = requests.post(f"{BASE_URL}/api/predict/fusion", files=files, timeout=15)
        print("\n1. Voice + Spiral (Core Pair):", r.status_code)
        if r.status_code == 200:
            data = r.json()
            print("   Prediction:   ", data.get("prediction"), f"({data.get('confidence')}%)")
            print("   Uncertainty:  ", data.get("uncertainty"), "%")
            print("   Contributions:", data.get("modality_contributions"))
            print("   Present:      ", data.get("present_modalities"))
            print("   Missing:      ", data.get("missing_modalities"))
            print("   OOD Analysis: ", data.get("ood_analysis"))
        else:
            print("   Error:", r.text)

    # 2. Spiral only
    with open("datasets/test/images/parkinson/H_P000-0001_static.png", "rb") as f_s:
        files = {
            "spiral": ("H_P000-0001_static.png", f_s, "image/png")
        }
        r = requests.post(f"{BASE_URL}/api/predict/fusion", files=files, timeout=15)
        print("\n2. Spiral Only:", r.status_code)
        if r.status_code == 200:
            data = r.json()
            print("   Prediction:   ", data.get("prediction"), f"({data.get('confidence')}%)")
            print("   Contributions:", data.get("modality_contributions"))

    # 3. Voice + Spiral + Telemonitor
    with open("backend/static/samples/sample_voice.wav", "rb") as f_v, \
         open("datasets/test/images/parkinson/H_P000-0001_static.png", "rb") as f_s, \
         open("scratch/sample_telemonitor.csv", "rb") as f_t:
        files = {
            "voice": ("sample_voice.wav", f_v, "audio/wav"),
            "spiral": ("H_P000-0001_static.png", f_s, "image/png"),
            "telemonitor": ("sample_telemonitor.csv", f_t, "text/csv")
        }
        r = requests.post(f"{BASE_URL}/api/predict/fusion", files=files, timeout=15)
        print("\n3. Voice + Spiral + Telemonitor:", r.status_code)
        if r.status_code == 200:
            data = r.json()
            print("   Prediction:   ", data.get("prediction"), f"({data.get('confidence')}%)")
            print("   Contributions:", data.get("modality_contributions"))
            print("   Clinical:     ", data.get("clinical_review"))

    # 4. Zero modalities (Validation rejection check)
    r = requests.post(f"{BASE_URL}/api/predict/fusion", data={}, timeout=10)
    print("\n4. Zero modalities rejection check:", r.status_code, "(Expected 400)")

if __name__ == "__main__":
    test_live_fusion()

