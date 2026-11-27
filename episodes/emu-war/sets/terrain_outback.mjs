// Sculpted Undulating Procedural Outback Terrain Builder
// Replaces blotchy flat planes with continuous rolling red-ochre/sandy terrain,
// wheel ruts (dirt_track), dugout depression (ambush_trench), and horizon dunes.

export function campRoadCenterX(py) {
  // Sweeps from foreground bottom center into the open camp clearing then angles left beside command tent
  const u = Math.max(-1, Math.min(2, (py + 5.5) / 14.0));
  return -0.05 - Math.sin(u * 1.45) * 0.22 - Math.max(0, py - 2.0) * 0.16;
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
  const rutL = Math.exp(-Math.pow((roadDx + 0.46) / 0.19, 2));
  const rutR = Math.exp(-Math.pow((roadDx - 0.46) / 0.19, 2));
  const roadRuts = (py >= -6.8 && py <= 9.2) ? (-0.042 * (rutL + rutR) + Math.sin(py * 1.15) * 0.011 * roadEnv) : 0;
  const micro = (Math.sin(px * 1.1 + py * 0.8) * 0.022 + Math.cos(px * 0.65 - py * 1.3) * 0.016) * (1 - roadEnv * 0.85);
  const outerBlend = Math.min(1, Math.max(0, (r2 - 6.5) / 8.5));
  const horizonSwell = py > 10.0 ? Math.min(1.6, (py - 10.0) * 0.085) * (0.65 + 0.35 * Math.sin(px * 0.16 + 0.7)) : 0;
  return hills * outerBlend * (1 - roadEnv * 0.7) + micro + roadRuts + horizonSwell;
}

