"""
SHAP (SHapley Additive exPlanations) analysis for Voice and Telemonitoring models.
Generates genuine TreeExplainer Shapley values and beeswarm/bar/force plots.

Usage:
    python explainability/shap_analysis.py --modality voice
    python explainability/shap_analysis.py --modality telemonitor
"""
import os
import sys
import argparse
import numpy as np
import pandas as pd

try:
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from app.preprocessing.voice import extract_acoustic_features

VOICE_FEATURE_NAMES = [
    "MDVP:Fo(Hz)", "MDVP:Fhi(Hz)", "MDVP:Flo(Hz)", "MDVP:Jitter(%)",
    "MDVP:Jitter(Abs)", "MDVP:RAP", "MDVP:PPQ", "Jitter:DDP",
    "MDVP:Shimmer", "MDVP:Shimmer(dB)", "Shimmer:APQ3", "Shimmer:APQ5",
    "MDVP:APQ", "Shimmer:DDA", "NHR", "HNR",
    "RPDE", "DFA", "spread1", "spread2", "D2", "PPE"
]

VOICE_FEATURE_DESCRIPTIONS = {
    "MDVP:Fo(Hz)": ("Average vocal fundamental frequency", "100-250 Hz", "Pitch"),
    "MDVP:Fhi(Hz)": ("Maximum vocal fundamental frequency", "120-300 Hz", "Pitch"),
    "MDVP:Flo(Hz)": ("Minimum vocal fundamental frequency", "80-200 Hz", "Pitch"),
    "MDVP:Jitter(%)": ("Cycle-to-cycle frequency variation ratio", "< 0.40%", "Fundamental Frequency"),
    "MDVP:Jitter(Abs)": ("Absolute cycle-to-cycle frequency variation", "< 0.00004 s", "Fundamental Frequency"),
    "MDVP:RAP": ("Relative amplitude perturbation (3-period average)", "< 0.25%", "Period Perturbation"),
    "MDVP:PPQ": ("Period perturbation quotient (5-period average)", "< 0.30%", "Period Perturbation"),
    "Jitter:DDP": ("Average absolute difference of differences between cycles", "< 0.75%", "Period Perturbation"),
    "MDVP:Shimmer": ("Local cycle-to-cycle amplitude deviation ratio", "< 3.0%", "Amplitude Perturbation"),
    "MDVP:Shimmer(dB)": ("Local shimmer expressed in decibels", "< 0.025 dB", "Amplitude Perturbation"),
    "Shimmer:APQ3": ("3-point amplitude perturbation quotient", "< 1.5%", "Amplitude Perturbation"),
    "Shimmer:APQ5": ("5-point amplitude perturbation quotient", "< 1.8%", "Amplitude Perturbation"),
    "MDVP:APQ": ("11-point amplitude perturbation quotient", "< 2.5%", "Amplitude Perturbation"),
    "Shimmer:DDA": ("Average absolute difference between consecutive amplitude differences", "< 4.5%", "Amplitude Perturbation"),
    "NHR": ("Noise-to-Harmonics Ratio", "< 0.03", "Noise Ratio"),
    "HNR": ("Harmonics-to-Noise Ratio (acoustic purity)", "> 20.0 dB", "Noise Ratio"),
    "RPDE": ("Recurrence Period Density Entropy", "< 0.45", "Nonlinear Dynamics"),
    "DFA": ("Detrended Fluctuation Analysis fractal exponent", "0.55 - 0.70", "Nonlinear Dynamics"),
    "spread1": ("Nonlinear measure of fundamental frequency variation", "< -5.5", "Nonlinear Dynamics"),
    "spread2": ("Higher-order fundamental frequency variation", "< 0.20", "Nonlinear Dynamics"),
    "D2": ("Correlation dimension (system complexity)", "1.8 - 2.5", "Nonlinear Dynamics"),
    "PPE": ("Pitch Period Entropy (impaired phonatory control)", "< 0.15", "Nonlinear Dynamics")
}

TELEMONITOR_FEATURE_NAMES = [
    "age", "sex", "test_time",
    "Jitter(%)", "Jitter(Abs)", "Jitter:RAP", "Jitter:PPQ5", "Jitter:DDP",
    "Shimmer", "Shimmer(dB)", "Shimmer:APQ3", "Shimmer:APQ5", "Shimmer:APQ11",
    "Shimmer:DDA", "NHR", "HNR", "RPDE", "DFA", "PPE"
]


