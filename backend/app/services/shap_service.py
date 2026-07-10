import os
from app.config import STATIC_DIR
from app.models.loader import loader
from explainability.shap_analysis import generate_shap_analysis

def run_shap_analysis(modality, file_path):
    """
    Generate SHAP plots (summary, bar, force) for Voice or Telemonitoring.
    Uses the cached preloaded models (CatBoost/XGBoost) for fast computation.
    
    Returns:
        dict: containing web URLs to summary, bar, and force plots.
    """
    if modality == "voice":
        model = loader.voice_catboost_model
    elif modality == "telemonitor":
        model = loader.telemonitor_xgb_model
    else:
        raise ValueError(f"Unknown modality '{modality}' for SHAP analysis.")
        
    if model is None:
        raise RuntimeError(f"Model for {modality} is not loaded.")
        
    # Generate SHAP plots in static directory
    results = generate_shap_analysis(
        modality=modality,
        output_dir=STATIC_DIR,
        max_samples=100,
        single_sample_path=file_path,
        model=model
    )
    
    prefix = "voice" if modality == "voice" else "telemonitor"
    
    # Check if force plot was successfully generated
    force_url = f"/plots/{prefix}_force_plot.png" if os.path.exists(os.path.join(STATIC_DIR, f"{prefix}_force_plot.png")) else None
    
    return {
        "summary": f"/plots/{prefix}_shap_summary.png",
        "bar": f"/plots/{prefix}_shap_bar.png",
        "force": force_url
    }
