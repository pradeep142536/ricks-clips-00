"""
Full Documentary Audio Engine for RicksClips (The Great Emu War of 1932).

Synthesizes:
1. Energetic 126 BPM documentary/adventure underscore (kick/snare groove, plucked bass,
   staccato marimba/acoustic riff, horn pad), dynamically sidechain-ducked by -20 dB under voice.
2. Synced procedural Foley SFX read from out/plan/sound_events.json:
   - outback_wind (0:00 desert wind gust & wheat rustle)
   - impact (1932 title hit)
   - wood_snap (0:07 fence wood-smash)
   - emu_squawk (0:07, 0:39, 0:46 booming guttural emu squawk)
   - hq_radio_map (0:10 vintage AM radio static chirp + oak desk map slap)
   - bolt_clack (0:16 Lewis gun metallic bolt-clack & drum latch)
   - gunshot (0:24 rapid .303 burst)
   - metal_clank (0:27 gun jam)
   - engine_rev (0:35 flatbed truck chase)
   - crash (0:41 fence crash)
   - bell (0:55 parliament bell)

Outputs:
  episodes/great-emu-war/sound/final_audio.wav (44.1 kHz, 16-bit PCM)
"""

import os
import json
import wave
import math
import numpy as np
from scipy.signal import butter, filtfilt, resample_poly

EP_DIR = os.path.dirname(os.path.abspath(__file__))
VOICE_WAV = os.path.join(EP_DIR, "voice", "voice.wav")
SOUND_EVENTS = os.path.join(EP_DIR, "out", "plan", "sound_events.json")
OUT_WAV = os.path.join(EP_DIR, "sound", "final_audio.wav")

TARGET_SR = 44100


def read_wav_mono(path):
    with wave.open(path, "rb") as w:
        sr = w.getframerate()
        nch = w.getnchannels()
        nf = w.getnframes()
        raw = w.readframes(nf)
    arr = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
    if nch > 1:
        arr = arr.reshape(-1, nch).mean(axis=1)
    return sr, arr


def write_wav_mono(path, sr, arr):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    arr = np.clip(arr, -0.99, 0.99)
    pcm = (arr * 32767.0).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(pcm.tobytes())


def butter_bp(x, lo, hi, sr, order=2):
    ny = 0.5 * sr
    l = max(1e-4, min(0.95, lo / ny))
    h = max(l + 1e-4, min(0.99, hi / ny))
    b, a = butter(order, [l, h], btype="band")
    return filtfilt(b, a, x)


def butter_lp(x, cutoff, sr, order=2):
    b, a = butter(order, min(0.98, cutoff / (0.5 * sr)), btype="low")
    return filtfilt(b, a, x)


def butter_hp(x, cutoff, sr, order=2):
    b, a = butter(order, max(1e-4, cutoff / (0.5 * sr)), btype="high")
    return filtfilt(b, a, x)


def noise(n, rng):
    return rng.standard_normal(n).astype(np.float32)


def add_at(buf, t_sec, clip, sr, gain=1.0):
    i0 = max(0, int(round(t_sec * sr)))
    if i0 >= len(buf):
        return
    n = min(len(clip), len(buf) - i0)
    if n > 0:
        buf[i0:i0 + n] += clip[:n] * gain


