import React, { useState } from "react";
import { User, Plus, Search, ShieldCheck, CheckCircle2, ArrowLeft, MoreVertical } from "lucide-react";
import { useToast } from "@/context/ToastContext";

interface AdminPatientsPageProps {
  onNavigate: (path: string) => void;
}

export function AdminPatientsPage({ onNavigate }: AdminPatientsPageProps) {
  const { success, info } = useToast();
  const [search, setSearch] = useState("");

  const patients = [
    {
      id: "MRN-489201",
      name: "Eleanor Vance",
      age: 68,
      gender: "Female",
      doctor: "Dr. Sarah Jenkins, MD",
      diagnosis: "Mild Cognitive Impairment",
      status: "Active Monitoring",
      enrolledDate: "Jan 10, 2026",
    },
    {
      id: "MRN-309102",
      name: "Arthur Pendelton",
      age: 72,
      gender: "Male",
      doctor: "Dr. James Wilson, MD",
      diagnosis: "Early-Stage Parkinson's",
      status: "Active Monitoring",
      enrolledDate: "Feb 14, 2026",
    },
    {
      id: "MRN-108294",
      name: "Robert Davis",
      age: 68,
      gender: "Male",
      doctor: "Dr. Sarah Jenkins, MD",
      diagnosis: "Alzheimer's Disease",
      status: "Active Monitoring",
      enrolledDate: "Mar 02, 2026",
    },
  ];

  const filtered = patients.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 text-[#0b1c30] select-none animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e2e8f0] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200 px-2.5 py-0.5 text-[0.65rem] font-bold">
              Hospital Master Patient Index (EMPI)
            </span>
            <span className="text-[#64748b]">•</span>
            <span className="text-xs font-mono text-[#64748b]">Total Registered: {patients.length}</span>
          </div>
          <h2 className="font-headline text-2xl font-extrabold text-[#0b1c30] tracking-tight mt-1">
            Patient Identity &amp; Portal Accounts
          </h2>
        </div>

        <button
          type="button"
          onClick={() => info("Enrolment", "Opening EHR / HL7 FHIR patient ingestion modal...")}
          className="btn-primary py-2 px-3.5 text-xs font-semibold flex items-center gap-1.5"
        >
          <Plus className="size-4" />
          <span>Enroll Patient</span>
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#64748b]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by patient name, MRN ID, or assigned doctor..."
          className="w-full h-10 pl-10 pr-4 rounded-xl border border-[#e2e8f0] bg-white text-xs text-[#0b1c30] focus:border-[#0ea5e9] focus:outline-none"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-card border border-[#e2e8f0] overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#f8f9ff] border-b border-[#e2e8f0] text-[0.68rem] uppercase font-bold text-[#64748b]">
              <th className="p-4">Patient MRN</th>
              <th className="p-4">Full Name</th>
              <th className="p-4">Age / Sex</th>
              <th className="p-4">Assigned Attending</th>
              <th className="p-4">Clinical Cohort</th>
              <th className="p-4">Enrollment Date</th>
              <th className="p-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e2e8f0]">
            {filtered.map((p) => (
              <tr key={p.id} className="hover:bg-[#f8f9ff] transition-colors font-medium">
                <td className="p-4 font-mono font-bold text-[#0ea5e9]">{p.id}</td>
                <td className="p-4 font-bold text-[#0b1c30]">{p.name}</td>
                <td className="p-4 text-[#64748b]">{p.age}y • {p.gender}</td>
                <td className="p-4 font-semibold text-[#0b1c30]">{p.doctor}</td>
                <td className="p-4 text-[#475569]">{p.diagnosis}</td>
                <td className="p-4 text-[#64748b] font-mono text-[0.68rem]">{p.enrolledDate}</td>
                <td className="p-4 text-right">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[0.65rem] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {p.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
