"""
Dedicated Parkinson's Disease Diagnostic API Router with Database Persistence.
Implements standardized endpoints for Voice, Spiral, Telemonitoring, Multimodal Fusion,
Prediction History retrieval, Soft Deletion, Token-Authenticated Object Storage,
Audit Logs, and Database Administration.
"""

import os
import shutil
import uuid
import logging
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, File, UploadFile, Form, HTTPException, status, Query, Request, Depends
from fastapi.responses import JSONResponse, FileResponse

from app.config import UPLOAD_DIR, STATIC_DIR
from app.utils.validator import validate_uploaded_file
from app.services.voice_service import predict_voice
from app.services.spiral_service import predict_spiral
from app.services.telemonitor_service import predict_telemonitor
from app.services.mri_service import predict_mri
from app.services.fusion_service import predict_fusion
from app.services.gradcam_service import run_gradcam
from app.services.shap_service import run_shap_analysis
from app.services.history_service import history_service
from app.services.storage_service import storage_service
from app.db.session import check_connection, get_db_session
from app.db.models import Doctor, Patient, ModelVersion, PredictionRecord, FileReference, AuditLog
from app.db.backup import export_backup, purge_retention_policy
from explainability.shap_analysis import compute_real_shap_metrics
from app.utils.security import (
    get_current_user,
    require_roles,
    check_doctor_patient_ownership,
    log_security_audit
)

logger = logging.getLogger("neurofusion.api.parkinson")

router = APIRouter()


# -----------------------------------------------------------------------------
# 1. VOICE PREDICTION API
# -----------------------------------------------------------------------------
@router.post("/voice/predict", tags=["parkinson-voice"])
def predict_parkinson_voice(
    file: UploadFile = File(...),
    patient_id: str = Form("PAT-1083"),
    request: Request = None
):
    """
    Predict Parkinson's disease from sustained vocal phonation (.wav or .csv).
    Extracts 22 physical acoustic biomarkers, runs dual MLP/CatBoost inference,
    persists record to Neon PostgreSQL / database, stores audio & SHAP artifacts,
    and returns genuine TreeExplainer SHAP attribution.
    """
    validate_uploaded_file(file)
    temp_path = os.path.join(UPLOAD_DIR, f"voice_{uuid.uuid4().hex[:8]}_{file.filename}")

    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 1. Run inference
        result = predict_voice(temp_path)

        # 2. Compute genuine SHAP explanation
        shap_res = run_shap_analysis("voice", temp_path)
        real_shap_metrics = compute_real_shap_metrics(
            features_scaled=result.get("features"),
            raw_features_dict=result.get("acoustic_features")
        )

        req_id = request.headers.get("X-Request-ID") if request else None

        # 3. Persist record to prediction history
        record = history_service.save_prediction(
            modality="voice",
            prediction=result["prediction"],
            confidence=result["confidence"],
            patient_id=patient_id,
            model_version_id="voice_catboost_v1",
            uncertainty=result.get("uncertainty", 0.0),
            details={
                "audio_filename": file.filename,
                "acoustic_features": result.get("acoustic_features"),
                "shap_summary": shap_res.get("summary"),
                "quality": result.get("quality")
            },
            clinical_notes=f"Vocal phonation analysis: {result['prediction']} ({result['confidence']}% confidence).",
            request_id=req_id
        )

        # 4. Store raw audio file and SHAP visualization into durable storage
        files_meta = []
        try:
            audio_ref = storage_service.store_file(
                source_path=temp_path,
                prediction_id=record["id"],
                file_type="audio_wav",
                original_filename=file.filename
            )
            files_meta.append(audio_ref.to_dict())

            shap_path = os.path.join(STATIC_DIR, "voice_shap_summary.png")
            if os.path.exists(shap_path):
                shap_ref = storage_service.store_file(
                    source_path=shap_path,
                    prediction_id=record["id"],
                    file_type="shap_summary",
                    original_filename="voice_shap_summary.png"
                )
                files_meta.append(shap_ref.to_dict())
        except Exception as fe:
            logger.warning(f"File storage registration warning: {fe}")

        return {
            "prediction_id": record["id"],
            "patient_id": patient_id,
            "modality": "voice",
            "prediction": result["prediction"],
            "confidence": result["confidence"],
            "uncertainty": result.get("uncertainty"),
            "acoustic_features": result.get("acoustic_features"),
            "quality": result.get("quality"),
            "files": files_meta,
            "shap_explanation": {
                "summary_plot": shap_res.get("summary"),
                "bar_plot": shap_res.get("bar"),
                "force_plot": shap_res.get("force"),
                "top_biomarkers": real_shap_metrics
            }
        }

    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Voice prediction failed: {e}"
        )
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


