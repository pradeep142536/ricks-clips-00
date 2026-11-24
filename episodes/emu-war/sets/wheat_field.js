// SET 1: SUN-BAKED OUTBACK WHEAT FIELD (Campion District, Western Australia)
// Golden wheat paddock, rich red earthen soil, Australian split-rail timber fence,
// procedural gum/olive/cypress trees (from kit3d), cel clouds, parked hero truck,
// and distant foraging/running 3D emu flock.

import { buildHeroTruck } from './hero_truck.js';
import { buildEmuFlock } from './emu_flock.js';

export async function build(THREE, scene, film, ctx) {
  const { B2T, toon, pbr, relief, sky, trees } = ctx;
  const V = (x, y, z) => B2T([x, y, z]);
  const root = new THREE.Group();
  root.name = 'wheat_field';

  // 1. DYNAMIC VOLUMETRIC SKY (Clear hot Australian sun + soft cel clouds)
  if (sky?.clouds) {
    sky.clouds({
      kind: 'clear-day',
      seed: 1932,
      coverage: 0.35,
      scale: 1.3,
      sunDir: [0.35, 0.75, 0.45]
    });
  }

  const RL = (kind, c, o = {}) => relief ? relief(kind, c, o) : toon(c);
  const MT = (kind, o = {}) => pbr ? pbr.metal(kind, o) : toon(o.toon || o.color || '#3c4470');

  const M = {
    outbackRedSoil: RL('mud', '#a44426', { scale: 2.0 }),
    wheatPaddockSoil: RL('grass', '#bfa048', { scale: 2.4 }),
    wheatGoldHead: new THREE.MeshStandardMaterial({ color: 0xdec068, roughness: 0.85, metalness: 0.05 }),
    wheatStrawStem: RL('wood', '#c49a3c', { scale: 0.8 }),
    fenceTimber: RL('wood', '#58402c', { scale: 1.1 }),
    fenceWire: MT('steel', { color: '#68707c', rough: 0.4, toon: '#58606c' }),
    contactAO: new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.55 })
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

  const box = (w, d, h, x, y, z, mat, name, role = 'prop', parent = root) => {
    return add(new THREE.BoxGeometry(w, h, d), mat, name, role, V(x, y, z + h / 2), parent);
  };

  // 2. RED CLAY OUTBACK TERRAIN (Not patio bricks!)
  const groundGeo = new THREE.PlaneGeometry(60, 60);
  const ground = add(groundGeo, M.outbackRedSoil, 'outback_red_soil', 'ground', V(0, 5, 0));
  ground.rotation.x = -Math.PI / 2;

  // Golden wheat field paddock soil patch
  const paddockGeo = new THREE.PlaneGeometry(28, 20);
  const paddock = add(paddockGeo, M.wheatPaddockSoil, 'wheat_paddock_patch', 'ground', V(0, 6.5, 0.005));
  paddock.rotation.x = -Math.PI / 2;

  // 3. PROCEDURAL AUSTRALIAN TREES (Using the engine tree generator)
  if (trees?.tree) {
    trees.tree({ kind: 'olive', at: [-6.8, 10.5, 0], seed: 1932, height: 6.2 });
    trees.tree({ kind: 'oak', at: [7.2, 11.0, 0], seed: 1933, height: 7.6 });
    trees.tree({ kind: 'cypress', at: [9.5, 8.5, 0], seed: 1934, height: 9.8 });
    trees.tree({ kind: 'olive', at: [-8.8, 8.0, 0], seed: 1935, height: 6.8 });
    for (let i = 0; i < 7; i++) {
      trees.tree({ kind: 'cypress', at: [-20 + i * 6.5, 26 + (i % 2) * 4, 0], seed: 100 + i, height: 8 + (i % 3) * 2 });
    }
  }

  // 4. ORGANIC WHEAT BLADE CLUSTERS
  const stalkGeo = new THREE.CylinderGeometry(0.012, 0.016, 0.82, 5);
  const headGeo = new THREE.ConeGeometry(0.038, 0.20, 6);

  // Instanced clusters behind the paddock fence
  for (let gx = -9; gx <= 9; gx += 0.55) {
    for (let gy = 2.2; gy <= 8.5; gy += 0.55) {
      if (Math.abs(gx) < 1.2 && gy < 4.5) continue; // Clear path for camera & actors
      const ox = gx + (Math.sin(gx * 7 + gy) * 0.22);
      const oy = gy + (Math.cos(gy * 5 + gx) * 0.22);
      const lean = Math.sin(ox * 3) * 0.12;

      const stalk = add(stalkGeo, M.wheatStrawStem, 'wheat_stalk', 'plant', V(ox, oy, 0.41));
      stalk.rotation.z = lean;
      const head = add(headGeo, M.wheatGoldHead, 'wheat_head', 'plant', V(ox, oy, 0.86));
      head.rotation.z = lean;
    }
  }

  // 5. AUSTRALIAN PADDOCK TIMBER FENCE & WIRE
  for (let fx = -9; fx <= 9; fx += 2.8) {
    // Rough-hewn timber post
    box(0.16, 0.16, 1.35, fx, 1.2, 0.0, M.fenceTimber, `fence_post_${fx}`, 'wood');
    // Top & bottom split-rails
    box(2.8, 0.08, 0.12, fx + 1.4, 1.2, 0.42, M.fenceTimber, `fence_rail_low_${fx}`, 'wood');
    box(2.8, 0.08, 0.12, fx + 1.4, 1.2, 0.96, M.fenceTimber, `fence_rail_high_${fx}`, 'wood');
  }
  // Galvanized wire strands running through fence
  for (const wz of [0.28, 0.68, 1.15]) {
    const wire = add(new THREE.CylinderGeometry(0.005, 0.005, 20.0, 6), M.fenceWire, `fence_wire_${wz}`, 'metal', V(0, 1.2, wz));
    wire.rotation.z = Math.PI / 2;
  }

  // 6. PARKED HERO MILITARY FLATBED TRUCK
  const heroTruck = buildHeroTruck(THREE, ctx, {
    pos: [3.2, 0.2, 0.0],
    yaw: -0.32
  });
  root.add(heroTruck);

  // 7. DISTANT 3D EMU FLOCK (Foraging and moving across the wheat horizon)
  const emuFlock = buildEmuFlock(THREE, ctx, {
    count: 10,
    baseX: -1.0,
    baseY: 9.5,
    spreadX: 14.0,
    spreadY: 4.0,
    yaw: Math.PI * 0.95
  });
  root.add(emuFlock);

  // 8. CONTACT AO SHADOWS FOR ACTORS (Grounded, no floating cards)
  const soldierShadow = add(new THREE.PlaneGeometry(0.7, 0.35), M.contactAO, 'soldier_contact_shadow', 'shadow', V(-0.6, 0.0, 0.01));
  soldierShadow.rotation.x = -Math.PI / 2;
  const officerShadow = add(new THREE.PlaneGeometry(0.7, 0.35), M.contactAO, 'officer_contact_shadow', 'shadow', V(0.5, -0.2, 0.01));
  officerShadow.rotation.x = -Math.PI / 2;

  scene.add(root);

  return {
    anchors: {
      soldier_station: V(-0.6, 0.0, 0.0),
      officer_spot: V(0.5, -0.2, 0.0),
      emu_horizon: V(0.0, 9.5, 0.0)
    },
    update: (time, dt) => {
      emuFlock.userData.update && emuFlock.userData.update(time);
    }
  };
}
