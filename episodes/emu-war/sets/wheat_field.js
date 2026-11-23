// SET 1: SUN-BAKED OUTBACK WHEAT FIELD (Campion District, Western Australia)
// Golden ripe wheat stalks, dry cracked red earth, split-rail timber fence, Eucalyptus gum trees,
// and parked 1930s hero military truck.

import { buildHeroTruck } from './hero_truck.js';

export async function build(THREE, scene, film, ctx) {
  const { B2T, toon } = ctx;
  const V = (x, y, z) => B2T([x, y, z]);
  const root = new THREE.Group();
  root.name = 'wheat_field';

  if (ctx.sky?.clouds) ctx.sky.clouds({
    kind: ctx.place?.sky_kind || 'clear-day',
    seed: 1932,
    coverage: 0.25,
    scale: 1.2,
    sunDir: [0.35, 0.75, 0.45]
  });

  const RL = (kind, c, o = {}) => ctx.relief ? ctx.relief(kind, c, o) : toon(c);
  const MT = (kind, o = {}) => ctx.pbr ? ctx.pbr.metal(kind, o) : toon(o.toon || o.color || '#3c4470');

  const M = {
    redDirt: RL('stone', '#a84c2a', { scale: 1.6 }),
    wheatGold: new THREE.MeshStandardMaterial({ color: 0xdec068, roughness: 0.85, metalness: 0.05 }),
    wheatStraw: RL('wood', '#c9a54b', { scale: 0.9 }),
    timberPost: RL('wood', '#63442a', { scale: 1.1 }),
    timberRail: RL('wood', '#785334', { scale: 1.0 }),
    gumBark: RL('wood', '#5c544d', { scale: 1.3 }),
    gumLeaves: new THREE.MeshStandardMaterial({ color: 0x485c3b, roughness: 0.7, metalness: 0.1 }),
    shadowMat: new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35 })
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

  // 1. Red Clay Outback Ground
  const groundGeo = new THREE.PlaneGeometry(40, 40);
  const ground = add(groundGeo, M.redDirt, 'outback_red_soil', 'ground', V(0, 0, 0));
  ground.rotation.x = -Math.PI / 2;

  // 2. Dense Golden Wheat Field (Patches of wheat clusters)
  const wheatGeo = new THREE.CylinderGeometry(0.015, 0.02, 0.85, 5);
  const wheatHeadGeo = new THREE.ConeGeometry(0.04, 0.18, 5);

  for (let gx = -7; gx <= 7; gx += 0.45) {
    for (let gy = 1.2; gy <= 8.5; gy += 0.45) {
      if (Math.abs(gx) < 1.0 && gy < 4.0) continue; // Clear path for actors
      const ox = gx + (Math.sin(gx * 5 + gy) * 0.18);
      const oy = gy + (Math.cos(gy * 3 + gx) * 0.18);
      const stalk = add(wheatGeo, M.wheatStraw, 'wheat_stalk', 'plant', V(ox, oy, 0.42));
      stalk.rotation.z = (Math.sin(ox * 2) * 0.08);
      const head = add(wheatHeadGeo, M.wheatGold, 'wheat_head', 'plant', V(ox, oy, 0.88));
      head.rotation.z = stalk.rotation.z;
    }
  }

  // 3. Split-Rail Wooden Paddock Fence
  for (let fx = -8; fx <= 8; fx += 2.5) {
    box(0.18, 0.18, 1.35, fx, 0.5, 0.0, M.timberPost, `fence_post_${fx}`, 'wood');
    // Horizontal split rails
    box(2.5, 0.08, 0.14, fx + 1.25, 0.5, 0.45, M.timberRail, `fence_rail_low_${fx}`, 'wood');
    box(2.5, 0.08, 0.14, fx + 1.25, 0.5, 0.95, M.timberRail, `fence_rail_high_${fx}`, 'wood');
  }

  // 4. Australian Eucalyptus Gum Trees (Background)
  const gumTreePositions = [
    [-6.5, 9.5, 3.8], [5.8, 10.2, 4.2], [9.2, 8.0, 3.6], [-8.5, 7.5, 3.4]
  ];
  gumTreePositions.forEach(([tx, ty, th], idx) => {
    const trunk = add(new THREE.CylinderGeometry(0.24, 0.38, th, 8), M.gumBark, `gum_tree_trunk_${idx}`, 'wood', V(tx, ty, th / 2));
    // Canopy
    const foliage = add(new THREE.DodecahedronGeometry(1.4, 1), M.gumLeaves, `gum_tree_foliage_${idx}`, 'plant', V(tx, ty, th + 0.6));
  });

  // 5. Parked Hero Military Flatbed Truck
  const heroTruck = buildHeroTruck(THREE, ctx, {
    pos: [2.8, -0.4, 0.0],
    yaw: -0.25
  });
  root.add(heroTruck);

  // Contact Shadow under truck
  const truckShadow = add(new THREE.PlaneGeometry(2.4, 5.0), M.shadowMat, 'truck_contact_shadow', 'shadow', V(2.8, -0.4, 0.01));
  truckShadow.rotation.x = -Math.PI / 2;
  truckShadow.rotation.z = -0.25;

  scene.add(root);
  return {
    anchors: {
      soldier_station: V(-0.6, 0.0, 0.0),
      officer_spot: V(0.5, -0.2, 0.0),
      emu_horizon: V(0.0, 9.0, 0.0)
    }
  };
}
