import torch
import torch.nn as nn

class MultimodalClassifier(nn.Module):
    """
    Multimodal Projection Fusion Network:
    Projects each modality to a shared space, concatenates, and classifies.
    """
    def __init__(self, image_dim=256, mri_dim=256, voice_dim=22, clinical_dim=19, fusion_dim=32, num_classes=2):
        super(MultimodalClassifier, self).__init__()
        
        self.image_proj = nn.Sequential(
            nn.Linear(image_dim, fusion_dim),
            nn.ReLU(),
            nn.Dropout(0.2)
        )
        self.mri_proj = nn.Sequential(
            nn.Linear(mri_dim, fusion_dim),
            nn.ReLU(),
            nn.Dropout(0.2)
        )
        self.voice_proj = nn.Sequential(
            nn.Linear(voice_dim, fusion_dim),
            nn.ReLU(),
            nn.Dropout(0.2)
        )
        self.clinical_proj = nn.Sequential(
            nn.Linear(clinical_dim, fusion_dim),
            nn.ReLU(),
            nn.Dropout(0.2)
        )
        
        self.classifier = nn.Sequential(
            nn.Linear(fusion_dim * 4, fusion_dim),
            nn.BatchNorm1d(fusion_dim),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(fusion_dim, num_classes)
        )
        
    def forward(self, image_embed, mri_embed, voice_feat, clinical_feat):
        img_p = self.image_proj(image_embed)
        mri_p = self.mri_proj(mri_embed)
        voice_p = self.voice_proj(voice_feat)
        clin_p = self.clinical_proj(clinical_feat)
        
        fused = torch.cat((img_p, mri_p, voice_p, clin_p), dim=1)
        return self.classifier(fused)
