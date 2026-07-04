import os
import sys
import torch
import torch.nn as nn
import pandas as pd
import numpy as np
import pickle
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

# Imports from training module
from training.metrics import (
    compute_classification_metrics,
    compute_classification_metrics_with_probs,
    compute_regression_metrics,
    save_confusion_matrix
)
from training.checkpoint import load_checkpoint

# Preprocessing dataloaders
from preprocessing.image_preprocessing import get_image_dataloader
from preprocessing.mri_preprocessing import get_mri_dataloader
from preprocessing.voice_preprocessing import get_voice_dataloader
from preprocessing.telemonitor_preprocessing import get_telemonitor_dataloader
from preprocessing.fusion_preprocessing import get_fusion_dataloader

# Modular Model definitions (from training.models)
from training.models.mri.densenet121 import DenseNet121Classifier
from training.models.spiral.efficientnet_b3 import EfficientNetB3DrawingClassifier
from training.models.voice.catboost import VoiceCatBoostClassifier
from training.models.telemonitor.xgboost import TelemonitorXGBRegressor
from training.models.fusion.multimodal_net import MultimodalClassifier as ModularMultimodalClassifier

# Notebook Model definitions (from models)
from models.image_model import ImageDrawingClassifier
from models.mri_model import MRIClassifier
from models.voice_model import VoiceMLPClassifier
from models.telemonitor_model import TelemonitorMLPRegressor
from models.fusion_model import MultimodalClassifier as NotebookMultimodalClassifier

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

def load_pytorch_weights(model, path):
    if not os.path.exists(path):
        return False
    try:
        state = torch.load(path, map_location=device)
        if isinstance(state, dict) and "model_state_dict" in state:
            model.load_state_dict(state["model_state_dict"])
        else:
            model.load_state_dict(state)
        model.eval()
        return True
    except Exception as e:
        print(f"Error loading checkpoint {path}: {e}")
        return False

def evaluate_classification_pytorch(model, dataloader):
    """Evaluate a PyTorch classifier, returning hard predictions AND soft probabilities."""
    preds = []
    probs = []
    targets = []
    with torch.no_grad():
        for inputs, labels in dataloader:
            inputs, labels = inputs.to(device), labels.to(device)
            outputs = model(inputs)
            softmax_probs = torch.softmax(outputs, dim=1)
            _, predicted = outputs.max(1)
            preds.extend(predicted.cpu().numpy())
            probs.extend(softmax_probs[:, 1].cpu().numpy())  # Probability of positive class
            targets.extend(labels.cpu().numpy())
    metrics = compute_classification_metrics_with_probs(targets, preds, probs)
    return metrics, targets, preds, probs

def evaluate_regression_pytorch(model, dataloader):
    preds = []
    targets = []
    with torch.no_grad():
        for inputs, labels in dataloader:
            inputs = inputs.to(device)
            outputs = model(inputs)
            preds.extend(outputs.cpu().numpy())
            targets.extend(labels.numpy())
    return compute_regression_metrics(targets, preds)

