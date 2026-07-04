import numpy as np
import os
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    mean_squared_error, r2_score, roc_auc_score, confusion_matrix
)

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

def compute_classification_metrics_with_probs(targets, predictions, probabilities):
    """
    Computes classification metrics including ROC-AUC using soft probabilities.
    
    Args:
        targets: Ground truth labels (0 or 1)
        predictions: Hard predictions (0 or 1)
        probabilities: Soft probabilities for the positive class (Parkinson)
    
    Returns:
        Dictionary with Accuracy, Precision, Recall, F1 Score, and ROC-AUC
    """
    targets = np.array(targets)
    predictions = np.array(predictions)
    probabilities = np.array(probabilities)
    
    metrics = compute_classification_metrics(targets, predictions)
    
    # ROC-AUC requires at least 2 classes present in targets
    try:
        if len(np.unique(targets)) >= 2:
            auc = roc_auc_score(targets, probabilities)
        else:
            auc = float('nan')
    except ValueError:
        auc = float('nan')
    
    metrics["ROC-AUC"] = auc
    return metrics

def save_confusion_matrix(targets, predictions, save_path, class_names=None, title="Confusion Matrix"):
    """
    Generates and saves a confusion matrix plot using pure matplotlib.
    
    Args:
        targets: Ground truth labels
        predictions: Predicted labels
        save_path: Path to save the plot image
        class_names: List of class names (e.g., ["Normal", "Parkinson"])
        title: Title for the plot
    """
    import matplotlib
    matplotlib.use('Agg')  # Non-interactive backend
    import matplotlib.pyplot as plt
    
    if class_names is None:
        class_names = ["Normal", "Parkinson"]
    
    targets = np.array(targets)
    predictions = np.array(predictions)
    
    cm = confusion_matrix(targets, predictions)
    
    fig, ax = plt.subplots(figsize=(6, 5))
    im = ax.imshow(cm, interpolation='nearest', cmap=plt.cm.Blues)
    fig.colorbar(im, ax=ax, shrink=0.8)
    
    # Show all ticks and label them with class names
    ax.set_xticks(np.arange(len(class_names)))
    ax.set_yticks(np.arange(len(class_names)))
    ax.set_xticklabels(class_names, fontsize=10)
    ax.set_yticklabels(class_names, fontsize=10)
    
    # Rotate tick labels if needed
    plt.setp(ax.get_xticklabels(), rotation=0, ha="center")
    
    # Loop over data dimensions and create text annotations.
    thresh = cm.max() / 2.0
    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            ax.text(
                j, i, format(cm[i, j], 'd'),
                ha="center", va="center",
                color="white" if cm[i, j] > thresh else "black",
                fontsize=14, fontweight='bold'
            )
            
    ax.set_xlabel("Predicted Label", fontsize=12, fontweight='bold', labelpad=10)
    ax.set_ylabel("True Label", fontsize=12, fontweight='bold', labelpad=10)
    ax.set_title(title, fontsize=14, fontweight='bold', pad=15)
    
    # Style the spines
    for spine in ax.spines.values():
        spine.set_edgecolor('gray')
        spine.set_linewidth(0.5)
        
    plt.tight_layout()
    os.makedirs(os.path.dirname(save_path), exist_ok=True)
    fig.savefig(save_path, dpi=150, bbox_inches='tight')
    plt.close(fig)
    
    return cm
    
    return cm

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
