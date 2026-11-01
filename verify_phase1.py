import os
import glob
import hashlib
import json
import pandas as pd
import numpy as np
import torch

print("=================================================================")
print("             PHASE 1 - COMPREHENSIVE VERIFICATION")
print("=================================================================\n")

# 1. Voice
print("--- 1. VOICE MODALITY (Oxford Parkinson's Voice) ---")
voice_splits = {}
for split in ['train', 'validation', 'test']:
    p = f"datasets/{split}/voice/oxford_{split}.csv"
    if os.path.exists(p):
        df = pd.read_csv(p)
        voice_splits[split] = df
        counts = df['status'].value_counts().to_dict() if 'status' in df.columns else {}
        print(f"  [{split}] Shape: {df.shape}, Columns: {list(df.columns[:4])}... (total {len(df.columns)})")
        print(f"         Class distribution: {counts}")
        if 'name' in df.columns:
            # Oxford name format: phon_R01_S01_1 -> subject S01
            subjects = df['name'].apply(lambda x: x.split('_')[2] if len(x.split('_')) > 2 else x).unique()
            print(f"         Unique subjects ({len(subjects)}): {subjects[:5]}...")

# 2. Telemonitoring
print("\n--- 2. TELEMONITORING MODALITY (Parkinsons Telemonitoring UPDRS) ---")
tele_splits = {}
for split in ['train', 'validation', 'test']:
    p = f"datasets/{split}/telemonitoring/telemonitor_{split}.csv"
    if os.path.exists(p):
        df = pd.read_csv(p)
        tele_splits[split] = df
        sub_col = 'subject#' if 'subject#' in df.columns else None
        subs = df[sub_col].nunique() if sub_col else 0
        total_updrs_mean = df['total_UPDRS'].mean() if 'total_UPDRS' in df.columns else None
        motor_updrs_mean = df['motor_UPDRS'].mean() if 'motor_UPDRS' in df.columns else None
        print(f"  [{split}] Shape: {df.shape}, Features: {len(df.columns)}, Unique Subjects: {subs}")
        if total_updrs_mean:
            print(f"         total_UPDRS mean: {total_updrs_mean:.2f}, motor_UPDRS mean: {motor_updrs_mean:.2f}")

# 3. MRI
print("\n--- 3. MRI MODALITY (Neuroimaging Brain Scans) ---")
mri_splits = {}
for split in ['train', 'validation', 'test']:
    norm_p = f"datasets/{split}/mri/normal"
    park_p = f"datasets/{split}/mri/parkinson"
    n_files = glob.glob(f"{norm_p}/*.*") if os.path.exists(norm_p) else []
    p_files = glob.glob(f"{park_p}/*.*") if os.path.exists(park_p) else []
    mri_splits[split] = {'normal': n_files, 'parkinson': p_files}
    print(f"  [{split}] Normal: {len(n_files)}, Parkinson: {len(p_files)}, Total: {len(n_files) + len(p_files)}")

# 4. Spiral
print("\n--- 4. SPIRAL MODALITY (HandPD & Kinematic Spiral Drawings) ---")
spiral_splits = {}
for split in ['train', 'validation', 'test']:
    norm_p = f"datasets/{split}/images/normal"
    park_p = f"datasets/{split}/images/parkinson"
    n_files = glob.glob(f"{norm_p}/*.*") if os.path.exists(norm_p) else []
    p_files = glob.glob(f"{park_p}/*.*") if os.path.exists(park_p) else []
    spiral_splits[split] = {'normal': n_files, 'parkinson': p_files}
    print(f"  [{split}] Normal: {len(n_files)}, Parkinson: {len(p_files)}, Total: {len(n_files) + len(p_files)}")

