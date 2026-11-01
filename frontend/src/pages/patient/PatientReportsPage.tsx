import React from "react";
import { FileText, Download, CheckCircle2, ShieldCheck, ArrowLeft, Calendar, User } from "lucide-react";
import { useToast } from "@/context/ToastContext";

interface PatientReportsPageProps {
  onNavigate: (path: string) => void;
}

export function PatientReportsPage({ onNavigate }: PatientReportsPageProps) {
  const { success, info } = useToast();

  const handleDownload = (reportNum: string) => {
    info("Preparing Report", `Downloading ${reportNum}...`);
    setTimeout(() => {
      success("Report Downloaded", "Official PDF signed by Dr. Sarah Jenkins saved to your device.");
    }, 1000);
  };

  const reports = [
    {
      id: "REP-2026-0822",
      date: "Aug 22, 2026",
      title: "Comprehensive Neurological 3D MRI Diagnostic Dossier",
      doctor: "Dr. Sarah Jenkins, MD, PhD (MD-98472-NEURO)",
      clinic: "Metropolitan Neurological Institute & Brain Research Center",
      pages: "3 Pages",
      size: "2.4 MB (PDF/A)",
      status: "Final & Signed",
    },
    {
      id: "REP-2026-0818",
      date: "Aug 18, 2026",
      title: "Longitudinal Acoustic Voice Phonation Perturbation Summary",
      doctor: "Dr. Sarah Jenkins, MD, PhD (MD-98472-NEURO)",
      clinic: "Metropolitan Neurological Institute",
      pages: "2 Pages",
      size: "1.1 MB (PDF/A)",
      status: "Final & Signed",
    },
  ];

  return (
    <div className="space-y-6 text-[#0b1c30] select-none animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e2e8f0] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200 px-2.5 py-0.5 text-[0.65rem] font-bold">
              Patient Medical Records
            </span>
            <span className="text-[#64748b]">•</span>
            <span className="text-xs font-mono text-[#64748b]">Eleanor Vance (MRN-489201)</span>
          </div>
          <h2 className="font-headline text-2xl font-extrabold text-[#0b1c30] tracking-tight mt-1">
            My Signed Diagnostic Reports
          </h2>
        </div>

        <button
          type="button"
          onClick={() => onNavigate("/patient/dashboard")}
          className="btn-secondary py-2 px-3.5 text-xs font-semibold self-start sm:self-auto flex items-center gap-1.5"
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to My Health</span>
        </button>
      </div>

      <div className="space-y-4">
        {reports.map((r) => (
          <div
            key={r.id}
            className="bg-white rounded-2xl p-6 shadow-card border border-[#e2e8f0] flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                <FileText className="size-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-[#0b1c30] text-sm">{r.title}</h3>
                  <span className="rounded-full bg-emerald-100 text-emerald-800 text-[0.65rem] font-bold px-2 py-0.5">
                    {r.status}
                  </span>
                </div>
                <p className="text-xs text-[#64748b]">
                  Signed by <strong>{r.doctor}</strong> • {r.clinic}
                </p>
                <div className="flex items-center gap-3 text-[0.68rem] text-[#94a3b8] font-mono">
                  <span>Report ID: {r.id}</span>
                  <span>•</span>
                  <span>{r.date}</span>
                  <span>•</span>
                  <span>{r.size}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleDownload(r.id)}
              className="btn-primary py-2.5 px-4 text-xs font-bold shrink-0 flex items-center justify-center gap-2"
            >
              <Download className="size-4" />
              <span>Download PDF</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
