"""
Assessment Workflow & Patient Report API Router for NeuroFusionAI.
Provides complete end-to-end patient assessment and isolated report lifecycle endpoints:

1. POST /api/v1/assessments                     -> Initialize assessment ('CREATED')
2. POST /api/v1/assessments/{id}/inputs         -> Upload testing media ('INPUTS_RECEIVED')
3. POST /api/v1/assessments/{id}/process        -> Execute AI pipeline & XAI ('COMPLETED')
4. POST /api/v1/assessments/{id}/report         -> Compile PDF report into patient folder ('REPORT_GENERATED')
5. POST /api/v1/assessments/workflow/complete   -> One-Stop End-to-End complete workflow execution
6. GET  /api/v1/assessments/{id}                -> Query assessment status & findings
7. GET  /api/v1/assessments/patient/{id}        -> List longitudinal assessments for patient
8. GET  /api/v1/patients/{id}/reports           -> List reports from patient's isolated folder
9. GET  /api/v1/patients/{id}/reports/{rid}/download -> Securely download PDF report
10. GET /api/v1/patients/{id}/reports/metadata  -> Retrieve patient's report_metadata.json
"""

import os
import json
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Request
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import AssessmentRecord, ReportRecord, Patient
from app.services.assessment_service import assessment_service
from app.services.patient_storage_service import patient_storage
from app.utils.security import get_current_user

router = APIRouter(tags=["Patient Assessments & Reports"])


# -----------------------------------------------------------------------------
# Request & Response Schemas
# -----------------------------------------------------------------------------
class CreateAssessmentRequest(BaseModel):
    patient_id: str = Field(..., description="Unique Patient ID (e.g. PAT-1001)")
    doctor_id: Optional[str] = Field("DOC-8921", description="Assigned Attending Neurologist ID")
    modalities: Optional[List[str]] = Field(
        default=["spiral", "voice", "mri"],
        description="Target diagnostic modalities to evaluate"
    )

class GenerateReportRequest(BaseModel):
    report_stage: str = Field(default="FINAL_CLINICAL", description="Report stage: AI_ANALYSIS or FINAL_CLINICAL")
    is_approved: bool = Field(default=True, description="Attending physician digital approval confirmation")
    doctor_id: Optional[str] = Field(default="DOC-8921", description="Approving physician ID")
    clinical_notes: Optional[str] = Field(default=None, description="Clinical observations & recommendations")


# -----------------------------------------------------------------------------
# Helper: Verify Patient Access Ownership
# -----------------------------------------------------------------------------
def verify_patient_access(patient_id: str, current_user: Dict[str, Any]):
    """Ensure patient users can only access their own records; clinical staff have broader access."""
    user_role = current_user.get("role", "doctor")
    user_id = current_user.get("id", "")
    if user_role == "patient" and user_id.upper() != patient_id.upper():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Patients may only access their own diagnostic records and reports."
        )


