import { motion } from "framer-motion";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Volume1,
  FolderOpen,
} from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { usePlayerStore } from "../stores/playerStore";

export default function PlayerControls() {
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const shuffle = usePlayerStore((s) => s.shuffle);
  const repeat = usePlayerStore((s) => s.repeat);
  const volume = usePlayerStore((s) => s.volume);
  const togglePlayPause = usePlayerStore((s) => s.togglePlayPause);
  const next = usePlayerStore((s) => s.next);
  const previous = usePlayerStore((s) => s.previous);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const cycleRepeat = usePlayerStore((s) => s.cycleRepeat);
  const setVolume = usePlayerStore((s) => s.setVolume);

  const handleOpenFile = async () => {
    try {
      const selectedPath = await open({
        multiple: false,
        directory: false,
        filters: [
          { name: "Audio", extensions: ["mp3", "wav", "flac", "ogg", "m4a"] },
        ],
      });
      
      if (selectedPath && typeof selectedPath === "string") {
        await invoke("local_open_file", { path: selectedPath });
        await invoke("local_play", { index: null });
        usePlayerStore.setState({ isPlaying: true, progressMs: 0 });
      }
    } catch (e) {
      console.error("Open file error:", e);
    }
  };

  const RepeatIcon = repeat === "one" ? Repeat1 : Repeat;
  const VolumeIcon = volume === 0 ? VolumeX : volume < 50 ? Volume1 : Volume2;

  return (
    <div className="flex items-center justify-between w-full gap-3">
      {/* Left: Open File + Shuffle */}
      <div className="flex items-center gap-1 flex-1 justify-start">
        <ControlButton onClick={handleOpenFile} label="Open File">
          <FolderOpen size={16} strokeWidth={2} />
        </ControlButton>
        <ControlButton
          onClick={toggleShuffle}
          active={shuffle}
          label="Shuffle"
        >
          <Shuffle size={16} strokeWidth={2} />
        </ControlButton>
      </div>

      {/* Center: Main controls */}
      <div className="flex items-center gap-3">
        <ControlButton onClick={previous} label="Previous">
          <SkipBack size={18} strokeWidth={2} className="fill-current" />
        </ControlButton>

        {/* Play/Pause — hero button */}
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={togglePlayPause}
          className="relative w-14 h-14 flex items-center justify-center rounded-full
                     bg-gradient-to-br from-neon-purple to-neon-pink
                     text-white shadow-[0_0_25px_rgba(176,38,255,0.5),0_0_50px_rgba(255,38,212,0.2)]
                     hover:shadow-[0_0_35px_rgba(176,38,255,0.6),0_0_70px_rgba(255,38,212,0.3)]
                     transition-shadow duration-300"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {/* Inner glow */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/20 to-transparent" />
          {isPlaying ? (
            <Pause size={22} strokeWidth={2.5} className="relative z-10 fill-current" />
          ) : (
            <Play size={22} strokeWidth={2.5} className="relative z-10 fill-current ml-0.5" />
          )}
        </motion.button>

        <ControlButton onClick={next} label="Next">
          <SkipForward size={18} strokeWidth={2} className="fill-current" />
        </ControlButton>
      </div>

      {/* Right: Repeat + Volume */}
      <div className="flex items-center gap-1 flex-1 justify-end">
        <ControlButton
          onClick={cycleRepeat}
          active={repeat !== "off"}
          label="Repeat"
        >
          <RepeatIcon size={16} strokeWidth={2} />
        </ControlButton>

        {/* Volume slider */}
        <div className="flex items-center gap-1.5 ml-1">
          <ControlButton
            onClick={() => setVolume(volume === 0 ? 75 : 0)}
            label="Mute"
          >
            <VolumeIcon size={16} strokeWidth={2} />
          </ControlButton>

          <div className="relative w-20 h-6 flex items-center group">
            <div className="absolute w-full h-1 rounded-full bg-white/10" />
            <div
              className="absolute h-1 rounded-full bg-gradient-to-r from-neon-purple to-neon-pink"
              style={{ width: \\%\ }}
            />
            <input
              type="range"
              min={0}
              max={100}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="absolute w-full h-full opacity-0 cursor-pointer"
              aria-label="Volume"
            />
            {/* Thumb indicator */}
            <div
              className="absolute w-3 h-3 rounded-full bg-white shadow-[0_0_8px_rgba(176,38,255,0.6)]
                         pointer-events-none transition-all duration-150
                         opacity-0 group-hover:opacity-100"
              style={{ left: \calc(\% - 6px)\ }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Small Control Button ──────────────────────────────────────────

function ControlButton({
  children,
  onClick,
  active = false,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  label: string;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className={\w-9 h-9 flex items-center justify-center rounded-xl
                  transition-all duration-300
                  \\}
      aria-label={label}
    >
      {children}
    </motion.button>
  );
}
