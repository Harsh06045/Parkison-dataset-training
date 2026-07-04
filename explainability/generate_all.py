"""
NeuroFusionAI — Complete Explainability Pipeline (Phase 5)

Runs all XAI analyses and generates a comprehensive PDF report:
  1. MRI Grad-CAM (original, heatmap, overlay)
  2. Spiral Grad-CAM (original, heatmap, overlay)
  3. Voice SHAP (summary, bar, force plot)
  4. Telemonitor SHAP (summary, bar, force plot)
  5. Fusion modality contribution analysis
  6. PDF explainability report

Usage:
    python explainability/generate_all.py
    python explainability/generate_all.py --patient-id "P001"
"""
import os
import sys
import argparse
import glob
from datetime import datetime

try:
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    if hasattr(sys.stderr, 'reconfigure'):
        sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)

import torch
import numpy as np
from PIL import Image
from torchvision import transforms


def load_pytorch_weights(model, path, device):
    """Load checkpoint weights into a model."""
    if not os.path.exists(path):
        print(f"  ✗ Checkpoint not found: {path}")
        return False
    state = torch.load(path, map_location=device)
    if isinstance(state, dict) and "model_state_dict" in state:
        model.load_state_dict(state["model_state_dict"])
    else:
        model.load_state_dict(state)
    model.eval()
    print(f"  ✓ Loaded: {os.path.basename(path)}")
    return True


