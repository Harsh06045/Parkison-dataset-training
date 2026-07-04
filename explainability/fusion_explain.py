"""
Fusion Modality Contribution Analysis.

Computes how much each modality (MRI, Spiral, Voice, Telemonitor) contributed
to the final fusion prediction by measuring gradient-based attribution.

Output:
    outputs/plots/fusion_feature_importance.png
"""
import os
import sys
import numpy as np
import torch
import torch.nn.functional as F

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)


def compute_fusion_contributions(fusion_model, image_embed, mri_embed, voice_feat, clinical_feat, device=None):
    """
    Compute each modality's contribution to the fusion prediction using
    gradient-based attribution (sum of |gradient * input| per modality).

    Returns:
        dict mapping modality name → contribution percentage
    """
    if device is None:
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    fusion_model.eval()

    # Clone inputs and require gradients
    img = image_embed.clone().detach().requires_grad_(True)
    mri = mri_embed.clone().detach().requires_grad_(True)
    voice = voice_feat.clone().detach().requires_grad_(True)
    clin = clinical_feat.clone().detach().requires_grad_(True)

    # Forward
    output = fusion_model(img, mri, voice, clin)
    predicted_class = output.argmax(dim=1).item()

    # Backward w.r.t. predicted class
    fusion_model.zero_grad()
    output[0, predicted_class].backward()

    # Compute gradient × input attribution per modality
    def attribution(inp):
        return (inp.grad.abs() * inp.abs()).sum().item()

    attr_img = attribution(img)
    attr_mri = attribution(mri)
    attr_voice = attribution(voice)
    attr_clin = attribution(clin)

    total = attr_img + attr_mri + attr_voice + attr_clin
    if total == 0:
        total = 1.0  # avoid division by zero

    contributions = {
        "MRI": (attr_mri / total) * 100,
        "Spiral": (attr_img / total) * 100,
        "Voice": (attr_voice / total) * 100,
        "Telemonitor": (attr_clin / total) * 100,
    }

    return contributions


def generate_fusion_contribution_plot(contributions, output_dir=None):
    """
    Generate and save a bar chart of modality contributions.

    Returns:
        Path to the saved plot.
    """
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt

    if output_dir is None:
        output_dir = os.path.join(PROJECT_ROOT, "outputs", "plots")
    os.makedirs(output_dir, exist_ok=True)

    modalities = list(contributions.keys())
    values = list(contributions.values())
    colors = ['#2196F3', '#4CAF50', '#FF9800', '#9C27B0']  # Blue, Green, Orange, Purple

    fig, ax = plt.subplots(figsize=(8, 5))
    bars = ax.barh(modalities, values, color=colors, edgecolor='white', linewidth=1.5, height=0.6)

    # Add percentage labels on bars
    for bar, val in zip(bars, values):
        ax.text(
            bar.get_width() + 1, bar.get_y() + bar.get_height() / 2,
            f'{val:.1f}%', va='center', fontsize=12, fontweight='bold'
        )

    ax.set_xlabel("Contribution (%)", fontsize=12, fontweight='bold')
    ax.set_title("Fusion — Modality Contribution Analysis", fontsize=14, fontweight='bold', pad=15)
    ax.set_xlim(0, max(values) * 1.3)
    ax.invert_yaxis()

    for spine in ['top', 'right']:
        ax.spines[spine].set_visible(False)

    plt.tight_layout()
    save_path = os.path.join(output_dir, "fusion_feature_importance.png")
    fig.savefig(save_path, dpi=150, bbox_inches='tight')
    plt.close(fig)

    print(f"  ✓ Fusion contribution plot saved: fusion_feature_importance.png")
    for mod, val in contributions.items():
        print(f"    {mod:15s}: {val:.1f}%")

    return save_path
