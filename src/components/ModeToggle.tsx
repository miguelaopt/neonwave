import { motion } from "framer-motion";
import { AudioLines } from "lucide-react";
import { usePlayerStore } from "../stores/playerStore";

export default function ModeToggle() {
  const visualizerEnabled = usePlayerStore((s) => s.visualizerEnabled);
  const toggleVisualizer = usePlayerStore((s) => s.toggleVisualizer);

  return (
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
      aria-label="Toggle visualizer"
    >
      <AudioLines size={16} strokeWidth={2} />
    </motion.button>
  );
}
