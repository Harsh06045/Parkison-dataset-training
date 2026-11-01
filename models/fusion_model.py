import torch
import torch.nn as nn
from training.models.fusion.attention_fusion import AttentionFusionClassifier

class MultimodalClassifier(AttentionFusionClassifier):
    """
    Multimodal Attention Fusion Network alias with backward compatibility.
    """
    pass
