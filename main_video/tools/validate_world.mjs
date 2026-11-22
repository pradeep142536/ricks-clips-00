import fs from 'node:fs';
const map = JSON.parse(fs.readFileSync(new URL('../04_world/world_map.json', import.meta.url), 'utf8'));
if (map.locations.length !== 8) throw new Error(`Expected 8 locations, got ${map.locations.length}`);
if (map.connections.length !== 6) throw new Error(`Expected 6 connections, got ${map.connections.length}`);
const world = await import(new URL('../04_world/emu_connected_world.js', import.meta.url));
if (typeof world.build !== 'function') throw new Error('World builder must export build()');
console.log(`WORLD_CHECK_PASS locations=${map.locations.length} connections=${map.connections.length} builder=ok`);
