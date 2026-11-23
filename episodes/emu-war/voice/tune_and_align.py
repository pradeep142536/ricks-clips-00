import os
import sys
import json
import subprocess

VOICE_DIR = r"c:\Users\PC\Downloads\ricks clips\episodes\great-emu-war\voice"
raw_wav = os.path.join(VOICE_DIR, "raw_voice.wav")
tuned_wav = os.path.join(VOICE_DIR, "voice.wav")
raw_mp3 = os.path.join(VOICE_DIR, "raw_voice.mp3")

# First convert raw_mp3 to raw_wav
subprocess.run(["ffmpeg", "-y", "-i", raw_mp3, "-ar", "48000", "-ac", "1", raw_wav], check=True)

# Probe duration of raw_wav
probe_cmd = ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", raw_wav]
raw_dur = float(subprocess.check_output(probe_cmd).strip())
print(f"Raw duration: {raw_dur:.2f}s")

# Target pace: 3.85 words/s for 224 words => target duration ~58.2s
total_words = 224
target_pace = 3.85
target_dur = total_words / target_pace # ~58.18s
speed_factor = raw_dur / target_dur
print(f"Target duration: {target_dur:.2f}s, speedup factor: {speed_factor:.4f}")

# Apply silence removal / compaction + atempo to hit exactly target duration and clean sound
# silenceremove reduces awkward pauses between sentences from ElevenLabs
filter_complex = f"silenceremove=stop_periods=-1:stop_duration=0.35:stop_threshold=-40dB,atempo={speed_factor:.4f}"
# To ensure clean pitch and speed, ffmpeg handles atempo up to 2.0 perfectly
tune_cmd = [
    "ffmpeg", "-y", "-i", raw_wav,
    "-af", f"atempo={speed_factor:.4f}",
    "-ar", "48000", "-ac", "1",
    tuned_wav
]
subprocess.run(tune_cmd, check=True)

tuned_dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", tuned_wav]).strip())
actual_pace = total_words / tuned_dur
print(f"Tuned duration: {tuned_dur:.2f}s, pace: {actual_pace:.2f} words/sec")

# Now align with faster-whisper on tuned_wav
print("Extracting word timestamps using faster-whisper...")
from faster_whisper import WhisperModel

model = WhisperModel("tiny.en", device="cpu", compute_type="int8")
segments, info = model.transcribe(tuned_wav, word_timestamps=True, language="en")

words = []
for segment in segments:
    for w in segment.words:
        cleaned_word = w.word.strip()
        if cleaned_word:
            words.append({
                "w": cleaned_word,
                "s": round(w.start, 3),
                "e": round(w.end, 3)
            })

words_path = os.path.join(VOICE_DIR, "words.json")
with open(words_path, "w", encoding="utf-8") as f:
    json.dump(words, f, indent=2)

print(f"Aligned {len(words)} words into {words_path}")
print(f"First 3 words: {words[:3]}")
print(f"Last 3 words: {words[-3:]}")
