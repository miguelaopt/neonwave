// ─── Track & Album Types ───────────────────────────────────────────

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  albumArtUrl: string;
  durationMs: number;
}

// ─── Player State ──────────────────────────────────────────────────

export type RepeatMode = "off" | "all" | "one";

export interface PlayerState {
  currentTrack: Track;
  isPlaying: boolean;
  progressMs: number;
  volume: number; // 0 - 100

  shuffle: boolean;
  repeat: RepeatMode;

  isLiked: boolean;
  visualizerEnabled: boolean;
  lyricsEnabled: boolean;
  localTracks: Track[];
}

export interface PlayerActions {
  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;
  next: () => void;
  previous: () => void;
  seek: (positionMs: number) => void;
  setVolume: (volume: number) => void;

  toggleShuffle: () => void;
  cycleRepeat: () => void;
  toggleLike: () => void;
  toggleVisualizer: () => void;
  toggleLyrics: () => void;

  setProgress: (ms: number) => void;
  setTrack: (track: Track) => void;
  scanDirectory: (path: string) => Promise<void>;
  playLocalTrack: (index: number) => Promise<void>;
  startPolling: () => void;
}

export type PlayerStore = PlayerState & PlayerActions;

export interface VisualizerData {
  bars: number[]; // Normalized 0-1 amplitudes
  isActive: boolean;
}

export type WindowAction = "minimize" | "close";
