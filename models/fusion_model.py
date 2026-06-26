import torch
import torch.nn as nn

class MultimodalClassifier(nn.Module):
    """
    Multimodal Fusion Network:
    Fuses three modalities:
    - Drawings Image embeddings (dim=256)
    - Tabular Voice features (dim=22)
    - Tabular Telemonitoring features (dim=19)
    And predicts Parkinson's status (binary classification).
    """
    def __init__(self, image_dim=256, mri_dim=256, voice_dim=22, clinical_dim=19, fusion_dim=128, num_classes=2):
        super(MultimodalClassifier, self).__init__()
        
        # Sub-networks to project each modality into a shared embedding subspace
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
        
        # Classification head accepting the concatenated multimodal representation (4 modalities)
        self.classifier = nn.Sequential(
            nn.Linear(fusion_dim * 4, fusion_dim),
            nn.BatchNorm1d(fusion_dim),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(fusion_dim, num_classes)
        )
        
    def forward(self, image_embed, mri_embed, voice_feat, clinical_feat):
        # Project inputs
        img_p = self.image_proj(image_embed)
        mri_p = self.mri_proj(mri_embed)
        voice_p = self.voice_proj(voice_feat)
        clin_p = self.clinical_proj(clinical_feat)
        
        # Concatenate representations
        fused = torch.cat((img_p, mri_p, voice_p, clin_p), dim=1)
        
        # Make prediction
        logits = self.classifier(fused)
        return logits
