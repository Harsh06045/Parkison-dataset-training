"""
Grad-CAM (Gradient-weighted Class Activation Mapping) for visual explainability
of MRI and Spiral Drawing image classifiers.

Generates three separate output files per analysis:
  - {prefix}_original.png   — the input image
  - {prefix}_gradcam.png    — the raw heatmap
  - {prefix}_overlay.png    — heatmap overlaid on the original

Usage:
    python explainability/gradcam.py --model mri --image path/to/scan.png
    python explainability/gradcam.py --model spiral --image path/to/drawing.png
"""
import os
import sys
import argparse
import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image
from torchvision import transforms

try:
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)


class GradCAM:
    """
    Grad-CAM implementation for any PyTorch CNN model.
    Registers forward and backward hooks on a target convolutional layer.
    """
    def __init__(self, model, target_layer):
        self.model = model
        self.target_layer = target_layer
        self.gradients = None
        self.activations = None
        self._forward_hook = target_layer.register_forward_hook(self._save_activation)
        self._backward_hook = target_layer.register_full_backward_hook(self._save_gradient)

    def _save_activation(self, module, input, output):
        self.activations = output.detach()

    def _save_gradient(self, module, grad_input, grad_output):
        self.gradients = grad_output[0].detach()

    def generate(self, input_tensor, target_class=None):
        self.model.eval()
        input_tensor.requires_grad_(True)

        output = self.model(input_tensor)
        probs = F.softmax(output, dim=1)

        if target_class is None:
            target_class = output.argmax(dim=1).item()

        confidence = probs[0, target_class].item()

        self.model.zero_grad()
        output[0, target_class].backward()

        gradients = self.gradients[0]
        activations = self.activations[0]
        weights = gradients.mean(dim=(1, 2))

        heatmap = torch.zeros(activations.shape[1:], device=activations.device)
        for i, w in enumerate(weights):
            heatmap += w * activations[i]

        heatmap = F.relu(heatmap)
        heatmap = heatmap - heatmap.min()
        if heatmap.max() > 0:
            heatmap = heatmap / heatmap.max()

        return heatmap.cpu().numpy(), target_class, confidence

    def cleanup(self):
        self._forward_hook.remove()
        self._backward_hook.remove()


def get_target_layer(model, model_type):
    """Get the appropriate target convolutional layer for Grad-CAM."""
    base_model = model
    if hasattr(model, 'resnet'):
        base_model = model.resnet
    elif hasattr(model, 'efficientnet'):
        base_model = model.efficientnet
    elif hasattr(model, 'backbone'):
        base_model = model.backbone

    if model_type == "mri" or "efficientnet" in base_model.__class__.__name__.lower():
        if hasattr(base_model, 'features'):
            return base_model.features[-1]

    if hasattr(base_model, 'layer4'):
        return base_model.layer4

    for name in ['layer4', 'features']:
        if hasattr(base_model, name):
            layer = getattr(base_model, name)
            if isinstance(layer, torch.nn.Sequential):
                return layer[-1]
            return layer

    # Fallback: last Conv2d
    conv_layers = [m for m in base_model.modules() if isinstance(m, torch.nn.Conv2d)]
    if conv_layers:
        return conv_layers[-1]

    raise ValueError(f"Cannot find target layer for model type '{model_type}'")


