use serde::{Deserialize, Serialize};

/// Metadata extracted from a local audio file, matched to frontend Track type.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TrackMetadata {
    pub id: String,
    pub title: String,
    pub artist: String,
    pub album: String,
    pub album_art_url: String, // base64 encoded data URI
    pub duration_ms: u64,
}

/// Frequency-band data emitted to the frontend for the visualizer.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioData {
    pub bands: Vec<f32>,
    pub peak: f32,
    pub rms: f32,
}
