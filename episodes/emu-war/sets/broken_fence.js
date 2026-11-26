// SET 4: BROKEN FARM FENCE (Angry Wheat Farmer & Truck Crash)
// Uses Asset-First CC0 `wooden_fence.glb`, `wheat_crop.glb`, `dry_bush.glb`, `eucalyptus_tree.glb`,
// `outback_rock.glb`, plus Approved Option (A) `buildPitchfork` and upgraded matte `buildEmu`.
// Undulating red-earth Outback terrain with zero cypress trees.

import { buildEmu } from './emu_flock.js';
import { buildPitchfork, makeMatteMat, makePropSpawner } from './procedural_props.mjs';
import { buildOutbackTerrain, buildOutbackHorizon, outbackHeight } from './terrain_outback.mjs';

export async function build(THREE, scene, film, ctx) {
  const { B2T, sky } = ctx;
  const V = (x, y, z) => B2T([x, y, z]);
  const root = new THREE.Group();
  root.name = 'broken_fence';

  if (sky?.clouds) {
    sky.clouds({
      kind: 'dusk-storm',
      seed: 1932,
      coverage: 0.72,
      scale: 1.28,
      puffs: true,
      minEl: 2,
      maxEl: 20,
      sunDir: [0.30, 0.40, 0.70],
      colors: {
        top: '#210e3b',
        mid: '#8e387a',
        hor: '#ff907d',
        sun: '#ffba8f',
        glow: 1.05,
        lit: '#ff98c3',
        shade: '#431d59',
        rim: '#ffd5b2',
        dark: 0.32
      },
      storm: {
        core: '#35154e',
        body: '#742d6d',
        slit: '#ff8da9',
        srim: '#ffd6ba',
        under: '#ee608b',
        scud: '#4c1e5a',
        rain: '#8d477c',
        flash: '#ffd6ee',
        wallTop: 0.56,
        foot: 0.05,
        deck: 0.60,
        scudCov: 0.26,
        rainAmt: 0.08,
        underAmt: 0.85,
        rimAmt: 1.0,
        contrast: 0.65
      }
    });
  }

  // 1. Sculpted Undulating Terrain + Deep Purple-Pink Sunset Horizon Ridge
  root.add(buildOutbackTerrain(THREE, ctx, { mode: 'wheat', centerY: 6.0, sizeX: 64, sizeY: 64 }));
  root.add(buildOutbackHorizon(THREE, { centerY: 6.0, sunset: true }));
  const gY = (px, py) => outbackHeight('wheat', px, py);

  const M = {
    splinter: makeMatteMat(THREE, '#9c754d', 0.88, 0.0),
    wire: makeMatteMat(THREE, '#4a505a', 0.78, 0.30)
  };

  // 2. CC0 Split-Rail Timber Fence Sections + Central Breached Gap
  const [spawnFence, spawnWheat, spawnBush, spawnRock, spawnTree] = await Promise.all([
    makePropSpawner(ctx, 'wooden_fence', { shadow: true, tint: '#967452' }),
    makePropSpawner(ctx, 'wheat_crop', { shadow: false, tint: '#ddb85a' }),
    makePropSpawner(ctx, 'dry_bush', { shadow: true, tint: '#867e46' }),
    makePropSpawner(ctx, 'outback_rock', { shadow: true }),
    makePropSpawner(ctx, 'eucalyptus_tree', { shadow: true, tint: '#757054' })
  ]);

  for (const fx of [-6.6, -4.4, -2.4, 2.4, 4.4, 6.6]) {
    spawnFence([fx, 1.3, gY(fx, 1.3)], { parent: root, solid: true, name: `farm_fence_${fx}` });
  }

  // Splintered snapped wooden rails lying across the breach (x in -1.1..+1.1)
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

  // 3. Approved Option (A) Pitchfork resting upright in dirt beside farmer station
  const fork = buildPitchfork(THREE, ctx, {
    pos: [-1.45, 0.35, gY(-1.45, 0.35)],
    tilt: 0.12,
    yaw: 0.35
  });
  root.add(fork);
  ctx.assets.registerSolid('farmer_pitchfork', fork);

  // 4. Wheat & Bushes & Trees (No cypresses!)
  for (let i = 0; i < 20; i++) {
    const wx = -6.5 + (i % 7) * 2.1;
    const wy = 2.6 + Math.floor(i / 7) * 1.6;
    spawnWheat([wx, wy, gY(wx, wy)], { parent: root, yaw: i * 0.6 });
  }
  for (const [bx, by] of [[-4.2, 2.2], [4.5, 2.5], [-3.0, 5.2]]) {
    spawnBush([bx, by, gY(bx, by)], { parent: root, scale: 0.85, yaw: bx });
  }
  spawnRock([3.6, 0.6, gY(3.6, 0.6)], { parent: root, scale: 0.85, yaw: 1.1, solid: true });
  spawnTree([-7.5, 13.0, gY(-7.5, 13.0)], { parent: root, scale: 1.05, yaw: 0.4, solid: true });
  spawnTree([8.0, 14.5, gY(8.0, 14.5)], { parent: root, scale: 1.12, yaw: 2.0, solid: true });

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
