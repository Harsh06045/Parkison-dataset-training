"""
Spiral hand-drawing classifier service with ResNet-18 and explainability support.
"""

import torch
from app.models.loader import loader
from app.preprocessing.image import preprocess_image, validate_image_quality


def predict_spiral(image_path_or_pil):
    """
    Run spiral hand-drawing classifier on patient sketch image.
    
    Returns:
        dict: containing:
            - prediction: 'Parkinson' or 'Normal'
            - confidence: confidence percentage (50-100%)
            - uncertainty: uncertainty margin (0-100%)
            - raw_probability: float [0, 1]
            - quality: image validation summary
            - embedding: 256-d latent feature tensor for multimodal fusion
    """
    if loader.spiral_model is None:
        raise RuntimeError("Spiral drawing model is not loaded.")

    device = loader.device

    # 1. Image Quality Validation
    quality = validate_image_quality(image_path_or_pil)
    if not quality['valid']:
        raise ValueError(f"Spiral Image Validation Failed: {quality['reason']}")

    # 2. Preprocessing & Normalization
    input_tensor = preprocess_image(image_path_or_pil, device=device)

    # 3. Model Inference
    with torch.no_grad():
        logits = loader.spiral_model(input_tensor)
        prob = torch.softmax(logits, dim=1)[0, 1].item()
        embedding = loader.spiral_model.extract_features(input_tensor)

    predicted_class = "Parkinson" if prob >= 0.5 else "Normal"
    confidence = prob if prob >= 0.5 else (1.0 - prob)

    # Uncertainty: maximal (100%) at p=0.5, minimal (0%) at p=1.0 or 0.0
    uncertainty = 4.0 * prob * (1.0 - prob) * 100.0

    return {
        "prediction": predicted_class,
        "confidence": round(confidence * 100.0, 2),
        "uncertainty": round(uncertainty, 2),
        "raw_probability": round(prob, 4),
        "quality": quality,
        "embedding": embedding
    }
