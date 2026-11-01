import { Brain, Eye, LineChart, Shield, Lock, FileText } from "lucide-react";

const FEATURE_LIST = [
  {
    icon: Brain,
    title: "3D Volumetric MRI Segmentation",
    description: "Automated voxel-level isolation of the hippocampus, cortex, and basal ganglia with high-resolution 3D neural rendering.",
    color: "from-purple-500 to-indigo-500",
  },
  {
    icon: Eye,
    title: "Explainable Biomarker Maps",
    description: "3D Grad-CAM overlays highlight regions of tissue loss and amyloid/tau deposition for full clinical transparency.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: LineChart,
    title: "Longitudinal Progression Tracking",
    description: "Compare baseline scans over time to quantify disease velocity and evaluate therapeutic intervention efficacy.",
    color: "from-emerald-500 to-teal-500",
  },
  {
    icon: Shield,
    title: "Role-Based Medical Access",
    description: "Tailored portals for Doctors (diagnostic tools), Patients (health timeline), and Admins (system compliance).",
    color: "from-amber-500 to-orange-500",
  },
  {
    icon: Lock,
    title: "HIPAA & GDPR Data Encryption",
    description: "Zero-Trust end-to-end AES-256 encryption protects DICOM images and patient PHI across all cloud workflows.",
    color: "from-pink-500 to-rose-500",
  },
  {
    icon: FileText,
    title: "Automated Clinical Reports",
    description: "Generate structured, exportable PDF summaries complete with quantitative z-scores and regional volume percentile graphs.",
    color: "from-indigo-500 to-blue-500",
  },
];

export function FeaturesSection() {
  return (
    <section className="relative z-10 mx-auto max-w-7xl px-4 sm:px-8 lg:px-12 py-12 sm:py-20 text-white select-none">
      <div className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-4">
        <span className="inline-block rounded-full bg-indigo-500/15 border border-indigo-500/30 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-indigo-300 backdrop-blur-md">
          Platform Capabilities
        </span>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
          Engineered for <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">Clinical Excellence</span>
        </h2>
        <p className="text-sm sm:text-base text-slate-300">
          Discover how NeuroFusion AI bridges advanced deep learning with intuitive physician decision support.
        </p>
      </div>

      <div className="mt-12 sm:mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {FEATURE_LIST.map(({ icon: Icon, title, description, color }) => (
          <div
            key={title}
            className="group rounded-3xl border border-slate-800 bg-slate-950/70 p-6 sm:p-8 backdrop-blur-xl transition-all duration-300 hover:border-blue-500/40 hover:bg-slate-900/60 shadow-[0_10px_30px_rgba(0,0,0,0.4)]"
          >
            <div className={`size-12 rounded-2xl bg-gradient-to-br ${color} p-0.5 shadow-lg mb-5`}>
              <div className="flex size-full items-center justify-center rounded-[14px] bg-slate-950 text-white">
                <Icon className="size-6 text-blue-300" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors">
              {title}
            </h3>
            <p className="mt-2.5 text-xs sm:text-sm text-slate-400 leading-relaxed">
              {description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
