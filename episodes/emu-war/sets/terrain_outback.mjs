// Sculpted Undulating Procedural Outback Terrain Builder
// Replaces blotchy flat planes with continuous rolling red-ochre/sandy terrain,
// wheel ruts (dirt_track), dugout depression (ambush_trench), and horizon dunes.

export function campRoadCenterX(py) {
  // Runs cleanly from bottom-center foreground through camp clearing beside command tent
  const u = Math.max(-1, Math.min(2, (py + 5.5) / 14.0));
  return -0.02 - Math.sin(u * 1.25) * 0.14 - Math.max(0, py - 1.5) * 0.14;
}

export function outbackHeight(mode, px, py) {
  const r2 = Math.hypot(px, py);
  const hills =
    Math.sin(px * 0.14 + 0.4) * Math.cos(py * 0.11 - 0.3) * 0.55 +
    Math.sin(px * 0.31 - py * 0.24) * 0.18 +
    Math.cos(px * 0.07 + py * 0.06) * 0.75 * Math.min(1, Math.max(0, (r2 - 6.5) / 14.0));

  if (mode === 'track') {
    // Twin dirt wheel ruts centered along track X = +-0.88m
    const roadMask = Math.exp(-Math.pow(px / 2.9, 2));
    const rutL = Math.exp(-Math.pow((px + 0.88) / 0.34, 2));
    const rutR = Math.exp(-Math.pow((px - 0.88) / 0.34, 2));
    const ruts = -0.075 * (rutL + rutR);
    const bumps = Math.sin(py * 0.9) * 0.025 * roadMask;
    return hills * (1 - roadMask * 0.92) + ruts + bumps;
  }

  if (mode === 'trench') {
    // Dugout recessed pocket at px in [-3.5..3.5], py in [-1.1..0.65] -> -0.25m floor
    const inX = Math.max(0, 1 - Math.max(0, Math.abs(px) - 3.0) / 1.2);
    const inY = (py > -1.3 && py < 0.8) ? Math.sin(Math.min(1, Math.max(0, (py + 1.3) / 2.1)) * Math.PI) : 0;
    const trenchPit = -0.28 * inX * inY;
    // Slight earth berm right in front at py ~ 1.0
    const berm = 0.18 * inX * Math.exp(-Math.pow((py - 1.05) / 0.45, 2));
    const flatCenter = Math.min(1, Math.max(0, (r2 - 4.0) / 10.0));
    return hills * flatCenter + trenchPit + berm;
  }

  // 'wheat' / 'fence': smooth beaten camp & foreground road corridor, gently rising horizon swells
  const roadDx = px - campRoadCenterX(py);
  const roadEnv = py >= -7.0 && py <= 9.5 ? Math.exp(-Math.pow(roadDx / 1.65, 2)) : 0;
  const rutL = Math.exp(-Math.pow((roadDx + 0.44) / 0.18, 2));
  const rutR = Math.exp(-Math.pow((roadDx - 0.44) / 0.18, 2));
  const roadRuts = (py >= -6.8 && py <= 9.2) ? (-0.040 * (rutL + rutR) + Math.sin(py * 1.15) * 0.010 * roadEnv) : 0;
  const micro = (Math.sin(px * 1.1 + py * 0.8) * 0.022 + Math.cos(px * 0.65 - py * 1.3) * 0.016) * (1 - roadEnv * 0.85);
  const outerBlend = Math.min(1, Math.max(0, (r2 - 6.5) / 8.5));
  const horizonSwell = py > 10.0 ? Math.min(1.85, (py - 10.0) * 0.092) * (0.68 + 0.32 * Math.sin(px * 0.16 + 0.7)) : 0;
  return hills * outerBlend * (1 - roadEnv * 0.7) + micro + roadRuts + horizonSwell;
}

export function h2(x, y, s) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 982451653)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
const wrapI = (v, P) => ((v % P) + P) % P;
function valNoise(x, y, P, s) {
  const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
  const a = h2(wrapI(xi, P), wrapI(yi, P), s);
  const b = h2(wrapI(xi + 1, P), wrapI(yi, P), s);
  const c = h2(wrapI(xi, P), wrapI(yi + 1, P), s);
  const d = h2(wrapI(xi + 1, P), wrapI(yi + 1, P), s);
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}
export function fbmTile(u, v, baseP, oct, s) {
  let sum = 0, amp = 0.5, norm = 0, p = baseP;
  for (let o = 0; o < oct; o++) {
    sum += amp * valNoise(u * p, v * p, p, s + o * 31);
    norm += amp;
    amp *= 0.5;
    p *= 2;
  }
  return sum / norm;
}

