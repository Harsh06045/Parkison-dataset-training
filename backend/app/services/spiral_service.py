import torch
from app.models.loader import loader
from app.preprocessing.image import preprocess_image

def predict_spiral(image_path_or_pil):
    """
    Run spiral hand-drawing classifier.
    Returns:
        dict: containing prediction class, confidence (percent), and raw embedding tensor.
    """
    if loader.spiral_model is None:
        raise RuntimeError("Spiral drawing model is not loaded.")
        
    device = loader.device
    
    # 1. Preprocess
    input_tensor = preprocess_image(image_path_or_pil, device=device)
    
    # 2. Run prediction
    with torch.no_grad():
        logits = loader.spiral_model(input_tensor)
        prob = torch.softmax(logits, dim=1)[0, 1].item()
        
        # 3. Extract features for multimodal fusion
        embedding = loader.spiral_model.extract_features(input_tensor)
        
    predicted_class = "Parkinson" if prob >= 0.5 else "Normal"
    confidence = prob if prob >= 0.5 else (1.0 - prob)
    
    return {
        "prediction": predicted_class,
        "confidence": round(confidence * 100, 2),
        "embedding": embedding
    }
