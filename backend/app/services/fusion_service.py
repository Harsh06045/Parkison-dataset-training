import torch
from app.models.loader import loader

def predict_fusion(drawing_embed, mri_embed, voice_tensor, tele_tensor):
    """
    Fuses representations from the four modalities to make a combined diagnostic prediction.
    """
    if loader.fusion_model is None:
        raise RuntimeError("Multimodal Fusion model is not loaded.")
        
    # Run the PyTorch fusion classifier
    with torch.no_grad():
        logits = loader.fusion_model(drawing_embed, mri_embed, voice_tensor, tele_tensor)
        prob = torch.softmax(logits, dim=1)[0, 1].item()
        
    predicted_class = "Parkinson" if prob >= 0.5 else "Normal"
    confidence = prob if prob >= 0.5 else (1.0 - prob)
    
    return {
        "prediction": predicted_class,
        "confidence": round(confidence * 100, 2),
        "fusion": True
    }
