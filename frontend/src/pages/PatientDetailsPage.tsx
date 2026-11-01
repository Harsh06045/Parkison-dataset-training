import React from "react";
import { PatientRecord } from "@/services/patientApi";
import { useAnalysis, UnifiedHistoryItem } from "@/hooks/useAnalysis";
import { PatientDetailsView } from "@/components/patients/PatientDetailsView";

interface PatientDetailsPageProps {
  patient: PatientRecord;
  onBack: () => void;
  onStartAlzheimer: () => void;
  onStartParkinson: () => void;
  onViewResult: (analysis: UnifiedHistoryItem) => void;
}

export function PatientDetailsPage({
  patient,
  onBack,
  onStartAlzheimer,
  onStartParkinson,
  onViewResult,
}: PatientDetailsPageProps) {
  const { history } = useAnalysis();

  return (
    <div className="animate-in fade-in duration-200">
      <PatientDetailsView
        patient={patient}
        history={history}
        onBack={onBack}
        onStartAlzheimer={onStartAlzheimer}
        onStartParkinson={onStartParkinson}
        onViewResult={onViewResult}
      />
    </div>
  );
}
