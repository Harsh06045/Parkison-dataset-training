import os
import shutil
import zipfile

# Directory list to create
dirs = [
    "datasets/raw_spiral/normal",
    "datasets/raw_spiral/parkinson",
    "datasets/mri",
    "datasets/voice/oxford",
    "datasets/voice/telemonitoring",
    "datasets/voice/multiple_recordings",
    "datasets/voice/connected_speech",
    "datasets/images",
    "datasets/processed",
    "datasets/train",
    "datasets/validation",
    "datasets/test",
    "notebooks",
    "preprocessing",
    "models",
    "outputs/checkpoints",
    "outputs/logs",
    "outputs/plots",
    "outputs/reports",
]

def create_structure():
    print("=== Creating Directory Structure ===")
    for d in dirs:
        os.makedirs(d, exist_ok=True)
        print(f"Created/Verified directory: {d}")
        
    # Create empty init files
    for init_dir in ["preprocessing", "models"]:
        init_file = os.path.join(init_dir, "__init__.py")
        with open(init_file, "a"):
            pass
        print(f"Verified __init__.py in: {init_dir}")

def extract_datasets():
    print("\n=== Extracting Datasets ===")
    archive_zip = r"D:\DATASETS\archive.zip"
    parkinsons_zip = r"D:\DATASETS\parkinsons.zip"
    
    # 1. Extract Images
    if os.path.exists(archive_zip):
        print(f"Extracting drawings from {archive_zip}...")
        with zipfile.ZipFile(archive_zip, 'r') as zip_ref:
            namelist = zip_ref.namelist()
            
            # Extract normal images
            normal_files = [x for x in namelist if x.startswith("parkinsons_dataset/normal/") and x.lower().endswith(('.png', '.jpg', '.jpeg'))]
            for f in normal_files:
                filename = os.path.basename(f)
                if filename:
                    dest = os.path.join("datasets/raw_spiral/normal", filename)
                    with zip_ref.open(f) as src, open(dest, "wb") as dst:
                        shutil.copyfileobj(src, dst)
            print(f"Extracted {len(normal_files)} normal control drawings.")
            
            # Extract parkinson images
            park_files = [x for x in namelist if x.startswith("parkinsons_dataset/parkinson/") and x.lower().endswith(('.png', '.jpg', '.jpeg'))]
            for f in park_files:
                filename = os.path.basename(f)
                if filename:
                    dest = os.path.join("datasets/raw_spiral/parkinson", filename)
                    with zip_ref.open(f) as src, open(dest, "wb") as dst:
                        shutil.copyfileobj(src, dst)
            print(f"Extracted {len(park_files)} Parkinson's drawings.")
    else:
        print(f"Warning: {archive_zip} not found.")

    # 2. Extract Voice Datasets
    if os.path.exists(parkinsons_zip):
        print(f"Extracting voice datasets from {parkinsons_zip}...")
        with zipfile.ZipFile(parkinsons_zip, 'r') as zip_ref:
            namelist = zip_ref.namelist()
            
            # Oxford Classification files
            if "parkinsons.data" in namelist:
                with zip_ref.open("parkinsons.data") as src, open("datasets/voice/oxford/parkinsons.data", "wb") as dst:
                    shutil.copyfileobj(src, dst)
                print("Extracted: datasets/voice/oxford/parkinsons.data")
            if "parkinsons.names" in namelist:
                with zip_ref.open("parkinsons.names") as src, open("datasets/voice/oxford/parkinsons.names", "wb") as dst:
                    shutil.copyfileobj(src, dst)
                print("Extracted: datasets/voice/oxford/parkinsons.names")
                
            # Telemonitoring progression files
            tele_data_path = "telemonitoring/parkinsons_updrs.data"
            if tele_data_path in namelist:
                with zip_ref.open(tele_data_path) as src, open("datasets/voice/telemonitoring/parkinsons_updrs.data", "wb") as dst:
                    shutil.copyfileobj(src, dst)
                print("Extracted: datasets/voice/telemonitoring/parkinsons_updrs.data")
                
            tele_names_path = "telemonitoring/parkinsons_updrs.names"
            if tele_names_path in namelist:
                with zip_ref.open(tele_names_path) as src, open("datasets/voice/telemonitoring/parkinsons_updrs.names", "wb") as dst:
                    shutil.copyfileobj(src, dst)
                print("Extracted: datasets/voice/telemonitoring/parkinsons_updrs.names")
    else:
        print(f"Warning: {parkinsons_zip} not found.")

def main():
    create_structure()
    extract_datasets()
    print("\nProject setup and dataset extraction completed successfully!")

if __name__ == "__main__":
    main()
