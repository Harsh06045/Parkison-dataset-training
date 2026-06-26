import torch
from torch.utils.data import Dataset, DataLoader

class ParkinsonFusionDataset(Dataset):
    """
    Synthetic Multimodal Fusion Dataset aligned to Oxford Voice, Telemonitoring, 
    and drawing image embedding dimensions. Used to demonstrate multimodal fusion.
    """
    def __init__(self, split="train", length=100):
        self.split = split
        self.length = length
        self.seed = 42 if split == "train" else (43 if split == "validation" else 44)

    def __len__(self):
        return self.length

    def __getitem__(self, idx):
        generator = torch.Generator().manual_seed(self.seed + idx)
        
        # Image embedding (representing features extracted from drawing images using ResNet)
        image_embedding = torch.randn(256, generator=generator)
        # MRI embedding (representing features extracted from MRI scans using EfficientNet)
        mri_embedding = torch.randn(256, generator=generator)
        # Tabular Oxford voice features (22 features)
        voice_features = torch.randn(22, generator=generator)
        # Tabular UPDRS telemonitoring features (19 features)
        clinical_features = torch.randn(19, generator=generator)
        
        # Binary status label (0: Healthy, 1: Parkinson)
        label = torch.randint(0, 2, (1,), generator=generator).item()
        
        return image_embedding, mri_embedding, voice_features, clinical_features, torch.tensor(label, dtype=torch.long)

def get_fusion_dataloader(split="train", batch_size=32):
    length = 100 if split == "train" else (30 if split == "validation" else 30)
    dataset = ParkinsonFusionDataset(split=split, length=length)
    shuffle = True if split == "train" else False
    return DataLoader(dataset, batch_size=batch_size, shuffle=shuffle, num_workers=0)