# -----------------------------------------------------------------------------
# 2. SPIRAL DRAWING PREDICTION API
# -----------------------------------------------------------------------------
@router.post("/spiral/predict", tags=["parkinson-spiral"])
def predict_parkinson_spiral(
    image: UploadFile = File(...),
    patient_id: str = Form("PAT-1083"),
    request: Request = None
):
    """
    Predict Parkinson's disease from Archimedean spiral hand-drawing.
    Classifies drawing tremor patterns via ResNet-18, persists drawing and Grad-CAM
    visualizations to durable storage, and writes diagnostic record to database.
    """
    validate_uploaded_file(image)
    temp_path = os.path.join(UPLOAD_DIR, f"spiral_{uuid.uuid4().hex[:8]}_{image.filename}")

    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)

        # 1. Run CNN inference
        result = predict_spiral(temp_path)

        # 2. Generate Grad-CAM explainability
        gradcam_res = run_gradcam("spiral", temp_path)

        req_id = request.headers.get("X-Request-ID") if request else None

        # 3. Persist record to prediction history
        record = history_service.save_prediction(
            modality="spiral",
            prediction=result["prediction"],
            confidence=result["confidence"],
            patient_id=patient_id,
            model_version_id="spiral_resnet18_v1",
            uncertainty=result.get("uncertainty", 0.0),
            details={
                "image_filename": image.filename,
                "gradcam_overlay": gradcam_res.get("overlay"),
                "quality": result.get("quality")
            },
            clinical_notes=f"Spiral drawing analysis: {result['prediction']} ({result['confidence']}% confidence).",
            request_id=req_id
        )

        # 4. Store drawing and Grad-CAM overlay in durable object storage
        files_meta = []
        try:
            drawing_ref = storage_service.store_file(
                source_path=temp_path,
                prediction_id=record["id"],
                file_type="spiral_png",
                original_filename=image.filename
            )
            files_meta.append(drawing_ref.to_dict())

            overlay_path = os.path.join(STATIC_DIR, "spiral_overlay.png")
            if os.path.exists(overlay_path):
                overlay_ref = storage_service.store_file(
                    source_path=overlay_path,
                    prediction_id=record["id"],
                    file_type="gradcam_overlay",
                    original_filename="spiral_overlay.png"
                )
                files_meta.append(overlay_ref.to_dict())
        except Exception as fe:
            logger.warning(f"File storage registration warning: {fe}")

        return {
            "prediction_id": record["id"],
            "patient_id": patient_id,
            "modality": "spiral",
            "prediction": result["prediction"],
            "confidence": result["confidence"],
            "uncertainty": result.get("uncertainty"),
            "quality": result.get("quality"),
            "files": files_meta,
            "gradcam": {
                "original": gradcam_res.get("original"),
                "heatmap": gradcam_res.get("gradcam"),
                "overlay": gradcam_res.get("overlay")
            }
        }

    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Spiral prediction failed: {e}"
        )
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


