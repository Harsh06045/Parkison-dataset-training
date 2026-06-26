import lightgbm as lgb
import numpy as np
import pickle

class TelemonitorLGBMRegressor:
    """
    Multi-output LightGBM Regressor for UPDRS score prediction.
    """
    def __init__(self, n_estimators=100, max_depth=3, learning_rate=0.1, subsample=1.0, early_stopping_rounds=None):
        self.motor_model = lgb.LGBMRegressor(
            n_estimators=n_estimators,
            max_depth=max_depth,
            learning_rate=learning_rate,
            subsample=subsample,
            random_state=42,
            verbose=-1,
            early_stopping_rounds=early_stopping_rounds
        )
        self.total_model = lgb.LGBMRegressor(
            n_estimators=n_estimators,
            max_depth=max_depth,
            learning_rate=learning_rate,
            subsample=subsample,
            random_state=42,
            verbose=-1,
            early_stopping_rounds=early_stopping_rounds
        )
        
    def fit(self, X, y, **kwargs):
        # y shape: (N, 2) where y[:, 0] is motor_UPDRS and y[:, 1] is total_UPDRS
        motor_kwargs = kwargs.copy()
        total_kwargs = kwargs.copy()
        
        # Split eval_set if provided
        if "eval_set" in kwargs:
            eval_set = kwargs["eval_set"]
            motor_eval_set = []
            total_eval_set = []
            for X_v, y_v in eval_set:
                motor_eval_set.append((X_v, y_v[:, 0]))
                total_eval_set.append((X_v, y_v[:, 1]))
            motor_kwargs["eval_set"] = motor_eval_set
            total_kwargs["eval_set"] = total_eval_set
            
        self.motor_model.fit(X, y[:, 0], **motor_kwargs)
        self.total_model.fit(X, y[:, 1], **total_kwargs)
        
    def predict(self, X):
        motor_preds = self.motor_model.predict(X)
        total_preds = self.total_model.predict(X)
        return np.column_stack((motor_preds, total_preds))
        
    def save(self, path):
        with open(path, 'wb') as f:
            pickle.dump((self.motor_model, self.total_model), f)
            
    def load(self, path):
        with open(path, 'rb') as f:
            self.motor_model, self.total_model = pickle.load(f)
