"""
Spiral Grad-CAM Wrapper Script.

Usage:
    python explainability/spiral_gradcam.py --image "test_images/test_spiral.png"
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
    parser = argparse.ArgumentParser(description="Generate Spiral Drawing Grad-CAM")
    parser.add_argument("--image", type=str, required=True, help="Path to input spiral drawing image")
    parser.add_argument("--output-dir", type=str, default=None, help="Directory to save output plots")
    args = parser.parse_args()

    if not os.path.exists(args.image):
        print(f"✗ ERROR: File '{args.image}' not found.")
        sys.exit(1)

    print("======================================")
    print("Generating Spiral Grad-CAM")
    print("======================================")
    print()

    try:
        results = generate_gradcam("spiral", args.image, args.output_dir)
        print()
        print("✓ Model Loaded")
        print(f"✓ Prediction: {results['predicted_class']}")
        print(f"✓ Confidence: {results['confidence'] * 100:.2f}%")
        print("✓ Heatmap Generated")
        print("✓ Overlay Saved")
        print()
        print("Saved:")
        print(f"outputs/plots/spiral_original.png")
        print(f"outputs/plots/spiral_gradcam.png")
        print(f"outputs/plots/spiral_overlay.png")
    except Exception as e:
        print(f"✗ ERROR generating Grad-CAM: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
