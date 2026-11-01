import React from "react";
import { Users, Brain, Activity, FileText, ArrowUpRight, TrendingUp } from "lucide-react";

interface MetricsGridProps {
  totalPatients: number;
  totalAlzheimerAnalyses: number;
  totalParkinsonAnalyses: number;
  recentReportsCount: number;
  onNavigateToPatients: () => void;
  onNavigateToAlzheimer: () => void;
  onNavigateToParkinson: () => void;
  onNavigateToReports: () => void;
}

export function MetricsGrid({
  totalPatients,
  totalAlzheimerAnalyses,
  totalParkinsonAnalyses,
  recentReportsCount,
  onNavigateToPatients,
  onNavigateToAlzheimer,
  onNavigateToParkinson,
  onNavigateToReports,
}: MetricsGridProps) {
  const cards = [
    {
      title: "Total Registered Patients",
      value: totalPatients,
      subtitle: "Active Clinical Cohort",
      change: "+12% this month",
      icon: Users,
      color: "from-blue-600 to-indigo-600",
      accent: "text-blue-600 bg-blue-50 border-blue-200",
      onClick: onNavigateToPatients,
    },
    {
      title: "Alzheimer's MRI Scans",
      value: totalAlzheimerAnalyses,
      subtitle: "3D CNN + ViT Ingestions",
      change: "+18% this month",
      icon: Brain,
      color: "from-purple-600 to-indigo-600",
      accent: "text-purple-600 bg-purple-50 border-purple-200",
      onClick: onNavigateToAlzheimer,
    },
    {
      title: "Parkinson's Voice Scans",
      value: totalParkinsonAnalyses,
      subtitle: "Quantum-Inspired Acoustic AI",
      change: "+9% this month",
      icon: Activity,
      color: "from-cyan-600 to-teal-600",
      accent: "text-cyan-600 bg-cyan-50 border-cyan-200",
      onClick: onNavigateToParkinson,
    },
    {
      title: "Clinical Reports Generated",
      value: recentReportsCount,
      subtitle: "Finalized SaMD Dossiers",
      change: "100% HIPAA Verified",
      icon: FileText,
      color: "from-emerald-600 to-teal-600",
      accent: "text-emerald-600 bg-emerald-50 border-emerald-200",
      onClick: onNavigateToReports,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            onClick={card.onClick}
            className="group relative overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-card hover:shadow-lg transition-all duration-200 cursor-pointer hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between">
              <div className={`flex size-11 items-center justify-center rounded-xl border ${card.accent}`}>
                <Icon className="size-5" />
              </div>
              <span className="flex items-center text-[0.68rem] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <TrendingUp className="size-3 mr-0.5" />
                {card.change}
              </span>
            </div>

            <div className="mt-4">
              <h3 className="text-2xl font-black font-headline text-[#0b1c30] tracking-tight">
                {card.value}
              </h3>
              <p className="text-xs font-bold text-[#475569] mt-0.5">{card.title}</p>
              <p className="text-[0.68rem] text-[#94a3b8] mt-0.5">{card.subtitle}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-[#f1f5f9] flex items-center justify-between text-xs font-semibold text-[#0ea5e9] group-hover:text-[#0284c7]">
              <span>View Registry</span>
              <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
