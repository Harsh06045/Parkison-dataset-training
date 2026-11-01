import React, { useState } from "react";
import { X, UploadCloud, FileCheck, HardDrive, CheckCircle2 } from "lucide-react";
import { doctorService, Patient, MriScan } from "@/lib/doctorService";

interface MriUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient?: Patient;
  onUploadSuccess: (scan: MriScan) => void;
}

export function MriUploadModal({ isOpen, onClose, patient, onUploadSuccess }: MriUploadModalProps) {
  const [modality, setModality] = useState<MriScan["modality"]>("3D T1-weighted MRI");
  const [notes, setNotes] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [fileUploaded, setFileUploaded] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen) return null;

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFileUploaded(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileUploaded(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient) return;

    setIsUploading(true);

    setTimeout(() => {
      const scan = doctorService.uploadMriScan({
        patientId: patient.id,
        modality,
        notes: notes || `Ingested DICOM file: ${fileUploaded?.name || "volumetric_scan.dcm"}`,
      });

      setIsUploading(false);
      onUploadSuccess(scan);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-3xl border border-blue-500/30 bg-[#070b1e] p-6 sm:p-8 shadow-[0_0_50px_rgba(37,99,235,0.25)] text-white">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 flex size-8 items-center justify-center rounded-full bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <X className="size-4" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-6">
          <div className="flex size-10 items-center justify-center rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
            <UploadCloud className="size-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Upload MRI / PET Biomarker Scan</h2>
            <p className="text-xs text-slate-400">
              Patient: <span className="text-white font-semibold">{patient?.fullName || "Selected Patient"}</span> ({patient?.id})
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Select Imaging Modality</label>
            <select
              value={modality}
              onChange={(e) => setModality(e.target.value as any)}
              className="w-full h-10 rounded-xl border border-slate-800 bg-slate-900 px-3 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="3D T1-weighted MRI">3D T1-weighted MRI (Hippocampal Volumetry)</option>
              <option value="FDG-PET">FDG-PET (Fluorodeoxyglucose Metabolism)</option>
              <option value="DaTscan SPECT">DaTscan SPECT (Dopamine Transporter Imaging)</option>
              <option value="FLAIR MRI">FLAIR MRI (White Matter Hyperintensities)</option>
            </select>
          </div>

          {/* Drag & Drop Area */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">DICOM / NIfTI Volume File</label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
                dragActive
                  ? "border-blue-400 bg-blue-950/40"
                  : fileUploaded
                  ? "border-emerald-500/50 bg-emerald-950/20"
                  : "border-slate-800 bg-slate-900/50 hover:border-slate-700"
              }`}
            >
              <input
                type="file"
                accept=".dcm,.nii,.nii.gz,.zip"
                onChange={handleFileSelect}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />

              {fileUploaded ? (
                <div className="flex flex-col items-center gap-2">
                  <CheckCircle2 className="size-10 text-emerald-400" />
                  <p className="font-semibold text-white text-sm">{fileUploaded.name}</p>
                  <p className="text-[0.68rem] text-emerald-300 font-mono">
                    {(fileUploaded.size / (1024 * 1024)).toFixed(2)} MB • DICOM Validated
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <HardDrive className="size-10 text-blue-400 mb-1" />
                  <p className="font-medium text-slate-200">
                    Drag and drop DICOM / NIfTI files here or <span className="text-blue-400 underline">browse</span>
                  </p>
                  <p className="text-[0.68rem] text-slate-400">
                    Supports .dcm, .nii, .nii.gz, .zip (Max 500MB volumetric matrix)
                  </p>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Clinical Acquisition Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. 3.0 Tesla Siemens Magnetom Skyra, slice thickness 1.0mm..."
              className="w-full h-10 rounded-xl border border-slate-800 bg-slate-900 px-3 text-white focus:outline-none"
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
              disabled={isUploading}
              className="h-10 rounded-xl bg-purple-600 px-6 text-xs font-bold text-white shadow-lg hover:bg-purple-500 flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Ingesting Scan...</span>
                </>
              ) : (
                <>
                  <FileCheck className="size-4" />
                  <span>Upload &amp; Register Scan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
