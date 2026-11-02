# NeuroFusionAI – Explainable AI (XAI) Documentation

**System**: NeuroFusionAI Explainability Engine  
**Document**: Mathematical & Algorithmic Explainability Integration  
**Generated**: 2026-11-02  

---

## 1. Explainability Philosophy

In clinical healthcare systems, black-box predictions carry high epistemic risk. NeuroFusionAI provides mathematically grounded explainability artifacts for every supported prediction:
1. **Grad-CAM**: Gradient-weighted Class Activation Mapping for visual convolutional representations (Spiral Drawings and Brain MRI).
2. **SHAP**: Shapley Additive Explanations using `shap.TreeExplainer` for tabular vocal and telemonitoring gradient boosted trees.
3. **Cross-Modality Attention Weights**: Attention weight attribution quantifying the relative contribution of each modality in multimodal fusion.

---

## 2. Grad-CAM Implementation

### 2.1 Mathematical Formulation
For target class $c$ and convolutional activation map $A^k$ of feature layer $l$:
$$\alpha_k^c = \frac{1}{Z} \sum_i \sum_j \frac{\partial Y^c}{\partial A_{i, j}^k}$$
$$L_{\text{Grad-CAM}}^c = \text{ReLU}\left( \sum_k \alpha_k^c A^k \right)$$

### 2.2 Target Layer Mapping
- **ResNet-18 (Spiral Drawing)**: Hooked onto `model.layer4[1].conv2`.
- **DenseNet-121 (Brain MRI)**: Hooked onto `model.features.denseblock4.denselayer16.conv2`.

### 2.3 Visual Output Artifacts
Grad-CAM generates three distinct visual outputs:
- `original`: Greyscale or RGB preprocessed patient scan.
- `heatmap`: Raw jet-colormap heatmap highlighting regions with maximal positive gradients.
- `overlay`: 50/50 alpha-blended composite overlay stored in `backend/static/` and `backend/uploads/medical_storage/gradcam/`.

---

## 3. SHAP Implementation

### 3.1 TreeExplainer Formulation
For CatBoost (Voice) and XGBoost (Telemonitoring) models:
$$\phi_i(v) = \sum_{S \subseteq N \setminus \{i\}} \frac{|S|!(|N| - |S| - 1)!}{|N|!} \left( v(S \cup \{i\}) - v(S) \right)$$
Where $\phi_i$ is the exact Shapley contribution of biomarker $i$.

### 3.2 Clinical Output Artifacts
- **SHAP Summary Plot (`voice_shap_summary.png`)**: Bee-swarm distribution plot displaying direction and magnitude of impact for all 22 acoustic features.
- **SHAP Feature Importance Bar Chart (`voice_shap_bar.png`)**: Ranked mean absolute Shapley values ($|\phi_i|$) identifying top discriminative biomarkers (e.g. `HNR`, `PPE`, `MDVP:Fo`).
- **SHAP Force Plot**: Visual waterfall showing feature-by-feature push towards healthy vs. Parkinson decision thresholds.

---

## 4. Multimodal Attention Explainability

The `AttentionFusionClassifier` implements scaled dot-product multi-head attention:
$$\text{Attention}(Q, K, V) = \text{softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right)V$$
The softmax matrix provides normalized attention weights across `[spiral, mri, voice, telemonitor]`, which are saved to database records and plotted in the comprehensive clinical PDF report.

