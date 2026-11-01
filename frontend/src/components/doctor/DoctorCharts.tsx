import React, { useState } from "react";
import { DashboardStats } from "@/lib/doctorService";
import { Info } from "lucide-react";

interface DoctorChartsProps {
  stats: DashboardStats;
}

// 1. DONUT CHART: Disease Distribution
export function DiseaseDistributionChart({ stats }: DoctorChartsProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const data = stats.diseaseDistribution;

  const total = data.reduce((acc, curr) => acc + curr.count, 0) || 1;
  const radius = 65;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;

  let currentOffset = 0;

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6 backdrop-blur-xl flex flex-col justify-between h-full shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>Disease Distribution</span>
          </h3>
          <p className="text-xs text-slate-400">Diagnostic ratio of patient cohort</p>
        </div>
        <div className="flex size-7 items-center justify-center rounded-lg bg-slate-900 border border-slate-800 text-slate-400">
          <Info className="size-4" />
        </div>
      </div>

      <div className="my-6 flex flex-col md:flex-row items-center justify-center gap-6">
        <div className="relative flex items-center justify-center">
          <svg className="size-48 sm:size-52 -rotate-90" viewBox="0 0 180 180">
            {data.map((item, index) => {
              const dashArray = (item.count / total) * circumference;
              const strokeDashoffset = -currentOffset;
              currentOffset += dashArray;
              const isHovered = hoveredIndex === index;

              return (
                <circle
                  key={item.disease}
                  cx="90"
                  cy="90"
                  r={radius}
                  fill="transparent"
                  stroke={item.color}
                  strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={`${dashArray} ${circumference - dashArray}`}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="transition-all duration-300 cursor-pointer origin-center hover:opacity-90"
                  style={{
                    filter: isHovered ? `drop-shadow(0 0 8px ${item.color})` : "none",
                  }}
                />
              );
            })}
          </svg>

          {/* Donut Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-2xl font-extrabold text-white">{total}</span>
            <span className="text-[0.68rem] uppercase font-semibold text-slate-400 tracking-wider">Patients</span>
          </div>
        </div>

        {/* Legend */}
        <div className="w-full md:w-auto flex flex-col gap-2.5">
          {data.map((item, idx) => (
            <div
              key={item.disease}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={`flex items-center justify-between gap-4 rounded-xl p-2 px-3 border transition-all cursor-pointer ${
                hoveredIndex === idx
                  ? "bg-slate-900 border-slate-700 shadow-md"
                  : "bg-slate-950/40 border-slate-900 hover:bg-slate-900/60"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="size-3 rounded-full shrink-0"
                  style={{ backgroundColor: item.color, boxShadow: `0 0 8px ${item.color}` }}
                />
                <span className="text-xs font-medium text-slate-200">{item.disease}</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-white">{item.count}</span>
                <span className="text-[0.68rem] text-slate-400 ml-1.5">({item.percentage}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 2. TRENDS CHART: Prediction Volume Over Time
export function PredictionTrendsChart({ stats }: DoctorChartsProps) {
  const [activeMetric, setActiveMetric] = useState<"all" | "alzheimers" | "parkinsons">("all");
  const trends = stats.predictionTrends;

  const maxVal = 100;
  const height = 140;
  const width = 450;
  const padding = 30;

  // Calculate SVG Points
  const getPoints = (key: "alzheimers" | "parkinsons" | "controls") => {
    return trends
      .map((d, index) => {
        const x = padding + (index / (trends.length - 1)) * (width - padding * 2);
        const val = d[key];
        const y = height - padding - (val / maxVal) * (height - padding * 2);
        return `${x},${y}`;
      })
      .join(" ");
  };

  const alzPoints = getPoints("alzheimers");
  const parkPoints = getPoints("parkinsons");

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6 backdrop-blur-xl flex flex-col justify-between h-full shadow-lg">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-white">Prediction Trends</h3>
          <p className="text-xs text-slate-400">Monthly AI diagnostic volume progression</p>
        </div>
        <div className="flex items-center gap-1 rounded-xl bg-slate-900 border border-slate-800 p-1">
          <button
            onClick={() => setActiveMetric("all")}
            className={`rounded-lg px-2.5 py-1 text-[0.68rem] font-semibold transition-all ${
              activeMetric === "all" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveMetric("alzheimers")}
            className={`rounded-lg px-2.5 py-1 text-[0.68rem] font-semibold transition-all ${
              activeMetric === "alzheimers" ? "bg-purple-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
            }`}
          >
            Alzheimer&rsquo;s
          </button>
          <button
            onClick={() => setActiveMetric("parkinsons")}
            className={`rounded-lg px-2.5 py-1 text-[0.68rem] font-semibold transition-all ${
              activeMetric === "parkinsons" ? "bg-cyan-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
            }`}
          >
            Parkinson&rsquo;s
          </button>
        </div>
      </div>

      <div className="my-4 relative w-full overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id="alzGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c084fc" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#c084fc" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="parkGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines */}
          {[0, 25, 50, 75, 100].map((val) => {
            const y = height - padding - (val / maxVal) * (height - padding * 2);
            return (
              <g key={val}>
                <line
                  x1={padding}
                  y1={y}
                  x2={width - padding}
                  y2={y}
                  stroke="#1e293b"
                  strokeDasharray="3 3"
                />
                <text x={padding - 8} y={y + 3} fill="#64748b" fontSize="8" textAnchor="end">
                  {val}
                </text>
              </g>
            );
          })}

          {/* Area Fills */}
          {(activeMetric === "all" || activeMetric === "alzheimers") && (
            <polygon
              points={`${padding},${height - padding} ${alzPoints} ${width - padding},${height - padding}`}
              fill="url(#alzGradient)"
            />
          )}

          {(activeMetric === "all" || activeMetric === "parkinsons") && (
            <polygon
              points={`${padding},${height - padding} ${parkPoints} ${width - padding},${height - padding}`}
              fill="url(#parkGradient)"
            />
          )}

          {/* Trend Lines */}
          {(activeMetric === "all" || activeMetric === "alzheimers") && (
            <polyline
              fill="none"
              stroke="#c084fc"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={alzPoints}
            />
          )}

          {(activeMetric === "all" || activeMetric === "parkinsons") && (
            <polyline
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={parkPoints}
            />
          )}

          {/* Data Points */}
          {trends.map((d, index) => {
            const x = padding + (index / (trends.length - 1)) * (width - padding * 2);
            const yAlz = height - padding - (d.alzheimers / maxVal) * (height - padding * 2);
            const yPark = height - padding - (d.parkinsons / maxVal) * (height - padding * 2);

            return (
              <g key={d.month}>
                {(activeMetric === "all" || activeMetric === "alzheimers") && (
                  <circle cx={x} cy={yAlz} r="4" fill="#c084fc" className="hover:r-6 transition-all cursor-pointer" />
                )}
                {(activeMetric === "all" || activeMetric === "parkinsons") && (
                  <circle cx={x} cy={yPark} r="4" fill="#38bdf8" className="hover:r-6 transition-all cursor-pointer" />
                )}
                {/* Month Labels */}
                <text x={x} y={height - 8} fill="#94a3b8" fontSize="9" textAnchor="middle" fontWeight="bold">
                  {d.month}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex items-center justify-center gap-6 border-t border-slate-900 pt-3 text-[0.7rem] text-slate-400">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-purple-400 shadow-[0_0_6px_#c084fc]" />
          <span>Alzheimer&rsquo;s Scans</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#38bdf8]" />
          <span>Parkinson&rsquo;s Scans</span>
        </div>
      </div>
    </div>
  );
}

// 3. BAR CHART: Stage Distribution
export function StageDistributionChart({ stats }: DoctorChartsProps) {
  const [hoveredStage, setHoveredStage] = useState<string | null>(null);
  const stages = stats.stageDistribution;
  const maxCount = Math.max(...stages.map((s) => s.count)) || 1;

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6 backdrop-blur-xl flex flex-col justify-between h-full shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white">Stage Distribution</h3>
          <p className="text-xs text-slate-400">Severity breakdown across cognitive &amp; motor stages</p>
        </div>
      </div>

      <div className="my-6 space-y-3">
        {stages.map((item) => {
          const percentage = Math.round((item.count / maxCount) * 100);
          const isAlz = item.category === "Alzheimer's";
          const barColor = isAlz ? "bg-gradient-to-r from-purple-600 to-fuchsia-500" : "bg-gradient-to-r from-cyan-600 to-teal-400";
          const isHovered = hoveredStage === item.stage;

          return (
            <div
              key={item.stage}
              onMouseEnter={() => setHoveredStage(item.stage)}
              onMouseLeave={() => setHoveredStage(null)}
              className={`p-2.5 rounded-xl border transition-all ${
                isHovered ? "bg-slate-900 border-slate-700" : "bg-slate-950/40 border-slate-900/80"
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-slate-200">{item.stage}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[0.68rem] text-slate-400 font-mono">{item.category}</span>
                  <span className="font-bold text-white">{item.count} patients</span>
                </div>
              </div>

              <div className="h-2.5 w-full rounded-full bg-slate-900 overflow-hidden p-0.5 border border-slate-800">
                <div
                  className={`h-full rounded-full ${barColor} transition-all duration-500`}
                  style={{
                    width: `${percentage}%`,
                    boxShadow: isHovered ? (isAlz ? "0 0 10px rgba(192,132,252,0.5)" : "0 0 10px rgba(56,189,248,0.5)") : "none",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-[0.68rem] text-slate-400 border-t border-slate-900 pt-3">
        <span>MMSE &amp; Movement Disorders Society Criteria</span>
        <span className="text-emerald-400 font-semibold">Cohort Total: 74 Scans</span>
      </div>
    </div>
  );
}
