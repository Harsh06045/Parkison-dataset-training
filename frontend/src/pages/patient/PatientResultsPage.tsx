import React from "react";
import { Brain, Activity, Download, ChevronRight, CheckCircle2, FileText, ArrowLeft } from "lucide-react";
import { useToast } from "@/context/ToastContext";

interface PatientResultsPageProps {
  onNavigate: (path: string) => void;
}

export function PatientResultsPage({ onNavigate }: PatientResultsPageProps) {
  const { success, info } = useToast();

  const handleDownload = (id: string) => {
    info("Preparing Download", `Downloading diagnostic summary for scan ${id}...`);
    setTimeout(() => {
      success("Download Complete", "PDF diagnostic report saved to your device.");
    }, 1000);
  };

  const results = [
    {
      id: "SCAN-8921",
      date: "Aug 22, 2026 • 10:45 AM",
      modality: "3D Brain MRI (T1-Weighted)",
      diagnosis: "Mild Cognitive Impairment (Early Stage)",
      confidence: "94.2%",
      doctor: "Dr. Sarah Jenkins, MD",
      doctorNotes: "Hippocampal volume retention is consistent with baseline. Continued cognitive stimulation exercises recommended.",
      icon: Brain,
      color: "bg-purple-50 text-purple-600 border-purple-200",
    },
    {
      id: "VOICE-4091",
      date: "Aug 18, 2026 • 04:12 PM",
      modality: "Acoustic Phonation Phonation (/a/)",
      diagnosis: "Normal Vocal Cord Phonation Frequency",
      confidence: "96.8%",
      doctor: "Dr. Sarah Jenkins, MD",
      doctorNotes: "Jitter and shimmer perturbation metrics fall within normal reference control limits.",
      icon: Activity,
      color: "bg-cyan-50 text-cyan-600 border-cyan-200",
    },
    {
      id: "SCAN-7814",
      date: "Jul 12, 2026 • 11:30 AM",
      modality: "3D Brain MRI Volumetric",
      diagnosis: "Stable Hippocampal Volume (Cognitive Normal)",
      confidence: "95.1%",
      doctor: "Dr. Sarah Jenkins, MD",
      doctorNotes: "Initial baseline volumetric study. Zero significant entorhinal cortical atrophy noted.",
      icon: Brain,
      color: "bg-blue-50 text-blue-600 border-blue-200",
    },
  ];

  return (
    <div className="space-y-6 text-[#0b1c30] select-none animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e2e8f0] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200 px-2.5 py-0.5 text-[0.65rem] font-bold">
              Patient Portal • Eleanor Vance
            </span>
            <span className="text-[#64748b]">•</span>
            <span className="text-xs font-mono text-[#64748b]">MRN-489201</span>
          </div>
          <h2 className="font-headline text-2xl font-extrabold text-[#0b1c30] tracking-tight mt-1">
            My Diagnostic Analysis Results
          </h2>
        </div>

        <button
          type="button"
          onClick={() => onNavigate("/patient/dashboard")}
          className="btn-secondary py-2 px-3.5 text-xs font-semibold self-start sm:self-auto flex items-center gap-1.5"
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to My Health</span>
        </button>
      </div>

      <div className="space-y-4">
        {results.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-6 shadow-card border border-[#e2e8f0] space-y-4 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e2e8f0] pb-3">
                <div className="flex items-center gap-3">
                  <div className={`flex size-10 items-center justify-center rounded-xl border ${item.color}`}>
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#0b1c30] text-sm">{item.modality}</h3>
                    <p className="text-[0.68rem] text-[#64748b] font-mono">Scan ID: {item.id} • {item.date}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 text-xs font-bold">
                    {item.confidence} Confidence
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDownload(item.id)}
                    className="btn-primary py-1.5 px-3 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Download className="size-3.5" />
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0] space-y-1">
                  <span className="text-[0.65rem] uppercase font-bold text-[#64748b] tracking-wider">
                    Diagnostic Conclusion
                  </span>
                  <p className="font-bold text-[#0b1c30] text-sm">{item.diagnosis}</p>
                  <p className="text-[0.68rem] text-[#64748b]">Reviewed and approved by <strong>{item.doctor}</strong></p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0] space-y-1">
                  <span className="text-[0.65rem] uppercase font-bold text-[#64748b] tracking-wider">
                    Attending Doctor Notes
                  </span>
                  <p className="text-[#475569] leading-relaxed text-[0.72rem]">{item.doctorNotes}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
