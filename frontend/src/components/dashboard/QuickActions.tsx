import React from "react";
import { UserPlus, Brain, Activity, Sparkles, ArrowRight } from "lucide-react";

interface QuickActionsProps {
  onAddPatient: () => void;
  onNewAnalysis: () => void;
  onAnalyzeMri: () => void;
  onAnalyzeVoice: () => void;
}

export function QuickActions({
  onAddPatient,
  onNewAnalysis,
  onAnalyzeMri,
  onAnalyzeVoice,
}: QuickActionsProps) {
  const actions = [
    {
      title: "Add New Patient",
      desc: "Enroll patient with MMSE & UPDRS baseline",
      icon: UserPlus,
      color: "bg-blue-50 text-blue-600 border-blue-200",
      btnText: "Register Patient",
      onClick: onAddPatient,
    },
    {
      title: "Alzheimer's MRI Scan",
      desc: "3D CNN + ViT Feature Fusion & Grad-CAM",
      icon: Brain,
      color: "bg-purple-50 text-purple-600 border-purple-200",
      btnText: "Launch MRI AI",
      onClick: onAnalyzeMri,
    },
    {
      title: "Parkinson's Voice Scan",
      desc: "Vocal Biomarkers + Quantum-Inspired Layer",
      icon: Activity,
      color: "bg-cyan-50 text-cyan-600 border-cyan-200",
      btnText: "Launch Voice AI",
      onClick: onAnalyzeVoice,
    },
  ];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-card border border-[#e2e8f0] space-y-4 text-[#0b1c30]">
      <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
        <h3 className="font-headline text-xs font-bold text-[#0b1c30] uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="size-4 text-[#0ea5e9]" />
          <span>Clinical Quick Actions</span>
        </h3>
        <span className="text-[0.68rem] text-[#64748b] font-medium">Physician Workflow Shortcuts</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {actions.map((act, idx) => {
          const Icon = act.icon;
          return (
            <div
              key={idx}
              onClick={act.onClick}
              className="p-4 rounded-xl border border-[#e2e8f0] bg-[#f8f9ff] hover:bg-[#e0f2fe]/40 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="flex items-start gap-3">
                <div className={`flex size-10 items-center justify-center rounded-xl border ${act.color} shrink-0`}>
                  <Icon className="size-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-[#0b1c30] group-hover:text-[#0ea5e9] transition-colors">
                    {act.title}
                  </h4>
                  <p className="text-[0.68rem] text-[#64748b] mt-0.5 leading-relaxed">
                    {act.desc}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-2 border-t border-[#e2e8f0]/60 flex items-center justify-between text-xs font-bold text-[#0ea5e9]">
                <span>{act.btnText}</span>
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
