import json
import os

EP_DIR = os.path.dirname(os.path.abspath(__file__))
WORDS_PATH = os.path.join(EP_DIR, "voice", "words.json")
FILM_PATH = os.path.join(EP_DIR, "film.json")

with open(WORDS_PATH, "r", encoding="utf-8") as f:
    words = json.load(f)
for w in words:
    w["_k"] = w["w"].strip(" .,?!\"';:-").lower()

valid_keys = set(w["_k"] for w in words)
print(f"Loaded {len(words)} words, {len(valid_keys)} unique keys.")

sentences = [
    {"text": "In 1932, Australia waged war against twenty thousand birds—and lost.", "words": [0, 9], "subject": "major_meredith"},
    {"text": "Drought drove starving emu hordes into Western Australian wheat farms.", "words": [10, 19], "subject": "bird"},
    {"text": "They smashed wooden fences, ruined crops, and left holes for rabbits.", "words": [20, 30], "subject": "farmer"},
    {"text": "Desperate wheat farmers begged the government for military protection.", "words": [31, 39], "subject": "farmer"},
    {"text": "So the army sent Major Meredith, two gunners, and Lewis machine guns.", "words": [40, 51], "subject": "major_meredith"},
    {"text": "They carried ten thousand rounds, expecting easy target practice.", "words": [52, 60], "subject": "gunner"},
    {"text": "In Campion's red dirt, the soldiers set their deadly ambush.", "words": [61, 70], "subject": "gunner"},
    {"text": "Over a thousand giant birds marched toward their hidden trench.", "words": [71, 80], "subject": "gunner"},
    {"text": "The gunners waited for point-blank range, then opened rapid fire.", "words": [81, 90], "subject": "gunner"},
    {"text": "Suddenly, after just twelve rounds, the gun jammed completely solid.", "words": [91, 100], "subject": "gunner"},
    {"text": "The emus didn't freeze; they scattered instantly in ten directions.", "words": [101, 110], "subject": "bird"},
    {"text": "Next, the soldiers bolted a Lewis gun onto a rattling flatbed truck.", "words": [111, 122], "subject": "gunner"},
    {"text": "They roared across bumpy tracks, chasing sprinting birds at full throttle.", "words": [123, 133], "subject": "gunner"},
    {"text": "The ride was too wild to aim, and an emu smashed their steering gear.", "words": [134, 147], "subject": "gunner"},
    {"text": "The truck veered off the road and crashed straight through a fence.", "words": [148, 159], "subject": "gunner"},
    {"text": "You see, the emus were fighting organized guerrilla warfare.", "words": [160, 168], "subject": "major_meredith"},
    {"text": "Each small squad had a sentinel bird, warning the flock of danger.", "words": [169, 180], "subject": "bird"},
    {"text": "Major Meredith admitted the birds could tank bullets like tanks.", "words": [181, 190], "subject": "major_meredith"},
    {"text": "After thousands of rounds, the defeated army ordered a full retreat.", "words": [191, 201], "subject": "major_meredith"},
    {"text": "In parliament, an MP asked if the soldiers should receive medals.", "words": [202, 212], "subject": "farmer"},
    {"text": "Another member replied they should only award medals to the emus.", "words": [213, 223], "subject": "bird"}
]

