from PIL import Image
import torch
from torchvision import transforms

def preprocess_image(image_path_or_pil, device=None):
    """
    Load and preprocess an image (MRI or Spiral drawing) for PyTorch models.
    """
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