# -----------------------------------------------------------------------------
# 1. Initialize Assessment (CREATED)
# -----------------------------------------------------------------------------
@router.post("/assessments", status_code=status.HTTP_201_CREATED)
def create_assessment_endpoint(
    req: CreateAssessmentRequest,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Initialize a patient diagnostic assessment in CREATED status."""
    verify_patient_access(req.patient_id, current_user)
    assessment = assessment_service.create_assessment(
        patient_id=req.patient_id,
        doctor_id=req.doctor_id,
        modalities_requested=req.modalities,
        db=db
    )
    return assessment.to_dict()


# -----------------------------------------------------------------------------
# 2. Submit Testing Inputs (INPUTS_RECEIVED)
# -----------------------------------------------------------------------------
@router.post("/assessments/{assessment_id}/inputs")
async def submit_inputs_endpoint(
    assessment_id: str,
    spiral_file: Optional[UploadFile] = File(None),
    voice_file: Optional[UploadFile] = File(None),
    mri_file: Optional[UploadFile] = File(None),
    telemonitor_features: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Upload patient medical testing media into isolated storage."""
    asm = db.query(AssessmentRecord).filter(AssessmentRecord.id == assessment_id).first()
    if not asm:
        raise HTTPException(status_code=404, detail="Assessment not found.")
    verify_patient_access(asm.patient_id, current_user)

    spiral_bytes = await spiral_file.read() if spiral_file else None
    spiral_name = spiral_file.filename if spiral_file else "spiral.png"

    voice_bytes = await voice_file.read() if voice_file else None
    voice_name = voice_file.filename if voice_file else "voice.wav"

    mri_bytes = await mri_file.read() if mri_file else None
    mri_name = mri_file.filename if mri_file else "mri.jpg"

    tele_feats = None
    if telemonitor_features:
        try:
            tele_feats = json.loads(telemonitor_features)
        except Exception:
            tele_feats = [float(x.strip()) for x in telemonitor_features.split(",") if x.strip()]

    assessment = assessment_service.submit_inputs(
        assessment_id=assessment_id,
        spiral_bytes=spiral_bytes,
        spiral_filename=spiral_name,
        voice_bytes=voice_bytes,
        voice_filename=voice_name,
        mri_bytes=mri_bytes,
        mri_filename=mri_name,
        telemonitor_features=tele_feats,
        db=db
    )
    return assessment.to_dict()


# -----------------------------------------------------------------------------
# 3. Process AI Pipeline & Explainability (COMPLETED)
# -----------------------------------------------------------------------------
@router.post("/assessments/{assessment_id}/process")
def process_assessment_endpoint(
    assessment_id: str,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Execute all diagnostic models and explainability engines for assessment."""
    asm = db.query(AssessmentRecord).filter(AssessmentRecord.id == assessment_id).first()
    if not asm:
        raise HTTPException(status_code=404, detail="Assessment not found.")
    verify_patient_access(asm.patient_id, current_user)

    assessment = assessment_service.execute_assessment(assessment_id, db=db)
    return assessment.to_dict()


# -----------------------------------------------------------------------------
# 4. Generate Clinical PDF Report (REPORT_GENERATED)
# -----------------------------------------------------------------------------
@router.post("/assessments/{assessment_id}/report", status_code=status.HTTP_201_CREATED)
def generate_assessment_report_endpoint(
    assessment_id: str,
    req: GenerateReportRequest,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Generate comprehensive clinical PDF report and save it into the patient's
    isolated reports folder: `storage/patient_reports/<PATIENT_ID>/`.
    """
    asm = db.query(AssessmentRecord).filter(AssessmentRecord.id == assessment_id).first()
    if not asm:
        raise HTTPException(status_code=404, detail="Assessment not found.")

    if current_user.get("role") not in ["doctor", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only clinical staff (Doctor/Admin) can generate patient medical reports."
        )

    doc_id = req.doctor_id or current_user.get("id", "DOC-8921")
    report = assessment_service.generate_assessment_report(
        assessment_id=assessment_id,
        report_stage=req.report_stage,
        is_approved=req.is_approved,
        doctor_id=doc_id,
        clinical_notes=req.clinical_notes,
        db=db
    )
    return report.to_dict()


# -----------------------------------------------------------------------------
# 5. One-Stop End-to-End Workflow Execution Endpoint
# -----------------------------------------------------------------------------
@router.post("/assessments/workflow/complete")
async def complete_patient_workflow_endpoint(
    patient_id: Optional[str] = Form(None),
    patient_name: Optional[str] = Form(None),
    patient_age: Optional[int] = Form(None),
    patient_gender: Optional[str] = Form(None),
    patient_email: Optional[str] = Form(None),
    patient_phone: Optional[str] = Form(None),
    medical_history: Optional[str] = Form(None),
    spiral_file: Optional[UploadFile] = File(None),
    voice_file: Optional[UploadFile] = File(None),
    mri_file: Optional[UploadFile] = File(None),
    telemonitor_features: Optional[str] = Form(None),
    report_stage: str = Form("FINAL_CLINICAL"),
    is_approved: bool = Form(True),
    clinical_notes: Optional[str] = Form("Complete clinical assessment completed and approved."),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    ONE-STOP COMPLETE PATIENT WORKFLOW:
    Patient Registration -> Testing Inputs Upload -> Multi-Modal AI Inference ->
    Grad-CAM & SHAP Explainability -> Neon DB Persistence -> Comprehensive PDF Report ->
    Saved into Patient-Specific Isolated Reports Folder with unique non-overwriting filename!
    """
    pid = patient_id or f"PAT-{uuid.uuid4().hex[:4].upper()}"
    verify_patient_access(pid, current_user)

    patient_payload = {
        "id": pid,
        "name": patient_name or f"Patient {pid}",
        "age": patient_age or 65,
        "gender": patient_gender or "Other",
        "email": patient_email,
        "phone": patient_phone,
        "medical_history": medical_history or "Resting tremor, kinetic impairment"
    }

    sp_bytes = await spiral_file.read() if spiral_file else None
    sp_name = spiral_file.filename if spiral_file else "spiral.png"

    vo_bytes = await voice_file.read() if voice_file else None
    vo_name = voice_file.filename if voice_file else "voice.wav"

    mri_bytes = await mri_file.read() if mri_file else None
    mri_name = mri_file.filename if mri_file else "mri.jpg"

    tele_feats = None
    if telemonitor_features:
        try:
            tele_feats = json.loads(telemonitor_features)
        except Exception:
            tele_feats = [float(x.strip()) for x in telemonitor_features.split(",") if x.strip()]

    result = assessment_service.run_complete_patient_workflow(
        patient_data=patient_payload,
        spiral_bytes=sp_bytes,
        spiral_filename=sp_name,
        voice_bytes=vo_bytes,
        voice_filename=vo_name,
        mri_bytes=mri_bytes,
        mri_filename=mri_name,
        telemonitor_features=tele_feats,
        doctor_id=current_user.get("id", "DOC-8921"),
        report_stage=report_stage,
        is_approved=is_approved,
        clinical_notes=clinical_notes,
        db=db
    )
    return result


# -----------------------------------------------------------------------------
# 6. Retrieve Specific Assessment Details
# -----------------------------------------------------------------------------
@router.get("/assessments/{assessment_id}")
def get_assessment_endpoint(
    assessment_id: str,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Retrieve details, status, and predictions of an assessment."""
    asm = db.query(AssessmentRecord).filter(AssessmentRecord.id == assessment_id).first()
    if not asm:
        raise HTTPException(status_code=404, detail="Assessment not found.")
    verify_patient_access(asm.patient_id, current_user)
    return asm.to_dict()


# -----------------------------------------------------------------------------
# 7. List Assessments for a Patient
# -----------------------------------------------------------------------------
@router.get("/assessments/patient/{patient_id}")
def list_patient_assessments_endpoint(
    patient_id: str,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """List longitudinal assessments for a specific patient."""
    verify_patient_access(patient_id, current_user)
    asms = db.query(AssessmentRecord).filter(
        AssessmentRecord.patient_id == patient_id.upper(),
        AssessmentRecord.is_deleted == False
    ).order_by(AssessmentRecord.created_at.desc()).all()
    return [a.to_dict() for a in asms]


# -----------------------------------------------------------------------------
# 8. List Reports in Patient's Isolated Reports Folder
# -----------------------------------------------------------------------------
@router.get("/patients/{patient_id}/reports")
def list_patient_reports_endpoint(
    patient_id: str,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """List all clinical reports stored inside `storage/patient_reports/<PATIENT_ID>/`."""
    verify_patient_access(patient_id, current_user)
    reports = patient_storage.list_patient_reports(patient_id)
    return {
        "patient_id": patient_id.upper(),
        "total_reports": len(reports),
        "reports": reports
    }


# -----------------------------------------------------------------------------
# 9. Download Patient Clinical PDF Report (Secure & Isolated)
# -----------------------------------------------------------------------------
@router.get("/patients/{patient_id}/reports/{report_id}/download")
def download_patient_report_endpoint(
    patient_id: str,
    report_id: str,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Securely download a clinical PDF report from the patient's isolated reports folder.
    Guarantees authorization and ownership checks.
    """
    verify_patient_access(patient_id, current_user)
    safe_id = patient_storage.sanitize_patient_id(patient_id)

    # 1. Check in database first
    report_rec = db.query(ReportRecord).filter(
        ReportRecord.id == report_id,
        ReportRecord.patient_id == safe_id,
        ReportRecord.is_deleted == False
    ).first()

    pdf_path = None
    filename = None
    if report_rec and report_rec.pdf_path and os.path.exists(report_rec.pdf_path):
        pdf_path = report_rec.pdf_path
        filename = report_rec.report_filename or os.path.basename(pdf_path)

    # 2. Check patient reports folder by filename or ID match
    if not pdf_path or not os.path.exists(pdf_path):
        p_reports_dir = patient_storage.get_patient_reports_dir(safe_id)
        if os.path.exists(p_reports_dir):
            for f in os.listdir(p_reports_dir):
                if report_id in f or f == report_id:
                    cand = os.path.join(p_reports_dir, f)
                    if os.path.isfile(cand):
                        pdf_path = cand
                        filename = f
                        break

    if not pdf_path or not os.path.exists(pdf_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report '{report_id}' not found for patient '{safe_id}'."
        )

    return FileResponse(
        path=pdf_path,
        media_type="application/pdf",
        filename=filename or f"Report_{safe_id}_{report_id}.pdf"
    )


# -----------------------------------------------------------------------------
# 10. Retrieve Patient Reports Metadata JSON
# -----------------------------------------------------------------------------
@router.get("/patients/{patient_id}/reports/metadata")
def get_patient_reports_metadata_endpoint(
    patient_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Retrieve parsed `report_metadata.json` directly from patient's reports folder."""
    verify_patient_access(patient_id, current_user)
    return patient_storage.get_patient_metadata(patient_id)

