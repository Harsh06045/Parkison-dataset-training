"""
Voice analysis service with genuine acoustic processing, scaling, and ensemble uncertainty.
"""

import numpy as np
import torch
from app.models.loader import loader
from app.preprocessing.voice import preprocess_voice_file, validate_audio_quality

OXFORD_FEATURE_NAMES = [
    'MDVP:Fo(Hz)', 'MDVP:Fhi(Hz)', 'MDVP:Flo(Hz)', 'MDVP:Jitter(%)',
    'MDVP:Jitter(Abs)', 'MDVP:RAP', 'MDVP:PPQ', 'Jitter:DDP', 'MDVP:Shimmer',
    'MDVP:Shimmer(dB)', 'Shimmer:APQ3', 'Shimmer:APQ5', 'MDVP:APQ', 'Shimmer:DDA',
    'NHR', 'HNR', 'RPDE', 'DFA', 'spread1', 'spread2', 'D2', 'PPE'
]


def predict_voice(file_path):
    """
    Run voice classifier on a WAV audio file or acoustic feature CSV.
    
    Returns:
        dict: containing:
            - prediction: 'Parkinson' or 'Normal'
            - confidence: confidence percentage (50-100%)
            - uncertainty: uncertainty margin (0-100%)
            - mlp_probability: float [0, 1]
            - catboost_probability: float [0, 1] (if available)
            - acoustic_features: dictionary of extracted metrics
            - quality: audio validation info
            - tensor: PyTorch tensor for multimodal fusion
    """
    loader.require_model("voice_mlp")

    device = loader.device

    # 1. Quality validation if WAV
    quality_info = None
    if file_path.lower().endswith('.wav'):
        quality_info = validate_audio_quality(file_path)
        if not quality_info['valid']:
            raise ValueError(f"Audio Quality Validation Failed: {quality_info['reason']}")

    # 2. Preprocess & extract 22 acoustic features
    raw_features = preprocess_voice_file(file_path)

    # 3. Standard scaling:
    # If Fo >= 50 Hz, input is in raw physiological units, scale with fitted voice_scaler
    if raw_features[0] >= 50.0 and loader.voice_scaler is not None:
        scaled_features = loader.voice_scaler.transform(raw_features.reshape(1, -1))[0].astype(np.float32)
    else:
        scaled_features = raw_features.copy().astype(np.float32)

    # 4. PyTorch MLP Prediction
    voice_tensor = torch.tensor(scaled_features, dtype=torch.float32).unsqueeze(0).to(device)
    with torch.no_grad():
        logits = loader.voice_mlp_model(voice_tensor)
        mlp_prob = torch.softmax(logits, dim=1)[0, 1].item()

    # 5. CatBoost Prediction (if available)
    cb_prob = None
    if loader.voice_catboost_model is not None:
        try:
            cb_preds = loader.voice_catboost_model.predict_proba(scaled_features.reshape(1, -1))
            cb_prob = float(cb_preds[0, 1])
        except Exception:
            cb_prob = None

    # 6. Ensemble consensus and uncertainty estimation
    if cb_prob is not None:
        ensemble_prob = float(0.55 * mlp_prob + 0.45 * cb_prob)
        # Model disagreement represents epistemic uncertainty
        uncertainty = float(abs(mlp_prob - cb_prob) * 100.0)
    else:
        ensemble_prob = mlp_prob
        # Shannon entropy / margin uncertainty
        uncertainty = float(4.0 * ensemble_prob * (1.0 - ensemble_prob) * 25.0)

    predicted_class = "Parkinson" if ensemble_prob >= 0.5 else "Normal"
    confidence = ensemble_prob if ensemble_prob >= 0.5 else (1.0 - ensemble_prob)

    # Format acoustic metrics for clinical presentation
    acoustic_dict = {
        name: round(float(val), 5)
        for name, val in zip(OXFORD_FEATURE_NAMES, raw_features)
    }

    return {
        "prediction": predicted_class,
        "confidence": round(confidence * 100.0, 2),
        "uncertainty": round(uncertainty, 2),
        "mlp_probability": round(mlp_prob, 4),
        "catboost_probability": round(cb_prob, 4) if cb_prob is not None else None,
        "ensemble_probability": round(ensemble_prob, 4),
        "acoustic_features": acoustic_dict,
        "quality": quality_info,
        "features": scaled_features,
        "tensor": voice_tensor
    }