function makeRichGroundTextures(THREE, repeatX, repeatY) {
  // Seamless 1024x1024 high-grain crusty Australian outback soil albedo + bump + roughness
  // Uses rich multi-scale value noise, crusty mud flakes, fine gravel, and dry silt (zero squiggly worm lines or square blocks)
  const N = 1024;
  const albedo = new Uint8Array(N * N * 4);
  const rough = new Uint8Array(N * N * 4);
  const bump = new Uint8Array(N * N * 4);

  for (let y = 0; y < N; y++) {
    const v = y / N;
    for (let x = 0; x < N; x++) {
      const u = x / N;
      const macro = fbmTile(u, v, 4, 3, 1932);
      const mid = fbmTile(u + macro * 0.08, v - macro * 0.07, 12, 3, 2117);
      const clods = fbmTile(u, v, 32, 3, 3307);
      const microGrit = fbmTile(u, v, 96, 2, 4099);
      const grain = h2(x, y, 7919);

      // Crusty surface flake ridges (short mottled dry-clay platelets, no long wiggly lines)
      const flakeNoise = fbmTile(u * 1.4, v * 1.4, 24, 3, 5501);
      const flakeShadow = flakeNoise < 0.38 ? Math.pow((0.38 - flakeNoise) / 0.38, 1.3) * 0.65 : 0.0;

      // Scattered crisp gravel pebbles & pale limestone specks across high-frequency noise
      const pebble = clods > 0.70 ? Math.min(1, (clods - 0.70) / 0.22) : 0.0;
      const fineSpeck = microGrit > 0.68 ? (microGrit - 0.68) / 0.32 : 0.0;

      const drySilt = Math.max(0, Math.min(1, (macro - 0.43) * 2.4));
      const darkLoam = Math.max(0, Math.min(1, (0.43 - macro) * 2.4));

      let r = 176 + (mid - 0.5) * 48 + (clods - 0.5) * 32 + drySilt * 30 - darkLoam * 52 + pebble * 26 + fineSpeck * 18 - flakeShadow * 46 + (grain - 0.5) * 18;
      let g = 104 + (mid - 0.5) * 34 + (clods - 0.5) * 24 + drySilt * 32 - darkLoam * 36 + pebble * 22 + fineSpeck * 14 - flakeShadow * 32 + (grain - 0.5) * 13;
      let b = 60  + (mid - 0.5) * 22 + (clods - 0.5) * 16 + drySilt * 24 - darkLoam * 22 + pebble * 18 + fineSpeck * 10 - flakeShadow * 20 + (grain - 0.5) * 10;

      const idx = (y * N + x) * 4;
      albedo[idx]     = Math.max(34, Math.min(232, r)) | 0;
      albedo[idx + 1] = Math.max(22, Math.min(192, g)) | 0;
      albedo[idx + 2] = Math.max(15, Math.min(150, b)) | 0;
      albedo[idx + 3] = 255;

      const hVal = Math.max(0, Math.min(255, 128 + (clods - 0.5) * 90 + (microGrit - 0.5) * 75 + pebble * 95 - flakeShadow * 90 + (grain - 0.5) * 32)) | 0;
      bump[idx] = bump[idx + 1] = bump[idx + 2] = hVal;
      bump[idx + 3] = 255;

      const rVal = Math.max(206, Math.min(254, 238 + drySilt * 14 - darkLoam * 24 - pebble * 16)) | 0;
      rough[idx] = rough[idx + 1] = rough[idx + 2] = rVal;
      rough[idx + 3] = 255;
    }
  }

  const mkTex = (bytes, srgb) => {
    const tex = new THREE.DataTexture(bytes, N, N, THREE.RGBAFormat);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.generateMipmaps = true;
    tex.anisotropy = 8;
    if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  };
  return {
    map: mkTex(albedo, true),
    bumpMap: mkTex(bump, false),
    roughnessMap: mkTex(rough, false)
  };
}

