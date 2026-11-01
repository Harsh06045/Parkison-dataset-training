import React, { useState } from "react";
import { Server, RefreshCw, HardDrive, ShieldCheck, CheckCircle2, ArrowLeft, Activity } from "lucide-react";
import { useToast } from "@/context/ToastContext";

interface AdminPacsPageProps {
  onNavigate: (path: string) => void;
}

export function AdminPacsPage({ onNavigate }: AdminPacsPageProps) {
  const { success, info } = useToast();
  const [isPinging, setIsPinging] = useState(false);

  const handlePing = () => {
    setIsPinging(true);
    info("DICOM C-ECHO", "Sending DICOM verification ping to AE Title DCM4CHEE...");
    setTimeout(() => {
      setIsPinging(false);
      success("C-ECHO Succeeded", "Response received in 18ms. Association active.");
    }, 1000);
  };

  return (
    <div className="space-y-6 text-[#0b1c30] select-none animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e2e8f0] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-[0.65rem] font-bold">
              DICOM PACS Network
            </span>
            <span className="text-[#64748b]">•</span>
            <span className="text-xs font-mono text-[#64748b]">Node AE Title: NEUROFUSION_PACS</span>
          </div>
          <h2 className="font-headline text-2xl font-extrabold text-[#0b1c30] tracking-tight mt-1">
            Hospital PACS &amp; Storage Infrastructure
          </h2>
        </div>

        <button
          type="button"
          disabled={isPinging}
          onClick={handlePing}
          className="btn-primary py-2 px-3.5 text-xs font-semibold flex items-center gap-1.5"
        >
          <RefreshCw className={`size-3.5 ${isPinging ? "animate-spin" : ""}`} />
          <span>{isPinging ? "Testing C-ECHO..." : "Test DICOM C-ECHO"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-card border border-[#e2e8f0] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[0.68rem] uppercase font-bold text-[#64748b]">Primary PACS Server</span>
            <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <h4 className="text-base font-bold text-[#0b1c30]">DCM4CHEE 5.24</h4>
          <p className="text-xs font-mono text-[#64748b]">IP: 10.0.4.82 • Port: 11112</p>
          <div className="pt-2 border-t border-[#e2e8f0] text-[0.68rem] text-emerald-600 font-bold">
            Latency: 18ms • Zero Packet Loss
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-card border border-[#e2e8f0] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[0.68rem] uppercase font-bold text-[#64748b]">Secondary PACS Node</span>
            <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <h4 className="text-base font-bold text-[#0b1c30]">Orthanc DICOM Router</h4>
          <p className="text-xs font-mono text-[#64748b]">IP: 10.0.4.83 • Port: 4242</p>
          <div className="pt-2 border-t border-[#e2e8f0] text-[0.68rem] text-emerald-600 font-bold">
            Auto-Routing To ViT Cluster
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-card border border-[#e2e8f0] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[0.68rem] uppercase font-bold text-[#64748b]">Volume Storage</span>
            <HardDrive className="size-4 text-cyan-600" />
          </div>
          <h4 className="text-base font-bold text-[#0b1c30]">1.4 TB / 8.0 TB</h4>
          <p className="text-xs text-[#64748b]">3,842 Volumetric 3D MRI Series</p>
          <div className="pt-2 border-t border-[#e2e8f0] text-[0.68rem] text-cyan-600 font-bold">
            AES-256 Encrypted Hot Storage
          </div>
        </div>
      </div>
    </div>
  );
}
