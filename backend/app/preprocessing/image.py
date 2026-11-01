"""
Image preprocessing and quality checks for MRI scans and Spiral hand-drawings.
"""

from PIL import Image
import numpy as np
import torch
from torchvision import transforms


def validate_image_quality(image_path_or_pil):
    """
    Validates image file readability, resolution, and non-blank visual content.
    Returns:
        dict: {'valid': bool, 'width': int, 'height': int, 'contrast_std': float, 'reason': str}
    """
    try:
        if isinstance(image_path_or_pil, str):
            img = Image.open(image_path_or_pil).convert('RGB')
        elif isinstance(image_path_or_pil, Image.Image):
            img = image_path_or_pil.convert('RGB')
        else:
            return {'valid': False, 'width': 0, 'height': 0, 'contrast_std': 0.0,
                    'reason': "Invalid input: expected file path or PIL Image object."}

        w, h = img.size
        if w < 32 or h < 32:
            return {'valid': False, 'width': w, 'height': h, 'contrast_std': 0.0,
                    'reason': f"Image resolution too low ({w}x{h}). Minimum required resolution is 32x32 pixels."}

        arr = np.array(img, dtype=np.float32)
        contrast_std = float(np.std(arr))

        # Blank or monochrome image check
        if contrast_std < 3.0:
            return {'valid': False, 'width': w, 'height': h, 'contrast_std': round(contrast_std, 2),
                    'reason': "Image appears blank, uniformly colored, or completely corrupted (no discernible pattern)."}

        return {'valid': True, 'width': w, 'height': h, 'contrast_std': round(contrast_std, 2), 'reason': "OK"}

    except Exception as e:
        return {'valid': False, 'width': 0, 'height': 0, 'contrast_std': 0.0,
                'reason': f"Failed to decode image: {e}"}


def preprocess_image(image_path_or_pil, device=None):
    """
    Load and preprocess an image (MRI or Spiral drawing) for PyTorch CNN models.
    Includes input validation.
    """
    quality = validate_image_quality(image_path_or_pil)
    if not quality['valid']:
        raise ValueError(f"Image Quality Validation Failed: {quality['reason']}")

    if device is None:
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    if isinstance(image_path_or_pil, str):
        img = Image.open(image_path_or_pil).convert('RGB')
    else:
        img = image_path_or_pil.convert('RGB')

    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    return transform(img).unsqueeze(0).to(device)
