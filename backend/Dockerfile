# =============================================================================
# NeuroFusionAI Backend Production Container
# =============================================================================

FROM python:3.11-slim as base

# Prevent Python from writing .pyc files and enable unbuffered logging
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive

WORKDIR /app

# Install system runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    libgl1 \
    libglib2.0-0 \
    libsndfile1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir pydantic-settings python-dotenv pyjwt python-jose

# Copy application and model directories
COPY backend/ ./backend/
COPY models/ ./models/
COPY training/ ./training/
COPY explainability/ ./explainability/
COPY preprocessing/ ./preprocessing/
COPY outputs/checkpoints/ ./outputs/checkpoints/
COPY scripts/ ./scripts/

# Create persistent storage mountpoints
RUN mkdir -p /app/backend/uploads/medical_storage \
             /app/backend/storage/reports \
             /app/backend/static

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || exit 1

CMD ["python", "scripts/run_backend.py"]

