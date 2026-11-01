import React, { useState } from "react";
import { Users, UserCheck, Shield, Plus, Search, MoreVertical, Stethoscope, CheckCircle2, ArrowLeft } from "lucide-react";
import { useToast } from "@/context/ToastContext";

interface AdminUsersPageProps {
  onNavigate: (path: string) => void;
}

export function AdminUsersPage({ onNavigate }: AdminUsersPageProps) {
  const { success, info } = useToast();
  const [filterRole, setFilterRole] = useState<string>("all");
  const [search, setSearch] = useState("");

  const users = [
    {
      id: "USR-8921",
      name: "Dr. Sarah Jenkins, MD, PhD",
      email: "dr.jenkins@neurofusion.ai",
      role: "doctor",
      license: "MD-98472-NEURO",
      dept: "Cognitive Neurology",
      status: "Active",
      lastLogin: "10 mins ago",
    },
    {
      id: "USR-3310",
      name: "Dr. James Wilson, MD",
      email: "dr.wilson@neurofusion.ai",
      role: "doctor",
      license: "MD-41092-NEURO",
      dept: "Movement Disorders",
      status: "Active",
      lastLogin: "2 hours ago",
    },
    {
      id: "USR-4892",
      name: "Eleanor Vance",
      email: "eleanor.vance@patient.neurofusion.ai",
      role: "patient",
      license: "MRN-489201",
      dept: "Memory Clinic Outpatient",
      status: "Active",
      lastLogin: "Today, 10:45 AM",
    },
    {
      id: "USR-0042",
      name: "Marcus Vance",
      email: "admin.it@hospital.org",
      role: "admin",
      license: "IT-ADMIN-894",
      dept: "Clinical AI Governance",
      status: "Active",
      lastLogin: "Just now",
    },
  ];

  const filtered = users.filter((u) => {
    const matchesRole = filterRole === "all" || u.role === filterRole;
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    return matchesRole && matchesSearch;
  });

  return (
    <div className="space-y-6 text-[#0b1c30] select-none animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e2e8f0] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-0.5 text-[0.65rem] font-bold">
              Hospital IT Governance
            </span>
            <span className="text-[#64748b]">•</span>
            <span className="text-xs font-mono text-[#64748b]">Total Accounts: 4 Active</span>
          </div>
          <h2 className="font-headline text-2xl font-extrabold text-[#0b1c30] tracking-tight mt-1">
            Physician, Patient &amp; Admin User Roster
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => info("Provision User", "Opening clinical IAM provisioning form...")}
            className="btn-primary py-2 px-3.5 text-xs font-semibold flex items-center gap-1.5"
          >
            <Plus className="size-4" />
            <span>Provision Account</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#64748b]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or license ID..."
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-[#e2e8f0] bg-white text-xs text-[#0b1c30] focus:border-[#0ea5e9] focus:outline-none"
          />
        </div>

        <div className="flex rounded-xl bg-[#f1f5f9] p-1 border border-[#e2e8f0] text-xs font-semibold shrink-0">
          {["all", "doctor", "patient", "admin"].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setFilterRole(r)}
              className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                filterRole === r
                  ? "bg-white text-[#0ea5e9] font-bold shadow-xs"
                  : "text-[#64748b] hover:text-[#0b1c30]"
              }`}
            >
              {r}s
            </button>
          ))}
        </div>
      </div>

      {/* User Roster Table */}
      <div className="bg-white rounded-2xl shadow-card border border-[#e2e8f0] overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#f8f9ff] border-b border-[#e2e8f0] text-[0.68rem] uppercase font-bold text-[#64748b]">
              <th className="p-4">User Details</th>
              <th className="p-4">Portal Role</th>
              <th className="p-4">License / MRN</th>
              <th className="p-4">Department</th>
              <th className="p-4">Last Activity</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e2e8f0]">
            {filtered.map((u) => (
              <tr key={u.id} className="hover:bg-[#f8f9ff] transition-colors font-medium">
                <td className="p-4">
                  <div className="font-bold text-[#0b1c30]">{u.name}</div>
                  <div className="text-[0.68rem] text-[#64748b] font-mono">{u.email}</div>
                </td>
                <td className="p-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[0.65rem] font-bold uppercase ${
                      u.role === "doctor"
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : u.role === "patient"
                        ? "bg-cyan-50 text-cyan-700 border border-cyan-200"
                        : "bg-purple-50 text-purple-700 border border-purple-200"
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="p-4 font-mono text-[#0ea5e9] font-bold">{u.license}</td>
                <td className="p-4 text-[#475569]">{u.dept}</td>
                <td className="p-4 text-[#64748b] text-[0.68rem]">{u.lastLogin}</td>
                <td className="p-4 text-right">
                  <button
                    type="button"
                    onClick={() => success("Security Action", `Reset password token generated for ${u.name}`)}
                    className="rounded-lg bg-[#f8f9ff] border border-[#e2e8f0] px-2.5 py-1 text-[0.68rem] font-bold text-[#0ea5e9] hover:bg-[#e0f2fe]"
                  >
                    Manage
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
