from training.models.base_networks import GenericFeatureExtractorClassifier

class ViTDrawingClassifier(GenericFeatureExtractorClassifier):
    def __init__(self, num_classes=2, pretrained=True):
        super(ViTDrawingClassifier, self).__init__(
            backbone_name="vit_base_patch16_224",
            num_classes=num_classes,
            pretrained=pretrained
        )
