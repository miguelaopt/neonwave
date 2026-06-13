import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { usePlayerStore } from "../stores/playerStore";

interface LyricLine {
  timeMs: number;
  text: string;
}

function parseLrc(lrc: string): LyricLine[] {
  const lines = lrc.split("\n");
  const result: LyricLine[] = [];
  const regex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;

  for (const line of lines) {
    const match = regex.exec(line);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const msStr = match[3];
      const milliseconds = parseInt(msStr.padEnd(3, "0"), 10);
      const text = match[4].trim();

      if (text) {
        result.push({
          timeMs: minutes * 60000 + seconds * 1000 + milliseconds,
          text,
        });
      }
    }
  }
  return result;
}

export default function LyricsOverlay() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const progressMs = usePlayerStore((s) => s.progressMs);
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentTrack) return;

    let isMounted = true;
    const fetchLyrics = async () => {
      setLoading(true);
      setError(false);
      setLyrics([]);
      try {
        const url = new URL("https://lrclib.net/api/get");
        url.searchParams.append("track_name", currentTrack.title);
        url.searchParams.append("artist_name", currentTrack.artist);
        url.searchParams.append("album_name", currentTrack.album);
        url.searchParams.append("duration", Math.round(currentTrack.durationMs / 1000).toString());

        const res = await fetch(url.toString());
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        
        if (isMounted && data.syncedLyrics) {
          setLyrics(parseLrc(data.syncedLyrics));
        } else if (isMounted) {
          setError(true);
        }
      } catch (e) {
        if (isMounted) setError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchLyrics();
    return () => { isMounted = false; };
  }, [currentTrack]);

  // Find active line index
  let activeIndex = -1;
  for (let i = 0; i < lyrics.length; i++) {
    if (progressMs >= lyrics[i].timeMs) {
      activeIndex = i;
    } else {
      break;
    }
  }

  // Scroll to active line
  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [activeIndex]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="absolute inset-0 z-50 p-6 flex flex-col bg-black/60 backdrop-blur-xl"
    >
      <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth" ref={containerRef}>
        <div className="py-[40vh] flex flex-col items-center gap-6 text-center">
          {loading && (
            <div className="text-neon-purple animate-pulse">Loading lyrics...</div>
          )}
          {error && !loading && (
            <div className="text-text-muted">Lyrics not available</div>
          )}
          {!loading && !error && lyrics.length === 0 && (
            <div className="text-text-muted">No lyrics found</div>
          )}
          {lyrics.map((line, index) => {
            const isActive = index === activeIndex;
            const isPassed = index < activeIndex;

            return (
              <div
                key={index}
                ref={isActive ? activeLineRef : null}
                className={`transition-all duration-300 max-w-2xl text-2xl font-bold tracking-wide cursor-default
                  ${isActive
                    ? "text-white scale-110 drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]"
                    : isPassed
                    ? "text-white/50 scale-100"
                    : "text-white/30 scale-95"
                  }
                `}
              >
                {line.text}
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
