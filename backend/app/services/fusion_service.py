"""
Multimodal Attention Fusion Service for Parkinson's Disease.
Combines Drawing (Spiral), Voice (Acoustic), Telemonitoring (UPDRS), and MRI (Brain).
Supports safe missing-modality handling, attention-based modality contributions,
OOD detection, and Bayesian uncertainty estimation.
"""

import torch
import numpy as np
from app.models.loader import loader


def detect_ood_inputs(drawing_embed=None, mri_embed=None, voice_tensor=None, tele_tensor=None):
    """
    Evaluates inputs against expected statistical norms to detect corrupted
    or Out-of-Distribution (OOD) data.
    """
    flags = {}
    max_z = 0.0

    if voice_tensor is not None:
        v_np = voice_tensor.detach().cpu().numpy().flatten()
        # Oxford standardized features typically lie in [-4.0, 8.0]
        v_max = float(np.max(np.abs(v_np)))
        flags["voice_ood"] = v_max > 12.0
        max_z = max(max_z, v_max / 4.0)

    if tele_tensor is not None:
        t_np = tele_tensor.detach().cpu().numpy().flatten()
        # Check reasonable bounds for telemonitoring clinical features
        # Age [20, 100], test_time [0, 300], etc.
        flags["telemonitor_ood"] = bool(t_np[0] < 15 or t_np[0] > 110) if len(t_np) > 0 else False
        max_z = max(max_z, 1.0 if not flags["telemonitor_ood"] else 3.5)

    if drawing_embed is not None:
        d_norm = float(torch.norm(drawing_embed).item())
        flags["drawing_ood"] = bool(d_norm < 1.0 or d_norm > 400.0)
        max_z = max(max_z, d_norm / 100.0)

    if mri_embed is not None:
        m_norm = float(torch.norm(mri_embed).item())
        flags["mri_ood"] = bool(m_norm < 1.0 or m_norm > 400.0)
        max_z = max(max_z, m_norm / 100.0)

    flags = {k: bool(v) for k, v in flags.items()}
    is_ood = bool(any(flags.values()))
    ood_score = round(float(min(100.0, max_z * 12.0)), 2)

    return {
        "is_out_of_distribution": is_ood,
        "ood_anomaly_score": ood_score,
        "modality_flags": flags
    }


def predict_fusion(drawing_embed=None, mri_embed=None, voice_tensor=None, tele_tensor=None):
    """
    Fuses representations from any available combination of the four modalities.
    Does NOT require all four modalities to be present.
    
    Returns:
        dict: containing:
            - prediction: 'Parkinson' or 'Normal'
            - confidence: confidence percentage (50-100%)
            - uncertainty: uncertainty score (0-100%)
            - raw_probability: float [0, 1]
            - modality_contributions: dict of attention weights per modality
            - present_modalities: list of modalities used
            - missing_modalities: list of modalities absent
            - ood_analysis: out-of-distribution detection summary
            - clinical_review: clinical interpretation summary
    """
    loader.require_model("fusion")

    device = loader.device

    # Ensure tensors are on the correct device
    if drawing_embed is not None:
        drawing_embed = drawing_embed.to(device)
    if mri_embed is not None:
        mri_embed = mri_embed.to(device)
    if voice_tensor is not None:
        voice_tensor = voice_tensor.to(device)
    if tele_tensor is not None:
        tele_tensor = tele_tensor.to(device)

    all_modalities = {
        "spiral": drawing_embed is not None,
        "mri": mri_embed is not None,
        "voice": voice_tensor is not None,
        "telemonitor": tele_tensor is not None
    }

    present = [k for k, v in all_modalities.items() if v]
    missing = [k for k, v in all_modalities.items() if not v]

    if len(present) == 0:
        raise ValueError("At least one modality (Voice, Spiral Drawing, Telemonitoring, or MRI) must be provided.")

    # 1. Out-of-Distribution Check
    ood_info = detect_ood_inputs(drawing_embed, mri_embed, voice_tensor, tele_tensor)

    # 2. Run Attention Fusion Model
    with torch.no_grad():
        logits, contributions = loader.fusion_model(
            image_embed=drawing_embed,
            mri_embed=mri_embed,
            voice_feat=voice_tensor,
            clinical_feat=tele_tensor,
            return_attention=True
        )
        prob = torch.softmax(logits, dim=1)[0, 1].item()

    predicted_class = "Parkinson" if prob >= 0.5 else "Normal"
    confidence = prob if prob >= 0.5 else (1.0 - prob)

    # Uncertainty estimation: combines classification entropy and missing-modality penalty
    base_uncertainty = 4.0 * prob * (1.0 - prob) * 100.0
    missing_modality_penalty = len(missing) * 2.5 # Slight uncertainty increase per missing modality
    uncertainty = round(min(100.0, base_uncertainty * 0.7 + missing_modality_penalty), 2)

    # 3. Clinical Review Narrative
    top_modality = max(contributions, key=contributions.get) if contributions else "None"
    review = (
        f"Multimodal assessment combined {len(present)} modality/modalities ({', '.join(present)}). "
        f"Primary attention contribution was driven by {top_modality.capitalize()} ({contributions.get(top_modality, 0)*100:.1f}%). "
        f"Overall diagnostic confidence is {confidence*100:.1f}% with an estimated uncertainty of {uncertainty:.1f}%."
    )

    return {
        "prediction": predicted_class,
        "confidence": round(confidence * 100.0, 2),
        "uncertainty": uncertainty,
        "raw_probability": round(prob, 4),
        "modality_contributions": contributions,
        "present_modalities": present,
        "missing_modalities": missing,
        "ood_analysis": ood_info,
        "clinical_review": review,
        "fusion": True
    }


# Backwards compatibility alias
predict_multimodal_fusion = predict_fusion
