"""
Safe repository cleanup execution script.
Executes cleanup for approved categories:
1. Category 1: Definitely Unnecessary (Parkison-dataset-training nested clone, catboost_info, run_code_cmd, blank/silent test scratch)
2. Category 2: Intermediate epoch checkpoints (outputs/checkpoints/*/epoch_*.pth), preserving all best.pth and latest.pth
"""

import os
import shutil
import glob

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def remove_path(rel_path):
    p = os.path.join(PROJECT_ROOT, rel_path)
    if os.path.exists(p):
        if os.path.isdir(p):
            shutil.rmtree(p, ignore_errors=True)
            print(f"[REMOVED DIR]  {rel_path}")
        else:
            os.remove(p)
            print(f"[REMOVED FILE] {rel_path}")

def clean_category_1():
    print("--- Executing Category 1 Cleanup ---")
    remove_path("Parkison-dataset-training")
    remove_path("catboost_info")
    remove_path("run_code_cmd")
    remove_path("scratch/blank_test.png")
    remove_path("scratch/silent_test.wav")
    
    # Clean non-venv __pycache__
    pycache_count = 0
    for root, dirs, files in os.walk(PROJECT_ROOT):
        if ".venv" in root or "node_modules" in root:
            continue
        for d in dirs:
            if d == "__pycache__":
                full_d = os.path.join(root, d)
                try:
                    shutil.rmtree(full_d, ignore_errors=True)
                    pycache_count += 1
                except Exception:
                    pass
    print(f"[PURGED]       {pycache_count} __pycache__ directories\n")

def clean_category_2_epoch_checkpoints():
    print("--- Executing Category 2 Cleanup: Intermediate Epoch Checkpoints ---")
    checkpoints_dir = os.path.join(PROJECT_ROOT, "outputs", "checkpoints")
    if not os.path.exists(checkpoints_dir):
        print("No checkpoints dir found.")
        return

    epoch_files = glob.glob(os.path.join(checkpoints_dir, "**", "epoch_*.pth"), recursive=True)
    freed_bytes = 0
    removed_count = 0

    for ep in epoch_files:
        try:
            size = os.path.getsize(ep)
            os.remove(ep)
            freed_bytes += size
            removed_count += 1
        except Exception as e:
            print(f"Error removing {ep}: {e}")

    freed_mb = freed_bytes / (1024 * 1024)
    freed_gb = freed_mb / 1024
    print(f"[REMOVED]      {removed_count} intermediate epoch checkpoint files")
    print(f"[FREED SPACE]  {freed_mb:.1f} MB ({freed_gb:.2f} GB)")
    print("Preserved all best.pth, latest.pth, *_best_model.*, and scaler artifacts.\n")

if __name__ == "__main__":
    clean_category_1()
    clean_category_2_epoch_checkpoints()
    print("Repository cleanup execution completed successfully.")