def extract_brain_mask(img_array):
    """
    Skull-stripping / Brain Parenchyma segmentation.
    Extracts a smooth binary mask of intracranial brain matter, isolating the brain
    and removing the skull bone, scalp, fat, and background noise.
    """
    import cv2
    import scipy.ndimage as ndi

    if len(img_array.shape) == 3 and img_array.shape[2] == 3:
        gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
    else:
        gray = img_array.copy()

    # 1. Denoise with Gaussian blur
    blur = cv2.GaussianBlur(gray, (5, 5), 0)

    # 2. Threshold air background
    thresh_val = max(15, int(blur.mean() * 0.5))
    _, bin_head = cv2.threshold(blur, thresh_val, 255, cv2.THRESH_BINARY)

    # Fill small holes inside the head
    head_filled = ndi.binary_fill_holes(bin_head > 0).astype(np.uint8) * 255

    # 3. Morphological erosion to sever skull rim from brain parenchyma
    h, w = gray.shape[:2]
    k_size = max(5, int(min(h, w) * 0.05))
    if k_size % 2 == 0:
        k_size += 1
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k_size, k_size))
    eroded = cv2.erode(head_filled, kernel, iterations=2)

    # 4. Extract largest connected component (intracranial brain mass)
    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(eroded, connectivity=8)
    if num_labels > 1:
        largest_label = 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])
        brain_seed = (labels == largest_label).astype(np.uint8) * 255
    else:
        brain_seed = eroded

    # 5. Dilate back toward the inner table of the skull (avoiding outer skull bone)
    dilate_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k_size, k_size))
    brain_mask = cv2.dilate(brain_seed, dilate_kernel, iterations=1)

    # Fill ventricles / deep brain structures
    brain_mask = ndi.binary_fill_holes(brain_mask > 0).astype(np.float32)

    # Subtle Gaussian smoothing on edges to prevent pixelated boundaries
    brain_mask = cv2.GaussianBlur(brain_mask, (5, 5), 0)
    if brain_mask.max() > 0:
        brain_mask = brain_mask / brain_mask.max()

    return brain_mask


