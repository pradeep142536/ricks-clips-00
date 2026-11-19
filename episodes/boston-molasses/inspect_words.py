import json
words = json.load(open(r"c:\Users\PC\Downloads\ricks clips\episodes\boston-molasses\voice\words.json", "r", encoding="utf-8"))
print(f"Total words: {len(words)}, dur: {words[-1]['e']}s")
for i, w in enumerate(words):
    clean = w["w"].lower().strip(".,!?\"'")
    if clean in ["boston", "molasses", "tank", "kids", "brown", "afternoon", "tsunami", "wave", "train", "concrete", "firefighters", "harbor", "pancakes"]:
        print(f"{i}: {w['w']} at {w['s']}s (f={int(w['s']*30)})")