export function buildOutbackTerrain(THREE, ctx, opts = {}) {
  const mode = opts.mode || 'wheat';
  const sizeX = opts.sizeX ?? 72;
  const sizeY = opts.sizeY ?? 72;
  const segs = opts.segs ?? 180;
  const centerPlanY = opts.centerY ?? 8.0;

  const geo = new THREE.PlaneGeometry(sizeX, sizeY, segs, segs);
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const cClay = new THREE.Color('#ad5a34');
  const cSand = new THREE.Color('#cfa572');
  const cRut = new THREE.Color('#66341d');
  const cCampYard = new THREE.Color('#b48b5c');
  const cDarkSoil = new THREE.Color('#703e24');
  const cDryGrass = new THREE.Color('#918348');
  const tmp = new THREE.Color();

  for (let i = 0; i < pos.count; i++) {
    const wx = pos.getX(i);
    const wz = pos.getZ(i);
    const planX = wx;
    const planY = centerPlanY - wz;
    const h = outbackHeight(mode, planX, planY);
    pos.setY(i, h);

    // Rich non-repeating multi-frequency dusty/loam/clay ground variation (breaks right foreground!)
    const w1 = 0.5 + 0.5 * Math.sin(planX * 0.48 + Math.cos(planY * 0.41) * 2.1);
    const w2 = 0.5 + 0.5 * Math.cos(planX * 1.15 - planY * 0.83 + Math.sin(planX * 0.33) * 1.6);
    const w3 = 0.5 + 0.5 * Math.sin((planX * 1.85 + planY * 1.35) * 0.72 + Math.cos(planY * 1.7) * 0.9);
    tmp.copy(cClay).lerp(cSand, w1 * 0.48 + w2 * 0.34);
    if (w3 > 0.58) tmp.lerp(cDarkSoil, Math.min(0.65, (w3 - 0.58) * 1.45));

    if (mode === 'track') {
      const rutBlend = Math.min(1, Math.exp(-Math.pow((planX + 0.88) / 0.42, 2)) + Math.exp(-Math.pow((planX - 0.88) / 0.42, 2)));
      tmp.lerp(cRut, rutBlend * 0.65);
    } else if (mode === 'wheat') {
      const scrubBand = Math.max(0, Math.sin(planX * 0.38 + 1.1) * Math.cos(planY * 0.31));
      tmp.lerp(cDryGrass, scrubBand * 0.44);
      if (planY > 0.5 && planY < 10.2) {
        const yardMask = Math.exp(-Math.pow((planX + 0.15) / 5.5, 2) - Math.pow((planY - 4.8) / 4.2, 2));
        tmp.lerp(cCampYard, yardMask * 0.58);
      }
      if (planY >= -6.8 && planY <= 9.2) {
        const rDx = planX - campRoadCenterX(planY);
        const rRut = Math.min(1, Math.exp(-Math.pow((rDx + 0.44) / 0.26, 2)) + Math.exp(-Math.pow((rDx - 0.44) / 0.26, 2)));
        const berm = Math.min(1, Math.exp(-Math.pow((Math.abs(rDx) - 0.82) / 0.32, 2)));
        tmp.lerp(cRut, rRut * 0.52);
        tmp.lerp(cSand, berm * 0.32);
      }
      if (planY >= 10.2) {
        const paddy = Math.min(1, (planY - 10.2) / 3.0) * Math.exp(-Math.pow(planX / 17.0, 2));
        tmp.lerp(cDryGrass, paddy * 0.64);
      }
    }
    colors[i * 3] = tmp.r;
    colors[i * 3 + 1] = tmp.g;
    colors[i * 3 + 2] = tmp.b;
  }

  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  const groundTex = makeRichGroundTextures(THREE, sizeX / 5.2, sizeY / 5.2);

  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    map: groundTex.map,
    bumpMap: groundTex.bumpMap,
    bumpScale: 0.125,
    roughnessMap: groundTex.roughnessMap,
    roughness: 1.0,
    metalness: 0.0
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = `${mode}_outback_terrain`;
  mesh.userData.role = 'ground';
  mesh.position.set(0, 0, -centerPlanY);
  mesh.receiveShadow = true;
  mesh.castShadow = false;
  return mesh;
}

