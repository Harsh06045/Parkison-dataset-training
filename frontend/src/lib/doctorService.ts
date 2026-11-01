export type DiseaseCategory = "Alzheimer's Disease" | "Parkinson's Disease" | "MCI" | "Control / Healthy";

export type DiseaseStage =
  | "Cognitively Normal"
  | "Very Mild Cognitive Impairment (MCI)"
  | "Mild Dementia"
  | "Moderate Dementia"
  | "Severe Dementia"
  | "Parkinson's Stage I (Hoehn & Yahr)"
  | "Parkinson's Stage II"
  | "Parkinson's Stage III"
  | "Parkinson's Stage IV";

export type RiskLevel = "Low" | "Moderate" | "High" | "Critical";

export interface MriScan {
  id: string;
  patientId: string;
  patientName: string;
  scanDate: string;
  modality: "3D T1-weighted MRI" | "FDG-PET" | "DaTscan SPECT" | "FLAIR MRI";
  status: "Pending AI Analysis" | "Completed" | "Processing" | "Requires Doctor Review";
  predictedDisease: DiseaseCategory;
  stage: DiseaseStage;
  confidence: number; // e.g. 98.4
  severity: "low" | "medium" | "high" | "critical";
  hippocampalVolumeMm3?: number; // Normal ~3800-4200
  ventricularVolumeMm3?: number; // Normal ~20000-35000
  striatalBindingRatio?: number; // Normal ~2.4-3.2
  gradCamHeatmapAvailable: boolean;
  notes?: string;
}

export interface DiagnosticReport {
  id: string;
  scanId: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  createdAt: string;
  primaryDiagnosis: string;
  confidenceScore: string;
  keyFindings: string[];
  recommendations: string[];
  status: "Finalized" | "Draft";
}

export interface Patient {
  id: string;
  fullName: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  dateOfBirth: string;
  contactNumber: string;
  email: string;
  riskLevel: RiskLevel;
  primaryDiagnosis: DiseaseCategory;
  stage: DiseaseStage;
  lastScanDate: string;
  totalScans: number;
  medicalHistory: string;
  attendingPhysician: string;
}

export interface DoctorNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: "alert" | "scan_ready" | "system" | "report";
  read: boolean;
  patientId?: string;
  patientName?: string;
}

export interface DoctorProfile {
  id: string;
  fullName: string;
  email: string;
  medicalLicenseId: string;
  specialization: string;
  hospital: string;
  department: string;
  phone: string;
  avatarUrl?: string;
  notificationPreferences: {
    emailAlerts: boolean;
    urgentPush: boolean;
    weeklySummary: boolean;
  };
}

export interface DashboardStats {
  totalPatients: number;
  patientsTrend: number; // e.g. +12% this month
  mriUploads: number;
  mriUploadsToday: number;
  pendingPredictions: number;
  recentReportsCount: number;
  diseaseDistribution: {
    disease: DiseaseCategory;
    count: number;
    percentage: number;
    color: string;
  }[];
  predictionTrends: {
    month: string;
    alzheimers: number;
    parkinsons: number;
    controls: number;
  }[];
  stageDistribution: {
    stage: string;
    count: number;
    category: "Alzheimer's" | "Parkinson's";
  }[];
}

// Initial Storage Keys
const STORAGE_PATIENTS_KEY = "neurofusion_patients_v2";
const STORAGE_SCANS_KEY = "neurofusion_scans_v2";
const STORAGE_NOTIFICATIONS_KEY = "neurofusion_notifications_v2";
const STORAGE_REPORTS_KEY = "neurofusion_reports_v2";
const STORAGE_PROFILE_KEY = "neurofusion_doctor_profile_v2";

