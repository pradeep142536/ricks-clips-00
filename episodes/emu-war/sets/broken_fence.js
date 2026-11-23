// SET 5: BROKEN WOODEN FARM FENCE & TRUCK CRASH (The Farm Collision)
// Splintered timber rails, tilted fence posts, rabbit burrows,
// crashed hero truck tangled in wire and steaming radiator.

import { buildHeroTruck } from './hero_truck.js';

export async function build(THREE, scene, film, ctx) {
  const { B2T, toon } = ctx;
  const V = (x, y, z) => B2T([x, y, z]);
  const root = new THREE.Group();
  root.name = 'broken_fence';

  if (ctx.sky?.clouds) ctx.sky.clouds({
    kind: ctx.place?.sky_kind || 'dusk-storm',
    seed: 1932,
    coverage: 0.4,
    scale: 1.15,
    sunDir: [-0.7, 0.45, 0.2]
  });

  const RL = (kind, c, o = {}) => ctx.relief ? ctx.relief(kind, c, o) : toon(c);
  const MT = (kind, o = {}) => ctx.pbr ? ctx.pbr.metal(kind, o) : toon(o.toon || o.color || '#3c4470');

  const M = {
    redSoil: RL('stone', '#96391d', { scale: 1.5 }),
    postWood: RL('wood', '#573820', { scale: 1.0 }),
    splinterWood: RL('wood', '#855938', { scale: 0.8 }),
    wireDark: MT('iron', { color: '#242528', rough: 0.45, toon: '#1e1f21' }),
    burrowHole: new THREE.MeshBasicMaterial({ color: 0x120a06 }),
    steamWhite: new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.65, roughness: 1.0 }),
    wheatTrampled: RL('wood', '#ab8938', { scale: 0.9 })
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

  // 1. Outback Farm Ground
  const groundGeo = new THREE.PlaneGeometry(36, 36);
  const ground = add(groundGeo, M.redSoil, 'crash_site_ground', 'ground', V(0, 0, 0));
  ground.rotation.x = -Math.PI / 2;

  // 2. Standing & Shattered Split-Rail Fence Line
  // Left Standing Posts
  box(0.18, 0.18, 1.35, -5.5, 0.5, 0.0, M.postWood, 'fence_post_L1', 'wood');
  box(0.18, 0.18, 1.35, -3.2, 0.5, 0.0, M.postWood, 'fence_post_L2', 'wood');
  box(2.4, 0.08, 0.14, -4.35, 0.5, 0.5, M.postWood, 'rail_intact_L', 'wood');

  // Center Breached & Splintered Posts (Smashed by truck and emus)
  const snappedPost1 = box(0.18, 0.18, 0.55, -0.9, 0.5, 0.0, M.postWood, 'fence_post_snapped_1', 'wood');
  snappedPost1.rotation.z = -0.35;
  const snappedPost2 = box(0.18, 0.18, 0.65, 1.2, 0.5, 0.0, M.postWood, 'fence_post_snapped_2', 'wood');
  snappedPost2.rotation.z = 0.42;

  // Splintered Wood Rails scattered on ground
  const splinters = [
    [-1.2, 0.8, 0.05, 0.9, 0.6],
    [-0.4, 1.1, 0.06, -0.4, 0.8],
    [0.7, 0.9, 0.05, 0.3, -0.5],
    [1.5, 1.3, 0.06, -0.8, 0.3]
  ];
  splinters.forEach(([sx, sy, sz, ry, rz], idx) => {
    const sp = box(1.1, 0.08, 0.12, sx, sy, sz, M.splinterWood, `splinter_rail_${idx}`, 'wood');
    sp.rotation.y = ry;
    sp.rotation.z = rz;
  });

  // 3. Rabbit Burrows in the Earth under the breach
  const burrowPositions = [[-1.5, 0.3], [0.2, 0.4], [1.8, 0.2]];
  burrowPositions.forEach(([bx, by], idx) => {
    const hole = add(new THREE.CircleGeometry(0.22, 12), M.burrowHole, `rabbit_burrow_${idx}`, 'prop', V(bx, by, 0.01));
    hole.rotation.x = -Math.PI / 2;
  });

  // 4. Crashed Hero Military Flatbed Truck
  // Truck is angled sideways, wedged into the fence posts
  const crashedTruck = buildHeroTruck(THREE, ctx, {
    pos: [0.3, 0.4, 0.0],
    yaw: 0.35,
    gunPitch: 0.45, // Gun pointed uselessly into sky
    gunYaw: -0.3
  });
  crashedTruck.rotation.z = -0.12; // Banked into ditch
  root.add(crashedTruck);

  // 5. White Steam billowing from the punctured Radiator Cap
  const steamPuffs = [
    [0.45, 1.65, 0.95, 0.25],
    [0.48, 1.70, 1.25, 0.38],
    [0.42, 1.75, 1.60, 0.52]
  ];
  steamPuffs.forEach(([sx, sy, sz, sr], idx) => {
    add(new THREE.SphereGeometry(sr, 8, 8), M.steamWhite, `radiator_steam_${idx}`, 'fx', V(sx, sy, sz));
  });

  scene.add(root);
  return {
    anchors: {
      crash_center: V(0.3, 0.4, 0.0),
      fence_breach: V(0.0, 0.5, 0.0),
      farmer_stand: V(-2.4, -0.5, 0.0)
    }
  };
}
