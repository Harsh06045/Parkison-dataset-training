import React, { useState } from "react";
import {
  Bell,
  Search,
  PlusCircle,
  Menu,
  Stethoscope,
  ChevronRight,
  ShieldCheck,
  Brain,
  Activity,
  CheckCircle,
  FileCheck2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { usePatient } from "@/context/PatientContext";

interface TopNavProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  collapsed: boolean;
  onToggleMobile: () => void;
  onOpenAddPatient: () => void;
}

export function TopNav({
  currentPath,
  onNavigate,
  collapsed,
  onToggleMobile,
  onOpenAddPatient,
}: TopNavProps) {
  const { user } = useAuth();
  const { selectedPatient } = usePatient();
  const [showNotifications, setShowNotifications] = useState(false);

  // Generate breadcrumb trail
  const getBreadcrumb = () => {
    if (currentPath === "/dashboard" || currentPath === "/") return "Clinical Dashboard";
    if (currentPath === "/patients") return "Patient Directory";
    if (currentPath.startsWith("/patients/")) return "Patient Dossier";
    if (currentPath === "/analysis") return "Disease Selection";
    if (currentPath === "/analysis/alzheimer") return "Alzheimer's 3D MRI";
    if (currentPath === "/analysis/parkinson") return "Parkinson's Voice";
    if (currentPath.startsWith("/results/")) return "Diagnostic Result";
    if (currentPath === "/history") return "History Registry";
    if (currentPath === "/reports" || currentPath.startsWith("/reports/")) return "Diagnostic Reports";
    if (currentPath === "/settings") return "Settings & Profile";
    return "NeuroFusionAI";
  };

  const notifications = [
    {
      id: "1",
      title: "MRI Scan Processed",
      desc: "Patient Eleanor Vance's 3D CNN analysis completed with 94.2% confidence.",
      time: "10m ago",
      read: false,
    },
    {
      id: "2",
      title: "Vocal Biomarkers Extracted",
      desc: "Quantum decision layer evaluated phonatory dysphonia for Arthur Pendelton.",
      time: "1h ago",
      read: false,
    },
  ];

  return (
    <header
      className={`sticky top-0 z-30 flex h-16 sm:h-20 items-center justify-between border-b border-[#e2e8f0] bg-white/95 px-4 sm:px-6 backdrop-blur-md transition-all duration-300 shadow-xs ${
        collapsed ? "lg:ml-20" : "lg:ml-64"
      }`}
    >
      {/* Left: Mobile Hamburger Toggle & Title */}
      <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
        <button
          type="button"
          onClick={onToggleMobile}
          className="flex lg:hidden size-9 sm:size-10 shrink-0 items-center justify-center rounded-xl border border-[#e2e8f0] bg-white text-[#475569] hover:bg-[#f8f9ff] active:scale-95 transition-transform"
          aria-label="Open menu"
        >
          <Menu className="size-5 text-[#0b1c30]" />
        </button>

        <div className="flex flex-col min-w-0">
          {/* Main Page Title */}
          <h1 className="font-headline text-base sm:text-lg font-extrabold text-[#0b1c30] tracking-tight truncate leading-tight">
            {getBreadcrumb()}
          </h1>

          {/* Breadcrumb Path Underneath Page Name */}
          <div className="hidden sm:flex items-center gap-1.5 text-[0.68rem] font-medium text-[#64748b] truncate mt-0.5">
            <span
              className="cursor-pointer hover:text-[#0ea5e9] transition-colors"
              onClick={() => onNavigate("/dashboard")}
            >
              Portal
            </span>
            <ChevronRight className="size-3 text-[#94a3b8]" />
            <span className="text-[#0ea5e9] font-semibold truncate">{getBreadcrumb()}</span>
          </div>
        </div>
      </div>

      {/* Right: Actions, Notifications, Physician Profile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Selected Patient Banner if active (Desktop / Tablet only) */}
        {selectedPatient && (
          <div
            onClick={() => onNavigate(`/patients/${selectedPatient.id}`)}
            className="hidden md:flex items-center gap-2 rounded-xl border border-[#0ea5e9]/30 bg-[#f0f9ff] px-3 py-1.5 text-xs text-[#0284c7] font-semibold cursor-pointer hover:bg-[#e0f2fe] transition-colors"
            title="Active Selected Patient"
          >
            <Stethoscope className="size-3.5 text-[#0ea5e9]" />
            <span className="truncate max-w-[120px]">
              Active: <strong>{selectedPatient.fullName}</strong>
            </span>
          </div>
        )}

        {/* Quick Launch Analysis Button (Large Screens only - mobile has bottom Scan button) */}
        <button
          type="button"
          onClick={() => onNavigate("/analysis")}
          className="btn-primary hidden md:flex text-xs font-semibold py-2 px-3.5 shadow-sm"
        >
          <Brain className="size-3.5" />
          <span>New Analysis</span>
        </button>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative flex size-9 sm:size-10 items-center justify-center rounded-xl border border-[#e2e8f0] bg-white text-[#475569] hover:bg-[#f8f9ff] hover:text-[#0b1c30] transition-colors"
            aria-label="View notifications"
          >
            <Bell className="size-4" />
            <span className="absolute top-2 right-2 size-2 rounded-full bg-[#0ea5e9] ring-2 ring-white" />
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-xl z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-2 mb-3">
                <span className="font-bold text-[#0b1c30]">Clinical Notifications</span>
                <span
                  onClick={() => setShowNotifications(false)}
                  className="text-[0.68rem] text-[#0ea5e9] font-semibold cursor-pointer hover:underline"
                >
                  Mark all read
                </span>
              </div>
              <div className="space-y-2.5">
                {notifications.map((n) => (
                  <div key={n.id} className="p-2.5 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0] space-y-1">
                    <p className="font-bold text-[#0b1c30]">{n.title}</p>
                    <p className="text-[#64748b] leading-relaxed text-[0.7rem]">{n.desc}</p>
                    <span className="text-[0.62rem] font-mono text-[#94a3b8]">{n.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Attending Physician Avatar */}
        <div
          onClick={() => onNavigate("/settings")}
          className="flex items-center gap-2 pl-2 sm:border-l sm:border-[#e2e8f0] cursor-pointer group"
          title="View Physician Profile"
        >
          <div className="flex size-9 sm:size-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#0ea5e9] to-[#0284c7] text-white font-extrabold text-xs shadow-sm group-hover:scale-105 transition-transform">
            {user?.fullName
              ? user.fullName
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")
              : "SJ"}
          </div>
          <div className="hidden xl:flex flex-col text-left">
            <span className="text-xs font-bold text-[#0b1c30] group-hover:text-[#0ea5e9] transition-colors">
              {user?.fullName || "Dr. Sarah Jenkins"}
            </span>
            <span className="text-[0.65rem] text-[#64748b] font-medium">Attending Neurologist</span>
          </div>
        </div>
      </div>
    </header>
  );
}
