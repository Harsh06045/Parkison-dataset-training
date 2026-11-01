import React, { useState, ReactNode } from "react";
import {
  LayoutDashboard,
  Users,
  BrainCircuit,
  History,
  FileText,
  Settings,
  Plus,
  X,
  Brain,
  Shield,
  LogOut,
} from "lucide-react";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";
import { Modal } from "./Modal";
import { useAuth } from "@/context/AuthContext";
import { usePatient } from "@/context/PatientContext";
import { AddPatientModalContent } from "@/components/patients/AddPatientModalContent";

interface AppLayoutProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  children: ReactNode;
}

export function AppLayout({ currentPath, onNavigate, children }: AppLayoutProps) {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isAddPatientModalOpen, setIsAddPatientModalOpen] = useState(false);

  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { label: "Patients", icon: Users, path: "/patients" },
    { label: "New Scan", icon: BrainCircuit, path: "/analysis" },
    { label: "History", icon: History, path: "/history" },
    { label: "Settings", icon: Settings, path: "/settings" },
  ];

  const isActive = (path: string) => {
    if (path === "/dashboard" && (currentPath === "/" || currentPath === "/dashboard")) return true;
    if (path !== "/dashboard" && currentPath.startsWith(path)) return true;
    return false;
  };

  const handleMobileNav = (path: string) => {
    setIsMobileDrawerOpen(false);
    onNavigate(path);
  };

  return (
    <div className="relative min-h-screen w-full bg-[#f8f9ff] text-[#0b1c30] font-sans flex overflow-x-hidden">
      {/* 1. Desktop & Tablet Sidebar */}
      <Sidebar
        currentPath={currentPath}
        onNavigate={onNavigate}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        onOpenAddPatient={() => setIsAddPatientModalOpen(true)}
      />

      {/* 2. Main Content Canvas */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Navbar */}
        <TopNav
          currentPath={currentPath}
          onNavigate={onNavigate}
          collapsed={collapsed}
          onToggleMobile={() => setIsMobileDrawerOpen(true)}
          onOpenAddPatient={() => setIsAddPatientModalOpen(true)}
        />

        {/* Content View Canvas (Scalable for Mobile, Tablet, Laptop, Desktop, 2K/4K TV) */}
        <main
          className={`flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 transition-all duration-300 ${
            collapsed ? "lg:ml-20" : "lg:ml-64"
          }`}
        >
          <div className="max-w-7xl 2xl:max-w-[1700px] 3xl:max-w-[2100px] 4k:max-w-[2500px] mx-auto w-full">
            {children}
          </div>
        </main>
      </div>

      {/* 3. Mobile Phone Bottom Navigation Bar (Phone 320px–480px / Touch Friendly) */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-[#e2e8f0] flex lg:hidden items-center justify-around py-2 px-3 shadow-[0_-4px_16px_rgba(15,23,42,0.06)]"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          const isScanButton = item.path === "/analysis";

          if (isScanButton) {
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => onNavigate(item.path)}
                className="flex flex-col items-center justify-center -mt-5"
                title="Start New Analysis"
              >
                <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#0b1c30] to-[#0ea5e9] text-white shadow-lg shadow-[#0ea5e9]/30 hover:scale-105 transition-transform">
                  <BrainCircuit className="size-6" />
                </div>
                <span className="text-[0.62rem] font-bold text-[#0ea5e9] mt-0.5">Scan</span>
              </button>
            );
          }

          return (
            <button
              key={item.path}
              type="button"
              onClick={() => onNavigate(item.path)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all min-w-[54px] ${
                active ? "text-[#0ea5e9] font-bold" : "text-[#64748b] hover:text-[#0b1c30]"
              }`}
            >
              <Icon className={`size-5 ${active ? "text-[#0ea5e9] stroke-[2.5]" : ""}`} />
              <span className="text-[0.62rem] mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* 4. Mobile & Tablet Slide-Over Drawer Menu */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileDrawerOpen(false)}
          />

          {/* Drawer Menu */}
          <div className="relative w-72 max-w-[80vw] bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#e2e8f0]">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#0b1c30] to-[#0ea5e9] text-white shadow-md">
                  <Brain className="size-5" />
                </div>
                <div>
                  <span className="font-headline font-extrabold text-base text-[#0b1c30]">
                    NeuroFusion<span className="text-[#0ea5e9]">AI</span>
                  </span>
                  <span className="text-[0.65rem] text-[#64748b] block">Clinical Portal</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="flex size-8 items-center justify-center rounded-lg hover:bg-slate-100 text-[#64748b]"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Quick Action Button */}
            <div className="p-4 border-b border-[#e2e8f0]">
              <button
                type="button"
                onClick={() => {
                  setIsMobileDrawerOpen(false);
                  setIsAddPatientModalOpen(true);
                }}
                className="btn-primary w-full py-2.5 text-xs font-bold"
              >
                <Plus className="size-4" />
                <span>New Patient Scan</span>
              </button>
            </div>

            {/* Nav Links */}
            <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto text-xs">
              {[
                { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
                { label: "Patients", icon: Users, path: "/patients" },
                { label: "New Analysis", icon: BrainCircuit, path: "/analysis" },
                { label: "History Registry", icon: History, path: "/history" },
                { label: "Diagnostic Reports", icon: FileText, path: "/reports" },
                { label: "Settings & Profile", icon: Settings, path: "/settings" },
              ].map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);

                return (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => handleMobileNav(item.path)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl font-semibold transition-all ${
                      active
                        ? "bg-[#e0f2fe] text-[#0284c7] font-bold"
                        : "text-[#475569] hover:bg-[#f8f9ff] hover:text-[#0b1c30]"
                    }`}
                  >
                    <Icon className="size-4.5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Drawer Doctor Footer */}
            <div className="p-4 border-t border-[#e2e8f0] space-y-2">
              <div className="flex items-center gap-3 p-2 rounded-xl bg-[#f8f9ff]">
                <div className="flex size-9 items-center justify-center rounded-xl bg-[#0ea5e9]/10 text-[#0284c7] font-bold text-xs">
                  {user?.fullName
                    ? user.fullName
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")
                    : "SJ"}
                </div>
                <div className="flex-1 truncate text-xs">
                  <p className="font-bold text-[#0b1c30] truncate">{user?.fullName || "Dr. Sarah Jenkins"}</p>
                  <p className="text-[0.65rem] text-[#64748b] font-mono">{user?.medicalLicenseId || "MD-98472-NEURO"}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={logout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <LogOut className="size-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Modal Dialog for Registering Patient */}
      <Modal
        isOpen={isAddPatientModalOpen}
        onClose={() => setIsAddPatientModalOpen(false)}
        maxWidth="2xl"
      >
        <AddPatientModalContent
          onClose={() => setIsAddPatientModalOpen(false)}
          onCreated={(newPatient) => {
            setIsAddPatientModalOpen(false);
            onNavigate(`/patients/${newPatient.id}`);
          }}
        />
      </Modal>
    </div>
  );
}
