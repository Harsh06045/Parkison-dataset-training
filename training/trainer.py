import os
import sys
import time
import torch

try:
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    if hasattr(sys.stderr, 'reconfigure'):
        sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass
import pandas as pd
from datetime import datetime
from training.checkpoint import save_checkpoint
from training.early_stopping import EarlyStopping
from training.metrics import compute_classification_metrics, compute_regression_metrics
from training.logger import setup_logger

class PyTorchTrainer:
    """
    Standardized, robust trainer for all PyTorch models.
    """
    def __init__(
        self,
        model,
        criterion,
        optimizer,
        scheduler,
        device,
        model_name,
        metric_name="Accuracy",
        metric_mode="max",
        early_stopping_patience=10,
        is_regression=False,
        checkpoint_dir=None,
        history_csv=None,
        metrics_csv=None,
        hyperparameters=None
    ):
        self.model = model
        self.criterion = criterion
        self.optimizer = optimizer
        self.scheduler = scheduler
        self.device = device
        self.model_name = model_name
        self.metric_name = metric_name
        self.metric_mode = metric_mode
        self.is_regression = is_regression
        self.hyperparameters = hyperparameters
        
        # Resolve paths
        from training.config import CHECKPOINT_DIR, LOG_DIR, REPORT_DIR
        self.checkpoint_dir = checkpoint_dir or os.path.join(CHECKPOINT_DIR, model_name)
        os.makedirs(self.checkpoint_dir, exist_ok=True)
        
        self.history_csv = history_csv or os.path.join(LOG_DIR, f"{model_name}_history.csv")
        self.metrics_csv = metrics_csv or os.path.join(REPORT_DIR, f"{model_name}_metrics.csv")
        
        # Logger
        self.logger = setup_logger(f"trainer_{model_name}", log_file=os.path.join(LOG_DIR, f"{model_name}_training.log"))
        
        # State variables
        self.start_epoch = 1
        self.best_metric = -float('inf') if metric_mode == "max" else float('inf')
        self.history = []
        
        self.early_stopper = EarlyStopping(patience=early_stopping_patience, mode=metric_mode)

    def resume_from_checkpoint(self):
        """Attempt to resume training from a latest.pth checkpoint if one exists."""
        from training.checkpoint import load_checkpoint
        latest_path = os.path.join(self.checkpoint_dir, "latest.pth")
        if os.path.exists(latest_path):
            checkpoint = load_checkpoint(
                self.model, self.optimizer, self.scheduler,
                filepath=latest_path, device=str(self.device)
            )
            if checkpoint:
                self.start_epoch = checkpoint.get("epoch", 0) + 1
                self.best_metric = checkpoint.get("best_metric", self.best_metric)
                self.logger.info(
                    f"Resumed from checkpoint at epoch {checkpoint.get('epoch', '?')} "
                    f"(best {self.metric_name}: {self.best_metric:.4f})"
                )
                print(f"\n→ Resumed from checkpoint: epoch {checkpoint.get('epoch', '?')}, "
                      f"best {self.metric_name}: {self.best_metric:.4f}")
                # Restore history CSV if it exists
                if os.path.exists(self.history_csv):
                    try:
                        df = pd.read_csv(self.history_csv)
                        self.history = df.to_dict('records')
                    except Exception:
                        pass
                return True
        return False

    def train_epoch(self, dataloader, epoch=1, total_epochs=100):
        self.model.train()
        epoch_loss = 0.0
        all_targets = []
        all_predictions = []
        
        import sys
        from tqdm import tqdm
        pbar = tqdm(
            dataloader, 
            desc="Train", 
            leave=True, 
            file=sys.stdout,
            bar_format="{desc}: {percentage:3.0f}%|{bar}| {n_fmt}/{total_fmt} [{elapsed}<{remaining}, {rate_fmt}]"
        )
        total_samples = 0
        for batch in pbar:
            # Dataloader can return tuple of (inputs, targets) or multiple elements
            if len(batch) == 2:
                inputs, targets = batch
                inputs, targets = inputs.to(self.device), targets.to(self.device)
                self.optimizer.zero_grad()
                outputs = self.model(inputs)
            elif len(batch) == 5: # Multimodal Fusion: img_emb, mri_emb, voice, clinical, label
                img_emb, mri_emb, voice, clinical, targets = batch
                img_emb = img_emb.to(self.device)
                mri_emb = mri_emb.to(self.device)
                voice = voice.to(self.device)
                clinical = clinical.to(self.device)
                targets = targets.to(self.device)
                
                self.optimizer.zero_grad()
                outputs = self.model(img_emb, mri_emb, voice, clinical)
            else:
                raise ValueError(f"Unsupported batch size of length {len(batch)} in dataloader")
                
            loss = self.criterion(outputs, targets)
            loss.backward()
            self.optimizer.step()
            
            epoch_loss += loss.item() * targets.size(0)
            total_samples += targets.size(0)
            
            if self.is_regression:
                all_predictions.extend(outputs.detach().cpu().numpy())
                all_targets.extend(targets.detach().cpu().numpy())
            else:
                _, preds = outputs.max(1)
                all_predictions.extend(preds.cpu().numpy())
                all_targets.extend(targets.cpu().numpy())
                
        avg_loss = epoch_loss / total_samples if total_samples > 0 else 0.0
        
        if self.is_regression:
            metrics = compute_regression_metrics(all_targets, all_predictions)
        else:
            metrics = compute_classification_metrics(all_targets, all_predictions)
            
        return avg_loss, metrics

    def validate_epoch(self, dataloader):
        self.model.eval()
        epoch_loss = 0.0
        all_targets = []
        all_predictions = []
        
        with torch.no_grad():
            for batch in dataloader:
                if len(batch) == 2:
                    inputs, targets = batch
                    inputs, targets = inputs.to(self.device), targets.to(self.device)
                    outputs = self.model(inputs)
                elif len(batch) == 5:
                    img_emb, mri_emb, voice, clinical, targets = batch
                    img_emb = img_emb.to(self.device)
                    mri_emb = mri_emb.to(self.device)
                    voice = voice.to(self.device)
                    clinical = clinical.to(self.device)
                    targets = targets.to(self.device)
                    outputs = self.model(img_emb, mri_emb, voice, clinical)
                else:
                    raise ValueError(f"Unsupported batch size of length {len(batch)} in dataloader")
                    
                loss = self.criterion(outputs, targets)
                epoch_loss += loss.item() * targets.size(0)
                
                if self.is_regression:
                    all_predictions.extend(outputs.cpu().numpy())
                    all_targets.extend(targets.cpu().numpy())
                else:
                    _, preds = outputs.max(1)
                    all_predictions.extend(preds.cpu().numpy())
                    all_targets.extend(targets.cpu().numpy())
                    
        total_samples = len(dataloader.dataset)
        avg_loss = epoch_loss / total_samples if total_samples > 0 else 0.0
        
        if self.is_regression:
            metrics = compute_regression_metrics(all_targets, all_predictions)
        else:
            metrics = compute_classification_metrics(all_targets, all_predictions)
            
        return avg_loss, metrics

    def fit(self, train_loader, val_loader, total_epochs):
        # Auto-resume from latest checkpoint if available
        resumed = self.resume_from_checkpoint()
        if resumed and self.start_epoch > total_epochs:
            self.logger.info(f"Already completed {total_epochs} epochs. Skipping training.")
            return self.best_metric
        
        self.logger.info(f"Starting training for model {self.model_name} (Max Epochs: {total_epochs})")
        
        # Determine dataset name
        dataset_name = "Unknown"
        lower_name = self.model_name.lower()
        if "mri" in lower_name:
            dataset_name = "MRI"
        elif "spiral" in lower_name:
            dataset_name = "Spiral Drawings"
        elif "voice" in lower_name:
            dataset_name = "Voice"
        elif "telemonitor" in lower_name:
            dataset_name = "Telemonitoring"
        elif "fusion" in lower_name:
            dataset_name = "Multimodal Fusion"
            
        device_name = "CPU"
        if self.device.type == "cuda":
            device_name = torch.cuda.get_device_name(0)
            
        # Format the start logging block
        print("\n" + "=" * 58)
        print("NeuroFusionAI - Parkinson Modality Training")
        print("=" * 58)
        print(f"Model           : {self.model_name}")
        print(f"Device          : {device_name}")
        print(f"Dataset         : {dataset_name}")
        print(f"Epochs          : {total_epochs}")
        print(f"Batch Size      : {self.hyperparameters.get('batch_size', 16) if self.hyperparameters else 16}")
        print(f"Learning Rate   : {self.optimizer.param_groups[0]['lr']:.6f}")
        print("=" * 58 + "\n")
        
        for epoch in range(self.start_epoch, total_epochs + 1):
            epoch_start_time = time.time()
            
            print(f"==========================================================")
            print(f"Epoch {epoch}/{total_epochs}")
            print(f"==========================================================")
            
            train_loss, train_metrics = self.train_epoch(train_loader, epoch, total_epochs)
            val_loss, val_metrics = self.validate_epoch(val_loader)
            
            current_metric = val_metrics[self.metric_name]
            
            # Scheduler step
            if self.scheduler:
                if isinstance(self.scheduler, torch.optim.lr_scheduler.ReduceLROnPlateau):
                    self.scheduler.step(current_metric if self.metric_mode == "max" else val_loss)
                else:
                    self.scheduler.step()
                    
            # Check for best model
            is_best = False
            if self.metric_mode == "max":
                if current_metric > self.best_metric:
                    self.best_metric = current_metric
                    is_best = True
            else:
                if current_metric < self.best_metric:
                    self.best_metric = current_metric
                    is_best = True
                    
            # Save Checkpoints
            latest_path = os.path.join(self.checkpoint_dir, "latest.pth")
            save_checkpoint(self.model, self.optimizer, self.scheduler, epoch, self.best_metric, latest_path, self.model_name, self.hyperparameters)
            
            if is_best:
                best_path = os.path.join(self.checkpoint_dir, "best.pth")
                save_checkpoint(self.model, self.optimizer, self.scheduler, epoch, self.best_metric, best_path, self.model_name, self.hyperparameters)
                self.logger.info(f"New best model saved for {self.model_name} at epoch {epoch} with {self.metric_name}: {current_metric:.4f}")
                
            # Log results to logger
            status_str = "NEW BEST" if is_best else "NO IMPROVEMENT"
            lr = self.optimizer.param_groups[0]['lr']
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            
            self.logger.info(
                f"Epoch {epoch}/{total_epochs} - Train Loss: {train_loss:.4f} | Val Loss: {val_loss:.4f} | "
                f"Val {self.metric_name}: {current_metric:.4f} (Best: {self.best_metric:.4f}) | LR: {lr:.6f} | Status: {status_str}"
            )
            
            # Print epoch summary in exact requested layout
            epoch_time = time.time() - epoch_start_time
            m, s = divmod(int(epoch_time), 60)
            h, m = divmod(m, 60)
            time_str = f"{h:02d}:{m:02d}:{s:02d}"
            
            metric_label = self.metric_name
            train_metric_val = train_metrics.get(metric_label, 0.0)
            val_metric_val = val_metrics.get(metric_label, 0.0)
            
            print(f"Train Loss      : {train_loss:.4f}")
            print(f"Validation Loss : {val_loss:.4f}\n")
            
            if self.is_regression:
                print(f"Train {metric_label}  : {train_metric_val:.4f}")
                print(f"Validation {metric_label} : {val_metric_val:.4f}\n")
            else:
                print(f"Train {metric_label}  : {train_metric_val*100:.2f}%")
                print(f"Validation {metric_label} : {val_metric_val*100:.2f}%\n")
                
            if is_best:
                print("New Best Model ✓")
                print("Checkpoint      : Saved")
            else:
                print("No Improvement")
                
            if self.is_regression:
                print(f"Best {metric_label}   : {self.best_metric:.4f}")
            else:
                print(f"Best {metric_label}   : {self.best_metric*100:.2f}%")
            print(f"Time            : {time_str}")
            print("==========================================================\n")
            
            # Save history
            epoch_data = {
                "Epoch": epoch,
                "Train Loss": train_loss,
                "Validation Loss": val_loss,
                "Learning Rate": lr,
                "Timestamp": timestamp
            }
            # Append other metrics
            for k, v in val_metrics.items():
                epoch_data[f"Val_{k}"] = v
            self.history.append(epoch_data)
            
            df = pd.DataFrame(self.history)
            df.to_csv(self.history_csv, index=False)
            
            # Save best metrics to report directory
            if is_best:
                report_data = {
                    "Epoch": epoch,
                    "Train Loss": train_loss,
                    "Validation Loss": val_loss,
                    "Learning Rate": lr,
                    "Timestamp": timestamp
                }
                for k, v in val_metrics.items():
                    report_data[k] = v
                pd.DataFrame([report_data]).to_csv(self.metrics_csv, index=False)
                
            # Early stopping check
            self.early_stopper.step(current_metric)
            if self.early_stopper.early_stop:
                self.logger.info(f"Early stopping triggered at epoch {epoch}. No improvement for {self.early_stopper.patience} epochs.")
                break
                
        return self.best_metric
