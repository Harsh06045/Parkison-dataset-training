from fastapi import APIRouter
from app.schemas.prediction import HealthResponse

router = APIRouter()

@router.get("/health", response_model=HealthResponse)
def health_check():
    return {"status": "running"}
