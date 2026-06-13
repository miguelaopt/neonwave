import { useEffect, useState, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";

const BAR_COUNT = 48;

export function useVisualizer(isPlaying: boolean, enabled: boolean) {
  const [bars, setBars] = useState<number[]>(() =>
    Array.from({ length: BAR_COUNT }, () => 0.05)
  );
  // We can also export peak/rms if we want, but for now we'll just track them internally or return them.
  const [peak, setPeak] = useState<number>(0);

  const unlistenRef = useRef<UnlistenFn | null>(null);

  useEffect(() => {
    let active = true;

    async function setupCapture() {
      if (isPlaying && enabled) {
        try {
          await invoke("start_audio_capture");
          if (!unlistenRef.current) {
            unlistenRef.current = await listen<{ bands: number[], peak: number, rms: number }>("audio-data", (event) => {
              if (active) {
                const { bands, peak } = event.payload;
                const newBars = bands.slice(0, BAR_COUNT).map(val => Math.max(0.04, Math.min(1, val)));
                while (newBars.length < BAR_COUNT) newBars.push(0.04);
                setBars(newBars);
                setPeak(peak);
              }
            });
          }
        } catch (e) {
          console.error("Failed to start audio capture:", e);
        }
      } else {
        try {
          await invoke("stop_audio_capture");
        } catch (e) {
          console.error("Failed to stop audio capture:", e);
        }
        
        // Fade bars down when paused
        setBars((prev) => prev.map((v) => Math.max(0.04, v * 0.85)));
      }
    }

    setupCapture();

    return () => {
      active = false;
    };
  }, [isPlaying, enabled]);

  // Global cleanup on unmount
  useEffect(() => {
    return () => {
      if (unlistenRef.current) {
        unlistenRef.current();
        unlistenRef.current = null;
      }
      invoke("stop_audio_capture").catch(() => {});
    };
  }, []);

  return { bars, barCount: BAR_COUNT, peak };
}
