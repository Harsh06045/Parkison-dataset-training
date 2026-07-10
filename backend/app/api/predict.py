import os
import shutil
from fastapi import APIRouter, File, UploadFile, HTTPException, status
from app.config import UPLOAD_DIR
from app.utils.validator import validate_uploaded_file
from app.schemas.prediction import (
    ImagePredictionResponse,
    VoicePredictionResponse,
    TelemonitorPredictionResponse
)
from app.services.mri_service import predict_mri
from app.services.spiral_service import predict_spiral
from app.services.voice_service import predict_voice
from app.services.telemonitor_service import predict_telemonitor
from app.services.gradcam_service import run_gradcam
from app.services.shap_service import run_shap_analysis

router = APIRouter()

@router.post("/mri", response_model=ImagePredictionResponse)
def predict_mri_endpoint(image: UploadFile = File(...)):
    """
    Predict Parkinson's from brain MRI scan and return Grad-CAM explanation.
    """
    # 1. Validate file size and format
    validate_uploaded_file(image)
    
    # 2. Save file temporarily
    temp_path = os.path.join(UPLOAD_DIR, image.filename)
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
            
        # 3. Predict MRI
        result = predict_mri(temp_path)
        
        # 4. Generate Gradcam explanation
        gradcam_res = run_gradcam("mri", temp_path)
        
        return ImagePredictionResponse(
            prediction=result["prediction"],
            confidence=result["confidence"],
            gradcam=gradcam_res["overlay"]  # return overlay url
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"MRI Prediction failed: {e}"
        )
    finally:
        # Clean up temporary uploaded file
        if os.path.exists(temp_path):
            os.remove(temp_path)

@router.post("/spiral", response_model=ImagePredictionResponse)
def predict_spiral_endpoint(image: UploadFile = File(...)):
    """
    Predict Parkinson's from hand-drawn spiral scan and return Grad-CAM explanation.
    """
    # 1. Validate file size and format
    validate_uploaded_file(image)
    
    # 2. Save file temporarily
    temp_path = os.path.join(UPLOAD_DIR, image.filename)
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
            
        # 3. Predict Spiral
        result = predict_spiral(temp_path)
        
        # 4. Generate Gradcam explanation
        gradcam_res = run_gradcam("spiral", temp_path)
        
        return ImagePredictionResponse(
            prediction=result["prediction"],
            confidence=result["confidence"],
            gradcam=gradcam_res["overlay"]  # return overlay url
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Spiral Prediction failed: {e}"
        )
    finally:
        # Clean up temporary uploaded file
        if os.path.exists(temp_path):
            os.remove(temp_path)

@router.post("/voice", response_model=VoicePredictionResponse)
def predict_voice_endpoint(file: UploadFile = File(...)):
    """
    Predict Parkinson's from voice audio (.wav) or acoustic features CSV.
    """
    # 1. Validate file
    validate_uploaded_file(file)
    
    # 2. Save file temporarily
    temp_path = os.path.join(UPLOAD_DIR, file.filename)
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # 3. Predict Voice class
        result = predict_voice(temp_path)
        
        # 4. Generate SHAP explanation
        shap_res = run_shap_analysis("voice", temp_path)
        
        return VoicePredictionResponse(
            prediction=result["prediction"],
            confidence=result["confidence"],
            shap=shap_res
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Voice Prediction failed: {e}"
        )
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

@router.post("/telemonitor", response_model=TelemonitorPredictionResponse)
def predict_telemonitor_endpoint(file: UploadFile = File(...)):
    """
    Estimate UPDRS severity score from telemonitoring clinical metrics.
    """
    # 1. Validate file
    validate_uploaded_file(file)
    
    # 2. Save file temporarily
    temp_path = os.path.join(UPLOAD_DIR, file.filename)
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # 3. Run predictions
        result = predict_telemonitor(temp_path)
        
        # 4. Generate SHAP explanation
        shap_res = run_shap_analysis("telemonitor", temp_path)
        
        return TelemonitorPredictionResponse(
            motor_updrs=result["motor_updrs"],
            total_updrs=result["total_updrs"],
            shap=shap_res
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Telemonitoring Prediction failed: {e}"
        )
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
