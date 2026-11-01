import React, { useState } from "react";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Stethoscope,
  Building,
  Save,
  Edit3,
  Brain,
  Activity,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Bell,
  Lock,
  ChevronRight,
  LogOut,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Modal } from "@/components/common/Modal";

interface PatientYouPageProps {
  onNavigate: (path: string) => void;
}

export function PatientYouPage({ onNavigate }: PatientYouPageProps) {
  const { user, logout } = useAuth();
  const { success } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || "Eleanor Vance",
    email: user?.email || "eleanor.vance@patient.neurofusion.ai",
    phone: "+1 (555) 349-8921",
    dateOfBirth: "1958-03-14",
    emergencyContact: "Arthur Vance (Spouse) • +1 (555) 349-8922",
    preferredLanguage: "English (US)",
    smsReminders: true,
    emailReports: true,
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditing(false);
    success("Profile Updated", "Your personal patient preferences have been saved.");
  };

  const handleConfirmLogout = () => {
    setIsLogoutModalOpen(false);
    logout();
  };

  return (
    <div className="space-y-8 text-[#0b1c30] select-none animate-in fade-in duration-200">
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e2e8f0] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200 px-2.5 py-0.5 text-[0.68rem] font-bold">
              Personal Patient Record
            </span>
            <span className="text-[#94a3b8]">•</span>
            <span className="text-xs font-mono text-[#64748b]">MRN-489201</span>
          </div>
          <h1 className="font-headline text-2xl sm:text-3xl font-extrabold text-[#0b1c30] tracking-tight mt-1">
            You
          </h1>
          <p className="text-xs sm:text-sm text-[#64748b] mt-0.5">
            Manage your personal profile, review doctor-approved health markers, and update communication preferences.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isEditing ? (
            <button
              type="button"
              onClick={handleSave}
              className="btn-primary py-2.5 px-4 text-xs font-bold flex items-center gap-2"
            >
              <Save className="size-4" />
              <span>Save Changes</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="btn-secondary py-2.5 px-4 text-xs font-bold flex items-center gap-2"
            >
              <Edit3 className="size-4" />
              <span>Edit Profile</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsLogoutModalOpen(true)}
            className="rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 py-2.5 px-4 text-xs font-bold transition-colors flex items-center gap-2"
            title="Sign out of patient session"
          >
            <LogOut className="size-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* 2. PROFILE HERO CARD */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-card border border-[#e2e8f0] flex flex-col md:flex-row items-start md:items-center gap-6">
        <div className="flex size-20 sm:size-24 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-tr from-[#0ea5e9] to-[#0284c7] text-white font-headline font-black text-3xl shadow-lg shadow-[#0ea5e9]/30">
          EV
        </div>

        <div className="space-y-2 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="font-headline text-2xl font-extrabold text-[#0b1c30]">{formData.fullName}</h2>
            <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-0.5 text-xs font-bold">
              Active Outpatient Registry
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-[#64748b] pt-1">
            <div>
              <span className="block font-bold text-[0.65rem] uppercase tracking-wider text-[#94a3b8]">Patient ID</span>
              <span className="font-mono font-bold text-[#0b1c30]">MRN-489201</span>
            </div>
            <div>
              <span className="block font-bold text-[0.65rem] uppercase tracking-wider text-[#94a3b8]">Age / Gender</span>
              <span className="font-bold text-[#0b1c30]">68 Years • Female</span>
            </div>
            <div>
              <span className="block font-bold text-[0.65rem] uppercase tracking-wider text-[#94a3b8]">Assigned Neurologist</span>
              <span className="font-bold text-[#0ea5e9]">Dr. Sarah Jenkins, MD</span>
            </div>
            <div>
              <span className="block font-bold text-[0.65rem] uppercase tracking-wider text-[#94a3b8]">Hospital Facility</span>
              <span className="font-bold text-[#0b1c30] truncate">Metropolitan Brain Center</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. FOUR CORE SECTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Personal Information */}
        <div className="bg-white rounded-3xl p-6 shadow-card border border-[#e2e8f0] space-y-4">
          <h3 className="font-headline font-bold text-base text-[#0b1c30] flex items-center gap-2 border-b border-[#e2e8f0] pb-3">
            <User className="size-4.5 text-[#0ea5e9]" />
            <span>Personal Information</span>
          </h3>

          <form onSubmit={handleSave} className="space-y-3.5 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-[#0b1c30]">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#64748b]" />
                <input
                  type="email"
                  disabled={!isEditing}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full h-10 pl-10 pr-3 rounded-xl border border-[#e2e8f0] bg-[#f8f9ff] text-xs text-[#0b1c30] disabled:opacity-75 focus:outline-none focus:border-[#0ea5e9]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-[#0b1c30]">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#64748b]" />
                  <input
                    type="tel"
                    disabled={!isEditing}
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full h-10 pl-10 pr-3 rounded-xl border border-[#e2e8f0] bg-[#f8f9ff] text-xs text-[#0b1c30] disabled:opacity-75 focus:outline-none focus:border-[#0ea5e9]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#0b1c30]">Date of Birth</label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#64748b]" />
                  <input
                    type="date"
                    disabled={!isEditing}
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full h-10 pl-10 pr-3 rounded-xl border border-[#e2e8f0] bg-[#f8f9ff] text-xs text-[#0b1c30] disabled:opacity-75 focus:outline-none focus:border-[#0ea5e9]"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[#0b1c30]">Emergency Contact</label>
              <input
                type="text"
                disabled={!isEditing}
                value={formData.emergencyContact}
                onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                className="w-full h-10 px-3.5 rounded-xl border border-[#e2e8f0] bg-[#f8f9ff] text-xs text-[#0b1c30] disabled:opacity-75 focus:outline-none focus:border-[#0ea5e9]"
              />
            </div>
          </form>
        </div>

        {/* Section 2: Your Health (Approved Information) */}
        <div className="bg-white rounded-3xl p-6 shadow-card border border-[#e2e8f0] space-y-4">
          <h3 className="font-headline font-bold text-base text-[#0b1c30] flex items-center gap-2 border-b border-[#e2e8f0] pb-3">
            <Activity className="size-4.5 text-purple-600" />
            <span>Your Health (Physician Approved)</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-[#f8f9ff] border border-[#e2e8f0] flex items-center justify-between">
              <div>
                <p className="font-bold text-[#0b1c30]">Baseline Cognitive Score (MMSE)</p>
                <p className="text-[0.68rem] text-[#64748b]">Mild cognitive range • Stable longitudinal curve</p>
              </div>
              <span className="rounded-xl bg-purple-100 text-purple-800 font-bold px-3 py-1 font-mono text-xs">
                27 / 30
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#f8f9ff] border border-[#e2e8f0] flex items-center justify-between">
              <div>
                <p className="font-bold text-[#0b1c30]">Acoustic Phonation Index</p>
                <p className="text-[0.68rem] text-[#64748b]">Normal fundamental frequency perturbation</p>
              </div>
              <span className="rounded-xl bg-cyan-100 text-cyan-800 font-bold px-3 py-1 font-mono text-xs">
                96.8 / 100
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#f8f9ff] border border-[#e2e8f0] flex items-center justify-between">
              <div>
                <p className="font-bold text-[#0b1c30]">Hippocampal Volume Stability</p>
                <p className="text-[0.68rem] text-[#64748b]">0.2% variance relative to 6-month prior scan</p>
              </div>
              <span className="rounded-xl bg-emerald-100 text-emerald-800 font-bold px-3 py-1 font-mono text-xs">
                94.2% Match
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Your Analysis Summary */}
        <div className="bg-white rounded-3xl p-6 shadow-card border border-[#e2e8f0] space-y-4">
          <h3 className="font-headline font-bold text-base text-[#0b1c30] flex items-center gap-2 border-b border-[#e2e8f0] pb-3">
            <Brain className="size-4.5 text-[#0ea5e9]" />
            <span>Your Analysis Summary</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div
              onClick={() => onNavigate("/patient/results")}
              className="p-3.5 rounded-2xl bg-[#f8f9ff] border border-[#e2e8f0] hover:border-[#0ea5e9]/40 transition-all cursor-pointer group flex items-center justify-between"
            >
              <div className="space-y-0.5">
                <span className="text-[0.65rem] uppercase font-bold text-purple-600">Latest Alzheimer&rsquo;s MRI</span>
                <p className="font-bold text-[#0b1c30]">Mild Cognitive Impairment (Early Stage)</p>
                <p className="text-[0.68rem] text-[#64748b]">Scan Date: Aug 22, 2026 • 94.2% Confidence</p>
              </div>
              <ChevronRight className="size-4 text-[#64748b] group-hover:text-[#0ea5e9] group-hover:translate-x-0.5 transition-transform" />
            </div>

            <div
              onClick={() => onNavigate("/patient/results")}
              className="p-3.5 rounded-2xl bg-[#f8f9ff] border border-[#e2e8f0] hover:border-[#0ea5e9]/40 transition-all cursor-pointer group flex items-center justify-between"
            >
              <div className="space-y-0.5">
                <span className="text-[0.65rem] uppercase font-bold text-cyan-600">Latest Parkinson&rsquo;s Voice Test</span>
                <p className="font-bold text-[#0b1c30]">Normal Acoustic Phonation Frequency</p>
                <p className="text-[0.68rem] text-[#64748b]">Test Date: Aug 18, 2026 • 96.8% Confidence</p>
              </div>
              <ChevronRight className="size-4 text-[#64748b] group-hover:text-[#0ea5e9] group-hover:translate-x-0.5 transition-transform" />
            </div>

            <div
              onClick={() => onNavigate("/patient/reports")}
              className="p-3.5 rounded-2xl bg-[#f8f9ff] border border-[#e2e8f0] hover:border-[#0ea5e9]/40 transition-all cursor-pointer group flex items-center justify-between"
            >
              <div className="space-y-0.5">
                <span className="text-[0.65rem] uppercase font-bold text-emerald-600">Latest Diagnostic Report</span>
                <p className="font-bold text-[#0b1c30]">Comprehensive 3D MRI Dossier (PDF Signed)</p>
                <p className="text-[0.68rem] text-[#64748b]">Signed by Dr. Sarah Jenkins, MD, PhD</p>
              </div>
              <ChevronRight className="size-4 text-[#64748b] group-hover:text-[#0ea5e9] group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>

        {/* Section 4: Your Preferences & Session Security */}
        <div className="bg-white rounded-3xl p-6 shadow-card border border-[#e2e8f0] space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-headline font-bold text-base text-[#0b1c30] flex items-center gap-2 border-b border-[#e2e8f0] pb-3">
              <Bell className="size-4.5 text-blue-600" />
              <span>Preferences &amp; Portal Security</span>
            </h3>

            <div className="space-y-3 text-xs pt-1">
              <label className="flex items-center justify-between p-3 rounded-2xl bg-[#f8f9ff] border border-[#e2e8f0] cursor-pointer">
                <div>
                  <p className="font-bold text-[#0b1c30]">SMS Appointment Reminders</p>
                  <p className="text-[0.68rem] text-[#64748b]">Receive SMS alerts 48h before upcoming clinic consultations</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.smsReminders}
                  onChange={(e) => setFormData({ ...formData, smsReminders: e.target.checked })}
                  className="size-4 text-[#0ea5e9] rounded border-slate-300 focus:ring-[#0ea5e9]"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-2xl bg-[#f8f9ff] border border-[#e2e8f0] cursor-pointer">
                <div>
                  <p className="font-bold text-[#0b1c30]">Email Copies of Signed Reports</p>
                  <p className="text-[0.68rem] text-[#64748b]">Automatically email encrypted PDF when signed by Dr. Jenkins</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.emailReports}
                  onChange={(e) => setFormData({ ...formData, emailReports: e.target.checked })}
                  className="size-4 text-[#0ea5e9] rounded border-slate-300 focus:ring-[#0ea5e9]"
                />
              </label>

              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between">
                <div>
                  <p className="font-bold text-rose-900">Sign Out of Patient Portal</p>
                  <p className="text-[0.68rem] text-rose-700">End your active patient session on this browser</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsLogoutModalOpen(true)}
                  className="rounded-xl bg-rose-600 text-white font-bold px-3 py-1.5 text-xs hover:bg-rose-700 transition-colors shadow-xs"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#e2e8f0] flex items-center justify-between text-xs text-[#64748b]">
            <span className="flex items-center gap-1.5 font-semibold text-emerald-700">
              <ShieldCheck className="size-4 text-emerald-600" />
              <span>Protected Health Information (PHI)</span>
            </span>
            <span className="font-mono text-[0.68rem]">HIPAA Verified</span>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        maxWidth="md"
      >
        <div className="p-6 text-center space-y-4 select-none">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-200">
            <LogOut className="size-7" />
          </div>

          <div className="space-y-1">
            <h3 className="font-headline font-extrabold text-xl text-[#0b1c30]">
              Sign Out of Patient Portal?
            </h3>
            <p className="text-xs text-[#64748b]">
              Are you sure you want to end your current session for <strong>{formData.fullName}</strong>?
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsLogoutModalOpen(false)}
              className="btn-secondary flex-1 py-2.5 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmLogout}
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white flex-1 py-2.5 text-xs font-bold shadow-md transition-colors"
            >
              Confirm Sign Out
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
