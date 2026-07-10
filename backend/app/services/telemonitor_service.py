import torch
import numpy as np
from app.models.loader import loader
from app.preprocessing.telemonitor import preprocess_telemonitor_file

def predict_telemonitor(file_path):
    """
    Run telemonitoring regressor.
    Returns:
        dict: containing predicted motor_UPDRS, total_UPDRS, raw features numpy array, and PyTorch tensor.
    """
    if loader.telemonitor_mlp_model is None:
        raise RuntimeError("Telemonitoring model is not loaded.")
        
    device = loader.device
    
    # 1. Preprocess file
    features_np = preprocess_telemonitor_file(file_path)
    
    # 2. Convert to tensor
    tele_tensor = torch.tensor(features_np, dtype=torch.float32).unsqueeze(0).to(device)
    
    # 3. Predict using PyTorch MLP Regressor
    with torch.no_grad():
        preds = loader.telemonitor_mlp_model(tele_tensor).cpu().numpy()[0]
        
    return {
        "motor_updrs": round(float(preds[0]), 2),
        "total_updrs": round(float(preds[1]), 2),
        "features": features_np,
        "tensor": tele_tensor
    }
