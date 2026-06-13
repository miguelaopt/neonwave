import { motion } from "framer-motion";
import { usePlayerStore } from "../stores/playerStore";
import { useVisualizer } from "../hooks/useVisualizer";
import { useMemo } from "react";

// Function to generate a smooth Catmull-Rom like cubic bezier path
function generateSmoothPath(points: { x: number; y: number }[]) {
  if (points.length === 0) return "";
  
  const start = points[0];
  let path = `M ${start.x},${start.y}`;
  
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? i : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 === points.length ? i + 1 : i + 2];
    
    // Smoothness factor (0.15 to 0.25 works well for fluid audio)
    const tension = 0.2; 
    
    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;
    
    path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  
  return path;
}

export default function Visualizer() {
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const enabled = usePlayerStore((s) => s.visualizerEnabled);
  const { bars } = useVisualizer(isPlaying, enabled);

  if (!enabled) return null;

  const width = 1000; // SVG viewBox width
  const height = 120; // SVG viewBox height

  // Calculate points for the fluid shape
  const points = useMemo(() => {
    const pts = [];
    const len = bars.length;
    for (let i = 0; i < len; i++) {
      // Add some baseline jitter or smooth padding if needed, but bars[i] is already smoothed by backend
      pts.push({
        x: (i / (len - 1)) * width,
        y: height - Math.max(0.02, bars[i]) * height * 0.9 // Scale amplitude
      });
    }
    return pts;
  }, [bars]);

  // Make it a closed filled shape at the bottom
  const pathData = useMemo(() => {
    const curve = generateSmoothPath(points);
    return `${curve} L ${width},${height} L 0,${height} Z`;
  }, [points]);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full flex items-end justify-center h-24 overflow-visible relative pointer-events-none mt-2"
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="absolute bottom-0 left-0 w-full h-full opacity-80"
        style={{
           filter: "drop-shadow(0 0 12px rgba(176, 38, 255, 0.5))"
        }}
      >
        <defs>
          <linearGradient id="liquidGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#b026ff" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#ff26d4" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#00f3ff" stopOpacity="0.8" />
          </linearGradient>
        </defs>
        <motion.path
          d={pathData}
          fill="url(#liquidGrad)"
          initial={false}
          animate={{ d: pathData }}
          transition={{ duration: 0.08, ease: "linear" }}
        />
      </svg>
    </motion.div>
  );
}
