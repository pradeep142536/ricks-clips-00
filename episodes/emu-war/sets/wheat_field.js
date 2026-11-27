// SET 1: SUN-BAKED OUTBACK WHEAT FIELD (Campion District, Western Australia)
// Uses Asset-First 3D .glb Library (wheat_crop, wooden_fence, dry_bush, dry_grass,
// outback_rock, eucalyptus_tree, ammo_crate, military_truck) + undulating procedural terrain
// + upgraded matte feathered Emu flock (Option A). Cypress trees completely removed.

import { buildHeroTruck } from './hero_truck.js';
import { buildEmuFlock, buildEmu } from './emu_flock.js';
import { makePropSpawner } from './procedural_props.mjs';
import { buildOutbackTerrain, buildOutbackGroundDetail, buildOutbackHorizon, outbackHeight } from './terrain_outback.mjs';

export async function build(THREE, scene, film, ctx) {
  const { B2T, sky } = ctx;
  const V = (x, y, z) => B2T([x, y, z]);
  const root = new THREE.Group();
  root.name = 'wheat_field';

  if (sky?.clouds) {
    const skyKind = ctx.place?.sky_kind || 'clear-day';
    sky.clouds({
      kind: skyKind,
      seed: 1932,
      coverage: skyKind === 'clear-day' ? 0.78 : 0.92,
      scale: 1.35,
      sunDir: [0.35, 0.72, 0.48],
      ...(skyKind === 'clear-day' ? { colors: {
        top: '#2b6cb8',
        mid: '#6ba5df',
        hor: '#dceaf4',
        sun: '#ffe9be',
        lit: '#fffcf4',
        shade: '#a3b8d6',
        rim: '#ffffff'
      } } : {}),
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
  root.add(buildOutbackGroundDetail(THREE, { mode: 'wheat', centerY: 7.0, width: 30, depth: 34, count: 260 }));
  const dramaticLight = ['sunset', 'night', 'storm'].includes(ctx.place?.light);
  root.add(buildOutbackHorizon(THREE, { centerY: 7.0, sunset: dramaticLight }));

  // 2. Cached CC0 GLB Asset Spawners
  const [spawnWheat, spawnFence, spawnBush, spawnGrass, spawnRock, spawnTree, spawnCrate, spawnRadio, spawnSandbag] = await Promise.all([
    makePropSpawner(ctx, 'wheat_crop', { shadow: false, tint: '#e4c468' }),
    makePropSpawner(ctx, 'wooden_fence', { shadow: true, tint: '#9e7e5d' }),
    makePropSpawner(ctx, 'dry_bush', { shadow: true, tint: '#8e884e' }),
    makePropSpawner(ctx, 'dry_grass', { shadow: false, tint: '#c59c48' }),
    makePropSpawner(ctx, 'outback_rock', { shadow: true }),
    makePropSpawner(ctx, 'eucalyptus_tree', { shadow: true }),
    makePropSpawner(ctx, 'ammo_crate', { shadow: true }),
    makePropSpawner(ctx, 'field_radio', { shadow: true }),
    makePropSpawner(ctx, 'sandbag', { shadow: true })
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
    [-10.5, 4.8, 1.18, 0.1],
    [10.8, 6.5, 1.08, 2.2],
    [-7.8, 12.0, 1.0, 0.4],
    [8.4, 13.5, 1.12, 1.9],
    [-1.0, 17.0, 0.92, 1.1],
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

  // 6. Grounded military field camp: canvas tents, radio table, sandbag wall and practical lantern.
  // These are placed in the middle distance so every approval camera has foreground, subject and background layers.
  const canvasMat = new THREE.MeshStandardMaterial({ color: '#887550', roughness: 0.93, metalness: 0, side: THREE.DoubleSide });
  const darkCanvasMat = new THREE.MeshStandardMaterial({ color: '#4c4430', roughness: 0.95, metalness: 0, side: THREE.DoubleSide });
  const timberMat = new THREE.MeshStandardMaterial({ color: '#5c3924', roughness: 0.9, metalness: 0 });
  const ropeMat = new THREE.MeshStandardMaterial({ color: '#b59a66', roughness: 0.9, metalness: 0 });
  const buildTent = (name, planX, planY, yaw = 0, scale = 1) => {
    const g = new THREE.Group(); g.name = name;
    const w = 2.7, d = 3.8, h = 1.8;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute([
      -w/2,0,-d/2, w/2,0,-d/2, 0,h,-d/2,
      -w/2,0,d/2,  w/2,0,d/2,  0,h,d/2
    ], 3));
    geo.setIndex([0,1,2, 3,5,4, 0,3,4, 0,4,1, 2,1,4, 2,4,5, 0,2,5, 0,5,3]);
    geo.computeVertexNormals();
    const shell = new THREE.Mesh(geo, canvasMat); shell.castShadow = shell.receiveShadow = true; g.add(shell);
    const flap = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.45), darkCanvasMat);
    flap.position.set(0, 0.72, -d/2 - 0.012); flap.rotation.y = Math.PI; g.add(flap);
    for (const x of [-w/2, w/2]) {
      const a = new THREE.Vector3(x, 0.1, -d/2), b = new THREE.Vector3(x * 1.35, 0.02, -d/2 - 1.25);
      const curve = new THREE.LineCurve3(a, b); g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 3, 0.014, 5), ropeMat));
    }
    g.position.copy(V(planX, planY, gY(planX, planY))); g.rotation.y = yaw; g.scale.setScalar(scale); root.add(g); return g;
  };
  buildTent('camp_tent_command', -5.8, 7.1, 0.08, 1.0);
  buildTent('camp_tent_store', -2.6, 8.2, -0.12, 0.86);

  const radioTable = new THREE.Group(); radioTable.name = 'camp_radio_table';
  const tableTop = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.10, 0.78), timberMat); tableTop.position.y = 0.92; tableTop.castShadow = true; radioTable.add(tableTop);
  for (const x of [-0.66, 0.66]) for (const z of [-0.29, 0.29]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.9, 8), timberMat); leg.position.set(x, 0.45, z); leg.castShadow = true; radioTable.add(leg);
  }
  radioTable.position.copy(V(-1.0, 5.9, gY(-1.0, 5.9))); root.add(radioTable);
  spawnRadio([-1.0, 5.9, gY(-1.0, 5.9) + 0.98], { parent: root, yaw: 0.2, scale: 1.25, name: 'camp_field_radio' });
  for (let i = 0; i < 8; i++) {
    const sx = -4.4 + i * 0.72, sy = 4.55 + Math.sin(i * 0.65) * 0.18;
    spawnSandbag([sx, sy, gY(sx, sy)], { parent: root, yaw: -0.12 + i * 0.035, scale: 0.92, solid: true, name: `camp_sandbag_${i}` });
  }
  for (const [cx, cy, cz, yaw] of [[-0.2, 6.2, 0, 0.2], [-0.65, 6.35, 0, -0.15], [-6.9, 5.9, 0, 0.1]]) {
    spawnCrate([cx, cy, gY(cx, cy) + cz], { parent: root, yaw, solid: true });
  }

  const lantern = new THREE.Group(); lantern.name = 'camp_lantern';
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.055, 2.45, 10), timberMat); pole.position.y = 1.225; pole.castShadow = true; lantern.add(pole);
  const globe = new THREE.Mesh(new THREE.SphereGeometry(0.115, 16, 12), new THREE.MeshStandardMaterial({ color: '#ffe0a0', emissive: '#ff9b45', emissiveIntensity: 2.4, roughness: 0.22 }));
  globe.name = 'lantern_globe'; globe.userData.role = 'lamp'; globe.position.set(0, 2.18, 0); lantern.add(globe);
  const warm = new THREE.PointLight('#ffae63', ctx.place?.light === 'day' ? 0.25 : 3.2, 10, 2); warm.position.copy(globe.position); lantern.add(warm);
  lantern.position.copy(V(-1.9, 5.25, gY(-1.9, 5.25))); root.add(lantern);

  // 7. Parked Hero Military Flatbed Truck (well right of foreground actor corridor)
  const heroTruck = await buildHeroTruck(THREE, ctx, {
    name: 'wheat_parked_truck',
    pos: [4.65, 0.90, gY(4.65, 0.90)],
    yaw: -0.32,
    registerSolids: true,
    registerBedOnly: false
  });
  root.add(heroTruck);

  // 8. Distant Matte Feathered Emu Flock charging/striding across rolling hills
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
