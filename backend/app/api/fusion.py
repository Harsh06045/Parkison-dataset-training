import os
import shutil
from fastapi import APIRouter, File, UploadFile, HTTPException, status
from app.config import UPLOAD_DIR
from app.utils.validator import validate_uploaded_file
from app.schemas.prediction import FusionPredictionResponse

from app.services.mri_service import predict_mri
from app.services.spiral_service import predict_spiral
from app.services.voice_service import predict_voice
from app.services.telemonitor_service import predict_telemonitor
from app.services.fusion_service import predict_fusion

router = APIRouter()

@router.post("/fusion", response_model=FusionPredictionResponse)
def predict_fusion_endpoint(
    mri: UploadFile = File(...),
    spiral: UploadFile = File(...),
    voice: UploadFile = File(...),
    telemonitor: UploadFile = File(...)
):
    """
    Perform multimodal diagnostic fusion combining all 4 inputs (MRI, Spiral, Voice, Telemonitoring).
    """
    # 1. Validate all files
    validate_uploaded_file(mri)
    validate_uploaded_file(spiral)
    validate_uploaded_file(voice)
    validate_uploaded_file(telemonitor)
    
    # 2. Save all files temporarily
    mri_temp = os.path.join(UPLOAD_DIR, f"fusion_mri_{mri.filename}")
    spiral_temp = os.path.join(UPLOAD_DIR, f"fusion_spiral_{spiral.filename}")
    voice_temp = os.path.join(UPLOAD_DIR, f"fusion_voice_{voice.filename}")
    tele_temp = os.path.join(UPLOAD_DIR, f"fusion_tele_{telemonitor.filename}")
    
    saved_files = []
    
    try:
        # Save MRI
        with open(mri_temp, "wb") as f:
            shutil.copyfileobj(mri.file, f)
        saved_files.append(mri_temp)
        
        # Save Spiral
        with open(spiral_temp, "wb") as f:
            shutil.copyfileobj(spiral.file, f)
        saved_files.append(spiral_temp)
        
        # Save Voice
        with open(voice_temp, "wb") as f:
            shutil.copyfileobj(voice.file, f)
        saved_files.append(voice_temp)
        
        # Save Telemonitoring
        with open(tele_temp, "wb") as f:
            shutil.copyfileobj(telemonitor.file, f)
        saved_files.append(tele_temp)
        
        # 3. Extract representations and embeddings from each modality
        mri_res = predict_mri(mri_temp)
        spiral_res = predict_spiral(spiral_temp)
        voice_res = predict_voice(voice_temp)
        tele_res = predict_telemonitor(tele_temp)
        
        # 4. Perform multimodal fusion prediction
        fusion_res = predict_fusion(
            drawing_embed=spiral_res["embedding"],
            mri_embed=mri_res["embedding"],
            voice_tensor=voice_res["tensor"],
            tele_tensor=tele_res["tensor"]
        )
        
        return FusionPredictionResponse(
            prediction=fusion_res["prediction"],
            confidence=fusion_res["confidence"],
            fusion=True
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Multimodal Fusion Prediction failed: {e}"
        )
        
    finally:
        # Cleanup all saved temporary files
        for path in saved_files:
            if os.path.exists(path):
                os.remove(path)
