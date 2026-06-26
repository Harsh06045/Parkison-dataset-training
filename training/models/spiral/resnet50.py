from training.models.base_networks import GenericFeatureExtractorClassifier

class ResNet50DrawingClassifier(GenericFeatureExtractorClassifier):
    def __init__(self, num_classes=2, pretrained=True):
        super(ResNet50DrawingClassifier, self).__init__(
            backbone_name="resnet50",
            num_classes=num_classes,
            pretrained=pretrained
        )
