import os
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.config import STATIC_DIR
from app.models.loader import loader
from app.utils.logger import logger
from app.api import health, predict, fusion, report, explain

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load all PyTorch and ML models in memory once
    logger.info("Initializing models on server startup...")
    loader.load_all_models()
    yield
    # Shutdown: Clean up
    logger.info("Shutting down NeuroFusionAI backend...")

app = FastAPI(
    title="NeuroFusionAI Parkinson Multimodal Backend",
    description="FastAPI service for Parkinson's prediction and Explainable AI (XAI) reports.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration for Frontend Integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom HTTP request and processing latency logging middleware
@app.middleware("http")
async def log_requests_and_latency(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    
    # Log details
    logger.info(
        f"Host: {request.client.host if request.client else 'unknown'} | "
        f"{request.method} {request.url.path} | Status: {response.status_code} | "
        f"Time: {process_time:.4f}s"
    )
    return response

# Custom centralized exception handlers
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    logger.warning(f"HTTP Exception on {request.url.path}: status={exc.status_code}, detail={exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "error_code": f"HTTP_{exc.status_code}"
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.warning(f"Validation Error on {request.url.path}: {exc.errors()}")
    return JSONResponse(
        status_code=400,
        content={
            "detail": "Request validation failed.",
            "errors": exc.errors(),
            "error_code": "VALIDATION_ERROR"
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled Server Error on {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An unexpected error occurred on the server.",
            "error_code": "INTERNAL_SERVER_ERROR"
        }
    )

# Mount explanation plots directory as static assets at /plots
app.mount("/plots", StaticFiles(directory=STATIC_DIR), name="plots")

# Include Routers
app.include_router(health.router, tags=["health"])
app.include_router(predict.router, prefix="/predict", tags=["predictions"])
app.include_router(fusion.router, prefix="/predict", tags=["multimodal-fusion"])
app.include_router(report.router, prefix="/report", tags=["reports"])
app.include_router(explain.router, tags=["explainability"])  # Registered POST /explain
