# NeuroFusionAI – Centralized Testing Infrastructure

This directory serves as the unified, canonical repository for all automated testing inputs and test output artifacts for the **NeuroFusionAI – Parkinson's Disease Detection Platform**.

## Directory Layout

```
testing/
├── inputs/
│   ├── spiral/                # Archimedean spiral drawing tests (control & Parkinson's)
│   ├── voice/                 # Audio WAV recordings and 22 acoustic biomedical feature CSVs
│   ├── mri/                   # T1-weighted axial brain MRI neuroimaging slices
│   ├── telemonitor/           # Longitudinal motor/total UPDRS clinical feature vectors
│   ├── eeg/                   # Electroencephalography (EEG) signal traces & power bands
│   └── corrupted/             # Malformed, truncated, and 0-byte files for negative testing
├── results/
│   ├── predictions/           # Captured JSON prediction records from automated test runs
│   ├── gradcam/               # Generated Grad-CAM heatmap overlays
│   ├── shap/                  # Generated TreeExplainer SHAP summary and beeswarm plots
│   ├── reports/               # Test-generated clinical PDF reports
│   └── metrics/               # Model evaluation and latency logs
├── test_manifest.json         # Cryptographic registry of all testing inputs with SHA-256
└── README.md                  # This file
```

## Programmatic Usage in Tests

Test suites should resolve files through `app.core.config.settings` or `pathlib.Path`:

```python
from app.core.config import settings

spiral_input = settings.TESTING_INPUTS_DIR / "spiral" / "spiral_parkinson.png"
voice_input = settings.TESTING_INPUTS_DIR / "voice" / "voice_sample.wav"
mri_input = settings.TESTING_INPUTS_DIR / "mri" / "mri_axial.png"
```
