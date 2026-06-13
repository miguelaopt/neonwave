import json
import re

# Update types.ts
with open('src/types.ts', 'r') as f:
    content = f.read()

# remove mode, isAuthenticated, searchResults from PlayerState
content = re.sub(r'\s*mode: "spotify" \| "local";', '', content)
content = re.sub(r'\s*isAuthenticated: boolean;', '', content)
content = re.sub(r'\s*searchResults: Track\[\];', '', content)

# add localTracks to PlayerState
content = re.sub(r'(\s*lyricsEnabled: boolean;)', r'\1\n  localTracks: Track[];', content)

# remove Spotify Auth, Search, setMode from PlayerActions
content = re.sub(r'\s*setMode: \(mode: "spotify" \| "local"\) => void;', '', content)
content = re.sub(r'\s*// Spotify Auth[\s\S]*?(?=// Internal|$)', '', content)
content = re.sub(r'\s*// Search[\s\S]*?(?=})', '', content)

# add scanDirectory and playLocalTrack to PlayerActions
content = re.sub(r'(\s*setTrack: \(track: Track\) => void;)', r'\1\n  scanDirectory: (path: string) => Promise<void>;\n  playLocalTrack: (index: number) => Promise<void>;', content)

with open('src/types.ts', 'w') as f:
    f.write(content)

# Update playerStore.ts
with open('src/stores/playerStore.ts', 'r') as f:
    content = f.read()

content = re.sub(r'\s*mode: "spotify",', '', content)
content = re.sub(r'\s*isAuthenticated: false,', '', content)
content = re.sub(r'\s*searchResults: \[\],', '\n  localTracks: [],', content)

# remove const { mode } = get(); and ternary operators
content = re.sub(r'\s*const \{ mode \} = get\(\);', '', content)
content = re.sub(r'mode === "spotify" \? "spotify_play" : "local_play"', '"local_play"', content)
content = re.sub(r'mode === "spotify" \? "spotify_pause" : "local_pause"', '"local_pause"', content)
content = re.sub(r'mode === "spotify" \? "spotify_next" : "local_next"', '"local_next"', content)
content = re.sub(r'mode === "spotify" \? "spotify_previous" : "local_previous"', '"local_previous"', content)
content = re.sub(r'mode === "spotify" \? "spotify_seek" : "local_seek"', '"local_seek"', content)
content = re.sub(r'mode === "spotify" \? "spotify_set_volume" : "local_set_volume"', '"local_set_volume"', content)
content = re.sub(r'mode === "spotify" \? "spotify_toggle_shuffle" : "local_toggle_shuffle"', '"local_toggle_shuffle"', content)
content = re.sub(r'mode === "spotify" \? "spotify_set_repeat" : "local_set_repeat"', '"local_set_repeat"', content)
content = re.sub(r'mode === "spotify" \? "spotify_toggle_like" : "local_toggle_like"', '"local_toggle_like"', content)

# remove setMode, Spotify Auth, search, playTrack
content = re.sub(r'\s*setMode:.*?\},\n', '', content, flags=re.DOTALL)
content = re.sub(r'\s*// ── Spotify Auth.*?\n', '', content)
content = re.sub(r'\s*checkSpotifyAuth:.*?(?=//|})', '', content, flags=re.DOTALL)

# Add scanDirectory and playLocalTrack
addition = '''
  scanDirectory: async (path: string) => {
    try {
      const tracks = await invoke<Track[]>("scan_directory", { path });
      set({ localTracks: tracks });
    } catch (e) {
      console.error("Scan directory error:", e);
    }
  },

  playLocalTrack: async (index: number) => {
    try {
      await invoke("local_play", { index });
      const track = get().localTracks[index];
      if (track) {
        set({ currentTrack: track, isPlaying: true });
      }
    } catch (e) {
      console.error("Play local track error:", e);
    }
  },
'''
content = content.replace('// ── Internal ──────────────────────────────────────────────────', addition + '\n  // ── Internal ──────────────────────────────────────────────────')

# fix polling
content = re.sub(r'const \{ mode \} = get\(\);\n.*?try \{\n.*?if \(mode === "spotify"\) \{[\s\S]*?\} else \{', 'try {\n', content)

with open('src/stores/playerStore.ts', 'w') as f:
    f.write(content)
