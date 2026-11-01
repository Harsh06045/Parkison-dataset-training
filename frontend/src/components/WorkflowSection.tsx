import { Upload, Cpu, BarChart3, Stethoscope, ArrowRight } from "lucide-react";

const STEPS = [
  {
    step: "01",
    icon: Upload,
    title: "DICOM Scan Ingestion",
    desc: "Seamlessly upload T1-weighted structural 3D MRI or PET scans via PACS integration or secure browser dropzone.",
  },
  {
    step: "02",
    icon: Cpu,
    title: "3D CNN Segmentation",
    desc: "Volumetric Convolutional Neural Networks isolate cortical thickness, ventricular expansion, and subcortical nuclei.",
  },
  {
    step: "03",
    icon: BarChart3,
    title: "Biomarker Scoring",
    desc: "Deep feature models calculate risk probabilities for Alzheimer&rsquo;s (MCI to AD) and Parkinson&rsquo;s disease stages.",
  },
  {
    step: "04",
    icon: Stethoscope,
    title: "Doctor Decision Portal",
    desc: "Review interactive 3D heatmaps, verify regional confidence z-scores, and generate one-click clinical reports.",
  },
];

export function WorkflowSection() {
  return (
    <section className="relative z-10 mx-auto max-w-7xl px-4 sm:px-8 lg:px-12 py-12 sm:py-20 text-white select-none">
      <div className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-4">
        <span className="inline-block rounded-full bg-purple-500/15 border border-purple-500/30 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-purple-300 backdrop-blur-md">
          End-to-End Pipeline
        </span>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
          How the <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">AI Diagnostic Pipeline</span> Works
        </h2>
        <p className="text-sm sm:text-base text-slate-300">
          From raw DICOM image ingestion to verifiable physician diagnostic reports in under 90 seconds.
        </p>
      </div>

      <div className="mt-12 sm:mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {STEPS.map(({ step, icon: Icon, title, desc }, idx) => (
          <div
            key={step}
            className="relative rounded-3xl border border-slate-800 bg-slate-950/70 p-6 backdrop-blur-xl flex flex-col justify-between space-y-4 hover:border-purple-500/40 transition-all shadow-lg"
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-purple-400/80 tracking-widest font-mono">
                {step}
              </span>
              <div className="flex size-10 items-center justify-center rounded-xl bg-purple-950/60 border border-purple-500/30 text-purple-300">
                <Icon className="size-5" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-bold text-white">{title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
