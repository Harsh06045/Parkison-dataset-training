import React, { useState } from "react";
import {
  Server,
  Cpu,
  Database,
  ShieldCheck,
  Activity,
  Users,
  HardDrive,
  RefreshCw,
  Download,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ArrowRight,
  ChevronRight,
  Terminal,
  Settings,
  Brain,
  Sliders,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

interface AdminDashboardViewProps {
  onNavigate: (path: string) => void;
}

export function AdminDashboardView({ onNavigate }: AdminDashboardViewProps) {
  const { user } = useAuth();
  const { success, info } = useToast();
  const [isSyncingPacs, setIsSyncingPacs] = useState(false);

  const handleSyncPacs = () => {
    setIsSyncingPacs(true);
    info("DICOM PACS Sync", "Initiating C-ECHO and cache handshake with Orthanc / DCM4CHEE node...");
    setTimeout(() => {
      setIsSyncingPacs(false);
      success("PACS Sync Complete", "3,842 patient imaging series verified and indexed.");
    }, 1500);
  };

  const handleExportAudit = () => {
    info("Exporting Audit Log", "Generating cryptographically signed HIPAA compliance audit trail...");
    setTimeout(() => {
      success("Audit Log Exported", "System audit bundle downloaded.");
    }, 1200);
  };

  const auditEvents = [
    {
      id: "EVT-9042",
      time: "2 mins ago",
      actor: "Dr. Sarah Jenkins (DOC-8921)",
      event: "3D Brain MRI ViT Inference",
      target: "Patient Eleanor Vance (PT-8942-AD)",
      status: "Success (94.2% Conf)",
      level: "normal",
    },
    {
      id: "EVT-9041",
      time: "14 mins ago",
      actor: "Hospital Terminal #04 (192.168.10.42)",
      event: "TLS 1.3 Physician Authentication",
      target: "Session Auth Token Issued",
      status: "Verified",
      level: "normal",
    },
    {
      id: "EVT-9040",
      time: "48 mins ago",
      actor: "Dr. James Wilson (DOC-3310)",
      event: "Parkinson's 4-Qubit VQC Acoustic Inference",
      target: "Patient Arthur Pendelton (PT-3091-PD)",
      status: "Completed (96.8%)",
      level: "normal",
    },
    {
      id: "EVT-9039",
      time: "1h 12m ago",
      actor: "PACS Bridge Node (DCM4CHEE)",
      event: "Volumetric DICOM Series Ingestion",
      target: "248 Slices T1-Weighted MRI",
      status: "Indexed (0 Errors)",
      level: "normal",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-200 text-[#0b1c30] select-none">
      {/* 1. ADMIN SYSTEM HERO BANNER */}
      <div className="bg-gradient-to-tr from-[#0b1c30] via-[#102a45] to-[#0b1c30] rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-card-deep border border-slate-800">
        <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-10 pointer-events-none">
          <div
            className="w-full h-full"
            style={{
              backgroundImage:
                "radial-gradient(circle at 2px 2px, rgba(57, 184, 253, 0.6) 1px, transparent 0)",
              backgroundSize: "28px 28px",
            }}
          />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/20 border border-blue-500/40 px-3 py-1 text-xs font-bold text-blue-300">
              <Terminal className="size-3.5 text-blue-300" />
              <span>Hospital IT Governance Console • System Administrator: {user?.fullName || "Marcus Vance"}</span>
            </div>

            <h2 className="font-headline text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              AI Infrastructure &amp; PACS Command
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
              Real-time monitoring of 3D Vision Transformer GPU clusters, PennyLane quantum decision engines, DICOM node integrations, and access auditing.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-300">
              <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
                <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>PACS Node: <strong>DCM4CHEE Connected (10.0.4.82)</strong></span>
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-cyan-400">
                <Cpu className="size-3.5 text-cyan-400" />
                <span>GPU Cluster: <strong>2x RTX A6000 (96GB VRAM Online)</strong></span>
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            <button
              type="button"
              disabled={isSyncingPacs}
              onClick={handleSyncPacs}
              className="btn-primary py-3 px-5 text-xs font-bold shadow-lg flex items-center justify-center gap-2"
            >
              <RefreshCw className={`size-4 ${isSyncingPacs ? "animate-spin" : ""}`} />
              <span>{isSyncingPacs ? "Syncing PACS Nodes..." : "Sync DICOM Nodes"}</span>
            </button>
            <button
              type="button"
              onClick={handleExportAudit}
              className="btn-secondary py-3 px-5 text-xs font-bold text-white bg-white/10 hover:bg-white/20 border-white/20 flex items-center justify-center gap-2"
            >
              <Download className="size-4" />
              <span>Export Audit Trail</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. INFRASTRUCTURE KPI METRICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Terminals */}
        <div className="bg-white rounded-2xl p-5 shadow-card border border-[#e2e8f0] flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[0.68rem] uppercase font-bold text-[#64748b] tracking-wider">
              Clinical Terminals
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <Users className="size-4.5" />
            </div>
          </div>
          <div>
            <h4 className="text-2xl font-headline font-black text-[#0b1c30]">28 Online</h4>
            <p className="text-[0.68rem] text-emerald-600 font-bold mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="size-3" />
              <span>100% Authenticated via TLS 1.3</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("/settings")}
            className="text-xs font-bold text-[#0ea5e9] hover:underline flex items-center justify-between pt-2 border-t border-[#e2e8f0]"
          >
            <span>Manage Sessions</span>
            <ChevronRight className="size-3.5" />
          </button>
        </div>

        {/* Metric 2: AI Latency */}
        <div className="bg-white rounded-2xl p-5 shadow-card border border-[#e2e8f0] flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[0.68rem] uppercase font-bold text-[#64748b] tracking-wider">
              Inference Latency
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 border border-purple-200">
              <Cpu className="size-4.5" />
            </div>
          </div>
          <div>
            <h4 className="text-2xl font-headline font-black text-[#0b1c30]">420 ms</h4>
            <p className="text-[0.68rem] text-[#64748b] font-medium mt-0.5">
              3D CNN + ViT Ensemble Pipeline
            </p>
          </div>
          <div className="pt-2 border-t border-[#e2e8f0] text-[0.68rem] text-purple-600 font-bold">
            99.98% Model Uptime
          </div>
        </div>

        {/* Metric 3: PACS Storage */}
        <div className="bg-white rounded-2xl p-5 shadow-card border border-[#e2e8f0] flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[0.68rem] uppercase font-bold text-[#64748b] tracking-wider">
              PACS DICOM Archive
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 border border-cyan-200">
              <HardDrive className="size-4.5" />
            </div>
          </div>
          <div>
            <h4 className="text-2xl font-headline font-black text-[#0b1c30]">1.4 TB / 8 TB</h4>
            <p className="text-[0.68rem] text-[#64748b] font-medium mt-0.5">
              3,842 Volumetric Scans Stored
            </p>
          </div>
          <div className="pt-2 border-t border-[#e2e8f0] text-[0.68rem] text-cyan-600 font-bold">
            AES-256 Encrypted At Rest
          </div>
        </div>

        {/* Metric 4: Compliance Status */}
        <div className="bg-white rounded-2xl p-5 shadow-card border border-[#e2e8f0] flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[0.68rem] uppercase font-bold text-[#64748b] tracking-wider">
              Governance Status
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
              <ShieldCheck className="size-4.5" />
            </div>
          </div>
          <div>
            <h4 className="text-2xl font-headline font-black text-[#0b1c30]">100% Passed</h4>
            <p className="text-[0.68rem] text-emerald-600 font-bold mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="size-3" />
              <span>0 Security Anomalies</span>
            </p>
          </div>
          <div className="pt-2 border-t border-[#e2e8f0] text-[0.68rem] text-[#64748b] font-mono">
            Next Audit: Nov 2026
          </div>
        </div>
      </div>

      {/* 3. LIVE SYSTEM AUDIT TRAIL */}
      <div className="bg-white rounded-2xl shadow-card border border-[#e2e8f0] overflow-hidden">
        <div className="p-5 border-b border-[#e2e8f0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-headline font-bold text-base text-[#0b1c30]">
              Live System Audit Trail &amp; AI Execution Logs
            </h3>
            <p className="text-xs text-[#64748b] mt-0.5">
              Comprehensive real-time ledger of model inferences, physician access tokens, and PACS storage events.
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportAudit}
            className="btn-secondary py-1.5 px-3 text-xs font-semibold flex items-center gap-1.5"
          >
            <Download className="size-3.5" />
            <span>Download Audit CSV</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#f8f9ff] border-b border-[#e2e8f0] text-[0.68rem] uppercase font-bold text-[#64748b]">
                <th className="p-4">Event ID</th>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Actor / Terminal</th>
                <th className="p-4">Diagnostic Action</th>
                <th className="p-4">Target Entity</th>
                <th className="p-4 text-right">Execution Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {auditEvents.map((evt) => (
                <tr key={evt.id} className="hover:bg-[#f8f9ff] transition-colors font-medium">
                  <td className="p-4 font-mono font-bold text-[#0ea5e9]">{evt.id}</td>
                  <td className="p-4 text-[#64748b] font-mono text-[0.68rem]">{evt.time}</td>
                  <td className="p-4 font-bold text-[#0b1c30]">{evt.actor}</td>
                  <td className="p-4 text-[#475569]">{evt.event}</td>
                  <td className="p-4 text-[#64748b]">{evt.target}</td>
                  <td className="p-4 text-right">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[0.65rem] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {evt.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. AI MODEL CHECKPOINTS & GPU HARDWARE STATUS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-card border border-[#e2e8f0] space-y-4">
          <h3 className="font-headline text-sm font-bold text-[#0b1c30] uppercase tracking-wider flex items-center gap-2 border-b border-[#e2e8f0] pb-3">
            <Brain className="size-4 text-purple-600" />
            <span>Active Deep Learning Checkpoints</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0] flex items-center justify-between">
              <div>
                <p className="font-bold text-[#0b1c30]">3D CNN + Vision Transformer (Alzheimer&rsquo;s)</p>
                <p className="text-[0.68rem] text-[#64748b] font-mono">Checkpoint: vit-3d-mri-v2.4.1.pt (ADNI Cohort)</p>
              </div>
              <span className="rounded-full bg-purple-100 text-purple-700 px-2.5 py-0.5 text-[0.65rem] font-bold">
                Active v2.4
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0] flex items-center justify-between">
              <div>
                <p className="font-bold text-[#0b1c30]">4-Qubit Variational Quantum Classifier (Parkinson&rsquo;s)</p>
                <p className="text-[0.68rem] text-[#64748b] font-mono">Ansatz: PennyLane StronglyEntanglingLayers (v0.34)</p>
              </div>
              <span className="rounded-full bg-cyan-100 text-cyan-700 px-2.5 py-0.5 text-[0.65rem] font-bold">
                Active Q-Engine
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-card border border-[#e2e8f0] space-y-4">
          <h3 className="font-headline text-sm font-bold text-[#0b1c30] uppercase tracking-wider flex items-center gap-2 border-b border-[#e2e8f0] pb-3">
            <Cpu className="size-4 text-[#0ea5e9]" />
            <span>GPU Compute Cluster Telemetry</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="space-y-1.5 p-3 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0]">
              <div className="flex items-center justify-between font-bold text-[#0b1c30]">
                <span>GPU 0: NVIDIA RTX A6000 (48GB)</span>
                <span className="font-mono text-[#0ea5e9]">42% VRAM (20.1 GB / 48 GB)</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div className="bg-[#0ea5e9] h-full rounded-full w-[42%]" />
              </div>
              <p className="text-[0.65rem] text-[#64748b]">Core Temp: 52°C • Fan Speed: 40%</p>
            </div>

            <div className="space-y-1.5 p-3 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0]">
              <div className="flex items-center justify-between font-bold text-[#0b1c30]">
                <span>GPU 1: NVIDIA RTX A6000 (48GB)</span>
                <span className="font-mono text-[#0ea5e9]">18% VRAM (8.6 GB / 48 GB)</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div className="bg-purple-600 h-full rounded-full w-[18%]" />
              </div>
              <p className="text-[0.65rem] text-[#64748b]">Core Temp: 48°C • Fan Speed: 35%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
