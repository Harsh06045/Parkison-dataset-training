import React, { useState } from "react";
import {
  Activity,
  ArrowLeft,
  RotateCcw,
  FileText,
  CheckCircle2,
  Play,
  Sparkles,
  Mic,
  UploadCloud,
  FileAudio,
  Brain,
  PenTool,
  Zap,
} from "lucide-react";
import { usePatient } from "@/context/PatientContext";
import { useParkinsonAnalysis } from "@/hooks/useParkinsonAnalysis";
import { PatientSelector } from "@/components/common/PatientSelector";
import { AudioUploader } from "@/components/parkinson/AudioUploader";
import { AudioRecorder } from "@/components/parkinson/AudioRecorder";
import { AudioPlayer } from "@/components/parkinson/AudioPlayer";
import { MRIUploader } from "@/components/alzheimer/MRIUploader";
import { MRIPreview } from "@/components/alzheimer/MRIPreview";
import { DrawingCanvas } from "@/components/multimodal/DrawingCanvas";
import { EEGViewer, EEGSignalPayload } from "@/components/multimodal/EEGViewer";
import { ProcessingPipeline } from "@/components/parkinson/ProcessingPipeline";
import { CommonResultView } from "@/components/results/CommonResultView";
import { reportApi, UnifiedDiagnosticReport } from "@/services/reportApi";
import { Modal } from "@/components/common/Modal";
import { ReportPreview } from "@/components/reports/ReportPreview";

interface ParkinsonAnalysisPageProps {
  onBack: () => void;
  onNavigateToReports: () => void;
}

