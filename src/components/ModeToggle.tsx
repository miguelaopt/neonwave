import { motion } from "framer-motion";
import { AudioLines, Mic2, Server, Cloud } from "lucide-react";
import { usePlayerStore } from "../stores/playerStore";

export default function ModeToggle() {
  const visualizerEnabled = usePlayerStore((s) => s.visualizerEnabled);
  const toggleVisualizer = usePlayerStore((s) => s.toggleVisualizer);
  
  const mode = usePlayerStore((s) => s.mode);
  const setMode = usePlayerStore((s) => s.setMode);
  
  const lyricsEnabled = usePlayerStore((s) => s.lyricsEnabled);
  const toggleLyrics = usePlayerStore((s) => s.toggleLyrics);

  return (
    <div className="flex gap-4 items-center">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setMode(mode === "spotify" ? "local" : "spotify")}
        className={`p-2 rounded-xl transition-all duration-300
                    ${
                      mode === "spotify"
                        ? "text-[#1DB954] drop-shadow-[0_0_8px_rgba(29,185,84,0.5)]"
                        : "text-neon-blue drop-shadow-[0_0_8px_rgba(0,240,255,0.5)]"
                    }`}
        title={`Switch to ${mode === "spotify" ? "Local" : "Spotify"} Mode`}
      >
        {mode === "spotify" ? <Cloud size={18} strokeWidth={2} /> : <Server size={18} strokeWidth={2} />}
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleVisualizer}
        className={`p-2 rounded-xl transition-all duration-300
                    ${
                      visualizerEnabled
                        ? "text-neon-purple drop-shadow-[0_0_8px_rgba(176,38,255,0.5)]"
                        : "text-text-muted hover:text-text-secondary"
                    }`}
        title="Toggle Visualizer"
      >
        <AudioLines size={18} strokeWidth={2} />
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleLyrics}
        className={`p-2 rounded-xl transition-all duration-300
                    ${
                      lyricsEnabled
                        ? "text-neon-pink drop-shadow-[0_0_8px_rgba(255,38,212,0.5)]"
                        : "text-text-muted hover:text-text-secondary"
                    }`}
        title="Toggle Lyrics"
      >
        <Mic2 size={18} strokeWidth={2} />
      </motion.button>
    </div>
  );
}
