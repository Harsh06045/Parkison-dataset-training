import React from "react";
import { CheckCircle2, Loader2, Circle, Brain } from "lucide-react";
import { AlzheimerPipelineStage } from "@/services/alzheimerApi";

interface ProcessingPipelineProps {
  stages: AlzheimerPipelineStage[];
  isProcessing: boolean;
}

export function ProcessingPipeline({ stages, isProcessing }: ProcessingPipelineProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-card border border-[#e2e8f0] space-y-5 text-[#0b1c30] select-none">
      <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
        <div className="flex items-center gap-2">
          <Brain className="size-4 text-purple-600" />
          <h3 className="font-headline text-xs font-bold text-[#0b1c30] uppercase tracking-wider">
            3D CNN + Vision Transformer Multimodal Pipeline Execution
          </h3>
        </div>
        {isProcessing && (
          <span className="flex items-center gap-1.5 text-xs font-bold text-[#0ea5e9]">
            <Loader2 className="size-3.5 animate-spin" />
            <span>Processing Neural Ingestion...</span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2.5">
        {stages.map((st, idx) => {
          const isComplete = st.status === "completed";
          const isRunning = st.status === "running";

          return (
            <div
              key={st.id}
              className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between space-y-2 ${
                isComplete
                  ? "bg-purple-50/70 border-purple-200 text-purple-900"
                  : isRunning
                  ? "bg-[#e0f2fe] border-[#0ea5e9] text-[#0b1c30] shadow-sm animate-pulse"
                  : "bg-[#f8f9ff] border-[#e2e8f0] text-[#94a3b8]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[0.68rem] font-bold text-[#64748b]">
                  0{idx + 1}
                </span>
                {isComplete ? (
                  <CheckCircle2 className="size-4 text-purple-600" />
                ) : isRunning ? (
                  <Loader2 className="size-4 text-[#0ea5e9] animate-spin" />
                ) : (
                  <Circle className="size-3.5 text-[#cbd5e1]" />
                )}
              </div>

              <div>
                <p className="font-bold text-xs leading-snug">{st.name}</p>
                <p className="text-[0.62rem] text-[#64748b] mt-0.5 leading-tight">{st.detail}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
