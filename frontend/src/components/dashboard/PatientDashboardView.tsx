import React from "react";
import {
  Brain,
  Activity,
  FileText,
  Calendar,
  Stethoscope,
  ArrowRight,
  Download,
  Mic,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronRight,
  ShieldCheck,
  HeartPulse,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

interface PatientDashboardViewProps {
  onNavigate: (path: string) => void;
}

export function PatientDashboardView({ onNavigate }: PatientDashboardViewProps) {
  const { user } = useAuth();
  const { success, info } = useToast();

  const patientName = user?.fullName || "Eleanor Vance";
  const mrn = user?.medicalLicenseId || "MRN-489201";

  const patientScans = [
    {
      id: "SCAN-8921",
      date: "Today, 10:45 AM",
      modality: "3D Brain MRI (T1-Weighted)",
      disease: "Alzheimer's Analysis",
      result: "Mild Cognitive Impairment (Early Stage)",
      confidence: "94.2%",
      status: "Doctor Reviewed",
      doctor: "Dr. Sarah Jenkins, MD, PhD",
      icon: Brain,
      color: "text-purple-600 bg-purple-50 border-purple-200",
    },
    {
      id: "VOICE-4091",
      date: "Aug 18, 2026, 04:12 PM",
      modality: "Acoustic Voice Phonation (/a/)",
      disease: "Parkinson's Voice Analysis",
      result: "Low Perturbation (Normal Phonation)",
      confidence: "96.8%",
      status: "Baseline Stable",
      doctor: "Dr. Sarah Jenkins, MD, PhD",
      icon: Activity,
      color: "text-cyan-600 bg-cyan-50 border-cyan-200",
    },
    {
      id: "SCAN-7814",
      date: "Jul 12, 2026, 11:30 AM",
      modality: "3D Brain MRI Volumetric",
      disease: "Alzheimer's Longitudinal",
      result: "Stable Hippocampal Volume",
      confidence: "95.1%",
      status: "Archived Record",
      doctor: "Dr. Sarah Jenkins, MD, PhD",
      icon: Brain,
      color: "text-blue-600 bg-blue-50 border-blue-200",
    },
  ];

  const handleDownloadReport = (scanId: string) => {
    info("Preparing Report", `Downloading clinical summary for ${scanId}...`);
    setTimeout(() => {
      success("Report Downloaded", "Official physician diagnostic summary saved.");
    }, 1000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200 text-[#0b1c30] select-none">
      {/* 1. PATIENT HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e2e8f0] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200 px-2.5 py-0.5 text-[0.68rem] font-bold">
              Patient Portal
            </span>
            <span className="text-[#94a3b8]">•</span>
            <span className="text-xs font-mono text-[#64748b]">{mrn}</span>
          </div>
          <h1 className="font-headline text-2xl sm:text-3xl font-extrabold text-[#0b1c30] tracking-tight mt-1">
            Welcome, {patientName}
          </h1>
          <p className="text-xs sm:text-sm text-[#64748b] mt-0.5 font-medium">
            Your personal NeuroFusionAI health overview.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate("/patient/you")}
            className="btn-secondary py-2.5 px-4 text-xs font-bold flex items-center gap-2"
          >
            <span>View &ldquo;You&rdquo; Profile</span>
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {/* 2. FOUR CORE PATIENT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Your Latest MRI Analysis */}
        <div className="bg-white rounded-3xl p-5 shadow-card border border-[#e2e8f0] flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[0.68rem] uppercase font-bold text-[#64748b] tracking-wider">
              Your Latest MRI Analysis
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 border border-purple-200">
              <Brain className="size-4.5" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-[0.68rem] text-[#64748b] font-mono">Aug 22, 2026</div>
            <h4 className="text-lg font-headline font-extrabold text-[#0b1c30] leading-tight">
              MCI Stage 1
            </h4>
            <p className="text-xs font-bold text-emerald-600">
              94.2% Confidence
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("/patient/results")}
            className="text-xs font-bold text-[#0ea5e9] hover:underline flex items-center justify-between pt-2 border-t border-[#e2e8f0]"
          >
            <span>View Result</span>
            <ChevronRight className="size-3.5" />
          </button>
        </div>

        {/* Card 2: Your Latest Voice Analysis */}
        <div className="bg-white rounded-3xl p-5 shadow-card border border-[#e2e8f0] flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[0.68rem] uppercase font-bold text-[#64748b] tracking-wider">
              Your Latest Voice Analysis
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 border border-cyan-200">
              <Activity className="size-4.5" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-[0.68rem] text-[#64748b] font-mono">Aug 18, 2026</div>
            <h4 className="text-lg font-headline font-extrabold text-[#0b1c30] leading-tight">
              Normal Phonation
            </h4>
            <p className="text-xs font-bold text-emerald-600">
              96.8% Confidence
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("/patient/results")}
            className="text-xs font-bold text-[#0ea5e9] hover:underline flex items-center justify-between pt-2 border-t border-[#e2e8f0]"
          >
            <span>View Result</span>
            <ChevronRight className="size-3.5" />
          </button>
        </div>

        {/* Card 3: Reports Available */}
        <div className="bg-white rounded-3xl p-5 shadow-card border border-[#e2e8f0] flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[0.68rem] uppercase font-bold text-[#64748b] tracking-wider">
              Reports Available
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <FileText className="size-4.5" />
            </div>
          </div>
          <div className="space-y-0.5">
            <h4 className="text-2xl font-headline font-black text-[#0b1c30]">
              2 Reports
            </h4>
            <p className="text-xs font-bold text-emerald-600">
              Signed by Dr. Sarah Jenkins
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("/patient/reports")}
            className="text-xs font-bold text-[#0ea5e9] hover:underline flex items-center justify-between pt-2 border-t border-[#e2e8f0]"
          >
            <span>View Reports</span>
            <ChevronRight className="size-3.5" />
          </button>
        </div>

        {/* Card 4: Next Appointment */}
        <div className="bg-white rounded-3xl p-5 shadow-card border border-[#e2e8f0] flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[0.68rem] uppercase font-bold text-[#64748b] tracking-wider">
              Next Appointment
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
              <Calendar className="size-4.5" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-[0.68rem] text-[#64748b] font-mono">Sept 15, 2026 • 09:30 AM</div>
            <h4 className="text-base font-headline font-extrabold text-[#0b1c30]">
              Dr. Sarah Jenkins, MD
            </h4>
            <p className="text-[0.68rem] text-emerald-600 font-bold">
              Cognitive Wing Suite 402
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("/patient/appointments")}
            className="text-xs font-bold text-[#0ea5e9] hover:underline flex items-center justify-between pt-2 border-t border-[#e2e8f0]"
          >
            <span>Appointment Details</span>
            <ChevronRight className="size-3.5" />
          </button>
        </div>
      </div>

      {/* 3. RECENT HEALTH ACTIVITY (PATIENT SCOPED ONLY) */}
      <div className="bg-white rounded-3xl shadow-card border border-[#e2e8f0] overflow-hidden">
        <div className="p-5 border-b border-[#e2e8f0] flex items-center justify-between">
          <div>
            <h3 className="font-headline font-bold text-base text-[#0b1c30]">
              Recent Health Activity
            </h3>
            <p className="text-xs text-[#64748b] mt-0.5">
              Your personal timeline of diagnostic scans, phonation recordings, and approved reports.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate("/patient/results")}
            className="btn-secondary py-1.5 px-3 text-xs font-semibold"
          >
            <span>View All Results</span>
            <ChevronRight className="size-3.5" />
          </button>
        </div>

        <div className="divide-y divide-[#e2e8f0]">
          {patientScans.map((scan) => {
            const Icon = scan.icon;
            return (
              <div
                key={scan.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#f8f9ff] transition-colors"
              >
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className={`flex size-11 shrink-0 items-center justify-center rounded-2xl border ${scan.color}`}>
                    <Icon className="size-5" />
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-[#0b1c30] text-sm">{scan.modality}</h4>
                      <span className="font-mono text-[0.68rem] text-[#0ea5e9] font-bold bg-[#e0f2fe] px-2 py-0.5 rounded-md">
                        {scan.id}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-[#0b1c30]">{scan.result}</p>
                    <p className="text-[0.68rem] text-[#64748b]">
                      Reviewed by <strong>{scan.doctor}</strong> • {scan.date}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:self-center">
                  <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 text-xs font-bold">
                    {scan.confidence}
                  </span>
                  <button
                    type="button"
                    onClick={() => onNavigate("/patient/results")}
                    className="btn-secondary py-1.5 px-3 text-xs font-semibold flex items-center gap-1"
                  >
                    <span>View Result</span>
                    <ChevronRight className="size-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. CARE GUIDANCE (DOCTOR / HOSPITAL APPROVED INFORMATION) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-card border border-[#e2e8f0] space-y-4">
          <h3 className="font-headline font-bold text-base text-[#0b1c30] flex items-center gap-2 border-b border-[#e2e8f0] pb-3">
            <Stethoscope className="size-4.5 text-[#0ea5e9]" />
            <span>Care Guidance &amp; Daily Routine</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-[#f8f9ff] border border-[#e2e8f0] space-y-1">
              <p className="font-bold text-[#0b1c30]">1. Morning Phonation Vocalization</p>
              <p className="text-[#64748b] leading-relaxed text-[0.72rem]">
                Perform your 5-second sustained vowel test daily in the portal to allow automated vocal cord frequency tracking.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#f8f9ff] border border-[#e2e8f0] space-y-1">
              <p className="font-bold text-[#0b1c30]">2. Recommended Memory Exercises</p>
              <p className="text-[#64748b] leading-relaxed text-[0.72rem]">
                Complete 15–20 minutes of structured cognitive recall and associative pattern matching as prescribed in your dossier.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-card border border-[#e2e8f0] space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-headline font-bold text-base text-[#0b1c30] flex items-center gap-2 border-b border-[#e2e8f0] pb-3">
              <ShieldCheck className="size-4.5 text-emerald-600" />
              <span>Assigned Neurologist Contact</span>
            </h3>

            <div className="space-y-2 text-xs pt-2">
              <p className="font-bold text-sm text-[#0b1c30]">Dr. Sarah Jenkins, MD, PhD</p>
              <p className="text-[#64748b]">Metropolitan Neurological Institute &amp; Brain Research Center</p>
              <p className="text-[#64748b] font-mono text-[0.7rem]">Direct Clinical Assistant: (555) 234-8901</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate("/patient/appointments")}
            className="btn-primary w-full py-2.5 text-xs font-bold"
          >
            <span>Manage Clinic Appointments</span>
          </button>
        </div>
      </div>
    </div>
  );
}
