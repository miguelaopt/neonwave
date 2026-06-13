import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import type { PlayerStore, RepeatMode, Track } from "../types";

const MOCK_TRACK: Track = {
  id: "1",
  title: "NeonWave Player",
  artist: "Welcome",
  album: "Local Storage",
  albumArtUrl: "",
  durationMs: 0,
};

let pollingInterval: number | null = null;

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  currentTrack: MOCK_TRACK,
  isPlaying: false,
  progressMs: 0,
  volume: 75,
  shuffle: false,
  repeat: "off" as RepeatMode,
  isLiked: false,
  visualizerEnabled: true,
  lyricsEnabled: false,
  localTracks: [],

  play: async () => {
    try {
      await invoke("local_play", { index: null });
      set({ isPlaying: true });
    } catch (e) {
      console.error("Play error:", e);
    }
  },

  pause: async () => {
    try {
      await invoke("local_pause");
      set({ isPlaying: false });
    } catch (e) {
      console.error("Pause error:", e);
    }
  },

  togglePlayPause: () => {
    const { isPlaying } = get();
    if (isPlaying) {
      get().pause();
    } else {
      get().play();
    }
  },

  next: async () => {
    try {
      await invoke("local_next");
      set({ progressMs: 0 });
    } catch (e) {
      console.error("Next error:", e);
    }
  },

  previous: async () => {
    const { progressMs } = get();
    try {
      if (progressMs > 3000) {
        await invoke("local_seek", { positionMs: 0 });
        set({ progressMs: 0 });
      } else {
        await invoke("local_previous");
        set({ progressMs: 0 });
      }
    } catch (e) {
      console.error("Previous error:", e);
    }
  },

  seek: async (positionMs: number) => {
    try {
      await invoke("local_seek", { positionMs });
      set({ progressMs: positionMs });
    } catch (e) {
      console.error("Seek error:", e);
    }
  },

  setVolume: async (volume: number) => {
    const clampedVolume = Math.max(0, Math.min(100, volume));
    try {
      await invoke("local_set_volume", { volume: clampedVolume });
      set({ volume: clampedVolume });
    } catch (e) {
      console.error("Set volume error:", e);
    }
  },

  toggleShuffle: async () => {
    const { shuffle } = get();
    try {
      // NOTE: If shuffle is not supported natively in backend, just update UI
      set({ shuffle: !shuffle });
    } catch (e) {
      console.error("Toggle shuffle error:", e);
    }
  },

  cycleRepeat: async () => {
    const { repeat } = get();
    const modes: RepeatMode[] = ["off", "all", "one"];
    const currentIndex = modes.indexOf(repeat);
    const nextRepeat = modes[(currentIndex + 1) % modes.length];
    try {
      // NOTE: update UI
      set({ repeat: nextRepeat });
    } catch (e) {
      console.error("Cycle repeat error:", e);
    }
  },

  toggleLike: async () => {
    const { isLiked } = get();
    try {
      set({ isLiked: !isLiked });
    } catch (e) {
      console.error("Toggle like error:", e);
    }
  },

  toggleVisualizer: () => {
    set((state) => ({ visualizerEnabled: !state.visualizerEnabled }));
  },

  toggleLyrics: () => {
    set((state) => ({ lyricsEnabled: !state.lyricsEnabled }));
  },

  setProgress: (ms: number) => {
    set({ progressMs: ms });
  },

  setTrack: (track: Track) => {
    set({ currentTrack: track, progressMs: 0, isPlaying: false });
  },

  scanDirectory: async (path: string) => {
    try {
      const tracks = await invoke<Track[]>("scan_directory", { path });
      set({ localTracks: tracks });
    } catch (e) {
      console.error("Scan directory error:", e);
    }
  },

  playLocalTrack: async (index: number) => {
    try {
      await invoke("local_play", { index });
      const track = get().localTracks[index];
      if (track) {
        set({ currentTrack: track, isPlaying: true, progressMs: 0 });
      }
    } catch (e) {
      console.error("Play local track error:", e);
    }
  },

  startPolling: () => {
    if (pollingInterval) return;
    pollingInterval = window.setInterval(async () => {
      try {
        const position: number = await invoke("local_get_position");
        set({ progressMs: position });

        // Update track metadata if it changed in backend
        const metadata: any = await invoke("local_get_metadata");
        if (metadata && metadata.id) {
          const { currentTrack } = get();
          if (currentTrack.id !== metadata.id) {
            set({
               currentTrack: metadata,
               isPlaying: true
            });
          }
        }
      } catch (e) {
        // Suppress
      }
    }, 1000);
  },
}));
