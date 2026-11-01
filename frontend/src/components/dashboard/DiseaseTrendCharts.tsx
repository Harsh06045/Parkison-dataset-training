import React from "react";
import { TrendingUp, PieChart as PieIcon, BarChart3, ShieldCheck } from "lucide-react";

export function DiseaseTrendCharts() {
  const cohortDistribution = [
    { label: "Normal Cognition / Control", count: 48, pct: 40, color: "bg-emerald-500" },
    { label: "Mild Cognitive Impairment (MCI)", count: 32, pct: 27, color: "bg-amber-500" },
    { label: "Alzheimer's Disease (Mild/Mod)", count: 24, pct: 20, color: "bg-purple-600" },
    { label: "Parkinson's Disease (Stage I/II)", count: 16, pct: 13, color: "bg-cyan-600" },
  ];

  const monthlyTrends = [
    { month: "Mar", alz: 14, park: 8 },
    { month: "Apr", alz: 18, park: 11 },
    { month: "May", alz: 22, park: 15 },
    { month: "Jun", alz: 26, park: 17 },
    { month: "Jul", alz: 31, park: 22 },
    { month: "Aug", alz: 38, park: 28 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-[#0b1c30]">
      {/* 1. Patient Cohort Stratification */}
      <div className="bg-white rounded-2xl p-6 shadow-card border border-[#e2e8f0] space-y-4">
        <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
          <h3 className="font-headline text-xs font-bold text-[#0b1c30] uppercase tracking-wider flex items-center gap-2">
            <PieIcon className="size-4 text-[#0ea5e9]" />
            <span>Active Patient Cohort Breakdown</span>
          </h3>
          <span className="text-[0.68rem] text-[#64748b] font-medium">120 Evaluated Patients</span>
        </div>

        <div className="space-y-3 pt-2">
          {cohortDistribution.map((item, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-[#475569]">{item.label}</span>
                <span className="font-mono font-bold text-[#0b1c30]">
                  {item.count} pts ({item.pct}%)
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-[#f1f5f9] overflow-hidden">
                <div
                  className={`h-full rounded-full ${item.color} transition-all duration-500`}
                  style={{ width: `${item.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Monthly Diagnostic Volume */}
      <div className="bg-white rounded-2xl p-6 shadow-card border border-[#e2e8f0] space-y-4">
        <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
          <h3 className="font-headline text-xs font-bold text-[#0b1c30] uppercase tracking-wider flex items-center gap-2">
            <BarChart3 className="size-4 text-[#0ea5e9]" />
            <span>Monthly Analysis Volume Trends</span>
          </h3>
          <div className="flex items-center gap-3 text-[0.68rem] font-bold">
            <span className="flex items-center gap-1 text-purple-600">
              <span className="size-2 rounded-full bg-purple-600" />
              Alzheimer&rsquo;s MRI
            </span>
            <span className="flex items-center gap-1 text-cyan-600">
              <span className="size-2 rounded-full bg-cyan-600" />
              Parkinson&rsquo;s Voice
            </span>
          </div>
        </div>

        <div className="pt-4 flex items-end justify-between gap-3 h-48 border-b border-[#e2e8f0] pb-2">
          {monthlyTrends.map((t, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
              <div className="w-full flex items-end justify-center gap-1.5 h-36">
                {/* Alzheimer Bar */}
                <div
                  className="w-1/2 bg-purple-600 hover:bg-purple-500 rounded-t transition-all"
                  style={{ height: `${(t.alz / 40) * 100}%` }}
                  title={`${t.month}: ${t.alz} Alzheimer's scans`}
                />
                {/* Parkinson Bar */}
                <div
                  className="w-1/2 bg-cyan-600 hover:bg-cyan-500 rounded-t transition-all"
                  style={{ height: `${(t.park / 40) * 100}%` }}
                  title={`${t.month}: ${t.park} Parkinson's analyses`}
                />
              </div>
              <span className="font-mono text-[0.7rem] text-[#64748b] font-semibold">{t.month}</span>
            </div>
          ))}
        </div>

        <p className="text-[0.68rem] text-[#64748b] text-center pt-1">
          Monthly throughput demonstrates an <strong>82% increase</strong> in predictive screening adoption across clinical departments.
        </p>
      </div>
    </div>
  );
}
