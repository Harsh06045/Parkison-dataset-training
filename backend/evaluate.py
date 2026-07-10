import os
import sys
import argparse

# Force stdout/stderr to use UTF-8 to prevent charmap encoding errors on Windows
try:
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    if hasattr(sys.stderr, 'reconfigure'):
        sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

# Setup path so it can import backend/app modules
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BACKEND_DIR)
sys.path.insert(0, BACKEND_DIR)
sys.path.insert(0, PROJECT_ROOT)

from app.models.loader import loader
from app.services.evaluation_service import evaluate_modality_metrics

def main():
    parser = argparse.ArgumentParser(
        description="NeuroFusionAI Model Evaluation & Quality Validation CLI Tool"
    )
    parser.add_argument(
        "--modality",
        type=str,
        default="all",
        choices=["mri", "spiral", "voice", "telemonitor", "fusion", "all"],
        help="The dataset modality to evaluate (or 'all')."
    )
    
    args = parser.parse_args()
    
    print("==============================================================")
    print("        NEUROFUSIONAI MODEL TEST & EVALUATION SUITE")
    print("==============================================================")
    
    # Initialize and load weights
    loader.load_all_models()
    print()
    
    modalities_to_eval = (
        ["mri", "spiral", "voice", "telemonitor", "fusion"]
        if args.modality == "all"
        else [args.modality]
    )
    
    for mod in modalities_to_eval:
        print(f"Evaluating modality: '{mod.upper()}' on test set...")
        try:
            results = evaluate_modality_metrics(mod)
            print(f"  ✓ Metrics calculated successfully for '{mod.upper()}':")
            for k, v in results.items():
                if isinstance(v, float):
                    print(f"    - {k:<25}: {v*100:.2f}%" if "Accuracy" in k or "F1" in k or "Precision" in k or "Recall" in k or "ROC" in k else f"    - {k:<25}: {v:.4f}")
                else:
                    print(f"    - {k:<25}: {v}")
            print()
        except Exception as e:
            print(f"  ✗ Error evaluating '{mod}': {e}\n")
            
    print("Evaluation completed! Results exported to outputs/predictions/evaluation_test_results.csv")

if __name__ == "__main__":
    main()
