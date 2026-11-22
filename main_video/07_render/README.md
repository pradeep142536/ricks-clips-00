# Render control

The first cloud render is inspection-only. It must create the five world proof views and the scale/ground reports before a full video render is allowed.

The render job must use only files under `Main video` and must reject every path listed in `preview_render_spec.json` under `forbidden_legacy_inputs`.
