import urllib.request
import json
import os

api_key = "sk_0aaf67d0d0c8430779019872321b0c26a2a50cba9fff42a1"
# George: JBFqnCBsd6RMkjVDRZzb (warm, energetic, British/storyteller style)
voice_id = "JBFqnCBsd6RMkjVDRZzb"

url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"

script_text = (
    "In 1919, Boston wasn't destroyed by fire or an earthquake. "
    "It was swallowed by a two-million-gallon tsunami of boiling molasses moving at thirty-five miles per hour. "
    "Down on Commercial Street stood a giant fifty-foot steel tank filled with fermenting syrup. "
    "It leaked so badly that neighborhood kids collected free syrup in buckets. "
    "The company's brilliant solution? They just painted the tank brown so nobody could see the leaks. "
    "Then, on an unseasonably warm January afternoon, the rivets popped like machine-gun fire. "
    "Two point three million gallons of dark, heavy syrup exploded outward in a towering twenty-five-foot tidal wave! "
    "The wave ripped an elevated train track right off its steel girders, smashed entire wooden houses into kindling, "
    "and trapped people and horses in waist-deep, cooling syrup that hardened like concrete. "
    "Firefighters spent weeks pumping millions of gallons of seawater to scrub the city clean, turning Boston Harbor completely brown. "
    "And for decades after, locals swear on hot summer days, Boston still smelled like pancakes."
)

headers = {
    "xi-api-key": api_key,
    "Content-Type": "application/json"
}

payload = {
    "text": script_text,
    "model_id": "eleven_turbo_v2_5",
    "voice_settings": {
        "stability": 0.45,
        "similarity_boost": 0.85,
        "style": 0.35,
        "use_speaker_boost": True
    }
}

out_dir = r"c:\Users\PC\Downloads\ricks clips\episodes\boston-molasses\voice"
raw_path = os.path.join(out_dir, "voice_raw.mp3")

print("Requesting speech from ElevenLabs...")
req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=headers)
with urllib.request.urlopen(req) as resp:
    audio_data = resp.read()
    with open(raw_path, "wb") as f:
        f.write(audio_data)

print(f"Saved {len(audio_data)} bytes to {raw_path}")