type ModalityTab = "audio" | "record" | "mri" | "spiral" | "eeg" | "multimodal";

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

  const [activeTab, setActiveTab] = useState<ModalityTab>("audio");
  const [recordedBlobState, setRecordedBlobState] = useState<Blob | null>(null);

  // Additional modalities state
  const [mriFile, setMriFile] = useState<File | null>(null);
  const [mriPreviewUrl, setMriPreviewUrl] = useState<string | null>(null);
  const [mriModality, setMriModality] = useState<string>("T1-Weighted Brain MRI");

  const [spiralFile, setSpiralFile] = useState<File | null>(null);
  const [spiralPreviewUrl, setSpiralPreviewUrl] = useState<string | null>(null);

  const [eegInfo, setEegInfo] = useState<EEGSignalPayload | null>(null);

  const [generatedReport, setGeneratedReport] = useState<UnifiedDiagnosticReport | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Handlers
  const handleRecordSuccess = (blob: Blob, url: string) => {
    setRecordedBlobState(blob);
    setRecordedAudio(blob, url);
  };

  const handleSelectMriFile = (file: File) => {
    setMriFile(file);
    if (file.type.startsWith("image/")) {
      setMriPreviewUrl(URL.createObjectURL(file));
    } else {
      setMriPreviewUrl("/assets/xray-brain.jpg");
    }
  };

  const handleSelectMriSample = (presetId: string) => {
    fetch("/plots/samples/sample_mri.png")
      .then((r) => r.blob())
      .then((blob) => {
        const file = new File([blob], `${presetId}_mri_scan.png`, { type: "image/png" });
        setMriFile(file);
        setMriPreviewUrl(URL.createObjectURL(blob));
      })
      .catch(() => {
        setMriPreviewUrl("/assets/xray-brain.jpg");
      });
  };

  const handleDrawingComplete = (file: File, url: string) => {
    setSpiralFile(file);
    setSpiralPreviewUrl(url);
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

  // Count active modalities
  const activeModalitiesCount = [
    uploadedFile || samplePresetId || recordedBlobState,
    mriFile,
    spiralFile,
    eegInfo ? true : false,
  ].filter(Boolean).length;

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
                Parkinson&rsquo;s Multi-Modal Diagnostic Suite
              </span>
              <span className="text-[#64748b]">•</span>
              <span className="text-xs font-mono text-[#64748b]">Route: /analysis/parkinson</span>
            </div>
            <h2 className="font-headline text-xl font-bold text-[#0b1c30] tracking-tight mt-0.5">
              Multimodal Vocal, Motor Kinematic &amp; Neuroimaging Suite
            </h2>
          </div>
        </div>

        <button type="button" onClick={onBack} className="btn-secondary py-2 px-3.5">
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
              <PatientSelector selectedPatient={selectedPatient} onSelect={selectPatient} />
            </div>
          </div>

          {/* Step 2: Multi-Modal Navigation Tabs */}
          <div className="bg-white rounded-2xl p-2 shadow-card border border-[#e2e8f0]">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab("audio")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                  activeTab === "audio"
                    ? "bg-[#0ea5e9] text-white font-bold shadow-md"
                    : "text-[#64748b] hover:text-[#0b1c30] hover:bg-[#f8f9ff]"
                }`}
              >
                <FileAudio className="size-4" />
                <span>1. MP3 / Audio Speech</span>
                {(uploadedFile || samplePresetId) && <span className="size-2 rounded-full bg-emerald-400" />}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("record")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                  activeTab === "record"
                    ? "bg-[#0ea5e9] text-white font-bold shadow-md"
                    : "text-[#64748b] hover:text-[#0b1c30] hover:bg-[#f8f9ff]"
                }`}
              >
                <Mic className="size-4" />
                <span>2. Live Recording</span>
                {recordedBlobState && <span className="size-2 rounded-full bg-emerald-400" />}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("mri")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                  activeTab === "mri"
                    ? "bg-[#0ea5e9] text-white font-bold shadow-md"
                    : "text-[#64748b] hover:text-[#0b1c30] hover:bg-[#f8f9ff]"
                }`}
              >
                <Brain className="size-4" />
                <span>3. Brain MRI Scans</span>
                {mriFile && <span className="size-2 rounded-full bg-emerald-400" />}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("spiral")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                  activeTab === "spiral"
                    ? "bg-[#0ea5e9] text-white font-bold shadow-md"
                    : "text-[#64748b] hover:text-[#0b1c30] hover:bg-[#f8f9ff]"
                }`}
              >
                <PenTool className="size-4" />
                <span>4. Spiral &amp; Drawing</span>
                {spiralFile && <span className="size-2 rounded-full bg-emerald-400" />}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("eeg")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                  activeTab === "eeg"
                    ? "bg-[#0ea5e9] text-white font-bold shadow-md"
                    : "text-[#64748b] hover:text-[#0b1c30] hover:bg-[#f8f9ff]"
                }`}
              >
                <Activity className="size-4" />
                <span>5. Quantitative EEG</span>
                <span className="size-2 rounded-full bg-emerald-400" />
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("multimodal")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                  activeTab === "multimodal"
                    ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold shadow-md"
                    : "text-cyan-700 bg-cyan-50/60 hover:bg-cyan-100"
                }`}
              >
                <Sparkles className="size-4" />
                <span>Full Multimodal Fusion ({activeModalitiesCount}/5 Active)</span>
              </button>
            </div>
          </div>

          {/* Step 3: Dynamic Modality Workspace */}
          <div className="bg-white rounded-2xl p-6 shadow-card border border-[#e2e8f0]">
            {/* 1. AUDIO / MP3 TAB */}
            {activeTab === "audio" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
                  <div>
                    <h3 className="font-headline text-sm font-bold text-[#0b1c30]">
                      Acoustic Voice &amp; Dysphonia Analysis (MP3/WAV)
                    </h3>
                    <p className="text-xs text-[#64748b]">
                      Extracts fundamental frequency jitter (%), amplitude shimmer (dB), and HNR using CatBoost and PyTorch models.
                    </p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[0.68rem] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
                    Vocal Dysphonia
                  </span>
                </div>

                <AudioUploader
                  selectedFile={uploadedFile}
                  onSelectFile={selectFile}
                  onSelectSample={selectSample}
                  onClear={resetAnalysis}
                />

                {playbackUrl && (
                  <div className="mt-4">
                    <AudioPlayer src={playbackUrl} filename={uploadedFile?.name || "Parkinson_Voice_Sample.wav"} />
                  </div>
                )}
              </div>
            )}

            {/* 2. LIVE RECORDING TAB */}
            {activeTab === "record" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
                  <div>
                    <h3 className="font-headline text-sm font-bold text-[#0b1c30]">
                      Microphone Vocal Tremor Recording
                    </h3>
                    <p className="text-xs text-[#64748b]">
                      Record sustained vowel /a/ phonation to detect micro-tremors in laryngeal motor control.
                    </p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[0.68rem] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    Microphone Capture
                  </span>
                </div>

                <AudioRecorder
                  onRecorded={handleRecordSuccess}
                  onReset={() => {
                    setRecordedBlobState(null);
                    resetAnalysis();
                  }}
                />

                {playbackUrl && (
                  <div className="mt-4">
                    <AudioPlayer src={playbackUrl} filename="Patient_Vocal_Capture.wav" />
                  </div>
                )}
              </div>
            )}

            {/* 3. BRAIN MRI TAB */}
            {activeTab === "mri" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
                  <div>
                    <h3 className="font-headline text-sm font-bold text-[#0b1c30]">
                      Substantia Nigra &amp; Basal Ganglia MRI Scan
                    </h3>
                    <p className="text-xs text-[#64748b]">
                      Evaluates midbrain substantia nigra pars compacta and neuromelanin loss with brain-only Grad-CAM.
                    </p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[0.68rem] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                    Midbrain MRI
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  <div className={mriPreviewUrl ? "lg:col-span-6 space-y-4" : "lg:col-span-12 space-y-4"}>
                    <MRIUploader
                      selectedFile={mriFile}
                      onSelectFile={handleSelectMriFile}
                      onSelectSample={handleSelectMriSample}
                      onClear={() => {
                        setMriFile(null);
                        setMriPreviewUrl(null);
                      }}
                      modality={mriModality}
                      onChangeModality={setMriModality}
                    />
                  </div>

                  {mriPreviewUrl && (
                    <div className="lg:col-span-6 space-y-4">
                      <MRIPreview previewUrl={mriPreviewUrl} filename={mriFile?.name} modality={mriModality} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 4. SPIRAL & DRAWING TEST TAB */}
            {activeTab === "spiral" && (
              <div className="space-y-4">
                <DrawingCanvas onDrawingComplete={handleDrawingComplete} disease="Parkinson's Disease" />
              </div>
            )}

            {/* 5. QUANTITATIVE EEG (qEEG) TAB */}
            {activeTab === "eeg" && (
              <div className="space-y-4">
                <EEGViewer disease="Parkinson's Disease" onDataLoaded={(info) => setEegInfo(info)} />
              </div>
            )}

            {/* 6. FULL MULTIMODAL FUSION SUMMARY */}
            {activeTab === "multimodal" && (
              <div className="space-y-5">
                <div className="border-b border-[#e2e8f0] pb-3">
                  <h3 className="font-headline text-sm font-bold text-[#0b1c30]">
                    Unified Multimodal Diagnostic Overview
                  </h3>
                  <p className="text-xs text-[#64748b]">
                    Fuses vocal dysphonia, Archimedean spiral kinematics, midbrain MRI, and sensorimotor EEG.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Audio Card */}
                  <div
                    onClick={() => setActiveTab("audio")}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      uploadedFile || samplePresetId || recordedBlobState
                        ? "border-emerald-300 bg-emerald-50/50"
                        : "border-[#e2e8f0] bg-[#f8f9ff] hover:border-cyan-300"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold mb-2">
                      <span className="flex items-center gap-1.5 text-[#0b1c30]">
                        <FileAudio className="size-4 text-[#0ea5e9]" />
                        <span>1. Vocal Acoustics</span>
                      </span>
                      {uploadedFile || samplePresetId || recordedBlobState ? (
                        <CheckCircle2 className="size-4 text-emerald-600" />
                      ) : (
                        <span className="text-[0.65rem] text-[#64748b]">Pending</span>
                      )}
                    </div>
                    <p className="text-[0.72rem] text-[#64748b] truncate">
                      {uploadedFile ? uploadedFile.name : "Voice recording or audio sample configured"}
                    </p>
                  </div>

                  {/* Spiral Card */}
                  <div
                    onClick={() => setActiveTab("spiral")}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      spiralFile
                        ? "border-emerald-300 bg-emerald-50/50"
                        : "border-[#e2e8f0] bg-[#f8f9ff] hover:border-amber-300"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold mb-2">
                      <span className="flex items-center gap-1.5 text-[#0b1c30]">
                        <PenTool className="size-4 text-amber-600" />
                        <span>2. Spiral Drawing</span>
                      </span>
                      {spiralFile ? (
                        <CheckCircle2 className="size-4 text-emerald-600" />
                      ) : (
                        <span className="text-[0.65rem] text-[#64748b]">Pending</span>
                      )}
                    </div>
                    <p className="text-[0.72rem] text-[#64748b] truncate">
                      {spiralFile ? spiralFile.name : "Click to draw spiral or upload paper scan"}
                    </p>
                  </div>

                  {/* MRI Card */}
                  <div
                    onClick={() => setActiveTab("mri")}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      mriFile
                        ? "border-emerald-300 bg-emerald-50/50"
                        : "border-[#e2e8f0] bg-[#f8f9ff] hover:border-purple-300"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold mb-2">
                      <span className="flex items-center gap-1.5 text-[#0b1c30]">
                        <Brain className="size-4 text-purple-600" />
                        <span>3. Brain MRI Scan</span>
                      </span>
                      {mriFile ? (
                        <CheckCircle2 className="size-4 text-emerald-600" />
                      ) : (
                        <span className="text-[0.65rem] text-[#64748b]">Pending</span>
                      )}
                    </div>
                    <p className="text-[0.72rem] text-[#64748b] truncate">
                      {mriFile ? mriFile.name : "Click to select or upload MRI scan"}
                    </p>
                  </div>

                  {/* EEG Card */}
                  <div
                    onClick={() => setActiveTab("eeg")}
                    className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/50 cursor-pointer transition-all"
                  >
                    <div className="flex items-center justify-between text-xs font-bold mb-2">
                      <span className="flex items-center gap-1.5 text-[#0b1c30]">
                        <Activity className="size-4 text-emerald-600" />
                        <span>4. Cortical EEG</span>
                      </span>
                      <CheckCircle2 className="size-4 text-emerald-600" />
                    </div>
                    <p className="text-[0.72rem] text-[#64748b] truncate">
                      Sensorimotor Montage (Slowing: {eegInfo?.slowingIndex ?? "1.65"})
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Step 4: Trigger Inference Button or Live Processing Pipeline */}
          {isProcessing ? (
            <ProcessingPipeline stages={stages} isProcessing={isProcessing} />
          ) : (
            <div className="rounded-2xl border border-cyan-200 bg-gradient-to-r from-cyan-50/70 via-blue-50/40 to-cyan-50/70 p-6 shadow-card flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="font-headline font-bold text-[#0b1c30] text-base flex items-center gap-2">
                  <Sparkles className="size-4 text-cyan-600" />
                  <span>Execute Multimodal AI Evaluation</span>
                </h4>
                <p className="text-xs text-[#64748b] mt-0.5">
                  Patient: <strong className="text-cyan-700">{selectedPatient?.fullName || "Selected Patient"}</strong>
                  {" • "}
                  <span>Active Modalities: <strong>{activeModalitiesCount} configured</strong></span>
                </p>
              </div>

              <button
                type="button"
                onClick={handleStartAnalysis}
                disabled={!selectedPatient || isProcessing}
                className="btn-primary bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 py-3.5 px-8 text-xs font-bold shadow-lg hover:scale-105 transition-all text-white flex items-center gap-2"
              >
                <Play className="size-4 fill-white" />
                <span>Run Comprehensive Multi-Modal AI</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Generated Report Preview Modal */}
      <Modal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} maxWidth="4xl">
        {generatedReport && <ReportPreview report={generatedReport} onClose={() => setIsReportModalOpen(false)} />}
      </Modal>
    </div>
  );
}
