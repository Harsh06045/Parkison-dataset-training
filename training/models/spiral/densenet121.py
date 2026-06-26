from training.models.base_networks import GenericFeatureExtractorClassifier

class DenseNet121DrawingClassifier(GenericFeatureExtractorClassifier):
    def __init__(self, num_classes=2, pretrained=True):
        super(DenseNet121DrawingClassifier, self).__init__(
            backbone_name="densenet121",
            num_classes=num_classes,
            pretrained=pretrained
        )
