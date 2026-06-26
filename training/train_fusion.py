import os
import sys
import torch
import torch.nn as nn
import torch.optim as optim

# Resolve project root
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)

from training.config import HYPERPARAMETER_GRIDS, CHECKPOINT_DIR
from training.logger import setup_logger
from training.model_selector import ModelSelector
from training.trainer import PyTorchTrainer
from training.metrics import compute_classification_metrics
from preprocessing.fusion_preprocessing import get_fusion_dataloader

# Import Fusion Models
from training.models.fusion.multimodal_net import MultimodalClassifier
from training.models.fusion.concat_fusion import ConcatFusionClassifier
from training.models.fusion.attention_fusion import AttentionFusionClassifier

logger = setup_logger("train_fusion", log_file=os.path.join(PROJECT_ROOT, "outputs", "logs", "train_fusion.log"))

def train_fusion_module(fast_cpu_mode=True):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"Training Fusion Module on device: {device}")
    
    # 1. Load Data
    train_loader = get_fusion_dataloader("train", batch_size=16)
    val_loader = get_fusion_dataloader("validation", batch_size=16)
    test_loader = get_fusion_dataloader("test", batch_size=16)
    
    if device.type == "cpu" and fast_cpu_mode:
        epochs = 1
        patience = 1
    else:
        epochs = HYPERPARAMETER_GRIDS["fusion"]["epochs"]
        patience = HYPERPARAMETER_GRIDS["fusion"]["patience"]

    selector = ModelSelector(modality_name="fusion", metric_name="Accuracy", metric_mode="max")
    
    # 2. Models to evaluate
    models_dict = {
        "MultimodalProjection": lambda: MultimodalClassifier(image_dim=256, mri_dim=256, voice_dim=22, clinical_dim=19, fusion_dim=32, num_classes=2),
        "ConcatFusion": lambda: ConcatFusionClassifier(image_dim=256, mri_dim=256, voice_dim=22, clinical_dim=19, num_classes=2, hidden_dim=64),
        "AttentionFusion": lambda: AttentionFusionClassifier(image_dim=256, mri_dim=256, voice_dim=22, clinical_dim=19, fusion_dim=32, num_heads=2, num_classes=2)
    }
    
    # Train each model
    for model_name, model_fn in models_dict.items():
        logger.info(f"\n--- Training {model_name} ---")
        try:
            model = model_fn().to(device)
            criterion = nn.CrossEntropyLoss()
            optimizer = optim.Adam(model.parameters(), lr=0.005)
            scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode="max", factor=0.5, patience=5)
            
            trainer = PyTorchTrainer(
                model=model,
                criterion=criterion,
                optimizer=optimizer,
                scheduler=scheduler,
                device=device,
                model_name=f"fusion_{model_name.lower()}",
                metric_name="Accuracy",
                metric_mode="max",
                early_stopping_patience=patience,
                hyperparameters={"lr": 0.005}
            )
            
            best_val_acc = trainer.fit(train_loader, val_loader, total_epochs=epochs)
            
            # Evaluate on Test Set
            model.eval()
            test_preds = []
            test_targets = []
            with torch.no_grad():
                for img_emb, mri_emb, voice, clinical, labels in test_loader:
                    img_emb = img_emb.to(device)
                    mri_emb = mri_emb.to(device)
                    voice = voice.to(device)
                    clinical = clinical.to(device)
                    labels = labels.to(device)
                    
                    outputs = model(img_emb, mri_emb, voice, clinical)
                    _, preds = outputs.max(1)
                    test_preds.extend(preds.cpu().numpy())
                    test_targets.extend(labels.cpu().numpy())
            
            test_metrics = compute_classification_metrics(test_targets, test_preds)
            test_acc = test_metrics["Accuracy"]
            logger.info(f"{model_name} Test Accuracy: {test_acc*100:.2f}%")
            
            checkpoint_path = os.path.join(trainer.checkpoint_dir, "best.pth")
            selector.register_model(
                model_name=model_name,
                val_metric=best_val_acc,
                test_metric=test_acc,
                checkpoint_path=checkpoint_path
            )
        except Exception as e:
            logger.error(f"Error training {model_name}: {e}")
            
    # Automatically select the best model
    best_model_path = selector.select_best_model()
    return best_model_path

if __name__ == "__main__":
    train_fusion_module(fast_cpu_mode=True)
