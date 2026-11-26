#!/usr/bin/env python3
"""
Step 2 of the RicksClips Asset-First 3D Pipeline:
Cache-first 3D CC0 asset fetcher & binary .glb packer.
Reads episodes/<ep>/asset_manifest.json:
  1. Checks assets/3d_library/ (and catalog.json) for existing verified .glb models.
  2. Searches open-license CC0 sources (Kenney-CCO, Quaternius Showcase, Poly Haven,
     plus optional Poly Pizza / Sketchfab CC0 if API keys exist in environment).
  3. Packs external glTF+BIN+1K textures (Poly Haven) into self-contained binary .glb.
  4. Validates GLB v2 binary header and saves under assets/3d_library/<category>/<id>.glb.
  5. Flags genuinely unsourcable items with fallback_required=true & needs_approval=true
     instead of silently coding raw primitive substitutes.
"""
import argparse
import hashlib
import io
import json
import os
import re
import shutil
import struct
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    Image = None

ROOT = Path(__file__).resolve().parent.parent
LIB_DIR = ROOT / "assets" / "3d_library"
CATALOG_PATH = LIB_DIR / "catalog.json"
CACHE_INDEX_DIR = LIB_DIR / ".index_cache"

UA = "RicksClips-AssetPipeline/3.0"

STRICT_TEXTURED_CATEGORIES = {"vehicle", "hero_prop"}

# High-confidence exact CC0 asset preferences prioritizing Poly Haven & textured Grab3D PBR models.
# Flat untextured FBX2glTF / 0-texture models are REJECTED for vehicles, hero props, trees, bushes,
# and any item with require_textured_pbr=true.
EXACT_PREFERENCES = {
    "vintage_prop_plane": [
        ("grab3d", "propeller-plane"),
        ("grab3d", "biplane"),
    ],
    "vintage_police_car": [
        ("grab3d", "police-car"),
    ],
    "vintage_sedan": [
        ("grab3d", "sedan"),
        ("grab3d", "1950s-roadster"),
        ("grab3d", "classic-car"),
    ],
    "bar_counter": [
        ("grab3d", "bar-counter"),
    ],
    "bar_stool": [
        ("polyhaven", "bar_chair_round_01"),
        ("grab3d", "bar-stool"),
    ],
    "pub_table": [
        ("polyhaven", "round_wooden_table_01"),
        ("grab3d", "cafe-table"),
    ],
    "beer_mug": [
        ("grab3d", "pitcher"),
        ("polyhaven", "brass_goblets"),
    ],
    "street_lamp": [
        ("polyhaven", "street_lamp_01"),
        ("polyhaven", "street_lamp_02"),
        ("grab3d", "street-light"),
    ],
    "brick_building_facade": [
        ("grab3d", "townhouse"),
        ("grab3d", "apartment-building"),
        ("grab3d", "tavern"),
    ],
    "nyc_skyscraper": [
        ("grab3d", "skyscraper"),
    ],
    "airfield_hangar": [
        ("grab3d", "hangar"),
    ],
    "wooden_barrel": [
        ("polyhaven", "wine_barrel_01"),
        ("polyhaven", "wooden_barrels_01"),
    ],
    "framed_picture": [
        ("polyhaven", "hanging_picture_frame_03"),
        ("grab3d", "picture-frame"),
    ],
    "military_truck": [
        ("grab3d", "1950s-pickup-truck"),
        ("grab3d", "pickup-truck"),
    ],
    "car": [
        ("grab3d", "classic-car"),
        ("polyhaven", "covered_car"),
    ],
    "rifle": [
        ("polyhaven", "bolt_action_rifle_7_62"),
    ],
    "ammo_crate": [
        ("polyhaven", "wooden_military_crate"),
        ("polyhaven", "ammo_box"),
    ],
    "map_table": [
        ("polyhaven", "WoodenTable_01"),
    ],
    "sandbag": [
        ("polyhaven", "compost_bags"),
    ],
    "wooden_fence": [
        ("quaternius", "medieval_village_pack/Fence.glb"),
        ("kenney", "fence_simple.glb"),
    ],
    "wheat_crop": [
        ("quaternius", "nature_pack/Wheat.glb"),
        ("quaternius", "crops_pack/Wheat_4.glb"),
    ],
    "dry_bush": [
        ("polyhaven", "searsia_burchellii"),
        ("polyhaven", "wild_rooibos_bush"),
    ],
    "dry_grass": [
        ("quaternius", "nature_pack/Grass_2.glb"),
        ("quaternius", "crops_pack/Grass_2.glb"),
    ],
    "outback_rock": [
        ("polyhaven", "boulder_01"),
    ],
    "eucalyptus_tree": [
        ("polyhaven", "island_tree_01"),
        ("polyhaven", "jacaranda_tree"),
        ("polyhaven", "island_tree_02"),
    ],
    "wooden_chair": [
        ("quaternius", "house_interior_pack/Chair_1.glb"),
        ("kenney", "chair.glb"),
    ],
    "parliament_bench": [
        ("quaternius", "medieval_village_pack/Bench_1.glb"),
        ("kenney", "bench.glb"),
    ],
    "desk_lamp": [
        ("polyhaven", "vintage_oil_lamp"),
        ("polyhaven", "desk_lamp_arm_01"),
    ],
    "chandelier": [
        ("polyhaven", "Chandelier_01"),
    ],
    "bookshelf": [
        ("polyhaven_combo", "bookshelf_populated"),
        ("polyhaven", "wooden_bookshelf_worn"),
    ],
    "field_radio": [
        ("quaternius", "Radio.glb"),
    ],
    "window_frame": [
        ("quaternius", "Window_Large1.glb"),
        ("quaternius", "Window_1.glb"),
    ],
    "chamber_column": [
        ("grab3d", "column"),
    ],
    "war_diary": [
        ("quaternius", "Book_Open.glb"),
        ("quaternius", "Book.glb"),
    ],
    "coffee_cup": [
        ("polyhaven", "coffee_cup"),
    ],
    "stopwatch": [
        ("polyhaven", "vintage_pocket_watch"),
        ("polyhaven", "pocket_watch"),
    ],
    "judge_gavel": [
        ("polyhaven", "wooden_hammer_01"),
        ("polyhaven", "cross_pein_hammer"),
    ],
    "wine_bottles": [
        ("polyhaven", "wine_bottles_01"),
    ],
    "dartboard": [
        ("polyhaven", "dartboard"),
    ],
    "chainlink_fence": [
        ("polyhaven", "modular_chainlink_fence"),
    ],
    "fire_escape": [
        ("polyhaven", "modular_fire_escape"),
    ],
    "metal_trash_can": [
        ("polyhaven", "metal_trash_can"),
    ],
    "office_notepads": [
        ("polyhaven", "office_notepads"),
        ("polyhaven", "binder_notebook"),
    ],
    "gate_latch": [
        ("polyhaven", "gate_latch_01"),
    ],
    "wooden_bench": [
        ("polyhaven", "painted_wooden_bench"),
    ],
}

