import { apiClient } from "./apiClient";

export type RiskLevel = "Low" | "Moderate" | "High" | "Critical";
export type PrimaryDisease = "Alzheimer's Disease" | "Parkinson's Disease" | "MCI" | "Healthy Control" | "Pending Analysis";

export interface PatientRecord {
  id: string;
  fullName: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  dateOfBirth: string;
  contactNumber: string;
  email: string;
  riskLevel: RiskLevel;
  primaryDiagnosis: PrimaryDisease;
  stage: string;
  lastAnalysisDate: string;
  totalAnalyses: number;
  medicalHistory: string;
  attendingPhysician: string;
  bloodPressure?: string;
  mmseScore?: number; // Mini-Mental State Exam score (0-30)
  updrsScore?: number; // Unified Parkinson's Disease Rating Scale
}

const STORAGE_PATIENTS_KEY = "neurofusion_patients_registry_v3";

const INITIAL_PATIENTS: PatientRecord[] = [
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
    stage: "Mild Dementia (CDR 1.0)",
    lastAnalysisDate: "2026-08-18",
    totalAnalyses: 4,
    medicalHistory: "Type 2 Diabetes, Hypertension. Progressive short-term memory deficit noted over past 10 months. Difficulty with episodic recall.",
    attendingPhysician: "Dr. Sarah Jenkins, MD",
    mmseScore: 21,
    bloodPressure: "135/85 mmHg",
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
    stage: "Parkinson's Stage II (Hoehn & Yahr)",
    lastAnalysisDate: "2026-08-19",
    totalAnalyses: 3,
    medicalHistory: "Unilateral resting tremor in right upper extremity, micrographic handwriting, mild bradykinesia and hypophonia.",
    attendingPhysician: "Dr. Sarah Jenkins, MD",
    updrsScore: 28,
    bloodPressure: "128/78 mmHg",
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
    stage: "Amnestic MCI (Early Stage)",
    lastAnalysisDate: "2026-08-15",
    totalAnalyses: 2,
    medicalHistory: "Subjective memory complaints confirmed by neuropsychological testing. Normal activities of daily living preserved.",
    attendingPhysician: "Dr. Sarah Jenkins, MD",
    mmseScore: 26,
    bloodPressure: "122/80 mmHg",
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
    primaryDiagnosis: "Healthy Control",
    stage: "Cognitively Intact / Healthy",
    lastAnalysisDate: "2026-08-10",
    totalAnalyses: 1,
    medicalHistory: "Routine neurological baseline screening. No motor deficits, normal voice pitch stability, normal spatial navigation.",
    attendingPhysician: "Dr. Sarah Jenkins, MD",
    mmseScore: 30,
    bloodPressure: "118/75 mmHg",
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
    stage: "Moderate Dementia (CDR 2.0)",
    lastAnalysisDate: "2026-08-20",
    totalAnalyses: 5,
    medicalHistory: "Marked bilateral hippocampal atrophy, disorientation to time/place, requiring partial assistance with daily living.",
    attendingPhysician: "Dr. Sarah Jenkins, MD",
    mmseScore: 16,
    bloodPressure: "142/90 mmHg",
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
    stage: "Parkinson's Stage III (Hoehn & Yahr)",
    lastAnalysisDate: "2026-08-14",
    totalAnalyses: 3,
    medicalHistory: "Bilateral motor involvement, mild postural instability, vocal pitch perturbation and intermittent freezing of gait.",
    attendingPhysician: "Dr. Sarah Jenkins, MD",
    updrsScore: 36,
    bloodPressure: "130/82 mmHg",
  },
];

function getStoredPatients(): PatientRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_PATIENTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Error reading patients storage", e);
  }
  localStorage.setItem(STORAGE_PATIENTS_KEY, JSON.stringify(INITIAL_PATIENTS));
  return INITIAL_PATIENTS;
}

function saveStoredPatients(patients: PatientRecord[]): void {
  localStorage.setItem(STORAGE_PATIENTS_KEY, JSON.stringify(patients));
}

export const patientApi = {
  async getPatients(search?: string): Promise<PatientRecord[]> {
    try {
      return await apiClient.get<PatientRecord[]>("/patients", { search });
    } catch {
      let list = getStoredPatients();
      if (search && search.trim()) {
        const q = search.toLowerCase().trim();
        list = list.filter(
          (p) =>
            p.fullName.toLowerCase().includes(q) ||
            p.id.toLowerCase().includes(q) ||
            p.primaryDiagnosis.toLowerCase().includes(q) ||
            p.email.toLowerCase().includes(q)
        );
      }
      return list;
    }
  },

  async getPatientById(id: string): Promise<PatientRecord | null> {
    try {
      return await apiClient.get<PatientRecord>(`/patients/${id}`);
    } catch {
      const list = getStoredPatients();
      return list.find((p) => p.id === id) || null;
    }
  },

  async addPatient(data: Omit<PatientRecord, "id" | "lastAnalysisDate" | "totalAnalyses">): Promise<PatientRecord> {
    try {
      return await apiClient.post<PatientRecord>("/patients", data);
    } catch {
      const list = getStoredPatients();
      const nextIdNum = 1080 + list.length + 1;
      const newPatient: PatientRecord = {
        ...data,
        id: `PAT-${nextIdNum}`,
        lastAnalysisDate: "Just added",
        totalAnalyses: 0,
      };
      const updated = [newPatient, ...list];
      saveStoredPatients(updated);
      return newPatient;
    }
  },

  async updatePatient(id: string, updates: Partial<PatientRecord>): Promise<PatientRecord> {
    try {
      return await apiClient.put<PatientRecord>(`/patients/${id}`, updates);
    } catch {
      const list = getStoredPatients();
      const idx = list.findIndex((p) => p.id === id);
      if (idx === -1) throw new Error(`Patient ${id} not found.`);
      const updatedItem = { ...list[idx], ...updates };
      list[idx] = updatedItem;
      saveStoredPatients(list);
      return updatedItem;
    }
  },

  async deletePatient(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/patients/${id}`);
      return true;
    } catch {
      const list = getStoredPatients();
      const filtered = list.filter((p) => p.id !== id);
      saveStoredPatients(filtered);
      return true;
    }
  },
};
