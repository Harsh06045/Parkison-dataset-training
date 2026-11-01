import torch
import torch.nn as nn

class AttentionFusionClassifier(nn.Module):
    """
    Self-Attention Multimodal Fusion Classifier with Missing Modality Handling:
    Projects each modality into a shared 64-d representation space, applies multi-head
    self-attention across available modality tokens, pools representations, and classifies.
    Supports missing modalities via attention key padding masks.
    """
    def __init__(self, image_dim=256, mri_dim=256, voice_dim=22, clinical_dim=19, fusion_dim=64, num_heads=4, num_classes=2):
        super(AttentionFusionClassifier, self).__init__()
        
        # Modality Projections (into shared fusion_dim subspace)
        self.image_proj = nn.Linear(image_dim, fusion_dim)
        self.mri_proj = nn.Linear(mri_dim, fusion_dim)
        self.voice_proj = nn.Linear(voice_dim, fusion_dim)
        self.clinical_proj = nn.Linear(clinical_dim, fusion_dim)
        
        self.relu = nn.ReLU()
        self.dropout = nn.Dropout(0.2)
        
        # Multi-head Self-Attention across modality tokens (seq_len = 4, embed_dim = 64)
        self.attention = nn.MultiheadAttention(embed_dim=fusion_dim, num_heads=num_heads, batch_first=True)
        
        # Classification head
        self.classifier = nn.Sequential(
            nn.Linear(fusion_dim, fusion_dim),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(fusion_dim, num_classes)
        )
        
    def forward(self, image_embed=None, mri_embed=None, voice_feat=None, clinical_feat=None, return_attention=False):
        device = self.image_proj.weight.device
        inputs = [image_embed, mri_embed, voice_feat, clinical_feat]
        dims = [256, 256, 22, 19]
        projs = [self.image_proj, self.mri_proj, self.voice_proj, self.clinical_proj]
        modality_names = ['spiral', 'mri', 'voice', 'telemonitor']

        present = [x is not None for x in inputs]
        if not any(present):
            raise ValueError("At least one modality must be provided to the multimodal fusion classifier.")

        batch_size = next(x.shape[0] for x in inputs if x is not None)
        processed = []

        for x, dim, proj in zip(inputs, dims, projs):
            if x is None:
                x = torch.zeros((batch_size, dim), device=device)
            p = self.dropout(self.relu(proj(x))).unsqueeze(1) # (batch, 1, fusion_dim)
            processed.append(p)

        # Stack as sequence: (batch, 4, fusion_dim)
        seq = torch.cat(processed, dim=1)

        # Build key_padding_mask: True indicates missing modality to ignore in attention
        if all(present):
            attn_mask = None
        else:
            attn_mask = torch.tensor([[not p for p in present]], dtype=torch.bool, device=device)
            if batch_size > 1:
                attn_mask = attn_mask.expand(batch_size, -1)

        attn_out, attn_weights = self.attention(seq, seq, seq, key_padding_mask=attn_mask, need_weights=True)

        # Mean pooling strictly over the present modality positions
        present_indices = [idx for idx, p in enumerate(present) if p]
        pooled = torch.mean(attn_out[:, present_indices, :], dim=1)

        logits = self.classifier(pooled)

        if return_attention:
            # Calculate normalized modality attention distribution
            # attn_weights shape: (batch, 4, 4)
            w_mean = attn_weights[0].mean(dim=0).detach().cpu().numpy()
            total_w = sum(w_mean[idx] for idx in present_indices)
            contributions = {}
            for idx in range(4):
                if present[idx]:
                    contributions[modality_names[idx]] = round(float(w_mean[idx] / total_w), 4) if total_w > 0 else 0.0
                else:
                    contributions[modality_names[idx]] = 0.0
            return logits, contributions

        return logits
