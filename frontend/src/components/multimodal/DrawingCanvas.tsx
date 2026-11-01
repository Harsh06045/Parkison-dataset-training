import React, { useRef, useState, useEffect } from "react";
import { PenTool, RotateCcw, UploadCloud, Sparkles, CheckCircle2, Eye, ShieldAlert } from "lucide-react";

interface DrawingCanvasProps {
  onDrawingComplete: (file: File, previewUrl: string) => void;
  disease: "Alzheimer's Disease" | "Parkinson's Disease";
}

export function DrawingCanvas({ onDrawingComplete, disease }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [activeMode, setActiveMode] = useState<"draw" | "upload">("draw");
  const [strokeStats, setStrokeStats] = useState({
    pointsCount: 0,
    durationSec: 0,
    tremorIndex: "Low (Normal)",
    smoothness: 94.2,
  });
  const [uploadedDrawing, setUploadedDrawing] = useState<{ file: File; url: string } | null>(null);

  const drawStartTime = useRef<number | null>(null);
  const pointHistory = useRef<{ x: number; y: number; time: number }[]>([]);

  // Initialize Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set high DPI resolution
    const dpr = window.devicePixelRatio || 1;
    canvas.width = 440 * dpr;
    canvas.height = 440 * dpr;
    ctx.scale(dpr, dpr);

    clearCanvas();
  }, [showGuide]);

  const drawSpiralGuide = (ctx: CanvasRenderingContext2D) => {
    ctx.save();
    ctx.strokeStyle = "rgba(148, 163, 184, 0.22)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);

    const centerX = 220;
    const centerY = 220;
    ctx.beginPath();
    for (let a = 0; a < 6 * Math.PI; a += 0.05) {
      const r = 9 * a;
      const x = centerX + r * Math.cos(a);
      const y = centerY + r * Math.sin(a);
      if (a === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 440, 440);

    if (showGuide) {
      drawSpiralGuide(ctx);
    }

    setHasDrawn(false);
    pointHistory.current = [];
    drawStartTime.current = null;
    setStrokeStats({ pointsCount: 0, durationSec: 0, tremorIndex: "N/A", smoothness: 0 });
  };

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    return {
      x: ((clientX - rect.left) / rect.width) * 440,
      y: ((clientY - rect.top) / rect.height) * 440,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    setHasDrawn(true);
    if (!drawStartTime.current) drawStartTime.current = Date.now();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCanvasCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = "#0ea5e9";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    pointHistory.current.push({ x, y, time: Date.now() });
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCanvasCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();

    pointHistory.current.push({ x, y, time: Date.now() });
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    // Compute kinematic stroke statistics
    const pts = pointHistory.current;
    if (pts.length > 10 && drawStartTime.current) {
      const duration = (Date.now() - drawStartTime.current) / 1000;
      let tremorSum = 0;
      for (let i = 2; i < pts.length; i++) {
        const dx1 = pts[i - 1].x - pts[i - 2].x;
        const dy1 = pts[i - 1].y - pts[i - 2].y;
        const dx2 = pts[i].x - pts[i - 1].x;
        const dy2 = pts[i].y - pts[i - 1].y;
        const angleDiff = Math.abs(Math.atan2(dy2, dx2) - Math.atan2(dy1, dx1));
        if (angleDiff > 0.5) tremorSum++;
      }
      const tremorRatio = tremorSum / pts.length;
      const tremorLabel =
        tremorRatio > 0.22 ? "High (Micro-tremor)" : tremorRatio > 0.12 ? "Moderate" : "Low (Normal Stability)";
      const smoothScore = Math.max(50, Math.min(99, Math.round((1 - tremorRatio) * 100)));

      setStrokeStats({
        pointsCount: pts.length,
        durationSec: Number(duration.toFixed(1)),
        tremorIndex: tremorLabel,
        smoothness: smoothScore,
      });

      // Export canvas to file and send to parent
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `patient_spiral_${Date.now()}.png`, { type: "image/png" });
            const url = URL.createObjectURL(blob);
            onDrawingComplete(file, url);
          }
        }, "image/png");
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setUploadedDrawing({ file, url });
    onDrawingComplete(file, url);
  };

  const loadPresetSpiral = (type: "normal" | "parkinson") => {
    const filename =
      type === "normal"
        ? "/plots/samples/sample_spiral_normal.png"
        : "/plots/samples/sample_spiral_parkinson.png";
    fetch(filename)
      .then((r) => r.blob())
      .then((blob) => {
        const file = new File([blob], `${type}_spiral_sample.png`, { type: "image/png" });
        const url = URL.createObjectURL(blob);
        setUploadedDrawing({ file, url });
        onDrawingComplete(file, url);
      })
      .catch(() => {
        // Fallback local simulation
        const img = new Image();
        img.src = filename;
        img.onload = () => {
          const canvas = canvasRef.current;
          if (canvas) {
            const ctx = canvas.getContext("2d");
            ctx?.drawImage(img, 0, 0, 440, 440);
            setHasDrawn(true);
          }
        };
      });
  };

  return (
    <div className="space-y-4 select-none">
      {/* Mode Switcher */}
      <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
        <div className="flex items-center gap-2">
          <PenTool className="size-4 text-[#0ea5e9]" />
          <h4 className="font-headline text-xs font-bold text-[#0b1c30] uppercase tracking-wider">
            {disease === "Alzheimer's Disease"
              ? "Visuoconstructive Clock / Spiral Kinematic Test"
              : "Archimedean Spiral Tremor & Motor Assessment"}
          </h4>
        </div>

        <div className="flex bg-[#f8f9ff] p-0.5 rounded-lg border border-[#e2e8f0] text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveMode("draw")}
            className={`px-3 py-1 rounded-md transition-all ${
              activeMode === "draw" ? "bg-white text-[#0b1c30] font-bold shadow-sm" : "text-[#64748b]"
            }`}
          >
            Interactive Canvas
          </button>
          <button
            type="button"
            onClick={() => setActiveMode("upload")}
            className={`px-3 py-1 rounded-md transition-all ${
              activeMode === "upload" ? "bg-white text-[#0b1c30] font-bold shadow-sm" : "text-[#64748b]"
            }`}
          >
            Upload Paper Scan
          </button>
        </div>
      </div>

      {activeMode === "draw" ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
          {/* Drawing Canvas Area */}
          <div className="md:col-span-8 space-y-3">
            <div className="relative aspect-square w-full max-w-[440px] mx-auto rounded-2xl overflow-hidden bg-white border-2 border-dashed border-[#cbd5e1] shadow-inner flex items-center justify-center touch-none">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-full cursor-crosshair"
              />

              {!hasDrawn && (
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-white/40 backdrop-blur-[1px]">
                  <PenTool className="size-8 text-[#94a3b8] mb-2 animate-bounce" />
                  <p className="text-xs font-bold text-[#0b1c30]">Click and drag to trace or draw the spiral</p>
                  <p className="text-[0.68rem] text-[#64748b] mt-0.5">
                    Start from the center core and spiral outward smoothly
                  </p>
                </div>
              )}
            </div>

            {/* Toolbar Buttons */}
            <div className="flex items-center justify-between text-xs max-w-[440px] mx-auto">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="px-2.5 py-1.5 rounded-lg border border-[#e2e8f0] text-[#64748b] hover:text-[#0b1c30] hover:bg-[#f1f5f9] flex items-center gap-1.5 font-semibold"
                >
                  <RotateCcw className="size-3" />
                  <span>Clear</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowGuide(!showGuide)}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 ${
                    showGuide
                      ? "bg-[#e0f2fe] border-[#0ea5e9] text-[#0284c7]"
                      : "border-[#e2e8f0] text-[#64748b] bg-white"
                  }`}
                >
                  <Eye className="size-3" />
                  <span>{showGuide ? "Guide On" : "Guide Off"}</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => loadPresetSpiral("normal")}
                  className="px-2 py-1 text-[0.68rem] rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold hover:bg-emerald-100"
                >
                  Load Normal Sample
                </button>
                <button
                  type="button"
                  onClick={() => loadPresetSpiral("parkinson")}
                  className="px-2 py-1 text-[0.68rem] rounded-md bg-rose-50 text-rose-700 border border-rose-200 font-semibold hover:bg-rose-100"
                >
                  Load Tremor Sample
                </button>
              </div>
            </div>
          </div>

          {/* Stroke Kinematics Real-time Sidebar */}
          <div className="md:col-span-4 space-y-3 text-xs">
            <div className="bg-[#f8f9ff] rounded-xl p-4 border border-[#e2e8f0] space-y-3">
              <div className="flex items-center gap-1.5 font-bold text-[#0b1c30] border-b border-[#e2e8f0] pb-2">
                <Sparkles className="size-3.5 text-purple-600" />
                <span>Kinematic Feature Extraction</span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[#64748b]">Coordinates Sampled:</span>
                  <span className="font-mono font-bold text-[#0ea5e9]">{strokeStats.pointsCount} pts</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#64748b]">Drawing Duration:</span>
                  <span className="font-mono font-bold text-[#0b1c30]">{strokeStats.durationSec}s</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#64748b]">Tremor Saliency:</span>
                  <span
                    className={`font-semibold ${
                      strokeStats.tremorIndex.includes("High")
                        ? "text-rose-600"
                        : strokeStats.tremorIndex.includes("Moderate")
                        ? "text-amber-600"
                        : "text-emerald-600"
                    }`}
                  >
                    {strokeStats.tremorIndex}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#64748b]">Trajectory Regularity:</span>
                  <span className="font-mono font-bold text-purple-600">
                    {strokeStats.smoothness ? `${strokeStats.smoothness}%` : "—"}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-[0.72rem] text-amber-800 space-y-1">
              <p className="font-bold flex items-center gap-1">
                <ShieldAlert className="size-3 text-amber-600" />
                <span>Clinical Diagnostic Significance</span>
              </p>
              <p className="leading-relaxed">
                {disease === "Alzheimer's Disease"
                  ? "Detects visual-spatial disorientation, parietal lobe praxis impairment, and micro-pauses during complex continuous motor planning."
                  : "Identifies classic resting/action motor tremors, micro-hesitations, bradykinesia, and trajectory jaggedness characteristic of basal ganglia degeneration."}
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Upload Mode */
        <div className="space-y-4">
          <label className="border-2 border-dashed border-[#cbd5e1] hover:border-[#0ea5e9] rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-[#f8f9ff] hover:bg-cyan-50/30">
            <UploadCloud className="size-10 text-[#0ea5e9] mb-2" />
            <span className="text-xs font-bold text-[#0b1c30]">Click or drop photo of hand-drawn paper test</span>
            <span className="text-[0.68rem] text-[#64748b] mt-0.5">Supports PNG, JPG, JPEG spiral or meander drawings</span>
            <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          </label>

          {uploadedDrawing && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-600" />
                <span className="font-semibold text-emerald-900">{uploadedDrawing.file.name}</span>
              </div>
              <img src={uploadedDrawing.url} alt="Drawing Preview" className="size-12 object-cover rounded-lg border border-emerald-300" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

