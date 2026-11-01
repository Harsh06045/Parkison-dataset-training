import React from "react";
import { BarChart3, Info, TrendingUp, TrendingDown } from "lucide-react";
import { ShapBiomarkerFeature } from "@/services/alzheimerApi";

interface SHAPViewerProps {
  features: ShapBiomarkerFeature[];
}

export function SHAPViewer({ features }: SHAPViewerProps) {
  const maxVal = Math.max(...(features || []).map((f) => Math.abs(f.shapValue)), 0.01);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-card border border-[#e2e8f0] space-y-6 text-[#0b1c30] select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[#e2e8f0] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[0.68rem] font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
              Quantitative Attribution
            </span>
            <span className="text-xs text-[#64748b]">•</span>
            <span className="text-xs text-[#64748b] font-mono">Shapley Additive Explanations (SHAP)</span>
          </div>
          <h3 className="font-headline text-base font-bold text-[#0b1c30] mt-0.5">
            Volumetric Biomarker Contribution Rankings
          </h3>
        </div>

        <div className="flex items-center gap-3 text-xs font-bold">
          <span className="flex items-center gap-1 text-rose-600">
            <span className="size-2 rounded-full bg-rose-500" />
            Increases Risk
          </span>
          <span className="flex items-center gap-1 text-emerald-600">
            <span className="size-2 rounded-full bg-emerald-500" />
            Protective Factor
          </span>
        </div>
      </div>

      {/* SHAP Feature Contribution Bars */}
      <div className="space-y-4">
        {(features || []).map((feat, idx) => {
          const isPositive = feat.shapValue > 0;
          const barWidth = Math.min(100, Math.round((Math.abs(feat.shapValue) / maxVal) * 100));

          return (
            <div key={idx} className="space-y-1.5 p-3 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                <div>
                  <span className="font-bold text-[#0b1c30]">{feat.featureName}</span>
                  <span className="text-[0.68rem] text-[#64748b] ml-2">
                    Observed: <strong>{feat.patientValue}</strong> (Ref: {feat.normalReference})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[0.68rem] text-[#64748b]">SHAP:</span>
                  <span
                    className={`font-mono font-bold ${
                      isPositive ? "text-rose-600" : "text-emerald-600"
                    }`}
                  >
                    {feat.shapValue > 0 ? `+${feat.shapValue.toFixed(3)}` : feat.shapValue.toFixed(3)}
                  </span>
                </div>
              </div>

              {/* Relative Impact Progress Bar */}
              <div className="h-2 w-full rounded-full bg-[#e2e8f0] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isPositive ? "bg-rose-500" : "bg-emerald-500"
                  }`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>

              <p className="text-[0.68rem] text-[#64748b] leading-relaxed pt-0.5">
                Impact: <strong>{feat.clinicalImpact}</strong> • Category: {feat.category}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
