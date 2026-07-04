"""
Telemonitoring SHAP Explainability Wrapper.

Usage:
    python explainability/shap_telemonitor.py --telemonitor-file "patient.csv"
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
    parser = argparse.ArgumentParser(description="Generate Telemonitoring SHAP explanations")
    parser.add_argument("--telemonitor-file", type=str, default=None, help="Path to input telemonitoring CSV file")
    parser.add_argument("--output-dir", type=str, default=None, help="Directory to save output plots")
    args = parser.parse_args()

    print("======================================")
    print("Generating Telemonitoring SHAP")
    print("======================================")
    print()

    try:
        results = generate_shap_analysis("telemonitor", args.output_dir, single_sample_path=args.telemonitor_file)
        print()
        print("✓ Model Loaded")
        print("✓ SHAP Values Computed")
        print("✓ Summary beeswarm, bar, and force plots saved:")
        for key, val in results.items():
            print(f"  • {key.title()}: {os.path.abspath(val)}")
    except Exception as e:
        print(f"✗ ERROR generating Telemonitoring SHAP: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