# Botanical & per-asset packing rules for multi-variant Poly Haven / GLTF bundles
POLYHAVEN_PACK_OPTS = {
    "searsia_burchellii": {"node_keep": "searsia_burchellii_medium_LOD0", "mask_foliage": True},
    "wild_rooibos_bush": {"node_keep": "wild_rooibos_bush_a", "mask_foliage": True},
    "island_tree_01": {"mask_foliage": True},
    "island_tree_02": {"mask_foliage": True},
    "jacaranda_tree": {"mask_foliage": True},
}

# Suggested fallback notes only surfaced for user approval when missing from CC0 libs
FALLBACK_HINTS = {
    "lewis_machine_gun": "Procedural kitbashed Lewis gun mesh (cooling shroud + 47-round top pan magazine + tripod) or custom Poly Pizza/Sketchfab CC0 upload.",
    "emu": "Existing articulated feathered matte procedural rig (emu_flock.js updated to matte roughness >= 0.85, zero clearcoat, running stride + neck bob) or custom rigged emu.glb.",
    "binoculars": "Procedural turned-brass double-barrel binoculars prop held/worn cleanly, or CC0 Poly Pizza import.",
    "pitchfork": "Procedural timber handle + 3-tine forged steel pitchfork prop, or CC0 Poly Pizza import.",
    "dispatch_box": "Procedural carved mahogany brass-bound Parliamentary Dispatch Box + lectern, or substitute wooden_crate/cabinet .glb.",
}


def http_get(url: str, timeout: int = 30) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read()


def http_json(url: str, cache_name: str = None, max_age_s: int = 86400):
    if cache_name:
        CACHE_INDEX_DIR.mkdir(parents=True, exist_ok=True)
        cp = CACHE_INDEX_DIR / cache_name
        if cp.exists() and (datetime.now().timestamp() - cp.stat().st_mtime) < max_age_s:
            try:
                return json.loads(cp.read_text(encoding="utf-8"))
            except Exception:
                pass
    data = json.loads(http_get(url, timeout=45).decode("utf-8"))
    if cache_name:
        try:
            (CACHE_INDEX_DIR / cache_name).write_text(json.dumps(data), encoding="utf-8")
        except Exception:
            pass
    return data


def verify_glb_bytes(data: bytes) -> bool:
    if len(data) < 28 or data[:4] != b"glTF":
        return False
    version, total_len = struct.unpack("<II", data[4:12])
    if version != 2 or total_len != len(data):
        return False
    chunk_len, chunk_type = struct.unpack("<II", data[12:20])
    if chunk_type != 0x4E4F534A or 20 + chunk_len > total_len:
        return False
    try:
        json.loads(data[20:20 + chunk_len].decode("utf-8").strip())
    except Exception:
        return False
    return True


def inspect_glb_quality(data: bytes) -> dict:
    """Inspects GLB v2 binary JSON chunk to verify textured PBR quality (rejects flat untextured toys)."""
    info = {
        "generator": "",
        "images": 0,
        "textures": 0,
        "materials": 0,
        "textured_materials": 0,
        "is_fbx2gltf": False,
        "is_textured_pbr": False,
    }
    if not verify_glb_bytes(data):
        return info
    chunk_len, _ = struct.unpack("<II", data[12:20])
    gltf = json.loads(data[20:20 + chunk_len].decode("utf-8").strip())
    gen = (gltf.get("asset") or {}).get("generator") or ""
    imgs = gltf.get("images") or []
    texs = gltf.get("textures") or []
    mats = gltf.get("materials") or []
    tex_mats = 0
    for m in mats:
        pmr = m.get("pbrMetallicRoughness") or {}
        if any(k in pmr for k in ("baseColorTexture", "metallicRoughnessTexture")) or "normalTexture" in m:
            tex_mats += 1
    info.update({
        "generator": gen,
        "images": len(imgs),
        "textures": len(texs),
        "materials": len(mats),
        "textured_materials": tex_mats,
        "is_fbx2gltf": "fbx2gltf" in gen.lower(),
        "is_textured_pbr": len(imgs) > 0 and tex_mats > 0,
    })
    return info


