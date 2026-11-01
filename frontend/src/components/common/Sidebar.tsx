import React from "react";
import {
  LayoutDashboard,
  Users,
  BrainCircuit,
  History,
  FileText,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Brain,
  PlusCircle,
  Plus,
  Shield,
  Activity,
  Mic,
  RefreshCw,
  UserCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onOpenAddPatient: () => void;
}

export function Sidebar({
  currentPath,
  onNavigate,
  collapsed,
  onToggleCollapse,
  onOpenAddPatient,
}: SidebarProps) {
  const { logout, user } = useAuth();
  const role = user?.role || "doctor";

  // Dynamic Navigation Items per Role
  const navItems =
    role === "patient"
      ? [
          { label: "My Health", icon: LayoutDashboard, path: "/dashboard" },
          { label: "Scan History", icon: History, path: "/history" },
          { label: "Voice Phonation", icon: Activity, path: "/analysis/parkinson" },
          { label: "My Reports", icon: FileText, path: "/reports" },
          { label: "My Profile", icon: Settings, path: "/settings" },
        ]
      : role === "admin"
      ? [
          { label: "Command Console", icon: LayoutDashboard, path: "/dashboard" },
          { label: "Users & Doctors", icon: Users, path: "/patients" },
          { label: "AI Model Pipelines", icon: BrainCircuit, path: "/analysis" },
          { label: "Audit & PACS Logs", icon: History, path: "/history" },
          { label: "PACS Reports", icon: FileText, path: "/reports" },
          { label: "System Config", icon: Settings, path: "/settings" },
        ]
      : [
          { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
          { label: "Patients", icon: Users, path: "/patients" },
          { label: "New Analysis", icon: BrainCircuit, path: "/analysis" },
          { label: "History", icon: History, path: "/history" },
          { label: "Reports", icon: FileText, path: "/reports" },
          { label: "Settings", icon: Settings, path: "/settings" },
        ];

  const isActive = (path: string) => {
    if (path === "/dashboard" && (currentPath === "/" || currentPath === "/dashboard")) return true;
    if (path !== "/dashboard" && currentPath.startsWith(path)) return true;
    return false;
  };

  const handleActionClick = () => {
    if (role === "patient") {
      onNavigate("/analysis/parkinson");
    } else if (role === "admin") {
      onNavigate("/settings");
    } else {
      onOpenAddPatient();
    }
  };

  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-screen select-none hidden lg:flex flex-col bg-white border-r border-[#e2e8f0] shadow-sm transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Floating Collapse / Expand Toggle Button on Sidebar Border */}
      <button
        type="button"
        onClick={onToggleCollapse}
        className="hidden lg:flex absolute -right-3.5 top-6 size-7 items-center justify-center rounded-full border border-[#e2e8f0] bg-white text-[#64748b] hover:text-[#0ea5e9] hover:bg-[#f0f9ff] shadow-md transition-all duration-300 hover:scale-110 active:scale-95 z-50 group"
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <div className={`transition-transform duration-300 ${collapsed ? "rotate-0" : "rotate-180"}`}>
          <ChevronRight className="size-4 text-[#64748b] group-hover:text-[#0ea5e9] transition-colors" />
        </div>
      </button>

      {/* Brand Header */}
      <div
        className={`flex items-center h-20 border-b border-[#e2e8f0] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden ${
          collapsed ? "justify-center px-0" : "justify-between px-5"
        }`}
      >
        <div
          className={`flex items-center gap-3 cursor-pointer overflow-hidden transition-all duration-300 ${
            collapsed ? "justify-center" : ""
          }`}
          onClick={() => onNavigate("/dashboard")}
          title="NeuroFusionAI Portal"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#0b1c30] to-[#0ea5e9] text-white shadow-md transition-transform duration-300 hover:scale-105">
            <Brain className="size-5" />
          </div>

          <div
            className={`flex flex-col whitespace-nowrap overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
              collapsed ? "w-0 opacity-0 -translate-x-4 pointer-events-none" : "w-auto opacity-100 translate-x-0"
            }`}
          >
            <span className="font-headline font-extrabold text-base text-[#0b1c30] tracking-tight">
              NeuroFusion<span className="text-[#0ea5e9]">AI</span>
            </span>
            <span className="text-[0.68rem] text-[#64748b] font-medium tracking-wide">
              {role === "patient"
                ? "Patient Health Portal"
                : role === "admin"
                ? "PACS Admin Console"
                : "Clinical AI Portal"}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Action Button */}
      <div className={`p-3 transition-all duration-300 ${collapsed ? "flex justify-center" : ""}`}>
        <button
          type="button"
          onClick={handleActionClick}
          className={`btn-primary shadow-sm transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden group ${
            collapsed
              ? "size-11 p-0 rounded-xl flex items-center justify-center"
              : "w-full py-2.5 px-4"
          }`}
          title={
            role === "patient"
              ? "Take Voice Self-Test"
              : role === "admin"
              ? "Sync PACS Nodes"
              : "Add New Patient Scan"
          }
        >
          {role === "patient" ? (
            <Mic className="size-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
          ) : role === "admin" ? (
            <RefreshCw className="size-4 shrink-0 transition-transform duration-200 group-hover:rotate-180" />
          ) : (
            <Plus className="size-4 shrink-0 transition-transform duration-200 group-hover:rotate-90" />
          )}

          <span
            className={`whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${
              collapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100 ml-1.5"
            }`}
          >
            {role === "patient"
              ? "Record Voice Test"
              : role === "admin"
              ? "Sync PACS Nodes"
              : "New Patient Scan"}
          </span>
        </button>
      </div>

      {/* Main Navigation Links */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <button
              key={item.path}
              type="button"
              onClick={() => onNavigate(item.path)}
              className={`flex items-center rounded-xl text-xs font-semibold transition-all duration-200 ease-out group overflow-hidden ${
                collapsed
                  ? "size-11 mx-auto justify-center p-0"
                  : "w-full gap-3.5 px-3.5 py-3"
              } ${
                active
                  ? "bg-[#e0f2fe] text-[#0284c7] font-bold shadow-xs translate-x-0.5"
                  : "text-[#475569] hover:text-[#0b1c30] hover:bg-[#f1f5f9] hover:translate-x-0.5"
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                className={`size-4.5 shrink-0 transition-all duration-200 ${
                  active
                    ? "text-[#0284c7] scale-105"
                    : "text-[#64748b] group-hover:text-[#0b1c30] group-hover:scale-110"
                }`}
              />
              <span
                className={`whitespace-nowrap overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                  collapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100"
                }`}
              >
                {item.label}
              </span>
              {!collapsed && active && (
                <div className="ml-auto size-1.5 rounded-full bg-[#0ea5e9] animate-pulse" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Profile & Logout Area */}
      <div className="p-3 border-t border-[#e2e8f0] space-y-1 overflow-hidden">
        <button
          type="button"
          onClick={() => onNavigate("/settings")}
          className={`w-full flex items-center rounded-xl hover:bg-[#f1f5f9] transition-all duration-200 text-left overflow-hidden group ${
            collapsed ? "justify-center p-2" : "gap-3 p-2.5"
          }`}
          title={user?.fullName || "User Profile"}
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#0ea5e9]/10 text-[#0284c7] font-bold text-xs border border-[#0ea5e9]/20 shadow-xs transition-transform duration-200 group-hover:scale-105">
            {user?.fullName
              ? user.fullName
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")
              : "US"}
          </div>
          <div
            className={`whitespace-nowrap overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
              collapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100 flex-1 truncate"
            }`}
          >
            <p className="text-xs font-bold text-[#0b1c30] truncate group-hover:text-[#0ea5e9] transition-colors">
              {user?.fullName || "Active User"}
            </p>
            <p className="text-[0.68rem] text-[#64748b] truncate font-mono">
              {user?.medicalLicenseId || "ID-4892"}
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={logout}
          className={`w-full flex items-center rounded-xl text-xs font-semibold text-[#64748b] hover:text-rose-600 hover:bg-rose-50 transition-all duration-200 overflow-hidden group ${
            collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2"
          }`}
          title="Sign out of session"
        >
          <LogOut className="size-4 shrink-0 transition-transform duration-200 group-hover:-translate-x-0.5" />
          <span
            className={`whitespace-nowrap overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
              collapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100"
            }`}
          >
            Sign Out
          </span>
        </button>
      </div>
    </aside>
  );
}