# -----------------------------------------------------------------------------
# 3. TELEMONITORING PREDICTION API
# -----------------------------------------------------------------------------
@router.post("/telemonitoring/predict", tags=["parkinson-telemonitoring"])
def predict_parkinson_telemonitoring(
    file: UploadFile = File(...),
    patient_id: str = Form("PAT-1083"),
    request: Request = None
):
    """
    Predict motor UPDRS and total UPDRS continuous progression scores
    from telemonitoring measurements with 95% confidence bounds,
    persists record and CSV data to database, and runs SHAP feature attribution.
    """
    validate_uploaded_file(file)
    temp_path = os.path.join(UPLOAD_DIR, f"tele_{uuid.uuid4().hex[:8]}_{file.filename}")

    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 1. Run regression inference
        result = predict_telemonitor(temp_path)

        # 2. Compute SHAP explanations
        shap_res = run_shap_analysis("telemonitor", temp_path)
        real_shap_metrics = compute_real_shap_metrics(
            features_scaled=result.get("features_scaled"),
            modality="telemonitor"
        )

        req_id = request.headers.get("X-Request-ID") if request else None

        # 3. Persist record to prediction history
        record = history_service.save_prediction(
            modality="telemonitoring",
            prediction=result["prediction"],
            confidence=result["confidence"],
            patient_id=patient_id,
            model_version_id="telemonitor_xgboost_v1",
            uncertainty=result.get("uncertainty", 0.0),
            motor_updrs=result.get("motor_updrs"),
            total_updrs=result.get("total_updrs"),
            details={
                "csv_filename": file.filename,
                "motor_updrs": result.get("motor_updrs"),
                "total_updrs": result.get("total_updrs"),
                "confidence_intervals": result.get("confidence_intervals"),
                "shap_summary": shap_res.get("summary"),
                "clinical_type": "PREDICTED_UPDRS_ASSESSMENT"
            },
            clinical_notes=f"Predicted continuous motor UPDRS: {result['motor_updrs']}, total UPDRS: {result['total_updrs']}.",
            request_id=req_id
        )

        # 4. Store raw CSV in durable object storage
        files_meta = []
        try:
            csv_ref = storage_service.store_file(
                source_path=temp_path,
                prediction_id=record["id"],
                file_type="telemonitor_csv",
                original_filename=file.filename
            )
            files_meta.append(csv_ref.to_dict())

            shap_path = os.path.join(STATIC_DIR, "telemonitor_shap_summary.png")
            if os.path.exists(shap_path):
                shap_ref = storage_service.store_file(
                    source_path=shap_path,
                    prediction_id=record["id"],
                    file_type="shap_summary",
                    original_filename="telemonitor_shap_summary.png"
                )
                files_meta.append(shap_ref.to_dict())
        except Exception as fe:
            logger.warning(f"File storage registration warning: {fe}")

        return {
            "prediction_id": record["id"],
            "patient_id": patient_id,
            "modality": "telemonitoring",
            "prediction": result["prediction"],
            "confidence": result["confidence"],
            "uncertainty": result.get("uncertainty"),
            "motor_updrs": result.get("motor_updrs"),
            "total_updrs": result.get("total_updrs"),
            "confidence_intervals": result.get("confidence_intervals"),
            "clinical_disclaimer": result.get("clinical_disclaimer"),
            "files": files_meta,
            "shap_explanation": {
                "summary_plot": shap_res.get("summary"),
                "bar_plot": shap_res.get("bar"),
                "force_plot": shap_res.get("force"),
                "top_biomarkers": real_shap_metrics
            }
        }

    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Telemonitoring prediction failed: {e}"
        )
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


