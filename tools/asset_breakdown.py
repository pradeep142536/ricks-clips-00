#!/usr/bin/env python3
"""
Step 1 of the RicksClips Asset-First 3D Pipeline:
Reads an episode's SCRIPT.md (+ optional PICTURE_PLAN.md and film.json)
and generates episodes/<episode>/asset_manifest.json listing:
  - Environments / Locations
  - Hero Props
  - Background / Dressing Props
  - Exact real-world target dimensions in meters (target_meters + target_axis)
  - Clearance rules & CC0 library cache status
"""
import argparse
import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LIBRARY_DIR = ROOT / "assets" / "3d_library"
CATALOG_PATH = LIBRARY_DIR / "catalog.json"

# Canonical catalog of known hero props, vehicles, environments, and dressing items
# with real-world meter dimensions and search keywords for CC0 libraries.
KNOWN_SPECS = {
    # Hero Props & Vehicles
    "military_truck": {
        "name": "1930s Military Flatbed Truck",
        "category": "vehicle",
        "role": "prop",
        "target_axis": "length",
        "target_meters": 4.60,
        "bbox_clearance_m": 0.35,
        "search_terms": ["flatbed truck", "military truck", "pickup truck", "truck-flat", "truck"],
        "requires_glb": True,
        "notes": "Hero vehicle with open flatbed cargo area; actors must stand cleanly inside bed clear of crates and tripod."
    },
    "car": {
        "name": "Passenger Car",
        "category": "vehicle",
        "role": "prop",
        "target_axis": "length",
        "target_meters": 4.20,
        "bbox_clearance_m": 0.35,
        "search_terms": ["sedan", "car"],
        "requires_glb": True
    },
    "lewis_machine_gun": {
        "name": "1914 Lewis Machine Gun with Cooling Shroud & Pan Magazine",
        "category": "hero_prop",
        "role": "prop",
        "keep_metal": True,
        "target_axis": "length",
        "target_meters": 1.28,
        "bbox_clearance_m": 0.25,
        "search_terms": ["lewis machine gun", "machine gun", "lmg", "tripod gun"],
        "requires_glb": True,
        "notes": "Mounted on sandbag parapet or truck swivel tripod; must rest cleanly on support surface, never floating near helmet."
    },
    "rifle": {
        "name": "Infantry Bolt-Action Rifle",
        "category": "hero_prop",
        "role": "prop",
        "keep_metal": True,
        "target_axis": "length",
        "target_meters": 1.12,
        "bbox_clearance_m": 0.20,
        "search_terms": ["rifle", "weapon_rifle", "musket"],
        "requires_glb": True
    },
    "ammo_crate": {
        "name": "Stencilled Wooden Ammunition Crate",
        "category": "hero_prop",
        "role": "prop",
        "target_axis": "width",
        "target_meters": 0.58,
        "bbox_clearance_m": 0.28,
        "search_terms": ["wooden_military_crate", "ammo_box", "military crate", "crate"],
        "requires_glb": True
    },
    "map_table": {
        "name": "Military HQ Tactical Map Table",
        "category": "hero_prop",
        "role": "prop",
        "target_axis": "length",
        "target_meters": 2.10,
        "bbox_clearance_m": 0.32,
        "search_terms": ["WoodenTable_01", "table", "wooden table", "desk"],
        "requires_glb": True,
        "notes": "Soldiers and Major Meredith must stand cleanly behind/beside table perimeter."
    },
    "binoculars": {
        "name": "Brass Field Binoculars",
        "category": "hero_prop",
        "role": "prop",
        "keep_metal": True,
        "target_axis": "width",
        "target_meters": 0.18,
        "bbox_clearance_m": 0.10,
        "search_terms": ["binoculars", "Compass_Open", "brass"],
        "requires_glb": True
    },
    "pitchfork": {
        "name": "Wooden Farmer Pitchfork",
        "category": "hero_prop",
        "role": "prop",
        "target_axis": "height",
        "target_meters": 1.55,
        "bbox_clearance_m": 0.20,
        "search_terms": ["pitchfork", "rake", "shovel"],
        "requires_glb": True
    },
    "dispatch_box": {
        "name": "Parliament Mahogany Dispatch Box & Lectern",
        "category": "hero_prop",
        "role": "prop",
        "target_axis": "height",
        "target_meters": 1.15,
        "bbox_clearance_m": 0.32,
        "search_terms": ["lectern", "podium", "cabinet", "chest"],
        "requires_glb": True
    },
    "emu": {
        "name": "Articulated Australian Emu (Matte Feathered Plumage)",
        "category": "hero_creature",
        "role": "creature",
        "target_axis": "height",
        "target_meters": 1.75,
        "bbox_clearance_m": 0.42,
        "search_terms": ["emu", "ostrich", "flightless bird"],
        "requires_glb": True,
        "notes": "Matte feathered plumage (roughness >= 0.85, zero clearcoat/plastic sheen), articulated running legs and bobbing neck."
    },
    "coffee_cup": {
        "name": "Tapered Paper Coffee Cup",
        "category": "hero_prop",
        "role": "prop",
        "target_axis": "height",
        "target_meters": 0.15,
        "bbox_clearance_m": 0.10,
        "search_terms": ["coffee cup", "mug", "cup"],
        "requires_glb": True
    },
    "popcorn_bucket": {
        "name": "Striped Movie Popcorn Bucket",
        "category": "hero_prop",
        "role": "prop",
        "target_axis": "height",
        "target_meters": 0.22,
        "bbox_clearance_m": 0.12,
        "search_terms": ["popcorn", "bucket"],
        "requires_glb": True
    },
    "wallet": {
        "name": "Folded Leather Wallet",
        "category": "hero_prop",
        "role": "prop",
        "target_axis": "width",
        "target_meters": 0.11,
        "bbox_clearance_m": 0.08,
        "search_terms": ["wallet", "book", "pouch"],
        "requires_glb": True
    },
    "war_diary": {
        "name": "Field Officer War Diary Notebook",
        "category": "hero_prop",
        "role": "prop",
        "target_axis": "length",
        "target_meters": 0.24,
        "bbox_clearance_m": 0.10,
        "search_terms": ["book", "notebook", "diary"],
        "requires_glb": True
    },
    # Background / Dressing Props
    "sandbag": {
        "name": "Burlap Trench Sandbags",
        "category": "dressing_prop",
        "role": "prop",
        "target_axis": "length",
        "target_meters": 0.65,
        "bbox_clearance_m": 0.22,
        "search_terms": ["compost_bags", "Bags", "sandbag", "sack"],
        "requires_glb": True
    },
    "wooden_fence": {
        "name": "Outback Split-Rail Timber Fence",
        "category": "dressing_prop",
        "role": "prop",
        "target_axis": "length",
        "target_meters": 2.20,
        "bbox_clearance_m": 0.25,
        "search_terms": ["Fence", "fence_simple", "wooden fence"],
        "requires_glb": True
    },
    "wheat_crop": {
        "name": "Golden Ripened Wheat Stalk Clump",
        "category": "dressing_prop",
        "role": "foliage",
        "target_axis": "height",
        "target_meters": 1.05,
        "bbox_clearance_m": 0.0,
        "search_terms": ["Wheat_Crop", "Wheat_4", "wheat"],
        "requires_glb": True
    },
    "dry_bush": {
        "name": "Australian Outback Dry Scrub Bush",
        "category": "dressing_prop",
        "role": "foliage",
        "target_axis": "height",
        "target_meters": 1.10,
        "bbox_clearance_m": 0.20,
        "search_terms": ["wild_rooibos_bush", "Bush_1", "bush"],
        "requires_glb": True
    },
    "dry_grass": {
        "name": "Dry Outback Grass Tuft",
        "category": "dressing_prop",
        "role": "foliage",
        "target_axis": "height",
        "target_meters": 0.45,
        "bbox_clearance_m": 0.0,
        "search_terms": ["Grass_2", "grass tuft", "grass"],
        "requires_glb": True
    },
    "outback_rock": {
        "name": "Weathered Red Sandstone Outback Rock",
        "category": "dressing_prop",
        "role": "prop",
        "target_axis": "width",
        "target_meters": 1.15,
        "bbox_clearance_m": 0.25,
        "search_terms": ["boulder_01", "Rock_2", "rock_largeA"],
        "requires_glb": True
    },
    "eucalyptus_tree": {
        "name": "Sparse Outback Gum / Scrub Tree (Replaces Cypress)",
        "category": "dressing_prop",
        "role": "foliage",
        "target_axis": "height",
        "target_meters": 5.50,
        "bbox_clearance_m": 0.45,
        "search_terms": ["CommonTree_Dead_1", "CommonTree_1", "tree"],
        "requires_glb": True,
        "notes": "Replaces tall out-of-place cypress silhouettes with authentic wide-canopy dry eucalyptus/scrub tree."
    },
    "wooden_chair": {
        "name": "Wooden Officer / Chamber Chair",
        "category": "dressing_prop",
        "role": "furniture",
        "target_axis": "height",
        "target_meters": 0.90,
        "bbox_clearance_m": 0.25,
        "search_terms": ["chair", "Chair_1", "WoodenChair_01"],
        "requires_glb": True
    },
    "parliament_bench": {
        "name": "Chamber Wooden Seating Bench",
        "category": "dressing_prop",
        "role": "furniture",
        "target_axis": "length",
        "target_meters": 2.40,
        "bbox_clearance_m": 0.30,
        "search_terms": ["Bench_1", "bench", "pew"],
        "requires_glb": True
    },
    "desk_lamp": {
        "name": "Warm Tungsten Office Lamp / Hanging Lamp",
        "category": "dressing_prop",
        "role": "lamp",
        "keep_metal": True,
        "target_axis": "height",
        "target_meters": 0.55,
        "bbox_clearance_m": 0.15,
        "search_terms": ["hanging_industrial_lamp", "lamp", "Light_Chandelier"],
        "requires_glb": True
    },
    "chandelier": {
        "name": "Chamber Ceiling Chandelier",
        "category": "dressing_prop",
        "role": "lamp",
        "keep_metal": True,
        "target_axis": "height",
        "target_meters": 1.25,
        "bbox_clearance_m": 0.0,
        "search_terms": ["Chandelier_01", "Light_Chandelier", "chandelier"],
        "requires_glb": True
    },
    "bookshelf": {
        "name": "Chamber Wall Archive Bookshelf",
        "category": "dressing_prop",
        "role": "furniture",
        "target_axis": "height",
        "target_meters": 2.20,
        "bbox_clearance_m": 0.30,
        "search_terms": ["Bookshelf", "shelf"],
        "requires_glb": True
    },
    "field_radio": {
        "name": "Military HQ Brass Field Radio / Compass",
        "category": "dressing_prop",
        "role": "prop",
        "keep_metal": True,
        "target_axis": "width",
        "target_meters": 0.42,
        "bbox_clearance_m": 0.18,
        "search_terms": ["Radio", "Compass_Open", "radio"],
        "requires_glb": True
    },
    "window_frame": {
        "name": "Framed Interior Daylight Window & Curtains",
        "category": "dressing_prop",
        "role": "architecture",
        "target_axis": "height",
        "target_meters": 2.10,
        "bbox_clearance_m": 0.0,
        "search_terms": ["Window_Large1", "window"],
        "requires_glb": True
    },
    "chamber_column": {
        "name": "Interior Architectural Timber / Stone Column",
        "category": "dressing_prop",
        "role": "architecture",
        "target_axis": "height",
        "target_meters": 4.20,
        "bbox_clearance_m": 0.35,
        "search_terms": ["Column_Round1", "column", "pillar"],
        "requires_glb": True
    },
    # 1950s NYC Aviation & Bar Assets (Permanent Cinema Standard V2.0)
    "vintage_prop_plane": {
        "name": "1950s Single-Engine Propeller Airplane",
        "category": "vehicle",
        "role": "prop",
        "keep_metal": True,
        "target_axis": "length",
        "target_meters": 7.50,
        "bbox_clearance_m": 0.45,
        "search_terms": ["propeller-plane", "biplane", "prop plane", "airplane"],
        "requires_glb": True,
        "notes": "Hero aircraft with rotating propeller node and wing/cabin navigation beacons."
    },
    "vintage_police_car": {
        "name": "1950s NYC Police Patrol Cruiser",
        "category": "vehicle",
        "role": "prop",
        "keep_metal": True,
        "target_axis": "length",
        "target_meters": 4.50,
        "bbox_clearance_m": 0.35,
        "search_terms": ["police-car", "police car", "cruiser"],
        "requires_glb": True,
        "notes": "Equipped with roof siren light beacon."
    },
    "vintage_sedan": {
        "name": "1950s Vintage Street Sedan",
        "category": "vehicle",
        "role": "prop",
        "keep_metal": True,
        "target_axis": "length",
        "target_meters": 4.40,
        "bbox_clearance_m": 0.35,
        "search_terms": ["classic-car", "1950s-roadster", "sedan"],
        "requires_glb": True
    },
    "bar_counter": {
        "name": "1950s Mahogany Bar Counter",
        "category": "hero_prop",
        "role": "furniture",
        "target_axis": "length",
        "target_meters": 3.50,
        "bbox_clearance_m": 0.30,
        "search_terms": ["bar-counter", "bar counter", "pub counter"],
        "requires_glb": True
    },
    "bar_stool": {
        "name": "Round Vintage Pub Bar Stool",
        "category": "dressing_prop",
        "role": "furniture",
        "target_axis": "height",
        "target_meters": 0.75,
        "bbox_clearance_m": 0.25,
        "search_terms": ["bar_chair_round_01", "bar-stool", "stool"],
        "requires_glb": True
    },
    "pub_table": {
        "name": "Round Polished Timber Pub Table",
        "category": "dressing_prop",
        "role": "furniture",
        "target_axis": "width",
        "target_meters": 1.20,
        "bbox_clearance_m": 0.30,
        "search_terms": ["round_wooden_table_01", "cafe-table", "pub table"],
        "requires_glb": True
    },
    "beer_mug": {
        "name": "Pub Beer Mug / Golden Ale Pitcher",
        "category": "hero_prop",
        "role": "prop",
        "target_axis": "height",
        "target_meters": 0.16,
        "bbox_clearance_m": 0.08,
        "search_terms": ["pitcher", "brass_goblets", "tea-cup", "beer mug"],
        "requires_glb": True
    },
    "street_lamp": {
        "name": "Manhattan Cast-Iron Street Lamp",
        "category": "dressing_prop",
        "role": "lamp",
        "keep_metal": True,
        "target_axis": "height",
        "target_meters": 4.20,
        "bbox_clearance_m": 0.25,
        "search_terms": ["street_lamp_01", "street-light", "street lamp"],
        "requires_glb": True
    },
    "brick_building_facade": {
        "name": "1950s Manhattan Brick Storefront Building",
        "category": "dressing_prop",
        "role": "architecture",
        "target_axis": "height",
        "target_meters": 9.50,
        "bbox_clearance_m": 0.35,
        "search_terms": ["townhouse", "apartment-building", "tavern", "brick-wall"],
        "requires_glb": True
    },
    "nyc_skyscraper": {
        "name": "Manhattan Lit Skyscraper Tower",
        "category": "dressing_prop",
        "role": "architecture",
        "target_axis": "height",
        "target_meters": 28.0,
        "bbox_clearance_m": 0.50,
        "search_terms": ["skyscraper", "office-building"],
        "requires_glb": True
    },
    "airfield_hangar": {
        "name": "Moonlit Rural Airfield Hangar",
        "category": "dressing_prop",
        "role": "architecture",
        "target_axis": "length",
        "target_meters": 14.0,
        "bbox_clearance_m": 0.45,
        "search_terms": ["hangar", "warehouse"],
        "requires_glb": True
    },
    "wooden_barrel": {
        "name": "Oak Tavern Beer Barrel",
        "category": "dressing_prop",
        "role": "prop",
        "target_axis": "height",
        "target_meters": 0.92,
        "bbox_clearance_m": 0.28,
        "search_terms": ["wine_barrel_01", "wooden_barrels_01", "barrel"],
        "requires_glb": True
    },
    "framed_picture": {
        "name": "Vintage Framed Bar Wall Picture",
        "category": "dressing_prop",
        "role": "prop",
        "target_axis": "width",
        "target_meters": 0.65,
        "bbox_clearance_m": 0.0,
        "search_terms": ["hanging_picture_frame_03", "picture-frame"],
        "requires_glb": True
    }
}

