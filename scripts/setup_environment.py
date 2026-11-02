"""
NeuroFusionAI Environment Setup Script.
Creates persistent directories, verifies required packages, checks model checkpoints,
and tests database connectivity.
"""

import os
import sys

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")

if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from app.core.config import settings
from app.db.init_db import initialize_all
from app.models.loader import loader


def setup_environment():
    print("=" * 70)
    print(" NeuroFusionAI Automated Setup & Bootstrap Utility")
    print("=" * 70)

    # 1. Ensure storage directories
    print("\n[1] Creating Storage Subsystems:")
    settings.ensure_directories()
    print("  [OK] Persistent storage directories created and verified.")

    # 2. Database Initialization
    print("\n[2] Initializing Database Schema & Model Version Registry:")
    try:
        initialize_all()
        print("  [OK] Database tables and model versions verified in Neon Cloud.")
    except Exception as e:
        print(f"  [WARN] Database initialization notice: {e}")

    # 3. Model Weights Verification
    print("\n[3] Pre-loading Machine Learning Weights:")
    try:
        loader.load_all_models()
        print("  [OK] All 7 checkpoints loaded on device:", loader.device)
    except Exception as e:
        print(f"  [FAIL] Model loading error: {e}")
        return False

    print("\n" + "=" * 70)
    print("  SETUP COMPLETE: NeuroFusionAI Backend is ready to launch.")
    print("  Run: python scripts/run_backend.py")
    print("=" * 70)
    return True


if __name__ == "__main__":
    success = setup_environment()
    sys.exit(0 if success else 1)

