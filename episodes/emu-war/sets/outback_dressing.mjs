// Shared Outback Environmental Dressing, Crisp Procedural Sky Presets, Textured Roads, Tents & Prop Helpers
// Used cleanly across exterior sets (wheat_field, ambush_trench, dirt_track, broken_fence) without duplicate logic.

import { buildOutbackHorizon, fbmTile, h2 } from './terrain_outback.mjs';

let _aoTex = null;
export function makeContactAO(THREE, w = 1.0, d = 1.0, opacity = 0.72) {
  if (!_aoTex) {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(64, 64, 4, 64, 64, 62);
    gr.addColorStop(0.0, 'rgba(14, 7, 4, 0.96)');
    gr.addColorStop(0.42, 'rgba(18, 9, 5, 0.72)');
    gr.addColorStop(0.75, 'rgba(22, 11, 6, 0.25)');
    gr.addColorStop(1.0, 'rgba(22, 11, 6, 0.0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
    _aoTex = new THREE.CanvasTexture(c);
    _aoTex.colorSpace = THREE.SRGBColorSpace;
  }
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(w, d),
    new THREE.MeshBasicMaterial({ map: _aoTex, transparent: true, opacity, depthWrite: false, toneMapped: false })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.012;
  mesh.userData.noExport = true;
  return mesh;
}

export function applyBaseDirtGradient(THREE, geo, dirtFrac = 0.28, dirtHex = '#6e3d22', topHex = '#ffffff') {
  const pos = geo.attributes.position;
  if (!pos) return;
  geo.computeBoundingBox();
  const bb = geo.boundingBox;
  const minY = bb ? bb.min.y : 0;
  const spanY = bb ? Math.max(1e-4, bb.max.y - bb.min.y) : 1.0;
  const dirtHeight = spanY * dirtFrac;
  const cBot = new THREE.Color(dirtHex);
  const cTop = new THREE.Color(topHex);
  const cTmp = new THREE.Color();
  const cols = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const t = Math.max(0, Math.min(1, (pos.getY(i) - minY) / dirtHeight));
    const s = t * t * (3 - 2 * t);
    cTmp.copy(cBot).lerp(cTop, s);
    cols[i * 3] = cTmp.r;
    cols[i * 3 + 1] = cTmp.g;
    cols[i * 3 + 2] = cTmp.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
}

function makeDataTex(THREE, bytes, w, h, srgb, wrapX = true, repeat = [1, 1]) {
  const tex = new THREE.DataTexture(bytes, w, h, THREE.RGBAFormat);
  tex.wrapS = wrapX ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat[0], repeat[1]);
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.anisotropy = 8;
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export function makeFenceWoodTextures(THREE) {
  const N = 512;
  const albedo = new Uint8Array(N * N * 4);
  const bump = new Uint8Array(N * N * 4);
  for (let y = 0; y < N; y++) {
    const v = y / N;
    for (let x = 0; x < N; x++) {
      const u = x / N;
      const plankBand = fbmTile(u * 0.5, v * 3.0, 2, 2, 3191);
      const fiber = fbmTile(u * 2.5, v * 28.0 + plankBand * 0.3, 4, 3, 3251);
      const grainWave = Math.sin((v * 26.0 + fbmTile(u, v, 6, 3, 3313) * 4.5) * Math.PI * 2) * 0.5 + 0.5;
      const crackProbe = Math.abs(fbmTile(u * 1.4, v * 9.0, 8, 3, 3407) - 0.5);
      const splitCrack = crackProbe < 0.015 ? (1.0 - crackProbe / 0.015) : 0.0;
      const kdx = (u - 0.62) * 5.2, kdy = (v - 0.44) * 14.0;
      const knot = Math.exp(-(kdx * kdx + kdy * kdy));
      const sunBleach = fbmTile(u, v, 4, 2, 3609);
      const r = 148 + (fiber - 0.5) * 42 + (grainWave - 0.5) * 26 + (sunBleach - 0.5) * 32 - splitCrack * 68 - knot * 52;
      const g = 112 + (fiber - 0.5) * 32 + (grainWave - 0.5) * 20 + (sunBleach - 0.5) * 30 - splitCrack * 52 - knot * 42;
      const b = 78 + (fiber - 0.5) * 22 + (grainWave - 0.5) * 14 + (sunBleach - 0.5) * 26 - splitCrack * 38 - knot * 30;
      const idx = (y * N + x) * 4;
      albedo[idx] = Math.max(28, Math.min(218, r)) | 0;
      albedo[idx + 1] = Math.max(22, Math.min(186, g)) | 0;
      albedo[idx + 2] = Math.max(16, Math.min(148, b)) | 0;
      albedo[idx + 3] = 255;
      const hVal = Math.max(0, Math.min(255, 134 + (fiber - 0.5) * 70 + (grainWave - 0.5) * 36 - splitCrack * 135 - knot * 60)) | 0;
      bump[idx] = bump[idx + 1] = bump[idx + 2] = hVal;
      bump[idx + 3] = 255;
    }
  }
  return { map: makeDataTex(THREE, albedo, N, N, true), bumpMap: makeDataTex(THREE, bump, N, N, false) };
}

export function makeBurlapTextures(THREE) {
  const N = 512;
  const albedo = new Uint8Array(N * N * 4);
  const bump = new Uint8Array(N * N * 4);
  for (let y = 0; y < N; y++) {
    const v = y / N;
    const warpJitter = (fbmTile(0.3, v, 8, 2, 4401) - 0.5) * 0.008;
    for (let x = 0; x < N; x++) {
      const u = x / N;
      const uT = (u + warpJitter) * 58.0;
      const vT = (v + (fbmTile(u, 0.4, 8, 2, 4419) - 0.5) * 0.008) * 58.0;
      const weave = 0.5 + 0.25 * Math.sin(uT * Math.PI * 2) + 0.25 * Math.sin(vT * Math.PI * 2);
      const dirtNoise = fbmTile(u, v, 6, 3, 4451);
      const stain = Math.max(0, 0.52 - dirtNoise) * 1.4;
      const distEdge = Math.min(u, 1 - u, v, 1 - v);
      const stitchBand = distEdge > 0.04 && distEdge < 0.095 ? (Math.sin((u + v) * 90.0 * Math.PI) > 0.35 ? 1 : 0) : 0;
      const seamRidge = Math.exp(-Math.pow((distEdge - 0.068) / 0.018, 2));
      const r = 182 + (weave - 0.5) * 38 + (dirtNoise - 0.5) * 28 - stain * 42 + seamRidge * 18 - stitchBand * 52;
      const g = 160 + (weave - 0.5) * 32 + (dirtNoise - 0.5) * 22 - stain * 46 + seamRidge * 16 - stitchBand * 44;
      const b = 124 + (weave - 0.5) * 26 + (dirtNoise - 0.5) * 18 - stain * 42 + seamRidge * 12 - stitchBand * 34;
      const idx = (y * N + x) * 4;
      albedo[idx] = Math.max(40, Math.min(228, r)) | 0;
      albedo[idx + 1] = Math.max(34, Math.min(206, g)) | 0;
      albedo[idx + 2] = Math.max(24, Math.min(168, b)) | 0;
      albedo[idx + 3] = 255;
      const hVal = Math.max(0, Math.min(255, 128 + (weave - 0.5) * 110 + seamRidge * 55 - stitchBand * 45 + (dirtNoise - 0.5) * 28)) | 0;
      bump[idx] = bump[idx + 1] = bump[idx + 2] = hVal;
      bump[idx + 3] = 255;
    }
  }
  return { map: makeDataTex(THREE, albedo, N, N, true, true, [2, 2]), bumpMap: makeDataTex(THREE, bump, N, N, false, true, [2, 2]) };
}

export function makeStaveWoodTextures(THREE) {
  const N = 512, staves = 14;
  const albedo = new Uint8Array(N * N * 4);
  const bump = new Uint8Array(N * N * 4);
  for (let y = 0; y < N; y++) {
    const v = y / N;
    const botMud = Math.pow(Math.max(0, 1.0 - v / 0.22), 1.4);
    for (let x = 0; x < N; x++) {
      const u = x / N, sx = u * staves, sIdx = Math.floor(sx), fu = sx - sIdx;
      const seam = Math.min(fu, 1.0 - fu);
      const gap = seam < 0.055 ? (1.0 - seam / 0.055) : 0.0;
      const chamfer = seam < 0.14 ? (1.0 - seam / 0.14) : 0.0;
      const tone = h2(sIdx, 19, 6101) - 0.5;
      const woodGrain = fbmTile(u * 4.0, v * 0.4, 14, 3, 6203);
      const ringWave = Math.sin((fu * 8.0 + woodGrain * 3.2) * Math.PI) * 0.5 + 0.5;
      let r = 148 + tone * 42 + (woodGrain - 0.5) * 32 + (ringWave - 0.5) * 16 - gap * 95 - chamfer * 22;
      let g = 98 + tone * 30 + (woodGrain - 0.5) * 24 + (ringWave - 0.5) * 12 - gap * 72 - chamfer * 16;
      let b = 60 + tone * 18 + (woodGrain - 0.5) * 16 + (ringWave - 0.5) * 8 - gap * 52 - chamfer * 12;
      r = r * (1 - botMud * 0.65) + 112 * (botMud * 0.65);
      g = g * (1 - botMud * 0.65) + 64 * (botMud * 0.65);
      b = b * (1 - botMud * 0.65) + 38 * (botMud * 0.65);
      const idx = (y * N + x) * 4;
      albedo[idx] = Math.max(20, Math.min(212, r)) | 0;
      albedo[idx + 1] = Math.max(15, Math.min(168, g)) | 0;
      albedo[idx + 2] = Math.max(12, Math.min(126, b)) | 0;
      albedo[idx + 3] = 255;
      const hVal = Math.max(0, Math.min(255, 142 + (woodGrain - 0.5) * 62 + (ringWave - 0.5) * 28 - gap * 160 - chamfer * 44)) | 0;
      bump[idx] = bump[idx + 1] = bump[idx + 2] = hVal;
      bump[idx + 3] = 255;
    }
  }
  return { map: makeDataTex(THREE, albedo, N, N, true), bumpMap: makeDataTex(THREE, bump, N, N, false) };
}

export function makeCanvasDuckTextures(THREE) {
  const N = 512;
  const albedo = new Uint8Array(N * N * 4);
  const bump = new Uint8Array(N * N * 4);
  for (let y = 0; y < N; y++) {
    const v = y / N;
    const mudFactor = Math.pow(Math.max(0, 1.0 - v / 0.30), 1.45);
    const sunTop = Math.max(0, (v - 0.65) / 0.35);
    for (let x = 0; x < N; x++) {
      const u = x / N;
      const weave = 0.5 + 0.25 * Math.sin(u * 140 * Math.PI) + 0.25 * Math.sin(v * 140 * Math.PI);
      const stain = fbmTile(u, v, 6, 3, 5101);
      const crease = fbmTile(u * 2.0 + v * 0.6, v * 2.0, 5, 3, 5209);
      let seam = 0, stitch = 0;
      for (const sx of [0.25, 0.50, 0.75]) {
        const d = Math.abs(u - sx);
        if (d < 0.016) seam = Math.max(seam, 1.0 - d / 0.016);
        if (Math.abs(d - 0.008) < 0.003 && Math.sin(v * 95 * Math.PI) > 0.2) stitch = 1;
      }
      const mudMix = Math.min(1, mudFactor * (0.72 + 0.45 * stain));
      let r = 166 + (weave - 0.5) * 18 + (stain - 0.5) * 26 + (crease - 0.5) * 16 + sunTop * 16 - seam * 24 - stitch * 32;
      let g = 148 + (weave - 0.5) * 16 + (stain - 0.5) * 22 + (crease - 0.5) * 14 + sunTop * 14 - seam * 22 - stitch * 28;
      let b = 104 + (weave - 0.5) * 12 + (stain - 0.5) * 16 + (crease - 0.5) * 10 + sunTop * 12 - seam * 18 - stitch * 22;
      r = r * (1 - mudMix) + 128 * mudMix;
      g = g * (1 - mudMix) + 76 * mudMix;
      b = b * (1 - mudMix) + 46 * mudMix;
      const idx = (y * N + x) * 4;
      albedo[idx] = Math.max(32, Math.min(225, r)) | 0;
      albedo[idx + 1] = Math.max(26, Math.min(204, g)) | 0;
      albedo[idx + 2] = Math.max(20, Math.min(165, b)) | 0;
      albedo[idx + 3] = 255;
      const hVal = Math.max(0, Math.min(255, 128 + (weave - 0.5) * 48 + (crease - 0.5) * 44 + seam * 64 - stitch * 48)) | 0;
      bump[idx] = bump[idx + 1] = bump[idx + 2] = hVal;
      bump[idx + 3] = 255;
    }
  }
  return { map: makeDataTex(THREE, albedo, N, N, true), bumpMap: makeDataTex(THREE, bump, N, N, false) };
}

export function makeRoadMaskTextures(THREE, repeatY = 4.0) {
  const W = 256, H = 512;
  const bump = new Uint8Array(W * H * 4);
  const alpha = new Uint8Array(W * H * 4);
  const rough = new Uint8Array(W * H * 4);
  for (let y = 0; y < H; y++) {
    const v = y / H;
    const edgeWobL = (fbmTile(0.1, v, 8, 3, 211) - 0.5) * 0.13;
    const edgeWobR = (fbmTile(0.9, v, 8, 3, 307) - 0.5) * 0.13;
    for (let x = 0; x < W; x++) {
      const u = x / W;
      const nMacro = fbmTile(u, v * 2.0, 5, 3, 7731);
      const nFine = fbmTile(u, v * 2.0, 32, 3, 8819);
      const nMicro = fbmTile(u, v * 2.0, 88, 2, 9341);
      const uc = u - 0.5;
      const rut = Math.min(1, Math.exp(-Math.pow((uc + 0.21) / 0.068, 2)) + Math.exp(-Math.pow((uc - 0.21) / 0.068, 2)));
      const peb = nFine > 0.68 ? (nFine - 0.68) / 0.32 : 0.0;
      const edgeL = Math.max(0, Math.min(1, (u - (0.06 + edgeWobL)) / 0.22));
      const edgeR = Math.max(0, Math.min(1, ((0.94 + edgeWobR) - u) / 0.22));
      const edgeMask = Math.min(edgeL, edgeR);
      const edgeSm = edgeMask * edgeMask * (3 - 2 * edgeMask);
      const erosion = Math.max(0, Math.min(1, edgeSm + (nFine - 0.5) * 0.34 * (1 - edgeSm)));
      const idx = (y * W + x) * 4;
      const hVal = Math.max(0, Math.min(255, 134 - rut * 22 + (nFine - 0.5) * 96 + (nMicro - 0.5) * 76 + peb * 92)) | 0;
      bump[idx] = bump[idx + 1] = bump[idx + 2] = hVal;
      bump[idx + 3] = 255;
      const aVal = Math.max(0, Math.min(255, erosion * 255)) | 0;
      alpha[idx] = alpha[idx + 1] = alpha[idx + 2] = aVal;
      alpha[idx + 3] = 255;
      const rVal = Math.max(202, Math.min(254, 240 - rut * 12 + (nMacro - 0.5) * 14)) | 0;
      rough[idx] = rough[idx + 1] = rough[idx + 2] = rVal;
      rough[idx + 3] = 255;
    }
  }
  return {
    bumpMap: makeDataTex(THREE, bump, W, H, false, false, [1, repeatY]),
    alphaMap: makeDataTex(THREE, alpha, W, H, false, false, [1, repeatY]),
    roughnessMap: makeDataTex(THREE, rough, W, H, false, false, [1, repeatY])
  };
}

/**
 * Shared authored rutted dirt road strip following custom centerX(py) and gY(px, py).
 * Reuses `/assets/textures/emu_outback_dirt_road_v1.png` with deep physical tire ruts & feathered shoulders.
 */
export async function buildRuttedRoadStrip(THREE, ctx, gY, opts = {}) {
  const y0 = opts.y0 ?? -8.0;
  const y1 = opts.y1 ?? 28.0;
  const halfW = opts.halfW ?? 1.45;
  const centerX = opts.centerX || (() => 0.0);
  const steps = opts.steps ?? 96;
  const cols = opts.cols ?? 19;
  const repeatY = opts.repeatY ?? Math.max(2.5, (y1 - y0) / 5.2);

  const roadTex = makeRoadMaskTextures(THREE, repeatY);
  const authoredMap = await new THREE.TextureLoader().loadAsync('/assets/textures/emu_outback_dirt_road_v1.png');
  authoredMap.colorSpace = THREE.SRGBColorSpace;
  authoredMap.wrapS = THREE.ClampToEdgeWrapping;
  authoredMap.wrapT = THREE.RepeatWrapping;
  authoredMap.repeat.set(1, repeatY);
  authoredMap.anisotropy = 8;
  authoredMap.needsUpdate = true;

  const V = (x, y, z) => ctx.B2T([x, y, z]);
  const verts = [], uvs = [], idx = [];
  for (let i = 0; i <= steps; i++) {
    const py = y0 + (i / steps) * (y1 - y0);
    const cx = centerX(py);
    const dx = centerX(py + 0.2) - centerX(py - 0.2), dy = 0.4, len = Math.hypot(dx, dy) || 1;
    const nx = dy / len, ny = -dx / len;
    const edgeWob = Math.sin(py * 1.6 + 0.3) * 0.08 + Math.cos(py * 3.7) * 0.04;
    for (let j = 0; j < cols; j++) {
      const u = -1.04 + (j / (cols - 1)) * 2.08;
      const off = u * halfW + (j <= 1 ? edgeWob : (j >= cols - 2 ? -edgeWob * 0.9 : 0));
      const px = cx + nx * off;
      const rPy = py + ny * off;
      const rutL = Math.exp(-Math.pow((u + 0.44) / 0.14, 2));
      const rutR = Math.exp(-Math.pow((u - 0.44) / 0.14, 2));
      const crown = Math.exp(-Math.pow(u / 0.28, 2));
      const rutDip = crown * 0.012 - (rutL + rutR) * 0.018;
      const p = V(px, rPy, gY(px, rPy) + 0.020 + rutDip);
      verts.push(p.x, p.y, p.z);
      uvs.push(j / (cols - 1), i / steps);
    }
    if (i > 0) {
      for (let j = 0; j < cols - 1; j++) {
        const a = (i - 1) * cols + j, b = a + 1, c = a + cols, d = c + 1;
        idx.push(a, b, d, a, d, c);
      }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    map: authoredMap,
    bumpMap: roadTex.bumpMap,
    bumpScale: opts.bumpScale ?? 0.11,
    alphaMap: roadTex.alphaMap,
    roughnessMap: roadTex.roughnessMap,
    color: opts.tint || '#ead6c2',
    roughness: 1.0,
    metalness: 0.0,
    transparent: true,
    opacity: 1.0,
    alphaTest: 0.02,
    depthWrite: true
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = opts.name || 'outback_rutted_road';
  mesh.receiveShadow = false;
  return mesh;
}

/**
 * Configures crisp per-pixel procedural clouds via look3d.mjs `stormDome` (zero blurry 128px puff sprites).
 */
export function applyCrispSkyClouds(sky, mode = 'day', custom = {}) {
  if (!sky?.clouds) return;
  if (mode === 'dusk') {
    sky.clouds({
      kind: 'dusk-storm',
      seed: 1932,
      sunDir: custom.sunDir || [0.32, 0.40, 0.68],
      colors: {
        top: '#182542',
        mid: '#3a4e73',
        hor: '#d99866',
        sun: '#ffbc76',
        glow: 0.56,
        storm: {
          core: '#19253f',
          body: '#435779',
          slit: '#e4a472',
          srim: '#ffe1b0',
          under: '#8e573e',
          scud: '#1e2c4b',
          rain: '#63738c',
          flash: '#e5edff',
          wallTop: 0.28,
          foot: 0.02,
          deck: 0.56,
          scudCov: 0.34,
          rainAmt: 0.08,
          underAmt: 0.72,
          rimAmt: 0.96,
          contrast: 0.80
        },
        ...(custom.colors || {})
      }
    });
    return;
  }
  sky.clouds({
    kind: 'clear-day',
    seed: 1932,
    sunDir: custom.sunDir || [-0.55, 0.58, 0.44],
    colors: {
      top: '#2b6cb8',
      mid: '#64a1df',
      hor: '#dceaf5',
      sun: '#fff0cc',
      glow: 0.42,
      lit: '#ffffff',
      shade: '#b6c9e0',
      rim: '#ffffff',
      // Activate per-pixel `stormDome` shader in `clear-day` with crisp daylight cumulus values & zero rain/scud
      storm: {
        core: '#cddcf0',
        body: '#f7faff',
        slit: '#ffffff',
        srim: '#ffffff',
        under: '#b8cbe2',
        scud: '#dfe9f7',
        rain: '#dceaf5',
        flash: '#ffffff',
        wallTop: 0.25,
        foot: 0.04,
        deck: 0.46,
        scudCov: 0.0,
        rainAmt: 0.0,
        underAmt: 0.18,
        rimAmt: 0.88,
        contrast: 0.28
      },
      ...(custom.colors || {})
    }
  });
}

export function createRichPropWrappers(THREE, raw) {
  const fenceMats = makeFenceWoodTextures(THREE);
  const burlapMats = makeBurlapTextures(THREE);
  const fenceTints = ['#ceb088', '#bea079', '#d6b992'];
  const burlapPalette = ['#cbb692', '#b9a37e', '#c2ad88', '#a8926d'];
  const crateTints = ['#fff1de', '#ebd3b3', '#dfbfa0', '#f4dec0'];
  let fIdx = 0, sIdx = 0, cIdx = 0;

  const spawnFence = raw.fence ? (planPos, opts = {}) => {
    const obj = raw.fence(planPos, opts);
    const tone = fenceTints[fIdx++ % fenceTints.length];
    obj.traverse(n => {
      if (!n.isMesh || !n.material || /_ao_shadow|_outline/.test(n.name || '')) return;
      const gClone = n.geometry.clone();
      const pos = gClone.attributes.position, norm = gClone.attributes.normal;
      gClone.computeBoundingBox();
      const bb = gClone.boundingBox, minY = bb ? bb.min.y : 0;
      const sx = bb ? Math.max(1e-4, bb.max.x - bb.min.x) : 1.0;
      const sy = bb ? Math.max(1e-4, bb.max.y - bb.min.y) : 1.0;
      const sz = bb ? Math.max(1e-4, bb.max.z - bb.min.z) : 1.0;
      const uvs = new Float32Array(pos.count * 2), cols = new Float32Array(pos.count * 3);
      for (let i = 0; i < pos.count; i++) {
        const ux = pos.getX(i) / sx, uy = (pos.getY(i) - minY) / sy, uz = pos.getZ(i) / sz;
        const nx = norm ? Math.abs(norm.getX(i)) : 0, ny = norm ? Math.abs(norm.getY(i)) : 0;
        const isEnd = nx > 0.65 || (norm && norm.getY(i) > 0.70);
        if (ny > 0.70) { uvs[i * 2] = ux * 2.4; uvs[i * 2 + 1] = uz * 1.4; }
        else if (nx > 0.65) { uvs[i * 2] = uz * 1.4; uvs[i * 2 + 1] = uy * 1.6; }
        else { uvs[i * 2] = (ux + uz) * 2.2; uvs[i * 2 + 1] = uy * 1.8; }
        const hG = Math.max(0, Math.min(1, uy / 0.22)), dk = hG * hG * (3 - 2 * hG);
        const es = isEnd ? 0.58 : 1.0, rv = 0.90 + 0.16 * Math.sin(ux * 9.0 + uy * 11.0);
        cols[i * 3] = Math.min(1, (0.48 + 0.52 * dk) * es * rv);
        cols[i * 3 + 1] = Math.min(1, (0.29 + 0.71 * dk) * es * rv);
        cols[i * 3 + 2] = Math.min(1, (0.18 + 0.82 * dk) * es * rv);
      }
      gClone.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
      gClone.setAttribute('color', new THREE.BufferAttribute(cols, 3));
      n.geometry = gClone;
      n.material = new THREE.MeshStandardMaterial({
        map: fenceMats.map, bumpMap: fenceMats.bumpMap, bumpScale: 0.036,
        color: tone, vertexColors: true, roughness: 0.89, metalness: 0.0
      });
      n.castShadow = n.receiveShadow = true;
    });
    for (const px of [-0.90, 0.90]) {
      const pAO = makeContactAO(THREE, 0.44, 0.44, 0.80);
      pAO.position.set(px, 0.012, 0);
      obj.add(pAO);
    }
    return obj;
  } : null;

  const spawnSandbag = raw.sandbag ? (planPos, opts = {}) => {
    const idx = sIdx++;
    const obj = raw.sandbag(planPos, opts);
    obj.rotation.x += ((idx % 3) - 1) * 0.032;
    obj.rotation.z += (((idx * 5) % 3) - 1) * 0.032;
    const tone = burlapPalette[idx % burlapPalette.length];
    obj.traverse(n => {
      if (!n.isMesh || !n.material || /_ao_shadow|_outline/.test(n.name || '')) return;
      const gClone = n.geometry.clone();
      applyBaseDirtGradient(THREE, gClone, 0.30, '#78462a', '#ffffff');
      n.geometry = gClone;
      n.material = new THREE.MeshStandardMaterial({
        map: burlapMats.map, bumpMap: burlapMats.bumpMap, bumpScale: 0.032,
        color: tone, vertexColors: true, roughness: 0.96, metalness: 0.0
      });
      n.castShadow = n.receiveShadow = true;
    });
    if (opts.shadow !== false) obj.add(makeContactAO(THREE, 0.90, 0.76, 0.74));
    return obj;
  } : null;

  const spawnCrate = raw.crate ? (planPos, opts = {}) => {
    const obj = raw.crate(planPos, opts);
    const tint = new THREE.Color(crateTints[cIdx++ % crateTints.length]);
    obj.traverse(n => {
      if (!n.isMesh || !n.material || /_ao_shadow|_outline/.test(n.name || '')) return;
      for (const m of Array.isArray(n.material) ? n.material : [n.material]) {
        if (!m || m.transparent) continue;
        if (m.color) m.color.copy(tint);
        if ('roughness' in m) m.roughness = 0.66;
        if ('metalness' in m) m.metalness = 0.14;
        m.needsUpdate = true;
      }
    });
    if (opts.shadow !== false) obj.add(makeContactAO(THREE, 0.78, 0.48, 0.76));
    return obj;
  } : null;

  return { spawnFence, spawnSandbag, spawnCrate, fenceMats, burlapMats };
}

export function buildCooperedBarrel(THREE, ctx, gY, root, name, bx, by, yaw = 0, scale = 1) {
  if (!buildCooperedBarrel._stave) buildCooperedBarrel._stave = makeStaveWoodTextures(THREE);
  const staveTex = buildCooperedBarrel._stave;
  const timberMat = new THREE.MeshStandardMaterial({ color: '#6b462a', roughness: 0.88, metalness: 0 });
  const ironMat = new THREE.MeshStandardMaterial({ color: '#2b3238', roughness: 0.36, metalness: 0.64 });
  const bMat = new THREE.MeshStandardMaterial({
    map: staveTex.map, bumpMap: staveTex.bumpMap, bumpScale: 0.030,
    color: '#cfb08c', roughness: 0.80, metalness: 0.0
  });
  const barrel = new THREE.Group();
  barrel.name = name;
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.27, 0.64, 16, 2), bMat);
  body.position.y = 0.32; body.castShadow = body.receiveShadow = true; barrel.add(body);
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.228, 0.228, 0.024, 14), bMat);
  lid.position.y = 0.630; lid.castShadow = lid.receiveShadow = true; barrel.add(lid);
  const chime = new THREE.Mesh(new THREE.TorusGeometry(0.232, 0.015, 6, 16), timberMat);
  chime.rotation.x = Math.PI / 2; chime.position.y = 0.642; barrel.add(chime);
  for (const h of [0.11, 0.31, 0.52]) {
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.258, 0.020, 6, 16), ironMat);
    band.rotation.x = Math.PI / 2; band.position.y = h; barrel.add(band);
  }
  barrel.add(makeContactAO(THREE, 0.82, 0.82, 0.80));
  barrel.position.copy(ctx.B2T([bx, by, gY(bx, by)]));
  barrel.rotation.y = yaw;
  barrel.scale.setScalar(scale);
  root.add(barrel);
  return barrel;
}

