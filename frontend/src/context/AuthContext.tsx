import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authApi, DoctorUser, Role } from "@/services/authApi";

interface AuthContextValue {
  user: DoctorUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string, role?: Role) => Promise<DoctorUser>;
  logout: () => void;
  updateProfile: (data: Partial<DoctorUser>) => Promise<DoctorUser>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<DoctorUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const current = authApi.getCurrentUser();
    setUser(current);
    setIsLoading(false);
  }, []);

  const login = async (email: string, pass: string, role: Role = "doctor"): Promise<DoctorUser> => {
    const authenticated = await authApi.login(email, pass, role);
    setUser(authenticated);
    return authenticated;
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
  };

  const updateProfile = async (data: Partial<DoctorUser>): Promise<DoctorUser> => {
    const updated = await authApi.updateProfile(data);
    setUser(updated);
    return updated;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
