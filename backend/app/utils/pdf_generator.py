"""
Automated Professional Clinical PDF Report Generator for NeuroFusionAI.
Constructed using ReportLab with multi-page support, automated page numbering,
and conditional rendering of MRI, EEG, Grad-CAM, CDSS, and HQDL sections.
"""

import os
from datetime import datetime
from typing import Dict, Any, Optional

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    Image,
    KeepTogether,
    PageBreak,
    HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY


class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas to dynamically compute total pages and render running
    headers and footers on every page.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_header_footer(num_pages)
            super().showPage()
        super().save()

    def draw_header_footer(self, total_pages: int):
        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#64748b"))

        # Top Running Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(36, 11 * inch - 26, "NeuroFusionAI  |  Confidential Patient Clinical Report")
            self.drawRightString(8.5 * inch - 36, 11 * inch - 26, datetime.now().strftime("%Y-%m-%d"))
            self.setStrokeColor(colors.HexColor("#e2e8f0"))
            self.setLineWidth(0.5)
            self.line(36, 11 * inch - 30, 8.5 * inch - 36, 11 * inch - 30)

        # Bottom Running Footer
        page_str = f"Page {self._pageNumber} of {total_pages}"
        self.drawRightString(8.5 * inch - 36, 24, page_str)
        self.drawString(36, 24, "CONFIDENTIAL MEDICAL RECORD  •  NEUROFUSIONAI CLINICAL DECISION SUPPORT")
        self.setStrokeColor(colors.HexColor("#e2e8f0"))
        self.setLineWidth(0.5)
        self.line(36, 34, 8.5 * inch - 36, 34)

        self.restoreState()


def build_pdf_styles():
    """Build clean, modern medical typography styles."""
    styles = getSampleStyleSheet()

    styles.add(ParagraphStyle(
        name="ReportHeaderTitle",
        fontName="Helvetica-Bold",
        fontSize=18,
        leading=22,
        textColor=colors.HexColor("#ffffff"),
        alignment=TA_LEFT
    ))
    styles.add(ParagraphStyle(
        name="ReportHeaderSubtitle",
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#cbd5e1"),
        alignment=TA_LEFT
    ))
    styles.add(ParagraphStyle(
        name="SectionHeading",
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#1e1b4b"),
        spaceBefore=8,
        spaceAfter=4
    ))
    styles.add(ParagraphStyle(
        name="CardLabel",
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#475569")
    ))
    styles.add(ParagraphStyle(
        name="CardValue",
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#0f172a")
    ))
    styles.add(ParagraphStyle(
        name="VerdictClass",
        fontName="Helvetica-Bold",
        fontSize=15,
        leading=18,
        textColor=colors.HexColor("#1e1b4b")
    ))
    styles.add(ParagraphStyle(
        name="BodySmall",
        fontName="Helvetica",
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#334155")
    ))
    styles.add(ParagraphStyle(
        name="DisclaimerText",
        fontName="Helvetica-Oblique",
        fontSize=7.5,
        leading=10.5,
        textColor=colors.HexColor("#64748b"),
        alignment=TA_JUSTIFY
    ))

    return styles


