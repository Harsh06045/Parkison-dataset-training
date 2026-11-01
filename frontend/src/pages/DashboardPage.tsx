import React from "react";
import { useAuth } from "@/context/AuthContext";
import { usePatient } from "@/context/PatientContext";
import { useAnalysis, UnifiedHistoryItem } from "@/hooks/useAnalysis";
import { MetricsGrid } from "@/components/dashboard/MetricsGrid";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentAnalysesTable } from "@/components/dashboard/RecentAnalysesTable";
import { DiseaseTrendCharts } from "@/components/dashboard/DiseaseTrendCharts";
import { PatientDashboardView } from "@/components/dashboard/PatientDashboardView";
import { AdminDashboardView } from "@/components/dashboard/AdminDashboardView";

interface DashboardPageProps {
  onNavigate: (path: string) => void;
  onOpenAddPatient: () => void;
  onViewAnalysisResult: (analysis: UnifiedHistoryItem) => void;
}

export function DashboardPage({
  onNavigate,
  onOpenAddPatient,
  onViewAnalysisResult,
}: DashboardPageProps) {
  const { user } = useAuth();
  const { patients } = usePatient();
  const { history } = useAnalysis();

  // 1. If logged in as Patient, render Patient Health Record Dashboard
  if (user?.role === "patient") {
    return <PatientDashboardView onNavigate={onNavigate} />;
  }

  // 2. If logged in as Hospital Admin, render Admin & PACS Infrastructure Console
  if (user?.role === "admin") {
    return <AdminDashboardView onNavigate={onNavigate} />;
  }

  // 3. Otherwise (Doctor), render full Clinical Diagnostic AI Workspace
  const totalAlzheimerAnalyses = history.filter((h) => h.disease === "Alzheimer's Disease").length;
  const totalParkinsonAnalyses = history.filter((h) => h.disease === "Parkinson's Disease").length;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* TOP METRICS GRID */}
      <MetricsGrid
        totalPatients={patients.length}
        totalAlzheimerAnalyses={Math.max(totalAlzheimerAnalyses, 28)}
        totalParkinsonAnalyses={Math.max(totalParkinsonAnalyses, 20)}
        recentReportsCount={8}
        onNavigateToPatients={() => onNavigate("/patients")}
        onNavigateToAlzheimer={() => onNavigate("/analysis/alzheimer")}
        onNavigateToParkinson={() => onNavigate("/analysis/parkinson")}
        onNavigateToReports={() => onNavigate("/reports")}
      />

      {/* QUICK ACTIONS */}
      <QuickActions
        onAddPatient={onOpenAddPatient}
        onNewAnalysis={() => onNavigate("/analysis")}
        onAnalyzeMri={() => onNavigate("/analysis/alzheimer")}
        onAnalyzeVoice={() => onNavigate("/analysis/parkinson")}
      />

      {/* RECENT ANALYSES FEED */}
      <RecentAnalysesTable
        analyses={history}
        onViewResult={onViewAnalysisResult}
        onViewAllHistory={() => onNavigate("/history")}
      />

      {/* CHARTS & ANALYTICS */}
      <DiseaseTrendCharts />
    </div>
  );
}
