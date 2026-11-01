import { useEffect, useRef } from "react";

interface VideoBackgroundProps {
  src: string;
}

export function VideoBackground({ src }: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const playVideo = () => {
      video.play().catch((error) => {
        console.warn("Autoplay prevented:", error);
      });
    };

    playVideo();

    // Fallback trigger for mobile browsers requiring touch interaction
    const handleTouchOrClick = () => {
      if (video.paused) {
        playVideo();
      }
    };

    window.addEventListener("touchstart", handleTouchOrClick, { once: true });
    window.addEventListener("click", handleTouchOrClick, { once: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchOrClick);
      window.removeEventListener("click", handleTouchOrClick);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 select-none overflow-hidden z-0 bg-[#0a0e1a]"
    >
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="h-full w-full object-cover min-h-screen min-w-full"
      >
        <source src={src} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
