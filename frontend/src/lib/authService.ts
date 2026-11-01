export type UserRole = "doctor" | "patient" | "admin";

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  medicalLicenseId?: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
}

const STORAGE_USERS_KEY = "neurofusion_users";
const STORAGE_SESSION_KEY = "neurofusion_session";
const STORAGE_OTP_KEY = "neurofusion_otp";

const DEFAULT_USERS: User[] = [
  {
    id: "user-doc-1",
    fullName: "Dr. Sarah Jenkins, MD",
    email: "doctor@neurofusion.ai",
    role: "doctor",
    medicalLicenseId: "MD-84920-CA",
    createdAt: new Date().toISOString(),
  },
  {
    id: "user-[#040612]pat-1",
    fullName: "Arthur Pendelton",
    email: "patient@neurofusion.ai",
    role: "patient",
    createdAt: new Date().toISOString(),
  },
  {
    id: "user-adm-1",
    fullName: "System Admin",
    email: "admin@neurofusion.ai",
    role: "admin",
    createdAt: new Date().toISOString(),
  },
];

function getStoredUsers(): User[] {
  try {
    const raw = localStorage.getItem(STORAGE_USERS_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return DEFAULT_USERS;
  }
}

function saveUsers(users: User[]) {
  localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
}

export const authService = {
  getCurrentSession(): AuthState {
    try {
      const raw = localStorage.getItem(STORAGE_SESSION_KEY);
      if (!raw) return { user: null, token: null };
      return JSON.parse(raw);
    } catch {
      return { user: null, token: null };
    }
  },

  async login(email: string, pass: string, role: UserRole): Promise<User> {
    await new Promise((resolve) => setTimeout(resolve, 600)); // Simulate API network latency
    const users = getStoredUsers();
    const user = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.role === role
    );

    if (!user) {
      throw new Error(`No ${role} account found with email "${email}". Please register first.`);
    }

    const session: AuthState = {
      user,
      token: `jwt_token_${user.id}_${Date.now()}`,
    };
    localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(session));
    return user;
  },

  async register(params: {
    fullName: string;
    email: string;
    role: UserRole;
    medicalLicenseId?: string;
  }): Promise<User> {
    await new Promise((resolve) => setTimeout(resolve, 700));
    const users = getStoredUsers();
    const existing = users.find(
      (u) => u.email.toLowerCase() === params.email.toLowerCase()
    );

    if (existing) {
      throw new Error(`An account with email "${params.email}" already exists.`);
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      fullName: params.fullName,
      email: params.email,
      role: params.role,
      medicalLicenseId: params.medicalLicenseId,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    saveUsers(users);

    const session: AuthState = {
      user: newUser,
      token: `jwt_token_${newUser.id}_${Date.now()}`,
    };
    localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(session));
    return newUser;
  },

  async forgotPassword(email: string): Promise<{ otp: string }> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const users = getStoredUsers();
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      throw new Error(`No user found with email "${email}".`);
    }

    // Generate mock 6-digit OTP code (123456 for easy testing)
    const otp = "123456";
    localStorage.setItem(STORAGE_OTP_KEY, JSON.stringify({ email, otp, expiresAt: Date.now() + 600000 }));
    return { otp };
  },

  async verifyOtp(email: string, code: string): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const raw = localStorage.getItem(STORAGE_OTP_KEY);
    if (!raw) throw new Error("No active password reset request found.");
    const data = JSON.parse(raw);
    if (data.email.toLowerCase() !== email.toLowerCase()) {
      throw new Error("Invalid reset session.");
    }
    if (data.otp !== code && code !== "123456") {
      throw new Error("Invalid 6-digit OTP code. Enter 123456 for demo verification.");
    }
    localStorage.removeItem(STORAGE_OTP_KEY);
    return true;
  },

  logout() {
    localStorage.removeItem(STORAGE_SESSION_KEY);
  },
};
