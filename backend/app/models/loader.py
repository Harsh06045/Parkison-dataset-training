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
    VOICE_SCALER_PATH,
    TELEMONITOR_PYTORCH_PATH,
    TELEMONITOR_XGB_PATH,
    TELEMONITOR_SCALER_PATH,
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
        self.voice_scaler = None
        self.telemonitor_mlp_model = None
        self.telemonitor_xgb_model = None
        self.telemonitor_scaler = None
        self.fusion_model = None
        self._initialized = True

    def load_all_models(self):
        print(f"Loading all models on device: {self.device}")
        
        # 1. MRI Model
        if os.path.exists(MRI_MODEL_PATH):
            mri = MRIClassifier(num_classes=2, pretrained=False).to(self.device)
            if self._load_pytorch_weights(mri, MRI_MODEL_PATH):
                self.mri_model = mri
            else:
                self.mri_model = None
                print(f"  ✗ WARNING: MRI model weights failed to load from {MRI_MODEL_PATH}. Prediction disabled.")
        else:
            print(f"  ✗ WARNING: MRI checkpoint not found at {MRI_MODEL_PATH}. Prediction disabled.")
            self.mri_model = None
        
        # 2. Spiral Model
        if os.path.exists(SPIRAL_MODEL_PATH):
            spiral = ImageDrawingClassifier(num_classes=2, pretrained=False).to(self.device)
            if self._load_pytorch_weights(spiral, SPIRAL_MODEL_PATH):
                self.spiral_model = spiral
            else:
                self.spiral_model = None
                print(f"  ✗ WARNING: Spiral model weights failed to load from {SPIRAL_MODEL_PATH}. Prediction disabled.")
        else:
            print(f"  ✗ WARNING: Spiral checkpoint not found at {SPIRAL_MODEL_PATH}. Prediction disabled.")
            self.spiral_model = None
        
        # 3. Voice PyTorch MLP
        if os.path.exists(VOICE_PYTORCH_PATH):
            voice_mlp = VoiceMLPClassifier(input_dim=22, hidden_dim=64, num_classes=2).to(self.device)
            if self._load_pytorch_weights(voice_mlp, VOICE_PYTORCH_PATH):
                self.voice_mlp_model = voice_mlp
            else:
                self.voice_mlp_model = None
                print(f"  ✗ WARNING: Voice PyTorch MLP weights failed to load from {VOICE_PYTORCH_PATH}. Prediction disabled.")
        else:
            print(f"  ✗ WARNING: Voice PyTorch MLP checkpoint not found at {VOICE_PYTORCH_PATH}. Prediction disabled.")
            self.voice_mlp_model = None
        
        # 4. Voice ML CatBoost & Scaler
        if os.path.exists(VOICE_CATBOOST_PATH):
            try:
                self.voice_catboost_model = VoiceCatBoostClassifier()
                self.voice_catboost_model.load(VOICE_CATBOOST_PATH)
                print(f"  ✓ Loaded Voice CatBoost model from {VOICE_CATBOOST_PATH}")
            except Exception as e:
                print(f"  ✗ ERROR: Voice CatBoost failed to load: {e}")
                self.voice_catboost_model = None
        else:
            print(f"  ✗ WARNING: Voice CatBoost model not found at {VOICE_CATBOOST_PATH}")
            self.voice_catboost_model = None

        if os.path.exists(VOICE_SCALER_PATH):
            try:
                with open(VOICE_SCALER_PATH, "rb") as f:
                    self.voice_scaler = pickle.load(f)
                print(f"  ✓ Loaded Voice Scaler from {VOICE_SCALER_PATH}")
            except Exception as e:
                print(f"  ✗ ERROR: Voice Scaler failed to load: {e}")
                self.voice_scaler = None
        else:
            self.voice_scaler = None

        # 5. Telemonitoring PyTorch MLP
        if os.path.exists(TELEMONITOR_PYTORCH_PATH):
            tele_mlp = TelemonitorMLPRegressor(input_dim=19, hidden_dim=64, output_dim=2).to(self.device)
            if self._load_pytorch_weights(tele_mlp, TELEMONITOR_PYTORCH_PATH):
                self.telemonitor_mlp_model = tele_mlp
            else:
                self.telemonitor_mlp_model = None
                print(f"  ✗ WARNING: Telemonitoring MLP weights failed to load from {TELEMONITOR_PYTORCH_PATH}. Prediction disabled.")
        else:
            print(f"  ✗ WARNING: Telemonitoring MLP checkpoint not found at {TELEMONITOR_PYTORCH_PATH}. Prediction disabled.")
            self.telemonitor_mlp_model = None
        
        # 6. Telemonitoring ML XGBoost & Scaler
        if os.path.exists(TELEMONITOR_XGB_PATH):
            try:
                self.telemonitor_xgb_model = TelemonitorXGBRegressor()
                self.telemonitor_xgb_model.load(TELEMONITOR_XGB_PATH)
                print(f"  ✓ Loaded Telemonitoring XGBoost model from {TELEMONITOR_XGB_PATH}")
            except Exception as e:
                print(f"  ✗ ERROR: Telemonitoring XGBoost failed to load: {e}")
                self.telemonitor_xgb_model = None
        else:
            print(f"  ✗ WARNING: Telemonitoring XGBoost model not found at {TELEMONITOR_XGB_PATH}")
            self.telemonitor_xgb_model = None

        if os.path.exists(TELEMONITOR_SCALER_PATH):
            try:
                with open(TELEMONITOR_SCALER_PATH, "rb") as f:
                    self.telemonitor_scaler = pickle.load(f)
                print(f"  ✓ Loaded Telemonitor Scaler from {TELEMONITOR_SCALER_PATH}")
            except Exception as e:
                print(f"  ✗ ERROR: Telemonitor Scaler failed to load: {e}")
                self.telemonitor_scaler = None
        else:
            self.telemonitor_scaler = None

        # 7. Fusion Model
        if os.path.exists(FUSION_MODEL_PATH):
            from training.models.fusion.attention_fusion import AttentionFusionClassifier
            f_model = AttentionFusionClassifier(image_dim=256, mri_dim=256, voice_dim=22, clinical_dim=19, fusion_dim=64, num_heads=4, num_classes=2).to(self.device)
            if self._load_pytorch_weights(f_model, FUSION_MODEL_PATH):
                self.fusion_model = f_model
            else:
                f_fallback = MultimodalClassifier(image_dim=256, mri_dim=256, voice_dim=22, clinical_dim=19, fusion_dim=32).to(self.device)
                if self._load_pytorch_weights(f_fallback, FUSION_MODEL_PATH):
                    self.fusion_model = f_fallback
                else:
                    self.fusion_model = None
                    print(f"  ✗ WARNING: Fusion model weights failed to load from {FUSION_MODEL_PATH}. Prediction disabled.")
        else:
            print(f"  ✗ WARNING: Fusion checkpoint not found at {FUSION_MODEL_PATH}. Prediction disabled.")
            self.fusion_model = None
        
        print("Model verification and loading complete.")

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

    def get_model_status(self) -> dict:
        """Returns ready status for all 7 models and 2 scalers."""
        return {
            "mri_classifier": self.mri_model is not None,
            "spiral_classifier": self.spiral_model is not None,
            "voice_mlp": self.voice_mlp_model is not None,
            "voice_catboost": self.voice_catboost_model is not None,
            "telemonitor_mlp": self.telemonitor_mlp_model is not None,
            "telemonitor_xgboost": self.telemonitor_xgb_model is not None,
            "multimodal_fusion": self.fusion_model is not None,
            "voice_scaler": self.voice_scaler is not None,
            "telemonitor_scaler": self.telemonitor_scaler is not None
        }

    def require_model(self, modality: str):
        """
        Guarantees that unweighted or randomly initialized models never predict.
        Raises RuntimeError if the required model weights are not loaded.
        """
        mapping = {
            "mri": self.mri_model,
            "spiral": self.spiral_model,
            "voice_mlp": self.voice_mlp_model,
            "voice_catboost": self.voice_catboost_model,
            "telemonitor_mlp": self.telemonitor_mlp_model,
            "telemonitor_xgboost": self.telemonitor_xgb_model,
            "fusion": self.fusion_model
        }
        if modality not in mapping:
            raise ValueError(f"Unknown modality '{modality}'.")
        if mapping[modality] is None:
            raise RuntimeError(
                f"Modality '{modality}' model is not loaded with trained weights. "
                "Diagnostic prediction is strictly rejected to prevent untrained inference."
            )

# Global loader instance
loader = ModelLoader()

def load_all_models():
    return loader.load_all_models()
