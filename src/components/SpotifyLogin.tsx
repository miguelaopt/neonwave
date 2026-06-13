import { useState } from "react";
import { motion } from "framer-motion";
import { usePlayerStore } from "../stores/playerStore";
import { Link } from "lucide-react"; // Or similar icons if needed

export default function SpotifyLogin() {
  const [inputUrl, setInputUrl] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loginSpotify = usePlayerStore((s) => s.loginSpotify);
  const submitSpotifyCode = usePlayerStore((s) => s.submitSpotifyCode);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl) return;

    setIsSubmitting(true);
    setError("");

    try {
      await submitSpotifyCode(inputUrl);
    } catch (err) {
      setError("Failed to connect. Please check the URL and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="absolute inset-0 z-20 flex items-center justify-center p-4 backdrop-blur-sm rounded-[32px] bg-background/40"
    >
      <div className="glass-panel w-full max-w-sm p-6 flex flex-col items-center gap-6 text-center border border-white/10 shadow-2xl">
        <div className="w-16 h-16 rounded-full bg-neon-purple/20 flex items-center justify-center border border-neon-purple/30 shadow-[0_0_20px_rgba(176,38,255,0.3)]">
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-8 h-8 text-[#1DB954]"
          >
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.6.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
          </svg>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white tracking-wide">
            Connect Spotify
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            Link your account to stream your favorite tracks, sync playlists,
            and control playback.
          </p>
        </div>

        <button
          onClick={loginSpotify}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#1DB954] to-[#1ed760] text-black font-semibold shadow-[0_0_15px_rgba(29,185,84,0.4)] hover:shadow-[0_0_25px_rgba(29,185,84,0.6)] transition-all active:scale-95"
        >
          Open Spotify Login
        </button>

        <form onSubmit={handleSubmit} className="w-full flex gap-2">
          <input
            type="text"
            placeholder="Paste redirect URL here"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-text-secondary outline-none focus:border-neon-purple/50 focus:bg-white/10 transition-colors"
          />
          <button
            type="submit"
            disabled={!inputUrl || isSubmitting}
            className="p-2 rounded-xl bg-white/10 border border-white/10 text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center"
            title="Submit URL"
          >
            <Link size={18} />
          </button>
        </form>
        {error && (
          <p className="text-xs text-red-400 mt-[-10px] w-full text-left">
            {error}
          </p>
        )}
      </div>
    </motion.div>
  );
}
