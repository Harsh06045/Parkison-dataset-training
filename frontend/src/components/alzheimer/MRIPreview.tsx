import React, { useState } from "react";
import { Maximize2, ZoomIn, ZoomOut, Layers, Eye, ShieldCheck, Sparkles } from "lucide-react";

interface MRIPreviewProps {
  previewUrl: string;
  filename?: string;
  modality?: string;
}

export function MRIPreview({ previewUrl, filename, modality = "T1-Weighted" }: MRIPreviewProps) {
  const [plane, setPlane] = useState<"axial" | "coronal" | "sagittal">("axial");
  const [sliceIndex, setSliceIndex] = useState(88);
  const [zoom, setZoom] = useState(100);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-card border border-[#e2e8f0] space-y-4 text-[#0b1c30] select-none">
      {/* Header & Meta */}
      <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
        <div className="flex items-center gap-2">
          <Layers className="size-4 text-[#0ea5e9]" />
          <h3 className="font-headline text-xs font-bold text-[#0b1c30] uppercase tracking-wider">
            Multi-Slice Volumetric Ingestion Preview
          </h3>
        </div>
        <span className="font-mono text-xs font-bold text-[#0ea5e9] bg-[#e0f2fe] px-2.5 py-0.5 rounded-full">
          {modality} Sequence
        </span>
      </div>

      {/* Screen Viewport */}
      <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-black border border-[#e2e8f0] flex items-center justify-center group shadow-inner">
        <img
          src={previewUrl || "/assets/xray-brain.jpg"}
          alt="MRI Ingestion Preview"
          onError={(e) => {
            const target = e.currentTarget;
            if (!target.src.endsWith("/assets/xray-brain.jpg")) {
              target.src = "/assets/xray-brain.jpg";
            }
          }}
          className="size-full object-cover transition-transform duration-200"
          style={{ transform: `scale(${zoom / 100})` }}
        />

        {/* Viewport Info Overlay */}
        <div className="pointer-events-none absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg text-[0.68rem] font-mono text-white/90 border border-white/10">
          Plane: <strong className="text-[#0ea5e9] uppercase">{plane}</strong> • Slice: {sliceIndex}/176
        </div>

        {/* Zoom Controls */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/70 backdrop-blur-md p-1 rounded-xl border border-white/10 text-white">
          <button
            type="button"
            onClick={() => setZoom(Math.max(80, zoom - 15))}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoom(100)}
            className="px-2 py-1 hover:bg-white/20 rounded-lg text-[0.65rem] font-mono"
            title="Reset Zoom"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => setZoom(Math.min(180, zoom + 15))}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Slice & Plane Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        {/* Plane Selector */}
        <div className="space-y-1.5">
          <label className="font-bold text-[#0b1c30]">Anatomical Plane:</label>
          <div className="grid grid-cols-3 gap-1.5">
            {(["axial", "coronal", "sagittal"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPlane(p)}
                className={`py-1.5 rounded-lg font-semibold transition-all capitalize ${plane === p
                    ? "bg-[#0ea5e9] text-white font-bold shadow-sm"
                    : "bg-[#f8f9ff] border border-[#e2e8f0] text-[#64748b] hover:bg-[#e2e8f0]"
                  }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Slice Depth Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="font-bold text-[#0b1c30]">Slice Index Depth:</label>
            <span className="font-mono font-bold text-[#0ea5e9]">{sliceIndex} / 176</span>
          </div>
          <input
            type="range"
            min={1}
            max={176}
            value={sliceIndex}
            onChange={(e) => setSliceIndex(Number(e.target.value))}
            className="w-full accent-[#0ea5e9] cursor-pointer mt-1"
          />
        </div>
      </div>
    </div>
  );
}
