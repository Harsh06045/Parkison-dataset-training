import React from "react";
import {
  Brain,
  Activity,
  Users,
  FileText,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Clock,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Cpu,
  AlertTriangle,
  Plus,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { usePatient } from "@/context/PatientContext";
import { useAnalysis, UnifiedHistoryItem } from "@/hooks/useAnalysis";
import { DiseaseTrendCharts } from "@/components/dashboard/DiseaseTrendCharts";

interface DoctorDashboardViewProps {
  onNavigate: (path: string) => void;
  onOpenAddPatient: () => void;
  onViewAnalysisResult: (analysis: UnifiedHistoryItem) => void;
}

export function DoctorDashboardView({
  onNavigate,
  onOpenAddPatient,
  onViewAnalysisResult,
}: DoctorDashboardViewProps) {
  const { user } = useAuth();
  const { patients } = usePatient();
  const { history } = useAnalysis();

  const doctorName = user?.fullName?.replace("Dr. ", "") || "Sarah Jenkins, MD, PhD";

  const totalAlzheimerAnalyses = Math.max(history.filter((h) => h.disease === "Alzheimer's Disease").length, 28);
  const totalParkinsonAnalyses = Math.max(history.filter((h) => h.disease === "Parkinson's Disease").length, 20);

  return (
    <div className="space-y-8 animate-in fade-in duration-200 text-[#0b1c30] select-none">
      {/* 1. DOCTOR HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e2e8f0] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#e0f2fe] text-[#0284c7] border border-[#0ea5e9]/30 px-2.5 py-0.5 text-[0.68rem] font-bold">
              Cognitive Neurology &amp; Movement Disorders
            </span>
            <span className="text-[#94a3b8]">•</span>
            <span className="text-xs font-mono text-[#64748b]">{user?.medicalLicenseId || "MD-98472-NEURO"}</span>
          </div>
          <h1 className="font-headline text-2xl sm:text-3xl font-extrabold text-[#0b1c30] tracking-tight mt-1">
            Good Morning, Dr. {doctorName}
          </h1>
          <p className="text-xs sm:text-sm text-[#64748b] mt-0.5 font-medium">
            Monitor your patients and perform AI-assisted neurological analysis.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenAddPatient}
            className="btn-secondary py-2.5 px-4 text-xs font-bold flex items-center gap-2"
          >
            <Plus className="size-4" />
            <span>Add Patient</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate("/doctor/analysis")}
            className="btn-primary py-2.5 px-4 text-xs font-bold shadow-md hover:shadow-lg flex items-center gap-2"
          >
            <Sparkles className="size-4" />
            <span>New Analysis</span>
          </button>
        </div>
      </div>

      {/* 2. DOCTOR METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Patients */}
        <div
          onClick={() => onNavigate("/doctor/patients")}
          className="bg-white rounded-2xl p-5 shadow-card border border-[#e2e8f0] hover:border-[#0ea5e9]/40 hover:shadow-card-hover transition-all cursor-pointer group flex flex-col justify-between space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-[0.68rem] uppercase font-bold text-[#64748b] tracking-wider">
              Total Patients
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-200 group-hover:scale-105 transition-transform">
              <Users className="size-4.5" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-headline font-black text-[#0b1c30]">
              {patients.length || 24}
            </h3>
            <p className="text-[0.68rem] text-emerald-600 font-bold mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="size-3" />
              <span>Assigned &amp; Active</span>
            </p>
          </div>
          <div className="text-xs font-bold text-[#0ea5e9] flex items-center justify-between pt-2 border-t border-[#e2e8f0]">
            <span>Manage Registry</span>
            <ChevronRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Alzheimer's Analyses */}
        <div
          onClick={() => onNavigate("/doctor/analysis/alzheimer")}
          className="bg-white rounded-2xl p-5 shadow-card border border-[#e2e8f0] hover:border-[#0ea5e9]/40 hover:shadow-card-hover transition-all cursor-pointer group flex flex-col justify-between space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-[0.68rem] uppercase font-bold text-[#64748b] tracking-wider">
              Alzheimer&rsquo;s Analyses
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 border border-purple-200 group-hover:scale-105 transition-transform">
              <Brain className="size-4.5" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-headline font-black text-[#0b1c30]">
              {totalAlzheimerAnalyses}
            </h3>
            <p className="text-[0.68rem] text-[#64748b] font-medium mt-0.5">
              3D MRI Vision Transformer
            </p>
          </div>
          <div className="text-xs font-bold text-purple-600 flex items-center justify-between pt-2 border-t border-[#e2e8f0]">
            <span>Run MRI Inference</span>
            <ChevronRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Parkinson's Analyses */}
        <div
          onClick={() => onNavigate("/doctor/analysis/parkinson")}
          className="bg-white rounded-2xl p-5 shadow-card border border-[#e2e8f0] hover:border-[#0ea5e9]/40 hover:shadow-card-hover transition-all cursor-pointer group flex flex-col justify-between space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-[0.68rem] uppercase font-bold text-[#64748b] tracking-wider">
              Parkinson&rsquo;s Analyses
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 border border-cyan-200 group-hover:scale-105 transition-transform">
              <Activity className="size-4.5" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-headline font-black text-[#0b1c30]">
              {totalParkinsonAnalyses}
            </h3>
            <p className="text-[0.68rem] text-[#64748b] font-medium mt-0.5">
              Quantum Acoustic VQC Layer
            </p>
          </div>
          <div className="text-xs font-bold text-cyan-600 flex items-center justify-between pt-2 border-t border-[#e2e8f0]">
            <span>Run Voice Phonation</span>
            <ChevronRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Pending Reports */}
        <div
          onClick={() => onNavigate("/doctor/reports")}
          className="bg-white rounded-2xl p-5 shadow-card border border-[#e2e8f0] hover:border-[#0ea5e9]/40 hover:shadow-card-hover transition-all cursor-pointer group flex flex-col justify-between space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-[0.68rem] uppercase font-bold text-[#64748b] tracking-wider">
              Pending Reports
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-200 group-hover:scale-105 transition-transform">
              <FileText className="size-4.5" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-headline font-black text-[#0b1c30]">
              4
            </h3>
            <p className="text-[0.68rem] text-amber-600 font-bold mt-0.5 flex items-center gap-1">
              <Clock className="size-3" />
              <span>Awaiting Physician Signature</span>
            </p>
          </div>
          <div className="text-xs font-bold text-amber-600 flex items-center justify-between pt-2 border-t border-[#e2e8f0]">
            <span>Sign &amp; Release</span>
            <ChevronRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>

      {/* 3. QUICK ACTIONS (EXACT CLINICAL LABELS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Action 1: Alzheimer's */}
        <div
          onClick={() => onNavigate("/doctor/analysis/alzheimer")}
          className="bg-gradient-to-br from-white via-white to-purple-50/50 rounded-3xl p-6 shadow-card border border-[#e2e8f0] hover:border-purple-300 hover:shadow-card-hover transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between space-y-4"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="rounded-full bg-purple-100 text-purple-700 text-[0.65rem] font-bold px-2.5 py-0.5">
                Volumetric Neuroimaging
              </span>
              <h3 className="font-headline font-bold text-xl text-[#0b1c30] group-hover:text-purple-700 transition-colors">
                New Alzheimer&rsquo;s Analysis
              </h3>
            </div>
            <div className="flex size-12 items-center justify-center rounded-2xl bg-purple-600 text-white shadow-lg shadow-purple-600/30 group-hover:scale-110 transition-transform">
              <Brain className="size-6" />
            </div>
          </div>

          <p className="text-xs font-mono font-semibold text-purple-900/80 bg-purple-100/50 p-2.5 rounded-xl border border-purple-200/60">
            Brain MRI + CNN + Vision Transformer + Grad-CAM + SHAP
          </p>

          <div className="flex items-center justify-between text-xs font-bold text-purple-700 pt-2">
            <span>Launch 3D MRI ViT Slicer</span>
            <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Action 2: Parkinson's */}
        <div
          onClick={() => onNavigate("/doctor/analysis/parkinson")}
          className="bg-gradient-to-br from-white via-white to-cyan-50/50 rounded-3xl p-6 shadow-card border border-[#e2e8f0] hover:border-cyan-300 hover:shadow-card-hover transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between space-y-4"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="rounded-full bg-cyan-100 text-cyan-700 text-[0.65rem] font-bold px-2.5 py-0.5">
                Acoustic Biomarkers
              </span>
              <h3 className="font-headline font-bold text-xl text-[#0b1c30] group-hover:text-cyan-700 transition-colors">
                New Parkinson&rsquo;s Analysis
              </h3>
            </div>
            <div className="flex size-12 items-center justify-center rounded-2xl bg-[#0ea5e9] text-white shadow-lg shadow-[#0ea5e9]/30 group-hover:scale-110 transition-transform">
              <Activity className="size-6" />
            </div>
          </div>

          <p className="text-xs font-mono font-semibold text-cyan-900/80 bg-cyan-100/50 p-2.5 rounded-xl border border-cyan-200/60">
            Voice Analysis + Deep Learning + Quantum-AI/Quantum-Inspired Layer + SHAP
          </p>

          <div className="flex items-center justify-between text-xs font-bold text-cyan-700 pt-2">
            <span>Launch Quantum Voice DSP</span>
            <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* 4. RECENT ANALYSIS TABLE (EXACT SCHEMA: Patient | Disease | Prediction | Confidence | Date | Status | View) */}
      <div className="bg-white rounded-2xl shadow-card border border-[#e2e8f0] overflow-hidden">
        <div className="p-5 border-b border-[#e2e8f0] flex items-center justify-between">
          <div>
            <h3 className="font-headline font-bold text-base text-[#0b1c30]">
              Recent Clinical Analyses
            </h3>
            <p className="text-xs text-[#64748b] mt-0.5">
              Assigned patient diagnostic inferences and model confidence values.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate("/doctor/history")}
            className="btn-secondary py-1.5 px-3 text-xs font-semibold"
          >
            <span>View All History</span>
            <ChevronRight className="size-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#f8f9ff] border-b border-[#e2e8f0] text-[0.68rem] uppercase font-bold text-[#64748b]">
                <th className="p-4">Patient</th>
                <th className="p-4">Disease</th>
                <th className="p-4">Prediction</th>
                <th className="p-4">Confidence</th>
                <th className="p-4">Date</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {history.slice(0, 6).map((item) => (
                <tr key={item.id} className="hover:bg-[#f8f9ff] transition-colors font-medium">
                  <td className="p-4">
                    <div className="font-bold text-[#0b1c30]">{item.patientName}</div>
                    <div className="text-[0.68rem] text-[#64748b] font-mono">{item.patientId}</div>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1.5 font-bold text-[#0b1c30]">
                      {item.disease === "Alzheimer's Disease" ? (
                        <Brain className="size-3.5 text-purple-600" />
                      ) : (
                        <Activity className="size-3.5 text-cyan-600" />
                      )}
                      <span>{item.disease}</span>
                    </span>
                  </td>
                  <td className="p-4 font-bold text-[#0b1c30]">{item.prediction}</td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[0.68rem] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {Math.round(item.confidence * 100)}%
                    </span>
                  </td>
                  <td className="p-4 text-[#64748b] font-mono text-[0.68rem]">{item.date}</td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[0.65rem] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      {item.status || "Finalized"}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      type="button"
                      onClick={() => onViewAnalysisResult(item)}
                      className="rounded-lg bg-[#f8f9ff] border border-[#e2e8f0] px-3 py-1.5 text-xs font-bold text-[#0ea5e9] hover:bg-[#e0f2fe] transition-colors inline-flex items-center gap-1"
                    >
                      <span>Details</span>
                      <ChevronRight className="size-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. DISEASE TREND CHARTS & POPULATION ANALYTICS */}
      <DiseaseTrendCharts />
    </div>
  );
}
