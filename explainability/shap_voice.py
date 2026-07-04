"""
Voice SHAP Explainability Wrapper.

Usage:
    python explainability/shap_voice.py --voice-file "test_audio/voice.wav"
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

from explainability.shap_analysis import generate_shap_analysis

def main():
    parser = argparse.ArgumentParser(description="Generate Voice SHAP explanations")
    parser.add_argument("--voice-file", type=str, default=None, help="Path to input voice CSV or WAV file")
    parser.add_argument("--output-dir", type=str, default=None, help="Directory to save output plots")
    args = parser.parse_args()

    print("======================================")
    print("Generating Voice SHAP")
    print("======================================")
    print()

    try:
        results = generate_shap_analysis("voice", args.output_dir, single_sample_path=args.voice_file)
        print()
        print("✓ Model Loaded")
        print("✓ SHAP Values Computed")
        print("✓ Summary beeswarm, bar, and force plots saved:")
        for key, val in results.items():
            print(f"  • {key.title()}: {os.path.abspath(val)}")
    except Exception as e:
        print(f"✗ ERROR generating Voice SHAP: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
