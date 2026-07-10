import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import STATIC_DIR
from app.models.loader import loader
from app.api import health, predict, fusion, report

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load all PyTorch and ML models in memory once
    loader.load_all_models()
    yield
    # Shutdown: Clean up or log if needed
    print("Shutting down NeuroFusionAI backend...")

app = FastAPI(
    title="NeuroFusionAI Parkinson Multimodal Backend",
    description="FastAPI service for Parkinson's prediction and Explainable AI (XAI) reports.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration for Frontend Integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount explanation plots directory as static assets at /plots
app.mount("/plots", StaticFiles(directory=STATIC_DIR), name="plots")

# Include Routers
app.include_router(health.router, tags=["health"])
app.include_router(predict.router, prefix="/predict", tags=["predictions"])
app.include_router(fusion.router, prefix="/predict", tags=["multimodal-fusion"])
app.include_router(report.router, prefix="/report", tags=["reports"])
