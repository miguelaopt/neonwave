import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import TitleBar from "./components/TitleBar";
import AlbumArt from "./components/AlbumArt";
import TrackInfo from "./components/TrackInfo";
import PlayerControls from "./components/PlayerControls";
import ProgressBar from "./components/ProgressBar";
import Visualizer from "./components/Visualizer";
import ModeToggle from "./components/ModeToggle";
import LyricsOverlay from "./components/LyricsOverlay";
import { usePlayerStore } from "./stores/playerStore";

export default function App() {
  const visualizerEnabled = usePlayerStore((s) => s.visualizerEnabled);
  const lyricsEnabled = usePlayerStore((s) => s.lyricsEnabled);
  const startPolling = usePlayerStore((s) => s.startPolling);

  useEffect(() => {
    startPolling();
  }, [startPolling]);

  return (
    <div className="w-full h-full bg-neonwave-radial text-text-primary font-sans relative overflow-hidden">
      {/* Title bar */}
      <TitleBar />

      {/* Ambient background orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-neon-purple/[0.04] blur-[100px]" />
        <div className="absolute -bottom-48 -right-32 w-[500px] h-[500px] rounded-full bg-neon-pink/[0.03] blur-[120px]" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full bg-neon-blue/[0.02] blur-[80px]" />
      </div>

      {/* Main content */}
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 flex flex-col h-full pt-11"
      >
        {/* ─── Top: Album Art + Track Info ─────────────────────── */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 gap-6 min-h-0 relative">
          <AlbumArt />

          <div className="flex items-center gap-2 w-full max-w-sm justify-center">
            <TrackInfo />
          </div>

          <AnimatePresence>
            {lyricsEnabled && <LyricsOverlay />}
          </AnimatePresence>
        </div>

        {/* ─── Bottom: Controls Panel ─────────────────────────── */}
        <div className="flex-shrink-0 px-6 pb-3 z-50 bg-background/50 backdrop-blur-md border-t border-white/5 relative">
          <div className="glass-panel px-6 py-5 flex flex-col gap-4 mt-2">
            {/* Progress */}
            <ProgressBar />

            {/* Controls */}
            <PlayerControls />
          </div>

          {/* Visualizer + Toggle */}
          <AnimatePresence>
            {visualizerEnabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="mt-2"
              >
                <Visualizer />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mode toggle row */}
          <div className="flex justify-center mt-2 mb-1">
            <ModeToggle />
          </div>
        </div>
      </motion.main>
    </div>
  );
}
