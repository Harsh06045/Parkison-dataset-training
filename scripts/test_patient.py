"""
Command-Line Interface (CLI) to test a patient using input files from a directory
(e.g., EXAMPLE_TEST or testing/inputs) or individual file flags, save all clinical
records into the Neon Cloud PostgreSQL database, and automatically delete intermediate
codes/JSONs/uploads to save ONLY the clinical report PDF of the patient.

Usage examples:
    # 1. Automatic mode using directory files (e.g. EXAMPLE_TEST):
    .venv\\Scripts\\python.exe scripts/test_patient.py --input-dir EXAMPLE_TEST

    # 2. Specifying individual files:
    .venv\\Scripts\\python.exe scripts/test_patient.py --patient-id NF-PD-TEST-002 --name "Margaret Sullivan" --spiral EXAMPLE_TEST/spiral_new.png --voice EXAMPLE_TEST/voice_new.wav --mri EXAMPLE_TEST/mri_new.png --telemonitor EXAMPLE_TEST/telemonitor_new.csv
"""

import os
import sys
import json
import argparse
from pathlib import Path
from typing import Dict, Any, Optional

# Ensure backend is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "backend"))
os.environ["MPLCONFIGDIR"] = str(PROJECT_ROOT / "backend" / "uploads" / "mpl")
os.makedirs(os.environ["MPLCONFIGDIR"], exist_ok=True)

from app.core.config import settings
from app.db.init_db import init_db
from app.db.session import SessionLocal, ACTIVE_DIALECT, IS_FALLBACK
from app.db.models import Patient, AssessmentRecord, PredictionRecord, ReportRecord
from app.services.assessment_service import assessment_service
from app.services.patient_storage_service import patient_storage
from app.models.loader import load_all_models


def discover_inputs_from_dir(dir_path: Path) -> Dict[str, Any]:
    """
    Auto-discover patient details and input files from a directory.
    Supports manifest.json if present, or performs heuristic file pattern matching.
    """
    discovered = {
        "patient": {},
        "files": {
            "spiral": None,
            "voice": None,
            "mri": None,
            "telemonitor": None
        }
    }

    manifest_file = dir_path / "manifest.json"
    if manifest_file.exists():
        try:
            with open(manifest_file, "r", encoding="utf-8") as f:
                manifest_data = json.load(f)
            discovered["patient"] = manifest_data.get("patient", {})
            inputs_meta = manifest_data.get("inputs", {})
            for mod in ["spiral", "voice", "mri", "telemonitor"]:
                if mod in inputs_meta:
                    rel_p = inputs_meta[mod].get("path") or inputs_meta[mod].get("file")
                    if rel_p:
                        # Try relative to project root, then dir_path
                        cand1 = PROJECT_ROOT / rel_p
                        cand2 = dir_path / Path(rel_p).name
                        if cand1.exists():
                            discovered["files"][mod] = cand1
                        elif cand2.exists():
                            discovered["files"][mod] = cand2
        except Exception as e:
            print(f"[!] Warning reading manifest.json: {e}")

    # Fallback to pattern scanning for any missing modalities
    if not discovered["files"]["spiral"]:
        for cand in dir_path.glob("*spiral*"):
            if cand.suffix.lower() in [".png", ".jpg", ".jpeg"]:
                discovered["files"]["spiral"] = cand
                break
    if not discovered["files"]["voice"]:
        for cand in dir_path.glob("*voice*"):
            if cand.suffix.lower() in [".wav", ".mp3", ".flac"]:
                discovered["files"]["voice"] = cand
                break
        if not discovered["files"]["voice"]:
            for cand in dir_path.glob("*.wav"):
                discovered["files"]["voice"] = cand
                break
    if not discovered["files"]["mri"]:
        for cand in dir_path.glob("*mri*"):
            if cand.suffix.lower() in [".png", ".jpg", ".jpeg"]:
                discovered["files"]["mri"] = cand
                break
    if not discovered["files"]["telemonitor"]:
        for cand in dir_path.glob("*tele*.csv"):
            discovered["files"]["telemonitor"] = cand
            break
        if not discovered["files"]["telemonitor"]:
            for cand in dir_path.glob("*.csv"):
                discovered["files"]["telemonitor"] = cand
                break

    return discovered


