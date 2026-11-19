import json
import os
import sys

ep_dir = r"c:\Users\PC\Downloads\ricks clips\episodes\boston-molasses"
film_path = os.path.join(ep_dir, "film.json")

film = {
    "title": "The 1919 Boston Great Molasses Flood",
    "fps": 30,
    "size": [1080, 1920],
    "camera_idea": {
        "name": "Industrial Disaster Flow",
        "why": "Cinematic wide push-ins on the massive tank, rapid dive into the surging tsunami, tracking waist-deep flooded streets, and sweeping wide harbor aftermath."
    },
    "cast": {
        "narrator": {
            "puppet": "cast:standard",
            "height": 1.72,
            "heads_tall": 2.8
        },
        "executive": {
            "puppet": "cast:construction",
            "height": 1.78,
            "heads_tall": 2.7
        },
        "worker": {
            "puppet": "cast:prospector",
            "height": 1.68,
            "heads_tall": 2.85
        }
    },
    "places": {
        "tank_yard": {
            "backdrop": 7.0,
            "ground": [0.0, 0.0, 0.0]
        },
        "molasses_wave": {
            "backdrop": 7.0,
            "ground": [0.0, 0.0, 0.0]
        },
        "flooded_street": {
            "backdrop": 7.0,
            "ground": [0.0, 0.0, 0.0]
        },
        "harbor_clean": {
            "backdrop": 7.0,
            "ground": [0.0, 0.0, 0.0]
        }
    },
    "fx": [
        {"at": ["tsunami", 1], "type": "glint", "pos": [0.0, 0.0, 1.2]},
        {"at": ["tank", 1], "type": "glow", "pos": [0.0, 0.0, 1.2]},
        {"at": ["kids", 1], "type": "dust", "pos": [2.0, 0.0, 0.2]},
        {"at": ["brown", 1], "type": "stamp", "pos": [-1.5, 0.0, 1.2]},
        {"at": ["wave", 1], "type": "splash", "pos": [0.0, 0.0, 1.5]},
        {"at": ["train", 1], "type": "dust", "pos": [0.0, 0.0, 1.0]},
        {"at": ["concrete", 1], "type": "stamp", "pos": [1.0, 0.0, 0.5]},
        {"at": ["Firefighters", 1], "type": "splash", "pos": [-1.0, 0.0, 1.0]},
        {"at": ["harbor", 1], "type": "glow", "pos": [1.0, 0.0, 1.0]},
        {"at": ["pancakes", 1], "type": "glint", "pos": [0.0, 0.0, 1.2]}
    ],
    "moods": [
        {"at": 0, "light": "day", "color": [1.0, 0.98, 0.95]},
        {"at": ["tsunami", 1], "light": "golden", "color": [1.05, 0.92, 0.82]},
        {"at": ["wave", 1], "light": "storm", "color": [0.85, 0.82, 0.90]},
        {"at": ["concrete", 1], "light": "dusk", "color": [0.95, 0.80, 0.75]},
        {"at": ["Firefighters", 1], "light": "morning", "color": [0.90, 0.95, 1.05]},
        {"at": ["pancakes", 1], "light": "golden", "color": [1.08, 0.96, 0.85]}
    ],
    "takes": [
        # Take 1: The Commercial Street Tank (Lines 1-6, f 0 - 740)
        {
            "id": "t1",
            "place": "tank_yard",
            "stations": [
                {
                    "at": 0,
                    "pos": [-1.2, -2.5, 0.75],
                    "aim": [-1.2, 0.0, 1.05],
                    "lens": 24,
                    "subject": "narrator",
                    "framing": "W",
                    "shows": ["tank"],
                    "hold": 0.0
                },
                {
                    "at": ["tsunami", 1],
                    "lead": 5,
                    "pos": [3.2, -2.5, 0.75],
                    "aim": [3.2, 0.0, 1.05],
                    "lens": 24,
                    "subject": "narrator",
                    "framing": "W",
                    "shows": ["tank"],
                    "word": "tsunami",
                    "travel": 1.1,
                    "hold": 0.6
                },
                {
                    "at": ["tank", 1],
                    "lead": 5,
                    "pos": [-2.0, -2.5, 0.75],
                    "aim": [-2.0, 0.0, 1.05],
                    "lens": 24,
                    "subject": "narrator",
                    "framing": "W",
                    "shows": ["tank"],
                    "word": "tank",
                    "travel": 1.1,
                    "hold": 0.6
                },
                {
                    "at": ["kids", 1],
                    "lead": 5,
                    "pos": [3.2, -2.5, 0.75],
                    "aim": [3.2, 0.0, 1.05],
                    "lens": 24,
                    "subject": "worker",
                    "framing": "W",
                    "shows": ["tank"],
                    "word": "kids",
                    "travel": 1.1,
                    "hold": 0.6
                },
                {
                    "at": ["brown", 1],
                    "lead": 5,
                    "pos": [-2.8, -2.5, 0.75],
                    "aim": [-2.8, 0.0, 1.05],
                    "lens": 24,
                    "subject": "executive",
                    "framing": "W",
                    "shows": ["tank"],
                    "word": "brown",
                    "travel": 1.1,
                    "hold": 0.6
                }
            ]
        },
        # Take 2: The Rupture & The 25-Foot Molasses Wave (Lines 7-8, f 741 - 1090)
        {
            "id": "t2",
            "place": "molasses_wave",
            "stations": [
                {
                    "at": 741,
                    "pos": [-3.8, -2.5, 0.75],
                    "aim": [-3.8, 0.0, 1.05],
                    "lens": 24,
                    "subject": "narrator",
                    "framing": "W",
                    "shows": ["wave"],
                    "hold": 0.0
                },
                {
                    "at": ["afternoon", 1],
                    "lead": 5,
                    "pos": [0.0, -2.2, 0.85],
                    "aim": [0.0, 0.0, 1.05],
                    "lens": 24,
                    "subject": "narrator",
                    "framing": "W",
                    "shows": ["wave"],
                    "word": "afternoon",
                    "travel": 1.2,
                    "hold": 0.5
                },
                {
                    "at": ["wave", 1],
                    "lead": 5,
                    "pos": [3.8, -2.5, 0.75],
                    "aim": [3.8, 0.0, 1.05],
                    "lens": 24,
                    "subject": "narrator",
                    "framing": "W",
                    "shows": ["wave"],
                    "word": "wave",
                    "travel": 1.2,
                    "hold": 0.6
                }
            ]
        },
        # Take 3: The Destruction & Sticky Concrete Trap (Line 9, f 1091 - 1420)
        {
            "id": "t3",
            "place": "flooded_street",
            "stations": [
                {
                    "at": 1091,
                    "pos": [-3.6, -2.5, 0.75],
                    "aim": [-3.6, 0.0, 1.05],
                    "lens": 24,
                    "subject": "worker",
                    "framing": "W",
                    "shows": ["street"],
                    "hold": 0.0
                },
                {
                    "at": ["train", 1],
                    "lead": 5,
                    "pos": [0.0, -2.2, 0.85],
                    "aim": [0.0, 0.0, 1.05],
                    "lens": 24,
                    "subject": "worker",
                    "framing": "W",
                    "shows": ["street"],
                    "word": "train",
                    "travel": 1.2,
                    "hold": 0.5
                },
                {
                    "at": ["concrete", 1],
                    "lead": 5,
                    "pos": [3.6, -2.5, 0.75],
                    "aim": [3.6, 0.0, 1.05],
                    "lens": 24,
                    "subject": "worker",
                    "framing": "W",
                    "shows": ["street"],
                    "word": "concrete",
                    "travel": 1.2,
                    "hold": 0.6
                }
            ]
        },
        # Take 4: Seawater Clean-Up & Pancake Scent (Lines 10-11, f 1421 - 1818)
        {
            "id": "t4",
            "place": "harbor_clean",
            "stations": [
                {
                    "at": 1421,
                    "pos": [-3.2, -2.5, 0.75],
                    "aim": [-3.2, 0.0, 1.05],
                    "lens": 24,
                    "subject": "executive",
                    "framing": "W",
                    "shows": ["harbor"],
                    "hold": 0.0
                },
                {
                    "at": ["harbor", 1],
                    "lead": 5,
                    "pos": [2.8, -2.5, 0.75],
                    "aim": [2.8, 0.0, 1.05],
                    "lens": 24,
                    "subject": "executive",
                    "framing": "W",
                    "shows": ["harbor"],
                    "word": "harbor",
                    "travel": 1.2,
                    "hold": 0.6
                },
                {
                    "at": ["pancakes", 1],
                    "lead": 5,
                    "pos": [-2.2, -2.5, 0.75],
                    "aim": [-2.2, 0.0, 1.05],
                    "lens": 24,
                    "subject": "narrator",
                    "framing": "W",
                    "shows": ["pancakes"],
                    "word": "pancakes",
                    "travel": 1.2,
                    "hold": 0.6
                }
            ]
        }
    ],
    "acts": [
        # Take 1: Commercial Street Tank
        {"who": "narrator", "at": 0, "pos": [-1.2, 0.0, 0.0], "view": "front", "dir": 1, "pose": "stand", "face": "k:smirk", "visible": True},
        {"who": "narrator", "at": 50, "pos": [-1.2, 0.0, 0.0], "view": "front", "dir": 1, "pose": "point_out", "face": "k:smirk"},
        {"who": "narrator", "at": 110, "pos": [-1.2, 0.0, 0.0], "view": "front", "dir": 1, "pose": "cool", "face": "smug"},
        {"who": "narrator", "at": 160, "pos": [3.2, 0.0, 0.0], "view": "front", "dir": 1, "pose": "flinch", "face": "surprised"},
        {"who": "narrator", "at": 250, "pos": [3.2, 0.0, 0.0], "view": "front", "dir": 1, "pose": "cool", "face": "surprised"},
        {"who": "narrator", "at": 300, "pos": [-1.0, 0.0, 0.0], "view": "front", "dir": 1, "pose": "point_out", "face": "k:smirk"},
        {"who": "narrator", "at": 360, "pos": [-1.0, 0.0, 0.0], "visible": False},

        {"who": "worker", "at": 0, "pos": [0.0, 0.0, 0.0], "visible": False},
        {"who": "executive", "at": 0, "pos": [0.0, 0.0, 0.0], "visible": False},

        {"who": "worker", "at": 360, "pos": [2.5, 0.0, 0.0], "view": "3/4", "dir": -1, "pose": "kneel_work", "face": "k:smirk", "visible": True},
        {"who": "worker", "at": 440, "pos": [2.5, 0.0, 0.0], "view": "front", "dir": 1, "pose": "cheer", "face": "proud"},
        {"who": "worker", "at": 520, "pos": [2.5, 0.0, 0.0], "view": "front", "dir": 1, "pose": "cool", "face": "smug"},
        {"who": "worker", "at": 580, "pos": [2.5, 0.0, 0.0], "visible": False},

        {"who": "executive", "at": 580, "pos": [-2.2, 0.0, 0.0], "view": "front", "dir": 1, "pose": "shrug", "face": "derp", "visible": True},
        {"who": "executive", "at": 650, "pos": [-2.2, 0.0, 0.0], "view": "front", "dir": 1, "pose": "cool", "face": "troll"},
        {"who": "executive", "at": 740, "pos": [-2.2, 0.0, 0.0], "visible": False},

        # Take 2: Molasses Wave Rupture
        {"who": "narrator", "at": 741, "pos": [-3.0, 0.0, 0.0], "view": "front", "dir": 1, "pose": "flinch", "face": "surprised", "visible": True},
        {"who": "narrator", "at": 820, "pos": [-3.0, 0.0, 0.0], "view": "front", "dir": 1, "pose": "point_up", "face": "surprised"},
        {"who": "narrator", "at": 900, "pos": [2.5, 0.0, 0.0], "view": "front", "dir": 1, "pose": "flinch", "face": "surprised"},
        {"who": "narrator", "at": 1000, "pos": [2.5, 0.0, 0.0], "view": "front", "dir": 1, "pose": "cool", "face": "surprised"},
        {"who": "narrator", "at": 1090, "pos": [2.5, 0.0, 0.0], "visible": False},

        # Take 3: Flooded Street & Sticky Concrete
        {"who": "worker", "at": 1091, "pos": [-2.5, 0.0, 0.0], "view": "front", "dir": 1, "pose": "flinch", "face": "surprised", "visible": True},
        {"who": "worker", "at": 1180, "pos": [-2.5, 0.0, 0.0], "view": "front", "dir": 1, "pose": "reach_high", "face": "surprised"},
        {"who": "worker", "at": 1260, "pos": [2.2, 0.0, 0.0], "view": "front", "dir": 1, "pose": "shrug", "face": "derp"},
        {"who": "worker", "at": 1340, "pos": [2.2, 0.0, 0.0], "view": "front", "dir": 1, "pose": "cool", "face": "shocked"},
        {"who": "worker", "at": 1420, "pos": [2.2, 0.0, 0.0], "visible": False},

        # Take 4: Clean up & Pancake smell
        {"who": "executive", "at": 1421, "pos": [-2.8, 0.0, 0.0], "view": "front", "dir": 1, "pose": "cool", "face": "proud", "visible": True},
        {"who": "executive", "at": 1500, "pos": [-2.8, 0.0, 0.0], "view": "front", "dir": 1, "pose": "point_out", "face": "proud"},
        {"who": "executive", "at": 1580, "pos": [2.2, 0.0, 0.0], "view": "front", "dir": 1, "pose": "cheer", "face": "proud"},
        {"who": "executive", "at": 1660, "pos": [2.2, 0.0, 0.0], "visible": False},

        {"who": "narrator", "at": 1661, "pos": [-0.5, 0.0, 0.0], "view": "front", "dir": 1, "pose": "cool", "face": "troll", "visible": True},
        {"who": "narrator", "at": 1740, "pos": [-0.5, 0.0, 0.0], "view": "front", "dir": 1, "pose": "cheer", "face": "proud"}
    ],
    "sentences": [
        {"subject": "narrator", "words": [0, 9], "text": "In 1919, Boston wasn't destroyed by fire or an earthquake."},
        {"subject": "narrator", "words": [10, 27], "nouns": [{"word": "tsunami", "n": 1, "show": "tank"}], "text": "It was swallowed by a 2 million gallon tsunami of boiling molasses moving at 35 miles per hour."},
        {"subject": "narrator", "words": [28, 42], "nouns": [{"word": "tank", "n": 1, "show": "tank"}], "text": "Down on Commercial Street stood a giant 50-foot steel tank filled with fermenting syrup."},
        {"subject": "worker", "words": [43, 54], "nouns": [{"word": "kids", "n": 1, "show": "tank"}], "text": "It leaked so badly that neighborhood kids collected free syrup in buckets."},
        {"subject": "executive", "words": [55, 58], "text": "The company's brilliant solution?"},
        {"subject": "executive", "words": [59, 70], "nouns": [{"word": "brown", "n": 1, "show": "tank"}], "text": "They just painted the tank brown so nobody could see the leaks."},
        {"subject": "narrator", "words": [71, 84], "text": "Then, on an unseasonably warm January afternoon, the rivets popped like machine-gun fire."},
        {"subject": "narrator", "words": [85, 101], "nouns": [{"word": "wave", "n": 1, "show": "wave"}], "text": "2.3 million gallons of dark, heavy syrup exploded outward in a towering 25-foot tidal wave!"},
        {"subject": "worker", "words": [102, 133], "nouns": [{"word": "concrete", "n": 1, "show": "street"}], "text": "The wave ripped an elevated train track right off its steel girders, smashed entire wooden houses into kindling, and trapped people and horses in waist-deep, cooling syrup that hardened like concrete."},
        {"subject": "executive", "words": [134, 152], "nouns": [{"word": "harbor", "n": 1, "show": "harbor"}], "text": "Firefighters spent weeks pumping millions of gallons of seawater to scrub the city clean, turning Boston Harbor completely brown."},
        {"subject": "narrator", "words": [153, 167], "nouns": [{"word": "pancakes", "n": 1, "show": "pancakes"}], "text": "And for decades after, locals swear on hot summer days, Boston still smelled like pancakes."}
    ]
}

with open(film_path, "w", encoding="utf-8") as f:
    json.dump(film, f, indent=1)

print("Saved tuned episodes/boston-molasses/film.json!")
