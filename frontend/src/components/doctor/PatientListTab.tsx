import React, { useState } from "react";
import { Search, Plus, UploadCloud, ChevronRight, UserCheck, ShieldAlert, Filter, Calendar } from "lucide-react";
import { Patient, RiskLevel, DiseaseCategory } from "@/lib/doctorService";

interface PatientListTabProps {
  patients: Patient[];
  onSelectPatient: (patient: Patient) => void;
  onOpenAddPatient: () => void;
  onOpenUploadScan: (patient: Patient) => void;
}

export function PatientListTab({
  patients,
  onSelectPatient,
  onOpenAddPatient,
  onOpenUploadScan,
}: PatientListTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<string>("All");
  const [diagnosisFilter, setDiagnosisFilter] = useState<string>("All");

  const filteredPatients = patients.filter((p) => {
    const matchesSearch =
      p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRisk = riskFilter === "All" || p.riskLevel === riskFilter;
    const matchesDiagnosis = diagnosisFilter === "All" || p.primaryDiagnosis === diagnosisFilter;

    return matchesSearch && matchesRisk && matchesDiagnosis;
  });

  const getRiskBadge = (risk: RiskLevel) => {
    switch (risk) {
      case "Critical":
        return "bg-red-500/20 text-red-300 border-red-500/40";
      case "High":
        return "bg-purple-500/20 text-purple-300 border-purple-500/40";
      case "Moderate":
        return "bg-amber-500/20 text-amber-300 border-amber-500/40";
      case "Low":
      default:
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
    }
  };

  return (
    <div className="space-y-6 text-white select-none">
      {/* Search & Actions Bar */}
      <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6 backdrop-blur-xl shadow-lg flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search patient registry by name, ID (e.g. PAT-1082), or email..."
            className="h-11 w-full rounded-2xl border border-slate-800 bg-slate-900/90 pl-10 pr-4 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <Filter className="size-3.5 text-slate-400" />
            <span>Risk:</span>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
            >
              <option value="All" className="bg-slate-900">All</option>
              <option value="Critical" className="bg-slate-900">Critical</option>
              <option value="High" className="bg-slate-900">High</option>
              <option value="Moderate" className="bg-slate-900">Moderate</option>
              <option value="Low" className="bg-slate-900">Low</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <span>Diagnosis:</span>
            <select
              value={diagnosisFilter}
              onChange={(e) => setDiagnosisFilter(e.target.value)}
              className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
            >
              <option value="All" className="bg-slate-900">All</option>
              <option value="Alzheimer's Disease" className="bg-slate-900">Alzheimer's</option>
              <option value="Parkinson's Disease" className="bg-slate-900">Parkinson's</option>
              <option value="MCI" className="bg-slate-900">MCI</option>
              <option value="Control / Healthy" className="bg-slate-900">Control</option>
            </select>
          </div>

          <button
            onClick={onOpenAddPatient}
            className="h-11 rounded-2xl bg-blue-600 px-5 text-xs font-bold text-white shadow-lg hover:bg-blue-500 transition-all flex items-center gap-2"
          >
            <Plus className="size-4" />
            <span>Register New Patient</span>
          </button>
        </div>
      </div>

      {/* Patient Grid / Directory Table */}
      <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6 backdrop-blur-xl shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Patient Registry ({filteredPatients.length})</h3>
            <p className="text-xs text-slate-400">Clinical cohort records, risk status, and scan histories</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="border-b border-slate-800 bg-slate-900/60 text-[0.68rem] uppercase text-slate-400">
              <tr>
                <th className="p-3.5">Patient Info</th>
                <th className="p-3.5">Primary Diagnosis</th>
                <th className="p-3.5">Clinical Stage</th>
                <th className="p-3.5">Risk Level</th>
                <th className="p-3.5">Last Scan Date</th>
                <th className="p-3.5 text-center">Total Scans</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No patient records found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredPatients.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-900/50 transition-colors cursor-pointer group"
                    onClick={() => onSelectPatient(p)}
                  >
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-300 group-hover:border-blue-500/50 group-hover:text-blue-400 transition-colors">
                          <UserCheck className="size-4" />
                        </div>
                        <div>
                          <p className="font-bold text-white group-hover:text-blue-300 transition-colors">
                            {p.fullName} <span className="text-[0.68rem] font-normal text-slate-400">({p.age}y, {p.gender})</span>
                          </p>
                          <p className="text-[0.68rem] text-slate-400 font-mono">{p.id} • {p.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span className="font-semibold text-slate-200">{p.primaryDiagnosis}</span>
                    </td>
                    <td className="p-3.5">
                      <span className="text-slate-300 text-[0.72rem]">{p.stage}</span>
                    </td>
                    <td className="p-3.5">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-[0.65rem] font-bold border ${getRiskBadge(p.riskLevel)}`}>
                        {p.riskLevel} Risk
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="size-3.5 text-slate-500" />
                        <span>{p.lastScanDate}</span>
                      </div>
                    </td>
                    <td className="p-3.5 text-center font-bold text-white font-mono">{p.totalScans}</td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onOpenUploadScan(p)}
                          className="rounded-lg bg-purple-600/20 border border-purple-500/40 p-2 text-purple-300 hover:bg-purple-600 hover:text-white transition-all"
                          title="Upload Scan"
                        >
                          <UploadCloud className="size-3.5" />
                        </button>
                        <button
                          onClick={() => onSelectPatient(p)}
                          className="flex items-center gap-1 rounded-lg bg-blue-600/20 border border-blue-500/40 px-3 py-1.5 text-[0.68rem] font-semibold text-blue-300 hover:bg-blue-600 hover:text-white transition-all"
                        >
                          <span>Details</span>
                          <ChevronRight className="size-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
