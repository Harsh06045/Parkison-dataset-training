import React, { useState, useEffect } from "react";
import { X, Brain, Cpu, CheckCircle2, ShieldCheck, Sparkles, AlertCircle } from "lucide-react";
import { doctorService, MriScan } from "@/lib/doctorService";

interface PredictionModalProps {
  isOpen: boolean;
  onClose: () => void;
  scan: MriScan | null;
  onPredictionComplete: (updatedScan: MriScan) => void;
}

export function PredictionModal({ isOpen, onClose, scan, onPredictionComplete }: PredictionModalProps) {
  const [step, setStep] = useState<number>(0);
  const [isDone, setIsDone] = useState(false);
  const [resultScan, setResultScan] = useState<MriScan | null>(null);

  useEffect(() => {
    if (isOpen && scan) {
      setStep(1);
      setIsDone(false);
      setResultScan(null);

      // Step 1 -> 2
      const t1 = setTimeout(() => setStep(2), 600);
      // Step 2 -> 3
      const t2 = setTimeout(() => setStep(3), 1200);
      // Step 3 -> Complete
      const t3 = setTimeout(async () => {
        setStep(4);
        const updated = await doctorService.triggerPrediction(scan.id);
        setResultScan(updated);
        setIsDone(true);
        onPredictionComplete(updated);
      }, 2000);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [isOpen, scan?.id]);

  if (!isOpen || !scan) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl border border-indigo-500/40 bg-[#06081a] p-6 sm:p-8 shadow-[0_0_60px_rgba(99,102,241,0.3)] text-white">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 flex size-8 items-center justify-center rounded-full bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <X className="size-4" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-6">
          <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/40">
            <Cpu className="size-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">NeuroFusion 3D AI Prediction Engine</h2>
            <p className="text-xs text-slate-400">
              Scan ID: <span className="text-white font-mono">{scan.id}</span> • {scan.patientName} ({scan.modality})
            </p>
          </div>
        </div>

        {/* Inference Steps Pipeline */}
        <div className="space-y-4 my-6">
          {/* Step 1 */}
          <div
            className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
              step >= 1 ? "bg-slate-900/80 border-indigo-500/40" : "bg-slate-950/40 border-slate-900"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex size-7 items-center justify-center rounded-lg text-xs font-bold ${
                  step > 1 ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" : step === 1 ? "bg-indigo-600 text-white animate-pulse" : "bg-slate-800 text-slate-500"
                }`}
              >
                {step > 1 ? <CheckCircle2 className="size-4" /> : "1"}
              </div>
              <div>
                <p className="text-xs font-bold text-white">Skull Stripping &amp; Volumetric Normalization</p>
                <p className="text-[0.68rem] text-slate-400">MNI-152 spatial registration &amp; intensity bias correction</p>
              </div>
            </div>
            {step === 1 && <span className="text-[0.68rem] font-semibold text-indigo-400 animate-pulse">Running...</span>}
          </div>

          {/* Step 2 */}
          <div
            className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
              step >= 2 ? "bg-slate-900/80 border-indigo-500/40" : "bg-slate-950/40 border-slate-900"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex size-7 items-center justify-center rounded-lg text-xs font-bold ${
                  step > 2 ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" : step === 2 ? "bg-indigo-600 text-white animate-pulse" : "bg-slate-800 text-slate-500"
                }`}
              >
                {step > 2 ? <CheckCircle2 className="size-4" /> : "2"}
              </div>
              <div>
                <p className="text-xs font-bold text-white">3D Vision Transformer &amp; ResNet Ensemble Inference</p>
                <p className="text-[0.68rem] text-slate-400">Multi-modal feature extraction across 128 axial slices</p>
              </div>
            </div>
            {step === 2 && <span className="text-[0.68rem] font-semibold text-indigo-400 animate-pulse">Computing...</span>}
          </div>

          {/* Step 3 */}
          <div
            className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
              step >= 3 ? "bg-slate-900/80 border-indigo-500/40" : "bg-slate-950/40 border-slate-900"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex size-7 items-center justify-center rounded-lg text-xs font-bold ${
                  step > 3 ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" : step === 3 ? "bg-indigo-600 text-white animate-pulse" : "bg-slate-800 text-slate-500"
                }`}
              >
                {step > 3 ? <CheckCircle2 className="size-4" /> : "3"}
              </div>
              <div>
                <p className="text-xs font-bold text-white">Grad-CAM Volumetric Attention &amp; Z-Score Mapping</p>
                <p className="text-[0.68rem] text-slate-400">Calculating hippocampal atrophy index &amp; striatal binding ratios</p>
              </div>
            </div>
            {step === 3 && <span className="text-[0.68rem] font-semibold text-indigo-400 animate-pulse">Mapping...</span>}
          </div>
        </div>

        {/* Prediction Results Display */}
        {isDone && resultScan && (
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/20 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="size-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">AI Diagnostic Inference Output</h3>
              </div>
              <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3 py-0.5 text-xs font-extrabold text-emerald-300">
                {resultScan.confidence}% Confidence Score
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
                <p className="text-slate-400 text-[0.68rem]">Predicted Target</p>
                <p className="font-bold text-purple-300 mt-0.5">{resultScan.predictedDisease}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
                <p className="text-slate-400 text-[0.68rem]">Staging Severity</p>
                <p className="font-bold text-blue-300 mt-0.5">{resultScan.stage}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
                <p className="text-slate-400 text-[0.68rem]">Hippocampal Volume</p>
                <p className="font-bold text-emerald-300 mt-0.5">{resultScan.hippocampalVolumeMm3 || 3200} mm³</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800 mt-6">
          <button
            onClick={onClose}
            className="h-10 rounded-xl bg-blue-600 px-6 text-xs font-bold text-white shadow-lg hover:bg-blue-500"
          >
            {isDone ? "Done & Return to Workspace" : "Processing..."}
          </button>
        </div>
      </div>
    </div>
  );
}
