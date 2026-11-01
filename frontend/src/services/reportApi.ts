import { apiClient } from "./apiClient";
import { AlzheimerAnalysisResult } from "./alzheimerApi";
import { ParkinsonAnalysisResult } from "./parkinsonApi";

export interface UnifiedDiagnosticReport {
  id: string;
  analysisId: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  doctorName: string;
  doctorLicense: string;
  hospitalName: string;
  createdAt: string;
  disease: "Alzheimer's Disease" | "Parkinson's Disease";
  modalityOrSource: string;
  primaryDiagnosis: string;
  confidenceScore: number;
  status: "Finalized" | "Doctor Review Required" | "Draft";
  keyFindings: string[];
  recommendations: string[];
  explainabilitySummary: {
    method: string;
    topFactors: { name: string; impact: string; value: string }[];
    visualSummaryNote: string;
  };
  disclaimer: string;
}

const STORAGE_REPORTS_KEY = "neurofusion_diagnostic_reports_v3";

const INITIAL_REPORTS: UnifiedDiagnosticReport[] = [
  {
    id: "REP-9810",
    analysisId: "ALZ-840291",
    patientId: "PAT-1082",
    patientName: "Robert Davis",
    patientAge: 68,
    patientGender: "Male",
    doctorName: "Dr. Sarah Jenkins, MD, PhD",
    doctorLicense: "MD-98472-NEURO",
    hospitalName: "Metropolitan Neurological Institute",
    createdAt: "2026-08-18 14:32",
    disease: "Alzheimer's Disease",
    modalityOrSource: "3D T1-weighted High-Res Brain MRI",
    primaryDiagnosis: "Mild Dementia (Early Alzheimer's Stage)",
    confidenceScore: 95.8,
    status: "Finalized",
    keyFindings: [
      "Significant hippocampal bilateral volume loss: 2,910 mm³ (-28% vs age-matched normative baseline).",
      "Severe entorhinal cortex thinning (2.05 mm) localized in Brodmann Area 28.",
      "Grad-CAM salience activation concentrated over parahippocampal gyrus and temporal horns of lateral ventricles.",
      "SHAP feature ranking identifies Hippocampal Volumetry (+0.68) as the primary positive driver of the diagnosis.",
    ],
    recommendations: [
      "Initiate baseline Acetylcholinesterase Inhibitor (Donepezil 5mg daily, titrating to 10mg as tolerated).",
      "Order Amyloid-PET / Plasma p-tau217 confirmatory biomarker assay.",
      "Schedule repeat high-resolution 3.0T MRI volumetry in 6 months to evaluate rate of hippocampal volume loss.",
      "Cognitive rehabilitation referral and lifestyle cardiovascular optimization.",
    ],
    explainabilitySummary: {
      method: "3D CNN + Vision Transformer Grad-CAM & SHAP Volumetry",
      topFactors: [
        { name: "Hippocampal Bilateral Volume", impact: "+0.68 (Severe Atrophy)", value: "2,910 mm³" },
        { name: "Entorhinal Cortex Thickness", impact: "+0.54 (Cortical Thinning)", value: "2.05 mm" },
        { name: "Lateral Ventricular Enlargement", impact: "+0.44 (Ex-Vacuo Expansion)", value: "43,800 mm³" },
      ],
      visualSummaryNote: "Grad-CAM coronal and axial slices confirm localized temporal lobe atrophy with intact occipital pole.",
    },
    disclaimer: "This system provides AI-assisted decision support and should not be treated as a standalone medical diagnosis. Final clinical diagnosis requires comprehensive physician evaluation.",
  },
  {
    id: "REP-9811",
    analysisId: "PKN-492018",
    patientId: "PAT-1083",
    patientName: "Eleanor Vance",
    patientAge: 72,
    patientGender: "Female",
    doctorName: "Dr. Sarah Jenkins, MD, PhD",
    doctorLicense: "MD-98472-NEURO",
    hospitalName: "Metropolitan Neurological Institute",
    createdAt: "2026-08-19 11:15",
    disease: "Parkinson's Disease",
    modalityOrSource: "Sustained Acoustic Vocal Recording (Phoneme /a/)",
    primaryDiagnosis: "Parkinson's Disease Detected (Stage II Hoehn & Yahr)",
    confidenceScore: 94.2,
    status: "Finalized",
    keyFindings: [
      "Elevated vocal frequency perturbation (MDVP:Jitter = 0.840%, baseline normal < 0.400%).",
      "Micro-fluctuations in vocal amplitude (MDVP:Shimmer = 0.046 dB) indicating subtle laryngeal rigidity.",
      "Reduced Harmonics-to-Noise Ratio (HNR = 15.9 dB) reflecting breathiness and turbulent vocal tract airflow.",
      "Quantum-Inspired Decision Layer calculated decision score of 94.6% with Pauli-Z expectation value +0.89.",
    ],
    recommendations: [
      "Perform formal MDS-UPDRS Part III motor assessment during next in-person clinic visit.",
      "Consider trial of Carbidopa/Levodopa 25/100mg TID with response log.",
      "Referral to Speech-Language Pathologist for Lee Silverman Voice Treatment (LSVT LOUD).",
      "Routine follow-up in 3 months for acoustic vocal progression tracking.",
    ],
    explainabilitySummary: {
      method: "Quantum-Inspired Decision Layer (4-Qubit Variational Ansatz) & Vocal SHAP",
      topFactors: [
        { name: "MDVP:Jitter (%)", impact: "+0.64 (High Perturbation)", value: "0.840%" },
        { name: "MDVP:Shimmer (dB)", impact: "+0.52 (Laryngeal Rigidity)", value: "0.046 dB" },
        { name: "Harmonics-to-Noise Ratio", impact: "+0.46 (Acoustic Noise)", value: "15.9 dB" },
      ],
      visualSummaryNote: "Quantum-inspired decision layer demonstrated a +4.8% advantage margin over standard classical baseline.",
    },
    disclaimer: "This system provides AI-assisted decision support and should not be treated as a standalone medical diagnosis. Final clinical diagnosis requires comprehensive physician evaluation.",
  },
];