# Keyword rules scanning SCRIPT.md + PICTURE_PLAN.md -> item ids
EXTRACTION_RULES = [
    ("vintage_prop_plane", r"\b(propeller\s+plane|prop\s+plane|single-engine|cessna|small\s+plane|second\s+plane|airplane)\b"),
    ("vintage_police_car", r"\b(police\s+car|patrol\s+car|cop\s+car|cruiser|siren)\b"),
    ("vintage_sedan", r"\b(parked\s+cars?|1950s\s+cars?|sedan|classic\s+car)\b"),
    ("bar_counter", r"\b(bar\s+counter|mahogany\s+bar|uptown\s+bar|the\s+bar|bar\s+door)\b"),
    ("bar_stool", r"\b(bar\s+stool|bar\s+interior|pub|bar)\b"),
    ("pub_table", r"\b(pub\s+table|bar\s+interior|tavern|pub)\b"),
    ("beer_mug", r"\b(beer|mug|pint|ale|toast|clink|bar)\b"),
    ("street_lamp", r"\b(street\s*lamps?|lampposts?|manhattan\s+street|bar\s+door|nyc\s+street)\b"),
    ("brick_building_facade", r"\b(manhattan\s+street|brick\s+building|facade|bar\s+door|brownstone)\b"),
    ("nyc_skyscraper", r"\b(skyscrapers?|manhattan\s+sky|nyc\s+skyline|buildings)\b"),
    ("airfield_hangar", r"\b(airfield|hangar|tarmac)\b"),
    ("wooden_barrel", r"\b(barrel|bar\s+interior|tavern|pub)\b"),
    ("framed_picture", r"\b(framed\s+picture|wall\s+frame|bar\s+interior|pub)\b"),
    ("military_truck", r"\b(flatbed\s+truck|military\s+truck|truck)\b"),
    ("car", r"\b(passenger\s+car|automobile)\b"),
    ("lewis_machine_gun", r"\blewis\s*(machine\s*)?guns?|machine\s+guns?|swivel\s+tripod\b"),
    ("rifle", r"\brifles?\b"),
    ("ammo_crate", r"\bammo(nition)?\s+crates?|wooden\s+.*crates?\b"),
    ("map_table", r"\b(tactical\s+.*map|map\s+table|desk)\b"),
    ("binoculars", r"\bbinoculars\b"),
    ("pitchfork", r"\bpitchfork\b"),
    ("dispatch_box", r"\bdispatch\s+box\b"),
    ("emu", r"\bemus?\b"),
    ("coffee_cup", r"\bcoffee\s+cups?\b"),
    ("popcorn_bucket", r"\bpopcorn\s+buckets?\b"),
    ("wallet", r"\bwallets?\b"),
    ("war_diary", r"\b(war\s+diary|notebook)\b"),
    ("sandbag", r"\bsandbags?\b"),
    ("wooden_fence", r"\b(fences?|split-rail|timber\s+posts?|fence\s+post)\b"),
    ("wheat_crop", r"\bwheat\b"),
    ("dry_bush", r"\b(bush|scrub)\b"),
    ("dry_grass", r"\b(grass|wheat)\b"),
    ("outback_rock", r"\b(rocks?|boulders?|anthill|red\s+earth)\b"),
    ("eucalyptus_tree", r"\b(outback|wheat\s+field|dirt\s+road|dirt\s+track)\b"),
    ("wooden_chair", r"\b(hq|map\s+room|parliament|chairs?)\b"),
    ("parliament_bench", r"\b(parliament|benches|debating\s+chamber)\b"),
    ("desk_lamp", r"\b(desk\s+lamp|tungsten\s+lamp|hq|map\s+room)\b"),
    ("chandelier", r"\b(parliament|debating\s+chamber|chandelier)\b"),
    ("bookshelf", r"\b(parliament|hq|map\s+room|bookshelf)\b"),
    ("field_radio", r"\b(hq|map\s+room|minister\s+of\s+defence)\b"),
    ("window_frame", r"\b(hq|map\s+room|parliament|daylight\s+window|window\s+frame)\b"),
    ("chamber_column", r"\b(parliament|column|pillar)\b"),
]

