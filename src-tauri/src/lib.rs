//! NeonWave – Tauri backend entry point.
//!
//! Registers every command from the sub-modules and initialises plugins.

mod audio_capture;
mod color;
mod local_player;
mod types;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Load .env file if present (best-effort – missing file is fine).
    let _ = dotenv::dotenv();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            // ── Local player ────────────────────────────────────────────
            local_player::local_open_file,
            local_player::local_play,
            local_player::local_pause,
            local_player::local_stop,
            local_player::local_seek,
            local_player::local_get_position,
            local_player::local_set_volume,
            local_player::local_get_metadata,
            local_player::scan_directory,
            local_player::local_next,
            local_player::local_previous,
            local_player::local_toggle_shuffle,
            local_player::local_set_repeat,
            local_player::local_toggle_like,
            // ── Audio capture / visualiser ──────────────────────────────
            audio_capture::start_audio_capture,
            audio_capture::stop_audio_capture,
            // ── Colour extraction ───────────────────────────────────────
            color::extract_color,
            color::extract_color_from_bytes,
        ])
        .run(tauri::generate_context!())
        .expect("error while running NeonWave");
}
