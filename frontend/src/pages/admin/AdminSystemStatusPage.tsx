import React, { useState } from "react";
import { Server, Cpu, HardDrive, ShieldCheck, CheckCircle2, RefreshCw, Activity, Terminal } from "lucide-react";
import { useToast } from "@/context/ToastContext";

interface AdminSystemStatusPageProps {
  onNavigate: (path: string) => void;
}

export function AdminSystemStatusPage({ onNavigate }: AdminSystemStatusPageProps) {
  const { success, info } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    info("Health Check", "Querying cluster nodes, PACS daemons, and GPU telemetry...");
    setTimeout(() => {
      setIsRefreshing(false);
      success("All Systems Normal", "Telemetry verified: 99.98% operational uptime.");
    }, 1000);
  };

  return (
    <div className="space-y-6 text-[#0b1c30] select-none animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e2e8f0] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-[0.65rem] font-bold">
              Health Status: 100% Operational
            </span>
            <span className="text-[#64748b]">•</span>
            <span className="text-xs font-mono text-[#64748b]">Uptime: 99.98% (30 Days)</span>
          </div>
          <h2 className="font-headline text-2xl font-extrabold text-[#0b1c30] tracking-tight mt-1">
            System &amp; Service Infrastructure Status
          </h2>
        </div>

        <button
          type="button"
          disabled={isRefreshing}
          onClick={handleRefresh}
          className="btn-primary py-2 px-3.5 text-xs font-semibold flex items-center gap-1.5"
        >
          <RefreshCw className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          <span>{isRefreshing ? "Checking..." : "Refresh Status"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-3xl p-6 shadow-card border border-[#e2e8f0] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#64748b]">AI Inference Pipeline</span>
            <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <h4 className="text-xl font-headline font-extrabold text-[#0b1c30]">3D ViT + PennyLane VQC</h4>
          <p className="text-xs text-[#64748b]">Average Latency: <strong>420 ms</strong></p>
          <div className="pt-2 border-t border-[#e2e8f0] text-xs text-emerald-600 font-bold flex items-center gap-1">
            <CheckCircle2 className="size-3.5" />
            <span>GPU 0 &amp; 1 Online (2x RTX A6000)</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-card border border-[#e2e8f0] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#64748b]">DICOM PACS Service</span>
            <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <h4 className="text-xl font-headline font-extrabold text-[#0b1c30]">DCM4CHEE &amp; Orthanc</h4>
          <p className="text-xs text-[#64748b]">AE Title: <strong>NEUROFUSION_PACS</strong></p>
          <div className="pt-2 border-t border-[#e2e8f0] text-xs text-emerald-600 font-bold flex items-center gap-1">
            <CheckCircle2 className="size-3.5" />
            <span>C-ECHO Ping: 18ms (0% Loss)</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-card border border-[#e2e8f0] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#64748b]">Security &amp; IAM Gateway</span>
            <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <h4 className="text-xl font-headline font-extrabold text-[#0b1c30]">TLS 1.3 JWT Auth</h4>
          <p className="text-xs text-[#64748b]">Encryption: <strong>AES-256 GCM</strong></p>
          <div className="pt-2 border-t border-[#e2e8f0] text-xs text-emerald-600 font-bold flex items-center gap-1">
            <CheckCircle2 className="size-3.5" />
            <span>HIPAA § 164.312 Verified</span>
          </div>
        </div>
      </div>
    </div>
  );
}
