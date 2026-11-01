import os
from app.config import STATIC_DIR
from app.models.loader import loader
from explainability.gradcam import generate_gradcam

def run_gradcam(model_type, image_path):
    """
    Generate Grad-CAM visualization for MRI or Spiral drawings.
    Uses the cached pre-loaded model instead of reloading from disk.
    
    Returns:
        dict: containing web URLs to original, gradcam, and overlay images.
    """
    if model_type == "mri":
        model = loader.mri_model
    elif model_type == "spiral":
        model = loader.spiral_model
    else:
        raise ValueError(f"Unknown model type '{model_type}' for Grad-CAM.")
        
    if model is None:
        raise RuntimeError(f"Model for {model_type} is not loaded.")
        
    # Generate plots in the static directory
    results = generate_gradcam(
        model_type=model_type,
        image_path=image_path,
        output_dir=STATIC_DIR,
        device=loader.device,
        model=model
    )
    
    # Return path mappings relative to the mounted web folder
    prefix = "mri" if model_type == "mri" else "spiral"
    # Also sync newly generated plots to frontend public folder if exists
    try:
        import shutil
        frontend_plots = os.path.join(os.path.dirname(os.path.dirname(STATIC_DIR)), "frontend", "public", "plots")
        if os.path.exists(frontend_plots):
            for suffix in ["_original.png", "_gradcam.png", "_overlay.png"]:
                src = os.path.join(STATIC_DIR, f"{prefix}{suffix}")
                if os.path.exists(src):
                    shutil.copy2(src, os.path.join(frontend_plots, f"{prefix}{suffix}"))
    except Exception:
        pass

    return {
        "original": f"/plots/{prefix}_original.png",
        "gradcam": f"/plots/{prefix}_gradcam.png",
        "heatmap": f"/plots/{prefix}_gradcam.png",
        "overlay": f"/plots/{prefix}_overlay.png"
    }
