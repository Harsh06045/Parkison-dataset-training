import os
import sys
import unittest
from fastapi.testclient import TestClient

# Setup sys.path
TEST_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(TEST_DIR)
PROJECT_ROOT = os.path.dirname(BACKEND_DIR)

sys.path.insert(0, BACKEND_DIR)
sys.path.insert(0, PROJECT_ROOT)

from app.main import app

class TestParkinsonBackendAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        try:
            import httpx
            cls.client = httpx.Client(base_url="http://127.0.0.1:8000", timeout=30.0)
            cls.use_live = True
        except Exception:
            cls.client_ctx = TestClient(app)
            cls.client = cls.client_ctx.__enter__()
            cls.use_live = False
        
        # Test files paths
        cls.mri_file = os.path.join(PROJECT_ROOT, "testing", "inputs", "mri", "mri_axial.png")
        if not os.path.exists(cls.mri_file):
            cls.mri_file = os.path.join(PROJECT_ROOT, "sample_mri.png")
        if not os.path.exists(cls.mri_file):
            cls.mri_file = os.path.join(BACKEND_DIR, "static", "samples", "sample_mri.png")

        cls.spiral_file = os.path.join(PROJECT_ROOT, "testing", "inputs", "spiral", "spiral_parkinson.png")
        if not os.path.exists(cls.spiral_file):
            cls.spiral_file = os.path.join(PROJECT_ROOT, "sample_spiral.png")
        if not os.path.exists(cls.spiral_file):
            cls.spiral_file = os.path.join(BACKEND_DIR, "static", "samples", "sample_spiral.png")

        cls.voice_file = os.path.join(PROJECT_ROOT, "testing", "inputs", "voice", "voice_sample.wav")
        if not os.path.exists(cls.voice_file):
            cls.voice_file = os.path.join(PROJECT_ROOT, "sample_voice.wav")
        if not os.path.exists(cls.voice_file):
            cls.voice_file = os.path.join(BACKEND_DIR, "static", "samples", "sample_voice.wav")

        cls.telemonitor_file = os.path.join(PROJECT_ROOT, "testing", "inputs", "telemonitor", "telemonitor_features.csv")
        if not os.path.exists(cls.telemonitor_file):
            cls.telemonitor_file = os.path.join(PROJECT_ROOT, "sample_telemonitor.csv")
        if not os.path.exists(cls.telemonitor_file):
            cls.telemonitor_file = os.path.join(BACKEND_DIR, "static", "samples", "sample_telemonitor.csv")
        
        # Verify test files exist
        for label, path in [
            ("MRI", cls.mri_file),
            ("Spiral", cls.spiral_file),
            ("Voice", cls.voice_file),
            ("Telemonitor", cls.telemonitor_file)
        ]:
            if not os.path.exists(path):
                print(f"WARNING: Test file for {label} not found at {path}")

    @classmethod
    def tearDownClass(cls):
        if hasattr(cls, 'client') and hasattr(cls.client, 'close'):
            cls.client.close()
        elif hasattr(cls, 'client_ctx'):
            cls.client_ctx.__exit__(None, None, None)


    def test_health_check(self):
        """Test GET /health"""
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertIn(response.json().get("status"), ["running", "healthy"])

    def test_predict_mri(self):
        """Test POST /predict/mri"""
        if not os.path.exists(self.mri_file):
            self.skipTest("MRI test file missing")
            
        with open(self.mri_file, "rb") as f:
            response = self.client.post(
                "/predict/mri",
                files={"image": ("sample_mri.png", f, "image/png")}
            )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("prediction", data)
        self.assertIn("confidence", data)
        self.assertIn("gradcam", data)
        self.assertTrue(data["gradcam"].startswith("/plots/"))

    def test_predict_spiral(self):
        """Test POST /predict/spiral"""
        if not os.path.exists(self.spiral_file):
            self.skipTest("Spiral test file missing")
            
        with open(self.spiral_file, "rb") as f:
            response = self.client.post(
                "/predict/spiral",
                files={"image": ("sample_spiral.png", f, "image/png")}
            )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("prediction", data)
        self.assertIn("confidence", data)
        self.assertIn("gradcam", data)
        self.assertTrue(data["gradcam"].startswith("/plots/"))

    def test_predict_voice(self):
        """Test POST /predict/voice"""
        if not os.path.exists(self.voice_file):
            self.skipTest("Voice test file missing")
            
        with open(self.voice_file, "rb") as f:
            response = self.client.post(
                "/predict/voice",
                files={"file": ("sample_voice.wav", f, "audio/wav")}
            )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("prediction", data)
        self.assertIn("confidence", data)
        self.assertIn("shap", data)
        self.assertIn("summary", data["shap"])
        self.assertIn("bar", data["shap"])

    def test_predict_telemonitor(self):
        """Test POST /predict/telemonitor"""
        if not os.path.exists(self.telemonitor_file):
            self.skipTest("Telemonitor test file missing")
            
        with open(self.telemonitor_file, "rb") as f:
            response = self.client.post(
                "/predict/telemonitor",
                files={"file": ("sample_telemonitor.csv", f, "text/csv")}
            )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("motor_updrs", data)
        self.assertIn("total_updrs", data)
        self.assertIn("shap", data)
        self.assertIn("summary", data["shap"])
        self.assertIn("bar", data["shap"])

    def test_predict_fusion(self):
        """Test POST /predict/fusion"""
        files_exist = all(
            os.path.exists(p) for p in [
                self.mri_file,
                self.spiral_file,
                self.voice_file,
                self.telemonitor_file
            ]
        )
        if not files_exist:
            self.skipTest("One or more files missing for fusion test")
            
        with open(self.mri_file, "rb") as mri_f, \
             open(self.spiral_file, "rb") as spiral_f, \
             open(self.voice_file, "rb") as voice_f, \
             open(self.telemonitor_file, "rb") as tele_f:
             
            response = self.client.post(
                "/predict/fusion",
                files={
                    "mri": ("sample_mri.png", mri_f, "image/png"),
                    "spiral": ("sample_spiral.png", spiral_f, "image/png"),
                    "voice": ("sample_voice.wav", voice_f, "audio/wav"),
                    "telemonitor": ("sample_telemonitor.csv", tele_f, "text/csv")
                }
            )
            
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("prediction", data)
        self.assertIn("confidence", data)
        self.assertEqual(data["fusion"], True)

    def test_generate_report(self):
        """Test POST /report"""
        files_exist = all(
            os.path.exists(p) for p in [
                self.mri_file,
                self.spiral_file,
                self.voice_file,
                self.telemonitor_file
            ]
        )
        if not files_exist:
            self.skipTest("One or more files missing for report test")
            
        with open(self.mri_file, "rb") as mri_f, \
             open(self.spiral_file, "rb") as spiral_f, \
             open(self.voice_file, "rb") as voice_f, \
             open(self.telemonitor_file, "rb") as tele_f:
             
            response = self.client.post(
                "/report",
                data={"patient_id": "TEST_PATIENT_XYZ"},
                files={
                    "mri": ("sample_mri.png", mri_f, "image/png"),
                    "spiral": ("sample_spiral.png", spiral_f, "image/png"),
                    "voice": ("sample_voice.wav", voice_f, "audio/wav"),
                    "telemonitor": ("sample_telemonitor.csv", tele_f, "text/csv")
                }
            )
            
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["content-type"], "application/pdf")
        self.assertTrue(len(response.content) > 0)

    def test_explain_all_modalities(self):
        """Test POST /explain with all modalities"""
        files_exist = all(
            os.path.exists(p) for p in [
                self.mri_file,
                self.spiral_file,
                self.voice_file,
                self.telemonitor_file
            ]
        )
        if not files_exist:
            self.skipTest("One or more files missing for explain test")
            
        with open(self.mri_file, "rb") as mri_f, \
             open(self.spiral_file, "rb") as spiral_f, \
             open(self.voice_file, "rb") as voice_f, \
             open(self.telemonitor_file, "rb") as tele_f:
             
            response = self.client.post(
                "/explain",
                files={
                    "mri": ("sample_mri.png", mri_f, "image/png"),
                    "spiral": ("sample_spiral.png", spiral_f, "image/png"),
                    "voice": ("sample_voice.wav", voice_f, "audio/wav"),
                    "telemonitor": ("sample_telemonitor.csv", tele_f, "text/csv")
                }
            )
            
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("mri", data)
        self.assertIn("spiral", data)
        self.assertIn("voice", data)
        self.assertIn("telemonitor", data)
        self.assertIn("fusion", data)
        
        self.assertIn("overlay", data["mri"])
        self.assertIn("overlay", data["spiral"])
        self.assertIn("summary", data["voice"])
        self.assertIn("summary", data["telemonitor"])
        self.assertIn("plot", data["fusion"])

    def test_validation_errors(self):
        """Test file validation rejection for disallowed extension"""
        # Create a mock text file
        dummy_file_path = os.path.join(PROJECT_ROOT, "dummy_test.txt")
        with open(dummy_file_path, "w") as f:
            f.write("Invalid content")
            
        try:
            with open(dummy_file_path, "rb") as f:
                response = self.client.post(
                    "/predict/mri",
                    files={"image": ("dummy_test.txt", f, "text/plain")}
                )
            self.assertEqual(response.status_code, 400)
            data = response.json()
            self.assertIn("detail", data)
            self.assertEqual(data["error_code"], "HTTP_400")
        finally:
            if os.path.exists(dummy_file_path):
                os.remove(dummy_file_path)


if __name__ == "__main__":
    unittest.main()