def generate_gradcam(model_type, image_path, output_dir=None, device=None, model=None):
    """
    Full Grad-CAM pipeline. Saves three files:
      {prefix}_original.png, {prefix}_gradcam.png, {prefix}_overlay.png

    Returns:
        dict with keys 'original', 'gradcam', 'overlay' (file paths),
        plus 'predicted_class' and 'confidence'.
    """
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    import matplotlib.cm as cm

    if device is None:
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    if output_dir is None:
        output_dir = os.path.join(PROJECT_ROOT, "outputs", "plots")
    os.makedirs(output_dir, exist_ok=True)

    prefix = "mri" if model_type == "mri" else "spiral"

    # --- Load model ---
    if model is None:
        if model_type == "mri":
            from models.mri_model import MRIClassifier
            model = MRIClassifier(num_classes=2, pretrained=False).to(device)
            ckpt_path = os.path.join(PROJECT_ROOT, "outputs", "checkpoints", "mri_best.pth")
        elif model_type == "spiral":
            from models.image_model import ImageDrawingClassifier
            model = ImageDrawingClassifier(num_classes=2, pretrained=False).to(device)
            ckpt_path = os.path.join(PROJECT_ROOT, "outputs", "checkpoints", "image_best.pth")
        else:
            raise ValueError(f"Unknown model type: {model_type}. Use 'mri' or 'spiral'.")

        if not os.path.exists(ckpt_path):
            raise FileNotFoundError(f"Checkpoint not found: {ckpt_path}")

        state = torch.load(ckpt_path, map_location=device)
        if isinstance(state, dict) and "model_state_dict" in state:
            model.load_state_dict(state["model_state_dict"])
        else:
            model.load_state_dict(state)
        model.eval()
        print(f"  ✓ Loaded checkpoint: {ckpt_path}")
    else:
        model = model.to(device)


    # --- Preprocess ---
    original_image = Image.open(image_path).convert('RGB')
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    input_tensor = transform(original_image).unsqueeze(0).to(device)

    # --- Generate Grad-CAM ---
    target_layer = get_target_layer(model, model_type)
    gradcam = GradCAM(model, target_layer)
    heatmap, predicted_class, confidence = gradcam.generate(input_tensor)
    gradcam.cleanup()

    class_names = ["Normal", "Parkinson"]
    img_resized = original_image.resize((224, 224))
    img_array = np.array(img_resized)

    # Resize heatmap to image size
    heatmap_resized = np.array(
        Image.fromarray((heatmap * 255).astype(np.uint8)).resize((224, 224))
    ) / 255.0

    if model_type == "mri":
        # Skull Stripping: Restrict Grad-CAM exclusively to brain parenchyma (excluding skull bone, scalp & air)
        brain_mask = extract_brain_mask(img_array)
        heatmap_resized = heatmap_resized * brain_mask
        if heatmap_resized.max() > 0:
            heatmap_resized = heatmap_resized / heatmap_resized.max()

        # Colormap application
        colored_rgb = (cm.jet(heatmap_resized)[:, :, :3] * 255).astype(np.uint8)
        mask_3d = np.repeat(brain_mask[:, :, np.newaxis], 3, axis=2)
        # Brain-only heatmap: strictly black (0,0,0) outside brain parenchyma
        colored_heatmap = (colored_rgb * mask_3d).astype(np.uint8)

        # In overlay, blend Grad-CAM heatmap only over brain parenchyma; skull and background remain natural
        overlay = (img_array * (1.0 - 0.45 * mask_3d) + colored_heatmap * (0.45 * mask_3d)).astype(np.uint8)
    else:
        colored_heatmap = (cm.jet(heatmap_resized)[:, :, :3] * 255).astype(np.uint8)
        overlay = (img_array * 0.6 + colored_heatmap * 0.4).astype(np.uint8)

    # --- Save clean 1:1 image rasters (pixel-aligned for web viewer) ---
    paths = {}

    # 1. Original (pure image array without matplotlib margins or title banners)
    p_orig = os.path.join(output_dir, f"{prefix}_original.png")
    Image.fromarray(img_array).save(p_orig)
    paths["original"] = p_orig

    # 2. Grad-CAM heatmap (brain-only)
    p_hm = os.path.join(output_dir, f"{prefix}_gradcam.png")
    Image.fromarray(colored_heatmap).save(p_hm)
    paths["gradcam"] = p_hm

    # 3. Overlay
    p_ov = os.path.join(output_dir, f"{prefix}_overlay.png")
    Image.fromarray(overlay).save(p_ov)
    paths["overlay"] = p_ov

    # Also save composite report figure with labels
    p_comp = os.path.join(output_dir, f"{prefix}_composite_report.png")
    fig, axes = plt.subplots(1, 3, figsize=(12, 4))
    axes[0].imshow(img_resized)
    axes[0].set_title("Original MRI Scan", fontsize=11, fontweight='bold')
    axes[0].axis('off')
    axes[1].imshow(colored_heatmap)
    axes[1].set_title("Brain-Only Grad-CAM", fontsize=11, fontweight='bold')
    axes[1].axis('off')
    axes[2].imshow(overlay)
    axes[2].set_title(f"Overlay ({class_names[predicted_class]}: {confidence*100:.1f}%)",
                      fontsize=11, fontweight='bold')
    axes[2].axis('off')
    plt.tight_layout()
    fig.savefig(p_comp, dpi=150, bbox_inches='tight')
    plt.close(fig)

    print(f"  ✓ Grad-CAM saved: {prefix}_original.png, {prefix}_gradcam.png, {prefix}_overlay.png")
    print(f"    Predicted: {class_names[predicted_class]} (confidence: {confidence*100:.2f}%)")

    return {
        **paths,
        "predicted_class": class_names[predicted_class],
        "confidence": confidence,
    }


def main():
    parser = argparse.ArgumentParser(description="Grad-CAM Explainability for MRI and Spiral Models")
    parser.add_argument("--model", type=str, required=True, choices=["mri", "spiral"])
    parser.add_argument("--image", type=str, required=True)
    parser.add_argument("--output-dir", type=str, default=None)
    args = parser.parse_args()

    if not os.path.exists(args.image):
        print(f"ERROR: Image file '{args.image}' not found.")
        sys.exit(1)

    print("=" * 60)
    print("        NEUROFUSIONAI GRAD-CAM EXPLAINABILITY")
    print("=" * 60)
    generate_gradcam(args.model, args.image, args.output_dir)


if __name__ == "__main__":
    main()
