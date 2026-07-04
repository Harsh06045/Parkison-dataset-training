import os
import sys
import torch
import numpy as np
import pandas as pd
from torch.utils.data import Dataset, DataLoader

# Resolve project root
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)


class RealFusionDataset(Dataset):
    """
    Multimodal Fusion Dataset using real embeddings extracted from frozen 
    individual modality models, with class-matched pairing across modalities.
    
    Caches extracted embeddings to disk so they only need to be computed once.
    """
    def __init__(self, split="train", cache_dir=None):
        self.split = split
        
        if cache_dir is None:
            cache_dir = os.path.join(PROJECT_ROOT, "datasets", "processed", "fusion_embeddings")
        self.cache_dir = cache_dir
        os.makedirs(self.cache_dir, exist_ok=True)
        
        cache_path = os.path.join(self.cache_dir, f"{split}_fusion.npz")
        
        if os.path.exists(cache_path):
            data = np.load(cache_path)
            self.image_embeddings = data["image_embeddings"]
            self.mri_embeddings = data["mri_embeddings"]
            self.voice_features = data["voice_features"]
            self.clinical_features = data["clinical_features"]
            self.labels = data["labels"]
        else:
            self._extract_and_cache(split, cache_path)
    
    def _extract_and_cache(self, split, cache_path):
        """Extract real embeddings from frozen models and tabular data, then cache."""
        from torchvision import transforms
        from PIL import Image
        import glob
        
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
        # ---- Image embeddings (Spiral Drawings) ----
        image_embeddings_0 = []  # Normal
        image_embeddings_1 = []  # Parkinson
        
        # Load best spiral model for embedding extraction
        from models.image_model import ImageDrawingClassifier
        img_model = ImageDrawingClassifier(num_classes=2, pretrained=False).to(device)
        img_ckpt = os.path.join(PROJECT_ROOT, "outputs", "checkpoints", "image_best.pth")
        if os.path.exists(img_ckpt):
            state = torch.load(img_ckpt, map_location=device)
            if isinstance(state, dict) and "model_state_dict" in state:
                img_model.load_state_dict(state["model_state_dict"])
            else:
                img_model.load_state_dict(state)
        img_model.eval()
        
        transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
        
        for label, class_name in [(0, "normal"), (1, "parkinson")]:
            img_dir = os.path.join(PROJECT_ROOT, "datasets", split, "images", class_name)
            image_paths = glob.glob(os.path.join(img_dir, "*.png")) + glob.glob(os.path.join(img_dir, "*.jpg"))
            embeddings = []
            for path in image_paths:
                try:
                    img = Image.open(path).convert("RGB")
                    img_t = transform(img).unsqueeze(0).to(device)
                    with torch.no_grad():
                        emb = img_model.extract_features(img_t)
                    embeddings.append(emb.cpu().numpy().flatten())
                except Exception:
                    continue
            if label == 0:
                image_embeddings_0 = embeddings
            else:
                image_embeddings_1 = embeddings
        
        # ---- MRI embeddings ----
        mri_embeddings_0 = []
        mri_embeddings_1 = []
        
        from models.mri_model import MRIClassifier
        mri_model = MRIClassifier(num_classes=2, pretrained=False).to(device)
        mri_ckpt = os.path.join(PROJECT_ROOT, "outputs", "checkpoints", "mri_best.pth")
        if os.path.exists(mri_ckpt):
            state = torch.load(mri_ckpt, map_location=device)
            if isinstance(state, dict) and "model_state_dict" in state:
                mri_model.load_state_dict(state["model_state_dict"])
            else:
                mri_model.load_state_dict(state)
        mri_model.eval()
        
        for label, class_name in [(0, "normal"), (1, "parkinson")]:
            mri_dir = os.path.join(PROJECT_ROOT, "datasets", split, "mri", class_name)
            mri_paths = glob.glob(os.path.join(mri_dir, "*.png")) + glob.glob(os.path.join(mri_dir, "*.jpg"))
            embeddings = []
            for path in mri_paths:
                try:
                    img = Image.open(path).convert("RGB")
                    img_t = transform(img).unsqueeze(0).to(device)
                    with torch.no_grad():
                        emb = mri_model.extract_features(img_t)
                    embeddings.append(emb.cpu().numpy().flatten())
                except Exception:
                    continue
            if label == 0:
                mri_embeddings_0 = embeddings
            else:
                mri_embeddings_1 = embeddings
        
        # ---- Voice features (tabular) ----
        voice_csv = os.path.join(PROJECT_ROOT, "datasets", split, "voice", f"oxford_{split}.csv")
        voice_features_0 = []
        voice_features_1 = []
        if os.path.exists(voice_csv):
            df = pd.read_csv(voice_csv)
            for label in [0, 1]:
                subset = df[df["status"] == label].drop(columns=["status"]).values
                if label == 0:
                    voice_features_0 = [row for row in subset]
                else:
                    voice_features_1 = [row for row in subset]
        
        # ---- Telemonitoring features (tabular) ----
        # Telemonitoring is regression (no label column for PD status), so we assign
        # based on total_UPDRS threshold: >= 30 is Parkinson-associated severity
        tele_csv = os.path.join(PROJECT_ROOT, "datasets", split, "telemonitoring", f"telemonitor_{split}.csv")
        tele_features_0 = []
        tele_features_1 = []
        if os.path.exists(tele_csv):
            df = pd.read_csv(tele_csv)
            features = df.drop(columns=["motor_UPDRS", "total_UPDRS"]).values
            updrs = df["total_UPDRS"].values
            for i in range(len(features)):
                if updrs[i] >= 30:
                    tele_features_1.append(features[i])
                else:
                    tele_features_0.append(features[i])
        
        # ---- Class-matched pairing ----
        # For each class, create paired samples by cycling through modalities
        all_image_embs = []
        all_mri_embs = []
        all_voice_feats = []
        all_tele_feats = []
        all_labels = []
        
        for label, (img_embs, mri_embs, voice_feats, tele_feats) in [
            (0, (image_embeddings_0, mri_embeddings_0, voice_features_0, tele_features_0)),
            (1, (image_embeddings_1, mri_embeddings_1, voice_features_1, tele_features_1)),
        ]:
            if not img_embs or not mri_embs or not voice_feats or not tele_feats:
                continue
            
            # Use the maximum count across modalities, cycling shorter ones
            n_samples = max(len(img_embs), len(mri_embs), len(voice_feats), len(tele_feats))
            
            for i in range(n_samples):
                all_image_embs.append(img_embs[i % len(img_embs)])
                all_mri_embs.append(mri_embs[i % len(mri_embs)])
                all_voice_feats.append(voice_feats[i % len(voice_feats)])
                all_tele_feats.append(tele_feats[i % len(tele_feats)])
                all_labels.append(label)
        
        self.image_embeddings = np.array(all_image_embs, dtype=np.float32)
        self.mri_embeddings = np.array(all_mri_embs, dtype=np.float32)
        self.voice_features = np.array(all_voice_feats, dtype=np.float32)
        self.clinical_features = np.array(all_tele_feats, dtype=np.float32)
        self.labels = np.array(all_labels, dtype=np.int64)
        
        # Save cache
        np.savez_compressed(
            cache_path,
            image_embeddings=self.image_embeddings,
            mri_embeddings=self.mri_embeddings,
            voice_features=self.voice_features,
            clinical_features=self.clinical_features,
            labels=self.labels
        )
        print(f"  ✓ Cached {len(self.labels)} fusion samples for '{split}' split → {cache_path}")
    
    def __len__(self):
        return len(self.labels)
    
    def __getitem__(self, idx):
        return (
            torch.tensor(self.image_embeddings[idx], dtype=torch.float32),
            torch.tensor(self.mri_embeddings[idx], dtype=torch.float32),
            torch.tensor(self.voice_features[idx], dtype=torch.float32),
            torch.tensor(self.clinical_features[idx], dtype=torch.float32),
            torch.tensor(self.labels[idx], dtype=torch.long)
        )


