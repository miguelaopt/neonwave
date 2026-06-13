//! Local audio player powered by rodio, with metadata reading via lofty.

use crate::types::TrackMetadata;
use lofty::prelude::*;
use parking_lot::Mutex;
use rodio::{Decoder, OutputStream, OutputStreamHandle, Sink};
use std::fs::File;
use std::io::BufReader;
use std::path::Path;
use std::sync::LazyLock;
use std::time::Instant;

// ── Send/Sync wrapper ───────────────────────────────────────────────────────
//
// `OutputStream` (and its inner `cpal::Stream`) are `!Send` because cpal uses
// a platform marker.  We need them in a static `Mutex`.  This is safe because
// we never move them across threads without holding the lock.

struct PlayerInner {
    /// rodio `Sink` that drives playback.
    sink: Option<Sink>,
    /// Keep the stream alive for the lifetime of the player.
    _stream: Option<OutputStream>,
    _stream_handle: Option<OutputStreamHandle>,
    /// Path of the currently-loaded file.
    current_file: Option<String>,
    /// Instant when playback last (re)started – used for position tracking.
    play_start: Option<Instant>,
    /// Accumulated position (ms) before the last resume.
    accumulated_ms: u64,
    /// Whether the sink is paused.
    paused: bool,
}

// SAFETY: We only access `PlayerInner` behind a `Mutex` and never move it
// across threads outside the lock.
unsafe impl Send for PlayerInner {}
unsafe impl Sync for PlayerInner {}

static PLAYER: LazyLock<Mutex<PlayerInner>> = LazyLock::new(|| {
    Mutex::new(PlayerInner {
        sink: None,
        _stream: None,
        _stream_handle: None,
        current_file: None,
        play_start: None,
        accumulated_ms: 0,
        paused: false,
    })
});

// ── Helpers ─────────────────────────────────────────────────────────────────

fn read_metadata(path: &str) -> Result<TrackMetadata, String> {
    let tagged_file = lofty::read_from_path(path)
        .map_err(|e| format!("Failed to read tags from {path}: {e}"))?;

    let tag = tagged_file.primary_tag().or_else(|| tagged_file.first_tag());

    let properties = tagged_file.properties();
    let duration_ms = properties.duration().as_millis() as u64;

    let (title, artist, album) = if let Some(tag) = tag {
        (
            tag.title().map(|s| s.to_string()).unwrap_or_default(),
            tag.artist().map(|s| s.to_string()).unwrap_or_default(),
            tag.album().map(|s| s.to_string()).unwrap_or_default(),
        )
    } else {
        (String::new(), String::new(), String::new())
    };

    let title = if title.is_empty() {
        Path::new(path)
            .file_stem()
            .map(|s| s.to_string_lossy().to_string())
            .unwrap_or_else(|| "Unknown".into())
    } else {
        title
    };

    let has_cover = tag
        .map(|t| !t.pictures().is_empty())
        .unwrap_or(false);

    Ok(TrackMetadata {
        title,
        artist: if artist.is_empty() {
            "Unknown Artist".into()
        } else {
            artist
        },
        album: if album.is_empty() {
            "Unknown Album".into()
        } else {
            album
        },
        duration_ms,
        file_path: path.to_string(),
        has_cover,
    })
}

fn ensure_output() -> Result<(OutputStream, OutputStreamHandle), String> {
    OutputStream::try_default().map_err(|e| format!("Audio output error: {e}"))
}

// ── Tauri commands ──────────────────────────────────────────────────────────

/// Open a local audio file, read its metadata, and load it into the player.
/// Playback starts immediately.
#[tauri::command]
pub fn local_open_file(path: String) -> Result<TrackMetadata, String> {
    let meta = read_metadata(&path)?;

    let (stream, stream_handle) = ensure_output()?;
    let sink = Sink::try_new(&stream_handle).map_err(|e| format!("Sink error: {e}"))?;

    let file =
        File::open(&path).map_err(|e| format!("Cannot open file \"{path}\": {e}"))?;
    let reader = BufReader::new(file);
    let source =
        Decoder::new(reader).map_err(|e| format!("Decode error for \"{path}\": {e}"))?;

    sink.append(source);

    let mut player = PLAYER.lock();
    // Drop old sink / stream.
    player.sink = Some(sink);
    player._stream = Some(stream);
    player._stream_handle = Some(stream_handle);
    player.current_file = Some(path);
    player.play_start = Some(Instant::now());
    player.accumulated_ms = 0;
    player.paused = false;

    Ok(meta)
}

