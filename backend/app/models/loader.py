import os
import sys
import torch
import pickle

# Force stdout/stderr to use UTF-8 to prevent charmap encoding errors on Windows
try:
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    if hasattr(sys.stderr, 'reconfigure'):
        sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

# Ensure project root is in sys.path for importing project modules
APP_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.dirname(APP_DIR)
PROJECT_ROOT = os.path.dirname(BACKEND_DIR)

if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

# Model imports from base repository
from models.mri_model import MRIClassifier
from models.image_model import ImageDrawingClassifier
from models.voice_model import VoiceMLPClassifier
from models.telemonitor_model import TelemonitorMLPRegressor
from models.fusion_model import MultimodalClassifier
from training.models.voice.catboost import VoiceCatBoostClassifier
from training.models.telemonitor.xgboost import TelemonitorXGBRegressor

from app.config import (
    MRI_MODEL_PATH,
    SPIRAL_MODEL_PATH,
    VOICE_PYTORCH_PATH,
    VOICE_CATBOOST_PATH,
    TELEMONITOR_PYTORCH_PATH,
    TELEMONITOR_XGB_PATH,
    FUSION_MODEL_PATH
)

class ModelLoader:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(ModelLoader, cls).__new__(cls, *args, **kwargs)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.mri_model = None
        self.spiral_model = None
        self.voice_mlp_model = None
        self.voice_catboost_model = None
        self.telemonitor_mlp_model = None
        self.telemonitor_xgb_model = None
        self.fusion_model = None
        self._initialized = True

    def load_all_models(self):
        print(f"Loading all models on device: {self.device}")
        
        # 1. MRI Model
        self.mri_model = MRIClassifier(num_classes=2, pretrained=False).to(self.device)
        self._load_pytorch_weights(self.mri_model, MRI_MODEL_PATH)
        
        # 2. Spiral Model
        self.spiral_model = ImageDrawingClassifier(num_classes=2, pretrained=False).to(self.device)
        self._load_pytorch_weights(self.spiral_model, SPIRAL_MODEL_PATH)
        
        # 3. Voice PyTorch MLP
        self.voice_mlp_model = VoiceMLPClassifier(input_dim=22, hidden_dim=64, num_classes=2).to(self.device)
        self._load_pytorch_weights(self.voice_mlp_model, VOICE_PYTORCH_PATH)
        
        # 4. Voice ML CatBoost
        if os.path.exists(VOICE_CATBOOST_PATH):
            self.voice_catboost_model = VoiceCatBoostClassifier()
            self.voice_catboost_model.load(VOICE_CATBOOST_PATH)
            print(f"  ✓ Loaded Voice CatBoost model from {VOICE_CATBOOST_PATH}")
        else:
            print(f"  ✗ WARNING: Voice CatBoost model not found at {VOICE_CATBOOST_PATH}")

        # 5. Telemonitoring PyTorch MLP
        self.telemonitor_mlp_model = TelemonitorMLPRegressor(input_dim=19, hidden_dim=64, output_dim=2).to(self.device)
        self._load_pytorch_weights(self.telemonitor_mlp_model, TELEMONITOR_PYTORCH_PATH)
        
        # 6. Telemonitoring ML XGBoost
        if os.path.exists(TELEMONITOR_XGB_PATH):
            self.telemonitor_xgb_model = TelemonitorXGBRegressor()
            self.telemonitor_xgb_model.load(TELEMONITOR_XGB_PATH)
            print(f"  ✓ Loaded Telemonitoring XGBoost model from {TELEMONITOR_XGB_PATH}")
        else:
            print(f"  ✗ WARNING: Telemonitoring XGBoost model not found at {TELEMONITOR_XGB_PATH}")

        # 7. Fusion Model
        self.fusion_model = MultimodalClassifier(image_dim=256, mri_dim=256, voice_dim=22, clinical_dim=19, fusion_dim=32).to(self.device)
        self._load_pytorch_weights(self.fusion_model, FUSION_MODEL_PATH)
        
        print("All models loaded successfully!")

    def _load_pytorch_weights(self, model, path):
        if not os.path.exists(path):
            print(f"  ✗ ERROR: PyTorch checkpoint not found: {path}")
            return False
        try:
            state = torch.load(path, map_location=self.device)
            if isinstance(state, dict) and "model_state_dict" in state:
                model.load_state_dict(state["model_state_dict"])
            else:
                model.load_state_dict(state)
            model.eval()
            print(f"  ✓ Loaded PyTorch model: {os.path.basename(path)}")
            return True
        except Exception as e:
            print(f"  ✗ ERROR: Failed to load PyTorch model {path}: {e}")
            return False

# Global loader instance
loader = ModelLoader()
