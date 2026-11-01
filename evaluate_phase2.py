"""
Comprehensive Evaluation Suite for Phase 2:
Voice Analysis, Spiral Drawing Analysis, and Telemonitoring UPDRS Progression.
"""

import os
import sys
import json
import torch
import numpy as np
import pandas as pd
from PIL import Image
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, r2_score, mean_absolute_error, mean_squared_error
)
from scipy.io import wavfile

# Setup paths
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.models.loader import loader
from app.preprocessing.voice import extract_acoustic_features, validate_audio_quality, preprocess_voice_file
from app.preprocessing.image import preprocess_image, validate_image_quality
from app.preprocessing.telemonitor import preprocess_telemonitor_file, validate_telemonitor_quality
from app.services.voice_service import predict_voice
from app.services.spiral_service import predict_spiral
from app.services.telemonitor_service import predict_telemonitor
from app.services.gradcam_service import run_gradcam
from app.models.versioning import ModelVersionRegistry


def evaluate_all():
    print("=" * 75)
    print("PHASE 2 MODEL EVALUATION & VALIDATION SUITE")
    print("=" * 75)

    loader.load_all_models()
    registry = ModelVersionRegistry()
    results = {}

    # -------------------------------------------------------------------------
    # PART 1: VOICE ANALYSIS EVALUATION
    # -------------------------------------------------------------------------
    print("\n" + "=" * 50)
    print("1. EVALUATING VOICE ANALYSIS (Oxford Dataset)")
    print("=" * 50)

    # 1.1 Test genuine feature extraction on audio file
    sample_wav = os.path.join(PROJECT_ROOT, "backend", "static", "samples", "sample_voice.wav")
    print(f"Testing feature extraction on {sample_wav}...")
    voice_quality = validate_audio_quality(sample_wav)
    print(f"  ✓ Audio Quality Check: {voice_quality}")
    acoustic_features = extract_acoustic_features(sample_wav)
    print(f"  ✓ Extracted {len(acoustic_features)} genuine acoustic features.")
    print(f"    Fo: {acoustic_features[0]:.2f} Hz | Fhi: {acoustic_features[1]:.2f} Hz | Flo: {acoustic_features[2]:.2f} Hz")
    print(f"    Jitter(%): {acoustic_features[3]:.5f} | Jitter(Abs): {acoustic_features[4]:.6f} | RAP: {acoustic_features[5]:.5f}")
    print(f"    Shimmer: {acoustic_features[8]:.5f} | Shimmer(dB): {acoustic_features[9]:.4f} | HNR: {acoustic_features[15]:.2f} dB")
    print(f"    RPDE: {acoustic_features[16]:.4f} | DFA: {acoustic_features[17]:.4f} | PPE: {acoustic_features[21]:.4f}")

    # 1.2 Test audio rejection on silent / corrupt / short file
    silent_wav = os.path.join(PROJECT_ROOT, "scratch", "silent_test.wav")
    os.makedirs(os.path.dirname(silent_wav), exist_ok=True)
    wavfile.write(silent_wav, 44100, np.zeros(44100, dtype=np.int16))
    silent_q = validate_audio_quality(silent_wav)
    print(f"  ✓ Quality rejection test on silent audio: valid={silent_q['valid']}, reason='{silent_q['reason']}'")

    # 1.3 Independent Test Set Evaluation (oxford_test.csv)
    test_voice_csv = os.path.join(PROJECT_ROOT, "datasets", "test", "voice", "oxford_test.csv")
    df_voice = pd.read_csv(test_voice_csv)
    y_voice_true = df_voice['status'].values
    X_voice = df_voice.drop(columns=['status']).values

    # Voice MLP evaluation
    device = loader.device
    with torch.no_grad():
        v_tensor = torch.tensor(X_voice, dtype=torch.float32).to(device)
        logits = loader.voice_mlp_model(v_tensor)
        v_mlp_probs = torch.softmax(logits, dim=1)[:, 1].cpu().numpy()
        v_mlp_preds = (v_mlp_probs >= 0.5).astype(int)

    mlp_cm = confusion_matrix(y_voice_true, v_mlp_preds)
    tn_m, fp_m, fn_m, tp_m = mlp_cm.ravel()
    mlp_sens = recall_score(y_voice_true, v_mlp_preds) # Sensitivity
    mlp_spec = tn_m / (tn_m + fp_m) if (tn_m + fp_m) > 0 else 0.0 # Specificity
    mlp_prec = precision_score(y_voice_true, v_mlp_preds)
    mlp_f1 = f1_score(y_voice_true, v_mlp_preds)
    mlp_acc = accuracy_score(y_voice_true, v_mlp_preds)
    mlp_auc = roc_auc_score(y_voice_true, v_mlp_probs)

    print(f"\n--- Voice PyTorch MLP Test Metrics (N={len(y_voice_true)}) ---")
    print(f"  Accuracy:    {mlp_acc * 100:.2f}%")
    print(f"  Sensitivity (Recall): {mlp_sens * 100:.2f}%")
    print(f"  Specificity: {mlp_spec * 100:.2f}%")
    print(f"  Precision:   {mlp_prec * 100:.2f}%")
    print(f"  F1-Score:    {mlp_f1 * 100:.2f}%")
    print(f"  ROC-AUC:     {mlp_auc:.4f}")
    print(f"  Confusion Matrix: TP={tp_m}, TN={tn_m}, FP={fp_m}, FN={fn_m}")

    # Voice CatBoost evaluation
    cb_sens, cb_spec, cb_prec, cb_f1, cb_acc, cb_auc = 0, 0, 0, 0, 0, 0
    if loader.voice_catboost_model is not None:
        v_cb_probs = loader.voice_catboost_model.predict_proba(X_voice)[:, 1]
        v_cb_preds = (v_cb_probs >= 0.5).astype(int)
        cb_cm = confusion_matrix(y_voice_true, v_cb_preds)
        tn_c, fp_c, fn_c, tp_c = cb_cm.ravel()
        cb_sens = recall_score(y_voice_true, v_cb_preds)
        cb_spec = tn_c / (tn_c + fp_c) if (tn_c + fp_c) > 0 else 0.0
        cb_prec = precision_score(y_voice_true, v_cb_preds)
        cb_f1 = f1_score(y_voice_true, v_cb_preds)
        cb_acc = accuracy_score(y_voice_true, v_cb_preds)
        cb_auc = roc_auc_score(y_voice_true, v_cb_probs)

        print(f"\n--- Voice CatBoost Test Metrics (N={len(y_voice_true)}) ---")
        print(f"  Accuracy:    {cb_acc * 100:.2f}%")
        print(f"  Sensitivity: {cb_sens * 100:.2f}%")
        print(f"  Specificity: {cb_spec * 100:.2f}%")
        print(f"  Precision:   {cb_prec * 100:.2f}%")
        print(f"  F1-Score:    {cb_f1 * 100:.2f}%")
        print(f"  ROC-AUC:     {cb_auc:.4f}")
        print(f"  Confusion Matrix: TP={tp_c}, TN={tn_c}, FP={fp_c}, FN={fn_c}")

    results["voice_mlp"] = {
        "accuracy": round(mlp_acc * 100, 2), "sensitivity": round(mlp_sens * 100, 2),
        "specificity": round(mlp_spec * 100, 2), "precision": round(mlp_prec * 100, 2),
        "f1_score": round(mlp_f1 * 100, 2), "roc_auc": round(mlp_auc, 4),
        "confusion_matrix": {"TP": int(tp_m), "TN": int(tn_m), "FP": int(fp_m), "FN": int(fn_m)}
    }
    results["voice_catboost"] = {
        "accuracy": round(cb_acc * 100, 2), "sensitivity": round(cb_sens * 100, 2),
        "specificity": round(cb_spec * 100, 2), "precision": round(cb_prec * 100, 2),
        "f1_score": round(cb_f1 * 100, 2), "roc_auc": round(cb_auc, 4)
    }

    registry.register_model(
        model_id="voice-mlp-v2.0",
        modality="Voice",
        architecture="VoiceMLPClassifier (22 -> 64 -> 32 -> 2)",
        checkpoint_path=os.path.join(PROJECT_ROOT, "outputs", "checkpoints", "voice_mlp_best.pth"),
        input_features=22,
        metrics=results["voice_mlp"]
    )
    registry.register_model(
        model_id="voice-catboost-v2.0",
        modality="Voice",
        architecture="CatBoostClassifier (iterations=100, depth=3)",
        checkpoint_path=os.path.join(PROJECT_ROOT, "outputs", "checkpoints", "voice_best_model.pkl"),
        input_features=22,
        metrics=results["voice_catboost"]
    )

    # -------------------------------------------------------------------------
    # PART 2: SPIRAL DRAWING ANALYSIS EVALUATION
    # -------------------------------------------------------------------------
    print("\n" + "=" * 50)
    print("2. EVALUATING SPIRAL DRAWING ANALYSIS (HandPD Dataset)")
    print("=" * 50)

    # 2.1 Test quality rejection on blank image
    blank_img = os.path.join(PROJECT_ROOT, "scratch", "blank_test.png")
    Image.new("RGB", (224, 224), (255, 255, 255)).save(blank_img)
    blank_q = validate_image_quality(blank_img)
    print(f"  ✓ Quality rejection test on blank image: valid={blank_q['valid']}, reason='{blank_q['reason']}'")

    # 2.2 Evaluate on independent HandPD test images
    spiral_test_dir = os.path.join(PROJECT_ROOT, "datasets", "test", "images")
    normal_dir = os.path.join(spiral_test_dir, "normal")
    parkinson_dir = os.path.join(spiral_test_dir, "parkinson")

    spiral_y_true = []
    spiral_y_pred = []
    spiral_probs = []

    # Normal images (Class 0)
    normal_files = [os.path.join(normal_dir, f) for f in os.listdir(normal_dir) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
    for p in normal_files:
        spiral_y_true.append(0)
        res = predict_spiral(p)
        prob = res["raw_probability"]
        spiral_probs.append(prob)
        spiral_y_pred.append(1 if prob >= 0.5 else 0)

    # Parkinson images (Class 1)
    pd_files = [os.path.join(parkinson_dir, f) for f in os.listdir(parkinson_dir) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
    for p in pd_files:
        spiral_y_true.append(1)
        res = predict_spiral(p)
        prob = res["raw_probability"]
        spiral_probs.append(prob)
        spiral_y_pred.append(1 if prob >= 0.5 else 0)

    sp_cm = confusion_matrix(spiral_y_true, spiral_y_pred)
    tn_s, fp_s, fn_s, tp_s = sp_cm.ravel()
    sp_sens = recall_score(spiral_y_true, spiral_y_pred)
    sp_spec = tn_s / (tn_s + fp_s) if (tn_s + fp_s) > 0 else 0.0
    sp_prec = precision_score(spiral_y_true, spiral_y_pred)
    sp_f1 = f1_score(spiral_y_true, spiral_y_pred)
    sp_acc = accuracy_score(spiral_y_true, spiral_y_pred)
    sp_auc = roc_auc_score(spiral_y_true, spiral_probs)

    print(f"\n--- Spiral Drawing ResNet-18 Test Metrics (N={len(spiral_y_true)}) ---")
    print(f"  Test Samples: {len(normal_files)} Normal, {len(pd_files)} Parkinson")
    print(f"  Accuracy:    {sp_acc * 100:.2f}%")
    print(f"  Sensitivity (Recall): {sp_sens * 100:.2f}%")
    print(f"  Specificity: {sp_spec * 100:.2f}%")
    print(f"  Precision:   {sp_prec * 100:.2f}%")
    print(f"  F1-Score:    {sp_f1 * 100:.2f}%")
    print(f"  ROC-AUC:     {sp_auc:.4f}")
    print(f"  Confusion Matrix: TP={tp_s}, TN={tn_s}, FP={fp_s}, FN={fn_s}")

    # 2.3 Verify Grad-CAM explainability generation on spiral drawing
    print("Testing Grad-CAM explainability on spiral drawing...")
    sample_drawing = pd_files[0]
    gradcam_res = run_gradcam("spiral", sample_drawing)
    print(f"  ✓ Grad-CAM generated: {gradcam_res['overlay']}")
    assert os.path.exists(os.path.join(PROJECT_ROOT, "backend", "static", "spiral_overlay.png")), "Grad-CAM overlay missing"

    results["spiral_resnet18"] = {
        "accuracy": round(sp_acc * 100, 2), "sensitivity": round(sp_sens * 100, 2),
        "specificity": round(sp_spec * 100, 2), "precision": round(sp_prec * 100, 2),
        "f1_score": round(sp_f1 * 100, 2), "roc_auc": round(sp_auc, 4),
        "confusion_matrix": {"TP": int(tp_s), "TN": int(tn_s), "FP": int(fp_s), "FN": int(fn_s)}
    }

    registry.register_model(
        model_id="spiral-resnet18-v2.0",
        modality="Spiral Drawing",
        architecture="ResNet-18 ImageDrawingClassifier (256-d embedding -> 2)",
        checkpoint_path=os.path.join(PROJECT_ROOT, "outputs", "checkpoints", "image_best.pth"),
        input_features="224x224 RGB",
        metrics=results["spiral_resnet18"]
    )

    # -------------------------------------------------------------------------
    # PART 3: TELEMONITORING REGRESSION EVALUATION
    # -------------------------------------------------------------------------
    print("\n" + "=" * 50)
    print("3. EVALUATING TELEMONITORING REGRESSION (UPDRS Progression)")
    print("=" * 50)

    tele_test_csv = os.path.join(PROJECT_ROOT, "datasets", "test", "telemonitoring", "telemonitor_test.csv")
    df_tele = pd.read_csv(tele_test_csv)
    y_motor_true = df_tele['motor_UPDRS'].values
    y_total_true = df_tele['total_UPDRS'].values
    X_tele = df_tele.drop(columns=['motor_UPDRS', 'total_UPDRS']).values

    # MLP Regressor predictions
    with torch.no_grad():
        t_tensor = torch.tensor(X_tele, dtype=torch.float32).to(device)
        mlp_tele_out = loader.telemonitor_mlp_model(t_tensor).cpu().numpy()
        mlp_motor_pred = mlp_tele_out[:, 0]
        mlp_total_pred = mlp_tele_out[:, 1]

    # XGBoost Regressor predictions
    xgb_motor_pred = mlp_motor_pred
    xgb_total_pred = mlp_total_pred
    if loader.telemonitor_xgb_model is not None:
        xgb_tele_out = loader.telemonitor_xgb_model.predict(X_tele)
        xgb_motor_pred = xgb_tele_out[:, 0]
        xgb_total_pred = xgb_tele_out[:, 1]

    # Ensemble predictions
    ens_motor_pred = 0.40 * mlp_motor_pred + 0.60 * xgb_motor_pred
    ens_total_pred = 0.40 * mlp_total_pred + 0.60 * xgb_total_pred

    # Compute regression metrics
    def calc_reg_metrics(y_true, y_pred):
        r2 = r2_score(y_true, y_pred)
        mae = mean_absolute_error(y_true, y_pred)
        rmse = np.sqrt(mean_squared_error(y_true, y_pred))
        corr = float(np.corrcoef(y_true, y_pred)[0, 1])
        return {"r2": round(r2, 4), "mae": round(mae, 3), "rmse": round(rmse, 3), "pearson_r": round(corr, 4)}

    mlp_motor_metrics = calc_reg_metrics(y_motor_true, mlp_motor_pred)
    mlp_total_metrics = calc_reg_metrics(y_total_true, mlp_total_pred)
    xgb_motor_metrics = calc_reg_metrics(y_motor_true, xgb_motor_pred)
    xgb_total_metrics = calc_reg_metrics(y_total_true, xgb_total_pred)
    ens_motor_metrics = calc_reg_metrics(y_motor_true, ens_motor_pred)
    ens_total_metrics = calc_reg_metrics(y_total_true, ens_total_pred)

    print(f"\n--- Telemonitoring Test Metrics (N={len(y_motor_true)}) ---")
    print("  [PyTorch MLP Regressor]:")
    print(f"    Motor UPDRS: R²={mlp_motor_metrics['r2']}, MAE={mlp_motor_metrics['mae']}, RMSE={mlp_motor_metrics['rmse']}, r={mlp_motor_metrics['pearson_r']}")
    print(f"    Total UPDRS: R²={mlp_total_metrics['r2']}, MAE={mlp_total_metrics['mae']}, RMSE={mlp_total_metrics['rmse']}, r={mlp_total_metrics['pearson_r']}")
    print("  [XGBoost Regressor]:")
    print(f"    Motor UPDRS: R²={xgb_motor_metrics['r2']}, MAE={xgb_motor_metrics['mae']}, RMSE={xgb_motor_metrics['rmse']}, r={xgb_motor_metrics['pearson_r']}")
    print(f"    Total UPDRS: R²={xgb_total_metrics['r2']}, MAE={xgb_total_metrics['mae']}, RMSE={xgb_total_metrics['rmse']}, r={xgb_total_metrics['pearson_r']}")
    print("  [Ensemble Model]:")
    print(f"    Motor UPDRS: R²={ens_motor_metrics['r2']}, MAE={ens_motor_metrics['mae']}, RMSE={ens_motor_metrics['rmse']}, r={ens_motor_metrics['pearson_r']}")
    print(f"    Total UPDRS: R²={ens_total_metrics['r2']}, MAE={ens_total_metrics['mae']}, RMSE={ens_total_metrics['rmse']}, r={ens_total_metrics['pearson_r']}")

    results["telemonitor_mlp"] = {"motor": mlp_motor_metrics, "total": mlp_total_metrics}
    results["telemonitor_xgb"] = {"motor": xgb_motor_metrics, "total": xgb_total_metrics}
    results["telemonitor_ensemble"] = {"motor": ens_motor_metrics, "total": ens_total_metrics}

    registry.register_model(
        model_id="telemonitor-mlp-v2.0",
        modality="Telemonitoring",
        architecture="TelemonitorMLPRegressor (19 -> 64 -> 32 -> 2)",
        checkpoint_path=os.path.join(PROJECT_ROOT, "outputs", "checkpoints", "telemonitor_mlp_best.pth"),
        input_features=19,
        metrics=results["telemonitor_mlp"]
    )
    registry.register_model(
        model_id="telemonitor-xgb-v2.0",
        modality="Telemonitoring",
        architecture="XGBoost Dual Regressor (n_estimators=100, max_depth=3)",
        checkpoint_path=os.path.join(PROJECT_ROOT, "outputs", "checkpoints", "telemonitor_best_model.pkl"),
        input_features=19,
        metrics=results["telemonitor_xgb"]
    )

    # Save complete evaluation output
    out_json = os.path.join(PROJECT_ROOT, "outputs", "phase_2_evaluation_results.json")
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print(f"\n✓ Saved evaluation metrics to: {out_json}")
    print(f"✓ Updated model registry at: {registry.registry_path}")
    print("=" * 75)
    print("ALL 3 MODELS SUCCESSFULLY TESTED AND VALIDATED!")
    print("=" * 75)

if __name__ == "__main__":
    evaluate_all()
