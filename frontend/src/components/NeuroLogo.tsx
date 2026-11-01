import { Brain } from "lucide-react";

export function NeuroLogo() {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-3">
        <div className="relative flex size-10 items-center justify-center rounded-xl bg-indigo-950/60 border border-indigo-500/40 shadow-[0_0_20px_rgba(99,102,241,0.35)] backdrop-blur-md">
          <Brain className="size-6 text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.8)]" aria-hidden="true" />
        </div>
        <span className="text-2xl font-bold tracking-tight text-white">
          Neuro<span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">Fusion AI</span>
        </span>
      </div>
      <p className="text-[0.72rem] font-medium tracking-wide text-slate-400 pl-0.5">
        Intelligent. <span className="text-blue-400">Explainable.</span> Reliable.
      </p>
    </div>
  );
}