function makeWeedTuftGeometry(THREE) {
  // Fine delicate multi-blade dry outback tussock cluster (thin natural blades, never wide flat paddles)
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];
  const blades = 11;
  const segs = 3;
  let vBase = 0;
  for (let b = 0; b < blades; b++) {
    const az = (b / blades) * Math.PI * 2 + (b % 3) * 0.27;
    const h = 0.10 + ((b * 37) % 10) * 0.011;
    const lean = 0.07 + ((b * 23) % 7) * 0.018;
    const w0 = 0.0085 + (b % 3) * 0.0022;
    const cx = Math.cos(az), sz = Math.sin(az);
    const rx = -sz, rz = cx;
    for (let s = 0; s <= segs; s++) {
      const t = s / segs;
      const w = w0 * (1 - t * 0.90);
      const y = h * Math.sin(t * Math.PI * 0.54);
      const rOut = lean * t * t;
      const mx = cx * rOut, mz = sz * rOut;
      positions.push(mx - rx * w, y, mz - rz * w);
      positions.push(mx + rx * w, y, mz + rz * w);
      normals.push(cx * 0.25, 0.94, sz * 0.25, cx * 0.25, 0.94, sz * 0.25);
      uvs.push(0, t, 1, t);
    }
    for (let s = 0; s < segs; s++) {
      const i0 = vBase + s * 2;
      indices.push(i0, i0 + 1, i0 + 3, i0, i0 + 3, i0 + 2);
    }
    vBase += (segs + 1) * 2;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

export function buildOutbackGroundDetail(THREE, opts = {}) {
  const mode = opts.mode || 'wheat';
  const centerY = opts.centerY ?? 7;
  const width = opts.width ?? 24;
  const depth = opts.depth ?? 28;
  const count = opts.count ?? 220;
  const group = new THREE.Group();
  group.name = `${mode}_ground_detail`;
  let seed = opts.seed ?? 1932;
  const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const dummy = new THREE.Object3D();
  const cTmp = new THREE.Color();

  // Anchor zones: cluster plants and gravel tightly around disturbed edges, rocks, bushes, fences, trenches, tracks & camp borders
  // while keeping dugout trench interior and active wheel ruts clear.
  const PLANT_BY_MODE = {
    wheat: [
      [-0.60, -3.75, 0.40], [-0.82, -2.55, 0.50], [-1.25, -1.75, 0.65], [-1.55, -0.55, 1.15],
      [0.82, -2.28, 0.52], [1.35, -1.55, 0.75], [-2.75, 2.30, 0.90], [-2.15, 5.20, 1.65],
      [1.60, 2.25, 0.95], [2.85, 5.55, 1.45], [-3.8, 10.1, 2.0], [0.75, 10.2, 1.8],
      [4.2, 10.0, 2.0], [-3.1, 1.8, 0.85], [3.8, 1.4, 0.95]
    ],
    trench: [
      [-1.75, -1.55, 0.65], [1.75, -1.55, 0.65], [-2.85, -0.45, 0.75], [2.75, -0.35, 0.75],
      [-3.50, 1.15, 1.10], [3.40, 1.15, 1.10], [-1.45, 1.45, 0.85], [1.65, 1.45, 0.85],
      [-4.80, 3.20, 1.25], [4.50, 4.00, 1.25], [-5.60, 5.40, 1.40], [5.80, 6.20, 1.45],
      [-6.50, 11.8, 2.10], [2.80, 8.80, 1.65], [-9.0, 16.5, 2.40], [9.0, 18.0, 2.40]
    ],
    track: [
      [-2.10, -2.20, 0.75], [2.05, -2.05, 0.75], [-2.60, 0.80, 0.85], [2.45, 0.60, 0.85],
      [-2.90, 4.20, 0.95], [2.95, 4.50, 1.05], [-7.20, 8.50, 1.60], [3.60, 2.20, 1.10],
      [4.80, 10.5, 1.60], [-8.40, 16.0, 1.90], [5.60, 14.0, 1.75], [-2.35, 14.5, 1.10],
      [2.55, 18.0, 1.30], [-9.20, 23.0, 2.20], [9.20, 26.0, 2.20]
    ],
    broken_fence: [
      [-1.45, -2.10, 0.60], [1.45, -1.95, 0.65], [-1.55, 0.35, 0.75], [2.25, 1.30, 0.95],
      [-2.40, 1.35, 0.95], [-4.40, 1.40, 1.20], [4.40, 1.40, 1.20], [3.60, 0.65, 0.90],
      [-4.20, 2.30, 1.10], [4.50, 2.50, 1.15], [-3.00, 5.20, 1.40], [2.60, 5.40, 1.40],
      [-5.60, 8.80, 1.75], [-7.40, 13.0, 2.00], [7.80, 14.2, 2.00]
    ]
  };
  const GRAVEL_BY_MODE = {
    wheat: [
      [-0.60, -3.75, 0.52], [0.48, -3.72, 0.48], [0.76, -2.55, 0.58], [-1.55, -0.55, 1.05],
      [1.35, -1.55, 0.68], [-2.55, 2.85, 0.85], [1.52, 1.85, 0.78]
    ],
    trench: [
      [-1.55, -1.45, 0.65], [1.55, -1.45, 0.65], [-2.20, 1.05, 0.95], [2.20, 1.05, 0.95],
      [-4.80, 3.20, 1.15], [4.50, 4.00, 1.15], [-2.50, 7.50, 1.25], [-5.20, 2.50, 1.20]
    ],
    track: [
      [-1.55, -2.40, 0.65], [1.55, -2.10, 0.65], [-1.55, 2.20, 0.75], [1.60, 2.40, 0.75],
      [3.20, 5.50, 1.05], [-7.50, 4.00, 1.10], [5.40, 14.0, 1.15], [-1.55, 9.50, 0.85], [1.65, 10.5, 0.85]
    ],
    broken_fence: [
      [-1.35, -2.05, 0.62], [1.35, -1.85, 0.62], [-2.20, 1.25, 0.85], [2.20, 1.25, 0.85],
      [3.60, 0.60, 0.95], [-1.45, 0.35, 0.65], [0.20, 1.40, 1.10], [-3.20, 3.40, 1.05]
    ]
  };
  const plantAnchors = PLANT_BY_MODE[mode] || PLANT_BY_MODE.wheat;
  const gravelAnchors = GRAVEL_BY_MODE[mode] || GRAVEL_BY_MODE.wheat;

  const roadCenterFn = (py) => {
    if (mode === 'track') return 0.0;
    if (mode === 'trench') return -5.3 + Math.sin(py * 0.14) * 0.28;
    if (mode === 'broken_fence') return 0.10 - Math.sin((py + 4.0) * 0.16) * 0.22;
    return campRoadCenterX(py);
  };

  const samplePlantPos = () => {
    const roll = rand();
    if (roll < 0.78) {
      const a = plantAnchors[Math.floor(rand() * plantAnchors.length)];
      const ang = rand() * Math.PI * 2;
      const dist = 0.14 + Math.pow(rand(), 1.35) * a[2];
      return [a[0] + Math.cos(ang) * dist, a[1] + Math.sin(ang) * dist];
    }
    return [(rand() - 0.5) * width, (mode === 'trench' ? 2.5 : mode === 'track' ? 0.0 : 8.5) + rand() * 14.0];
  };
  const sampleGravelPos = () => {
    const roll = rand();
    if (roll < 0.62) {
      const a = gravelAnchors[Math.floor(rand() * gravelAnchors.length)];
      const ang = rand() * Math.PI * 2;
      const dist = 0.10 + Math.pow(rand(), 1.2) * a[2];
      return [a[0] + Math.cos(ang) * dist, a[1] + Math.sin(ang) * dist];
    }
    const py = -4.5 + rand() * (mode === 'track' ? 24.0 : 15.0);
    const side = rand() > 0.5 ? 1 : -1;
    const spread = mode === 'track' ? (1.05 + rand() * 1.15) : (0.45 + rand() * 0.65);
    const px = roadCenterFn(py) + side * spread;
    return [px, py];
  };

  // 1. Tight irregular fractured gravel clusters concentrated along rut margins, rocks, and fence bases
  const stoneGeo = new THREE.IcosahedronGeometry(0.024, 1);
  const sPos = stoneGeo.attributes.position;
  for (let i = 0; i < sPos.count; i++) {
    const sx = sPos.getX(i), sy = sPos.getY(i), sz = sPos.getZ(i);
    const warp = 0.72 + 0.45 * Math.abs(Math.sin(sx * 47 + sz * 31));
    sPos.setXYZ(i, sx * 1.45 * warp, sy * 0.40, sz * 1.10 * warp);
  }
  stoneGeo.computeVertexNormals();
  const stoneMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.94, metalness: 0.0 });
  const stones = new THREE.InstancedMesh(stoneGeo, stoneMat, count);
  const stonePalette = ['#7d5036', '#916744', '#5c3b29', '#a37e58', '#6e4733'];
  let placedStones = 0;
  let guard = 0;
  const heightMode = mode === 'broken_fence' ? 'wheat' : mode;
  while (placedStones < count && guard < count * 8) {
    guard++;
    const [x, py] = sampleGravelPos();
    const rDx = Math.abs(x - roadCenterFn(py));
    if (py < 9.2 && rDx < 0.24) continue;
    if (mode === 'trench' && Math.abs(x) < 3.45 && py > -1.25 && py < 0.75) continue;
    const z = outbackHeight(heightMode, x, py);
    const s = 0.38 + rand() * 0.78;
    dummy.position.set(x, z + 0.006, -py);
    dummy.rotation.set(rand() * 0.3, rand() * Math.PI * 2, rand() * 0.3);
    dummy.scale.set(s * (0.85 + rand() * 0.5), s * (0.48 + rand() * 0.48), s * (0.8 + rand() * 0.45));
    dummy.updateMatrix();
    stones.setMatrixAt(placedStones, dummy.matrix);
    cTmp.set(stonePalette[placedStones % stonePalette.length]);
    stones.setColorAt(placedStones, cTmp);
    placedStones++;
  }
  stones.count = placedStones;
  stones.castShadow = true;
  stones.receiveShadow = true;
  if (stones.instanceColor) stones.instanceColor.needsUpdate = true;
  group.add(stones);

  // 2. Dry sun-scorched scrub tussocks strictly clustered around fence bases, bushes, boulders & camp borders
  const tuftGeo = makeWeedTuftGeometry(THREE);
  const tuftMat = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    roughness: 0.94,
    metalness: 0.0,
    side: THREE.DoubleSide
  });
  const tuftCount = Math.round(count * 1.25);
  const tufts = new THREE.InstancedMesh(tuftGeo, tuftMat, tuftCount);
  const tuftPalette = ['#786c39', '#8e7b41', '#645c2f', '#9c8347', '#5a5328', '#856d38'];
  let placedTufts = 0;
  guard = 0;
  while (placedTufts < tuftCount && guard < tuftCount * 8) {
    guard++;
    const [x, py] = samplePlantPos();
    const rDx = Math.abs(x - roadCenterFn(py));
    if (mode === 'wheat' && py < 9.2 && rDx < 0.74) continue;
    if (mode === 'track' && Math.abs(x) < 1.35) continue;
    if (mode === 'broken_fence' && py < 5.0 && rDx < 0.72) continue;
    if (mode === 'trench' && Math.abs(x) < 3.45 && py > -1.35 && py < 1.15) continue;
    if (mode === 'wheat' && py < -2.6 && Math.hypot(x - 0.50, py + 3.45) > 0.35 && Math.hypot(x + 0.60, py + 3.65) > 0.38) continue;
    if (mode === 'wheat' && Math.hypot(x + 2.15, py - 5.2) < 1.85) continue;
    if (mode === 'wheat' && Math.hypot(x - 1.25, py - 8.2) < 1.55) continue;
    const z = outbackHeight(heightMode, x, py);
    const s = (py < 0 ? 0.48 : 0.60) + rand() * 0.56;
    dummy.position.set(x, z - 0.008, -py);
    dummy.rotation.set((rand() - 0.5) * 0.22, rand() * Math.PI * 2, (rand() - 0.5) * 0.22);
    dummy.scale.set(s * (0.9 + rand() * 0.5), s * (0.68 + rand() * 0.58), s * (0.9 + rand() * 0.5));
    dummy.updateMatrix();
    tufts.setMatrixAt(placedTufts, dummy.matrix);
    cTmp.set(tuftPalette[placedTufts % tuftPalette.length]);
    tufts.setColorAt(placedTufts, cTmp);
    placedTufts++;
  }
  tufts.count = placedTufts;
  tufts.castShadow = true;
  tufts.receiveShadow = true;
  if (tufts.instanceColor) tufts.instanceColor.needsUpdate = true;
  group.add(tufts);
  return group;
}

