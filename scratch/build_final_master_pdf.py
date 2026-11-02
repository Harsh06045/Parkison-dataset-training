"""
Script to:
1. Clean up old/intermediate PDF files in backend/storage/reports and backend/generated_reports
2. Generate ONE authoritative, comprehensive final clinical PDF with all multimodal details
"""

import os
import sys
import glob
from datetime import datetime

# Setup paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")

sys.path.insert(0, BACKEND_DIR)
sys.path.insert(0, PROJECT_ROOT)

os.environ["MPLCONFIGDIR"] = os.path.join(BACKEND_DIR, "uploads", "mpl")

from app.utils.pdf_generator import generate_patient_report
from app.config import STATIC_DIR

def clean_old_pdfs():
    print("--- Cleaning old intermediate PDF files ---")
    reports_dir = os.path.join(BACKEND_DIR, "storage", "reports")
    gen_dir = os.path.join(BACKEND_DIR, "generated_reports")
    
    removed = 0
    for d in [reports_dir, gen_dir]:
        if os.path.exists(d):
            for pdf_file in glob.glob(os.path.join(d, "*.pdf")):
                try:
                    os.remove(pdf_file)
                    print(f"Removed: {os.path.basename(pdf_file)}")
                    removed += 1
                except Exception as e:
                    print(f"Failed to remove {pdf_file}: {e}")
    print(f"Total old PDFs removed: {removed}\n")