const INITIAL_PATIENTS: Patient[] = [
  {
    id: "PAT-1082",
    fullName: "Robert Davis",
    age: 68,
    gender: "Male",
    dateOfBirth: "1958-03-14",
    contactNumber: "+1 (555) 234-5678",
    email: "robert.davis@example.com",
    riskLevel: "High",
    primaryDiagnosis: "Alzheimer's Disease",
    stage: "Mild Dementia",
    lastScanDate: "2026-08-01",
    totalScans: 4,
    medicalHistory: "Type 2 Diabetes, Hypertension. Early signs of short-term memory impairment noticed 8 months ago.",
    attendingPhysician: "Dr. Sarah Jenkins, MD",
  },
  {
    id: "PAT-1083",
    fullName: "Eleanor Vance",
    age: 72,
    gender: "Female",
    dateOfBirth: "1954-11-20",
    contactNumber: "+1 (555) 876-5432",
    email: "eleanor.vance@example.com",
    riskLevel: "Moderate",
    primaryDiagnosis: "Parkinson's Disease",
    stage: "Parkinson's Stage II",
    lastScanDate: "2026-08-02",
    totalScans: 3,
    medicalHistory: "Bilateral resting tremor, bradykinesia present for 1.5 years. Currently on Levodopa response evaluation.",
    attendingPhysician: "Dr. Sarah Jenkins, MD",
  },
  {
    id: "PAT-1084",
    fullName: "James Miller",
    age: 64,
    gender: "Male",
    dateOfBirth: "1962-07-04",
    contactNumber: "+1 (555) 345-6789",
    email: "james.miller@example.com",
    riskLevel: "Moderate",
    primaryDiagnosis: "MCI",
    stage: "Very Mild Cognitive Impairment (MCI)",
    lastScanDate: "2026-08-03",
    totalScans: 2,
    medicalHistory: "Family history of early onset dementia. Mild spatial disorientation.",
    attendingPhysician: "Dr. Sarah Jenkins, MD",
  },
  {
    id: "PAT-1085",
    fullName: "Sophia Martinez",
    age: 59,
    gender: "Female",
    dateOfBirth: "1967-02-18",
    contactNumber: "+1 (555) 901-2345",
    email: "sophia.martinez@example.com",
    riskLevel: "Low",
    primaryDiagnosis: "Control / Healthy",
    stage: "Cognitively Normal",
    lastScanDate: "2026-07-28",
    totalScans: 1,
    medicalHistory: "Routine preventive screening. No neurological deficits observed.",
    attendingPhysician: "Dr. Sarah Jenkins, MD",
  },
  {
    id: "PAT-1086",
    fullName: "William Sterling",
    age: 75,
    gender: "Male",
    dateOfBirth: "1951-09-30",
    contactNumber: "+1 (555) 456-7890",
    email: "w.sterling@example.com",
    riskLevel: "Critical",
    primaryDiagnosis: "Alzheimer's Disease",
    stage: "Moderate Dementia",
    lastScanDate: "2026-08-03",
    totalScans: 6,
    medicalHistory: "Rapid decline in MMSE score over 6 months. Significant hippocampal bilateral atrophy.",
    attendingPhysician: "Dr. Sarah Jenkins, MD",
  },
  {
    id: "PAT-1087",
    fullName: "Clara Oswald",
    age: 61,
    gender: "Female",
    dateOfBirth: "1965-05-12",
    contactNumber: "+1 (555) 678-9012",
    email: "clara.oswald@example.com",
    riskLevel: "High",
    primaryDiagnosis: "Parkinson's Disease",
    stage: "Parkinson's Stage III",
    lastScanDate: "2026-07-22",
    totalScans: 2,
    medicalHistory: "Postural instability, freezing gait episodes.",
    attendingPhysician: "Dr. Sarah Jenkins, MD",
  },
];

