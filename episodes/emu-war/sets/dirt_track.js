// SET 4: BUMPY OUTBACK DIRT TRACK (High-Speed Truck Chase at Sunset)
// Deep red rutted desert dirt road, roadside spinifex scrub, telegraph poles,
// hero military flatbed truck bouncing violently, red-orange dusk lighting.

import { buildHeroTruck } from './hero_truck.js';

export async function build(THREE, scene, film, ctx) {
  const { B2T, toon } = ctx;
  const V = (x, y, z) => B2T([x, y, z]);
  const root = new THREE.Group();
  root.name = 'dirt_track';

  if (ctx.sky?.clouds) ctx.sky.clouds({
    kind: ctx.place?.sky_kind || 'dusk-storm',
    seed: 1932,
    coverage: 0.35,
    scale: 1.25,
    sunDir: [-0.65, 0.55, 0.15]
  });

  const RL = (kind, c, o = {}) => ctx.relief ? ctx.relief(kind, c, o) : toon(c);
  const MT = (kind, o = {}) => ctx.pbr ? ctx.pbr.metal(kind, o) : toon(o.toon || o.color || '#3c4470');

  const M = {
    redClay: RL('stone', '#a03b1e', { scale: 1.6 }),
    trackRuts: RL('stone', '#7d2c14', { scale: 1.2 }),
    scrubGrass: new THREE.MeshStandardMaterial({ color: 0x8a733b, roughness: 0.9, metalness: 0.05 }),
    telegraphWood: RL('wood', '#573c26', { scale: 1.1 }),
    ceramicInsulator: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 }),
    wireDark: MT('iron', { color: '#2b2a28', rough: 0.4, toon: '#222120' }),
    dustCloud: new THREE.MeshStandardMaterial({ color: 0xc8754b, transparent: true, opacity: 0.45, roughness: 1.0 })
  };

  const add = (geo, mat, name, role, p, parent = root) => {
    const m = new THREE.Mesh(geo, mat);
    m.name = name;
    m.userData.role = role;
    if (p) m.position.copy(p);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  };

  const box = (w, d, h, x, y, z, mat, name, role = 'prop') => {
    return add(new THREE.BoxGeometry(w, h, d), mat, name, role, V(x, y, z + h / 2));
  };

  // 1. Red Outback Desert Floor
  const groundGeo = new THREE.PlaneGeometry(40, 40);
  const ground = add(groundGeo, M.redClay, 'outback_desert_ground', 'ground', V(0, 0, 0));
  ground.rotation.x = -Math.PI / 2;

  // 2. The Rutted Dirt Road (Darker compacted tracks running diagonally)
  box(4.2, 38.0, 0.04, 0.0, 0.0, 0.0, M.trackRuts, 'dirt_road_strip', 'ground');
  // Two deep wheel ruts
  box(0.45, 38.0, 0.03, -1.1, 0.0, 0.02, M.redClay, 'wheel_rut_left', 'ground');
  box(0.45, 38.0, 0.03, 1.1, 0.0, 0.02, M.redClay, 'wheel_rut_right', 'ground');

  // 3. Wooden Telegraph Poles along Roadside
  for (let py = -14; py <= 14; py += 7) {
    const px = -2.8;
    box(0.18, 0.18, 4.2, px, py, 0.0, M.telegraphWood, `telegraph_pole_${py}`, 'wood');
    // Crossbar
    box(1.2, 0.12, 0.12, px, py, 3.8, M.telegraphWood, `telegraph_crossbar_${py}`, 'wood');
    // Insulators
    add(new THREE.CylinderGeometry(0.04, 0.04, 0.12, 6), M.ceramicInsulator, `insulator_L_${py}`, 'prop', V(px - 0.45, py, 3.92));
    add(new THREE.CylinderGeometry(0.04, 0.04, 0.12, 6), M.ceramicInsulator, `insulator_R_${py}`, 'prop', V(px + 0.45, py, 3.92));
  }

  // 4. Hero Military Flatbed Truck in Active Pursuit
  // Tilted slightly up and pitched forward as if bouncing over desert ruts
  const speedingTruck = buildHeroTruck(THREE, ctx, {
    pos: [0.0, 0.0, 0.08],
    yaw: 0.0,
    gunPitch: -0.22,
    gunYaw: 0.15
  });
  speedingTruck.rotation.z = 0.06; // Rolled bump
  speedingTruck.rotation.x = 0.04; // Pitch bump
  root.add(speedingTruck);

  // 5. Billowing Exhaust & Wheel Dust Clouds behind Truck
  const dustPositions = [
    [-0.9, -2.4, 0.35, 0.65],
    [0.9, -2.4, 0.40, 0.70],
    [-0.7, -3.8, 0.65, 0.95],
    [0.7, -3.9, 0.75, 1.10]
  ];
  dustPositions.forEach(([dx, dy, dz, dr], idx) => {
    add(new THREE.SphereGeometry(dr, 7, 7), M.dustCloud, `speed_dust_puff_${idx}`, 'fx', V(dx, dy, dz));
  });

  // 6. Desert Spinifex Tufts along Road Shoulders
  for (let sy = -12; sy <= 12; sy += 3.2) {
    add(new THREE.DodecahedronGeometry(0.4, 0), M.scrubGrass, `spinifex_L_${sy}`, 'plant', V(-3.2 + Math.sin(sy) * 0.4, sy, 0.2));
    add(new THREE.DodecahedronGeometry(0.45, 0), M.scrubGrass, `spinifex_R_${sy}`, 'plant', V(3.4 + Math.cos(sy) * 0.4, sy, 0.2));
  }

  scene.add(root);
  return {
    anchors: {
      truck_center: V(0.0, 0.0, 0.0),
      gunner_platform: V(0.0, -0.65, 1.34),
      emu_lead_pack: V(0.0, 5.5, 0.0)
    }
  };
}
