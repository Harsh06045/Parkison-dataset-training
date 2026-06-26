import os
import sys
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split

# Add project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from preprocessing.utils import setup_logger, check_missing_values

logger = setup_logger("voice_preprocessing", log_file="outputs/logs/voice_preprocessing.log")

def preprocess_voice(src_path, dest_base, train_ratio=0.7, val_ratio=0.15, test_ratio=0.15):
    logger.info(f"Loading voice dataset from {src_path}...")
    if not os.path.exists(src_path):
        logger.error(f"Source file not found at {src_path}")
        return False
        
    df = pd.read_csv(src_path)
    logger.info(f"Loaded dataset with shape: {df.shape}")
    
    # 1. Drop identifier column 'name'
    if 'name' in df.columns:
        df = df.drop(columns=['name'])
        logger.info("Removed identifier column: 'name'")
        
    # 2. Check for missing values
    check_missing_values(df, "Oxford Voice Dataset")
    
    # 3. Handle duplicates
    initial_len = len(df)
    df = df.drop_duplicates()
    if len(df) < initial_len:
        logger.info(f"Removed {initial_len - len(df)} duplicate rows.")
        
    if 'status' not in df.columns:
        logger.error("Target column 'status' not found in dataset!")
        return False
        
    # 4. Standardize features (except status)
    feature_cols = [c for c in df.columns if c != 'status']
    logger.info(f"Standardizing {len(feature_cols)} features...")
    
    scaler = StandardScaler()
    df[feature_cols] = scaler.fit_transform(df[feature_cols])
    
    # Save the fully processed (cleaned and scaled) dataset before splitting
    processed_dir = os.path.join(dest_base, "processed", "voice")
    os.makedirs(processed_dir, exist_ok=True)
    processed_file = os.path.join(processed_dir, "oxford_processed.csv")
    df.to_csv(processed_file, index=False)
    logger.info(f"Saved fully processed dataset with shape {df.shape} to {processed_file}")
    
    # 5. Split dataset (stratified by target 'status')
    logger.info("Splitting dataset into train, validation, and test sets...")
    
    # First split into train and temp (val + test)
    train_df, temp_df = train_test_split(
        df, 
        test_size=(val_ratio + test_ratio), 
        random_state=42, 
        stratify=df['status']
    )
    
    # Then split temp into val and test
    relative_val_ratio = val_ratio / (val_ratio + test_ratio)
    val_df, test_df = train_test_split(
        temp_df, 
        test_size=(1.0 - relative_val_ratio), 
        random_state=42, 
        stratify=temp_df['status']
    )
    
    splits = {
        "train": train_df,
        "validation": val_df,
        "test": test_df
    }
    
    for split_name, split_df in splits.items():
        dest_dir = os.path.join(dest_base, split_name, "voice")
        os.makedirs(dest_dir, exist_ok=True)
        dest_file = os.path.join(dest_dir, f"oxford_{split_name}.csv")
        split_df.to_csv(dest_file, index=False)
        logger.info(f"Saved {split_name} split with shape {split_df.shape} to {dest_file}")
        
    logger.info("Voice dataset preprocessing and splitting completed successfully!")
    return True

def main():
    src_path = "datasets/voice/oxford/parkinsons.data"
    dest_base = "datasets"
    preprocess_voice(src_path, dest_base)

import torch
from torch.utils.data import Dataset, DataLoader
import numpy as np

class OxfordVoiceDataset(Dataset):
    """
    Custom PyTorch Dataset for Oxford Voice classification.
    """
    def __init__(self, csv_path):
        if not os.path.exists(csv_path):
            raise FileNotFoundError(f"Voice split CSV not found: {csv_path}")
        self.df = pd.read_csv(csv_path)
        
        # Binary target status (0 = healthy, 1 = Parkinson's)
        self.labels = self.df['status'].values.astype(np.int64)
        
        # Remaining voice features
        feature_cols = [c for c in self.df.columns if c != 'status']
        self.features = self.df[feature_cols].values.astype(np.float32)

    def __len__(self):
        return len(self.labels)

    def __getitem__(self, idx):
        return torch.tensor(self.features[idx]), torch.tensor(self.labels[idx])

def get_voice_dataloader(split, batch_size=32, shuffle=True):
    """
    Creates and returns a DataLoader for the Oxford voice classification split.
    """
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    csv_path = os.path.join(project_root, "datasets", split, "voice", f"oxford_{split}.csv")
    dataset = OxfordVoiceDataset(csv_path)
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