const INITIAL_SCANS: MriScan[] = [
  {
    id: "SCAN-9402",
    patientId: "PAT-1082",
    patientName: "Robert Davis",
    scanDate: "2026-08-01",
    modality: "3D T1-weighted MRI",
    status: "Completed",
    predictedDisease: "Alzheimer's Disease",
    stage: "Mild Dementia",
    confidence: 97.8,
    severity: "high",
    hippocampalVolumeMm3: 3120,
    ventricularVolumeMm3: 41200,
    striatalBindingRatio: 2.8,
    gradCamHeatmapAvailable: true,
    notes: "Significant temporal lobe volume reduction with entitlement of temporal horn.",
  },
  {
    id: "SCAN-9403",
    patientId: "PAT-1083",
    patientName: "Eleanor Vance",
    scanDate: "2026-08-02",
    modality: "DaTscan SPECT",
    status: "Completed",
    predictedDisease: "Parkinson's Disease",
    stage: "Parkinson's Stage II",
    confidence: 99.1,
    severity: "medium",
    hippocampalVolumeMm3: 3890,
    ventricularVolumeMm3: 24100,
    striatalBindingRatio: 1.42,
    gradCamHeatmapAvailable: true,
    notes: "Reduced dopaminergic transporter density in posterior putamen bilaterally.",
  },
  {
    id: "SCAN-9404",
    patientId: "PAT-1084",
    patientName: "James Miller",
    scanDate: "2026-08-03",
    modality: "3D T1-weighted MRI",
    status: "Requires Doctor Review",
    predictedDisease: "MCI",
    stage: "Very Mild Cognitive Impairment (MCI)",
    confidence: 96.4,
    severity: "medium",
    hippocampalVolumeMm3: 3550,
    ventricularVolumeMm3: 29800,
    striatalBindingRatio: 2.65,
    gradCamHeatmapAvailable: true,
    notes: "Borderline entorhinal cortex thinning.",
  },
  {
    id: "SCAN-9405",
    patientId: "PAT-1086",
    patientName: "William Sterling",
    scanDate: "2026-08-03",
    modality: "FDG-PET",
    status: "Pending AI Analysis",
    predictedDisease: "Alzheimer's Disease",
    stage: "Moderate Dementia",
    confidence: 98.9,
    severity: "critical",
    hippocampalVolumeMm3: 2780,
    ventricularVolumeMm3: 48500,
    striatalBindingRatio: 2.4,
    gradCamHeatmapAvailable: false,
    notes: "Biparietal and temporoparietal hypometabolism.",
  },
];

const INITIAL_NOTIFICATIONS: DoctorNotification[] = [
  {
    id: "NOTIF-101",
    title: "Critical Biomarker Alert",
    message: "Patient William Sterling (PAT-1086) FDG-PET scan showed severe temporoparietal hypometabolism.",
    timestamp: "10 mins ago",
    type: "alert",
    read: false,
    patientId: "PAT-1086",
    patientName: "William Sterling",
  },
  {
    id: "NOTIF-102",
    title: "AI Scan Analysis Completed",
    message: "SCAN-9402 for Robert Davis has finished ensemble model inference with 97.8% confidence.",
    timestamp: "1 hour ago",
    type: "scan_ready",
    read: false,
    patientId: "PAT-1082",
    patientName: "Robert Davis",
  },
  {
    id: "NOTIF-103",
    title: "Diagnostic Report Ready",
    message: "Automated draft report generated for Eleanor Vance (PAT-1083).",
    timestamp: "3 hours ago",
    type: "report",
    read: true,
    patientId: "PAT-1083",
    patientName: "Eleanor Vance",
  },
  {
    id: "NOTIF-104",
    title: "PACS DICOM Node Synced",
    message: "4 new volumetric T1 MRI scans ingested successfully into local staging.",
    timestamp: "Yesterday",
    type: "system",
    read: true,
  },
];

