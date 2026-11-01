import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, RotateCcw, Volume2 } from "lucide-react";

interface AudioPlayerProps {
  src: string | null;
  filename?: string;
  duration?: number;
}

export function AudioPlayer({ src, filename, duration = 3.5 }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioRef.current) return;
    const audio = audioRef.current;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
    };
  }, [src]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const target = Number(e.target.value);
    audioRef.current.currentTime = target;
    setCurrentTime(target);
  };

  if (!src) return null;

  return (
    <div className="bg-[#f8f9ff] rounded-2xl p-4 border border-[#e2e8f0] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#0b1c30] select-none">
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Meta */}
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <button
          type="button"
          onClick={togglePlay}
          className="flex size-10 items-center justify-center rounded-xl bg-[#0ea5e9] text-white hover:bg-[#0284c7] transition-colors shadow-sm shrink-0"
        >
          {isPlaying ? <Pause className="size-4" /> : <Play className="size-4 fill-white ml-0.5" />}
        </button>

        <div className="truncate">
          <p className="font-bold text-[#0b1c30] truncate">{filename || "Clinical Vocal Recording"}</p>
          <span className="text-[0.68rem] text-[#64748b]">Acoustic Signal Waveform</span>
        </div>
      </div>

      {/* Scrubber */}
      <div className="flex items-center gap-3 w-full sm:flex-1 sm:max-w-md">
        <span className="font-mono text-[0.68rem] text-[#64748b] w-10 text-right">
          {currentTime.toFixed(1)}s
        </span>
        <input
          type="range"
          min={0}
          max={audioRef.current?.duration || duration}
          step={0.1}
          value={currentTime}
          onChange={handleSeek}
          className="w-full accent-[#0ea5e9] cursor-pointer"
        />
        <span className="font-mono text-[0.68rem] text-[#64748b] w-10">
          {(audioRef.current?.duration || duration).toFixed(1)}s
        </span>
      </div>
    </div>
  );
}