def main():
    print("==============================================================")
    print("        NEUROFUSIONAI MODEL TEST & EVALUATION SUITE")
    print("==============================================================")
    print(f"Using device: {device}\n")

    # Load test dataloaders
    print("Loading test datasets...")
    try:
        spiral_loader = get_image_dataloader("test", batch_size=16, shuffle=False)
        print(f"  ✓ Spiral Drawings Test Set: {len(spiral_loader.dataset)} samples")
    except Exception as e:
        print(f"  ✗ Failed to load Spiral test set: {e}")
        spiral_loader = None

    try:
        mri_loader = get_mri_dataloader("test", batch_size=16, shuffle=False)
        print(f"  ✓ MRI Test Set: {len(mri_loader.dataset)} samples")
    except Exception as e:
        print(f"  ✗ Failed to load MRI test set: {e}")
        mri_loader = None

    try:
        # Load tabular voice test data directly for ML
        voice_test_df = pd.read_csv('datasets/test/voice/oxford_test.csv')
        X_voice_test = voice_test_df.drop(columns=['status']).values
        y_voice_test = voice_test_df['status'].values
        voice_loader = get_voice_dataloader("test", batch_size=16, shuffle=False)
        print(f"  ✓ Voice Test Set: {len(y_voice_test)} samples")
    except Exception as e:
        print(f"  ✗ Failed to load Voice test set: {e}")
        X_voice_test, y_voice_test, voice_loader = None, None, None

    try:
        # Load tabular telemonitor test data directly for ML
        tele_test_df = pd.read_csv('datasets/test/telemonitoring/telemonitor_test.csv')
        X_tele_test = tele_test_df.drop(columns=['motor_UPDRS', 'total_UPDRS']).values
        y_tele_test = tele_test_df[['motor_UPDRS', 'total_UPDRS']].values
        tele_loader = get_telemonitor_dataloader("test", batch_size=16, shuffle=False)
        print(f"  ✓ Telemonitoring Test Set: {len(y_tele_test)} samples")
    except Exception as e:
        print(f"  ✗ Failed to load Telemonitoring test set: {e}")
        X_tele_test, y_tele_test, tele_loader = None, None, None

    try:
        fusion_loader = get_fusion_dataloader("test", batch_size=16)
        print(f"  ✓ Multimodal Fusion Test Set: {len(fusion_loader.dataset)} samples")
    except Exception as e:
        print(f"  ✗ Failed to load Fusion test set: {e}")
        fusion_loader = None

    results = []

    print("\nEvaluating Modality Models...")

    # =========================================================================
    # 1. SPIRAL DRAWINGS MODEL
    # =========================================================================
    # A. Modular (EfficientNet-B3)
    spiral_mod_path = "outputs/checkpoints/spiral_best_model.pth"
    if spiral_loader and os.path.exists(spiral_mod_path):
        model = EfficientNetB3DrawingClassifier(num_classes=2, pretrained=False).to(device)
        if load_pytorch_weights(model, spiral_mod_path):
            metrics, targets, preds, probs = evaluate_classification_pytorch(model, spiral_loader)
            metrics["Model Category"] = "Modular Best (EfficientNet-B3)"
            metrics["Modality"] = "Spiral Drawings"
            results.append(metrics)
            save_confusion_matrix(
                targets, preds,
                "outputs/plots/confusion_matrix_spiral_modular.png",
                title="Spiral Drawings — EfficientNet-B3"
            )
            print(f"  ✓ Spiral Drawings - Modular: Acc={metrics['Accuracy']*100:.2f}%, F1={metrics['F1 Score']:.4f}, ROC-AUC={metrics['ROC-AUC']:.4f}")
    
    # B. Notebook (ResNet-18)
    spiral_nb_path = "outputs/checkpoints/image_best.pth"
    if spiral_loader and os.path.exists(spiral_nb_path):
        model = ImageDrawingClassifier(num_classes=2, pretrained=False).to(device)
        if load_pytorch_weights(model, spiral_nb_path):
            metrics, targets, preds, probs = evaluate_classification_pytorch(model, spiral_loader)
            metrics["Model Category"] = "Notebook (ResNet-18)"
            metrics["Modality"] = "Spiral Drawings"
            results.append(metrics)
            save_confusion_matrix(
                targets, preds,
                "outputs/plots/confusion_matrix_spiral_notebook.png",
                title="Spiral Drawings — ResNet-18"
            )
            print(f"  ✓ Spiral Drawings - Notebook: Acc={metrics['Accuracy']*100:.2f}%, F1={metrics['F1 Score']:.4f}, ROC-AUC={metrics['ROC-AUC']:.4f}")

    # =========================================================================
    # 2. MRI MODEL
    # =========================================================================
    # A. Modular (DenseNet-121)
    mri_mod_path = "outputs/checkpoints/mri_best_model.pth"
    if mri_loader and os.path.exists(mri_mod_path):
        model = DenseNet121Classifier(num_classes=2, pretrained=False).to(device)
        if load_pytorch_weights(model, mri_mod_path):
            metrics, targets, preds, probs = evaluate_classification_pytorch(model, mri_loader)
            metrics["Model Category"] = "Modular Best (DenseNet-121)"
            metrics["Modality"] = "MRI"
            results.append(metrics)
            save_confusion_matrix(
                targets, preds,
                "outputs/plots/confusion_matrix_mri_modular.png",
                title="Brain MRI — DenseNet-121"
            )
            print(f"  ✓ MRI - Modular: Acc={metrics['Accuracy']*100:.2f}%, F1={metrics['F1 Score']:.4f}, ROC-AUC={metrics['ROC-AUC']:.4f}")

    # B. Notebook (EfficientNet-B0)
    mri_nb_path = "outputs/checkpoints/mri_best.pth"
    if mri_loader and os.path.exists(mri_nb_path):
        model = MRIClassifier(num_classes=2, pretrained=False).to(device)
        if load_pytorch_weights(model, mri_nb_path):
            metrics, targets, preds, probs = evaluate_classification_pytorch(model, mri_loader)
            metrics["Model Category"] = "Notebook (EfficientNet-B0)"
            metrics["Modality"] = "MRI"
            results.append(metrics)
            save_confusion_matrix(
                targets, preds,
                "outputs/plots/confusion_matrix_mri_notebook.png",
                title="Brain MRI — EfficientNet-B0"
            )
            print(f"  ✓ MRI - Notebook: Acc={metrics['Accuracy']*100:.2f}%, F1={metrics['F1 Score']:.4f}, ROC-AUC={metrics['ROC-AUC']:.4f}")

    # =========================================================================
    # 3. VOICE MODEL
    # =========================================================================
    # A. Modular (CatBoost ML)
    voice_mod_path = "outputs/checkpoints/voice_best_model.pkl"
    if X_voice_test is not None and os.path.exists(voice_mod_path):
        try:
            model = VoiceCatBoostClassifier()
            model.load(voice_mod_path)
            preds = model.predict(X_voice_test)
            probs_ml = model.predict_proba(X_voice_test)[:, 1] if hasattr(model, 'predict_proba') else None
            if probs_ml is not None:
                metrics = compute_classification_metrics_with_probs(y_voice_test, preds, probs_ml)
            else:
                metrics = compute_classification_metrics(y_voice_test, preds)
                metrics["ROC-AUC"] = float('nan')
            metrics["Model Category"] = "Modular Best (CatBoost ML)"
            metrics["Modality"] = "Voice"
            results.append(metrics)
            save_confusion_matrix(
                y_voice_test, preds,
                "outputs/plots/confusion_matrix_voice_modular.png",
                title="Voice — CatBoost"
            )
            roc_str = f", ROC-AUC={metrics['ROC-AUC']:.4f}" if not np.isnan(metrics.get('ROC-AUC', float('nan'))) else ""
            print(f"  ✓ Voice - Modular (ML): Acc={metrics['Accuracy']*100:.2f}%, F1={metrics['F1 Score']:.4f}{roc_str}")
        except Exception as e:
            print(f"  ✗ Failed to evaluate Voice Modular model: {e}")

    # B. Notebook (MLP DL)
    voice_nb_path = "outputs/checkpoints/voice_mlp_best.pth"
    if voice_loader and os.path.exists(voice_nb_path):
        model = VoiceMLPClassifier(input_dim=22, hidden_dim=64, num_classes=2).to(device)
        if load_pytorch_weights(model, voice_nb_path):
            metrics, targets, preds, probs = evaluate_classification_pytorch(model, voice_loader)
            metrics["Model Category"] = "Notebook (MLP DL)"
            metrics["Modality"] = "Voice"
            results.append(metrics)
            save_confusion_matrix(
                targets, preds,
                "outputs/plots/confusion_matrix_voice_notebook.png",
                title="Voice — MLP"
            )
            print(f"  ✓ Voice - Notebook (DL): Acc={metrics['Accuracy']*100:.2f}%, F1={metrics['F1 Score']:.4f}, ROC-AUC={metrics['ROC-AUC']:.4f}")

    # =========================================================================
    # 4. TELEMONITORING MODEL
    # =========================================================================
    tele_results = []
    # A. Modular (XGBoost ML)
    tele_mod_path = "outputs/checkpoints/telemonitor_best_model.pkl"
    if X_tele_test is not None and os.path.exists(tele_mod_path):
        try:
            model = TelemonitorXGBRegressor()
            model.load(tele_mod_path)
            preds = model.predict(X_tele_test)
            metrics = compute_regression_metrics(y_tele_test, preds)
            metrics["Model Category"] = "Modular Best (XGBoost ML)"
            metrics["Modality"] = "Telemonitoring"
            tele_results.append(metrics)
            print(f"  ✓ Telemonitoring - Modular (ML): MSE={metrics['MSE']:.4f}, R2={metrics['R2 Score']:.4f}")
        except Exception as e:
            print(f"  ✗ Failed to evaluate Telemonitoring Modular model: {e}")

    # B. Notebook (MLP DL)
    tele_nb_path = "outputs/checkpoints/telemonitor_mlp_best.pth"
    if tele_loader and os.path.exists(tele_nb_path):
        model = TelemonitorMLPRegressor(input_dim=19, hidden_dim=64, output_dim=2).to(device)
        if load_pytorch_weights(model, tele_nb_path):
            metrics = evaluate_regression_pytorch(model, tele_loader)
            metrics["Model Category"] = "Notebook (MLP DL)"
            metrics["Modality"] = "Telemonitoring"
            tele_results.append(metrics)
            print(f"  ✓ Telemonitoring - Notebook (DL): MSE={metrics['MSE']:.4f}, R2={metrics['R2 Score']:.4f}")

    # =========================================================================
    # 5. MULTIMODAL FUSION MODEL
    # =========================================================================
    # A. Modular (Multimodal Projection)
    fusion_mod_path = "outputs/checkpoints/fusion_best_model.pth"
    if fusion_loader and os.path.exists(fusion_mod_path):
        model = ModularMultimodalClassifier(image_dim=256, mri_dim=256, voice_dim=22, clinical_dim=19, fusion_dim=32, num_classes=2).to(device)
        if load_pytorch_weights(model, fusion_mod_path):
            preds_list = []
            probs_list = []
            targets_list = []
            with torch.no_grad():
                for img_emb, mri_emb, voice, clinical, labels in fusion_loader:
                    img_emb = img_emb.to(device)
                    mri_emb = mri_emb.to(device)
                    voice = voice.to(device)
                    clinical = clinical.to(device)
                    
                    outputs = model(img_emb, mri_emb, voice, clinical)
                    softmax_probs = torch.softmax(outputs, dim=1)
                    _, predicted = outputs.max(1)
                    preds_list.extend(predicted.cpu().numpy())
                    probs_list.extend(softmax_probs[:, 1].cpu().numpy())
                    targets_list.extend(labels.numpy())
            metrics = compute_classification_metrics_with_probs(targets_list, preds_list, probs_list)
            metrics["Model Category"] = "Modular Best (Multimodal Projection)"
            metrics["Modality"] = "Multimodal Fusion"
            results.append(metrics)
            save_confusion_matrix(
                targets_list, preds_list,
                "outputs/plots/confusion_matrix_fusion_modular.png",
                title="Multimodal Fusion — Projection Network"
            )
            print(f"  ✓ Multimodal Fusion - Modular: Acc={metrics['Accuracy']*100:.2f}%, F1={metrics['F1 Score']:.4f}, ROC-AUC={metrics['ROC-AUC']:.4f}")

    # B. Notebook (Multimodal Fusion)
    fusion_nb_path = "outputs/checkpoints/fusion_best.pth"
    if fusion_loader and os.path.exists(fusion_nb_path):
        model = NotebookMultimodalClassifier(image_dim=256, mri_dim=256, voice_dim=22, clinical_dim=19, fusion_dim=32).to(device)
        if load_pytorch_weights(model, fusion_nb_path):
            preds_list = []
            probs_list = []
            targets_list = []
            with torch.no_grad():
                for img_emb, mri_emb, voice, clinical, labels in fusion_loader:
                    img_emb = img_emb.to(device)
                    mri_emb = mri_emb.to(device)
                    voice = voice.to(device)
                    clinical = clinical.to(device)
                    
                    outputs = model(img_emb, mri_emb, voice, clinical)
                    softmax_probs = torch.softmax(outputs, dim=1)
                    _, predicted = outputs.max(1)
                    preds_list.extend(predicted.cpu().numpy())
                    probs_list.extend(softmax_probs[:, 1].cpu().numpy())
                    targets_list.extend(labels.numpy())
            metrics = compute_classification_metrics_with_probs(targets_list, preds_list, probs_list)
            metrics["Model Category"] = "Notebook (Multimodal Fusion)"
            metrics["Modality"] = "Multimodal Fusion"
            results.append(metrics)
            save_confusion_matrix(
                targets_list, preds_list,
                "outputs/plots/confusion_matrix_fusion_notebook.png",
                title="Multimodal Fusion — Notebook"
            )
            print(f"  ✓ Multimodal Fusion - Notebook: Acc={metrics['Accuracy']*100:.2f}%, F1={metrics['F1 Score']:.4f}, ROC-AUC={metrics['ROC-AUC']:.4f}")

    # =========================================================================
    # Display Tables
    # =========================================================================
    df_clf = pd.DataFrame(results)
    df_reg = pd.DataFrame(tele_results)

    print("\n" + "="*90)
    print("CLASSIFICATION PERFORMANCE SUMMARY")
    print("="*90)
    display_cols = ["Modality", "Model Category", "Accuracy", "Precision", "Recall", "F1 Score", "ROC-AUC"]
    available_cols = [c for c in display_cols if c in df_clf.columns]
    print(df_clf[available_cols].to_string(index=False))
    print("="*90)

    print("\n" + "="*90)
    print("REGRESSION PERFORMANCE SUMMARY (severity score estimation)")
    print("="*90)
    print(df_reg[["Modality", "Model Category", "MSE", "R2 Score"]].to_string(index=False))
    print("="*90)

    # =========================================================================
    # 6. RUN SAMPLE PATIENT PREDICTION
    # =========================================================================
    print("\nRunning Sample Unified Patient Prediction Walkthrough...")
    
    # Check for validation samples
    try:
        sample_drawings = glob.glob('datasets/validation/images/parkinson/*.png')
        sample_mris = glob.glob('datasets/validation/mri/parkinson/*.png')
        
        if sample_drawings and sample_mris:
            sample_drawing = sample_drawings[0]
            sample_mri = sample_mris[0]
            sample_voice = pd.read_csv('datasets/validation/voice/oxford_validation.csv').drop(columns=['status']).iloc[0].values
            sample_tele = pd.read_csv('datasets/validation/telemonitoring/telemonitor_validation.csv').drop(columns=['motor_UPDRS', 'total_UPDRS']).iloc[0].values
            
            print(f"Using validation samples:")
            print(f"  - Drawing path: {os.path.basename(sample_drawing)}")
            print(f"  - MRI path: {os.path.basename(sample_mri)}")
            
            # Load notebook models for sample prediction (matching notebook 04_final_inference)
            img_model = ImageDrawingClassifier().to(device)
            mri_model = MRIClassifier().to(device)
            voice_model = VoiceMLPClassifier().to(device)
            tele_model = TelemonitorMLPRegressor().to(device)
            fusion_model = NotebookMultimodalClassifier(image_dim=256, mri_dim=256, voice_dim=22, clinical_dim=19, fusion_dim=32).to(device)
            
            load_pytorch_weights(img_model, 'outputs/checkpoints/image_best.pth')
            load_pytorch_weights(mri_model, 'outputs/checkpoints/mri_best.pth')
            load_pytorch_weights(voice_model, 'outputs/checkpoints/voice_mlp_best.pth')
            load_pytorch_weights(tele_model, 'outputs/checkpoints/telemonitor_mlp_best.pth')
            load_pytorch_weights(fusion_model, 'outputs/checkpoints/fusion_best.pth')
            
            # Preprocess samples on the fly
            img = Image.open(sample_drawing).convert('RGB')
            transform = transforms.Compose([
                transforms.Resize((224, 224)),
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
            ])
            img_t = transform(img).unsqueeze(0).to(device)
            
            mri_img = Image.open(sample_mri).convert('RGB')
            mri_t = transform(mri_img).unsqueeze(0).to(device)
            
            with torch.no_grad():
                img_logits = img_model(img_t)
                img_prob = torch.softmax(img_logits, dim=1)[0, 1].item()
                img_embedding = img_model.extract_features(img_t)
                
                mri_logits = mri_model(mri_t)
                mri_prob = torch.softmax(mri_logits, dim=1)[0, 1].item()
                mri_embedding = mri_model.extract_features(mri_t)
                
                v_t = torch.tensor(sample_voice, dtype=torch.float32).unsqueeze(0).to(device)
                v_logits = voice_model(v_t)
                v_prob = torch.softmax(v_logits, dim=1)[0, 1].item()
                
                t_t = torch.tensor(sample_tele, dtype=torch.float32).unsqueeze(0).to(device)
                tele_preds = tele_model(t_t).cpu().numpy()[0]
                motor_updrs, total_updrs = tele_preds[0], tele_preds[1]
                
                fusion_logits = fusion_model(img_embedding, mri_embedding, v_t, t_t)
                fusion_prob = torch.softmax(fusion_logits, dim=1)[0, 1].item()
            
            print('\n================= NeuroFusionAI Results =================')
            print(f'Modality 1: Drawing Parkinson Likelihood:  {img_prob*100:.2f}%')
            print(f'Modality 1.5: MRI Parkinson Likelihood:    {mri_prob*100:.2f}%')
            print(f'Modality 2: Voice Parkinson Likelihood:     {v_prob*100:.2f}%')
            print(f'Multimodal Fused Parkinson Likelihood:      {fusion_prob*100:.2f}%')
            print(f'Severity Prediction (motor_UPDRS):          {motor_updrs:.2f}')
            print(f'Severity Prediction (total_UPDRS):          {total_updrs:.2f}')
            print('=========================================================')
        else:
            print("  ✗ Warning: No drawing/MRI validation files found for sample prediction walkthrough.")
    except Exception as e:
        print(f"  ✗ Error running patient prediction walkthrough: {e}")

    # =========================================================================
    # Save to report markdown file
    # =========================================================================
    os.makedirs("outputs/reports", exist_ok=True)
    report_file = "outputs/reports/test_evaluation_report.md"
    try:
        with open(report_file, "w", encoding="utf-8") as f:
            f.write("# NeuroFusionAI Model Evaluation & Test Report\n\n")
            f.write("This report summarizes the performance of all trained models and multimodal fusion networks on the held-out test datasets.\n\n")
            
            f.write("## 1. Classification Metrics\n\n")
            f.write("| Modality | Model Category | Accuracy | Precision | Recall | F1 Score | ROC-AUC |\n")
            f.write("|---|---|---|---|---|---|---|\n")
            for idx, r in df_clf.iterrows():
                roc_val = f"{r['ROC-AUC']:.4f}" if not np.isnan(r.get('ROC-AUC', float('nan'))) else "N/A"
                f.write(f"| {r['Modality']} | {r['Model Category']} | {r['Accuracy']*100:.2f}% | {r['Precision']:.4f} | {r['Recall']:.4f} | {r['F1 Score']:.4f} | {roc_val} |\n")
            
            f.write("\n## 2. Regression Metrics (UPDRS Severity estimation)\n\n")
            f.write("| Modality | Model Category | Mean Squared Error (MSE) | R2 Score |\n")
            f.write("|---|---|---|---|\n")
            for idx, r in df_reg.iterrows():
                f.write(f"| {r['Modality']} | {r['Model Category']} | {r['MSE']:.4f} | {r['R2 Score']:.4f} |\n")
            
            f.write("\n## 3. Confusion Matrices\n\n")
            cm_files = glob.glob("outputs/plots/confusion_matrix_*.png")
            for cm_file in sorted(cm_files):
                name = os.path.basename(cm_file).replace("confusion_matrix_", "").replace(".png", "").replace("_", " ").title()
                f.write(f"### {name}\n\n")
                f.write(f"![{name}]({os.path.abspath(cm_file)})\n\n")
                
            if sample_drawings and sample_mris:
                f.write("\n## 4. Sample Patient Prediction Case Walkthrough\n\n")
                f.write(f"- **Drawing sample**: `{os.path.basename(sample_drawing)}` (Parkinson validation split)\n")
                f.write(f"- **MRI sample**: `{os.path.basename(sample_mri)}` (Parkinson validation split)\n\n")
                f.write("### Model Outputs\n\n")
                f.write(f"- **Drawing Parkinson Likelihood**: {img_prob*100:.2f}%\n")
                f.write(f"- **MRI Parkinson Likelihood**: {mri_prob*100:.2f}%\n")
                f.write(f"- **Voice Parkinson Likelihood**: {v_prob*100:.2f}%\n")
                f.write(f"- **Multimodal Fused Parkinson Likelihood**: {fusion_prob*100:.2f}%\n")
                f.write(f"- **Severity Prediction (motor_UPDRS)**: {motor_updrs:.2f}\n")
                f.write(f"- **Severity Prediction (total_UPDRS)**: {total_updrs:.2f}\n")
        
        print(f"\n✓ Detailed report successfully saved to {report_file}")
    except Exception as e:
        print(f"✗ Failed to write report file: {e}")

if __name__ == "__main__":
    main()
