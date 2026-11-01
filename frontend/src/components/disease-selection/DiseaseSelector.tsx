import React from "react";
import { Brain, Activity, ArrowRight, Clock, Sparkles, Cpu, Layers, CheckCircle2, User } from "lucide-react";
import { PatientRecord } from "@/services/patientApi";
import { PatientSelector } from "@/components/common/PatientSelector";

interface DiseaseSelectorProps {
  selectedPatient?: PatientRecord | null;
  onSelectPatient?: (patient: PatientRecord | null) => void;
  onSelectAlzheimer: () => void;
  onSelectParkinson: () => void;
  onSelectDisease?: (disease: "alzheimer" | "parkinson") => void;
}

export function DiseaseSelector({
  selectedPatient,
  onSelectPatient,
  onSelectAlzheimer,
  onSelectParkinson,
}: DiseaseSelectorProps) {
  return (
    <div className="space-y-6 text-[#0b1c30] select-none">
      {/* Page Title & Subtitle */}
      <div className="border-b border-[#e2e8f0] pb-4">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 text-[0.65rem] font-bold">
            Multi-Disease Diagnostics
          </span>
          <span className="text-[#64748b]">•</span>
          <span className="text-xs font-mono text-[#64748b]">Route: /analysis</span>
        </div>
        <h2 className="font-headline font-extrabold text-2xl sm:text-3xl text-[#0b1c30] tracking-tight mt-1">
          Select Diagnostic Module
        </h2>
        <p className="text-xs text-[#64748b] mt-1 max-w-2xl">
          Choose the appropriate AI analysis pathway based on the patient&rsquo;s preliminary assessment, clinical symptoms, and available imaging or vocal biomarker data.
        </p>
      </div>

      {/* Patient Selection Box if selector function provided */}
      {onSelectPatient && (
        <div className="bg-white rounded-2xl p-6 shadow-card border border-[#e2e8f0]">
          <div className="max-w-xl">
            <PatientSelector
              selectedPatient={selectedPatient ?? null}
              onSelect={onSelectPatient}
            />
          </div>
        </div>
      )}

      {/* Dual Module Cards Grid (Stitch Design) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Module 1: Alzheimer's Disease (Brain MRI) */}
        <button
          type="button"
          onClick={onSelectAlzheimer}
          className="group relative bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden text-left hover:shadow-card-deep hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] flex flex-col h-full shadow-card"
        >
          {/* Card Top Banner Area */}
          <div className="h-48 sm:h-56 bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center relative overflow-hidden border-b border-[#e2e8f0]">
            <img
              src="https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=1200&q=80"
              alt="Brain MRI Visualization"
              className="absolute inset-0 size-full object-cover opacity-35 group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b1c30]/90 via-transparent to-transparent" />

            {/* Modality Pill */}
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 flex items-center gap-1.5 shadow-sm">
              <span className="size-2 rounded-full bg-purple-600 animate-pulse" />
              <span className="text-[0.68rem] font-bold text-[#0b1c30]">3D MRI Structural Analysis</span>
            </div>

            <div className="absolute bottom-4 left-4 text-white">
              <span className="text-[0.65rem] uppercase font-bold tracking-widest text-[#39b8fd]">
                Module 01 • Neuro-Imaging
              </span>
            </div>
          </div>

          {/* Card Content Area */}
          <div className="p-6 flex flex-col flex-1 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-headline text-xl font-extrabold text-[#0b1c30]">
                  Alzheimer&rsquo;s Disease
                </h3>
                <p className="text-xs text-[#64748b] font-medium mt-0.5">
                  Brain MRI Volumetric &amp; Cortical Thickness Analysis
                </p>
              </div>
              <div className="flex size-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 border border-purple-200 shadow-sm shrink-0">
                <Brain className="size-6" />
              </div>
            </div>

            <p className="text-xs text-[#475569] leading-relaxed flex-1">
              Utilizes a multimodal 3D Convolutional Neural Network (CNN) coupled with a Vision Transformer (ViT) ensemble to detect subtle hippocampal atrophy and ventricular enlargement from T1/T2 MRI scans.
            </p>

            {/* Tech Specs Inner Bento */}
            <div className="grid grid-cols-2 gap-3 bg-[#f8f9ff] p-3.5 rounded-xl border border-[#e2e8f0] text-xs">
              <div>
                <span className="block text-[0.65rem] font-bold uppercase text-[#64748b]">
                  Deep Learning Engine
                </span>
                <span className="font-semibold text-[#0b1c30] mt-0.5 block">
                  3D CNN + ViT Ensemble
                </span>
              </div>
              <div>
                <span className="block text-[0.65rem] font-bold uppercase text-[#64748b]">
                  AI Explainability
                </span>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="rounded bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 text-[0.65rem] font-bold">
                    Grad-CAM 3D
                  </span>
                  <span className="rounded bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 text-[0.65rem] font-bold">
                    SHAP
                  </span>
                </div>
              </div>
            </div>

            {/* Action Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-[#e2e8f0] text-xs">
              <span className="text-[#64748b] flex items-center gap-1.5">
                <Clock className="size-3.5 text-[#0ea5e9]" />
                <span>Est. Processing: ~45 sec</span>
              </span>
              <span className="font-bold text-[#0ea5e9] group-hover:translate-x-1 transition-transform flex items-center gap-1">
                <span>Initialize Module</span>
                <ArrowRight className="size-4" />
              </span>
            </div>
          </div>
        </button>

        {/* Module 2: Parkinson's Disease (Voice & Quantum-AI) */}
        <button
          type="button"
          onClick={onSelectParkinson}
          className="group relative bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden text-left hover:shadow-card-deep hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] flex flex-col h-full shadow-card"
        >
          {/* Card Top Banner Area */}
          <div className="h-48 sm:h-56 bg-gradient-to-tr from-[#0b1c30] via-slate-900 to-[#0b1c30] flex items-center justify-center relative overflow-hidden border-b border-[#e2e8f0]">
            <img
              src="/images/sound_waves.jpg"
              alt="Digital Acoustic Sound Waves and Frequency Spectrum"
              className="absolute inset-0 size-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-700 filter brightness-105 contrast-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b1c30]/95 via-transparent to-[#0b1c30]/40" />

            {/* Modality Pill */}
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 flex items-center gap-1.5 shadow-sm">
              <span className="size-2 rounded-full bg-cyan-500 animate-pulse" />
              <span className="text-[0.68rem] font-bold text-[#0b1c30]">Acoustic Phonation Signal</span>
            </div>

            <div className="absolute bottom-4 left-4 text-white">
              <span className="text-[0.65rem] uppercase font-bold tracking-widest text-[#39b8fd]">
                Module 02 • Vocal Biomarkers
              </span>
            </div>
          </div>

          {/* Card Content Area */}
          <div className="p-6 flex flex-col flex-1 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-headline text-xl font-extrabold text-[#0b1c30]">
                  Parkinson&rsquo;s Disease
                </h3>
                <p className="text-xs text-[#64748b] font-medium mt-0.5">
                  Vocal Biomarker Perturbation &amp; Quantum-Inspired Decision
                </p>
              </div>
              <div className="flex size-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600 border border-cyan-200 shadow-sm shrink-0">
                <Activity className="size-6" />
              </div>
            </div>

            <p className="text-xs text-[#475569] leading-relaxed flex-1">
              Analyzes sustained phonation recordings to detect acoustic jitter, shimmer perturbation, and micro-tremors utilizing a 4-qubit Quantum-Inspired decision boundary simulation.
            </p>

            {/* Tech Specs Inner Bento */}
            <div className="grid grid-cols-2 gap-3 bg-[#f8f9ff] p-3.5 rounded-xl border border-[#e2e8f0] text-xs">
              <div>
                <span className="block text-[0.65rem] font-bold uppercase text-[#64748b]">
                  Decision Layer
                </span>
                <span className="font-semibold text-[#0b1c30] mt-0.5 block">
                  Quantum-Inspired VQC (4-Qubit)
                </span>
              </div>
              <div>
                <span className="block text-[0.65rem] font-bold uppercase text-[#64748b]">
                  Acoustic Features
                </span>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="rounded bg-cyan-50 text-cyan-700 border border-cyan-200 px-1.5 py-0.5 text-[0.65rem] font-bold">
                    MDVP Jitter/Shimmer
                  </span>
                  <span className="rounded bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 text-[0.65rem] font-bold">
                    HNR
                  </span>
                </div>
              </div>
            </div>

            {/* Action Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-[#e2e8f0] text-xs">
              <span className="text-[#64748b] flex items-center gap-1.5">
                <Clock className="size-3.5 text-[#0ea5e9]" />
                <span>Est. Processing: ~12 sec</span>
              </span>
              <span className="font-bold text-[#0ea5e9] group-hover:translate-x-1 transition-transform flex items-center gap-1">
                <span>Initialize Module</span>
                <ArrowRight className="size-4" />
              </span>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
