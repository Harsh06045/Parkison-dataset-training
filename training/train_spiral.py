import os
import sys
import torch
import torch.nn as nn
import torch.optim as optim
import time

# Resolve project root
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)

from training.config import HYPERPARAMETER_GRIDS, CHECKPOINT_DIR
from training.logger import setup_logger
from training.model_selector import ModelSelector
from training.trainer import PyTorchTrainer
from training.metrics import compute_classification_metrics
from preprocessing.image_preprocessing import get_image_dataloader

# Import models
from training.models.spiral.resnet18 import ResNet18DrawingClassifier
from training.models.spiral.resnet50 import ResNet50DrawingClassifier
from training.models.spiral.efficientnet_b0 import EfficientNetB0DrawingClassifier
from training.models.spiral.efficientnet_b3 import EfficientNetB3DrawingClassifier
from training.models.spiral.densenet121 import DenseNet121DrawingClassifier
from training.models.spiral.convnext import ConvNeXtDrawingClassifier
from training.models.spiral.vit import ViTDrawingClassifier

logger = setup_logger("train_spiral", log_file=os.path.join(PROJECT_ROOT, "outputs", "logs", "train_spiral.log"))

# Limit dataloader for fast CPU execution
class LimitDataloader:
    def __init__(self, dataloader, limit):
        self.dataloader = dataloader
        self.limit = limit
        self.dataset = dataloader.dataset

    def __iter__(self):
        for idx, batch in enumerate(self.dataloader):
            if idx >= self.limit:
                break
            yield batch

    def __len__(self):
        return min(len(self.dataloader), self.limit)


def train_spiral_module(fast_cpu_mode=True):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"Training Spiral Module on device: {device}")
    
    # 1. Load Data
    train_loader = get_image_dataloader("train", batch_size=16, shuffle=True, augment=True)
    val_loader = get_image_dataloader("validation", batch_size=16, shuffle=False)
    test_loader = get_image_dataloader("test", batch_size=16, shuffle=False)
    
    # Fast CPU Mode limits
    if device.type == "cpu" and fast_cpu_mode:
        logger.info("CPU detected: Enabling Fast CPU Mode (1 epoch, limit 2 batches per epoch to run in under 30s)")
        train_loader = LimitDataloader(train_loader, limit=2)
        val_loader = LimitDataloader(val_loader, limit=2)
        test_loader = LimitDataloader(test_loader, limit=2)
        epochs = 1
        patience = 1
    else:
        epochs = HYPERPARAMETER_GRIDS["spiral"]["epochs"]
        patience = HYPERPARAMETER_GRIDS["spiral"]["patience"]

    # Models list to evaluate
    models_dict = {
        "EfficientNet-B3": EfficientNetB3DrawingClassifier,
        "DenseNet121": DenseNet121DrawingClassifier,
        "ResNet50": ResNet50DrawingClassifier
    }
    
    selector = ModelSelector(modality_name="spiral", metric_name="Accuracy", metric_mode="max")
    
    # Train each model
    for model_name, model_class in models_dict.items():
        logger.info(f"\n--- Training {model_name} ---")
        try:
            pretrained = False if (device.type == "cpu" and fast_cpu_mode) else True
            model = model_class(num_classes=2, pretrained=pretrained).to(device)
            
            criterion = nn.CrossEntropyLoss()
            # Only train head parameters to speed up
            optimizer = optim.Adam(model.head.parameters(), lr=0.001)
            scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode="max", factor=0.5, patience=2)
            
            trainer = PyTorchTrainer(
                model=model,
                criterion=criterion,
                optimizer=optimizer,
                scheduler=scheduler,
                device=device,
                model_name=f"spiral_{model_name.lower().replace('-', '_')}",
                metric_name="Accuracy",
                metric_mode="max",
                early_stopping_patience=patience,
                hyperparameters={"lr": 0.001, "optimizer": "Adam"}
            )
            
            # Fit model
            best_val_acc = trainer.fit(train_loader, val_loader, total_epochs=epochs)
            
            # Evaluate on Test Set
            model.eval()
            test_preds = []
            test_targets = []
            with torch.no_grad():
                for imgs, labels in test_loader:
                    imgs, labels = imgs.to(device), labels.to(device)
                    outputs = model(imgs)
                    _, preds = outputs.max(1)
                    test_preds.extend(preds.cpu().numpy())
                    test_targets.extend(labels.cpu().numpy())
            
            test_metrics = compute_classification_metrics(test_targets, test_preds)
            test_acc = test_metrics["Accuracy"]
            logger.info(f"{model_name} Test Accuracy: {test_acc*100:.2f}%")
            
            # Register in selector
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
    train_spiral_module(fast_cpu_mode=True)
