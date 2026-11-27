// Sculpted Undulating Procedural Outback Terrain Builder
// Replaces blotchy flat planes with continuous rolling red-ochre/sandy terrain,
// wheel ruts (dirt_track), dugout depression (ambush_trench), and horizon dunes.

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

  // 'wheat' / 'fence': keep inner stage area smooth & level for character footing, roll outside
  const outerBlend = Math.min(1, Math.max(0, (r2 - 3.6) / 6.5));
  return hills * outerBlend;
}

export function buildOutbackTerrain(THREE, ctx, opts = {}) {
  const mode = opts.mode || 'wheat';
  const sizeX = opts.sizeX ?? 72;
  const sizeY = opts.sizeY ?? 72;
  const segs = opts.segs ?? 84;
  const centerPlanY = opts.centerY ?? 8.0;

  const geo = new THREE.PlaneGeometry(sizeX, sizeY, segs, segs);
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const cClay = new THREE.Color('#b6532e');
  const cSand = new THREE.Color('#c88649');
  const cRut = new THREE.Color('#7f341b');
  const cDryGrass = new THREE.Color('#b79245');
  const tmp = new THREE.Color();

  for (let i = 0; i < pos.count; i++) {
    const wx = pos.getX(i);
    const wz = pos.getZ(i);
    // Plane centered at (0, centerPlanY) in plan coordinates -> Three.js Z = -centerPlanY
    const planX = wx;
    const planY = centerPlanY - wz;
    const h = outbackHeight(mode, planX, planY);
    pos.setY(i, h);

    // Subtle organic vertex color modulation (zero glossy blobs)
    const patch = 0.5 + 0.5 * Math.sin(planX * 0.42 + Math.cos(planY * 0.37) * 1.4);
    tmp.copy(cClay).lerp(cSand, patch * 0.72);
    if (mode === 'track') {
      const rutBlend = Math.min(1, Math.exp(-Math.pow((planX + 0.88) / 0.42, 2)) + Math.exp(-Math.pow((planX - 0.88) / 0.42, 2)));
      tmp.lerp(cRut, rutBlend * 0.65);
    } else if (mode === 'wheat') {
      const paddy = Math.exp(-Math.pow(planX / 12.0, 2) - Math.pow((planY - 6.0) / 7.5, 2));
      tmp.lerp(cDryGrass, paddy * 0.55);
    }
    colors[i * 3] = tmp.r;
    colors[i * 3 + 1] = tmp.g;
    colors[i * 3 + 2] = tmp.b;
  }

  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  const texSize = 384;
  const texels = new Uint8Array(texSize * texSize * 4);
  let texSeed = 1932;
  const texRand = () => ((texSeed = (texSeed * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let y = 0; y < texSize; y++) for (let x = 0; x < texSize; x++) {
    const i = (y * texSize + x) * 4;
    const broad = Math.sin(x * 0.071) * 8 + Math.cos(y * 0.053) * 7;
    const grain = texRand() * 30 - 15;
    const crack = ((x * 17 + y * 29 + Math.floor(texRand() * 256)) % 137) < 2 ? -34 : 0;
    texels[i] = Math.max(62, Math.min(205, 164 + broad + grain + crack));
    texels[i + 1] = Math.max(35, Math.min(150, 92 + broad * 0.55 + grain * 0.45 + crack * 0.5));
    texels[i + 2] = Math.max(24, Math.min(115, 55 + broad * 0.35 + grain * 0.28 + crack * 0.3));
    texels[i + 3] = 255;
  }
  const groundTex = new THREE.DataTexture(texels, texSize, texSize, THREE.RGBAFormat);
  groundTex.wrapS = groundTex.wrapT = THREE.RepeatWrapping;
  groundTex.repeat.set(sizeX / 7.5, sizeY / 7.5);
  groundTex.colorSpace = THREE.SRGBColorSpace;
  groundTex.anisotropy = 8;
  groundTex.needsUpdate = true;

  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    map: groundTex,
    bumpMap: groundTex,
    bumpScale: 0.055,
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

export function buildOutbackGroundDetail(THREE, opts = {}) {
  const mode = opts.mode || 'wheat';
  const centerY = opts.centerY ?? 7;
  const width = opts.width ?? 24;
  const depth = opts.depth ?? 28;
  const count = opts.count ?? 210;
  const group = new THREE.Group();
  group.name = `${mode}_ground_detail`;
  let seed = opts.seed ?? 1932;
  const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const dummy = new THREE.Object3D();

  const stoneGeo = new THREE.IcosahedronGeometry(0.085, 1);
  stoneGeo.scale(1.5, 0.42, 1.0);
  const stoneMat = new THREE.MeshStandardMaterial({ color: '#805138', roughness: 0.96, metalness: 0 });
  const stones = new THREE.InstancedMesh(stoneGeo, stoneMat, count);
  for (let i = 0; i < count; i++) {
    const x = (rand() - 0.5) * width;
    const py = centerY + (rand() - 0.5) * depth;
    const z = outbackHeight(mode, x, py);
    const s = 0.35 + rand() * 1.25;
    dummy.position.set(x, z + 0.025, -py);
    dummy.rotation.set(rand() * 0.35, rand() * Math.PI * 2, rand() * 0.25);
    dummy.scale.set(s, s * (0.65 + rand() * 0.5), s);
    dummy.updateMatrix();
    stones.setMatrixAt(i, dummy.matrix);
  }
  stones.castShadow = true;
  stones.receiveShadow = true;
  group.add(stones);

  const bladeGeo = new THREE.ConeGeometry(0.018, 0.34, 4);
  bladeGeo.translate(0, 0.17, 0);
  const bladeMat = new THREE.MeshStandardMaterial({ color: '#9b7b35', roughness: 0.96, side: THREE.DoubleSide });
  const blades = new THREE.InstancedMesh(bladeGeo, bladeMat, count * 2);
  for (let i = 0; i < count * 2; i++) {
    const x = (rand() - 0.5) * width;
    const py = centerY + (rand() - 0.5) * depth;
    const z = outbackHeight(mode, x, py);
    const s = 0.55 + rand() * 1.3;
    dummy.position.set(x, z, -py);
    dummy.rotation.set((rand() - 0.5) * 0.28, rand() * Math.PI * 2, (rand() - 0.5) * 0.22);
    dummy.scale.set(s, s, s);
    dummy.updateMatrix();
    blades.setMatrixAt(i, dummy.matrix);
  }
  blades.castShadow = true;
  group.add(blades);
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