# -----------------------------------------------------------------------------
# 4. MULTIMODAL ATTENTION FUSION PREDICTION API
# -----------------------------------------------------------------------------
@router.post("/fusion/predict", tags=["parkinson-fusion"])
def predict_parkinson_fusion(
    patient_id: str = Form("PAT-1083"),
    drawing: Optional[UploadFile] = File(None),
    mri: Optional[UploadFile] = File(None),
    voice: Optional[UploadFile] = File(None),
    telemonitor: Optional[UploadFile] = File(None),
    request: Request = None
):
    """
    Multimodal Attention Fusion predicting Parkinson's disease.
    Safely integrates any subset of present modalities (Voice, Spiral, Telemonitoring, MRI)
    with self-attention cross-modal weighting and out-of-distribution input detection.
    Persists combined diagnostic assessment to database.
    """
    if all(m is None or not m.filename for m in [drawing, mri, voice, telemonitor]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one valid modality (voice, drawing, telemonitoring, or mri) must be provided."
        )

    saved_files = []
    drawing_embed = None
    mri_embed = None
    voice_tensor = None
    tele_tensor = None

    try:
        # Process Spiral Drawing
        if drawing is not None and drawing.filename:
            validate_uploaded_file(drawing)
            drawing_temp = os.path.join(UPLOAD_DIR, f"fusion_drawing_{uuid.uuid4().hex[:6]}_{drawing.filename}")
            with open(drawing_temp, "wb") as f:
                shutil.copyfileobj(drawing.file, f)
            saved_files.append((drawing_temp, "spiral_png", drawing.filename))
            spiral_res = predict_spiral(drawing_temp)
            drawing_embed = spiral_res.get("embedding")

        # Process MRI
        if mri is not None and mri.filename:
            validate_uploaded_file(mri)
            mri_temp = os.path.join(UPLOAD_DIR, f"fusion_mri_{uuid.uuid4().hex[:6]}_{mri.filename}")
            with open(mri_temp, "wb") as f:
                shutil.copyfileobj(mri.file, f)
            saved_files.append((mri_temp, "mri_png", mri.filename))
            mri_res = predict_mri(mri_temp)
            mri_embed = mri_res.get("embedding")

        # Process Voice
        if voice is not None and voice.filename:
            validate_uploaded_file(voice)
            voice_temp = os.path.join(UPLOAD_DIR, f"fusion_voice_{uuid.uuid4().hex[:6]}_{voice.filename}")
            with open(voice_temp, "wb") as f:
                shutil.copyfileobj(voice.file, f)
            saved_files.append((voice_temp, "audio_wav", voice.filename))
            voice_res = predict_voice(voice_temp)
            voice_tensor = voice_res.get("tensor")

        # Process Telemonitoring
        if telemonitor is not None and telemonitor.filename:
            validate_uploaded_file(telemonitor)
            tele_temp = os.path.join(UPLOAD_DIR, f"fusion_tele_{uuid.uuid4().hex[:6]}_{telemonitor.filename}")
            with open(tele_temp, "wb") as f:
                shutil.copyfileobj(telemonitor.file, f)
            saved_files.append((tele_temp, "telemonitor_csv", telemonitor.filename))
            tele_res = predict_telemonitor(tele_temp)
            tele_tensor = tele_res.get("tensor")

        # Perform multimodal attention fusion
        fusion_res = predict_fusion(
            drawing_embed=drawing_embed,
            mri_embed=mri_embed,
            voice_tensor=voice_tensor,
            tele_tensor=tele_tensor
        )

        req_id = request.headers.get("X-Request-ID") if request else None

        # Persist record to prediction history
        record = history_service.save_prediction(
            modality="fusion",
            prediction=fusion_res["prediction"],
            confidence=fusion_res["confidence"],
            patient_id=patient_id,
            model_version_id="attention_fusion_v1",
            uncertainty=fusion_res.get("uncertainty", 0.0),
            details={
                "present_modalities": fusion_res["present_modalities"],
                "missing_modalities": fusion_res["missing_modalities"],
                "modality_contributions": fusion_res["modality_contributions"],
                "ood_analysis": fusion_res.get("ood_analysis")
            },
            clinical_notes=fusion_res["clinical_review"],
            request_id=req_id
        )

        # Store present uploaded files
        files_meta = []
        for fpath, ftype, fname in saved_files:
            try:
                fref = storage_service.store_file(
                    source_path=fpath,
                    prediction_id=record["id"],
                    file_type=ftype,
                    original_filename=fname
                )
                files_meta.append(fref.to_dict())
            except Exception as fe:
                logger.warning(f"Failed to store fusion file {fname}: {fe}")

        return {
            "prediction_id": record["id"],
            "patient_id": patient_id,
            "modality": "fusion",
            "prediction": fusion_res["prediction"],
            "confidence": fusion_res["confidence"],
            "uncertainty": fusion_res["uncertainty"],
            "modality_contributions": fusion_res["modality_contributions"],
            "present_modalities": fusion_res["present_modalities"],
            "missing_modalities": fusion_res["missing_modalities"],
            "clinical_review": fusion_res["clinical_review"],
            "ood_analysis": fusion_res.get("ood_analysis"),
            "files": files_meta,
            "fusion": True
        }

    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Multimodal Fusion prediction failed: {e}"
        )
    finally:
        for fpath, _, _ in saved_files:
            if os.path.exists(fpath):
                os.remove(fpath)


