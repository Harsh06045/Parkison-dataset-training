from training.models.base_networks import GenericFeatureExtractorClassifier

class ConvNeXtDrawingClassifier(GenericFeatureExtractorClassifier):
    def __init__(self, num_classes=2, pretrained=True):
        super(ConvNeXtDrawingClassifier, self).__init__(
            backbone_name="convnext_tiny",
            num_classes=num_classes,
            pretrained=pretrained
        )
