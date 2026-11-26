// SET 2: DUSTY AMBUSH TRENCH (Western Australia, 1932)
// Undulating red desert trench dugout, timber duckboard walkway at z = -0.22m,
// CC0 Poly Haven sandbag parapet on earth berm (py = 0.92..1.18m), and Approved Option (A)
// 1914 Lewis Gun + Tripod resting FIRMLY ON THE SANDBAG PARAPET in front of the gunner
// (NEVER floating near the gunner's helmet!). Matte feathered charging Emu flock + CC0 nature props.

import { buildEmuFlock } from './emu_flock.js';
import { buildLewisGun, makeMatteMat, makePropSpawner } from './procedural_props.mjs';
import { buildOutbackTerrain, buildOutbackHorizon, outbackHeight } from './terrain_outback.mjs';

export async function build(THREE, scene, film, ctx) {
  const { B2T, sky } = ctx;
  const V = (x, y, z) => B2T([x, y, z]);
  const root = new THREE.Group();
  root.name = 'ambush_trench';

  if (sky?.clouds) {
    sky.clouds({
      kind: 'clear-day',
      seed: 1932,
      coverage: 0.72,
      scale: 1.3,
      sunDir: [0.45, 0.70, 0.40],
      colors: {
        top: '#2968b4',
        mid: '#6ba5df',
        hor: '#e2ebf3',
        sun: '#ffebc2',
        lit: '#fffbf2',
        shade: '#a4b7d4',
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

  // 1. Sculpted Undulating Outback Trench Terrain + Horizon Ridge
  root.add(buildOutbackTerrain(THREE, ctx, { mode: 'trench', centerY: 7.0, sizeX: 70, sizeY: 70 }));
  root.add(buildOutbackHorizon(THREE, { centerY: 7.0, sunset: false }));
  const gY = (px, py) => outbackHeight('trench', px, py);

  const M = {
    trenchTimber: makeMatteMat(THREE, '#5c4028', 0.90, 0.0),
    duckboard: makeMatteMat(THREE, '#725134', 0.90, 0.0),
    brassMat: makeMatteMat(THREE, '#c8a038', 0.76, 0.42)
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

  // 2. Dugout Duckboard Walkway (top = -0.22m inside trench) & Timber Revetment Wall
  for (let b = -3.4; b <= 3.4; b += 0.85) {
    box(0.80, 1.30, 0.04, b, 0.05, -0.26, M.duckboard, `duckboard_${b}`);
  }
  for (let px = -3.6; px <= 3.6; px += 0.28) {
    box(0.25, 0.08, 0.72, px, 0.62, -0.26, M.trenchTimber, `revetment_${px}`);
  }

  // 3. CC0 Sandbag Parapet (2 staggered courses resting flush on berm crest z ~ 0.16m -> top ~ 0.62m)
  const [spawnBag, spawnRock, spawnBush, spawnTree, spawnCrate] = await Promise.all([
    makePropSpawner(ctx, 'sandbag', { shadow: true, tint: '#cbb789' }),
    makePropSpawner(ctx, 'outback_rock', { shadow: true }),
    makePropSpawner(ctx, 'dry_bush', { shadow: true, tint: '#8b824a' }),
    makePropSpawner(ctx, 'eucalyptus_tree', { shadow: true, tint: '#797458' }),
    makePropSpawner(ctx, 'ammo_crate', { shadow: true })
  ]);

  // Woven khaki burlap material to override textured bag GLB cleanly without touching 3D asset files
  const bCanv = document.createElement('canvas');
  bCanv.width = bCanv.height = 128;
  const bCtx = bCanv.getContext('2d');
  bCtx.fillStyle = '#b9a275';
  bCtx.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 128; i += 4) {
    bCtx.fillStyle = i % 8 === 0 ? 'rgba(85,68,42,0.12)' : 'rgba(232,216,178,0.10)';
    bCtx.fillRect(0, i, 128, 2);
    bCtx.fillRect(i, 0, 2, 128);
  }
  const bTex = new THREE.CanvasTexture(bCanv);
  bTex.colorSpace = THREE.SRGBColorSpace;
  bTex.wrapS = bTex.wrapT = THREE.RepeatWrapping;
  bTex.repeat.set(3, 3);
  const burlapMat = new THREE.MeshStandardMaterial({
    map: bTex,
    color: '#c7b285',
    roughness: 0.92,
    metalness: 0.0
  });

  const parapetBox = new THREE.Box3();
  for (let row = 0; row < 2; row++) {
    const py = 0.88 + row * 0.22;
    const pz = gY(0, py) + row * 0.24;
    for (let bx = -3.2; bx <= 3.2; bx += 0.64) {
      const shiftX = bx + (row % 2) * 0.30;
      const bag = spawnBag([shiftX, py, pz], {
        parent: root,
        yaw: Math.sin(shiftX * 2.1 + row) * 0.08,
        name: `trench_sandbag_${row}_${bx}`
      });
      bag.traverse(m => {
        if (m.isMesh) {
          m.material = burlapMat;
          m.castShadow = true;
          m.receiveShadow = true;
        }
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
    mountHeight: 0.42, // Low trench tripod on parapet -> breech sits around world z = 1.00m (chest height!)
    pitch: -0.02
  });
  gunMount.position.copy(V(0.25, 1.02, parapetTopY));
  gunMount.rotation.y = Math.PI; // Aim barrel +Z_local -> plan +Y (toward charging emus!)
  root.add(gunMount);
  ctx.assets.registerSolid('trench_lewis_gun', gunMount);

  // Ammo crate beside gunner on trench duckboard
  spawnCrate([0.85, 0.20, -0.22], { parent: root, solid: true, yaw: -0.35, name: 'trench_ammo_crate' });

  // Spent Brass Cartridges on trench floor
  const casingGeo = new THREE.CylinderGeometry(0.011, 0.011, 0.052, 6);
  for (let c = 0; c < 18; c++) {
    const cx = -0.15 + Math.sin(c * 4.2) * 0.45;
    const cy = -0.15 + Math.cos(c * 3.1) * 0.35;
    const cas = new THREE.Mesh(casingGeo, M.brassMat);
    cas.position.copy(V(cx, cy, -0.21));
    cas.rotation.set(Math.PI / 2, c * 0.5, Math.sin(c));
    root.add(cas);
  }

  // 5. Matte Feathered Charging Emu Flock (on undulating desert ahead of trench)
  const chargingEmus = buildEmuFlock(THREE, ctx, {
    count: 16,
    baseX: 0.0,
    baseY: 11.0,
    spreadX: 16.0,
    spreadY: 6.0,
    yaw: Math.PI,
    groundY: gY
  });
  root.add(chargingEmus);

  // 6. Desert Rocks, Scrub Bushes & Gum Trees (NO cypress trees!)
  spawnTree([-9.0, 17.0, gY(-9.0, 17.0)], { parent: root, scale: 1.05, yaw: 0.5, solid: true });
  spawnTree([9.5, 19.0, gY(9.5, 19.0)], { parent: root, scale: 1.15, yaw: 2.1, solid: true });
  for (const [rx, ry, sc] of [[-4.8, 3.2, 0.9], [4.5, 4.0, 1.15], [-2.5, 7.5, 0.8]]) {
    spawnRock([rx, ry, gY(rx, ry)], { parent: root, scale: sc, yaw: rx, solid: true });
  }
  for (const [bx, by] of [[-5.6, 5.2], [5.8, 6.2], [2.8, 8.8]]) {
    spawnBush([bx, by, gY(bx, by)], { parent: root, scale: 0.85, yaw: bx });
  }

  scene.add(root);

  return {
    anchors: {
      gunner_station: V(0.14, 0.14, -0.22),
      meredith_trench: V(-1.45, 0.10, -0.22),
      gun_grip: V(0.25, 0.64, parapetTopY + 0.42),
      emu_charge: V(0.0, 11.0, 0.0)
    },
    update: (time) => {
      chargingEmus.userData.update && chargingEmus.userData.update(time);
    }
  };
}
