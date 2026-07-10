import os
import sys
from datetime import datetime
import torch
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.image as mpimg

# Add project root to sys.path
APP_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.dirname(APP_DIR)
PROJECT_ROOT = os.path.dirname(BACKEND_DIR)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from app.config import STATIC_DIR
from app.models.loader import loader
from app.services.mri_service import predict_mri
from app.services.spiral_service import predict_spiral
from app.services.voice_service import predict_voice
from app.services.telemonitor_service import predict_telemonitor
from app.services.fusion_service import predict_fusion
from app.services.gradcam_service import run_gradcam
from app.services.shap_service import run_shap_analysis

# Import explainability modules from base repo
from explainability.gradcam import generate_gradcam
from explainability.shap_analysis import generate_shap_analysis
from explainability.fusion_explain import compute_fusion_contributions, generate_fusion_contribution_plot

REPORTS_DIR = os.path.join(BACKEND_DIR, "generated_reports")
os.makedirs(REPORTS_DIR, exist_ok=True)

def generate_patient_report(patient_id, mri_path=None, spiral_path=None, voice_path=None, telemonitor_path=None):
    """
    Run diagnostic pipeline on all provided modalities, run Explainable AI (XAI)
    visualizations, perform Multimodal Fusion, and generate a PDF report.
    
    Returns:
        str: absolute path to the generated PDF report.
    """
    device = loader.device
    
    # Pre-populate report data
    report_data = {
        "patient_id": patient_id,
        "mri": None,
        "spiral": None,
        "voice": None,
        "telemonitor": None,
        "fusion": None,
        "gradcam_paths": [],
        "shap_paths": [],
        "fusion_contrib": None,
        "fusion_plot": None
    }
    
    # 1. MRI modality
    mri_embed = None
    if mri_path:
        try:
            mri_res = predict_mri(mri_path)
            mri_embed = mri_res["embedding"]
            # Convert probabilities
            prob_parkinson = mri_res["confidence"] / 100.0 if mri_res["prediction"] == "Parkinson" else (1.0 - mri_res["confidence"] / 100.0)
            report_data["mri"] = {
                "path": mri_path,
                "predicted_class": mri_res["prediction"],
                "confidence": mri_res["confidence"] / 100.0,
                "parkinson_prob": prob_parkinson,
                "normal_prob": 1.0 - prob_parkinson
            }
            
            # Gradcam
            try:
                gcam_res = generate_gradcam("mri", mri_path, output_dir=STATIC_DIR, device=device, model=loader.mri_model)
                report_data["gradcam_paths"].append(("Brain MRI Overlay", gcam_res["overlay"]))
                report_data["gradcam_paths"].append(("Brain MRI Raw Heatmap", gcam_res["gradcam"]))
            except Exception as e:
                print(f"  Warning: MRI Grad-CAM failed: {e}")
        except Exception as e:
            print(f"  Error processing MRI: {e}")
            
    # 2. Spiral modality
    drawing_embed = None
    if spiral_path:
        try:
            spiral_res = predict_spiral(spiral_path)
            drawing_embed = spiral_res["embedding"]
            prob_parkinson = spiral_res["confidence"] / 100.0 if spiral_res["prediction"] == "Parkinson" else (1.0 - spiral_res["confidence"] / 100.0)
            report_data["spiral"] = {
                "path": spiral_path,
                "predicted_class": spiral_res["prediction"],
                "confidence": spiral_res["confidence"] / 100.0,
                "parkinson_prob": prob_parkinson,
                "normal_prob": 1.0 - prob_parkinson
            }
            
            # Gradcam
            try:
                gcam_res = generate_gradcam("spiral", spiral_path, output_dir=STATIC_DIR, device=device, model=loader.spiral_model)
                report_data["gradcam_paths"].append(("Spiral Drawing Overlay", gcam_res["overlay"]))
                report_data["gradcam_paths"].append(("Spiral Drawing Raw Heatmap", gcam_res["gradcam"]))
            except Exception as e:
                print(f"  Warning: Spiral Grad-CAM failed: {e}")
        except Exception as e:
            print(f"  Error processing Spiral: {e}")
            
    # 3. Voice modality
    voice_tensor = None
    if voice_path:
        try:
            voice_res = predict_voice(voice_path)
            voice_tensor = voice_res["tensor"]
            prob_parkinson = voice_res["confidence"] / 100.0 if voice_res["prediction"] == "Parkinson" else (1.0 - voice_res["confidence"] / 100.0)
            report_data["voice"] = {
                "path": voice_path,
                "predicted_class": voice_res["prediction"],
                "confidence": voice_res["confidence"] / 100.0,
                "parkinson_prob": prob_parkinson,
                "normal_prob": 1.0 - prob_parkinson
            }
            
            # SHAP
            try:
                shap_res = generate_shap_analysis("voice", output_dir=STATIC_DIR, max_samples=100, single_sample_path=voice_path, model=loader.voice_catboost_model)
                report_data["shap_paths"].append(("Voice SHAP Summary", shap_res["summary"]))
                report_data["shap_paths"].append(("Voice SHAP Bar Plot", shap_res["bar"]))
                if shap_res.get("force"):
                    report_data["shap_paths"].append(("Voice SHAP Force Plot", shap_res["force"]))
            except Exception as e:
                print(f"  Warning: Voice SHAP failed: {e}")
        except Exception as e:
            print(f"  Error processing Voice: {e}")
            
    # 4. Telemonitor modality
    tele_tensor = None
    if telemonitor_path:
        try:
            tele_res = predict_telemonitor(telemonitor_path)
            tele_tensor = tele_res["tensor"]
            report_data["telemonitor"] = {
                "path": telemonitor_path,
                "motor_updrs": tele_res["motor_updrs"],
                "total_updrs": tele_res["total_updrs"]
            }
            
            # SHAP
            try:
                shap_res = generate_shap_analysis("telemonitor", output_dir=STATIC_DIR, max_samples=100, single_sample_path=telemonitor_path, model=loader.telemonitor_xgb_model)
                report_data["shap_paths"].append(("Telemonitor SHAP Summary", shap_res["summary"]))
                report_data["shap_paths"].append(("Telemonitor SHAP Bar Plot", shap_res["bar"]))
                if shap_res.get("force"):
                    report_data["shap_paths"].append(("Telemonitor SHAP Force Plot", shap_res["force"]))
            except Exception as e:
                print(f"  Warning: Telemonitoring SHAP failed: {e}")
        except Exception as e:
            print(f"  Error processing Telemonitor: {e}")

    # 5. Multimodal Fusion
    if drawing_embed is not None and mri_embed is not None and voice_tensor is not None and tele_tensor is not None:
        try:
            fusion_res = predict_fusion(drawing_embed, mri_embed, voice_tensor, tele_tensor)
            prob_parkinson = fusion_res["confidence"] / 100.0 if fusion_res["prediction"] == "Parkinson" else (1.0 - fusion_res["confidence"] / 100.0)
            report_data["fusion"] = {
                "predicted_class": fusion_res["prediction"],
                "confidence": fusion_res["confidence"] / 100.0,
                "parkinson_prob": prob_parkinson,
                "normal_prob": 1.0 - prob_parkinson
            }
            
            # Fusion explainability
            try:
                fusion_contrib = compute_fusion_contributions(
                    loader.fusion_model, drawing_embed, mri_embed, voice_tensor, tele_tensor, loader.device
                )
                fusion_plot_path = generate_fusion_contribution_plot(fusion_contrib)
                # copy/move plot path to STATIC_DIR to keep it organized
                dest_path = os.path.join(STATIC_DIR, "fusion_contribution.png")
                if os.path.exists(fusion_plot_path):
                    import shutil
                    shutil.copy(fusion_plot_path, dest_path)
                    report_data["fusion_contrib"] = fusion_contrib
                    report_data["fusion_plot"] = dest_path
            except Exception as e:
                print(f"  Warning: Fusion contribution plot failed: {e}")
        except Exception as e:
            print(f"  Error processing Fusion: {e}")
            
    # 6. Generate PDF report using the matplotlib pipeline from inference.py
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    pdf_filename = f"{patient_id}_report.pdf"
    pdf_path = os.path.join(REPORTS_DIR, pdf_filename)
    
    try:
        from matplotlib.backends.backend_pdf import PdfPages
        with PdfPages(pdf_path) as pdf:
            # Page 1: Title and Summary Table
            fig, ax = plt.subplots(figsize=(8.5, 11))
            ax.axis('off')
            
            summary_txt = (
                f"NeuroFusionAI Patient Clinical Report\n"
                f"{'='*38}\n\n"
                f"Patient ID: {report_data['patient_id']}\n"
                f"Date & Time: {timestamp}\n"
                f"Device: {device}\n\n"
                f"Diagnostic Summary:\n"
            )
            ax.text(0.1, 0.9, summary_txt, transform=ax.transAxes,
                    fontsize=14, va='top', ha='left', fontfamily='monospace', fontweight='bold')
            
            # Draw results table
            table_data = []
            for key, label in [("mri", "Brain MRI"), ("spiral", "Spiral Drawing"), ("voice", "Voice")]:
                if report_data[key]:
                    table_data.append([label, report_data[key]["predicted_class"], f"{report_data[key]['confidence']*100:.1f}%"])
                else:
                    table_data.append([label, "Not Provided", "—"])
            
            if report_data["telemonitor"]:
                table_data.append(["Telemonitor", "UPDRS Prediction", f"Total: {report_data['telemonitor']['total_updrs']:.1f}"])
            else:
                table_data.append(["Telemonitor", "Not Provided", "—"])
                
            if report_data["fusion"]:
                table_data.append(["Multimodal Fusion", report_data["fusion"]["predicted_class"], f"{report_data['fusion']['confidence']*100:.1f}%"])
                
            table = ax.table(cellText=table_data, colLabels=["Modality", "Prediction / Status", "Confidence / Score"],
                             loc='center', cellLoc='center', colWidths=[0.3, 0.4, 0.25])
            table.auto_set_font_size(False)
            table.set_fontsize(11)
            table.scale(1.0, 2.0)
            
            pdf.savefig(fig)
            plt.close(fig)

            # Append Modality Plot Pages
            all_plots = []
            for label, path in report_data["gradcam_paths"]:
                all_plots.append((label, path))
            for label, path in report_data["shap_paths"]:
                all_plots.append((label, path))
            if report_data["fusion_plot"]:
                all_plots.append(("Fusion Modality Contributions", report_data["fusion_plot"]))
                
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
                    
        return pdf_path
    except Exception as e:
        raise RuntimeError(f"Failed to generate clinical PDF report: {e}")
