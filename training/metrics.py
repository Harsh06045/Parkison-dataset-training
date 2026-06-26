import numpy as np
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, mean_squared_error, r2_score

def compute_classification_metrics(targets, predictions):
    """
    Computes classification metrics: accuracy, precision, recall, f1
    """
    targets = np.array(targets)
    predictions = np.array(predictions)
    
    acc = accuracy_score(targets, predictions)
    prec = precision_score(targets, predictions, zero_division=0)
    rec = recall_score(targets, predictions, zero_division=0)
    f1 = f1_score(targets, predictions, zero_division=0)
    
    return {
        "Accuracy": acc,
        "Precision": prec,
        "Recall": rec,
        "F1 Score": f1
    }

def compute_regression_metrics(targets, predictions):
    """
    Computes regression metrics: MSE, R2-score
    """
    targets = np.array(targets)
    predictions = np.array(predictions)
    
    mse = mean_squared_error(targets, predictions)
    r2 = r2_score(targets, predictions)
    
    return {
        "MSE": mse,
        "R2 Score": r2
    }