film = {
    "title": "The Great Emu War of 1932",
    "fps": 30,
    "size": [1080, 1920],
    "kit3d": True,
    "card_emit": 1.0,
    "face_shadow": False,
    "costume_shade": {
        "amount": 0.24,
        "smooth": 4,
        "keep_drawn_light": True
    },
    "tween": {
        "frames": 4,
        "walk_frames": 4,
        "ease": "out",
        "idle": 0.75,
        "idle_s": 2.6
    },
    "post": {
        "dof": 0,
        "bloom": 0.14,
        "dust": 0,
        "vignette": 0.35
    },
    "faces_ep": {
        "squint": {"eyes": ["squint", "squint"], "brows": [[-4, 7, 0, 1.1], [-4, 7, 0, 1.1]], "mouth": "flat"},
        "squint_talk": {"eyes": ["squint", "squint"], "brows": [[-2, 5, 1, 1.05], [-1, 4, 1, 1.05]], "mouth": "talk"},
        "worried_clean": {"eyes": "bigOval", "brows": [[11, -11, 3, 1.1], [11, -11, 3, 1.1]], "mouth": "frownXL", "fx": ["sweat"]},
        "brow_talk": {"eyes": "oval", "brows": [[12, -2, 6, 1.05], [14, -2, 7, 1.05]], "mouth": "talk"},
        "brows_raised": {"eyes": "oval", "brows": [[13, -2, 7, 1.1], [15, -2, 8, 1.1]], "mouth": "o"}
    },
    "words": "voice/words.json",
    "puppet_pkg": [
        "cast",
        "../../templates/vector2d_characters/code"
    ],
    "camera_idea": {
        "name": "Outback Military Absurdity Flow",
        "why": "Unobstructed eye-level framing on Major Meredith's military hubris, the grounded parapet Lewis gun, the flatbed pursuit, and triumphant matte-feathered guerrilla emus."
    },
    "cast": {
        "major_meredith": {
            "puppet": "cast:emu/major_meredith",
            "height": 1.76,
            "heads_tall": 2.85,
            "clearance_radius": 0.25
        },
        "gunner": {
            "puppet": "cast:emu/gunner",
            "height": 1.70,
            "heads_tall": 2.80,
            "clearance_radius": 0.25
        },
        "farmer": {
            "puppet": "cast:emu/farmer",
            "height": 1.74,
            "heads_tall": 2.70,
            "clearance_radius": 0.25
        },
        "bird": {
            "puppet": "cast:emu/bird",
            "height": 1.85,
            "heads_tall": 3.20,
            "clearance_radius": 0.25
        }
    },
    "places": {
        "wheat_field": {
            "set": "wheat_field",
            "light": "day",
            "sky_kind": "clear-day",
            "backdrop": 9.0,
            "ground": [0.0, 0.0, 0.0]
        },
        "hq_map_room": {
            "set": "hq_map_room",
            "light": "interior",
            "sky_kind": "clear-day",
            "backdrop": 6.0,
            "ground": [0.0, 0.0, 0.0]
        },
        "ambush_trench": {
            "set": "ambush_trench",
            "light": "day",
            "sky_kind": "clear-day",
            "backdrop": 8.0,
            "ground": [0.0, 0.0, 0.0]
        },
        "dirt_track": {
            "set": "dirt_track",
            "light": "sunset",
            "sky_kind": "dusk-storm",
            "backdrop": 10.0,
            "ground": [0.0, 0.0, 0.0]
        },
        "broken_fence": {
            "set": "broken_fence",
            "light": "sunset",
            "sky_kind": "dusk-storm",
            "backdrop": 9.0,
            "ground": [0.0, 0.0, 0.0]
        },
        "parliament_floor": {
            "set": "parliament_floor",
            "light": "interior",
            "sky_kind": "clear-day",
            "backdrop": 6.0,
            "ground": [0.0, 0.0, 0.0]
        }
    },
    # Global Dot Ban: zero dust/bokeh entries in fx list; keep sharp event accents only
    "fx": [
        {"at": ["1932", 1], "kind": "glint", "pos": [-0.55, 0.0, 1.45]},
        {"at": ["smashed", 1], "kind": "clank_dust", "pos": [0.42, 2.15, 0.85]},
        {"at": ["expecting", 1], "kind": "glint", "pos": [0.25, 1.10, 1.02]},
        {"at": ["fire", 1], "kind": "spark", "pos": [0.25, 1.45, 1.02]},
        {"at": ["jammed", 1], "kind": "ring", "pos": [0.25, 1.05, 1.00]},
        {"at": ["crashed", 1], "kind": "clank_dust", "pos": [0.0, 1.5, 0.85]},
        {"at": ["medals", 1], "kind": "glint", "pos": [0.85, 0.75, 1.45]}
    ],
    "kicks": [
        {"at": ["smashed", 1], "amp": 1.3},
        {"at": ["fire", 1], "amp": 1.5},
        {"at": ["crashed", 1], "amp": 1.8}
    ],
    "moods": [
        {"at": 0, "light": "day", "color": [1.04, 0.96, 0.88]},
        {"at": ["war", 1], "light": "day", "color": [1.05, 0.95, 0.86]},
        {"at": ["hordes", 1], "light": "golden", "color": [1.07, 0.93, 0.82]},
        {"at": ["fences", 1], "light": "day", "color": [1.04, 0.95, 0.86]},
        {"at": ["farmers", 1], "light": "interior", "color": [1.06, 0.94, 0.84]},
        {"at": ["meredith", 1], "light": "interior", "color": [1.05, 0.94, 0.84]},
        {"at": ["ambush", 1], "light": "day", "color": [1.04, 0.95, 0.86]},
        {"at": ["fire", 1], "light": "day", "color": [1.08, 0.98, 0.88]},
        {"at": ["jammed", 1], "light": "day", "color": [0.99, 0.93, 0.89]},
        {"at": ["chasing", 1], "light": "sunset", "color": [0.98, 0.85, 0.88]},
        {"at": ["steering", 1], "light": "sunset", "color": [0.99, 0.83, 0.85]},
        {"at": ["crashed", 1], "light": "sunset", "color": [0.95, 0.83, 0.86]},
        {"at": ["warfare", 1], "light": "sunset", "color": [0.96, 0.85, 0.88]},
        {"at": ["retreat", 1], "light": "sunset", "color": [0.94, 0.82, 0.85]},
        {"at": ["medals", 1], "light": "interior", "color": [1.06, 0.96, 0.88]},
        {"at": ["award", 1], "light": "interior", "color": [1.08, 0.96, 0.86]}
    ],
    "sound": [
        {"at": 0, "name": "outback_wind", "gain": 0.90},
        {"at": ["1932", 1], "name": "impact", "gain": 0.85},
        {"at": ["smashed", 1], "name": "wood_snap", "gain": 1.15},
        {"at": ["fences", 1], "name": "emu_squawk", "gain": 1.05},
        {"at": ["farmers", 1], "name": "hq_radio_map", "gain": 1.00},
        {"at": ["expecting", 1], "name": "bolt_clack", "gain": 1.05},
        {"at": ["fire", 1], "name": "gunshot", "gain": 1.20},
        {"at": ["jammed", 1], "name": "metal_clank", "gain": 1.05},
        {"at": ["chasing", 1], "name": "engine_rev", "gain": 0.90},
        {"at": ["steering", 1], "name": "emu_squawk", "gain": 0.95},
        {"at": ["crashed", 1], "name": "crash", "gain": 1.15},
        {"at": ["sentinel", 1], "name": "emu_squawk", "gain": 0.90},
        {"at": ["medals", 1], "name": "bell", "gain": 0.75}
    ],
    "sentences": sentences,
    "takes": [
        # Take 1: Outback Wheat Field (0.0s to ~9.9s) -> ground-level over fg crates/fence/wheel (<20% sky)
        {
            "id": "t1",
            "place": "wheat_field",
            "stations": [
                {
                    "at": 0,
                    "pos": [-0.22, -2.75, 2.08],
                    "aim": [-0.05, 0.25, 0.88],
                    "lens": 28,
                    "subject": "major_meredith",
                    "framing": "W",
                    "shows": ["major_meredith", "gunner"],
                    "hold": 0.45
                },
                {
                    "at": ["war", 1],
                    "lead": 6,
                    "pos": [1.35, -3.10, 2.15],
                    "aim": [-0.10, 0.55, 0.58],
                    "lens": 30,
                    "subject": "major_meredith",
                    "framing": "W",
                    "shows": ["major_meredith", "bird"],
                    "word": "war",
                    "travel": 0.60,
                    "hold": 0.50
                },
                {
                    "at": ["Drought", 1],
                    "lead": 6,
                    "pos": [-0.85, -3.00, 2.08],
                    "aim": [-0.82, 0.20, 0.72],
                    "lens": 29,
                    "subject": "farmer",
                    "framing": "W",
                    "shows": ["farmer", "major_meredith"],
                    "word": "Drought",
                    "travel": 0.65,
                    "hold": 0.45
                },
                {
                    "at": ["hordes", 1],
                    "lead": 6,
                    "pos": [1.65, -3.15, 2.15],
                    "aim": [0.46, 0.85, 0.54],
                    "lens": 27,
                    "subject": "bird",
                    "framing": "P",
                    "shows": ["bird", "major_meredith"],
                    "word": "hordes",
                    "drift": [0.22, 0.0, 0.0],
                    "travel": 0.65,
                    "hold": 0.50
                },
                {
                    "at": ["smashed", 1],
                    "lead": 6,
                    "pos": [-0.45, -1.75, 1.98],
                    "aim": [-0.95, 1.15, 0.76],
                    "lens": 30,
                    "subject": "bird",
                    "framing": "O",
                    "shows": ["bird"],
                    "word": "smashed",
                    "travel": 0.65,
                    "hold": 0.45
                },
                {
                    "at": ["ruined", 1],
                    "lead": 6,
                    "pos": [-1.45, -2.85, 2.08],
                    "aim": [-1.28, -0.15, 0.88],
                    "lens": 29,
                    "subject": "farmer",
                    "framing": "W",
                    "shows": ["farmer"],
                    "word": "ruined",
                    "travel": 0.55,
                    "hold": 0.65
                }
            ]
        },

        # Take 2: Military HQ Map Room (~9.9s to ~15.0s) - 0:10 begging -> 0:13 Meredith reaction punch-in
        {
            "id": "t2",
            "place": "hq_map_room",
            "stations": [
                {
                    "at": ["farmers", 1],
                    "lead": 6,
                    "pos": [-0.65, -3.30, 1.45],
                    "aim": [-1.30, 0.90, 1.10],
                    "lens": 26,
                    "subject": "farmer",
                    "framing": "W",
                    "shows": ["farmer", "major_meredith"],
                    "word": "farmers",
                    "travel": 0.45,
                    "hold": 0.45
                },
                {
                    "at": ["military", 1],
                    "lead": 6,
                    "pos": [1.35, -1.45, 1.46],
                    "aim": [-0.15, 1.55, 1.16],
                    "lens": 28,
                    "subject": "major_meredith",
                    "framing": "W",
                    "shows": ["major_meredith", "farmer"],
                    "word": "military",
                    "travel": 0.60,
                    "hold": 0.45
                },
                {
                    "at": ["gunners", 1],
                    "lead": 6,
                    "pos": [-0.25, -0.35, 1.50],
                    "aim": [0.0, 2.25, 1.28],
                    "lens": 34,
                    "subject": "major_meredith",
                    "framing": "M",
                    "shows": ["major_meredith"],
                    "word": "gunners",
                    "travel": 0.60,
                    "hold": 0.60
                }
            ]
        },

        # Take 3: Ambush Trench (~14.95s to ~28.5s) - Ground-level over rear sandbags/crates/lantern (<20% sky)
        {
            "id": "t3",
            "place": "ambush_trench",
            "stations": [
                {
                    "at": ["They", 2],
                    "lead": 6,
                    "pos": [-1.45, -2.25, 1.92],
                    "aim": [0.18, 0.50, 0.58],
                    "lens": 30,
                    "subject": "gunner",
                    "framing": "W",
                    "shows": ["gunner"],
                    "word": "They",
                    "travel": 0.45,
                    "hold": 0.45
                },
                {
                    "at": ["expecting", 1],
                    "lead": 6,
                    "pos": [1.35, -1.75, 1.86],
                    "aim": [0.12, 0.70, 0.72],
                    "lens": 30,
                    "subject": "gunner",
                    "framing": "M",
                    "shows": ["gunner"],
                    "word": "expecting",
                    "travel": 0.60,
                    "hold": 0.50
                },
                {
                    "at": ["Campion's", 1],
                    "lead": 6,
                    "pos": [-0.45, -1.85, 1.92],
                    "aim": [0.22, 1.35, 0.48],
                    "lens": 30,
                    "subject": "gunner",
                    "framing": "O",
                    "shows": ["gunner"],
                    "word": "Campion's",
                    "travel": 0.55,
                    "hold": 0.60
                },
                {
                    "at": ["Over", 1],
                    "lead": 6,
                    "pos": [1.75, -2.45, 2.04],
                    "aim": [0.15, 1.25, 0.24],
                    "lens": 29,
                    "subject": "bird",
                    "framing": "W",
                    "shows": ["gunner"],
                    "word": "Over",
                    "travel": 0.95,
                    "hold": 0.65
                },
                {
                    "at": ["opened", 1],
                    "lead": 6,
                    "pos": [-1.25, -2.00, 1.86],
                    "aim": [0.18, 0.60, 0.62],
                    "lens": 30,
                    "subject": "gunner",
                    "framing": "O",
                    "shows": ["gunner"],
                    "word": "opened",
                    "travel": 0.95,
                    "hold": 0.65
                },
                {
                    "at": ["jammed", 1],
                    "lead": 6,
                    "pos": [1.20, -1.95, 1.86],
                    "aim": [0.14, 0.45, 0.72],
                    "lens": 30,
                    "subject": "gunner",
                    "framing": "M",
                    "shows": ["gunner"],
                    "word": "jammed",
                    "travel": 0.85,
                    "hold": 0.70
                }
            ]
        },

        # Take 4: Dirt Track & Flatbed Truck Chase (~28.5s to ~40.7s) - Trackside ground-level (<20% sky)
        {
            "id": "t4",
            "place": "dirt_track",
            "stations": [
                {
                    "at": ["scattered", 1],
                    "lead": 6,
                    "pos": [3.05, -3.95, 2.52],
                    "aim": [-0.85, 0.75, -0.05],
                    "lens": 29,
                    "subject": "bird",
                    "framing": "P",
                    "shows": ["bird", "gunner"],
                    "word": "scattered",
                    "drift": [0.20, 0.0, 0.0],
                    "creep": 0.0012,
                    "hold": 0.45
                },
                {
                    "at": ["chasing", 1],
                    "lead": 6,
                    "pos": [-3.85, -4.55, 2.48],
                    "aim": [-1.05, 1.10, 0.02],
                    "lens": 25,
                    "subject": "gunner",
                    "framing": "P",
                    "shows": ["gunner", "bird"],
                    "word": "chasing",
                    "drift": [0.24, 0.0, 0.0],
                    "creep": 0.0012,
                    "travel": 2.25,
                    "hold": 0.45
                },
                {
                    "at": ["steering", 1],
                    "lead": 6,
                    "pos": [1.15, -3.35, 2.46],
                    "aim": [-0.95, 0.80, 0.44],
                    "lens": 27,
                    "subject": "gunner",
                    "framing": "O",
                    "shows": ["gunner", "bird"],
                    "word": "steering",
                    "travel": 3.10,
                    "hold": 0.70
                }
            ]
        },

        # Take 5: Broken Fence Crash & Guerrilla Tactics (~40.7s to ~52.2s) - Separated cast + fg props (<20% sky)
        {
            "id": "t5",
            "place": "broken_fence",
            "stations": [
                {
                    "at": ["crashed", 1],
                    "lead": 6,
                    "pos": [0.35, -3.65, 2.18],
                    "aim": [-0.08, 0.35, 0.52],
                    "lens": 28,
                    "subject": "gunner",
                    "framing": "W",
                    "shows": ["gunner", "major_meredith"],
                    "word": "crashed",
                    "travel": 0.55,
                    "hold": 0.65
                },
                {
                    "at": ["warfare", 1],
                    "lead": 6,
                    "pos": [-1.35, -2.65, 2.06],
                    "aim": [-0.52, -0.05, 0.90],
                    "lens": 30,
                    "subject": "major_meredith",
                    "framing": "W",
                    "shows": ["major_meredith"],
                    "word": "warfare",
                    "travel": 0.90,
                    "hold": 0.65
                },
                {
                    "at": ["sentinel", 1],
                    "lead": 6,
                    "pos": [1.95, -2.35, 2.08],
                    "aim": [1.45, 0.35, 0.90],
                    "lens": 30,
                    "subject": "bird",
                    "framing": "M",
                    "shows": ["bird"],
                    "word": "sentinel",
                    "travel": 0.85,
                    "hold": 0.70
                },
                {
                    "at": ["bullets", 1],
                    "lead": 6,
                    "pos": [-0.85, -3.05, 2.12],
                    "aim": [0.28, 0.25, 0.72],
                    "lens": 28,
                    "subject": "major_meredith",
                    "framing": "W",
                    "shows": ["major_meredith", "bird"],
                    "word": "bullets",
                    "travel": 0.90,
                    "hold": 0.80
                }
            ]
        },

        # Take 6: Parliament Inquiry & Victorious Emu Punchline (~52.2s to 58.18s)
        {
            "id": "t6",
            "place": "parliament_floor",
            "stations": [
                {
                    "at": ["retreat", 1],
                    "lead": 6,
                    "pos": [-0.75, -2.85, 1.45],
                    "aim": [-0.35, 0.85, 1.08],
                    "lens": 26,
                    "subject": "major_meredith",
                    "framing": "W",
                    "shows": ["major_meredith"],
                    "word": "retreat",
                    "travel": 0.65,
                    "hold": 0.75
                },
                {
                    "at": ["medals", 1],
                    "lead": 6,
                    "pos": [1.55, -2.25, 1.42],
                    "aim": [0.65, 0.85, 1.18],
                    "lens": 28,
                    "subject": "farmer",
                    "framing": "W",
                    "shows": ["farmer"],
                    "word": "medals",
                    "travel": 0.75,
                    "hold": 0.75
                },
                {
                    "at": ["award", 1],
                    "lead": 6,
                    "pos": [-0.65, -2.25, 1.44],
                    "aim": [-0.15, 0.25, 1.22],
                    "lens": 30,
                    "subject": "bird",
                    "framing": "M",
                    "shows": ["bird"],
                    "word": "award",
                    "travel": 0.75,
                    "hold": 1.20
                }
            ]
        }
    ],
    "acts": [
        # --- Major Meredith (brief <=0.8s jawdrop beats, varied worried/squint/brow_talk/lip-sync) ---
        {"who": "major_meredith", "at": 0, "pos": [-0.55, 0.0, 0.0], "view": "front", "dir": 1, "face": "k:talk", "pose": "stand", "say": [0, 3], "visible": True},
        {"who": "major_meredith", "at": ["war", 1], "pos": [-0.40, 0.05, 0.0], "face": "jawdrop", "pose": "point_out", "dir": 1, "facing": [0.35, -0.9]},
        {"who": "major_meredith", "at": ["thousand", 1], "pos": [-0.20, 0.0, 0.0], "walk": True, "face": "k:worried_clean", "pose": "point_out", "dir": 1, "facing": [0.45, -0.85]},
        {"who": "major_meredith", "at": ["Drought", 1], "pos": [-0.20, 0.0, 0.0], "face": "k:squint_talk", "pose": "hands_hips", "say": [10, 12], "dir": 1, "facing": [0.15, -0.95]},
        {"who": "major_meredith", "at": ["hordes", 1], "pos": [-0.10, -0.05, 0.0], "face": "jawdrop", "pose": "tiltL", "dir": 1, "facing": [0.0, -1.0]},
        {"who": "major_meredith", "at": ["Australian", 1], "pos": [-0.10, -0.05, 0.0], "face": "k:worried_clean", "pose": "point_out", "say": [17, 19], "dir": 1, "facing": [0.15, -0.95]},
        {"who": "major_meredith", "at": ["smashed", 1], "pos": [0.45, 2.25, 0.0], "visible": False},
        # HQ Map Room: cleanly BEHIND map_table (table spans y = 0.96..1.74; Meredith at y = 2.25)
        {"who": "major_meredith", "at": ["farmers", 1], "pos": [0.45, 2.25, 0.0], "face": "k:brows_raised", "pose": "stand", "dir": -1, "facing": [-0.55, -0.80], "visible": True},
        {"who": "major_meredith", "at": ["government", 1], "pos": [0.45, 2.25, 0.0], "face": "k:skeptical", "pose": "hand_mouth", "dir": -1, "facing": [-0.45, -0.85]},
        {"who": "major_meredith", "at": ["sent", 1], "pos": [0.0, 2.25, 0.0], "walk": True, "face": "k:brow_talk", "pose": "hands_hips", "say": [44, 46], "dir": 1, "facing": [0.0, -1.0]},
        {"who": "major_meredith", "at": ["gunners", 1], "pos": [0.0, 2.25, 0.0], "face": "k:smirk", "pose": "finger_up", "dir": 1, "facing": [0.0, -1.0]},
        {"who": "major_meredith", "at": ["They", 2], "visible": False},
        # Broken Fence & Guerrilla Tactics
        {"who": "major_meredith", "at": ["crashed", 1], "pos": [-0.65, -0.25, 0.0], "face": "k:worried_clean", "pose": "stand", "dir": 1, "facing": [0.25, -0.95], "visible": True},
        {"who": "major_meredith", "at": ["warfare", 1], "pos": [-0.55, -0.25, 0.0], "face": "sus", "pose": "shrug", "dir": 1, "facing": [0.0, -1.0]},
        {"who": "major_meredith", "at": ["squad", 1], "pose": "point_out", "face": "k:squint_talk", "dir": 1},
        {"who": "major_meredith", "at": ["bullets", 1], "pos": [-0.55, -0.25, 0.0], "face": "jawdrop", "pose": "tiltL", "dir": 1},
        {"who": "major_meredith", "at": ["tanks", 1], "pos": [-0.55, -0.25, 0.0], "face": "k:brows_raised", "pose": "hand_mouth", "dir": 1},
        # Parliament Floor (well clear of central lectern & MP)
        {"who": "major_meredith", "at": ["retreat", 1], "pos": [-0.95, 0.45, 0.0], "face": "bruh", "pose": "stand", "dir": 1, "facing": [0.35, -0.90], "visible": True},
        {"who": "major_meredith", "at": ["medals", 1], "visible": False},

        # --- Gunner ---
        {"who": "gunner", "at": 0, "pos": [0.55, 0.0, 0.0], "face": "k:squint", "pose": "stand", "dir": -1, "facing": [-0.55, -0.85], "visible": True},
        {"who": "gunner", "at": ["war", 1], "visible": False},
        {"who": "gunner", "at": ["farmers", 1], "pos": [0.14, 0.14, -0.22], "visible": False},
        # Ambush Trench: squarely BEHIND Lewis gun ([0.25, 1.02, 0.60]) aiming forward (+Y) toward emus
        {"who": "gunner", "at": ["They", 2], "pos": [0.14, 0.14, -0.22], "face": "k:squint", "pose": "hold_out", "view": "34", "dir": 1, "visible": True},
        {"who": "gunner", "at": ["expecting", 1], "pos": [0.14, 0.14, -0.22], "face": "k:squint_talk", "pose": "grip_two", "say": [57, 60], "view": "34", "dir": 1},
        {"who": "gunner", "at": ["Campion's", 1], "pos": [0.14, 0.14, -0.22], "face": "k:squint", "pose": "hold_out", "view": "back", "dir": 1},
        {"who": "gunner", "at": ["Over", 1], "pos": [0.14, 0.14, -0.22], "face": "k:brows_raised", "pose": "hold_out", "view": "34", "dir": -1},
        {"who": "gunner", "at": ["gunners", 2], "face": "k:squint", "pose": "lean_in", "view": "34", "dir": 1},
        {"who": "gunner", "at": ["opened", 1], "face": "strain", "pose": "hold_out", "view": "34", "dir": 1},
        {"who": "gunner", "at": ["suddenly", 1], "face": "k:worried_clean", "pose": "hold_out", "view": "34", "dir": 1},
        {"who": "gunner", "at": ["jammed", 1], "face": "jawdrop", "pose": "shrug", "view": "front", "dir": 1},
        {"who": "gunner", "at": ["solid", 1], "face": "k:frustrated", "pose": "hands_hips", "view": "front", "dir": 1},
        {"who": "gunner", "at": ["freeze", 1], "pos": [-0.25, -0.48, 0.89], "visible": False},
        # Dirt Track: standing cleanly inside open rear truck flatbed deck [-0.25, -0.48, 0.89]
        {"who": "gunner", "at": ["chasing", 1], "pos": [-0.25, -0.48, 0.89], "ride": True, "face": "jawdrop", "pose": "hold_out", "dir": -1, "facing": [-0.85, -0.45], "visible": True},
        {"who": "gunner", "at": ["birds", 2], "pos": [-0.25, -0.48, 0.89], "ride": True, "face": "k:squint", "pose": "hold_out", "dir": -1, "facing": [-0.85, -0.45]},
        {"who": "gunner", "at": ["steering", 1], "pos": [-0.25, -0.48, 0.89], "ride": True, "face": "strain", "pose": "tiltL", "dir": -1, "facing": [-0.75, -0.60]},
        # Broken Fence
        {"who": "gunner", "at": ["crashed", 1], "pos": [0.45, -0.35, 0.0], "face": "bruh", "pose": "tiltL", "dir": 1, "facing": [0.25, -0.95], "visible": True},
        {"who": "gunner", "at": ["warfare", 1], "visible": False},

        # --- Farmer (shifted 0.6m forward/left to [-1.35, -0.60] in wheat_field; zero fence/soldier clip!) ---
        {"who": "farmer", "at": 0, "pos": [-1.35, -0.60, 0.0], "view": "front", "dir": 1, "face": "standard", "pose": "stand", "visible": False},
        {"who": "farmer", "at": ["birds—and", 1], "pos": [-1.35, -0.60, 0.0], "face": "k:worried_clean", "pose": "point_up", "visible": True, "dir": 1, "facing": [0.40, -0.90]},
        {"who": "farmer", "at": ["Drought", 1], "pos": [-1.35, -0.60, 0.0], "face": "k:squint", "pose": "point_out", "visible": True, "dir": 1, "facing": [0.45, -0.85]},
        {"who": "farmer", "at": ["smashed", 1], "visible": False},
        {"who": "farmer", "at": ["ruined", 1], "pos": [-1.35, -0.60, 0.0], "face": "jawdrop", "pose": "point_out", "visible": True, "dir": 1, "facing": [0.15, -0.95]},
        {"who": "farmer", "at": ["left", 1], "pos": [-1.35, -0.60, 0.0], "face": "k:worried_clean", "pose": "point_up", "say": [27, 30], "dir": 1, "facing": [0.15, -0.95]},
        # HQ Map Room: cleanly IN FRONT-LEFT of table (`[-0.95, 0.35, 0.0]`, 2.36m from Meredith!)
        {"who": "farmer", "at": ["farmers", 1], "pos": [-0.95, 0.35, 0.0], "face": "k:worried_clean", "pose": "point_out", "say": [32, 35], "visible": True, "dir": 1, "facing": [0.55, 0.80]},
        {"who": "farmer", "at": ["government", 1], "pos": [-0.95, 0.35, 0.0], "face": "k:nervous", "pose": "hand_mouth", "say": [36, 39], "dir": 1, "facing": [0.55, 0.80]},
        {"who": "farmer", "at": ["sent", 1], "visible": False},
        # Parliament MP at right of lectern `[0.85, 0.75, 0.0]`
        {"who": "farmer", "at": ["medals", 1], "pos": [0.85, 0.75, 0.0], "face": "k:smirk", "pose": "hands_hips", "visible": True, "dir": -1, "facing": [-0.30, -0.95]},
        {"who": "farmer", "at": ["award", 1], "visible": False},

        # --- Emu Bird (Always keep 3/4 or front face, NEVER back-of-head grey dome!) ---
        {"who": "bird", "at": 0, "pos": [1.65, 1.35, 0.0], "visible": False, "face": "standard", "pose": "walk0"},
        {"who": "bird", "at": ["against", 1], "pos": [1.65, 1.35, 0.0], "face": "k:smirk", "pose": "walk0", "view": "34", "dir": -1, "visible": True},
        {"who": "bird", "at": ["hordes", 1], "pos": [0.55, 1.25, 0.0], "face": "k:angry", "pose": "walk1", "view": "34", "dir": -1, "visible": True},
        {"who": "bird", "at": ["smashed", 1], "pos": [-1.65, 1.15, 0.0], "face": "k:angry", "pose": "cheer", "view": "34", "dir": 1, "visible": True},
        {"who": "bird", "at": ["ruined", 1], "pos": [-2.85, 1.4, 0.0], "visible": False},
        # Dirt Track: left flank lane (`x <= -2.55`, completely clear of truck & gunner!)
        {"who": "bird", "at": ["scattered", 1], "pos": [-2.85, 1.4, 0.0], "face": "k:smirk", "pose": "walk1", "look": [-2.5, -8.0, 0.0], "visible": True},
        {"who": "bird", "at": ["chasing", 1], "pos": [-2.95, 2.2, 0.0], "face": "k:smirk", "pose": "walk0", "look": [-2.5, -8.0, 0.0], "visible": True},
        {"who": "bird", "at": ["steering", 1], "pos": [-2.55, 2.8, 0.0], "face": "k:angry", "pose": "walk1", "look": [-2.5, -8.0, 0.0]},
        {"who": "bird", "at": ["crashed", 1], "pos": [1.55, 0.25, 0.0], "visible": False},
        {"who": "bird", "at": ["sentinel", 1], "pos": [1.55, 0.25, 0.0], "face": "standard", "pose": "stand", "visible": True, "dir": -1, "facing": [-0.25, -0.95]},
        {"who": "bird", "at": ["bullets", 1], "pos": [0.95, 0.35, 0.0], "walk": True, "face": "k:smirk", "pose": "walk0", "visible": True, "dir": 1, "facing": [-0.35, -0.90]},
        {"who": "bird", "at": ["retreat", 1], "visible": False},
        {"who": "bird", "at": ["award", 1], "pos": [-0.15, 0.25, 0.0], "face": "k:smirk", "pose": "stand", "visible": True, "dir": 1, "facing": [0.0, -1.0]}
    ]
}

