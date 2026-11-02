"""
Pydantic Schemas for Patient Registration, Input Validation, and Boundary Testing.
Enforces strict clinical validation rules:
- Name format (non-empty, alphabetic + punctuation, no pure digits)
- Age bounds (1 <= age <= 120)
- Gender enum ('Male', 'Female', 'Other')
- RFC 5322 compliant Email format
- Phone format (standard digits and punctuation, length 7-20)
- Date of Birth (must not be in the future)
"""

from typing import Optional, Any
from datetime import date, datetime
from pydantic import BaseModel, Field, EmailStr, field_validator, model_validator
import re


class PatientCreate(BaseModel):
    id: Optional[str] = Field(None, description="Patient identifier, e.g. PAT-1084. Auto-generated if omitted.")
    fullName: str = Field(..., min_length=2, max_length=128, description="Patient's legal full name")
    age: int = Field(..., ge=1, le=120, description="Patient's age in years (1-120)")
    gender: str = Field(..., description="Gender: Male, Female, or Other")
    email: Optional[EmailStr] = Field(None, description="Patient or guardian contact email")
    phone: Optional[str] = Field(None, min_length=7, max_length=25, description="Patient contact telephone number")
    dateOfBirth: Optional[date] = Field(None, description="Patient date of birth (YYYY-MM-DD)")
    primaryDiagnosis: Optional[str] = Field("Suspected Parkinson's Disease", max_length=256)
    medicalHistory: Optional[str] = Field(None, max_length=5000, description="Past clinical observations and comorbidities")
    riskLevel: Optional[str] = Field("Moderate", description="Risk assessment: Low, Moderate, High, Critical")
    stage: Optional[str] = Field("Stage I", description="Hoehn & Yahr Parkinson stage")

    @model_validator(mode="before")
    @classmethod
    def populate_aliases(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "fullName" not in data or not data["fullName"]:
                if "name" in data and data["name"]:
                    data["fullName"] = data["name"]
                elif "full_name" in data and data["full_name"]:
                    data["fullName"] = data["full_name"]
            if "phone" not in data or not data["phone"]:
                if "contact_number" in data and data["contact_number"]:
                    data["phone"] = data["contact_number"]
            if "dateOfBirth" not in data or not data["dateOfBirth"]:
                if "date_of_birth" in data and data["date_of_birth"]:
                    data["dateOfBirth"] = data["date_of_birth"]
            if "medicalHistory" not in data or not data["medicalHistory"]:
                if "medical_history" in data and data["medical_history"]:
                    data["medicalHistory"] = data["medical_history"]
        return data

    @field_validator("fullName")
    @classmethod
    def validate_full_name(cls, v: str) -> str:
        clean = v.strip()
        if not clean:
            raise ValueError("Patient name cannot be empty or blank whitespace.")
        # Must not be only numbers or symbols
        if re.match(r"^[\d\W]+$", clean):
            raise ValueError("Patient name must contain alphabetic characters.")
        return clean

    @field_validator("gender")
    @classmethod
    def validate_gender(cls, v: str) -> str:
        valid_genders = {"Male", "Female", "Other"}
        normalized = v.strip().capitalize()
        if normalized not in valid_genders:
            raise ValueError(f"Invalid gender '{v}'. Allowed options: Male, Female, Other.")
        return normalized

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        clean = v.strip()
        if not clean:
            return None
        # Check invalid non-phone characters (letters, illegal symbols)
        if re.search(r"[a-zA-Z]", clean) or not re.match(r"^[\d\+\-\s\(\)\.]+$", clean):
            raise ValueError("Invalid phone number format. Contains illegal characters.")
        # Must contain between 7 and 20 digits
        digits = re.sub(r"\D", "", clean)
        if len(digits) < 7 or len(digits) > 20:
            raise ValueError("Invalid phone number length. Must contain between 7 and 20 digits.")
        return clean

    @field_validator("dateOfBirth")
    @classmethod
    def validate_dob(cls, v: Optional[date]) -> Optional[date]:
        if v is not None:
            if v > date.today():
                raise ValueError("Date of birth cannot be in the future.")
        return v


class PatientUpdate(BaseModel):
    fullName: Optional[str] = Field(None, min_length=2, max_length=128)
    age: Optional[int] = Field(None, ge=1, le=120)
    gender: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, min_length=7, max_length=25)
    dateOfBirth: Optional[date] = None
    primaryDiagnosis: Optional[str] = None
    medicalHistory: Optional[str] = None
    riskLevel: Optional[str] = None
    stage: Optional[str] = None
    updrsScore: Optional[float] = Field(None, ge=0.0, le=260.0)

    @field_validator("gender")
    @classmethod
    def validate_gender_update(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            valid_genders = {"Male", "Female", "Other"}
            normalized = v.strip().capitalize()
            if normalized not in valid_genders:
                raise ValueError(f"Invalid gender '{v}'. Allowed options: Male, Female, Other.")
            return normalized
        return v


class PatientResponse(BaseModel):
    id: str
    fullName: str
    age: Optional[int] = None
    gender: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    contactNumber: Optional[str] = None
    dateOfBirth: Optional[str] = None
    primaryDiagnosis: Optional[str] = None
    riskLevel: Optional[str] = None
    stage: Optional[str] = None
    totalAnalyses: Optional[int] = 0
    medicalHistory: Optional[str] = None
    updrsScore: Optional[float] = 0.0
    createdAt: Optional[str] = None
