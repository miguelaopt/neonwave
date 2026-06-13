import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-opener";
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

let pollingInterval: number | null = null;

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
  lyricsEnabled: false,
  mode: "spotify",
  isAuthenticated: false,

  // ── Playback Actions ───────────────────────────────────────────

  play: async () => {
    const { mode } = get();
    try {
      await invoke(mode === "spotify" ? "spotify_play" : "local_play");
      set({ isPlaying: true });
    } catch (e) {
      console.error("Play error:", e);
    }
  },

  pause: async () => {
    const { mode } = get();
    try {
      await invoke(mode === "spotify" ? "spotify_pause" : "local_pause");
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
    const { mode } = get();
    try {
      await invoke(mode === "spotify" ? "spotify_next" : "local_next");
      set({ progressMs: 0 });
    } catch (e) {
      console.error("Next error:", e);
    }
  },

  previous: async () => {
    const { mode, progressMs } = get();
    try {
      if (progressMs > 3000) {
        await invoke(mode === "spotify" ? "spotify_seek" : "local_seek", { positionMs: 0 });
        set({ progressMs: 0 });
      } else {
        await invoke(mode === "spotify" ? "spotify_previous" : "local_previous");
        set({ progressMs: 0 });
      }
    } catch (e) {
      console.error("Previous error:", e);
    }
  },

  seek: async (positionMs: number) => {
    const { mode } = get();
    try {
      await invoke(mode === "spotify" ? "spotify_seek" : "local_seek", { positionMs });
      set({ progressMs: positionMs });
    } catch (e) {
      console.error("Seek error:", e);
    }
  },

  // ── Volume ─────────────────────────────────────────────────────

  setVolume: async (volume: number) => {
    const { mode } = get();
    const clampedVolume = Math.max(0, Math.min(100, volume));
    try {
      await invoke(mode === "spotify" ? "spotify_set_volume" : "local_set_volume", { volume: clampedVolume });
      set({ volume: clampedVolume });
    } catch (e) {
      console.error("Set volume error:", e);
    }
  },

  // ── Mode Toggles ──────────────────────────────────────────────

  toggleShuffle: async () => {
    const { mode, shuffle } = get();
    try {
      await invoke(mode === "spotify" ? "spotify_toggle_shuffle" : "local_toggle_shuffle", { state: !shuffle });
      set({ shuffle: !shuffle });
    } catch (e) {
      console.error("Toggle shuffle error:", e);
    }
  },

  cycleRepeat: async () => {
    const { mode, repeat } = get();
    const modes: RepeatMode[] = ["off", "all", "one"];
    const currentIndex = modes.indexOf(repeat);
    const nextIndex = (currentIndex + 1) % modes.length;
    const nextRepeat = modes[nextIndex];
    try {
      await invoke(mode === "spotify" ? "spotify_set_repeat" : "local_set_repeat", { state: nextRepeat });
      set({ repeat: nextRepeat });
    } catch (e) {
      console.error("Cycle repeat error:", e);
    }
  },

  toggleLike: async () => {
    const { mode, isLiked } = get();
    try {
      await invoke(mode === "spotify" ? "spotify_toggle_like" : "local_toggle_like", { state: !isLiked });
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

  setMode: (newMode: "spotify" | "local") => {
    set({ mode: newMode });
  },

  // ── Internal ──────────────────────────────────────────────────

  setProgress: (ms: number) => {
    set({ progressMs: ms });
  },

  setTrack: (track: Track) => {
    set({ currentTrack: track, progressMs: 0, isPlaying: false });
  },

  startPolling: () => {
    if (pollingInterval) return;
    pollingInterval = window.setInterval(async () => {
      const { mode } = get();
      try {
        if (mode === "spotify") {
          const state: any = await invoke("spotify_get_playback");
          if (state && state.item) {
            set({
              isPlaying: state.is_playing,
              progressMs: state.progress_ms,
              currentTrack: {
                id: state.item.id,
                title: state.item.name,
                artist: state.item.artists?.[0]?.name || "Unknown Artist",
                album: state.item.album?.name || "Unknown Album",
                albumArtUrl: state.item.album?.images?.[0]?.url || "",
                durationMs: state.item.duration_ms,
              },
            });
          }
        } else {
          const position: number = await invoke("local_get_position");
          set({ progressMs: position });
        }
      } catch (e) {
        // Suppress polling errors to avoid console spam when not connected
      }
    }, 1000);
  },

  // ── Spotify Auth ─────────────────────────────────────────────

  checkSpotifyAuth: async () => {
    try {
      const isAuth: boolean = await invoke("spotify_is_authenticated");
      set({ isAuthenticated: isAuth });
      if (isAuth) {
        get().startPolling();
      }
    } catch (e) {
      console.error("Check auth error:", e);
      set({ isAuthenticated: false });
    }
  },

  loginSpotify: async () => {
    try {
      const url: string = await invoke("spotify_auth_url");
      await open(url);
    } catch (e) {
      console.error("Login URL error:", e);
    }
  },

  submitSpotifyCode: async (urlOrCode: string) => {
    try {
      let code = urlOrCode.trim();
      if (code.includes("code=")) {
        try {
          const urlStr = code.startsWith("http") ? code : `http://localhost${code.startsWith("/") ? "" : "/"}${code}`;
          const url = new URL(urlStr);
          code = url.searchParams.get("code") || code;
        } catch (err) {
          // Fallback if URL parsing fails
          const match = code.match(/code=([^&]+)/);
          if (match) code = match[1];
        }
      }
      await invoke("spotify_callback", { code });
      set({ isAuthenticated: true });
      get().startPolling();
    } catch (e) {
      console.error("Callback error:", e);
      throw e;
    }
  },
}));
