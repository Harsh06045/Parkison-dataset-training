from training.models.base_networks import GenericFeatureExtractorClassifier

class EfficientNetB0DrawingClassifier(GenericFeatureExtractorClassifier):
    def __init__(self, num_classes=2, pretrained=True):
        super(EfficientNetB0DrawingClassifier, self).__init__(
            backbone_name="efficientnet_b0",
            num_classes=num_classes,
            pretrained=pretrained
        )
