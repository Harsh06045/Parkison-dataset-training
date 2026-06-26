import os
import sys
import torch
import torch.nn as nn
import torch.optim as optim
import pandas as pd
import numpy as np

# Resolve project root
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)

from training.config import HYPERPARAMETER_GRIDS, CHECKPOINT_DIR
from training.logger import setup_logger
from training.model_selector import ModelSelector
from training.trainer import PyTorchTrainer
from training.metrics import compute_regression_metrics as calc_metrics
from preprocessing.telemonitor_preprocessing import get_telemonitor_dataloader

# Import PyTorch Models
from training.models.telemonitor.mlp import TelemonitorMLPRegressor

# Import ML Wrapper Models
from training.models.telemonitor.xgboost import TelemonitorXGBRegressor
from training.models.telemonitor.lightgbm import TelemonitorLGBMRegressor
from training.models.telemonitor.catboost import TelemonitorCatBoostRegressor
from training.models.telemonitor.random_forest import TelemonitorRandomForestRegressor

logger = setup_logger("train_telemonitor", log_file=os.path.join(PROJECT_ROOT, "outputs", "logs", "train_telemonitor.log"))

def train_telemonitor_module(fast_cpu_mode=True):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"Training Telemonitoring Module on device: {device}")
    
    # 1. Load tabular telemonitoring splits
    train_df = pd.read_csv('datasets/train/telemonitoring/telemonitor_train.csv')
    val_df = pd.read_csv('datasets/validation/telemonitoring/telemonitor_validation.csv')
    test_df = pd.read_csv('datasets/test/telemonitoring/telemonitor_test.csv')
    
    X_train = train_df.drop(columns=['motor_UPDRS', 'total_UPDRS']).values
    y_train = train_df[['motor_UPDRS', 'total_UPDRS']].values
    X_val = val_df.drop(columns=['motor_UPDRS', 'total_UPDRS']).values
    y_val = val_df[['motor_UPDRS', 'total_UPDRS']].values
    X_test = test_df.drop(columns=['motor_UPDRS', 'total_UPDRS']).values
    y_test = test_df[['motor_UPDRS', 'total_UPDRS']].values
    
    # Load PyTorch dataloaders
    train_loader = get_telemonitor_dataloader("train", batch_size=32, shuffle=True)
    val_loader = get_telemonitor_dataloader("validation", batch_size=32, shuffle=False)
    test_loader = get_telemonitor_dataloader("test", batch_size=32, shuffle=False)
    
    # Grid limits
    if device.type == "cpu" and fast_cpu_mode:
        epochs = 1
        patience = 1
    else:
        epochs = 10
        patience = 8

    selector = ModelSelector(modality_name="telemonitor", metric_name="R2 Score", metric_mode="max")
    
    # -------------------------------------------------------------
    # SECTION A: Train MLP PyTorch Regressor
    # -------------------------------------------------------------
    logger.info(f"\n--- Training DL MLP Regressor ---")
    try:
        model = TelemonitorMLPRegressor(input_dim=19, hidden_dim=64, output_dim=2, dropout=0.2).to(device)
        criterion = nn.MSELoss()
        optimizer = optim.Adam(model.parameters(), lr=0.005, weight_decay=1e-4)
        scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode="max", factor=0.5, patience=5)
        
        trainer = PyTorchTrainer(
            model=model,
            criterion=criterion,
            optimizer=optimizer,
            scheduler=scheduler,
            device=device,
            model_name="telemonitor_dl_mlp",
            metric_name="R2 Score",
            metric_mode="max",
            early_stopping_patience=patience,
            is_regression=True,
            hyperparameters={"lr": 0.005, "weight_decay": 1e-4}
        )
        
        best_val_r2 = trainer.fit(train_loader, val_loader, total_epochs=epochs)
        
        # Test Evaluation
        model.eval()
        test_preds = []
        test_targets = []
        with torch.no_grad():
            for feats, targets in test_loader:
                feats, targets = feats.to(device), targets.to(device)
                outputs = model(feats)
                test_preds.append(outputs.cpu().numpy())
                test_targets.append(targets.cpu().numpy())
                
        test_preds = np.concatenate(test_preds, axis=0)
        test_targets = np.concatenate(test_targets, axis=0)
        test_r2 = calc_metrics(test_targets, test_preds)["R2 Score"]
        logger.info(f"MLP Regressor Test R2-Score: {test_r2:.4f}")
        
        checkpoint_path = os.path.join(trainer.checkpoint_dir, "best.pth")
        selector.register_model(
            model_name="DL_MLP",
            val_metric=best_val_r2,
            test_metric=test_r2,
            checkpoint_path=checkpoint_path
        )
    except Exception as e:
        logger.error(f"Error training DL MLP: {e}")

    # -------------------------------------------------------------
    # SECTION B: Train Machine Learning Regressors
    # -------------------------------------------------------------
    # 800 boosting rounds with early stopping after 50 rounds without improvement
    ml_models = {
        "XGBoost": (TelemonitorXGBRegressor, {"n_estimators": 800, "max_depth": 4, "learning_rate": 0.05, "subsample": 0.8, "early_stopping_rounds": 50}),
        "LightGBM": (TelemonitorLGBMRegressor, {"n_estimators": 800, "max_depth": 4, "learning_rate": 0.05, "subsample": 0.8, "early_stopping_rounds": 50}),
        "CatBoost": (TelemonitorCatBoostRegressor, {"iterations": 800, "depth": 4, "learning_rate": 0.05, "early_stopping_rounds": 50})
    }
    
    for model_name, (model_class, model_kwargs) in ml_models.items():
        logger.info(f"\n--- Training ML {model_name} Regressor ---")
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
            
            val_r2 = calc_metrics(y_val, val_preds)["R2 Score"]
            test_r2 = calc_metrics(y_test, test_preds)["R2 Score"]
            logger.info(f"{model_name} Val R2-Score: {val_r2:.4f} | Test R2-Score: {test_r2:.4f}")
            
            # Save ML best model pickle
            dest_dir = os.path.join(CHECKPOINT_DIR, f"telemonitor_ml_{model_name.lower()}")
            os.makedirs(dest_dir, exist_ok=True)
            checkpoint_path = os.path.join(dest_dir, "best.pkl")
            model.save(checkpoint_path)
            
            selector.register_model(
                model_name=f"ML_{model_name}",
                val_metric=val_r2,
                test_metric=test_r2,
                checkpoint_path=checkpoint_path
            )
        except Exception as e:
            logger.error(f"Error training ML {model_name}: {e}")

    # Select best model
    best_model_path = selector.select_best_model()
    return best_model_path

if __name__ == "__main__":
    train_telemonitor_module(fast_cpu_mode=True)
