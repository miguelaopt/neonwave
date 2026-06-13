//! System-audio capture via WASAPI loopback (Windows) + FFT analysis.
//!
//! Emits `"audio-data"` events to the Tauri frontend at ~30 fps with
//! frequency-band magnitudes that power the visualiser.

use crate::types::AudioData;
use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use parking_lot::Mutex;
use rustfft::{num_complex::Complex, FftPlanner};
use std::sync::{
    atomic::{AtomicBool, Ordering},
    Arc, LazyLock,
};
use tauri::{AppHandle, Emitter};

/// Wrapper so `cpal::Stream` (which is `!Send`) can live in a `Mutex` in a
/// static.  This is safe because we only ever access it under the lock and
/// from a single OS thread at a time.
struct SendStream(Option<cpal::Stream>);
unsafe impl Send for SendStream {}
unsafe impl Sync for SendStream {}

/// Signals the capture thread to stop.
static CAPTURING: LazyLock<Arc<AtomicBool>> =
    LazyLock::new(|| Arc::new(AtomicBool::new(false)));

/// Handle to the `cpal::Stream` so it stays alive.
static STREAM_HANDLE: LazyLock<Mutex<SendStream>> =
    LazyLock::new(|| Mutex::new(SendStream(None)));

const FFT_SIZE: usize = 2048;
const NUM_BANDS: usize = 48; // number of output frequency bands
const SMOOTHING: f32 = 0.7; // exponential smoothing factor (0–1, higher = smoother)

// ── Tauri commands ──────────────────────────────────────────────────────────

