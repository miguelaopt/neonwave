import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { usePlayerStore } from "../stores/playerStore";

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function ProgressBar() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const progressMs = usePlayerStore((s) => s.progressMs);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const seek = usePlayerStore((s) => s.seek);
  const setProgress = usePlayerStore((s) => s.setProgress);

  const [isDragging, setIsDragging] = useState(false);
  const [dragProgress, setDragProgress] = useState(0);
  const barRef = useRef<HTMLDivElement>(null);

  const durationMs = currentTrack?.durationMs ?? 1;
  const displayProgress = isDragging ? dragProgress : progressMs;
  const progressPercent = Math.min(100, (displayProgress / durationMs) * 100);

  // Simulate progress ticking when playing
  useEffect(() => {
    if (!isPlaying || isDragging) return;

    const interval = setInterval(() => {
      const current = usePlayerStore.getState().progressMs;
      const duration = usePlayerStore.getState().currentTrack?.durationMs ?? 0;
      if (current >= duration) {
        usePlayerStore.getState().pause();
        return;
      }
      setProgress(current + 200);
    }, 200);

    return () => clearInterval(interval);
  }, [isPlaying, isDragging, setProgress]);

  const getProgressFromEvent = useCallback(
    (clientX: number): number => {
      if (!barRef.current) return 0;
      const rect = barRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      return (x / rect.width) * durationMs;
    },
    [durationMs]
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragProgress(getProgressFromEvent(e.clientX));
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      setDragProgress(getProgressFromEvent(e.clientX));
    };

    const handleMouseUp = (e: MouseEvent) => {
      const finalProgress = getProgressFromEvent(e.clientX);
      seek(finalProgress);
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, getProgressFromEvent, seek]);

  return (
    <div className="w-full flex items-center gap-3">
      {/* Current time */}
      <span className="text-[11px] font-medium text-text-muted tabular-nums w-10 text-right flex-shrink-0">
        {formatTime(displayProgress)}
      </span>

      {/* Progress bar */}
      <div
        ref={barRef}
        className="relative flex-1 h-6 flex items-center cursor-pointer group"
        onMouseDown={handleMouseDown}
      >
        {/* Track background */}
        <div className="absolute w-full h-1 rounded-full bg-white/[0.08]" />

        {/* Filled portion */}
        <motion.div
          className="absolute h-1 rounded-full bg-gradient-to-r from-neon-purple to-neon-pink"
          style={{ width: `${progressPercent}%` }}
          layout
          transition={{ duration: isDragging ? 0 : 0.1 }}
        />

        {/* Glow on filled */}
        <div
          className="absolute h-1.5 rounded-full opacity-50 blur-[3px] bg-gradient-to-r from-neon-purple to-neon-pink"
          style={{ width: `${progressPercent}%` }}
        />

        {/* Thumb */}
        <motion.div
          className="absolute w-3.5 h-3.5 rounded-full bg-white
                     shadow-[0_0_10px_rgba(176,38,255,0.7),0_0_20px_rgba(176,38,255,0.3)]
                     transition-opacity duration-200
                     opacity-0 group-hover:opacity-100"
          style={{ left: `calc(${progressPercent}% - 7px)` }}
          animate={isDragging ? { opacity: 1, scale: 1.2 } : {}}
        />
      </div>

      {/* Duration */}
      <span className="text-[11px] font-medium text-text-muted tabular-nums w-10 flex-shrink-0">
        {formatTime(durationMs)}
      </span>
    </div>
  );
}
