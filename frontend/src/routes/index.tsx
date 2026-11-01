import React, { useState, useEffect } from "react";
import { ToastProvider } from "@/context/ToastContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { PatientProvider, usePatient } from "@/context/PatientContext";
import { LoginPage } from "@/pages/LoginPage";
import { AccessRestrictedPage } from "@/pages/AccessRestrictedPage";

// 1. Doctor Portal Components & Pages
import { DoctorLayout } from "@/components/layout/DoctorLayout";
import { DoctorDashboardView } from "@/components/dashboard/DoctorDashboardView";
import { PatientsPage } from "@/pages/PatientsPage";
import { PatientDetailsPage } from "@/pages/PatientDetailsPage";
import { DiseaseSelectionPage } from "@/pages/DiseaseSelectionPage";
import { AlzheimerAnalysisPage } from "@/pages/AlzheimerAnalysisPage";
import { ParkinsonAnalysisPage } from "@/pages/ParkinsonAnalysisPage";
import { ResultDetailsPage } from "@/pages/ResultDetailsPage";
import { HistoryPage } from "@/pages/HistoryPage";
import { ReportsPage } from "@/pages/ReportsPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { DoctorNotificationsPage } from "@/pages/doctor/DoctorNotificationsPage";

// 2. Patient Portal Components & Pages
import { PatientLayout } from "@/components/layout/PatientLayout";
import { PatientDashboardView } from "@/components/dashboard/PatientDashboardView";
import { PatientYouPage } from "@/pages/patient/PatientYouPage";
import { PatientResultsPage } from "@/pages/patient/PatientResultsPage";
import { PatientReportsPage } from "@/pages/patient/PatientReportsPage";
import { PatientAppointmentsPage } from "@/pages/patient/PatientAppointmentsPage";
import { PatientNotificationsPage } from "@/pages/patient/PatientNotificationsPage";
import { PatientHelpPage } from "@/pages/patient/PatientHelpPage";

// 3. Hospital Admin Portal Components & Pages
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AdminDashboardView } from "@/components/dashboard/AdminDashboardView";
import { AdminUsersPage } from "@/pages/admin/AdminUsersPage";
import { AdminDoctorsPage } from "@/pages/admin/AdminDoctorsPage";
import { AdminPatientsPage } from "@/pages/admin/AdminPatientsPage";
import { AdminSystemStatusPage } from "@/pages/admin/AdminSystemStatusPage";
import { AdminAuditPage } from "@/pages/admin/AdminAuditPage";

import { PatientRecord } from "@/services/patientApi";
import { UnifiedHistoryItem } from "@/hooks/useAnalysis";