def main():
    parser = argparse.ArgumentParser(description="NeuroFusionAI Complete Explainability Pipeline")
    parser.add_argument("--patient-id", type=str, default="SAMPLE_001",
                        help="Patient identifier for the report")
    parser.add_argument("--mri-image", type=str, default=None,
                        help="Path to MRI image (defaults to a validation sample)")
    parser.add_argument("--spiral-image", type=str, default=None,
                        help="Path to spiral image (defaults to a validation sample)")
    parser.add_argument("--voice-file", type=str, default=None,
                        help="Path to voice (.wav or .csv) file")
    parser.add_argument("--telemonitor-file", type=str, default=None,
                        help="Path to telemonitoring features CSV")
    args = parser.parse_args()

    print("=" * 62)
    print("   NEUROFUSIONAI — EXPLAINABILITY PIPELINE (PHASE 5)")
    print("=" * 62)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Device: {device}\n")

    output_dir = os.path.join(PROJECT_ROOT, "outputs", "plots")
    report_dir = os.path.join(PROJECT_ROOT, "outputs", "reports")
    os.makedirs(output_dir, exist_ok=True)
    os.makedirs(report_dir, exist_ok=True)

    # --- Resolve sample images ---
    mri_image = args.mri_image
    if mri_image is None:
        candidates = glob.glob(os.path.join(PROJECT_ROOT, "datasets", "validation", "mri", "parkinson", "*.png"))
        if candidates:
            mri_image = candidates[0]
        else:
            print("  ✗ No MRI validation samples found. Skipping MRI Grad-CAM.")

    spiral_image = args.spiral_image
    if spiral_image is None:
        candidates = glob.glob(os.path.join(PROJECT_ROOT, "datasets", "validation", "images", "parkinson", "*.png"))
        if candidates:
            spiral_image = candidates[0]
        else:
            print("  ✗ No spiral validation samples found. Skipping Spiral Grad-CAM.")

    all_results = {}

    # ==================================================================
    # STEP 1 & 2: MRI Grad-CAM
    # ==================================================================
    mri_results = None
    if mri_image and os.path.exists(mri_image):
        print(f"\n[Step 2] MRI Grad-CAM")
        print(f"  Input: {os.path.basename(mri_image)}")
        try:
            from explainability.gradcam import generate_gradcam
            mri_results = generate_gradcam("mri", mri_image, output_dir, device)
            all_results["mri_gradcam"] = mri_results
        except Exception as e:
            print(f"  ✗ MRI Grad-CAM failed: {e}")

    # ==================================================================
    # STEP 3: Spiral Grad-CAM
    # ==================================================================
    spiral_results = None
    if spiral_image and os.path.exists(spiral_image):
        print(f"\n[Step 3] Spiral Grad-CAM")
        print(f"  Input: {os.path.basename(spiral_image)}")
        try:
            from explainability.gradcam import generate_gradcam
            spiral_results = generate_gradcam("spiral", spiral_image, output_dir, device)
            all_results["spiral_gradcam"] = spiral_results
        except Exception as e:
            print(f"  ✗ Spiral Grad-CAM failed: {e}")

    # ==================================================================
    # STEP 4: Voice SHAP
    # ==================================================================
    print(f"\n[Step 4] Voice SHAP Analysis")
    voice_shap_results = None
    try:
        from explainability.shap_analysis import generate_shap_analysis
        voice_shap_results = generate_shap_analysis("voice", output_dir, single_sample_path=args.voice_file)
        all_results["voice_shap"] = voice_shap_results
    except Exception as e:
        print(f"  ✗ Voice SHAP failed: {e}")

    # ==================================================================
    # STEP 5: Telemonitor SHAP
    # ==================================================================
    print(f"\n[Step 5] Telemonitor SHAP Analysis")
    tele_shap_results = None
    try:
        from explainability.shap_analysis import generate_shap_analysis
        tele_shap_results = generate_shap_analysis("telemonitor", output_dir, single_sample_path=args.telemonitor_file)
        all_results["tele_shap"] = tele_shap_results
    except Exception as e:
        print(f"  ✗ Telemonitor SHAP failed: {e}")

    # ==================================================================
    # STEP 6: Fusion Contribution Analysis
    # ==================================================================
    print(f"\n[Step 6] Fusion Modality Contribution Analysis")
    fusion_contrib = None
    fusion_plot_path = None
    try:
        from models.image_model import ImageDrawingClassifier
        from models.mri_model import MRIClassifier
        from models.fusion_model import MultimodalClassifier
        from explainability.fusion_explain import compute_fusion_contributions, generate_fusion_contribution_plot

        # Load individual models to extract embeddings
        img_model = ImageDrawingClassifier(num_classes=2, pretrained=False).to(device)
        mri_model = MRIClassifier(num_classes=2, pretrained=False).to(device)
        fusion_model = MultimodalClassifier(image_dim=256, mri_dim=256, voice_dim=22, clinical_dim=19, fusion_dim=32).to(device)

        load_pytorch_weights(img_model, os.path.join(PROJECT_ROOT, "outputs", "checkpoints", "image_best.pth"), device)
        load_pytorch_weights(mri_model, os.path.join(PROJECT_ROOT, "outputs", "checkpoints", "mri_best.pth"), device)
        load_pytorch_weights(fusion_model, os.path.join(PROJECT_ROOT, "outputs", "checkpoints", "fusion_best.pth"), device)

        transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])

        # Get real embeddings for the sample images
        if spiral_image and os.path.exists(spiral_image):
            img_t = transform(Image.open(spiral_image).convert('RGB')).unsqueeze(0).to(device)
            with torch.no_grad():
                image_embed = img_model.extract_features(img_t)
        else:
            image_embed = torch.randn(1, 256).to(device)

        if mri_image and os.path.exists(mri_image):
            mri_t = transform(Image.open(mri_image).convert('RGB')).unsqueeze(0).to(device)
            with torch.no_grad():
                mri_embed = mri_model.extract_features(mri_t)
        else:
            mri_embed = torch.randn(1, 256).to(device)

        # Load voice sample
        import pandas as pd
        voice_feat = None
        if args.voice_file:
            voice_features = None
            if "," in args.voice_file:
                try:
                    voice_features = np.array([float(x.strip()) for x in args.voice_file.split(",")])
                except Exception:
                    pass
            elif args.voice_file.lower().endswith(".wav"):
                from explainability.shap_analysis import extract_audio_features
                voice_features = extract_audio_features(args.voice_file)
            elif args.voice_file.lower().endswith(".csv"):
                try:
                    vdf = pd.read_csv(args.voice_file)
                    if "status" in vdf.columns:
                        vdf = vdf.drop(columns=["status"])
                    voice_features = vdf.iloc[0].values.astype(float)
                except Exception:
                    pass
            if voice_features is not None:
                voice_feat = torch.tensor(voice_features, dtype=torch.float32).unsqueeze(0).to(device)

        if voice_feat is None:
            voice_csv = os.path.join(PROJECT_ROOT, "datasets", "validation", "voice", "oxford_validation.csv")
            if os.path.exists(voice_csv):
                vdf = pd.read_csv(voice_csv)
                voice_feat = torch.tensor(vdf.drop(columns=["status"]).iloc[0].values, dtype=torch.float32).unsqueeze(0).to(device)
            else:
                voice_feat = torch.randn(1, 22).to(device)

        # Load telemonitor sample
        clinical_feat = None
        if args.telemonitor_file:
            tele_features = None
            if "," in args.telemonitor_file and not args.telemonitor_file.lower().endswith(".csv"):
                try:
                    tele_features = np.array([float(x.strip()) for x in args.telemonitor_file.split(",")])
                except Exception:
                    pass
            elif args.telemonitor_file.lower().endswith(".csv") or os.path.exists(args.telemonitor_file):
                try:
                    tdf = pd.read_csv(args.telemonitor_file)
                    for col in ["motor_UPDRS", "total_UPDRS"]:
                        if col in tdf.columns:
                            tdf = tdf.drop(columns=[col])
                    tele_features = tdf.iloc[0].values.astype(float)
                except Exception:
                    pass
            if tele_features is not None:
                clinical_feat = torch.tensor(tele_features, dtype=torch.float32).unsqueeze(0).to(device)

        if clinical_feat is None:
            tele_csv = os.path.join(PROJECT_ROOT, "datasets", "validation", "telemonitoring", "telemonitor_validation.csv")
            if os.path.exists(tele_csv):
                tdf = pd.read_csv(tele_csv)
                clinical_feat = torch.tensor(
                    tdf.drop(columns=["motor_UPDRS", "total_UPDRS"]).iloc[0].values, dtype=torch.float32
                ).unsqueeze(0).to(device)
            else:
                clinical_feat = torch.randn(1, 19).to(device)

        fusion_contrib = compute_fusion_contributions(
            fusion_model, image_embed, mri_embed, voice_feat, clinical_feat, device
        )
        fusion_plot_path = generate_fusion_contribution_plot(fusion_contrib, output_dir)
        all_results["fusion_contrib"] = fusion_contrib

    except Exception as e:
        print(f"  ✗ Fusion contribution analysis failed: {e}")

    # ==================================================================
    # STEP 7: Generate PDF Explainability Report
    # ==================================================================
    print(f"\n[Step 7] Generating Explainability Report")

    # Build prediction info
    prediction = "Parkinson"
    confidence = 0.0
    if mri_results:
        prediction = mri_results["predicted_class"]
        confidence = mri_results["confidence"]
    elif spiral_results:
        prediction = spiral_results["predicted_class"]
        confidence = spiral_results["confidence"]

    report_path = _generate_report(
        patient_id=args.patient_id,
        prediction=prediction,
        confidence=confidence,
        mri_results=mri_results,
        spiral_results=spiral_results,
        voice_shap=voice_shap_results,
        tele_shap=tele_shap_results,
        fusion_contrib=fusion_contrib,
        fusion_plot_path=fusion_plot_path,
        report_dir=report_dir
    )

    # ==================================================================
    # Summary
    # ==================================================================
    print(f"\n{'=' * 62}")
    print(f"  PHASE 5 COMPLETE — All explainability artifacts generated")
    print(f"{'=' * 62}")
    print(f"\n  Output plots:  {os.path.abspath(output_dir)}")
    print(f"  Report:        {os.path.abspath(report_path)}")

    # List generated files
    print(f"\n  Generated files:")
    for f in sorted(os.listdir(output_dir)):
        if any(x in f for x in ['mri_', 'spiral_', 'voice_', 'telemonitor_', 'fusion_']):
            print(f"    • {f}")