ENVIRONMENT_PRESETS = {
    "wheat_field": {
        "name": "Western Australian Wheat Field (Undulating Outback Terrain)",
        "lighting": "golden_outback_sun",
        "dimensions_m": [42.0, 42.0],
        "notes": "Sculpted undulating terrain mesh (not flat orange plane) + CC0 wheat_crop, dry_bush, dry_grass, outback_rock, eucalyptus_tree, wooden_fence."
    },
    "hq_map_room": {
        "name": "Military HQ Map Room",
        "lighting": "warm_interior_tungsten",
        "dimensions_m": [10.0, 8.0, 4.0],
        "notes": "Warm bounced fill lighting, textured timber paneling, daylight window_frame with light shafts, map_table, wooden_chair, desk_lamp, field_radio, bookshelf."
    },
    "ambush_trench": {
        "name": "Campion Desert Ambush Dugout Trench",
        "lighting": "harsh_desert_sun",
        "dimensions_m": [36.0, 36.0],
        "notes": "Excavated soil embankment + CC0 sandbag parapet supporting lewis_machine_gun tripod cleanly above sightline, plus outback_rock and dry_bush."
    },
    "dirt_track": {
        "name": "Bumpy Outback Dirt Track",
        "lighting": "golden_sunset_chase",
        "dimensions_m": [60.0, 32.0],
        "notes": "Sculpted rutted wheel-track terrain + military_truck + lewis_machine_gun + ammo_crate + dry_grass + outback_rock."
    },
    "broken_fence": {
        "name": "Smashed Outback Timber Fence Breach",
        "lighting": "golden_outback_sun",
        "dimensions_m": [34.0, 34.0],
        "notes": "Sculpted terrain + CC0 wooden_fence sections (intact + knocked askew) + wheat_crop + dry_bush + pitchfork."
    },
    "parliament_floor": {
        "name": "Australian Parliament Debating Chamber",
        "lighting": "warm_chamber_tungsten",
        "dimensions_m": [14.0, 12.0, 6.0],
        "notes": "Layered architectural wood-paneled hall (no dark void), daylight window_frame shafts, chamber_column, parliament_bench rows, dispatch_box, chandelier, bookshelf."
    },
    "nyc_bar_interior": {
        "name": "1956 Manhattan Neighborhood Bar Interior",
        "lighting": "warm_pub_tungsten",
        "dimensions_m": [12.0, 9.0, 4.2],
        "notes": "Warm 1950s wood wainscoting and brick interior (zero black voids), bar_counter, bar_stool, pub_table, beer_mug, wooden_barrel, framed_picture, window daylight/street glow."
    },
    "nj_airfield_night": {
        "name": "Moonlit 1956 New Jersey Airfield Tarmac",
        "lighting": "moonlit_night_airfield",
        "dimensions_m": [48.0, 48.0],
        "notes": "Textured tarmac + tarmac centerlines, distant horizon ridge + night clouds, airfield_hangar, vintage_prop_plane, runway markers."
    },
    "manhattan_sky_night": {
        "name": "1956 Midnight Manhattan Skyline Airspace",
        "lighting": "midnight_city_sky",
        "dimensions_m": [90.0, 90.0],
        "notes": "Rich deep-blue night dome + soft layered clouds + distant horizon glow, rows of lit nyc_skyscraper towers framing aerial tracking & POV flight."
    },
    "nyc_street_night": {
        "name": "1956 Washington Heights Street Outside Bar",
        "lighting": "moonlit_streetlamp_night",
        "dimensions_m": [42.0, 26.0],
        "notes": "Textured wet/asphalt road & curbs, brick_building_facade row, warm glowing street_lamp posts, parked vintage_sedan, vintage_police_car with flashing siren, landed vintage_prop_plane."
    },
}


