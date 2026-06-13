import { motion } from "framer-motion";
import { usePlayerStore } from "../stores/playerStore";
import { useVisualizer } from "../hooks/useVisualizer";

export default function Visualizer() {
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const enabled = usePlayerStore((s) => s.visualizerEnabled);
  const { bars } = useVisualizer(isPlaying, enabled);

  if (!enabled) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full flex items-end justify-center gap-[2px] h-16 px-4"
    >
      {bars.map((amplitude, i) => {
        // Gradient position based on bar index
        const gradientPos = i / bars.length;
        const r = Math.round(176 + (255 - 176) * gradientPos);
        const g = Math.round(38 + (38 - 38) * gradientPos);
        const b = Math.round(255 + (212 - 255) * gradientPos);

        return (
          <motion.div
            key={i}
            className="rounded-t-sm flex-1 max-w-[6px]"
            style={{
              background: `linear-gradient(to top, rgba(${r},${g},${b},0.9), rgba(${r},${g},${b},0.4))`,
              boxShadow: `0 0 ${4 + amplitude * 6}px rgba(${r},${g},${b},${0.3 + amplitude * 0.3})`,
              height: `${Math.max(3, amplitude * 100)}%`,
            }}
            animate={{
              height: `${Math.max(3, amplitude * 100)}%`,
            }}
            transition={{
              duration: 0.08,
              ease: "easeOut",
            }}
          />
        );
      })}
    </motion.div>
  );
}
