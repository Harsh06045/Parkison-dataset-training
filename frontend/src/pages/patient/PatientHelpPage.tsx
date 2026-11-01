import React, { useState } from "react";
import { HelpCircle, ChevronDown, ChevronRight, Brain, Activity, Phone, ArrowLeft } from "lucide-react";

interface PatientHelpPageProps {
  onNavigate: (path: string) => void;
}

export function PatientHelpPage({ onNavigate }: PatientHelpPageProps) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: "What does my 3D Brain MRI scan measure?",
      a: "The scan looks at detailed volumetric 3D pictures of your brain. The AI assists Dr. Jenkins by measuring the exact volume of your hippocampus and memory pathways to confirm whether your brain tissue is stable.",
    },
    {
      q: "Why do I need to record my voice for the Phonation Test?",
      a: "Parkinson's and neurological conditions can cause subtle changes in vocal cord muscle vibration (frequency jitter and shimmer) months or years before motor symptoms appear. Sustained /a/ vowel sounds provide high-precision biomarkers.",
    },
    {
      q: "Who can see my personal medical records?",
      a: "Only you and your authorized attending neurologist (Dr. Sarah Jenkins) can see your scans, voice tests, and clinical reports. Your data is protected by hospital-grade 256-bit encryption.",
    },
    {
      q: "How do I schedule or change an upcoming clinic appointment?",
      a: "You can call our outpatient care coordination desk directly at (555) 234-8901 during business hours (Mon-Fri, 8:00 AM - 5:00 PM EST).",
    },
  ];

  return (
    <div className="space-y-6 text-[#0b1c30] select-none animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e2e8f0] pb-4">
        <div>
          <h2 className="font-headline text-2xl font-extrabold text-[#0b1c30] tracking-tight">
            Patient Care &amp; Guidance
          </h2>
          <p className="text-xs text-[#64748b] mt-0.5">
            Understand your diagnostic test scores, care plans, and portal features.
          </p>
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

      <div className="space-y-3">
        {faqs.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden shadow-card"
            >
              <button
                type="button"
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                className="w-full p-5 flex items-center justify-between text-left font-bold text-sm text-[#0b1c30] hover:text-[#0ea5e9] transition-colors"
              >
                <span>{faq.q}</span>
                {isOpen ? (
                  <ChevronDown className="size-4 text-[#0ea5e9] shrink-0" />
                ) : (
                  <ChevronRight className="size-4 text-[#64748b] shrink-0" />
                )}
              </button>
              {isOpen && (
                <div className="px-5 pb-5 pt-1 text-xs text-[#475569] leading-relaxed border-t border-[#e2e8f0]/60">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="p-6 rounded-2xl bg-[#f0f9ff] border border-[#0ea5e9]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h4 className="font-bold text-[#0b1c30] text-sm">Need immediate medical assistance?</h4>
          <p className="text-xs text-[#64748b]">
            For urgent clinical queries, contact the Metropolitan Neurology On-Call Team.
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono font-bold text-[#0ea5e9] text-sm bg-white px-4 py-2 rounded-xl border border-[#e2e8f0] shadow-xs">
          <Phone className="size-4" />
          <span>(555) 234-8901</span>
        </div>
      </div>
    </div>
  );
}