def item_requires_textured_pbr(item: dict) -> bool:
    """True for vehicles, hero props, architecture, furniture, lamps, trees, bushes, or flagged items."""
    if item.get("require_textured_pbr") is False:
        return False
    if item.get("require_textured_pbr") is True:
        return True
    cat = (item.get("category") or "").lower()
    if cat in STRICT_TEXTURED_CATEGORIES:
        return True
    role = (item.get("role") or "").lower()
    if role in {"architecture", "furniture", "lamp", "foliage"}:
        return True
    hay = f"{item.get('id', '')} {item.get('name', '')}".lower()
    if any(k in hay for k in ("tree", "bush", "shrub")):
        return True
    return False


def _find_polyhaven_alpha_url(img_name: str, asset_id: str, ph_files_meta: dict) -> str | None:
    """Matches Poly Haven alpha map key (e.g. glass_alpha, flame_alpha, leaves_alpha, Alpha) for an image."""
    if not ph_files_meta or not img_name:
        return None
    low = img_name.lower()
    if "alpha" not in low:
        return None
    tail = img_name.split("-")[-1]  # e.g. vintage_oil_lamp_glass_alpha or searsia_burchellii_alpha
    cand_keys = []
    if tail.lower().startswith(asset_id.lower() + "_"):
        cand_keys.append(tail[len(asset_id) + 1:])
    cand_keys.extend(["leaves_alpha", "glass_alpha", "flame_alpha", "accesories_alpha", "Alpha", "alpha"])
    for key in cand_keys:
        # Case-insensitive lookup in ph_files_meta
        matched = next((k for k in ph_files_meta if k.lower() == key.lower()), None)
        if not matched:
            continue
        block = ph_files_meta[matched]
        for res in ("1k", "2k", "4k"):
            rblk = block.get(res) or {}
            for fmt in ("png", "jpg"):
                if fmt in rblk and rblk[fmt].get("url"):
                    return rblk[fmt]["url"]
    return None


def _composite_rgba_png(diff_bytes: bytes, alpha_bytes: bytes) -> bytes | None:
    if Image is None:
        return None
    diff_im = Image.open(io.BytesIO(diff_bytes)).convert("RGB")
    alpha_im = Image.open(io.BytesIO(alpha_bytes)).convert("L")
    if alpha_im.size != diff_im.size:
        alpha_im = alpha_im.resize(diff_im.size, Image.Resampling.BILINEAR)
    diff_im.putalpha(alpha_im)
    buf = io.BytesIO()
    diff_im.save(buf, format="PNG", optimize=True)
    return buf.getvalue()


def pack_gltf_to_glb(
    gltf_bytes: bytes,
    base_files: dict,
    ph_files_meta: dict = None,
    asset_id: str = "",
    node_keep: str = None,
    mask_foliage: bool = False,
) -> bytes:
    """
    Packs a glTF 2.0 JSON + external .bin + image files into a single self-contained binary .glb.
    Also restores real RGBA PNG alpha channels from Poly Haven alpha maps and supports node pruning.
    """
    gltf = json.loads(gltf_bytes.decode("utf-8"))
    bin_parts = bytearray()

    # Optional single-variant botanical pruning (e.g. pick one lush bush node & center at origin)
    pruned_node_mode = False
    if node_keep:
        nodes = gltf.get("nodes") or []
        hit_idx = next((i for i, n in enumerate(nodes) if (n.get("name") or "").lower() == node_keep.lower()), None)
        if hit_idx is not None:
            nodes[hit_idx]["translation"] = [0.0, 0.0, 0.0]
            if gltf.get("scenes"):
                gltf["scenes"][0]["nodes"] = [hit_idx]
            pruned_node_mode = True

    if mask_foliage:
        for mat in gltf.get("materials") or []:
            if mat.get("alphaMode") == "BLEND":
                mat["alphaMode"] = "MASK"
                mat["alphaCutoff"] = 0.40

    # 1. Existing external buffer(s)
    buffers = gltf.get("buffers") or []
    if buffers:
        buf0 = buffers[0]
        uri = buf0.pop("uri", None)
        if uri and uri in base_files:
            bin_parts.extend(base_files[uri])
        elif uri and uri.startswith("data:"):
            import base64
            bin_parts.extend(base64.b64decode(uri.split(",", 1)[1]))
        while len(bin_parts) % 4:
            bin_parts.append(0)
    else:
        gltf["buffers"] = [{}]

    # Compact unused mesh bufferViews when node_keep trimmed other variants (shrinks 35MB -> ~11MB)
    if pruned_node_mode and gltf.get("scenes"):
        nodes = gltf.get("nodes") or []
        kept_nodes = set()
        stack = list(gltf["scenes"][0].get("nodes") or [])
        while stack:
            ni = stack.pop()
            if ni in kept_nodes:
                continue
            kept_nodes.add(ni)
            for ch in nodes[ni].get("children") or []:
                stack.append(ch)
        used_meshes = {nodes[ni]["mesh"] for ni in kept_nodes if "mesh" in nodes[ni]}
        used_accs = set()
        for mi in used_meshes:
            for p in (gltf.get("meshes") or [])[mi].get("primitives") or []:
                if "indices" in p:
                    used_accs.add(p["indices"])
                for ai in (p.get("attributes") or {}).values():
                    used_accs.add(ai)
        old_bvs = gltf.get("bufferViews") or []
        used_bvs = {gltf["accessors"][ai]["bufferView"] for ai in used_accs if "bufferView" in gltf["accessors"][ai]}
        new_bvs = []
        new_bin = bytearray()
        bv_remap = {}
        for idx, bv in enumerate(old_bvs):
            if idx not in used_bvs:
                continue
            while len(new_bin) % 4:
                new_bin.append(0)
            off = bv.get("byteOffset", 0)
            ln = bv["byteLength"]
            bv_copy = dict(bv)
            bv_copy["byteOffset"] = len(new_bin)
            new_bin.extend(bin_parts[off:off + ln])
            bv_remap[idx] = len(new_bvs)
            new_bvs.append(bv_copy)
        for ai in used_accs:
            acc = gltf["accessors"][ai]
            if "bufferView" in acc:
                acc["bufferView"] = bv_remap[acc["bufferView"]]
        gltf["bufferViews"] = new_bvs
        bin_parts = new_bin
        while len(bin_parts) % 4:
            bin_parts.append(0)

    # 2. Pack external images into bufferViews inside Buffer 0 (restoring alpha PNGs when needed)
    bvs = gltf.setdefault("bufferViews", [])
    alpha_cache = {}
    for img in gltf.get("images") or []:
        uri = img.get("uri")
        if not uri or "bufferView" in img or uri.startswith("data:"):
            continue
        raw = base_files.get(uri) or base_files.get(urllib.parse.unquote(uri))
        if raw is None:
            for k, v in base_files.items():
                if k.endswith("/" + uri) or uri.endswith("/" + k) or os.path.basename(k) == os.path.basename(uri):
                    raw = v
                    break
        if raw is None:
            continue

        ext = Path(uri).suffix.lower()
        mime = "image/png" if ext == ".png" else ("image/webp" if ext == ".webp" else "image/jpeg")

        # Poly Haven's glTF pack flattens `-alpha` textures to opaque JPG; restore true RGBA PNG
        alpha_url = _find_polyhaven_alpha_url(img.get("name", ""), asset_id, ph_files_meta)
        if alpha_url and Image is not None:
            try:
                if alpha_url not in alpha_cache:
                    alpha_cache[alpha_url] = http_get(alpha_url, timeout=45)
                rgba_png = _composite_rgba_png(raw, alpha_cache[alpha_url])
                if rgba_png:
                    raw = rgba_png
                    mime = "image/png"
            except Exception as e:
                print(f"  [warn] alpha composite for {img.get('name')} failed: {e}", file=sys.stderr)

        while len(bin_parts) % 4:
            bin_parts.append(0)
        offset = len(bin_parts)
        bin_parts.extend(raw)
        bv_idx = len(bvs)
        bvs.append({
            "buffer": 0,
            "byteOffset": offset,
            "byteLength": len(raw)
        })
        img.pop("uri", None)
        img["bufferView"] = bv_idx
        img["mimeType"] = mime

    while len(bin_parts) % 4:
        bin_parts.append(0)

    gltf["buffers"][0]["byteLength"] = len(bin_parts)
    json_raw = json.dumps(gltf, separators=(",", ":")).encode("utf-8")
    while len(json_raw) % 4:
        json_raw += b" "

    total_len = 12 + 8 + len(json_raw) + (8 + len(bin_parts) if bin_parts else 0)
    out = bytearray()
    out.extend(struct.pack("<4sII", b"glTF", 2, total_len))
    out.extend(struct.pack("<II", len(json_raw), 0x4E4F534A))
    out.extend(json_raw)
    if bin_parts:
        out.extend(struct.pack("<II", len(bin_parts), 0x004E4942))
        out.extend(bin_parts)
    return bytes(out)