def load_catalog():
    if CATALOG_PATH.exists():
        try:
            return json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {"schema": "ricksclips-3d-library/v1", "updated_at": "", "assets": {}}


def parse_script_environments(script_text: str, film_data: dict):
    envs = []
    seen = set()

    # 1. From film.json places if present
    for pid, pl in (film_data.get("places") or {}).items():
        set_name = pl.get("set") or pid
        preset = ENVIRONMENT_PRESETS.get(set_name, {})
        envs.append({
            "id": pid,
            "set_module": f"sets/{set_name}.js",
            "name": preset.get("name", set_name.replace("_", " ").title()),
            "light": pl.get("light", preset.get("lighting", "day")),
            "dimensions_m": preset.get("dimensions_m", [20.0, 20.0]),
            "requires_procedural_terrain": any(k in set_name for k in ("field", "track", "trench", "fence", "outback")),
            "notes": preset.get("notes", "Environment derived from film.json places entry.")
        })
        seen.add(pid)

    # 2. Fallback extraction from SCRIPT.md P1..P9 column
    for m in re.finditer(r"\bP\d+\s+([a-zA-Z0-9 _-]+?)\s*,\s*L\d+", script_text):
        raw = m.group(1).strip().lower().replace(" ", "_")
        norm = "hq_map_room" if "hq" in raw or "map" in raw else raw
        if norm not in seen:
            preset = ENVIRONMENT_PRESETS.get(norm, {})
            envs.append({
                "id": norm,
                "set_module": f"sets/{norm}.js",
                "name": preset.get("name", raw.replace("_", " ").title()),
                "light": preset.get("lighting", "day"),
                "dimensions_m": preset.get("dimensions_m", [20.0, 20.0]),
                "requires_procedural_terrain": True,
                "notes": preset.get("notes", "Extracted from SCRIPT.md P-column.")
            })
            seen.add(norm)
    return envs


