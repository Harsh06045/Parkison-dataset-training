import React, { useState } from "react";
import {
  FileText,
  RotateCcw,
  Download,
  Share2,
  ChevronRight,
  ShieldCheck,
  Stethoscope,
  Sparkles,
  Printer,
  Brain,
  Activity,
  Layers,
  BarChart3,
  Edit3,
  Save,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import { AlzheimerAnalysisResult } from "@/services/alzheimerApi";
import { ParkinsonAnalysisResult } from "@/services/parkinsonApi";
import { PredictionCard as AlzPredictionCard } from "@/components/alzheimer/PredictionCard";
import { GradCAMViewer } from "@/components/alzheimer/GradCAMViewer";
import { SHAPViewer as AlzSHAPViewer } from "@/components/alzheimer/SHAPViewer";
import { PredictionCard as ParkPredictionCard } from "@/components/parkinson/PredictionCard";
import { QuantumResult } from "@/components/parkinson/QuantumResult";
import { SHAPViewer as ParkSHAPViewer } from "@/components/parkinson/SHAPViewer";
import { useToast } from "@/context/ToastContext";

interface CommonResultViewProps {
  result: AlzheimerAnalysisResult | ParkinsonAnalysisResult;
  onGenerateReport: () => void;
  onAnalyzeAgain: () => void;
  onBackToPatient?: () => void;
}

export function CommonResultView({
  result,
  onGenerateReport,
  onAnalyzeAgain,
  onBackToPatient,
}: CommonResultViewProps) {
  const { success } = useToast();
  const [activeTab, setActiveTab] = useState<"overview" | "explainability" | "notes">("overview");
  const [doctorNotes, setDoctorNotes] = useState(
    "Patient exhibits clinical markers consistent with AI diagnostic assessment. Recommended follow-up in 90 days with repeat neuro-imaging and cognitive battery evaluation."
  );
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  const isAlzheimer = result.disease === "Alzheimer's Disease";
  const alzResult = isAlzheimer ? (result as AlzheimerAnalysisResult) : null;
  const parkResult = !isAlzheimer ? (result as ParkinsonAnalysisResult) : null;

  const dateStr = (result as any).scanDate || (result as any).analysisDate || "2026-08-22";

  const handleSaveNotes = () => {
    setIsEditingNotes(false);
    success("Physician Assessment Saved", "Clinical evaluation attached to diagnostic record.");
  };

  return (
    <div className="space-y-6 text-[#0b1c30] select-none">
      {/* 1. Breadcrumbs & Header Actions Bar (Stitch Design) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#e2e8f0] pb-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-[#64748b] mb-1">
            <span
              className="cursor-pointer hover:text-[#0ea5e9] font-medium"
              onClick={onBackToPatient}
            >
              Patients
            </span>
            <ChevronRight className="size-3" />
            <span className="cursor-pointer hover:text-[#0ea5e9] font-medium">
              {result.patientName}
            </span>
            <ChevronRight className="size-3" />
            <span className="font-mono font-bold text-[#0ea5e9]">{result.id}</span>
          </div>

          <h2 className="font-headline text-2xl sm:text-3xl font-extrabold text-[#0b1c30] tracking-tight">
            Diagnostic Analysis: {result.patientName}
          </h2>
          <p className="text-xs text-[#64748b] mt-0.5">
            Processed on {dateStr} • Scan ID: <strong className="font-mono text-[#0b1c30]">{result.id}</strong> • Patient ID: <strong className="font-mono text-[#0ea5e9]">{result.patientId}</strong>
          </p>
        </div>

        {/* Action Buttons (Stitch btn-primary & btn-secondary) */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onAnalyzeAgain}
            className="btn-secondary"
          >
            <RotateCcw className="size-4" />
            <span>New Scan</span>
          </button>

          <button
            type="button"
            onClick={onGenerateReport}
            className="btn-primary"
          >
            <FileText className="size-4" />
            <span>Generate Official Report</span>
          </button>
        </div>
      </div>

      {/* 2. Navigation Tabs (Stitch Toolbar) */}
      <div className="flex items-center gap-2 border-b border-[#e2e8f0] pb-3 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all ${
            activeTab === "overview"
              ? "bg-[#e0f2fe] text-[#0284c7] font-bold shadow-sm"
              : "text-[#64748b] hover:text-[#0b1c30] hover:bg-[#f1f5f9]"
          }`}
        >
          {isAlzheimer ? <Brain className="size-3.5" /> : <Activity className="size-3.5" />}
          <span>Prediction &amp; Biomarkers</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("explainability")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all ${
            activeTab === "explainability"
              ? "bg-[#e0f2fe] text-[#0284c7] font-bold shadow-sm"
              : "text-[#64748b] hover:text-[#0b1c30] hover:bg-[#f1f5f9]"
          }`}
        >
          <Layers className="size-3.5" />
          <span>{isAlzheimer ? "Grad-CAM & SHAP" : "Quantum-AI & SHAP"}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("notes")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all ${
            activeTab === "notes"
              ? "bg-[#e0f2fe] text-[#0284c7] font-bold shadow-sm"
              : "text-[#64748b] hover:text-[#0b1c30] hover:bg-[#f1f5f9]"
          }`}
        >
          <Edit3 className="size-3.5" />
          <span>Physician Evaluation</span>
        </button>
      </div>

      {/* 3. Bento Grid Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Col: Prediction Summary Card */}
          <div className="lg:col-span-6 space-y-6">
            {isAlzheimer && alzResult && <AlzPredictionCard result={alzResult} />}
            {!isAlzheimer && parkResult && <ParkPredictionCard result={parkResult} />}
          </div>

          {/* Right Col: Primary Explainability Snapshot */}
          <div className="lg:col-span-6 space-y-6">
            {isAlzheimer && alzResult && <GradCAMViewer gradCam={alzResult.gradCam} />}
            {!isAlzheimer && parkResult && <QuantumResult quantumMetrics={parkResult.quantumLayer} />}
          </div>
        </div>
      )}

      {activeTab === "explainability" && (
        <div className="space-y-6">
          {isAlzheimer && alzResult && (
            <>
              <GradCAMViewer gradCam={alzResult.gradCam} />
              <AlzSHAPViewer features={alzResult.shap?.features || []} />
            </>
          )}

          {!isAlzheimer && parkResult && (
            <>
              <QuantumResult quantumMetrics={parkResult.quantumLayer} />
              <ParkSHAPViewer features={parkResult.shap?.metrics || []} />
            </>
          )}
        </div>
      )}

      {activeTab === "notes" && (
        <div className="bg-white rounded-2xl p-6 shadow-card border border-[#e2e8f0] space-y-4">
          <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
            <h3 className="font-headline text-xs font-bold text-[#0b1c30] uppercase tracking-wider flex items-center gap-2">
              <Stethoscope className="size-4 text-[#0ea5e9]" />
              <span>Attending Physician Clinical Assessment &amp; Diagnosis Notes</span>
            </h3>
            {isEditingNotes ? (
              <button
                type="button"
                onClick={handleSaveNotes}
                className="btn-primary py-1 px-3 text-xs"
              >
                <Save className="size-3" />
                <span>Save Assessment</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingNotes(true)}
                className="btn-secondary py-1 px-3 text-xs"
              >
                <Edit3 className="size-3" />
                <span>Edit Notes</span>
              </button>
            )}
          </div>

          {isEditingNotes ? (
            <textarea
              value={doctorNotes}
              onChange={(e) => setDoctorNotes(e.target.value)}
              rows={5}
              className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8f9ff] p-4 text-xs text-[#0b1c30] focus:ring-2 focus:ring-[#0ea5e9] focus:outline-none"
            />
          ) : (
            <p className="text-xs text-[#475569] leading-relaxed whitespace-pre-wrap bg-[#f8f9ff] p-4 rounded-xl border border-[#e2e8f0]">
              {doctorNotes}
            </p>
          )}
        </div>
      )}

      {/* 4. Mandatory Decision Support Disclaimer Footer */}
      <div className="rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-card flex items-start gap-3 text-xs text-[#64748b]">
        <ShieldCheck className="size-5 text-emerald-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-[#0b1c30]">SaMD Decision-Support Disclaimer:</strong> This system provides AI-assisted decision support for licensed medical practitioners and should not be treated as a standalone medical diagnosis. All findings must be correlated with clinical examination and patient history.
        </p>
      </div>
    </div>
  );
}
