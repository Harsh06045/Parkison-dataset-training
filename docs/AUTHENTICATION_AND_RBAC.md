# NeuroFusionAI – Authentication & Role-Based Access Control (RBAC)

**System**: NeuroFusionAI Security Subsystem  
**Document**: RBAC Policies, JWT Token Specifications & Ownership Enforcement  
**Generated**: 2026-11-02  

---

## 1. Role-Based Access Matrix

NeuroFusionAI enforces strict backend authorization rules. Privileges are checked on the server for every protected operation:

| Clinical / System Capability | Patient (`patient`) | Doctor (`doctor`) | Administrator (`admin`) |
| :--- | :---: | :---: | :---: |
| View System Health (`/api/health`) | Allowed | Allowed | Allowed |
| Run Diagnostic Inference (`/api/v1/parkinson/*/predict`) | Forbidden | **Allowed** | **Allowed** |
| Run Multimodal Fusion (`/api/v1/parkinson/fusion/predict`) | Forbidden | **Allowed** | **Allowed** |
| Generate Stage 1 / Stage 2 PDF Reports | Forbidden (`HTTP 403`) | **Allowed** | **Allowed** |
| View Own Patient History & Predictions | **Allowed** | **Allowed** | **Allowed** |
| View Other Patients' Diagnostic Records | **Blocked (`HTTP 403`)** | Allowed (Assigned) | **Allowed** |
| Download Own Medical PDF Reports | **Allowed** | **Allowed** | **Allowed** |
| Download Other Patients' PDF Reports | **Blocked (`HTTP 403`)** | Allowed (Assigned) | **Allowed** |
| Delete Reports or Prediction Records | **Blocked (`HTTP 403`)** | Allowed | **Allowed** |
| Access Clinical Evaluation Benchmark Dashboard | Forbidden | **Allowed** | **Allowed** |
| Trigger Database Retention Purge / Backups | Forbidden | Forbidden | **Allowed** |

---

## 2. Authentication Protocol

### 2.1 JWT Bearer Token Specification
- **Algorithm**: HMAC-SHA256 (`HS256`)
- **Key**: Configured via `JWT_SECRET_KEY` in `backend/app/core/config.py`
- **Lifespan**: 1440 minutes (24 hours)
- **Token Payload Structure**:
```json
{
  "sub": "DOC-8921",
  "role": "doctor",
  "name": "Dr. Sarah Jenkins, MD, PhD",
  "email": "dr.jenkins@neurofusion.ai",
  "license": "MD-98472-NEURO",
  "exp": 1793577600
}
```

### 2.2 Header Injection & Multi-Context Authentication
Endpoints accept credentials through either:
1. Standard HTTP Authorization header: `Authorization: Bearer <jwt_token>`
2. Structured institutional identity headers for internal clinical gateway dispatch:
   - `X-User-Role`: `doctor` | `patient` | `admin`
   - `X-User-Id`: Identifier (e.g. `DOC-8921` or `PAT-1083`)

### 2.3 Doctor-Patient Record Isolation
Patients cannot query or download records belonging to another patient ID:
```python
def check_doctor_patient_ownership(patient_id: str, current_user: Dict[str, Any]):
    role = current_user.get("role", "patient")
    user_id = current_user.get("id", "")
    
    if role == "patient" and user_id.upper() != patient_id.upper():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access forbidden: Patient '{user_id}' cannot access records for patient '{patient_id}'."
        )
```
Every violation triggers an `AuditLog` entry in Neon PostgreSQL recording actor ID, client IP, and target resource.

