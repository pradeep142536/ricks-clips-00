"""
Full Audio Mixing Engine for episodes/bar-plane-landing/ (V3.0 Paradox Edition).

Mixes:
1. Energetic 132 BPM 1950s upright-bass / vibraphone swing-heist documentary score ducked -20 dB under voice.
2. Synced procedural foley SFX read from out/plan/sound_events.json:
   - cell_lock_clank, cash_snap, pub_chatter_amb, mug_clink, stopwatch_tick,
     footsteps_tarmac, prop_crank_roar, prop_flyby, tire_screech,
     door_bell_jingle, siren_chirp, gavel_slam, cash_stamp, paper_whip,
     record_scratch, second_screech.
"""
import json
import math
import os
import wave
import numpy as np
from scipy.signal import butter, filtfilt, resample_poly

EP_DIR = os.path.dirname(os.path.abspath(__file__))
VOICE_WAV = os.path.join(EP_DIR, "voice", "voice.wav")
SOUND_EVENTS = os.path.join(EP_DIR, "out", "plan", "sound_events.json")
OUT_WAV = os.path.join(EP_DIR, "sound", "final_audio.wav")
TARGET_SR = 44100


def read_wav_mono(path):
    with wave.open(path, "rb") as w:
        sr, nch, nf = w.getframerate(), w.getnchannels(), w.getnframes()
        raw = w.readframes(nf)
    arr = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
    if nch > 1:
        arr = arr.reshape(-1, nch).mean(axis=1)
    return sr, arr


def write_wav_mono(path, sr, arr):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    pcm = (np.clip(arr, -0.99, 0.99) * 32767.0).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes(pcm.tobytes())


def butter_bp(x, lo, hi, sr):
    ny = 0.5 * sr
    b, a = butter(2, [max(1e-4, min(0.95, lo / ny)), min(0.99, hi / ny)], btype="band")
    return filtfilt(b, a, x)


def butter_lp(x, cut, sr):
    b, a = butter(2, min(0.98, cut / (0.5 * sr)), btype="low")
    return filtfilt(b, a, x)


def add_at(buf, t_sec, clip, sr, gain=1.0):
    i0 = max(0, int(round(t_sec * sr)))
    if i0 >= len(buf):
        return
    n = min(len(clip), len(buf) - i0)
    if n > 0:
        buf[i0:i0 + n] += clip[:n] * gain


