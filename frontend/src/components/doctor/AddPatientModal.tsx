import React, { useState } from "react";
import { X, UserPlus, ShieldAlert } from "lucide-react";
import { doctorService, DiseaseCategory, DiseaseStage, RiskLevel } from "@/lib/doctorService";

interface AddPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPatientAdded: () => void;
}

export function AddPatientModal({ isOpen, onClose, onPatientAdded }: AddPatientModalProps) {
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState<number>(65);
  const [gender, setGender] = useState<"Male" | "Female" | "Other">("Male");
  const [dob, setDob] = useState("1961-05-15");
  const [phone, setPhone] = useState("+1 (555) ");
  const [email, setEmail] = useState("");
  const [riskLevel, setRiskLevel] = useState<RiskLevel>("Moderate");
  const [primaryDiagnosis, setPrimaryDiagnosis] = useState<DiseaseCategory>("Alzheimer's Disease");
  const [stage, setStage] = useState<DiseaseStage>("Very Mild Cognitive Impairment (MCI)");
  const [medicalHistory, setMedicalHistory] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      setError("Please fill in patient name and email address.");
      return;
    }

    try {
      doctorService.addPatient({
        fullName,
        age,
        gender,
        dateOfBirth: dob,
        contactNumber: phone,
        email,
        riskLevel,
        primaryDiagnosis,
        stage,
        medicalHistory: medicalHistory || "No previous neurological history reported.",
        attendingPhysician: "Dr. Sarah Jenkins, MD",
      });

      onPatientAdded();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to add patient");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl border border-blue-500/30 bg-[#070b1e] p-6 sm:p-8 shadow-[0_0_50px_rgba(37,99,235,0.25)] text-white my-8">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 flex size-8 items-center justify-center rounded-full bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <X className="size-4" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-6">
          <div className="flex size-10 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <UserPlus className="size-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Register New Patient</h2>
            <p className="text-xs text-slate-400">Add patient profile to clinical monitoring cohort</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-300">
            <ShieldAlert className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Full Legal Name *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Margaret Thatcher"
                className="w-full h-10 rounded-xl border border-slate-800 bg-slate-900 px-3 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="patient@example.com"
                className="w-full h-10 rounded-xl border border-slate-800 bg-slate-900 px-3 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Age</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(parseInt(e.target.value) || 0)}
                className="w-full h-10 rounded-xl border border-slate-800 bg-slate-900 px-3 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full h-10 rounded-xl border border-slate-800 bg-slate-900 px-3 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Date of Birth</label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full h-10 rounded-xl border border-slate-800 bg-slate-900 px-3 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Risk Stratification</label>
              <select
                value={riskLevel}
                onChange={(e) => setRiskLevel(e.target.value as RiskLevel)}
                className="w-full h-10 rounded-xl border border-slate-800 bg-slate-900 px-3 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="Low">Low Risk</option>
                <option value="Moderate">Moderate Risk</option>
                <option value="High">High Risk</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Primary Suspected Diagnosis</label>
              <select
                value={primaryDiagnosis}
                onChange={(e) => setPrimaryDiagnosis(e.target.value as DiseaseCategory)}
                className="w-full h-10 rounded-xl border border-slate-800 bg-slate-900 px-3 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="Alzheimer's Disease">Alzheimer's Disease</option>
                <option value="Parkinson's Disease">Parkinson's Disease</option>
                <option value="MCI">MCI (Mild Cognitive Impairment)</option>
                <option value="Control / Healthy">Control / Healthy</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Current Clinical Stage</label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as DiseaseStage)}
                className="w-full h-10 rounded-xl border border-slate-800 bg-slate-900 px-3 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="Cognitively Normal">Cognitively Normal</option>
                <option value="Very Mild Cognitive Impairment (MCI)">Very Mild Cognitive Impairment</option>
                <option value="Mild Dementia">Mild Dementia</option>
                <option value="Moderate Dementia">Moderate Dementia</option>
                <option value="Severe Dementia">Severe Dementia</option>
                <option value="Parkinson's Stage I (Hoehn & Yahr)">Parkinson's Stage I</option>
                <option value="Parkinson's Stage II">Parkinson's Stage II</option>
                <option value="Parkinson's Stage III">Parkinson's Stage III</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Clinical Notes &amp; History</label>
            <textarea
              rows={3}
              value={medicalHistory}
              onChange={(e) => setMedicalHistory(e.target.value)}
              placeholder="Enter patient symptoms, family history, MMSE scores, current medications..."
              className="w-full rounded-xl border border-slate-800 bg-slate-900 p-3 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-xl border border-slate-800 bg-slate-900 px-5 text-xs font-semibold text-slate-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-10 rounded-xl bg-blue-600 px-6 text-xs font-bold text-white shadow-lg hover:bg-blue-500"
            >
              Save Patient Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