export function buildOutbackTent(THREE, ctx, gY, root, name, planX, planY, yaw = 0, scale = 1) {
  if (!buildOutbackTent._canvas) buildOutbackTent._canvas = makeCanvasDuckTextures(THREE);
  const canvasTex = buildOutbackTent._canvas;
  const canvasMat = new THREE.MeshStandardMaterial({
    map: canvasTex.map, bumpMap: canvasTex.bumpMap, bumpScale: 0.030,
    color: '#dcd0b4', roughness: 0.93, metalness: 0, side: THREE.DoubleSide
  });
  const darkCanvasMat = new THREE.MeshStandardMaterial({ color: '#1b1610', roughness: 0.97, metalness: 0, side: THREE.DoubleSide });
  const timberMat = new THREE.MeshStandardMaterial({ color: '#6b462a', roughness: 0.88, metalness: 0 });
  const ropeMat = new THREE.MeshStandardMaterial({ color: '#c4ab76', roughness: 0.90, metalness: 0 });

  const g = new THREE.Group(); g.name = name;
  const w = 2.65, d = 3.7, h = 1.88, eaveH = 0.56;
  const panel = (pA0, pA1, pB0, pB1, segU, segV, sagAmp) => {
    const pos = [], uvs = [], idx = [], pA = new THREE.Vector3(), pB = new THREE.Vector3(), p = new THREE.Vector3();
    for (let iv = 0; iv <= segV; iv++) {
      const v = iv / segV;
      for (let iu = 0; iu <= segU; iu++) {
        const u = iu / segU;
        pA.lerpVectors(pA0, pA1, u); pB.lerpVectors(pB0, pB1, u); p.lerpVectors(pA, pB, v);
        p.y -= Math.sin(u * Math.PI) * Math.sin(v * Math.PI) * sagAmp;
        pos.push(p.x, p.y, p.z); uvs.push(u, v);
      }
    }
    const stride = segU + 1;
    for (let iv = 0; iv < segV; iv++) for (let iu = 0; iu < segU; iu++) {
      const a = iv * stride + iu, b = a + 1, c = a + stride, dIdx = c + 1;
      idx.push(a, b, dIdx, a, dIdx, c);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(idx); geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, canvasMat); m.castShadow = m.receiveShadow = true; return m;
  };
  g.add(panel(new THREE.Vector3(-w / 2, 0, -d / 2), new THREE.Vector3(-w / 2, 0, d / 2), new THREE.Vector3(-w / 2, eaveH, -d / 2), new THREE.Vector3(-w / 2, eaveH, d / 2), 8, 3, 0.0));
  g.add(panel(new THREE.Vector3(w / 2, 0, d / 2), new THREE.Vector3(w / 2, 0, -d / 2), new THREE.Vector3(w / 2, eaveH, d / 2), new THREE.Vector3(w / 2, eaveH, -d / 2), 8, 3, 0.0));
  g.add(panel(new THREE.Vector3(-w / 2, eaveH, -d / 2), new THREE.Vector3(-w / 2, eaveH, d / 2), new THREE.Vector3(0, h, -d / 2), new THREE.Vector3(0, h, d / 2), 10, 6, 0.042));
  g.add(panel(new THREE.Vector3(w / 2, eaveH, d / 2), new THREE.Vector3(w / 2, eaveH, -d / 2), new THREE.Vector3(0, h, d / 2), new THREE.Vector3(0, h, -d / 2), 10, 6, 0.042));

  const bgGeo = new THREE.BufferGeometry();
  bgGeo.setAttribute('position', new THREE.Float32BufferAttribute([-w / 2, 0, d / 2, w / 2, 0, d / 2, w / 2, eaveH, d / 2, -w / 2, eaveH, d / 2, 0, h, d / 2], 3));
  bgGeo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 0.3, 0, 0.3, 0.5, 1], 2));
  bgGeo.setIndex([0, 1, 2, 0, 2, 3, 3, 2, 4]); bgGeo.computeVertexNormals();
  const bgMesh = new THREE.Mesh(bgGeo, canvasMat); bgMesh.castShadow = bgMesh.receiveShadow = true; g.add(bgMesh);

  const inGeo = new THREE.BufferGeometry();
  inGeo.setAttribute('position', new THREE.Float32BufferAttribute([-w * 0.44, 0, d * 0.14, w * 0.44, 0, d * 0.14, w * 0.44, eaveH * 0.9, d * 0.14, -w * 0.44, eaveH * 0.9, d * 0.14, 0, h * 0.9, d * 0.14], 3));
  inGeo.setIndex([0, 1, 2, 0, 2, 3, 3, 2, 4]); inGeo.computeVertexNormals();
  g.add(new THREE.Mesh(inGeo, darkCanvasMat));

  const ridge = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, d + 0.36, 8), timberMat);
  ridge.rotation.x = Math.PI / 2; ridge.position.set(0, h - 0.02, 0); ridge.castShadow = true; g.add(ridge);
  const frontPole = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.052, h + 0.08, 8), timberMat);
  frontPole.position.set(0, (h + 0.08) / 2, -d / 2 - 0.08); frontPole.castShadow = true; g.add(frontPole);

  for (const s of [-1, 1]) {
    for (const rz of [-d * 0.42, 0, d * 0.42]) {
      const a = new THREE.Vector3(s * (w / 2), eaveH, rz), b = new THREE.Vector3(s * (w / 2 + 0.58), 0.06, rz);
      const rope = new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(a, b), 2, 0.012, 5), ropeMat);
      g.add(rope);
      const stake = new THREE.Mesh(new THREE.CylinderGeometry(0.020, 0.014, 0.24, 6), timberMat);
      stake.position.set(b.x, 0.09, b.z); stake.rotation.z = s * 0.32; g.add(stake);
    }
  }
  g.add(makeContactAO(THREE, w + 0.72, d + 0.55, 0.76));
  g.position.copy(ctx.B2T([planX, planY, gY(planX, planY)]));
  g.rotation.y = yaw;
  g.scale.setScalar(scale);
  root.add(g);
  return g;
}

export function scatterEucalyptusBelt(spawnTree, gY, parent, specs, namePrefix = 'euc_tree') {
  specs.forEach(([tx, ty, sc, yaw], idx) => {
    const t = spawnTree([tx, ty, gY(tx, ty)], {
      parent,
      scale: sc,
      yaw: yaw ?? (tx * 0.73 + idx * 0.9),
      solid: true,
      name: `${namePrefix}_${idx}`
    });
    // Subtle natural canopy height/breadth variance across identical GLB clones
    t.scale.set(sc * (0.94 + (idx % 3) * 0.06), sc * (0.92 + ((idx + 1) % 4) * 0.07), sc * (0.96 + (idx % 2) * 0.08));
  });
}

export { buildOutbackHorizon };