class CC0Index:
    def __init__(self):
        self._kenney = None
        self._quaternius = None
        self._polyhaven = None

    def kenney(self):
        if self._kenney is None:
            tree = http_json(
                "https://api.github.com/repos/Kenney-CCO/Kenney-CCO.glb/git/trees/main?recursive=1",
                cache_name="kenney_tree.json",
            )
            self._kenney = [
                n["path"] for n in tree.get("tree", [])
                if n.get("type") == "blob" and n["path"].lower().endswith(".glb")
            ]
        return self._kenney

    def quaternius(self):
        if self._quaternius is None:
            tree = http_json(
                "https://api.github.com/repos/trebeljahr/quaternius-showcase/git/trees/main?recursive=1",
                cache_name="quaternius_tree.json",
            )
            self._quaternius = [
                n["path"] for n in tree.get("tree", [])
                if n.get("type") == "blob" and n["path"].lower().endswith(".glb")
            ]
        return self._quaternius

    def polyhaven(self):
        if self._polyhaven is None:
            self._polyhaven = http_json(
                "https://api.polyhaven.com/assets?t=models",
                cache_name="polyhaven_models.json",
            )
        return self._polyhaven


def download_kenney(path: str):
    url = "https://raw.githubusercontent.com/Kenney-CCO/Kenney-CCO.glb/main/" + urllib.parse.quote(path)
    data = http_get(url, timeout=45)
    if verify_glb_bytes(data):
        return data, "Kenney-CCO (CC0)", "CC0-1.0", url, path
    return None


def download_quaternius(path: str):
    url = "https://raw.githubusercontent.com/trebeljahr/quaternius-showcase/main/" + urllib.parse.quote(path)
    data = http_get(url, timeout=45)
    if verify_glb_bytes(data):
        return data, "Quaternius CC0 Showcase", "CC0-1.0", url, path
    return None


def download_polyhaven(asset_id: str, item_id: str = None):
    files = http_json(f"https://api.polyhaven.com/files/{asset_id}")
    gltf_block = files.get("gltf") or {}
    res_block = gltf_block.get("1k") or gltf_block.get("2k") or next(iter(gltf_block.values()), None)
    if not res_block or "gltf" not in res_block:
        return None
    main_info = res_block["gltf"]
    main_url = main_info["url"]
    gltf_bytes = http_get(main_url, timeout=45)
    extra = {}
    for rel_uri, meta in (main_info.get("include") or {}).items():
        if meta and meta.get("url"):
            extra[rel_uri] = http_get(meta["url"], timeout=45)
    opts = POLYHAVEN_PACK_OPTS.get(asset_id, {})
    glb_bytes = pack_gltf_to_glb(
        gltf_bytes,
        extra,
        ph_files_meta=files,
        asset_id=asset_id,
        node_keep=opts.get("node_keep"),
        mask_foliage=opts.get("mask_foliage", False),
    )
    if verify_glb_bytes(glb_bytes):
        page_url = f"https://polyhaven.com/a/{asset_id}"
        return glb_bytes, f"Poly Haven ({asset_id}, 1k glTF->GLB)", "CC0-1.0", page_url, main_url
    return None


