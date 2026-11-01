import React from "react";
import { AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  onBack?: () => void;
}

export function ErrorState({
  title = "Analysis Service Unavailable",
  message = "The diagnostic intelligence pipeline encountered an error. Please verify input parameters or try again.",
  onRetry,
  onBack,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-3xl border border-rose-500/30 bg-rose-950/20 backdrop-blur-xl my-6">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-400 mb-4 shadow-[0_0_20px_rgba(244,63,94,0.2)]">
        <AlertCircle className="size-7" />
      </div>
      <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
      <p className="text-xs text-slate-300 max-w-md mt-1.5 leading-relaxed">{message}</p>

      <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
          >
            <ArrowLeft className="size-3.5" />
            <span>Go Back</span>
          </button>
        )}
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white shadow-lg hover:bg-rose-500 transition-all"
          >
            <RefreshCw className="size-3.5" />
            <span>Retry Operation</span>
          </button>
        )}
      </div>
    </div>
  );
}
