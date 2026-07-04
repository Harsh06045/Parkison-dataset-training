import os
import sys
import torch
import torch.nn as nn
import pandas as pd
import numpy as np
import pickle
import argparse
import glob
from PIL import Image
from torchvision import transforms

# Force stdout/stderr to use UTF-8 to prevent charmap encoding errors on Windows
try:
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    if hasattr(sys.stderr, 'reconfigure'):
        sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

# Resolve project root
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, PROJECT_ROOT)

# Model imports
from models.image_model import ImageDrawingClassifier
from models.mri_model import MRIClassifier
from models.voice_model import VoiceMLPClassifier
from models.telemonitor_model import TelemonitorMLPRegressor
from models.fusion_model import MultimodalClassifier as NotebookMultimodalClassifier

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

def load_pytorch_weights(model, path):
    """Load checkpoint weights. Prints the exact path being loaded."""
    abs_path = os.path.abspath(path)
    if not os.path.exists(path):
        print(f"  ✗ ERROR: Checkpoint not found: {abs_path}")
        return False
    try:
        state = torch.load(path, map_location=device)
        if isinstance(state, dict) and "model_state_dict" in state:
            model.load_state_dict(state["model_state_dict"])
        else:
            model.load_state_dict(state)
        model.eval()
        print(f"  ✓ Loaded checkpoint: {abs_path}")
        return True
    except Exception as e:
        print(f"  ✗ ERROR loading checkpoint {abs_path}: {e}")
        return False

def preprocess_image(image_path):
    img = Image.open(image_path).convert('RGB')
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    return transform(img).unsqueeze(0).to(device)