const INITIAL_REPORTS: DiagnosticReport[] = [
  {
    id: "REP-501",
    scanId: "SCAN-9402",
    patientId: "PAT-1082",
    patientName: "Robert Davis",
    doctorName: "Dr. Sarah Jenkins, MD",
    createdAt: "2026-08-01",
    primaryDiagnosis: "Alzheimer's Disease (Mild Stage)",
    confidenceScore: "97.8%",
    keyFindings: [
      "Volumetric reduction in bilateral hippocampus (z-score -2.4SD).",
      "Lateral ventricle enlargement (41.2 cm³).",
      "Grad-CAM 3D heatmap highlights intense neural loss in medial temporal lobes.",
    ],
    recommendations: [
      "Initiate Donepezil 5mg daily.",
      "Schedule follow-up 3D MRI in 6 months.",
      "Recommend cognitive therapy baseline.",
    ],
    status: "Finalized",
  },
  {
    id: "REP-502",
    scanId: "SCAN-9403",
    patientId: "PAT-1083",
    patientName: "Eleanor Vance",
    doctorName: "Dr. Sarah Jenkins, MD",
    createdAt: "2026-08-02",
    primaryDiagnosis: "Parkinson's Disease (Stage II)",
    confidenceScore: "99.1%",
    keyFindings: [
      "DaTscan SPECT reveals 45% decrease in dopamine transporter uptake in striatum.",
      "Putamen-to-caudate binding ratio asymmetrical (L < R).",
    ],
    recommendations: [
      "Adjust Levodopa/Carbidopa dosing.",
      "Physiotherapy referral for gait stabilization.",
    ],
    status: "Finalized",
  },
];

const DEFAULT_PROFILE: DoctorProfile = {
  id: "doc-profile-1",
  fullName: "Dr. Sarah Jenkins, MD",
  email: "doctor@neurofusion.ai",
  medicalLicenseId: "MD-84920-CA",
  specialization: "Cognitive Neurology & Neuroimaging Specialist",
  hospital: "Stanford University Medical Center",
  department: "Department of Neurological Sciences",
  phone: "+1 (650) 723-4000",
  notificationPreferences: {
    emailAlerts: true,
    urgentPush: true,
    weeklySummary: false,
  },
};

// Helper utilities for local storage
function getStored<T>(key: string, defaultData: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaultData));
      return defaultData;
    }
    return JSON.parse(raw);
  } catch {
    return defaultData;
  }
}

function setStored<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error("Storage error", e);
  }
}

