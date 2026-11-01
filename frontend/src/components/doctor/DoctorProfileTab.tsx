import React, { useState } from "react";
import { UserCheck, ShieldCheck, Mail, Phone, Building, Award, Bell, Lock, CheckCircle2 } from "lucide-react";
import { doctorService, DoctorProfile } from "@/lib/doctorService";

interface DoctorProfileTabProps {
  profile: DoctorProfile;
  onProfileUpdated: () => void;
}

export function DoctorProfileTab({ profile, onProfileUpdated }: DoctorProfileTabProps) {
  const [fullName, setFullName] = useState(profile.fullName);
  const [email, setEmail] = useState(profile.email);
  const [license, setLicense] = useState(profile.medicalLicenseId);
  const [specialization, setSpecialization] = useState(profile.specialization);
  const [hospital, setHospital] = useState(profile.hospital);
  const [department, setDepartment] = useState(profile.department);
  const [phone, setPhone] = useState(profile.phone);

  const [emailAlerts, setEmailAlerts] = useState(profile.notificationPreferences.emailAlerts);
  const [urgentPush, setUrgentPush] = useState(profile.notificationPreferences.urgentPush);
  const [weeklySummary, setWeeklySummary] = useState(profile.notificationPreferences.weeklySummary);

  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    doctorService.updateDoctorProfile({
      fullName,
      email,
      medicalLicenseId: license,
      specialization,
      hospital,
      department,
      phone,
      notificationPreferences: {
        emailAlerts,
        urgentPush,
        weeklySummary,
      },
    });

    setIsSaved(true);
    onProfileUpdated();
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="space-y-6 text-white select-none max-w-4xl mx-auto">
      {/* Header */}
      <div className="rounded-3xl border border-blue-500/30 bg-[#060919]/95 p-6 sm:p-8 backdrop-blur-2xl shadow-xl flex items-center gap-5">
        <div className="flex size-20 items-center justify-center rounded-3xl bg-indigo-950 border-2 border-indigo-500/40 text-indigo-400 font-black text-2xl shadow-lg">
          {fullName.split(" ").map((n) => n[0]).slice(0, 2).join("")}
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{fullName}</h1>
            <span className="rounded-full bg-blue-500/20 border border-blue-500/40 px-3 py-0.5 text-xs font-semibold text-blue-300">
              Verified Physician
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            License ID: <strong className="text-white font-mono">{license}</strong> • {specialization}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">{hospital}</p>
        </div>
      </div>

      {isSaved && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 p-4 text-xs font-semibold text-emerald-300">
          <CheckCircle2 className="size-5" />
          <span>Doctor profile settings and notification preferences saved successfully.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Professional Information */}
        <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6 sm:p-8 backdrop-blur-xl shadow-lg space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Award className="size-5 text-blue-400" />
            <span>Professional &amp; Medical License Profile</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Full Legal Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full h-10 rounded-xl border border-slate-800 bg-slate-900 px-3 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Medical License ID</label>
              <input
                type="text"
                value={license}
                onChange={(e) => setLicense(e.target.value)}
                className="w-full h-10 rounded-xl border border-slate-800 bg-slate-900 px-3 text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Specialization</label>
              <input
                type="text"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                className="w-full h-10 rounded-xl border border-slate-800 bg-slate-900 px-3 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Hospital / Medical Center</label>
              <input
                type="text"
                value={hospital}
                onChange={(e) => setHospital(e.target.value)}
                className="w-full h-10 rounded-xl border border-slate-800 bg-slate-900 px-3 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Department</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full h-10 rounded-xl border border-slate-800 bg-slate-900 px-3 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Contact Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full h-10 rounded-xl border border-slate-800 bg-slate-900 px-3 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6 sm:p-8 backdrop-blur-xl shadow-lg space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Bell className="size-5 text-indigo-400" />
            <span>Clinical Notification Preferences</span>
          </h2>

          <div className="space-y-3 text-xs">
            <label className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-800 bg-slate-900/60 cursor-pointer hover:bg-slate-900 transition-colors">
              <div>
                <p className="font-bold text-white">Email Critical Biomarker Alerts</p>
                <p className="text-slate-400 text-[0.68rem]">Receive immediate email notifications when AI flags high-risk atrophy.</p>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="size-4 rounded accent-blue-600"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-800 bg-slate-900/60 cursor-pointer hover:bg-slate-900 transition-colors">
              <div>
                <p className="font-bold text-white">Urgent Push Notifications</p>
                <p className="text-slate-400 text-[0.68rem]">Enable browser alert dialogs when AI scan processing completes.</p>
              </div>
              <input
                type="checkbox"
                checked={urgentPush}
                onChange={(e) => setUrgentPush(e.target.checked)}
                className="size-4 rounded accent-blue-600"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-800 bg-slate-900/60 cursor-pointer hover:bg-slate-900 transition-colors">
              <div>
                <p className="font-bold text-white">Weekly Analytics Digest</p>
                <p className="text-slate-400 text-[0.68rem]">Receive weekly report of disease distribution trends across your cohort.</p>
              </div>
              <input
                type="checkbox"
                checked={weeklySummary}
                onChange={(e) => setWeeklySummary(e.target.checked)}
                className="size-4 rounded accent-blue-600"
              />
            </label>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="h-11 rounded-2xl bg-blue-600 px-8 text-xs font-bold text-white shadow-xl hover:bg-blue-500 transition-all"
          >
            Save Profile Changes
          </button>
        </div>
      </form>
    </div>
  );
}
