import fs from 'node:fs';
const spec = JSON.parse(fs.readFileSync(new URL('../07_render/preview_render_spec.json', import.meta.url), 'utf8'));
if (spec.gpu.max_runtime_seconds !== 10800) throw new Error('GPU timeout must be exactly 3 hours');
if (spec.mode !== 'inspection-only' || spec.full_video_allowed !== false) throw new Error('Full video must remain blocked at inspection stage');
if (spec.required_source_files.length !== 5) throw new Error('Missing required source files');
console.log(`RENDER_SPEC_PASS timeout=${spec.gpu.max_runtime_seconds}s sources=${spec.required_source_files.length} legacy_blocked=${spec.forbidden_legacy_inputs.length}`);
