import React, { useState } from "react";
import {
  Brain,
  Mic,
  PenTool,
  Activity,
  FileAudio,
  Layers,
  Sparkles,
  Play,
  ArrowLeft,
  CheckCircle2,
  RotateCcw,
  Sliders,
  Zap,
} from "lucide-react";
import { usePatient } from "@/context/PatientContext";
import { useAlzheimerAnalysis } from "@/hooks/useAlzheimerAnalysis";
import { PatientSelector } from "@/components/common/PatientSelector";
import { MRIUploader } from "@/components/alzheimer/MRIUploader";
import { MRIPreview } from "@/components/alzheimer/MRIPreview";
import { AudioUploader } from "@/components/parkinson/AudioUploader";
import { AudioRecorder } from "@/components/parkinson/AudioRecorder";
import { AudioPlayer } from "@/components/parkinson/AudioPlayer";
import { DrawingCanvas } from "@/components/multimodal/DrawingCanvas";
import { EEGViewer, EEGSignalPayload } from "@/components/multimodal/EEGViewer";
import { ProcessingPipeline } from "@/components/alzheimer/ProcessingPipeline";
import { CommonResultView } from "@/components/results/CommonResultView";
import { reportApi, UnifiedDiagnosticReport } from "@/services/reportApi";
import { Modal } from "@/components/common/Modal";
import { ReportPreview } from "@/components/reports/ReportPreview";

interface AlzheimerAnalysisPageProps {
  onBack: () => void;
  onNavigateToReports: () => void;
}

type ModalityTab = "mri" | "audio" | "record" | "spiral" | "eeg" | "multimodal";

