import torch
import torch.nn as nn

class AttentionFusionClassifier(nn.Module):
    """
    Self-Attention Multimodal Fusion Classifier:
    Projects each modality to a shared space, applies multi-head self-attention
    across the modalities, pools the representations, and classifies.
    """
    def __init__(self, image_dim=256, mri_dim=256, voice_dim=22, clinical_dim=19, fusion_dim=32, num_heads=2, num_classes=2):
        super(AttentionFusionClassifier, self).__init__()
        
        # Projections
        self.image_proj = nn.Linear(image_dim, fusion_dim)
        self.mri_proj = nn.Linear(mri_dim, fusion_dim)
        self.voice_proj = nn.Linear(voice_dim, fusion_dim)
        self.clinical_proj = nn.Linear(clinical_dim, fusion_dim)
        
        self.relu = nn.ReLU()
        self.dropout = nn.Dropout(0.2)
        
        # Self-Attention Layer (seq_len = 4, embedding_dim = fusion_dim)
        self.attention = nn.MultiheadAttention(embed_dim=fusion_dim, num_heads=num_heads, batch_first=True)
        
        self.classifier = nn.Sequential(
            nn.Linear(fusion_dim, fusion_dim),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(fusion_dim, num_classes)
        )
        
    def forward(self, image_embed, mri_embed, voice_feat, clinical_feat):
        # Project inputs to fusion_dim
        img_p = self.dropout(self.relu(self.image_proj(image_embed))).unsqueeze(1)      # (batch, 1, fusion_dim)
        mri_p = self.dropout(self.relu(self.mri_proj(mri_embed))).unsqueeze(1)          # (batch, 1, fusion_dim)
        voice_p = self.dropout(self.relu(self.voice_proj(voice_feat))).unsqueeze(1)      # (batch, 1, fusion_dim)
        clin_p = self.dropout(self.relu(self.clinical_proj(clinical_feat))).unsqueeze(1)  # (batch, 1, fusion_dim)
        
        # Stack as sequence: shape (batch, 4, fusion_dim)
        seq = torch.cat((img_p, mri_p, voice_p, clin_p), dim=1)
        
        # Self-Attention
        attn_out, _ = self.attention(seq, seq, seq) # (batch, 4, fusion_dim)
        
        # Mean pooling over the sequence dimension: shape (batch, fusion_dim)
        pooled = torch.mean(attn_out, dim=1)
        
        return self.classifier(pooled)
