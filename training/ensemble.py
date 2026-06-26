import numpy as np
import torch
import torch.nn as nn

class PyTorchClassifierEnsemble(nn.Module):
    """
    Ensembles multiple trained PyTorch classifiers using weighted soft voting.
    """
    def __init__(self, models_list, weights=None):
        super(PyTorchClassifierEnsemble, self).__init__()
        self.models = nn.ModuleList(models_list)
        if weights is None:
            weights = [1.0 / len(models_list)] * len(models_list)
        # Normalize weights
        total_w = sum(weights)
        self.weights = [w / total_w for w in weights]

    def forward(self, x):
        # Soft voting (average of probabilities)
        probs = None
        for idx, model in enumerate(self.models):
            logits = model(x)
            p = torch.softmax(logits, dim=1)
            if probs is None:
                probs = p * self.weights[idx]
            else:
                probs += p * self.weights[idx]
        return probs

    def extract_features(self, x):
        # For multimodal fusion, we can average the embeddings of the models
        embeds = None
        for idx, model in enumerate(self.models):
            if hasattr(model, "extract_features"):
                emb = model.extract_features(x)
            else:
                emb = model(x) # Fallback
            if embeds is None:
                embeds = emb * self.weights[idx]
            else:
                embeds += emb * self.weights[idx]
        return embeds


class SklearnClassifierEnsemble:
    """
    Ensembles multiple scikit-learn or gradient boosting classifiers (XGBoost, LightGBM, CatBoost, SVM, RF).
    """
    def __init__(self, models_list, weights=None):
        self.models = models_list
        if weights is None:
            weights = [1.0 / len(models_list)] * len(models_list)
        total_w = sum(weights)
        self.weights = [w / total_w for w in weights]

    def predict_proba(self, X):
        probs = None
        for idx, model in enumerate(self.models):
            p = model.predict_proba(X)
            if probs is None:
                probs = p * self.weights[idx]
            else:
                probs += p * self.weights[idx]
        return probs

    def predict(self, X):
        probs = self.predict_proba(X)
        return np.argmax(probs, axis=1)


class SklearnRegressorEnsemble:
    """
    Ensembles multiple regressors.
    """
    def __init__(self, models_list, weights=None):
        self.models = models_list
        if weights is None:
            weights = [1.0 / len(models_list)] * len(models_list)
        total_w = sum(weights)
        self.weights = [w / total_w for w in weights]

    def predict(self, X):
        preds = None
        for idx, model in enumerate(self.models):
            p = model.predict(X)
            if preds is None:
                preds = p * self.weights[idx]
            else:
                preds += p * self.weights[idx]
        return preds