def compute_real_shap_metrics(features_scaled, raw_features_dict=None, model=None, modality="voice"):
    """
    Computes genuine SHAP values for a single patient sample using TreeExplainer on CatBoost or XGBoost.
    Returns ranked feature attributions with medical descriptions.
    """
    import shap
    from app.models.loader import loader

    if features_scaled is None:
        return []

    try:
        if modality == "telemonitor":
            if model is None:
                model = loader.telemonitor_xgb_model
            if hasattr(model, 'total_model'):
                inner = model.total_model
            elif isinstance(model, tuple):
                inner = model[1]
            else:
                inner = model
            feature_names = TELEMONITOR_FEATURE_NAMES
        else:
            if model is None:
                model = loader.voice_catboost_model
            inner = model.model if hasattr(model, 'model') else model
            feature_names = VOICE_FEATURE_NAMES

        if inner is None:
            return []

        explainer = shap.TreeExplainer(inner)
        x = np.array(features_scaled).reshape(1, -1)
        shap_vals = explainer.shap_values(x)

        if isinstance(shap_vals, list):
            p_shap = shap_vals[1][0] if len(shap_vals) > 1 else shap_vals[0][0]
        elif len(np.array(shap_vals).shape) == 3:
            p_shap = shap_vals[0, :, 1]
        else:
            p_shap = shap_vals[0]

        # Rank features by absolute SHAP magnitude
        ranked_indices = np.argsort(np.abs(p_shap))[::-1]

        metrics = []
        for rank, idx in enumerate(ranked_indices[:6], start=1):
            if idx >= len(feature_names):
                continue
            name = feature_names[idx]
            shap_val = float(round(p_shap[idx], 4))
            desc, threshold, category = VOICE_FEATURE_DESCRIPTIONS.get(name, ("Progression biomarker", "Normal range", "Clinical Metric"))

            raw_val = None
            if raw_features_dict and name in raw_features_dict:
                raw_val = raw_features_dict[name]
            elif idx < len(features_scaled):
                raw_val = float(features_scaled[idx])
            else:
                raw_val = 0.0

            # Format patient value representation
            if "%" in name or "Jitter(%)" in name or "Shimmer" in name and "dB" not in name:
                val_str = f"{raw_val * 100:.3f}%" if raw_val < 0.1 else f"{raw_val:.3f}%"
            elif "dB" in name or "HNR" in name:
                val_str = f"{raw_val:.2f} dB"
            elif "Hz" in name:
                val_str = f"{raw_val:.1f} Hz"
            else:
                val_str = f"{raw_val:.4f}"

            status = "Elevated Risk" if shap_val > 0.02 else ("Protective / Normal" if shap_val < -0.02 else "Neutral")

            metrics.append({
                "name": name,
                "code": name,
                "category": category,
                "patientValue": val_str,
                "normalThreshold": threshold,
                "shapValue": shap_val,
                "importanceRank": rank,
                "status": status,
                "clinicalDescription": desc
            })

        return metrics
    except Exception as e:
        logger.warning(f"Failed to compute SHAP metrics: {e}")
        return []


