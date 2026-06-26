import os
import torch

def save_checkpoint(model, optimizer, scheduler, epoch, best_metric, filepath, model_name=None, hyperparameters=None):
    """
    Saves a comprehensive training checkpoint.
    """
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    state = {
        "epoch": epoch,
        "best_metric": best_metric,
        "model_state_dict": model.state_dict(),
        "optimizer_state_dict": optimizer.state_dict(),
        "scheduler_state_dict": scheduler.state_dict() if scheduler else None,
        "model_name": model_name,
        "hyperparameters": hyperparameters
    }
    torch.save(state, filepath)

def load_checkpoint(model, optimizer=None, scheduler=None, filepath=None, device="cpu"):
    """
    Loads a checkpoint and restores states if elements are provided.
    """
    if not filepath or not os.path.exists(filepath):
        return None
        
    try:
        checkpoint = torch.load(filepath, map_location=device)
        model.load_state_dict(checkpoint["model_state_dict"])
        if optimizer and checkpoint.get("optimizer_state_dict"):
            optimizer.load_state_dict(checkpoint["optimizer_state_dict"])
        if scheduler and checkpoint.get("scheduler_state_dict") and checkpoint["scheduler_state_dict"]:
            scheduler.load_state_dict(checkpoint["scheduler_state_dict"])
        return checkpoint
    except Exception as e:
        print(f"Error loading checkpoint from {filepath}: {e}")
        return None