def extract_items(corpus: str, envs: list, catalog: dict):
    found_ids = []
    low = corpus.lower()
    for item_id, pattern in EXTRACTION_RULES:
        if re.search(pattern, low, flags=re.IGNORECASE):
            if item_id not in found_ids:
                found_ids.append(item_id)

    items = []
    lib_assets = catalog.get("assets", {})
    for item_id in found_ids:
        spec = KNOWN_SPECS[item_id]
        cat_entry = lib_assets.get(item_id)
        cached_ok = False
        lib_path = None
        if cat_entry and cat_entry.get("library_path"):
            p = ROOT / cat_entry["library_path"]
            if p.exists() and p.stat().st_size > 128:
                cached_ok = True
                lib_path = cat_entry["library_path"]

        item = {
            "id": item_id,
            "name": spec["name"],
            "category": spec["category"],
            "role": spec["role"],
            "target_axis": spec["target_axis"],
            "target_meters": spec["target_meters"],
            "bbox_clearance_m": spec["bbox_clearance_m"],
            "matte_roughness": 0.85 if spec["category"] == "hero_creature" else (0.78 if spec.get("keep_metal") else 0.82),
            "keep_metal": bool(spec.get("keep_metal", False)),
            "search_terms": spec["search_terms"],
            "requires_glb": spec.get("requires_glb", True),
            "library_path": lib_path or f"assets/3d_library/{spec['category']}/{item_id}.glb",
            "status": "library_cached" if cached_ok else "pending_fetch",
            "fallback_required": False,
            "needs_approval": False,
        }
        if cat_entry:
            item["source"] = cat_entry.get("source")
            item["license"] = cat_entry.get("license")
            item["source_url"] = cat_entry.get("source_url")
        if spec.get("notes"):
            item["notes"] = spec["notes"]
        items.append(item)
    return items