function makeRichGroundTex(THREE, repeatX, repeatY) {
  const S = 512;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = S;
  const ctx = canvas.getContext('2d');

  // Sun-baked ochre-terracotta base
  ctx.fillStyle = '#bd7b48';
  ctx.fillRect(0, 0, S, S);

  let seed = 1932;
  const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

  // Layered soil washes (light dusty silt, warm clay, olive-tan dry litter patches)
  const washes = ['#c8915a', '#a55b33', '#b3894c', '#d0a36c', '#915230', '#8d7843'];
  for (let i = 0; i < 420; i++) {
    const x = rand() * S, y = rand() * S;
    const rx = 10 + rand() * 34, ry = 7 + rand() * 24;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rand() * Math.PI);
    ctx.fillStyle = washes[i % washes.length];
    ctx.globalAlpha = 0.09 + rand() * 0.14;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Fine compacted dirt pebbles, chaff straws, and cracked dry-earth fractures
  for (let i = 0; i < 3200; i++) {
    const x = rand() * S, y = rand() * S;
    const r = 0.6 + rand() * 2.2;
    ctx.fillStyle = rand() > 0.45 ? '#6d3e24' : '#e0b77c';
    ctx.globalAlpha = 0.14 + rand() * 0.22;
    ctx.fillRect(x, y, r, r * (0.7 + rand() * 0.6));
  }
  ctx.strokeStyle = '#6c3b22';
  for (let i = 0; i < 240; i++) {
    const x = rand() * S, y = rand() * S;
    const a = rand() * Math.PI * 2, len = 6 + rand() * 18;
    ctx.globalAlpha = 0.12 + rand() * 0.14;
    ctx.lineWidth = 0.7 + rand() * 0.9;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * len * 0.5, y + Math.sin(a) * len * 0.5);
    ctx.lineTo(x + Math.cos(a + 0.45) * len, y + Math.sin(a + 0.45) * len);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

export function buildOutbackTerrain(THREE, ctx, opts = {}) {
  const mode = opts.mode || 'wheat';
  const sizeX = opts.sizeX ?? 72;
  const sizeY = opts.sizeY ?? 72;
  const segs = opts.segs ?? 128;
  const centerPlanY = opts.centerY ?? 8.0;

  const geo = new THREE.PlaneGeometry(sizeX, sizeY, segs, segs);
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const cClay = new THREE.Color('#c16e3f');
  const cSand = new THREE.Color('#d29a5e');
  const cRut = new THREE.Color('#803d22');
  const cCampYard = new THREE.Color('#ba8d58');
  const cDryGrass = new THREE.Color('#9f8d49');
  const tmp = new THREE.Color();

  for (let i = 0; i < pos.count; i++) {
    const wx = pos.getX(i);
    const wz = pos.getZ(i);
    // Plane centered at (0, centerPlanY) in plan coordinates -> Three.js Z = -centerPlanY
    const planX = wx;
    const planY = centerPlanY - wz;
    const h = outbackHeight(mode, planX, planY);
    pos.setY(i, h);

    const patch1 = 0.5 + 0.5 * Math.sin(planX * 0.46 + Math.cos(planY * 0.41) * 1.7);
    const patch2 = 0.5 + 0.5 * Math.cos(planX * 0.95 - planY * 0.72);
    tmp.copy(cClay).lerp(cSand, patch1 * 0.68 + patch2 * 0.22);
    if (mode === 'track') {
      const rutBlend = Math.min(1, Math.exp(-Math.pow((planX + 0.88) / 0.42, 2)) + Math.exp(-Math.pow((planX - 0.88) / 0.42, 2)));
      tmp.lerp(cRut, rutBlend * 0.65);
    } else if (mode === 'wheat') {
      const scrubBand = Math.max(0, Math.sin(planX * 0.35 + 1.1) * Math.cos(planY * 0.28));
      tmp.lerp(cDryGrass, scrubBand * 0.48);
      if (planY > 1.2 && planY < 10.0) {
        const yardMask = Math.exp(-Math.pow((planX + 0.2) / 5.5, 2) - Math.pow((planY - 5.2) / 4.2, 2));
        tmp.lerp(cCampYard, yardMask * 0.58);
      }
      if (planY >= -6.8 && planY <= 9.2) {
        const rDx = planX - campRoadCenterX(planY);
        const rRut = Math.min(1, Math.exp(-Math.pow((rDx + 0.46) / 0.22, 2)) + Math.exp(-Math.pow((rDx - 0.46) / 0.22, 2)));
        tmp.lerp(cRut, rRut * 0.72);
      }
      if (planY >= 10.2) {
        const paddy = Math.min(1, (planY - 10.2) / 3.0) * Math.exp(-Math.pow(planX / 15.0, 2));
        tmp.lerp(cDryGrass, paddy * 0.62);
      }
    }
    colors[i * 3] = tmp.r;
    colors[i * 3 + 1] = tmp.g;
    colors[i * 3 + 2] = tmp.b;
  }

  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  const groundTex = makeRichGroundTex(THREE, sizeX / 4.5, sizeY / 4.5);

  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    map: groundTex,
    bumpMap: groundTex,
    bumpScale: 0.045,
    roughness: 0.94,
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
  // Build a fanning multi-blade arched weed/tussock tuft rosette (ZERO vertical cone spikes)
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];
  const blades = 7;
  const segs = 3;
  let vBase = 0;
  for (let b = 0; b < blades; b++) {
    const az = (b / blades) * Math.PI * 2 + (b % 2) * 0.35;
    const h = 0.16 + ((b * 37) % 10) * 0.013;
    const lean = 0.09 + ((b * 23) % 7) * 0.022;
    const w0 = 0.028 + (b % 3) * 0.006;
    const cx = Math.cos(az), sz = Math.sin(az);
    const rx = -sz, rz = cx;
    for (let s = 0; s <= segs; s++) {
      const t = s / segs;
      const w = w0 * (1 - t * 0.88);
      const y = h * Math.sin(t * Math.PI * 0.52);
      const rOut = lean * t * t;
      const mx = cx * rOut, mz = sz * rOut;
      positions.push(mx - rx * w, y, mz - rz * w);
      positions.push(mx + rx * w, y, mz + rz * w);
      normals.push(cx * 0.3, 0.9, sz * 0.3, cx * 0.3, 0.9, sz * 0.3);
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

  // 1. Irregular fractured stones & roadside gravel clusters
  const stoneGeo = new THREE.IcosahedronGeometry(0.085, 1);
  const sPos = stoneGeo.attributes.position;
  for (let i = 0; i < sPos.count; i++) {
    const sx = sPos.getX(i), sy = sPos.getY(i), sz = sPos.getZ(i);
    const warp = 0.78 + 0.35 * Math.abs(Math.sin(sx * 31 + sz * 23));
    sPos.setXYZ(i, sx * 1.45 * warp, sy * 0.45, sz * 1.05 * warp);
  }
  stoneGeo.computeVertexNormals();
  const stoneMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.94, metalness: 0.0 });
  const stones = new THREE.InstancedMesh(stoneGeo, stoneMat, count);
  const stonePalette = ['#8c5b3e', '#a4774e', '#6f4833', '#b38c62', '#7a523c'];
  let placedStones = 0;
  while (placedStones < count) {
    const inFg = placedStones < Math.round(count * 0.42);
    const x = inFg ? (rand() - 0.5) * 8.5 : (rand() - 0.5) * width;
    const py = inFg ? (-4.6 + rand() * 8.5) : (centerY + (rand() - 0.5) * depth);
    const rDx = Math.abs(x - campRoadCenterX(py));
    if (rDx < 0.36 || (rDx > 0.28 && rDx < 0.62 && rand() > 0.25)) continue;
    const z = outbackHeight(mode, x, py);
    const s = (inFg ? 0.55 : 0.40) + rand() * 1.35;
    dummy.position.set(x, z + 0.015, -py);
    dummy.rotation.set(rand() * 0.3, rand() * Math.PI * 2, rand() * 0.3);
    dummy.scale.set(s * (0.85 + rand() * 0.5), s * (0.55 + rand() * 0.55), s * (0.8 + rand() * 0.45));
    dummy.updateMatrix();
    stones.setMatrixAt(placedStones, dummy.matrix);
    cTmp.set(stonePalette[placedStones % stonePalette.length]);
    stones.setColorAt(placedStones, cTmp);
    placedStones++;
  }
  stones.castShadow = true;
  stones.receiveShadow = true;
  if (stones.instanceColor) stones.instanceColor.needsUpdate = true;
  group.add(stones);

  // 2. Varied dry & olive-green tussock weed clumps (ZERO cone spikes!)
  const tuftGeo = makeWeedTuftGeometry(THREE);
  const tuftMat = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    roughness: 0.90,
    metalness: 0.0,
    side: THREE.DoubleSide
  });
  const tuftCount = Math.round(count * 1.5);
  const tufts = new THREE.InstancedMesh(tuftGeo, tuftMat, tuftCount);
  const tuftPalette = ['#7d7c37', '#94833e', '#656c2d', '#a99346', '#5b6129', '#b08e45'];
  let placedTufts = 0;
  let guard = 0;
  while (placedTufts < tuftCount && guard < tuftCount * 6) {
    guard++;
    const inFg = placedTufts < Math.round(tuftCount * 0.46);
    const x = inFg ? (rand() - 0.5) * 9.5 : (rand() - 0.5) * width;
    const py = inFg ? (-4.5 + rand() * 11.5) : (centerY + (rand() - 0.5) * depth);
    // Keep weeds along road shoulders and off packed rut centers + command tent interiors
    const rDx = Math.abs(x - campRoadCenterX(py));
    if (py < 9.2 && rDx < 0.72) continue;
    if (Math.hypot(x + 2.05, py - 5.2) < 1.9) continue;
    if (Math.hypot(x - 0.85, py - 7.2) < 1.55) continue;
    const z = outbackHeight(mode, x, py);
    const s = (inFg ? 0.82 : 0.72) + rand() * 1.35;
    dummy.position.set(x, z - 0.01, -py);
    dummy.rotation.set((rand() - 0.5) * 0.22, rand() * Math.PI * 2, (rand() - 0.5) * 0.22);
    dummy.scale.set(s * (0.9 + rand() * 0.5), s * (0.75 + rand() * 0.7), s * (0.9 + rand() * 0.5));
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
