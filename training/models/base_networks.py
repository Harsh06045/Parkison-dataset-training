import torch
import torch.nn as nn
import timm

class GenericFeatureExtractorClassifier(nn.Module):
    """
    Generic classifier wrapper for image backbones (MRI and drawings) that extracts 256-dimensional embeddings.
    """
    def __init__(self, backbone_name, num_classes=2, pretrained=True):
        super(GenericFeatureExtractorClassifier, self).__init__()
        self.backbone = timm.create_model(backbone_name, pretrained=pretrained, num_classes=0)
        
        # Get feature dimensions dynamically
        dummy_input = torch.randn(1, 3, 224, 224)
        self.backbone.eval()
        with torch.no_grad():
            features = self.backbone(dummy_input)
        in_features = features.shape[1]
        
        # Custom head mapping features to 256-dim embedding, then to num_classes
        self.head = nn.Sequential(
            nn.Dropout(p=0.2),
            nn.Linear(in_features, 256),
            nn.ReLU(),
            nn.Dropout(p=0.3),
            nn.Linear(256, num_classes)
        )
        
    def forward(self, x):
        features = self.backbone(x)
        return self.head(features)
        
    def extract_features(self, x):
        features = self.backbone(x)
        # head[1] is nn.Linear(in_features, 256)
        # Apply ReLU to keep it consistent with the forward pass feature state if desired, or just raw linear
        return self.head[1](self.head[0](features))
