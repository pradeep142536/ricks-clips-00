import os
import sys
import json
import base64
import urllib.request
import subprocess

API_KEY = "sk_722fa4b3ed118ec4cd1d000b018527c08721b68c4c5985ad"
VOICE_ID = "JBFqnCBsd6RMkjVDRZzb" # George (Captivating Storyteller)
VOICE_DIR = r"c:\Users\PC\Downloads\ricks clips\episodes\great-emu-war\voice"

TEXT = (
    "In 1932, Australia waged war against twenty thousand birds—and lost. "
    "Drought drove starving emu hordes into Western Australian wheat farms. "
    "They smashed wooden fences, ruined crops, and left holes for rabbits. "
    "Desperate wheat farmers begged the government for military protection. "
    "So the army sent Major Meredith, two gunners, and Lewis machine guns. "
    "They carried ten thousand rounds, expecting easy target practice. "
    "In Campion's red dirt, the soldiers set their deadly ambush. "
    "Over a thousand giant birds marched toward their hidden trench. "
    "The gunners waited for point-blank range, then opened rapid fire. "
    "Suddenly, after just twelve rounds, the gun jammed completely solid. "
    "The emus didn't freeze; they scattered instantly in ten directions. "
    "Next, the soldiers bolted a Lewis gun onto a rattling flatbed truck. "
    "They roared across bumpy tracks, chasing sprinting birds at full throttle. "
    "The ride was too wild to aim, and an emu smashed their steering gear. "
    "The truck veered off the road and crashed straight through a fence. "
    "You see, the emus were fighting organized guerrilla warfare. "
    "Each small squad had a sentinel bird, warning the flock of danger. "
    "Major Meredith admitted the birds could tank bullets like tanks. "
    "After thousands of rounds, the defeated army ordered a full retreat. "
    "In parliament, an MP asked if the soldiers should receive medals. "
    "Another member replied they should only award medals to the emus."
)

print(f"Requesting voiceover from ElevenLabs for {len(TEXT)} characters ({len(TEXT.split())} words)...")
payload = json.dumps({
    "text": TEXT,
    "model_id": "eleven_multilingual_v2",
    "voice_settings": {
        "stability": 0.45,
        "similarity_boost": 0.80,
        "style": 0.30,
        "use_speaker_boost": True
    }
}).encode("utf-8")

request = urllib.request.Request(
    f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}/with-timestamps",
    data=payload,
    headers={
        "xi-api-key": API_KEY,
        "Content-Type": "application/json",
        "Accept": "application/json"
    },
    method="POST"
)

try:
    with urllib.request.urlopen(request, timeout=180) as response:
        result = json.loads(response.read().decode("utf-8"))
        print("ElevenLabs API call SUCCEEDED!")
except urllib.error.HTTPError as e:
    err_body = e.read().decode('utf-8')
    print(f"ElevenLabs API request failed: HTTP {e.code}: {err_body}")
    sys.exit(1)
except Exception as e:
    print(f"Request failed: {e}")
    sys.exit(1)

audio = base64.b64decode(result["audio_base64"])
raw_mp3 = os.path.join(VOICE_DIR, "raw_voice.mp3")
with open(raw_mp3, "wb") as f:
    f.write(audio)
print(f"Saved raw mp3: {len(audio)} bytes")

# Convert to 48kHz WAV
wav_path = os.path.join(VOICE_DIR, "voice.wav")
cmd = [
    "ffmpeg", "-y", "-i", raw_mp3,
    "-ar", "48000", "-ac", "1",
    wav_path
]
subprocess.run(cmd, check=True)
print(f"Converted to 48kHz WAV: {wav_path}")

# Parse ElevenLabs timestamps
alignment = result.get("alignment") or result.get("normalized_alignment")
words = []
if alignment:
    current = ""
    word_start = 0.0
    last_end = 0.0
    for ch, start, end in zip(alignment["characters"], alignment["character_start_times_seconds"], alignment["character_end_times_seconds"]):
        if ch.isspace():
            if current:
                words.append({"w": current, "s": round(word_start, 3), "e": round(last_end, 3)})
                current = ""
        else:
            if not current:
                word_start = start
            current += ch
            last_end = end
    if current:
        words.append({"w": current, "s": round(word_start, 3), "e": round(last_end, 3)})

total_words = len(words)
duration = words[-1]["e"] if words else 0.0
wps = total_words / duration if duration > 0 else 0.0
print(f"Alignment extracted: {total_words} words, duration: {duration:.2f}s, pace: {wps:.2f} words/sec")

words_path = os.path.join(VOICE_DIR, "words.json")
with open(words_path, "w", encoding="utf-8") as f:
    json.dump(words, f, indent=2)
print(f"Saved words.json: {words_path}")
