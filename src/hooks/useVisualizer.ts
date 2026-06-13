import { useEffect, useState, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";

const BAR_COUNT = 48;

export function useVisualizer(isPlaying: boolean, enabled: boolean) {
  const [bars, setBars] = useState<number[]>(() =>
    Array.from({ length: BAR_COUNT }, () => 0.05)
  );

  const unlistenRef = useRef<UnlistenFn | null>(null);

  useEffect(() => {
    let active = true;

    async function setupCapture() {
      if (isPlaying && enabled) {
        try {
          await invoke("start_audio_capture");
          if (!unlistenRef.current) {
            unlistenRef.current = await listen<number[]>("audio-data", (event) => {
              if (active) {
                // Ensure we get BAR_COUNT bars or pad/slice them, assuming backend sends the right amount
                // But just use what the backend sends for now. We can normalize or process if needed.
                const newBars = event.payload.slice(0, BAR_COUNT).map(val => Math.max(0.04, Math.min(1, val)));
                // Pad if necessary
                while (newBars.length < BAR_COUNT) newBars.push(0.04);
                setBars(newBars);
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

  return { bars, barCount: BAR_COUNT };
}
