import React, { useRef } from "react";
import { UploadCloud, FileType, CheckCircle2, Sparkles, X, Brain } from "lucide-react";

interface MRIUploaderProps {
  selectedFile: any;
  onSelectFile: (file: File) => void;
  onSelectSample: (presetId: "sample_ad_mild" | "sample_mci_amnestic" | "sample_control") => void;
  onClear: () => void;
  modality: string;
  onChangeModality: (m: string) => void;
}

export function MRIUploader({
  selectedFile,
  onSelectFile,
  onSelectSample,
  onClear,
  modality,
  onChangeModality,
}: MRIUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const samples: { id: "sample_ad_mild" | "sample_mci_amnestic" | "sample_control"; label: string; description: string }[] = [
    {
      id: "sample_ad_mild",
      label: "Preset: Mild Alzheimer's",
      description: "Hippocampal atrophy & ventricular enlargement",
    },
    {
      id: "sample_mci_amnestic",
      label: "Preset: Amnestic MCI",
      description: "Entorhinal cortical thinning with moderate risk",
    },
    {
      id: "sample_control",
      label: "Preset: Cognitively Normal",
      description: "Age-matched healthy control brain volumetry",
    },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onSelectFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onSelectFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-4 text-xs text-[#0b1c30] select-none">
      {/* Drag and Drop Zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
          selectedFile
            ? "border-[#0ea5e9] bg-[#f0f9ff]"
            : "border-[#e2e8f0] bg-[#f8f9ff] hover:bg-[#e0f2fe]/40 hover:border-[#0ea5e9]/60"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".dcm,.nii,.nii.gz,.png,.jpg,.jpeg"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex size-14 items-center justify-center rounded-2xl bg-[#e0f2fe] text-[#0284c7] border border-[#0ea5e9]/20 shadow-sm">
          <UploadCloud className="size-7" />
        </div>

        {selectedFile ? (
          <div className="space-y-1">
            <p className="font-bold text-[#0b1c30] text-sm">{selectedFile.name}</p>
            <p className="text-[0.68rem] text-[#64748b]">
              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • File Ready for Ingestion
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="font-bold text-[#0b1c30] text-sm">
              Drag &amp; Drop 3D Brain MRI Scan
            </p>
            <p className="text-[0.68rem] text-[#64748b]">
              Supports DICOM (.dcm), NIfTI (.nii, .nii.gz), or PNG/JPG (Up to 500MB)
            </p>
          </div>
        )}
      </div>

      {/* Modality Selector Tabs */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0]">
        <span className="font-bold text-[#0b1c30]">MRI Sequence Modality:</span>
        <div className="flex items-center gap-1">
          {["T1-Weighted (Axial)", "T2-FLAIR", "Coronal High-Res"].map((mod) => (
            <button
              key={mod}
              type="button"
              onClick={() => onChangeModality(mod)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                modality === mod
                  ? "bg-[#0ea5e9] text-white font-bold shadow-sm"
                  : "bg-white border border-[#e2e8f0] text-[#64748b] hover:bg-[#e2e8f0]"
              }`}
            >
              {mod}
            </button>
          ))}
        </div>
      </div>

      {/* Preset Clinical Sample Scans */}
      <div className="space-y-2 pt-1">
        <span className="font-bold text-[#64748b] text-[0.68rem] uppercase tracking-wider block">
          Or Load Pre-Validated Clinical Scan Presets:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {samples.map((sample) => (
            <button
              key={sample.id}
              type="button"
              onClick={() => onSelectSample(sample.id)}
              className="p-3 rounded-xl border border-[#e2e8f0] bg-white hover:bg-[#f0f9ff] hover:border-[#0ea5e9] text-left transition-all group"
            >
              <p className="font-bold text-[#0b1c30] group-hover:text-[#0ea5e9] transition-colors">
                {sample.label}
              </p>
              <p className="text-[0.65rem] text-[#64748b] mt-0.5">{sample.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
