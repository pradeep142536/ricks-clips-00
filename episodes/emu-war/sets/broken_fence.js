// SET 4: BROKEN FARM FENCE (Angry Wheat Farmer & Truck Crash)
// Crisp per-pixel dusk storm clouds (NO giant blurred puff backdrop), curved rutted farm track
// breaching the split-rail fence, foreground crates/lantern/barrel/wagon-wheel/sandbags/rifle,
// dense wheat rows, outpost canvas store tent, & varied eucalyptus windbreak.

import { buildEmu } from './emu_flock.js';
import { buildBrassLantern, buildPitchfork, buildWagonWheel, makeMatteMat, makePropSpawner } from './procedural_props.mjs';
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
  root.name = 'broken_fence';

  // Crisp per-pixel dusk storm dome (zero giant blurred puff sprites)
  applyCrispSkyClouds(sky, 'dusk', { sunDir: [0.30, 0.40, 0.70] });

  // 1. Sculpted Undulating Terrain, Ground Gravel/Grass Breakup & Horizon
  root.add(buildOutbackTerrain(THREE, ctx, { mode: 'wheat', centerY: 6.0, sizeX: 68, sizeY: 68 }));
  root.add(buildOutbackGroundDetail(THREE, { mode: 'broken_fence', centerY: 6.0, width: 32, depth: 36, count: 360, seed: 1938 }));
  root.add(buildOutbackHorizon(THREE, { centerY: 6.0, sunset: false }));
  const gY = (px, py) => outbackHeight('wheat', px, py);

  // Curved rutted Outback farm track tearing straight through the central broken fence gap (x ~ 0.1, y = 1.3)
  root.add(await buildRuttedRoadStrip(THREE, ctx, gY, {
    name: 'broken_fence_breach_track',
    centerX: py => 0.10 - Math.sin((py + 4.0) * 0.16) * 0.22,
    y0: -8.0,
    y1: 15.0,
    halfW: 1.18,
    repeatY: 4.5,
    tint: '#cba07c'
  }));

  const M = {
    splinter: makeMatteMat(THREE, '#9c754d', 0.88, 0.0),
    wire: makeMatteMat(THREE, '#4a505a', 0.78, 0.30)
  };

  // 2. CC0 Spawners + Textured Fence/Crate/Sandbag Wrappers
  const [spawnFenceRaw, spawnWheat, spawnBush, spawnGrass, spawnRock, spawnTree, spawnCrateRaw, spawnBagRaw, spawnRifle] = await Promise.all([
    makePropSpawner(ctx, 'wooden_fence', { shadow: true }),
    makePropSpawner(ctx, 'wheat_crop', { shadow: false, tint: '#ddb85a' }),
    makePropSpawner(ctx, 'dry_bush', { shadow: true, tint: '#867e46' }),
    makePropSpawner(ctx, 'dry_grass', { shadow: false, tint: '#be9344' }),
    makePropSpawner(ctx, 'outback_rock', { shadow: true }),
    makePropSpawner(ctx, 'eucalyptus_tree', { shadow: true, tint: '#757054' }),
    makePropSpawner(ctx, 'ammo_crate', { shadow: true }),
    makePropSpawner(ctx, 'sandbag', { shadow: true }),
    makePropSpawner(ctx, 'rifle', { shadow: true })
  ]);
  const { spawnFence, spawnSandbag, spawnCrate } = createRichPropWrappers(THREE, {
    fence: spawnFenceRaw,
    sandbag: spawnBagRaw,
    crate: spawnCrateRaw
  });

  // Main breached paddock fence spanning x = -8.6 .. +8.6 with central breach gap (-1.1..+1.1)
  for (const fx of [-8.6, -6.6, -4.4, -2.4, 2.4, 4.4, 6.6, 8.6]) {
    spawnFence([fx, 1.3, gY(fx, 1.3)], { parent: root, solid: true, name: `farm_fence_${fx}` });
  }

  // Splintered snapped wooden rails + fallen wheel debris across breach
  const sp1 = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.10, 0.08), M.splinter);
  sp1.position.copy(V(-0.45, 1.35, 0.25));
  sp1.rotation.set(0.15, 0.22, 0.42);
  sp1.castShadow = true;
  root.add(sp1);
  const sp2 = new THREE.Mesh(new THREE.BoxGeometry(1.30, 0.10, 0.08), M.splinter);
  sp2.position.copy(V(0.55, 1.25, 0.12));
  sp2.rotation.set(-0.18, -0.30, -0.35);
  sp2.castShadow = true;
  root.add(sp2);

  for (const s of [-1, 1]) {
    const curl = new THREE.CatmullRomCurve3([
      V(s * 1.25, 1.3, 0.65),
      V(s * 0.90, 1.25, 0.40),
      V(s * 0.62, 1.15, 0.12)
    ]);
    root.add(new THREE.Mesh(new THREE.TubeGeometry(curl, 12, 0.008, 5), M.wire));
  }

  // 3. FOREGROUND FRAMING LAYER (Tucked cleanly inside st0/st1/st3 portrait horizontal cone without blocking cast)
  // Left foreground: split-rail wing, coopered barrel + warm dusk brass lantern, spoked wheel & grass
  spawnFence([-1.32, -1.60, gY(-1.32, -1.60)], { parent: root, yaw: 0.42, name: 'fence_fg_wing_L' });
  buildCooperedBarrel(THREE, ctx, gY, root, 'fence_fg_barrel_L', -0.62, -1.82, 0.25, 0.84);
  const fgLanternL = buildBrassLantern(THREE, { name: 'fence_fg_lantern_L', isDay: false, scale: 1.12, light: true, lightIntensity: 1.55, lightDistance: 4.8 });
  fgLanternL.position.copy(V(-0.60, -1.80, gY(-0.62, -1.82) + 0.55));
  root.add(fgLanternL);
  root.add(buildWagonWheel(THREE, ctx, {
    name: 'fence_fg_wagon_wheel_L',
    pos: [-0.84, -1.48, gY(-0.84, -1.48)],
    yaw: 0.52,
    lean: 0.14,
    scale: 0.86
  }));
  spawnSandbag([-0.42, -2.08, gY(-0.42, -2.08)], { parent: root, yaw: 0.58, scale: 0.80, name: 'fence_fg_bag_L' });

  // Right foreground: angled paddock rail wing, stacked ammo crates + leaning rifle, sandbag & dry grass
  spawnFence([1.32, -1.55, gY(1.32, -1.55)], { parent: root, yaw: -0.44, name: 'fence_fg_wing_R' });
  spawnCrate([0.62, -1.84, gY(0.62, -1.84)], { parent: root, yaw: -0.34, scale: 0.90, name: 'fence_fg_crate_R1' });
  spawnCrate([0.64, -1.82, gY(0.62, -1.84) + 0.20], { parent: root, yaw: 0.14, scale: 0.82, shadow: false, name: 'fence_fg_crate_R2' });
  spawnRifle([0.72, -1.74, gY(0.72, -1.74) + 0.17], { parent: root, yaw: -0.78, scale: 0.86, name: 'fence_fg_rifle_R' });
  spawnSandbag([0.46, -2.10, gY(0.46, -2.10)], { parent: root, yaw: -0.52, scale: 0.80, name: 'fence_fg_bag_R' });
  spawnGrass([0.42, -1.68, gY(0.42, -1.68)], { parent: root, yaw: 0.6, scale: 0.92, name: 'fence_fg_grass_R' });
  spawnGrass([-0.38, -1.62, gY(-0.38, -1.62)], { parent: root, yaw: 1.8, scale: 0.88, name: 'fence_fg_grass_L' });

  // Approved Option (A) Pitchfork resting upright in dirt beside farmer spot
  const fork = buildPitchfork(THREE, ctx, {
    pos: [-1.45, 0.35, gY(-1.45, 0.35)],
    tilt: 0.12,
    yaw: 0.35
  });
  root.add(fork);
  ctx.assets.registerSolid('farmer_pitchfork', fork);

  // 4. Dense Wheat Paddock, Background Canvas Farm Tent, Bushes, Grass, Rocks & Varied Eucalyptus Windbreak
  buildOutbackTent(THREE, ctx, gY, root, 'fence_bg_farm_tent', -5.8, 8.6, -2.15, 0.88);
  buildCooperedBarrel(THREE, ctx, gY, root, 'fence_mid_barrel_L', -2.45, 1.85, 0.4, 0.90);

  for (let gx = -9.5; gx <= 9.5; gx += 1.25) {
    for (let gy = 2.4; gy <= 10.8; gy += 1.25) {
      if (Math.abs(gx) < 1.0 && gy < 6.0) continue; // Keep trampled truck breach lane visibly torn open!
      const wx = gx + Math.sin(gx * 3.1 + gy) * 0.32;
      const wy = gy + Math.cos(gy * 2.7 + gx) * 0.28;
      spawnWheat([wx, wy, gY(wx, wy)], { parent: root, yaw: (gx + gy) * 0.65, scale: 0.88 + Math.abs(Math.sin(wx * 2)) * 0.26 });
    }
  }

  for (const [bx, by, sc] of [
    [-4.2, 2.2, 0.88], [4.5, 2.5, 0.86], [-3.0, 5.2, 0.92],
    [-2.1, -1.35, 0.68], [2.1, -1.25, 0.70], [3.2, 4.8, 0.90],
    [-6.5, 3.2, 0.95], [6.8, 3.6, 0.90], [-4.8, 10.5, 1.02],
    [5.4, 9.8, 0.96], [-1.8, 11.2, 0.88], [1.9, 12.0, 0.92],
    [-8.2, 7.5, 0.98], [8.5, 8.0, 0.94]
  ]) {
    spawnBush([bx, by, gY(bx, by)], { parent: root, scale: sc, yaw: bx * 1.4 });
  }
  for (const [rx, ry, sc] of [
    [3.6, 0.6, 0.85], [-1.75, -2.05, 0.36], [1.75, -1.95, 0.38],
    [-2.8, 0.7, 0.68], [2.6, 1.8, 0.62], [-4.5, 4.0, 0.82],
    [5.2, 5.6, 0.94], [-6.8, 1.2, 0.90], [6.4, 1.4, 0.86],
    [0.9, 7.8, 0.74]
  ]) {
    spawnRock([rx, ry, gY(rx, ry)], { parent: root, scale: sc, yaw: rx * 1.1, solid: sc >= 0.55 });
  }
  for (let i = 0; i < 64; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const gx = side * (1.25 + (i % 7) * 0.90) + Math.sin(i * 1.7) * 0.28;
    const gy = (i < 16 ? -2.3 + (i % 5) * 0.45 : 1.0 + i * 0.25);
    spawnGrass([gx, gy, gY(gx, gy)], { parent: root, yaw: i * 0.75, scale: 0.72 + (i % 4) * 0.14 });
  }

  scatterEucalyptusBelt(spawnTree, gY, root, [
    [-7.5, 13.0, 1.06, 0.4], [8.0, 14.5, 1.14, 2.0], [-11.5, 11.5, 0.95, 1.3],
    [11.5, 12.2, 1.02, 2.6], [-3.2, 15.8, 1.20, 0.9], [3.6, 16.5, 0.92, 1.7],
    [-9.8, 18.5, 1.26, 2.2], [9.5, 19.5, 1.18, 0.5], [-0.4, 19.8, 1.08, 1.5],
    [-14.0, 16.5, 1.10, 2.8], [14.2, 17.0, 1.15, 0.2], [5.8, 22.5, 1.22, 1.9]
  ], 'fence_euc_tree');

  // 5. Matte Feathered Emu leaping through fence breach cleanly away from actors
  const leapingEmu = buildEmu(THREE, ctx, {
    pos: [0.65, 2.0, gY(0.65, 2.0) + 0.15],
    yaw: Math.PI * 0.88,
    scale: 1.12,
    running: true,
    runSpeed: 16.5
  });
  root.add(leapingEmu);

  scene.add(root);

  return {
    anchors: {
      farmer_spot: V(-0.95, 0.0, 0.0),
      fence_breach: V(0.0, 1.3, 0.6),
      emu_leap: V(0.65, 2.0, 0.15)
    },
    update: (time) => {
      leapingEmu.userData.update && leapingEmu.userData.update(time);
    }
  };
}
