from training.models.base_networks import GenericFeatureExtractorClassifier

class ResNet18DrawingClassifier(GenericFeatureExtractorClassifier):
    def __init__(self, num_classes=2, pretrained=True):
        super(ResNet18DrawingClassifier, self).__init__(
            backbone_name="resnet18",
            num_classes=num_classes,
            pretrained=pretrained
        )
