import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ListMusic, ChevronLeft, ChevronRight, FolderPlus, Play, Music } from "lucide-react";
import { usePlayerStore } from "../stores/playerStore";
import { open } from "@tauri-apps/plugin-dialog";

export default function LeftSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const localTracks = usePlayerStore((s) => s.localTracks);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const scanDirectory = usePlayerStore((s) => s.scanDirectory);
  const playLocalTrack = usePlayerStore((s) => s.playLocalTrack);

  const handleAddFolder = async () => {
    try {
      const selectedPath = await open({
        directory: true,
        multiple: false,
      });
      if (selectedPath && typeof selectedPath === 'string') {
        await scanDirectory(selectedPath);
      }
    } catch (e) {
      console.error("Failed to open dialog:", e);
    }
  };

  return (
    <div className="absolute left-0 top-11 bottom-0 z-40 flex">
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="h-full glass-panel border-r border-white/10 overflow-hidden flex flex-col"
          >
            <div className="p-4 flex items-center justify-between border-b border-white/5 shrink-0">
              <h2 className="text-lg font-semibold tracking-wide flex items-center gap-2">
                <ListMusic size={20} className="text-neon-pink" />
                Local Library
              </h2>
            </div>
            
            <div className="p-4 shrink-0">
              <button
                onClick={handleAddFolder}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-sm font-medium"
              >
                <FolderPlus size={16} />
                Add Folder
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar pb-4">
              {localTracks.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-text-secondary p-6 text-center gap-3">
                  <ListMusic size={32} className="opacity-50" />
                  <p className="text-sm">No tracks found. Add a folder to start listening.</p>
                </div>
              ) : (
                <ul className="flex flex-col">
                  {localTracks.map((track, index) => {
                    const isActive = currentTrack?.id === track.id;
                    return (
                      <li key={index} className="px-2">
                        <button
                          onClick={() => playLocalTrack(index)}
                          className={\w-full flex items-center gap-3 p-2 rounded-lg transition-all group \\}
                        >
                          <div className="relative w-10 h-10 rounded bg-white/5 shrink-0 overflow-hidden">
                            {track.albumArtUrl ? (
                              <img src={track.albumArtUrl} alt="Cover" className="w-full h-full object-cover" />
                            ) : (
                              <Music size={20} className="absolute inset-0 m-auto opacity-30" />
                            )}
                            <div className={\bsolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity \\}>
                              <Play size={16} className={isActive ? "text-neon-pink" : "text-white"} fill={isActive ? "currentColor" : "none"} />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <p className={\	ext-sm font-medium truncate \\}>
                              {track.title}
                            </p>
                            <p className="text-xs text-text-secondary truncate">{track.artist}</p>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-16 w-6 glass-panel rounded-r-xl flex items-center justify-center border border-white/10 border-l-0 mt-6 hover:bg-white/10 transition-colors"
      >
        {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>
    </div>
  );
}
