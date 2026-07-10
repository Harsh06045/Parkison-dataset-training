import os
import shutil
from fastapi import APIRouter, File, UploadFile, Form, HTTPException, status
from fastapi.responses import FileResponse
from app.config import UPLOAD_DIR
from app.utils.validator import validate_uploaded_file
from app.services.report_service import generate_patient_report

router = APIRouter()

@router.post("")
def generate_report_endpoint(
    patient_id: str = Form("SAMPLE_PATIENT"),
    mri: UploadFile = File(None),
    spiral: UploadFile = File(None),
    voice: UploadFile = File(None),
    telemonitor: UploadFile = File(None)
):
    """
    Generate a full patient clinical PDF report.
    Analyzes all uploaded modalities, runs explainability maps, executes multimodal fusion
    (if all 4 modalities are uploaded), and compiles them into a structured PDF.
    """
    saved_files = {}
    
    try:
        # Validate and save MRI
        if mri:
            validate_uploaded_file(mri)
            mri_temp = os.path.join(UPLOAD_DIR, f"rep_mri_{mri.filename}")
            with open(mri_temp, "wb") as f:
                shutil.copyfileobj(mri.file, f)
            saved_files["mri_path"] = mri_temp
            
        # Validate and save Spiral
        if spiral:
            validate_uploaded_file(spiral)
            spiral_temp = os.path.join(UPLOAD_DIR, f"rep_spiral_{spiral.filename}")
            with open(spiral_temp, "wb") as f:
                shutil.copyfileobj(spiral.file, f)
            saved_files["spiral_path"] = spiral_temp
            
        # Validate and save Voice
        if voice:
            validate_uploaded_file(voice)
            voice_temp = os.path.join(UPLOAD_DIR, f"rep_voice_{voice.filename}")
            with open(voice_temp, "wb") as f:
                shutil.copyfileobj(voice.file, f)
            saved_files["voice_path"] = voice_temp
            
        # Validate and save Telemonitoring
        if telemonitor:
            validate_uploaded_file(telemonitor)
            tele_temp = os.path.join(UPLOAD_DIR, f"rep_tele_{telemonitor.filename}")
            with open(tele_temp, "wb") as f:
                shutil.copyfileobj(telemonitor.file, f)
            saved_files["telemonitor_path"] = tele_temp

        if not saved_files:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one modality (MRI, Spiral, Voice, or Telemonitor) must be uploaded to generate a report."
            )

        # 3. Generate PDF Report
        pdf_path = generate_patient_report(
            patient_id=patient_id,
            mri_path=saved_files.get("mri_path"),
            spiral_path=saved_files.get("spiral_path"),
            voice_path=saved_files.get("voice_path"),
            telemonitor_path=saved_files.get("telemonitor_path")
        )
        
        # 4. Return PDF FileResponse
        return FileResponse(
            path=pdf_path,
            media_type="application/pdf",
            filename=f"patient_{patient_id}_report.pdf",
            headers={"Content-Disposition": f"attachment; filename=patient_{patient_id}_report.pdf"}
        )
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Report generation failed: {e}"
        )
        
    finally:
        # Cleanup temporary saved files
        for path in saved_files.values():
            if os.path.exists(path):
                os.remove(path)
