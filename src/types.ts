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
  // Current track
  currentTrack: Track | null;
  isPlaying: boolean;
  progressMs: number;
  volume: number; // 0 - 100

  // Queue
  shuffle: boolean;
  repeat: RepeatMode;

  // UI
  isLiked: boolean;
  visualizerEnabled: boolean;
}

export interface PlayerActions {
  // Playback
  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;
  next: () => void;
  previous: () => void;
  seek: (positionMs: number) => void;

  // Volume
  setVolume: (volume: number) => void;

  // Modes
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  toggleLike: () => void;
  toggleVisualizer: () => void;

  // Internal
  setProgress: (ms: number) => void;
  setTrack: (track: Track) => void;
}

export type PlayerStore = PlayerState & PlayerActions;

// ─── Visualizer ────────────────────────────────────────────────────

export interface VisualizerData {
  bars: number[]; // Normalized 0-1 amplitudes
  isActive: boolean;
}

// ─── Window Controls ───────────────────────────────────────────────

export type WindowAction = "minimize" | "close";
