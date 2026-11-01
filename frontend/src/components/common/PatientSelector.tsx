import React, { useState } from "react";
import { User, Search, Check, ChevronDown, Stethoscope, AlertCircle, Plus } from "lucide-react";
import { usePatient } from "@/context/PatientContext";
import { PatientRecord } from "@/services/patientApi";

interface PatientSelectorProps {
  selectedPatient: PatientRecord | null;
  onSelect: (patient: PatientRecord) => void;
}

export function PatientSelector({ selectedPatient, onSelect }: PatientSelectorProps) {
  const { patients } = usePatient();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filteredPatients = patients.filter((p) => {
    const q = query.toLowerCase();
    return (
      p.fullName.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      p.primaryDiagnosis?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="relative space-y-1.5 text-xs text-[#0b1c30] select-none">
      <label className="block font-bold text-[#0b1c30]">
        Selected Patient for Diagnostic Analysis
      </label>

      {/* Selector Trigger Bar */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between p-3.5 rounded-xl border border-[#e2e8f0] bg-[#f8f9ff] hover:bg-[#e0f2fe]/40 transition-colors cursor-pointer"
      >
        {selectedPatient ? (
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#e0f2fe] text-[#0284c7] font-bold text-xs border border-[#0ea5e9]/20">
              {selectedPatient.fullName
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")}
            </div>
            <div>
              <p className="font-bold text-[#0b1c30]">{selectedPatient.fullName}</p>
              <p className="text-[0.68rem] text-[#64748b]">
                ID: <span className="font-mono text-[#0ea5e9] font-bold">{selectedPatient.id}</span> • {selectedPatient.age} yrs • {selectedPatient.gender}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-[#94a3b8]">
            <User className="size-4" />
            <span>Select a patient from registry...</span>
          </div>
        )}

        <ChevronDown
          className={`size-4 text-[#64748b] transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full rounded-2xl border border-[#e2e8f0] bg-white p-3 shadow-xl z-50 space-y-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search patient by name or ID..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#e2e8f0] bg-[#f8f9ff] text-xs text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]"
            />
          </div>

          {/* List */}
          <div className="max-h-48 overflow-y-auto space-y-1">
            {filteredPatients.map((p) => {
              const isSelected = selectedPatient?.id === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => {
                    onSelect(p);
                    setIsOpen(false);
                  }}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-[#e0f2fe] text-[#0284c7] font-bold"
                      : "hover:bg-[#f1f5f9] text-[#0b1c30]"
                  }`}
                >
                  <div>
                    <p className="font-bold">{p.fullName}</p>
                    <p className="text-[0.68rem] text-[#64748b]">
                      {p.id} • {p.age} yrs • {p.gender}
                    </p>
                  </div>
                  {isSelected && <Check className="size-4 text-[#0ea5e9]" />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
