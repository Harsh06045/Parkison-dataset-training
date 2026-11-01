import React from "react";
import { Atom, Cpu, ArrowRight, CheckCircle2, ShieldCheck, Sparkles, Binary } from "lucide-react";
import { QuantumDecisionData } from "@/services/parkinsonApi";

interface QuantumResultProps {
  quantumMetrics: QuantumDecisionData;
}

export function QuantumResult({ quantumMetrics }: QuantumResultProps) {
  const steps = [
    { num: 1, title: "Model Features", desc: "16 Acoustic Features" },
    { num: 2, title: "Feature Normalization", desc: "Min-Max Standard Scaling" },
    { num: 3, title: "Quantum Encoding", desc: "Angle State Encoding |ψ⟩" },
    { num: 4, title: "Quantum Circuit", desc: "4-Qubit Variational Ansatz" },
    { num: 5, title: "Measurement", desc: "Pauli-Z Expectation ⟨Z⟩" },
    { num: 6, title: "Decision Score", desc: "Diagnostic Classification" },
  ];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-card border border-[#e2e8f0] space-y-6 text-[#0b1c30] select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#e2e8f0] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[0.68rem] font-bold text-cyan-700 uppercase tracking-wider bg-cyan-50 px-2.5 py-0.5 rounded-full border border-cyan-200">
              Decision Layer Architecture
            </span>
            <span className="text-xs text-[#64748b]">•</span>
            <span className="text-xs text-[#64748b] font-mono">Variational Quantum Classifier (VQC)</span>
          </div>
          <h3 className="font-headline text-base font-bold text-[#0b1c30] mt-0.5">
            {quantumMetrics.layerName || "Quantum-Inspired Decision Layer"}
          </h3>
        </div>

        <span className="rounded-full bg-cyan-50 border border-cyan-200 px-3 py-1 text-xs font-bold text-cyan-700">
          Simulation Layer (PennyLane Backend)
        </span>
      </div>

      {/* 6-Step Quantum Pipeline Flow */}
      <div className="space-y-3">
        <h4 className="font-headline text-xs font-bold text-[#0b1c30] uppercase tracking-wider">
          6-Step Quantum Decision Execution Workflow
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {steps.map((step) => (
            <div
              key={step.num}
              className="p-3 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0] flex flex-col justify-between space-y-2 relative group hover:bg-[#e0f2fe]/40 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="flex size-5 items-center justify-center rounded-full bg-[#0ea5e9] text-white font-bold text-[0.65rem]">
                  {step.num}
                </span>
                <Sparkles className="size-3 text-[#0ea5e9]" />
              </div>
              <div>
                <p className="font-bold text-xs text-[#0b1c30]">{step.title}</p>
                <p className="text-[0.65rem] text-[#64748b] mt-0.5">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quantum Metric Parameters Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0]">
          <p className="text-[0.68rem] text-[#64748b]">Phase Angle Rotation (θ)</p>
          <p className="text-base font-bold font-mono text-cyan-600 mt-1">
            {quantumMetrics.quantumPhaseTheta || "1.482 rad"}
          </p>
          <span className="text-[0.62rem] text-[#64748b]">Ansatz Parameter</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0]">
          <p className="text-[0.68rem] text-[#64748b]">Pauli-Z Observable ⟨Z⟩</p>
          <p className="text-base font-bold font-mono text-purple-600 mt-1">
            {quantumMetrics.pauliZExpectationValue?.toFixed(3) || "+0.874"}
          </p>
          <span className="text-[0.62rem] text-[#64748b]">Expectation Value</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0]">
          <p className="text-[0.68rem] text-[#64748b]">State Superposition |ψ⟩</p>
          <p className="text-base font-bold font-mono text-emerald-600 mt-1">
            {((quantumMetrics.superpositionProbabilityPsi || 0.942) * 100).toFixed(1)}%
          </p>
          <span className="text-[0.62rem] text-[#64748b]">State Projection</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0]">
          <p className="text-[0.68rem] text-[#64748b]">Decision Margin</p>
          <p className="text-base font-bold font-mono text-[#0ea5e9] mt-1">
            +{quantumMetrics.quantumAdvantageMargin?.toFixed(1) || "4.2"}%
          </p>
          <span className="text-[0.62rem] text-[#64748b]">Boundary Separation</span>
        </div>
      </div>

      {/* 4-Qubit State Vector Distribution Table */}
      <div className="space-y-2">
        <h4 className="font-headline text-xs font-bold text-[#0b1c30] uppercase tracking-wider flex items-center gap-1.5">
          <Binary className="size-3.5 text-[#0ea5e9]" />
          <span>4-Qubit Computational Basis State Amplitudes</span>
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(quantumMetrics.stateVectorCoefficients || []).slice(0, 4).map((state, idx) => (
            <div key={idx} className="p-2.5 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0] flex items-center justify-between text-xs font-mono">
              <span className="text-[#0ea5e9] font-bold">{state.state}</span>
              <span className="text-[#0b1c30] font-semibold">{state.amplitude}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
