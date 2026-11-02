# NeuroFusionAI – Dataset Specifications & Preprocessing Standards

**System**: NeuroFusionAI Preprocessing Pipelines  
**Document**: Modality Preprocessing Standards & Feature Extraction  
**Generated**: 2026-11-02  

---

## 1. Modality Preprocessing Standards

### 1.1 Archimedean Spiral Drawing
- **Input Source**: Scanned or photographed drawing paper (JPEG, PNG).
- **Validation Rules**:
  - Image width and height $\ge 128$ px.
  - Aspect ratio within $[0.2, 5.0]$.
  - Contrast check: standard deviation of pixel intensities $> 10.0$ (rejects blank white/black pages).
- **Transformation Pipeline**:
  ```python
  transforms.Compose([
      transforms.Resize((224, 224), interpolation=InterpolationMode.BILINEAR),
      transforms.ToTensor(),
      transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
  ])
  ```

### 1.2 Brain MRI Structural Scans
- **Input Source**: Axial, coronal, or sagittal T1-weighted structural MRI slices.
- **Validation Rules**:
  - Valid image header with 1 or 3 color channels.
  - Size $\le 25$ MB.
- **Transformation Pipeline**:
  - Resized to $(224, 224)$ with bilinear interpolation.
  - Normalized with standard ImageNet distribution.

### 1.3 Vocal Phonation Signals (Oxford Acoustic Benchmark)
- **Input Source**: Sustained vowel `/a/` phonation recorded via microphone (WAV) or pre-extracted CSV row.
- **Extracted Physiological Features (22 total)**:
  1. `MDVP:Fo(Hz)`: Average fundamental frequency.
  2. `MDVP:Fhi(Hz)`: Maximum vocal fundamental frequency.
  3. `MDVP:Flo(Hz)`: Minimum vocal fundamental frequency.
  4. `MDVP:Jitter(%)`, `MDVP:Jitter(Abs)`, `MDVP:RAP`, `MDVP:PPQ`, `Jitter:DDP`: Measures of vocal pitch period instability.
  5. `MDVP:Shimmer`, `MDVP:Shimmer(dB)`, `Shimmer:APQ3`, `Shimmer:APQ5`, `MDVP:APQ`, `Shimmer:DDA`: Measures of vocal amplitude perturbation.
  6. `NHR`: Noise-to-harmonics ratio.
  7. `HNR`: Harmonics-to-noise ratio.
  8. `RPDE`: Recurrence period density entropy (nonlinear measure).
  9. `DFA`: Detrended fluctuation analysis (signal fractal scaling exponent).
  10. `spread1`, `spread2`: Nonlinear measures of fundamental frequency variation.
  11. `D2`: Correlation dimension.
  12. `PPE`: Pitch period entropy.
- **Standardization**:
  - Scaled using `outputs/checkpoints/voice_scaler.pkl` ($z = (x - \mu) / \sigma$).

### 1.4 Clinical Telemonitoring Metrics
- **Input Source**: Longitudinal UPDRS progression CSV.
- **Extracted Clinical Features (19 total)**:
  - Age, Sex, Test Duration, Jitter variants, Shimmer variants, NHR, HNR, RPDE, DFA, PPE.
- **Standardization**:
  - Scaled using `outputs/checkpoints/telemonitor_scaler.pkl`.