export const doctorService = {
  // Patients
  getPatients(searchQuery = "", riskFilter = "All", diagnosisFilter = "All"): Patient[] {
    const patients = getStored<Patient[]>(STORAGE_PATIENTS_KEY, INITIAL_PATIENTS);
    return patients.filter((p) => {
      const matchesSearch =
        p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRisk = riskFilter === "All" || p.riskLevel === riskFilter;
      const matchesDiagnosis = diagnosisFilter === "All" || p.primaryDiagnosis === diagnosisFilter;

      return matchesSearch && matchesRisk && matchesDiagnosis;
    });
  },

  getPatientById(id: string): Patient | undefined {
    const patients = getStored<Patient[]>(STORAGE_PATIENTS_KEY, INITIAL_PATIENTS);
    return patients.find((p) => p.id === id);
  },

  addPatient(patientData: Omit<Patient, "id" | "lastScanDate" | "totalScans">): Patient {
    const patients = getStored<Patient[]>(STORAGE_PATIENTS_KEY, INITIAL_PATIENTS);
    const newId = `PAT-${Math.floor(1000 + Math.random() * 9000)}`;
    const newPatient: Patient = {
      ...patientData,
      id: newId,
      lastScanDate: new Date().toISOString().split("T")[0],
      totalScans: 0,
    };
    patients.unshift(newPatient);
    setStored(STORAGE_PATIENTS_KEY, patients);

    // Add notification
    this.addNotification({
      title: "New Patient Registered",
      message: `Patient ${newPatient.fullName} (${newPatient.id}) was successfully added to your workspace.`,
      type: "system",
      patientId: newPatient.id,
      patientName: newPatient.fullName,
    });

    return newPatient;
  },

  updatePatient(id: string, updates: Partial<Patient>): Patient {
    const patients = getStored<Patient[]>(STORAGE_PATIENTS_KEY, INITIAL_PATIENTS);
    const idx = patients.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error("Patient not found");

    patients[idx] = { ...patients[idx], ...updates };
    setStored(STORAGE_PATIENTS_KEY, patients);
    return patients[idx];
  },

  // Scans
  getScansForPatient(patientId: string): MriScan[] {
    const scans = getStored<MriScan[]>(STORAGE_SCANS_KEY, INITIAL_SCANS);
    return scans.filter((s) => s.patientId === patientId);
  },

  getAllScans(): MriScan[] {
    return getStored<MriScan[]>(STORAGE_SCANS_KEY, INITIAL_SCANS);
  },

  uploadMriScan(params: {
    patientId: string;
    modality: MriScan["modality"];
    notes?: string;
  }): MriScan {
    const patient = this.getPatientById(params.patientId);
    if (!patient) throw new Error("Patient not found");

    const scans = getStored<MriScan[]>(STORAGE_SCANS_KEY, INITIAL_SCANS);
    const scanId = `SCAN-${Math.floor(9000 + Math.random() * 1000)}`;

    const newScan: MriScan = {
      id: scanId,
      patientId: patient.id,
      patientName: patient.fullName,
      scanDate: new Date().toISOString().split("T")[0],
      modality: params.modality,
      status: "Pending AI Analysis",
      predictedDisease: patient.primaryDiagnosis,
      stage: patient.stage,
      confidence: 0,
      severity: patient.riskLevel === "Critical" || patient.riskLevel === "High" ? "high" : "medium",
      gradCamHeatmapAvailable: false,
      notes: params.notes || "Scan uploaded via PACS DICOM gateway.",
    };

    scans.unshift(newScan);
    setStored(STORAGE_SCANS_KEY, scans);

    // Update patient total scans
    this.updatePatient(patient.id, {
      totalScans: patient.totalScans + 1,
      lastScanDate: newScan.scanDate,
    });

    this.addNotification({
      title: "MRI Scan Uploaded",
      message: `New ${params.modality} uploaded for ${patient.fullName}. Pending AI analysis.`,
      type: "system",
      patientId: patient.id,
      patientName: patient.fullName,
    });

    return newScan;
  },

  async triggerPrediction(scanId: string): Promise<MriScan> {
    const scans = getStored<MriScan[]>(STORAGE_SCANS_KEY, INITIAL_SCANS);
    const idx = scans.findIndex((s) => s.id === scanId);
    if (idx === -1) throw new Error("Scan not found");

    scans[idx].status = "Processing";
    setStored(STORAGE_SCANS_KEY, scans);

    // Simulate AI model prediction processing delay
    await new Promise((res) => setTimeout(res, 1800));

    const simulatedConfidence = parseFloat((95.5 + Math.random() * 4).toFixed(1));
    scans[idx].status = "Completed";
    scans[idx].confidence = simulatedConfidence;
    scans[idx].gradCamHeatmapAvailable = true;
    scans[idx].hippocampalVolumeMm3 = Math.floor(3000 + Math.random() * 900);
    scans[idx].ventricularVolumeMm3 = Math.floor(25000 + Math.random() * 20000);
    scans[idx].striatalBindingRatio = parseFloat((1.5 + Math.random() * 1.5).toFixed(2));

    setStored(STORAGE_SCANS_KEY, scans);

    this.addNotification({
      title: "AI Prediction Completed",
      message: `Scan ${scanId} analyzed with ${simulatedConfidence}% confidence. 3D heatmap generated.`,
      type: "scan_ready",
      patientId: scans[idx].patientId,
      patientName: scans[idx].patientName,
    });

    return scans[idx];
  },

  // Reports
  getReports(): DiagnosticReport[] {
    return getStored<DiagnosticReport[]>(STORAGE_REPORTS_KEY, INITIAL_REPORTS);
  },

  generateReport(scanId: string): DiagnosticReport {
    const scans = getStored<MriScan[]>(STORAGE_SCANS_KEY, INITIAL_SCANS);
    const scan = scans.find((s) => s.id === scanId);
    if (!scan) throw new Error("Scan not found");

    const reports = getStored<DiagnosticReport[]>(STORAGE_REPORTS_KEY, INITIAL_REPORTS);
    const newReport: DiagnosticReport = {
      id: `REP-${Math.floor(500 + Math.random() * 500)}`,
      scanId: scan.id,
      patientId: scan.patientId,
      patientName: scan.patientName,
      doctorName: "Dr. Sarah Jenkins, MD",
      createdAt: new Date().toISOString().split("T")[0],
      primaryDiagnosis: `${scan.predictedDisease} (${scan.stage})`,
      confidenceScore: `${scan.confidence || 98.2}%`,
      keyFindings: [
        `AI ensemble model detected high biomarker markers consistent with ${scan.predictedDisease}.`,
        `Estimated hippocampal volume: ${scan.hippocampalVolumeMm3 || 3200} mm³ (z-score -2.1SD).`,
        `Grad-CAM volumetric heatmaps show focal neural involvement.`,
      ],
      recommendations: [
        "Continue current disease-modifying therapeutic protocol.",
        "Re-assess volumetric progression in 6 months.",
        "Provide patient with cognitive tracking assessment log.",
      ],
      status: "Finalized",
    };

    reports.unshift(newReport);
    setStored(STORAGE_REPORTS_KEY, reports);

    this.addNotification({
      title: "New Report Generated",
      message: `Diagnostic Report ${newReport.id} generated for ${scan.patientName}.`,
      type: "report",
      patientId: scan.patientId,
      patientName: scan.patientName,
    });

    return newReport;
  },

  // Notifications
  getNotifications(): DoctorNotification[] {
    return getStored<DoctorNotification[]>(STORAGE_NOTIFICATIONS_KEY, INITIAL_NOTIFICATIONS);
  },

  addNotification(notif: Omit<DoctorNotification, "id" | "timestamp" | "read">): DoctorNotification {
    const notifs = getStored<DoctorNotification[]>(STORAGE_NOTIFICATIONS_KEY, INITIAL_NOTIFICATIONS);
    const newNotif: DoctorNotification = {
      ...notif,
      id: `NOTIF-${Math.floor(100 + Math.random() * 900)}`,
      timestamp: "Just now",
      read: false,
    };
    notifs.unshift(newNotif);
    setStored(STORAGE_NOTIFICATIONS_KEY, notifs);
    return newNotif;
  },

  markNotificationRead(id: string): DoctorNotification[] {
    const notifs = getStored<DoctorNotification[]>(STORAGE_NOTIFICATIONS_KEY, INITIAL_NOTIFICATIONS);
    const updated = notifs.map((n) => (n.id === id ? { ...n, read: true } : n));
    setStored(STORAGE_NOTIFICATIONS_KEY, updated);
    return updated;
  },

  markAllNotificationsRead(): DoctorNotification[] {
    const notifs = getStored<DoctorNotification[]>(STORAGE_NOTIFICATIONS_KEY, INITIAL_NOTIFICATIONS);
    const updated = notifs.map((n) => ({ ...n, read: true }));
    setStored(STORAGE_NOTIFICATIONS_KEY, updated);
    return updated;
  },

  // Doctor Profile
  getDoctorProfile(): DoctorProfile {
    return getStored<DoctorProfile>(STORAGE_PROFILE_KEY, DEFAULT_PROFILE);
  },

  updateDoctorProfile(profileUpdates: Partial<DoctorProfile>): DoctorProfile {
    const current = this.getDoctorProfile();
    const updated = { ...current, ...profileUpdates };
    setStored(STORAGE_PROFILE_KEY, updated);
    return updated;
  },

  // Statistics API
  getDashboardStatistics(): DashboardStats {
    const patients = getStored<Patient[]>(STORAGE_PATIENTS_KEY, INITIAL_PATIENTS);
    const scans = getStored<MriScan[]>(STORAGE_SCANS_KEY, INITIAL_SCANS);
    const reports = getStored<DiagnosticReport[]>(STORAGE_REPORTS_KEY, INITIAL_REPORTS);

    const pendingScansCount = scans.filter(
      (s) => s.status === "Pending AI Analysis" || s.status === "Requires Doctor Review"
    ).length;

    // Disease Distribution calculation
    const diseaseCounts: Record<DiseaseCategory, number> = {
      "Alzheimer's Disease": 0,
      "Parkinson's Disease": 0,
      "MCI": 0,
      "Control / Healthy": 0,
    };

    patients.forEach((p) => {
      if (diseaseCounts[p.primaryDiagnosis] !== undefined) {
        diseaseCounts[p.primaryDiagnosis]++;
      }
    });

    const totalP = patients.length || 1;
    const diseaseDistribution = [
      {
        disease: "Alzheimer's Disease" as DiseaseCategory,
        count: diseaseCounts["Alzheimer's Disease"],
        percentage: Math.round((diseaseCounts["Alzheimer's Disease"] / totalP) * 100),
        color: "#c084fc", // Purple/Fuchsia
      },
      {
        disease: "Parkinson's Disease" as DiseaseCategory,
        count: diseaseCounts["Parkinson's Disease"],
        percentage: Math.round((diseaseCounts["Parkinson's Disease"] / totalP) * 100),
        color: "#38bdf8", // Sky blue
      },
      {
        disease: "MCI" as DiseaseCategory,
        count: diseaseCounts["MCI"],
        percentage: Math.round((diseaseCounts["MCI"] / totalP) * 100),
        color: "#facc15", // Yellow
      },
      {
        disease: "Control / Healthy" as DiseaseCategory,
        count: diseaseCounts["Control / Healthy"],
        percentage: Math.round((diseaseCounts["Control / Healthy"] / totalP) * 100),
        color: "#4ade80", // Emerald
      },
    ];

    const predictionTrends = [
      { month: "Mar", alzheimers: 24, parkinsons: 18, controls: 12 },
      { month: "Apr", alzheimers: 31, parkinsons: 22, controls: 15 },
      { month: "May", alzheimers: 38, parkinsons: 29, controls: 19 },
      { month: "Jun", alzheimers: 45, parkinsons: 34, controls: 25 },
      { month: "Jul", alzheimers: 52, parkinsons: 40, controls: 30 },
      { month: "Aug", alzheimers: 64, parkinsons: 48, controls: 36 },
    ];

    const stageDistribution = [
      { stage: "Cognitively Normal", count: 8, category: "Alzheimer's" as const },
      { stage: "Very Mild (MCI)", count: 14, category: "Alzheimer's" as const },
      { stage: "Mild Dementia", count: 19, category: "Alzheimer's" as const },
      { stage: "Moderate Dementia", count: 11, category: "Alzheimer's" as const },
      { stage: "Severe Dementia", count: 5, category: "Alzheimer's" as const },
      { stage: "Parkinson's Stage I-II", count: 16, category: "Parkinson's" as const },
      { stage: "Parkinson's Stage III-IV", count: 9, category: "Parkinson's" as const },
    ];

    return {
      totalPatients: patients.length,
      patientsTrend: 14,
      mriUploads: scans.length,
      mriUploadsToday: 3,
      pendingPredictions: pendingScansCount,
      recentReportsCount: reports.length,
      diseaseDistribution,
      predictionTrends,
      stageDistribution,
    };
  },
};
