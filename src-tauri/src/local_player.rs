use crate::types::TrackMetadata;
use lofty::prelude::*;
use parking_lot::Mutex;
use rodio::{Decoder, OutputStream, OutputStreamHandle, Sink};
use std::fs::File;
use std::io::BufReader;
use std::path::Path;
use std::sync::LazyLock;
use std::time::Instant;
use base64::prelude::*;

struct PlayerInner {
    sink: Option<Sink>,
    _stream: Option<OutputStream>,
    _stream_handle: Option<OutputStreamHandle>,
    current_file: Option<String>,
    play_start: Option<Instant>,
    accumulated_ms: u64,
    paused: bool,
}

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

static LOCAL_PLAYLIST: LazyLock<Mutex<Vec<TrackMetadata>>> = LazyLock::new(|| Mutex::new(Vec::new()));
static CURRENT_INDEX: LazyLock<Mutex<Option<usize>>> = LazyLock::new(|| Mutex::new(None));

fn ensure_output() -> Result<(OutputStream, OutputStreamHandle), String> {
    OutputStream::try_default().map_err(|e| format!("Audio output error: {e}"))
}

fn read_metadata(path: &str, id: &str) -> Result<TrackMetadata, String> {
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

    let mut album_art_url = String::new();
    if let Some(tag) = tag {
        if let Some(pic) = tag.pictures().first() {
            let b64 = BASE64_STANDARD.encode(pic.data());
            let mime_type = pic.mime_type().map(|m| m.as_str()).unwrap_or("image/jpeg");
            album_art_url = format!("data:{};base64,{}", mime_type, b64);
        }
    }

    Ok(TrackMetadata {
        id: id.to_string(),
        title,
        artist: if artist.is_empty() { "Unknown Artist".into() } else { artist },
        album: if album.is_empty() { "Unknown Album".into() } else { album },
        duration_ms,
        album_art_url,
    })
}

fn internal_play_file(path: &str) -> Result<(), String> {
    let (stream, stream_handle) = ensure_output()?;
    let sink = Sink::try_new(&stream_handle).map_err(|e| format!("Sink error: {e}"))?;

    let file = File::open(path).map_err(|e| format!("Cannot open file \"{path}\": {e}"))?;
    let reader = BufReader::new(file);
    let source = Decoder::new(reader).map_err(|e| format!("Decode error for \"{path}\": {e}"))?;

    sink.append(source);
    sink.play();

    let mut player = PLAYER.lock();
    player.sink = Some(sink);
    player._stream = Some(stream);
    player._stream_handle = Some(stream_handle);
    player.current_file = Some(path.to_string());
    player.play_start = Some(Instant::now());
    player.accumulated_ms = 0;
    player.paused = false;

    Ok(())
}

#[tauri::command]
pub fn scan_directory(path: String) -> Result<Vec<TrackMetadata>, String> {
    let dir = Path::new(&path);
    if !dir.is_dir() {
        return Err(format!("{path} is not a directory"));
    }

    let exts = ["mp3", "flac", "ogg", "wav", "m4a"];
    let mut tracks = Vec::new();

    let entries = std::fs::read_dir(dir).map_err(|e| format!("Cannot read directory: {e}"))?;
    for (i, entry) in entries.flatten().enumerate() {
        let p = entry.path();
        if p.is_file() {
            if let Some(ext) = p.extension().and_then(|e| e.to_str()) {
                if exts.contains(&ext.to_lowercase().as_str()) {
                    let id = format!("{}", i);
                    if let Ok(meta) = read_metadata(&p.to_string_lossy(), &id) {
                        tracks.push((p.to_string_lossy().to_string(), meta));
                    }
                }
            }
        }
    }

    let mut list = Vec::new();
    // Sort by title
    tracks.sort_by(|a, b| a.1.title.to_lowercase().cmp(&b.1.title.to_lowercase()));
    
    // Assign sorted index as ID
    for (i, mut track) in tracks.into_iter().enumerate() {
        track.1.id = track.0.clone(); // use path as ID internally so we can play it
        list.push(track.1);
    }

    *LOCAL_PLAYLIST.lock() = list.clone();
    Ok(list)
}

