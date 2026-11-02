"""
NeuroFusionAI Environment Verification Script.
Validates environment settings, file paths, database URLs, and checkpoint paths
WITHOUT leaking secret values into console logs.
"""

import os
import sys

# Add project root and backend to sys.path
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")

if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from app.core.config import settings


def mask_secret(value: str) -> str:
    """Mask sensitive string leaving only first 4 and last 2 characters."""
    if not value or len(value) < 8:
        return "[CONFIGURED]"
    return f"{value[:4]}...{value[-2:]}"


def verify_environment():
    print("=" * 70)
    print(" NeuroFusionAI Environment & Configuration Verification")
    print("=" * 70)
    
    passed = True
    
    # 1. Application Settings
    print("\n[1] Application Parameters:")
    print(f"  [OK] APP_NAME:     {settings.APP_NAME}")
    print(f"  [OK] APP_ENV:      {settings.APP_ENV}")
    print(f"  [OK] HOST:PORT:    {settings.HOST}:{settings.PORT}")
    print(f"  [OK] API_VERSION:  {settings.API_VERSION}")
    print(f"  [OK] DEBUG:        {settings.DEBUG}")

    # 2. Database Connection Configuration
    print("\n[2] Database Configuration:")
    db_url = settings.get_effective_database_url()
    if db_url:
        print(f"  [OK] DATABASE_URL: {mask_secret(db_url)} (Length: {len(db_url)})")
        if "neon.tech" in db_url:
            print("       [Info] Neon Cloud PostgreSQL endpoint detected.")
    else:
        print("  [FAIL] DATABASE_URL not configured. Fallback SQLite will be used.")

    # 3. Security Credentials
    print("\n[3] Security & Authentication:")
    if settings.JWT_SECRET_KEY and settings.JWT_SECRET_KEY != "replace-this-with-a-secure-random-64-character-hex-string":
        print(f"  [OK] JWT_SECRET_KEY: {mask_secret(settings.JWT_SECRET_KEY)} (Length: {len(settings.JWT_SECRET_KEY)})")
    else:
        print("  [WARN] Using default developmental JWT secret. Set JWT_SECRET_KEY in production.")
    print(f"  [OK] JWT_ALGORITHM:  {settings.JWT_ALGORITHM}")
    print(f"  [OK] TOKEN_EXPIRY:   {settings.ACCESS_TOKEN_EXPIRE_MINUTES} minutes")

    # 4. Storage Directories
    print("\n[4] Storage & Upload Directories:")
    for label, path in [
        ("UPLOAD_DIR", settings.UPLOAD_DIR),
        ("STATIC_DIR", settings.STATIC_DIR),
        ("REPORT_DIR", settings.REPORT_DIR),
        ("STORAGE_ROOT", settings.STORAGE_ROOT)
    ]:
        exists = os.path.exists(path)
        writable = os.access(path, os.W_OK) if exists else False
        if exists and writable:
            print(f"  [OK] {label:<14}: {path} [Writable]")
        else:
            print(f"  [FAIL] {label:<14}: {path} [Missing/Read-only]")
            passed = False

    # 5. Machine Learning Checkpoints
    print("\n[5] Machine Learning Checkpoints:")
    for label, path in [
        ("MRI Model", settings.MRI_MODEL_PATH),
        ("Spiral Model", settings.SPIRAL_MODEL_PATH),
        ("Voice MLP", settings.VOICE_PYTORCH_PATH),
        ("Voice CatBoost", settings.VOICE_CATBOOST_PATH),
        ("Voice Scaler", settings.VOICE_SCALER_PATH),
        ("Telemonitor MLP", settings.TELEMONITOR_PYTORCH_PATH),
        ("Telemonitor XGB", settings.TELEMONITOR_XGB_PATH),
        ("Telemonitor Scaler", settings.TELEMONITOR_SCALER_PATH),
        ("Fusion Model", settings.FUSION_MODEL_PATH),
    ]:
        if os.path.exists(path):
            size_mb = os.path.getsize(path) / (1024 * 1024)
            print(f"  [OK] {label:<20}: {os.path.basename(path)} ({size_mb:.2f} MB)")
        else:
            print(f"  [FAIL] {label:<20}: Checkpoint file NOT found at {path}")
            passed = False

    print("\n" + "=" * 70)
    if passed:
        print("  ENVIRONMENT VERIFICATION RESULT: PASS - All Core Systems Configured.")
    else:
        print("  ENVIRONMENT VERIFICATION RESULT: FAIL - Resolve missing paths/weights.")
    print("=" * 70)
    return passed


if __name__ == "__main__":
    success = verify_environment()
    sys.exit(0 if success else 1)
