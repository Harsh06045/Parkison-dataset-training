import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  UserCheck,
  Calendar,
  Phone,
  Mail,
  ShieldAlert,
  UploadCloud,
  Cpu,
  FileText,
  Activity,
  Layers,
  Sparkles,
  Edit,
  Save,
  CheckCircle,
} from "lucide-react";
import { Patient, MriScan, DiagnosticReport, doctorService } from "@/lib/doctorService";

interface PatientDetailsTabProps {
  patient: Patient;
  onBack: () => void;
  onOpenUploadScan: (patient: Patient) => void;
  onOpenPrediction: (scan: MriScan) => void;
  onGenerateReport: (scanId: string) => void;
  onViewReport: (report: DiagnosticReport) => void;
}

export function PatientDetailsTab({
  patient,
  onBack,
  onOpenUploadScan,
  onOpenPrediction,
  onGenerateReport,
  onViewReport,
}: PatientDetailsTabProps) {
  const [scans, setScans] = useState<MriScan[]>([]);
  const [isEditingHistory, setIsEditingHistory] = useState(false);
  const [historyText, setHistoryText] = useState(patient.medicalHistory);
  const [selectedScan, setSelectedScan] = useState<MriScan | null>(null);

  useEffect(() => {
    const fetchedScans = doctorService.getScansForPatient(patient.id);
    setScans(fetchedScans);
    if (fetchedScans.length > 0) {
      setSelectedScan(fetchedScans[0]);
    }
  }, [patient.id]);

  const handleSaveHistory = () => {
    doctorService.updatePatient(patient.id, { medicalHistory: historyText });
    setIsEditingHistory(false);
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case "critical":
        return "bg-red-500/20 text-red-300 border-red-500/40";
      case "high":
        return "bg-purple-500/20 text-purple-300 border-purple-500/40";
      case "medium":
        return "bg-amber-500/20 text-amber-300 border-amber-500/40";
      default:
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
    }
  };

  const currentReport = doctorService.getReports().find((r) => r.patientId === patient.id);

  return (
    <div className="space-y-6 text-white select-none">
      {/* Back Button */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          onBack();
        }}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
      >
        <ArrowLeft className="size-4" />
        <span>Return to Patient Registry</span>
      </button>

      {/* Top Banner: Patient Demographics & Profile */}
      <div className="rounded-3xl border border-blue-500/30 bg-[#060919]/95 p-6 sm:p-8 backdrop-blur-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start sm:items-center gap-4">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-blue-950 border border-blue-500/40 text-blue-400 font-extrabold text-xl shadow-lg shrink-0">
            {patient.fullName.charAt(0)}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{patient.fullName}</h1>
              <span className="rounded-full bg-blue-500/20 border border-blue-500/40 px-3 py-0.5 text-xs font-mono text-blue-300">
                {patient.id}
              </span>
              <span className={`rounded-full px-3 py-0.5 text-xs font-bold border ${patient.riskLevel === "High" || patient.riskLevel === "Critical" ? "bg-purple-500/20 text-purple-300 border-purple-500/40" : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"}`}>
                {patient.riskLevel} Risk
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-2">
              <span>Age: <strong className="text-white">{patient.age}y</strong> ({patient.gender})</span>
              <span>DOB: <strong className="text-slate-300">{patient.dateOfBirth}</strong></span>
              <span>Phone: <strong className="text-slate-300">{patient.contactNumber}</strong></span>
              <span>Email: <strong className="text-slate-300">{patient.email}</strong></span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => onOpenUploadScan(patient)}
            className="h-10 rounded-xl bg-purple-600 px-4 text-xs font-bold text-white shadow-md hover:bg-purple-500 flex items-center gap-2"
          >
            <UploadCloud className="size-4" />
            <span>Upload Scan</span>
          </button>
          {currentReport ? (
            <button
              onClick={() => onViewReport(currentReport)}
              className="h-10 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white shadow-md hover:bg-blue-500 flex items-center gap-2"
            >
              <FileText className="size-4" />
              <span>View Report</span>
            </button>
          ) : (
            selectedScan && (
              <button
                onClick={() => onGenerateReport(selectedScan.id)}
                className="h-10 rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white shadow-md hover:bg-emerald-500 flex items-center gap-2"
              >
                <FileText className="size-4" />
                <span>Generate Diagnostic Report</span>
              </button>
            )
          )}
        </div>
      </div>

      {/* Grid Layout: Left Column = Biomarkers & History, Right Column = MRI Scans & Heatmaps */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Quantitative Volumetric Biomarker Panel & History */}
        <div className="lg:col-span-1 space-y-6">
          {/* Biomarkers */}
          <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6 backdrop-blur-xl shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="size-4 text-blue-400" />
                <span>Quantitative Biomarker Index</span>
              </h3>
            </div>

            {selectedScan ? (
              <div className="space-y-4 text-xs">
                {/* Hippocampal Volume Meter */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-300">Hippocampal Volume</span>
                    <span className="text-purple-300 font-mono">{selectedScan.hippocampalVolumeMm3 || 3200} mm³</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-950 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-400 rounded-full"
                      style={{ width: `${Math.min(100, Math.max(20, ((selectedScan.hippocampalVolumeMm3 || 3200) / 4500) * 100))}%` }}
                    />
                  </div>
                  <p className="text-[0.65rem] text-slate-400">Normal Range: 3,800 - 4,200 mm³</p>
                </div>

                {/* Ventricular Volume Meter */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-300">Ventricular Enlargement</span>
                    <span className="text-blue-300 font-mono">{selectedScan.ventricularVolumeMm3 || 38000} mm³</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-950 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                      style={{ width: `${Math.min(100, Math.max(20, ((selectedScan.ventricularVolumeMm3 || 38000) / 55000) * 100))}%` }}
                    />
                  </div>
                  <p className="text-[0.65rem] text-slate-400">Normal Range: 20,000 - 32,000 mm³</p>
                </div>

                {/* Striatal Binding Ratio */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-300">Striatal Binding Ratio (DaT)</span>
                    <span className="text-cyan-300 font-mono">{selectedScan.striatalBindingRatio || 2.4}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-950 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 rounded-full"
                      style={{ width: `${Math.min(100, Math.max(20, ((selectedScan.striatalBindingRatio || 2.4) / 3.5) * 100))}%` }}
                    />
                  </div>
                  <p className="text-[0.65rem] text-slate-400">Normal Range: 2.4 - 3.2</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">No scan selected for biomarker analysis.</p>
            )}
          </div>

          {/* Clinical History & Doctor Notes */}
          <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6 backdrop-blur-xl shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Clinical Notes &amp; History</h3>
              {isEditingHistory ? (
                <button
                  onClick={handleSaveHistory}
                  className="flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300"
                >
                  <Save className="size-3.5" />
                  <span>Save</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsEditingHistory(true)}
                  className="flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300"
                >
                  <Edit className="size-3.5" />
                  <span>Edit</span>
                </button>
              )}
            </div>

            {isEditingHistory ? (
              <textarea
                rows={5}
                value={historyText}
                onChange={(e) => setHistoryText(e.target.value)}
                className="w-full rounded-2xl border border-slate-800 bg-slate-900 p-3 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            ) : (
              <p className="text-xs text-slate-300 leading-relaxed rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4">
                {patient.medicalHistory}
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Scan History & AI Prediction Heatmaps */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6 backdrop-blur-xl shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Volumetric Scan Registry ({scans.length})</h3>
                <p className="text-xs text-slate-400">Select a scan to inspect 3D Grad-CAM attention heatmap</p>
              </div>
              <button
                onClick={() => onOpenUploadScan(patient)}
                className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-blue-400 hover:bg-slate-800 hover:text-white transition-all flex items-center gap-1.5"
              >
                <UploadCloud className="size-3.5" />
                <span>Add Scan</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="border-b border-slate-800 bg-slate-900/60 text-[0.68rem] uppercase text-slate-400">
                  <tr>
                    <th className="p-3">Scan ID</th>
                    <th className="p-3">Modality</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">AI Diagnosis</th>
                    <th className="p-3">Confidence</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {scans.map((scan) => (
                    <tr
                      key={scan.id}
                      onClick={() => setSelectedScan(scan)}
                      className={`cursor-pointer transition-colors ${
                        selectedScan?.id === scan.id ? "bg-blue-600/15" : "hover:bg-slate-900/40"
                      }`}
                    >
                      <td className="p-3 font-mono font-bold text-white">{scan.id}</td>
                      <td className="p-3">{scan.modality}</td>
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[0.65rem] font-medium border ${getSeverityBadge(scan.severity)}`}>
                          {scan.status}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-purple-300">{scan.predictedDisease}</td>
                      <td className="p-3 font-bold text-blue-400">{scan.confidence ? `${scan.confidence}%` : "Pending"}</td>
                      <td className="p-3 text-right space-x-2">
                        {scan.status === "Pending AI Analysis" || scan.status === "Requires Doctor Review" ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenPrediction(scan);
                            }}
                            className="rounded-lg bg-indigo-600/30 border border-indigo-500/50 px-2.5 py-1 text-[0.68rem] font-bold text-indigo-300 hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-1 ml-auto"
                          >
                            <Cpu className="size-3" />
                            <span>Run AI Inference</span>
                          </button>
                        ) : (
                          <span className="text-[0.68rem] text-emerald-400 font-semibold inline-flex items-center gap-1">
                            <CheckCircle className="size-3" />
                            <span>3D Grad-CAM Active</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Grad-CAM 3D Heatmap Preview Card */}
          {selectedScan && (
            <div className="rounded-3xl border border-indigo-500/30 bg-[#070b24]/90 p-6 backdrop-blur-xl shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Sparkles className="size-4 text-indigo-400" />
                    <span>Grad-CAM 3D Volumetric Neural Attention Heatmap</span>
                  </h3>
                  <p className="text-xs text-slate-400">Scan: {selectedScan.id} • {selectedScan.modality}</p>
                </div>
                <span className="rounded-full bg-indigo-500/20 border border-indigo-500/40 px-3 py-0.5 text-xs font-bold text-indigo-300">
                  {selectedScan.confidence || 98.4}% Model Confidence
                </span>
              </div>

              {/* 3D Brain Visual Simulator Box */}
              <div className="relative h-64 w-full rounded-2xl border border-slate-800 bg-slate-950 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/30 via-slate-950 to-slate-950 pointer-events-none" />

                {/* Simulated Brain Slice with Grad-CAM overlay */}
                <div className="relative flex items-center justify-center">
                  <div className="size-44 rounded-full border-2 border-indigo-500/30 bg-slate-900/80 shadow-[0_0_40px_rgba(99,102,241,0.2)] flex items-center justify-center">
                    <div className="size-28 rounded-full bg-gradient-to-tr from-purple-600/40 via-red-500/40 to-yellow-400/50 blur-md animate-pulse" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <Layers className="size-8 text-indigo-300 mb-1" />
                      <span className="text-[0.68rem] font-bold text-white">Axial Slice #64</span>
                      <span className="text-[0.62rem] text-indigo-300">Medial Temporal Lobe Focus</span>
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[0.68rem] text-slate-400 bg-slate-900/80 backdrop-blur-md p-2 rounded-xl border border-slate-800">
                  <span>Grad-CAM Activation Score: <strong>0.942 (High Focus)</strong></span>
                  <span className="text-indigo-400 font-semibold">ResNet-3D + Vision Transformer Ensemble</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
