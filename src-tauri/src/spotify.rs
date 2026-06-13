//! Spotify integration via rspotify (Authorization Code + PKCE).
//!
//! All commands gracefully return errors when credentials are missing so the
//! frontend can show an appropriate message instead of crashing.

use crate::types::{PlaybackState, Track};
use parking_lot::Mutex;
use rspotify::{
    model::{AdditionalType, Market},
    prelude::*,
    scopes, AuthCodePkceSpotify, Credentials, OAuth,
};
use std::sync::LazyLock;

/// Global Spotify client state, protected by a `parking_lot::Mutex`.
static SPOTIFY: LazyLock<Mutex<Option<AuthCodePkceSpotify>>> = LazyLock::new(|| Mutex::new(None));

/// Whether we've successfully completed the OAuth flow.
static AUTHENTICATED: LazyLock<Mutex<bool>> = LazyLock::new(|| Mutex::new(false));

// ── Helpers ─────────────────────────────────────────────────────────────────

fn get_client_id() -> Result<String, String> {
    std::env::var("SPOTIFY_CLIENT_ID").map_err(|_| {
        "SPOTIFY_CLIENT_ID not set. Create a .env file with your Spotify client ID.".to_string()
    })
}

fn get_redirect_uri() -> String {
    std::env::var("SPOTIFY_REDIRECT_URI")
        .unwrap_or_else(|_| "http://localhost:8888/callback".to_string())
}

fn require_client() -> Result<AuthCodePkceSpotify, String> {
    SPOTIFY
        .lock()
        .clone()
        .ok_or_else(|| "Spotify client not initialised. Call spotify_auth_url first.".to_string())
}

fn require_authed_client() -> Result<AuthCodePkceSpotify, String> {
    if !*AUTHENTICATED.lock() {
        return Err("Not authenticated with Spotify yet.".to_string());
    }
    require_client()
}

// ── Tauri commands ──────────────────────────────────────────────────────────

/// Generate the Spotify OAuth URL the user should open in their browser.
#[tauri::command]
pub async fn spotify_auth_url() -> Result<String, String> {
    let client_id = get_client_id()?;
    let redirect_uri = get_redirect_uri();

    let creds = Credentials::new_pkce(&client_id);
    let oauth = OAuth {
        redirect_uri,
        scopes: scopes!(
            "user-read-playback-state",
            "user-modify-playback-state",
            "user-read-currently-playing",
            "streaming"
        ),
        ..Default::default()
    };

    let mut spotify = AuthCodePkceSpotify::new(creds, oauth);
    let url = spotify.get_authorize_url(None).map_err(|e| e.to_string())?;

    *SPOTIFY.lock() = Some(spotify);
    Ok(url)
}

/// Handle the callback code returned by Spotify after user authorises.
#[tauri::command]
pub async fn spotify_callback(code: String) -> Result<(), String> {
    let spotify = require_client()?;
    spotify
        .request_token(&code)
        .await
        .map_err(|e| format!("Token request failed: {e}"))?;

    *AUTHENTICATED.lock() = true;
    // Store the updated client back.
    *SPOTIFY.lock() = Some(spotify);
    Ok(())
}

/// Check whether we hold a valid Spotify session.
#[tauri::command]
pub fn spotify_is_authenticated() -> bool {
    *AUTHENTICATED.lock()
}

/// Fetch the current Spotify playback state.
#[tauri::command]
pub async fn spotify_get_playback() -> Result<Option<PlaybackState>, String> {
    let spotify = require_authed_client()?;

    let market = Some(Market::FromToken);
    let additional_types = Some(vec![AdditionalType::Track]);

    let context = spotify
        .current_playback(market, additional_types.as_deref())
        .await
        .map_err(|e| format!("Failed to get playback: {e}"))?;

    let Some(ctx) = context else {
        return Ok(None);
    };

    let (track_name, artist_name, album_name, album_art_url, duration_ms) =
        if let Some(rspotify::model::PlayableItem::Track(track)) = ctx.item {
            let artists = track
                .artists
                .iter()
                .map(|a| a.name.clone())
                .collect::<Vec<_>>()
                .join(", ");
            let art_url = track.album.images.first().map(|i| i.url.clone());
            let dur = track.duration.num_milliseconds().max(0) as u64;
            (track.name, artists, track.album.name, art_url, dur)
        } else {
            ("Unknown".into(), "Unknown".into(), "Unknown".into(), None, 0)
        };

    let progress_ms = ctx
        .progress
        .map(|d| d.num_milliseconds().max(0) as u64)
        .unwrap_or(0);

    Ok(Some(PlaybackState {
        track_name,
        artist_name,
        album_name,
        album_art_url,
        progress_ms,
        duration_ms,
        is_playing: ctx.is_playing,
        volume_percent: ctx.device.volume_percent.map(|v| v as u8),
    }))
}

/// Resume playback.
#[tauri::command]
pub async fn spotify_play() -> Result<(), String> {
    let spotify = require_authed_client()?;
    spotify
        .resume_playback(None, None)
        .await
        .map_err(|e| format!("Play failed: {e}"))
}

/// Pause playback.
#[tauri::command]
pub async fn spotify_pause() -> Result<(), String> {
    let spotify = require_authed_client()?;
    spotify
        .pause_playback(None)
        .await
        .map_err(|e| format!("Pause failed: {e}"))
}

/// Skip to next track.
#[tauri::command]
pub async fn spotify_next() -> Result<(), String> {
    let spotify = require_authed_client()?;
    spotify
        .next_track(None)
        .await
        .map_err(|e| format!("Next failed: {e}"))
}

/// Skip to previous track.
#[tauri::command]
pub async fn spotify_previous() -> Result<(), String> {
    let spotify = require_authed_client()?;
    spotify
        .previous_track(None)
        .await
        .map_err(|e| format!("Previous failed: {e}"))
}

/// Set playback volume (0–100).
#[tauri::command]
pub async fn spotify_set_volume(volume: u8) -> Result<(), String> {
    let spotify = require_authed_client()?;
    spotify
        .volume(volume, None)
        .await
        .map_err(|e| format!("Set volume failed: {e}"))
}

/// Search for a track.
#[tauri::command]
pub async fn spotify_search(query: String) -> Result<Vec<Track>, String> {
    let spotify = require_authed_client()?;
    let result = spotify
        .search(&query, rspotify::model::SearchType::Track, None, None, Some(20), None)
        .await
        .map_err(|e| format!("Search failed: {e}"))?;

    let tracks = if let rspotify::model::SearchResult::Tracks(page) = result {
        page.items
            .into_iter()
            .map(|t| Track {
                id: t.id.unwrap().to_string(),
                title: t.name,
                artist: t.artists.iter().map(|a| a.name.clone()).collect::<Vec<_>>().join(", "),
                album_art_url: t.album.images.first().map(|i| i.url.clone()),
            })
            .collect()
    } else {
        vec![]
    };

    Ok(tracks)
}

/// Play a specific track via its URI.
#[tauri::command]
pub async fn spotify_play_track(uri: String) -> Result<(), String> {
    let spotify = require_authed_client()?;
    let playable_uri = rspotify::model::PlayableId::from_uri(&uri).map_err(|e| format!("Invalid URI: {e}"))?;
    spotify
        .start_uris_playback(
            [playable_uri],
            None,
            None,
            None,
        )
        .await
        .map_err(|e| format!("Play track failed: {e}"))
}
