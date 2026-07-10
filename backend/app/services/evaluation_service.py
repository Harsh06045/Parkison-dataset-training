import os
import sys
import torch
import pandas as pd
import numpy as np
from datetime import datetime
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix, mean_squared_error, mean_absolute_error, r2_score

# Add project root to sys.path
APP_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.dirname(APP_DIR)
PROJECT_ROOT = os.path.dirname(BACKEND_DIR)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from app.models.loader import loader
from app.config import STATIC_DIR

# Import preprocessing dataloaders
from preprocessing.image_preprocessing import get_image_dataloader
from preprocessing.mri_preprocessing import get_mri_dataloader
from preprocessing.voice_preprocessing import get_voice_dataloader
from preprocessing.telemonitor_preprocessing import get_telemonitor_dataloader
from preprocessing.fusion_preprocessing import get_fusion_dataloader

# Import metrics helper functions if any exist, or calculate them directly
from training.metrics import save_confusion_matrix

def evaluate_modality_metrics(modality):
    """
    Run evaluation on the test dataset for the specified modality.
    
    Returns:
        dict: containing calculated metrics.
    """
    device = loader.device
    results = {}
    
    # 1. MRI Evaluation
    if modality == "mri":
        if loader.mri_model is None:
            raise RuntimeError("MRI model not loaded.")
        
        mri_loader = get_mri_dataloader("test", batch_size=16, shuffle=False)
        targets, preds, probs = [], [], []
        
        with torch.no_grad():
            for inputs, labels in mri_loader:
                inputs = inputs.to(device)
                outputs = loader.mri_model(inputs)
                softmax_probs = torch.softmax(outputs, dim=1)
                _, predicted = outputs.max(1)
                
                preds.extend(predicted.cpu().numpy())
                probs.extend(softmax_probs[:, 1].cpu().numpy())
                targets.extend(labels.numpy())
                
        targets, preds, probs = np.array(targets), np.array(preds), np.array(probs)
        
        results = {
            "Accuracy": float(accuracy_score(targets, preds)),
            "Precision": float(precision_score(targets, preds, zero_division=0)),
            "Recall": float(recall_score(targets, preds, zero_division=0)),
            "F1 Score": float(f1_score(targets, preds, zero_division=0)),
            "ROC-AUC": float(roc_auc_score(targets, probs)) if len(np.unique(targets)) > 1 else 0.0
        }
        
        # Save confusion matrix
        plot_path = os.path.join(STATIC_DIR, "eval_mri_confusion_matrix.png")
        save_confusion_matrix(targets, preds, plot_path, title="Brain MRI — EfficientNet-B0")
        results["confusion_matrix_plot"] = "/plots/eval_mri_confusion_matrix.png"
        
    # 2. Spiral Drawings Evaluation
    elif modality == "spiral":
        if loader.spiral_model is None:
            raise RuntimeError("Spiral model not loaded.")
            
        spiral_loader = get_image_dataloader("test", batch_size=16, shuffle=False)
        targets, preds, probs = [], [], []
        
        with torch.no_grad():
            for inputs, labels in spiral_loader:
                inputs = inputs.to(device)
                outputs = loader.spiral_model(inputs)
                softmax_probs = torch.softmax(outputs, dim=1)
                _, predicted = outputs.max(1)
                
                preds.extend(predicted.cpu().numpy())
                probs.extend(softmax_probs[:, 1].cpu().numpy())
                targets.extend(labels.numpy())
                
        targets, preds, probs = np.array(targets), np.array(preds), np.array(probs)
        
        results = {
            "Accuracy": float(accuracy_score(targets, preds)),
            "Precision": float(precision_score(targets, preds, zero_division=0)),
            "Recall": float(recall_score(targets, preds, zero_division=0)),
            "F1 Score": float(f1_score(targets, preds, zero_division=0)),
            "ROC-AUC": float(roc_auc_score(targets, probs)) if len(np.unique(targets)) > 1 else 0.0
        }
        
        # Save confusion matrix
        plot_path = os.path.join(STATIC_DIR, "eval_spiral_confusion_matrix.png")
        save_confusion_matrix(targets, preds, plot_path, title="Spiral Drawings — ResNet-18")
        results["confusion_matrix_plot"] = "/plots/eval_spiral_confusion_matrix.png"

    # 3. Voice (MLP/CatBoost) Evaluation
    elif modality == "voice":
        if loader.voice_mlp_model is None or loader.voice_catboost_model is None:
            raise RuntimeError("Voice models not loaded.")
            
        # Standard: evaluate ML (CatBoost) since it's the modular best
        voice_test_df = pd.read_csv(os.path.join(PROJECT_ROOT, 'datasets/test/voice/oxford_test.csv'))
        X = voice_test_df.drop(columns=['status']).values
        targets = voice_test_df['status'].values
        
        preds = loader.voice_catboost_model.predict(X)
        probs = loader.voice_catboost_model.predict_proba(X)[:, 1]
        
        results = {
            "Accuracy": float(accuracy_score(targets, preds)),
            "Precision": float(precision_score(targets, preds, zero_division=0)),
            "Recall": float(recall_score(targets, preds, zero_division=0)),
            "F1 Score": float(f1_score(targets, preds, zero_division=0)),
            "ROC-AUC": float(roc_auc_score(targets, probs)) if len(np.unique(targets)) > 1 else 0.0
        }
        
        plot_path = os.path.join(STATIC_DIR, "eval_voice_confusion_matrix.png")
        save_confusion_matrix(targets, preds, plot_path, title="Voice — CatBoost")
        results["confusion_matrix_plot"] = "/plots/eval_voice_confusion_matrix.png"

    # 4. Telemonitoring (XGBoost) Evaluation
    elif modality == "telemonitor":
        if loader.telemonitor_xgb_model is None:
            raise RuntimeError("Telemonitoring XGBoost model not loaded.")
            
        tele_test_df = pd.read_csv(os.path.join(PROJECT_ROOT, 'datasets/test/telemonitoring/telemonitor_test.csv'))
        X = tele_test_df.drop(columns=['motor_UPDRS', 'total_UPDRS']).values
        targets = tele_test_df[['motor_UPDRS', 'total_UPDRS']].values
        
        preds = loader.telemonitor_xgb_model.predict(X)
        
        # Calculate regression metrics
        mse_motor = mean_squared_error(targets[:, 0], preds[:, 0])
        mse_total = mean_squared_error(targets[:, 1], preds[:, 1])
        r2_motor = r2_score(targets[:, 0], preds[:, 0])
        r2_total = r2_score(targets[:, 1], preds[:, 1])
        
        results = {
            "Motor UPDRS MSE": float(mse_motor),
            "Total UPDRS MSE": float(mse_total),
            "Motor UPDRS R2": float(r2_motor),
            "Total UPDRS R2": float(r2_total),
            "Overall MSE": float(mean_squared_error(targets, preds)),
            "Overall R2 Score": float(r2_score(targets, preds))
        }

    # 5. Multimodal Fusion Evaluation
    elif modality == "fusion":
        if loader.fusion_model is None:
            raise RuntimeError("Fusion model not loaded.")
            
        fusion_loader = get_fusion_dataloader("test", batch_size=16)
        targets, preds, probs = [], [], []
        
        with torch.no_grad():
            for img_embed, mri_embed, voice_feat, clin_feat, labels in fusion_loader:
                img_embed = img_embed.to(device)
                mri_embed = mri_embed.to(device)
                voice_feat = voice_feat.to(device)
                clin_feat = clin_feat.to(device)
                
                outputs = loader.fusion_model(img_embed, mri_embed, voice_feat, clin_feat)
                softmax_probs = torch.softmax(outputs, dim=1)
                _, predicted = outputs.max(1)
                
                preds.extend(predicted.cpu().numpy())
                probs.extend(softmax_probs[:, 1].cpu().numpy())
                targets.extend(labels.numpy())
                
        targets, preds, probs = np.array(targets), np.array(preds), np.array(probs)
        
        results = {
            "Accuracy": float(accuracy_score(targets, preds)),
            "Precision": float(precision_score(targets, preds, zero_division=0)),
            "Recall": float(recall_score(targets, preds, zero_division=0)),
            "F1 Score": float(f1_score(targets, preds, zero_division=0)),
            "ROC-AUC": float(roc_auc_score(targets, probs)) if len(np.unique(targets)) > 1 else 0.0
        }
        
        plot_path = os.path.join(STATIC_DIR, "eval_fusion_confusion_matrix.png")
        save_confusion_matrix(targets, preds, plot_path, title="Multimodal Fusion Model")
        results["confusion_matrix_plot"] = "/plots/eval_fusion_confusion_matrix.png"
        
    else:
        raise ValueError(f"Unknown modality for evaluation: {modality}")
        
    # Write evaluation logs to CSV
    log_dir = os.path.join(PROJECT_ROOT, "outputs", "predictions")
    os.makedirs(log_dir, exist_ok=True)
    log_file = os.path.join(log_dir, "evaluation_test_results.csv")
    
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    df_row = pd.DataFrame([{
        "Timestamp": timestamp,
        "Modality": modality,
        **{k: v for k, v in results.items() if k != "confusion_matrix_plot"}
    }])
    
    if os.path.exists(log_file):
        df_row.to_csv(log_file, mode='a', header=False, index=False)
    else:
        df_row.to_csv(log_file, mode='w', header=True, index=False)
        
    return results