# 5. Data Leakage Checks
print("\n--- 5. DATA LEAKAGE AUDIT ---")
# Check Voice subject overlap
if 'train' in voice_splits and 'test' in voice_splits:
    train_subs = set(voice_splits['train']['name'].apply(lambda x: x.split('_')[2] if len(x.split('_')) > 2 else x))
    test_subs = set(voice_splits['test']['name'].apply(lambda x: x.split('_')[2] if len(x.split('_')) > 2 else x))
    val_subs = set(voice_splits['validation']['name'].apply(lambda x: x.split('_')[2] if len(x.split('_')) > 2 else x)) if 'validation' in voice_splits else set()
    overlap_tv = train_subs.intersection(test_subs)
    overlap_tval = train_subs.intersection(val_subs)
    print(f"  Voice Subject Overlap (Train vs Test): {len(overlap_tv)} subjects {overlap_tv}")
    print(f"  Voice Subject Overlap (Train vs Val): {len(overlap_tval)} subjects {overlap_tval}")

# Check Telemonitoring subject overlap
if 'train' in tele_splits and 'test' in tele_splits and 'subject#' in tele_splits['train'].columns:
    train_subs = set(tele_splits['train']['subject#'].unique())
    test_subs = set(tele_splits['test']['subject#'].unique())
    val_subs = set(tele_splits['validation']['subject#'].unique()) if 'validation' in tele_splits else set()
    overlap_tv = train_subs.intersection(test_subs)
    overlap_tval = train_subs.intersection(val_subs)
    print(f"  Telemonitoring Subject Overlap (Train vs Test): {len(overlap_tv)} subjects {overlap_tv}")
    print(f"  Telemonitoring Subject Overlap (Train vs Val): {len(overlap_tval)} subjects {overlap_tval}")

# Check Image Hashes for MRI and Spiral
def get_hashes(file_list):
    hashes = {}
    for f in file_list:
        with open(f, 'rb') as fp:
            h = hashlib.md5(fp.read()).hexdigest()
            hashes[h] = f
    return hashes

train_mri_h = get_hashes(mri_splits['train']['normal'] + mri_splits['train']['parkinson'])
test_mri_h = get_hashes(mri_splits['test']['normal'] + mri_splits['test']['parkinson'])
mri_overlap = set(train_mri_h.keys()).intersection(set(test_mri_h.keys()))
print(f"  MRI Hash Exact Match (Train vs Test): {len(mri_overlap)} duplicate files")

train_sp_h = get_hashes(spiral_splits['train']['normal'] + spiral_splits['train']['parkinson'])
test_sp_h = get_hashes(spiral_splits['test']['normal'] + spiral_splits['test']['parkinson'])
sp_overlap = set(train_sp_h.keys()).intersection(set(test_sp_h.keys()))
print(f"  Spiral Hash Exact Match (Train vs Test): {len(sp_overlap)} duplicate files")

print("\n--- 6. CHECKPOINTS AND ARTIFACT INVENTORY ---")
checkpoints = [
    ("mri_best.pth", "outputs/checkpoints/mri_best.pth"),
    ("image_best.pth", "outputs/checkpoints/image_best.pth"),
    ("voice_mlp_best.pth", "outputs/checkpoints/voice_mlp_best.pth"),
    ("voice_best_model.pkl", "outputs/checkpoints/voice_best_model.pkl"),
    ("telemonitor_mlp_best.pth", "outputs/checkpoints/telemonitor_mlp_best.pth"),
    ("telemonitor_best_model.pkl", "outputs/checkpoints/telemonitor_best_model.pkl"),
    ("fusion_best.pth", "outputs/checkpoints/fusion_best.pth"),
    ("spiral_best_model.pth", "outputs/checkpoints/spiral_best_model.pth"),
]

for name, path in checkpoints:
    if os.path.exists(path):
        sz_mb = os.path.getsize(path) / (1024 * 1024)
        print(f"  ✓ {name:26s}: Present ({sz_mb:.2f} MB)")
    else:
        print(f"  ✗ {name:26s}: MISSING!")

