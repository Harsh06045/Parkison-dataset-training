import React from "react";
import { ShieldCheck, Download, CheckCircle2, Lock, Terminal } from "lucide-react";
import { useToast } from "@/context/ToastContext";

interface AdminAuditPageProps {
  onNavigate: (path: string) => void;
}

export function AdminAuditPage({ onNavigate }: AdminAuditPageProps) {
  const { success, info } = useToast();

  const handleExport = () => {
    info("Generating Audit Dump", "Exporting cryptographically signed JSON & CSV audit trail...");
    setTimeout(() => {
      success("Export Succeeded", "audit_trail_20260822.json downloaded.");
    }, 1000);
  };

  const logs = [
    { id: "LOG-9042", time: "2 mins ago", user: "Dr. Sarah Jenkins", role: "doctor", action: "3D Brain MRI ViT Inference", target: "Eleanor Vance (PT-8942-AD)", status: "Success" },
    { id: "LOG-9041", time: "14 mins ago", user: "Terminal #04", role: "system", action: "TLS 1.3 Physician Auth", target: "Token Generated", status: "Verified" },
    { id: "LOG-9040", time: "48 mins ago", user: "Dr. James Wilson", role: "doctor", action: "Parkinson's VQC Audio Scan", target: "Arthur Pendelton", status: "Success" },
    { id: "LOG-9039", time: "1h 12m ago", user: "PACS Bridge", role: "system", action: "DICOM Series Ingestion", target: "248 Slices T1-MRI", status: "Indexed" },
    { id: "LOG-9038", time: "3h 05m ago", user: "Marcus Vance", role: "admin", action: "PACS C-ECHO Ping Test", target: "DCM4CHEE Node", status: "Success (18ms)" },
  ];

  return (
    <div className="space-y-6 text-[#0b1c30] select-none animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e2e8f0] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 text-[0.65rem] font-bold">
              HIPAA 45 CFR § 164.312(b) Compliant
            </span>
            <span className="text-[#64748b]">•</span>
            <span className="text-xs font-mono text-[#64748b]">Tamper-Evident Ledger</span>
          </div>
          <h2 className="font-headline text-2xl font-extrabold text-[#0b1c30] tracking-tight mt-1">
            System &amp; Access Audit Logs
          </h2>
        </div>

        <button
          type="button"
          onClick={handleExport}
          className="btn-primary py-2 px-3.5 text-xs font-semibold flex items-center gap-1.5"
        >
          <Download className="size-3.5" />
          <span>Export Audit Bundle</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-card border border-[#e2e8f0] overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#f8f9ff] border-b border-[#e2e8f0] text-[0.68rem] uppercase font-bold text-[#64748b]">
              <th className="p-4">Log ID</th>
              <th className="p-4">Timestamp</th>
              <th className="p-4">Actor</th>
              <th className="p-4">Action</th>
              <th className="p-4">Target Entity</th>
              <th className="p-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e2e8f0]">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-[#f8f9ff] transition-colors font-medium">
                <td className="p-4 font-mono font-bold text-[#0ea5e9]">{log.id}</td>
                <td className="p-4 text-[#64748b] font-mono text-[0.68rem]">{log.time}</td>
                <td className="p-4 font-bold text-[#0b1c30]">{log.user}</td>
                <td className="p-4 text-[#475569]">{log.action}</td>
                <td className="p-4 text-[#64748b]">{log.target}</td>
                <td className="p-4 text-right">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[0.65rem] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {log.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
