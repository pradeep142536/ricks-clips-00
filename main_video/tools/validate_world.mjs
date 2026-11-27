import fs from 'node:fs';
const map = JSON.parse(fs.readFileSync(new URL('../04_world/world_map.json', import.meta.url), 'utf8'));
if (map.locations.length !== 8) throw new Error(`Expected 8 locations, got ${map.locations.length}`);
if (map.connections.length !== 6) throw new Error(`Expected 6 connections, got ${map.connections.length}`);
const world = await import(new URL('../04_world/emu_connected_world.js', import.meta.url));
if (typeof world.build !== 'function') throw new Error('World builder must export build()');
const source = fs.readFileSync(new URL('../04_world/emu_connected_world.js', import.meta.url), 'utf8');
for (const id of ['military_truck','eucalyptus_tree','ammo_crate','field_radio','sandbag','dry_grass']) {
  if (!source.includes(`'${id}'`)) throw new Error(`Finished world must place detailed asset: ${id}`);
}
const preview = fs.readFileSync(new URL('../08_preview/world_preview.html', import.meta.url), 'utf8');
if (!preview.includes('createAssetHelper')) throw new Error('Preview must load the GLB asset library');
if (preview.includes('camera.position.set(18,13,62)')) throw new Error('Preview camera is still the rejected high map view');
console.log(`WORLD_CHECK_PASS locations=${map.locations.length} connections=${map.connections.length} builder=ok assets=6 camera=ground-level`);
