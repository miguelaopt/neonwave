import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import TitleBar from "./components/TitleBar";
import AuraDisc from "./components/AuraDisc";
import TrackInfo from "./components/TrackInfo";
import PlayerControls from "./components/PlayerControls";
import ProgressBar from "./components/ProgressBar";
import Visualizer from "./components/Visualizer";
import ModeToggle from "./components/ModeToggle";
import LyricsOverlay from "./components/LyricsOverlay";
import SpotifyLogin from "./components/SpotifyLogin";
import LeftSidebar from "./components/LeftSidebar";
import { usePlayerStore } from "./stores/playerStore";
import { Music } from "lucide-react";

export default function App() {
  const visualizerEnabled = usePlayerStore((s) => s.visualizerEnabled);
  const lyricsEnabled = usePlayerStore((s) => s.lyricsEnabled);
  const startPolling = usePlayerStore((s) => s.startPolling);
  const checkSpotifyAuth = usePlayerStore((s) => s.checkSpotifyAuth);
  const mode = usePlayerStore((s) => s.mode);
  const isAuthenticated = usePlayerStore((s) => s.isAuthenticated);
  const currentTrack = usePlayerStore((s) => s.currentTrack);

  useEffect(() => {
    if (mode === "spotify") {
      checkSpotifyAuth();
    } else {
      startPolling();
    }
  }, [mode, checkSpotifyAuth, startPolling]);

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
        <LeftSidebar />

        {/* ─── Top: Modular Layout (Center Disc, Right Lyrics) ─────────────────────── */}
        <div className="flex-1 flex flex-row items-center justify-center px-8 gap-6 min-h-0 relative">
          
          {/* Center Column: AuraDisc & TrackInfo */}
          <div className="flex-1 flex flex-col items-center justify-center gap-8 z-10 relative">
            <div className="relative">
              {mode === "local" && currentTrack?.id === "1" ? (
                <div className="w-80 h-80 rounded-full bg-white/5 border border-white/10 flex flex-col items-center justify-center text-text-secondary gap-4 shadow-lg backdrop-blur-sm">
                  <Music size={48} className="opacity-50" />
                  <p className="text-sm font-medium tracking-wide">No track loaded</p>
                </div>
              ) : (
                <AuraDisc />
              )}
            </div>

            <div className="flex items-center gap-2 w-full max-w-sm justify-center">
              <TrackInfo />
            </div>

            <AnimatePresence>
              {mode === "spotify" && !isAuthenticated && <SpotifyLogin />}
            </AnimatePresence>
          </div>

          {/* Right Column: Lyrics (If enabled) */}
          <AnimatePresence>
            {lyricsEnabled && (
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                className="w-80 h-full py-6 pr-4 relative z-10"
              >
                <div className="w-full h-full glass-panel overflow-hidden border border-white/10 rounded-2xl relative">
                  <LyricsOverlay />
                </div>
              </motion.div>
            )}
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
