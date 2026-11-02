# NeuroFusionAI – Model Artifact & Checkpoint Status

**System**: NeuroFusionAI Checkpoint Verification  
**Generated**: 2026-11-02  

---

## 1. Verified Checkpoint Status Matrix

| Model Identifier | Architecture | Checkpoint File Path | File Size | Checkpoint Status | Verification Proof |
| :--- | :--- | :--- | :---: | :---: | :---: |
| `mri_densenet121_v1` | DenseNet-121 | `outputs/checkpoints/mri_best.pth` | 16.81 MB | **PASS** | `scripts/verify_models.py` |
| `spiral_resnet18_v1` | ResNet-18 | `outputs/checkpoints/image_best.pth` | 43.21 MB | **PASS** | `scripts/verify_models.py` |
| `voice_mlp_v1` | PyTorch MLP | `outputs/checkpoints/voice_mlp_best.pth` | 0.02 MB | **PASS** | `scripts/verify_models.py` |
| `voice_catboost_v1` | CatBoost Classifier | `outputs/checkpoints/voice_best_model.pkl` | 0.25 MB | **PASS** | `scripts/verify_models.py` |
| `voice_scaler_v1` | StandardScaler | `outputs/checkpoints/voice_scaler.pkl` | 0.001 MB | **PASS** | `scripts/verify_models.py` |
| `telemonitor_mlp_v1` | PyTorch MLP Regressor | `outputs/checkpoints/telemonitor_mlp_best.pth` | 0.02 MB | **PASS** | `scripts/verify_models.py` |
| `telemonitor_xgb_v1` | XGBoost Regressor | `outputs/checkpoints/telemonitor_best_model.pkl` | 2.59 MB | **PASS** | `scripts/verify_models.py` |
| `telemonitor_scaler_v1`| StandardScaler | `outputs/checkpoints/telemonitor_scaler.pkl` | 0.001 MB | **PASS** | `scripts/verify_models.py` |
| `fusion_attention_v1` | AttentionFusionClassifier | `outputs/checkpoints/fusion_best.pth` | 0.22 MB | **PASS** | `scripts/verify_models.py` |

---

## 2. Inactive / Baseline Fallback Artifacts

| Model Identifier | Architecture | Checkpoint File Path | Status / Notes |
| :--- | :--- | :--- | :--- |
| `mri_best_model.pth` | EfficientNet-B3 | `outputs/checkpoints/mri_best_model.pth` | Secondary candidate evaluated during Phase 2 model tournament. |
| `spiral_best_model.pth` | ResNet-18 | `outputs/checkpoints/spiral_best_model.pth` | Checkpoint duplicate of `image_best.pth`. |
| `fusion_best_model.pth` | Multimodal MLP | `outputs/checkpoints/fusion_best_model.pth` | Legacy baseline concat fusion model; retained as offline fallback. |
| `voice_xgb_best.pkl` | XGBoost Classifier | `outputs/checkpoints/voice_xgb_best.pkl` | Candidate evaluated against CatBoost in voice tournament. |
| `telemonitor_xgb_best.pkl`| XGBoost (compact) | `outputs/checkpoints/telemonitor_xgb_best.pkl` | Compact serialisation of telemonitoring regressor. |