def _shift_tex_indices(obj, offset: int):
    if isinstance(obj, dict):
        if "index" in obj and isinstance(obj["index"], int) and (len(obj) <= 3):
            obj["index"] += offset
        for v in obj.values():
            _shift_tex_indices(v, offset)
    elif isinstance(obj, list):
        for v in obj:
            _shift_tex_indices(v, offset)


def download_polyhaven_bookshelf_combo():
    """Combines Poly Haven wooden_bookshelf_worn + book_encyclopedia_set_01 rows into one 1K PBR bookshelf.glb."""
    s_res = download_polyhaven("wooden_bookshelf_worn")
    b_res = download_polyhaven("book_encyclopedia_set_01")
    if not s_res or not b_res:
        return s_res
    s_glb, _, _, s_page, s_url = s_res
    b_glb = b_res[0]

    def parse_glb(data):
        cl, = struct.unpack("<I", data[12:16])
        gj = json.loads(data[20:20 + cl].decode("utf-8").strip())
        bl = 0
        boff = 20 + cl
        if boff + 8 <= len(data):
            bl, _ = struct.unpack("<II", data[boff:boff + 8])
            bin_b = bytearray(data[boff + 8:boff + 8 + bl])
        else:
            bin_b = bytearray()
        return gj, bin_b

    g1, bin1 = parse_glb(s_glb)
    g2, bin2 = parse_glb(b_glb)

    while len(bin1) % 4:
        bin1.append(0)
    bin_off = len(bin1)
    bin1.extend(bin2)
    while len(bin1) % 4:
        bin1.append(0)

    bv_off = len(g1.get("bufferViews") or [])
    acc_off = len(g1.get("accessors") or [])
    img_off = len(g1.get("images") or [])
    samp_off = len(g1.get("samplers") or [])
    tex_off = len(g1.get("textures") or [])
    mat_off = len(g1.get("materials") or [])
    mesh_off = len(g1.get("meshes") or [])

    for bv in g2.get("bufferViews") or []:
        bv["buffer"] = 0
        bv["byteOffset"] = bv.get("byteOffset", 0) + bin_off
        g1.setdefault("bufferViews", []).append(bv)

    for acc in g2.get("accessors") or []:
        if "bufferView" in acc:
            acc["bufferView"] += bv_off
        g1.setdefault("accessors", []).append(acc)

    for im in g2.get("images") or []:
        if "bufferView" in im:
            im["bufferView"] += bv_off
        g1.setdefault("images", []).append(im)

    for sp in g2.get("samplers") or []:
        g1.setdefault("samplers", []).append(sp)

    for tx in g2.get("textures") or []:
        if "source" in tx:
            tx["source"] += img_off
        if "sampler" in tx:
            tx["sampler"] += samp_off
        g1.setdefault("textures", []).append(tx)

    for mt in g2.get("materials") or []:
        for k in ("pbrMetallicRoughness", "normalTexture", "occlusionTexture", "emissiveTexture"):
            if k in mt:
                _shift_tex_indices(mt[k], tex_off)
        g1.setdefault("materials", []).append(mt)

    for ms in g2.get("meshes") or []:
        for p in ms.get("primitives") or []:
            if "material" in p:
                p["material"] += mat_off
            if "indices" in p:
                p["indices"] += acc_off
            for ak, av in (p.get("attributes") or {}).items():
                p["attributes"][ak] = av + acc_off
        g1.setdefault("meshes", []).append(ms)

    # Create shelf book clusters referencing the 20 encyclopedia book nodes cleanly
    g2_nodes = g2.get("nodes") or []
    nodes = g1.setdefault("nodes", [])
    scene_nodes = g1["scenes"][0].setdefault("nodes", [])

    def add_book_row(subset_range, row_pos, row_scale=None):
        children = []
        base_idx = len(nodes)
        for bi in subset_range:
            if bi >= len(g2_nodes):
                break
            bn = json.loads(json.dumps(g2_nodes[bi]))
            if "mesh" in bn:
                bn["mesh"] += mesh_off
            children.append(len(nodes))
            nodes.append(bn)
        parent = {"name": f"book_row_{len(nodes)}", "translation": list(row_pos), "children": children}
        if row_scale:
            parent["scale"] = list(row_scale)
        pidx = len(nodes)
        nodes.append(parent)
        scene_nodes.append(pidx)

    # Place varied encyclopedia book groups flush on shelf planks (measured from wooden_bookshelf_worn)
    placements = [
        (range(0, 20), [-0.55, 0.112, 0.04], [1.0, 0.96, 1.0]),
        (range(2, 18), [0.06, 0.112, 0.05], [1.0, 0.92, 1.0]),
        (range(0, 17), [-0.54, 0.392, 0.05], [1.0, 0.95, 1.0]),
        (range(5, 20), [0.10, 0.392, 0.04], [1.0, 0.97, 1.0]),
        (range(1, 20), [-0.52, 0.672, 0.04], [1.0, 1.0, 1.0]),
        (range(0, 15), [0.12, 0.672, 0.05], [1.0, 0.94, 1.0]),
        (range(0, 20), [-0.55, 0.962, 0.05], [1.0, 1.04, 1.0]),
        (range(3, 19), [0.06, 0.962, 0.04], [1.0, 1.0, 1.0]),
        (range(2, 20), [-0.50, 1.282, 0.04], [1.0, 1.12, 1.0]),
        (range(0, 16), [-0.54, 1.662, 0.05], [1.0, 1.15, 1.0]),
        (range(4, 18), [0.08, 1.662, 0.04], [1.0, 1.10, 1.0]),
    ]
    for sub, pos, sc in placements:
        add_book_row(sub, pos, sc)

    g1["buffers"] = [{"byteLength": len(bin1)}]
    json_raw = json.dumps(g1, separators=(",", ":")).encode("utf-8")
    while len(json_raw) % 4:
        json_raw += b" "

    total_len = 12 + 8 + len(json_raw) + 8 + len(bin1)
    out = bytearray()
    out.extend(struct.pack("<4sII", b"glTF", 2, total_len))
    out.extend(struct.pack("<II", len(json_raw), 0x4E4F534A))
    out.extend(json_raw)
    out.extend(struct.pack("<II", len(bin1), 0x004E4942))
    out.extend(bin1)
    glb_bytes = bytes(out)
    if verify_glb_bytes(glb_bytes):
        return glb_bytes, "Poly Haven (wooden_bookshelf_worn + book_encyclopedia_set_01, 1k PBR)", "CC0-1.0", s_page, s_url
    return s_res