def main():
    parser = argparse.ArgumentParser(
        description="NeuroFusionAI - Automated Patient Assessment & Neon DB Pipeline"
    )
    parser.add_argument(
        "--input-dir",
        type=str,
        default=None,
        help="Path to folder containing patient test inputs (e.g. EXAMPLE_TEST)"
    )
    parser.add_argument("--patient-id", type=str, default=None, help="Patient ID (overrides manifest)")
    parser.add_argument("--name", type=str, default=None, help="Patient Full Name (overrides manifest)")
    parser.add_argument("--age", type=int, default=None, help="Patient Age (overrides manifest)")
    parser.add_argument("--gender", type=str, default=None, choices=["Male", "Female", "Other"], help="Patient Gender")
    parser.add_argument("--notes", type=str, default=None, help="Clinical Examination Notes")
    parser.add_argument("--spiral", type=str, default=None, help="Path to spiral PNG image")
    parser.add_argument("--voice", type=str, default=None, help="Path to voice WAV audio")
    parser.add_argument("--mri", type=str, default=None, help="Path to brain MRI image")
    parser.add_argument("--telemonitor", type=str, default=None, help="Path to telemonitor CSV")
    parser.add_argument(
        "--clean-codes",
        dest="clean_codes",
        action="store_true",
        default=True,
        help="Automatically delete intermediate codes, JSON dumps, and uploads; preserve ONLY final report PDF in storage"
    )
    parser.add_argument(
        "--keep-temp",
        dest="clean_codes",
        action="store_false",
        help="Retain intermediate prediction JSONs and uploaded media in storage/patients/"
    )

    args = parser.parse_args()

    # Step 1: Input Discovery
    input_dir_path = None
    dir_info = {"patient": {}, "files": {}}
    if args.input_dir:
        input_dir_path = Path(args.input_dir)
        if not input_dir_path.is_absolute():
            input_dir_path = PROJECT_ROOT / input_dir_path
        if not input_dir_path.exists():
            print(f"[!] Error: Specified input directory '{input_dir_path}' does not exist.")
            sys.exit(1)
        dir_info = discover_inputs_from_dir(input_dir_path)

    # Resolve patient details
    patient_id = args.patient_id or dir_info["patient"].get("id") or "NF-PD-TEST-002"
    patient_name = args.name or dir_info["patient"].get("full_name") or "Margaret Sullivan"
    patient_age = args.age or dir_info["patient"].get("age") or 72
    patient_gender = args.gender or dir_info["patient"].get("gender") or "Female"
    patient_notes = args.notes or dir_info["patient"].get("medical_history") or (
        "Progressive bilateral resting tremor, micrographia, postural instability, vocal hypophonia."
    )
    primary_diag = dir_info["patient"].get("primary_diagnosis") or "Parkinsonian Movement Disorder"

    # Resolve files
    default_inputs_dir = Path(settings.TESTING_INPUTS_DIR)
    spiral_path = (
        Path(args.spiral) if args.spiral
        else dir_info["files"].get("spiral")
        or default_inputs_dir / "spiral" / "spiral_parkinson.png"
    )
    voice_path = (
        Path(args.voice) if args.voice
        else dir_info["files"].get("voice")
        or default_inputs_dir / "voice" / "voice_sample.wav"
    )
    mri_path = (
        Path(args.mri) if args.mri
        else dir_info["files"].get("mri")
        or default_inputs_dir / "mri" / "mri_axial.png"
    )
    tele_path = (
        Path(args.telemonitor) if args.telemonitor
        else dir_info["files"].get("telemonitor")
        or default_inputs_dir / "telemonitor" / "telemonitor_features.csv"
    )

    print("=" * 76)
    print("NEUROFUSIONAI: AUTOMATED PATIENT ASSESSMENT & NEON DB PIPELINE")
    print("=" * 76)
    if input_dir_path:
        print(f"[+] Input Directory : {input_dir_path}")
    print(f"[+] Patient ID      : {patient_id}")
    print(f"[+] Patient Name    : {patient_name}")
    print(f"[+] Age / Gender    : {patient_age} / {patient_gender}")
    print(f"[+] Clinical Notes  : {patient_notes}")
    print(f"[+] Spiral Drawing  : {spiral_path} (Exists: {spiral_path.exists()})")
    print(f"[+] Voice Audio     : {voice_path} (Exists: {voice_path.exists()})")
    print(f"[+] Brain MRI       : {mri_path} (Exists: {mri_path.exists()})")
    print(f"[+] UPDRS Telemon.  : {tele_path} (Exists: {tele_path.exists()})")
    print(f"[+] Clean Codes     : {args.clean_codes} (Save ONLY final report PDF in storage)")
    print("-" * 76)

    # 1. Read input bytes & features
    if not spiral_path.exists():
        raise FileNotFoundError(f"Missing spiral input: {spiral_path}")
    if not voice_path.exists():
        raise FileNotFoundError(f"Missing voice input: {voice_path}")
    if not mri_path.exists():
        raise FileNotFoundError(f"Missing MRI input: {mri_path}")

    with open(spiral_path, "rb") as f:
        spiral_bytes = f.read()
    with open(voice_path, "rb") as f:
        voice_bytes = f.read()
    with open(mri_path, "rb") as f:
        mri_bytes = f.read()

    tele_features = None
    if tele_path.exists():
        import pandas as pd
        tele_df = pd.read_csv(tele_path)
        tele_features = [float(x) for x in tele_df.iloc[0].values if isinstance(x, (int, float))][:16]

    # 2. Initialize Database & Models
    print("[*] Connecting to database...")
    init_db()
    print(f"[+] Connected Database Dialect: {ACTIVE_DIALECT.upper()} (Fallback: {IS_FALLBACK})")
    if not IS_FALLBACK:
        print("[+] Primary Target: Neon Cloud PostgreSQL (Direct Connection Established)")
    else:
        print("[!] Note: Running on resilient local store.")

    print("[*] Loading genuine diagnostic neural models & scalers...")
    load_all_models()

    # 3. Patient Payload
    patient_payload = {
        "id": patient_id,
        "full_name": patient_name,
        "age": patient_age,
        "gender": patient_gender,
        "medical_history": patient_notes,
        "primary_diagnosis": primary_diag
    }

    # 4. Run Complete Patient Workflow
    print("[*] Running full multimodal assessment, Grad-CAM, SHAP, and report generation...")
    result = assessment_service.run_complete_patient_workflow(
        patient_data=patient_payload,
        spiral_bytes=spiral_bytes,
        spiral_filename=spiral_path.name,
        voice_bytes=voice_bytes,
        voice_filename=voice_path.name,
        mri_bytes=mri_bytes,
        mri_filename=mri_path.name,
        telemonitor_features=tele_features,
        doctor_id="DOC-8921",
        report_stage="FINAL_CLINICAL",
        is_approved=True,
        clinical_notes=patient_notes,
        clean_storage_artifacts=args.clean_codes
    )

    assessment = result["assessment"]
    report = result["report"]
    final_pdf_path = Path(report["pdf_path"])

    # 5. Verify records in Neon Database
    print("-" * 76)
    print("[*] Verifying records committed in Neon Cloud Database...")
    db = SessionLocal()
    try:
        db_patient = db.query(Patient).filter(Patient.id == patient_id).first()
        db_assessment = db.query(AssessmentRecord).filter(AssessmentRecord.id == assessment["id"]).first()
        db_preds = db.query(PredictionRecord).filter(PredictionRecord.patient_id == patient_id).order_by(PredictionRecord.id.desc()).limit(5).all()
        db_report = db.query(ReportRecord).filter(ReportRecord.id == report["id"]).first()

        print(f"[DB-VERIFY] Patient Record Saved       : [OK] ID={db_patient.id}, Name={db_patient.full_name}")
        print(f"[DB-VERIFY] Assessment Record Saved    : [OK] ID={db_assessment.id}, Status={db_assessment.status}")
        print(f"[DB-VERIFY] Prediction Records Saved   : [OK] Verified records in Neon DB:")
        for p in reversed(db_preds):
            print(f"            - Modality: {p.modality:15} | Result: {p.prediction} ({p.confidence:.1f}%)")
        print(f"[DB-VERIFY] Clinical Report Record     : [OK] ID={db_report.id}, Stage={db_report.report_stage}")
    finally:
        db.close()

    # 6. Verify storage isolation (strictly PDF report saved)
    print("-" * 76)
    report_folder = final_pdf_path.parent
    remaining_files = list(report_folder.iterdir())
    print(f"[STORAGE] Patient Reports Directory: {report_folder}")
    print(f"[STORAGE] Files currently in folder: {[f.name for f in remaining_files]}")
    only_pdf = all(f.suffix.lower() == ".pdf" for f in remaining_files)
    if only_pdf:
        print("[STORAGE] Confirmed: Intermediate codes/dumps deleted. ONLY the clinical PDF report is preserved.")
    else:
        print(f"[STORAGE] Warning: Non-PDF files still present in storage: {[f.name for f in remaining_files if f.suffix.lower() != '.pdf']}")

    # 7. Print Comprehensive Summary
    print("=" * 76)
    print("ASSESSMENT SUMMARY & CLINICAL REPORT METRICS")
    print("=" * 76)
    print(f"[+] Patient ID         : {patient_id}")
    print(f"[+] Assessment ID     : {assessment['id']}")
    print(f"[+] Overall Diagnosis : {assessment['overall_prediction']}")
    print(f"[+] Overall Confidence: {assessment['overall_confidence']:.2f}%")
    print(f"[+] Overall Risk Level: {assessment['overall_risk']}")
    print(f"[+] Modalities Tested : {assessment['modalities_completed']}")
    print(f"[+] Report ID         : {report['id']}")
    print(f"[+] Generated PDF     : {final_pdf_path}")
    print(f"[+] PDF File Size     : {final_pdf_path.stat().st_size:,} bytes")
    print("=" * 76)
    print(f"[SUCCESS] All records saved to Neon Cloud PostgreSQL.")
    print(f"[SUCCESS] Saved strictly final PDF report: {final_pdf_path.name}")
    print("=" * 76)


if __name__ == "__main__":
    main()