# ------------------------------------------------------------------ Music Score (126 BPM Documentary Adventure)
def make_documentary_score(n_samples, sr, rng):
    """Energetic 126 BPM historical adventure underscore (Dm - F - C - G/Bb)."""
    score = np.zeros(n_samples, dtype=np.float32)
    bpm = 126.0
    beat_s = 60.0 / bpm
    step_s = beat_s / 4.0  # 16th-note pulse
    n_steps = int(math.ceil((n_samples / sr) / step_s)) + 1

    # MIDI helper
    def m2f(m):
        return 440.0 * (2.0 ** ((m - 69) / 12.0))

    # 8-bar progression (steps per bar = 16 -> 128 steps = ~15.2s loop)
    chords = [
        (50, [62, 65, 69, 72]),  # Dm7
        (50, [62, 65, 69, 72]),
        (53, [65, 69, 72, 76]),  # Fmaj7
        (53, [65, 69, 72, 76]),
        (48, [60, 64, 67, 71]),  # Cmaj7
        (48, [60, 64, 67, 72]),
        (46, [58, 62, 65, 69]),  # Bbmaj7
        (45, [57, 62, 64, 69]),  # A7sus4
    ]

    # Prebuild percussion hits
    # 1) Punchy kick
    n_kick = int(0.18 * sr)
    tk = np.linspace(0, 0.18, n_kick, endpoint=False)
    kf = 48.0 + 95.0 * np.exp(-tk * 38.0)
    kick = np.sin(2 * np.pi * np.cumsum(kf) / sr) * np.exp(-tk * 14.0)
    kick += np.tanh(noise(n_kick, rng) * np.exp(-tk * 110.0)) * 0.25

    # 2) Crisp documentary snare / rimshot
    n_snr = int(0.14 * sr)
    ts = np.linspace(0, 0.14, n_snr, endpoint=False)
    snare_body = np.sin(2 * np.pi * (195.0 * np.exp(-ts * 14.0)) * ts) * np.exp(-ts * 26.0)
    snare_crack = butter_bp(noise(n_snr, rng), 1300, 4800, sr) * np.exp(-ts * 22.0)
    snare = 0.45 * snare_body + 0.75 * snare_crack

    # 3) Light brushed rim / ghost hit
    n_hat = int(0.05 * sr)
    th = np.linspace(0, 0.05, n_hat, endpoint=False)
    hat = butter_hp(noise(n_hat, rng), 5500, sr) * np.exp(-th * 85.0)

    # 4) Warm chord sustain swell per bar
    bar_s = step_s * 16.0
    n_bar = int(bar_s * sr)
    tb = np.linspace(0, bar_s, n_bar, endpoint=False)
    pad_env = np.sin(np.pi * np.clip(tb / bar_s, 0, 1)) ** 0.45

    arp_pattern = [0, 2, 1, 3, 2, 1, 3, 0, 1, 2, 3, 1, 2, 3, 2, 1]

    for s in range(n_steps):
        t0 = s * step_s
        if t0 * sr >= n_samples:
            break
        bar_idx = (s // 16) % len(chords)
        step_in_bar = s % 16
        bass_midi, chord_midis = chords[bar_idx]

        # Pad on bar downbeat
        if step_in_bar == 0:
            pad = np.zeros(n_bar, dtype=np.float32)
            for idx_n, m in enumerate(chord_midis[:3]):
                freq = m2f(m - 12)
                pad += 0.28 * np.sin(2 * np.pi * freq * tb + idx_n * 0.4)
                pad += 0.09 * np.sin(2 * np.pi * 2 * freq * tb)
            pad *= pad_env * 0.24
            add_at(score, t0, pad, sr, 1.0)

        # Driving Kick on 0, 6, 8, 10 (syncopated documentary bounce)
        if step_in_bar in (0, 6, 8):
            add_at(score, t0, kick, sr, 0.55 if step_in_bar != 6 else 0.36)

        # Crisp documentary snare/rimshot on 4 & 12 + light ghost on 14
        if step_in_bar in (4, 12):
            add_at(score, t0, snare, sr, 0.44)
        elif step_in_bar in (7, 15):
            add_at(score, t0, snare, sr, 0.14)

        # 16th-note brushed shaker pulse (accents on 8ths)
        add_at(score, t0, hat, sr, 0.24 if step_in_bar % 2 == 0 else 0.11)

        # Plucked Bass on 0, 3, 6, 8, 10, 12, 14
        if step_in_bar in (0, 3, 6, 8, 10, 12, 14):
            bm = bass_midi - 12 + (7 if step_in_bar in (6, 14) else 0)
            fb = m2f(bm)
            nb = int(0.24 * sr)
            t_b = np.linspace(0, 0.24, nb, endpoint=False)
            b_wave = (
                0.70 * np.sin(2 * np.pi * fb * t_b)
                + 0.32 * np.sin(2 * np.pi * 2 * fb * t_b) * np.exp(-t_b * 12.0)
                + 0.15 * np.sin(2 * np.pi * 3 * fb * t_b) * np.exp(-t_b * 22.0)
            ) * np.exp(-t_b * 8.5)
            # Soft attack click
            b_wave[:int(0.004 * sr)] *= np.linspace(0, 1, int(0.004 * sr))
            add_at(score, t0, b_wave, sr, 0.48)

        # Mischievous staccato marimba / plucked adventure riff
        if step_in_bar in (0, 2, 4, 6, 8, 9, 11, 13, 15):
            note_m = chord_midis[arp_pattern[step_in_bar]]
            if (s // 128) % 2 == 1 and step_in_bar >= 8:
                note_m += 12  # energetic lift on second chorus cycle
            fp = m2f(note_m)
            npk = int(0.16 * sr)
            t_p = np.linspace(0, 0.16, npk, endpoint=False)
            pluck = (
                0.72 * np.sin(2 * np.pi * fp * t_p)
                + 0.28 * np.sin(2 * np.pi * 2 * fp * t_p) * np.exp(-t_p * 18.0)
                + 0.14 * np.sin(2 * np.pi * 4 * fp * t_p) * np.exp(-t_p * 34.0)
            ) * np.exp(-t_p * 16.0)
            pluck[:int(0.003 * sr)] *= np.linspace(0, 1, int(0.003 * sr))
            add_at(score, t0, pluck, sr, 0.30 if step_in_bar % 4 == 0 else 0.21)

    # Gentle presence notch around ~2.0 kHz so narration cuts right through cleanly
    mid_cut = butter_bp(score, 1200, 3200, sr)
    score = score - 0.32 * mid_cut

    # Normalize full un-ducked score so gaps sit ~-22 dBFS and ducked bed sits ~-20 dB under voice
    rms = np.sqrt(np.mean(score ** 2)) + 1e-8
    score = score * (0.082 / rms)
    return score


# ------------------------------------------------------------------ Foley SFX Builders (44.1 kHz)
def make_outback_wind(sr, rng):
    dur = 3.2
    n = int(dur * sr)
    t = np.linspace(0, dur, n, endpoint=False)
    low_howl = butter_bp(noise(n, rng), 150, 480, sr) * (0.55 + 0.45 * np.sin(np.pi * t / 2.2) ** 2)
    wheat_swish = butter_bp(noise(n, rng), 1400, 3600, sr) * (0.25 + 0.75 * np.exp(-((t - 0.85) ** 2) / 0.45))
    env = np.minimum(1.0, t / 0.18) * np.exp(-np.maximum(0.0, t - 0.9) * 1.15)
    return (low_howl * 1.1 + wheat_swish * 0.45) * env * 0.55


def make_impact(sr, rng):
    dur = 0.48
    n = int(dur * sr)
    t = np.linspace(0, dur, n, endpoint=False)
    thump = np.sin(2 * np.pi * (95.0 * np.exp(-t * 9.0) + 36.0) * t) * np.exp(-t * 8.5)
    punch = butter_bp(noise(n, rng), 180, 950, sr) * np.exp(-t * 22.0) * 0.45
    return (thump + punch) * 0.65


def make_wood_snap(sr, rng):
    dur = 0.52
    n = int(dur * sr)
    t = np.linspace(0, dur, n, endpoint=False)
    out = np.zeros(n, dtype=np.float32)
    # Heavy fence post impact thud + 4 jagged splintering wood snaps
    out += np.sin(2 * np.pi * (125.0 * np.exp(-t * 16.0)) * t) * np.exp(-t * 15.0) * 0.65
    for delay_s, amp, f_lo, f_hi in [
        (0.00, 1.00, 900, 3800),
        (0.038, 0.82, 1200, 4400),
        (0.088, 0.65, 1000, 3200),
        (0.145, 0.42, 1400, 4800),
    ]:
        i0 = int(delay_s * sr)
        m = int(0.075 * sr)
        if i0 + m < n:
            tm = np.linspace(0, 0.075, m, endpoint=False)
            crack = butter_bp(noise(m, rng), f_lo, f_hi, sr) * np.exp(-tm * 58.0)
            crack += np.sin(2 * np.pi * 340.0 * tm) * np.exp(-tm * 65.0) * 0.4
            out[i0:i0 + m] += crack * amp * 0.85
    return out


def make_emu_squawk(sr, rng):
    """Distinctive emu low guttural boom followed by raspy avian FM squawk."""
    dur = 0.68
    n = int(dur * sr)
    t = np.linspace(0, dur, n, endpoint=False)
    # 1. Resonant emu throat drum ("buh-BOOM")
    boom_env = np.exp(-((t - 0.08) ** 2) / 0.003) + 0.85 * np.exp(-((t - 0.21) ** 2) / 0.005)
    boom = np.sin(2 * np.pi * (108.0 - 22.0 * t) * t) * boom_env * 0.65

    # 2. Raspy nasal squawk ("KRRAAAWK!") with harmonics + rough FM growl
    ts = np.maximum(0.0, t - 0.14)
    sq_env = np.where((t >= 0.14) & (t < 0.62), np.sin(np.pi * np.clip((t - 0.14) / 0.48, 0, 1)) ** 0.6, 0.0)
    f0 = 310.0 + 180.0 * np.exp(-ts * 7.0) - 90.0 * ts + 28.0 * np.sin(2 * np.pi * 42.0 * ts)
    ph = 2 * np.pi * np.cumsum(f0) / sr
    squawk_raw = (
        0.55 * np.sin(ph)
        + 0.45 * np.sin(2.0 * ph)
        + 0.35 * np.sin(3.0 * ph)
        + 0.22 * np.sin(4.0 * ph)
    )
    squawk = butter_bp(squawk_raw + 0.18 * noise(n, rng), 550, 2600, sr) * sq_env * 0.72
    return (boom + squawk) * 0.85


def make_hq_radio_map(sr, rng):
    """Vintage 1930s AM HQ radio static chirp + sharp oak desk map slap."""
    dur = 0.78
    n = int(dur * sr)
    t = np.linspace(0, dur, n, endpoint=False)
    # Radio carrier squeal & crackling AM static (0.00..0.46s)
    r_env = np.where(t < 0.44, np.sin(np.pi * np.clip(t / 0.44, 0, 1)) ** 0.35, 0.0)
    chirp = np.sin(2 * np.pi * np.cumsum(1950.0 - 1100.0 * np.clip(t / 0.25, 0, 1)) / sr) * np.exp(-t * 14.0) * 0.35
    crackle = np.where(rng.random(n) > 0.96, rng.uniform(-1, 1, n), 0.0).astype(np.float32)
    static_hiss = butter_bp(noise(n, rng) * 0.5 + crackle * 0.9, 850, 4800, sr) * r_env * 0.52

    # Crisp map slap / paper + oak table thud at t = 0.46s
    slap = np.zeros(n, dtype=np.float32)
    i0 = int(0.46 * sr)
    m = n - i0
    tm = np.linspace(0, m / sr, m, endpoint=False)
    oak_thud = np.sin(2 * np.pi * (105.0 * np.exp(-tm * 18.0) + 52.0) * tm) * np.exp(-tm * 24.0) * 0.80
    paper_snap = butter_bp(noise(m, rng), 1100, 3900, sr) * np.exp(-tm * 42.0) * 0.95
    slap[i0:] = oak_thud + paper_snap
    return (chirp + static_hiss + slap) * 0.82


def make_bolt_clack(sr, rng):
    """Metallic Lewis machine gun charging handle rack & drum pan latch."""
    dur = 0.40
    n = int(dur * sr)
    out = np.zeros(n, dtype=np.float32)
    for delay_s, freqs, amp in [
        (0.00, [1420.0, 2780.0, 4350.0], 0.72),   # Bolt pull click
        (0.055, [920.0, 1850.0], 0.42),           # Slide rack
        (0.135, [1560.0, 3120.0, 4820.0], 1.00),  # Heavy steel breech slam
    ]:
        i0 = int(delay_s * sr)
        m = min(int(0.18 * sr), n - i0)
        if m <= 0:
            continue
        tm = np.linspace(0, m / sr, m, endpoint=False)
        ring = np.zeros(m, dtype=np.float32)
        for idx_f, f0 in enumerate(freqs):
            ring += (0.65 / (idx_f + 1)) * np.sin(2 * np.pi * f0 * tm) * np.exp(-tm * (28.0 + idx_f * 14.0))
        click = butter_bp(noise(m, rng), 1800, 6500, sr) * np.exp(-tm * 85.0) * 0.65
        out[i0:i0 + m] += (ring + click) * amp
    return out * 0.85


def make_gunshot(sr, rng):
    """Lewis gun 3-round .303 rapid burst."""
    dur = 0.70
    n = int(dur * sr)
    out = np.zeros(n, dtype=np.float32)
    for shot_t in (0.0, 0.115, 0.23):
        i0 = int(shot_t * sr)
        m = n - i0
        tm = np.linspace(0, m / sr, m, endpoint=False)
        crack = butter_bp(noise(m, rng), 700, 5200, sr) * np.exp(-tm * 36.0)
        thump = np.sin(2 * np.pi * (140.0 * np.exp(-tm * 24.0) + 45.0) * tm) * np.exp(-tm * 18.0) * 0.75
        reverb = butter_bp(noise(m, rng), 350, 1400, sr) * np.exp(-tm * 6.5) * 0.28
        out[i0:] += (crack * 0.9 + thump + reverb) * 0.58
    return out


def make_metal_clank(sr, rng):
    dur = 0.42
    n = int(dur * sr)
    t = np.linspace(0, dur, n, endpoint=False)
    sig = (
        np.sin(2 * np.pi * 920.0 * t) * np.exp(-t * 22.0) * 0.6
        + np.sin(2 * np.pi * 1680.0 * t) * np.exp(-t * 26.0) * 0.45
        + butter_bp(noise(n, rng), 1500, 4200, sr) * np.exp(-t * 50.0) * 0.45
    )
    return sig * 0.75


def make_engine_rev(sr, rng):
    dur = 1.60
    n = int(dur * sr)
    t = np.linspace(0, dur, n, endpoint=False)
    f0 = 36.0 + 38.0 * np.sin(np.pi * np.clip(t / 1.1, 0, 1))
    ph = 2 * np.pi * np.cumsum(f0) / sr
    chug = 0.55 * np.sin(ph) + 0.35 * np.sin(2 * ph) + 0.22 * np.sin(3 * ph)
    rattle = butter_bp(noise(n, rng), 300, 1500, sr) * 0.25
    env = np.sin(np.pi * t / dur) ** 0.55
    return (chug + rattle) * env * 0.48


def make_crash(sr, rng):
    dur = 0.85
    n = int(dur * sr)
    t = np.linspace(0, dur, n, endpoint=False)
    boom = np.sin(2 * np.pi * (105.0 * np.exp(-t * 8.0) + 32.0) * t) * np.exp(-t * 7.5) * 0.75
    rubble = butter_bp(noise(n, rng), 450, 3200, sr) * np.exp(-t * 6.5) * 0.75
    return (boom + rubble) * 0.75


def make_bell(sr, rng):
    dur = 0.90
    n = int(dur * sr)
    t = np.linspace(0, dur, n, endpoint=False)
    bell = (
        0.60 * np.sin(2 * np.pi * 880.0 * t) * np.exp(-t * 4.5)
        + 0.35 * np.sin(2 * np.pi * 1760.0 * t) * np.exp(-t * 6.2)
        + 0.18 * np.sin(2 * np.pi * 2640.0 * t) * np.exp(-t * 8.0)
    )
    return bell * 0.55


def main():
    if not os.path.exists(VOICE_WAV):
        raise FileNotFoundError(f"Missing voice file: {VOICE_WAV}")

    v_sr, voice_raw = read_wav_mono(VOICE_WAV)
    if v_sr != TARGET_SR:
        g = math.gcd(v_sr, TARGET_SR)
        voice = resample_poly(voice_raw, TARGET_SR // g, v_sr // g).astype(np.float32)
    else:
        voice = voice_raw
    sr = TARGET_SR
    n_samples = len(voice)
    dur_s = n_samples / sr

    # 1. Measure voice RMS activity -> smooth ducking envelope (-20 dB when speaking)
    win = int(0.025 * sr)
    abs_v = np.abs(voice)
    kernel = np.ones(win, dtype=np.float32) / win
    smooth_env = np.convolve(abs_v, kernel, mode="same")
    speech_thresh = max(0.012, float(np.max(smooth_env)) * 0.045)
    raw_gate = (smooth_env > speech_thresh).astype(np.float32)

    # Asymmetric attack (fast duck 12ms) / release (gentle swell back 240ms)
    gate = np.zeros_like(raw_gate)
    att = math.exp(-1.0 / (0.012 * sr))
    rel = math.exp(-1.0 / (0.240 * sr))
    cur = 0.0
    for i in range(n_samples):
        tgt = raw_gate[i]
        c = att if tgt > cur else rel
        cur = c * cur + (1.0 - c) * tgt
        gate[i] = cur

    # Duck factor: 1.0 (0 dB bed) in pauses -> ~0.088 (-21 dB duck -> ~-20 dB below voice RMS) when speaking
    duck_gain = 1.0 - 0.912 * gate

    rng = np.random.default_rng(1932)
    music = make_documentary_score(n_samples, sr, rng)
    music_ducked = music * duck_gain

    # 2. Mix synced foley SFX from baked sound_events.json
    sfx_bus = np.zeros(n_samples, dtype=np.float32)
    events = json.load(open(SOUND_EVENTS, "r", encoding="utf-8")) if os.path.exists(SOUND_EVENTS) else []
    builders = {
        "outback_wind": make_outback_wind,
        "impact": make_impact,
        "wood_snap": make_wood_snap,
        "emu_squawk": make_emu_squawk,
        "hq_radio_map": make_hq_radio_map,
        "bolt_clack": make_bolt_clack,
        "gunshot": make_gunshot,
        "metal_clank": make_metal_clank,
        "engine_rev": make_engine_rev,
        "crash": make_crash,
        "bell": make_bell,
    }
    for ev in events:
        name = ev.get("name", "")
        t_s = float(ev.get("t", 0.0))
        gain = float(ev.get("gain", 1.0))
        if name in builders:
            add_at(sfx_bus, t_s, builders[name](sr, rng), sr, gain)

    # Subtle ambient desert room tone underneath outdoor takes only during gaps
    amb_wind = butter_bp(noise(n_samples, rng), 180, 560, sr) * 0.010 * (0.4 + 0.6 * (1.0 - gate))

    # 3. Sum mix cleanly with soft-knee limiting so voice stays crisp and dominant
    mix = voice + music_ducked + sfx_bus + amb_wind
    peak = float(np.max(np.abs(mix))) + 1e-8
    if peak > 0.94:
        mix = np.tanh(mix / peak * 1.1) * 0.92

    write_wav_mono(OUT_WAV, sr, mix)

    # Verification metrics for logs
    mask_talk = gate > 0.65
    mask_gap = gate < 0.15
    v_rms = float(np.sqrt(np.mean(voice[mask_talk] ** 2))) if np.any(mask_talk) else 0.0
    m_talk_rms = float(np.sqrt(np.mean(music_ducked[mask_talk] ** 2))) if np.any(mask_talk) else 0.0
    m_gap_rms = float(np.sqrt(np.mean(music_ducked[mask_gap] ** 2))) if np.any(mask_gap) else 0.0
    duck_db = 20.0 * math.log10((m_talk_rms + 1e-8) / (m_gap_rms + 1e-8))
    print(f"Audio mixed cleanly -> {OUT_WAV}")
    print(f"  Duration: {dur_s:.2f}s @ {sr} Hz | Foley events mixed: {len(events)}")
    print(f"  Voice RMS: {20*math.log10(v_rms+1e-8):.1f} dBFS | Music gap RMS: {20*math.log10(m_gap_rms+1e-8):.1f} dBFS | Music under-voice RMS: {20*math.log10(m_talk_rms+1e-8):.1f} dBFS (duck: {duck_db:.1f} dB)")
    print("  Events:", [(round(float(e['t']), 2), e['name']) for e in events])


if __name__ == "__main__":
    main()
