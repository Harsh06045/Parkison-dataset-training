import torch
import torch.nn as nn
import xgboost as xgb
import pickle

class VoiceMLPClassifier(nn.Module):
    """
    Multi-Layer Perceptron for Oxford Voice classification.
    Expects 22 voice features as input.
    """
    def __init__(self, input_dim=22, hidden_dim=64, num_classes=2):
        super(VoiceMLPClassifier, self).__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.BatchNorm1d(hidden_dim),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.BatchNorm1d(hidden_dim // 2),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(hidden_dim // 2, num_classes)
        )
        
    def forward(self, x):
        return self.net(x)

class VoiceXGBClassifier:
    """
    XGBoost Classifier wrapper for Oxford Voice classification.
    """
    def __init__(self, n_estimators=100, max_depth=3, learning_rate=0.1):
        self.model = xgb.XGBClassifier(
            n_estimators=n_estimators,
            max_depth=max_depth,
            learning_rate=learning_rate,
            random_state=42,
            use_label_encoder=False,
            eval_metric='logloss'
        )
        
    def fit(self, X, y):
        self.model.fit(X, y)
        
    def predict(self, X):
        return self.model.predict(X)
        
    def predict_proba(self, X):
        return self.model.predict_proba(X)
        
    def save(self, path):
        with open(path, 'wb') as f:
            pickle.dump(self.model, f)
            
    def load(self, path):
        with open(path, 'rb') as f:
            self.model = pickle.load(f)
