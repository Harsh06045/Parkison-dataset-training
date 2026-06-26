from training.models.base_networks import GenericFeatureExtractorClassifier

class EfficientNetB3DrawingClassifier(GenericFeatureExtractorClassifier):
    def __init__(self, num_classes=2, pretrained=True):
        super(EfficientNetB3DrawingClassifier, self).__init__(
            backbone_name="efficientnet_b3",
            num_classes=num_classes,
            pretrained=pretrained
        )