/**
 * Stylized Distant Outback Horizon Apron + Dual-Layer Mesa/Foothill Ridges
 * Visual sky/horizon framing layer (noExport = true so physics/exports stay lightweight).
 */
export function buildOutbackHorizon(THREE, opts = {}) {
  const { centerY = 7.0, sunset = false } = opts;
  const g = new THREE.Group();
  g.name = sunset ? 'outback_horizon_sunset' : 'outback_horizon_day';
  g.userData.noExport = true;
  g.position.set(0, 0, -centerY);

  const cHex = hex => new THREE.Color(hex);

  // 1. Extended red-ochre Outback scrub plain skirt connecting terrain edges to distant ridges
  const apronGeo = new THREE.RingGeometry(24, 165, 84, 6);
  apronGeo.rotateX(-Math.PI / 2);
  const apPos = apronGeo.attributes.position;
  const apCols = new Float32Array(apPos.count * 3);
  const cAprNear = cHex(sunset ? '#703d32' : '#bc8f56');
  const cAprFar = cHex(sunset ? '#4a2644' : '#b27d58');
  for (let i = 0; i < apPos.count; i++) {
    const x = apPos.getX(i), z = apPos.getZ(i), r = Math.hypot(x, z);
    const t = Math.max(0, Math.min(1, (r - 52) / 100));
    const wave = Math.sin(x * 0.045) * Math.cos(z * 0.04) * 0.45;
    apPos.setY(i, r < 52 ? -0.45 : -0.15 + wave * t + t * 0.25);
    const col = cAprNear.clone().lerp(cAprFar, t);
    apCols[i * 3] = col.r; apCols[i * 3 + 1] = col.g; apCols[i * 3 + 2] = col.b;
  }
  apronGeo.setAttribute('color', new THREE.BufferAttribute(apCols, 3));
  const apronMat = new THREE.MeshBasicMaterial({
    vertexColors: true,
    side: THREE.DoubleSide,
    fog: true,
    toneMapped: false
  });
  const apron = new THREE.Mesh(apronGeo, apronMat);
  apron.userData.noExport = true;
  apron.renderOrder = -10;
  g.add(apron);

  // Helper: sculpted 360-degree Outback mesa/range ring with flat-top erosion & base/crest gradient
  function makeRidgeRing(radius, baseH, peakAmp, segs, seed, cBaseHex, cMidHex, cTopHex, renderOrd) {
    const geo = new THREE.CylinderGeometry(radius, radius + 10, 1, segs, 3, true);
    const pos = geo.attributes.position;
    const cols = new Float32Array(pos.count * 3);
    const cBase = cHex(cBaseHex), cMid = cHex(cMidHex), cTop = cHex(cTopHex);
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i), vy = pos.getY(i), vz = pos.getZ(i);
      const u = vy + 0.5; // 0 = bottom, 1 = ridge crest
      const ang = Math.atan2(vz, vx);
      // Mesa-like Australian range profile: broad plateaus + gentle saddles
      const m1 = Math.sin(ang * 3.0 + seed) * 0.5 + Math.cos(ang * 5.0 - seed * 0.7) * 0.35;
      const m2 = Math.sin(ang * 11.0 + seed * 1.9) * 0.18 + Math.cos(ang * 17.0 + seed * 0.4) * 0.09;
      const mesa = Math.max(-0.25, Math.min(0.72, m1)) / 0.72; // flattens tops like mesa plateaus
      const crestY = Math.max(2.0, baseH + Math.max(0, mesa) * peakAmp + m2 * peakAmp * 0.45);
      const y = -1.2 + u * (crestY + 1.2);
      pos.setY(i, y);
      const col = u < 0.45
        ? cBase.clone().lerp(cMid, u / 0.45)
        : cMid.clone().lerp(cTop, (u - 0.45) / 0.55);
      cols[i * 3] = col.r; cols[i * 3 + 1] = col.g; cols[i * 3 + 2] = col.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    const mat = new THREE.MeshBasicMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      fog: false,
      toneMapped: false
    });
    const m = new THREE.Mesh(geo, mat);
    m.userData.noExport = true;
    m.renderOrder = renderOrd;
    return m;
  }

  // 2. Nearer sandstone mesa ridge ring + 3. Far hazy mountain range silhouette
  if (sunset) {
    g.add(makeRidgeRing(142, 3.0, 5.2, 160, 1.3, '#c86a76', '#562a57', '#a6536b', -12));
    g.add(makeRidgeRing(212, 6.2, 8.8, 160, 4.1, '#a95f76', '#3d204d', '#733864', -14));
  } else {
    g.add(makeRidgeRing(142, 2.8, 4.8, 160, 1.3, '#cbb69e', '#9a684a', '#be8c66', -12));
    g.add(makeRidgeRing(212, 6.0, 8.5, 160, 4.1, '#c6d2e0', '#8d8ca3', '#aca4b5', -14));
  }

  return g;
}
