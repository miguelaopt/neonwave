import { motion } from "framer-motion";
import { usePlayerStore } from "../stores/playerStore";
import { useDynamicColor } from "../hooks/useDynamicColor";

export default function AuraDisc() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const colors = useDynamicColor(currentTrack?.albumArtUrl);

  if (!currentTrack) return null;

  return (
    <div className="relative flex items-center justify-center">
      {/* Intense Ambient Glow */}
      <div
        className="absolute inset-0 rounded-full blur-[80px] opacity-70 -z-10"
        style={{
          background: `radial-gradient(circle, ${colors.primary} 0%, ${colors.secondary} 50%, transparent 70%)`,
        }}
      />

      <motion.div
        animate={
          isPlaying
            ? { rotate: 360 }
            : { rotate: 0 }
        }
        transition={
          isPlaying
            ? { duration: 10, repeat: Infinity, ease: "linear" }
            : { duration: 0.5, ease: "easeOut" }
        }
        className="relative"
      >
        {/* Outer glow ring */}
        <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-neon-purple/40 via-neon-pink/30 to-neon-purple/40 blur-sm" />

        {/* Image */}
        <motion.img
          src={currentTrack.albumArtUrl || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=2070&auto=format&fit=crop"}
          alt={`${currentTrack.album || 'Unknown'} album art`}
          draggable={false}
          className="relative w-80 h-80 rounded-full object-cover border border-white/10"
          style={{ boxShadow: `0 0 40px ${colors.glow}` }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />

        {/* Center Hole for Disc Look */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-background border border-white/20 shadow-inner z-10">
           <div className="absolute inset-2 rounded-full bg-black/40" />
        </div>
      </motion.div>
    </div>
  );
}
