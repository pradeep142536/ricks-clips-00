# RicksClips Asset-First 3D `.glb` Pipeline & Cinema Standard V4.5

This repository uses an **Asset-First 3D `.glb` Pipeline** integrated directly with `templates/threejs_film/` and GPU/Blender pipelines (`render.mjs`, `render_gpu.mjs`, `tools/blender_pipeline/`). Every episode inherits **RicksClips Cinema Standard V4.5** — sunlit `daylight_crisp` / `golden_hour_sunset` `FogExp2` + `ACESFilmicToneMapping`, dynamic `0.2s` whip-pans and crane/tracking cameras, `particles3d.mjs` emitters, V4.0 characters integrated inside vehicles (`attach`), and the **Genius Riddle Formula**.

---

## Mandatory 5-Step Episode Workflow

### Step 1 — Genius Riddle Script (`SCRIPT.md`) & Breakdown (`asset_manifest.json`)
Never write a flat chronological summary and **never spoil the twist in the first 4 seconds**. Every Cinema V4.5 script (~50–62 seconds) MUST follow the **Genius Riddle Formula** (template: `RicksClips_Skill_V1.1/templates/SCRIPT_V3_TEMPLATE.md`):
1. **0:00–0:04 — Riddle Hook (Never Spoil the Twist):** Drop straight into an impossible contradiction or strange action without revealing the payoff.
2. **0:04–0:16 — The Strange Rule:** Show the odd constraint/mechanism with a readable in-world sign/prop.
3. **0:16–0:30 — The Laughing Rival:** Smug rival mocks the hero/contraption, raising tension (`whip` punch-in cut).
4. **0:30–0:48 — Animated 3D Visual Proof / Gauge:** Show live 3D visual proof (animated pressure gauge, diagram, mechanical test, `ctx.particles` steam/sparks) instead of talking exposition.
5. **0:48–1:02 — The Visual Metaphor Payoff:** Resolve the riddle cleanly through a memorable visual metaphor flip.

Generate `episodes/<ep>/asset_manifest.json` from `SCRIPT.md` + `PICTURE_PLAN.md`:
```bash
python tools/asset_breakdown.py episodes/<ep>
```

---

### Step 2 — Reusable 3D Asset Library (`assets/3d_library/`) & Set Density
Populate the shared `.glb` library:
```bash
python tools/fetch_3d_assets.py episodes/<ep>/asset_manifest.json
node tools/preview_3d_assets.mjs episodes/<ep>/asset_manifest.json
```
Quality & Density Rules:
1. **Textured PBR `.glb` Standard:** Prioritize **Poly Haven** (1K PBR + alpha restoration) and **Grab3D CC0** textured `.glb` assets. Flat 0-texture low-poly toys and sphere foliage are **rejected**.
2. **Preserve Glass & Emissives:** `unifyArtStyle()` preserves `alphaMode: "BLEND"`, `transparent: true`, `opacity < 1`, and `emissiveMap` while keeping matte roughness `>= 0.78–0.85` and `clearcoat: 0`.
3. **Dense Set Dressing (12–15+ Props/Structures Minimum):** Every set MUST have dense foreground, midground, and background 3D geometry — never empty voids or 2-building rooms.
4. **In-World Visual Gag Props Every 2–3 Sentences:** Use `prop_helpers.js` (`createBigRedButton`, `createGagSignOrLabel`, `createDocumentProp`, `createDetailedCoffeeCup`, etc.) + `.glb` hero props so every 2–3 narration lines center on a **readable physical gag prop in the 3D world** (never floating UI text boxes).
5. **Studio Contact Sheet Sign-Off:** Render 512×512 `.png` previews and `episodes/<ep>/out/previews/all_assets_grid.png` before video rendering.

---

