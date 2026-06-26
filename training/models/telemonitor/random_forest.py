from sklearn.ensemble import RandomForestRegressor
import numpy as np
import pickle

class TelemonitorRandomForestRegressor:
    """
    Multi-output Random Forest Regressor for UPDRS score prediction.
    """
    def __init__(self, n_estimators=100, max_depth=None, min_samples_split=2):
        self.model = RandomForestRegressor(
            n_estimators=n_estimators,
            max_depth=max_depth,
            min_samples_split=min_samples_split,
            random_state=42
        )
        
    def fit(self, X, y):
        # RandomForestRegressor supports multi-output natively!
        self.model.fit(X, y)
        
    def predict(self, X):
        return self.model.predict(X)
        
    def save(self, path):
        with open(path, 'wb') as f:
            pickle.dump(self.model, f)
            
    def load(self, path):
        with open(path, 'rb') as f:
            self.model = pickle.load(f)
