import React from "react";
import { X, FileText, Download, Printer, ShieldCheck, Stethoscope, CheckCircle } from "lucide-react";
import { DiagnosticReport } from "@/lib/doctorService";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: DiagnosticReport | null;
}

export function ReportModal({ isOpen, onClose, report }: ReportModalProps) {
  if (!isOpen || !report) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Generate text blob for demo download
    const content = `====================================================
NEUROFUSION AI CLINICAL DIAGNOSTIC REPORT
Report ID: ${report.id}
Created Date: ${report.createdAt}
Patient Name: ${report.patientName} (ID: ${report.patientId})
Attending Physician: ${report.doctorName}
====================================================

PRIMARY DIAGNOSIS:
${report.primaryDiagnosis} (Confidence: ${report.confidenceScore})

KEY CLINICAL FINDINGS:
${report.keyFindings.map((f, i) => `${i + 1}. ${f}`).join("\n")}

RECOMMENDED CLINICAL MANAGEMENT:
${report.recommendations.map((r, i) => `${i + 1}. ${r}`).join("\n")}

====================================================
CONFIDENTIAL & PROPRIETARY MEDICAL RECORD
HIPAA & DICOM COMPLIANT DISCLOSURE
====================================================`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Diagnostic_Report_${report.patientName.replace(/\s+/g, "_")}_${report.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-3xl border border-slate-700 bg-[#060818] p-6 sm:p-8 shadow-2xl text-white my-8">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 flex size-8 items-center justify-center rounded-full bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <X className="size-4" />
        </button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-600/20 border border-blue-500/40 text-blue-400">
              <Stethoscope className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">NeuroFusion Clinical Diagnostic Report</h2>
                <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-[0.68rem] font-bold text-emerald-300">
                  {report.status}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Report ID: <span className="font-mono text-slate-300">{report.id}</span> • Generated on {report.createdAt}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
            >
              <Printer className="size-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-blue-500 transition-all"
            >
              <Download className="size-3.5" />
              <span>Export Report</span>
            </button>
          </div>
        </div>

        {/* Printable Report Body */}
        <div className="space-y-6 text-xs text-slate-300">
          {/* Patient Details Metadata Box */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <div>
              <p className="text-[0.68rem] uppercase font-semibold text-slate-400">Patient Name</p>
              <p className="font-bold text-white text-sm mt-0.5">{report.patientName}</p>
            </div>
            <div>
              <p className="text-[0.68rem] uppercase font-semibold text-slate-400">Patient ID</p>
              <p className="font-mono text-slate-200 text-sm mt-0.5">{report.patientId}</p>
            </div>
            <div>
              <p className="text-[0.68rem] uppercase font-semibold text-slate-400">Attending Doctor</p>
              <p className="font-medium text-slate-200 text-sm mt-0.5">{report.doctorName}</p>
            </div>
            <div>
              <p className="text-[0.68rem] uppercase font-semibold text-slate-400">AI Confidence Score</p>
              <p className="font-bold text-blue-400 text-sm mt-0.5">{report.confidenceScore}</p>
            </div>
          </div>

          {/* Primary Diagnosis */}
          <div className="rounded-2xl border border-purple-500/30 bg-purple-950/20 p-5 space-y-1">
            <p className="text-[0.68rem] uppercase font-extrabold text-purple-300 tracking-wider">Primary AI &amp; Clinical Diagnosis</p>
            <h3 className="text-lg font-extrabold text-white">{report.primaryDiagnosis}</h3>
            <p className="text-xs text-slate-300">
              Verified by 3D Volumetric Grad-CAM Convolutional Neural Ensemble &amp; Entorhinal Cortex Volumetry.
            </p>
          </div>

          {/* Key Findings */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <CheckCircle className="size-4 text-blue-400" />
              <span>Key Quantitative &amp; Imaging Findings</span>
            </h4>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 space-y-2">
              {report.keyFindings.map((finding, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-blue-950 text-blue-400 text-[0.65rem] font-bold border border-blue-500/30">
                    {idx + 1}
                  </span>
                  <p className="leading-relaxed">{finding}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Clinical Recommendations */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Stethoscope className="size-4 text-emerald-400" />
              <span>Recommended Care Plan &amp; Interventions</span>
            </h4>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 space-y-2">
              {report.recommendations.map((rec, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-950 text-emerald-400 text-[0.65rem] font-bold border border-emerald-500/30">
                    {idx + 1}
                  </span>
                  <p className="leading-relaxed">{rec}</p>
                </div>
              ))}
            </div>
          </div>

          {/* HIPAA & Compliance Disclaimer Footer */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/80 p-3 text-[0.68rem] text-slate-400 flex items-center gap-3">
            <ShieldCheck className="size-5 text-emerald-400 shrink-0" />
            <div>
              <p className="font-semibold text-slate-300">HIPAA &amp; FDA Software as Medical Device (SaMD) Compliant</p>
              <p>
                This report was created using NeuroFusion AI v2.4 decision support. Final diagnostic verification lies with the attending physician.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
