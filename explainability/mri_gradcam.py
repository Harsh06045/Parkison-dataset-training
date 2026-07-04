"""
MRI Grad-CAM Wrapper Script.

Usage:
    python explainability/mri_gradcam.py --image "test_images/test_mri.png"
"""
import os
import sys
import argparse

try:
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)

from explainability.gradcam import generate_gradcam

def main():
    parser = argparse.ArgumentParser(description="Generate MRI Grad-CAM")
    parser.add_argument("--image", type=str, required=True, help="Path to input MRI scan image")
    parser.add_argument("--output-dir", type=str, default=None, help="Directory to save output plots")
    args = parser.parse_args()

    if not os.path.exists(args.image):
        print(f"✗ ERROR: File '{args.image}' not found.")
        sys.exit(1)

    print("======================================")
    print("Generating MRI Grad-CAM")
    print("======================================")
    print()

    try:
        results = generate_gradcam("mri", args.image, args.output_dir)
        print()
        print("✓ Model Loaded")
        print(f"✓ Prediction: {results['predicted_class']}")
        print(f"✓ Confidence: {results['confidence'] * 100:.2f}%")
        print("✓ Heatmap Generated")
        print("✓ Overlay Saved")
        print()
        print("Saved:")
        print(f"outputs/plots/mri_original.png")
        print(f"outputs/plots/mri_gradcam.png")
        print(f"outputs/plots/mri_overlay.png")
    except Exception as e:
        print(f"✗ ERROR generating Grad-CAM: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