def generate_shap_analysis(modality, output_dir=None, max_samples=100, single_sample_path=None, model=None):
    """
    Generate genuine SHAP analysis plots for a tabular modality.
    Supports patient-specific explanation if single_sample_path is provided.
    """
    import shap
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt

    if output_dir is None:
        output_dir = os.path.join(PROJECT_ROOT, "outputs", "plots")
    os.makedirs(output_dir, exist_ok=True)

    if modality == "voice":
        test_csv = os.path.join(PROJECT_ROOT, "datasets", "test", "voice", "oxford_test.csv")
        df = pd.read_csv(test_csv)
        X = df.drop(columns=["status"]).values
        feature_names = VOICE_FEATURE_NAMES if len(VOICE_FEATURE_NAMES) == X.shape[1] else [f"F{i}" for i in range(X.shape[1])]
        title_base = "Voice Phonation (CatBoost)"
        prefix = "voice"

        if model is None:
            from training.models.voice.catboost import VoiceCatBoostClassifier
            model_path = os.path.join(PROJECT_ROOT, "outputs", "checkpoints", "voice_best_model.pkl")
            model = VoiceCatBoostClassifier()
            model.load(model_path)

    elif modality == "telemonitor":
        test_csv = os.path.join(PROJECT_ROOT, "datasets", "test", "telemonitoring", "telemonitor_test.csv")
        df = pd.read_csv(test_csv)
        X = df.drop(columns=["motor_UPDRS", "total_UPDRS"]).values
        feature_names = TELEMONITOR_FEATURE_NAMES if len(TELEMONITOR_FEATURE_NAMES) == X.shape[1] else [f"F{i}" for i in range(X.shape[1])]
        title_base = "Telemonitoring UPDRS (XGBoost)"
        prefix = "telemonitor"

        if model is None:
            from training.models.telemonitor.xgboost import TelemonitorXGBRegressor
            model_path = os.path.join(PROJECT_ROOT, "outputs", "checkpoints", "telemonitor_best_model.pkl")
            model = TelemonitorXGBRegressor()
            model.load(model_path)
    else:
        raise ValueError(f"Unknown modality: {modality}. Use 'voice' or 'telemonitor'.")

    # Limit samples for global background
    if X.shape[0] > max_samples:
        idx = np.random.RandomState(42).choice(X.shape[0], max_samples, replace=False)
        X_sample = X[idx].copy()
    else:
        X_sample = X.copy()

    # Override first sample if patient file is provided
    if single_sample_path:
        patient_features = None
        if modality == "voice":
            if single_sample_path.lower().endswith(".wav"):
                # Use genuine acoustic signal extraction
                raw_feat = extract_acoustic_features(single_sample_path)
                from app.models.loader import loader
                if loader.voice_scaler is not None:
                    patient_features = loader.voice_scaler.transform(raw_feat.reshape(1, -1))[0]
                else:
                    patient_features = raw_feat
            elif single_sample_path.lower().endswith(".csv"):
                pdf = pd.read_csv(single_sample_path)
                for c in ["status", "name", "id"]:
                    if c in pdf.columns:
                        pdf = pdf.drop(columns=[c])
                patient_features = pdf.iloc[0].values.astype(float)
        elif modality == "telemonitor" and single_sample_path.lower().endswith(".csv"):
            pdf = pd.read_csv(single_sample_path)
            for col in ["motor_UPDRS", "total_UPDRS", "subject#", "subject_id", "id"]:
                if col in pdf.columns:
                    pdf = pdf.drop(columns=[col])
            patient_features = pdf.iloc[0].values.astype(float)

        if patient_features is not None and len(patient_features) == X_sample.shape[1]:
            X_sample[0] = patient_features

    # Create TreeExplainer
    inner = model.model if hasattr(model, 'model') else model
    if isinstance(inner, tuple):
        inner = inner[1] if len(inner) > 1 else inner[0]
    elif hasattr(inner, 'total_model'):
        inner = inner.total_model
    else:
        inner = inner

    try:
        explainer = shap.TreeExplainer(inner)
        shap_values = explainer.shap_values(X_sample)
    except Exception as te:
        print(f"TreeExplainer fallback: {te}")
        predict_fn = inner.predict if hasattr(inner, 'predict') else (model.predict if hasattr(model, 'predict') else None)
        background = shap.sample(X_sample, min(30, len(X_sample)))
        explainer = shap.KernelExplainer(predict_fn, background)
        shap_values = explainer.shap_values(X_sample[:10])
    if isinstance(shap_values, list):
        shap_plot = shap_values[1] if len(shap_values) > 1 else shap_values[0]
    else:
        shap_plot = shap_values

    X_df = pd.DataFrame(X_sample, columns=feature_names)
    paths = {}

    # 1. Summary plot
    p = os.path.join(output_dir, f"{prefix}_shap_summary.png")
    plt.figure(figsize=(10, 7))
    shap.summary_plot(shap_plot, X_df, show=False, plot_size=None)
    plt.title(f"SHAP Summary — {title_base}", fontsize=14, fontweight='bold', pad=15)
    plt.tight_layout()
    plt.savefig(p, dpi=150, bbox_inches='tight')
    plt.close('all')
    paths["summary"] = p

    # 2. Bar plot
    p = os.path.join(output_dir, f"{prefix}_shap_bar.png")
    plt.figure(figsize=(10, 7))
    shap.summary_plot(shap_plot, X_df, plot_type="bar", show=False, plot_size=None)
    plt.title(f"Mean |SHAP| — {title_base}", fontsize=14, fontweight='bold', pad=15)
    plt.tight_layout()
    plt.savefig(p, dpi=150, bbox_inches='tight')
    plt.close('all')
    paths["bar"] = p

    # 3. Force plot
    p = os.path.join(output_dir, f"{prefix}_force_plot.png")
    try:
        exp_val = explainer.expected_value
        if isinstance(exp_val, (list, np.ndarray)):
            exp_val = exp_val[1] if len(exp_val) > 1 else exp_val[0]
        single_shap = shap_plot[0]

        fig = shap.force_plot(
            exp_val,
            single_shap,
            X_df.iloc[0],
            feature_names=feature_names,
            matplotlib=True,
            show=False
        )
        plt.title(f"SHAP Force Plot — {title_base}", fontsize=12, fontweight='bold', pad=20)
        plt.tight_layout()
        plt.savefig(p, dpi=150, bbox_inches='tight')
        plt.close('all')
        paths["force"] = p
    except Exception as e:
        print(f"  ⚠ Force plot generation note: {e}")

    return paths