### Step 3 — Comic Ink Outlines, Forward-Axis Guardrail & Lighting (`glb_loader.mjs` + `film.js`)
Every spawned `.glb` and V3.0 set automatically receives:
- **Camera-Distance-Scaled Black Ink Outlines (`addInkOutlines` & `ctx.outline()`):** Clean BackSide smoothed-normal comic ink silhouettes (`#231218`) scaled to camera distance (`clamp(dist * 0.0024, 0.003, 0.036)`) on hero props, furniture, doors, vehicles, and buildings (skipping glass, emissives, and leaf cards) — unifying 2D characters and 3D sets into one cohesive cartoon world.
- **Bright, Saturated Lighting — Even at Night (`LIGHTS.night` & `baseLight`):** Ban muddy pitch-black nights. `LIGHTS.night` uses rich cobalt blue sky/ambient (`ambient >= 0.45`, default `ai: 1.25`), warm amber practical lights, and crisp rim lighting so every 3D prop and texture stays 100% readable.
- **Forward-Axis Alignment Guardrail (`alignForwardToVelocity` / `ctx.alignForward`):** Automatically detects local nose/front orientation (`detectForwardAxis`) and aligns moving vehicles/creatures directly to their velocity vector — preventing backwards takeoffs or reversing props.
- **9:16 Central 80% Safe-Zone Framing (`isInSafeZone9x16` & `checkSafeZoneAll`):** Keep all readable signs, gag labels, and buttons inside the central `[0.10..0.90]` horizontal band so zero text is ever clipped on vertical screens.
- **Normalized Pivot & Clearance:** Bottom-center `min.y = 0`, soft radial contact AO shadow at `y = 0.008`, global dot/bokeh ban (`LOOK.dust = 0`, `dustFor() -> null`), and spherical bulb bloom without horizontal glare streaks.

---

### Step 4 — Extreme Camera Variety & Cartoon Acting (`build_film.py` + `film.js` + `poses.mjs`)
- **Mix All 5 Camera Angles Every `1.5–2.5s`:**
  1. **Macro Insert Close-Ups** (filling the frame with a labeled prop, button, screen, gauge, or padlock)
  2. **Top-Down / Overhead Shots** (looking straight down at desk, room, street, or vehicle trajectory)
  3. **Doorway / Peeking Angles** (framed past a doorway, window, or foreground prop)
  4. **3/4 Over-the-Shoulder & Low-Angle Hero Shots** (looking up at authority/villain or past shoulder at held prop)
  5. **Punch-In Reaction Cuts** (instant 20–30% zoom-in for `0.5–1.0s` on shock/comedic beats)
- **Articulated Rig + Physical Cartoon Acting:** 2-segment knee-bending walking/running legs (`m:walk/A`, `m:run/A`, `footY = 0`), self-illuminated unlit faces (`card_emit: 1.0`), V3.0 acting poses (`feet_up`, `slump`, `lean_prop`, `hold_camera`, `kneel_work`), beat-locked expressions (zero random cycling, brief `0.5–1.0s` `jawdrop`), cartoon rage shake + automatic red face flush (`/rage|fury/` or `rage: true`) + `steam_ear` VFX, and continuous physical action transitions (`no zigzag teleporting`).

---

### Step 5 — Audio, Captions & Automated Quality Gates
1. **Asset Previews:** Generate labeled 512×512 `.png` previews + `all_assets_grid.png` via `tools/preview_3d_assets.mjs`.
2. **Full Audio Mix & Captions:** Crisp voice (`words.json`), ducked energy-matched music (`-20 dB`), dense synced foley (`sound/final_audio.wav`), and bold white black-outlined 1–3 word captions at `caption_y = 0.715`.
3. **Clearance & Safe-Zone Gate:** Run `node templates/threejs_film/render.mjs episodes/<ep>/film.json --check-clearance` -> **0 collisions** (`out/plan/clearance.json`).
4. **Plan & GPU Render:** Verify `python tools/film_plan.py check episodes/<ep>/film.json` and render `1080×1920` `30 fps` `out/final_short.mp4` on NVIDIA Vulkan GPU (`Colab Tesla T4` or `render_gpu.mjs`), verified with `ffprobe` and extracted frame inspection.
