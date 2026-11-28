// SET 3: BUMPY OUTBACK DIRT TRACK (High-Speed Pursuit)
// Uses Asset-First CC0 hero truck (`military_truck.glb` + `ammo_crate.glb` + Option A `buildLewisGun`),
// crisp per-pixel dusk storm dome (NO giant blurred puff cards), authored rutted Outback track strip,
// matte feathered emu flank corridor (x <= -3.3), split-rail paddock fences, telegraph line,
// foreground wheel/crate/lantern/fence shoulders, canvas outpost tent, & varied eucalyptus belt.

import { buildHeroTruck } from './hero_truck.js';
import { buildEmuFlock } from './emu_flock.js';
import { buildBrassLantern, buildWagonWheel, makeMatteMat, makePropSpawner } from './procedural_props.mjs';
import {
  applyCrispSkyClouds,
  buildCooperedBarrel,
  buildOutbackHorizon,
  buildOutbackTent,
  buildRuttedRoadStrip,
  createRichPropWrappers,
  scatterEucalyptusBelt
} from './outback_dressing.mjs';
import { buildOutbackGroundDetail, buildOutbackTerrain, outbackHeight } from './terrain_outback.mjs';

export async function build(THREE, scene, film, ctx) {
  const { B2T, sky } = ctx;
  const V = (x, y, z) => B2T([x, y, z]);
  const root = new THREE.Group();
  root.name = 'dirt_track';

  // Crisp per-pixel dusk-storm clouds via stormDome (puffs omitted so sky stays sharp & readable)
  applyCrispSkyClouds(sky, 'dusk', { sunDir: [0.35, 0.42, 0.68] });

  // 1. Sculpted Undulating Outback Dirt Track Terrain, Ground Detail & Dusk Horizon Ridge
  root.add(buildOutbackTerrain(THREE, ctx, { mode: 'track', centerY: 12.0, sizeX: 78, sizeY: 96, segs: 120 }));
  root.add(buildOutbackGroundDetail(THREE, { mode: 'track', centerY: 12.0, width: 34, depth: 44, count: 380, seed: 1936 }));
  root.add(buildOutbackHorizon(THREE, { centerY: 12.0, sunset: false }));
  const gY = (px, py) => outbackHeight('track', px, py);

  // Full authored rutted dirt road texture strip (replaces bare terrain/yellow stripe look)
  root.add(await buildRuttedRoadStrip(THREE, ctx, gY, {
    name: 'dirt_track_main_road',
    centerX: () => 0.0,
    y0: -12.0,
    y1: 44.0,
    halfW: 1.72,
    repeatY: 7.5,
    bumpScale: 0.12,
    tint: '#d1a47e'
  }));

  const M = {
    poleWood: makeMatteMat(THREE, '#5a402a', 0.90, 0.0),
    poleWire: makeMatteMat(THREE, '#3a4048', 0.78, 0.25),
    insulator: makeMatteMat(THREE, '#ece8dc', 0.80, 0.0)
  };

  // 2. Roadside Telegraph Poles & Sagging Wire (pulled cleanly along x = +3.55m right shoulder)
  for (let py = -8; py <= 44; py += 13) {
    const pg = new THREE.Group();
    const gz = gY(3.55, py);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.14, 5.0, 8), M.poleWood);
    pole.position.y = 2.5;
    pole.castShadow = true;
    pg.add(pole);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.10, 0.10), M.poleWood);
    arm.position.set(0, 4.65, 0);
    pg.add(arm);
    for (const ix of [-0.55, 0.55]) {
      const ins = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.10, 6), M.insulator);
      ins.position.set(ix, 4.76, 0);
      pg.add(ins);
    }
    pg.position.copy(V(3.55, py, gz));
    root.add(pg);
  }
  const wireCurve = new THREE.CatmullRomCurve3([
    V(3.55, -8, 4.78 + gY(3.55, -8)),
    V(3.55, -1.5, 4.32 + gY(3.55, -1.5)),
    V(3.55, 5, 4.78 + gY(3.55, 5)),
    V(3.55, 11.5, 4.32 + gY(3.55, 11.5)),
    V(3.55, 18, 4.78 + gY(3.55, 18)),
    V(3.55, 31, 4.78 + gY(3.55, 31)),
    V(3.55, 44, 4.78 + gY(3.55, 44))
  ]);
  root.add(new THREE.Mesh(new THREE.TubeGeometry(wireCurve, 56, 0.009, 5), M.poleWire));

  // 3. CC0 Nature & Textured Fence/Crate/Sandbag Dressing
  const [spawnRock, spawnBush, spawnGrass, spawnTree, spawnFenceRaw, spawnCrateRaw, spawnBagRaw, spawnRifle] = await Promise.all([
    makePropSpawner(ctx, 'outback_rock', { shadow: true }),
    makePropSpawner(ctx, 'dry_bush', { shadow: true, tint: '#867e46' }),
    makePropSpawner(ctx, 'dry_grass', { shadow: false, tint: '#be9344' }),
    makePropSpawner(ctx, 'eucalyptus_tree', { shadow: true, tint: '#757054' }),
    makePropSpawner(ctx, 'wooden_fence', { shadow: true }),
    makePropSpawner(ctx, 'ammo_crate', { shadow: true }),
    makePropSpawner(ctx, 'sandbag', { shadow: true }),
    makePropSpawner(ctx, 'rifle', { shadow: true })
  ]);
  const { spawnFence, spawnSandbag, spawnCrate } = createRichPropWrappers(THREE, {
    fence: spawnFenceRaw,
    sandbag: spawnBagRaw,
    crate: spawnCrateRaw
  });

  // Right paddock roadside split-rail fence sections (stepping clear of camera zone around y = -4..-2.8)
  for (const [fx, fy, yaw, nm] of [
    [2.95, 0.4, 1.54, 'track_fence_R1'],
    [2.95, 3.2, 1.59, 'track_fence_R2'],
    [2.98, 6.0, 1.55, 'track_fence_R3'],
    [2.96, 8.8, 1.60, 'track_fence_R4'],
    [3.02, 11.6, 1.54, 'track_fence_R5'],
    [3.04, 14.4, 1.58, 'track_fence_R6'],
    [3.06, 17.2, 1.56, 'track_fence_R7']
  ]) {
    spawnFence([fx, fy, gY(fx, fy)], { parent: root, yaw, solid: true, name: nm });
  }

  // FOREGROUND LAYER (Right & Left Track Shoulders framing lower 28%, safely below moving lens Z >= 2.18m!)
  // Right Shoulder FG vignette visible in st0 [3.05,-3.95] and st2 [1.15,-3.35]
  spawnFence([2.35, -1.65, gY(2.35, -1.65)], { parent: root, yaw: 0.56, name: 'track_fg_fence_R' });
  spawnCrate([1.78, -2.25, gY(1.78, -2.25)], { parent: root, yaw: -0.35, scale: 0.96, name: 'track_fg_crate_R1' });
  spawnCrate([1.80, -2.23, gY(1.78, -2.25) + 0.21], { parent: root, yaw: 0.14, scale: 0.88, shadow: false, name: 'track_fg_crate_R2' });
  spawnRifle([1.92, -2.12, gY(1.92, -2.12) + 0.18], { parent: root, yaw: 0.85, scale: 0.88, name: 'track_fg_rifle_R' });
  spawnSandbag([2.15, -2.52, gY(2.15, -2.52)], { parent: root, yaw: -0.62, scale: 0.85, name: 'track_fg_bag_R' });
  root.add(buildWagonWheel(THREE, ctx, {
    name: 'track_fg_wagon_wheel_R',
    pos: [2.05, -1.85, gY(2.05, -1.85)],
    yaw: 0.68,
    lean: 0.15,
    scale: 0.94
  }));
  const trackLantern = buildBrassLantern(THREE, { name: 'track_fg_lantern_R', isDay: false, scale: 1.15, light: true, lightIntensity: 1.55, lightDistance: 4.5 });
  trackLantern.position.copy(V(1.78, -2.22, gY(1.78, -2.25) + 0.42));
  root.add(trackLantern);

  // Left Shoulder FG vignette visible in st1 [-4.05,-4.15] (cleanly south of bird/emu lane y >= 0.5)
  spawnFence([-2.35, -2.15, gY(-2.35, -2.15)], { parent: root, yaw: -0.42, name: 'track_fg_fence_L' });
  spawnSandbag([-1.95, -2.42, gY(-1.95, -2.42)], { parent: root, yaw: 0.45, scale: 0.86, name: 'track_fg_bag_L' });
  spawnCrate([-2.10, -1.78, gY(-2.10, -1.78)], { parent: root, yaw: 0.28, scale: 0.92, name: 'track_fg_crate_L' });
  buildCooperedBarrel(THREE, ctx, gY, root, 'track_fg_barrel_L', -2.52, -1.55, 0.3, 0.88);

  // Roadside background camp outpost tent + crates
  buildOutbackTent(THREE, ctx, gY, root, 'track_outpost_tent', 6.2, 13.5, 2.55, 0.90);
  buildCooperedBarrel(THREE, ctx, gY, root, 'track_camp_barrel', 4.8, 12.2, -0.2, 0.88);

  scatterEucalyptusBelt(spawnTree, gY, root, [
    [-9.5, 24, 1.15, 0.6], [9.5, 28, 1.10, 1.8], [-12.0, 12, 0.95, 2.4],
    [6.4, 8.5, 0.98, 0.9], [10.8, 17.5, 1.24, 1.3], [-10.8, 18.0, 1.28, 2.9],
    [-6.5, 29.0, 1.06, 0.3], [5.8, 22.0, 1.18, 2.1], [-14.2, 24.5, 1.12, 1.5],
    [13.5, 25.5, 1.04, 0.7], [-2.5, 34.0, 1.22, 1.9], [3.5, 36.0, 1.08, 2.6],
    [-8.5, 37.5, 1.16, 1.1], [11.5, 11.5, 0.92, 0.2]
  ], 'track_euc_tree');

  for (const [rx, ry, sc] of [
    [3.2, 5.5, 0.80], [-7.5, 4.0, 1.10], [5.4, 14.0, 1.00],
    [2.15, -1.45, 0.42], [-2.25, -2.55, 0.45], [-6.8, -0.5, 0.95],
    [4.6, 2.8, 0.68], [-8.2, 10.5, 0.90], [4.4, 18.5, 0.85],
    [-2.4, 15.2, 0.65], [7.2, 20.5, 1.15], [-10.5, 21.0, 1.05],
    [2.8, 23.0, 0.75], [-6.5, 26.0, 0.95]
  ]) {
    spawnRock([rx, ry, gY(rx, ry)], { parent: root, scale: sc, yaw: rx * 1.4, solid: sc >= 0.65 });
  }
  for (const [bx, by, sc] of [
    [3.6, 2.0, 0.85], [-7.2, 8.5, 0.88], [4.8, 10.5, 0.92], [-8.4, 16.0, 0.95],
    [2.65, -2.45, 0.68], [-2.65, -1.65, 0.66], [4.2, 6.2, 0.84], [-6.8, 1.8, 0.78],
    [5.6, 15.5, 0.90], [-7.8, 21.5, 1.02], [4.0, 24.5, 0.88], [-3.2, 26.5, 0.92],
    [7.5, 12.0, 0.85], [-10.0, 13.5, 0.96], [2.4, 19.5, 0.80], [-5.2, 31.0, 0.98]
  ]) {
    spawnBush([bx, by, gY(bx, by)], { parent: root, scale: sc, yaw: bx * 1.2 });
  }
  for (let i = 0; i < 84; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const gx = side * (1.75 + (i % 7) * 0.78) + Math.sin(i * 1.9) * 0.25;
    const gy = -3.2 + i * 0.44;
    spawnGrass([gx, gy, gY(gx, gy)], { parent: root, yaw: i * 0.85, scale: 0.75 + (i % 4) * 0.14 });
  }

  // 4. Hero Moving Military Truck (Cab + crate + gun registered, rear open bed deck kept clear for gunner!)
  const heroTruck = await buildHeroTruck(THREE, ctx, {
    name: 'chase_hero_truck',
    pos: [0.0, 1.5, Math.max(-0.08, gY(0.0, 1.5))],
    yaw: 0.0,
    gunYaw: -Math.PI * 0.65,
    registerSolids: true,
    registerBedOnly: true
  });
  root.add(heroTruck);

  // Matte organic soil-dust tire-wake clumps behind rear wheels (replaces glowing orange vector bars!)
  const dustMat = new THREE.MeshStandardMaterial({ color: '#784628', roughness: 0.97, metalness: 0.0 });
  const wakeGroup = new THREE.Group();
  const wakeClods = [];
  for (const sx of [-0.88, 0.88]) {
    for (let k = 0; k < 6; k++) {
      const wy = -1.25 - k * 0.42;
      const clod = new THREE.Mesh(new THREE.DodecahedronGeometry(0.065 + (k % 3) * 0.025, 0), dustMat);
      clod.scale.set(1.4, 0.35, 1.8);
      clod.position.copy(V(sx + Math.sin(k * 2.1) * 0.14, wy, gY(sx, wy) + 0.01));
      clod.rotation.y = k * 0.7;
      wakeGroup.add(clod);
      wakeClods.push(clod);
    }
  }
  root.add(wakeGroup);

  // 5. Matte Feathered Sprinting Emu Flock confined strictly to left corridor (x <= -3.3, clear of truck & actors!)
  const pursuitEmus = buildEmuFlock(THREE, ctx, {
    count: 12,
    baseX: -4.8,
    baseY: 6.5,
    spreadX: 2.6,
    spreadY: 12.0,
    yaw: Math.PI,
    runSpeed: 16.5,
    groundY: gY
  });
  root.add(pursuitEmus);

  scene.add(root);

  return {
    anchors: {
      truck_focus: V(0.0, 1.5, 1.3),
      gunner_bed: V(0.0, -0.05, heroTruck.userData.deckY || 0.89),
      chase_cam_rear: V(0.0, -4.5, 2.2),
      emu_lead: V(-4.4, 10.0, 0.0)
    },
    update: (time, dt = 0.033) => {
      heroTruck.userData.update && heroTruck.userData.update(time, dt, 16.0);
      pursuitEmus.userData.update && pursuitEmus.userData.update(time);
      wakeClods.forEach((c, idx) => {
        c.position.y = Math.max(0.01, gY(c.position.x, -c.position.z)) + Math.abs(Math.sin(time * 12 + idx)) * 0.015;
      });
    }
  };
}
