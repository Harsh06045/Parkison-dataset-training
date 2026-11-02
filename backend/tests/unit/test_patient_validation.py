"""
Unit tests for Layer 1: Patient Input Validation & Boundary Testing.
Tests every input field:
- Patient Name: Valid, empty, whitespace, numbers, symbols
- Age: Valid (1-120), zero, negative, unrealistic (>120)
- Gender: Valid ('Male', 'Female', 'Other'), invalid string
- Email: Valid RFC 5322, invalid syntax, empty
- Phone: Valid format, letters, invalid length (<7)
- Date of Birth: Valid date, future date
- Medical History: Valid text, long text
"""

import pytest
from datetime import date, timedelta
from pydantic import ValidationError
from app.schemas.patient import PatientCreate, PatientUpdate


class TestPatientInputValidation:

    def test_valid_patient_creation(self):
        """Test valid patient input satisfies all validation rules."""
        data = {
            "fullName": "Eleanor Vance",
            "age": 72,
            "gender": "Female",
            "email": "eleanor.vance@example.com",
            "phone": "+1 (555) 876-5432",
            "dateOfBirth": "1954-11-20",
            "primaryDiagnosis": "Parkinson's Disease Stage II",
            "medicalHistory": "Unilateral resting tremor, micrographia, mild bradykinesia."
        }
        patient = PatientCreate(**data)
        assert patient.fullName == "Eleanor Vance"
        assert patient.age == 72
        assert patient.gender == "Female"
        assert patient.email == "eleanor.vance@example.com"
        assert patient.dateOfBirth == date(1954, 11, 20)

    # --- Full Name Validation ---
    def test_name_empty_or_whitespace(self):
        """Test empty or whitespace-only name raises ValidationError."""
        with pytest.raises(ValidationError):
            PatientCreate(fullName="", age=65, gender="Male")
        with pytest.raises(ValidationError):
            PatientCreate(fullName="   ", age=65, gender="Male")

    def test_name_numbers_only(self):
        """Test pure numeric name raises ValidationError."""
        with pytest.raises(ValidationError):
            PatientCreate(fullName="12345678", age=65, gender="Male")

    def test_name_special_characters_only(self):
        """Test pure symbols name raises ValidationError."""
        with pytest.raises(ValidationError):
            PatientCreate(fullName="@#$%^&*()", age=65, gender="Male")

    # --- Age Boundary Tests ---
    def test_age_boundary_zero(self):
        """Test age = 0 is rejected (minimum age is 1)."""
        with pytest.raises(ValidationError):
            PatientCreate(fullName="Test Patient", age=0, gender="Male")

    def test_age_boundary_negative(self):
        """Test negative age is rejected."""
        with pytest.raises(ValidationError):
            PatientCreate(fullName="Test Patient", age=-5, gender="Male")

    def test_age_boundary_valid_limits(self):
        """Test valid boundary ages 1 and 120."""
        p_min = PatientCreate(fullName="Infant Test", age=1, gender="Other")
        assert p_min.age == 1
        p_max = PatientCreate(fullName="Centenarian Test", age=120, gender="Female")
        assert p_max.age == 120

    def test_age_boundary_unrealistic(self):
        """Test unrealistic age (> 120) is rejected."""
        with pytest.raises(ValidationError):
            PatientCreate(fullName="Test Patient", age=121, gender="Male")
        with pytest.raises(ValidationError):
            PatientCreate(fullName="Test Patient", age=250, gender="Male")

    # --- Gender Validation ---
    @pytest.mark.parametrize("gender_input, expected", [
        ("Male", "Male"),
        ("female", "Female"),
        ("other", "Other"),
        ("  MALE  ", "Male")
    ])
    def test_gender_valid_options(self, gender_input, expected):
        p = PatientCreate(fullName="Valid Gender", age=50, gender=gender_input)
        assert p.gender == expected

    def test_gender_invalid_option(self):
        """Test invalid gender category is rejected."""
        with pytest.raises(ValidationError):
            PatientCreate(fullName="Test Patient", age=50, gender="UnknownCategory")

    # --- Email Validation ---
    def test_email_valid_formats(self):
        p = PatientCreate(fullName="Test Patient", age=50, gender="Male", email="patient.test@sub.hospital.org")
        assert p.email == "patient.test@sub.hospital.org"

    def test_email_invalid_syntax(self):
        """Test malformed email addresses are rejected."""
        with pytest.raises(ValidationError):
            PatientCreate(fullName="Test Patient", age=50, gender="Male", email="invalid-email-no-at")
        with pytest.raises(ValidationError):
            PatientCreate(fullName="Test Patient", age=50, gender="Male", email="test@missingdomain")

    # --- Phone Validation ---
    def test_phone_valid_formats(self):
        p1 = PatientCreate(fullName="Test Patient", age=50, gender="Male", phone="+1-555-123-4567")
        assert p1.phone == "+1-555-123-4567"
        p2 = PatientCreate(fullName="Test Patient", age=50, gender="Male", phone="(555) 123-4567")
        assert p2.phone == "(555) 123-4567"

    def test_phone_letters_rejected(self):
        """Test alphabetic characters in phone are rejected."""
        with pytest.raises(ValidationError):
            PatientCreate(fullName="Test Patient", age=50, gender="Male", phone="12345CALLME")

    def test_phone_too_short(self):
        """Test phone numbers shorter than 7 digits are rejected."""
        with pytest.raises(ValidationError):
            PatientCreate(fullName="Test Patient", age=50, gender="Male", phone="12345")

    # --- Date of Birth Boundary Tests ---
    def test_dob_future_date_rejected(self):
        """Test future birth date is rejected."""
        tomorrow = date.today() + timedelta(days=1)
        with pytest.raises(ValidationError):
            PatientCreate(fullName="Test Patient", age=50, gender="Male", dateOfBirth=tomorrow)

    def test_dob_valid_past_date(self):
        past = date(1960, 5, 15)
        p = PatientCreate(fullName="Test Patient", age=65, gender="Male", dateOfBirth=past)
        assert p.dateOfBirth == past

    # --- Missing Required Fields ---
    def test_missing_required_fields(self):
        """Test omitting required fields raises ValidationError."""
        with pytest.raises(ValidationError):
            PatientCreate(age=50, gender="Male")  # Missing fullName
        with pytest.raises(ValidationError):
            PatientCreate(fullName="Test Name", gender="Male")  # Missing age
        with pytest.raises(ValidationError):
            PatientCreate(fullName="Test Name", age=50)  # Missing gender

