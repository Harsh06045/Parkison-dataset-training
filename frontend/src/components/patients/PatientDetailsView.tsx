import React, { useState } from "react";
import {
  ArrowLeft,
  Brain,
  Activity,
  Calendar,
  Phone,
  Mail,
  User,
  Clock,
  ShieldCheck,
  Sparkles,
  FileText,
  Edit3,
  Save,
  CheckCircle,
} from "lucide-react";
import { PatientRecord } from "@/services/patientApi";
import { UnifiedHistoryItem } from "@/hooks/useAnalysis";
import { useToast } from "@/context/ToastContext";

interface PatientDetailsViewProps {
  patient: PatientRecord;
  history: UnifiedHistoryItem[];
  onBack: () => void;
  onStartAlzheimer: () => void;
  onStartParkinson: () => void;
  onViewResult: (analysis: UnifiedHistoryItem) => void;
}

export function PatientDetailsView({
  patient,
  history,
  onBack,
  onStartAlzheimer,
  onStartParkinson,
  onViewResult,
}: PatientDetailsViewProps) {
  const { success } = useToast();
  const [notes, setNotes] = useState(patient.medicalHistory || "");
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  const patientHistory = history.filter(
    (h) => h.patientId === patient.id || h.patientName === patient.fullName
  );

  const handleSaveNotes = () => {
    setIsEditingNotes(false);
    success("Clinical Notes Updated", "Patient file saved successfully.");
  };

  return (
    <div className="space-y-6 text-[#0b1c30] select-none">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e2e8f0] pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex size-10 items-center justify-center rounded-xl border border-[#e2e8f0] bg-white text-[#475569] hover:bg-[#f8f9ff] hover:text-[#0b1c30] transition-colors"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-[#0ea5e9] bg-[#e0f2fe] px-2.5 py-0.5 rounded-full">
                {patient.id}
              </span>
              <span className="text-xs text-[#64748b]">•</span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[0.65rem] font-bold ${
                  patient.riskLevel === "High" || patient.riskLevel === "Critical"
                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                    : patient.riskLevel === "Moderate"
                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                }`}
              >
                {patient.riskLevel} Clinical Risk
              </span>
            </div>
            <h2 className="font-headline font-bold text-2xl text-[#0b1c30] tracking-tight mt-0.5">
              {patient.fullName}
            </h2>
          </div>
        </div>

        {/* Direct Disease Scan Triggers */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onStartAlzheimer}
            className="btn-primary bg-purple-600 hover:bg-purple-700 text-xs py-2 px-4 shadow-sm"
          >
            <Brain className="size-3.5" />
            <span>Analyze MRI</span>
          </button>

          <button
            type="button"
            onClick={onStartParkinson}
            className="btn-primary bg-cyan-600 hover:bg-cyan-700 text-xs py-2 px-4 shadow-sm"
          >
            <Activity className="size-3.5" />
            <span>Analyze Voice</span>
          </button>
        </div>
      </div>

      {/* Patient Profile & Baseline Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Demographics & Clinical Baseline */}
        <div className="lg:col-span-4 space-y-6">
          {/* Demographics Card (Stitch Design) */}
          <div className="bg-white rounded-2xl p-6 shadow-card border border-[#e2e8f0] space-y-4">
            <h3 className="font-headline text-xs font-bold text-[#0b1c30] uppercase tracking-wider border-b border-[#e2e8f0] pb-3">
              Patient Demographics
            </h3>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-[#64748b]">Age / Sex</p>
                <p className="font-bold text-[#0b1c30] mt-0.5">{patient.age} yrs / {patient.gender}</p>
              </div>

              <div>
                <p className="text-[#64748b]">Date of Birth</p>
                <p className="font-mono font-semibold text-[#0b1c30] mt-0.5">{patient.dateOfBirth}</p>
              </div>

              <div>
                <p className="text-[#64748b]">Phone</p>
                <p className="font-semibold text-[#0b1c30] mt-0.5">{patient.contactNumber}</p>
              </div>

              <div>
                <p className="text-[#64748b]">Attending MD</p>
                <p className="font-semibold text-[#0b1c30] mt-0.5 truncate">{patient.attendingPhysician || "Dr. S. Jenkins"}</p>
              </div>
            </div>
          </div>

          {/* Baseline Neurological Scores */}
          <div className="bg-white rounded-2xl p-6 shadow-card border border-[#e2e8f0] space-y-4">
            <h3 className="font-headline text-xs font-bold text-[#0b1c30] uppercase tracking-wider border-b border-[#e2e8f0] pb-3">
              Clinical Biomarkers &amp; Baseline
            </h3>

            <div className="space-y-3 text-xs">
              {/* MMSE */}
              <div className="p-3.5 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0] flex items-center justify-between">
                <div>
                  <p className="font-bold text-[#0b1c30]">MMSE Cognitive Score</p>
                  <p className="text-[0.68rem] text-[#64748b]">Mini-Mental State Exam (Max 30)</p>
                </div>
                <span className="font-mono text-base font-bold text-purple-600">
                  {patient.mmseScore ?? 23}/30
                </span>
              </div>

              {/* UPDRS */}
              <div className="p-3.5 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0] flex items-center justify-between">
                <div>
                  <p className="font-bold text-[#0b1c30]">MDS-UPDRS Motor Score</p>
                  <p className="text-[0.68rem] text-[#64748b]">Part III Motor Subscale</p>
                </div>
                <span className="font-mono text-base font-bold text-cyan-600">
                  {patient.updrsScore ?? 18} pts
                </span>
              </div>

              {/* Blood Pressure */}
              <div className="p-3.5 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0] flex items-center justify-between">
                <div>
                  <p className="font-bold text-[#0b1c30]">Resting Blood Pressure</p>
                  <p className="text-[0.68rem] text-[#64748b]">Systolic / Diastolic</p>
                </div>
                <span className="font-mono text-sm font-bold text-[#0b1c30]">
                  {patient.bloodPressure || "128/82 mmHg"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Longitudinal History & Doctor Notes */}
        <div className="lg:col-span-8 space-y-6">
          {/* Clinical Notes Editor */}
          <div className="bg-white rounded-2xl p-6 shadow-card border border-[#e2e8f0] space-y-4">
            <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
              <h3 className="font-headline text-xs font-bold text-[#0b1c30] uppercase tracking-wider flex items-center gap-2">
                <FileText className="size-4 text-[#0ea5e9]" />
                <span>Physician Clinical Notes &amp; Observations</span>
              </h3>
              {isEditingNotes ? (
                <button
                  type="button"
                  onClick={handleSaveNotes}
                  className="btn-primary py-1 px-3 text-xs"
                >
                  <Save className="size-3" />
                  <span>Save Notes</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditingNotes(true)}
                  className="btn-secondary py-1 px-3 text-xs"
                >
                  <Edit3 className="size-3" />
                  <span>Edit</span>
                </button>
              )}
            </div>

            {isEditingNotes ? (
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8f9ff] p-3 text-xs text-[#0b1c30] focus:ring-2 focus:ring-[#0ea5e9] focus:outline-none"
                placeholder="Enter patient symptoms, neurological observations, or medication schedule..."
              />
            ) : (
              <p className="text-xs text-[#475569] leading-relaxed whitespace-pre-wrap bg-[#f8f9ff] p-4 rounded-xl border border-[#e2e8f0]">
                {notes || "No additional physician notes recorded for this patient."}
              </p>
            )}
          </div>

          {/* Past Analyses Timeline */}
          <div className="bg-white rounded-2xl p-6 shadow-card border border-[#e2e8f0] space-y-4">
            <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
              <h3 className="font-headline text-xs font-bold text-[#0b1c30] uppercase tracking-wider flex items-center gap-2">
                <Clock className="size-4 text-[#0ea5e9]" />
                <span>Longitudinal Scan &amp; Analysis Timeline ({patientHistory.length})</span>
              </h3>
            </div>

            {patientHistory.length === 0 ? (
              <div className="p-8 text-center text-[#64748b] text-xs space-y-3">
                <Brain className="size-8 mx-auto text-[#94a3b8]" />
                <p className="font-semibold text-[#0b1c30]">No Prior Analyses on Record</p>
                <p>Launch an Alzheimer&rsquo;s MRI scan or Parkinson&rsquo;s voice analysis above.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {patientHistory.map((item) => {
                  const isAlz = item.disease === "Alzheimer's Disease";
                  return (
                    <div
                      key={item.id}
                      onClick={() => onViewResult(item)}
                      className="p-4 rounded-xl border border-[#e2e8f0] bg-[#f8f9ff] hover:bg-[#e0f2fe]/40 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex size-10 items-center justify-center rounded-xl text-white font-bold text-xs ${
                            isAlz ? "bg-purple-600" : "bg-cyan-600"
                          }`}
                        >
                          {isAlz ? <Brain className="size-5" /> : <Activity className="size-5" />}
                        </div>
                        <div>
                          <p className="font-bold text-xs text-[#0b1c30] group-hover:text-[#0ea5e9] transition-colors">
                            {item.prediction}
                          </p>
                          <p className="text-[0.68rem] text-[#64748b]">
                            {item.disease} • <span className="font-mono">{item.date}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="font-mono text-xs font-bold text-[#0ea5e9]">
                            {item.confidence.toFixed(1)}%
                          </span>
                          <span className="block text-[0.62rem] text-[#64748b]">Confidence</span>
                        </div>

                        <span className="btn-secondary py-1 px-2.5 text-[0.68rem] rounded-lg">
                          View Dossier
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
