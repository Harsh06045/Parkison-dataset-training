import React from "react";
import { Mic, Square, RotateCcw, Activity, AlertCircle, Play, CheckCircle2 } from "lucide-react";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";

interface AudioRecorderProps {
  onRecorded: (blob: Blob, url: string) => void;
  onReset: () => void;
}

export function AudioRecorder({ onRecorded, onReset }: AudioRecorderProps) {
  const {
    isRecording,
    recordingDuration,
    audioUrl,
    audioBlob,
    error,
    audioLevels,
    startRecording,
    stopRecording,
    resetRecording,
  } = useAudioRecorder();

  const handleStop = () => {
    stopRecording();
  };

  React.useEffect(() => {
    if (audioBlob && audioUrl) {
      onRecorded(audioBlob, audioUrl);
    }
  }, [audioBlob, audioUrl]);

  const handleResetClick = () => {
    resetRecording();
    onReset();
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-4 text-xs text-[#0b1c30] select-none">
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-700">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Recording Studio Box */}
      <div className="rounded-2xl border border-[#e2e8f0] bg-[#f8f9ff] p-6 text-center space-y-4">
        {/* Dynamic Frequency Waveform Visualizer */}
        <div className="h-16 flex items-center justify-center gap-1.5 bg-white p-3 rounded-xl border border-[#e2e8f0]">
          {isRecording ? (
            audioLevels.map((val: number, idx: number) => (
              <div
                key={idx}
                className="w-1.5 bg-[#0ea5e9] rounded-full transition-all duration-75"
                style={{ height: `${Math.max(15, (val / 255) * 100)}%` }}
              />
            ))
          ) : (
            <div className="flex items-center gap-2 text-[#94a3b8]">
              <Activity className="size-4" />
              <span>Microphone Idle • Click Start Recording</span>
            </div>
          )}
        </div>

        {/* Timer Display */}
        <div className="font-mono text-xl font-bold text-[#0b1c30]">
          {formatTime(recordingDuration)}
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-center gap-3">
          {!isRecording ? (
            <button
              type="button"
              onClick={startRecording}
              className="btn-primary py-2.5 px-6 shadow-sm"
            >
              <Mic className="size-4" />
              <span>Start Voice Recording</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStop}
              className="btn-primary bg-rose-600 hover:bg-rose-700 py-2.5 px-6 shadow-sm animate-pulse"
            >
              <Square className="size-4 fill-white" />
              <span>Stop &amp; Analyze</span>
            </button>
          )}

          {audioUrl && (
            <button
              type="button"
              onClick={handleResetClick}
              className="btn-secondary py-2.5 px-4"
            >
              <RotateCcw className="size-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
