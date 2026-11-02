# NeuroFusionAI – Known Limitations & Clinical Boundary Disclaimers

**System**: NeuroFusionAI – Parkinson's Disease Diagnostic Platform  
**Document**: System Limitations, Clinical Scope & Environmental Assumptions  
**Generated**: 2026-11-02  

---

## 1. Clinical Decision Support Disclaimer

**NeuroFusionAI is an Artificial Intelligence-assisted Clinical Decision Support System (CDSS), NOT an autonomous diagnostic medical device.**
- Model predictions (confidence scores, UPDRS estimates, Grad-CAM overlays, and SHAP feature attributions) are intended exclusively to assist qualified licensed neurologists and clinicians.
- No medical treatment, surgical intervention, or medication adjustment should ever be initiated solely on the basis of automated software outputs without independent clinical examination by a qualified medical professional.

---

## 2. Technical & Environmental Limitations

### 2.1 Hardware Acceleration (CUDA vs. CPU)
- In the current development and verification environment, models run on `device: cpu`.
- While inference latency is fast ($\sim 50\text{ms}$ per forward pass on CPU), production batch processing or simultaneous multi-user loads will benefit significantly from NVIDIA GPU hardware acceleration (`device: cuda`).

### 2.2 Audio Signal Preprocessing & Background Noise
- Voice feature extraction relies on acoustic autocorrelation and period perturbation tracking.
- Audio recordings with significant ambient background noise, microphone clipping, or reverberation can distort micro-perturbation metrics (Jitter and Shimmer). Clinical voice recordings must be captured in low-noise acoustic environments using high-fidelity directional microphones.

### 2.3 MRI Slice Standardization
- The DenseNet-121 MRI classifier is trained on normalized T1-weighted structural slices showing basal ganglia, substantia nigra, and lateral ventricles.
- Scans with heavy motion artifacts, non-standard contrast agents, or extreme field inhomogeneities may produce uncalibrated predictions. The system flags out-of-distribution inputs via the OOD detection engine.

### 2.4 Network Connectivity & Neon Cloud Pooling
- Because the primary database is hosted on Neon Cloud PostgreSQL, external internet access via port 5432 with TLS is required.
- In offline or air-gapped clinical deployments, the transparent local SQLite fallback or an on-premises PostgreSQL instance must be configured.

