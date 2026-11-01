import React, { useState, ReactNode } from "react";
import {
  LayoutDashboard,
  User,
  History,
  FileText,
  Calendar,
  Bell,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
  Brain,
  Mic,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Modal } from "@/components/common/Modal";

interface PatientLayoutProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  children: ReactNode;
}

export function PatientLayout({ currentPath, onNavigate, children }: PatientLayoutProps) {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const patientName = user?.fullName || "Eleanor Vance";
  const mrn = user?.medicalLicenseId || "MRN-489201";

  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/patient/dashboard" },
    { label: "You", icon: User, path: "/patient/you" },
    { label: "My Results", icon: History, path: "/patient/results" },
    { label: "My Reports", icon: FileText, path: "/patient/reports" },
    { label: "Appointments", icon: Calendar, path: "/patient/appointments" },
    { label: "Notifications", icon: Bell, path: "/patient/notifications" },
    { label: "Settings", icon: Settings, path: "/patient/settings" },
    { label: "Help", icon: HelpCircle, path: "/patient/help" },
  ];

  const isActive = (path: string) => {
    if (path === "/patient/dashboard" && (currentPath === "/patient" || currentPath === "/patient/dashboard")) return true;
    if (path !== "/patient/dashboard" && currentPath === path) return true;
    return false;
  };

  const getBreadcrumb = () => {
    if (currentPath === "/patient/dashboard" || currentPath === "/patient") return "Personal Health Dashboard";
    if (currentPath === "/patient/you") return "You (Patient Profile)";
    if (currentPath === "/patient/results") return "My Results";
    if (currentPath === "/patient/reports") return "My Reports";
    if (currentPath === "/patient/appointments") return "Appointments";
    if (currentPath === "/patient/notifications") return "Notifications";
    if (currentPath === "/patient/settings") return "Patient Settings";
    if (currentPath === "/patient/help") return "Help & Guidance";
    return "Patient Portal";
  };

  const handleConfirmLogout = () => {
    setIsLogoutModalOpen(false);
    logout();
  };

  return (
    <div className="relative min-h-screen w-full bg-[#f8f9ff] text-[#0b1c30] font-sans flex overflow-x-hidden select-none">
      {/* 1. Patient Isolated Left Navigation Rail */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen select-none hidden lg:flex flex-col bg-white border-r border-[#e2e8f0] shadow-sm transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Collapse Toggle Button */}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex absolute -right-3.5 top-6 size-7 items-center justify-center rounded-full border border-[#e2e8f0] bg-white text-[#64748b] hover:text-[#0ea5e9] hover:bg-[#f0f9ff] shadow-md transition-all duration-300 hover:scale-110 active:scale-95 z-50 group"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <div className={`transition-transform duration-300 ${collapsed ? "rotate-0" : "rotate-180"}`}>
            <ChevronRight className="size-4 text-[#64748b] group-hover:text-[#0ea5e9] transition-colors" />
          </div>
        </button>

        {/* Brand Header */}
        <div
          className={`flex items-center h-20 border-b border-[#e2e8f0] transition-all duration-300 overflow-hidden ${
            collapsed ? "justify-center px-0" : "justify-between px-5"
          }`}
        >
          <div
            className={`flex items-center gap-3 cursor-pointer overflow-hidden ${collapsed ? "justify-center" : ""}`}
            onClick={() => onNavigate("/patient/dashboard")}
            title="Patient Portal"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#0b1c30] to-[#0ea5e9] text-white shadow-md">
              <Brain className="size-5" />
            </div>

            <div
              className={`flex flex-col whitespace-nowrap overflow-hidden transition-all duration-300 ${
                collapsed ? "w-0 opacity-0 -translate-x-4 pointer-events-none" : "w-auto opacity-100 translate-x-0"
              }`}
            >
              <span className="font-headline font-extrabold text-base text-[#0b1c30] tracking-tight">
                NeuroFusion<span className="text-[#0ea5e9]">AI</span>
              </span>
              <span className="text-[0.65rem] text-[#0ea5e9] font-bold uppercase tracking-wider">
                Patient Portal
              </span>
            </div>
          </div>
        </div>

        {/* Action Button: You Profile */}
        <div className={`p-3 transition-all duration-300 ${collapsed ? "flex justify-center" : ""}`}>
          <button
            type="button"
            onClick={() => onNavigate("/patient/you")}
            className={`btn-primary shadow-sm transition-all duration-300 overflow-hidden group ${
              collapsed
                ? "size-11 p-0 rounded-xl flex items-center justify-center"
                : "w-full py-2.5 px-4"
            }`}
            title="View Your Profile & Health"
          >
            <User className="size-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
            <span
              className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${
                collapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100 ml-1.5"
              }`}
            >
              Your Health Profile
            </span>
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <button
                key={item.path}
                type="button"
                onClick={() => onNavigate(item.path)}
                className={`flex items-center rounded-xl text-xs font-semibold transition-all duration-200 group overflow-hidden ${
                  collapsed ? "size-11 mx-auto justify-center p-0" : "w-full gap-3 px-3 py-2.5"
                } ${
                  active
                    ? "bg-[#e0f2fe] text-[#0284c7] font-bold shadow-xs translate-x-0.5"
                    : "text-[#475569] hover:text-[#0b1c30] hover:bg-[#f1f5f9] hover:translate-x-0.5"
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon
                  className={`size-4.5 shrink-0 transition-all duration-200 ${
                    active ? "text-[#0284c7] scale-105" : "text-[#64748b] group-hover:text-[#0b1c30] group-hover:scale-110"
                  }`}
                />
                <span
                  className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${
                    collapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100 truncate"
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

        {/* Bottom Patient Profile & Logout */}
        <div className="p-3 border-t border-[#e2e8f0] space-y-1 overflow-hidden">
          <button
            type="button"
            onClick={() => onNavigate("/patient/you")}
            className={`w-full flex items-center rounded-xl hover:bg-[#f1f5f9] transition-all text-left overflow-hidden group ${
              collapsed ? "justify-center p-2" : "gap-3 p-2"
            }`}
            title={patientName}
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#0ea5e9]/10 text-[#0284c7] font-bold text-xs border border-[#0ea5e9]/20 shadow-xs">
              {patientName
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")}
            </div>
            <div
              className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${
                collapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100 flex-1 truncate"
              }`}
            >
              <p className="text-xs font-bold text-[#0b1c30] truncate group-hover:text-[#0ea5e9] transition-colors">
                {patientName}
              </p>
              <p className="text-[0.68rem] text-[#64748b] truncate font-mono">
                {mrn}
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setIsLogoutModalOpen(true)}
            className={`w-full flex items-center rounded-xl text-xs font-semibold text-[#64748b] hover:text-rose-600 hover:bg-rose-50 transition-colors ${
              collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2"
            }`}
            title="Sign out of patient session"
          >
            <LogOut className="size-4 shrink-0 text-rose-500" />
            <span
              className={`whitespace-nowrap overflow-hidden transition-all duration-300 text-rose-600 font-bold ${
                collapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100"
              }`}
            >
              Logout
            </span>
          </button>
        </div>
      </aside>

      {/* 2. Main Patient Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header
          className={`sticky top-0 z-30 flex h-16 sm:h-20 items-center justify-between border-b border-[#e2e8f0] bg-white/95 px-4 sm:px-6 backdrop-blur-md transition-all duration-300 shadow-xs ${
            collapsed ? "lg:ml-20" : "lg:ml-64"
          }`}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
            <button
              type="button"
              onClick={() => onNavigate("/patient/dashboard")}
              className="flex lg:hidden size-9 sm:size-10 shrink-0 items-center justify-center rounded-xl border border-[#e2e8f0] bg-white text-[#475569] hover:bg-[#f8f9ff]"
              aria-label="Open menu"
            >
              <Brain className="size-5 text-[#0b1c30]" />
            </button>

            <div className="flex flex-col min-w-0">
              <h1 className="font-headline text-base sm:text-lg font-extrabold text-[#0b1c30] tracking-tight truncate leading-tight">
                {getBreadcrumb()}
              </h1>
              <div className="hidden sm:flex items-center gap-1.5 text-[0.68rem] font-medium text-[#64748b] truncate mt-0.5">
                <span
                  className="cursor-pointer hover:text-[#0ea5e9] transition-colors"
                  onClick={() => onNavigate("/patient/dashboard")}
                >
                  Patient Portal
                </span>
                <ChevronRight className="size-3 text-[#94a3b8]" />
                <span className="text-[#0ea5e9] font-semibold truncate">{getBreadcrumb()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="hidden sm:flex items-center gap-2 rounded-xl border border-[#0ea5e9]/30 bg-[#f0f9ff] px-3 py-1.5 text-xs text-[#0284c7] font-semibold">
              <ShieldCheck className="size-3.5 text-[#0ea5e9]" />
              <span>Record ID: <strong>{mrn}</strong></span>
            </div>

            <button
              type="button"
              onClick={() => onNavigate("/patient/notifications")}
              className="relative flex size-9 sm:size-10 items-center justify-center rounded-xl border border-[#e2e8f0] bg-white text-[#475569] hover:bg-[#f8f9ff]"
              title="Notifications"
            >
              <Bell className="size-4" />
              <span className="absolute top-2 right-2 size-2 rounded-full bg-[#0ea5e9] ring-2 ring-white" />
            </button>

            <div
              onClick={() => onNavigate("/patient/you")}
              className="flex items-center gap-2 pl-2 sm:border-l sm:border-[#e2e8f0] cursor-pointer group"
              title="View Your Profile"
            >
              <div className="flex size-9 sm:size-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#0ea5e9] to-[#0284c7] text-white font-extrabold text-xs shadow-sm">
                {patientName
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")}
              </div>
            </div>

            {/* Prominent Header Sign Out Button for Patients */}
            <button
              type="button"
              onClick={() => setIsLogoutModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 px-3 py-2 text-xs font-bold transition-all shadow-xs"
              title="Logout from Patient Portal"
            >
              <LogOut className="size-3.5 text-rose-600" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>

        {/* Content View Canvas */}
        <main
          className={`flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 transition-all duration-300 ${
            collapsed ? "lg:ml-20" : "lg:ml-64"
          }`}
        >
          <div className="max-w-7xl 2xl:max-w-[1700px] 3xl:max-w-[2100px] mx-auto w-full">
            {children}
          </div>
        </main>
      </div>

      {/* 3. Mobile Bottom Nav for Patients */}
      <nav
        aria-label="Patient Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-[#e2e8f0] flex lg:hidden items-center justify-around py-2 px-3 shadow-lg"
      >
        {navItems.slice(0, 4).map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <button
              key={item.path}
              type="button"
              onClick={() => onNavigate(item.path)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl ${
                active ? "text-[#0ea5e9] font-bold" : "text-[#64748b]"
              }`}
            >
              <Icon className={`size-5 ${active ? "text-[#0ea5e9] stroke-[2.5]" : ""}`} />
              <span className="text-[0.62rem] mt-0.5 truncate max-w-[60px]">{item.label}</span>
            </button>
          );
        })}

        {/* Mobile Sign Out Action */}
        <button
          type="button"
          onClick={() => setIsLogoutModalOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-rose-600 font-bold"
          title="Sign Out"
        >
          <LogOut className="size-5 text-rose-600" />
          <span className="text-[0.62rem] mt-0.5 truncate max-w-[60px]">Logout</span>
        </button>
      </nav>

      {/* 4. Patient Logout Confirmation Modal */}
      <Modal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        maxWidth="md"
      >
        <div className="p-6 text-center space-y-4 select-none">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-200">
            <LogOut className="size-7" />
          </div>

          <div className="space-y-1">
            <h3 className="font-headline font-extrabold text-xl text-[#0b1c30]">
              Sign Out of Patient Portal?
            </h3>
            <p className="text-xs text-[#64748b]">
              Are you sure you want to end your current session for <strong>{patientName}</strong>?
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsLogoutModalOpen(false)}
              className="btn-secondary flex-1 py-2.5 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmLogout}
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white flex-1 py-2.5 text-xs font-bold shadow-md transition-colors"
            >
              Confirm Sign Out
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
