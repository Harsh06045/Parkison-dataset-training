import { apiClient } from "./apiClient";

export type Role = "doctor" | "admin" | "patient";

export interface DoctorUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  medicalLicenseId: string;
  specialization: string;
  hospital: string;
  department: string;
  avatarUrl?: string;
  token?: string;
}

const STORAGE_USER_KEY = "neurofusion_active_user";

export const DEFAULT_PROFILES: Record<Role, DoctorUser> = {
  doctor: {
    id: "DOC-8921",
    email: "dr.jenkins@neurofusion.ai",
    fullName: "Dr. Sarah Jenkins, MD, PhD",
    role: "doctor",
    medicalLicenseId: "MD-98472-NEURO",
    specialization: "Cognitive Neurology & Movement Disorders",
    hospital: "Metropolitan Neurological Institute & Brain Research Center",
    department: "Division of Neurodegenerative Diseases",
    avatarUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200",
  },
  patient: {
    id: "PT-8942-AD",
    email: "eleanor.vance@patient.neurofusion.ai",
    fullName: "Eleanor Vance",
    role: "patient",
    medicalLicenseId: "MRN-489201",
    specialization: "Patient / Longitudinal Monitoring",
    hospital: "Metropolitan Neurological Institute",
    department: "Outpatient Memory & Movement Clinic",
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200",
  },
  admin: {
    id: "ADM-0042",
    email: "admin.it@hospital.org",
    fullName: "Marcus Vance (Hospital IT Admin)",
    role: "admin",
    medicalLicenseId: "IT-ADMIN-894",
    specialization: "Chief Medical Information Officer",
    hospital: "Metropolitan Health System Data Center",
    department: "Clinical AI Governance & Infrastructure",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
  },
};

export const authApi = {
  async login(email: string, password: string, role: Role = "doctor"): Promise<DoctorUser> {
    try {
      // Try real backend first if configured
      const res = await apiClient.post<{ user: DoctorUser; token: string }>("/auth/login", {
        email,
        password,
        role,
      });
      apiClient.setToken(res.token);
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(res.user));
      return res.user;
    } catch {
      // Fallback for seamless offline demo execution
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (email.includes("fail") || (password && password.length < 3)) {
        throw new Error("Invalid credentials or authentication key error.");
      }

      const baseProfile = DEFAULT_PROFILES[role] || DEFAULT_PROFILES.doctor;
      const user: DoctorUser = {
        ...baseProfile,
        email: email || baseProfile.email,
        role,
        token: `demo-jwt-token-${Date.now()}`,
      };

      apiClient.setToken(user.token || "demo-token");
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
      return user;
    }
  },

  getCurrentUser(): DoctorUser | null {
    try {
      const stored = localStorage.getItem(STORAGE_USER_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error("Failed to parse stored user", e);
    }
    // Default to null so unauthenticated users see the Login page first
    return null;
  },

  async updateProfile(updates: Partial<DoctorUser>): Promise<DoctorUser> {
    try {
      const res = await apiClient.put<{ user: DoctorUser }>("/auth/profile", updates);
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(res.user));
      return res.user;
    } catch {
      const current = this.getCurrentUser() || DEFAULT_PROFILES.doctor;
      const updated = { ...current, ...updates };
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(updated));
      return updated;
    }
  },

  logout(): void {
    apiClient.setToken(null);
    localStorage.removeItem(STORAGE_USER_KEY);
  },
};
