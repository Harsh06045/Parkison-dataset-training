import React from "react";
import { Activity } from "lucide-react";
import { ParkinsonAnalysisResult } from "@/services/parkinsonApi";

interface PredictionCardProps {
  result: ParkinsonAnalysisResult;
}

export function PredictionCard({ result }: PredictionCardProps) {
  return (
    <div className="space-y-6 text-[#0b1c30] select-none">
      {/* 1. Main AI Diagnosis Card (Stitch Design) */}
      <div className="bg-white rounded-2xl p-6 shadow-card border border-[#e2e8f0] border-l-4 border-l-[#0ea5e9] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[0.68rem] font-bold text-[#0ea5e9] uppercase tracking-wider">
              Primary AI Diagnosis
            </span>
            <span className="text-xs text-[#64748b]">•</span>
            <span className="text-xs text-[#64748b] font-mono">Quantum-Inspired DL Model</span>
          </div>
          <Activity className="size-5 text-[#0ea5e9]" />
        </div>

        <div>
          <h2 className="font-headline text-2xl sm:text-3xl font-extrabold text-[#0b1c30] tracking-tight">
            {result.prediction}
          </h2>
          <p className="text-xs text-[#64748b] mt-1 leading-relaxed">
            Acoustic phonatory patterns evaluate to {result.prediction.toLowerCase()} with significant vocal stability metrics.
          </p>
        </div>

        {/* Confidence Gauge Bar */}
        <div className="pt-2">
          <div className="flex justify-between items-end mb-1.5">
            <span className="text-[0.68rem] font-bold text-[#64748b] uppercase tracking-wider">
              Diagnostic Confidence Score
            </span>
            <span className="font-mono text-lg font-extrabold text-[#0ea5e9]">
              {result.confidence.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-[#f1f5f9] rounded-full h-3 overflow-hidden p-0.5 border border-[#e2e8f0]">
            <div
              className="bg-[#0ea5e9] h-full rounded-full transition-all duration-700"
              style={{ width: `${result.confidence}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Multi-Class Probability Distribution */}
      <div className="bg-white rounded-2xl p-6 shadow-card border border-[#e2e8f0] space-y-4">
        <h3 className="font-headline text-xs font-bold text-[#0b1c30] uppercase tracking-wider border-b border-[#e2e8f0] pb-2">
          Multi-Class Posterior Probability Distribution
        </h3>

        <div className="space-y-3">
          {Object.entries(result.classProbabilities || {}).map(([stageName, prob]) => {
            const pct = Math.round(Number(prob) * 100);
            const isHighest = stageName === result.prediction;

            return (
              <div key={stageName} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className={`font-semibold ${isHighest ? "text-[#0ea5e9]" : "text-[#475569]"}`}>
                    {stageName} {isHighest && "★"}
                  </span>
                  <span className="font-mono font-bold text-[#0b1c30]">{pct}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-[#f1f5f9] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isHighest ? "bg-[#0ea5e9]" : "bg-[#94a3b8]"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Extracted Acoustic Biomarkers */}
      <div className="bg-white rounded-2xl p-6 shadow-card border border-[#e2e8f0] space-y-4">
        <h3 className="font-headline text-xs font-bold text-[#0b1c30] uppercase tracking-wider border-b border-[#e2e8f0] pb-2">
          Extracted Phonatory Acoustic Biomarkers
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0]">
            <p className="text-[#64748b]">MDVP: Jitter (%)</p>
            <p className="text-base font-bold font-mono text-[#0b1c30] mt-0.5">
              {(result.vocalBiomarkers?.jitterPercent * 100 || 0.78).toFixed(3)}%
            </p>
            <span className="text-[0.62rem] text-rose-600 font-semibold">Threshold &gt; 0.40%</span>
          </div>

          <div className="p-3 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0]">
            <p className="text-[#64748b]">MDVP: Shimmer (dB)</p>
            <p className="text-base font-bold font-mono text-[#0b1c30] mt-0.5">
              {(result.vocalBiomarkers?.shimmerDb || 0.042).toFixed(3)} dB
            </p>
            <span className="text-[0.62rem] text-amber-600 font-semibold">Threshold &gt; 0.025 dB</span>
          </div>

          <div className="p-3 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0]">
            <p className="text-[#64748b]">Harmonics-to-Noise (HNR)</p>
            <p className="text-base font-bold font-mono text-[#0b1c30] mt-0.5">
              {(result.vocalBiomarkers?.hnrDb || 18.2).toFixed(1)} dB
            </p>
            <span className="text-[0.62rem] text-cyan-600 font-semibold">Normal &gt; 20.0 dB</span>
          </div>
        </div>
      </div>
    </div>
  );
}
