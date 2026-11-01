import React, { useState, ReactNode } from "react";
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  User,
  Server,
  FileText,
  History,
  Settings,
  LogOut,
  ChevronRight,
  Brain,
  RefreshCw,
  Terminal,
  Activity,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

interface AdminLayoutProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  children: ReactNode;
}

export function AdminLayout({ currentPath, onNavigate, children }: AdminLayoutProps) {
  const { user, logout } = useAuth();
  const { info, success } = useToast();
  const [collapsed, setCollapsed] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const adminName = user?.fullName || "Marcus Vance";
  const adminId = user?.medicalLicenseId || "IT-ADMIN-894";

  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
    { label: "Users", icon: Users, path: "/admin/users" },
    { label: "Doctors", icon: Stethoscope, path: "/admin/doctors" },
    { label: "Patients", icon: User, path: "/admin/patients" },
    { label: "System Status", icon: Server, path: "/admin/system" },
    { label: "Reports", icon: FileText, path: "/admin/reports" },
    { label: "Audit Logs", icon: History, path: "/admin/audit" },
    { label: "Settings", icon: Settings, path: "/admin/settings" },
  ];

  const isActive = (path: string) => {
    if (path === "/admin/dashboard" && (currentPath === "/admin" || currentPath === "/admin/dashboard")) return true;
    if (path !== "/admin/dashboard" && currentPath === path) return true;
    return false;
  };

  const getBreadcrumb = () => {
    if (currentPath === "/admin/dashboard" || currentPath === "/admin") return "Admin Dashboard";
    if (currentPath === "/admin/users") return "User Management";
    if (currentPath === "/admin/doctors") return "Doctor Management";
    if (currentPath === "/admin/patients") return "Patient Management";
    if (currentPath === "/admin/system") return "System Status";
    if (currentPath === "/admin/reports") return "Platform Reports";
    if (currentPath === "/admin/audit") return "Audit Logs";
    if (currentPath === "/admin/settings") return "Settings";
    return "Admin Portal";
  };

  const handleSyncPacs = () => {
    setIsSyncing(true);
    info("PACS Node Ping", "Verifying DICOM association with Orthanc / DCM4CHEE server...");
    setTimeout(() => {
      setIsSyncing(false);
      success("PACS Online", "3,842 imaging series synchronized.");
    }, 1200);
  };

  return (
    <div className="relative min-h-screen w-full bg-[#f8f9ff] text-[#0b1c30] font-sans flex overflow-x-hidden select-none">
      {/* 1. Admin Isolated Left Navigation Rail */}
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
            onClick={() => onNavigate("/admin/dashboard")}
            title="Hospital Admin Portal"
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
              <span className="text-[0.65rem] text-purple-600 font-bold uppercase tracking-wider">
                Admin Portal
              </span>
            </div>
          </div>
        </div>

        {/* Action Button: Sync Nodes */}
        <div className={`p-3 transition-all duration-300 ${collapsed ? "flex justify-center" : ""}`}>
          <button
            type="button"
            disabled={isSyncing}
            onClick={handleSyncPacs}
            className={`btn-primary shadow-sm transition-all duration-300 overflow-hidden group ${
              collapsed
                ? "size-11 p-0 rounded-xl flex items-center justify-center"
                : "w-full py-2.5 px-4"
            }`}
            title="Sync DICOM PACS Nodes"
          >
            <RefreshCw className={`size-4 shrink-0 transition-transform duration-200 ${isSyncing ? "animate-spin" : "group-hover:rotate-180"}`} />
            <span
              className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${
                collapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100 ml-1.5"
              }`}
            >
              {isSyncing ? "Syncing..." : "Sync PACS Nodes"}
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

        {/* Bottom Admin Profile & Logout */}
        <div className="p-3 border-t border-[#e2e8f0] space-y-1 overflow-hidden">
          <button
            type="button"
            onClick={() => onNavigate("/admin/settings")}
            className={`w-full flex items-center rounded-xl hover:bg-[#f1f5f9] transition-all text-left overflow-hidden group ${
              collapsed ? "justify-center p-2" : "gap-3 p-2"
            }`}
            title={adminName}
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700 font-bold text-xs border border-purple-200 shadow-xs">
              {adminName
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
                {adminName}
              </p>
              <p className="text-[0.68rem] text-[#64748b] truncate font-mono">
                {adminId}
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={logout}
            className={`w-full flex items-center rounded-xl text-xs font-semibold text-[#64748b] hover:text-rose-600 hover:bg-rose-50 transition-colors ${
              collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2"
            }`}
            title="Sign out of admin session"
          >
            <LogOut className="size-4 shrink-0" />
            <span
              className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${
                collapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100"
              }`}
            >
              Logout
            </span>
          </button>
        </div>
      </aside>

      {/* 2. Main Admin Workspace */}
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
              onClick={() => onNavigate("/admin/dashboard")}
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
                  onClick={() => onNavigate("/admin/dashboard")}
                >
                  Admin Portal
                </span>
                <ChevronRight className="size-3 text-[#94a3b8]" />
                <span className="text-purple-600 font-semibold truncate">{getBreadcrumb()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="hidden sm:flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-800 font-semibold">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>PACS: <strong>10.0.4.82 Online</strong></span>
            </div>

            <button
              type="button"
              onClick={handleSyncPacs}
              className="btn-secondary hidden sm:flex text-xs font-semibold py-2 px-3.5 shadow-sm"
            >
              <RefreshCw className={`size-3.5 ${isSyncing ? "animate-spin" : ""}`} />
              <span>Sync PACS</span>
            </button>

            <div
              onClick={() => onNavigate("/admin/settings")}
              className="flex items-center gap-2 pl-2 sm:border-l sm:border-[#e2e8f0] cursor-pointer group"
            >
              <div className="flex size-9 sm:size-10 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-extrabold text-xs shadow-sm">
                {adminName
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")}
              </div>
            </div>
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

      {/* 3. Mobile Bottom Nav for Admins */}
      <nav
        aria-label="Admin Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-[#e2e8f0] flex lg:hidden items-center justify-around py-2 px-3 shadow-lg"
      >
        {navItems.slice(0, 5).map((item) => {
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
      </nav>
    </div>
  );
}
