"""
Clinical Testing Results, Scientific Evaluation, and Secure Report Export Router.
Serves held-out test evaluations, Grad-CAM artifacts, acoustic waveforms/spectrograms,
SHAP feature attributions, publication-grade evaluation curves, and export endpoints:
- PDF Clinical Reports (with all 13 required items)
- CSV Test Results
- JSON Prediction Details
- PNG Grad-CAM & SHAP visual downloads
Enforces Role-Based Access Control (RBAC), doctor-patient record ownership,
and HIPAA audit logging.
"""

import os
import io
import csv
import json
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Query, HTTPException, status, Depends, Request, Response
from fastapi.responses import JSONResponse, FileResponse, StreamingResponse

from app.config import STATIC_DIR, PROJECT_ROOT, BACKEND_DIR
from app.services.pdf_report_service import generate_testing_pdf_report
from app.services.testing_db_sync import sync_testing_results_to_database
from app.utils.security import (
    get_current_user,
    require_roles,
    check_doctor_patient_ownership,
    log_security_audit
)

router = APIRouter()

RESULTS_FILE = os.path.join(STATIC_DIR, "testing", "clinical_testing_results.json")


def _load_results():
    if not os.path.exists(RESULTS_FILE):
        alt = os.path.join(PROJECT_ROOT, "outputs", "evaluation", "clinical_testing_results.json")
        if os.path.exists(alt):
            with open(alt, "r", encoding="utf-8") as f:
                return json.load(f)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Clinical testing results have not been generated yet."
        )
    with open(RESULTS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def _find_test_record(test_id: str) -> Optional[Dict[str, Any]]:
    data = _load_results()
    all_recs = data.get("all_records", {})
    for mod, recs in all_recs.items():
        for r in recs:
            if r.get("test_id", "").upper() == test_id.upper() or r.get("id", "").upper() == test_id.upper():
                return r
    return None


# -----------------------------------------------------------------------------
# 1. SUMMARY & FILTERABLE RECORDS
# -----------------------------------------------------------------------------
@router.get("/summary", tags=["testing-dashboard"])
def get_testing_summary(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Return high-level summary metrics across all evaluated models."""
    data = _load_results()
    return {
        "timestamp": data.get("evaluation_timestamp"),
        "models": data.get("models_evaluated", {}),
        "charts": data.get("scientific_charts", {})
    }


@router.get("/records", tags=["testing-dashboard"])
def get_test_records(
    modality: Optional[str] = Query(None, description="mri, voice, spiral, telemonitoring, fusion"),
    disease: Optional[str] = Query(None, description="Filter by disease"),
    patient_id: Optional[str] = Query(None, description="Filter by patient ID"),
    is_correct: Optional[bool] = Query(None, description="Filter by correct/incorrect"),
    limit: int = Query(100, ge=1, le=500),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Return unified filterable clinical test records with patient ownership verification."""
    # Enforce patient data isolation
    if current_user.get("role") == "patient":
        if patient_id:
            check_doctor_patient_ownership(patient_id, current_user)
        else:
            patient_id = current_user.get("id")

    data = _load_results()
    all_recs = data.get("all_records", {})

    merged = []
    if modality and modality.lower() in all_recs:
        merged.extend(all_recs[modality.lower()])
    else:
        for mod, recs in all_recs.items():
            merged.extend(recs)

    # Apply filters
    filtered = []
    for r in merged:
        if disease and disease.lower() not in r.get("disease", "").lower():
            continue
        if patient_id and patient_id.upper() != r.get("patient_id", "").upper():
            continue
        if is_correct is not None and r.get("is_correct") != is_correct:
            continue
        filtered.append(r)

    return {
        "total_matches": len(filtered),
        "records": filtered[:limit]
    }


# -----------------------------------------------------------------------------
# 2. INDIVIDUAL MODALITY RESULTS
# -----------------------------------------------------------------------------
@router.get("/mri", tags=["testing-dashboard"])
def get_mri_test_results(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Return MRI test samples with Grad-CAM heatmaps and overlays."""
    data = _load_results()
    return {
        "metrics": data.get("models_evaluated", {}).get("mri", {}).get("metrics", {}),
        "records": data.get("all_records", {}).get("mri", [])
    }


@router.get("/voice", tags=["testing-dashboard"])
def get_voice_test_results(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Return Voice test samples with waveforms, spectrograms, and SHAP attributions."""
    data = _load_results()
    return {
        "metrics": data.get("models_evaluated", {}).get("voice", {}).get("metrics", {}),
        "records": data.get("all_records", {}).get("voice", []),
        "waveform_url": "/static/testing/voice_waveform.png",
        "spectrogram_url": "/static/testing/voice_spectrogram.png",
        "shap_summary_url": "/static/testing/voice_shap_summary.png"
    }


@router.get("/spiral", tags=["testing-dashboard"])
def get_spiral_test_results(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Return Spiral drawing test samples with Grad-CAM tremor overlays."""
    data = _load_results()
    return {
        "metrics": data.get("models_evaluated", {}).get("spiral", {}).get("metrics", {}),
        "records": data.get("all_records", {}).get("spiral", [])
    }


@router.get("/telemonitoring", tags=["testing-dashboard"])
def get_telemonitoring_test_results(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Return Telemonitoring continuous regression test samples and UPDRS fit curves."""
    data = _load_results()
    return {
        "metrics": data.get("models_evaluated", {}).get("telemonitoring", {}).get("metrics", {}),
        "records": data.get("all_records", {}).get("telemonitoring", []),
        "fit_chart_url": "/static/testing/telemonitor_regression_fit.png"
    }


@router.get("/fusion", tags=["testing-dashboard"])
def get_fusion_test_results(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Return Multimodal Attention Fusion test samples and cross-modal attention weights."""
    data = _load_results()
    return {
        "metrics": data.get("models_evaluated", {}).get("multimodal_fusion", {}).get("metrics", {}),
        "records": data.get("all_records", {}).get("fusion", [])
    }


@router.get("/evaluation", tags=["testing-dashboard"])
def get_evaluation_charts(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Return URLs for all publication-ready scientific evaluation curves."""
    data = _load_results()
    return {
        "metrics": data.get("models_evaluated", {}),
        "charts": data.get("scientific_charts", {})
    }


# -----------------------------------------------------------------------------
# 3. PHASE 8: REPORT & EXPORT FORMATS
# -----------------------------------------------------------------------------
@router.get("/export/pdf", tags=["testing-export"])
def export_test_pdf_report(
    test_id: Optional[str] = Query(None, description="Test sample ID or Prediction ID"),
    request: Request = None,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Generate and stream a full 3-page clinical PDF report including:
    Project & Model info, Patient & Test session details, Original diagnostic input,
    Preprocessed input, Prediction verdict, Confidence & Uncertainty, Grad-CAM/SHAP visualizations,
    Held-out evaluation metrics, Confusion matrix & ROC curve, Ground-truth comparison,
    Doctor's interpretation & approval signature, and Regulatory limitations.
    """
    data = _load_results()
    target_record = None

    if test_id:
        target_record = _find_test_record(test_id)
        if not target_record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Test record '{test_id}' not found."
            )
    else:
        # Default to first representative test record
        first_mod = next(iter(data.get("all_records", {})), "spiral")
        recs = data.get("all_records", {}).get(first_mod, [])
        target_record = recs[0] if recs else None

    if not target_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No test records available to generate report."
        )

    # Check ownership if patient
    patient_id = target_record.get("patient_id", "PAT-1083")
    if current_user.get("role") == "patient":
        check_doctor_patient_ownership(patient_id, current_user)

    modality = target_record.get("modality", "mri")
    mod_metrics = data.get("models_evaluated", {}).get(modality, {}).get("metrics", {})

    pdf_path = generate_testing_pdf_report(
        record=target_record,
        modality_metrics=mod_metrics,
        doctor_name=current_user.get("full_name", "Dr. Sarah Jenkins, MD, PhD"),
        doctor_license=current_user.get("medical_license", "MD-98472-NEURO")
    )

    # Log audit event
    log_security_audit(
        request=request,
        actor_id=current_user.get("id", "DOC-8921"),
        action="EXPORT_PDF_REPORT",
        resource_type="report_pdf",
        resource_id=target_record.get("test_id", "UNKNOWN"),
        details={"patient_id": patient_id, "modality": modality}
    )

    filename = f"Clinical_Report_{patient_id}_{target_record.get('test_id', 'test')}.pdf"
    return FileResponse(
        path=pdf_path,
        media_type="application/pdf",
        filename=filename,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/reports/{test_id}/pdf", tags=["testing-export"])
def get_report_by_test_id_pdf(
    test_id: str,
    request: Request = None,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Path-based route to export PDF report for a specific test ID."""
    return export_test_pdf_report(test_id=test_id, request=request, current_user=current_user)


@router.get("/export/csv", tags=["testing-export"])
def export_test_results_csv(
    modality: Optional[str] = Query(None, description="Filter by modality"),
    request: Request = None,
    current_user: Dict[str, Any] = Depends(require_roles(["doctor", "admin"]))
):
    """
    Export all held-out clinical testing predictions and evaluation metrics
    as a downloadable CSV file.
    """
    data = _load_results()
    all_recs = data.get("all_records", {})

    records_to_export = []
    if modality and modality.lower() in all_recs:
        records_to_export.extend(all_recs[modality.lower()])
    else:
        for mod, recs in all_recs.items():
            records_to_export.extend(recs)

    output = io.StringIO()
    writer = csv.writer(output)

    # Header
    headers = [
        "Test ID", "Patient ID", "Modality", "Disease", "Ground Truth",
        "Model Prediction", "Confidence (%)", "Uncertainty Margin (%)",
        "Validation Match", "Model Version", "Timestamp"
    ]
    writer.writerow(headers)

    for r in records_to_export:
        writer.writerow([
            r.get("test_id", ""),
            r.get("patient_id", ""),
            r.get("modality", ""),
            r.get("disease", ""),
            r.get("ground_truth", ""),
            r.get("prediction", ""),
            r.get("confidence", ""),
            r.get("uncertainty", 0.0),
            "VERIFIED_MATCH" if r.get("is_correct") else "MISMATCH",
            r.get("model_version", ""),
            data.get("evaluation_timestamp", "")
        ])

    log_security_audit(
        request=request,
        actor_id=current_user.get("id", "DOC-8921"),
        action="EXPORT_TEST_RESULTS_CSV",
        resource_type="testing_csv",
        resource_id=f"MOD_{modality or 'ALL'}",
        details={"total_rows": len(records_to_export)}
    )

    output.seek(0)
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=Parkinson_Testing_Results_{modality or 'All'}.csv"}
    )


@router.get("/export/json", tags=["testing-export"])
def export_test_details_json(
    test_id: Optional[str] = Query(None, description="Specific test ID or empty for complete payload"),
    request: Request = None,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Export structured JSON evaluation details and explainability metrics.
    """
    data = _load_results()

    if test_id:
        record = _find_test_record(test_id)
        if not record:
            raise HTTPException(status_code=404, detail=f"Test record '{test_id}' not found.")
        
        if current_user.get("role") == "patient":
            check_doctor_patient_ownership(record.get("patient_id", ""), current_user)

        log_security_audit(
            request=request,
            actor_id=current_user.get("id"),
            action="EXPORT_TEST_JSON",
            resource_type="testing_json",
            resource_id=test_id
        )
        return JSONResponse(content={"record": record})

    # Bulk JSON restricted to doctor / admin
    if current_user.get("role") == "patient":
        raise HTTPException(status_code=403, detail="Patients cannot export bulk testing datasets.")

    log_security_audit(
        request=request,
        actor_id=current_user.get("id"),
        action="EXPORT_BULK_TEST_JSON",
        resource_type="testing_json",
        resource_id="ALL_MODELS"
    )
    return JSONResponse(content=data)


@router.get("/export/png", tags=["testing-export"])
def export_visualization_png(
    test_id: str = Query(..., description="Test ID"),
    artifact_type: str = Query("heatmap", description="heatmap, overlay, original, shap_summary"),
    request: Request = None,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Download a specific Grad-CAM heatmap, overlay, or SHAP PNG visualization.
    """
    record = _find_test_record(test_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"Test record '{test_id}' not found.")

    if current_user.get("role") == "patient":
        check_doctor_patient_ownership(record.get("patient_id", ""), current_user)

    artifacts = record.get("artifacts", {})
    art_path = artifacts.get(artifact_type)
    if not art_path:
        raise HTTPException(
            status_code=404,
            detail=f"Artifact '{artifact_type}' not available for record '{test_id}'."
        )

    # Locate real file
    real_path = art_path
    if not os.path.isabs(real_path):
        real_path = os.path.join(STATIC_DIR, art_path.lstrip("/"))
    if not os.path.exists(real_path):
        real_path = os.path.join(STATIC_DIR, "testing", os.path.basename(art_path))

    if not os.path.exists(real_path):
        raise HTTPException(status_code=404, detail="Artifact file could not be found on storage.")

    log_security_audit(
        request=request,
        actor_id=current_user.get("id"),
        action="EXPORT_PNG_VISUALIZATION",
        resource_type="image_png",
        resource_id=test_id,
        details={"artifact_type": artifact_type}
    )

    filename = f"{test_id}_{artifact_type}.png"
    return FileResponse(
        path=real_path,
        media_type="image/png",
        filename=filename,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


# -----------------------------------------------------------------------------
# 4. PHASE 9: DATABASE SYNC & PATIENT HISTORY APIS
# -----------------------------------------------------------------------------
@router.post("/db/sync", tags=["testing-admin"])
def trigger_testing_database_sync(
    max_samples: int = Query(25, ge=5, le=100),
    request: Request = None,
    current_user: Dict[str, Any] = Depends(require_roles(["doctor", "admin"]))
):
    """
    Synchronize all held-out clinical testing evaluations into Neon PostgreSQL
    with cryptographic SHA-256 integrity checksums and secure token references.
    Restricted to Doctor and Admin roles.
    """
    result = sync_testing_results_to_database(max_samples_per_modality=max_samples)
    log_security_audit(
        request=request,
        actor_id=current_user.get("id", "DOC-8921"),
        action="TRIGGER_DB_SYNC",
        resource_type="database_sync",
        resource_id="BATCH",
        details=result
    )
    return result


@router.get("/patients/{patient_id}/history", tags=["testing-dashboard"])
def get_patient_testing_history(
    patient_id: str,
    modality: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    request: Request = None,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Retrieve testing evaluation history for a specific patient.
    Enforces doctor-patient ownership: patients cannot inspect other patients' records.
    """
    check_doctor_patient_ownership(patient_id, current_user)

    data = _load_results()
    all_recs = data.get("all_records", {})

    matching = []
    for mod, recs in all_recs.items():
        if modality and mod.lower() != modality.lower():
            continue
        for r in recs:
            if r.get("patient_id", "").upper() == patient_id.upper():
                matching.append(r)

    log_security_audit(
        request=request,
        actor_id=current_user.get("id"),
        action="GET_PATIENT_TESTING_HISTORY",
        resource_type="patient_history",
        resource_id=patient_id,
        details={"matches": len(matching)}
    )

    return {
        "patient_id": patient_id,
        "total_records": len(matching),
        "history": matching[:limit]
    }