export function MainAppShell() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { selectedPatient, selectPatient } = usePatient();
  const [currentPath, setCurrentPath] = useState<string>("/login");

  // Sync hash routing & enforce initial portal redirect based on authenticated role
  useEffect(() => {
    const parseHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (!hash || hash === "/" || hash === "/dashboard" || hash === "/login" || hash === "/settings" || hash === "settings") {
        if (isAuthenticated && user) {
          const role = user.role || "doctor";
          const defaultPath =
            role === "patient"
              ? "/patient/dashboard"
              : role === "admin"
              ? "/admin/dashboard"
              : "/doctor/dashboard";
          setCurrentPath(defaultPath);
          window.history.replaceState({ path: defaultPath }, "", `#${defaultPath}`);
        } else {
          setCurrentPath("/login");
        }
      } else {
        const cleanPath = hash.startsWith("/") ? hash : `/${hash}`;
        setCurrentPath(cleanPath);
      }
    };

    parseHash();
    window.addEventListener("popstate", parseHash);
    window.addEventListener("hashchange", parseHash);
    return () => {
      window.removeEventListener("popstate", parseHash);
      window.removeEventListener("hashchange", parseHash);
    };
  }, [user, isAuthenticated]);

  const navigateTo = (path: string, replace = false) => {
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    setCurrentPath(cleanPath);
    const hash = `#${cleanPath}`;
    if (replace) {
      window.history.replaceState({ path: cleanPath }, "", hash);
    } else {
      window.history.pushState({ path: cleanPath }, "", hash);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // If unauthenticated, show multi-tenant Login Page
  if (!isAuthenticated && !isLoading) {
    return <LoginPage onSuccessNavigate={(target) => navigateTo(target)} />;
  }

  const role = user?.role || "doctor";

  // =========================================================================
  // 1. DOCTOR PORTAL ROUTE HANDLER (Strict Role Isolation)
  // =========================================================================
  if (currentPath.startsWith("/doctor")) {
    if (role !== "doctor") {
      // Access Denied: Render Access Restricted in user's own layout
      if (role === "patient") {
        return (
          <PatientLayout currentPath={currentPath} onNavigate={navigateTo}>
            <AccessRestrictedPage requiredRole="doctor" onNavigate={navigateTo} />
          </PatientLayout>
        );
      }
      return (
        <AdminLayout currentPath={currentPath} onNavigate={navigateTo}>
          <AccessRestrictedPage requiredRole="doctor" onNavigate={navigateTo} />
        </AdminLayout>
      );
    }

    const renderDoctorContent = () => {
      // /doctor/patients/:id
      if (currentPath.startsWith("/doctor/patients/")) {
        const patientId = currentPath.split("/doctor/patients/")[1];
        const patient = selectedPatient?.id === patientId ? selectedPatient : null;

        return (
          <PatientDetailsPage
            patient={
              patient ||
              selectedPatient || {
                id: patientId || "PAT-1082",
                fullName: "Robert Davis",
                age: 68,
                gender: "Male",
                dateOfBirth: "1958-03-14",
                contactNumber: "+1 (555) 234-5678",
                email: "robert.davis@example.com",
                riskLevel: "High",
                primaryDiagnosis: "Alzheimer's Disease",
                stage: "Mild Dementia",
                lastAnalysisDate: "2026-08-18",
                totalAnalyses: 4,
                medicalHistory: "Progressive short-term memory deficit noted over past 10 months.",
                attendingPhysician: "Dr. Sarah Jenkins, MD",
              }
            }
            onBack={() => navigateTo("/doctor/patients")}
            onStartAlzheimer={() => navigateTo("/doctor/analysis/alzheimer")}
            onStartParkinson={() => navigateTo("/doctor/analysis/parkinson")}
            onViewResult={(analysis) => navigateTo(`/doctor/results/${analysis.id}`)}
          />
        );
      }

      // /doctor/results/:id
      if (currentPath.startsWith("/doctor/results/")) {
        const analysisId = currentPath.split("/doctor/results/")[1];
        return (
          <ResultDetailsPage
            analysisId={analysisId}
            onBack={() => navigateTo("/doctor/history")}
            onNavigateToReports={() => navigateTo("/doctor/reports")}
            onAnalyzeAgain={() => navigateTo("/doctor/analysis")}
          />
        );
      }

      // /doctor/reports/:id
      if (currentPath.startsWith("/doctor/reports/")) {
        const reportId = currentPath.split("/doctor/reports/")[1];
        return <ReportsPage initialReportId={reportId} />;
      }

      switch (currentPath) {
        case "/doctor":
        case "/doctor/dashboard":
          return (
            <DoctorDashboardView
              onNavigate={navigateTo}
              onOpenAddPatient={() => {}}
              onViewAnalysisResult={(analysis) => navigateTo(`/doctor/results/${analysis.id}`)}
            />
          );
        case "/doctor/patients":
          return (
            <PatientsPage
              onSelectPatient={(patient: PatientRecord) => {
                selectPatient(patient);
                navigateTo(`/doctor/patients/${patient.id}`);
              }}
              onStartAnalysisForPatient={(patient: PatientRecord) => {
                selectPatient(patient);
                navigateTo("/doctor/analysis");
              }}
              onOpenAddPatient={() => {}}
            />
          );
        case "/doctor/analysis":
          return (
            <DiseaseSelectionPage
              onSelectAlzheimer={() => navigateTo("/doctor/analysis/alzheimer")}
              onSelectParkinson={() => navigateTo("/doctor/analysis/parkinson")}
            />
          );
        case "/doctor/analysis/alzheimer":
          return (
            <AlzheimerAnalysisPage
              onBack={() => navigateTo("/doctor/analysis")}
              onNavigateToReports={() => navigateTo("/doctor/reports")}
            />
          );
        case "/doctor/analysis/parkinson":
          return (
            <ParkinsonAnalysisPage
              onBack={() => navigateTo("/doctor/analysis")}
              onNavigateToReports={() => navigateTo("/doctor/reports")}
            />
          );
        case "/doctor/history":
          return (
            <HistoryPage
              onViewAnalysis={(analysis: UnifiedHistoryItem) => navigateTo(`/doctor/results/${analysis.id}`)}
            />
          );
        case "/doctor/reports":
          return <ReportsPage />;
        case "/doctor/notifications":
          return <DoctorNotificationsPage onNavigate={navigateTo} />;
        case "/doctor/settings":
          return <SettingsPage />;
        default:
          return (
            <DoctorDashboardView
              onNavigate={navigateTo}
              onOpenAddPatient={() => {}}
              onViewAnalysisResult={(analysis) => navigateTo(`/doctor/results/${analysis.id}`)}
            />
          );
      }
    };

    return (
      <DoctorLayout currentPath={currentPath} onNavigate={navigateTo}>
        {renderDoctorContent()}
      </DoctorLayout>
    );
  }

  // =========================================================================
  // 2. PATIENT PORTAL ROUTE HANDLER (Strict Role Isolation)
  // =========================================================================
  if (currentPath.startsWith("/patient")) {
    if (role !== "patient") {
      // Access Denied: Render Access Restricted in user's own layout
      if (role === "doctor") {
        return (
          <DoctorLayout currentPath={currentPath} onNavigate={navigateTo}>
            <AccessRestrictedPage requiredRole="patient" onNavigate={navigateTo} />
          </DoctorLayout>
        );
      }
      return (
        <AdminLayout currentPath={currentPath} onNavigate={navigateTo}>
          <AccessRestrictedPage requiredRole="patient" onNavigate={navigateTo} />
        </AdminLayout>
      );
    }

    const renderPatientContent = () => {
      switch (currentPath) {
        case "/patient":
        case "/patient/dashboard":
          return <PatientDashboardView onNavigate={navigateTo} />;
        case "/patient/you":
          return <PatientYouPage onNavigate={navigateTo} />;
        case "/patient/results":
          return <PatientResultsPage onNavigate={navigateTo} />;
        case "/patient/reports":
          return <PatientReportsPage onNavigate={navigateTo} />;
        case "/patient/appointments":
          return <PatientAppointmentsPage onNavigate={navigateTo} />;
        case "/patient/notifications":
          return <PatientNotificationsPage onNavigate={navigateTo} />;
        case "/patient/settings":
          return <SettingsPage />;
        case "/patient/help":
          return <PatientHelpPage onNavigate={navigateTo} />;
        default:
          return <PatientDashboardView onNavigate={navigateTo} />;
      }
    };

    return (
      <PatientLayout currentPath={currentPath} onNavigate={navigateTo}>
        {renderPatientContent()}
      </PatientLayout>
    );
  }

  // =========================================================================
  // 3. HOSPITAL ADMIN PORTAL ROUTE HANDLER (Strict Role Isolation)
  // =========================================================================
  if (currentPath.startsWith("/admin")) {
    if (role !== "admin") {
      // Access Denied: Render Access Restricted in user's own layout
      if (role === "doctor") {
        return (
          <DoctorLayout currentPath={currentPath} onNavigate={navigateTo}>
            <AccessRestrictedPage requiredRole="admin" onNavigate={navigateTo} />
          </DoctorLayout>
        );
      }
      return (
        <PatientLayout currentPath={currentPath} onNavigate={navigateTo}>
          <AccessRestrictedPage requiredRole="admin" onNavigate={navigateTo} />
        </PatientLayout>
      );
    }

    const renderAdminContent = () => {
      switch (currentPath) {
        case "/admin":
        case "/admin/dashboard":
          return <AdminDashboardView onNavigate={navigateTo} />;
        case "/admin/users":
          return <AdminUsersPage onNavigate={navigateTo} />;
        case "/admin/doctors":
          return <AdminDoctorsPage onNavigate={navigateTo} />;
        case "/admin/patients":
          return <AdminPatientsPage onNavigate={navigateTo} />;
        case "/admin/system":
          return <AdminSystemStatusPage onNavigate={navigateTo} />;
        case "/admin/reports":
          return <ReportsPage />;
        case "/admin/audit":
          return <AdminAuditPage onNavigate={navigateTo} />;
        case "/admin/settings":
          return <SettingsPage />;
        default:
          return <AdminDashboardView onNavigate={navigateTo} />;
      }
    };

    return (
      <AdminLayout currentPath={currentPath} onNavigate={navigateTo}>
        {renderAdminContent()}
      </AdminLayout>
    );
  }

  // Fallback: Redirect to authenticated role dashboard
  const fallbackPath =
    role === "patient"
      ? "/patient/dashboard"
      : role === "admin"
      ? "/admin/dashboard"
      : "/doctor/dashboard";

  navigateTo(fallbackPath, true);
  return null;
}

export function Index() {
  return (
    <ToastProvider>
      <AuthProvider>
        <PatientProvider>
          <MainAppShell />
        </PatientProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default Index;
