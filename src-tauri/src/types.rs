use serde::{Deserialize, Serialize};

/// Represents the current Spotify playback state.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlaybackState {
    pub track_name: String,
    pub artist_name: String,
    pub album_name: String,
    pub album_art_url: Option<String>,
    pub progress_ms: u64,
    pub duration_ms: u64,
    pub is_playing: bool,
    pub volume_percent: Option<u8>,
}

/// Metadata extracted from a local audio file.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrackMetadata {
    pub title: String,
    pub artist: String,
    pub album: String,
    pub duration_ms: u64,
    pub file_path: String,
    pub has_cover: bool,
}

/// Frequency-band data emitted to the frontend for the visualizer.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioData {
    pub bands: Vec<f32>,
    pub peak: f32,
    pub rms: f32,
}
