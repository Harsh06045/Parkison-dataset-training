import torch
import torch.nn as nn
import xgboost as xgb
import pickle

class TelemonitorMLPRegressor(nn.Module):
    """
    Multi-output MLP for UPDRS severity score prediction.
    Expects 19 voice features as input.
    Predicts 2 targets: motor_UPDRS and total_UPDRS.
    """
    def __init__(self, input_dim=19, hidden_dim=64, output_dim=2):
        super(TelemonitorMLPRegressor, self).__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.BatchNorm1d(hidden_dim),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.BatchNorm1d(hidden_dim // 2),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(hidden_dim // 2, output_dim)
        )
        
    def forward(self, x):
        return self.net(x)

class TelemonitorXGBRegressor:
    """
    Multi-output XGBoost Regressor for UPDRS score prediction.
    Trains two separate regressor models internally (one for motor, one for total).
    """
    def __init__(self, n_estimators=100, max_depth=4, learning_rate=0.1):
        self.motor_model = xgb.XGBRegressor(
            n_estimators=n_estimators,
            max_depth=max_depth,
            learning_rate=learning_rate,
            random_state=42
        )
        self.total_model = xgb.XGBRegressor(
            n_estimators=n_estimators,
            max_depth=max_depth,
            learning_rate=learning_rate,
            random_state=42
        )
        
    def fit(self, X, y):
        # y should be a matrix of shape (N, 2)
        # column 0 is motor_UPDRS, column 1 is total_UPDRS
        self.motor_model.fit(X, y[:, 0])
        self.total_model.fit(X, y[:, 1])
        
    def predict(self, X):
        motor_preds = self.motor_model.predict(X)
        total_preds = self.total_model.predict(X)
        import numpy as np
        return np.column_stack((motor_preds, total_preds))
        
    def save(self, path):
        with open(path, 'wb') as f:
            pickle.dump((self.motor_model, self.total_model), f)
            
    def load(self, path):
        with open(path, 'rb') as f:
            self.motor_model, self.total_model = pickle.load(f)
