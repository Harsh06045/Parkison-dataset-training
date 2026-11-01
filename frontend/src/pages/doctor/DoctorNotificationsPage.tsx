import React from "react";
import { Bell, CheckCircle2, Clock, AlertTriangle, ShieldCheck, ArrowLeft, Brain, Activity, FileText } from "lucide-react";
import { useToast } from "@/context/ToastContext";

interface DoctorNotificationsPageProps {
  onNavigate: (path: string) => void;
}

export function DoctorNotificationsPage({ onNavigate }: DoctorNotificationsPageProps) {
  const { success } = useToast();

  const notifications = [
    {
      id: "NOTIF-101",
      title: "3D MRI ViT Analysis Completed",
      desc: "Patient Eleanor Vance (MRN-489201) volumetric scan processed with 94.2% MCI Stage 1 probability.",
      time: "10 mins ago",
      type: "scan",
      icon: Brain,
      color: "bg-purple-50 text-purple-600 border-purple-200",
      read: false,
    },
    {
      id: "NOTIF-102",
      title: "Diagnostic Report Pending Signature",
      desc: "Comprehensive diagnostic summary for Arthur Pendelton (MRN-309102) is ready for physician review.",
      time: "1 hour ago",
      type: "report",
      icon: FileText,
      color: "bg-amber-50 text-amber-600 border-amber-200",
      read: false,
    },
    {
      id: "NOTIF-103",
      title: "Voice Phonation Self-Test Uploaded",
      desc: "Patient Eleanor Vance submitted a 5-second acoustic sustained phonation test from patient portal.",
      time: "4 hours ago",
      type: "voice",
      icon: Activity,
      color: "bg-cyan-50 text-cyan-600 border-cyan-200",
      read: true,
    },
    {
      id: "NOTIF-104",
      title: "PACS Node Synchronization Verified",
      desc: "DICOM Series C-STORE association verified with Orthanc & DCM4CHEE nodes (10.0.4.82).",
      time: "Yesterday",
      type: "system",
      icon: ShieldCheck,
      color: "bg-emerald-50 text-emerald-600 border-emerald-200",
      read: true,
    },
  ];

  return (
    <div className="space-y-6 text-[#0b1c30] select-none animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e2e8f0] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 text-[0.65rem] font-bold">
              Doctor Clinical Feed
            </span>
            <span className="text-[#64748b]">•</span>
            <span className="text-xs font-mono text-[#64748b]">2 Unread Alerts</span>
          </div>
          <h2 className="font-headline text-2xl font-extrabold text-[#0b1c30] tracking-tight mt-1">
            Clinical Notifications &amp; Alerts
          </h2>
        </div>

        <button
          type="button"
          onClick={() => success("Feed Updated", "All notifications marked as read.")}
          className="btn-secondary py-2 px-3.5 text-xs font-semibold self-start sm:self-auto"
        >
          <span>Mark All as Read</span>
        </button>
      </div>

      <div className="space-y-3">
        {notifications.map((n) => {
          const Icon = n.icon;
          return (
            <div
              key={n.id}
              className={`p-5 rounded-3xl border transition-all flex items-start justify-between gap-4 ${
                !n.read ? "bg-white shadow-card border-[#0ea5e9]/40" : "bg-white/70 shadow-xs border-[#e2e8f0]"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`flex size-11 shrink-0 items-center justify-center rounded-2xl border ${n.color}`}>
                  <Icon className="size-5" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-[#0b1c30] text-sm">{n.title}</h3>
                    {!n.read && (
                      <span className="size-2 rounded-full bg-[#0ea5e9] inline-block" />
                    )}
                  </div>
                  <p className="text-xs text-[#64748b] leading-relaxed">{n.desc}</p>
                  <p className="text-[0.68rem] text-[#94a3b8] font-mono">{n.time}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
