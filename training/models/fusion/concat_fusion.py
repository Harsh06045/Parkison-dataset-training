import torch
import torch.nn as nn

class ConcatFusionClassifier(nn.Module):
    """
    Concatenation Fusion Classifier:
    Concatenates all raw inputs directly and passes them through an MLP classifier.
    """
    def __init__(self, image_dim=256, mri_dim=256, voice_dim=22, clinical_dim=19, num_classes=2, hidden_dim=64):
        super(ConcatFusionClassifier, self).__init__()
        
        input_dim = image_dim + mri_dim + voice_dim + clinical_dim
        
        self.classifier = nn.Sequential(
            nn.Linear(input_dim, hidden_dim * 2),
            nn.BatchNorm1d(hidden_dim * 2),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(hidden_dim * 2, hidden_dim),
            nn.BatchNorm1d(hidden_dim),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(hidden_dim, num_classes)
        )
        
    def forward(self, image_embed, mri_embed, voice_feat, clinical_feat):
        fused = torch.cat((image_embed, mri_embed, voice_feat, clinical_feat), dim=1)
        return self.classifier(fused)
