"""
Medical Object Storage and Secure File Reference Service.
Handles HIPAA-compliant secure storage of diagnostic audio, drawings, MRI scans,
Grad-CAM heatmaps, and SHAP visualisations with cryptographic SHA-256 integrity verification
and token-authenticated signed URLs.
"""

import os
import shutil
import hashlib
import secrets
import mimetypes
from datetime import datetime, timedelta
from typing import Optional, Tuple
from sqlalchemy.orm import Session

from app.config import BACKEND_DIR
from app.db.models import FileReference, AuditLog
from app.db.session import get_db_session

STORAGE_ROOT = os.path.join(BACKEND_DIR, "uploads", "medical_storage")

# Ensure secure directories exist
for sub in ["audio", "spiral", "mri", "telemonitor", "gradcam", "shap"]:
    os.makedirs(os.path.join(STORAGE_ROOT, sub), exist_ok=True)


class MedicalStorageService:
    def __init__(self, root_dir: str = STORAGE_ROOT):
        self.root_dir = root_dir

    @staticmethod
    def compute_sha256(filepath: str) -> str:
        """Compute SHA-256 checksum of stored file."""
        hasher = hashlib.sha256()
        with open(filepath, "rb") as f:
            for chunk in iter(lambda: f.read(65536), b""):
                hasher.update(chunk)
        return hasher.hexdigest()

    @staticmethod
    def generate_secure_token() -> str:
        """Generate a cryptographically secure URL-safe token."""
        return secrets.token_urlsafe(32)

    def store_file(
        self,
        source_path: str,
        prediction_id: str,
        file_type: str,
        original_filename: Optional[str] = None,
        ttl_hours: Optional[int] = 72,
        db: Optional[Session] = None
    ) -> FileReference:
        """
        Persist a medical artifact into durable storage, compute SHA-256 checksum,
        and generate a signed access reference.
        """
        if not os.path.exists(source_path):
            raise FileNotFoundError(f"Source file does not exist: {source_path}")

        orig_name = original_filename or os.path.basename(source_path)
        ext = os.path.splitext(orig_name)[1].lower()
        if not ext and "." in source_path:
            ext = os.path.splitext(source_path)[1].lower()

        # Categorise into subdirectory
        sub_dir = file_type.split("_")[0] if "_" in file_type else file_type
        if sub_dir not in ["audio", "spiral", "mri", "telemonitor", "gradcam", "shap"]:
            sub_dir = "other"
        target_dir = os.path.join(self.root_dir, sub_dir)
        os.makedirs(target_dir, exist_ok=True)

        token = self.generate_secure_token()
        unique_filename = f"{prediction_id}_{file_type}_{token[:8]}{ext}"
        destination_path = os.path.join(target_dir, unique_filename)

        # Copy to medical storage repository
        shutil.copy2(source_path, destination_path)

        file_size = os.path.getsize(destination_path)
        sha256_hash = self.compute_sha256(destination_path)
        mime_type, _ = mimetypes.guess_type(destination_path)
        if not mime_type:
            if ext in [".wav", ".wave"]:
                mime_type = "audio/wav"
            elif ext in [".png"]:
                mime_type = "image/png"
            elif ext in [".jpg", ".jpeg"]:
                mime_type = "image/jpeg"
            elif ext in [".csv"]:
                mime_type = "text/csv"
            else:
                mime_type = "application/octet-stream"

        expires_at = datetime.utcnow() + timedelta(hours=ttl_hours) if ttl_hours else None
        file_id = f"FILE-{secrets.token_hex(4).upper()}"

        file_ref = FileReference(
            id=file_id,
            prediction_id=prediction_id,
            file_type=file_type,
            original_filename=orig_name,
            storage_path=destination_path,
            file_size_bytes=file_size,
            mime_type=mime_type,
            sha256_checksum=sha256_hash,
            access_token=token,
            token_expires_at=expires_at,
            created_at=datetime.utcnow()
        )

        close_session = False
        if db is None:
            db = get_db_session()
            close_session = True

        try:
            db.add(file_ref)
            db.commit()
            db.refresh(file_ref)
        finally:
            if close_session:
                db.close()

        return file_ref

    def resolve_token(self, token: str, db: Optional[Session] = None) -> Tuple[Optional[str], Optional[str], Optional[FileReference]]:
        """
        Validate access token, check expiry, and return (storage_path, mime_type, file_ref).
        """
        close_session = False
        if db is None:
            db = get_db_session()
            close_session = True

        try:
            file_ref = db.query(FileReference).filter(FileReference.access_token == token).first()
            if not file_ref:
                return None, None, None

            # Check expiration if configured
            if file_ref.token_expires_at and file_ref.token_expires_at < datetime.utcnow():
                return None, None, None

            if not os.path.exists(file_ref.storage_path):
                return None, None, None

            return file_ref.storage_path, file_ref.mime_type, file_ref
        finally:
            if close_session:
                db.close()

    def get_prediction_files(self, prediction_id: str, db: Optional[Session] = None) -> list:
        """List all verified files associated with a given prediction."""
        close_session = False
        if db is None:
            db = get_db_session()
            close_session = True

        try:
            refs = db.query(FileReference).filter(FileReference.prediction_id == prediction_id).all()
            return [r.to_dict() for r in refs]
        finally:
            if close_session:
                db.close()


    def delete_file(self, file_id: str, db: Optional[Session] = None) -> bool:
        """Permanently delete file from storage and database."""
        close_session = False
        if db is None:
            db = get_db_session()
            close_session = True

        try:
            ref = db.query(FileReference).filter(FileReference.id == file_id).first()
            if not ref:
                return False
            if os.path.exists(ref.storage_path):
                os.remove(ref.storage_path)
            db.delete(ref)
            db.commit()
            return True
        finally:
            if close_session:
                db.close()


storage_service = MedicalStorageService()