/// Resume (unpause) playback.
#[tauri::command]
pub fn local_play() -> Result<(), String> {
    let mut player = PLAYER.lock();
    if let Some(ref sink) = player.sink {
        sink.play();
        player.play_start = Some(Instant::now());
        player.paused = false;
        Ok(())
    } else {
        Err("No file loaded".into())
    }
}

/// Pause playback.
#[tauri::command]
pub fn local_pause() -> Result<(), String> {
    let mut player = PLAYER.lock();
    if let Some(ref sink) = player.sink {
        sink.pause();
        // Accumulate elapsed time.
        if let Some(start) = player.play_start.take() {
            player.accumulated_ms += start.elapsed().as_millis() as u64;
        }
        player.paused = true;
        Ok(())
    } else {
        Err("No file loaded".into())
    }
}

/// Stop playback and release the audio resources.
#[tauri::command]
pub fn local_stop() -> Result<(), String> {
    let mut player = PLAYER.lock();
    if let Some(sink) = player.sink.take() {
        sink.stop();
    }
    player._stream = None;
    player._stream_handle = None;
    player.current_file = None;
    player.play_start = None;
    player.accumulated_ms = 0;
    player.paused = false;
    Ok(())
}

/// Seek to `position_ms` in the current track.
/// rodio does not support native seeking on all decoders, so we reload and
/// skip forward – acceptable for an MVP.
#[tauri::command]
pub fn local_seek(position_ms: u64) -> Result<(), String> {
    let mut player = PLAYER.lock();
    let path = player
        .current_file
        .clone()
        .ok_or("No file loaded")?;

    // Rebuild sink with the same stream.
    let (stream, stream_handle) = ensure_output()?;
    let sink = Sink::try_new(&stream_handle).map_err(|e| format!("Sink error: {e}"))?;

    let file =
        File::open(&path).map_err(|e| format!("Cannot open file \"{path}\": {e}"))?;
    let reader = BufReader::new(file);
    let source =
        Decoder::new(reader).map_err(|e| format!("Decode error: {e}"))?;

    sink.append(source);

    // Try to seek using rodio's try_seek (available on some decoders).
    let seek_duration = std::time::Duration::from_millis(position_ms);
    let _ = sink.try_seek(seek_duration); // best-effort

    if player.paused {
        sink.pause();
    }

    player.sink = Some(sink);
    player._stream = Some(stream);
    player._stream_handle = Some(stream_handle);
    player.play_start = if player.paused {
        None
    } else {
        Some(Instant::now())
    };
    player.accumulated_ms = position_ms;

    Ok(())
}

/// Get the current playback position in milliseconds.
#[tauri::command]
pub fn local_get_position() -> u64 {
    let player = PLAYER.lock();
    let base = player.accumulated_ms;
    if player.paused || player.play_start.is_none() {
        base
    } else if let Some(start) = player.play_start {
        base + start.elapsed().as_millis() as u64
    } else {
        base
    }
}

/// Set playback volume (0.0 – 1.0).
#[tauri::command]
pub fn local_set_volume(volume: f32) -> Result<(), String> {
    let player = PLAYER.lock();
    if let Some(ref sink) = player.sink {
        sink.set_volume(volume.clamp(0.0, 1.0));
        Ok(())
    } else {
        Err("No file loaded".into())
    }
}

/// Read metadata from a file without loading it into the player.
#[tauri::command]
pub fn local_get_metadata(path: String) -> Result<TrackMetadata, String> {
    read_metadata(&path)
}

/// Scan a folder for audio files and return metadata for each.
/// Supported extensions: mp3, flac, ogg, wav, m4a, aac, wma.
#[tauri::command]
pub fn local_pick_folder(path: String) -> Result<Vec<TrackMetadata>, String> {
    let dir = Path::new(&path);
    if !dir.is_dir() {
        return Err(format!("{path} is not a directory"));
    }

    let exts = ["mp3", "flac", "ogg", "wav", "m4a", "aac", "wma"];
    let mut tracks = Vec::new();

    let entries = std::fs::read_dir(dir).map_err(|e| format!("Cannot read directory: {e}"))?;
    for entry in entries.flatten() {
        let p = entry.path();
        if p.is_file() {
            if let Some(ext) = p.extension().and_then(|e| e.to_str()) {
                if exts.contains(&ext.to_lowercase().as_str()) {
                    if let Ok(meta) = read_metadata(&p.to_string_lossy()) {
                        tracks.push(meta);
                    }
                }
            }
        }
    }

    tracks.sort_by(|a, b| a.title.to_lowercase().cmp(&b.title.to_lowercase()));
    Ok(tracks)
}
