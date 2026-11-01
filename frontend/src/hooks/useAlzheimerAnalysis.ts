import { useState, useCallback } from "react";
import { alzheimerApi, AlzheimerAnalysisResult, AlzheimerPipelineStage } from "@/services/alzheimerApi";
import { useToast } from "@/context/ToastContext";

const INITIAL_STAGES: AlzheimerPipelineStage[] = [
  { id: "upload", name: "MRI Volumetric Upload & Header Validation", detail: "Validating DICOM/NIfTI 3D voxel resolution and matrix format", status: "pending" },
  { id: "preprocess", name: "Skull Stripping & MNI-152 Registration", detail: "Intensity bias field correction & non-brain tissue stripping", status: "pending" },
  { id: "cnn", name: "3D CNN Spatial Feature Extraction", detail: "Convolutional residual backbone extracting localized structural cues", status: "pending" },
  { id: "vit", name: "Vision Transformer Multi-Head Self-Attention", detail: "Global receptive field attention across distant cortical regions", status: "pending" },
  { id: "fusion", name: "Cross-Modal Dense Feature Fusion", detail: "Fusing CNN spatial textures with ViT relational attention tokens", status: "pending" },
  { id: "classify", name: "Multi-Class Probability Distribution", detail: "Predicting probability distribution over AD/MCI/Control classes", status: "pending" },
  { id: "explain", name: "Grad-CAM Heatmap & SHAP Attribution", detail: "Synthesizing gradient-weighted activation map & biomarker values", status: "pending" },
];

export function useAlzheimerAnalysis() {
  const [file, setFile] = useState<File | { name: string; size: number; sampleType?: string } | null>(null);
  const [mriPreviewUrl, setMriPreviewUrl] = useState<string | null>(null);
  const [modality, setModality] = useState("3D T1-weighted MRI");
  const [isProcessing, setIsProcessing] = useState(false);
  const [stages, setStages] = useState<AlzheimerPipelineStage[]>(INITIAL_STAGES);
  const [result, setResult] = useState<AlzheimerAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { success, error: toastError } = useToast();

  const resetAnalysis = useCallback(() => {
    setFile(null);
    setMriPreviewUrl(null);
    setIsProcessing(false);
    setStages(INITIAL_STAGES.map((s) => ({ ...s, status: "pending" })));
    setResult(null);
    setError(null);
  }, []);

  const handleSelectFile = useCallback((newFile: File) => {
    setFile(newFile);
    setError(null);
    // Create preview if it is image
    if (newFile.type.startsWith("image/")) {
      const url = URL.createObjectURL(newFile);
      setMriPreviewUrl(url);
    } else {
      // Use standard axial brain scan asset for DICOM/NIFTI demonstration
      setMriPreviewUrl("/assets/xray-brain.jpg");
    }
  }, []);

  const handleSelectSample = useCallback((presetId: string) => {
    const presets = alzheimerApi.getSamplePresets();
    const found = presets.find((p) => p.id === presetId) || presets[0];
    setFile({
      name: `${found.id}_volumetric_t1.nii.gz`,
      size: 14.8 * 1024 * 1024,
      sampleType: found.title,
    });
    setMriPreviewUrl("/assets/xray-brain.jpg");
    setError(null);
  }, []);

  const runAnalysis = useCallback(
    async (patientId: string, patientName: string) => {
      if (!file) {
        const msg = "Please upload an MRI scan or select a sample scan first.";
        setError(msg);
        toastError("MRI Required", msg);
        return null;
      }

      setIsProcessing(true);
      setError(null);
      setResult(null);

      // Reset stages to pending
      setStages(INITIAL_STAGES.map((s) => ({ ...s, status: "pending" })));

      try {
        const analysisResult = await alzheimerApi.analyzeMri(
          patientId,
          patientName,
          file,
          modality,
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
        success("Alzheimer's Analysis Complete", `Predicted: ${analysisResult.prediction} (${analysisResult.confidence.toFixed(1)}% confidence)`);
        return analysisResult;
      } catch (err: any) {
        const msg = err.message || "Failed to analyze MRI scan. Please check file format and try again.";
        setError(msg);
        toastError("Analysis Failed", msg);
        return null;
      } finally {
        setIsProcessing(false);
      }
    },
    [file, modality, success, toastError]
  );

  return {
    file,
    mriPreviewUrl,
    modality,
    setModality,
    isProcessing,
    stages,
    result,
    error,
    selectFile: handleSelectFile,
    selectSample: handleSelectSample,
    runAnalysis,
    resetAnalysis,
    setResult,
  };
}
