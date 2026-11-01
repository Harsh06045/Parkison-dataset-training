import { Brain, ShieldCheck, HeartPulse, Award, Microchip, Activity } from "lucide-react";

export function AboutSection() {
  return (
    <section className="relative z-10 mx-auto max-w-7xl px-4 sm:px-8 lg:px-12 py-12 sm:py-20 text-white select-none">
      {/* Header Badge & Title */}
      <div className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-4">
        <span className="inline-block rounded-full bg-blue-500/15 border border-blue-500/30 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-blue-300 backdrop-blur-md">
          About NeuroFusion AI
        </span>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
          Pioneering Predictive Accuracy for <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Neurodegenerative Diseases</span>
        </h2>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
          NeuroFusion AI combines volumetric 3D Convolutional Neural Networks with explainable biomarker mapping to help clinicians detect Alzheimer&rsquo;s and Parkinson&rsquo;s years before irreversible symptom onset.
        </p>
      </div>

      {/* Grid Stats & Pillars */}
      <div className="mt-12 sm:mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-3xl border border-blue-500/20 bg-slate-950/70 p-6 sm:p-8 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex flex-col justify-between space-y-4">
          <div className="size-12 rounded-2xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Brain className="size-6" />
          </div>
          <div>
            <div className="text-4xl font-extrabold text-white">98.4%</div>
            <h3 className="text-lg font-bold text-blue-300 mt-1">Diagnostic Accuracy</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Trained on over 120,000 anonymized 3D MRI scans across multi-center neurological trials.
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-blue-500/20 bg-slate-950/70 p-6 sm:p-8 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex flex-col justify-between space-y-4">
          <div className="size-12 rounded-2xl bg-blue-950/60 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <ShieldCheck className="size-6" />
          </div>
          <div>
            <div className="text-4xl font-extrabold text-white">3.5 Yrs</div>
            <h3 className="text-lg font-bold text-blue-300 mt-1">Earlier Detection</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Detect subtle hippocampal atrophy and striatal dopaminergic decline before visible clinical impairment.
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-blue-500/20 bg-slate-950/70 p-6 sm:p-8 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex flex-col justify-between space-y-4">
          <div className="size-12 rounded-2xl bg-teal-950/60 border border-teal-500/30 flex items-center justify-center text-teal-400">
            <HeartPulse className="size-6" />
          </div>
          <div>
            <div className="text-4xl font-extrabold text-white">100%</div>
            <h3 className="text-lg font-bold text-blue-300 mt-1">Explainable Heatmaps</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              3D Grad-CAM volumetric visualizations empower physicians with verifiable regional confidence scores.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
