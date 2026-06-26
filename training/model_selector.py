import os
import shutil
import pandas as pd
from training.logger import setup_logger
from training.config import REPORT_DIR, CHECKPOINT_DIR

class ModelSelector:
    """
    Evaluates multiple trained models in a modality and picks the best one.
    """
    def __init__(self, modality_name, metric_name="Accuracy", metric_mode="max"):
        self.modality_name = modality_name
        self.metric_name = metric_name
        self.metric_mode = metric_mode
        self.logger = setup_logger(f"model_selector_{modality_name}")
        self.models_performance = []

    def register_model(self, model_name, val_metric, test_metric=None, checkpoint_path=None):
        """
        Registers a model's performance details.
        """
        self.models_performance.append({
            "Model Name": model_name,
            f"Val {self.metric_name}": val_metric,
            f"Test {self.metric_name}": test_metric if test_metric is not None else "N/A",
            "Checkpoint Path": checkpoint_path
        })

    def select_best_model(self):
        """
        Selects the best model, copies its checkpoint to a standard location, and prints a comparison table.
        """
        if not self.models_performance:
            self.logger.error("No models registered for selection!")
            return None
            
        df = pd.DataFrame(self.models_performance)
        
        # Sort based on metric mode
        if self.metric_mode == "max":
            df_sorted = df.sort_values(by=f"Val {self.metric_name}", ascending=False)
        else:
            df_sorted = df.sort_values(by=f"Val {self.metric_name}", ascending=True)
            
        best_model_info = df_sorted.iloc[0]
        self.logger.info(f"\n=================== {self.modality_name.upper()} MODEL COMPARISON ===================")
        print(df_sorted.to_string(index=False))
        self.logger.info(f"================================================================")
        self.logger.info(f"Best Model Selected: {best_model_info['Model Name']} with Val {self.metric_name}: {best_model_info[f'Val {self.metric_name}']:.4f}")
        
        # Save comparison report
        report_path = os.path.join(REPORT_DIR, f"{self.modality_name}_selection_report.csv")
        df_sorted.to_csv(report_path, index=False)
        
        # Copy best model to standard location
        src_ckpt = best_model_info["Checkpoint Path"]
        if src_ckpt and os.path.exists(src_ckpt):
            dest_ckpt = os.path.join(CHECKPOINT_DIR, f"{self.modality_name}_best_model.pth" if src_ckpt.endswith(".pth") else f"{self.modality_name}_best_model.pkl")
            shutil.copy2(src_ckpt, dest_ckpt)
            self.logger.info(f"Copied best model checkpoint from {src_ckpt} to {dest_ckpt}")
            return dest_ckpt
        else:
            self.logger.warning(f"Checkpoint for best model not found or not specified at: {src_ckpt}")
            return None
