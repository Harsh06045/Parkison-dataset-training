import { Cpu, Code, Server, Shield } from "lucide-react";

const TECH_CATEGORIES = [
  {
    category: "AI & Neural Networks",
    icon: Cpu,
    items: [
      "PyTorch 2.4 3D-CNN Engines",
      "Explainable Grad-CAM Heatmaps",
      "Monai Medical Segmentation",
      "DICOM & NIfTI Voxel Processors",
    ],
    color: "border-purple-500/30 bg-purple-950/20 text-purple-300",
  },
  {
    category: "Frontend & 3D Visuals",
    icon: Code,
    items: [
      "React 18 & TypeScript 5.7",
      "Three.js & WebGL 3D Engines",
      "TailwindCSS & Glassmorphism UI",
      "Vite 6 Fast Bundler",
    ],
    color: "border-blue-500/30 bg-blue-950/20 text-blue-300",
  },
  {
    category: "Cloud & Infrastructure",
    icon: Server,
    items: [
      "FastAPI Asynchronous Microservices",
      "Docker & Kubernetes Clusters",
      "PostgreSQL & Redis Caching",
      "PACS Integration Protocols",
    ],
    color: "border-teal-500/30 bg-teal-950/20 text-teal-300",
  },
  {
    category: "Security & Compliance",
    icon: Shield,
    items: [
      "HIPAA & HITECH Compliance",
      "Zero-Trust AES-256 Encryption",
      "JWT Role-Based Access Control",
      "Immutable Audit Logging",
    ],
    color: "border-amber-500/30 bg-amber-950/20 text-amber-300",
  },
];

export function TechStackSection() {
  return (
    <section className="relative z-10 mx-auto max-w-7xl px-4 sm:px-8 lg:px-12 py-12 sm:py-20 text-white select-none">
      <div className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-4">
        <span className="inline-block rounded-full bg-teal-500/15 border border-teal-500/30 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-teal-300 backdrop-blur-md">
          Technology Architecture
        </span>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
          Powered by <span className="bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">State-of-the-Art Tech</span>
        </h2>
        <p className="text-sm sm:text-base text-slate-300">
          Built on battle-tested medical AI frameworks and secure, low-latency web architecture.
        </p>
      </div>

      <div className="mt-12 sm:mt-16 grid grid-cols-1 md:grid-cols-2 gap-6">
        {TECH_CATEGORIES.map(({ category, icon: Icon, items, color }) => (
          <div
            key={category}
            className={`rounded-3xl border ${color} p-6 sm:p-8 backdrop-blur-xl shadow-lg space-y-4`}
          >
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-slate-900 border border-white/10">
                <Icon className="size-5" />
              </div>
              <h3 className="text-lg font-bold text-white">{category}</h3>
            </div>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              {items.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2 rounded-xl bg-slate-900/60 border border-slate-800 px-3 py-2 text-xs font-medium text-slate-300"
                >
                  <span className="size-1.5 rounded-full bg-teal-400 shrink-0"></span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
