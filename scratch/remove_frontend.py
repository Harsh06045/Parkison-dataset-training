"""
Safely backup frontend source (excluding node_modules/dist) and completely remove frontend directory.
"""

import os
import shutil
import zipfile

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIR = os.path.join(PROJECT_ROOT, "frontend")
BACKUP_DIR = os.path.join(PROJECT_ROOT, "backend", "storage", "backups")
BACKUP_ZIP = os.path.join(BACKUP_DIR, "frontend_src_backup.zip")

def backup_frontend_source():
    if not os.path.exists(FRONTEND_DIR):
        print("Frontend directory does not exist.")
        return
    
    os.makedirs(BACKUP_DIR, exist_ok=True)
    print(f"Creating safety archive of frontend source in {BACKUP_ZIP}...")
    with zipfile.ZipFile(BACKUP_ZIP, "w", zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(FRONTEND_DIR):
            # Exclude node_modules, dist, .git
            if "node_modules" in root or "dist" in root:
                continue
            for file in files:
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, FRONTEND_DIR)
                zipf.write(full_path, rel_path)
    
    print(f"Safety archive created: {os.path.getsize(BACKUP_ZIP)} bytes.")

def remove_frontend():
    if os.path.exists(FRONTEND_DIR):
        print(f"Removing {FRONTEND_DIR}...")
        shutil.rmtree(FRONTEND_DIR, ignore_errors=False)
        print("Frontend directory completely removed.")
    else:
        print("Frontend directory already removed.")

if __name__ == "__main__":
    backup_frontend_source()
    remove_frontend()

