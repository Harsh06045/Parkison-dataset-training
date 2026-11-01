import { useState, useCallback } from "react";
import { parkinsonApi, ParkinsonAnalysisResult } from "@/services/parkinsonApi";
import { useToast } from "@/context/ToastContext";

export interface ParkinsonPipelineStage {
  id: string;
  name: string;
  detail: string;
  status: "pending" | "running" | "completed" | "error";
}

const INITIAL_STAGES: ParkinsonPipelineStage[] = [
  { id: "audio_in", name: "Voice Signal Ingestion & Spectral Normalization", detail: "Removing background ambient noise & applying Hamming windowing", status: "pending" },
  { id: "acoustic_extract", name: "Acoustic Biomarker Extraction (Jitter/Shimmer/HNR)", detail: "Quantifying cycle-to-cycle perturbation & vocal fold harmonics", status: "pending" },
  { id: "dl_backbone", name: "Deep Neural Acoustic Backbone", detail: "Extracting 16-dimensional continuous acoustic feature embedding", status: "pending" },
  { id: "quantum_encode", name: "Quantum-Inspired State Encoding & Rotation", detail: "Mapping features onto 4-qubit Hilbert space via Ry rotations", status: "pending" },
  { id: "measurement", name: "Pauli-Z Observable Measurement & Decision Layer", detail: "Collapsing superposition to calculate high-separation decision score", status: "pending" },
  { id: "shap_explain", name: "Vocal Biomarker SHAP Attribution Engine", detail: "Computing game-theoretic SHAP importance for dysphonia features", status: "pending" },
];

export function useParkinsonAnalysis() {
  const [audioInputType, setAudioInputType] = useState<"upload" | "record" | "sample">("upload");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [samplePresetId, setSamplePresetId] = useState<string | null>(null);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stages, setStages] = useState<ParkinsonPipelineStage[]>(INITIAL_STAGES);
  const [result, setResult] = useState<ParkinsonAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { success, error: toastError } = useToast();

  const resetAnalysis = useCallback(() => {
    setUploadedFile(null);
    setSamplePresetId(null);
    if (playbackUrl) {
      URL.revokeObjectURL(playbackUrl);
      setPlaybackUrl(null);
    }
    setIsProcessing(false);
    setStages(INITIAL_STAGES.map((s) => ({ ...s, status: "pending" })));
    setResult(null);
    setError(null);
  }, [playbackUrl]);

  const selectFile = useCallback((file: File) => {
    setUploadedFile(file);
    setAudioInputType("upload");
    setSamplePresetId(null);
    const url = URL.createObjectURL(file);
    setPlaybackUrl(url);
    setError(null);
  }, []);

  const selectSample = useCallback((presetId: string) => {
    setSamplePresetId(presetId);
    setAudioInputType("sample");
    setUploadedFile(null);
    setPlaybackUrl(null);
    setError(null);
  }, []);

  const setRecordedAudio = useCallback((blob: Blob, url: string) => {
    setAudioInputType("record");
    setUploadedFile(null);
    setSamplePresetId(null);
    setPlaybackUrl(url);
    setError(null);
  }, []);

  const runAnalysis = useCallback(
    async (patientId: string, patientName: string, recordedBlob?: Blob | null) => {
      let audioPayload: any = null;
      let source: "upload" | "microphone_recording" | "sample_library" = "upload";

      if (audioInputType === "record" && recordedBlob) {
        audioPayload = recordedBlob;
        source = "microphone_recording";
      } else if (audioInputType === "upload" && uploadedFile) {
        audioPayload = uploadedFile;
        source = "upload";
      } else if (audioInputType === "sample" && samplePresetId) {
        const presets = parkinsonApi.getSamplePresets();
        const found = presets.find((p) => p.id === samplePresetId) || presets[0];
        audioPayload = {
          name: `${found.id}_vocal_analysis.wav`,
          size: 1.2 * 1024 * 1024,
          duration: found.audioDuration,
        };
        source = "sample_library";
      } else {
        const presets = parkinsonApi.getSamplePresets();
        const found = presets[0];
        audioPayload = {
          name: `${found.id}_vocal_analysis.wav`,
          size: 1.2 * 1024 * 1024,
          duration: found.audioDuration,
        };
        source = "sample_library";
      }

      setIsProcessing(true);
      setError(null);
      setResult(null);

      // Reset stages
      setStages(INITIAL_STAGES.map((s) => ({ ...s, status: "pending" })));

      try {
        const analysisResult = await parkinsonApi.analyzeAudio(
          patientId,
          patientName,
          audioPayload,
          source,
          (stageId, status) => {
            setStages((prev) =>
              prev.map((stage) => {
                if (stage.id === stageId) {
                  return { ...stage, status };
                }
                return stage;
              })
            );
          }
        );

        setResult(analysisResult);
        success("Parkinson's Analysis Complete", `Predicted: ${analysisResult.prediction} (${analysisResult.confidence.toFixed(1)}% confidence)`);
        return analysisResult;
      } catch (err: any) {
        const msg = err.message || "Failed to analyze vocal sample. Please check audio format and try again.";
        setError(msg);
        toastError("Analysis Failed", msg);
        return null;
      } finally {
        setIsProcessing(false);
      }
    },
    [audioInputType, uploadedFile, samplePresetId, success, toastError]
  );

  return {
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
    setResult,
  };
}
