import os

# Base paths
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(PROJECT_ROOT, "datasets")
OUTPUT_DIR = os.path.join(PROJECT_ROOT, "outputs")
CHECKPOINT_DIR = os.path.join(OUTPUT_DIR, "checkpoints")
LOG_DIR = os.path.join(OUTPUT_DIR, "logs")
REPORT_DIR = os.path.join(OUTPUT_DIR, "reports")

# Ensure directories exist
for d in [CHECKPOINT_DIR, LOG_DIR, REPORT_DIR]:
    os.makedirs(d, exist_ok=True)

# Grid Search configurations for Hyperparameter tuning
HYPERPARAMETER_GRIDS = {
    "mri": {
        "lr": [0.0005, 0.001, 0.003],
        "batch_size": [8, 16],
        "optimizer": ["Adam", "AdamW"],
        "weight_decay": [1e-4, 1e-3],
        "epochs": 10,
        "patience": 10
    },
    "spiral": {
        "lr": [0.0005, 0.001, 0.003],
        "batch_size": [8, 16],
        "optimizer": ["Adam", "AdamW"],
        "weight_decay": [1e-4, 1e-3],
        "epochs": 10,
        "patience": 10
    },
    "voice": {
        "mlp": {
            "hidden_dim": [32, 64],
            "lr": [0.001, 0.005, 0.01],
            "weight_decay": [1e-4, 1e-2],
            "dropout": [0.2, 0.4],
            "optimizer": ["Adam", "AdamW"],
            "batch_size": [16, 32],
            "epochs": 10,
            "patience": 10
        },
        "cnn1d": {
            "num_filters": [16, 32],
            "lr": [0.001, 0.005],
            "dropout": [0.2, 0.3],
            "epochs": 10,
            "patience": 10
        },
        "cnn_lstm": {
            "hidden_dim": [32, 64],
            "lr": [0.001, 0.005],
            "epochs": 10,
            "patience": 10
        },
        "cnn_bilstm": {
            "hidden_dim": [32, 64],
            "lr": [0.001, 0.005],
            "epochs": 10,
            "patience": 10
        },
        "transformer": {
            "num_heads": [2, 4],
            "num_layers": [1, 2],
            "lr": [0.0005, 0.001],
            "epochs": 80,
            "patience": 10
        },
        "xgboost": {
            "max_depth": [3, 4, 5],
            "learning_rate": [0.01, 0.05, 0.1],
            "n_estimators": [100, 150, 200],
            "subsample": [0.7, 0.8, 1.0]
        },
        "lightgbm": {
            "max_depth": [3, 4, 5],
            "learning_rate": [0.01, 0.05, 0.1],
            "n_estimators": [100, 150, 200],
            "subsample": [0.7, 0.8, 1.0]
        },
        "catboost": {
            "depth": [3, 4, 5],
            "learning_rate": [0.01, 0.05, 0.1],
            "iterations": [100, 150, 200]
        },
        "random_forest": {
            "n_estimators": [100, 150, 200],
            "max_depth": [3, 5, None],
            "min_samples_split": [2, 5]
        },
        "svm": {
            "C": [0.5, 1.0, 5.0, 10.0],
            "kernel": ["rbf", "linear", "poly"],
            "gamma": ["scale", 0.05, 0.1]
        }
    },
    "telemonitor": {
        "mlp": {
            "hidden_dim": [32, 64],
            "lr": [0.001, 0.005],
            "weight_decay": [1e-4, 1e-2],
            "dropout": [0.2, 0.3],
            "optimizer": ["Adam", "AdamW"],
            "batch_size": [16, 32],
            "epochs": 10,
            "patience": 8
        },
        "xgboost": {
            "max_depth": [3, 4, 5],
            "learning_rate": [0.01, 0.05, 0.1],
            "n_estimators": [100, 150, 200],
            "subsample": [0.7, 0.8, 1.0]
        },
        "lightgbm": {
            "max_depth": [3, 4, 5],
            "learning_rate": [0.01, 0.05, 0.1],
            "n_estimators": [100, 150, 200],
            "subsample": [0.7, 0.8, 1.0]
        },
        "catboost": {
            "depth": [3, 4, 5],
            "learning_rate": [0.01, 0.05, 0.1],
            "iterations": [100, 150, 200]
        },
        "random_forest": {
            "n_estimators": [100, 150, 200],
            "max_depth": [3, 5, None],
            "min_samples_split": [2, 5]
        }
    },
    "fusion": {
        "lr": [0.001, 0.005],
        "weight_decay": [1e-4, 1e-3],
        "epochs": 10,
        "patience": 10,
        "batch_size": [16, 32]
    }
}
