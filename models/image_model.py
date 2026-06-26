import torch
import torch.nn as nn
import torchvision.models as models

class ImageDrawingClassifier(nn.Module):
    """
    ResNet-18 based drawing classifier for Parkinson drawing classification.
    Allows frozen feature extraction or fine-tuning, and provides a feature extraction method.
    """
    def __init__(self, num_classes=2, pretrained=True):
        super(ImageDrawingClassifier, self).__init__()
        weights = models.ResNet18_Weights.DEFAULT if pretrained else None
        self.resnet = models.resnet18(weights=weights)
        
        # Freeze backbone parameters
        for param in self.resnet.parameters():
            param.requires_grad = False
            
        # ResNet18 fc in_features is 512
        in_features = self.resnet.fc.in_features
        
        # Custom head to compress representation to 256 embedding before class prediction
        self.resnet.fc = nn.Sequential(
            nn.Linear(in_features, 256),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(256, num_classes)
        )
        
    def forward(self, x):
        return self.resnet(x)
        
    def extract_features(self, x):
        """
        Extracts 256-dimensional embedding from the penultimate layer.
        """
        # Run backbone features
        x = self.resnet.conv1(x)
        x = self.resnet.bn1(x)
        x = self.resnet.relu(x)
        x = self.resnet.maxpool(x)

        x = self.resnet.layer1(x)
        x = self.resnet.layer2(x)
        x = self.resnet.layer3(x)
        x = self.resnet.layer4(x)

        x = self.resnet.avgpool(x)
        x = torch.flatten(x, 1)
        
        # Run first layer of our custom fc to get 256-dim embedding
        embedding = self.resnet.fc[0](x)
        return embedding