# Character performance is authored against the same word indices as the
# narration.  The scene subject becomes the storyteller for that sentence:
# their mouth receives the five-viseme track, while short reactions land on
# the specific story word.  This prevents a card from simply sliding through
# a detailed 3D set with one unchanging face.
performance_cues = [
    # Hook / damaged farm: Meredith starts confident, the farmer owns the loss.
    {"who": "major_meredith", "at": 0, "say": [0, 9], "speaking": True},
    {"who": "major_meredith", "at": ["lost", 1], "face": "bruh", "pose": "shrug", "headTilt": 8},
    {"who": "farmer", "at": ["Drought", 1], "say": [10, 19], "speaking": True},
    {"who": "farmer", "at": ["drove", 1], "face": "k:worried_clean", "pose": "flinch", "lookAt": [0.6, 1.1, 0.8]},
    {"who": "farmer", "at": ["hordes", 1], "face": "jawdrop", "pose": "point_out", "headTilt": -9},
    {"who": "farmer", "at": ["smashed", 1], "say": [20, 30], "speaking": True},
    {"who": "farmer", "at": ["fences", 1], "face": "k:worried_clean", "pose": "flinch", "lookAt": [-0.9, 1.0, 0.7]},
    {"who": "farmer", "at": ["holes", 1], "face": "jawdrop", "pose": "point_up", "headTilt": 10},

    # Headquarters: the farmer pleads; Meredith's confidence reads as a
    # performance beat rather than a frozen card.
    {"who": "farmer", "at": ["Desperate", 1], "say": [31, 39], "speaking": True},
    {"who": "farmer", "at": ["begged", 1], "face": "k:nervous", "pose": "hand_mouth", "headTilt": 7},
    {"who": "major_meredith", "at": ["So", 1], "say": [40, 51], "speaking": True},
    {"who": "major_meredith", "at": ["Major", 1], "face": "k:smirk", "pose": "hands_hips", "headTilt": -7},
    {"who": "major_meredith", "at": ["Lewis", 1], "face": "k:brow_talk", "pose": "finger_up", "lookAt": [0.25, 1.4, 1.0]},

    # Ambush: the gunner talks through the plan, then plays the jam as a
    # physical change from aiming, to firing, to shocked frustration.
    {"who": "gunner", "at": ["They", 2], "say": [52, 60], "speaking": True},
    {"who": "gunner", "at": ["rounds", 1], "face": "k:smirk", "pose": "hold_out", "headTilt": -5},
    {"who": "gunner", "at": ["Campion's", 1], "say": [61, 70], "speaking": True},
    {"who": "gunner", "at": ["deadly", 1], "face": "k:squint", "pose": "lean_in", "lookAt": [0.15, 2.0, 0.6]},
    {"who": "gunner", "at": ["Over", 1], "say": [71, 80], "speaking": True},
    {"who": "gunner", "at": ["marched", 1], "face": "k:brows_raised", "pose": "hold_out", "headTilt": 6},
    {"who": "gunner", "at": ["The", 2], "say": [81, 90], "speaking": True},
    {"who": "gunner", "at": ["waited", 1], "face": "k:squint", "pose": "lean_in", "headTilt": 5},
    {"who": "gunner", "at": ["fire", 1], "face": "strain", "pose": "hold_out", "headTilt": -6},
    {"who": "gunner", "at": ["Suddenly", 1], "say": [91, 100], "speaking": True},
    {"who": "gunner", "at": ["jammed", 1], "face": "jawdrop", "pose": "flinch", "headTilt": 10},

    # Chase: the emu is a moving actor, not a card translated across screen.
    {"who": "bird", "at": ["The", 3], "say": [101, 110], "speaking": True},
    {"who": "bird", "at": ["scattered", 1], "face": "k:angry", "pose": "walk1", "walk": True, "headTilt": -6},
    {"who": "gunner", "at": ["Next", 1], "say": [111, 122], "speaking": True},
    {"who": "gunner", "at": ["bolted", 1], "face": "strain", "pose": "lean_in", "headTilt": 5},
    {"who": "gunner", "at": ["They", 3], "say": [123, 133], "speaking": True},
    {"who": "gunner", "at": ["roared", 1], "face": "k:squint", "pose": "hold_out", "headTilt": -5},
    {"who": "bird", "at": ["sprinting", 1], "face": "k:angry", "pose": "walk0", "walk": True, "headTilt": 5},
    {"who": "gunner", "at": ["The", 4], "say": [134, 147], "speaking": True},
    {"who": "gunner", "at": ["wild", 1], "face": "jawdrop", "pose": "flinch", "headTilt": 11},
    {"who": "bird", "at": ["steering", 1], "face": "k:angry", "pose": "walk1", "walk": True, "headTilt": -8},
    {"who": "gunner", "at": ["The", 5], "say": [148, 159], "speaking": True},
    {"who": "gunner", "at": ["veered", 1], "face": "k:worried_clean", "pose": "flinch", "headTilt": 9},

    # The ending alternates between Meredith's embarrassed admission and the
    # bird's victorious reaction instead of leaving either one expressionless.
    {"who": "major_meredith", "at": ["You", 1], "say": [160, 168], "speaking": True},
    {"who": "major_meredith", "at": ["guerrilla", 1], "face": "sus", "pose": "shrug", "headTilt": 9},
    {"who": "bird", "at": ["Each", 1], "say": [169, 180], "speaking": True},
    {"who": "bird", "at": ["sentinel", 1], "face": "k:smirk", "pose": "point_up", "headTilt": -7},
    {"who": "major_meredith", "at": ["Major", 2], "say": [181, 201], "speaking": True},
    {"who": "major_meredith", "at": ["tank", 1], "face": "jawdrop", "pose": "flinch", "headTilt": 10},
    {"who": "major_meredith", "at": ["retreat", 1], "face": "bruh", "pose": "slump", "headTilt": 12},
    {"who": "farmer", "at": ["In", 4], "say": [202, 212], "speaking": True},
    {"who": "farmer", "at": ["asked", 1], "face": "k:brows_raised", "pose": "finger_up", "headTilt": -6},
    {"who": "bird", "at": ["Another", 1], "say": [213, 223], "speaking": True},
    {"who": "bird", "at": ["emus", 2], "face": "k:smirk", "pose": "cheer", "headTilt": -8},
]
film["acts"].extend(performance_cues)

with open(FILM_PATH, "w", encoding="utf-8") as f:
    json.dump(film, f, indent=2)

print(f"Film plan updated successfully in {FILM_PATH}")
