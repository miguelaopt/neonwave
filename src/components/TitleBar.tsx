import { Minus, X } from "lucide-react";
import { motion } from "framer-motion";
import { getCurrentWindow } from "@tauri-apps/api/window";

export default function TitleBar() {
  const handleMinimize = async () => {
    try {
      const appWindow = getCurrentWindow();
      await appWindow.minimize();
    } catch (e) {
      console.warn("Window minimize not available:", e);
    }
  };

  const handleClose = async () => {
    try {
      const appWindow = getCurrentWindow();
      await appWindow.close();
    } catch (e) {
      console.warn("Window close not available:", e);
    }
  };

  const handleDrag = async (e: React.MouseEvent) => {
    // Only start dragging on double-click or mouse down on the drag area
    if ((e.target as HTMLElement).closest(".no-drag")) return;
    try {
      const appWindow = getCurrentWindow();
      await appWindow.startDragging();
    } catch (e) {
      console.warn("Window drag not available:", e);
    }
  };

  return (
    <div
      className="drag-region absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-5 h-11"
      onMouseDown={handleDrag}
    >
      {/* App title */}
      <div className="flex items-center gap-2.5 no-drag pointer-events-none">
        <div className="w-2.5 h-2.5 rounded-full bg-neon-purple shadow-[0_0_8px_rgba(176,38,255,0.6)]" />
        <span className="text-[11px] font-semibold tracking-[0.15em] uppercase text-text-secondary">
          NeonWave
        </span>
      </div>

      {/* Window controls */}
      <div className="flex items-center gap-1.5 no-drag">
        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleMinimize}
          className="w-8 h-8 flex items-center justify-center rounded-xl
                     text-text-secondary hover:text-text-primary
                     hover:bg-white/5 transition-colors duration-300"
          aria-label="Minimize"
        >
          <Minus size={14} strokeWidth={2} />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleClose}
          className="w-8 h-8 flex items-center justify-center rounded-xl
                     text-text-secondary hover:text-red-400
                     hover:bg-red-400/10 transition-colors duration-300"
          aria-label="Close"
        >
          <X size={14} strokeWidth={2} />
        </motion.button>
      </div>
    </div>
  );
}