# -----------------------------------------------------------------------------
# 5. PREDICTION HISTORY AND SOFT DELETION APIS
# -----------------------------------------------------------------------------
@router.get("/predictions/{prediction_id}", tags=["parkinson-history"])
def get_prediction_by_id(prediction_id: str):
    """Retrieve a specific prediction record with its file references and clinical metadata."""
    record = history_service.get_by_id(prediction_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Prediction record '{prediction_id}' not found."
        )
    return record


@router.delete("/predictions/{prediction_id}", tags=["parkinson-history"])
def delete_prediction_by_id(prediction_id: str, request: Request = None):
    """
    Soft-delete a diagnostic prediction record while preserving HIPAA audit trail.
    """
    actor_id = request.headers.get("X-Doctor-ID", "DOC-8921") if request else "DOC-8921"
    success = history_service.soft_delete(prediction_id, actor_id=actor_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Prediction record '{prediction_id}' not found or already deleted."
        )
    return {
        "status": "success",
        "message": f"Prediction record '{prediction_id}' has been soft-deleted.",
        "prediction_id": prediction_id,
        "is_deleted": True
    }


@router.get("/patients/{patient_id}/history", tags=["parkinson-history"])
def get_patient_prediction_history(
    patient_id: str,
    request: Request = None,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Retrieve all longitudinal prediction records for a specific patient with ownership check."""
    check_doctor_patient_ownership(patient_id, current_user)
    records = history_service.get_patient_history(patient_id)
    log_security_audit(
        request=request,
        actor_id=current_user.get("id"),
        action="GET_PATIENT_HISTORY",
        resource_type="patient_history",
        resource_id=patient_id,
        details={"record_count": len(records)}
    )
    return {
        "patient_id": patient_id,
        "total_records": len(records),
        "history": records
    }


@router.get("/history", tags=["parkinson-history"])
def list_all_predictions(
    modality: Optional[str] = Query(None, description="Filter by modality: voice, spiral, telemonitoring, fusion"),
    limit: int = Query(50, ge=1, le=100),
    request: Request = None,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """List recent active prediction records across all modalities."""
    if current_user.get("role") == "patient":
        patient_id = current_user.get("id")
        records = history_service.get_patient_history(patient_id)
        if modality:
            records = [r for r in records if r.get("modality", "").lower() == modality.lower()]
        return {"count": len(records[:limit]), "records": records[:limit]}

    records = history_service.list_all(modality=modality, limit=limit)
    log_security_audit(
        request=request,
        actor_id=current_user.get("id"),
        action="LIST_ALL_PREDICTIONS",
        resource_type="prediction_list",
        resource_id="ALL",
        details={"modality": modality, "count": len(records)}
    )
    return {
        "count": len(records),
        "records": records
    }


# -----------------------------------------------------------------------------
# 6. TOKEN-AUTHENTICATED SECURE OBJECT STORAGE API
# -----------------------------------------------------------------------------
@router.get("/files/{access_token}", tags=["parkinson-storage"])
def get_secure_file(
    access_token: str,
    request: Request = None,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Secure token-authenticated medical file delivery.
    Verifies cryptographic access token and validity window before streaming.
    """
    filepath, mime_type, file_ref = storage_service.resolve_token(access_token)
    if not filepath or not os.path.exists(filepath):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File access token is invalid, expired, or resource not found."
        )

    log_security_audit(
        request=request,
        actor_id=current_user.get("id"),
        action="ACCESS_SECURE_FILE",
        resource_type="medical_file",
        resource_id=file_ref.id if file_ref else access_token[:8],
        details={"filename": os.path.basename(filepath), "mime_type": mime_type}
    )

    return FileResponse(
        path=filepath,
        media_type=mime_type or "application/octet-stream",
        filename=file_ref.original_filename if file_ref else os.path.basename(filepath)
    )


