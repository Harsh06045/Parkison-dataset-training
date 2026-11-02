"""
NeuroFusionAI Model Registry Verification Script.
Performs dry-run tensor inferences through all 7 trained model checkpoints and 2 scalers,
verifying weights, shapes, forward pass stability, and absence of NaNs.
"""

import sys
import os
import time
import torch
import numpy as np

# Add project root and backend to sys.path
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")

if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from app.models.loader import loader


def verify_models():
    print("=" * 70)
    print(" NeuroFusionAI Machine Learning Checkpoint & Inference Verification")
    print("=" * 70)

    # 1. Load weights
    print("\n[1] Initializing ModelLoader and Checkpoint Verification:")
    start_t = time.time()
    loader.load_all_models()
    load_time = time.time() - start_t
    print(f"  Load Time: {load_time:.2f}s on device: {loader.device}")

    all_passed = True
    device = loader.device

    # 2. MRI Model (DenseNet-121)
    print("\n[2] Testing Brain MRI Model (DenseNet-121):")
    try:
        loader.require_model("mri")
        dummy_mri = torch.randn(1, 3, 224, 224, device=device)
        with torch.no_grad():
            logits = loader.mri_model(dummy_mri)
            emb = loader.mri_model.extract_features(dummy_mri)
        assert logits.shape == (1, 2), f"Unexpected logits shape: {logits.shape}"
        assert emb.shape == (1, 256), f"Unexpected embedding shape: {emb.shape}"
        assert not torch.isnan(logits).any(), "NaN detected in MRI logits!"
        prob = torch.softmax(logits, dim=1)[0, 1].item()
        print(f"  [OK] Forward Pass Successful: Logits={logits.cpu().numpy()}, Softmax(PD)={prob:.4f}, Embedding Shape={emb.shape}")
    except Exception as e:
        print(f"  [FAIL] MRI model verification failed: {e}")
        all_passed = False

    # 3. Spiral Drawing Model (ResNet-18)
    print("\n[3] Testing Spiral Drawing Model (ResNet-18):")
    try:
        loader.require_model("spiral")
        dummy_spiral = torch.randn(1, 3, 224, 224, device=device)
        with torch.no_grad():
            logits = loader.spiral_model(dummy_spiral)
            emb = loader.spiral_model.extract_features(dummy_spiral)
        assert logits.shape == (1, 2), f"Unexpected logits shape: {logits.shape}"
        assert emb.shape == (1, 256), f"Unexpected embedding shape: {emb.shape}"
        assert not torch.isnan(logits).any(), "NaN detected in Spiral logits!"
        prob = torch.softmax(logits, dim=1)[0, 1].item()
        print(f"  [OK] Forward Pass Successful: Logits={logits.cpu().numpy()}, Softmax(PD)={prob:.4f}, Embedding Shape={emb.shape}")
    except Exception as e:
        print(f"  [FAIL] Spiral model verification failed: {e}")
        all_passed = False

    # 4. Voice Models (PyTorch MLP + CatBoost + Scaler)
    print("\n[4] Testing Voice Models (MLP + CatBoost + Scaler):")
    try:
        loader.require_model("voice_mlp")
        loader.require_model("voice_catboost")
        dummy_voice_raw = np.array([
            150.0, 180.0, 120.0, 0.006, 0.00004, 0.003, 0.003, 0.009, 0.03,
            0.28, 0.015, 0.018, 0.024, 0.045, 0.02, 22.0, 0.45, 0.65, -5.5, 0.22, 2.1, 0.18
        ], dtype=np.float32).reshape(1, -1)

        # Scaler
        scaled = loader.voice_scaler.transform(dummy_voice_raw)
        assert scaled.shape == (1, 22), f"Unexpected scaler shape: {scaled.shape}"
        print("  [OK] Voice Scaler Transform Successful (22 Features Normalized)")

        # PyTorch MLP
        v_tensor = torch.tensor(scaled, dtype=torch.float32, device=device)
        with torch.no_grad():
            mlp_logits = loader.voice_mlp_model(v_tensor)
        assert mlp_logits.shape == (1, 2), f"Unexpected MLP logits shape: {mlp_logits.shape}"
        mlp_prob = torch.softmax(mlp_logits, dim=1)[0, 1].item()
        print(f"  [OK] Voice PyTorch MLP: Softmax(PD)={mlp_prob:.4f}")

        # CatBoost
        cb_pred = loader.voice_catboost_model.predict(scaled)[0]
        cb_prob = loader.voice_catboost_model.predict_proba(scaled)[0, 1]
        print(f"  [OK] Voice CatBoost: Class={cb_pred}, Probability(PD)={cb_prob:.4f}")
    except Exception as e:
        print(f"  [FAIL] Voice model verification failed: {e}")
        all_passed = False

    # 5. Telemonitoring Models (PyTorch MLP + XGBoost + Scaler)
    print("\n[5] Testing Telemonitoring Models (MLP + XGBoost + Scaler):")
    try:
        loader.require_model("telemonitor_mlp")
        loader.require_model("telemonitor_xgboost")
        dummy_tele = np.array([
            65.0, 0.0, 12.0, 0.005, 0.00003, 0.002, 0.002, 0.006, 0.025,
            0.22, 0.012, 0.015, 0.020, 0.035, 0.015, 24.0, 0.40, 0.60, 0.15
        ], dtype=np.float32).reshape(1, -1)

        # Scaler
        t_scaled = loader.telemonitor_scaler.transform(dummy_tele)
        assert t_scaled.shape == (1, 19), f"Unexpected tele scaler shape: {t_scaled.shape}"
        print("  [OK] Telemonitor Scaler Transform Successful (19 Features Normalized)")

        # PyTorch MLP Regressor
        t_tensor = torch.tensor(dummy_tele, dtype=torch.float32, device=device)
        with torch.no_grad():
            t_out = loader.telemonitor_mlp_model(t_tensor).cpu().numpy()[0]
        assert len(t_out) == 2, f"Unexpected tele MLP output: {t_out}"
        print(f"  [OK] Telemonitor PyTorch MLP: Motor UPDRS={t_out[0]:.2f}, Total UPDRS={t_out[1]:.2f}")

        # XGBoost Regressor
        xgb_out = loader.telemonitor_xgb_model.predict(dummy_tele)[0]
        print(f"  [OK] Telemonitor XGBoost: Motor UPDRS={xgb_out[0]:.2f}, Total UPDRS={xgb_out[1]:.2f}")
    except Exception as e:
        print(f"  [FAIL] Telemonitor model verification failed: {e}")
        all_passed = False

    # 6. Attention Fusion Classifier
    print("\n[6] Testing Multimodal Attention Fusion Model:")
    try:
        loader.require_model("fusion")
        dummy_mri_emb = torch.randn(1, 256, device=device)
        dummy_drawing_emb = torch.randn(1, 256, device=device)
        dummy_voice_t = torch.randn(1, 22, device=device)
        dummy_tele_t = torch.randn(1, 19, device=device)

        with torch.no_grad():
            fusion_logits, attn_weights = loader.fusion_model(
                image_embed=dummy_drawing_emb,
                mri_embed=dummy_mri_emb,
                voice_feat=dummy_voice_t,
                clinical_feat=dummy_tele_t,
                return_attention=True
            )
        assert fusion_logits.shape == (1, 2), f"Unexpected fusion logits shape: {fusion_logits.shape}"
        assert not torch.isnan(fusion_logits).any(), "NaN detected in fusion logits!"
        fusion_prob = torch.softmax(fusion_logits, dim=1)[0, 1].item()
        print(f"  [OK] Attention Fusion Inference Successful: Softmax(PD)={fusion_prob:.4f}")
        print(f"  [OK] Modality Attention Distribution: {attn_weights}")
    except Exception as e:
        print(f"  [FAIL] Fusion model verification failed: {e}")
        all_passed = False

    print("\n" + "=" * 70)
    if all_passed:
        print("  MODEL VERIFICATION RESULT: PASS - All 7 Checkpoints & 2 Scalers Operational.")
    else:
        print("  MODEL VERIFICATION RESULT: FAIL - Resolve checkpoint errors.")
    print("=" * 70)
    return all_passed


if __name__ == "__main__":
    success = verify_models()
    sys.exit(0 if success else 1)

