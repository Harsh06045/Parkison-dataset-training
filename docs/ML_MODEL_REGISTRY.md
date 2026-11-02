# NeuroFusionAI – Machine Learning Model Registry

**System**: NeuroFusionAI – Multimodal Parkinson's Diagnostic Platform  
**Document**: Model Registry, Neural Architectures & Inference Specifications  
**Generated**: 2026-11-02  

---

## 1. Registry Overview

NeuroFusionAI manages 7 production machine learning models and 2 feature scalers across four clinical modalities. Models are governed by the `ModelLoader` singleton in [`backend/app/models/loader.py`](file:///d:/Parkison%20DATASET%20TRAINING/backend/app/models/loader.py).

Every model is protected by `loader.require_model(modality)` to guarantee that unweighted or randomly initialized weights can never make predictions.

---

## 2. Model Specifications & Checkpoint Mapping

### 2.1 Brain MRI Structural Classifier
- **Architecture**: DenseNet-121 (Densely Connected Convolutional Networks)
- **Framework**: PyTorch
- **Checkpoint**: `outputs/checkpoints/mri_best.pth` (16.81 MB)
- **Input Dimensions**: `(B, 3, 224, 224)` Normalized float tensor
- **Output**: Binary classification logits `(B, 2)` (Normal vs. Parkinson/Neurodegeneration)
- **Latent Embedding**: 256-dimensional feature vector extracted prior to classification head
- **Target Conv Layer for Grad-CAM**: `features.denseblock4.denselayer16`

### 2.2 Spiral Drawing Tremor Classifier
- **Architecture**: ResNet-18 (Residual Network)
- **Framework**: PyTorch
- **Checkpoint**: `outputs/checkpoints/image_best.pth` (43.21 MB)
- **Input Dimensions**: `(B, 3, 224, 224)` Normalized float tensor
- **Output**: Binary classification logits `(B, 2)` (Normal vs. Parkinson)
- **Latent Embedding**: 256-dimensional feature vector
- **Target Conv Layer for Grad-CAM**: `layer4`

### 2.3 Vocal Dysphonia Deep Neural Network
- **Architecture**: Deep MLP (`Linear(22, 64) -> BatchNorm -> ReLU -> Dropout(0.3) -> Linear(64, 2)`)
- **Framework**: PyTorch
- **Checkpoint**: `outputs/checkpoints/voice_mlp_best.pth` (0.02 MB)
- **Input Dimensions**: `(B, 22)` Oxford vocal acoustic features
- **Output**: Binary classification logits `(B, 2)`

### 2.4 Vocal Dysphonia Gradient Booster
- **Architecture**: CatBoost Classifier (Symmetric Decision Trees)
- **Framework**: CatBoost
- **Checkpoint**: `outputs/checkpoints/voice_best_model.pkl` (0.25 MB)
- **Scaler Checkpoint**: `outputs/checkpoints/voice_scaler.pkl` (StandardScaler fitted on 22 features)
- **Input**: 22 standardized acoustic biomarkers
- **Output**: Class prediction + class probability $[0, 1]$
- **XAI Compatibility**: `shap.TreeExplainer`

### 2.5 Telemonitoring Progression Deep Neural Network
- **Architecture**: Deep MLP Regressor (`Linear(19, 64) -> ReLU -> Dropout(0.2) -> Linear(64, 2)`)
- **Framework**: PyTorch
- **Checkpoint**: `outputs/checkpoints/telemonitor_mlp_best.pth` (0.02 MB)
- **Input**: 19 clinical telemonitoring biomarkers
- **Output**: Continuous vector `[Motor UPDRS, Total UPDRS]`

### 2.6 Telemonitoring Progression Gradient Booster
- **Architecture**: XGBoost Regressor (Multi-output regression trees)
- **Framework**: XGBoost
- **Checkpoint**: `outputs/checkpoints/telemonitor_best_model.pkl` (2.59 MB)
- **Scaler Checkpoint**: `outputs/checkpoints/telemonitor_scaler.pkl` (StandardScaler fitted on 19 features)
- **Input**: 19 normalized telemon features
- **Output**: Multi-target regression `[Motor UPDRS, Total UPDRS]`
- **XAI Compatibility**: `shap.TreeExplainer`

### 2.7 Multimodal Attention Fusion Classifier
- **Architecture**: AttentionFusionClassifier
  - Modality Projection Layers: Image (256 $\rightarrow$ 64), MRI (256 $\rightarrow$ 64), Voice (22 $\rightarrow$ 64), Clinical (19 $\rightarrow$ 64)
  - Multi-Head Self-Attention: 4 attention heads over 4 modality tokens
  - Residual Aggregation + LayerNorm
  - Final Classification Head: Linear(64, 32) $\rightarrow$ ReLU $\rightarrow$ Linear(32, 2)
- **Framework**: PyTorch
- **Checkpoint**: `outputs/checkpoints/fusion_best.pth` (0.22 MB)
- **Input**: `(B, 256)` Drawing, `(B, 256)` MRI, `(B, 22)` Voice, `(B, 19)` Clinical
- **Output**: Consensus logits `(B, 2)` + normalized attention weight distribution across modalities

---

## 3. Preprocessing Specifications

```text
Image Pipeline (MRI & Spiral):
  1. Load Image (PIL / OpenCV)
  2. RGB conversion (ensure 3 channels)
  3. Bilinear Resize to 224 x 224
  4. ToTensor: Scale pixel range to [0.0, 1.0]
  5. Normalize: Mean=[0.485, 0.456, 0.406], Std=[0.229, 0.224, 0.225]

Voice Pipeline (Acoustic Phonation):
  1. Parse WAV / Audio (16-bit PCM, 16 kHz - 44.1 kHz)
  2. Autocorrelation Pitch Tracking (Fo, Fhi, Flo)
  3. Perturbation extraction: 5 Jitter variants (%), 6 Shimmer variants (dB)
  4. Noise harmonics: NHR, HNR
  5. Nonlinear dynamics: RPDE, DFA, spread1, spread2, D2, PPE
  6. Standardize using fitted StandardScaler (outputs/checkpoints/voice_scaler.pkl)

Telemonitoring Pipeline (Clinical UPDRS):
  1. Parse CSV patient telemonitoring row
  2. Extract 19 clinical biomarkers (Age, Sex, Jitter/Shimmer, NHR, HNR, RPDE, DFA, PPE)
  3. Standardize using fitted StandardScaler (outputs/checkpoints/telemonitor_scaler.pkl)
```

