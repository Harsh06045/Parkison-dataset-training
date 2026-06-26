import os
import sys
import glob
import shutil
import random
from PIL import Image

# Add project root to sys.path to support executing this script directly
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from preprocessing.utils import setup_logger

logger = setup_logger("mri_preprocessing", log_file="outputs/logs/mri_preprocessing.log")

def split_and_preprocess_mri(src_base, dest_base="datasets/processed/mri", size=(224, 224), train_ratio=0.7, val_ratio=0.15, test_ratio=0.15):
    """
    Reads MRI images from datasets/mri/{normal, parkinson}, verifies and resizes them,
    saves the entire processed set to datasets/processed/mri/{normal, parkinson},
    and splits them into datasets/{train, validation, test}/mri/{normal, parkinson}.
    """
    logger.info("Starting MRI Preprocessing & Splitting...")
    categories = ["normal", "parkinson"]
    random.seed(42)  # For reproducibility
    
    # Create directories for processed MRI images (unsplit)
    for cat in categories:
        os.makedirs(os.path.join(dest_base, cat), exist_ok=True)
        
    # Create directories for splits
    for split in ["train", "validation", "test"]:
        for cat in categories:
            os.makedirs(os.path.join("datasets", split, "mri", cat), exist_ok=True)
            
    for category in categories:
        src_dir = os.path.join(src_base, category)
        os.makedirs(src_dir, exist_ok=True)  # Ensure source subdirs exist
        
        # Support common image formats
        image_paths = (glob.glob(os.path.join(src_dir, "*.png")) + 
                       glob.glob(os.path.join(src_dir, "*.jpg")) + 
                       glob.glob(os.path.join(src_dir, "*.jpeg")) +
                       glob.glob(os.path.join(src_dir, "*.bmp")))
        
        logger.info(f"Category '{category}': Found {len(image_paths)} MRI images in {src_dir}")
        if not image_paths:
            logger.warning(f"No MRI images found for category '{category}' in {src_dir}")
            continue
            
        # Process and verify all images first
        processed_paths = []
        for path in image_paths:
            try:
                # Try opening and verifying the image to check for corruption
                with Image.open(path) as img:
                    img.verify()  # Verify image integrity
                
                # Re-open for resizing since verify() closes the file
                img = Image.open(path).convert("RGB")
                img_resized = img.resize(size, Image.Resampling.LANCZOS)
                
                filename = os.path.basename(path)
                dest_path = os.path.join(dest_base, category, filename)
                img_resized.save(dest_path, "PNG")
                processed_paths.append(dest_path)
            except Exception as e:
                logger.error(f"MRI Image {path} is corrupted or cannot be processed: {e}")
                
        logger.info(f"Successfully processed and verified {len(processed_paths)}/{len(image_paths)} MRI images for category '{category}'")
        
        # Shuffle the processed images
        random.shuffle(processed_paths)
        
        # Calculate split indices
        n_total = len(processed_paths)
        n_train = int(n_total * train_ratio)
        n_val = int(n_total * val_ratio)
        
        splits = {
            "train": processed_paths[:n_train],
            "validation": processed_paths[n_train:n_train + n_val],
            "test": processed_paths[n_train + n_val:]
        }
        
        for split_name, paths in splits.items():
            count = 0
            dest_split_dir = os.path.join("datasets", split_name, "mri", category)
            for path in paths:
                try:
                    filename = os.path.basename(path)
                    dest_path = os.path.join(dest_split_dir, filename)
                    shutil.copy(path, dest_path)
                    count += 1
                except Exception as e:
                    logger.error(f"Failed to copy {path} to split {split_name}: {e}")
            logger.info(f"Copied {count}/{len(paths)} MRI images to {dest_split_dir}")
            
    logger.info("MRI Preprocessing and splitting completed successfully!")

def get_mri_dataloader(split, batch_size=32, shuffle=True, augment=False):
    """
    Creates and returns a DataLoader for the MRI image dataset split.
    Normalizes images using standard ImageNet parameters.
    """
    from torchvision import transforms
    from torchvision.datasets import ImageFolder
    from torch.utils.data import DataLoader
    
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    root_dir = os.path.join(project_root, "datasets", split, "mri")
    if not os.path.exists(root_dir):
        raise FileNotFoundError(f"MRI split directory not found: {root_dir}")
        
    norm_mean = [0.485, 0.456, 0.406]
    norm_std = [0.229, 0.224, 0.225]
    
    if augment and split == "train":
        transform = transforms.Compose([
            transforms.RandomHorizontalFlip(p=0.5),
            transforms.RandomRotation(degrees=15),
            transforms.ToTensor(),
            transforms.Normalize(mean=norm_mean, std=norm_std)
        ])
    else:
        transform = transforms.Compose([
            transforms.ToTensor(),
            transforms.Normalize(mean=norm_mean, std=norm_std)
        ])
        
    dataset = ImageFolder(root=root_dir, transform=transform)
    loader = DataLoader(
        dataset, 
        batch_size=batch_size, 
        shuffle=shuffle, 
        num_workers=0, 
        pin_memory=True
    )
    return loader

if __name__ == "__main__":
    split_and_preprocess_mri("datasets/mri", "datasets/processed/mri")