/// Start capturing system audio and emitting `audio-data` events.
#[tauri::command]
pub fn start_audio_capture(app: AppHandle) -> Result<(), String> {
    // If already capturing, just return.
    if CAPTURING.load(Ordering::SeqCst) {
        return Ok(());
    }

    // Use WASAPI host on Windows for loopback support.
    let host = cpal::host_from_id(cpal::HostId::Wasapi)
        .map_err(|e| format!("WASAPI host unavailable: {e}"))?;

    // Find the default output device and open it in loopback mode.
    let device = host
        .default_output_device()
        .ok_or_else(|| "No default audio output device found".to_string())?;

    let config = device
        .default_output_config()
        .map_err(|e| format!("Failed to get default output config: {e}"))?;

    let sample_rate = config.sample_rate().0 as f32;
    let channels = config.channels() as usize;

    // Shared ring buffer for accumulating samples.
    let buffer: Arc<Mutex<Vec<f32>>> = Arc::new(Mutex::new(Vec::with_capacity(FFT_SIZE * 2)));
    let buffer_writer = Arc::clone(&buffer);

    CAPTURING.store(true, Ordering::SeqCst);
    let capturing_flag = Arc::clone(&CAPTURING);

    // Build the input stream (loopback).
    let err_fn = |err: cpal::StreamError| {
        eprintln!("[audio_capture] stream error: {err}");
    };

    let stream = match config.sample_format() {
        cpal::SampleFormat::F32 => device
            .build_input_stream(
                &config.into(),
                move |data: &[f32], _: &cpal::InputCallbackInfo| {
                    if !capturing_flag.load(Ordering::Relaxed) {
                        return;
                    }
                    let mut buf = buffer_writer.lock();
                    // Down-mix to mono by averaging channels.
                    for chunk in data.chunks(channels) {
                        let sample: f32 =
                            chunk.iter().sum::<f32>() / channels as f32;
                        buf.push(sample);
                    }
                },
                err_fn,
                None,
            )
            .map_err(|e| format!("Failed to build loopback stream: {e}"))?,
        cpal::SampleFormat::I16 => device
            .build_input_stream(
                &config.into(),
                move |data: &[i16], _: &cpal::InputCallbackInfo| {
                    if !capturing_flag.load(Ordering::Relaxed) {
                        return;
                    }
                    let mut buf = buffer_writer.lock();
                    for chunk in data.chunks(channels) {
                        let sample: f32 = chunk.iter().map(|&s| s as f32 / 32768.0).sum::<f32>()
                            / channels as f32;
                        buf.push(sample);
                    }
                },
                err_fn,
                None,
            )
            .map_err(|e| format!("Failed to build loopback stream: {e}"))?,
        other => {
            return Err(format!("Unsupported sample format: {other:?}"));
        }
    };

    stream
        .play()
        .map_err(|e| format!("Failed to start loopback stream: {e}"))?;

    // Store the stream handle so it isn't dropped.
    STREAM_HANDLE.lock().0 = Some(stream);

    // Spawn a thread that reads the buffer, runs FFT, and emits events ~30 fps.
    let capturing_flag2 = Arc::clone(&CAPTURING);
    let buffer_reader = Arc::clone(&buffer);
    std::thread::spawn(move || {
        let mut planner = FftPlanner::<f32>::new();
        let fft = planner.plan_fft_forward(FFT_SIZE);
        let mut smoothed_bands = vec![0.0f32; NUM_BANDS];

        // Pre-compute Hanning window.
        let window: Vec<f32> = (0..FFT_SIZE)
            .map(|i| {
                0.5 * (1.0 - (2.0 * std::f32::consts::PI * i as f32 / (FFT_SIZE - 1) as f32).cos())
            })
            .collect();

        loop {
            if !capturing_flag2.load(Ordering::Relaxed) {
                break;
            }

            std::thread::sleep(std::time::Duration::from_millis(33)); // ~30 fps

            // Drain enough samples for one FFT window.
            let samples: Vec<f32> = {
                let mut buf = buffer_reader.lock();
                if buf.len() < FFT_SIZE {
                    continue;
                }
                let s: Vec<f32> = buf[..FFT_SIZE].to_vec();
                buf.drain(..FFT_SIZE);
                s
            };

            // Apply Hanning window.
            let mut fft_input: Vec<Complex<f32>> = samples
                .iter()
                .zip(window.iter())
                .map(|(&s, &w)| Complex::new(s * w, 0.0))
                .collect();

            fft.process(&mut fft_input);

            // Only the first half of the FFT output is useful (Nyquist).
            let half = FFT_SIZE / 2;

            // Map FFT bins into `NUM_BANDS` logarithmically-spaced bands.
            let min_freq: f32 = 20.0;
            let max_freq: f32 = sample_rate / 2.0;
            let log_min = min_freq.ln();
            let log_max = max_freq.ln();

            let mut bands = vec![0.0f32; NUM_BANDS];
            for i in 0..NUM_BANDS {
                let lo = ((log_min + (log_max - log_min) * i as f32 / NUM_BANDS as f32).exp()
                    / max_freq
                    * half as f32) as usize;
                let hi = ((log_min
                    + (log_max - log_min) * (i + 1) as f32 / NUM_BANDS as f32)
                    .exp()
                    / max_freq
                    * half as f32) as usize;
                let lo = lo.max(1).min(half - 1);
                let hi = hi.max(lo + 1).min(half);

                let mut sum = 0.0f32;
                for bin in lo..hi {
                    let mag = fft_input[bin].norm();
                    sum += mag;
                }
                bands[i] = sum / (hi - lo) as f32;
            }

            // Normalise to roughly 0–1 range (log scale).
            let scale = 2.0 / (FFT_SIZE as f32).sqrt();
            for b in bands.iter_mut() {
                *b = (*b * scale).log10().max(-3.0) / 3.0 + 1.0;
                *b = b.clamp(0.0, 1.0);
            }

            // Exponential smoothing.
            for i in 0..NUM_BANDS {
                smoothed_bands[i] =
                    SMOOTHING * smoothed_bands[i] + (1.0 - SMOOTHING) * bands[i];
            }

            let peak = smoothed_bands
                .iter()
                .cloned()
                .fold(0.0f32, f32::max);
            let rms = (smoothed_bands.iter().map(|b| b * b).sum::<f32>()
                / NUM_BANDS as f32)
                .sqrt();

            let data = AudioData {
                bands: smoothed_bands.clone(),
                peak,
                rms,
            };

            // Best-effort emit – if the window is closed we just stop.
            if app.emit("audio-data", &data).is_err() {
                break;
            }
        }
    });

    Ok(())
}

/// Stop the audio capture loop and release the loopback stream.
#[tauri::command]
pub fn stop_audio_capture() -> Result<(), String> {
    CAPTURING.store(false, Ordering::SeqCst);
    // Dropping the stream stops capture.
    STREAM_HANDLE.lock().0 = None;
    Ok(())
}