function getStoredReports(): UnifiedDiagnosticReport[] {
  try {
    const raw = localStorage.getItem(STORAGE_REPORTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Error reading diagnostic reports", e);
  }
  localStorage.setItem(STORAGE_REPORTS_KEY, JSON.stringify(INITIAL_REPORTS));
  return INITIAL_REPORTS;
}

function saveStoredReports(reports: UnifiedDiagnosticReport[]): void {
  localStorage.setItem(STORAGE_REPORTS_KEY, JSON.stringify(reports));
}

export const reportApi = {
  async getReports(search?: string, disease?: string): Promise<UnifiedDiagnosticReport[]> {
    try {
      return await apiClient.get<UnifiedDiagnosticReport[]>("/reports", { search, disease });
    } catch {
      let list = getStoredReports();
      if (disease && disease !== "all") {
        list = list.filter((r) => r.disease.toLowerCase().includes(disease.toLowerCase()));
      }
      if (search && search.trim()) {
        const q = search.toLowerCase().trim();
        list = list.filter(
          (r) =>
            r.patientName.toLowerCase().includes(q) ||
            r.id.toLowerCase().includes(q) ||
            r.patientId.toLowerCase().includes(q) ||
            r.primaryDiagnosis.toLowerCase().includes(q)
        );
      }
      return list;
    }
  },

  async getReportById(id: string): Promise<UnifiedDiagnosticReport | null> {
    try {
      return await apiClient.get<UnifiedDiagnosticReport>(`/reports/${id}`);
    } catch {
      const list = getStoredReports();
      return list.find((r) => r.id === id) || null;
    }
  },

  async generateReportFromAlzheimer(
    analysis: AlzheimerAnalysisResult,
    doctorName = "Dr. Sarah Jenkins, MD, PhD"
  ): Promise<UnifiedDiagnosticReport> {
    try {
      return await apiClient.post<UnifiedDiagnosticReport>("/reports/generate/alzheimer", {
        analysisId: analysis.id,
        doctorName,
      });
    } catch {
      const reportId = `REP-${Math.floor(1000 + Math.random() * 9000)}`;
      const now = new Date();
      const createdAt = `${now.toISOString().split("T")[0]} ${now.toTimeString().slice(0, 5)}`;

      const newReport: UnifiedDiagnosticReport = {
        id: reportId,
        analysisId: analysis.id,
        patientId: analysis.patientId,
        patientName: analysis.patientName,
        patientAge: 68,
        patientGender: "Unspecified",
        doctorName,
        doctorLicense: "MD-98472-NEURO",
        hospitalName: "Metropolitan Neurological Institute",
        createdAt,
        disease: "Alzheimer's Disease",
        modalityOrSource: analysis.modality,
        primaryDiagnosis: analysis.prediction,
        confidenceScore: analysis.confidence,
        status: "Finalized",
        keyFindings: [
          `Primary model prediction: ${analysis.prediction} with ${analysis.confidence.toFixed(1)}% AI confidence score.`,
          `Hippocampal bilateral volume measured at ${analysis.hippocampalVolumeMm3.toLocaleString()} mm³.`,
          `Entorhinal cortex thickness estimated at ${analysis.entorhinalThicknessMm.toFixed(2)} mm.`,
          `Grad-CAM salience highlights localized temporal lobe and hippocampal regional activation.`,
        ],
        recommendations: [
          "Correlate AI findings with standard Mini-Mental State Examination (MMSE) and Montreal Cognitive Assessment (MoCA).",
          "Order CSF or plasma biomarker panel (Aβ42/Aβ40 ratio, p-tau181 / p-tau217).",
          "Follow-up neuroimaging in 6-12 months for volumetric trajectory evaluation.",
        ],
        explainabilitySummary: {
          method: "3D CNN + Vision Transformer Grad-CAM & Volumetric SHAP",
          topFactors: analysis.shap.features.slice(0, 3).map((f) => ({
            name: f.featureName,
            impact: `${f.shapValue >= 0 ? "+" : ""}${f.shapValue.toFixed(2)} (${f.clinicalImpact})`,
            value: f.patientValue,
          })),
          visualSummaryNote: analysis.gradCam.disclaimer,
        },
        disclaimer: "This system provides AI-assisted decision support and should not be treated as a standalone medical diagnosis. Final clinical diagnosis requires comprehensive physician evaluation.",
      };

      const stored = getStoredReports();
      saveStoredReports([newReport, ...stored]);
      return newReport;
    }
  },

  async generateReportFromParkinson(
    analysis: ParkinsonAnalysisResult,
    doctorName = "Dr. Sarah Jenkins, MD, PhD"
  ): Promise<UnifiedDiagnosticReport> {
    try {
      return await apiClient.post<UnifiedDiagnosticReport>("/reports/generate/parkinson", {
        analysisId: analysis.id,
        doctorName,
      });
    } catch {
      const reportId = `REP-${Math.floor(1000 + Math.random() * 9000)}`;
      const now = new Date();
      const createdAt = `${now.toISOString().split("T")[0]} ${now.toTimeString().slice(0, 5)}`;

      const newReport: UnifiedDiagnosticReport = {
        id: reportId,
        analysisId: analysis.id,
        patientId: analysis.patientId,
        patientName: analysis.patientName,
        patientAge: 72,
        patientGender: "Unspecified",
        doctorName,
        doctorLicense: "MD-98472-NEURO",
        hospitalName: "Metropolitan Neurological Institute",
        createdAt,
        disease: "Parkinson's Disease",
        modalityOrSource: `Voice Recording (${analysis.audioFilename})`,
        primaryDiagnosis: analysis.prediction,
        confidenceScore: analysis.confidence,
        status: "Finalized",
        keyFindings: [
          `Primary model prediction: ${analysis.prediction} with ${analysis.confidence.toFixed(1)}% confidence.`,
          `MDVP:Jitter recorded at ${(analysis.vocalBiomarkers.jitterPercent * 100).toFixed(3)}% (normal < 0.400%).`,
          `MDVP:Shimmer recorded at ${analysis.vocalBiomarkers.shimmerDb.toFixed(3)} dB.`,
          `Harmonics-to-Noise Ratio (HNR): ${analysis.vocalBiomarkers.hnrDb.toFixed(1)} dB.`,
          `Quantum-Inspired Decision Layer: Score ${analysis.quantumLayer.quantumDecisionScore.toFixed(1)}% with ${analysis.quantumLayer.quantumPhaseTheta}.`,
        ],
        recommendations: [
          "Perform clinical motor evaluation using the Movement Disorder Society Unified Parkinson's Disease Rating Scale (MDS-UPDRS).",
          "Assess resting tremor, rigidity, bradykinesia, and postural instability.",
          "Consider referral for targeted speech therapy and vocal resonance training.",
        ],
        explainabilitySummary: {
          method: "Quantum-Inspired Decision Layer & Vocal SHAP",
          topFactors: analysis.shap.metrics.slice(0, 3).map((m) => ({
            name: m.name,
            impact: `${m.shapValue >= 0 ? "+" : ""}${m.shapValue.toFixed(2)} (${m.status})`,
            value: m.patientValue,
          })),
          visualSummaryNote: `Classified using ${analysis.quantumLayer.ansatzArchitecture} with 4 parameterized qubits.`,
        },
        disclaimer: "This system provides AI-assisted decision support and should not be treated as a standalone medical diagnosis. Final clinical diagnosis requires comprehensive physician evaluation.",
      };

      const stored = getStoredReports();
      saveStoredReports([newReport, ...stored]);
      return newReport;
    }
  },
};