def get_fusion_dataloader(split="train", batch_size=32):
    """
    Returns a DataLoader for the fusion dataset using real embeddings.
    Falls back to synthetic data if real data extraction fails.
    """
    try:
        dataset = RealFusionDataset(split=split)
        if len(dataset) == 0:
            raise ValueError("No fusion samples extracted — falling back to synthetic data")
    except Exception as e:
        print(f"  ⚠ Real fusion data not available ({e}), using synthetic fallback.")
        dataset = SyntheticFusionDataset(split=split)
    
    shuffle = True if split == "train" else False
    return DataLoader(dataset, batch_size=batch_size, shuffle=shuffle, num_workers=0)


class SyntheticFusionDataset(Dataset):
    """
    Fallback synthetic dataset for when real embeddings are not available.
    """
    def __init__(self, split="train", length=100):
        self.split = split
        self.length = length
        self.seed = 42 if split == "train" else (43 if split == "validation" else 44)

    def __len__(self):
        return self.length

    def __getitem__(self, idx):
        generator = torch.Generator().manual_seed(self.seed + idx)
        
        image_embedding = torch.randn(256, generator=generator)
        mri_embedding = torch.randn(256, generator=generator)
        voice_features = torch.randn(22, generator=generator)
        clinical_features = torch.randn(19, generator=generator)
        label = torch.randint(0, 2, (1,), generator=generator).item()
        
        return image_embedding, mri_embedding, voice_features, clinical_features, torch.tensor(label, dtype=torch.long)
