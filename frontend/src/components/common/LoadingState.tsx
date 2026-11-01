import React from "react";
import { Brain, Loader2 } from "lucide-react";

interface LoadingStateProps {
  message?: string;
  subMessage?: string;
  fullHeight?: boolean;
}

export function LoadingState({
  message = "Loading NeuroFusion AI...",
  subMessage = "Accessing secure clinical neuro-informatics pipeline",
  fullHeight = false,
}: LoadingStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center select-none ${
        fullHeight ? "min-h-[60vh]" : "py-16"
      }`}
    >
      <div className="relative mb-5">
        <div className="flex size-16 items-center justify-center rounded-3xl bg-blue-950/80 border border-blue-500/40 text-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.3)] animate-pulse">
          <Brain className="size-8" />
        </div>
        <div className="absolute -inset-2 rounded-full border border-blue-400/30 animate-spin border-t-transparent pointer-events-none" />
      </div>
      <h3 className="text-base font-bold text-white tracking-tight">{message}</h3>
      <p className="text-xs text-slate-400 max-w-sm mt-1 leading-relaxed">{subMessage}</p>
    </div>
  );
}
