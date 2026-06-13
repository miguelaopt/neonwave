import { useState, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePlayerStore } from "../stores/playerStore";
import { Search, Play, X } from "lucide-react";

export default function LeftSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchResults = usePlayerStore((s) => s.searchResults);
  const search = usePlayerStore((s) => s.search);
  const playTrack = usePlayerStore((s) => s.playTrack);
  const mode = usePlayerStore((s) => s.mode);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim() && mode === "spotify") {
      search(query);
    }
  };

  return (
    <>
      {/* Sidebar Toggle Button (if closed) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="absolute top-16 left-4 z-50 p-2 rounded-full glass-panel hover:bg-white/10 transition-colors"
        >
          <Search size={20} className="text-text-secondary" />
        </button>
      )}

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute top-11 bottom-[140px] left-0 w-80 z-40 flex flex-col glass-panel border-r border-white/5 shadow-2xl overflow-hidden backdrop-blur-xl bg-background/80"
          >
            <div className="p-4 flex items-center justify-between border-b border-white/5">
              <h2 className="text-lg font-semibold tracking-wide">Search</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full hover:bg-white/10 transition-colors"
              >
                <X size={20} className="text-text-secondary" />
              </button>
            </div>

            <div className="p-4 border-b border-white/5">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={mode === "spotify" ? "Search Spotify..." : "Spotify mode required"}
                  disabled={mode !== "spotify"}
                  className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm text-text-primary focus:outline-none focus:border-neon-purple transition-colors disabled:opacity-50"
                />
                <Search size={16} className="absolute left-3.5 top-2.5 text-text-secondary" />
              </form>
            </div>

            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {searchResults.length > 0 ? (
                <div className="flex flex-col gap-1">
                  {searchResults.map((track) => (
                    <div
                      key={track.id}
                      onClick={() => playTrack(`spotify:track:${track.id}`)}
                      className="group flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors"
                    >
                      <div className="relative w-12 h-12 rounded-md overflow-hidden flex-shrink-0 bg-white/5">
                        {track.albumArtUrl ? (
                          <img src={track.albumArtUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Search size={16} className="text-text-secondary/50" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Play size={16} className="text-white fill-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">{track.title}</p>
                        <p className="text-xs text-text-secondary truncate">{track.artist}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-text-secondary/50 text-sm">
                  {mode === "spotify" ? "No results" : "Switch to Spotify mode"}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
