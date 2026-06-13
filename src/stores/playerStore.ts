import { create } from "zustand";
import type { PlayerStore, RepeatMode, Track } from "../types";

// ─── Mock Data ─────────────────────────────────────────────────────

const MOCK_TRACK: Track = {
  id: "1",
  title: "Blinding Lights",
  artist: "The Weeknd",
  album: "After Hours",
  albumArtUrl: "https://i.scdn.co/image/ab67616d0000b8738863bc11d2aa12b54f5aeb36",
  durationMs: 200_000, // 3:20
};

// ─── Store ─────────────────────────────────────────────────────────

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  // ── State ──────────────────────────────────────────────────────
  currentTrack: MOCK_TRACK,
  isPlaying: false,
  progressMs: 0,
  volume: 75,
  shuffle: false,
  repeat: "off" as RepeatMode,
  isLiked: false,
  visualizerEnabled: true,

  // ── Playback Actions ───────────────────────────────────────────

  play: () => {
    // TODO: invoke("player_play")
    set({ isPlaying: true });
  },

  pause: () => {
    // TODO: invoke("player_pause")
    set({ isPlaying: false });
  },

  togglePlayPause: () => {
    const { isPlaying } = get();
    if (isPlaying) {
      get().pause();
    } else {
      get().play();
    }
  },

  next: () => {
    // TODO: invoke("player_next")
    // For now, reset progress to simulate next track
    set({ progressMs: 0 });
  },

  previous: () => {
    // TODO: invoke("player_previous")
    const { progressMs } = get();
    if (progressMs > 3000) {
      // If more than 3s in, restart current track
      set({ progressMs: 0 });
    } else {
      // Otherwise go to previous track
      set({ progressMs: 0 });
    }
  },

  seek: (positionMs: number) => {
    // TODO: invoke("player_seek", { positionMs })
    set({ progressMs: positionMs });
  },

  // ── Volume ─────────────────────────────────────────────────────

  setVolume: (volume: number) => {
    // TODO: invoke("player_set_volume", { volume })
    set({ volume: Math.max(0, Math.min(100, volume)) });
  },

  // ── Mode Toggles ──────────────────────────────────────────────

  toggleShuffle: () => {
    // TODO: invoke("player_toggle_shuffle")
    set((state) => ({ shuffle: !state.shuffle }));
  },

  cycleRepeat: () => {
    // TODO: invoke("player_cycle_repeat")
    set((state) => {
      const modes: RepeatMode[] = ["off", "all", "one"];
      const currentIndex = modes.indexOf(state.repeat);
      const nextIndex = (currentIndex + 1) % modes.length;
      return { repeat: modes[nextIndex] };
    });
  },

  toggleLike: () => {
    // TODO: invoke("player_toggle_like")
    set((state) => ({ isLiked: !state.isLiked }));
  },

  toggleVisualizer: () => {
    set((state) => ({ visualizerEnabled: !state.visualizerEnabled }));
  },

  // ── Internal ──────────────────────────────────────────────────

  setProgress: (ms: number) => {
    set({ progressMs: ms });
  },

  setTrack: (track: Track) => {
    set({ currentTrack: track, progressMs: 0, isPlaying: false });
  },
}));
