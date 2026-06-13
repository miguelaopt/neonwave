use image::GenericImageView;
use parking_lot::Mutex;
use std::collections::HashMap;
use std::sync::LazyLock;

/// Simple in-memory cache: URL → hex colour string.
static COLOR_CACHE: LazyLock<Mutex<HashMap<String, String>>> =
    LazyLock::new(|| Mutex::new(HashMap::new()));

// ── Tauri commands ──────────────────────────────────────────────────────────

/// Download an image from `image_url` and return the dominant colour as a hex
/// string (e.g. `"#A1B2C3"`).  Results are cached by URL.
#[tauri::command]
pub async fn extract_color(image_url: String) -> Result<String, String> {
    // Check cache first.
    {
        let cache = COLOR_CACHE.lock();
        if let Some(hex) = cache.get(&image_url) {
            return Ok(hex.clone());
        }
    }

    // Download image bytes.
    let bytes = reqwest::get(&image_url)
        .await
        .map_err(|e| format!("Failed to fetch image: {e}"))?
        .bytes()
        .await
        .map_err(|e| format!("Failed to read image bytes: {e}"))?;

    let hex = dominant_color_from_bytes(&bytes)?;

    // Store in cache.
    COLOR_CACHE.lock().insert(image_url, hex.clone());

    Ok(hex)
}

/// Extract the dominant colour from raw image bytes (PNG / JPEG / etc.).
#[tauri::command]
pub fn extract_color_from_bytes(image_data: Vec<u8>) -> Result<String, String> {
    dominant_color_from_bytes(&image_data)
}

// ── Internal helpers ────────────────────────────────────────────────────────

/// Core routine: decode, down-sample, then run a simple histogram-bucket
/// approach to find the dominant colour.  Much faster than full k-means and
/// good enough for a background-gradient use-case.
fn dominant_color_from_bytes(data: &[u8]) -> Result<String, String> {
    let img = image::load_from_memory(data).map_err(|e| format!("Image decode error: {e}"))?;

    // Down-sample to at most 64×64 so the loop is fast.
    let thumb = img.thumbnail(64, 64);

    // Bucket each pixel into a 4-bit-per-channel cube (16³ = 4 096 buckets).
    // We skip very dark and very light pixels to get more "interesting" colours.
    let mut buckets: HashMap<(u8, u8, u8), (u64, u64, u64, u64)> = HashMap::new();

    for (_x, _y, px) in thumb.pixels() {
        let [r, g, b, a] = px.0;
        if a < 128 {
            continue; // skip transparent
        }
        // Skip near-black and near-white.
        let brightness = (r as u16 + g as u16 + b as u16) / 3;
        if brightness < 30 || brightness > 230 {
            continue;
        }
        let key = (r >> 4, g >> 4, b >> 4);
        let entry = buckets.entry(key).or_insert((0, 0, 0, 0));
        entry.0 += r as u64;
        entry.1 += g as u64;
        entry.2 += b as u64;
        entry.3 += 1;
    }

    if buckets.is_empty() {
        // Fallback: try without brightness filter.
        for (_x, _y, px) in thumb.pixels() {
            let [r, g, b, a] = px.0;
            if a < 128 {
                continue;
            }
            let key = (r >> 4, g >> 4, b >> 4);
            let entry = buckets.entry(key).or_insert((0, 0, 0, 0));
            entry.0 += r as u64;
            entry.1 += g as u64;
            entry.2 += b as u64;
            entry.3 += 1;
        }
    }

    // Pick the bucket with the most pixels and average its colour.
    let (_, best) = buckets
        .iter()
        .max_by_key(|(_, v)| v.3)
        .ok_or_else(|| "Image has no usable pixels".to_string())?;

    let r = (best.0 / best.3) as u8;
    let g = (best.1 / best.3) as u8;
    let b = (best.2 / best.3) as u8;

    Ok(format!("#{r:02X}{g:02X}{b:02X}"))
}
