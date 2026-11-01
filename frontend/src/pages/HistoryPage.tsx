import React, { useState } from "react";
import {
  Search,
  Brain,
  Activity,
  Calendar,
  Filter,
  Eye,
  FileText,
  Clock,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { useAnalysis, UnifiedHistoryItem } from "@/hooks/useAnalysis";
import { LoadingState } from "@/components/common/LoadingState";

interface HistoryPageProps {
  onViewAnalysis: (analysis: UnifiedHistoryItem) => void;
}

export function HistoryPage({ onViewAnalysis }: HistoryPageProps) {
  const { history, isLoading, refreshHistory } = useAnalysis();
  const [search, setSearch] = useState("");
  const [diseaseFilter, setDiseaseFilter] = useState<"all" | "Alzheimer's Disease" | "Parkinson's Disease">("all");
  const [severityFilter, setSeverityFilter] = useState<"all" | "healthy" | "mci" | "dementia" | "parkinsons">("all");

  const filteredHistory = history.filter((item) => {
    // Disease filter
    if (diseaseFilter !== "all" && item.disease !== diseaseFilter) {
      return false;
    }

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const match =
        item.patientName.toLowerCase().includes(q) ||
        item.patientId.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        item.prediction.toLowerCase().includes(q);
      if (!match) return false;
    }

    // Severity filter
    if (severityFilter !== "all") {
      const pred = item.prediction.toLowerCase();
      if (severityFilter === "healthy" && !pred.includes("normal") && !pred.includes("control")) return false;
      if (severityFilter === "mci" && !pred.includes("mci") && !pred.includes("mild cognitive")) return false;
      if (severityFilter === "dementia" && !pred.includes("dementia") && !pred.includes("alzheimer")) return false;
      if (severityFilter === "parkinsons" && !pred.includes("parkinson")) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200 text-[#0b1c30] select-none">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#e2e8f0] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 shadow-sm">
            <Clock className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 text-[0.65rem] font-bold">
                Longitudinal Screening Registry
              </span>
              <span className="text-[#64748b]">•</span>
              <span className="text-xs font-mono text-[#64748b]">Route: /history</span>
            </div>
            <h2 className="font-headline text-xl font-bold text-[#0b1c30] tracking-tight mt-0.5">
              Unified Neurological Analysis History
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={refreshHistory}
          className="btn-secondary py-2 px-3.5"
        >
          <RefreshCw className="size-3.5" />
          <span>Refresh Records</span>
        </button>
      </div>

      {/* Filter & Search Bar Card */}
      <div className="bg-white rounded-2xl p-5 shadow-card border border-[#e2e8f0] space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search Box */}
          <div className="relative sm:col-span-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#64748b]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search patient, ID, or prediction..."
              className="h-10 w-full rounded-xl border border-[#e2e8f0] bg-[#f8f9ff] pl-9 pr-3 text-xs text-[#0b1c30] placeholder:text-[#94a3b8] focus:border-[#0ea5e9] focus:outline-none"
            />
          </div>

          {/* Disease Module Filter */}
          <div>
            <select
              value={diseaseFilter}
              onChange={(e) => setDiseaseFilter(e.target.value as any)}
              className="h-10 w-full rounded-xl border border-[#e2e8f0] bg-[#f8f9ff] px-3 text-xs text-[#0b1c30] focus:border-[#0ea5e9] focus:outline-none"
            >
              <option value="all">All Disease Modules (Alzheimer&rsquo;s &amp; Parkinson&rsquo;s)</option>
              <option value="Alzheimer's Disease">Alzheimer&rsquo;s Disease (Brain MRI)</option>
              <option value="Parkinson's Disease">Parkinson&rsquo;s Disease (Vocal / Quantum-AI)</option>
            </select>
          </div>

          {/* Severity / Finding Filter */}
          <div>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as any)}
              className="h-10 w-full rounded-xl border border-[#e2e8f0] bg-[#f8f9ff] px-3 text-xs text-[#0b1c30] focus:border-[#0ea5e9] focus:outline-none"
            >
              <option value="all">All Diagnostic Findings</option>
              <option value="healthy">Healthy Controls / Normal</option>
              <option value="mci">Mild Cognitive Impairment (MCI)</option>
              <option value="dementia">Alzheimer&rsquo;s Dementia Stages</option>
              <option value="parkinsons">Parkinson&rsquo;s Disease Stages</option>
            </select>
          </div>
        </div>

        {/* Filter Badges Summary */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#e2e8f0] text-xs text-[#64748b]">
          <span>
            Showing <strong className="text-[#0b1c30]">{filteredHistory.length}</strong> of{" "}
            <strong className="text-[#0b1c30]">{history.length}</strong> analysis records
          </span>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-purple-700 font-semibold">
              <Brain className="size-3" /> Alzheimer&rsquo;s Scans:{" "}
              {history.filter((h) => h.disease === "Alzheimer's Disease").length}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-cyan-700 font-semibold">
              <Activity className="size-3" /> Parkinson&rsquo;s Analyses:{" "}
              {history.filter((h) => h.disease === "Parkinson's Disease").length}
            </span>
          </div>
        </div>
      </div>

      {/* History Table */}
      {isLoading ? (
        <LoadingState message="Loading Diagnostic Registry..." />
      ) : filteredHistory.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-[#64748b] border border-[#e2e8f0] space-y-3">
          <Clock className="size-10 mx-auto text-[#94a3b8]" />
          <p className="text-sm font-bold text-[#0b1c30]">No Matching Diagnostic Records Found</p>
          <p className="text-xs text-[#64748b] max-w-sm mx-auto">
            Try adjusting your search criteria or disease filters above.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-card border border-[#e2e8f0] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="border-b border-[#e2e8f0] bg-[#f8f9ff] text-[0.68rem] uppercase font-bold text-[#64748b]">
                <tr>
                  <th className="p-4">Analysis Date</th>
                  <th className="p-4">Patient Name</th>
                  <th className="p-4">Disease Module</th>
                  <th className="p-4">Model Prediction</th>
                  <th className="p-4">Confidence</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]">
                {filteredHistory.map((item) => {
                  const isAlz = item.disease === "Alzheimer's Disease";
                  return (
                    <tr
                      key={item.id}
                      onClick={() => onViewAnalysis(item)}
                      className="hover:bg-[#f1f5f9]/80 transition-colors cursor-pointer group"
                    >
                      {/* Date */}
                      <td className="p-4 font-mono text-[0.72rem] text-[#64748b]">
                        {item.date}
                        <span className="block text-[0.62rem] text-[#94a3b8]">{item.id}</span>
                      </td>

                      {/* Patient */}
                      <td className="p-4">
                        <p className="font-bold text-[#0b1c30] group-hover:text-[#0ea5e9] transition-colors">
                          {item.patientName}
                        </p>
                        <span className="font-mono text-[0.62rem] text-[#64748b]">{item.patientId}</span>
                      </td>

                      {/* Disease */}
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[0.68rem] font-bold border ${
                            isAlz
                              ? "bg-purple-50 border-purple-200 text-purple-700"
                              : "bg-cyan-50 border-cyan-200 text-cyan-700"
                          }`}
                        >
                          {isAlz ? <Brain className="size-3" /> : <Activity className="size-3" />}
                          <span>{item.disease}</span>
                        </span>
                      </td>

                      {/* Prediction */}
                      <td className="p-4 font-semibold text-[#0b1c30]">
                        <span className="truncate block max-w-[220px]">{item.prediction}</span>
                      </td>

                      {/* Confidence */}
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#0ea5e9]">{item.confidence.toFixed(1)}%</span>
                          <div className="w-14 bg-[#e2e8f0] rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${isAlz ? "bg-purple-600" : "bg-cyan-600"}`}
                              style={{ width: `${item.confidence}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[0.65rem] font-bold text-emerald-700">
                          {item.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewAnalysis(item);
                          }}
                          className="btn-secondary py-1 px-2.5 text-[0.68rem] rounded-lg"
                        >
                          <Eye className="size-3" />
                          <span>View Dossier</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
