"""
NeuroFusionAI Centralized Exceptions Module.
Standardizes clinical error codes, validation exceptions, and HTTP status mappings.
"""

from fastapi import HTTPException, status


class NeuroFusionException(Exception):
    """Base exception for all NeuroFusionAI domain errors."""
    def __init__(self, message: str, error_code: str = "INTERNAL_ERROR"):
        super().__init__(message)
        self.message = message
        self.error_code = error_code


class ModelNotLoadedException(HTTPException):
    def __init__(self, modality: str):
        super().__init__(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Model for modality '{modality}' is not loaded or weights are missing."
        )


class PatientNotFoundException(HTTPException):
    def __init__(self, patient_id: str):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient '{patient_id}' not found in registry."
        )


class UnauthorizedAccessException(HTTPException):
    def __init__(self, detail: str = "Unauthorized clinical access."):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail
        )


class MedicalValidationException(HTTPException):
    def __init__(self, detail: str):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail
        )