def _recolor_1950s_truck_glb(data: bytes) -> bytes:
    """
    Converts Grab3D 1950s-pickup-truck mint-green body & cream roof texture atlas into weathered
    matte 1932 olive-drab military paint (#4b5338) while preserving wood cargo deck planks & details.
    """
    if Image is None:
        return data
    try:
        import numpy as np
    except ImportError:
        return data

    cl, = struct.unpack("<I", data[12:16])
    gltf = json.loads(data[20:20 + cl].decode("utf-8").strip())
    boff = 20 + cl
    if boff + 8 > len(data):
        return data
    bl, _ = struct.unpack("<II", data[boff:boff + 8])
    bin_b = bytearray(data[boff + 8:boff + 8 + bl])

    rng = np.random.default_rng(1932)

    for im in gltf.get("images") or []:
        iname = (im.get("name") or "").lower()
        bv = gltf["bufferViews"][im["bufferView"]]
        off, ln = bv.get("byteOffset", 0), bv["byteLength"]
        raw = bytes(bin_b[off:off + ln])

        # Clamp metallic-roughness map on body_pbr so army paint reads matte weathered ~0.82 (not glossy showroom car paint)
        if "roughness" in iname and "body" in iname:
            pil = Image.open(io.BytesIO(raw)).convert("RGB")
            arr = np.asarray(pil, dtype=np.uint8).copy()
            arr[:, :, 1] = np.maximum(arr[:, :, 1], 212)  # G channel = roughness >= 0.83
            arr[:, :, 2] = np.minimum(arr[:, :, 2], 32)   # B channel = metalness <= 0.12
            buf = io.BytesIO()
            Image.fromarray(arr, "RGB").save(buf, format="JPEG", quality=90)
            new_jpg = buf.getvalue()
            while len(bin_b) % 4:
                bin_b.append(0)
            new_off = len(bin_b)
            bin_b.extend(new_jpg)
            bv["byteOffset"] = new_off
            bv["byteLength"] = len(new_jpg)
            im["mimeType"] = "image/jpeg"
            continue

        if "basecolor" not in iname:
            continue
        pil = Image.open(io.BytesIO(raw)).convert("RGB")
        arr = np.asarray(pil, dtype=np.float32)
        r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
        mx = np.maximum(r, np.maximum(g, b))
        mn = np.minimum(r, np.minimum(g, b))
        lum = 0.299 * r + 0.587 * g + 0.114 * b

        # Alias-free fine micro-grain (no sine moiré pattern)
        grain = rng.uniform(0.95, 1.04, size=r.shape).astype(np.float32)

        # Preserve warm golden-brown wood cargo bed planks, tan seats & amber lenses
        wood_mask = (r > g + 16) & (g > b + 14) & (r > 115) & (lum < 210)
        # Mint/sage body panels & background atlas padding -> matte olive drab (#4b5338 -> [75, 83, 56])
        mint_mask = (~wood_mask) & (g >= r + 2) & (g >= b + 3) & (lum > 70)
        # Cream cab roof & A-pillars -> weathered olive drab (#444c33)
        cream_mask = (~wood_mask) & (~mint_mask) & (lum > 170) & ((r - b) > 10) & ((mx - mn) < 85)
        # Bright chrome/white bumpers & mirror caps -> matte bumper steel (#585c54)
        white_mask = (~wood_mask) & (~mint_mask) & (~cream_mask) & (mn > 185) & ((mx - mn) < 32)

        out = arr.copy()
        shade_mint = np.clip(lum / 172.0, 0.55, 1.18) * grain
        out[mint_mask, 0] = 75.0 * shade_mint[mint_mask]
        out[mint_mask, 1] = 83.0 * shade_mint[mint_mask]
        out[mint_mask, 2] = 56.0 * shade_mint[mint_mask]

        shade_cream = np.clip(lum / 225.0, 0.65, 1.12) * grain
        out[cream_mask, 0] = 70.0 * shade_cream[cream_mask]
        out[cream_mask, 1] = 78.0 * shade_cream[cream_mask]
        out[cream_mask, 2] = 52.0 * shade_cream[cream_mask]

        shade_white = np.clip(lum / 228.0, 0.65, 1.12)
        out[white_mask, 0] = 92.0 * shade_white[white_mask]
        out[white_mask, 1] = 95.0 * shade_white[white_mask]
        out[white_mask, 2] = 88.0 * shade_white[white_mask]

        # Slightly weather the wooden cargo bed planks
        out[wood_mask, 0] *= 0.80
        out[wood_mask, 1] *= 0.74
        out[wood_mask, 2] *= 0.68

        out_u8 = np.clip(out, 0, 255).astype(np.uint8)
        buf = io.BytesIO()
        Image.fromarray(out_u8, "RGB").save(buf, format="JPEG", quality=90)
        new_jpg = buf.getvalue()

        while len(bin_b) % 4:
            bin_b.append(0)
        new_off = len(bin_b)
        bin_b.extend(new_jpg)
        bv["byteOffset"] = new_off
        bv["byteLength"] = len(new_jpg)
        im["mimeType"] = "image/jpeg"

    while len(bin_b) % 4:
        bin_b.append(0)
    gltf["buffers"][0]["byteLength"] = len(bin_b)
    json_raw = json.dumps(gltf, separators=(",", ":")).encode("utf-8")
    while len(json_raw) % 4:
        json_raw += b" "

    total_len = 12 + 8 + len(json_raw) + 8 + len(bin_b)
    packed = bytearray()
    packed.extend(struct.pack("<4sII", b"glTF", 2, total_len))
    packed.extend(struct.pack("<II", len(json_raw), 0x4E4F534A))
    packed.extend(json_raw)
    packed.extend(struct.pack("<II", len(bin_b), 0x004E4942))
    packed.extend(bin_b)
    return bytes(packed)


