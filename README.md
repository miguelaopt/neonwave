# 🎵 NeonWave

A premium desktop music player companion built with **Tauri v2**, **React**, and **Tailwind CSS v4**.

Features a stunning **glassmorphism neon** design with real-time audio visualization, Spotify integration, and local music playback.

![NeonWave](https://img.shields.io/badge/status-in%20development-B026FF?style=for-the-badge)
![Tauri](https://img.shields.io/badge/Tauri-v2-24C8D8?style=for-the-badge&logo=tauri)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)
![Rust](https://img.shields.io/badge/Rust-backend-E57324?style=for-the-badge&logo=rust)

## ✨ Features

- 🎧 **Spotify Integration** — Control Spotify playback, view current track, album art, and progress in real-time
- 📁 **Local Music Playback** — Play MP3/FLAC files with full metadata reading (title, artist, album art)
- 🎨 **Dynamic Colors** — Album art dominant color extraction for dynamic UI accents
- 📊 **Audio Visualizer** — Real-time FFT-based frequency bars with neon gradient effects (WASAPI loopback capture)
- 🪟 **Frameless Window** — Custom title bar with draggable region and neon-styled controls
- 💜 **Glassmorphism Design** — Translucent glass panels, squircle shapes, neon glows, and smooth animations

## 🎨 Design

- **Background**: Dark purple-black gradient (`#0A0014` → `#1A0B2E`)
- **Glass Panels**: `rgba(147, 51, 234, 0.12)` with `backdrop-blur(20px)`
- **Neon Accents**: Purple (`#B026FF`) and Pink (`#FF26D4`)
- **Font**: Inter (Google Fonts)
- **Animations**: Breathing album art, pulsing neon glows, smooth transitions (300-400ms)

## 📋 Prerequisites

Before building NeonWave, you need:

1. **Node.js** (v18+) — [Download](https://nodejs.org/)
2. **Rust** — [Install via rustup](https://www.rust-lang.org/tools/install)
3. **Microsoft C++ Build Tools** — [Download](https://visualstudio.microsoft.com/visual-cpp-build-tools/) (select "Desktop development with C++")
4. **WebView2** — Pre-installed on Windows 10/11

> ⚠️ After installing Rust, **restart your terminal** for PATH changes to take effect.

## 🚀 Getting Started

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/neonwave.git
cd neonwave

# Install frontend dependencies
npm install

# (Optional) Set up Spotify credentials
cp .env.example .env
# Edit .env with your Spotify Developer credentials

# Run in development mode
npm run tauri dev
```

## 🔑 Spotify Setup (Optional)

NeonWave works without Spotify in **Local mode**. To enable Spotify integration:

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Set the **Redirect URI** to `http://localhost:8888/callback`
4. Copy the **Client ID**
5. Create a `.env` file from the template:
   ```bash
   cp .env.example .env
   ```
6. Add your credentials:
   ```env
   SPOTIFY_CLIENT_ID=your_client_id_here
   SPOTIFY_REDIRECT_URI=http://localhost:8888/callback
   ```

> **Note**: Spotify playback control requires a **Spotify Premium** account.

## 🏗️ Project Structure

```
neonwave/
├── src/                          # Frontend (React + TypeScript)
│   ├── components/
│   │   ├── TitleBar.tsx          # Custom frameless title bar
│   │   ├── AlbumArt.tsx          # Album cover with glow effects
│   │   ├── TrackInfo.tsx         # Track title, artist, album
│   │   ├── PlayerControls.tsx    # Play/pause, skip, volume, shuffle
│   │   ├── ProgressBar.tsx       # Seekable progress bar with glow
│   │   ├── Visualizer.tsx        # Audio frequency bars
│   │   └── ModeToggle.tsx        # Visualizer toggle
│   ├── stores/
│   │   └── playerStore.ts        # Zustand state management
│   ├── hooks/
│   │   ├── useVisualizer.ts      # Audio visualization hook
│   │   └── useDynamicColor.ts    # Dynamic color extraction hook
│   ├── types.ts                  # Shared TypeScript types
│   ├── index.css                 # Design system (Tailwind v4)
│   ├── App.tsx                   # Main layout
│   └── main.tsx                  # Entry point
├── src-tauri/                    # Backend (Rust)
│   ├── src/
│   │   ├── lib.rs                # App entry, command registration
│   │   ├── spotify.rs            # Spotify API (rspotify, PKCE auth)
│   │   ├── local_player.rs       # Local playback (rodio + lofty)
│   │   ├── audio_capture.rs      # Audio capture (cpal WASAPI + FFT)
│   │   ├── color.rs              # Color extraction from album art
│   │   └── types.rs              # Shared Rust types
│   ├── Cargo.toml
│   └── tauri.conf.json
├── .env.example                  # Spotify credentials template
├── package.json
├── vite.config.ts
└── README.md
```

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Tauri v2 | Desktop app shell |
| **Frontend** | React 19 + TypeScript | UI components |
| **Styling** | Tailwind CSS v4 | Design system |
| **Animations** | Framer Motion | Smooth transitions |
| **Icons** | Lucide React | Minimalist icons |
| **State** | Zustand | State management |
| **Spotify** | rspotify (Rust) | Spotify Web API |
| **Playback** | rodio (Rust) | Local audio playback |
| **Metadata** | lofty (Rust) | MP3/FLAC tag reading |
| **Audio Capture** | cpal (Rust) | WASAPI loopback |
| **FFT** | rustfft (Rust) | Frequency analysis |
| **Colors** | image (Rust) | Dominant color extraction |

## 📝 Scripts

```bash
npm run dev          # Start Vite dev server (frontend only)
npm run build        # Build frontend for production
npm run tauri dev    # Run full Tauri app in development
npm run tauri build  # Build production desktop app
```

## 🗺️ Roadmap

- [x] Glassmorphism UI with neon design
- [x] Custom frameless window
- [x] Audio visualizer (demo mode)
- [x] Spotify integration (backend)
- [x] Local music playback (backend)
- [x] Dynamic color extraction
- [ ] Live audio capture visualization
- [ ] Synchronized lyrics (LRCLIB API)
- [ ] Playlist management
- [ ] Keyboard shortcuts
- [ ] System tray integration

## 📄 License

MIT License — feel free to use and modify.

---

<p align="center">
  Built with 💜 and lots of <code>backdrop-blur</code>
</p>
