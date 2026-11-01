import { useState } from "react";
import { User } from "@/lib/authService";
import { Brain, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DoctorDashboardView } from "@/components/doctor/DoctorDashboardView";

interface RoleDashboardProps {
  user: User;
  onLogout: () => void;
}

export function RoleDashboard({ user, onLogout }: RoleDashboardProps) {
  if (user.role === "doctor") {
    return <DoctorDashboardView user={user} onLogout={onLogout} />;
  }

  return (
    <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-8 lg:px-12 py-8 text-white select-none">
      {/* Top Banner */}
      <div className="rounded-3xl border border-blue-500/30 bg-[#060919]/90 p-6 sm:p-8 backdrop-blur-2xl shadow-[0_15px_40px_rgba(0,0,0,0.6)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-indigo-950 border border-indigo-500/40 text-indigo-400 shadow-md">
            <Brain className="size-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{user.fullName}</h1>
              <span className="rounded-full bg-blue-500/20 border border-blue-500/40 px-3 py-0.5 text-xs font-semibold text-blue-300 uppercase tracking-wider">
                {user.role}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {user.role === "patient" && `Patient ID: #${user.id} • Neurological Care Plan`}
              {user.role === "admin" && `System Admin Access • Enterprise Compliance Domain`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button
            onClick={onLogout}
            className="h-10 rounded-xl border border-slate-800 bg-slate-900 px-4 text-xs font-medium text-slate-400 hover:text-white"
          >
            Sign Out
          </Button>
        </div>
      </div>

      {/* PATIENT VIEW */}
      {user.role === "patient" && (
        <div className="mt-8 space-y-6">
          <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6 sm:p-8 backdrop-blur-xl space-y-4">
            <h2 className="text-xl font-bold text-white">Your Neurological Health Timeline</h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Your latest 3D Brain Scan results have been analyzed by NeuroFusion AI and verified by Dr. Sarah Jenkins.
            </p>
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/30 p-5 text-xs text-emerald-200 flex items-center gap-3">
              <ShieldCheck className="size-6 text-emerald-400 shrink-0" />
              <div>
                <p className="font-bold text-sm text-white">Baseline Brain Scan Verified - Normal Progression</p>
                <p className="text-slate-300 mt-0.5">Hippocampal volume index is within healthy percentiles for your age group.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN VIEW */}
      {user.role === "admin" && (
        <div className="mt-8 space-y-6">
          <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6 sm:p-8 backdrop-blur-xl space-y-4">
            <h2 className="text-xl font-bold text-white">System Compliance &amp; AI Model Management</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <p className="text-xs text-slate-400">Total Registered Users</p>
                <div className="text-xl font-bold text-white mt-1">1,248 Accounts</div>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <p className="text-xs text-slate-400">HIPAA Audit Status</p>
                <div className="text-xl font-bold text-emerald-400 mt-1">Passed 100%</div>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <p className="text-xs text-slate-400">AI Model Latency</p>
                <div className="text-xl font-bold text-blue-400 mt-1">840 ms / scan</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

