"""Generate three ElevenLabs voice auditions using only ELEVENLABS_API_KEY.

Run this from the same shell where the variable is configured. The key is never
printed or written to a file.
"""
import json
import os
import pathlib
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent
OUT = ROOT / "voice_tests"
KEY = os.environ.get("ELEVENLABS_API_KEY")
if not KEY:
    raise SystemExit("ELEVENLABS_API_KEY is not available in this shell")

text = (ROOT / "voice_text.txt").read_text(encoding="utf-8").splitlines()[0]
request = urllib.request.Request(
    "https://api.elevenlabs.io/v1/voices",
    headers={"xi-api-key": KEY, "Accept": "application/json"},
)
with urllib.request.urlopen(request, timeout=30) as response:
    voices = json.load(response).get("voices", [])

preferred = ["Adam", "Antoni", "Rachel", "George", "Josh"]
chosen = []
for wanted in preferred:
    for voice in voices:
        if voice.get("name", "").lower() == wanted.lower() and voice not in chosen:
            chosen.append(voice)
            break
for voice in voices:
    if voice not in chosen and len(chosen) < 3:
        chosen.append(voice)
if len(chosen) < 3:
    raise SystemExit("ElevenLabs returned fewer than three voices")

OUT.mkdir(exist_ok=True)
manifest = []
for index, voice in enumerate(chosen[:3], 1):
    voice_id = voice["voice_id"]
    payload = json.dumps({
        "text": text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {
            "stability": 0.35,
            "similarity_boost": 0.78,
            "style": 0.55,
            "use_speaker_boost": True,
        },
    }).encode("utf-8")
    request = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}?output_format=mp3_44100_128",
        data=payload,
        headers={"xi-api-key": KEY, "Content-Type": "application/json", "Accept": "audio/mpeg"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=90) as response:
        (OUT / f"voice_{index}_{voice.get('name','voice')}.mp3").write_bytes(response.read())
    manifest.append({"slot": index, "name": voice.get("name"), "voice_id": voice_id})

(OUT / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
print("Generated three voice auditions in:", OUT)
for item in manifest:
    print(f"{item['slot']}: {item['name']}")
