import React from "react";
import {
  Users,
  UploadCloud,
  Clock,
  FileCheck2,
  Bell,
  CheckCheck,
  TrendingUp,
  FileText,
  Eye,
  Download,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { DashboardStats, DoctorNotification, DiagnosticReport, doctorService } from "@/lib/doctorService";
import {
  DiseaseDistributionChart,
  PredictionTrendsChart,
  StageDistributionChart,
} from "./DoctorCharts";

interface DoctorOverviewTabProps {
  stats: DashboardStats;
  notifications: DoctorNotification[];
  reports: DiagnosticReport[];
  onOpenUpload: () => void;
  onViewReport: (report: DiagnosticReport) => void;
  onNavigateToPatients: () => void;
  onRefreshData: () => void;
}

export function DoctorOverviewTab({
  stats,
  notifications,
  reports,
  onOpenUpload,
  onViewReport,
  onNavigateToPatients,
  onRefreshData,
}: DoctorOverviewTabProps) {
  const unreadNotifsCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    doctorService.markAllNotificationsRead();
    onRefreshData();
  };

  const handleNotificationClick = (id: string) => {
    doctorService.markNotificationRead(id);
    onRefreshData();
  };

  return (
    <div className="space-y-8 text-white select-none">
      {/* 1. TOP METRICS WIDGETS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Widget 1: Total Patients */}
        <div
          onClick={onNavigateToPatients}
          className="group cursor-pointer rounded-3xl border border-slate-800 bg-slate-950/70 p-6 backdrop-blur-xl transition-all duration-300 hover:border-blue-500/50 hover:bg-slate-900/80 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Patients</span>
            <div className="flex size-10 items-center justify-center rounded-2xl bg-blue-950/80 border border-blue-500/30 text-blue-400 group-hover:scale-110 transition-transform">
              <Users className="size-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-white">{stats.totalPatients}</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[0.68rem] font-bold text-emerald-400">
              <TrendingUp className="size-3" />
              +{stats.patientsTrend}%
            </span>
          </div>
          <p className="text-[0.68rem] text-slate-400 mt-2">Active patients under clinical tracking</p>
        </div>

        {/* Widget 2: MRI Uploads */}
        <div
          onClick={onOpenUpload}
          className="group cursor-pointer rounded-3xl border border-slate-800 bg-slate-950/70 p-6 backdrop-blur-xl transition-all duration-300 hover:border-purple-500/50 hover:bg-slate-900/80 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">MRI Uploads</span>
            <div className="flex size-10 items-center justify-center rounded-2xl bg-purple-950/80 border border-purple-500/30 text-purple-400 group-hover:scale-110 transition-transform">
              <UploadCloud className="size-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-white">{stats.mriUploads}</span>
            <span className="rounded-full bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 text-[0.68rem] font-bold text-purple-300">
              +{stats.mriUploadsToday} Today
            </span>
          </div>
          <p className="text-[0.68rem] text-slate-400 mt-2">PACS &amp; DICOM volumetric scans</p>
        </div>

        {/* Widget 3: Pending Predictions */}
        <div className="group rounded-3xl border border-slate-800 bg-slate-950/70 p-6 backdrop-blur-xl transition-all duration-300 hover:border-amber-500/50 hover:bg-slate-900/80 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Pending Predictions</span>
            <div className="flex size-10 items-center justify-center rounded-2xl bg-amber-950/80 border border-amber-500/30 text-amber-400 group-hover:scale-110 transition-transform">
              <Clock className="size-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-white">{stats.pendingPredictions}</span>
            <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[0.68rem] font-bold text-amber-300">
              Awaiting Review
            </span>
          </div>
          <p className="text-[0.68rem] text-slate-400 mt-2">Queued for AI Grad-CAM verification</p>
        </div>

        {/* Widget 4: Recent Reports */}
        <div className="group rounded-3xl border border-slate-800 bg-slate-950/70 p-6 backdrop-blur-xl transition-all duration-300 hover:border-emerald-500/50 hover:bg-slate-900/80 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Recent Reports</span>
            <div className="flex size-10 items-center justify-center rounded-2xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 group-hover:scale-110 transition-transform">
              <FileCheck2 className="size-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-white">{stats.recentReportsCount}</span>
            <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[0.68rem] font-bold text-emerald-300">
              Finalized
            </span>
          </div>
          <p className="text-[0.68rem] text-slate-400 mt-2">Exportable diagnostic summaries</p>
        </div>
      </div>

      {/* 2. CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <DiseaseDistributionChart stats={stats} />
        </div>
        <div className="lg:col-span-2">
          <PredictionTrendsChart stats={stats} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Stage Distribution */}
        <div className="lg:col-span-2">
          <StageDistributionChart stats={stats} />
        </div>

        {/* Right Col: Notifications Widget */}
        <div className="lg:col-span-1 rounded-3xl border border-slate-800 bg-slate-950/70 p-6 backdrop-blur-xl flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Bell className="size-5 text-blue-400" />
                  {unreadNotifsCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex size-3 rounded-full bg-blue-500 animate-ping" />
                  )}
                </div>
                <h3 className="text-base font-bold text-white">Notifications</h3>
                {unreadNotifsCount > 0 && (
                  <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[0.62rem] font-bold text-white">
                    {unreadNotifsCount} new
                  </span>
                )}
              </div>

              {unreadNotifsCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 text-[0.68rem] font-semibold text-blue-400 hover:text-blue-300"
                >
                  <CheckCheck className="size-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>

            <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif.id)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                    notif.read
                      ? "bg-slate-900/30 border-slate-800/60 opacity-80"
                      : "bg-blue-950/20 border-blue-500/30 shadow-[0_0_12px_rgba(59,130,246,0.15)]"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {notif.type === "alert" && (
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-red-500/20 text-red-400 border border-red-500/40">
                        <AlertTriangle className="size-3.5" />
                      </div>
                    )}
                    {notif.type === "scan_ready" && (
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/40">
                        <Sparkles className="size-3.5" />
                      </div>
                    )}
                    {notif.type === "report" && (
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                        <FileText className="size-3.5" />
                      </div>
                    )}
                    {notif.type === "system" && (
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-slate-300">
                        <Bell className="size-3.5" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-white truncate">{notif.title}</p>
                        <span className="text-[0.62rem] text-slate-400 shrink-0 ml-2">{notif.timestamp}</span>
                      </div>
                      <p className="text-[0.68rem] text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. RECENT REPORTS WIDGET TABLE */}
      <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6 backdrop-blur-xl shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Recent Clinical Reports</h3>
            <p className="text-xs text-slate-400">Finalized diagnostic summaries available for review &amp; export</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="border-b border-slate-800 bg-slate-900/60 text-[0.68rem] uppercase text-slate-400">
              <tr>
                <th className="p-3">Report ID</th>
                <th className="p-3">Patient Name</th>
                <th className="p-3">Primary Diagnosis</th>
                <th className="p-3">AI Confidence</th>
                <th className="p-3">Generated Date</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {reports.map((rep) => (
                <tr key={rep.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="p-3 font-mono font-bold text-slate-300">{rep.id}</td>
                  <td className="p-3 font-semibold text-white">{rep.patientName}</td>
                  <td className="p-3 text-purple-300 font-medium">{rep.primaryDiagnosis}</td>
                  <td className="p-3 font-bold text-blue-400">{rep.confidenceScore}</td>
                  <td className="p-3 text-slate-400">{rep.createdAt}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => onViewReport(rep)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600/20 border border-blue-500/40 px-3 py-1 text-[0.68rem] font-semibold text-blue-300 hover:bg-blue-600 hover:text-white transition-all"
                    >
                      <Eye className="size-3" />
                      <span>View Report</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
