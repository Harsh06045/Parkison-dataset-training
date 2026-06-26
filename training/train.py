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

# Resolve project root
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)

from training.logger import setup_logger

logger = setup_logger("train_entrypoint", log_file=os.path.join(PROJECT_ROOT, "outputs", "logs", "train_all.log"))

def main():
    parser = argparse.ArgumentParser(description="NeuroFusionAI Training Entrypoint")
    parser.add_argument(
        "--module", 
        type=str, 
        choices=["mri", "spiral", "voice", "telemonitor", "fusion"], 
        help="Train a specific modality module"
    )
    parser.add_argument(
        "--all", 
        action="store_true", 
        help="Train all modules sequentially (mri -> spiral -> voice -> telemonitor -> fusion)"
    )
    parser.add_argument(
        "--full", 
        action="store_true", 
        help="Disable Fast CPU Mode and run full epochs (otherwise CPU training defaults to 1 epoch per model)"
    )
    
    args = parser.parse_args()
    
    # Check if any action is chosen
    if not args.module and not args.all:
        parser.print_help()
        sys.exit(1)
        
    fast_cpu_mode = not args.full
    
    if args.module:
        run_module(args.module, fast_cpu_mode)
    elif args.all:
        logger.info("=== Starting NeuroFusionAI End-to-End Training Pipeline ===")
        for module_name in ["mri", "spiral", "voice", "telemonitor", "fusion"]:
            run_module(module_name, fast_cpu_mode)
        logger.info("=== Training Pipeline Completed Successfully! ===")

def run_module(module_name, fast_cpu_mode):
    logger.info(f"\n=======================================================")
    logger.info(f"RUNNING MODULE: {module_name.upper()} (Fast CPU Mode: {fast_cpu_mode})")
    logger.info(f"=======================================================")
    
    if module_name == "mri":
        from training.train_mri import train_mri_module
        train_mri_module(fast_cpu_mode=fast_cpu_mode)
    elif module_name == "spiral":
        from training.train_spiral import train_spiral_module
        train_spiral_module(fast_cpu_mode=fast_cpu_mode)
    elif module_name == "voice":
        from training.train_voice import train_voice_module
        train_voice_module(fast_cpu_mode=fast_cpu_mode)
    elif module_name == "telemonitor":
        from training.train_telemonitor import train_telemonitor_module
        train_telemonitor_module(fast_cpu_mode=fast_cpu_mode)
    elif module_name == "fusion":
        from training.train_fusion import train_fusion_module
        train_fusion_module(fast_cpu_mode=fast_cpu_mode)

if __name__ == "__main__":
    main()
