import React from "react";
import { Brain, Activity, ChevronRight, Clock, ArrowRight, Eye, Sparkles } from "lucide-react";
import { UnifiedHistoryItem } from "@/hooks/useAnalysis";

interface RecentAnalysesTableProps {
  analyses: UnifiedHistoryItem[];
  onViewResult: (analysis: UnifiedHistoryItem) => void;
  onViewAllHistory: () => void;
}

export function RecentAnalysesTable({
  analyses,
  onViewResult,
  onViewAllHistory,
}: RecentAnalysesTableProps) {
  const recentItems = analyses.slice(0, 6);

  return (
    <div className="bg-white rounded-2xl shadow-card border border-[#e2e8f0] p-6 space-y-4 text-[#0b1c30]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
        <div className="flex items-center gap-2">
          <Clock className="size-4 text-[#0ea5e9]" />
          <h3 className="font-headline text-xs font-bold text-[#0b1c30] uppercase tracking-wider">
            Recent Multi-Modal AI Analyses
          </h3>
        </div>
        <button
          type="button"
          onClick={onViewAllHistory}
          className="text-xs font-bold text-[#0ea5e9] hover:text-[#0284c7] flex items-center gap-1 transition-colors"
        >
          <span>View All History ({analyses.length})</span>
          <ArrowRight className="size-3.5" />
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#f8f9ff] text-[0.68rem] uppercase font-bold text-[#64748b] border-b border-[#e2e8f0]">
              <th className="p-3">Analysis Date</th>
              <th className="p-3">Patient Name</th>
              <th className="p-3">Disease Module</th>
              <th className="p-3">AI Prediction</th>
              <th className="p-3">Confidence</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e2e8f0]">
            {recentItems.map((item) => {
              const isAlz = item.disease === "Alzheimer's Disease";
              return (
                <tr
                  key={item.id}
                  onClick={() => onViewResult(item)}
                  className="hover:bg-[#f1f5f9]/80 transition-colors cursor-pointer group"
                >
                  <td className="p-3 font-mono text-[0.72rem] text-[#64748b]">
                    {item.date}
                    <span className="block text-[0.62rem] text-[#94a3b8]">{item.id}</span>
                  </td>
                  <td className="p-3">
                    <p className="font-bold text-[#0b1c30] group-hover:text-[#0ea5e9] transition-colors">
                      {item.patientName}
                    </p>
                    <span className="font-mono text-[0.62rem] text-[#64748b]">{item.patientId}</span>
                  </td>
                  <td className="p-3">
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
                  <td className="p-3 font-semibold text-[#0b1c30]">
                    <span className="truncate block max-w-[200px]">{item.prediction}</span>
                  </td>
                  <td className="p-3">
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
                  <td className="p-3">
                    <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[0.65rem] font-bold text-emerald-700">
                      {item.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewResult(item);
                      }}
                      className="btn-secondary py-1 px-2.5 text-[0.68rem] rounded-lg"
                    >
                      <Eye className="size-3" />
                      <span>Dossier</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
