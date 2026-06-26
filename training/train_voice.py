import os
import sys
import torch
import torch.nn as nn
import torch.optim as optim
import pandas as pd
import numpy as np
import pickle

# Resolve project root
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)

from training.config import HYPERPARAMETER_GRIDS, CHECKPOINT_DIR
from training.logger import setup_logger
from training.model_selector import ModelSelector
from training.trainer import PyTorchTrainer
from training.metrics import compute_classification_metrics, compute_classification_metrics as calc_metrics
from preprocessing.voice_preprocessing import get_voice_dataloader

# Import PyTorch Models
from training.models.voice.mlp import VoiceMLPClassifier
from training.models.voice.cnn1d import VoiceCNN1DClassifier
from training.models.voice.cnn_lstm import VoiceCNNLSTMClassifier
from training.models.voice.cnn_bilstm import VoiceCNNBiLSTMClassifier
from training.models.voice.transformer import VoiceTransformerClassifier

# Import ML Wrapper Models
from training.models.voice.xgboost import VoiceXGBClassifier
from training.models.voice.lightgbm import VoiceLGBMClassifier
from training.models.voice.catboost import VoiceCatBoostClassifier
from training.models.voice.random_forest import VoiceRandomForestClassifier
from training.models.voice.svm import VoiceSVMClassifier

logger = setup_logger("train_voice", log_file=os.path.join(PROJECT_ROOT, "outputs", "logs", "train_voice.log"))

def train_voice_module(fast_cpu_mode=True):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"Training Voice Module on device: {device}")
    
    # 1. Load tabular voice splits
    train_df = pd.read_csv('datasets/train/voice/oxford_train.csv')
    val_df = pd.read_csv('datasets/validation/voice/oxford_validation.csv')
    test_df = pd.read_csv('datasets/test/voice/oxford_test.csv')
    
    X_train = train_df.drop(columns=['status']).values
    y_train = train_df['status'].values
    X_val = val_df.drop(columns=['status']).values
    y_val = val_df['status'].values
    X_test = test_df.drop(columns=['status']).values
    y_test = test_df['status'].values
    
    # Load PyTorch dataloaders
    train_loader = get_voice_dataloader("train", batch_size=16, shuffle=True)
    val_loader = get_voice_dataloader("validation", batch_size=16, shuffle=False)
    test_loader = get_voice_dataloader("test", batch_size=16, shuffle=False)
    
    # Grid limits
    if device.type == "cpu" and fast_cpu_mode:
        epochs = 1
        patience = 1
    else:
        epochs = 10
        patience = 10

    selector = ModelSelector(modality_name="voice", metric_name="Accuracy", metric_mode="max")
    
    # -------------------------------------------------------------
    # SECTION A: Train Deep Learning PyTorch Models
    # -------------------------------------------------------------
    dl_models = {
        "CNN-BiLSTM": (VoiceCNNBiLSTMClassifier, {"num_filters": 16, "hidden_dim": 32, "dropout": 0.2})
    }
    
    for model_name, (model_class, model_kwargs) in dl_models.items():
        logger.info(f"\n--- Training DL {model_name} ---")
        try:
            model = model_class(input_dim=22, num_classes=2, **model_kwargs).to(device)
            criterion = nn.CrossEntropyLoss()
            
            # Apply weight decay for MLP based on tuning results
            wd = 0.01 if model_name == "MLP" else 1e-4
            optimizer = optim.Adam(model.parameters(), lr=0.005, weight_decay=wd)
            scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode="max", factor=0.5, patience=5)
            
            trainer = PyTorchTrainer(
                model=model,
                criterion=criterion,
                optimizer=optimizer,
                scheduler=scheduler,
                device=device,
                model_name=f"voice_dl_{model_name.lower().replace('-', '_')}",
                metric_name="Accuracy",
                metric_mode="max",
                early_stopping_patience=patience,
                hyperparameters={"lr": 0.005, "weight_decay": wd, **model_kwargs}
            )
            
            best_val_acc = trainer.fit(train_loader, val_loader, total_epochs=epochs)
            
            # Test Evaluation
            model.eval()
            test_preds = []
            test_targets = []
            with torch.no_grad():
                for feats, labels in test_loader:
                    feats, labels = feats.to(device), labels.to(device)
                    outputs = model(feats)
                    _, preds = outputs.max(1)
                    test_preds.extend(preds.cpu().numpy())
                    test_targets.extend(labels.cpu().numpy())
                    
            test_metrics = calc_metrics(test_targets, test_preds)
            test_acc = test_metrics["Accuracy"]
            logger.info(f"{model_name} Test Accuracy: {test_acc*100:.2f}%")
            
            checkpoint_path = os.path.join(trainer.checkpoint_dir, "best.pth")
            selector.register_model(
                model_name=f"DL_{model_name}",
                val_metric=best_val_acc,
                test_metric=test_acc,
                checkpoint_path=checkpoint_path
            )
        except Exception as e:
            logger.error(f"Error training DL {model_name}: {e}")

    # -------------------------------------------------------------
    # SECTION B: Train Machine Learning Models
    # -------------------------------------------------------------
    # Best tuned parameters from sweep (800 boosting rounds with early stopping after 50 rounds)
    ml_models = {
        "XGBoost": (VoiceXGBClassifier, {"n_estimators": 800, "max_depth": 3, "learning_rate": 0.05, "subsample": 0.7, "early_stopping_rounds": 50}),
        "LightGBM": (VoiceLGBMClassifier, {"n_estimators": 800, "max_depth": 3, "learning_rate": 0.05, "subsample": 0.7, "early_stopping_rounds": 50}),
        "CatBoost": (VoiceCatBoostClassifier, {"iterations": 800, "depth": 3, "learning_rate": 0.05, "early_stopping_rounds": 50})
    }
    
    for model_name, (model_class, model_kwargs) in ml_models.items():
        logger.info(f"\n--- Training ML {model_name} ---")
        try:
            model = model_class(**model_kwargs)
            
            # Pass eval_set for early stopping
            fit_kwargs = {}
            if "early_stopping_rounds" in model_kwargs:
                fit_kwargs["eval_set"] = [(X_val, y_val)]
                
            model.fit(X_train, y_train, **fit_kwargs)
            
            # Predict & Eval
            val_preds = model.predict(X_val)
            test_preds = model.predict(X_test)
            
            val_acc = calc_metrics(y_val, val_preds)["Accuracy"]
            test_acc = calc_metrics(y_test, test_preds)["Accuracy"]
            logger.info(f"{model_name} Val Accuracy: {val_acc*100:.2f}% | Test Accuracy: {test_acc*100:.2f}%")
            
            # Save ML best model pickle
            dest_dir = os.path.join(CHECKPOINT_DIR, f"voice_ml_{model_name.lower()}")
            os.makedirs(dest_dir, exist_ok=True)
            checkpoint_path = os.path.join(dest_dir, "best.pkl")
            model.save(checkpoint_path)
            
            selector.register_model(
                model_name=f"ML_{model_name}",
                val_metric=val_acc,
                test_metric=test_acc,
                checkpoint_path=checkpoint_path
            )
        except Exception as e:
            logger.error(f"Error training ML {model_name}: {e}")

    # Select best model
    best_model_path = selector.select_best_model()
    return best_model_path

if __name__ == "__main__":
    train_voice_module(fast_cpu_mode=True)
