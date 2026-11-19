import urllib.request, json, os

ep_dir = r"c:\Users\PC\Downloads\ricks clips\episodes\boston-molasses"
voice_dir = os.path.join(ep_dir, "voice")
os.makedirs(voice_dir, exist_ok=True)
raw_mp3 = os.path.join(voice_dir, "voice_raw.mp3")

api_key = "sk_0aaf67d0d0c8430779019872321b0c26a2a50cba9fff42a1"
# Adam: pNInz6obpgDQGcFmaJgB (Energetic American Storyteller)
voice_id = "pNInz6obpgDQGcFmaJgB"

script_text = (
    "In 1919, Boston wasn't destroyed by fire or an earthquake! "
    "It was swallowed by a 2-million-gallon tsunami of boiling molasses moving at thirty-five miles per hour! "
    "Down on Commercial Street stood a giant fifty-foot steel tank filled with fermenting syrup. "
    "It leaked so badly that neighborhood kids collected free syrup in buckets! "
    "The company's brilliant solution? "
    "They just painted the tank brown so nobody could see the leaks! "
    "Then, on an unseasonably warm January afternoon, the rivets popped like machine-gun fire! "
    "2.3 million gallons of dark, heavy syrup exploded outward in a towering 25-foot tidal wave! "
    "The wave ripped an elevated train track right off its steel girders, smashed entire wooden houses into kindling, "
    "and trapped people and horses in waist-deep, cooling syrup that hardened like concrete. "
    "Firefighters spent weeks pumping millions of gallons of seawater to scrub the city clean, turning Boston Harbor completely brown. "
    "And for decades after, locals swear on hot summer days, Boston still smelled like pancakes!"
)

payload = {
    "text": script_text,
    "model_id": "eleven_multilingual_v2",
    "voice_settings": {
        "stability": 0.40,
        "similarity_boost": 0.85,
        "style": 0.45,
        "use_speaker_boost": True
    }
}

req = urllib.request.Request(
    f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
    headers={
        "xi-api-key": api_key,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg"
    },
    data=json.dumps(payload).encode('utf-8')
)

print("Calling ElevenLabs with Adam (Energetic Storyteller)...")
with urllib.request.urlopen(req) as resp:
    audio_data = resp.read()
    with open(raw_mp3, "wb") as f:
        f.write(audio_data)

print(f"Saved Adam voice to {raw_mp3} ({len(audio_data)} bytes)")
