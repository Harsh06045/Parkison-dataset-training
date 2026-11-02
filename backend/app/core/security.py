"""
NeuroFusionAI Core Security Module.
Provides Role-Based Access Control (RBAC), JWT authentication helpers,
and doctor-patient ownership enforcement.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import jwt

from app.core.config import settings
from app.utils.security import (
    DEFAULT_PROFILES,
    get_current_user,
    require_roles,
    check_doctor_patient_ownership,
    log_security_audit
)


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create signed JWT access token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and validate signed JWT access token."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except Exception:
        return None

