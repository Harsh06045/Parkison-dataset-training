import React, { useState } from "react";
import {
  Search,
  Plus,
  Filter,
  Brain,
  Activity,
  ChevronRight,
  ArrowUpDown,
  MoreVertical,
  Stethoscope,
  Sparkles,
  FileText,
  User,
} from "lucide-react";
import { PatientRecord, RiskLevel } from "@/services/patientApi";

interface PatientTableProps {
  patients: PatientRecord[];
  onSelectPatient: (patient: PatientRecord) => void;
  onAddNewPatient: () => void;
  onStartAnalysis: (patient: PatientRecord) => void;
}

export function PatientTable({
  patients,
  onSelectPatient,
  onAddNewPatient,
  onStartAnalysis,
}: PatientTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | RiskLevel>("ALL");

  const filteredPatients = patients.filter((p) => {
    const matchQuery =
      p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.primaryDiagnosis?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchQuery) return false;
    if (filterStatus !== "ALL" && p.riskLevel !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6 text-[#0b1c30] select-none">
      {/* Page Header (Responsive Layout) */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-headline font-bold text-2xl 3xl:text-3xl text-[#0b1c30] tracking-tight">
            Patient Directory
          </h2>
          <p className="text-xs 3xl:text-sm text-[#64748b] mt-1">
            Manage and review patient profiles, baseline cognitive/motor scores, and recent analytical scans.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onAddNewPatient}
            className="btn-primary py-2.5 px-4 w-full sm:w-auto"
          >
            <Plus className="size-4" />
            <span>Add New Patient</span>
          </button>
        </div>
      </header>

      {/* Controls Toolbar (Responsive Filter Bar) */}
      <div className="bg-white rounded-2xl p-4 shadow-card border border-[#e2e8f0] flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748b]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Patient ID, Name, or Condition..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#e2e8f0] bg-[#f8f9ff] text-xs text-[#0b1c30] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:bg-white transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <span className="text-[0.68rem] font-bold text-[#64748b] uppercase tracking-wider mr-1 hidden sm:inline">
            Risk:
          </span>
          <button
            type="button"
            onClick={() => setFilterStatus("ALL")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              filterStatus === "ALL"
                ? "bg-[#e0f2fe] text-[#0284c7] font-bold shadow-sm"
                : "bg-white border border-[#e2e8f0] text-[#64748b] hover:bg-[#f1f5f9]"
            }`}
          >
            All ({patients.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("High")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              filterStatus === "High"
                ? "bg-rose-100 text-rose-700 font-bold border border-rose-200"
                : "bg-white border border-[#e2e8f0] text-[#64748b] hover:bg-[#f1f5f9]"
            }`}
          >
            High Risk
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("Moderate")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              filterStatus === "Moderate"
                ? "bg-amber-100 text-amber-700 font-bold border border-amber-200"
                : "bg-white border border-[#e2e8f0] text-[#64748b] hover:bg-[#f1f5f9]"
            }`}
          >
            Monitoring
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("Low")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              filterStatus === "Low"
                ? "bg-emerald-100 text-emerald-700 font-bold border border-emerald-200"
                : "bg-white border border-[#e2e8f0] text-[#64748b] hover:bg-[#f1f5f9]"
            }`}
          >
            Stable
          </button>
        </div>
      </div>

      {/* 1. Mobile Phone Touch Card View (Phones < 640px) */}
      <div className="block sm:hidden space-y-3">
        {filteredPatients.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-[#64748b] border border-[#e2e8f0] text-xs">
            No matching patient records found.
          </div>
        ) : (
          filteredPatients.map((patient) => {
            const isAlz = patient.primaryDiagnosis?.includes("Alzheimer");
            return (
              <div
                key={patient.id}
                onClick={() => onSelectPatient(patient)}
                className="bg-white rounded-2xl p-4 shadow-card border border-[#e2e8f0] space-y-3 active:scale-[0.99] transition-transform"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-[#e0f2fe] text-[#0284c7] font-bold text-xs">
                      {patient.fullName
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")}
                    </div>
                    <div>
                      <h4 className="font-bold text-[#0b1c30] text-sm">{patient.fullName}</h4>
                      <p className="text-[0.68rem] font-mono text-[#0ea5e9] font-semibold">{patient.id}</p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[0.65rem] font-bold ${
                      patient.riskLevel === "High" || patient.riskLevel === "Critical"
                        ? "bg-rose-50 text-rose-700 border border-rose-200"
                        : patient.riskLevel === "Moderate"
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    }`}
                  >
                    {patient.riskLevel} Risk
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs p-2.5 rounded-xl bg-[#f8f9ff]">
                  <div>
                    <span className="text-[0.65rem] text-[#64748b] block">Condition:</span>
                    <span className="font-semibold text-[#0b1c30] flex items-center gap-1">
                      {isAlz ? <Brain className="size-3 text-purple-600" /> : <Activity className="size-3 text-cyan-600" />}
                      {patient.primaryDiagnosis}
                    </span>
                  </div>
                  <div>
                    <span className="text-[0.65rem] text-[#64748b] block">Demographics:</span>
                    <span className="font-semibold text-[#0b1c30]">{patient.age}y • {patient.gender}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onStartAnalysis(patient);
                    }}
                    className="btn-primary flex-1 py-2 text-xs"
                  >
                    <Sparkles className="size-3.5" />
                    <span>Run Scan</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectPatient(patient)}
                    className="btn-secondary py-2 px-3 text-xs"
                  >
                    <span>Dossier</span>
                    <ChevronRight className="size-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 2. Tablet, Laptop, Desktop & TV Table View (Screens >= 640px) */}
      <div className="hidden sm:block bg-white rounded-2xl shadow-card border border-[#e2e8f0] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#f8f9ff] border-b border-[#e2e8f0] text-[0.68rem] uppercase font-bold text-[#64748b]">
                <th className="p-4">Patient ID</th>
                <th className="p-4">Patient Name</th>
                <th className="p-4">Demographics</th>
                <th className="p-4">Primary Condition</th>
                <th className="p-4">Last Analysis</th>
                <th className="p-4">Risk Stratification</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {filteredPatients.map((patient) => {
                const isAlz = patient.primaryDiagnosis?.includes("Alzheimer");
                return (
                  <tr
                    key={patient.id}
                    onClick={() => onSelectPatient(patient)}
                    className="hover:bg-[#f1f5f9]/80 transition-colors cursor-pointer group"
                  >
                    {/* Patient ID */}
                    <td className="p-4 font-mono font-bold text-[#0ea5e9]">
                      {patient.id}
                    </td>

                    {/* Patient Name & Avatar */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#e0f2fe] text-[#0284c7] font-bold text-[0.7rem] border border-[#0ea5e9]/20">
                          {patient.fullName
                            .split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")}
                        </div>
                        <div>
                          <p className="font-bold text-[#0b1c30] group-hover:text-[#0ea5e9] transition-colors">
                            {patient.fullName}
                          </p>
                          <span className="text-[0.65rem] text-[#64748b]">
                            {patient.contactNumber}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Demographics */}
                    <td className="p-4 text-[#475569]">
                      <span className="font-semibold">{patient.age} yrs</span> • {patient.gender}
                      <span className="block text-[0.65rem] text-[#94a3b8]">
                        DOB: {patient.dateOfBirth}
                      </span>
                    </td>

                    {/* Primary Condition */}
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        {isAlz ? (
                          <Brain className="size-3.5 text-purple-600 shrink-0" />
                        ) : (
                          <Activity className="size-3.5 text-cyan-600 shrink-0" />
                        )}
                        <div>
                          <span className="font-semibold text-[#0b1c30]">
                            {patient.primaryDiagnosis || "Evaluating"}
                          </span>
                          <span className="block text-[0.62rem] text-[#64748b]">
                            {patient.stage || "Under Assessment"}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Last Analysis */}
                    <td className="p-4">
                      <span className="font-mono text-[#475569]">{patient.lastAnalysisDate}</span>
                      <span className="block text-[0.65rem] text-[#0ea5e9] font-semibold">
                        {patient.totalAnalyses} Scans Recorded
                      </span>
                    </td>

                    {/* Risk Level Badge */}
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[0.65rem] font-bold ${
                          patient.riskLevel === "High" || patient.riskLevel === "Critical"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : patient.riskLevel === "Moderate"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        {patient.riskLevel} Risk
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <div
                        className="inline-flex items-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => onStartAnalysis(patient)}
                          className="btn-primary py-1 px-3 text-[0.7rem] rounded-lg"
                        >
                          <Sparkles className="size-3" />
                          <span>Scan</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onSelectPatient(patient)}
                          className="btn-secondary py-1 px-2.5 text-[0.7rem] rounded-lg"
                        >
                          <span>Dossier</span>
                          <ChevronRight className="size-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