def download_grab3d(slug: str):
    url = f"https://grab3d.com/dl/{slug}/{slug}.glb"
    data = http_get(url, timeout=45)
    if verify_glb_bytes(data):
        if slug == "1950s-pickup-truck":
            data = _recolor_1950s_truck_glb(data)
        return data, f"Grab3D ({slug})", "CC0-1.0", f"https://grab3d.com/models/?q={slug}", url
    return None


def strict_live_search(item_id: str, idx: CC0Index, require_textured: bool = False):
    """Searches curated exact CC0 matches (prioritizing Poly Haven & Grab3D) and enforces textured PBR."""
    prefs = EXACT_PREFERENCES.get(item_id, [])
    for src, target in prefs:
        try:
            res = None
            if src == "polyhaven_combo" and target == "bookshelf_populated":
                res = download_polyhaven_bookshelf_combo()
            elif src == "polyhaven":
                models = idx.polyhaven()
                if target in models:
                    res = download_polyhaven(target, item_id=item_id)
            elif src == "grab3d":
                res = download_grab3d(target)
            elif src == "quaternius":
                files = idx.quaternius()
                hit = next((p for p in files if p.lower().endswith("/" + target.lower()) or os.path.basename(p).lower() == target.lower()), None)
                if hit:
                    res = download_quaternius(hit)
            elif src == "kenney":
                files = idx.kenney()
                hit = next((p for p in files if p.lower().endswith("/" + target.lower()) or os.path.basename(p).lower() == target.lower()), None)
                if hit:
                    res = download_kenney(hit)
            if res:
                qual = inspect_glb_quality(res[0])
                if require_textured and not qual["is_textured_pbr"]:
                    print(f"  [reject]  {src}:{target} has {qual['images']} image textures (isTruePBR=false; flat untextured model rejected)", file=sys.stderr)
                    continue
                return res
        except Exception as e:
            print(f"  [warn] candidate {src}:{target} for {item_id} failed: {e}", file=sys.stderr)

    # Strict exact token search on Poly Haven (textured PBR)
    tokens = [t for t in re.split(r"[_-]+", item_id) if len(t) >= 3 and t not in ("dry", "outback", "hero", "warm")]
    if tokens:
        try:
            for mid, meta in idx.polyhaven().items():
                name_low = (mid + " " + meta.get("name", "")).lower()
                if all(re.search(rf"(?<![a-z]){re.escape(t)}(?![a-z])", name_low) for t in tokens):
                    res = download_polyhaven(mid, item_id=item_id)
                    if res:
                        qual = inspect_glb_quality(res[0])
                        if not require_textured or qual["is_textured_pbr"]:
                            return res
        except Exception:
            pass
    return None


def load_catalog():
    if CATALOG_PATH.exists():
        try:
            return json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {"schema": "ricksclips-3d-library/v1", "updated_at": "", "assets": {}}


def save_catalog(cat: dict):
    cat["updated_at"] = datetime.now(timezone.utc).isoformat()
    CATALOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    CATALOG_PATH.write_text(json.dumps(cat, indent=2) + "\n", encoding="utf-8")


def sync_library_to_github_repo():
    gh_root = ROOT / "github_render_repo"
    if not gh_root.exists():
        return
    gh_lib = gh_root / "assets" / "3d_library"
    gh_lib.mkdir(parents=True, exist_ok=True)
    for src in LIB_DIR.rglob("*"):
        if ".index_cache" in src.parts or src.is_dir():
            continue
        rel = src.relative_to(LIB_DIR)
        dst = gh_lib / rel
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)
    # Keep template glb_loader.mjs in sync as well
    loader_src = ROOT / "templates" / "threejs_film" / "glb_loader.mjs"
    loader_dst = gh_root / "templates" / "threejs_film" / "glb_loader.mjs"
    if loader_src.exists() and loader_dst.parent.exists():
        shutil.copy2(loader_src, loader_dst)