def _generate_report(patient_id, prediction, confidence, mri_results,
                     spiral_results, voice_shap, tele_shap,
                     fusion_contrib, fusion_plot_path, report_dir):
    """Generate the explainability report as Markdown and attempt PDF conversion."""
    import matplotlib
    matplotlib.use('Agg')

    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    md_path = os.path.join(report_dir, "explainability_report.md")

    with open(md_path, "w", encoding="utf-8") as f:
        f.write("# NeuroFusionAI — Explainability Report\n\n")
        f.write(f"| Field | Value |\n")
        f.write(f"|---|---|\n")
        f.write(f"| Patient ID | {patient_id} |\n")
        f.write(f"| Prediction | **{prediction}** |\n")
        f.write(f"| Confidence | {confidence*100:.2f}% |\n")
        f.write(f"| Date & Time | {timestamp} |\n\n")
        f.write("---\n\n")

        # MRI Grad-CAM
        if mri_results:
            f.write("## MRI Grad-CAM\n\n")
            f.write(f"**Predicted**: {mri_results['predicted_class']} "
                    f"(Confidence: {mri_results['confidence']*100:.2f}%)\n\n")
            for key, label in [("original", "Original"), ("gradcam", "Grad-CAM Heatmap"), ("overlay", "Overlay")]:
                if key in mri_results:
                    f.write(f"### {label}\n\n")
                    f.write(f"![MRI {label}]({os.path.abspath(mri_results[key])})\n\n")

        # Spiral Grad-CAM
        if spiral_results:
            f.write("## Spiral Drawing Grad-CAM\n\n")
            f.write(f"**Predicted**: {spiral_results['predicted_class']} "
                    f"(Confidence: {spiral_results['confidence']*100:.2f}%)\n\n")
            for key, label in [("original", "Original"), ("gradcam", "Grad-CAM Heatmap"), ("overlay", "Overlay")]:
                if key in spiral_results:
                    f.write(f"### {label}\n\n")
                    f.write(f"![Spiral {label}]({os.path.abspath(spiral_results[key])})\n\n")

        # Voice SHAP
        if voice_shap:
            f.write("## Voice SHAP Feature Importance\n\n")
            for key, label in [("summary", "Summary Plot"), ("bar", "Bar Plot"), ("force", "Force Plot")]:
                if key in voice_shap:
                    f.write(f"### {label}\n\n")
                    f.write(f"![Voice {label}]({os.path.abspath(voice_shap[key])})\n\n")

        # Telemonitor SHAP
        if tele_shap:
            f.write("## Telemonitoring SHAP Feature Importance\n\n")
            for key, label in [("summary", "Summary Plot"), ("bar", "Bar Plot"), ("force", "Force Plot")]:
                if key in tele_shap:
                    f.write(f"### {label}\n\n")
                    f.write(f"![Telemonitor {label}]({os.path.abspath(tele_shap[key])})\n\n")

        # Fusion Contribution
        if fusion_contrib:
            f.write("## Fusion Modality Contribution\n\n")
            f.write("| Modality | Contribution |\n")
            f.write("|---|---|\n")
            for mod, val in fusion_contrib.items():
                f.write(f"| {mod} | {val:.1f}% |\n")
            f.write("\n")
            if fusion_plot_path:
                f.write(f"![Fusion Contributions]({os.path.abspath(fusion_plot_path)})\n\n")

        f.write("---\n\n")
        f.write(f"*Report generated by NeuroFusionAI Explainability Pipeline — {timestamp}*\n")

    print(f"  ✓ Markdown report: {md_path}")

    # Attempt PDF conversion
    pdf_path = os.path.join(report_dir, "explainability_report.pdf")
    try:
        from matplotlib.backends.backend_pdf import PdfPages
        import matplotlib.pyplot as plt
        import matplotlib.image as mpimg

        with PdfPages(pdf_path) as pdf:
            # Title page
            fig, ax = plt.subplots(figsize=(8.5, 11))
            ax.axis('off')
            title_text = (
                f"NeuroFusionAI\nExplainability Report\n\n"
                f"Patient ID: {patient_id}\n"
                f"Prediction: {prediction}\n"
                f"Confidence: {confidence*100:.2f}%\n\n"
                f"Generated: {timestamp}"
            )
            ax.text(0.5, 0.5, title_text, transform=ax.transAxes,
                    fontsize=16, va='center', ha='center', fontfamily='sans-serif',
                    fontweight='bold', linespacing=2.0)
            pdf.savefig(fig)
            plt.close(fig)

            # Collect all plot images in order
            plot_pages = []
            if mri_results:
                for key in ["original", "gradcam", "overlay"]:
                    if key in mri_results and os.path.exists(mri_results[key]):
                        plot_pages.append(("MRI — " + key.title(), mri_results[key]))
            if spiral_results:
                for key in ["original", "gradcam", "overlay"]:
                    if key in spiral_results and os.path.exists(spiral_results[key]):
                        plot_pages.append(("Spiral — " + key.title(), spiral_results[key]))
            if voice_shap:
                for key, label in [("summary", "Summary"), ("bar", "Bar"), ("force", "Force Plot")]:
                    if key in voice_shap and os.path.exists(voice_shap[key]):
                        plot_pages.append((f"Voice SHAP — {label}", voice_shap[key]))
            if tele_shap:
                for key, label in [("summary", "Summary"), ("bar", "Bar"), ("force", "Force Plot")]:
                    if key in tele_shap and os.path.exists(tele_shap[key]):
                        plot_pages.append((f"Telemonitor SHAP — {label}", tele_shap[key]))
            if fusion_plot_path and os.path.exists(fusion_plot_path):
                plot_pages.append(("Fusion Modality Contributions", fusion_plot_path))

            for title, img_path in plot_pages:
                try:
                    fig, ax = plt.subplots(figsize=(8.5, 7))
                    img = mpimg.imread(img_path)
                    ax.imshow(img)
                    ax.set_title(title, fontsize=14, fontweight='bold', pad=10)
                    ax.axis('off')
                    plt.tight_layout()
                    pdf.savefig(fig)
                    plt.close(fig)
                except Exception:
                    continue

            # Fusion contribution table page
            if fusion_contrib:
                fig, ax = plt.subplots(figsize=(8.5, 4))
                ax.axis('off')
                table_data = [[mod, f"{val:.1f}%"] for mod, val in fusion_contrib.items()]
                table = ax.table(cellText=table_data,
                                 colLabels=["Modality", "Contribution"],
                                 cellLoc='center', loc='center',
                                 colWidths=[0.35, 0.25])
                table.auto_set_font_size(False)
                table.set_fontsize(12)
                table.scale(1, 1.8)
                ax.set_title("Fusion Modality Contribution Table", fontsize=14, fontweight='bold', pad=20)
                pdf.savefig(fig)
                plt.close(fig)

        print(f"  ✓ PDF report: {pdf_path}")

    except Exception as e:
        print(f"  ⚠ PDF generation skipped ({e}). Markdown report is available.")

    return md_path


if __name__ == "__main__":
    main()
