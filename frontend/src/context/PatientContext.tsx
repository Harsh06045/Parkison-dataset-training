import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { patientApi, PatientRecord } from "@/services/patientApi";
import { useToast } from "./ToastContext";

interface PatientContextValue {
  patients: PatientRecord[];
  selectedPatient: PatientRecord | null;
  isLoading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectPatient: (patient: PatientRecord | null) => void;
  selectPatientById: (id: string) => Promise<PatientRecord | null>;
  refreshPatients: () => Promise<void>;
  addPatient: (data: Omit<PatientRecord, "id" | "lastAnalysisDate" | "totalAnalyses">) => Promise<PatientRecord>;
  updatePatient: (id: string, updates: Partial<PatientRecord>) => Promise<PatientRecord>;
  deletePatient: (id: string) => Promise<void>;
}

const PatientContext = createContext<PatientContextValue | undefined>(undefined);

export const PatientProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { success, error } = useToast();

  const refreshPatients = useCallback(async () => {
    try {
      setIsLoading(true);
      const list = await patientApi.getPatients(searchQuery);
      setPatients(list);
      // Auto-sync selectedPatient if still present
      if (selectedPatient) {
        const found = list.find((p) => p.id === selectedPatient.id);
        if (found) setSelectedPatient(found);
      } else if (list.length > 0) {
        // Default to first patient if none selected
        setSelectedPatient(list[0]);
      }
    } catch (err: any) {
      error("Failed to load patient registry", err.message);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedPatient, error]);

  useEffect(() => {
    refreshPatients();
  }, [searchQuery]);

  const selectPatient = (patient: PatientRecord | null) => {
    setSelectedPatient(patient);
  };

  const selectPatientById = async (id: string): Promise<PatientRecord | null> => {
    const existing = patients.find((p) => p.id === id);
    if (existing) {
      setSelectedPatient(existing);
      return existing;
    }
    const fetched = await patientApi.getPatientById(id);
    if (fetched) {
      setSelectedPatient(fetched);
      return fetched;
    }
    return null;
  };

  const handleAddPatient = async (data: Omit<PatientRecord, "id" | "lastAnalysisDate" | "totalAnalyses">): Promise<PatientRecord> => {
    try {
      const created = await patientApi.addPatient(data);
      success("Patient Registered", `${created.fullName} (${created.id}) added to registry.`);
      await refreshPatients();
      setSelectedPatient(created);
      return created;
    } catch (err: any) {
      error("Registration Failed", err.message);
      throw err;
    }
  };

  const handleUpdatePatient = async (id: string, updates: Partial<PatientRecord>): Promise<PatientRecord> => {
    try {
      const updated = await patientApi.updatePatient(id, updates);
      success("Patient Updated", `Records for ${updated.fullName} have been saved.`);
      await refreshPatients();
      return updated;
    } catch (err: any) {
      error("Update Failed", err.message);
      throw err;
    }
  };

  const handleDeletePatient = async (id: string) => {
    try {
      await patientApi.deletePatient(id);
      success("Patient Deleted", `Patient #${id} removed from system.`);
      if (selectedPatient?.id === id) {
        setSelectedPatient(null);
      }
      await refreshPatients();
    } catch (err: any) {
      error("Delete Failed", err.message);
      throw err;
    }
  };

  return (
    <PatientContext.Provider
      value={{
        patients,
        selectedPatient,
        isLoading,
        searchQuery,
        setSearchQuery,
        selectPatient,
        selectPatientById,
        refreshPatients,
        addPatient: handleAddPatient,
        updatePatient: handleUpdatePatient,
        deletePatient: handleDeletePatient,
      }}
    >
      {children}
    </PatientContext.Provider>
  );
};

export function usePatient() {
  const context = useContext(PatientContext);
  if (!context) {
    throw new Error("usePatient must be used within a PatientProvider");
  }
  return context;
}
