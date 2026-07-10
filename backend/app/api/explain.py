import os
import shutil
from fastapi import APIRouter, File, UploadFile, HTTPException, status
from app.config import UPLOAD_DIR, STATIC_DIR
from app.utils.validator import validate_uploaded_file
from app.services.mri_service import predict_mri
from app.services.spiral_service import predict_spiral
from app.services.voice_service import predict_voice
from app.services.telemonitor_service import predict_telemonitor
from app.services.gradcam_service import run_gradcam
from app.services.shap_service import run_shap_analysis
from app.models.loader import loader

from explainability.fusion_explain import compute_fusion_contributions, generate_fusion_contribution_plot

router = APIRouter()

@router.post("/explain")
def generate_explain_endpoint(
    mri: UploadFile = File(None),
    spiral: UploadFile = File(None),
    voice: UploadFile = File(None),
    telemonitor: UploadFile = File(None)
):
    """
    Generate Explainable AI (XAI) plots for all uploaded modalities.
    Returns URLs to Grad-CAM, SHAP summary/bar, and fusion modality contribution plots.
    """
    saved_files = {}
    response_data = {}
    
    try:
        # 1. Process MRI
        if mri:
            validate_uploaded_file(mri)
            mri_temp = os.path.join(UPLOAD_DIR, f"exp_mri_{mri.filename}")
            with open(mri_temp, "wb") as f:
                shutil.copyfileobj(mri.file, f)
            saved_files["mri_path"] = mri_temp
            
            # Predict and extract embedding
            mri_res = predict_mri(mri_temp)
            saved_files["mri_embed"] = mri_res["embedding"]
            
            # Generate Grad-CAM
            gradcam_res = run_gradcam("mri", mri_temp)
            response_data["mri"] = gradcam_res

        # 2. Process Spiral Drawing
        if spiral:
            validate_uploaded_file(spiral)
            spiral_temp = os.path.join(UPLOAD_DIR, f"exp_spiral_{spiral.filename}")
            with open(spiral_temp, "wb") as f:
                shutil.copyfileobj(spiral.file, f)
            saved_files["spiral_path"] = spiral_temp
            
            # Predict and extract embedding
            spiral_res = predict_spiral(spiral_temp)
            saved_files["spiral_embed"] = spiral_res["embedding"]
            
            # Generate Grad-CAM
            gradcam_res = run_gradcam("spiral", spiral_temp)
            response_data["spiral"] = gradcam_res

        # 3. Process Voice
        if voice:
            validate_uploaded_file(voice)
            voice_temp = os.path.join(UPLOAD_DIR, f"exp_voice_{voice.filename}")
            with open(voice_temp, "wb") as f:
                shutil.copyfileobj(voice.file, f)
            saved_files["voice_path"] = voice_temp
            
            # Predict and extract tensor
            voice_res = predict_voice(voice_temp)
            saved_files["voice_tensor"] = voice_res["tensor"]
            
            # Generate SHAP
            shap_res = run_shap_analysis("voice", voice_temp)
            response_data["voice"] = shap_res

        # 4. Process Telemonitoring
        if telemonitor:
            validate_uploaded_file(telemonitor)
            tele_temp = os.path.join(UPLOAD_DIR, f"exp_tele_{telemonitor.filename}")
            with open(tele_temp, "wb") as f:
                shutil.copyfileobj(telemonitor.file, f)
            saved_files["telemonitor_path"] = tele_temp
            
            # Predict and extract tensor
            tele_res = predict_telemonitor(tele_temp)
            saved_files["tele_tensor"] = tele_res["tensor"]
            
            # Generate SHAP
            shap_res = run_shap_analysis("telemonitor", tele_temp)
            response_data["telemonitor"] = shap_res

        if not response_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one modality (mri, spiral, voice, telemonitor) must be uploaded to get explainability outputs."
            )

        # 5. Multimodal Fusion Explainability
        mri_embed = saved_files.get("mri_embed")
        drawing_embed = saved_files.get("spiral_embed")
        voice_tensor = saved_files.get("voice_tensor")
        tele_tensor = saved_files.get("tele_tensor")
        
        if mri_embed is not None and drawing_embed is not None and voice_tensor is not None and tele_tensor is not None:
            try:
                fusion_contrib = compute_fusion_contributions(
                    loader.fusion_model, drawing_embed, mri_embed, voice_tensor, tele_tensor, loader.device
                )
                fusion_plot_path = generate_fusion_contribution_plot(fusion_contrib)
                dest_path = os.path.join(STATIC_DIR, "fusion_contribution.png")
                if os.path.exists(fusion_plot_path):
                    shutil.copy(fusion_plot_path, dest_path)
                    response_data["fusion"] = {
                        "plot": "/plots/fusion_contribution.png"
                    }
            except Exception as e:
                print(f"Warning: Fusion contribution plot generation failed: {e}")
                
        return response_data
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Explainability generation failed: {e}"
        )
        
    finally:
        # Cleanup temporary uploaded files
        for key in ["mri_path", "spiral_path", "voice_path", "telemonitor_path"]:
            path = saved_files.get(key)
            if path and os.path.exists(path):
                os.remove(path)
