import json
words = json.load(open(r"c:\Users\PC\Downloads\ricks clips\episodes\boston-molasses\voice\words.json", "r", encoding="utf-8"))

sentences = []
cur_start = 0
for i, w in enumerate(words):
    if w["w"].endswith(".") or w["w"].endswith("?") or w["w"].endswith("!"):
        sentences.append((cur_start, i, " ".join(x["w"] for x in words[cur_start:i+1])))
        cur_start = i + 1

if cur_start < len(words):
    sentences.append((cur_start, len(words)-1, " ".join(x["w"] for x in words[cur_start:])))

print(f"Found {len(sentences)} sentences:")
for i, (a, b, t) in enumerate(sentences):
    print(f"{i+1}: [{a}, {b}] -> {t[:50]}...")