def process_manifest(manifest_path: Path, refresh: bool = False, only_id: str = None, auto_preview: bool = True):
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    catalog = load_catalog()
    idx = CC0Index()
    lib_assets = catalog.setdefault("assets", {})

    counts = {"cached": 0, "fetched": 0, "missing": 0, "procedural": 0}

    for item in manifest.get("items", []):
        iid = item["id"]
        if only_id and iid != only_id:
            continue

        # Preserve approved procedural items cleanly unless explicitly targeted with --refresh --id
        if item.get("status") == "approved_option_a" and not (refresh and only_id == iid):
            counts["procedural"] += 1
            print(f"[proc]    {iid:20s} -> Approved Option (A) procedural asset")
            continue

        req_pbr = item_requires_textured_pbr(item)
        rel_lib = item.get("library_path") or f"assets/3d_library/{item['category']}/{iid}.glb"
        abs_lib = ROOT / rel_lib
        cat_entry = lib_assets.get(iid)

        # 1. Check cache first (reject flat untextured models or explicit needs_fetch items)
        if not refresh and item.get("status") != "needs_fetch" and abs_lib.exists() and abs_lib.stat().st_size > 128:
            raw_cached = abs_lib.read_bytes()
            if verify_glb_bytes(raw_cached):
                qual = inspect_glb_quality(raw_cached)
                if req_pbr and not qual["is_textured_pbr"]:
                    print(f"[upgrade] {iid:20s} cached file lacks PBR textures ({qual['images']} imgs, gen={qual['generator']}) — refetching textured PBR...")
                else:
                    item["library_path"] = rel_lib.replace("\\", "/")
                    item["status"] = "library_cached"
                    item["fallback_required"] = False
                    item["needs_approval"] = False
                    item["textured_pbr"] = qual["is_textured_pbr"]
                    item["texture_count"] = qual["images"]
                    if cat_entry:
                        item["source"] = cat_entry.get("source")
                        item["license"] = cat_entry.get("license")
                        item["source_url"] = cat_entry.get("source_url")
                        item["bytes"] = abs_lib.stat().st_size
                    counts["cached"] += 1
                    print(f"[cached]  {iid:20s} -> {rel_lib} (imgs={qual['images']})")
                    continue

        # 2. Search & fetch open CC0 asset
        print(f"[fetch]   {iid:20s} searching textured CC0 libraries (req_pbr={req_pbr})...")
        hit = strict_live_search(iid, idx, require_textured=req_pbr)
        if hit:
            glb_bytes, src_name, lic, url, orig = hit
            qual = inspect_glb_quality(glb_bytes)
            abs_lib.parent.mkdir(parents=True, exist_ok=True)
            abs_lib.write_bytes(glb_bytes)
            sha1 = hashlib.sha1(glb_bytes).hexdigest()
            norm_rel = rel_lib.replace("\\", "/")
            lib_assets[iid] = {
                "id": iid,
                "category": item["category"],
                "library_path": norm_rel,
                "source": src_name,
                "license": lic,
                "source_url": url,
                "original_file": orig,
                "sha1": sha1,
                "bytes": len(glb_bytes),
                "verified_glb": True,
                "textured_pbr": qual["is_textured_pbr"],
                "texture_count": qual["images"],
                "added_at": datetime.now(timezone.utc).isoformat()
            }
            item["library_path"] = norm_rel
            item["status"] = "library_fetched"
            item["source"] = src_name
            item["license"] = lic
            item["source_url"] = url
            item["sha1"] = sha1
            item["bytes"] = len(glb_bytes)
            item["textured_pbr"] = qual["is_textured_pbr"]
            item["texture_count"] = qual["images"]
            item["fallback_required"] = False
            item["needs_approval"] = False
            item.pop("approved_option", None)
            counts["fetched"] += 1
            print(f"[ok]      {iid:20s} <- {src_name} ({len(glb_bytes) // 1024} KB, imgs={qual['images']})")
        else:
            item["status"] = "missing_needs_approval"
            item["fallback_required"] = True
            item["needs_approval"] = True
            item["fallback_reason"] = "No verified textured CC0 .glb match found in Poly Haven or Grab3D."
            if iid in FALLBACK_HINTS:
                item["suggested_fallback"] = FALLBACK_HINTS[iid]
            counts["missing"] += 1
            print(f"[APPROVAL NEEDED] {iid:20s} — no verified CC0 .glb found; flagged in manifest")

    manifest["library_summary"] = {
        "cached": counts["cached"],
        "fetched": counts["fetched"],
        "procedural_approved": counts["procedural"],
        "needs_approval": counts["missing"],
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    save_catalog(catalog)
    sync_library_to_github_repo()

    gh_ep_dir = ROOT / "github_render_repo" / "episodes" / ("emu-war" if manifest_path.parent.name == "great-emu-war" else manifest_path.parent.name)
    if gh_ep_dir.exists():
        shutil.copy2(manifest_path, gh_ep_dir / "asset_manifest.json")

    print(f"\nSummary: cached={counts['cached']}, fetched={counts['fetched']}, procedural={counts['procedural']}, missing_needs_approval={counts['missing']}")

    if auto_preview and (counts["fetched"] > 0 or not (LIB_DIR / "previews").exists()):
        prev_script = ROOT / "tools" / "preview_3d_assets.mjs"
        if prev_script.exists():
            cmd = ["node", str(prev_script), str(manifest_path)]
            if only_id:
                cmd.extend(["--id", only_id])
            print("[preview] Rendering 3D studio .png previews...")
            subprocess.run(cmd, cwd=str(ROOT), check=False)


def main():
    ap = argparse.ArgumentParser(description="Fetch verified CC0 .glb assets from asset_manifest.json into assets/3d_library/")
    ap.add_argument("manifest", help="Path to episodes/<ep>/asset_manifest.json")
    ap.add_argument("--refresh", action="store_true", help="Re-download even if cached locally")
    ap.add_argument("--no-preview", action="store_true", help="Skip automatic studio .png preview generation")
    ap.add_argument("--id", help="Only process a single asset id")
    args = ap.parse_args()

    mp = Path(args.manifest)
    if not mp.is_absolute():
        mp = ROOT / mp
    process_manifest(mp, refresh=args.refresh, only_id=args.id, auto_preview=not args.no_preview)


if __name__ == "__main__":
    main()
