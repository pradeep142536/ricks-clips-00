// SET 1: SUN-BAKED OUTBACK FIELD CAMP & WHEAT PADDOCK (Campion District, Western Australia)
// Layered ground-level composition: foreground crates/sandbags/rocks/barrels/fence wing along
// a rutted dirt track leading directly into a detailed Australian Emu War military field camp
// (seamed canvas tents + guy ropes + stakes, map/radio table, brass hurricane lantern, signal mast,
// right-flank military flatbed truck) backed by eucalyptus gum trees, wheat paddock, and outback mesas.

import { buildHeroTruck } from './hero_truck.js';
import { buildEmuFlock, buildEmu } from './emu_flock.js';
import { makePropSpawner } from './procedural_props.mjs';
import { buildOutbackTerrain, buildOutbackGroundDetail, buildOutbackHorizon, outbackHeight, campRoadCenterX } from './terrain_outback.mjs';

function makeRoadTrackTex(THREE) {
  const W = 512, H = 512;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');

  // Sun-baked sandy ochre road bed darkening cleanly inside the twin wheel ruts
  const grad = g.createLinearGradient(0, 0, W, 0);
  grad.addColorStop(0.00, '#c28650');
  grad.addColorStop(0.14, '#c8925c');
  grad.addColorStop(0.28, '#74371d'); // left tire rut
  grad.addColorStop(0.36, '#8f4c2a');
  grad.addColorStop(0.50, '#cc9a64'); // dusty center crown
  grad.addColorStop(0.64, '#8f4c2a');
  grad.addColorStop(0.72, '#74371d'); // right tire rut
  grad.addColorStop(0.86, '#c8925c');
  grad.addColorStop(1.00, '#c28650');
  g.fillStyle = grad;
  g.fillRect(0, 0, W, H);

  let seed = 7731;
  const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

  // Subtle cross-tread tire impressions inside both ruts
  for (let y = 0; y < H; y += 9) {
    for (const rx of [W * 0.28, W * 0.72]) {
      g.fillStyle = '#562411';
      g.globalAlpha = 0.26;
      g.fillRect(rx - 22 + (rand() - 0.5) * 4, y, 44, 3.5);
    }
  }
  // Dusty windblown striations & gravel pebbles
  for (let i = 0; i < 2400; i++) {
    const x = rand() * W, y = rand() * H;
    const sz = 1 + rand() * 3.2;
    g.fillStyle = rand() > 0.5 ? '#deb177' : '#5e2f19';
    g.globalAlpha = 0.16 + rand() * 0.24;
    g.fillRect(x, y, sz, sz * (0.7 + rand() * 0.6));
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 5.5);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function makeCanvasDuckTex(THREE, base = '#98855b', mud = '#5a452d') {
  const S = 256;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  g.fillStyle = base;
  g.fillRect(0, 0, S, S);
  // Cross-hatch canvas weave
  g.strokeStyle = 'rgba(42, 34, 22, 0.12)';
  g.lineWidth = 1;
  for (let i = 0; i < S; i += 4) {
    g.beginPath(); g.moveTo(i, 0); g.lineTo(i, S); g.stroke();
    g.beginPath(); g.moveTo(0, i); g.lineTo(S, i); g.stroke();
  }
  // Stitched military canvas seams + darker ridge/eave fold shadows
  for (const sx of [64, 128, 192]) {
    g.fillStyle = 'rgba(45, 36, 22, 0.28)';
    g.fillRect(sx - 2, 0, 4, S);
    g.fillStyle = 'rgba(235, 220, 182, 0.20)';
    g.fillRect(sx + 2, 0, 2, S);
  }
  // Bottom weathered dust/mud splash skirt
  const mg = g.createLinearGradient(0, S * 0.72, 0, S);
  mg.addColorStop(0, 'rgba(90, 69, 45, 0.0)');
  mg.addColorStop(1, mud);
  g.fillStyle = mg;
  g.fillRect(0, S * 0.72, S, S * 0.28);

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function makeStaveWoodTex(THREE) {
  const S = 256;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  g.fillStyle = '#8b5936';
  g.fillRect(0, 0, S, S);
  const staves = 12;
  const w = S / staves;
  for (let i = 0; i < staves; i++) {
    const shade = ((i * 37) % 5) - 2;
    g.fillStyle = shade > 0 ? 'rgba(218, 174, 126, 0.12)' : 'rgba(54, 28, 14, 0.14)';
    g.fillRect(i * w, 0, w - 2, S);
    g.fillStyle = '#331c0f';
    g.fillRect(i * w, 0, 2.2, S);
    for (let y = 0; y < S; y += 6) {
      g.fillStyle = 'rgba(46, 25, 13, 0.12)';
      g.fillRect(i * w + 3 + ((y * 3 + i * 7) % Math.max(4, w - 6)), y, 2, 5);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeFieldMapTex(THREE) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 192;
  const g = c.getContext('2d');
  g.fillStyle = '#dfd1ad';
  g.fillRect(0, 0, 256, 192);
  g.strokeStyle = 'rgba(130, 108, 76, 0.32)';
  for (let x = 16; x < 256; x += 24) { g.beginPath(); g.moveTo(x, 8); g.lineTo(x, 184); g.stroke(); }
  for (let y = 16; y < 192; y += 24) { g.beginPath(); g.moveTo(8, y); g.lineTo(248, y); g.stroke(); }
  // Road / paddock blocks
  g.strokeStyle = '#6b472d'; g.lineWidth = 2.5;
  g.beginPath(); g.moveTo(22, 160); g.quadraticCurveTo(120, 100, 232, 34); g.stroke();
  // Red tactical arrows + "EMU" sectors
  g.strokeStyle = '#b43527'; g.lineWidth = 3;
  g.beginPath(); g.arc(165, 68, 22, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.moveTo(74, 132); g.lineTo(140, 82); g.stroke();
  g.strokeStyle = '#2d241b'; g.lineWidth = 2; g.strokeRect(6, 6, 244, 180);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeContactAO(THREE, w = 1.0, d = 1.0, opacity = 0.42) {
  if (!makeContactAO._tex) {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(64, 64, 8, 64, 64, 62);
    gr.addColorStop(0.0, 'rgba(26, 15, 10, 0.88)');
    gr.addColorStop(0.55, 'rgba(26, 15, 10, 0.44)');
    gr.addColorStop(1.0, 'rgba(26, 15, 10, 0.0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
    makeContactAO._tex = new THREE.CanvasTexture(c);
    makeContactAO._tex.colorSpace = THREE.SRGBColorSpace;
  }
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(w, d),
    new THREE.MeshBasicMaterial({ map: makeContactAO._tex, transparent: true, opacity, depthWrite: false, toneMapped: false })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.012;
  mesh.userData.noExport = true;
  return mesh;
}

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
      sunDir: [-0.62, 0.56, 0.44],
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

  // 1. Undulating Outback Soil, Varied Weed Tuft Clusters & Irregular Stones + Horizon
  root.add(buildOutbackTerrain(THREE, ctx, { mode: 'wheat', centerY: 7.0, sizeX: 76, sizeY: 76, segs: 128 }));
  root.add(buildOutbackGroundDetail(THREE, { mode: 'wheat', centerY: 7.0, width: 28, depth: 34, count: 290 }));
  const dramaticLight = ['sunset', 'night', 'storm'].includes(ctx.place?.light);
  root.add(buildOutbackHorizon(THREE, { centerY: 7.0, sunset: dramaticLight }));

  // 2. Cached Certified GLB Asset Spawners
  const [spawnWheat, spawnFence, spawnBush, spawnRock, spawnTree, spawnCrate, spawnRadio, spawnSandbag, spawnMapTable, spawnRifle, spawnDiary, spawnBinocs] = await Promise.all([
    makePropSpawner(ctx, 'wheat_crop', { shadow: false, tint: '#e4c468' }),
    makePropSpawner(ctx, 'wooden_fence', { shadow: true, shadowOpacity: 0.42, tint: '#f0d8be' }),
    makePropSpawner(ctx, 'dry_bush', { shadow: true, shadowOpacity: 0.34, tint: '#a9a462' }),
    makePropSpawner(ctx, 'outback_rock', { shadow: true, shadowOpacity: 0.45 }),
    makePropSpawner(ctx, 'eucalyptus_tree', { shadow: true, shadowOpacity: 0.42 }),
    makePropSpawner(ctx, 'ammo_crate', { shadow: true, shadowOpacity: 0.46 }),
    makePropSpawner(ctx, 'field_radio', { shadow: true, shadowOpacity: 0.25 }),
    makePropSpawner(ctx, 'sandbag', { shadow: true, shadowOpacity: 0.45 }),
    makePropSpawner(ctx, 'map_table', { shadow: true, shadowOpacity: 0.42, tint: '#dfc29e' }),
    makePropSpawner(ctx, 'rifle', { shadow: false }),
    makePropSpawner(ctx, 'war_diary', { shadow: false }),
    makePropSpawner(ctx, 'binoculars', { shadow: false })
  ]);

  const gY = (px, py) => outbackHeight('wheat', px, py);

  // 3. Foreground-to-Camp Sculpted Rutted Dirt Road (textured + cross-section rut geometry)
  const roadTex = makeRoadTrackTex(THREE);
  const roadSteps = 36;
  const roadCols = 7; // outer-L, bank-L, rut-L, crown, rut-R, bank-R, outer-R
  const roadU = [-1.05, -0.78, -0.46, 0.0, 0.46, 0.78, 1.05];
  const roadHalfW = 1.02;
  const roadVerts = [], roadUvs = [], roadIdx = [];
  for (let i = 0; i <= roadSteps; i++) {
    const py = -6.0 + (i / roadSteps) * 15.2;
    const cx = campRoadCenterX(py);
    const prevX = campRoadCenterX(py - 0.2), nextX = campRoadCenterX(py + 0.2);
    const dx = nextX - prevX, dy = 0.4, len = Math.hypot(dx, dy) || 1;
    const nx = dy / len, ny = -dx / len;
    for (let j = 0; j < roadCols; j++) {
      const u = roadU[j];
      const off = u * roadHalfW;
      const px = cx + nx * off;
      const rPy = py + ny * off;
      const rutDip = (j === 2 || j === 4) ? -0.012 : (j === 0 || j === 6 ? -0.025 : 0.012);
      const p = V(px, rPy, gY(px, rPy) + rutDip);
      roadVerts.push(p.x, p.y, p.z);
      roadUvs.push(j / (roadCols - 1), i / roadSteps);
    }
    if (i > 0) {
      for (let j = 0; j < roadCols - 1; j++) {
        const a = (i - 1) * roadCols + j;
        const b = a + 1;
        const c = a + roadCols;
        const d = c + 1;
        roadIdx.push(a, b, d, a, d, c);
      }
    }
  }
  const roadGeo = new THREE.BufferGeometry();
  roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(roadVerts, 3));
  roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(roadUvs, 2));
  roadGeo.setIndex(roadIdx);
  roadGeo.computeVertexNormals();
  const roadMat = new THREE.MeshStandardMaterial({
    map: roadTex,
    bumpMap: roadTex,
    bumpScale: 0.032,
    roughness: 0.96,
    metalness: 0.0
  });
  const road = new THREE.Mesh(roadGeo, roadMat);
  road.name = 'campion_dirt_track';
  road.receiveShadow = true;
  root.add(road);

  // 4. Aged Split-Rail Paddock Fences: Foreground Wing Gates (open road corridor!) + Rear Paddock Line
  for (const [fx, fy, yaw, nm] of [
    [-2.15, -1.65, -0.22, 'wheat_fence_fg_left'],
    [2.15, -1.25, 0.24, 'wheat_fence_fg_right'],
    [-6.2, 9.8, 0.04, 'wheat_fence_bg_L2'],
    [-3.9, 10.1, -0.03, 'wheat_fence_bg_L1'],
    [-1.6, 10.2, 0.05, 'wheat_fence_bg_C'],
    [2.9, 10.1, -0.04, 'wheat_fence_bg_R1'],
    [5.3, 9.9, 0.06, 'wheat_fence_bg_R2']
  ]) {
    spawnFence([fx, fy, gY(fx, fy)], { parent: root, yaw, solid: true, name: nm });
  }
  const smashFence = spawnFence([0.65, 10.2, gY(0.65, 10.2)], {
    parent: root,
    solid: true,
    name: 'wheat_fence_smash'
  });
  const smashFenceBaseZ = gY(0.65, 10.2);

  // 5. LAYER 1 — FOREGROUND PROPS FLANKING THE DIRT ROAD (py = -4.2 .. -1.3)
  // Left Foreground: crate stack, coopered barrel, sandbags, irregular outback rock, scrub bushes
  const fgCrate1 = spawnCrate([-0.92, -3.55, gY(-0.92, -3.55)], { parent: root, solid: true, yaw: 0.28, scale: 1.05, name: 'fg_ammo_crate_1' });
  const fgCrate2 = spawnCrate([-0.94, -3.52, gY(-0.92, -3.55) + 0.22], { parent: root, solid: true, yaw: -0.14, scale: 0.94, shadow: false, name: 'fg_ammo_crate_2' });
  const fgCrate3 = spawnCrate([-1.18, -3.05, gY(-1.18, -3.05)], { parent: root, solid: true, yaw: 0.62, scale: 0.96, name: 'fg_ammo_crate_3' });
  spawnRock([-1.28, -3.82, gY(-1.28, -3.82)], { parent: root, yaw: 0.85, scale: 0.56, solid: true, name: 'fg_rock_left_1' });
  spawnSandbag([-0.76, -2.55, gY(-0.76, -2.55)], { parent: root, yaw: 0.65, scale: 0.96, solid: true, name: 'fg_sandbag_left_1' });
  spawnSandbag([-1.12, -2.02, gY(-1.12, -2.02)], { parent: root, yaw: 0.35, scale: 0.92, solid: true, name: 'fg_sandbag_left_2' });
  spawnBush([-1.42, -2.35, gY(-1.42, -2.35)], { parent: root, yaw: 1.15, scale: 0.74, name: 'fg_bush_left_1' });

  // Right Foreground: curved sandbag corner, stacked crate + bolt-action rifle, irregular rocks, scrub bush
  spawnSandbag([0.82, -3.45, gY(0.82, -3.45)], { parent: root, yaw: -0.68, scale: 0.95, solid: true, name: 'fg_sandbag_right_1' });
  spawnSandbag([1.06, -2.92, gY(1.06, -2.92)], { parent: root, yaw: -0.28, scale: 0.92, solid: true, name: 'fg_sandbag_right_2' });
  spawnCrate([0.88, -2.28, gY(0.88, -2.28)], { parent: root, solid: true, yaw: -0.36, scale: 1.0, name: 'fg_ammo_crate_right_1' });
  spawnRifle([0.62, -2.22, gY(0.62, -2.22) + 0.04], { parent: root, yaw: 1.05, rotX: 0.14, rotZ: -0.35, scale: 0.92, name: 'fg_rifle_leaning' });
  spawnRock([1.08, -3.85, gY(1.08, -3.85)], { parent: root, yaw: 2.1, scale: 0.52, solid: true, name: 'fg_rock_right_1' });
  spawnBush([1.35, -1.78, gY(1.35, -1.78)], { parent: root, yaw: 2.4, scale: 0.78, name: 'fg_bush_right_1' });

  // Shared detailed CanvasTextures for tents, barrels, and map props
  const canvasTex = makeCanvasDuckTex(THREE);
  const canvasMat = new THREE.MeshStandardMaterial({
    map: canvasTex, bumpMap: canvasTex, bumpScale: 0.018,
    color: '#d9ccb2', roughness: 0.92, metalness: 0, side: THREE.DoubleSide
  });
  const darkCanvasMat = new THREE.MeshStandardMaterial({ color: '#2b2419', roughness: 0.95, metalness: 0, side: THREE.DoubleSide });
  const timberMat = new THREE.MeshStandardMaterial({ color: '#694429', roughness: 0.88, metalness: 0 });
  const ropeMat = new THREE.MeshStandardMaterial({ color: '#c4ab76', roughness: 0.90, metalness: 0 });
  const ironMat = new THREE.MeshStandardMaterial({ color: '#2c3237', roughness: 0.58, metalness: 0.42 });
  const brassMat = new THREE.MeshStandardMaterial({ color: '#c49b46', roughness: 0.42, metalness: 0.65 });
  const barrelWoodMat = new THREE.MeshStandardMaterial({
    map: makeStaveWoodTex(THREE), bumpMap: makeStaveWoodTex(THREE), bumpScale: 0.016,
    color: '#c8a686', roughness: 0.84, metalness: 0
  });

  const makeBarrel = (name, bx, by, yaw = 0, scale = 1) => {
    const barrel = new THREE.Group(); barrel.name = name;
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.27, 0.64, 16, 2), barrelWoodMat);
    body.position.y = 0.32; body.castShadow = body.receiveShadow = true; barrel.add(body);
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.225, 0.225, 0.02, 14), timberMat);
    lid.position.y = 0.635; lid.castShadow = true; barrel.add(lid);
    for (const h of [0.11, 0.31, 0.52]) {
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.258, 0.020, 6, 16), ironMat);
      band.rotation.x = Math.PI / 2; band.position.y = h; band.castShadow = true; barrel.add(band);
    }
    barrel.add(makeContactAO(THREE, 0.74, 0.74, 0.44));
    barrel.position.copy(V(bx, by, gY(bx, by)));
    barrel.rotation.y = yaw;
    barrel.scale.setScalar(scale);
    root.add(barrel);
    return barrel;
  };
  makeBarrel('fg_barrel_left', -1.16, -2.55, 0.3, 0.96);

  // 6. LAYER 2 — MIDGROUND COMMAND CAMP (py = +1.4 .. +8.8)
  const buildTent = (name, planX, planY, yaw = 0, scale = 1, openInterior = true) => {
    const g = new THREE.Group(); g.name = name;
    const w = 2.65, d = 3.7, h = 1.88, eaveH = 0.56;
    // Vertical canvas side walls + pitched A-frame roof (authentic army wall-tent silhouette!)
    const pos = [
      -w / 2, 0, -d / 2,      w / 2, 0, -d / 2,      w / 2, eaveH, -d / 2,   -w / 2, eaveH, -d / 2,   0, h, -d / 2,
      -w / 2, 0, d / 2,       w / 2, 0, d / 2,       w / 2, eaveH, d / 2,    -w / 2, eaveH, d / 2,    0, h, d / 2
    ];
    const idx = [
      0, 5, 8, 0, 8, 3,       // left side wall (outward CCW)
      1, 2, 7, 1, 7, 6,       // right side wall
      3, 8, 9, 3, 9, 4,       // left roof slope
      2, 4, 9, 2, 9, 7,       // right roof slope
      5, 6, 7, 5, 7, 8, 8, 7, 9 // back gable
    ];
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    const uvs = [];
    for (let i = 0; i < 10; i++) uvs.push((pos[i * 3] + w / 2) / w, (pos[i * 3 + 2] + d / 2) / d);
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    const shell = new THREE.Mesh(geo, canvasMat);
    shell.castShadow = shell.receiveShadow = true;
    g.add(shell);

    // Protruding timber ridge pole & front upright pole
    const ridge = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, d + 0.36, 8), timberMat);
    ridge.rotation.x = Math.PI / 2; ridge.position.set(0, h - 0.02, 0); ridge.castShadow = true; g.add(ridge);
    const frontPole = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.052, h + 0.08, 8), timberMat);
    frontPole.position.set(0, (h + 0.08) / 2, -d / 2 - 0.08); frontPole.castShadow = true; g.add(frontPole);

    // Front folded canvas entrance curtains + dark interior shadow depth
    const backShadow = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.92, h * 0.85), darkCanvasMat);
    backShadow.position.set(0, h * 0.42, -d * 0.42); backShadow.rotation.y = Math.PI; g.add(backShadow);
    for (const s of [-1, 1]) {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(0.54, eaveH + 0.62, 0.05), canvasMat);
      wing.position.set(s * (w * 0.36), (eaveH + 0.62) / 2, -d / 2);
      wing.rotation.y = s * 0.32;
      wing.castShadow = true;
      g.add(wing);
    }
    if (openInterior) {
      const cot = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.34, 1.5), timberMat);
      cot.position.set(-0.55, 0.17, -0.35); cot.castShadow = true; g.add(cot);
    }

    // Guy ropes + driven wooden ground stakes along both eaves
    for (const s of [-1, 1]) {
      for (const rz of [-d * 0.44, 0.0, d * 0.44]) {
        const a = new THREE.Vector3(s * (w / 2), eaveH, rz);
        const b = new THREE.Vector3(s * (w / 2 + 0.58), 0.06, rz);
        g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(a, b), 2, 0.012, 5), ropeMat));
        const stake = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.015, 0.24, 6), timberMat);
        stake.position.set(b.x, 0.09, b.z);
        stake.rotation.z = s * 0.32;
        stake.castShadow = true;
        g.add(stake);
      }
    }
    g.add(makeContactAO(THREE, w + 0.65, d + 0.5, 0.48));
    g.position.copy(V(planX, planY, gY(planX, planY)));
    g.rotation.y = yaw;
    g.scale.setScalar(scale);
    root.add(g);
    return g;
  };
  buildTent('camp_tent_command', -2.15, 5.2, 0.34, 1.05, true);
  buildTent('camp_tent_store', 0.88, 7.35, -0.28, 0.88, true);

  // Midground Tactical Map & Field Radio Table (`map_table.glb` + props resting FLUSH on measured tabletop height)
  const tablePos = [0.68, 2.25, gY(0.68, 2.25)];
  const mapTable = spawnMapTable(tablePos, { parent: root, yaw: -0.30, scale: 0.72, solid: true, name: 'camp_radio_table' });
  mapTable.updateMatrixWorld(true);
  const tblOrigin = V(...tablePos);
  const ray = new THREE.Raycaster(new THREE.Vector3(tblOrigin.x, tblOrigin.y + 2.0, tblOrigin.z), new THREE.Vector3(0, -1, 0));
  const tblHits = ray.intersectObject(mapTable, true).filter(
    h => !/_ao_shadow|_outline/.test(h.object.name || '') && (h.point.y - tblOrigin.y) > 0.28 && (h.point.y - tblOrigin.y) < 1.25
  );
  const tblTopZ = tblHits.length ? (tblHits[0].point.y - tblOrigin.y) : 0.60;

  spawnRadio([0.82, 2.38, gY(0.82, 2.38) + tblTopZ], { parent: root, yaw: -0.45, scale: 1.0, name: 'camp_field_radio' });
  spawnDiary([0.52, 2.15, gY(0.52, 2.15) + tblTopZ], { parent: root, yaw: 0.28, scale: 1.05, name: 'camp_war_diary' });
  spawnBinocs([0.36, 2.32, gY(0.36, 2.32) + tblTopZ], { parent: root, yaw: 0.75, scale: 1.15, name: 'camp_binoculars' });

  const sheetGeo = new THREE.PlaneGeometry(0.62, 0.44);
  sheetGeo.rotateX(-Math.PI / 2);
  const mapSheet = new THREE.Mesh(sheetGeo, new THREE.MeshStandardMaterial({ map: makeFieldMapTex(THREE), roughness: 0.86 }));
  mapSheet.name = 'camp_tactical_map_sheet';
  mapSheet.position.copy(V(0.66, 2.10, gY(0.66, 2.10) + tblTopZ + 0.008));
  mapSheet.rotation.y = -0.22;
  root.add(mapSheet);

  // Brass Hurricane Table Lantern on tabletop corner (kept crisp on Day, glows warmly at Night!)
  const tableLantern = new THREE.Group();
  tableLantern.name = 'camp_table_lantern';
  const tlBase = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.082, 0.06, 12), brassMat);
  tlBase.position.y = 0.03; tlBase.castShadow = true; tableLantern.add(tlBase);
  const tlGlobe = new THREE.Mesh(
    new THREE.SphereGeometry(0.052, 12, 10),
    new THREE.MeshStandardMaterial({ color: '#ffe5a8', emissive: '#ff9d3b', emissiveIntensity: 1.6, roughness: 0.22 })
  );
  tlGlobe.scale.set(0.95, 1.35, 0.95);
  tlGlobe.position.y = 0.13; tlGlobe.name = 'table_lantern_globe'; tlGlobe.userData.role = 'lamp'; tableLantern.add(tlGlobe);
  const tlCap = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.055, 12), brassMat);
  tlCap.position.y = 0.225; tableLantern.add(tlCap);
  tableLantern.position.copy(V(0.94, 2.02, gY(0.94, 2.02) + tblTopZ));
  root.add(tableLantern);

  // Midground Defensive Sandbag Wall, Supply Crates & Barrels
  for (let i = 0; i < 6; i++) {
    const sx = -2.2 + i * 0.56;
    const sy = 2.65 + Math.sin(i * 0.55) * 0.14;
    spawnSandbag([sx, sy, gY(sx, sy)], { parent: root, yaw: -0.15 + i * 0.06, scale: 0.92, solid: true, name: `camp_sandbag_${i}` });
  }
  for (const [cx, cy, cz, yaw] of [
    [-0.22, 2.65, 0, 0.18],
    [-0.18, 2.66, 0.21, -0.10],
    [-2.75, 2.30, 0, 0.42],
    [1.62, 2.85, 0, -0.25],
    [1.64, 2.82, 0.21, 0.15]
  ]) {
    spawnCrate([cx, cy, gY(cx, cy) + cz], { parent: root, yaw, solid: true, shadow: cz === 0 });
  }
  for (const [bx, by, yaw, scale] of [
    [-2.55, 3.05, 0.2, 0.92],
    [-2.02, 3.15, -0.15, 0.84],
    [1.55, 2.15, 0.4, 0.88]
  ]) {
    makeBarrel(`camp_barrel_${bx}_${by}`, bx, by, yaw, scale);
  }

  // Tall Timber Field-Radio Mast with Crossbar, Australian Pennant & Guy Wires
  const mast = new THREE.Group(); mast.name = 'camp_signal_mast';
  const mastPole = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.078, 4.5, 10), timberMat);
  mastPole.position.y = 2.25; mastPole.castShadow = true; mast.add(mastPole);
  const mastArm = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.085, 0.095), timberMat);
  mastArm.position.set(0, 3.92, 0); mastArm.castShadow = true; mast.add(mastArm);
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.68, 0.42), new THREE.MeshStandardMaterial({ color: '#9c3b28', roughness: 0.90, side: THREE.DoubleSide }));
  flag.position.set(0.76, 3.68, 0.02); mast.add(flag);
  const mastLight = new THREE.Mesh(new THREE.SphereGeometry(0.10, 14, 10), new THREE.MeshStandardMaterial({ color: '#ffe6b3', emissive: '#ff9b45', emissiveIntensity: 2.2, roughness: 0.25 }));
  mastLight.name = 'signal_lamp_globe'; mastLight.userData.role = 'lamp'; mastLight.position.set(-0.52, 3.78, 0); mast.add(mastLight);
  const mastWarm = new THREE.PointLight('#ffad61', ctx.place?.light === 'daylight_crisp' ? 0.12 : 3.6, 11, 2); mastWarm.position.copy(mastLight.position); mast.add(mastWarm);
  for (const [gx, gy] of [[-1.7, -0.8], [1.7, -0.8], [0.0, 1.85]]) {
    const a = new THREE.Vector3(0, 3.88, 0), b = new THREE.Vector3(gx, 0.08, -gy);
    mast.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(a, b), 3, 0.014, 5), ropeMat));
  }
  mast.add(makeContactAO(THREE, 0.45, 0.45, 0.40));
  mast.position.copy(V(-0.85, 7.6, gY(-0.85, 7.6)));
  root.add(mast);

  // Camp Timber Lamp Post beside command tent entrance
  const lantern = new THREE.Group(); lantern.name = 'camp_lantern';
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.056, 2.35, 10), timberMat);
  pole.position.y = 1.175; pole.castShadow = true; lantern.add(pole);
  const lArm = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.05, 0.05), timberMat);
  lArm.position.set(0.14, 2.22, 0); lArm.castShadow = true; lantern.add(lArm);
  const globe = new THREE.Mesh(new THREE.SphereGeometry(0.105, 16, 12), new THREE.MeshStandardMaterial({ color: '#ffe0a0', emissive: '#ff9b45', emissiveIntensity: 2.2, roughness: 0.22 }));
  globe.name = 'lantern_globe'; globe.userData.role = 'lamp'; globe.position.set(0.24, 2.08, 0); lantern.add(globe);
  const warm = new THREE.PointLight('#ffae63', ctx.place?.light === 'daylight_crisp' ? 0.15 : 3.2, 10, 2);
  warm.position.copy(globe.position); lantern.add(warm);
  lantern.position.copy(V(-1.05, 4.15, gY(-1.05, 4.15)));
  root.add(lantern);

  // Parked Hero Military Flatbed Truck framing Right Side of Camp (never blocking tents or center road!)
  const heroTruck = await buildHeroTruck(THREE, ctx, {
    name: 'wheat_parked_truck',
    pos: [2.85, 5.55, gY(2.85, 5.55)],
    yaw: 1.98,
    registerSolids: true,
    registerBedOnly: false
  });
  root.add(heroTruck);

  // 7. LAYER 3 — BACKGROUND: Wheat Paddock behind rear fence, Eucalyptus Trees, Grazing Emus
  for (let gx = -8.5; gx <= 8.5; gx += 1.25) {
    for (let gy = 10.9; gy <= 16.2; gy += 1.25) {
      const px = gx + Math.sin(gx * 4.3 + gy) * 0.35;
      const py = gy + Math.cos(gy * 3.7 + gx) * 0.35;
      spawnWheat([px, py, gY(px, py)], {
        parent: root,
        yaw: (px + py) * 0.7,
        scale: 0.92 + Math.abs(Math.sin(px * 3)) * 0.25
      });
    }
  }

  for (const [tx, ty, sc, yaw] of [
    [-4.8, 11.8, 1.08, 0.25],
    [5.2, 12.6, 1.04, 2.1],
    [-1.4, 18.8, 0.96, 1.1],
    [-8.2, 16.5, 1.18, 2.5],
    [8.4, 18.5, 1.14, 0.85],
    [2.8, 21.5, 1.02, 1.65]
  ]) {
    spawnTree([tx, ty, gY(tx, ty)], { parent: root, scale: sc, yaw, solid: true });
  }
  for (const [rx, ry, yaw, sc] of [
    [-3.1, 1.8, 0.45, 0.72],
    [3.8, 1.4, 1.55, 0.88],
    [-4.2, 8.2, 2.2, 0.95]
  ]) {
    spawnRock([rx, ry, gY(rx, ry)], { parent: root, yaw, scale: sc, solid: true });
  }
  for (const [bx, by, yaw, sc] of [
    [-3.3, 0.4, 0.5, 0.85],
    [2.6, 0.8, 1.7, 0.82],
    [-3.8, 6.8, 2.8, 0.95],
    [4.4, 8.6, 0.9, 0.92]
  ]) {
    spawnBush([bx, by, gY(bx, by)], { parent: root, yaw, scale: sc });
  }

  // Distant Matte Feathered Emu Flock striding across the open sunlit wheat paddock
  const emuFlock = buildEmuFlock(THREE, ctx, {
    count: 8,
    baseX: -0.2,
    baseY: 13.4,
    spreadX: 7.5,
    spreadY: 3.4,
    yaw: Math.PI * 0.88,
    groundY: gY
  });
  root.add(emuFlock);

  // Hero charging 3D Emu kept ready for close-up action beats
  const smashEmu = buildEmu(THREE, ctx, { scale: 1.08, seed: 32, facing: Math.PI });
  smashEmu.position.copy(V(0.65, 11.4, gY(0.65, 11.4)));
  smashEmu.visible = false;
  root.add(smashEmu);

  scene.add(root);

  return {
    anchors: {
      soldier_station: V(-0.6, 0.0, 0.0),
      officer_spot: V(0.5, 0.0, 0.0),
      emu_horizon: V(-0.2, 13.4, 0.0)
    },
    update: (f, t) => {
      const timeSec = typeof t === 'number' ? t : (f / 30);
      emuFlock.userData.update && emuFlock.userData.update(timeSec);
      if (f >= 195 && f <= 255) {
        smashEmu.visible = true;
        const chargeU = Math.max(0, Math.min(1, (f - 195) / 18));
        const py = 11.6 - chargeU * 1.45;
        smashEmu.position.copy(V(0.65, py, gY(0.65, py)));
        smashEmu.userData.animate && smashEmu.userData.animate(timeSec, true);
        if (f >= 212) {
          const hitK = Math.min(1, (f - 212) / 7);
          smashFence.rotation.x = 0.45 * hitK;
          smashFence.rotation.z = 0.08 * Math.sin(f * 0.8) * (1 - hitK * 0.5);
          smashFence.position.copy(V(0.65, 10.2 - 0.18 * hitK, smashFenceBaseZ - 0.04 * hitK));
        } else {
          smashFence.rotation.set(0, 0, 0);
          smashFence.position.copy(V(0.65, 10.2, smashFenceBaseZ));
        }
      } else {
        smashEmu.visible = false;
        smashFence.rotation.set(0, 0, 0);
        smashFence.position.copy(V(0.65, 10.2, smashFenceBaseZ));
      }
    }
  };
}