def make_1956_heist_score(n_samples, sr, rng):
    """Energetic 132 BPM upright-bass + jazzy vibraphone retro heist underscore."""
    score = np.zeros(n_samples, dtype=np.float32)
    step_s = (60.0 / 132.0) / 4.0
    n_steps = int(math.ceil((n_samples / sr) / step_s)) + 1
    m2f = lambda m: 440.0 * (2.0 ** ((m - 69) / 12.0))

    chords = [
        (45, [60, 64, 67, 69]),
        (45, [60, 64, 67, 69]),
        (50, [62, 65, 69, 72]),
        (52, [64, 68, 71, 74]),
        (48, [60, 64, 67, 71]),
        (45, [60, 64, 67, 69]),
        (47, [59, 62, 65, 69]),
        (52, [64, 68, 71, 74]),
    ]

    t_k = np.arange(int(0.16 * sr)) / sr
    kick = (np.sin(2 * math.pi * (105 * np.exp(-t_k * 20) + 46) * t_k) * np.exp(-t_k * 16) * 0.8).astype(np.float32)
    t_sn = np.arange(int(0.11 * sr)) / sr
    snare = (butter_bp(rng.standard_normal(len(t_sn)).astype(np.float32), 1400, 6000, sr) * np.exp(-t_sn * 26) * 0.42).astype(np.float32)
    t_hh = np.arange(int(0.05 * sr)) / sr
    hat = (butter_bp(rng.standard_normal(len(t_hh)).astype(np.float32), 6000, 12000, sr) * np.exp(-t_hh * 65) * 0.22).astype(np.float32)

    arp = [0, 1, 2, 3, 2, 1, 3, 0, 1, 2, 3, 2, 0, 1, 2, 3]
    for s in range(n_steps):
        ts = s * step_s
        step = s % 16
        root, notes = chords[(s // 16) % len(chords)]
        if step in (0, 6, 10):
            add_at(score, ts, kick, sr, 0.72)
        if step in (4, 12):
            add_at(score, ts, snare, sr, 0.58)
        if step % 2 == 0 or step in (3, 11):
            add_at(score, ts, hat, sr, 0.45)
        if step in (0, 3, 6, 8, 10, 14):
            f0 = m2f(root - 12)
            tb = np.arange(int(0.24 * sr)) / sr
            bass = (np.sin(2 * math.pi * f0 * tb) + 0.45 * np.sin(4 * math.pi * f0 * tb)) * np.exp(-tb * 8.5)
            add_at(score, ts, bass.astype(np.float32), sr, 0.45)
        if step % 2 == 0:
            fm = m2f(notes[arp[step]])
            tm = np.arange(int(0.18 * sr)) / sr
            vibe = (np.sin(2 * math.pi * fm * tm) + 0.2 * np.sin(6 * math.pi * fm * tm)) * np.exp(-tm * 13.0)
            add_at(score, ts, vibe.astype(np.float32), sr, 0.28)
    mx = np.max(np.abs(score)) or 1.0
    return score / mx


def synth_sfx(kind, sr, rng):
    if kind == "cell_lock_clank":
        t = np.arange(int(0.55 * sr)) / sr
        clang = (np.sin(2 * math.pi * 380 * t) + 0.6 * np.sin(2 * math.pi * 640 * t) + 0.4 * np.sin(2 * math.pi * 1190 * t)) * np.exp(-t * 9.5)
        thud = np.sin(2 * math.pi * 92 * np.exp(-t * 14) * t) * np.exp(-t * 18.0) * 0.7
        return (clang * 0.48 + thud).astype(np.float32)
    if kind == "cash_snap":
        t = np.arange(int(0.28 * sr)) / sr
        snap = butter_bp(rng.standard_normal(len(t)).astype(np.float32), 2200, 7200, sr) * np.exp(-t * 28.0)
        return (snap * 0.72).astype(np.float32)
    if kind == "pub_chatter_amb":
        n = int(8.5 * sr)
        raw = rng.standard_normal(n).astype(np.float32)
        room = butter_bp(raw, 260, 1600, sr)
        env = np.minimum(1.0, np.arange(n) / (0.6 * sr)) * np.minimum(1.0, (n - np.arange(n)) / (0.8 * sr))
        return room * env * 0.16
    if kind == "mug_clink":
        t = np.arange(int(0.45 * sr)) / sr
        ping = (np.sin(2 * math.pi * 2420 * t) + 0.7 * np.sin(2 * math.pi * 3680 * t)) * np.exp(-t * 14.0)
        thud = np.sin(2 * math.pi * 130 * np.exp(-t * 18) * t) * np.exp(-t * 20.0)
        return (ping * 0.45 + thud * 0.70).astype(np.float32)
    if kind == "stopwatch_tick":
        out = np.zeros(int(3.2 * sr), dtype=np.float32)
        for k in range(12):
            ts = k * 0.25
            tk = np.arange(int(0.03 * sr)) / sr
            f = 3400 if (k % 2 == 0) else 2850
            click = np.sin(2 * math.pi * f * tk) * np.exp(-tk * 140.0)
            add_at(out, ts, click.astype(np.float32), sr, 0.52)
        return out
    if kind == "footsteps_tarmac":
        out = np.zeros(int(2.2 * sr), dtype=np.float32)
        for st in (0.0, 0.36, 0.72, 1.08, 1.44, 1.80):
            tk = np.arange(int(0.11 * sr)) / sr
            step = butter_bp(rng.standard_normal(len(tk)).astype(np.float32), 200, 1800, sr) * np.exp(-tk * 30.0) + np.sin(2 * math.pi * 110 * tk) * np.exp(-tk * 35.0) * 0.5
            add_at(out, st, step.astype(np.float32), sr, 0.55)
        return out
    if kind in ("prop_crank_roar", "prop_flyby"):
        dur = 4.6 if kind == "prop_crank_roar" else 4.8
        t = np.arange(int(dur * sr)) / sr
        rpm = 26.0 + 38.0 * np.minimum(1.0, t / 1.8)
        ph = 2 * math.pi * np.cumsum(rpm) / sr
        eng = 0.55 * np.sin(ph) + 0.35 * np.sin(2 * ph) + 0.2 * np.sin(3 * ph)
        roar = butter_lp(eng.astype(np.float32) + rng.standard_normal(len(t)).astype(np.float32) * 0.25, 950, sr)
        env = np.sin(np.pi * t / dur) ** 0.45
        return roar * env * 0.65
    if kind in ("tire_screech", "second_screech"):
        t = np.arange(int(1.45 * sr)) / sr
        chirp = (np.sin(2 * math.pi * (1950 - 380 * t) * t) + 0.5 * np.sin(2 * math.pi * (3120 - 520 * t) * t)) * np.exp(-t * 2.1)
        skid = butter_bp(rng.standard_normal(len(t)).astype(np.float32), 1400, 4200, sr) * np.exp(-t * 2.3) * 0.4
        return (chirp * 0.44 + skid).astype(np.float32)
    if kind == "door_bell_jingle":
        t = np.arange(int(0.6 * sr)) / sr
        b1 = np.sin(2 * math.pi * 1560 * t) * np.exp(-t * 9.0)
        b2 = np.sin(2 * math.pi * 2090 * np.maximum(0.0, t - 0.12)) * np.exp(-np.maximum(0.0, t - 0.12) * 10.0) * (t >= 0.12)
        return ((b1 + b2) * 0.42).astype(np.float32)
    if kind == "siren_chirp":
        t = np.arange(int(2.4 * sr)) / sr
        freq = 760.0 + 340.0 * np.sin(2 * math.pi * 1.45 * t)
        sir = np.sin(2 * math.pi * np.cumsum(freq) / sr)
        env = np.minimum(1.0, t / 0.12) * np.exp(-np.maximum(0.0, t - 1.4) * 2.4)
        return (sir * env * 0.45).astype(np.float32)
    if kind == "gavel_slam":
        t = np.arange(int(0.45 * sr)) / sr
        crack = butter_bp(rng.standard_normal(len(t)).astype(np.float32), 450, 2600, sr) * np.exp(-t * 26.0)
        wood = (np.sin(2 * math.pi * 195 * np.exp(-t * 16) * t) + 0.5 * np.sin(2 * math.pi * 390 * t)) * np.exp(-t * 18.0)
        return (crack * 0.65 + wood * 0.60).astype(np.float32)
    if kind == "cash_stamp":
        t = np.arange(int(0.55 * sr)) / sr
        stamp = np.sin(2 * math.pi * 145 * np.exp(-t * 24) * t) * np.exp(-t * 24) * 0.6
        ding = (np.sin(2 * math.pi * 1860 * t) + 0.4 * np.sin(2 * math.pi * 2790 * t)) * np.exp(-t * 11) * 0.45
        return (stamp + ding).astype(np.float32)
    if kind == "paper_whip":
        t = np.arange(int(0.42 * sr)) / sr
        f = 420.0 + 1800.0 * np.sin(math.pi * t / 0.42)
        whoosh = butter_bp(rng.standard_normal(len(t)).astype(np.float32), 600, 3200, sr) * np.sin(math.pi * t / 0.42)
        tone = np.sin(2 * math.pi * np.cumsum(f) / sr) * np.sin(math.pi * t / 0.42) * 0.22
        return (whoosh * 0.55 + tone).astype(np.float32)
    if kind == "record_scratch":
        t = np.arange(int(0.55 * sr)) / sr
        f = 900.0 - 700.0 * (t / 0.55)
        scr = butter_bp((np.sin(2 * math.pi * np.cumsum(f) / sr) + 0.4 * rng.standard_normal(len(t))).astype(np.float32), 600, 4000, sr)
        return scr * np.exp(-t * 5.0) * 0.6
    t = np.arange(int(0.3 * sr)) / sr
    return (np.sin(2 * math.pi * 440 * t) * np.exp(-t * 12) * 0.3).astype(np.float32)


def main():
    rng = np.random.default_rng(1956)
    vsr, voice = read_wav_mono(VOICE_WAV)
    if vsr != TARGET_SR:
        voice = resample_poly(voice, TARGET_SR, vsr).astype(np.float32)
    sr = TARGET_SR
    n = len(voice) + int(1.0 * sr)
    vpad = np.zeros(n, dtype=np.float32)
    vpad[:len(voice)] = voice

    music = make_1956_heist_score(n, sr, rng)

    win = int(0.08 * sr)
    abs_v = np.abs(vpad)
    env = np.convolve(abs_v, np.ones(win, dtype=np.float32) / win, mode="same")
    speech_on = (env > 0.014).astype(np.float32)
    speech_smooth = butter_lp(speech_on, 8.0, sr)
    speech_smooth = np.clip(speech_smooth, 0.0, 1.0)
    music_gain = 0.28 * (1.0 - 0.94 * speech_smooth)  # >= -20 dB reduction under speech
    ducked_music = music * music_gain

    sfx_bus = np.zeros(n, dtype=np.float32)
    events = []
    if os.path.exists(SOUND_EVENTS):
        ev_data = json.load(open(SOUND_EVENTS, "r", encoding="utf-8"))
        ev_list = ev_data if isinstance(ev_data, list) else (ev_data.get("events") or [])
        for row in ev_list:
            events.append((float(row.get("t", 0.0)), row.get("name") or row.get("sfx"), float(row.get("gain", row.get("db", -6.0)))))
    for t_s, kind, db in events:
        if not kind:
            continue
        clip = synth_sfx(kind, sr, rng)
        add_at(sfx_bus, t_s, clip, sr, gain=10.0 ** (db / 20.0))

    mix = vpad * 0.95 + ducked_music + sfx_bus * 0.85
    peak = float(np.max(np.abs(mix))) or 1.0
    if peak > 0.94:
        mix = mix * (0.94 / peak)
    write_wav_mono(OUT_WAV, sr, mix)

    mask_sp = speech_smooth > 0.7
    mask_gp = speech_smooth < 0.2
    v_rms = 20 * math.log10(float(np.sqrt(np.mean(vpad[mask_sp] ** 2))) + 1e-8)
    m_sp = 20 * math.log10(float(np.sqrt(np.mean(ducked_music[mask_sp] ** 2))) + 1e-8)
    m_gp = 20 * math.log10(float(np.sqrt(np.mean(ducked_music[mask_gp] ** 2))) + 1e-8)
    print(f"Audio mixed cleanly -> {OUT_WAV}")
    print(f"  Duration: {n / sr:.2f}s @ {sr} Hz | Foley events: {len(events)}")
    print(f"  Voice RMS: {v_rms:.1f} dBFS | Music gap RMS: {m_gp:.1f} dBFS | Music under-voice RMS: {m_sp:.1f} dBFS (duck: {m_sp - m_gp:.1f} dB)")


if __name__ == "__main__":
    main()
