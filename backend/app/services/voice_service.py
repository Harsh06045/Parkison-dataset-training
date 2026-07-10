import torch
import numpy as np
from app.models.loader import loader
from app.preprocessing.voice import preprocess_voice_file

def predict_voice(file_path):
    """
    Run voice classifier.
    Returns:
        dict: containing prediction class, confidence (percent), raw features numpy array, and PyTorch tensor.
    """
    if loader.voice_mlp_model is None:
        raise RuntimeError("Voice MLP model is not loaded.")
        
    device = loader.device
    
    # 1. Preprocess file
    features_np = preprocess_voice_file(file_path)
    
    # 2. Convert to tensor
    voice_tensor = torch.tensor(features_np, dtype=torch.float32).unsqueeze(0).to(device)
    
    # 3. Predict using PyTorch MLP
    with torch.no_grad():
        logits = loader.voice_mlp_model(voice_tensor)
        prob = torch.softmax(logits, dim=1)[0, 1].item()
        
    predicted_class = "Parkinson" if prob >= 0.5 else "Normal"
    confidence = prob if prob >= 0.5 else (1.0 - prob)
    
    return {
        "prediction": predicted_class,
        "confidence": round(confidence * 100, 2),
        "features": features_np,
        "tensor": voice_tensor
    }