#[tauri::command]
pub fn local_open_file(path: String) -> Result<TrackMetadata, String> {
    let meta = read_metadata(&path, &path)?;
    internal_play_file(&path)?;
    Ok(meta)
}

#[tauri::command]
pub fn local_play(index: Option<usize>) -> Result<(), String> {
    if let Some(idx) = index {
        let playlist = LOCAL_PLAYLIST.lock();
        if let Some(track) = playlist.get(idx) {
            *CURRENT_INDEX.lock() = Some(idx);
            return internal_play_file(&track.id);
        } else {
            return Err("Invalid index".into());
        }
    }

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

#[tauri::command]
pub fn local_pause() -> Result<(), String> {
    let mut player = PLAYER.lock();
    if let Some(ref sink) = player.sink {
        sink.pause();
        if let Some(start) = player.play_start.take() {
            player.accumulated_ms += start.elapsed().as_millis() as u64;
        }
        player.paused = true;
        Ok(())
    } else {
        Err("No file loaded".into())
    }
}

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

#[tauri::command]
pub fn local_seek(position_ms: u64) -> Result<(), String> {
    let mut player = PLAYER.lock();
    let path = player.current_file.clone().ok_or("No file loaded")?;

    let (stream, stream_handle) = ensure_output()?;
    let sink = Sink::try_new(&stream_handle).map_err(|e| format!("Sink error: {e}"))?;

    let file = File::open(&path).map_err(|e| format!("Cannot open file \"{path}\": {e}"))?;
    let reader = BufReader::new(file);
    let source = Decoder::new(reader).map_err(|e| format!("Decode error: {e}"))?;

    sink.append(source);

    let seek_duration = std::time::Duration::from_millis(position_ms);
    let _ = sink.try_seek(seek_duration);

    if player.paused {
        sink.pause();
    } else {
        sink.play();
    }

    player.sink = Some(sink);
    player._stream = Some(stream);
    player._stream_handle = Some(stream_handle);
    player.play_start = if player.paused { None } else { Some(Instant::now()) };
    player.accumulated_ms = position_ms;

    Ok(())
}

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

#[tauri::command]
pub fn local_get_metadata() -> Result<TrackMetadata, String> {
    let path = {
        let player = PLAYER.lock();
        player.current_file.clone().unwrap_or_default()
    };
    if path.is_empty() {
        return Err("No file loaded".into());
    }
    read_metadata(&path, &path)
}

#[tauri::command]
pub fn local_next() -> Result<(), String> {
    let playlist = LOCAL_PLAYLIST.lock();
    if playlist.is_empty() {
        return Err("Playlist empty".into());
    }
    let mut idx = CURRENT_INDEX.lock();
    let next_idx = match *idx {
        Some(i) => (i + 1) % playlist.len(),
        None => 0,
    };
    *idx = Some(next_idx);
    let track = &playlist[next_idx];
    internal_play_file(&track.id)
}

#[tauri::command]
pub fn local_previous() -> Result<(), String> {
    let playlist = LOCAL_PLAYLIST.lock();
    if playlist.is_empty() {
        return Err("Playlist empty".into());
    }
    let mut idx = CURRENT_INDEX.lock();
    let prev_idx = match *idx {
        Some(i) => if i == 0 { playlist.len() - 1 } else { i - 1 },
        None => 0,
    };
    *idx = Some(prev_idx);
    let track = &playlist[prev_idx];
    internal_play_file(&track.id)
}

#[tauri::command]
pub fn local_toggle_shuffle(state: bool) -> Result<(), String> {
    Ok(())
}

#[tauri::command]
pub fn local_set_repeat(state: String) -> Result<(), String> {
    Ok(())
}

#[tauri::command]
pub fn local_toggle_like(state: bool) -> Result<(), String> {
    Ok(())
}
