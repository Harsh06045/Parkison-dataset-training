import React, { useState } from "react";
import { Brain, ArrowLeft, RotateCcw, FileText, CheckCircle2, Play, Sparkles } from "lucide-react";
import { usePatient } from "@/context/PatientContext";
import { useAlzheimerAnalysis } from "@/hooks/useAlzheimerAnalysis";
import { PatientSelector } from "@/components/common/PatientSelector";
import { MRIUploader } from "@/components/alzheimer/MRIUploader";
import { MRIPreview } from "@/components/alzheimer/MRIPreview";
import { ProcessingPipeline } from "@/components/alzheimer/ProcessingPipeline";
import { CommonResultView } from "@/components/results/CommonResultView";
import { reportApi, UnifiedDiagnosticReport } from "@/services/reportApi";
import { Modal } from "@/components/common/Modal";
import { ReportPreview } from "@/components/reports/ReportPreview";

interface AlzheimerAnalysisPageProps {
  onBack: () => void;
  onNavigateToReports: () => void;
}

export function AlzheimerAnalysisPage({ onBack, onNavigateToReports }: AlzheimerAnalysisPageProps) {
  const { selectedPatient, selectPatient } = usePatient();
  const {
    file,
    mriPreviewUrl,
    modality,
    setModality,
    isProcessing,
    stages,
    result,
    error,
    selectFile,
    selectSample,
    runAnalysis,
    resetAnalysis,
  } = useAlzheimerAnalysis();

  const [generatedReport, setGeneratedReport] = useState<UnifiedDiagnosticReport | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const handleStartAnalysis = async () => {
    if (!selectedPatient) return;
    await runAnalysis(selectedPatient.id, selectedPatient.fullName);
  };

  const handleGenerateReport = async () => {
    if (!result) return;
    const report = await reportApi.generateReportFromAlzheimer(result);
    setGeneratedReport(report);
    setIsReportModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 text-[#0b1c30] select-none">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#e2e8f0] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-purple-50 border border-purple-200 text-purple-600 shadow-sm">
            <Brain className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-0.5 text-[0.65rem] font-bold">
                Alzheimer&rsquo;s Diagnostic Module
              </span>
              <span className="text-[#64748b]">•</span>
              <span className="text-xs font-mono text-[#64748b]">Route: /analysis/alzheimer</span>
            </div>
            <h2 className="font-headline text-xl font-bold text-[#0b1c30] tracking-tight mt-0.5">
              3D Volumetric MRI CNN + Vision Transformer Analysis
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="btn-secondary py-2 px-3.5"
        >
          <ArrowLeft className="size-3.5" />
          <span>Disease Selection</span>
        </button>
      </div>

      {/* IF RESULT EXISTS: SHOW UNIFIED RESULT CONTAINER */}
      {result ? (
        <CommonResultView
          result={result}
          onGenerateReport={handleGenerateReport}
          onAnalyzeAgain={resetAnalysis}
          onBackToPatient={onBack}
        />
      ) : (
        /* WORKFLOW INPUT SECTION */
        <div className="space-y-6">
          {/* Step 1: Patient Selection Box */}
          <div className="bg-white rounded-2xl p-6 shadow-card border border-[#e2e8f0]">
            <div className="max-w-xl">
              <PatientSelector
                selectedPatient={selectedPatient}
                onSelect={selectPatient}
              />
            </div>
          </div>

          {/* Step 2: Upload or Preview Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Col: Upload & Sample Pickers */}
            <div className={mriPreviewUrl ? "lg:col-span-6 space-y-4" : "lg:col-span-12 space-y-4"}>
              <div className="bg-white rounded-2xl p-6 shadow-card border border-[#e2e8f0]">
                <h3 className="font-headline text-xs font-bold text-[#0b1c30] uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Sparkles className="size-3.5 text-purple-600" />
                  <span>1. Ingest Brain MRI Volume Data</span>
                </h3>

                <MRIUploader
                  selectedFile={file}
                  onSelectFile={selectFile}
                  onSelectSample={selectSample}
                  onClear={resetAnalysis}
                  modality={modality}
                  onChangeModality={setModality}
                />
              </div>
            </div>

            {/* Right Col: Interactive Multi-Slice Preview */}
            {mriPreviewUrl && (
              <div className="lg:col-span-6 space-y-4">
                <MRIPreview
                  previewUrl={mriPreviewUrl}
                  filename={file?.name}
                  modality={modality}
                />
              </div>
            )}
          </div>

          {/* Step 3: Trigger Inference Button or Live Processing Pipeline */}
          {isProcessing ? (
            <ProcessingPipeline stages={stages} isProcessing={isProcessing} />
          ) : (
            file && (
              <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-6 shadow-card flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="font-headline font-bold text-[#0b1c30] text-base">
                    Ready for Multi-Modal AI Inference
                  </h4>
                  <p className="text-xs text-[#64748b] mt-0.5">
                    Analyzing for patient: <strong className="text-purple-700">{selectedPatient?.fullName || "Selected Patient"}</strong>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleStartAnalysis}
                  disabled={!selectedPatient || isProcessing}
                  className="btn-primary bg-purple-600 hover:bg-purple-700 py-3 px-8 text-xs font-bold shadow-md hover:scale-105 transition-all"
                >
                  <Play className="size-4 fill-white" />
                  <span>Execute 3D CNN + ViT Analysis</span>
                </button>
              </div>
            )
          )}
        </div>
      )}

      {/* Generated Report Preview Modal */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        maxWidth="4xl"
      >
        {generatedReport && (
          <ReportPreview
            report={generatedReport}
            onClose={() => setIsReportModalOpen(false)}
          />
        )}
      </Modal>
    </div>
  );
}