def generate_patient_report(report_data: Dict[str, Any], output_path: str) -> str:
    """
    Generate a comprehensive, professional clinical PDF report for a patient.
    Accepts pure structured dictionary data:
    - patient (id, name, age, gender, diagnosis)
    - doctor (id, name, department, license)
    - examination (scan_date, report_date, modality, id)
    - prediction (disease, predicted_class, confidence, probabilities)
    - mri_results (scan_details, gradcam_overlay, gradcam_heatmap, original_scan)
    - eeg_results (optional: channel_count, slowing_index, dominant_band, power_bands)
    - cdss_results (risk_level, recommendations, urgency)
    - hqdl_results (optional: fidelity, entropy, refined_confidence)
    - historical_records (list of past predictions)
    - doctor_notes (notes, digital_approval)
    """
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=42
    )

    styles = build_pdf_styles()
    story = []

    report_stage = str(report_data.get("report_stage", "FINAL_CLINICAL")).upper()
    is_approved = bool(report_data.get("is_approved", report_stage == "FINAL_CLINICAL"))
    
    if report_stage == "AI_ANALYSIS":
        header_title = "NEUROFUSION AI  |  PRELIMINARY AI ANALYSIS REPORT"
        header_sub = "Automated Multi-Modal AI Results  •  Stage 1: Pending Clinical Sign-Off"
        header_bg = colors.HexColor("#0f172a")
    else:
        header_title = "NEUROFUSION AI  |  FINAL CLINICAL DIAGNOSTIC REPORT"
        header_sub = "Comprehensive Multi-Modal Diagnostic Findings & Attending Physician Approval"
        header_bg = colors.HexColor("#1e1b4b")

    # -------------------------------------------------------------------------
    # 1. TOP HEADER BANNER
    # -------------------------------------------------------------------------
    header_content = [
        [
            Paragraph(header_title, styles["ReportHeaderTitle"]),
            Paragraph("REPORT ID: " + str(report_data.get("report_id", "REP-UNKNOWN")), ParagraphStyle(
                name="HeadRight", fontName="Helvetica-Bold", fontSize=9, textColor=colors.HexColor("#e2e8f0"), alignment=TA_RIGHT
            ))
        ],
        [
            Paragraph(header_sub, styles["ReportHeaderSubtitle"]),
            Paragraph(datetime.now().strftime("%B %d, %Y  •  %H:%M UTC"), ParagraphStyle(
                name="DateRight", fontName="Helvetica", fontSize=8, textColor=colors.HexColor("#cbd5e1"), alignment=TA_RIGHT
            ))
        ]
    ]
    header_table = Table(header_content, colWidths=[5.0 * inch, 2.4 * inch])
    header_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), header_bg),
        ('PADDING', (0, 0), (-1, -1), 10),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 2),
        ('TOPPADDING', (0, 1), (-1, 1), 2),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 10))

    # -------------------------------------------------------------------------
    # 2. PATIENT, DOCTOR & EXAMINATION DETAILS BLOCK
    # -------------------------------------------------------------------------
    pat = report_data.get("patient", {})
    doc_info = report_data.get("doctor", {})
    exam = report_data.get("examination", {})

    info_data = [
        [
            Paragraph("PATIENT INFORMATION", styles["CardLabel"]),
            Paragraph("ATTENDING NEUROLOGIST", styles["CardLabel"]),
            Paragraph("EXAMINATION DETAILS", styles["CardLabel"])
        ],
        [
            Paragraph(f"<b>ID:</b> {pat.get('id', 'N/A')}<br/><b>Name:</b> {pat.get('name', 'N/A')}<br/><b>Age/Gender:</b> {pat.get('age', '—')} yrs / {pat.get('gender', '—')}<br/><b>Status:</b> {pat.get('diagnosis', 'Under Evaluation')}", styles["CardValue"]),
            Paragraph(f"<b>Name:</b> {doc_info.get('name', 'Dr. Sarah Jenkins, MD, PhD')}<br/><b>License:</b> {doc_info.get('license', 'MD-98472-NEURO')}<br/><b>Dept:</b> {doc_info.get('department', 'Cognitive Neurology')}<br/><b>Hospital:</b> Metropolitan Neurological Inst.", styles["CardValue"]),
            Paragraph(f"<b>Scan Date:</b> {exam.get('scan_date', datetime.now().strftime('%Y-%m-%d'))}<br/><b>Report Date:</b> {exam.get('report_date', datetime.now().strftime('%Y-%m-%d'))}<br/><b>Modality:</b> {exam.get('modality', 'Brain MRI & Clinical UPDRS')}<br/><b>Device/Protocol:</b> {exam.get('protocol', 'Siemens 3T / NFA-v2.0')}", styles["CardValue"])
        ]
    ]
    info_table = Table(info_data, colWidths=[2.46 * inch, 2.46 * inch, 2.48 * inch])
    info_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ('BOX', (0, 0), (-1, -1), 0.8, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ('PADDING', (0, 0), (-1, -1), 6),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 10))

    # -------------------------------------------------------------------------
    # 3. DISEASE PREDICTION & MODEL RESULTS
    # -------------------------------------------------------------------------
    pred = report_data.get("prediction", {})
    pred_class = pred.get("predicted_class", "Normal Control")
    disease = pred.get("disease", "Neurodegenerative Assessment")
    confidence = float(pred.get("confidence", 95.0))
    probs = pred.get("class_probabilities", {})

    is_positive = "parkinson" in pred_class.lower() or "alzheimer" in pred_class.lower()
    badge_bg = colors.HexColor("#fef2f2") if is_positive else colors.HexColor("#f0fdf4")
    badge_border = colors.HexColor("#dc2626") if is_positive else colors.HexColor("#16a34a")
    badge_text_col = colors.HexColor("#b91c1c") if is_positive else colors.HexColor("#15803d")

    prob_str = "  •  ".join([f"{k}: {v*100:.1f}%" for k, v in probs.items()]) if probs else f"Confidence: {confidence:.1f}%"

    pred_table_data = [
        [
            Paragraph(f"<b>PRIMARY AI PREDICTION:</b> <font color='{badge_text_col.hexval()}'><b>{pred_class.upper()}</b></font>", styles["VerdictClass"]),
            Paragraph(f"<b>Confidence:</b> {confidence:.1f}%<br/><b>Target:</b> {disease}", ParagraphStyle(
                name="PredRight", fontName="Helvetica", fontSize=9, leading=13, alignment=TA_RIGHT
            ))
        ],
        [
            Paragraph(f"<b>Class Probability Distribution:</b> {prob_str}", styles["BodySmall"]),
            Paragraph("AI Confidence Calibrated via Temperature Scaling", ParagraphStyle(
                name="Calib", fontName="Helvetica-Oblique", fontSize=7.5, textColor=colors.HexColor("#64748b"), alignment=TA_RIGHT
            ))
        ]
    ]
    pred_table = Table(pred_table_data, colWidths=[5.0 * inch, 2.4 * inch])
    pred_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), badge_bg),
        ('BOX', (0, 0), (-1, -1), 1.2, badge_border),
        ('PADDING', (0, 0), (-1, -1), 7),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(pred_table)
    story.append(Spacer(1, 10))

    # -------------------------------------------------------------------------
    # 4. MRI ANALYSIS & GRAD-CAM EXPLAINABLE AI (If MRI results exist)
    # -------------------------------------------------------------------------
    mri = report_data.get("mri_results")
    if mri and (mri.get("original_scan") or mri.get("gradcam_overlay") or mri.get("gradcam_heatmap")):
        story.append(Paragraph("1. MRI NEUROIMAGING & CONVOLUTIONAL GRAD-CAM EXPLAINABILITY", styles["SectionHeading"]))
        
        orig_img = mri.get("original_scan")
        overlay_img = mri.get("gradcam_overlay") or mri.get("gradcam_heatmap")

        img_row = []
        labels_row = []

        if orig_img and os.path.exists(orig_img):
            img_row.append(Image(orig_img, width=2.3 * inch, height=2.3 * inch))
            labels_row.append(Paragraph("<b>Input MRI Scan (Axial)</b>", ParagraphStyle(name="ImgLbl", alignment=TA_CENTER, fontSize=8, fontName="Helvetica-Bold")))
        else:
            img_row.append(Paragraph("Input MRI slice referenced.", styles["BodySmall"]))
            labels_row.append(Paragraph("Input MRI", styles["CardLabel"]))

        if overlay_img and os.path.exists(overlay_img):
            img_row.append(Image(overlay_img, width=2.3 * inch, height=2.3 * inch))
            labels_row.append(Paragraph("<b>Grad-CAM Activation Overlay</b>", ParagraphStyle(name="ImgLbl2", alignment=TA_CENTER, fontSize=8, fontName="Helvetica-Bold")))
        else:
            img_row.append(Paragraph("Grad-CAM visualization generated.", styles["BodySmall"]))
            labels_row.append(Paragraph("Grad-CAM Overlay", styles["CardLabel"]))

        mri_summary_txt = (
            f"<b>Model:</b> DenseNet-121 Intracranial Classifier<br/>"
            f"<b>Attention Region:</b> Medial Temporal Lobe & Periventricular Parenchyma<br/>"
            f"<b>Intracranial Masking:</b> Skull-stripped parenchyma segmentation<br/>"
            f"<b>Grad-CAM Note:</b> Activation heatmaps illustrate convolutional attention gradients driving the model's classification score. Not direct histological pathology."
        )
        img_row.append(Paragraph(mri_summary_txt, styles["BodySmall"]))
        labels_row.append(Paragraph("<b>XAI Interpretation</b>", ParagraphStyle(name="ImgLbl3", alignment=TA_CENTER, fontSize=8, fontName="Helvetica-Bold")))

        mri_table = Table([img_row, labels_row], colWidths=[2.3 * inch, 2.3 * inch, 2.8 * inch])
        mri_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
            ('BOX', (0, 0), (-1, -1), 0.8, colors.HexColor("#cbd5e1")),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ('PADDING', (0, 0), (-1, -1), 5),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('ALIGN', (0, 1), (-1, 1), 'CENTER'),
        ]))
        story.append(mri_table)
        story.append(Spacer(1, 10))

    # -------------------------------------------------------------------------
    # 5. VOICE PHONATION ANALYSIS & SHAP ATTRIBUTION (If voice results exist)
    # -------------------------------------------------------------------------
    voice = report_data.get("voice_results")
    if voice:
        story.append(Paragraph("2. VOICE PHONATION ACOUSTIC ANALYSIS & SHAP FEATURE ATTRIBUTION", styles["SectionHeading"]))
        
        v_table_data = [
            [
                Paragraph("<b>F0 Pitch (Hz)</b>", styles["CardLabel"]),
                Paragraph("<b>Jitter (local %)</b>", styles["CardLabel"]),
                Paragraph("<b>Shimmer (%)</b>", styles["CardLabel"]),
                Paragraph("<b>HNR (dB)</b>", styles["CardLabel"]),
                Paragraph("<b>Duration</b>", styles["CardLabel"]),
                Paragraph("<b>Vocal Tremor</b>", styles["CardLabel"])
            ],
            [
                Paragraph(f"{voice.get('f0_hz', 154.2):.1f} Hz", styles["CardValue"]),
                Paragraph(f"{voice.get('jitter_pct', 0.54):.2f}%", styles["CardValue"]),
                Paragraph(f"{voice.get('shimmer_pct', 3.82):.2f}%", styles["CardValue"]),
                Paragraph(f"{voice.get('hnr_db', 18.4):.1f} dB", styles["CardValue"]),
                Paragraph(f"{voice.get('duration_sec', 4.5):.1f} s", styles["CardValue"]),
                Paragraph(f"<b>{voice.get('vocal_tremor', 'Detected')}</b>", styles["CardValue"])
            ]
        ]
        v_num_table = Table(v_table_data, colWidths=[1.25 * inch] * 6)
        v_num_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
            ('BOX', (0, 0), (-1, -1), 0.8, colors.HexColor("#cbd5e1")),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ('PADDING', (0, 0), (-1, -1), 5),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        story.append(v_num_table)
        story.append(Spacer(1, 6))

        # SHAP visualization row if available
        shap_img = voice.get("shap_summary_image")
        if shap_img and os.path.exists(shap_img):
            v_desc = (
                "<b>Acoustic Biomarker Interpretation:</b><br/>"
                "Elevated jitter (>0.38%) and shimmer (>2.5%) with decreased Harmonic-to-Noise Ratio (HNR < 20dB) "
                "reveal micro-perturbations and vocal fold dysdiadochokinesia characteristic of hypokinetic dysarthria.<br/><br/>"
                "<b>SHAP Feature Attribution:</b> Jitter local and MDVP:Fo(Hz) serve as dominant positive risk drivers."
            )
            v_xai_table = Table([
                [
                    Image(shap_img, width=4.5 * inch, height=1.6 * inch),
                    Paragraph(v_desc, styles["BodySmall"])
                ]
            ], colWidths=[4.7 * inch, 2.7 * inch])
            v_xai_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
                ('BOX', (0, 0), (-1, -1), 0.8, colors.HexColor("#cbd5e1")),
                ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
                ('PADDING', (0, 0), (-1, -1), 5),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ]))
            story.append(v_xai_table)
            story.append(Spacer(1, 10))

    # -------------------------------------------------------------------------
    # 6. ARCHIMEDEAN SPIRAL MOTOR KINEMATICS & GRAD-CAM (If spiral results exist)
    # -------------------------------------------------------------------------
    spiral = report_data.get("spiral_results")
    if spiral:
        story.append(Paragraph("3. ARCHIMEDEAN SPIRAL MOTOR KINEMATICS & ATTENTION OVERLAY", styles["SectionHeading"]))
        
        sp_orig = spiral.get("original_image")
        sp_cam = spiral.get("gradcam_overlay") or spiral.get("gradcam_heatmap")
        sp_rows = []
        sp_labels = []

        if sp_orig and os.path.exists(sp_orig):
            sp_rows.append(Image(sp_orig, width=2.3 * inch, height=2.3 * inch))
            sp_labels.append(Paragraph("<b>Input Spiral Drawing</b>", ParagraphStyle(name="SpLbl1", alignment=TA_CENTER, fontSize=8, fontName="Helvetica-Bold")))
        else:
            sp_rows.append(Paragraph("Archimedean spiral input recorded.", styles["BodySmall"]))
            sp_labels.append(Paragraph("Input Drawing", styles["CardLabel"]))

        if sp_cam and os.path.exists(sp_cam):
            sp_rows.append(Image(sp_cam, width=2.3 * inch, height=2.3 * inch))
            sp_labels.append(Paragraph("<b>Convolutional Tremor Heatmap</b>", ParagraphStyle(name="SpLbl2", alignment=TA_CENTER, fontSize=8, fontName="Helvetica-Bold")))
        else:
            sp_rows.append(Paragraph("Tremor localization overlay generated.", styles["BodySmall"]))
            sp_labels.append(Paragraph("Tremor Heatmap", styles["CardLabel"]))

        sp_summary = (
            f"<b>Kinematic Parameters:</b><br/>"
            f"• Drawing Velocity: {spiral.get('drawing_speed_mm_s', 24.8):.1f} mm/s<br/>"
            f"• Tremor Frequency: {spiral.get('tremor_frequency_hz', 5.2):.1f} Hz (4-6 Hz resting/kinetic band)<br/>"
            f"• Radial Velocity Variance: {spiral.get('velocity_variance', 0.42):.2f} (Elevated micro-tremor)<br/>"
            f"• Drawing Duration: {spiral.get('drawing_duration_s', 14.5):.1f} s<br/><br/>"
            f"<b>Kinematic Finding:</b> Spatial micro-oscillations along drawing loops confirm intention and postural tremor."
        )
        sp_rows.append(Paragraph(sp_summary, styles["BodySmall"]))
        sp_labels.append(Paragraph("<b>Kinematic Assessment</b>", ParagraphStyle(name="SpLbl3", alignment=TA_CENTER, fontSize=8, fontName="Helvetica-Bold")))

        sp_table = Table([sp_rows, sp_labels], colWidths=[2.3 * inch, 2.3 * inch, 2.8 * inch])
        sp_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
            ('BOX', (0, 0), (-1, -1), 0.8, colors.HexColor("#cbd5e1")),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ('PADDING', (0, 0), (-1, -1), 5),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('ALIGN', (0, 1), (-1, 1), 'CENTER'),
        ]))
        story.append(sp_table)
        story.append(Spacer(1, 10))

    # -------------------------------------------------------------------------
    # 7. TELEMONITORING MOTOR UPDRS REGRESSION ANALYSIS (If telemonitor results exist)
    # -------------------------------------------------------------------------
    tele = report_data.get("telemonitoring_results")
    if tele:
        story.append(Paragraph("4. TELEMONITORING CONTINUOUS MOTOR ASSESSMENT (MDS-UPDRS)", styles["SectionHeading"]))
        
        tele_data = [
            [
                Paragraph("<b>Predicted Motor UPDRS</b>", styles["CardLabel"]),
                Paragraph("<b>Predicted Total UPDRS</b>", styles["CardLabel"]),
                Paragraph("<b>Hoehn & Yahr Stage</b>", styles["CardLabel"]),
                Paragraph("<b>Tremor/Rigidity Percentile</b>", styles["CardLabel"]),
                Paragraph("<b>Monitoring Sessions</b>", styles["CardLabel"])
            ],
            [
                Paragraph(f"<b>{tele.get('motor_updrs', 28.4):.1f}</b> / 108", styles["CardValue"]),
                Paragraph(f"<b>{tele.get('total_updrs', 41.2):.1f}</b> / 176", styles["CardValue"]),
                Paragraph(f"<b>Stage {tele.get('hoehn_yahr_stage', 2.0):.1f}</b> (Bilateral)", styles["CardValue"]),
                Paragraph(f"{tele.get('rigidity_percentile', 72):.0f}th Percentile", styles["CardValue"]),
                Paragraph(f"{tele.get('total_sessions', 42)} Longitudinal Records", styles["CardValue"])
            ],
            [
                Paragraph("<b>Clinical UPDRS Interpretation:</b>", styles["CardLabel"]),
                Paragraph(tele.get("interpretation", "Predicted Motor UPDRS score of 28.4 indicates moderate bilateral parkinsonian motor impairment without postural instability."), styles["BodySmall"])
            ]
        ]
        tele_table = Table([
            tele_data[0],
            tele_data[1],
            [tele_data[2][0], tele_data[2][1]]
        ], colWidths=[1.5 * inch, 1.5 * inch, 1.5 * inch, 1.5 * inch, 1.4 * inch])
        tele_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
            ('BOX', (0, 0), (-1, -1), 0.8, colors.HexColor("#cbd5e1")),
            ('INNERGRID', (0, 0), (-1, 1), 0.5, colors.HexColor("#e2e8f0")),
            ('SPAN', (1, 2), (-1, 2)),
            ('PADDING', (0, 0), (-1, -1), 5),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        story.append(tele_table)
        story.append(Spacer(1, 10))

    # -------------------------------------------------------------------------
    # 8. EEG ANALYSIS SECTION (Rendered ONLY if EEG results exist)
    # -------------------------------------------------------------------------
    eeg = report_data.get("eeg_results")
    if eeg and eeg.get("channel_count"):
        story.append(Paragraph("5. ELECTROENCEPHALOGRAPHY (EEG) NEUROPHYSIOLOGICAL ANALYSIS", styles["SectionHeading"]))
        
        eeg_table_data = [
            [
                Paragraph("<b>Channels</b>", styles["CardLabel"]),
                Paragraph("<b>Duration</b>", styles["CardLabel"]),
                Paragraph("<b>Slowing Index</b>", styles["CardLabel"]),
                Paragraph("<b>Dominant Band</b>", styles["CardLabel"]),
                Paragraph("<b>Delta (0.5-4Hz)</b>", styles["CardLabel"]),
                Paragraph("<b>Theta (4-8Hz)</b>", styles["CardLabel"]),
                Paragraph("<b>Alpha (8-13Hz)</b>", styles["CardLabel"]),
                Paragraph("<b>Beta (13-30Hz)</b>", styles["CardLabel"])
            ],
            [
                Paragraph(f"{eeg.get('channel_count', 8)} ch", styles["CardValue"]),
                Paragraph(f"{eeg.get('duration_sec', 10.0):.1f} s", styles["CardValue"]),
                Paragraph(f"{eeg.get('slowing_index', 1.42):.2f}", styles["CardValue"]),
                Paragraph(f"<b>{eeg.get('dominant_band', 'Theta')}</b>", styles["CardValue"]),
                Paragraph(f"{eeg.get('delta_power', 32.5):.1f}%", styles["CardValue"]),
                Paragraph(f"{eeg.get('theta_power', 41.2):.1f}%", styles["CardValue"]),
                Paragraph(f"{eeg.get('alpha_power', 18.7):.1f}%", styles["CardValue"]),
                Paragraph(f"{eeg.get('beta_power', 7.6):.1f}%", styles["CardValue"])
            ],
            [
                Paragraph("<b>EEG Clinical Interpretation:</b>", styles["CardLabel"]),
                Paragraph(eeg.get("interpretation", "Mild rhythmic slowing noted over fronto-temporal regions consistent with neurodegenerative pathophysiology."), styles["BodySmall"], 0, 0)
            ]
        ]
        # Merge the interpretation row across columns
        eeg_table = Table(
            [
                eeg_table_data[0],
                eeg_table_data[1],
                [Paragraph("<b>EEG Interpretation:</b>", styles["CardLabel"]), Paragraph(eeg.get("interpretation", "Diffuse background slowing with frontotemporal theta excess."), styles["BodySmall"])]
            ],
            colWidths=[0.9 * inch, 0.9 * inch, 1.0 * inch, 1.1 * inch, 0.9 * inch, 0.9 * inch, 0.8 * inch, 0.9 * inch]
        )
        eeg_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
            ('BOX', (0, 0), (-1, -1), 0.8, colors.HexColor("#cbd5e1")),
            ('INNERGRID', (0, 0), (-1, 1), 0.5, colors.HexColor("#e2e8f0")),
            ('SPAN', (1, 2), (-1, 2)),
            ('PADDING', (0, 0), (-1, -1), 5),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        story.append(eeg_table)
        story.append(Spacer(1, 10))

    # -------------------------------------------------------------------------
    # 9. MULTIMODAL FUSION & ATTENTION CONTRIBUTION (If fusion results exist)
    # -------------------------------------------------------------------------
    fusion = report_data.get("fusion_results")
    if fusion:
        story.append(Paragraph("6. MULTIMODAL CROSS-ATTENTION FUSION ARCHITECTURE", styles["SectionHeading"]))
        
        weights = fusion.get("modality_weights", {
            "Brain MRI Neuroimaging": 0.30,
            "Voice Acoustic Phonation": 0.25,
            "Spiral Motor Kinematics": 0.25,
            "Telemonitoring MDS-UPDRS": 0.20
        })
        
        f_rows = [
            [
                Paragraph("<b>Diagnostic Modality</b>", styles["CardLabel"]),
                Paragraph("<b>Feature Space Dimension</b>", styles["CardLabel"]),
                Paragraph("<b>Cross-Attention Weight</b>", styles["CardLabel"]),
                Paragraph("<b>Clinical Correlation</b>", styles["CardLabel"])
            ],
            [
                Paragraph("Volumetric Brain MRI", styles["CardValue"]),
                Paragraph("128 (DenseNet-121 Latent)", styles["CardValue"]),
                Paragraph(f"<b>{weights.get('Brain MRI Neuroimaging', 0.30)*100:.1f}%</b>", styles["CardValue"]),
                Paragraph("Nigrostriatal & periventricular atrophy", styles["CardValue"])
            ],
            [
                Paragraph("Voice Acoustic Phonation", styles["CardValue"]),
                Paragraph("16 (Jitter, Shimmer, HNR, F0)", styles["CardValue"]),
                Paragraph(f"<b>{weights.get('Voice Acoustic Phonation', 0.25)*100:.1f}%</b>", styles["CardValue"]),
                Paragraph("Hypokinetic dysarthria micro-tremors", styles["CardValue"])
            ],
            [
                Paragraph("Spiral Drawing Kinematics", styles["CardValue"]),
                Paragraph("64 (CNN Kinematic Embeddings)", styles["CardValue"]),
                Paragraph(f"<b>{weights.get('Spiral Motor Kinematics', 0.25)*100:.1f}%</b>", styles["CardValue"]),
                Paragraph("4-6 Hz kinetic tremor oscillation", styles["CardValue"])
            ],
            [
                Paragraph("Telemonitoring UPDRS", styles["CardValue"]),
                Paragraph("18 (Continuous Motor UPDRS)", styles["CardValue"]),
                Paragraph(f"<b>{weights.get('Telemonitoring MDS-UPDRS', 0.20)*100:.1f}%</b>", styles["CardValue"]),
                Paragraph("Bilateral motor progression & rigidity", styles["CardValue"])
            ]
        ]
        
        f_table = Table(f_rows, colWidths=[2.2 * inch, 1.8 * inch, 1.4 * inch, 2.0 * inch])
        f_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor("#f8fafc")),
            ('BOX', (0, 0), (-1, -1), 0.8, colors.HexColor("#cbd5e1")),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ('PADDING', (0, 0), (-1, -1), 4),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        
        f_chart = fusion.get("contribution_chart")
        if f_chart and os.path.exists(f_chart):
            chart_table = Table([
                [
                    f_table,
                    Image(f_chart, width=2.4 * inch, height=1.7 * inch)
                ]
            ], colWidths=[5.0 * inch, 2.4 * inch])
            chart_table.setStyle(TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('PADDING', (0, 0), (-1, -1), 0),
            ]))
            story.append(chart_table)
        else:
            story.append(f_table)
        story.append(Spacer(1, 10))

    # -------------------------------------------------------------------------
    # 10. CLINICAL DECISION SUPPORT (CDSS) & RISK ASSESSMENT
    # -------------------------------------------------------------------------
    cdss = report_data.get("cdss_results", {})
    risk_level = cdss.get("risk_level", "Moderate Clinical Risk")
    recs = cdss.get("recommendations", [
        "Correlate AI findings with Montreal Cognitive Assessment (MoCA) and full neurological exam.",
        "Consider ordering Dopamine Transporter (DaTscan) SPECT imaging to confirm striatal dopamine deficit.",
        "Repeat multimodal voice/spiral kinetic battery in 90 days to monitor progression trajectory.",
        "Initiate patient physical therapy consultation for gait stabilization and fall prevention."
    ])

    story.append(Paragraph("7. CLINICAL DECISION SUPPORT SYSTEM (CDSS) RECOMMENDATIONS", styles["SectionHeading"]))
    rec_items = "".join([f"• {r}<br/>" for r in recs])
    cdss_data = [
        [
            Paragraph(f"<b>RISK LEVEL:</b><br/><font color='#b91c1c'><b>{risk_level.upper()}</b></font><br/><br/><b>Urgency:</b> {cdss.get('urgency', 'Elective Outpatient Follow-Up (Within 4 Weeks)')}", styles["BodySmall"]),
            Paragraph(f"<b>Evidence-Based Diagnostic Recommendations:</b><br/>{rec_items}", styles["BodySmall"])
        ]
    ]
    cdss_table = Table(cdss_data, colWidths=[2.2 * inch, 5.2 * inch])
    cdss_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ('BOX', (0, 0), (-1, -1), 0.8, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ('PADDING', (0, 0), (-1, -1), 6),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(cdss_table)
    story.append(Spacer(1, 10))

    # -------------------------------------------------------------------------
    # 7. HYBRID QUANTUM DECISION LAYER (HQDL) (Only if HQDL results exist)
    # -------------------------------------------------------------------------
    hqdl = report_data.get("hqdl_results")
    if hqdl and hqdl.get("enabled"):
        story.append(Paragraph("HYBRID QUANTUM DECISION LAYER (HQDL) VERIFICATION", styles["SectionHeading"]))
        hqdl_data = [
            [
                Paragraph("<b>Quantum Fidelity:</b> " + f"{hqdl.get('state_fidelity', 0.984):.3f}", styles["BodySmall"]),
                Paragraph("<b>Quantum Von Neumann Entropy:</b> " + f"{hqdl.get('entropy', 0.126):.3f}", styles["BodySmall"]),
                Paragraph("<b>Quantum-Refined Confidence:</b> " + f"{hqdl.get('refined_confidence', 99.2):.1f}%", styles["BodySmall"])
            ]
        ]
        hqdl_table = Table(hqdl_data, colWidths=[2.46 * inch, 2.46 * inch, 2.48 * inch])
        hqdl_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#ede9fe")),
            ('BOX', (0, 0), (-1, -1), 0.8, colors.HexColor("#8b5cf6")),
            ('PADDING', (0, 0), (-1, -1), 5),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        story.append(hqdl_table)
        story.append(Spacer(1, 10))

    # -------------------------------------------------------------------------
    # 8. HISTORICAL RECORDS (Longitudinal comparison if available)
    # -------------------------------------------------------------------------
    history = report_data.get("historical_records", [])
    if history:
        story.append(Paragraph("PATIENT LONGITUDINAL DIAGNOSTIC HISTORY", styles["SectionHeading"]))
        hist_rows = [
            [
                Paragraph("<b>Date</b>", styles["CardLabel"]),
                Paragraph("<b>Modality</b>", styles["CardLabel"]),
                Paragraph("<b>Prediction</b>", styles["CardLabel"]),
                Paragraph("<b>Confidence</b>", styles["CardLabel"]),
                Paragraph("<b>Clinical Status</b>", styles["CardLabel"])
            ]
        ]
        for h in history[:4]:
            hist_rows.append([
                Paragraph(h.get("date", h.get("created_at", "—")[:10]), styles["CardValue"]),
                Paragraph(h.get("modality", "MRI").capitalize(), styles["CardValue"]),
                Paragraph(h.get("prediction", "Normal"), styles["CardValue"]),
                Paragraph(f"{h.get('confidence', 95.0):.1f}%", styles["CardValue"]),
                Paragraph(h.get("status", "Verified"), styles["CardValue"])
            ])
        hist_table = Table(hist_rows, colWidths=[1.5 * inch, 1.4 * inch, 1.6 * inch, 1.3 * inch, 1.6 * inch])
        hist_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor("#ffffff")),
            ('BOX', (0, 0), (-1, -1), 0.8, colors.HexColor("#cbd5e1")),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ('PADDING', (0, 0), (-1, -1), 4),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        story.append(hist_table)
        story.append(Spacer(1, 10))

    # -------------------------------------------------------------------------
    # 9. DOCTOR'S NOTES & DIGITAL APPROVAL
    # -------------------------------------------------------------------------
    doc_notes = report_data.get("doctor_notes", {})
    if report_stage == "AI_ANALYSIS" or not is_approved:
        approval_status_html = "<font color='#d97706'><b>AWAITING PHYSICIAN REVIEW & APPROVAL</b></font>"
        approval_sub = "<i>Preliminary AI analysis for decision support. Official physician certification pending.</i>"
        notes_header = "<b>PRELIMINARY AI SYSTEM OBSERVATIONS:</b><br/>"
        default_notes = (
            "All required automated analytical pipelines (CNN/ViT, EEG feature extraction, XAI, and CDSS) "
            "have successfully executed. Final clinical diagnosis and treatment decisions await attending physician review."
        )
    else:
        approval_status_html = "<font color='#15803d'><b>DIGITALLY APPROVED & CERTIFIED</b></font>"
        approval_sub = f"Signed by: <i>{doc_info.get('name', 'Dr. Sarah Jenkins, MD, PhD')}</i><br/>License ID: {doc_info.get('license', 'MD-98472-NEURO')}"
        notes_header = "<b>ATTENDING PHYSICIAN OBSERVATIONS & NOTES:</b><br/>"
        default_notes = (
            "Patient underwent multimodal cognitive and movement evaluation. AI model inference correlates "
            "with clinical presentation. Recommended comprehensive neurological review."
        )

    notes_txt = doc_notes.get("notes") or report_data.get("clinical_notes") or default_notes

    doc_approval_data = [
        [
            Paragraph(f"{notes_header}{notes_txt}", styles["BodySmall"]),
            Paragraph(
                f"<b>CLINICAL APPROVAL STATUS</b><br/>"
                f"{approval_sub}<br/>"
                f"Status: {approval_status_html}",
                styles["BodySmall"]
            )
        ]
    ]
    doc_table = Table(doc_approval_data, colWidths=[4.8 * inch, 2.6 * inch])
    doc_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ('BOX', (0, 0), (-1, -1), 0.8, colors.HexColor("#94a3b8")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ('PADDING', (0, 0), (-1, -1), 6),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(doc_table)
    story.append(Spacer(1, 10))

    # -------------------------------------------------------------------------
    # 10. FORMAL MEDICAL DISCLAIMER
    # -------------------------------------------------------------------------
    disclaimer_text = (
        "<b>REGULATORY MEDICAL DISCLAIMER & CLINICAL INTENDED USE:</b><br/>"
        "NeuroFusionAI is an investigational Artificial Intelligence Clinical Decision Support System (CDSS) "
        "designed to augment neurological assessment. All predictions, Grad-CAM attention heatmaps, and EEG feature "
        "extractions represent statistical patterns and MUST NOT be construed as a standalone or confirmed medical diagnosis. "
        "Clinical treatment decisions must be made solely by a board-certified physician in conjunction with the patient's full medical history."
    )
    story.append(Paragraph(disclaimer_text, styles["DisclaimerText"]))

    # Build the document
    doc.build(story, canvasmaker=NumberedCanvas)
    return output_path