# -----------------------------------------------------------------------------
# 7. AUDIT LOGS, MAINTENANCE & DATABASE ADMINISTRATION APIS
# -----------------------------------------------------------------------------
@router.get("/audit-logs", tags=["parkinson-admin"])
def get_recent_audit_logs(
    limit: int = Query(50, ge=1, le=200),
    request: Request = None,
    current_user: Dict[str, Any] = Depends(require_roles(["doctor", "admin"]))
):
    """Retrieve recent HIPAA/clinical audit records. Restricted to Doctor/Admin."""
    logs = history_service.get_audit_logs(limit=limit)
    return {
        "count": len(logs),
        "audit_logs": logs
    }


@router.post("/maintenance/retention-purge", tags=["parkinson-admin"])
def trigger_retention_purge(
    retention_days: int = Query(30, ge=0),
    request: Request = None,
    current_user: Dict[str, Any] = Depends(require_roles(["admin"]))
):
    """
    Permanently purge soft-deleted prediction records older than retention_days.
    Complies with medical data retention policies and GDPR right-to-erasure. Restricted to Admin.
    """
    res = purge_retention_policy(retention_days=retention_days)
    log_security_audit(
        request=request,
        actor_id=current_user.get("id"),
        action="RETENTION_PURGE",
        resource_type="database_maintenance",
        resource_id=f"DAYS_{retention_days}",
        details=res
    )
    return res


@router.post("/db/backup", tags=["parkinson-admin"])
def trigger_database_backup(
    request: Request = None,
    current_user: Dict[str, Any] = Depends(require_roles(["doctor", "admin"]))
):
    """
    Trigger an immediate verified JSON snapshot export of all database tables.
    """
    res = export_backup()
    log_security_audit(
        request=request,
        actor_id=current_user.get("id"),
        action="DATABASE_BACKUP",
        resource_type="database_backup",
        resource_id=res.get("filename", "SNAPSHOT"),
        details={"status": res.get("status")}
    )
    return res


@router.get("/db/stats", tags=["parkinson-admin"])
def get_database_statistics(
    current_user: Dict[str, Any] = Depends(require_roles(["doctor", "admin"]))
):
    """
    Inspect database connection dialect, table record counts, and storage metrics.
    """
    conn_info = check_connection()
    db = get_db_session()
    try:
        counts = {
            "doctors": db.query(Doctor).count(),
            "patients": db.query(Patient).count(),
            "model_versions": db.query(ModelVersion).count(),
            "predictions_total": db.query(PredictionRecord).count(),
            "predictions_active": db.query(PredictionRecord).filter(PredictionRecord.is_deleted == False).count(),
            "predictions_deleted": db.query(PredictionRecord).filter(PredictionRecord.is_deleted == True).count(),
            "file_references": db.query(FileReference).count(),
            "audit_logs": db.query(AuditLog).count()
        }
    except Exception as e:
        counts = {"error": str(e)}
    finally:
        db.close()

    storage_bytes = 0
    if os.path.exists(storage_service.root_dir):
        for root, _, files in os.walk(storage_service.root_dir):
            for f in files:
                storage_bytes += os.path.getsize(os.path.join(root, f))

    return {
        "connection": conn_info,
        "table_counts": counts,
        "medical_storage": {
            "root_path": storage_service.root_dir,
            "total_bytes": storage_bytes,
            "total_mb": round(storage_bytes / (1024 * 1024), 2)
        }
    }