def build_manifest(ep_dir: Path) -> dict:
    script_path = ep_dir / "SCRIPT.md"
    plan_path = ep_dir / "PICTURE_PLAN.md"
    film_path = ep_dir / "film.json"

    if not script_path.exists():
        raise FileNotFoundError(f"Missing SCRIPT.md in {ep_dir}")

    script_text = script_path.read_text(encoding="utf-8")
    plan_text = plan_path.read_text(encoding="utf-8") if plan_path.exists() else ""
    film_data = json.loads(film_path.read_text(encoding="utf-8")) if film_path.exists() else {}
    catalog = load_catalog()

    envs = parse_script_environments(script_text, film_data)
    corpus = f"{script_text}\n{plan_text}"
    items = extract_items(corpus, envs, catalog)

    manifest = {
        "schema": "ricksclips-asset-manifest/v1",
        "episode": ep_dir.name,
        "title": film_data.get("title") or ep_dir.name,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "pipeline_rules": {
            "standard": "RicksClips-Cinema-Standard-V3.0",
            "library_root": "assets/3d_library/",
            "pivot": "bottom_center_y0",
            "enforce_matte_pbr": True,
            "comic_ink_outlines": True,
            "bright_night_ambient_min": 0.45,
            "min_props_per_set": 12,
            "enforce_forward_axis_alignment": True,
            "safe_zone_9x16_pct": 80,
            "ban_floating_dots": True,
            "hero_primitive_ban": True,
            "quality_gate": "Render previews + storyboard.png + 20s preview + full 1080x1920 GPU MP4 with 0 collisions and 0 FAIL plan gates (Cinema Standard V3.0)."
        },
        "environments": envs,
        "items": items
    }
    return manifest


def main():
    ap = argparse.ArgumentParser(description="Generate asset_manifest.json from an episode SCRIPT.md")
    ap.add_argument("episode", help="Episode path or folder name under episodes/")
    ap.add_argument("--out", help="Optional output path (default: <episode>/asset_manifest.json)")
    args = ap.parse_args()

    ep_dir = Path(args.episode)
    if not ep_dir.is_absolute():
        cand = ROOT / args.episode
        if cand.exists():
            ep_dir = cand
        elif (ROOT / "episodes" / args.episode).exists():
            ep_dir = ROOT / "episodes" / args.episode

    manifest = build_manifest(ep_dir)
    out_path = Path(args.out) if args.out else (ep_dir / "asset_manifest.json")
    out_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")

    envs_n = len(manifest["environments"])
    items_n = len(manifest["items"])
    hero_n = sum(1 for x in manifest["items"] if x["category"] in ("hero_prop", "vehicle", "hero_creature"))
    print(f"asset_manifest -> {out_path} ({envs_n} environments, {items_n} total assets, {hero_n} hero/creature items)")


if __name__ == "__main__":
    main()
