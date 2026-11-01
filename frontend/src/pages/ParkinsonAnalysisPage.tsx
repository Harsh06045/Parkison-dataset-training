import React, { useState } from "react";
import { Activity, ArrowLeft, RotateCcw, FileText, CheckCircle2, Play, Sparkles, Mic, UploadCloud } from "lucide-react";
import { usePatient } from "@/context/PatientContext";
import { useParkinsonAnalysis } from "@/hooks/useParkinsonAnalysis";
import { PatientSelector } from "@/components/common/PatientSelector";
import { AudioUploader } from "@/components/parkinson/AudioUploader";
import { AudioRecorder } from "@/components/parkinson/AudioRecorder";
import { AudioPlayer } from "@/components/parkinson/AudioPlayer";
import { ProcessingPipeline } from "@/components/parkinson/ProcessingPipeline";
import { CommonResultView } from "@/components/results/CommonResultView";
import { reportApi, UnifiedDiagnosticReport } from "@/services/reportApi";
import { Modal } from "@/components/common/Modal";
import { ReportPreview } from "@/components/reports/ReportPreview";

interface ParkinsonAnalysisPageProps {
  onBack: () => void;
  onNavigateToReports: () => void;
}

export function ParkinsonAnalysisPage({ onBack, onNavigateToReports }: ParkinsonAnalysisPageProps) {
  const { selectedPatient, selectPatient } = usePatient();
  const {
    audioInputType,
    setAudioInputType,
    uploadedFile,
    samplePresetId,
    playbackUrl,
    isProcessing,
    stages,
    result,
    error,
    selectFile,
    selectSample,
    setRecordedAudio,
    runAnalysis,
    resetAnalysis,
  } = useParkinsonAnalysis();

  const [inputTab, setInputTab] = useState<"upload" | "record">("upload");
  const [recordedBlobState, setRecordedBlobState] = useState<Blob | null>(null);
  const [generatedReport, setGeneratedReport] = useState<UnifiedDiagnosticReport | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const handleRecordSuccess = (blob: Blob, url: string) => {
    setRecordedBlobState(blob);
    setRecordedAudio(blob, url);
  };

  const handleStartAnalysis = async () => {
    if (!selectedPatient) return;
    await runAnalysis(selectedPatient.id, selectedPatient.fullName, recordedBlobState);
  };

  const handleGenerateReport = async () => {
    if (!result) return;
    const report = await reportApi.generateReportFromParkinson(result);
    setGeneratedReport(report);
    setIsReportModalOpen(true);
  };

  const hasAudioSource = uploadedFile || samplePresetId || playbackUrl;

  return (
    <div className="space-y-6 animate-in fade-in duration-200 text-[#0b1c30] select-none">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#e2e8f0] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-cyan-50 border border-cyan-200 text-cyan-600 shadow-sm">
            <Activity className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200 px-2.5 py-0.5 text-[0.65rem] font-bold">
                Parkinson&rsquo;s Diagnostic Module
              </span>
              <span className="text-[#64748b]">•</span>
              <span className="text-xs font-mono text-[#64748b]">Route: /analysis/parkinson</span>
            </div>
            <h2 className="font-headline text-xl font-bold text-[#0b1c30] tracking-tight mt-0.5">
              Vocal Biomarkers &amp; Quantum-Inspired Decision Layer
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

          {/* Step 2: Audio Input (Upload vs Live Microphone Tabs) */}
          <div className="bg-white rounded-2xl p-6 shadow-card border border-[#e2e8f0] space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#e2e8f0] pb-4">
              <div>
                <h3 className="font-headline text-xs font-bold text-[#0b1c30] uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="size-3.5 text-[#0ea5e9]" />
                  <span>1. Ingest Vocal Phonation Acoustic Signal</span>
                </h3>
                <p className="text-xs text-[#64748b] mt-0.5">
                  Select between uploading a recorded audio file or recording directly in the browser
                </p>
              </div>

              {/* Mode Switcher */}
              <div className="flex items-center bg-[#f8f9ff] p-1 rounded-xl border border-[#e2e8f0] text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setInputTab("upload")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                    inputTab === "upload"
                      ? "bg-[#0ea5e9] text-white font-bold shadow-sm"
                      : "text-[#64748b] hover:text-[#0b1c30]"
                  }`}
                >
                  <UploadCloud className="size-3.5" />
                  <span>Upload Audio</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInputTab("record")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                    inputTab === "record"
                      ? "bg-[#0ea5e9] text-white font-bold shadow-sm"
                      : "text-[#64748b] hover:text-[#0b1c30]"
                  }`}
                >
                  <Mic className="size-3.5" />
                  <span>Record Voice</span>
                </button>
              </div>
            </div>

            {inputTab === "upload" ? (
              <AudioUploader
                selectedFile={uploadedFile}
                onSelectFile={selectFile}
                onSelectSample={selectSample}
                onClear={resetAnalysis}
              />
            ) : (
              <AudioRecorder
                onRecorded={handleRecordSuccess}
                onReset={resetAnalysis}
              />
            )}

            {/* Audio Playback Bar if audio source active */}
            {hasAudioSource && (
              <div className="pt-2">
                <AudioPlayer
                  src={playbackUrl}
                  filename={uploadedFile?.name || (samplePresetId ? "Clinical Vocal Sample Preset" : "Microphone Recording")}
                  duration={3.8}
                />
              </div>
            )}
          </div>

          {/* Step 3: Trigger Inference Button or Live Processing Pipeline */}
          {isProcessing ? (
            <ProcessingPipeline stages={stages} isProcessing={isProcessing} />
          ) : (
            hasAudioSource && (
              <div className="rounded-2xl border border-cyan-200 bg-cyan-50/50 p-6 shadow-card flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="font-headline font-bold text-[#0b1c30] text-base">
                    Ready for Quantum-Inspired Acoustic Classification
                  </h4>
                  <p className="text-xs text-[#64748b] mt-0.5">
                    Analyzing for patient: <strong className="text-cyan-700">{selectedPatient?.fullName || "Selected Patient"}</strong>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleStartAnalysis}
                  disabled={!selectedPatient || isProcessing}
                  className="btn-primary bg-cyan-600 hover:bg-cyan-700 py-3 px-8 text-xs font-bold shadow-md hover:scale-105 transition-all"
                >
                  <Play className="size-4 fill-white" />
                  <span>Execute Quantum-AI Analysis</span>
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
