import React from "react";
import { usePatient } from "@/context/PatientContext";
import { PatientRecord } from "@/services/patientApi";
import { DiseaseSelector } from "@/components/disease-selection/DiseaseSelector";

interface DiseaseSelectionPageProps {
  onSelectAlzheimer: () => void;
  onSelectParkinson: () => void;
}

export function DiseaseSelectionPage({
  onSelectAlzheimer,
  onSelectParkinson,
}: DiseaseSelectionPageProps) {
  const { selectedPatient, selectPatient } = usePatient();

  return (
    <div className="animate-in fade-in duration-200">
      <DiseaseSelector
        selectedPatient={selectedPatient}
        onSelectPatient={selectPatient}
        onSelectAlzheimer={onSelectAlzheimer}
        onSelectParkinson={onSelectParkinson}
      />
    </div>
  );
}
