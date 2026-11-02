"""
Pytest Master Conftest Configuration & Fixtures for NeuroFusionAI Backend Testing.
Provides shared fixtures for:
- Live HTTP client connecting to FastAPI server
- Role-based authentication tokens (Doctor, Patient, Admin)
- Clinical multimodal sample files (Spiral, Voice, MRI, Telemonitor CSV)
- Malformed, corrupted, boundary, and oversized file fixtures
- Neon Cloud PostgreSQL database session
"""

import os
import sys
import pytest
import httpx
import tempfile
import numpy as np
from PIL import Image

# Ensure project root and backend are on PYTHONPATH
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.db.session import get_db_session

BASE_URL = "http://127.0.0.1:8000"


@pytest.fixture(scope="session", autouse=True)
def init_test_environment():
    """Initializes database schema and model weights for testing."""
    from app.db.init_db import initialize_all
    try:
        initialize_all()
    except Exception as e:
        print(f"Test DB initialization warning: {e}")

    from app.models.loader import loader
    loader.load_all_models()
    yield


@pytest.fixture(scope="session")
def base_url():
    return BASE_URL


@pytest.fixture(scope="session")
def client():
    """Shared HTTPX client targeting running backend."""
    with httpx.Client(base_url=BASE_URL, timeout=30.0) as cl:
        yield cl


@pytest.fixture(scope="session")
def doctor_auth(client):
    """Obtain doctor authentication token and headers."""
    resp = client.post("/auth/login", json={"email": "dr.jenkins@neurofusion.ai", "role": "doctor"})
    assert resp.status_code == 200
    data = resp.json()
    token = data["token"]
    return {
        "token": token,
        "headers": {"Authorization": f"Bearer {token}"},
        "user": data["user"]
    }


@pytest.fixture(scope="session")
def patient_auth(client):
    """Obtain patient authentication token and headers."""
    resp = client.post("/auth/login", json={"email": "eleanor.vance@example.com", "role": "patient"})
    assert resp.status_code == 200
    data = resp.json()
    token = data["token"]
    return {
        "token": token,
        "headers": {"Authorization": f"Bearer {token}"},
        "user": data["user"]
    }


@pytest.fixture(scope="session")
def admin_auth(client):
    """Obtain admin authentication token and headers."""
    resp = client.post("/auth/login", json={"email": "admin@neurofusion.ai", "role": "admin"})
    assert resp.status_code == 200
    data = resp.json()
    token = data["token"]
    return {
        "token": token,
        "headers": {"Authorization": f"Bearer {token}"},
        "user": data["user"]
    }


@pytest.fixture(scope="session")
def sample_spiral_path():
    path = os.path.join(PROJECT_ROOT, "sample_spiral.png")
    assert os.path.exists(path), f"Sample spiral not found at {path}"
    return path


@pytest.fixture(scope="session")
def sample_voice_path():
    path = os.path.join(PROJECT_ROOT, "sample_voice.wav")
    assert os.path.exists(path), f"Sample voice not found at {path}"
    return path


@pytest.fixture(scope="session")
def sample_mri_path():
    path = os.path.join(PROJECT_ROOT, "sample_mri.png")
    assert os.path.exists(path), f"Sample MRI not found at {path}"
    return path


@pytest.fixture(scope="session")
def sample_telemonitor_path():
    path = os.path.join(PROJECT_ROOT, "sample_telemonitor.csv")
    assert os.path.exists(path), f"Sample telemonitor not found at {path}"
    return path


@pytest.fixture(scope="session")
def invalid_text_file(tmp_path_factory):
    """Creates a temporary .txt file for negative format testing."""
    fn = tmp_path_factory.mktemp("data") / "invalid_file.txt"
    fn.write_text("This is an invalid plain text document, not a medical scan.")
    return str(fn)


@pytest.fixture(scope="session")
def empty_file(tmp_path_factory):
    """Creates a temporary 0-byte file."""
    fn = tmp_path_factory.mktemp("data") / "empty.png"
    fn.write_bytes(b"")
    return str(fn)


@pytest.fixture(scope="session")
def corrupted_image_file(tmp_path_factory):
    """Creates a corrupted image file with invalid header bytes."""
    fn = tmp_path_factory.mktemp("data") / "corrupted.png"
    fn.write_bytes(b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR" + b"\xFF" * 100)
    return str(fn)


@pytest.fixture(scope="session")
def blank_image_file(tmp_path_factory):
    """Creates a solid black blank PNG image."""
    fn = tmp_path_factory.mktemp("data") / "blank_black.png"
    img = Image.new("RGB", (224, 224), color=(0, 0, 0))
    img.save(str(fn))
    return str(fn)


@pytest.fixture(scope="session")
def noisy_image_file(tmp_path_factory):
    """Creates a random Gaussian noise PNG image."""
    fn = tmp_path_factory.mktemp("data") / "random_noise.png"
    noise_arr = np.random.randint(0, 256, (224, 224, 3), dtype=np.uint8)
    img = Image.fromarray(noise_arr)
    img.save(str(fn))
    return str(fn)


@pytest.fixture(scope="function")
def db_session():
    """Provides a transactional database session connecting to Neon PostgreSQL."""
    session = get_db_session()
    try:
        yield session
    finally:
        session.close()
