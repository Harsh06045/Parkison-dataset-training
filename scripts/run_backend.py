"""
NeuroFusionAI Backend Server Launcher.
Loads configuration, binds host/port, and starts Uvicorn with ASGI Lifespan.
"""

import os
import sys
import uvicorn

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")

if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from app.core.config import settings

def run_server():
    print(f"Starting {settings.APP_NAME}...")
    print(f"Listening on http://{settings.HOST}:{settings.PORT}")
    print(f"Swagger Documentation available at http://{settings.HOST}:{settings.PORT}/docs")
    
    uvicorn.run(
        "app.main:app",
        app_dir=BACKEND_DIR,
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )

if __name__ == "__main__":
    run_server()

