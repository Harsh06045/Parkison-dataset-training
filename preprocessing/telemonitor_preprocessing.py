import os
import sys
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split

# Add project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from preprocessing.utils import setup_logger, check_missing_values

logger = setup_logger("telemonitor_preprocessing", log_file="outputs/logs/telemonitor_preprocessing.log")

def preprocess_telemonitor(src_path, dest_base, train_ratio=0.7, val_ratio=0.15, test_ratio=0.15):
    logger.info(f"Loading telemonitoring dataset from {src_path}...")
    if not os.path.exists(src_path):
        logger.error(f"Source file not found at {src_path}")
        return False
        
    df = pd.read_csv(src_path)
    logger.info(f"Loaded dataset with shape: {df.shape}")
    
    # 1. Drop unnecessary identifier columns (like subject#)
    if 'subject#' in df.columns:
        df = df.drop(columns=['subject#'])
        logger.info("Removed identifier column: 'subject#'")
        
    # 2. Check for missing values
    check_missing_values(df, "Telemonitoring Dataset")
    
    # 3. Handle duplicates
    initial_len = len(df)
    df = df.drop_duplicates()
    if len(df) < initial_len:
        logger.info(f"Removed {initial_len - len(df)} duplicate rows.")
        
    # Verify targets exist
    targets = ['motor_UPDRS', 'total_UPDRS']
    for t in targets:
        if t not in df.columns:
            logger.error(f"Target column '{t}' not found in dataset!")
            return False
            
    # 4. Standardize features (all columns except motor_UPDRS and total_UPDRS)
    feature_cols = [c for c in df.columns if c not in targets]
    logger.info(f"Standardizing {len(feature_cols)} features...")
    
    scaler = StandardScaler()
    df[feature_cols] = scaler.fit_transform(df[feature_cols])
    
    # Save the fully processed (cleaned and scaled) dataset before splitting
    processed_dir = os.path.join(dest_base, "processed", "telemonitoring")
    os.makedirs(processed_dir, exist_ok=True)
    processed_file = os.path.join(processed_dir, "telemonitor_processed.csv")
    df.to_csv(processed_file, index=False)
    logger.info(f"Saved fully processed dataset with shape {df.shape} to {processed_file}")
    
    # 5. Split dataset
    logger.info("Splitting dataset into train, validation, and test sets...")
    train_df, temp_df = train_test_split(df, test_size=(val_ratio + test_ratio), random_state=42)
    
    relative_val_ratio = val_ratio / (val_ratio + test_ratio)
    val_df, test_df = train_test_split(temp_df, test_size=(1.0 - relative_val_ratio), random_state=42)
    
    splits = {
        "train": train_df,
        "validation": val_df,
        "test": test_df
    }
    
    for split_name, split_df in splits.items():
        dest_dir = os.path.join(dest_base, split_name, "telemonitoring")
        os.makedirs(dest_dir, exist_ok=True)
        dest_file = os.path.join(dest_dir, f"telemonitor_{split_name}.csv")
        split_df.to_csv(dest_file, index=False)
        logger.info(f"Saved {split_name} split with shape {split_df.shape} to {dest_file}")
        
    logger.info("Telemonitoring dataset preprocessing and splitting completed successfully!")
    return True

def main():
    src_path = "datasets/voice/telemonitoring/parkinsons_updrs.data"
    dest_base = "datasets"
    preprocess_telemonitor(src_path, dest_base)

import torch
from torch.utils.data import Dataset, DataLoader
import numpy as np

class TelemonitorDataset(Dataset):
    """
    Custom PyTorch Dataset for Parkinson's UPDRS Telemonitoring.
    """
    def __init__(self, csv_path):
        if not os.path.exists(csv_path):
            raise FileNotFoundError(f"Telemonitoring split CSV not found: {csv_path}")
        self.df = pd.read_csv(csv_path)
        
        # Regression targets (motor and total UPDRS)
        self.targets = self.df[['motor_UPDRS', 'total_UPDRS']].values.astype(np.float32)
        
        # Input features
        feature_cols = [c for c in self.df.columns if c not in ['motor_UPDRS', 'total_UPDRS']]
        self.features = self.df[feature_cols].values.astype(np.float32)

    def __len__(self):
        return len(self.features)

    def __getitem__(self, idx):
        return torch.tensor(self.features[idx]), torch.tensor(self.targets[idx])

def get_telemonitor_dataloader(split, batch_size=32, shuffle=True):
    """
    Creates and returns a DataLoader for the telemonitoring regression split.
    """
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    csv_path = os.path.join(project_root, "datasets", split, "telemonitoring", f"telemonitor_{split}.csv")
    dataset = TelemonitorDataset(csv_path)
    loader = DataLoader(
        dataset, 
        batch_size=batch_size, 
        shuffle=shuffle, 
        num_workers=0, 
        pin_memory=True
    )
    return loader

if __name__ == "__main__":
    main()
