import React from "react";
import { Calendar, Clock, MapPin, Stethoscope, Phone, CheckCircle2, ArrowLeft } from "lucide-react";
import { useToast } from "@/context/ToastContext";

interface PatientAppointmentsPageProps {
  onNavigate: (path: string) => void;
}

export function PatientAppointmentsPage({ onNavigate }: PatientAppointmentsPageProps) {
  const { info } = useToast();

  const appointments = [
    {
      id: "APT-2026-0915",
      title: "6-Month Longitudinal MRI Review & Consultation",
      doctor: "Dr. Sarah Jenkins, MD, PhD",
      specialty: "Cognitive Neurology",
      date: "Tuesday, September 15, 2026",
      time: "09:30 AM – 10:15 AM EST",
      location: "Metropolitan Neurological Institute • Suite 402, Cognitive Wing",
      status: "Confirmed",
      type: "In-Person Clinical Visit",
    },
    {
      id: "APT-2026-1020",
      title: "Phonation Voice Frequency Follow-up",
      doctor: "Dr. Sarah Jenkins, MD, PhD",
      specialty: "Cognitive Neurology",
      date: "Tuesday, October 20, 2026",
      time: "02:00 PM – 02:30 PM EST",
      location: "Telehealth Video Consultation",
      status: "Scheduled",
      type: "Remote Video Session",
    },
  ];

  return (
    <div className="space-y-6 text-[#0b1c30] select-none animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e2e8f0] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200 px-2.5 py-0.5 text-[0.65rem] font-bold">
              Patient Care Schedule
            </span>
            <span className="text-[#64748b]">•</span>
            <span className="text-xs font-mono text-[#64748b]">Eleanor Vance</span>
          </div>
          <h2 className="font-headline text-2xl font-extrabold text-[#0b1c30] tracking-tight mt-1">
            Clinic &amp; Telehealth Appointments
          </h2>
        </div>

        <button
          type="button"
          onClick={() => onNavigate("/patient/dashboard")}
          className="btn-secondary py-2 px-3.5 text-xs font-semibold self-start sm:self-auto flex items-center gap-1.5"
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to My Health</span>
        </button>
      </div>

      <div className="space-y-4">
        {appointments.map((apt) => (
          <div
            key={apt.id}
            className="bg-white rounded-3xl p-6 shadow-card border border-[#e2e8f0] space-y-4 hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e2e8f0] pb-3">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                  <Calendar className="size-5.5" />
                </div>
                <div>
                  <h3 className="font-bold text-[#0b1c30] text-sm">{apt.title}</h3>
                  <p className="text-xs text-[#64748b]">
                    With <strong>{apt.doctor}</strong> • {apt.specialty}
                  </p>
                </div>
              </div>

              <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 text-xs font-bold self-start sm:self-auto flex items-center gap-1">
                <CheckCircle2 className="size-3.5" />
                <span>{apt.status}</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-[#64748b]">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-[#0ea5e9]" />
                <span>{apt.date} • {apt.time}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-purple-600" />
                <span className="truncate">{apt.location}</span>
              </div>
              <div className="flex items-center gap-2 sm:justify-end">
                <span className="font-semibold text-[#0b1c30]">{apt.type}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 rounded-3xl bg-[#f0f9ff] border border-[#0ea5e9]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h4 className="font-bold text-[#0b1c30] text-sm">Need to reschedule or request a consultation?</h4>
          <p className="text-xs text-[#64748b]">
            Call the Metropolitan Neurological Institute care coordination desk directly.
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono font-bold text-[#0ea5e9] text-sm bg-white px-4 py-2 rounded-xl border border-[#e2e8f0] shadow-xs">
          <Phone className="size-4" />
          <span>(555) 234-8901</span>
        </div>
      </div>
    </div>
  );
}
