import React, { useState } from "react";
import { User, Plus, X } from "lucide-react";
import { usePatient } from "@/context/PatientContext";
import { PatientRecord, RiskLevel, PrimaryDisease } from "@/services/patientApi";

interface AddPatientModalContentProps {
  onClose: () => void;
  onCreated: (newPatient: PatientRecord) => void;
}

export function AddPatientModalContent({ onClose, onCreated }: AddPatientModalContentProps) {
  const { addPatient } = usePatient();
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState<number>(65);
  const [gender, setGender] = useState<"Male" | "Female" | "Other">("Male");
  const [dateOfBirth, setDateOfBirth] = useState("1961-04-12");
  const [contactNumber, setContactNumber] = useState("+1 (555) 019-2831");
  const [email, setEmail] = useState("patient@hospital.org");
  const [primaryDiagnosis, setPrimaryDiagnosis] = useState<PrimaryDisease>("Pending Analysis");
  const [riskLevel, setRiskLevel] = useState<RiskLevel>("Moderate");
  const [medicalHistory, setMedicalHistory] = useState("");
  const [mmseScore, setMmseScore] = useState<number>(24);
  const [updrsScore, setUpdrsScore] = useState<number>(14);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    setIsSubmitting(true);
    try {
      const created = await addPatient({
        fullName: fullName.trim(),
        age: Number(age),
        gender,
        dateOfBirth,
        contactNumber,
        email: email.trim() || "patient@hospital.org",
        primaryDiagnosis,
        stage: "Initial Assessment",
        attendingPhysician: "Dr. Sarah Jenkins, MD",
        riskLevel,
        medicalHistory,
        mmseScore,
        updrsScore,
      });
      onCreated(created);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-xs text-[#0b1c30] select-none">
      <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-4">
        <div>
          <h3 className="font-headline text-lg font-bold text-[#0b1c30]">
            Register New Clinical Patient
          </h3>
          <p className="text-xs text-[#64748b] mt-0.5">
            Add patient demographics and baseline cognitive/motor scoring for AI tracking.
          </p>
        </div>
        <div className="flex size-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-200">
          <User className="size-5" />
        </div>
      </div>

      <div className="space-y-4">
        {/* Row 1: Name & Gender */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="font-bold text-[#0b1c30]">Full Legal Name *</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Margaret Sullivan"
              className="w-full h-10 rounded-xl border border-[#e2e8f0] bg-[#f8f9ff] px-3 text-[#0b1c30] focus:border-[#0ea5e9] focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-[#0b1c30]">Biological Sex</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as any)}
              className="w-full h-10 rounded-xl border border-[#e2e8f0] bg-[#f8f9ff] px-3 text-[#0b1c30] focus:border-[#0ea5e9] focus:outline-none"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other / Non-Binary</option>
            </select>
          </div>
        </div>

        {/* Row 2: Age, DOB, Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="font-bold text-[#0b1c30]">Age (Years)</label>
            <input
              type="number"
              min={1}
              max={120}
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
              className="w-full h-10 rounded-xl border border-[#e2e8f0] bg-[#f8f9ff] px-3 text-[#0b1c30] focus:border-[#0ea5e9] focus:outline-none font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-[#0b1c30]">Date of Birth</label>
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="w-full h-10 rounded-xl border border-[#e2e8f0] bg-[#f8f9ff] px-3 text-[#0b1c30] focus:border-[#0ea5e9] focus:outline-none font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-[#0b1c30]">Contact Phone</label>
            <input
              type="tel"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              placeholder="+1 (555) 000-0000"
              className="w-full h-10 rounded-xl border border-[#e2e8f0] bg-[#f8f9ff] px-3 text-[#0b1c30] focus:border-[#0ea5e9] focus:outline-none"
            />
          </div>
        </div>

        {/* Row 3: Baseline Cognitive & Motor Scores */}
        <div className="p-4 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0] space-y-3">
          <span className="font-bold text-[#0b1c30] uppercase text-[0.68rem] tracking-wider block">
            Baseline Cognitive &amp; Motor Metrics
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex justify-between">
                <label className="font-semibold text-[#475569]">MMSE Cognitive Score (0-30):</label>
                <span className="font-mono font-bold text-purple-600">{mmseScore}/30</span>
              </div>
              <input
                type="range"
                min={0}
                max={30}
                value={mmseScore}
                onChange={(e) => setMmseScore(Number(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between">
                <label className="font-semibold text-[#475569]">MDS-UPDRS Motor (0-50):</label>
                <span className="font-mono font-bold text-cyan-600">{updrsScore} pts</span>
              </div>
              <input
                type="range"
                min={0}
                max={50}
                value={updrsScore}
                onChange={(e) => setUpdrsScore(Number(e.target.value))}
                className="w-full accent-cyan-600 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Row 4: Clinical Risk & Condition */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="font-bold text-[#0b1c30]">Risk Stratification</label>
            <select
              value={riskLevel}
              onChange={(e) => setRiskLevel(e.target.value as any)}
              className="w-full h-10 rounded-xl border border-[#e2e8f0] bg-[#f8f9ff] px-3 text-[#0b1c30] focus:border-[#0ea5e9] focus:outline-none"
            >
              <option value="High">High Clinical Risk</option>
              <option value="Moderate">Moderate Risk / Monitoring</option>
              <option value="Low">Low Risk / Stable</option>
              <option value="Critical">Critical Review Required</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-[#0b1c30]">Initial Diagnostic Suspect</label>
            <select
              value={primaryDiagnosis}
              onChange={(e) => setPrimaryDiagnosis(e.target.value as any)}
              className="w-full h-10 rounded-xl border border-[#e2e8f0] bg-[#f8f9ff] px-3 text-[#0b1c30] focus:border-[#0ea5e9] focus:outline-none"
            >
              <option value="Pending Analysis">Pending Initial Analysis</option>
              <option value="Alzheimer's Disease">Alzheimer&rsquo;s Disease Suspect</option>
              <option value="MCI">Mild Cognitive Impairment (MCI)</option>
              <option value="Parkinson's Disease">Parkinson&rsquo;s Disease Suspect</option>
              <option value="Healthy Control">Control / Healthy Baseline</option>
            </select>
          </div>
        </div>

        {/* Medical History */}
        <div className="space-y-1">
          <label className="font-bold text-[#0b1c30]">Medical History &amp; Symptoms</label>
          <textarea
            value={medicalHistory}
            onChange={(e) => setMedicalHistory(e.target.value)}
            rows={3}
            placeholder="Reported memory deficits, vocal tremor symptoms, family history, current medications..."
            className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8f9ff] p-3 text-xs text-[#0b1c30] focus:border-[#0ea5e9] focus:outline-none"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#e2e8f0]">
        <button
          type="button"
          onClick={onClose}
          className="btn-secondary py-2.5 px-4"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary py-2.5 px-6"
        >
          <Plus className="size-4" />
          <span>{isSubmitting ? "Creating..." : "Enroll Patient"}</span>
        </button>
      </div>
    </form>
  );
}
