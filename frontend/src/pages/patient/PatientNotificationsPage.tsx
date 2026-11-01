import React from "react";
import { Bell, CheckCircle2, Calendar, FileText, Activity, ArrowLeft } from "lucide-react";
import { useToast } from "@/context/ToastContext";

interface PatientNotificationsPageProps {
  onNavigate: (path: string) => void;
}

export function PatientNotificationsPage({ onNavigate }: PatientNotificationsPageProps) {
  const { success } = useToast();

  const notifications = [
    {
      id: "PNOTIF-01",
      title: "New Diagnostic Report Signed",
      desc: "Dr. Sarah Jenkins has reviewed and signed your Comprehensive Neurological 3D MRI Dossier.",
      time: "Today, 11:30 AM",
      icon: FileText,
      color: "bg-emerald-50 text-emerald-600 border-emerald-200",
      link: "/patient/reports",
      read: false,
    },
    {
      id: "PNOTIF-02",
      title: "Clinic Consultation Reminder",
      desc: "Your upcoming 6-month longitudinal MRI consultation is scheduled for Sept 15, 2026 at 09:30 AM.",
      time: "Yesterday",
      icon: Calendar,
      color: "bg-blue-50 text-blue-600 border-blue-200",
      link: "/patient/appointments",
      read: true,
    },
    {
      id: "PNOTIF-03",
      title: "Daily Phonation Check-In",
      desc: "Remember to record your 5-second morning sustained vowel sound for vocal frequency tracking.",
      time: "2 days ago",
      icon: Activity,
      color: "bg-cyan-50 text-cyan-600 border-cyan-200",
      link: "/patient/results",
      read: true,
    },
  ];

  return (
    <div className="space-y-6 text-[#0b1c30] select-none animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e2e8f0] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200 px-2.5 py-0.5 text-[0.65rem] font-bold">
              Patient Care Feed
            </span>
            <span className="text-[#64748b]">•</span>
            <span className="text-xs font-mono text-[#64748b]">Eleanor Vance</span>
          </div>
          <h2 className="font-headline text-2xl font-extrabold text-[#0b1c30] tracking-tight mt-1">
            Notifications &amp; Health Updates
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

      <div className="space-y-3">
        {notifications.map((n) => {
          const Icon = n.icon;
          return (
            <div
              key={n.id}
              onClick={() => onNavigate(n.link)}
              className={`p-5 rounded-3xl border transition-all cursor-pointer flex items-start justify-between gap-4 ${
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
