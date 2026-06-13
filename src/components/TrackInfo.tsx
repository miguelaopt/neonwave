import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { usePlayerStore } from "../stores/playerStore";

export default function TrackInfo() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isLiked = usePlayerStore((s) => s.isLiked);
  const toggleLike = usePlayerStore((s) => s.toggleLike);

  if (!currentTrack) {
    return (
      <div className="flex flex-col items-center gap-1">
        <span className="text-sm text-text-muted">No track playing</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 min-w-0">
      <div className="flex flex-col min-w-0">
        <motion.h2
          key={currentTrack.title}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="text-lg font-bold text-text-primary truncate leading-tight"
        >
          {currentTrack.title}
        </motion.h2>

        <motion.p
          key={currentTrack.artist}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: 0.05 }}
          className="text-sm font-medium text-text-secondary truncate leading-tight mt-0.5"
        >
          {currentTrack.artist}
        </motion.p>

        <motion.p
          key={currentTrack.album}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
          className="text-xs text-text-muted truncate mt-0.5"
        >
          {currentTrack.album}
        </motion.p>
      </div>

      {/* Like button */}
      <motion.button
        whileHover={{ scale: 1.2 }}
        whileTap={{ scale: 0.85 }}
        onClick={toggleLike}
        className="flex-shrink-0 p-2 rounded-full transition-colors duration-300"
        aria-label={isLiked ? "Unlike" : "Like"}
      >
        <Heart
          size={18}
          strokeWidth={2}
          className={`transition-all duration-300 ${
            isLiked
              ? "fill-neon-pink text-neon-pink drop-shadow-[0_0_8px_rgba(255,38,212,0.6)]"
              : "text-text-secondary hover:text-text-primary"
          }`}
        />
      </motion.button>
    </div>
  );
}
