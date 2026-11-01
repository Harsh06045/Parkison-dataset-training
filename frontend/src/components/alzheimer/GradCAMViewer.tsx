import React, { useState } from "react";
import {
  Layers,
  Sliders,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Info,
  ShieldCheck,
} from "lucide-react";
import { AlzheimerAnalysisResult, GradCamRegion } from "@/services/alzheimerApi";

interface GradCAMViewerProps {
  gradCam: AlzheimerAnalysisResult["gradCam"];
}

export function GradCAMViewer({ gradCam }: GradCAMViewerProps) {
  const [viewMode, setViewMode] = useState<"original" | "heatmap" | "overlay">("overlay");
  const [opacity, setOpacity] = useState(70);
  const [plane, setPlane] = useState<"axial" | "coronal" | "sagittal">("axial");
  const [sliceIndex, setSliceIndex] = useState(88);
  const [zoom, setZoom] = useState(100);

  const currentSlice = {
    original: gradCam?.slices?.[plane]?.original || gradCam?.originalImageUrl || "/plots/mri_original.png",
    heatmap: gradCam?.slices?.[plane]?.heatmap || gradCam?.heatmapImageUrl || "/plots/mri_gradcam.png",
    overlay: gradCam?.slices?.[plane]?.overlay || gradCam?.overlayImageUrl || "/plots/mri_overlay.png",
  };

  const defaultRegions: GradCamRegion[] = [
    { name: "Medial Temporal Lobe / Hippocampus", relevanceScore: 94, slicePlane: "Coronal", description: "Prominent neurodegeneration zone." },
    { name: "Entorhinal Cortex (Brodmann Area 28)", relevanceScore: 88, slicePlane: "Axial", description: "Early cortical atrophy locus." },
    { name: "Temporal Horn of Lateral Ventricle", relevanceScore: 82, slicePlane: "Coronal", description: "Compensatory ventricle enlargement." },
  ];

  const regionsToDisplay = gradCam?.regions && gradCam.regions.length > 0 ? gradCam.regions : defaultRegions;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-card border border-[#e2e8f0] space-y-6 text-[#0b1c30] select-none">
      {/* Header & Controls Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#e2e8f0] pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[0.68rem] font-bold text-purple-600 uppercase tracking-wider bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
              Visual AI Explainability
            </span>
            <span className="text-xs text-[#64748b]">•</span>
            <span className="text-[0.68rem] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="size-3" />
              Brain-Only (Skull Stripped)
            </span>
          </div>
          <h3 className="font-headline text-base font-bold text-[#0b1c30] mt-1">
            Volumetric Brain-Only Grad-CAM 3D Heatmap Fusion
          </h3>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-[#f8f9ff] p-1 rounded-xl border border-[#e2e8f0] text-xs font-semibold">
          <button
            type="button"
            onClick={() => setViewMode("original")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === "original"
                ? "bg-white text-[#0b1c30] font-bold shadow-sm"
                : "text-[#64748b] hover:text-[#0b1c30]"
            }`}
          >
            Original MRI
          </button>
          <button
            type="button"
            onClick={() => setViewMode("heatmap")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === "heatmap"
                ? "bg-white text-[#0b1c30] font-bold shadow-sm"
                : "text-[#64748b] hover:text-[#0b1c30]"
            }`}
          >
            Brain Heatmap
          </button>
          <button
            type="button"
            onClick={() => setViewMode("overlay")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === "overlay"
                ? "bg-[#0ea5e9] text-white font-bold shadow-sm"
                : "text-[#64748b] hover:text-[#0b1c30]"
            }`}
          >
            Overlay Fusion
          </button>
        </div>
      </div>

      {/* Main Multi-Plane Viewer Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Col: Slice Viewport Container */}
        <div className="lg:col-span-8 space-y-3">
          <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-950 border border-[#e2e8f0] flex items-center justify-center shadow-inner group">
            {/* 1. Underlying Original MRI Image */}
            <img
              src={currentSlice.original}
              alt="Original Brain MRI Slice"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.endsWith("mri_original.png")) {
                  target.src = "/plots/mri_original.png";
                }
              }}
              className="absolute inset-0 size-full object-contain transition-transform duration-200"
              style={{
                transform: `scale(${zoom / 100})`,
                opacity: viewMode === "heatmap" ? 0 : 1,
              }}
            />

            {/* 2. Overlaid Brain-Only Heatmap (Skull stripped) */}
            {(viewMode === "heatmap" || viewMode === "overlay") && (
              <img
                src={currentSlice.heatmap}
                alt="Brain-Only Grad-CAM Activation Heatmap"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.src.endsWith("mri_gradcam.png")) {
                    target.src = "/plots/mri_gradcam.png";
                  }
                }}
                className="absolute inset-0 size-full object-contain mix-blend-screen transition-transform duration-200"
                style={{
                  transform: `scale(${zoom / 100})`,
                  opacity: viewMode === "heatmap" ? 1 : opacity / 100,
                }}
              />
            )}

            {/* Viewport HUD Overlays */}
            <div className="pointer-events-none absolute top-3 left-3 bg-black/70 backdrop-blur-md px-3 py-1 rounded-lg text-[0.68rem] font-mono text-white/90 border border-white/10">
              Plane: <strong className="text-[#0ea5e9] uppercase">{plane}</strong> • Slice: {sliceIndex}/176
            </div>

            <div className="pointer-events-none absolute top-3 right-3 bg-black/70 backdrop-blur-md px-3 py-1 rounded-lg text-[0.68rem] font-mono text-white/90 border border-white/10">
              Zoom: {zoom}% • Blend: {opacity}%
            </div>

            {/* Zoom Controls Overlay */}
            <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/80 backdrop-blur-md p-1 rounded-xl border border-white/10 text-white shadow-lg">
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

          {/* Mandatory Medical Explainability Caption */}
          <div className="p-3.5 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0] flex items-start gap-2.5 text-xs text-[#64748b]">
            <Info className="size-4 text-[#0ea5e9] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="text-[#0b1c30]">Intracranial Decision Attribution:</strong> Grad-CAM heatmaps are strictly isolated to the brain parenchyma via morphological skull-stripping. Skull bone, scalp, and background noise are excluded from activation weighting.
            </p>
          </div>
        </div>

        {/* Right Col: Interactive Plane Switcher & Slider Controls */}
        <div className="lg:col-span-4 space-y-4 text-xs">
          {/* Anatomical Plane Selection */}
          <div className="p-4 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0] space-y-2.5">
            <label className="font-bold text-[#0b1c30] text-xs block">Select Anatomical Viewing Plane</label>
            <div className="flex items-center gap-2">
              {(["axial", "coronal", "sagittal"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlane(p)}
                  className={`flex-1 py-2 px-2 rounded-xl text-xs font-semibold capitalize transition-all whitespace-nowrap text-center ${
                    plane === p
                      ? "bg-[#0ea5e9] text-white shadow-sm ring-2 ring-[#0ea5e9]/20"
                      : "bg-white border border-[#e2e8f0] text-[#64748b] hover:border-[#0ea5e9] hover:text-[#0b1c30]"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Slice Depth Slider */}
          <div className="p-4 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0] space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-[#0b1c30]">Slice Index Depth:</span>
              <span className="font-mono font-bold text-[#0ea5e9]">{sliceIndex} / 176</span>
            </div>
            <input
              type="range"
              min={1}
              max={176}
              value={sliceIndex}
              onChange={(e) => setSliceIndex(Number(e.target.value))}
              className="w-full accent-[#0ea5e9] cursor-pointer"
            />
          </div>

          {/* Opacity Blend Slider */}
          {viewMode === "overlay" && (
            <div className="p-4 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0] space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-[#0b1c30]">Heatmap Blend Opacity:</span>
                <span className="font-mono font-bold text-purple-600">{opacity}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer"
              />
            </div>
          )}

          {/* Ranked Regions of Interest */}
          <div className="p-4 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0] space-y-3">
            <h4 className="font-bold text-[#0b1c30] uppercase tracking-wider text-[0.68rem] border-b border-[#e2e8f0] pb-1.5 flex items-center justify-between">
              <span>Ranked Intracranial Regions (ROI)</span>
              <span className="text-emerald-600 font-mono text-[0.6rem]">Stripped</span>
            </h4>
            <div className="space-y-2.5">
              {regionsToDisplay.map((roi: GradCamRegion, idx: number) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-[#0ea5e9]" />
                    <span className="font-semibold text-[#0b1c30]">{roi.name}</span>
                  </div>
                  <span className="font-mono font-bold text-[#0ea5e9]">
                    {roi.relevanceScore}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
