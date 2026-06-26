import torch
import torch.nn as nn
import torchvision.models as models

class MRIClassifier(nn.Module):
    """
    EfficientNet-B0 based MRI classifier for Parkinson's MRI classification.
    Allows frozen feature extraction or fine-tuning, and provides a feature extraction method.
    """
    def __init__(self, num_classes=2, pretrained=True):
        super(MRIClassifier, self).__init__()
        weights = models.EfficientNet_B0_Weights.DEFAULT if pretrained else None
        self.efficientnet = models.efficientnet_b0(weights=weights)
        
        # Freeze backbone parameters
        for param in self.efficientnet.parameters():
            param.requires_grad = False
            
        # EfficientNet classifier has nn.Sequential(nn.Dropout(...), nn.Linear(1280, num_classes))
        in_features = self.efficientnet.classifier[1].in_features
        
        # Custom head to compress representation to 256 embedding before class prediction
        self.efficientnet.classifier = nn.Sequential(
            nn.Dropout(p=0.2, inplace=True),
            nn.Linear(in_features, 256),
            nn.ReLU(),
            nn.Dropout(p=0.3),
            nn.Linear(256, num_classes)
        )
        
    def forward(self, x):
        return self.efficientnet(x)
        
    def extract_features(self, x):
        """
        Extracts 256-dimensional embedding from the penultimate layer.
        """
        # Run backbone features (extract features)
        x = self.efficientnet.features(x)
        x = self.efficientnet.avgpool(x)
        x = torch.flatten(x, 1)
        
        # Run linear layer of our custom head to get 256-dim embedding
        # self.efficientnet.classifier[1] is nn.Linear(1280, 256)
        embedding = self.efficientnet.classifier[1](x)
        return embedding
