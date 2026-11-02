# NeuroFusionAI – Deployment & Operations Guide

**System**: NeuroFusionAI – Multimodal Parkinson's Diagnostic Platform  
**Document**: Production Deployment, Docker Orchestration & CI/CD Operations  
**Generated**: 2026-11-02  

---

## 1. Local Development Quickstart

### Prerequisites
- Python 3.10+ (Python 3.11 recommended)
- Git
- Neon PostgreSQL Account (or local PostgreSQL)

### Setup Steps
```powershell
# 1. Clone repository
git clone https://github.com/your-org/NeuroFusionAI.git
cd NeuroFusionAI

# 2. Create and activate virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# 3. Install dependencies
pip install -r requirements.txt
pip install pydantic-settings python-dotenv pyjwt python-jose

# 4. Configure environment variables
cp .env.example .env
# Edit .env with your Neon PostgreSQL DATABASE_URL

# 5. Run verification suite
python scripts/verify_environment.py
python scripts/verify_database.py
python scripts/verify_models.py

# 6. Start backend server
python scripts/run_backend.py
```
Backend will be available at: `http://127.0.0.1:8000`  
Swagger Documentation: `http://127.0.0.1:8000/docs`

---

## 2. Docker & Containerized Deployment

### 2.1 Single Container Run
```bash
docker build -f backend/Dockerfile -t neurofusion-backend:latest .
docker run -d -p 8000:8000 \
  -e DATABASE_URL="postgresql+psycopg2://neondb_owner:***@ep-blue-field-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require" \
  --name neurofusion-backend neurofusion-backend:latest
```

### 2.2 Docker Compose Orchestration
```bash
docker compose up -d --build
```
Check health:
```bash
docker compose ps
curl http://localhost:8000/api/health
```

---

## 3. Production Monitoring & Health Probes

- **Liveness Probe**: `GET /api/health`
  - Verifies HTTP server is responding.
- **Readiness Probe**: `GET /api/health`
  - Verifies Neon Cloud PostgreSQL is connected and all 7 models are loaded in memory.
  - Returns `status: "healthy"` when ready, or `status: "degraded"` if any model or database connection fails.

