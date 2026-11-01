import React from "react";
import { usePatient } from "@/context/PatientContext";
import { PatientRecord } from "@/services/patientApi";
import { PatientTable } from "@/components/patients/PatientTable";

interface PatientsPageProps {
  onSelectPatient: (patient: PatientRecord) => void;
  onOpenAddPatient: () => void;
  onStartAnalysisForPatient: (patient: PatientRecord) => void;
}

export function PatientsPage({
  onSelectPatient,
  onOpenAddPatient,
  onStartAnalysisForPatient,
}: PatientsPageProps) {
  const { patients } = usePatient();

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PatientTable
        patients={patients}
        onSelectPatient={onSelectPatient}
        onAddNewPatient={onOpenAddPatient}
        onStartAnalysis={onStartAnalysisForPatient}
      />
    </div>
  );
}
