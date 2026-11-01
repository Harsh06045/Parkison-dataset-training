import React, { useState, useEffect } from "react";
import { User } from "@/lib/authService";
import {
  doctorService,
  DashboardStats,
  DoctorNotification,
  DiagnosticReport,
  Patient,
  MriScan,
  DoctorProfile,
} from "@/lib/doctorService";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  UserCog,
  UserPlus,
  UploadCloud,
  Bell,
  Stethoscope,
  ChevronRight,
  ShieldCheck,
  Search,
  Sparkles,
} from "lucide-react";

import { DoctorOverviewTab } from "./DoctorOverviewTab";
import { PatientListTab } from "./PatientListTab";
import { PatientDetailsTab } from "./PatientDetailsTab";
import { DoctorProfileTab } from "./DoctorProfileTab";

import { AddPatientModal } from "./AddPatientModal";
import { MriUploadModal } from "./MriUploadModal";
import { PredictionModal } from "./PredictionModal";
import { ReportModal } from "./ReportModal";

interface DoctorDashboardViewProps {
  user: User;
  onLogout: () => void;
}

export type DoctorTab = "overview" | "patients" | "patient_details" | "profile";

export function DoctorDashboardView({ user, onLogout }: DoctorDashboardViewProps) {
  const [activeTab, setActiveTab] = useState<DoctorTab>("overview");

  // State loaded from doctorService
  const [stats, setStats] = useState<DashboardStats>(doctorService.getDashboardStatistics());
  const [patients, setPatients] = useState<Patient[]>(doctorService.getPatients());
  const [notifications, setNotifications] = useState<DoctorNotification[]>(doctorService.getNotifications());
  const [reports, setReports] = useState<DiagnosticReport[]>(doctorService.getReports());
  const [profile, setProfile] = useState<DoctorProfile>(doctorService.getDoctorProfile());

  // Selected state for details & modals
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedScanForPrediction, setSelectedScanForPrediction] = useState<MriScan | null>(null);
  const [selectedReportForView, setSelectedReportForView] = useState<DiagnosticReport | null>(null);

  // Modals state
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
  const [isUploadScanOpen, setIsUploadScanOpen] = useState(false);
  const [uploadTargetPatient, setUploadTargetPatient] = useState<Patient | undefined>(undefined);
  const [isPredictionOpen, setIsPredictionOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  const refreshAllData = () => {
    setStats(doctorService.getDashboardStatistics());
    setPatients(doctorService.getPatients());
    setNotifications(doctorService.getNotifications());
    setReports(doctorService.getReports());
    setProfile(doctorService.getDoctorProfile());
  };

  const changeTab = (tab: DoctorTab, replace = false) => {
    setActiveTab(tab);
    const hash = `#dashboard/${tab}`;
    const state = { view: "dashboard", tab };
    if (replace) {
      window.history.replaceState(state, "", hash);
    } else {
      window.history.pushState(state, "", hash);
    }
  };

  useEffect(() => {
    refreshAllData();

    const handlePopState = (e: PopStateEvent) => {
      if (e.state && e.state.tab) {
        setActiveTab(e.state.tab as DoctorTab);
      } else {
        const parts = window.location.hash.replace("#", "").split("/");
        if (parts[0] === "dashboard" && parts[1]) {
          setActiveTab(parts[1] as DoctorTab);
        } else {
          setActiveTab("overview");
        }
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    changeTab("patient_details");
  };

  const handleOpenUploadForPatient = (patient?: Patient) => {
    setUploadTargetPatient(patient || patients[0]);
    setIsUploadScanOpen(true);
  };

  const handleUploadSuccess = (scan: MriScan) => {
    refreshAllData();
  };

  const handleOpenPrediction = (scan: MriScan) => {
    setSelectedScanForPrediction(scan);
    setIsPredictionOpen(true);
  };

  const handlePredictionComplete = (updatedScan: MriScan) => {
    refreshAllData();
  };

  const handleGenerateReport = (scanId: string) => {
    const report = doctorService.generateReport(scanId);
    refreshAllData();
    setSelectedReportForView(report);
    setIsReportOpen(true);
  };

  const handleViewReport = (report: DiagnosticReport) => {
    setSelectedReportForView(report);
    setIsReportOpen(true);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 text-white select-none space-y-6">
      {/* 1. DOCTOR WORKSPACE TOP BAR */}
      <div className="rounded-3xl border border-blue-500/30 bg-[#060919]/90 p-5 sm:p-6 backdrop-blur-2xl shadow-[0_15px_40px_rgba(0,0,0,0.6)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-900 to-blue-950 border border-blue-500/40 text-blue-400 shadow-md">
            <Stethoscope className="size-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-extrabold text-white">{profile.fullName}</h1>
              <span className="rounded-full bg-blue-500/20 border border-blue-500/40 px-3 py-0.5 text-xs font-semibold text-blue-300 uppercase tracking-wider">
                Doctor Workspace
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              License ID: <strong className="text-slate-300 font-mono">{profile.medicalLicenseId}</strong> • {profile.hospital}
            </p>
          </div>
        </div>

        {/* Workspace Controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={() => handleOpenUploadForPatient()}
            className="h-10 rounded-xl bg-purple-600 px-4 text-xs font-bold text-white shadow-md hover:bg-purple-500 transition-all flex items-center gap-2"
          >
            <UploadCloud className="size-4" />
            <span>Upload MRI Scan</span>
          </button>

          <button
            onClick={() => setIsAddPatientOpen(true)}
            className="h-10 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white shadow-md hover:bg-blue-500 transition-all flex items-center gap-2"
          >
            <UserPlus className="size-4" />
            <span>Add Patient</span>
          </button>
        </div>
      </div>

      {/* 2. SUB-NAVIGATION TABS */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          <button
            type="button"
            onClick={() => changeTab("overview")}
            className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all ${
              activeTab === "overview"
                ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                : "bg-slate-900/60 border border-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <LayoutDashboard className="size-4" />
            <span>Dashboard Overview</span>
          </button>

          <button
            type="button"
            onClick={() => changeTab("patients")}
            className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all ${
              activeTab === "patients"
                ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                : "bg-slate-900/60 border border-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <Users className="size-4" />
            <span>Patient List ({patients.length})</span>
          </button>

          {selectedPatient && (
            <button
              type="button"
              onClick={() => changeTab("patient_details")}
              className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all ${
                activeTab === "patient_details"
                  ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                  : "bg-slate-900/60 border border-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <UserCheck className="size-4" />
              <span>Patient: {selectedPatient.fullName}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => changeTab("profile")}
            className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all ${
              activeTab === "profile"
                ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                : "bg-slate-900/60 border border-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <ShieldCheck className="size-4" />
            <span>Doctor Profile</span>
          </button>
        </div>
      </div>

      {/* 3. DYNAMIC TAB CONTENT */}
      {activeTab === "overview" && (
        <DoctorOverviewTab
          stats={stats}
          notifications={notifications}
          reports={reports}
          onOpenUpload={() => handleOpenUploadForPatient()}
          onViewReport={handleViewReport}
          onNavigateToPatients={() => changeTab("patients")}
          onRefreshData={refreshAllData}
        />
      )}

      {activeTab === "patients" && (
        <PatientListTab
          patients={patients}
          onSelectPatient={handleSelectPatient}
          onOpenAddPatient={() => setIsAddPatientOpen(true)}
          onOpenUploadScan={(p) => handleOpenUploadForPatient(p)}
        />
      )}

      {activeTab === "patient_details" && selectedPatient && (
        <PatientDetailsTab
          patient={selectedPatient}
          onBack={() => changeTab("patients")}
          onOpenUploadScan={(p) => handleOpenUploadForPatient(p)}
          onOpenPrediction={handleOpenPrediction}
          onGenerateReport={handleGenerateReport}
          onViewReport={handleViewReport}
        />
      )}

      {activeTab === "profile" && (
        <DoctorProfileTab
          profile={profile}
          onProfileUpdated={refreshAllData}
        />
      )}

      {/* 4. WORKSPACE MODALS */}
      <AddPatientModal
        isOpen={isAddPatientOpen}
        onClose={() => setIsAddPatientOpen(false)}
        onPatientAdded={refreshAllData}
      />

      <MriUploadModal
        isOpen={isUploadScanOpen}
        onClose={() => setIsUploadScanOpen(false)}
        patient={uploadTargetPatient}
        onUploadSuccess={handleUploadSuccess}
      />

      <PredictionModal
        isOpen={isPredictionOpen}
        onClose={() => setIsPredictionOpen(false)}
        scan={selectedScanForPrediction}
        onPredictionComplete={handlePredictionComplete}
      />

      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        report={selectedReportForView}
      />
    </div>
  );
}
