import os
import shutil
from typing import Optional
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
    mri: Optional[UploadFile] = File(None),
    spiral: Optional[UploadFile] = File(None),
    voice: Optional[UploadFile] = File(None),
    telemonitor: Optional[UploadFile] = File(None)
):
    """
    Perform multimodal diagnostic fusion combining any available clinical modalities
    (Spiral Drawing, Acoustic Voice, Telemonitoring, and optional Brain MRI).
    Safely handles missing modalities.
    """
    if all(f is None for f in [mri, spiral, voice, telemonitor]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one clinical modality (Voice, Spiral Drawing, Telemonitoring, or MRI) must be provided for fusion analysis."
        )

    saved_files = []
    drawing_embed = None
    mri_embed = None
    voice_tensor = None
    tele_tensor = None

    try:
        # Process MRI if provided
        if mri is not None and mri.filename:
            validate_uploaded_file(mri)
            mri_temp = os.path.join(UPLOAD_DIR, f"fusion_mri_{mri.filename}")
            with open(mri_temp, "wb") as f:
                shutil.copyfileobj(mri.file, f)
            saved_files.append(mri_temp)
            mri_res = predict_mri(mri_temp)
            mri_embed = mri_res.get("embedding")

        # Process Spiral Drawing if provided
        if spiral is not None and spiral.filename:
            validate_uploaded_file(spiral)
            spiral_temp = os.path.join(UPLOAD_DIR, f"fusion_spiral_{spiral.filename}")
            with open(spiral_temp, "wb") as f:
                shutil.copyfileobj(spiral.file, f)
            saved_files.append(spiral_temp)
            spiral_res = predict_spiral(spiral_temp)
            drawing_embed = spiral_res.get("embedding")

        # Process Voice if provided
        if voice is not None and voice.filename:
            validate_uploaded_file(voice)
            voice_temp = os.path.join(UPLOAD_DIR, f"fusion_voice_{voice.filename}")
            with open(voice_temp, "wb") as f:
                shutil.copyfileobj(voice.file, f)
            saved_files.append(voice_temp)
            voice_res = predict_voice(voice_temp)
            voice_tensor = voice_res.get("tensor")

        # Process Telemonitoring if provided
        if telemonitor is not None and telemonitor.filename:
            validate_uploaded_file(telemonitor)
            tele_temp = os.path.join(UPLOAD_DIR, f"fusion_tele_{telemonitor.filename}")
            with open(tele_temp, "wb") as f:
                shutil.copyfileobj(telemonitor.file, f)
            saved_files.append(tele_temp)
            tele_res = predict_telemonitor(tele_temp)
            tele_tensor = tele_res.get("tensor")

        # Perform multimodal fusion
        fusion_res = predict_fusion(
            drawing_embed=drawing_embed,
            mri_embed=mri_embed,
            voice_tensor=voice_tensor,
            tele_tensor=tele_tensor
        )

        return FusionPredictionResponse(
            prediction=fusion_res["prediction"],
            confidence=fusion_res["confidence"],
            uncertainty=fusion_res["uncertainty"],
            modality_contributions=fusion_res["modality_contributions"],
            present_modalities=fusion_res["present_modalities"],
            missing_modalities=fusion_res["missing_modalities"],
            clinical_review=fusion_res["clinical_review"],
            ood_analysis=fusion_res["ood_analysis"],
            fusion=True
        )

    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Multimodal Fusion Prediction failed: {e}"
        )

    finally:
        for path in saved_files:
            if os.path.exists(path):
                os.remove(path)
