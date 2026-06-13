import { useCallback, useEffect, useRef, useState } from "react";

const BAR_COUNT = 48;
const TARGET_FPS = 30;
const FRAME_INTERVAL = 1000 / TARGET_FPS;

/**
 * Generates smooth demo visualizer data with organic-looking bars.
 * When connected to a real audio source, replace the demo logic with
 * Web Audio API AnalyserNode frequency data.
 */
export function useVisualizer(isPlaying: boolean, enabled: boolean) {
  const [bars, setBars] = useState<number[]>(() =>
    Array.from({ length: BAR_COUNT }, () => 0.05)
  );

  const animationRef = useRef<number>(0);
  const lastFrameRef = useRef<number>(0);
  const phasesRef = useRef<number[]>(
    Array.from({ length: BAR_COUNT }, () => Math.random() * Math.PI * 2)
  );
  const velocitiesRef = useRef<number[]>(
    Array.from({ length: BAR_COUNT }, () => 0.5 + Math.random() * 2)
  );

  const animate = useCallback(
    (timestamp: number) => {
      if (timestamp - lastFrameRef.current < FRAME_INTERVAL) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }
      lastFrameRef.current = timestamp;

      const time = timestamp / 1000;
      const phases = phasesRef.current as number[];
      const velocities = velocitiesRef.current as number[];

      const newBars = Array.from({ length: BAR_COUNT }, (_, i) => {
        const phase = phases[i] ?? 0;
        const velocity = velocities[i] ?? 1;

        // Multiple sine waves for organic feel
        const wave1 = Math.sin(time * velocity + phase) * 0.35;
        const wave2 = Math.sin(time * velocity * 1.7 + phase * 0.5) * 0.25;
        const wave3 = Math.sin(time * 0.5 + i * 0.15) * 0.15;

        // Center emphasis — bars near center are taller
        const centerFactor =
          1 - Math.abs(i - BAR_COUNT / 2) / (BAR_COUNT / 2);
        const centerBoost = centerFactor * 0.3;

        const value = 0.15 + wave1 + wave2 + wave3 + centerBoost;
        return Math.max(0.04, Math.min(1, value));
      });

      setBars(newBars);
      animationRef.current = requestAnimationFrame(animate);
    },
    []
  );

  useEffect(() => {
    if (isPlaying && enabled) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(animationRef.current);
      // Fade bars down when paused
      setBars((prev) => prev.map((v) => Math.max(0.04, v * 0.85)));
    }

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, enabled, animate]);

  return { bars, barCount: BAR_COUNT };
}
