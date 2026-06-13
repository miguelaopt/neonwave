import { useEffect, useState } from "react";

interface DynamicColors {
  primary: string;
  secondary: string;
  glow: string;
}

const DEFAULT_COLORS: DynamicColors = {
  primary: "rgba(176, 38, 255, 0.4)",
  secondary: "rgba(255, 38, 212, 0.3)",
  glow: "rgba(176, 38, 255, 0.2)",
};

/**
 * Extracts a dominant color from an album art image URL.
 * Uses a canvas to sample pixels and derive a color palette.
 *
 * For now, returns themed defaults. When album art extraction is needed,
 * enable the canvas logic below.
 */
export function useDynamicColor(imageUrl: string | undefined): DynamicColors {
  const [colors, setColors] = useState<DynamicColors>(DEFAULT_COLORS);

  useEffect(() => {
    if (!imageUrl) {
      setColors(DEFAULT_COLORS);
      return;
    }

    // TODO: Extract dominant color from album art
    // For now, cycle through preset neon palettes based on URL hash
    const hash = imageUrl.split("").reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);

    const palettes: DynamicColors[] = [
      {
        primary: "rgba(176, 38, 255, 0.4)",
        secondary: "rgba(255, 38, 212, 0.3)",
        glow: "rgba(176, 38, 255, 0.2)",
      },
      {
        primary: "rgba(255, 38, 212, 0.4)",
        secondary: "rgba(176, 38, 255, 0.3)",
        glow: "rgba(255, 38, 212, 0.2)",
      },
      {
        primary: "rgba(38, 198, 255, 0.4)",
        secondary: "rgba(176, 38, 255, 0.3)",
        glow: "rgba(38, 198, 255, 0.2)",
      },
    ];

    const index = Math.abs(hash) % palettes.length;
    setColors(palettes[index]);
  }, [imageUrl]);

  return colors;
}