def generate_master_final_pdf():
    print("--- Generating ONE Final Master Clinical PDF with ALL Details ---")
    
    # Static asset paths
    orig_mri = os.path.join(STATIC_DIR, "testing", "mri_sample_0001_original.png")
    overlay_mri = os.path.join(STATIC_DIR, "testing", "mri_sample_0001_overlay.png")
    
    orig_spiral = os.path.join(STATIC_DIR, "testing", "spiral_sample_0001_original.png")
    overlay_spiral = os.path.join(STATIC_DIR, "testing", "spiral_sample_0001_overlay.png")
    
    voice_shap = os.path.join(STATIC_DIR, "voice_shap_summary.png")
    if not os.path.exists(voice_shap):
        voice_shap = os.path.join(STATIC_DIR, "testing", "voice_shap_summary.png")
        
    fusion_chart = os.path.join(STATIC_DIR, "fusion_contribution.png")
    
    report_data = {
        "report_id": "REP-20261102-FINAL-MASTER",
        "report_stage": "FINAL_CLINICAL",
        "is_approved": True,
        
        # 1. Patient Details
        "patient": {
            "id": "PAT-1083",
            "name": "Eleanor Vance",
            "age": 68,
            "gender": "Female",
            "diagnosis": "Parkinson's Disease (Tremor-Dominant Phenotype, Stage II)"
        },
        
        # 2. Attending Doctor Details
        "doctor": {
            "id": "DOC-8921",
            "name": "Dr. Sarah Jenkins, MD, PhD",
            "license": "MD-98472-NEURO",
            "department": "Division of Cognitive Neurology & Movement Disorders",
            "hospital": "Metropolitan Neurological Institute & Research Hospital"
        },
        
        # 3. Examination Details
        "examination": {
            "id": "EXAM-20261102-MM01",
            "scan_date": "November 02, 2026",
            "report_date": "November 02, 2026",
            "modality": "Comprehensive Multimodal Battery (MRI + Voice + Spiral + UPDRS + EEG)",
            "protocol": "Siemens 3T Magnetom / NFA-v2.0 Multimodal Clinical Protocol"
        },
        
        # 4. Multimodal Disease Prediction Verdict
        "prediction": {
            "disease": "Parkinson's Disease Assessment",
            "predicted_class": "Parkinson's Disease (Tremor-Dominant)",
            "confidence": 98.7,
            "class_probabilities": {
                "Parkinson's Disease": 0.987,
                "Normal Control": 0.009,
                "Alzheimer's Disease": 0.004
            }
        },
        
        # 5. MRI Neuroimaging & Grad-CAM
        "mri_results": {
            "scan_details": "Siemens 3T Magnetom Prisma, Axial Volumetric T1/T2 & DWI",
            "original_scan": orig_mri,
            "gradcam_overlay": overlay_mri,
            "gradcam_heatmap": overlay_mri
        },
        
        # 6. Voice Phonation & Vocal SHAP
        "voice_results": {
            "f0_hz": 154.2,
            "jitter_pct": 0.54,
            "shimmer_pct": 3.82,
            "hnr_db": 18.4,
            "duration_sec": 4.8,
            "vocal_tremor": "Detected (5.1 Hz micro-tremor)",
            "shap_summary_image": voice_shap
        },
        
        # 7. Spiral Drawing Motor Kinematics & Grad-CAM
        "spiral_results": {
            "original_image": orig_spiral,
            "gradcam_overlay": overlay_spiral,
            "drawing_speed_mm_s": 24.8,
            "tremor_frequency_hz": 5.2,
            "velocity_variance": 0.42,
            "drawing_duration_s": 14.5
        },
        
        # 8. Continuous Telemonitoring Motor UPDRS
        "telemonitoring_results": {
            "motor_updrs": 28.4,
            "total_updrs": 41.2,
            "hoehn_yahr_stage": 2.0,
            "rigidity_percentile": 72,
            "total_sessions": 42,
            "interpretation": "Continuous accelerometry and telemonitoring indicate bilateral motor impairment (UPDRS Motor 28.4) with prominent right-sided resting and kinetic tremor."
        },
        
        # 9. 8-Channel Quantitative EEG Analysis
        "eeg_results": {
            "channel_count": 8,
            "duration_sec": 12.5,
            "sampling_rate_hz": 256,
            "slowing_index": 1.48,
            "dominant_band": "Theta (4-8 Hz)",
            "delta_power": 35.0,
            "theta_power": 44.0,
            "alpha_power": 14.0,
            "beta_power": 7.0,
            "interpretation": "Excess fronto-central theta power indicative of cortico-basal motor slowing without epileptiform discharges. Consistent with parkinsonian pathophysiology."
        },
        
        # 10. Multimodal Fusion Cross-Attention
        "fusion_results": {
            "modality_weights": {
                "Brain MRI Neuroimaging": 0.30,
                "Voice Acoustic Phonation": 0.25,
                "Spiral Motor Kinematics": 0.25,
                "Telemonitoring MDS-UPDRS": 0.20
            },
            "contribution_chart": fusion_chart
        },
        
        # 11. CDSS Evidence-Based Recommendations
        "cdss_results": {
            "risk_level": "High Clinical Risk",
            "urgency": "High Priority Neurological Follow-Up (Within 7-14 Days)",
            "recommendations": [
                "Initiate Levodopa/Carbidopa challenge (100/25 mg TID) with documented motor UPDRS response monitoring.",
                "Order DaTscan SPECT imaging to objectively verify presynaptic dopamine transporter loss in bilateral striatum.",
                "Refer patient to specialized movement disorder neuro-physiotherapy for gait stabilization and fall risk prevention.",
                "Schedule repeat multimodal vocal and kinematic motor battery in 60 days to evaluate therapeutic titration response."
            ]
        },
        
        # 12. Hybrid Quantum Decision Layer (HQDL)
        "hqdl_results": {
            "enabled": True,
            "state_fidelity": 0.988,
            "entropy": 0.114,
            "refined_confidence": 99.4
        },
        
        # 13. Patient Longitudinal History
        "historical_records": [
            {"date": "2025-11-12", "modality": "Clinical UPDRS", "prediction": "Borderline", "confidence": 74.5, "status": "Baseline"},
            {"date": "2026-03-05", "modality": "Voice Phonation", "prediction": "Parkinson", "confidence": 88.2, "status": "Verified"},
            {"date": "2026-07-19", "modality": "Spiral Kinematics", "prediction": "Parkinson", "confidence": 92.4, "status": "Verified"},
            {"date": "2026-11-02", "modality": "Multimodal Fusion", "prediction": "Parkinson", "confidence": 98.7, "status": "Final Clinical"}
        ],
        
        # 14. Attending Doctor Clinical Review & Digital Approval
        "clinical_notes": (
            "Comprehensive multimodal workup demonstrates unequivocal convergent biomarkers for Parkinson's Disease "
            "(Tremor-Dominant, Hoehn & Yahr Stage 2.0). Volumetric MRI midbrain atrophy, 5.2 Hz spiral tremor, hypokinetic vocal "
            "dysarthria (elevated jitter/shimmer), and continuous Motor UPDRS (28.4) confirm clinical diagnosis. "
            "Patient is counseled on management strategy. Levodopa trial and DaTscan SPECT confirmed."
        ),
        "doctor_notes": {
            "notes": (
                "Comprehensive multimodal workup demonstrates unequivocal convergent biomarkers for Parkinson's Disease "
                "(Tremor-Dominant, Hoehn & Yahr Stage 2.0). Volumetric MRI midbrain atrophy, 5.2 Hz spiral tremor, hypokinetic vocal "
                "dysarthria (elevated jitter/shimmer), and continuous Motor UPDRS (28.4) confirm clinical diagnosis. "
                "Patient is counseled on management strategy. Levodopa trial and DaTscan SPECT confirmed."
            ),
            "digital_approval": True
        }
    }
    
    # Save destinations
    dest_storage = os.path.join(BACKEND_DIR, "storage", "reports", "NeuroFusionAI_Final_Comprehensive_Clinical_Report_PAT-1083.pdf")
    dest_gen = os.path.join(BACKEND_DIR, "generated_reports", "NeuroFusionAI_Final_Comprehensive_Clinical_Report_PAT-1083.pdf")
    dest_root = os.path.join(PROJECT_ROOT, "NeuroFusionAI_Final_Comprehensive_Clinical_Report_PAT-1083.pdf")
    
    out = generate_patient_report(report_data, dest_storage)
    print(f"Generated Primary Report: {out} ({os.path.getsize(out)} bytes)")
    
    # Copy to generated_reports and project root for instant access
    import shutil
    os.makedirs(os.path.dirname(dest_gen), exist_ok=True)
    shutil.copy2(dest_storage, dest_gen)
    shutil.copy2(dest_storage, dest_root)
    print(f"Copied to: {dest_gen}")
    print(f"Copied to: {dest_root}")
    
    return dest_root

if __name__ == "__main__":
    clean_old_pdfs()
    final_pdf = generate_master_final_pdf()
    print("\nSUCCESS: All old PDFs removed and Master Final PDF generated successfully!")

