// SET 1: SUN-BAKED OUTBACK WHEAT FIELD (Campion District, Western Australia)
// Uses Asset-First 3D .glb Library (wheat_crop, wooden_fence, dry_bush, dry_grass,
// outback_rock, eucalyptus_tree, ammo_crate, military_truck) + undulating procedural terrain
// + upgraded matte feathered Emu flock (Option A). Cypress trees completely removed.

import { buildHeroTruck } from './hero_truck.js';
import { buildEmuFlock, buildEmu } from './emu_flock.js';
import { makePropSpawner } from './procedural_props.mjs';
import { buildOutbackTerrain, buildOutbackHorizon, outbackHeight } from './terrain_outback.mjs';

export async function build(THREE, scene, film, ctx) {
  const { B2T, sky } = ctx;
  const V = (x, y, z) => B2T([x, y, z]);
  const root = new THREE.Group();
  root.name = 'wheat_field';

  if (sky?.clouds) {
    sky.clouds({
      kind: 'clear-day',
      seed: 1932,
      coverage: 0.78,
      scale: 1.35,
      sunDir: [0.35, 0.72, 0.48],
      colors: {
        top: '#2b6cb8',
        mid: '#6ba5df',
        hor: '#dceaf4',
        sun: '#ffe9be',
        lit: '#fffcf4',
        shade: '#a3b8d6',
        rim: '#ffffff'
      },
      layers: [
        { d: 95, fade: 0.06, size: 1.05, n: 7, el: [2, 9] },
        { d: 155, fade: 0.22, size: 1.15, n: 7, el: [5, 17] },
        { d: 245, fade: 0.42, size: 1.25, n: 6, el: [10, 24] },
        { d: 340, fade: 0.35, size: 1.50, n: 5, el: [14, 32], cirrus: true }
      ]
    });
  }

  // 1. Undulating Outback Red-Clay & Golden Paddock Terrain + Distant Mesa Horizon
  root.add(buildOutbackTerrain(THREE, ctx, { mode: 'wheat', centerY: 7.0, sizeX: 76, sizeY: 76 }));
  root.add(buildOutbackHorizon(THREE, { centerY: 7.0, sunset: false }));

  // 2. Cached CC0 GLB Asset Spawners
  const [spawnWheat, spawnFence, spawnBush, spawnGrass, spawnRock, spawnTree, spawnCrate] = await Promise.all([
    makePropSpawner(ctx, 'wheat_crop', { shadow: false, tint: '#e4c468' }),
    makePropSpawner(ctx, 'wooden_fence', { shadow: true, tint: '#9e7e5d' }),
    makePropSpawner(ctx, 'dry_bush', { shadow: true, tint: '#8e884e' }),
    makePropSpawner(ctx, 'dry_grass', { shadow: false, tint: '#c59c48' }),
    makePropSpawner(ctx, 'outback_rock', { shadow: true }),
    makePropSpawner(ctx, 'eucalyptus_tree', { shadow: true, tint: '#7c785c' }),
    makePropSpawner(ctx, 'ammo_crate', { shadow: true })
  ]);

  const gY = (px, py) => outbackHeight('wheat', px, py);

  // 3. Australian Paddock Split-Rail Timber Fence along py = 2.2m (including central hero smash section!)
  for (const fx of [-8.8, -6.6, -4.4, -2.2, 2.2, 4.4, 6.6, 8.8]) {
    spawnFence([fx, 2.2, gY(fx, 2.2)], { parent: root, solid: true, name: `wheat_fence_${fx}` });
  }
  const smashFence = spawnFence([0.0, 2.2, gY(0.0, 2.2)], {
    parent: root,
    solid: true,
    name: 'wheat_fence_smash'
  });
  const smashFenceBaseZ = gY(0.0, 2.2);

  // 4. Golden Wheat Crops & Dry Outback Grass Tufts in the paddock behind fence
  for (let gx = -9.5; gx <= 9.5; gx += 1.05) {
    for (let gy = 2.9; gy <= 8.6; gy += 1.05) {
      if (Math.abs(gx) < 1.1 && gy < 4.5) continue;
      const px = gx + Math.sin(gx * 5.1 + gy) * 0.35;
      const py = gy + Math.cos(gy * 4.3 + gx) * 0.35;
      spawnWheat([px, py, gY(px, py)], {
        parent: root,
        yaw: (px + py) * 0.7,
        scale: 0.9 + ((Math.abs(Math.sin(px * 3)) * 0.25))
      });
    }
  }
  for (let i = 0; i < 24; i++) {
    const px = -10.5 + ((i * 3.7) % 21.0);
    const py = -1.2 + ((i * 2.3) % 10.5);
    if (Math.hypot(px, py) < 2.2) continue;
    spawnGrass([px, py, gY(px, py)], { parent: root, yaw: i * 0.9 });
  }

  // 5. Sparse Outback Gum/Scrub Trees, Boulders & Bushes (Zero cypress trees!)
  for (const [tx, ty, sc, yaw] of [
    [-7.8, 12.0, 1.0, 0.4],
    [8.4, 13.5, 1.12, 1.9],
    [-12.0, 20.0, 1.25, 2.5],
    [13.0, 22.0, 1.18, 0.8]
  ]) {
    spawnTree([tx, ty, gY(tx, ty)], { parent: root, scale: sc, yaw, solid: true });
  }
  for (const [rx, ry, yaw, sc] of [[-3.4, 4.2, 0.4, 0.85], [5.8, 5.5, 1.4, 1.05], [-5.5, 1.2, 2.2, 0.75]]) {
    spawnRock([rx, ry, gY(rx, ry)], { parent: root, yaw, scale: sc, solid: true });
  }
  for (const [bx, by, yaw] of [[-4.8, 3.2, 0.5], [4.6, 3.4, 1.7], [-2.6, 6.2, 2.8], [6.4, 7.2, 0.9]]) {
    spawnBush([bx, by, gY(bx, by)], { parent: root, yaw, scale: 0.85 });
  }

  // Ammo crates near right truck staging for Line 6 depot beat
  spawnCrate([2.45, 0.25, gY(2.45, 0.25)], { parent: root, solid: true, yaw: 0.2, name: 'depot_ammo_crate_1' });
  spawnCrate([2.45, 0.25, gY(2.45, 0.25) + 0.217], { parent: root, solid: true, yaw: -0.1, name: 'depot_ammo_crate_2' });

  // 6. Parked Hero Military Flatbed Truck (well right of foreground actor corridor)
  const heroTruck = await buildHeroTruck(THREE, ctx, {
    name: 'wheat_parked_truck',
    pos: [4.65, 0.90, gY(4.65, 0.90)],
    yaw: -0.32,
    registerSolids: true,
    registerBedOnly: false
  });
  root.add(heroTruck);

  // 7. Distant Matte Feathered Emu Flock charging/striding across rolling hills
  const emuFlock = buildEmuFlock(THREE, ctx, {
    count: 10,
    baseX: -1.5,
    baseY: 11.5,
    spreadX: 14.0,
    spreadY: 4.5,
    yaw: Math.PI * 0.92,
    groundY: gY
  });
  root.add(emuFlock);

  // Hero charging 3D Emu for the 0:07 wooden fence smash close-up (f = 200..250)
  const smashEmu = buildEmu(THREE, ctx, { scale: 1.08, seed: 32, facing: Math.PI });
  smashEmu.position.copy(V(0.15, 3.2, gY(0.15, 3.2)));
  root.add(smashEmu);

  scene.add(root);

  return {
    anchors: {
      soldier_station: V(-0.6, 0.0, 0.0),
      officer_spot: V(0.5, 0.0, 0.0),
      emu_horizon: V(-1.5, 11.5, 0.0)
    },
    update: (f, t) => {
      const timeSec = typeof t === 'number' ? t : (f / 30);
      emuFlock.userData.update && emuFlock.userData.update(timeSec);
      // Animate hero 3D emu ramming center wooden fence at 0:07 (frame 213)
      if (f >= 195 && f <= 255) {
        smashEmu.visible = true;
        const chargeU = Math.max(0, Math.min(1, (f - 195) / 18));
        const py = 3.55 - chargeU * 1.45;
        smashEmu.position.copy(V(0.15, py, gY(0.15, py)));
        smashEmu.userData.animate && smashEmu.userData.animate(timeSec, true);
        if (f >= 212) {
          const hitK = Math.min(1, (f - 212) / 7);
          smashFence.rotation.x = 0.45 * hitK;
          smashFence.rotation.z = 0.08 * Math.sin(f * 0.8) * (1 - hitK * 0.5);
          smashFence.position.copy(V(0.0, 2.2 - 0.18 * hitK, smashFenceBaseZ - 0.04 * hitK));
        } else {
          smashFence.rotation.set(0, 0, 0);
          smashFence.position.copy(V(0.0, 2.2, smashFenceBaseZ));
        }
      } else {
        smashEmu.visible = false;
        smashFence.rotation.set(0, 0, 0);
        smashFence.position.copy(V(0.0, 2.2, smashFenceBaseZ));
      }
    }
  };
}
