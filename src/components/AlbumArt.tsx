import { motion } from "framer-motion";
import { usePlayerStore } from "../stores/playerStore";

export default function AlbumArt() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  if (!currentTrack) return null;

  return (
    <div className="relative flex items-center justify-center">
      {/* Ambient glow behind album art */}
      <div
        className="absolute inset-0 rounded-[32px] blur-[60px] opacity-50 -z-10"
        style={{
          background: `radial-gradient(circle, rgba(176, 38, 255, 0.4) 0%, rgba(255, 38, 212, 0.2) 50%, transparent 70%)`,
        }}
      />

      {/* Album art container */}
      <motion.div
        animate={{
          scale: isPlaying ? [1, 1.02, 1] : 1,
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative"
      >
        {/* Outer glow ring */}
        <div className="absolute -inset-1 rounded-[32px] bg-gradient-to-br from-neon-purple/30 via-neon-pink/20 to-neon-purple/30 blur-sm" />

        {/* Image */}
        <motion.img
          src={currentTrack.albumArtUrl}
          alt={`${currentTrack.album} album art`}
          draggable={false}
          className="relative w-72 h-72 rounded-[28px] object-cover album-glow-ring"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />

        {/* Reflection overlay */}
        <div className="absolute inset-0 rounded-[28px] bg-gradient-to-b from-white/[0.08] via-transparent to-transparent pointer-events-none" />

        {/* Playing indicator ring */}
        {isPlaying && (
          <motion.div
            className="absolute -inset-2 rounded-[34px] border border-neon-purple/20"
            animate={{
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.01, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}
      </motion.div>
    </div>
  );
}
