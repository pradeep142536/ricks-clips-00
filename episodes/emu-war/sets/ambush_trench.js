// SET 2: DUSTY AMBUSH TRENCH (Western Australia, 1932)
// Undulating red desert trench dugout, slatted weathered timber duckboards at z = -0.22m,
// dense burlap sandbag parapet + rear trench framing props (crates, rifle, lantern, wheel, grass),
// Approved Option (A) 1914 Lewis Gun + Tripod planted on parapet, rutted supply track,
// paddock fences, outpost pup tent, varied eucalyptus treeline, & matte feathered charging Emu flock.

import { buildEmuFlock } from './emu_flock.js';
import { buildBrassLantern, buildLewisGun, buildWagonWheel, makeMatteMat, makePropSpawner } from './procedural_props.mjs';
import {
  applyCrispSkyClouds,
  buildCooperedBarrel,
  buildOutbackHorizon,
  buildOutbackTent,
  buildRuttedRoadStrip,
  createRichPropWrappers,
  makeContactAO,
  scatterEucalyptusBelt
} from './outback_dressing.mjs';
import { buildOutbackGroundDetail, buildOutbackTerrain, outbackHeight } from './terrain_outback.mjs';

export async function build(THREE, scene, film, ctx) {
  const { B2T, sky } = ctx;
  const V = (x, y, z) => B2T([x, y, z]);
  const root = new THREE.Group();
  root.name = 'ambush_trench';

  // Crisp per-pixel daytime cumulus clouds (zero giant blurry puff sprites)
  applyCrispSkyClouds(sky, 'day', { sunDir: [0.45, 0.70, 0.40] });

  // 1. Sculpted Undulating Outback Trench Terrain, Ground Breakup & Horizon Ridge
  root.add(buildOutbackTerrain(THREE, ctx, { mode: 'trench', centerY: 7.0, sizeX: 74, sizeY: 74 }));
  root.add(buildOutbackGroundDetail(THREE, { mode: 'trench', centerY: 7.0, width: 32, depth: 36, count: 360, seed: 1934 }));
  root.add(buildOutbackHorizon(THREE, { centerY: 7.0, sunset: false }));
  const gY = (px, py) => outbackHeight('trench', px, py);

  const [spawnBagRaw, spawnRock, spawnBush, spawnGrass, spawnTree, spawnCrateRaw, spawnFenceRaw, spawnRifle] = await Promise.all([
    makePropSpawner(ctx, 'sandbag', { shadow: true, tint: '#cbb789' }),
    makePropSpawner(ctx, 'outback_rock', { shadow: true }),
    makePropSpawner(ctx, 'dry_bush', { shadow: true, tint: '#8b824a' }),
    makePropSpawner(ctx, 'dry_grass', { shadow: false, tint: '#b59446' }),
    makePropSpawner(ctx, 'eucalyptus_tree', { shadow: true, tint: '#797458' }),
    makePropSpawner(ctx, 'ammo_crate', { shadow: true }),
    makePropSpawner(ctx, 'wooden_fence', { shadow: true }),
    makePropSpawner(ctx, 'rifle', { shadow: true })
  ]);
  const { spawnFence, spawnSandbag, spawnCrate, fenceMats } = createRichPropWrappers(THREE, {
    fence: spawnFenceRaw,
    sandbag: spawnBagRaw,
    crate: spawnCrateRaw
  });

  const M = {
    trenchTimber: new THREE.MeshStandardMaterial({ map: fenceMats.map, bumpMap: fenceMats.bumpMap, bumpScale: 0.03, color: '#8f6a46', roughness: 0.90, metalness: 0.0 }),
    duckboard: new THREE.MeshStandardMaterial({ map: fenceMats.map, bumpMap: fenceMats.bumpMap, bumpScale: 0.03, color: '#9c7852', roughness: 0.91, metalness: 0.0 }),
    brassMat: makeMatteMat(THREE, '#c8a038', 0.62, 0.45),
    ironMat: makeMatteMat(THREE, '#353a40', 0.56, 0.45)
  };

  const box = (w, d, h, x, y, z, mat, name) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.name = name;
    m.position.copy(V(x, y, z + h / 2));
    m.castShadow = true;
    m.receiveShadow = true;
    root.add(m);
    return m;
  };

  // 2. Detailed Slatted Dugout Duckboard Walkway (top = -0.22m) & Weathered Timber Revetment Wall
  for (let b = -3.4; b <= 3.4; b += 0.85) {
    // Two dark longitudinal sleepers + six spaced cross slats per panel (replaces flat solid slabs!)
    for (const sy of [-0.36, 0.36]) {
      box(0.76, 0.09, 0.025, b, 0.02 + sy, -0.275, M.trenchTimber, `duck_sleeper_${b}_${sy}`);
    }
    for (let s = 0; s < 6; s++) {
      const lx = b - 0.32 + s * 0.128;
      box(0.095, 1.18, 0.026, lx, 0.02, -0.246, M.duckboard, `duck_slat_${b}_${s}`);
    }
  }
  // Vertical plank revetment & upright timber bracing posts along front & rear dugout edges
  for (let px = -3.6; px <= 3.6; px += 0.28) {
    box(0.25, 0.08, 0.72, px, 0.62, -0.26, M.trenchTimber, `revetment_${px}`);
  }
  for (let px = -3.3; px <= 3.3; px += 1.1) {
    box(0.11, 0.11, 0.86, px, 0.55, -0.26, M.trenchTimber, `trench_brace_front_${px}`);
    box(0.11, 0.11, 0.48, px, -0.68, gY(px, -0.68) - 0.18, M.trenchTimber, `trench_brace_rear_${px}`);
  }

  // 3. Textured CC0 Sandbag Parapet (2 staggered courses spanning x = -4.2..+4.2)
  const parapetBox = new THREE.Box3();
  for (let row = 0; row < 2; row++) {
    const py = 0.88 + row * 0.22;
    const pz = gY(0, py) + row * 0.24;
    for (let bx = -4.2; bx <= 4.2; bx += 0.64) {
      const shiftX = bx + (row % 2) * 0.30;
      const bag = spawnSandbag([shiftX, py, pz], {
        parent: root,
        yaw: Math.sin(shiftX * 2.1 + row) * 0.08,
        name: `trench_sandbag_${row}_${bx}`
      });
      parapetBox.expandByObject(bag);
    }
  }
  ctx.assets.registerSolid('sandbag_parapet', parapetBox);

  // Measure exact top Y of center sandbags where tripod rests
  const ray = new THREE.Raycaster(new THREE.Vector3(0.25, 3.0, -1.02), new THREE.Vector3(0, -1, 0));
  const bagHits = ray.intersectObject(root, true).filter(h => /trench_sandbag/.test(h.object.parent?.name || h.object.name || ''));
  const parapetTopY = bagHits.length ? bagHits[0].point.y : 0.60;

  // 4. Approved Option (A) Lewis Gun & Tripod planted FIRMLY ON TOP OF SANDBAGS at [0.25, 1.02, parapetTopY]
  const gunMount = buildLewisGun(THREE, ctx, {
    mountHeight: 0.42,
    pitch: -0.02
  });
  gunMount.position.copy(V(0.25, 1.02, parapetTopY));
  gunMount.rotation.y = Math.PI;
  root.add(gunMount);
  ctx.assets.registerSolid('trench_lewis_gun', gunMount);

  // Midground ammo crates, spare pan magazine & spent brass casings in trench beside gunner
  spawnCrate([0.88, 0.22, -0.22], { parent: root, solid: true, yaw: -0.35, name: 'trench_ammo_crate_mid' });
  spawnCrate([0.92, 0.24, -0.01], { parent: root, solid: true, yaw: 0.22, scale: 0.88, shadow: false, name: 'trench_ammo_crate_top' });
  const sparePan = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.05, 18), M.ironMat);
  sparePan.position.copy(V(-0.42, 0.56, -0.19));
  root.add(sparePan);

  const casingGeo = new THREE.CylinderGeometry(0.011, 0.011, 0.052, 6);
  for (let c = 0; c < 30; c++) {
    const cx = -0.25 + Math.sin(c * 4.2) * 0.58;
    const cy = -0.28 + Math.cos(c * 3.1) * 0.45;
    const cas = new THREE.Mesh(casingGeo, M.brassMat);
    cas.position.copy(V(cx, cy, -0.21));
    cas.rotation.set(Math.PI / 2, c * 0.5, Math.sin(c));
    root.add(cas);
  }

  // 5. FOREGROUND LAYER (Rear Trench Berm & Flanks — framing lower corners cleanly below eye-level lens Z >= 1.74m)
  // Left foreground sandbags, crates, leaning rifle, fence wing, & dry grass
  spawnSandbag([-1.65, -1.25, gY(-1.65, -1.25)], { parent: root, yaw: 0.35, scale: 0.90, name: 'trench_fg_bag_L1' });
  spawnSandbag([-1.05, -1.32, gY(-1.05, -1.32)], { parent: root, yaw: -0.18, scale: 0.86, name: 'trench_fg_bag_L2' });
  spawnCrate([-1.15, -0.92, gY(-1.15, -0.92)], { parent: root, yaw: 0.42, scale: 0.96, name: 'trench_fg_crate_L1' });
  spawnRifle([-1.10, -0.88, gY(-1.10, -0.88) + 0.20], { parent: root, yaw: 0.95, scale: 0.88, name: 'trench_fg_rifle_L' });
  spawnFence([-2.95, -0.90, gY(-2.95, -0.90)], { parent: root, yaw: 0.52, solid: true, name: 'trench_fg_fence_L' });

  // Right foreground crates, brass lantern on corner post, spoked wagon wheel, & sandbags
  spawnSandbag([0.62, -1.10, gY(0.62, -1.10)], { parent: root, yaw: 0.24, scale: 0.86, name: 'trench_fg_bag_R1' });
  spawnSandbag([1.15, -1.22, gY(1.15, -1.22)], { parent: root, yaw: -0.32, scale: 0.90, name: 'trench_fg_bag_R2' });
  spawnCrate([0.78, -0.92, gY(0.78, -0.92)], { parent: root, yaw: -0.28, scale: 0.92, name: 'trench_fg_crate_R1' });
  spawnCrate([0.80, -0.91, gY(0.78, -0.92) + 0.21], { parent: root, yaw: 0.16, scale: 0.84, shadow: false, name: 'trench_fg_crate_R2' });
  const fgLanternPost = box(0.09, 0.09, 0.72, 0.48, -0.82, gY(0.48, -0.82), M.trenchTimber, 'trench_lantern_post');
  fgLanternPost.add(makeContactAO(THREE, 0.45, 0.45, 0.72));
  const trenchLantern = buildBrassLantern(THREE, { name: 'trench_fg_lantern', isDay: true, scale: 1.05, light: true, lightIntensity: 0.28 });
  trenchLantern.position.copy(V(0.48, -0.82, gY(0.48, -0.82) + 0.72));
  root.add(trenchLantern);
  root.add(buildWagonWheel(THREE, ctx, {
    name: 'trench_fg_wagon_wheel',
    pos: [1.55, -0.74, gY(1.55, -0.74)],
    yaw: -0.45,
    lean: -0.15,
    scale: 0.88
  }));
  buildCooperedBarrel(THREE, ctx, gY, root, 'trench_mid_barrel_L', -2.35, 0.20, 0.4, 0.90);

  // 6. BACKGROUND DENSITY: Rutted Supply Track, Split-Rail Fences, Outpost Tent, Rocks, Bushes, Grass & Eucalyptus Belt
  root.add(await buildRuttedRoadStrip(THREE, ctx, gY, {
    name: 'trench_supply_track',
    centerX: py => -5.3 + Math.sin(py * 0.14) * 0.28,
    y0: -6.0,
    y1: 24.0,
    halfW: 1.25
  }));
  buildOutbackTent(THREE, ctx, gY, root, 'trench_outpost_tent', -6.8, 12.2, -2.1, 0.92);

  for (const [fx, fy, yaw, nm] of [
    [-7.6, 5.5, 1.38, 'trench_bg_fence_L1'],
    [-7.2, 8.2, 1.46, 'trench_bg_fence_L2'],
    [4.6, 7.8, -0.18, 'trench_bg_fence_R1'],
    [7.0, 7.6, 0.08, 'trench_bg_fence_R2'],
    [9.4, 7.9, -0.12, 'trench_bg_fence_R3']
  ]) {
    spawnFence([fx, fy, gY(fx, fy)], { parent: root, yaw, solid: true, name: nm });
  }

  // Charging Emu Flock brought in across mid-background undulating desert
  const chargingEmus = buildEmuFlock(THREE, ctx, {
    count: 16,
    baseX: 0.4,
    baseY: 8.6,
    spreadX: 16.5,
    spreadY: 8.5,
    yaw: Math.PI,
    groundY: gY
  });
  root.add(chargingEmus);

  scatterEucalyptusBelt(spawnTree, gY, root, [
    [-10.5, 12.5, 0.98, 0.4],
    [-6.2, 15.8, 1.15, 1.3],
    [-1.8, 17.5, 0.88, 2.2],
    [3.8, 16.2, 1.06, 0.9],
    [8.2, 14.2, 1.18, 2.1],
    [12.0, 16.5, 0.95, 1.6],
    [-13.5, 18.5, 1.24, 0.7],
    [-4.4, 22.0, 1.08, 2.7],
    [1.6, 23.0, 1.22, 1.1],
    [6.5, 21.0, 0.92, 0.2],
    [11.0, 23.5, 1.14, 1.8],
    [-9.0, 25.0, 1.20, 2.5]
  ], 'trench_euc_tree');

  for (const [rx, ry, sc] of [
    [-4.8, 3.2, 0.92], [4.5, 4.0, 1.15], [-2.5, 7.5, 0.82],
    [-1.85, -1.65, 0.34], [1.95, -1.55, 0.36], [-3.6, 1.6, 0.65],
    [3.8, 1.8, 0.72], [6.2, 9.8, 0.95], [-6.0, 4.5, 0.80],
    [1.2, 5.2, 0.48], [-3.2, 11.2, 0.86], [5.0, 12.8, 1.05]
  ]) {
    spawnRock([rx, ry, gY(rx, ry)], { parent: root, scale: sc, yaw: rx * 1.3, solid: sc >= 0.55 });
  }
  for (const [bx, by, sc] of [
    [-5.6, 5.2, 0.92], [5.8, 6.2, 0.88], [2.8, 8.8, 0.85],
    [-2.4, -1.4, 0.62], [2.4, -1.3, 0.66], [-4.2, 1.9, 0.78],
    [4.4, 2.2, 0.82], [-3.8, 7.2, 0.90], [0.8, 6.0, 0.65],
    [-8.5, 9.5, 0.95], [8.0, 10.5, 0.92], [-1.2, 13.8, 0.88]
  ]) {
    spawnBush([bx, by, gY(bx, by)], { parent: root, scale: sc, yaw: bx * 1.7 });
  }
  for (let i = 0; i < 64; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const gx = side * (1.25 + (i % 7) * 0.92) + Math.sin(i * 2.1) * 0.35;
    const gy = (i < 14 ? -1.8 + (i % 5) * 0.4 : 1.5 + i * 0.28);
    spawnGrass([gx, gy, gY(gx, gy)], { parent: root, yaw: i * 0.7, scale: 0.72 + (i % 4) * 0.14 });
  }

  scene.add(root);

  return {
    anchors: {
      gunner_station: V(0.14, 0.14, -0.22),
      meredith_trench: V(-1.45, 0.10, -0.22),
      gun_grip: V(0.25, 0.64, parapetTopY + 0.42),
      emu_charge: V(0.4, 8.6, 0.0)
    },
    update: (time) => {
      chargingEmus.userData.update && chargingEmus.userData.update(time);
    }
  };
}