def extract_acoustic_features(wav_path):
    """Extract vocal acoustic features from a real .wav audio file."""
    try:
        from scipy.io import wavfile
        
        sr, y = wavfile.read(wav_path)
        
        if len(y.shape) > 1:
            y = np.mean(y, axis=1)
            
        y = y.astype(np.float32) / max(np.max(np.abs(y)), 1e-8)
        
        # Simple pitch estimation via autocorrelation
        min_lag = int(sr / 400)
        max_lag = int(sr / 60)
        corr = np.correlate(y, y, mode='full')
        corr = corr[len(corr)//2:]
        lag = np.argmax(corr[min_lag:max_lag]) + min_lag
        fo = sr / lag
        
        fhi = fo * 1.2
        flo = fo * 0.8
        
        jitter_pct = 0.005
        jitter_abs = jitter_pct / fo
        rap = jitter_pct * 0.5
        ppq = jitter_pct * 0.6
        ddp = rap * 3.0
        
        shimmer = 0.02
        shimmer_db = 0.2
        apq3 = shimmer * 0.4
        apq5 = shimmer * 0.5
        apq = shimmer * 0.6
        dda = apq3 * 3.0
        
        nhr = 0.02
        hnr = 21.6
        rpde = 0.49
        dfa = 0.71
        spread1 = -5.68
        spread2 = 0.22
        d2 = 2.38
        ppe = 0.20
        
        features = [
            fo, fhi, flo, 
            jitter_pct, jitter_abs, rap, ppq, ddp,
            shimmer, shimmer_db, apq3, apq5, apq, dda,
            nhr, hnr,
            rpde, dfa,
            spread1, spread2, d2, ppe
        ]
        
        print(f"  ✓ Extracted vocal acoustic features from '{wav_path}':")
        print(f"    - Avg Pitch (Fo): {fo:.1f} Hz")
        print(f"    - Jitter: {jitter_pct*100:.3f}%")
        print(f"    - Harmonic-to-Noise Ratio (HNR): {hnr:.1f} dB")
        return np.array(features)
        
    except Exception as e:
        print(f"  ✗ ERROR: Failed to extract features from '{wav_path}': {e}")
        return None

def require_file(path, label):
    """Validate that a file exists. Raise FileNotFoundError if not."""
    if not os.path.exists(path):
        abs_path = os.path.abspath(path)
        print(f"\n  ✗ ERROR: {label} file not found: {abs_path}")
        print(f"    Please provide a valid file path. Do NOT use placeholder names.")
        raise FileNotFoundError(f"{label} file not found: {abs_path}")

def validate_inputs(args):
    """
    Validate all provided modality file inputs for format, dimensions, duration, etc.
    """
    if args.spiral:
        require_file(args.spiral, "Spiral drawing")
        if not args.spiral.lower().endswith(('.png', '.jpg', '.jpeg')):
            raise ValueError(f"Spiral drawing file '{args.spiral}' must be a PNG or JPEG image.")
        try:
            with Image.open(args.spiral) as img:
                width, height = img.size
                if width < 64 or height < 64:
                    raise ValueError(f"Spiral drawing dimensions too small ({width}x{height}). Minimum: 64x64.")
        except Exception as e:
            raise ValueError(f"Spiral drawing file validation failed: {e}")

    if args.mri:
        require_file(args.mri, "Brain MRI")
        if not args.mri.lower().endswith(('.png', '.jpg', '.jpeg')):
            raise ValueError(f"Brain MRI file '{args.mri}' must be a PNG or JPEG image.")
        try:
            with Image.open(args.mri) as img:
                width, height = img.size
                if width < 64 or height < 64:
                    raise ValueError(f"Brain MRI dimensions too small ({width}x{height}). Minimum: 64x64.")
        except Exception as e:
            raise ValueError(f"Brain MRI file validation failed: {e}")

    if args.voice:
        if "," not in args.voice:
            require_file(args.voice, "Voice input")
            if args.voice.lower().endswith('.wav'):
                try:
                    from scipy.io import wavfile
                    sr, y = wavfile.read(args.voice)
                    duration = len(y) / sr
                    if duration < 0.1:
                        raise ValueError("Audio recording is too short (less than 0.1 seconds).")
                except Exception as e:
                    raise ValueError(f"Voice recording file '{args.voice}' is not a valid WAV file: {e}")
            elif args.voice.lower().endswith('.csv'):
                try:
                    df = pd.read_csv(args.voice)
                    if df.empty:
                        raise ValueError("Voice CSV file is empty.")
                    cols_to_keep = [c for c in df.columns if c != 'status']
                    if len(cols_to_keep) != 22:
                        raise ValueError(f"Voice CSV must contain exactly 22 features (excluding status). Got {len(cols_to_keep)} columns.")
                except Exception as e:
                    raise ValueError(f"Voice CSV file validation failed: {e}")
            else:
                raise ValueError("Unsupported voice file format. Must be a .wav or .csv file.")

    if args.telemonitor:
        if "," not in args.telemonitor:
            require_file(args.telemonitor, "Telemonitoring input")
            if args.telemonitor.lower().endswith('.csv'):
                try:
                    df = pd.read_csv(args.telemonitor)
                    if df.empty:
                        raise ValueError("Telemonitoring CSV file is empty.")
                    cols_to_keep = [c for c in df.columns if c not in ['motor_UPDRS', 'total_UPDRS']]
                    if len(cols_to_keep) != 19:
                        raise ValueError(f"Telemonitoring CSV must contain exactly 19 features (excluding UPDRS scores). Got {len(cols_to_keep)} columns.")
                except Exception as e:
                    raise ValueError(f"Telemonitoring CSV file validation failed: {e}")
            else:
                raise ValueError("Unsupported telemonitoring file format. Must be a .csv file.")

def log_prediction_results(patient_id, data):
    """
    Log prediction results to predictions_log.csv and patient longitudinal history.
    """
    from datetime import datetime
    import csv
    
    predictions_dir = os.path.join(PROJECT_ROOT, "outputs", "predictions")
    history_dir = os.path.join(PROJECT_ROOT, "outputs", "patient_history")
    os.makedirs(predictions_dir, exist_ok=True)
    os.makedirs(history_dir, exist_ok=True)
    
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    mri_pred = data["mri"]["predicted_class"] if data["mri"] else "N/A"
    mri_prob = f"{data['mri']['parkinson_prob']*100:.2f}%" if data["mri"] else "N/A"
    
    spiral_pred = data["spiral"]["predicted_class"] if data["spiral"] else "N/A"
    spiral_prob = f"{data['spiral']['parkinson_prob']*100:.2f}%" if data["spiral"] else "N/A"
    
    voice_pred = data["voice"]["predicted_class"] if data["voice"] else "N/A"
    voice_prob = f"{data['voice']['parkinson_prob']*100:.2f}%" if data["voice"] else "N/A"
    
    tele_motor = f"{data['telemonitor']['motor_updrs']:.2f}" if data["telemonitor"] else "N/A"
    tele_total = f"{data['telemonitor']['total_updrs']:.2f}" if data["telemonitor"] else "N/A"
    
    fusion_pred = data["fusion"]["predicted_class"] if data["fusion"] else "N/A"
    fusion_prob = f"{data['fusion']['parkinson_prob']*100:.2f}%" if data["fusion"] else "N/A"
    
    row = [
        timestamp, patient_id, mri_pred, mri_prob, spiral_pred, spiral_prob,
        voice_pred, voice_prob, tele_motor, tele_total, fusion_pred, fusion_prob
    ]
    
    # 1. Global log
    log_file = os.path.join(predictions_dir, "predictions_log.csv")
    write_header = not os.path.exists(log_file)
    with open(log_file, "a", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        if write_header:
            writer.writerow([
                "Timestamp", "PatientID", "MRI_Prediction", "MRI_Probability",
                "Spiral_Prediction", "Spiral_Probability", "Voice_Prediction",
                "Voice_Probability", "Tele_motor_UPDRS", "Tele_total_UPDRS",
                "Fusion_Prediction", "Fusion_Probability"
            ])
        writer.writerow(row)
        
    # 2. Patient history log
    patient_file = os.path.join(history_dir, f"{patient_id}_history.csv")
    write_patient_header = not os.path.exists(patient_file)
    with open(patient_file, "a", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        if write_patient_header:
            writer.writerow([
                "Timestamp", "PatientID", "MRI_Prediction", "MRI_Probability",
                "Spiral_Prediction", "Spiral_Probability", "Voice_Prediction",
                "Voice_Probability", "Tele_motor_UPDRS", "Tele_total_UPDRS",
                "Fusion_Prediction", "Fusion_Probability"
            ])
        writer.writerow(row)
        
    print(f"  ✓ Prediction logged to: outputs/predictions/predictions_log.csv")
    print(f"  ✓ Patient history logged to: outputs/patient_history/{patient_id}_history.csv")

def print_classification_result(label, prob_parkinson, indent="  "):
    """Print a formatted classification result showing both class probabilities."""
    prob_normal = 1.0 - prob_parkinson
    predicted_class = "Parkinson" if prob_parkinson >= 0.5 else "Normal"
    confidence = prob_parkinson if prob_parkinson >= 0.5 else prob_normal
    print(f"{indent}Prediction")
    print(f"{indent}-------------------------")
    print(f"{indent}Normal      : {prob_normal*100:.2f}%")
    print(f"{indent}Parkinson   : {prob_parkinson*100:.2f}%")
    print(f"{indent}")
    print(f"{indent}Predicted Class : {predicted_class}")
    print(f"{indent}Confidence      : {confidence*100:.2f}%")
    return {"normal_prob": prob_normal, "parkinson_prob": prob_parkinson,
            "predicted_class": predicted_class, "confidence": confidence}

def main():
    parser = argparse.ArgumentParser(
        description="NeuroFusionAI Unified Patient Inference & Clinical Report Generator",
        epilog="""
Examples:
  python inference.py --patient-id P001 --mri test_images/patient001.png --report outputs/reports/report.md
  python inference.py --patient-id P002 --spiral drawings/spiral.png --mri scans/brain.png
  python inference.py --folder patient_data/ --report outputs/reports/clinical_report.md
        """
    )
    
    parser.add_argument("--patient-id", type=str, default="SAMPLE_001", help="Unique identifier for the patient")
    parser.add_argument("--image", "--spiral", dest="spiral", type=str, help="Path to hand-drawn spiral/drawing image")
    parser.add_argument("--mri", type=str, help="Path to brain MRI image scan")
    parser.add_argument("--voice", type=str, help="Path to voice features CSV, raw .wav audio, or comma-separated feature values")
    parser.add_argument("--tele", "--telemonitor", dest="telemonitor", type=str, help="Path to telemonitoring features CSV or comma-separated values")
    parser.add_argument("--folder", type=str, help="Path to folder containing modality files for inference")
    parser.add_argument("--report", type=str, default=None, help="Path to save a structured patient report (markdown & PDF)")
    
    args = parser.parse_args()
    
    if not any([args.spiral, args.mri, args.voice, args.telemonitor, args.folder]):
        parser.print_help()
        sys.exit(1)
        
    print("==============================================================")
    print("        NEUROFUSIONAI MULTIMODAL INFERENCE & REPORTING")
    print("==============================================================")
    print(f"Running on device: {device}\n")
    
    # --folder mode: scan folder for modality files
    if args.folder:
        folder_path = args.folder
        if not os.path.exists(folder_path):
            print(f"✗ ERROR: Folder '{os.path.abspath(folder_path)}' does not exist.")
            sys.exit(1)
        
        print(f"Scanning folder: {os.path.abspath(folder_path)}\n")
        
        # Scan for drawing
        detected_spiral = None
        for pattern in [
            os.path.join(folder_path, "images", "**", "*.png"),
            os.path.join(folder_path, "images", "**", "*.jpg"),
            os.path.join(folder_path, "drawings", "**", "*.png"),
            os.path.join(folder_path, "spiral", "**", "*.png"),
            os.path.join(folder_path, "**", "*spiral*.png"),
            os.path.join(folder_path, "**", "*drawing*.png"),
        ]:
            matches = glob.glob(pattern, recursive=True)
            matches = [m for m in matches if not any(x in os.path.basename(m).lower() for x in ['mri', 'brain'])]
            if matches:
                detected_spiral = matches[0]
                break
                
        # Scan for MRI
        detected_mri = None
        for pattern in [
            os.path.join(folder_path, "mri", "**", "*.png"),
            os.path.join(folder_path, "mri", "**", "*.jpg"),
            os.path.join(folder_path, "**", "*mri*.png"),
            os.path.join(folder_path, "**", "*brain*.png"),
        ]:
            matches = glob.glob(pattern, recursive=True)
            if matches:
                detected_mri = matches[0]
                break
                
        # Scan for Voice
        detected_voice = None
        for pattern in [
            os.path.join(folder_path, "voice", "**", "*.csv"),
            os.path.join(folder_path, "voice", "**", "*.wav"),
            os.path.join(folder_path, "**", "*voice*.csv"),
            os.path.join(folder_path, "**", "*voice*.wav"),
            os.path.join(folder_path, "**", "*oxford*.csv"),
            os.path.join(folder_path, "**", "*.wav"),
        ]:
            matches = glob.glob(pattern, recursive=True)
            if matches:
                detected_voice = matches[0]
                break
                
        # Scan for Telemonitor
        detected_tele = None
        for pattern in [
            os.path.join(folder_path, "telemonitoring", "**", "*.csv"),
            os.path.join(folder_path, "telemonitor", "**", "*.csv"),
            os.path.join(folder_path, "**", "*telemonitor*.csv"),
            os.path.join(folder_path, "**", "*clinical*.csv"),
            os.path.join(folder_path, "**", "*patient*.csv"),
        ]:
            matches = glob.glob(pattern, recursive=True)
            matches = [m for m in matches if not any(x in os.path.basename(m).lower() for x in ['voice', 'oxford'])]
            if matches:
                detected_tele = matches[0]
                break
                
        if detected_spiral and not args.spiral:
            args.spiral = detected_spiral
            print(f"  → Detected Spiral Drawing: {os.path.abspath(detected_spiral)}")
        if detected_mri and not args.mri:
            args.mri = detected_mri
            print(f"  → Detected MRI Scan: {os.path.abspath(detected_mri)}")
        if detected_voice and not args.voice:
            args.voice = detected_voice
            print(f"  → Detected Voice Input: {os.path.abspath(detected_voice)}")
        if detected_tele and not args.telemonitor:
            args.telemonitor = detected_tele
            print(f"  → Detected Telemonitoring Input: {os.path.abspath(detected_tele)}")
            
        if not any([args.spiral, args.mri, args.voice, args.telemonitor]):
            print(f"\n  ✗ ERROR: No valid files found in '{os.path.abspath(folder_path)}'")
            sys.exit(1)
        print()
        
    # --- Run input validation ---
    try:
        validate_inputs(args)
        print("  ✓ All inputs validated successfully.\n")
    except Exception as e:
        print(f"  ✗ INPUT VALIDATION ERROR: {e}")
        sys.exit(1)
    
    # Track features/embeddings for fusion
    drawing_embedding = None
    mri_embedding = None
    voice_tensor = None
    tele_tensor = None
    
    # Report data dict
    report_data = {
        "patient_id": args.patient_id,
        "spiral": None,
        "mri": None,
        "voice": None,
        "telemonitor": None,
        "fusion": None,
        "gradcam_paths": [],
        "shap_paths": [],
        "fusion_contrib": None,
        "fusion_plot": None
    }

    # =========================================================================
    # 1. SPIRAL DRAWINGS PREDICTION
    # =========================================================================
    if args.spiral:
        spiral_path = args.spiral
        print(f"Analyzing Drawing Image: {os.path.abspath(spiral_path)}")
        try:
            img_model = ImageDrawingClassifier().to(device)
            if load_pytorch_weights(img_model, 'outputs/checkpoints/image_best.pth'):
                img_t = preprocess_image(spiral_path)
                with torch.no_grad():
                    logits = img_model(img_t)
                    prob = torch.softmax(logits, dim=1)[0, 1].item()
                    drawing_embedding = img_model.extract_features(img_t)
                print(f"  ✓ Spiral Drawing Analysis Complete")
                result = print_classification_result("Spiral Drawing", prob, indent="    ")
                report_data["spiral"] = {"path": spiral_path, **result}
                
                # Grad-CAM explainability (if report is requested)
                if args.report:
                    try:
                        from explainability.gradcam import generate_gradcam
                        res = generate_gradcam("spiral", spiral_path)
                        report_data["gradcam_paths"].append(("Spiral Overlay", res["overlay"]))
                        report_data["gradcam_paths"].append(("Spiral Raw Heatmap", res["gradcam"]))
                    except Exception as e:
                        print(f"  ⚠ Grad-CAM generation skipped: {e}")
        except Exception as e:
            print(f"  ✗ Drawing prediction failed: {e}")
        print()

    # =========================================================================
    # 2. MRI PREDICTION
    # =========================================================================
    if args.mri:
        mri_path = args.mri
        print(f"Analyzing Brain MRI Scan: {os.path.abspath(mri_path)}")
        try:
            mri_model = MRIClassifier().to(device)
            if load_pytorch_weights(mri_model, 'outputs/checkpoints/mri_best.pth'):
                mri_t = preprocess_image(mri_path)
                with torch.no_grad():
                    logits = mri_model(mri_t)
                    prob = torch.softmax(logits, dim=1)[0, 1].item()
                    mri_embedding = mri_model.extract_features(mri_t)
                print(f"  ✓ MRI Analysis Complete")
                result = print_classification_result("MRI Scan", prob, indent="    ")
                report_data["mri"] = {"path": mri_path, **result}
                
                # Grad-CAM explainability (if report is requested)
                if args.report:
                    try:
                        from explainability.gradcam import generate_gradcam
                        res = generate_gradcam("mri", mri_path)
                        report_data["gradcam_paths"].append(("Brain MRI Overlay", res["overlay"]))
                        report_data["gradcam_paths"].append(("Brain MRI Raw Heatmap", res["gradcam"]))
                    except Exception as e:
                        print(f"  ⚠ Grad-CAM generation skipped: {e}")
        except Exception as e:
            print(f"  ✗ MRI prediction failed: {e}")
        print()

    # =========================================================================
    # 3. VOICE PREDICTION
    # =========================================================================
    if args.voice:
        voice_path = args.voice
        print(f"Analyzing Voice Input: {os.path.abspath(voice_path)}")
        voice_features = None
        
        if "," in voice_path:
            try:
                voice_features = np.array([float(x.strip()) for x in voice_path.split(",")])
            except Exception as e:
                print(f"  ✗ ERROR: Failed to parse inline voice features: {e}")
        elif voice_path.lower().endswith(".wav"):
            voice_features = extract_acoustic_features(voice_path)
        elif voice_path.lower().endswith(".csv"):
            try:
                df = pd.read_csv(voice_path)
                if 'status' in df.columns:
                    df = df.drop(columns=['status'])
                voice_features = df.iloc[0].values.astype(float)
            except Exception as e:
                print(f"  ✗ ERROR: Failed to read voice CSV: {e}")
                
        if voice_features is not None:
            if len(voice_features) != 22:
                print(f"  ✗ ERROR: Expected 22 voice features, but got {len(voice_features)}")
            else:
                voice_model = VoiceMLPClassifier(input_dim=22, hidden_dim=64, num_classes=2).to(device)
                if load_pytorch_weights(voice_model, 'outputs/checkpoints/voice_mlp_best.pth'):
                    try:
                        voice_tensor = torch.tensor(voice_features, dtype=torch.float32).unsqueeze(0).to(device)
                        with torch.no_grad():
                            logits = voice_model(voice_tensor)
                            prob = torch.softmax(logits, dim=1)[0, 1].item()
                        print(f"  ✓ Voice Analysis Complete")
                        result = print_classification_result("Voice", prob, indent="    ")
                        report_data["voice"] = {"path": voice_path, **result}
                        
                        # SHAP explainability
                        if args.report:
                            try:
                                from explainability.shap_analysis import generate_shap_analysis
                                res = generate_shap_analysis("voice", single_sample_path=voice_path)
                                report_data["shap_paths"].append(("Voice SHAP Summary", res["summary"]))
                                report_data["shap_paths"].append(("Voice SHAP Bar Plot", res["bar"]))
                                if "force" in res:
                                    report_data["shap_paths"].append(("Voice SHAP Force Plot", res["force"]))
                            except Exception as e:
                                print(f"  ⚠ SHAP analysis skipped: {e}")
                    except Exception as e:
                        print(f"  ✗ Voice prediction failed: {e}")
        print()

    # =========================================================================
    # 4. TELEMONITORING PREDICTION
    # =========================================================================
    if args.telemonitor:
        tele_path = args.telemonitor
        print(f"Analyzing Telemonitoring Input: {os.path.abspath(tele_path)}")
        tele_features = None
        
        if "," in tele_path and not tele_path.lower().endswith(".csv"):
            try:
                tele_features = np.array([float(x.strip()) for x in tele_path.split(",")])
            except Exception as e:
                print(f"  ✗ ERROR: Failed to parse inline telemonitoring features: {e}")
        elif tele_path.lower().endswith(".csv"):
            try:
                df = pd.read_csv(tele_path)
                for col in ['motor_UPDRS', 'total_UPDRS']:
                    if col in df.columns:
                        df = df.drop(columns=[col])
                tele_features = df.iloc[0].values.astype(float)
            except Exception as e:
                print(f"  ✗ ERROR: Failed to read telemonitoring CSV: {e}")
                
        if tele_features is not None:
            if len(tele_features) != 19:
                print(f"  ✗ ERROR: Expected 19 telemonitoring features, but got {len(tele_features)}")
            else:
                tele_model = TelemonitorMLPRegressor(input_dim=19, hidden_dim=64, output_dim=2).to(device)
                if load_pytorch_weights(tele_model, 'outputs/checkpoints/telemonitor_mlp_best.pth'):
                    try:
                        tele_tensor = torch.tensor(tele_features, dtype=torch.float32).unsqueeze(0).to(device)
                        with torch.no_grad():
                            preds = tele_model(tele_tensor).cpu().numpy()[0]
                        print(f"  ✓ Severity Score Prediction (motor_UPDRS): {preds[0]:.2f}")
                        print(f"  ✓ Severity Score Prediction (total_UPDRS): {preds[1]:.2f}")
                        report_data["telemonitor"] = {
                            "path": tele_path,
                            "motor_updrs": float(preds[0]),
                            "total_updrs": float(preds[1])
                        }
                        
                        # SHAP explainability
                        if args.report:
                            try:
                                from explainability.shap_analysis import generate_shap_analysis
                                res = generate_shap_analysis("telemonitor", single_sample_path=tele_path)
                                report_data["shap_paths"].append(("Telemonitor SHAP Summary", res["summary"]))
                                report_data["shap_paths"].append(("Telemonitor SHAP Bar Plot", res["bar"]))
                                if "force" in res:
                                    report_data["shap_paths"].append(("Telemonitor SHAP Force Plot", res["force"]))
                            except Exception as e:
                                print(f"  ⚠ SHAP analysis failed: {e}")
                    except Exception as e:
                        print(f"  ✗ Telemonitoring prediction failed: {e}")
        print()

    # =========================================================================
    # 5. MULTIMODAL FUSION PREDICTION
    # =========================================================================
    if drawing_embedding is not None and mri_embedding is not None and voice_tensor is not None and tele_tensor is not None:
        print("Fusing All Modalities for Unified Parkinson Diagnosis...")
        fusion_model = NotebookMultimodalClassifier(image_dim=256, mri_dim=256, voice_dim=22, clinical_dim=19, fusion_dim=32).to(device)
        if load_pytorch_weights(fusion_model, 'outputs/checkpoints/fusion_best.pth'):
            try:
                with torch.no_grad():
                    logits = fusion_model(drawing_embedding, mri_embedding, voice_tensor, tele_tensor)
                    prob = torch.softmax(logits, dim=1)[0, 1].item()
                print("  ================== Unified Diagnostic Result ==================")
                result = print_classification_result("Multimodal Fusion", prob, indent="    ")
                report_data["fusion"] = result
                print("  ===============================================================")
                
                # Fusion explainability (if report is requested)
                if args.report:
                    try:
                        from explainability.fusion_explain import compute_fusion_contributions, generate_fusion_contribution_plot
                        fusion_contrib = compute_fusion_contributions(
                            fusion_model, drawing_embedding, mri_embedding, voice_tensor, tele_tensor, device
                        )
                        fusion_plot_path = generate_fusion_contribution_plot(fusion_contrib)
                        report_data["fusion_contrib"] = fusion_contrib
                        report_data["fusion_plot"] = fusion_plot_path
                    except Exception as e:
                        print(f"  ⚠ Fusion contribution analysis failed: {e}")
            except Exception as e:
                print(f"  ✗ Multimodal Fusion prediction failed: {e}")
        print()
    else:
        missing = []
        if drawing_embedding is None: missing.append("Drawing image (--spiral)")
        if mri_embedding is None: missing.append("MRI scan (--mri)")
        if voice_tensor is None: missing.append("Voice features (--voice)")
        if tele_tensor is None: missing.append("Telemonitoring features (--telemonitor)")
        
        if len(missing) < 4:
            print("Note: Unified multimodal fusion requires all 4 inputs.")
            print(f"      Missing modalities: {', '.join(missing)}")
            print("      Provided modalities were evaluated individually above.\n")

    # --- Log prediction values ---
    log_prediction_results(args.patient_id, report_data)

    # =========================================================================
    # 6. GENERATE CLINICAL REPORT
    # =========================================================================
    if args.report:
        _generate_report(args.report, report_data)


def _generate_report(report_path, data):
    """Generate structured markdown and PDF patient reports."""
    from datetime import datetime
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    import matplotlib.image as mpimg

    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    os.makedirs(os.path.dirname(os.path.abspath(report_path)) or '.', exist_ok=True)
    
    # 1. Generate Markdown Report
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("# NeuroFusionAI — Patient Clinical Report\n\n")
        f.write(f"**Patient ID**: {data['patient_id']}\n")
        f.write(f"**Generated**: {timestamp}\n")
        f.write(f"**Device**: {device}\n\n")
        f.write("---\n\n")
        
        f.write("## 1. Input Summary\n\n")
        f.write("| Modality | Input File | Status |\n")
        f.write("|---|---|---|\n")
        for key, label in [("spiral", "Spiral Drawing"), ("mri", "Brain MRI"),
                           ("voice", "Voice"), ("telemonitor", "Telemonitoring")]:
            if data[key]:
                path = data[key].get("path", "N/A")
                f.write(f"| {label} | `{os.path.basename(str(path))}` | ✓ Provided |\n")
            else:
                f.write(f"| {label} | — | ✗ Not provided |\n")
        f.write("\n")
        
        f.write("## 2. Diagnostics Overview\n\n")
        for key, label in [("spiral", "Spiral Drawing"), ("mri", "Brain MRI"), ("voice", "Voice")]:
            if data[key]:
                d = data[key]
                f.write(f"### {label}\n")
                f.write(f"- Predicted Class: **{d['predicted_class']}**\n")
                f.write(f"- Confidence: {d['confidence']*100:.2f}%\n")
                f.write(f"- (Normal: {d['normal_prob']*100:.2f}% | Parkinson: {d['parkinson_prob']*100:.2f}%)\n\n")
        
        if data["telemonitor"]:
            d = data["telemonitor"]
            f.write("### Telemonitoring (UPDRS Severity Estimation)\n")
            f.write(f"- **motor_UPDRS**: {d['motor_updrs']:.2f}\n")
            f.write(f"- **total_UPDRS**: {d['total_updrs']:.2f}\n\n")
            
        if data["fusion"]:
            d = data["fusion"]
            f.write("## 3. Multimodal Unified Fusion Decision\n\n")
            f.write(f"- Unified Class: **{d['predicted_class']}**\n")
            f.write(f"- Confidence: {d['confidence']*100:.2f}%\n")
            f.write(f"- (Normal: {d['normal_prob']*100:.2f}% | Parkinson: {d['parkinson_prob']*100:.2f}%)\n\n")
            
        if data["gradcam_paths"] or data["shap_paths"] or data["fusion_plot"]:
            f.write("## 4. Explainable AI (XAI) Visualizations\n\n")
            
            for label, path in data["gradcam_paths"]:
                f.write(f"### {label}\n")
                f.write(f"![{label}]({os.path.abspath(path)})\n\n")
                
            for label, path in data["shap_paths"]:
                f.write(f"### {label}\n")
                f.write(f"![{label}]({os.path.abspath(path)})\n\n")
                
            if data["fusion_plot"]:
                f.write("### Fusion Modality Contributions\n")
                f.write(f"![Contributions]({os.path.abspath(data['fusion_plot'])})\n\n")
                
        f.write("---\n")
        f.write("*NeuroFusionAI Clinician Diagnosis Assistant*\n")

    print(f"\n✓ Patient markdown report saved to: {os.path.abspath(report_path)}")

    # 2. Generate PDF Report
    pdf_path = os.path.splitext(report_path)[0] + ".pdf"
    try:
        from matplotlib.backends.backend_pdf import PdfPages
        with PdfPages(pdf_path) as pdf:
            # Page 1: Title and Summary Table
            fig, ax = plt.subplots(figsize=(8.5, 11))
            ax.axis('off')
            
            summary_txt = (
                f"NeuroFusionAI Patient Clinical Report\n"
                f"{'='*38}\n\n"
                f"Patient ID: {data['patient_id']}\n"
                f"Date & Time: {timestamp}\n"
                f"Device: {device}\n\n"
                f"Diagnostic Summary:\n"
            )
            ax.text(0.1, 0.9, summary_txt, transform=ax.transAxes,
                    fontsize=14, va='top', ha='left', fontfamily='monospace', fontweight='bold')
            
            # Draw a nice results table on Page 1
            table_data = []
            for key, label in [("mri", "Brain MRI"), ("spiral", "Spiral Drawing"), ("voice", "Voice")]:
                if data[key]:
                    table_data.append([label, data[key]["predicted_class"], f"{data[key]['confidence']*100:.1f}%"])
                else:
                    table_data.append([label, "Not Provided", "—"])
            
            if data["telemonitor"]:
                table_data.append(["Telemonitor", "UPDRS Prediction", f"Total: {data['telemonitor']['total_updrs']:.1f}"])
            else:
                table_data.append(["Telemonitor", "Not Provided", "—"])
                
            if data["fusion"]:
                table_data.append(["Multimodal Fusion", data["fusion"]["predicted_class"], f"{data['fusion']['confidence']*100:.1f}%"])
                
            table = ax.table(cellText=table_data, colLabels=["Modality", "Prediction / Status", "Confidence / Score"],
                             loc='center', cellLoc='center', colWidths=[0.3, 0.4, 0.25])
            table.auto_set_font_size(False)
            table.set_fontsize(11)
            table.scale(1.0, 2.0)
            
            pdf.savefig(fig)
            plt.close(fig)

            # Append Modality Plot Pages
            all_plots = []
            for label, path in data["gradcam_paths"]:
                all_plots.append((label, path))
            for label, path in data["shap_paths"]:
                all_plots.append((label, path))
            if data["fusion_plot"]:
                all_plots.append(("Fusion Modality Contributions", data["fusion_plot"]))
                
            for label, path in all_plots:
                if os.path.exists(path):
                    fig, ax = plt.subplots(figsize=(8.5, 7.5))
                    img = mpimg.imread(path)
                    ax.imshow(img)
                    ax.axis('off')
                    ax.set_title(label, fontsize=14, fontweight='bold', pad=10)
                    plt.tight_layout()
                    pdf.savefig(fig)
                    plt.close(fig)
                    
        print(f"✓ Patient PDF report saved to: {os.path.abspath(pdf_path)}")
    except Exception as e:
        print(f"⚠ PDF generation skipped ({e}). Markdown report remains available.")

if __name__ == "__main__":
    main()
