import React, { useState, useEffect } from "react";
import {
  FileText,
  Search,
  Download,
  Printer,
  Eye,
  Brain,
  Activity,
  Calendar,
  CheckCircle,
  FileCheck2,
  Share2,
} from "lucide-react";
import { reportApi, UnifiedDiagnosticReport } from "@/services/reportApi";
import { ReportPreview } from "@/components/reports/ReportPreview";
import { Modal } from "@/components/common/Modal";
import { LoadingState } from "@/components/common/LoadingState";

interface ReportsPageProps {
  initialReportId?: string;
}

export function ReportsPage({ initialReportId }: ReportsPageProps) {
  const [reports, setReports] = useState<UnifiedDiagnosticReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<UnifiedDiagnosticReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [diseaseFilter, setDiseaseFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const list = await reportApi.getReports(search, diseaseFilter);
      setReports(list);

      if (initialReportId) {
        const found = list.find((r) => r.id === initialReportId);
        if (found) {
          setSelectedReport(found);
          setIsModalOpen(true);
        }
      }
    } catch (e) {
      console.error("Error fetching reports", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [search, diseaseFilter]);

  const handleOpenReport = (report: UnifiedDiagnosticReport) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 text-[#0b1c30] select-none">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#e2e8f0] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 shadow-sm">
            <FileCheck2 className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-[0.65rem] font-bold">
                Clinical Diagnostic Documentation
              </span>
              <span className="text-[#64748b]">•</span>
              <span className="text-xs font-mono text-[#64748b]">Route: /reports</span>
            </div>
            <h2 className="font-headline text-xl font-bold text-[#0b1c30] tracking-tight mt-0.5">
              Finalized Clinical AI Diagnostic Reports
            </h2>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-5 shadow-card border border-[#e2e8f0] space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#64748b]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reports by patient name, ID, or report #..."
              className="h-10 w-full rounded-xl border border-[#e2e8f0] bg-[#f8f9ff] pl-9 pr-3 text-xs text-[#0b1c30] placeholder:text-[#94a3b8] focus:border-[#0ea5e9] focus:outline-none"
            />
          </div>

          <div>
            <select
              value={diseaseFilter}
              onChange={(e) => setDiseaseFilter(e.target.value)}
              className="h-10 w-full rounded-xl border border-[#e2e8f0] bg-[#f8f9ff] px-3 text-xs text-[#0b1c30] focus:border-[#0ea5e9] focus:outline-none"
            >
              <option value="all">All Diseases (Alzheimer&rsquo;s &amp; Parkinson&rsquo;s)</option>
              <option value="alzheimer">Alzheimer&rsquo;s Disease (Brain MRI)</option>
              <option value="parkinson">Parkinson&rsquo;s Disease (Voice / Quantum-AI)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      {isLoading ? (
        <LoadingState message="Loading Diagnostic Reports..." />
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-[#64748b] border border-[#e2e8f0] space-y-3">
          <FileText className="size-10 mx-auto text-[#94a3b8]" />
          <p className="text-sm font-bold text-[#0b1c30]">No Diagnostic Reports Found</p>
          <p className="text-xs text-[#64748b] max-w-sm mx-auto">
            Generate reports from completed Alzheimer&rsquo;s or Parkinson&rsquo;s analyses to populate this registry.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-card border border-[#e2e8f0] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="border-b border-[#e2e8f0] bg-[#f8f9ff] text-[0.68rem] uppercase font-bold text-[#64748b]">
                <tr>
                  <th className="p-4">Report ID</th>
                  <th className="p-4">Patient Name</th>
                  <th className="p-4">Disease Evaluated</th>
                  <th className="p-4">Primary Diagnosis</th>
                  <th className="p-4">AI Confidence</th>
                  <th className="p-4">Created Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]">
                {reports.map((rep) => {
                  const isAlz = rep.disease === "Alzheimer's Disease";
                  return (
                    <tr
                      key={rep.id}
                      onClick={() => handleOpenReport(rep)}
                      className="hover:bg-[#f1f5f9]/80 transition-colors cursor-pointer group"
                    >
                      <td className="p-4 font-mono font-bold text-[#0ea5e9]">{rep.id}</td>
                      <td className="p-4">
                        <p className="font-bold text-[#0b1c30] group-hover:text-[#0ea5e9] transition-colors">
                          {rep.patientName}
                        </p>
                        <span className="font-mono text-[0.62rem] text-[#64748b]">{rep.patientId}</span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[0.68rem] font-bold border ${
                            isAlz
                              ? "bg-purple-50 border-purple-200 text-purple-700"
                              : "bg-cyan-50 border-cyan-200 text-cyan-700"
                          }`}
                        >
                          {isAlz ? <Brain className="size-3" /> : <Activity className="size-3" />}
                          <span>{rep.disease}</span>
                        </span>
                      </td>
                      <td className="p-4 font-semibold text-[#0b1c30]">
                        <span className="truncate block max-w-[200px]">{rep.primaryDiagnosis}</span>
                      </td>
                      <td className="p-4 font-mono font-bold text-[#0ea5e9]">
                        {rep.confidenceScore.toFixed(1)}%
                      </td>
                      <td className="p-4 font-mono text-[0.72rem] text-[#64748b]">{rep.createdAt}</td>
                      <td className="p-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenReport(rep);
                          }}
                          className="btn-secondary py-1 px-2.5 text-[0.68rem] rounded-lg"
                        >
                          <Eye className="size-3" />
                          <span>View Report</span>
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

      {/* Report Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        maxWidth="4xl"
      >
        {selectedReport && (
          <ReportPreview
            report={selectedReport}
            onClose={() => setIsModalOpen(false)}
          />
        )}
      </Modal>
    </div>
  );
}
