import React, { useRef } from "react";
import { UploadCloud, FileAudio, CheckCircle2, Sparkles, Volume2 } from "lucide-react";

interface AudioUploaderProps {
  selectedFile: any;
  onSelectFile: (file: File) => void;
  onSelectSample: (presetId: "sample_pd_stage2" | "sample_pd_early" | "sample_control_voice") => void;
  onClear: () => void;
}

export function AudioUploader({
  selectedFile,
  onSelectFile,
  onSelectSample,
  onClear,
}: AudioUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const samples: { id: "sample_pd_stage2" | "sample_pd_early" | "sample_control_voice"; label: string; description: string }[] = [
    {
      id: "sample_pd_stage2",
      label: "Preset: Parkinson's Stage II",
      description: "Severe jitter, shimmer perturbation and micro-tremors",
    },
    {
      id: "sample_pd_early",
      label: "Preset: Early Stage I PD",
      description: "Subtle fundamental frequency perturbations",
    },
    {
      id: "sample_control_voice",
      label: "Preset: Healthy Control Voice",
      description: "Clear phonation harmonic harmonics-to-noise ratio",
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
      {/* Drag & Drop Zone */}
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
          accept=".wav,.mp3,.m4a,.ogg,.flac"
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
              {(selectedFile.size / 1024).toFixed(1)} KB • Vocal Signal Ready for Extraction
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="font-bold text-[#0b1c30] text-sm">
              Drag &amp; Drop Sustained Phonation Audio Recording
            </p>
            <p className="text-[0.68rem] text-[#64748b]">
              Supports standard formats: .wav, .mp3, .m4a (Sustained vowel /a/ or /o/)
            </p>
          </div>
        )}
      </div>

      {/* Preset Clinical Voice Samples */}
      <div className="space-y-2 pt-1">
        <span className="font-bold text-[#64748b] text-[0.68rem] uppercase tracking-wider block">
          Or Load Pre-Recorded Clinical Voice Presets:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {samples.map((sample) => (
            <button
              key={sample.id}
              type="button"
              onClick={() => onSelectSample(sample.id)}
              className="p-3 rounded-xl border border-[#e2e8f0] bg-white hover:bg-[#f0f9ff] hover:border-[#0ea5e9] text-left transition-all group"
            >
              <div className="flex items-center gap-1.5">
                <Volume2 className="size-3.5 text-[#0ea5e9]" />
                <p className="font-bold text-[#0b1c30] group-hover:text-[#0ea5e9] transition-colors">
                  {sample.label}
                </p>
              </div>
              <p className="text-[0.65rem] text-[#64748b] mt-0.5">{sample.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
