"""
Patient-Specific Storage Service for NeuroFusionAI.
Implements HIPAA-compliant, isolated per-patient storage architecture:

storage/
├── patients/
│   ├── <PATIENT_ID>/
│   │   ├── uploads/
│   │   │   ├── spiral/
│   │   │   ├── voice/
│   │   │   ├── mri/
│   │   │   └── telemonitor/
│   │   ├── predictions/
│   │   └── explainability/
│
└── patient_reports/
    ├── <PATIENT_ID>/
    │   ├── Report_<PATIENT_ID>_<DATE>_001.pdf
    │   ├── Report_<PATIENT_ID>_<DATE>_002.pdf
    │   └── report_metadata.json

Features:
1. Strict path sanitization & traversal defense (rejects '..', slashes, control chars).
2. Auto-creation of individual patient upload, prediction, and report directories.
3. Sequential non-overwriting report filenames (Report_<PATIENT_ID>_<DATE>_<SEQ>.pdf).
4. Atomic persistence of `report_metadata.json` within each patient's reports folder.
5. Cryptographic SHA-256 integrity verification for all stored patient media & reports.
"""

import os
import re
import json
import shutil
import hashlib
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple
from fastapi import HTTPException, status

from app.core.config import settings

class PatientStorageService:
    def __init__(
        self,
        patients_root: Optional[str] = None,
        reports_root: Optional[str] = None
    ):
        self.patients_root = os.path.abspath(patients_root or settings.PATIENTS_DIR)
        self.reports_root = os.path.abspath(reports_root or settings.PATIENT_REPORTS_DIR)
        os.makedirs(self.patients_root, exist_ok=True)
        os.makedirs(self.reports_root, exist_ok=True)

    @staticmethod
    def sanitize_patient_id(patient_id: str) -> str:
        """
        Validate and sanitize patient ID to guarantee zero directory traversal.
        Only alphanumeric characters, hyphens, and underscores are allowed.
        """
        if not patient_id or not isinstance(patient_id, str):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Patient ID is required and must be a valid non-empty string."
            )
        cleaned = patient_id.strip()
        if ".." in cleaned or "/" in cleaned or "\\" in cleaned or "\0" in cleaned:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Security violation: Illegal characters in patient ID '{patient_id}'."
            )
        # Match safe clinical pattern: alphanumeric, hyphen, underscore
        if not re.match(r"^[A-Za-z0-9_\-]+$", cleaned):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid patient ID format '{cleaned}'. Must contain only letters, numbers, hyphens, or underscores."
            )
        return cleaned.upper()

    @staticmethod
    def compute_sha256(filepath: str) -> str:
        """Compute SHA-256 cryptographic checksum of file on disk."""
        hasher = hashlib.sha256()
        with open(filepath, "rb") as f:
            for chunk in iter(lambda: f.read(65536), b""):
                hasher.update(chunk)
        return hasher.hexdigest()

    @staticmethod
    def compute_bytes_sha256(content: bytes) -> str:
        """Compute SHA-256 of byte array."""
        return hashlib.sha256(content).hexdigest()

    def get_patient_dir(self, patient_id: str) -> str:
        """Get canonical directory path for patient uploads and artifacts."""
        safe_id = self.sanitize_patient_id(patient_id)
        path = os.path.abspath(os.path.join(self.patients_root, safe_id))
        # Boundary check
        if not path.startswith(self.patients_root):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Security violation: Path outside allowed patients storage root."
            )
        return path

    def get_patient_reports_dir(self, patient_id: str) -> str:
        """Get canonical directory path for patient clinical PDF reports."""
        safe_id = self.sanitize_patient_id(patient_id)
        path = os.path.abspath(os.path.join(self.reports_root, safe_id))
        # Boundary check
        if not path.startswith(self.reports_root):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Security violation: Path outside allowed reports storage root."
            )
        return path

    def ensure_patient_structure(self, patient_id: str) -> Dict[str, str]:
        """
        Ensure all individual subdirectories exist for this specific patient:
        - uploads/spiral, uploads/voice, uploads/mri, uploads/telemonitor
        - predictions
        - explainability
        - patient_reports/<patient_id>
        """
        p_dir = self.get_patient_dir(patient_id)
        r_dir = self.get_patient_reports_dir(patient_id)

        subdirs = {
            "root": p_dir,
            "reports": r_dir,
            "upload_spiral": os.path.join(p_dir, "uploads", "spiral"),
            "upload_voice": os.path.join(p_dir, "uploads", "voice"),
            "upload_mri": os.path.join(p_dir, "uploads", "mri"),
            "upload_telemonitor": os.path.join(p_dir, "uploads", "telemonitor"),
            "predictions": os.path.join(p_dir, "predictions"),
            "explainability": os.path.join(p_dir, "explainability"),
        }

        for path in subdirs.values():
            os.makedirs(path, exist_ok=True)

        return subdirs

    def save_patient_upload(
        self,
        patient_id: str,
        modality: str,
        filename: str,
        content: bytes
    ) -> Tuple[str, str, str]:
        """
        Save an original patient upload to:
        `storage/patients/<PATIENT_ID>/uploads/<modality>/<filename>`
        Returns: (absolute_path, relative_path, sha256_hash)
        """
        safe_id = self.sanitize_patient_id(patient_id)
        dirs = self.ensure_patient_structure(safe_id)

        mod_clean = modality.lower().strip()
        if "spiral" in mod_clean:
            target_dir = dirs["upload_spiral"]
            mod_prefix = "spiral"
        elif "voice" in mod_clean or "audio" in mod_clean:
            target_dir = dirs["upload_voice"]
            mod_prefix = "voice"
        elif "mri" in mod_clean:
            target_dir = dirs["upload_mri"]
            mod_prefix = "mri"
        elif "tele" in mod_clean:
            target_dir = dirs["upload_telemonitor"]
            mod_prefix = "telemonitor"
        else:
            target_dir = os.path.join(dirs["root"], "uploads", "other")
            os.makedirs(target_dir, exist_ok=True)
            mod_prefix = "other"

        # Sanitize filename
        safe_name = os.path.basename(filename).strip()
        safe_name = re.sub(r"[^A-Za-z0-9_.\-]", "_", safe_name)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        dest_filename = f"{mod_prefix}_{timestamp}_{safe_name}"
        dest_path = os.path.join(target_dir, dest_filename)

        with open(dest_path, "wb") as f:
            f.write(content)

        sha256 = self.compute_bytes_sha256(content)
        # Relative path from project root
        rel_path = os.path.relpath(dest_path, settings.PATIENT_STORAGE_ROOT).replace("\\", "/")

        return dest_path, rel_path, sha256

    def save_patient_prediction(
        self,
        patient_id: str,
        prediction_id: str,
        prediction_data: Dict[str, Any]
    ) -> Tuple[str, str]:
        """
        Save a prediction result JSON to:
        `storage/patients/<PATIENT_ID>/predictions/<prediction_id>.json`
        """
        safe_id = self.sanitize_patient_id(patient_id)
        dirs = self.ensure_patient_structure(safe_id)

        clean_pred_id = re.sub(r"[^A-Za-z0-9_\-]", "_", prediction_id.strip())
        target_path = os.path.join(dirs["predictions"], f"{clean_pred_id}.json")

        with open(target_path, "w", encoding="utf-8") as f:
            json.dump(prediction_data, f, indent=2, default=str)

        rel_path = os.path.relpath(target_path, settings.PATIENT_STORAGE_ROOT).replace("\\", "/")
        return target_path, rel_path

    def save_patient_explainability(
        self,
        patient_id: str,
        artifact_name: str,
        source_path_or_bytes: Any
    ) -> Tuple[str, str]:
        """
        Save an explainability artifact (Grad-CAM overlay, SHAP plot) to:
        `storage/patients/<PATIENT_ID>/explainability/<artifact_name>`
        """
        safe_id = self.sanitize_patient_id(patient_id)
        dirs = self.ensure_patient_structure(safe_id)

        clean_name = os.path.basename(artifact_name).strip()
        clean_name = re.sub(r"[^A-Za-z0-9_.\-]", "_", clean_name)
        target_path = os.path.join(dirs["explainability"], clean_name)

        if isinstance(source_path_or_bytes, (bytes, bytearray)):
            with open(target_path, "wb") as f:
                f.write(source_path_or_bytes)
        elif isinstance(source_path_or_bytes, str) and os.path.exists(source_path_or_bytes):
            shutil.copy2(source_path_or_bytes, target_path)
        else:
            raise ValueError(f"Invalid source for explainability artifact: {source_path_or_bytes}")

        rel_path = os.path.relpath(target_path, settings.PATIENT_STORAGE_ROOT).replace("\\", "/")
        return target_path, rel_path

    def get_next_report_filename(self, patient_id: str, report_date: Optional[str] = None) -> Tuple[str, str]:
        """
        Determine the next unique non-overwriting report filename for this patient.
        Format: `Report_<PATIENT_ID>_<DATE>_<SEQ>.pdf`
        Example: `Report_PAT-1001_2026-11-02_001.pdf`

        Scans existing reports in `storage/patient_reports/<PATIENT_ID>/` to ensure
        sequential ordering without overwriting earlier reports.
        """
        safe_id = self.sanitize_patient_id(patient_id)
        reports_dir = self.get_patient_reports_dir(safe_id)
        os.makedirs(reports_dir, exist_ok=True)

        date_str = report_date or datetime.now().strftime("%Y-%m-%d")
        prefix = f"Report_{safe_id}_{date_str}_"

        # Find highest sequence number
        max_seq = 0
        if os.path.exists(reports_dir):
            for fname in os.listdir(reports_dir):
                if fname.startswith(prefix) and fname.endswith(".pdf"):
                    seq_part = fname[len(prefix):-4]
                    if seq_part.isdigit():
                        max_seq = max(max_seq, int(seq_part))

        next_seq = max_seq + 1
        filename = f"{prefix}{next_seq:03d}.pdf"
        full_path = os.path.join(reports_dir, filename)

        return filename, full_path

    def save_patient_report_pdf(
        self,
        patient_id: str,
        pdf_source_path_or_bytes: Any,
        metadata_entry: Dict[str, Any],
        target_filename: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Save the PDF report into `storage/patient_reports/<PATIENT_ID>/`
        with a unique sequential filename, and atomically append/update
        `report_metadata.json` in the patient's reports folder.
        """
        safe_id = self.sanitize_patient_id(patient_id)
        reports_dir = self.get_patient_reports_dir(safe_id)
        os.makedirs(reports_dir, exist_ok=True)

        if target_filename:
            filename = target_filename
            dest_path = os.path.join(reports_dir, filename)
        elif isinstance(pdf_source_path_or_bytes, str) and os.path.dirname(os.path.abspath(pdf_source_path_or_bytes)) == os.path.abspath(reports_dir):
            filename = os.path.basename(pdf_source_path_or_bytes)
            dest_path = pdf_source_path_or_bytes
        else:
            filename, dest_path = self.get_next_report_filename(safe_id)

        # Write or copy the PDF if not already at dest_path
        if isinstance(pdf_source_path_or_bytes, (bytes, bytearray)):
            with open(dest_path, "wb") as f:
                f.write(pdf_source_path_or_bytes)
        elif isinstance(pdf_source_path_or_bytes, str) and os.path.exists(pdf_source_path_or_bytes):
            if os.path.abspath(pdf_source_path_or_bytes) != os.path.abspath(dest_path):
                shutil.copy2(pdf_source_path_or_bytes, dest_path)
        else:
            raise ValueError(f"Invalid PDF source: {pdf_source_path_or_bytes}")

        file_size = os.path.getsize(dest_path)
        sha256 = self.compute_sha256(dest_path)
        rel_path = f"patient_reports/{safe_id}/{filename}"

        # Construct comprehensive metadata entry
        entry = {
            "report_id": metadata_entry.get("report_id"),
            "patient_id": safe_id,
            "assessment_id": metadata_entry.get("assessment_id"),
            "report_filename": filename,
            "relative_storage_path": rel_path,
            "file_size_bytes": file_size,
            "sha256_checksum": sha256,
            "report_stage": metadata_entry.get("report_stage", "FINAL_CLINICAL"),
            "is_approved": bool(metadata_entry.get("is_approved", False)),
            "doctor_id": metadata_entry.get("doctor_id"),
            "disease": metadata_entry.get("disease", "Parkinson's Disease"),
            "modality": metadata_entry.get("modality", "Multimodal Assessment"),
            "prediction": metadata_entry.get("prediction"),
            "confidence": metadata_entry.get("confidence"),
            "risk_level": metadata_entry.get("risk_level", "Moderate Risk"),
            "status": metadata_entry.get("status", "Finalized"),
            "prediction_ids": metadata_entry.get("prediction_ids", []),
            "generated_timestamp": datetime.now().isoformat()
        }

        # Update report_metadata.json in the patient's reports folder
        meta_file = os.path.join(reports_dir, "report_metadata.json")
        records = []
        if os.path.exists(meta_file):
            try:
                with open(meta_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if isinstance(data, list):
                        records = data
                    elif isinstance(data, dict) and "reports" in data:
                        records = data["reports"]
            except Exception:
                records = []

        records.append(entry)
        meta_payload = {
            "patient_id": safe_id,
            "total_reports": len(records),
            "last_updated": datetime.now().isoformat(),
            "reports": records
        }

        # Write atomically
        temp_meta = meta_file + ".tmp"
        with open(temp_meta, "w", encoding="utf-8") as f:
            json.dump(meta_payload, f, indent=2)
        shutil.move(temp_meta, meta_file)

        entry["absolute_path"] = dest_path
        return entry

    def list_patient_reports(self, patient_id: str) -> List[Dict[str, Any]]:
        """List all clinical reports for a given patient from report_metadata.json."""
        safe_id = self.sanitize_patient_id(patient_id)
        reports_dir = self.get_patient_reports_dir(safe_id)
        meta_file = os.path.join(reports_dir, "report_metadata.json")

        if os.path.exists(meta_file):
            try:
                with open(meta_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if isinstance(data, dict) and "reports" in data:
                        return data["reports"]
                    elif isinstance(data, list):
                        return data
            except Exception:
                pass

        # Fallback: scan directory directly
        results = []
        if os.path.exists(reports_dir):
            for fname in sorted(os.listdir(reports_dir)):
                if fname.endswith(".pdf"):
                    full_p = os.path.join(reports_dir, fname)
                    results.append({
                        "report_filename": fname,
                        "patient_id": safe_id,
                        "relative_storage_path": f"patient_reports/{safe_id}/{fname}",
                        "file_size_bytes": os.path.getsize(full_p),
                        "sha256_checksum": self.compute_sha256(full_p),
                        "generated_timestamp": datetime.fromtimestamp(os.path.getmtime(full_p)).isoformat()
                    })
        return results

    def get_patient_metadata(self, patient_id: str) -> Dict[str, Any]:
        """Retrieve complete report_metadata.json for a patient."""
        safe_id = self.sanitize_patient_id(patient_id)
        reports_dir = self.get_patient_reports_dir(safe_id)
        meta_file = os.path.join(reports_dir, "report_metadata.json")

        if os.path.exists(meta_file):
            with open(meta_file, "r", encoding="utf-8") as f:
                return json.load(f)
        return {
            "patient_id": safe_id,
            "total_reports": 0,
            "reports": []
        }


# Global singleton
patient_storage = PatientStorageService()