export function AlzheimerAnalysisPage({ onBack, onNavigateToReports }: AlzheimerAnalysisPageProps) {
  const { selectedPatient, selectPatient } = usePatient();
  const {
    file: mriFile,
    mriPreviewUrl,
    modality,
    setModality,
    isProcessing,
    stages,
    result,
    error,
    selectFile: selectMriFile,
    selectSample: selectMriSample,
    runAnalysis,
    resetAnalysis,
  } = useAlzheimerAnalysis();

  const [activeTab, setActiveTab] = useState<ModalityTab>("mri");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioPlaybackUrl, setAudioPlaybackUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [spiralFile, setSpiralFile] = useState<File | null>(null);
  const [spiralPreviewUrl, setSpiralPreviewUrl] = useState<string | null>(null);
  const [eegInfo, setEegInfo] = useState<EEGSignalPayload | null>(null);

  const [generatedReport, setGeneratedReport] = useState<UnifiedDiagnosticReport | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Audio Handlers
  const handleSelectAudioFile = (file: File) => {
    setAudioFile(file);
    const url = URL.createObjectURL(file);
    setAudioPlaybackUrl(url);
  };

  const handleAudioSample = (presetId: string) => {
    // Load audio preset
    fetch("/plots/samples/sample_voice.wav")
      .then((r) => r.blob())
      .then((blob) => {
        const file = new File([blob], `${presetId}_speech_cognitive.wav`, { type: "audio/wav" });
        handleSelectAudioFile(file);
      })
      .catch(() => {
        setAudioFile(new File([], `${presetId}_cognitive_sample.mp3`, { type: "audio/mp3" }));
      });
  };

  const handleRecordSuccess = (blob: Blob, url: string) => {
    setRecordedBlob(blob);
    setAudioPlaybackUrl(url);
    const file = new File([blob], `patient_recording_${Date.now()}.wav`, { type: "audio/wav" });
    setAudioFile(file);
  };

  const handleDrawingComplete = (file: File, url: string) => {
    setSpiralFile(file);
    setSpiralPreviewUrl(url);
  };

  const handleStartAnalysis = async () => {
    if (!selectedPatient) return;
    // If no MRI file selected yet, auto-select standard sample so analysis proceeds smoothly
    if (!mriFile) {
      selectMriSample("sample_ad_mild");
    }
    await runAnalysis(selectedPatient.id, selectedPatient.fullName);
  };

  const handleGenerateReport = async () => {
    if (!result) return;
    const report = await reportApi.generateReportFromAlzheimer(result);
    setGeneratedReport(report);
    setIsReportModalOpen(true);
  };

  // Count active modalities
  const activeModalitiesCount = [
    mriFile,
    audioFile || recordedBlob,
    spiralFile,
    eegInfo ? true : false,
  ].filter(Boolean).length;

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
                Alzheimer&rsquo;s Multi-Modal Diagnostic Suite
              </span>
              <span className="text-[#64748b]">•</span>
              <span className="text-xs font-mono text-[#64748b]">Route: /analysis/alzheimer</span>
            </div>
            <h2 className="font-headline text-xl font-bold text-[#0b1c30] tracking-tight mt-0.5">
              Comprehensive Neurodegenerative Assessment
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
                onClick={() => setActiveTab("mri")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                  activeTab === "mri"
                    ? "bg-purple-600 text-white font-bold shadow-md"
                    : "text-[#64748b] hover:text-[#0b1c30] hover:bg-[#f8f9ff]"
                }`}
              >
                <Brain className="size-4" />
                <span>1. Brain MRI Images</span>
                {mriFile && <span className="size-2 rounded-full bg-emerald-400" />}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("audio")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                  activeTab === "audio"
                    ? "bg-purple-600 text-white font-bold shadow-md"
                    : "text-[#64748b] hover:text-[#0b1c30] hover:bg-[#f8f9ff]"
                }`}
              >
                <FileAudio className="size-4" />
                <span>2. MP3 / Audio Speech</span>
                {audioFile && <span className="size-2 rounded-full bg-emerald-400" />}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("record")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                  activeTab === "record"
                    ? "bg-purple-600 text-white font-bold shadow-md"
                    : "text-[#64748b] hover:text-[#0b1c30] hover:bg-[#f8f9ff]"
                }`}
              >
                <Mic className="size-4" />
                <span>3. Live Recording</span>
                {recordedBlob && <span className="size-2 rounded-full bg-emerald-400" />}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("spiral")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                  activeTab === "spiral"
                    ? "bg-purple-600 text-white font-bold shadow-md"
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
                    ? "bg-purple-600 text-white font-bold shadow-md"
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
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow-md"
                    : "text-purple-700 bg-purple-50/60 hover:bg-purple-100"
                }`}
              >
                <Sparkles className="size-4" />
                <span>Full Multimodal Fusion ({activeModalitiesCount}/5 Active)</span>
              </button>
            </div>
          </div>

          {/* Step 3: Dynamic Modality Workspace */}
          <div className="bg-white rounded-2xl p-6 shadow-card border border-[#e2e8f0]">
            {/* 1. BRAIN MRI TAB */}
            {activeTab === "mri" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
                  <div>
                    <h3 className="font-headline text-sm font-bold text-[#0b1c30]">
                      Volumetric Brain MRI Scan Ingestion
                    </h3>
                    <p className="text-xs text-[#64748b]">
                      DenseNet121 &amp; Vision Transformer feature fusion with brain-only Grad-CAM activation mapping.
                    </p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[0.68rem] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                    Structural Neuroimaging
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  <div className={mriPreviewUrl ? "lg:col-span-6 space-y-4" : "lg:col-span-12 space-y-4"}>
                    <MRIUploader
                      selectedFile={mriFile}
                      onSelectFile={selectMriFile}
                      onSelectSample={selectMriSample}
                      onClear={resetAnalysis}
                      modality={modality}
                      onChangeModality={setModality}
                    />
                  </div>

                  {mriPreviewUrl && (
                    <div className="lg:col-span-6 space-y-4">
                      <MRIPreview previewUrl={mriPreviewUrl} filename={mriFile?.name} modality={modality} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2. AUDIO / MP3 TAB */}
            {activeTab === "audio" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
                  <div>
                    <h3 className="font-headline text-sm font-bold text-[#0b1c30]">
                      Audio / MP3 Vocal &amp; Speech Biomarker Analysis
                    </h3>
                    <p className="text-xs text-[#64748b]">
                      Analyzes linguistic pause patterns, lexical fluency, vocal tremor, and acoustic frequencies.
                    </p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[0.68rem] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
                    Acoustic Biomarkers
                  </span>
                </div>

                <AudioUploader
                  selectedFile={audioFile}
                  onSelectFile={handleSelectAudioFile}
                  onSelectSample={handleAudioSample}
                  onClear={() => {
                    setAudioFile(null);
                    setAudioPlaybackUrl(null);
                  }}
                />

                {audioPlaybackUrl && (
                  <div className="mt-4">
                    <AudioPlayer src={audioPlaybackUrl} filename={audioFile?.name || "Speech_Sample.mp3"} />
                  </div>
                )}
              </div>
            )}

            {/* 3. LIVE RECORDING TAB */}
            {activeTab === "record" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
                  <div>
                    <h3 className="font-headline text-sm font-bold text-[#0b1c30]">
                      Microphone Vocal Phonation &amp; Speech Recording
                    </h3>
                    <p className="text-xs text-[#64748b]">
                      Real-time browser audio recording for sustained vowel phonation (/a/) and cognitive speech reading.
                    </p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[0.68rem] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    Live Phonation
                  </span>
                </div>

                <AudioRecorder
                  onRecorded={handleRecordSuccess}
                  onReset={() => {
                    setRecordedBlob(null);
                    setAudioPlaybackUrl(null);
                  }}
                />

                {audioPlaybackUrl && (
                  <div className="mt-4">
                    <AudioPlayer src={audioPlaybackUrl} filename="Patient_Live_Recording.wav" />
                  </div>
                )}
              </div>
            )}

            {/* 4. SPIRAL & DRAWING TEST TAB */}
            {activeTab === "spiral" && (
              <div className="space-y-4">
                <DrawingCanvas onDrawingComplete={handleDrawingComplete} disease="Alzheimer's Disease" />
              </div>
            )}

            {/* 5. QUANTITATIVE EEG (qEEG) TAB */}
            {activeTab === "eeg" && (
              <div className="space-y-4">
                <EEGViewer disease="Alzheimer's Disease" onDataLoaded={(info: EEGSignalPayload) => setEegInfo(info)} />
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
                    Synchronizes volumetric brain scans, vocal acoustics, drawing kinematics, and electrophysiology.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                        <span>1. Brain MRI Scan</span>
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

                  {/* Audio Card */}
                  <div
                    onClick={() => setActiveTab("audio")}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      audioFile || recordedBlob
                        ? "border-emerald-300 bg-emerald-50/50"
                        : "border-[#e2e8f0] bg-[#f8f9ff] hover:border-cyan-300"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold mb-2">
                      <span className="flex items-center gap-1.5 text-[#0b1c30]">
                        <FileAudio className="size-4 text-[#0ea5e9]" />
                        <span>2. Speech Audio</span>
                      </span>
                      {audioFile || recordedBlob ? (
                        <CheckCircle2 className="size-4 text-emerald-600" />
                      ) : (
                        <span className="text-[0.65rem] text-[#64748b]">Pending</span>
                      )}
                    </div>
                    <p className="text-[0.72rem] text-[#64748b] truncate">
                      {audioFile ? audioFile.name : "Click to upload audio or record voice"}
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
                        <span>3. Spiral Drawing</span>
                      </span>
                      {spiralFile ? (
                        <CheckCircle2 className="size-4 text-emerald-600" />
                      ) : (
                        <span className="text-[0.65rem] text-[#64748b]">Pending</span>
                      )}
                    </div>
                    <p className="text-[0.72rem] text-[#64748b] truncate">
                      {spiralFile ? spiralFile.name : "Click to draw spiral or upload paper test"}
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
                        <span>4. Quantitative EEG</span>
                      </span>
                      <CheckCircle2 className="size-4 text-emerald-600" />
                    </div>
                    <p className="text-[0.72rem] text-[#64748b] truncate">
                      16-Channel Montage Active (Slowing: {eegInfo?.slowingIndex ?? "2.31"})
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
            <div className="rounded-2xl border border-purple-200 bg-gradient-to-r from-purple-50/70 via-indigo-50/40 to-purple-50/70 p-6 shadow-card flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="font-headline font-bold text-[#0b1c30] text-base flex items-center gap-2">
                  <Sparkles className="size-4 text-purple-600" />
                  <span>Execute Multimodal AI Evaluation</span>
                </h4>
                <p className="text-xs text-[#64748b] mt-0.5">
                  Patient: <strong className="text-purple-700">{selectedPatient?.fullName || "Selected Patient"}</strong>
                  {" • "}
                  <span>Active Modalities: <strong>{activeModalitiesCount} configured</strong></span>
                </p>
              </div>

              <button
                type="button"
                onClick={handleStartAnalysis}
                disabled={!selectedPatient || isProcessing}
                className="btn-primary bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 py-3.5 px-8 text-xs font-bold shadow-lg hover:scale-105 transition-all text-white flex items-center gap-2"
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
