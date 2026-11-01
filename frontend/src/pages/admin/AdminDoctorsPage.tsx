import React, { useState } from "react";
import { Stethoscope, Plus, Search, ShieldCheck, CheckCircle2, ArrowLeft, Mail, Phone, Calendar } from "lucide-react";
import { useToast } from "@/context/ToastContext";

interface AdminDoctorsPageProps {
  onNavigate: (path: string) => void;
}

export function AdminDoctorsPage({ onNavigate }: AdminDoctorsPageProps) {
  const { success, info } = useToast();
  const [search, setSearch] = useState("");

  const doctors = [
    {
      id: "DOC-8921",
      name: "Dr. Sarah Jenkins, MD, PhD",
      email: "dr.jenkins@neurofusion.ai",
      license: "MD-98472-NEURO",
      specialty: "Cognitive Neurology & Movement Disorders",
      hospital: "Metropolitan Neurological Institute",
      assignedPatients: 14,
      status: "Active & Verified",
      verifiedDate: "Jan 15, 2026",
    },
    {
      id: "DOC-3310",
      name: "Dr. James Wilson, MD",
      email: "dr.wilson@neurofusion.ai",
      license: "MD-41092-NEURO",
      specialty: "Movement Disorders & Deep Brain Stimulation",
      hospital: "Metropolitan Neurological Institute",
      assignedPatients: 10,
      status: "Active & Verified",
      verifiedDate: "Feb 01, 2026",
    },
  ];

  const filtered = doctors.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) || d.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 text-[#0b1c30] select-none animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e2e8f0] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 text-[0.65rem] font-bold">
              Medical Staff Roster
            </span>
            <span className="text-[#64748b]">•</span>
            <span className="text-xs font-mono text-[#64748b]">2 Attending Physicians</span>
          </div>
          <h2 className="font-headline text-2xl font-extrabold text-[#0b1c30] tracking-tight mt-1">
            Doctor Accounts &amp; Clinical Licenses
          </h2>
        </div>

        <button
          type="button"
          onClick={() => info("Add Physician", "Opening physician board verification modal...")}
          className="btn-primary py-2 px-3.5 text-xs font-semibold flex items-center gap-1.5"
        >
          <Plus className="size-4" />
          <span>Onboard Doctor</span>
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#64748b]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search doctors by name, email, or medical license ID..."
          className="w-full h-10 pl-10 pr-4 rounded-xl border border-[#e2e8f0] bg-white text-xs text-[#0b1c30] focus:border-[#0ea5e9] focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((doc) => (
          <div
            key={doc.id}
            className="bg-white rounded-3xl p-6 shadow-card border border-[#e2e8f0] space-y-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-3 border-b border-[#e2e8f0] pb-3">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 font-headline font-bold text-base">
                  {doc.name.split(" ")[1][0]}
                </div>
                <div>
                  <h3 className="font-bold text-[#0b1c30] text-sm">{doc.name}</h3>
                  <p className="text-[0.68rem] text-[#64748b] font-mono">{doc.license}</p>
                </div>
              </div>

              <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-[0.65rem] font-bold">
                {doc.status}
              </span>
            </div>

            <div className="space-y-2 text-xs text-[#64748b]">
              <p className="text-[#0b1c30] font-semibold">{doc.specialty}</p>
              <p>{doc.hospital}</p>
              <div className="flex items-center justify-between pt-2 border-t border-[#e2e8f0] text-[0.68rem]">
                <span>Assigned Cohort: <strong>{doc.assignedPatients} Patients</strong></span>
                <span className="font-mono text-[#94a3b8]">Verified: {doc.verifiedDate}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
