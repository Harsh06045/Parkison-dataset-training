import os

# Paths configuration
APP_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(APP_DIR)
PROJECT_ROOT = os.path.dirname(BACKEND_DIR)

# Temporary uploads and outputs directory
UPLOAD_DIR = os.path.join(BACKEND_DIR, "uploads")
STATIC_DIR = os.path.join(BACKEND_DIR, "static")
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(STATIC_DIR, exist_ok=True)

# Checkpoints directory path
CHECKPOINTS_DIR = os.path.join(PROJECT_ROOT, "outputs", "checkpoints")

# Model weight files mapping
MRI_MODEL_PATH = os.path.join(CHECKPOINTS_DIR, "mri_best.pth")
SPIRAL_MODEL_PATH = os.path.join(CHECKPOINTS_DIR, "image_best.pth")  # ResNet18 drawing classifier
VOICE_PYTORCH_PATH = os.path.join(CHECKPOINTS_DIR, "voice_mlp_best.pth")
VOICE_CATBOOST_PATH = os.path.join(CHECKPOINTS_DIR, "voice_best_model.pkl")
TELEMONITOR_PYTORCH_PATH = os.path.join(CHECKPOINTS_DIR, "telemonitor_mlp_best.pth")
TELEMONITOR_XGB_PATH = os.path.join(CHECKPOINTS_DIR, "telemonitor_best_model.pkl")
FUSION_MODEL_PATH = os.path.join(CHECKPOINTS_DIR, "fusion_best.pth")

# Server settings
HOST = "127.0.0.1"
PORT = 8000
