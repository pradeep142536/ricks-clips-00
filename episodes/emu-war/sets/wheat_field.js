// SET 1: SUN-BAKED OUTBACK FIELD CAMP & WHEAT PADDOCK (Campion District, Western Australia)
// Layered ground-level composition: foreground crates/sandbags/rocks/barrels/fence wing along
// a rutted dirt track leading directly into a detailed Australian Emu War military field camp
// (seamed canvas tents + guy ropes + stakes, map/radio table, brass hurricane lantern, signal mast,
// right-flank military flatbed truck) backed by eucalyptus gum trees, wheat paddock, and outback mesas.

import { buildHeroTruck } from './hero_truck.js';
import { buildEmuFlock, buildEmu } from './emu_flock.js';
import { makePropSpawner } from './procedural_props.mjs';
import { buildOutbackTerrain, buildOutbackGroundDetail, buildOutbackHorizon, outbackHeight, campRoadCenterX, h2, fbmTile } from './terrain_outback.mjs';

function makeRoadTextures(THREE) {
  // Seamless 512x1024 worn compacted Australian dirt track with irregular edges,
  // smooth tire-tread ripples, dusty silt rims, dark ruts, and fine gravel (zero square fillRect pixels!)
  const W = 512, H = 1024;
  const albedo = new Uint8Array(W * H * 4);
  const bump = new Uint8Array(W * H * 4);
  const alpha = new Uint8Array(W * H * 4);
  const rough = new Uint8Array(W * H * 4);

  for (let y = 0; y < H; y++) {
    const v = y / H;
    const wobbleC = (fbmTile(0.2, v, 4, 2, 101) - 0.5) * 0.045;
    const edgeWobL = (fbmTile(0.1, v, 8, 3, 211) - 0.5) * 0.13;
    const edgeWobR = (fbmTile(0.9, v, 8, 3, 307) - 0.5) * 0.13;

    for (let x = 0; x < W; x++) {
      const u = x / W;
      const nMacro = fbmTile(u, v * 2.0, 5, 3, 7731);
      const nFine = fbmTile(u, v * 2.0, 32, 3, 8819);
      const nMicro = fbmTile(u, v * 2.0, 88, 2, 9341);
      const grit = h2(x, y, 9127);

      const uc = u - 0.5 + wobbleC;
      // Twin tire ruts around uc = +/-0.21 with compact dark bottoms & dusty berm ridges beside them
      const rutDL = Math.exp(-Math.pow((uc + 0.21) / 0.068, 2));
      const rutDR = Math.exp(-Math.pow((uc - 0.21) / 0.068, 2));
      const rut = Math.min(1, rutDL + rutDR);

      const bermL = Math.exp(-Math.pow((uc + 0.305) / 0.042, 2)) + Math.exp(-Math.pow((uc + 0.125) / 0.040, 2));
      const bermR = Math.exp(-Math.pow((uc - 0.305) / 0.042, 2)) + Math.exp(-Math.pow((uc - 0.125) / 0.040, 2));
      const berm = Math.min(1, bermL + bermR);

      // Subtle weathered tire impressions broken by clods & gravel (never uniform ladder stripes!)
      const chevAngle = uc < 0 ? (uc + 0.21) : -(uc - 0.21);
      const tread = 0.5 + 0.5 * Math.sin((v * 74.0 + Math.abs(chevAngle) * 14.0 + nMacro * 2.2) * Math.PI * 2);
      const treadGroove = rut * Math.pow(tread, 1.6) * (0.25 + 0.55 * nFine) * 0.55;

      // Wide irregular eroded dusty shoulder fade across outer 26%
      const edgeL = Math.max(0, Math.min(1, (u - (0.06 + edgeWobL)) / 0.22));
      const edgeR = Math.max(0, Math.min(1, ((0.94 + edgeWobR) - u) / 0.22));
      const edgeMask = Math.min(edgeL, edgeR);
      const edgeSmoother = edgeMask * edgeMask * (3 - 2 * edgeMask);
      const erosionBreak = Math.max(0, Math.min(1, edgeSmoother + (nFine - 0.5) * 0.34 * (1 - edgeSmoother)));

      const dampPatch = Math.max(0, 0.44 - nMacro) * 1.6;
      const peb = nFine > 0.68 ? (nFine - 0.68) / 0.32 : 0.0;

      // Rich high-grit dusty earthen road: compacted terracotta ruts + silty crown + pebble flecks
      let r = 176 + (nMacro - 0.5) * 38 + (nMicro - 0.5) * 26 + berm * 22 - rut * 64 - treadGroove * 22 + peb * 28 - dampPatch * 32 + (grit - 0.5) * 16;
      let g = 112 + (nMacro - 0.5) * 28 + (nMicro - 0.5) * 18 + berm * 20 - rut * 44 - treadGroove * 15 + peb * 20 - dampPatch * 24 + (grit - 0.5) * 12;
      let b = 68  + (nMacro - 0.5) * 20 + (nMicro - 0.5) * 14 + berm * 14 - rut * 28 - treadGroove * 10 + peb * 14 - dampPatch * 15 + (grit - 0.5) * 9;

      const idx = (y * W + x) * 4;
      albedo[idx]     = Math.max(30, Math.min(228, r)) | 0;
      albedo[idx + 1] = Math.max(20, Math.min(186, g)) | 0;
      albedo[idx + 2] = Math.max(14, Math.min(144, b)) | 0;
      albedo[idx + 3] = 255;

      const hVal = Math.max(0, Math.min(255, 134 + berm * 34 - rut * 58 - treadGroove * 26 + (nFine - 0.5) * 85 + (nMicro - 0.5) * 65 + peb * 85)) | 0;
      bump[idx] = bump[idx + 1] = bump[idx + 2] = hVal;
      bump[idx + 3] = 255;

      const aVal = Math.max(0, Math.min(255, erosionBreak * 255)) | 0;
      alpha[idx] = alpha[idx + 1] = alpha[idx + 2] = aVal;
      alpha[idx + 3] = 255;

      // Compacted tire ruts slightly smoother (0.82) than powdery dusty shoulders (0.98)
      const rVal = Math.max(202, Math.min(254, 240 + berm * 12 - rut * 32)) | 0;
      rough[idx] = rough[idx + 1] = rough[idx + 2] = rVal;
      rough[idx + 3] = 255;
    }
  }

  const mkTex = (bytes, srgb, clampX = true) => {
    const tex = new THREE.DataTexture(bytes, W, H, THREE.RGBAFormat);
    tex.wrapS = clampX ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 3.2);
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
    alphaMap: mkTex(alpha, false),
    roughnessMap: mkTex(rough, false)
  };
}

function makeFenceWoodTextures(THREE) {
  // 512x512 weathered split-gumwood plank texture: longitudinal grain, checks, knots, chips, and sun-bleach
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

      // Occasional dark knot oval + small timber chip dent
      const kdx = (u - 0.62) * 5.2, kdy = (v - 0.44) * 14.0;
      const knot = Math.exp(-(kdx * kdx + kdy * kdy));
      const cdx = (u - 0.25) * 9.0, cdy = (v - 0.14) * 12.0;
      const chip = Math.exp(-(cdx * cdx + cdy * cdy)) * (fbmTile(u, v, 16, 2, 3551));

      const sunBleach = fbmTile(u, v, 4, 2, 3609);
      let r = 148 + (fiber - 0.5) * 42 + (grainWave - 0.5) * 26 + (sunBleach - 0.5) * 32 - splitCrack * 68 - knot * 52 - chip * 38;
      let g = 112 + (fiber - 0.5) * 32 + (grainWave - 0.5) * 20 + (sunBleach - 0.5) * 30 - splitCrack * 52 - knot * 42 - chip * 30;
      let b = 78  + (fiber - 0.5) * 22 + (grainWave - 0.5) * 14 + (sunBleach - 0.5) * 26 - splitCrack * 38 - knot * 30 - chip * 22;

      const idx = (y * N + x) * 4;
      albedo[idx]     = Math.max(28, Math.min(218, r)) | 0;
      albedo[idx + 1] = Math.max(22, Math.min(186, g)) | 0;
      albedo[idx + 2] = Math.max(16, Math.min(148, b)) | 0;
      albedo[idx + 3] = 255;

      const hVal = Math.max(0, Math.min(255, 134 + (fiber - 0.5) * 70 + (grainWave - 0.5) * 36 - splitCrack * 135 - knot * 60 - chip * 95)) | 0;
      bump[idx] = bump[idx + 1] = bump[idx + 2] = hVal;
      bump[idx + 3] = 255;
    }
  }
  const mk = (bytes, srgb) => {
    const tex = new THREE.DataTexture(bytes, N, N, THREE.RGBAFormat);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.generateMipmaps = true;
    tex.anisotropy = 8;
    if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  };
  return { map: mk(albedo, true), bumpMap: mk(bump, false) };
}

function makeBurlapTextures(THREE) {
  // 512x512 neutral dusty jute/hessian burlap: irregular fibers, side stitching seam, folded crease highlight
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
      const wX = Math.sin(uT * Math.PI * 2);
      const wY = Math.sin(vT * Math.PI * 2);
      const weave = 0.5 + 0.25 * wX + 0.25 * wY;

      const dirtNoise = fbmTile(u, v, 6, 3, 4451);
      const stain = Math.max(0, 0.52 - dirtNoise) * 1.4;
      // Heavy double-stitched sack seam along edge & gathered neck fold
      const distEdge = Math.min(u, 1 - u, v, 1 - v);
      const stitchBand = distEdge > 0.04 && distEdge < 0.095 ? (Math.sin((u + v) * 90.0 * Math.PI) > 0.35 ? 1 : 0) : 0;
      const seamRidge = Math.exp(-Math.pow((distEdge - 0.068) / 0.018, 2));

      let r = 182 + (weave - 0.5) * 38 + (dirtNoise - 0.5) * 28 - stain * 42 + seamRidge * 18 - stitchBand * 52;
      let g = 160 + (weave - 0.5) * 32 + (dirtNoise - 0.5) * 22 - stain * 46 + seamRidge * 16 - stitchBand * 44;
      let b = 124 + (weave - 0.5) * 26 + (dirtNoise - 0.5) * 18 - stain * 42 + seamRidge * 12 - stitchBand * 34;

      const idx = (y * N + x) * 4;
      albedo[idx]     = Math.max(40, Math.min(228, r)) | 0;
      albedo[idx + 1] = Math.max(34, Math.min(206, g)) | 0;
      albedo[idx + 2] = Math.max(24, Math.min(168, b)) | 0;
      albedo[idx + 3] = 255;

      const hVal = Math.max(0, Math.min(255, 128 + (weave - 0.5) * 110 + seamRidge * 55 - stitchBand * 45 + (dirtNoise - 0.5) * 28)) | 0;
      bump[idx] = bump[idx + 1] = bump[idx + 2] = hVal;
      bump[idx + 3] = 255;
    }
  }
  const mk = (bytes, srgb) => {
    const tex = new THREE.DataTexture(bytes, N, N, THREE.RGBAFormat);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 2);
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.generateMipmaps = true;
    tex.anisotropy = 8;
    if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  };
  return { map: mk(albedo, true), bumpMap: mk(bump, false) };
}

function makeCanvasDuckTextures(THREE) {
  // 512x512 heavy military duck canvas: stitched panel seams, grommets, sun fade, and heavy base dust staining
  const N = 512;
  const albedo = new Uint8Array(N * N * 4);
  const bump = new Uint8Array(N * N * 4);

  for (let y = 0; y < N; y++) {
    const v = y / N; // 0 = ground hem, 1 = ridge peak (set cleanly by tent UVs)
    const mudFactor = Math.pow(Math.max(0, 1.0 - v / 0.30), 1.45);
    const sunTop = Math.max(0, (v - 0.65) / 0.35);
    for (let x = 0; x < N; x++) {
      const u = x / N;
      const weave = 0.5 + 0.25 * Math.sin(u * 140 * Math.PI) + 0.25 * Math.sin(v * 140 * Math.PI);
      const stain = fbmTile(u, v, 6, 3, 5101);
      const crease = fbmTile(u * 2.0 + v * 0.6, v * 2.0, 5, 3, 5209);

      // Three crisp double-stitched vertical canvas panel lap seams
      let seam = 0, stitch = 0;
      for (const sx of [0.25, 0.50, 0.75]) {
        const d = Math.abs(u - sx);
        if (d < 0.016) seam = Math.max(seam, 1.0 - d / 0.016);
        if (Math.abs(d - 0.008) < 0.003 && Math.sin(v * 95 * Math.PI) > 0.2) stitch = 1;
      }

      // Reddish-ochre Outback dust baked into bottom hem skirt
      const mudMix = Math.min(1, mudFactor * (0.72 + 0.45 * stain));
      let r = 166 + (weave - 0.5) * 18 + (stain - 0.5) * 26 + (crease - 0.5) * 16 + sunTop * 16 - seam * 24 - stitch * 32;
      let g = 148 + (weave - 0.5) * 16 + (stain - 0.5) * 22 + (crease - 0.5) * 14 + sunTop * 14 - seam * 22 - stitch * 28;
      let b = 104 + (weave - 0.5) * 12 + (stain - 0.5) * 16 + (crease - 0.5) * 10 + sunTop * 12 - seam * 18 - stitch * 22;

      r = r * (1 - mudMix) + 128 * mudMix;
      g = g * (1 - mudMix) + 76 * mudMix;
      b = b * (1 - mudMix) + 46 * mudMix;

      const idx = (y * N + x) * 4;
      albedo[idx]     = Math.max(32, Math.min(225, r)) | 0;
      albedo[idx + 1] = Math.max(26, Math.min(204, g)) | 0;
      albedo[idx + 2] = Math.max(20, Math.min(165, b)) | 0;
      albedo[idx + 3] = 255;

      const hVal = Math.max(0, Math.min(255, 128 + (weave - 0.5) * 48 + (crease - 0.5) * 44 + seam * 64 - stitch * 48)) | 0;
      bump[idx] = bump[idx + 1] = bump[idx + 2] = hVal;
      bump[idx + 3] = 255;
    }
  }
  const mk = (bytes, srgb) => {
    const tex = new THREE.DataTexture(bytes, N, N, THREE.RGBAFormat);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.generateMipmaps = true;
    tex.anisotropy = 8;
    if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  };
  return { map: mk(albedo, true), bumpMap: mk(bump, false) };
}

function makeStaveWoodTextures(THREE) {
  // 512x512 oak barrel staves: chamfer gaps, stave-by-stave tone variation, hoop rust drips, base mud splash
  const N = 512;
  const albedo = new Uint8Array(N * N * 4);
  const bump = new Uint8Array(N * N * 4);
  const staves = 14;

  for (let y = 0; y < N; y++) {
    const v = y / N; // 0 = bottom ground rim, 1 = top barrel chime
    const botMud = Math.pow(Math.max(0, 1.0 - v / 0.22), 1.4);
    for (let x = 0; x < N; x++) {
      const u = x / N;
      const sx = u * staves;
      const sIdx = Math.floor(sx);
      const fu = sx - sIdx;
      const seam = Math.min(fu, 1.0 - fu);
      const gap = seam < 0.055 ? (1.0 - seam / 0.055) : 0.0;
      const chamfer = seam < 0.14 ? (1.0 - seam / 0.14) : 0.0;

      const tone = h2(sIdx, 19, 6101) - 0.5;
      const woodGrain = fbmTile(u * 4.0, v * 0.4, 14, 3, 6203);
      const ringWave = Math.sin((fu * 8.0 + woodGrain * 3.2) * Math.PI) * 0.5 + 0.5;
      const drip = Math.max(0, fbmTile(u, v * 0.5, 16, 2, 6311) - 0.55) * (v < 0.85 ? 1.5 : 0);

      let r = 148 + tone * 42 + (woodGrain - 0.5) * 32 + (ringWave - 0.5) * 16 - gap * 95 - chamfer * 22 - drip * 58;
      let g = 98  + tone * 30 + (woodGrain - 0.5) * 24 + (ringWave - 0.5) * 12 - gap * 72 - chamfer * 16 - drip * 46;
      let b = 60  + tone * 18 + (woodGrain - 0.5) * 16 + (ringWave - 0.5) * 8  - gap * 52 - chamfer * 12 - drip * 34;

      r = r * (1 - botMud * 0.65) + 112 * (botMud * 0.65);
      g = g * (1 - botMud * 0.65) + 64 * (botMud * 0.65);
      b = b * (1 - botMud * 0.65) + 38 * (botMud * 0.65);

      const idx = (y * N + x) * 4;
      albedo[idx]     = Math.max(20, Math.min(212, r)) | 0;
      albedo[idx + 1] = Math.max(15, Math.min(168, g)) | 0;
      albedo[idx + 2] = Math.max(12, Math.min(126, b)) | 0;
      albedo[idx + 3] = 255;

      const hVal = Math.max(0, Math.min(255, 142 + (woodGrain - 0.5) * 62 + (ringWave - 0.5) * 28 - gap * 160 - chamfer * 44)) | 0;
      bump[idx] = bump[idx + 1] = bump[idx + 2] = hVal;
      bump[idx + 3] = 255;
    }
  }
  const mk = (bytes, srgb) => {
    const tex = new THREE.DataTexture(bytes, N, N, THREE.RGBAFormat);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.generateMipmaps = true;
    tex.anisotropy = 8;
    if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  };
  return { map: mk(albedo, true), bumpMap: mk(bump, false) };
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
  g.strokeStyle = '#6b472d'; g.lineWidth = 2.5;
  g.beginPath(); g.moveTo(22, 160); g.quadraticCurveTo(120, 100, 232, 34); g.stroke();
  g.strokeStyle = '#b43527'; g.lineWidth = 3;
  g.beginPath(); g.arc(165, 68, 22, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.moveTo(74, 132); g.lineTo(140, 82); g.stroke();
  g.strokeStyle = '#2d241b'; g.lineWidth = 2; g.strokeRect(6, 6, 244, 180);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeContactAO(THREE, w = 1.0, d = 1.0, opacity = 0.72) {
  if (!makeContactAO._tex) {
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

function applyBaseDirtGradient(THREE, geo, dirtFrac = 0.28, dirtHex = '#6e3d22', topHex = '#ffffff') {
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
    const h = pos.getY(i) - minY;
    const t = Math.max(0, Math.min(1, h / dirtHeight));
    const s = t * t * (3 - 2 * t);
    cTmp.copy(cBot).lerp(cTop, s);
    cols[i * 3] = cTmp.r;
    cols[i * 3 + 1] = cTmp.g;
    cols[i * 3 + 2] = cTmp.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
}

export async function build(THREE, scene, film, ctx) {
  const { B2T, sky } = ctx;
  const V = (x, y, z) => B2T([x, y, z]);
  const root = new THREE.Group();
  root.name = 'wheat_field';

  if (sky?.clouds) {
    const skyKind = ctx.place?.sky_kind || 'clear-day';
    // The Night camp needs its own palette: the general `night-storm` preset is
    // deliberately theatrical for lightning scenes, but this approval shot is
    // calm moonlight.  Keep this override here so other night/storm sets retain
    // their existing sky treatment.
    const nightCloudPalette = skyKind === 'night-storm' && ctx.place?.light === 'night' ? {
      top: '#07122f',
      mid: '#10275a',
      hor: '#48649a',
      sun: '#789fe8',
      glow: 0.10,
      lit: '#506da8',
      shade: '#0b1736',
      rim: '#7d9fd8',
      storm: {
        core: '#050b20',
        body: '#112552',
        slit: '#4e6da8',
        srim: '#7998ce',
        under: '#1a315f',
        scud: '#07122c',
        rain: '#1d3568',
        flash: '#d9e7ff',
        underAmt: 0.0,
        rimAmt: 0.52,
        contrast: 1.0
      }
    } : null;
    const isNightCamp = skyKind === 'night-storm' && ctx.place?.light === 'night';
    sky.clouds({
      kind: skyKind,
      seed: 1932,
      coverage: isNightCamp ? 0.58 : skyKind === 'clear-day' ? 0.78 : 0.92,
      scale: 1.35,
      sunDir: [-0.62, 0.56, 0.44],
      ...(nightCloudPalette ? { colors: nightCloudPalette } : skyKind === 'clear-day' ? { colors: {
        top: '#2b6cb8',
        mid: '#6ba5df',
        hor: '#dceaf4',
        sun: '#ffe9be',
        lit: '#fffcf4',
        shade: '#a3b8d6',
        rim: '#ffffff'
      } } : {}),
      layers: isNightCamp ? [
        // Keep volume around the horizon but leave the upper third to the deep
        // navy dome; the old all-height cloud stack made calm night read as day.
        { d: 120, fade: 0.12, size: 0.92, n: 4, el: [1, 6] },
        { d: 205, fade: 0.30, size: 0.98, n: 4, el: [4, 11] },
        { d: 300, fade: 0.44, size: 1.08, n: 3, el: [8, 16] }
      ] : [
        { d: 95, fade: 0.06, size: 1.05, n: 7, el: [2, 9] },
        { d: 155, fade: 0.22, size: 1.15, n: 7, el: [5, 17] },
        { d: 245, fade: 0.42, size: 1.25, n: 6, el: [10, 24] },
        { d: 340, fade: 0.35, size: 1.50, n: 5, el: [14, 32], cirrus: true }
      ]
    });
  }

  const isDay = ['daylight_crisp', 'day'].includes(ctx.place?.light);

  // Tighten and sharpen the primary sun directional shadow map during Day so fence rails,
  // tent ropes, rifles, and crates cast razor-sharp hard ground contact shadows.
  if (isDay) {
    for (const ch of scene.children) {
      if (ch.isDirectionalLight && ch.castShadow) {
        ch.shadow.mapSize.set(4096, 4096);
        ch.shadow.radius = 0.85;
        ch.shadow.bias = -0.00038;
        Object.assign(ch.shadow.camera, { left: -13.5, right: 13.5, top: 13.5, bottom: -13.5, near: 1.0, far: 72.0 });
        ch.target.position.set(0, 0, -2.5);
        if (!ch.target.parent) scene.add(ch.target);
        const dirV = new THREE.Vector3(...(ctx.light?.dir || [-11.5, 8.0, 2.8]));
        ch.position.copy(ch.target.position).addScaledVector(dirV, 2.6);
        ch.shadow.camera.updateProjectionMatrix();
        if (ch.shadow.map) { ch.shadow.map.dispose(); ch.shadow.map = null; }
        break;
      }
    }
  }

  // 1. Undulating Outback Soil, Concentrated Edge/Fence/Camp Vegetation & Gravel + Horizon
  root.add(buildOutbackTerrain(THREE, ctx, { mode: 'wheat', centerY: 7.0, sizeX: 76, sizeY: 76, segs: 180 }));
  root.add(buildOutbackGroundDetail(THREE, { mode: 'wheat', centerY: 7.0, width: 28, depth: 34, count: 290 }));
  const dramaticLight = ['sunset', 'storm'].includes(ctx.place?.light);
  const horizon = buildOutbackHorizon(THREE, { centerY: 7.0, sunset: dramaticLight });
  if (ctx.place?.light === 'night') {
    horizon.traverse(o => {
      if (o.isMesh && o.material?.color) o.material.color.set('#304e96');
    });
  }
  root.add(horizon);

  // 2. Cached Certified GLB Asset Spawners (with strong contact darkness under every prop)
  const [spawnWheat, spawnFenceRaw, spawnBush, spawnRockRaw, spawnTree, spawnCrateRaw, spawnRadio, spawnSandbagRaw, spawnMapTable, spawnRifleRaw, spawnDiary, spawnBinocs] = await Promise.all([
    makePropSpawner(ctx, 'wheat_crop', { shadow: false, tint: '#e4c468' }),
    makePropSpawner(ctx, 'wooden_fence', { shadow: false }),
    makePropSpawner(ctx, 'dry_bush', { shadow: true, shadowOpacity: 0.56, tint: '#9a9556' }),
    makePropSpawner(ctx, 'outback_rock', { shadow: true, shadowOpacity: 0.80 }),
    makePropSpawner(ctx, 'eucalyptus_tree', { shadow: true, shadowOpacity: 0.60 }),
    makePropSpawner(ctx, 'ammo_crate', { shadow: false }),
    makePropSpawner(ctx, 'field_radio', { shadow: true, shadowOpacity: 0.35 }),
    makePropSpawner(ctx, 'sandbag', { shadow: false }),
    makePropSpawner(ctx, 'map_table', { shadow: true, shadowOpacity: 0.72, tint: '#e4c59e' }),
    makePropSpawner(ctx, 'rifle', { shadow: false }),
    makePropSpawner(ctx, 'war_diary', { shadow: false }),
    makePropSpawner(ctx, 'binoculars', { shadow: false })
  ]);

  const burlapMats = makeBurlapTextures(THREE);
  const burlapPalette = ['#cbb692', '#b9a37e', '#c2ad88', '#a8926d'];
  let sandbagIdx = 0;
  const spawnSandbag = (planPos, opts = {}) => {
    const sIdx = sandbagIdx++;
    const obj = spawnSandbagRaw(planPos, opts);
    obj.rotation.x += ((sIdx % 3) - 1) * 0.035;
    obj.rotation.z += (((sIdx * 5) % 3) - 1) * 0.035;
    const toneHex = burlapPalette[sIdx % burlapPalette.length];
    obj.traverse(n => {
      if (!n.isMesh || !n.material || /_ao_shadow|_outline/.test(n.name || '')) return;
      const gClone = n.geometry.clone();
      applyBaseDirtGradient(THREE, gClone, 0.30, '#78462a', '#ffffff');
      n.geometry = gClone;
      n.material = new THREE.MeshStandardMaterial({
        map: burlapMats.map,
        bumpMap: burlapMats.bumpMap,
        bumpScale: 0.032,
        color: toneHex,
        vertexColors: true,
        roughness: 0.96,
        metalness: 0.0
      });
      n.castShadow = n.receiveShadow = true;
    });
    if (opts.shadow !== false) {
      obj.add(makeContactAO(THREE, 0.92, 0.78, 0.76));
    }
    return obj;
  };

  const fenceMats = makeFenceWoodTextures(THREE);
  const fenceTints = ['#ceb088', '#bea079', '#d6b992'];
  let fenceIdx = 0;
  const spawnFence = (planPos, opts = {}) => {
    const fIdx = fenceIdx++;
    const obj = spawnFenceRaw(planPos, opts);
    const fTone = fenceTints[fIdx % fenceTints.length];
    obj.traverse(n => {
      if (!n.isMesh || !n.material || /_ao_shadow|_outline/.test(n.name || '')) return;
      // Inject world-aligned normalized box UVs + darkened cut end-grain & base dirt vertex colors
      const gClone = n.geometry.clone();
      const pos = gClone.attributes.position;
      const norm = gClone.attributes.normal;
      gClone.computeBoundingBox();
      const bb = gClone.boundingBox;
      const minY = bb ? bb.min.y : 0;
      const sx = bb ? Math.max(1e-4, bb.max.x - bb.min.x) : 1.0;
      const sy = bb ? Math.max(1e-4, bb.max.y - bb.min.y) : 1.0;
      const sz = bb ? Math.max(1e-4, bb.max.z - bb.min.z) : 1.0;
      const uvs = new Float32Array(pos.count * 2);
      const cols = new Float32Array(pos.count * 3);
      for (let i = 0; i < pos.count; i++) {
        const vx = pos.getX(i), vy = pos.getY(i), vz = pos.getZ(i);
        const ux = vx / sx, uy = (vy - minY) / sy, uz = vz / sz;
        const nx = norm ? Math.abs(norm.getX(i)) : 0;
        const ny = norm ? Math.abs(norm.getY(i)) : 0;
        const isEndCap = nx > 0.65 || (norm && norm.getY(i) > 0.70);
        if (ny > 0.70) {
          uvs[i * 2] = ux * 2.4; uvs[i * 2 + 1] = uz * 1.4;
        } else if (nx > 0.65) {
          uvs[i * 2] = uz * 1.4; uvs[i * 2 + 1] = uy * 1.6;
        } else {
          uvs[i * 2] = (ux + uz) * 2.2; uvs[i * 2 + 1] = uy * 1.8;
        }
        const hGround = Math.max(0, Math.min(1, uy / 0.22));
        const dirtK = hGround * hGround * (3 - 2 * hGround);
        const endShade = isEndCap ? 0.58 : 1.0;
        const railVar = 0.90 + 0.16 * Math.sin(ux * 9.0 + uy * 11.0);
        cols[i * 3]     = Math.min(1, (0.48 + 0.52 * dirtK) * endShade * railVar);
        cols[i * 3 + 1] = Math.min(1, (0.29 + 0.71 * dirtK) * endShade * railVar);
        cols[i * 3 + 2] = Math.min(1, (0.18 + 0.82 * dirtK) * endShade * railVar);
      }
      gClone.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
      gClone.setAttribute('color', new THREE.BufferAttribute(cols, 3));
      n.geometry = gClone;
      n.material = new THREE.MeshStandardMaterial({
        map: fenceMats.map,
        bumpMap: fenceMats.bumpMap,
        bumpScale: 0.036,
        color: fTone,
        vertexColors: true,
        roughness: 0.89,
        metalness: 0.0
      });
      n.castShadow = n.receiveShadow = true;
    });
    // Strong post-ground contact shadows beneath both fence posts
    for (const px of [-0.90, 0.90]) {
      const pAO = makeContactAO(THREE, 0.44, 0.44, 0.80);
      pAO.position.set(px, 0.012, 0);
      obj.add(pAO);
    }
    return obj;
  };

  const crateTints = ['#fff1de', '#ebd3b3', '#dfbfa0', '#f4dec0'];
  let crateIdx = 0;
  const spawnCrate = (planPos, opts = {}) => {
    const cIdx = crateIdx++;
    const obj = spawnCrateRaw(planPos, opts);
    const tint = new THREE.Color(crateTints[cIdx % crateTints.length]);
    obj.traverse(n => {
      if (!n.isMesh || !n.material || /_ao_shadow|_outline/.test(n.name || '')) return;
      for (const m of Array.isArray(n.material) ? n.material : [n.material]) {
        if (!m || m.transparent) continue;
        if (m.color) m.color.copy(tint);
        if ('roughness' in m) m.roughness = 0.64;
        if ('metalness' in m) m.metalness = 0.16;
        if ('envMapIntensity' in m) m.envMapIntensity = 0.48;
        m.needsUpdate = true;
      }
    });
    if (opts.shadow !== false) {
      obj.add(makeContactAO(THREE, 0.78, 0.48, 0.78));
    }
    return obj;
  };

  const spawnRock = (planPos, opts = {}) => {
    const obj = spawnRockRaw(planPos, opts);
    if (opts.shadow !== false) {
      obj.add(makeContactAO(THREE, 1.32, 1.15, 0.82));
    }
    return obj;
  };

  const spawnRifle = (planPos, opts = {}) => {
    const obj = spawnRifleRaw(planPos, opts);
    obj.traverse(n => {
      if (!n.isMesh || !n.material || /_ao_shadow|_outline/.test(n.name || '')) return;
      for (const m of Array.isArray(n.material) ? n.material : [n.material]) {
        if (!m || m.transparent) continue;
        if ('roughness' in m) m.roughness = Math.min(m.roughness ?? 0.7, 0.46);
        if ('metalness' in m && m.metalness > 0.2) m.metalness = 0.72;
        if ('envMapIntensity' in m) m.envMapIntensity = 0.55;
        m.needsUpdate = true;
      }
    });
    return obj;
  };

  const gY = (px, py) => outbackHeight('wheat', px, py);

  // 3. Foreground-to-Camp Sculpted Worn Rutted Dirt Road (irregular organic borders, soft alpha feather)
  const roadTex = makeRoadTextures(THREE);
  const roadSteps = 56;
  const roadCols = 7; // outer-skirt-L, bank-L, rut-L, crown, rut-R, bank-R, outer-skirt-R
  const roadU = [-1.06, -0.76, -0.44, 0.0, 0.44, 0.76, 1.06];
  const roadHalfW = 0.88;
  const roadVerts = [], roadUvs = [], roadIdx = [];
  for (let i = 0; i <= roadSteps; i++) {
    const py = -6.0 + (i / roadSteps) * 15.2;
    const cx = campRoadCenterX(py);
    const prevX = campRoadCenterX(py - 0.2), nextX = campRoadCenterX(py + 0.2);
    const dx = nextX - prevX, dy = 0.4, len = Math.hypot(dx, dy) || 1;
    const nx = dy / len, ny = -dx / len;
    const edgeWob = Math.sin(py * 1.9 + 0.4) * 0.08 + Math.cos(py * 4.3) * 0.04;
    for (let j = 0; j < roadCols; j++) {
      const u = roadU[j];
      const wobbleSign = j <= 1 ? edgeWob : (j >= 5 ? -edgeWob * 0.9 : 0);
      const off = u * roadHalfW + wobbleSign;
      const px = cx + nx * off;
      const rPy = py + ny * off;
      const rutDip = (j === 2 || j === 4) ? 0.015 : (j === 0 || j === 6 ? -0.020 : 0.032);
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
    map: roadTex.map,
    bumpMap: roadTex.bumpMap,
    bumpScale: 0.085,
    alphaMap: roadTex.alphaMap,
    roughnessMap: roadTex.roughnessMap,
    roughness: 1.0,
    metalness: 0.0,
    transparent: true,
    opacity: 1.0,
    alphaTest: 0.02,
    depthWrite: true
  });
  if (ctx.place?.light === 'night') {
    // A moonlit dirt track needs to stay earthen and subordinate to the camp,
    // rather than becoming a broad chalk-grey leading stripe.
    roadMat.color.set('#1d304d');
    roadMat.roughness = 0.94;
  }
  const road = new THREE.Mesh(roadGeo, roadMat);
  road.name = 'campion_dirt_track';
  road.receiveShadow = true;
  root.add(road);

  // 4. Aged Split-Rail Paddock Fences: Left Foreground Wing + Rear Paddock Line (clear road/table view)
  for (const [fx, fy, yaw, nm] of [
    [-1.55, -0.55, -0.24, 'wheat_fence_fg_left'],
    [-8.4, 9.5, 0.06, 'wheat_fence_bg_L3'],
    [-6.1, 9.8, 0.04, 'wheat_fence_bg_L2'],
    [-3.8, 10.1, -0.03, 'wheat_fence_bg_L1'],
    [-1.5, 10.2, 0.05, 'wheat_fence_bg_C'],
    [3.0, 10.1, -0.04, 'wheat_fence_bg_R1'],
    [5.4, 9.9, 0.06, 'wheat_fence_bg_R2']
  ]) {
    spawnFence([fx, fy, gY(fx, fy)], { parent: root, yaw, solid: true, name: nm });
  }
  const smashFence = spawnFence([0.75, 10.2, gY(0.75, 10.2)], {
    parent: root,
    solid: true,
    name: 'wheat_fence_smash'
  });
  const smashFenceBaseZ = gY(0.75, 10.2);

  // 5. LAYER 1 — FOREGROUND PROPS CLEANLY FLANKING BOTH ROAD SHOULDERS (py = -3.85 .. -1.45)
  // Left Foreground: close jagged boulder, hessian sandbags, stacked crates, coopered barrel
  spawnRock([-0.58, -3.75, gY(-0.58, -3.75)], { parent: root, yaw: 0.85, scale: 0.28, solid: true, name: 'fg_rock_left_1' });
  spawnSandbag([-0.62, -3.30, gY(-0.62, -3.30)], { parent: root, yaw: 0.72, scale: 0.78, solid: true, name: 'fg_sandbag_left_0' });
  spawnCrate([-0.82, -2.55, gY(-0.82, -2.55)], { parent: root, solid: true, yaw: 0.34, scale: 1.0, name: 'fg_ammo_crate_1' });
  spawnCrate([-0.80, -2.53, gY(-0.82, -2.55) + 0.215], { parent: root, solid: true, yaw: -0.14, scale: 0.90, shadow: false, name: 'fg_ammo_crate_2' });
  spawnBush([-1.25, -1.75, gY(-1.25, -1.75)], { parent: root, yaw: 1.15, scale: 0.72, name: 'fg_bush_left_1' });

  // Right Foreground: close layered rock, burlap sandbag emplacement, stacked crate + rifle resting neatly on crate
  spawnRock([0.48, -3.72, gY(0.48, -3.72)], { parent: root, yaw: 2.1, scale: 0.27, solid: true, name: 'fg_rock_right_1' });
  spawnSandbag([0.64, -3.15, gY(0.64, -3.15)], { parent: root, yaw: -0.68, scale: 0.80, solid: true, name: 'fg_sandbag_right_1' });
  spawnSandbag([0.82, -2.62, gY(0.82, -2.62)], { parent: root, yaw: -0.35, scale: 0.86, solid: true, name: 'fg_sandbag_right_2' });
  spawnCrate([0.82, -2.20, gY(0.82, -2.20)], { parent: root, solid: true, yaw: -0.36, scale: 0.96, name: 'fg_ammo_crate_right_1' });
  spawnRifle([0.82, -2.20, gY(0.82, -2.20) + 0.215], { parent: root, yaw: 0.85, scale: 0.88, name: 'fg_rifle_leaning' });
  spawnBush([1.35, -1.55, gY(1.35, -1.55)], { parent: root, yaw: 2.4, scale: 0.68, name: 'fg_bush_right_1' });

  // Shared high-craft materials for tents, coopered barrels, brass lanterns, and ropes
  const canvasTex = makeCanvasDuckTextures(THREE);
  const canvasMat = new THREE.MeshStandardMaterial({
    map: canvasTex.map,
    bumpMap: canvasTex.bumpMap,
    bumpScale: 0.032,
    color: '#dcd0b4',
    roughness: 0.93,
    metalness: 0,
    side: THREE.DoubleSide
  });
  const darkCanvasMat = new THREE.MeshStandardMaterial({ color: '#1b1610', roughness: 0.97, metalness: 0, side: THREE.DoubleSide });
  const timberMat = new THREE.MeshStandardMaterial({ color: '#6b462a', roughness: 0.88, metalness: 0 });
  const ropeMat = new THREE.MeshStandardMaterial({ color: '#c4ab76', roughness: 0.90, metalness: 0 });
  const ironMat = new THREE.MeshStandardMaterial({ color: '#2b3238', roughness: 0.34, metalness: 0.68 });
  const brassMat = new THREE.MeshStandardMaterial({ color: '#c9a148', roughness: 0.30, metalness: 0.72 });
  const staveTex = makeStaveWoodTextures(THREE);
  const barrelTints = ['#d8b996', '#c2a27f', '#cfb08c', '#c8a684'];
  let barrelIdx = 0;

  const makeBarrel = (name, bx, by, yaw = 0, scale = 1) => {
    const bMat = new THREE.MeshStandardMaterial({
      map: staveTex.map,
      bumpMap: staveTex.bumpMap,
      bumpScale: 0.030,
      color: barrelTints[barrelIdx++ % barrelTints.length],
      roughness: 0.80,
      metalness: 0.0
    });
    const barrel = new THREE.Group(); barrel.name = name;
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.27, 0.64, 18, 2), bMat);
    body.position.y = 0.32; body.castShadow = body.receiveShadow = true; barrel.add(body);
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.228, 0.228, 0.024, 16), bMat);
    lid.position.y = 0.630; lid.castShadow = lid.receiveShadow = true; barrel.add(lid);
    const chime = new THREE.Mesh(new THREE.TorusGeometry(0.232, 0.015, 6, 18), timberMat);
    chime.rotation.x = Math.PI / 2; chime.position.y = 0.642; chime.castShadow = true; barrel.add(chime);
    const bung = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.018, 0.026, 8), ironMat);
    bung.position.set(0.08, 0.645, 0.04); barrel.add(bung);

    for (const h of [0.11, 0.31, 0.52]) {
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.258, 0.020, 6, 18), ironMat);
      band.rotation.x = Math.PI / 2; band.position.y = h; band.castShadow = true; barrel.add(band);
      for (let r = 0; r < 6; r++) {
        const ra = (r / 6) * Math.PI * 2;
        const rivet = new THREE.Mesh(new THREE.SphereGeometry(0.010, 6, 6), ironMat);
        rivet.position.set(Math.cos(ra) * 0.274, h, Math.sin(ra) * 0.274);
        barrel.add(rivet);
      }
    }
    barrel.add(makeContactAO(THREE, 0.82, 0.82, 0.80));
    barrel.position.copy(V(bx, by, gY(bx, by)));
    barrel.rotation.y = yaw;
    barrel.scale.setScalar(scale);
    root.add(barrel);
    return barrel;
  };
  makeBarrel('fg_barrel_left', -0.98, -2.02, 0.3, 0.92);

  // 6. LAYER 2 — MIDGROUND COMMAND CAMP (py = +1.4 .. +8.8)
  const buildTent = (name, planX, planY, yaw = 0, scale = 1, openInterior = true) => {
    const g = new THREE.Group(); g.name = name;
    const w = 2.65, d = 3.7, h = 1.88, eaveH = 0.56;

    // Subdivided tent panels with realistic catenary cloth sag & diagonal corner tension wrinkles
    const makeClothPanel = (pA0, pA1, pB0, pB1, segU, segV, isRoof) => {
      const pos = [], uvs = [], idx = [];
      const pA = new THREE.Vector3(), pB = new THREE.Vector3(), p = new THREE.Vector3();
      for (let iv = 0; iv <= segV; iv++) {
        const v = iv / segV;
        for (let iu = 0; iu <= segU; iu++) {
          const u = iu / segU;
          pA.lerpVectors(pA0, pA1, u);
          pB.lerpVectors(pB0, pB1, u);
          p.lerpVectors(pA, pB, v);
          if (isRoof) {
            // Catenary cloth drape between front, center, and rear bays + diagonal tension ripples
            const sag = Math.sin(u * Math.PI) * Math.sin(v * Math.PI) * 0.042;
            const wrk = Math.sin(u * Math.PI * 5.0 + v * 3.8) * 0.012 * Math.sin(v * Math.PI);
            p.y -= sag + wrk;
          } else {
            const pucker = Math.sin(u * Math.PI * 4.0) * Math.sin(v * Math.PI) * 0.014;
            p.x += (p.x < 0 ? 1 : -1) * pucker;
          }
          pos.push(p.x, p.y, p.z);
          uvs.push(u, v);
        }
      }
      const stride = segU + 1;
      for (let iv = 0; iv < segV; iv++) {
        for (let iu = 0; iu < segU; iu++) {
          const a = iv * stride + iu;
          const b = a + 1;
          const c = a + stride;
          const dIdx = c + 1;
          idx.push(a, b, dIdx, a, dIdx, c);
        }
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      geo.setIndex(idx);
      geo.computeVertexNormals();
      const m = new THREE.Mesh(geo, canvasMat);
      m.castShadow = m.receiveShadow = true;
      return m;
    };

    const LF = new THREE.Vector3(-w / 2, 0, -d / 2), LB = new THREE.Vector3(-w / 2, 0, d / 2);
    const LEF = new THREE.Vector3(-w / 2, eaveH, -d / 2), LEB = new THREE.Vector3(-w / 2, eaveH, d / 2);
    const RF = new THREE.Vector3(w / 2, 0, -d / 2), RB = new THREE.Vector3(w / 2, 0, d / 2);
    const REF = new THREE.Vector3(w / 2, eaveH, -d / 2), REB = new THREE.Vector3(w / 2, eaveH, d / 2);
    const TF = new THREE.Vector3(0, h, -d / 2), TB = new THREE.Vector3(0, h, d / 2);

    g.add(makeClothPanel(LF, LB, LEF, LEB, 10, 4, false));  // Left wall
    g.add(makeClothPanel(RB, RF, REB, REF, 10, 4, false));  // Right wall
    g.add(makeClothPanel(LEF, LEB, TF, TB, 12, 8, true));   // Left roof slope
    g.add(makeClothPanel(REB, REF, TB, TF, 12, 8, true));   // Right roof slope

    // Back gable wall
    const bgGeo = new THREE.BufferGeometry();
    bgGeo.setAttribute('position', new THREE.Float32BufferAttribute([
      -w / 2, 0, d / 2,   w / 2, 0, d / 2,   w / 2, eaveH, d / 2,   -w / 2, eaveH, d / 2,   0, h, d / 2
    ], 3));
    bgGeo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 0.3, 0, 0.3, 0.5, 1], 2));
    bgGeo.setIndex([0, 1, 2, 0, 2, 3, 3, 2, 4]);
    bgGeo.computeVertexNormals();
    const bgMesh = new THREE.Mesh(bgGeo, canvasMat);
    bgMesh.castShadow = bgMesh.receiveShadow = true;
    g.add(bgMesh);

    // Strictly recessed interior dark canvas lining & shadow depth inside doorway
    const iw = w * 0.90, ih = h * 0.90, ie = eaveH * 0.90, iz = d * 0.14;
    const inGeo = new THREE.BufferGeometry();
    inGeo.setAttribute('position', new THREE.Float32BufferAttribute([
      -iw / 2, 0, iz,   iw / 2, 0, iz,   iw / 2, ie, iz,   -iw / 2, ie, iz,   0, ih, iz
    ], 3));
    inGeo.setIndex([0, 1, 2, 0, 2, 3, 3, 2, 4]);
    inGeo.computeVertexNormals();
    g.add(new THREE.Mesh(inGeo, darkCanvasMat));

    // Protruding timber ridge pole & front upright pole
    const ridge = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, d + 0.38, 8), timberMat);
    ridge.rotation.x = Math.PI / 2; ridge.position.set(0, h - 0.02, 0); ridge.castShadow = true; g.add(ridge);
    const frontPole = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.052, h + 0.08, 8), timberMat);
    frontPole.position.set(0, (h + 0.08) / 2, -d / 2 - 0.08); frontPole.castShadow = true; g.add(frontPole);

    // Draped folded canvas doorway flaps tucked softly along front gable edge + tie-back cord + pegs
    for (const s of [-1, 1]) {
      const fShape = new THREE.Shape();
      fShape.moveTo(0, 0);
      fShape.lineTo(s * 0.44, 0);
      fShape.lineTo(s * 0.30, eaveH + 0.34);
      fShape.lineTo(0, eaveH + 0.14);
      fShape.closePath();
      const wing = new THREE.Mesh(new THREE.ShapeGeometry(fShape), canvasMat);
      wing.position.set(s * (w * 0.50), 0, -d / 2 - 0.02);
      wing.rotation.y = s * -0.18;
      wing.rotation.x = 0.08;
      wing.castShadow = wing.receiveShadow = true;
      g.add(wing);

      // Tie-back cord loop and corner peg pin
      const tie = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.010, 5, 10), ropeMat);
      tie.position.set(s * (w * 0.52), eaveH * 0.65, -d / 2 - 0.06);
      tie.rotation.y = Math.PI / 2;
      g.add(tie);
      for (const pz of [-d * 0.48, d * 0.48]) {
        const cornerPeg = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.012, 0.22, 6), ironMat);
        cornerPeg.position.set(s * (w / 2 + 0.06), 0.08, pz);
        cornerPeg.rotation.z = s * 0.28;
        cornerPeg.castShadow = true;
        g.add(cornerPeg);
      }
    }
    if (openInterior) {
      const cot = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.26, 1.45), timberMat);
      cot.position.set(-0.48, 0.13, -0.35); cot.castShadow = true; g.add(cot);
      const blanket = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.09, 1.05), new THREE.MeshStandardMaterial({ color: '#4d583c', roughness: 0.94 }));
      blanket.position.set(-0.48, 0.30, -0.22); blanket.castShadow = true; g.add(blanket);
      const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.58, 10), new THREE.MeshStandardMaterial({ color: '#7a7052', roughness: 0.92 }));
      roll.rotation.z = Math.PI / 2; roll.position.set(-0.48, 0.38, -0.86); roll.castShadow = true; g.add(roll);
    }

    // Shadow-casting guy ropes + driven stakes + small stake contact AO pads along both eaves
    for (const s of [-1, 1]) {
      for (const rz of [-d * 0.44, 0.0, d * 0.44]) {
        const a = new THREE.Vector3(s * (w / 2), eaveH, rz);
        const b = new THREE.Vector3(s * (w / 2 + 0.60), 0.06, rz);
        const rope = new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(a, b), 2, 0.013, 5), ropeMat);
        rope.castShadow = true;
        g.add(rope);
        const stake = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.015, 0.25, 6), timberMat);
        stake.position.set(b.x, 0.09, b.z);
        stake.rotation.z = s * 0.32;
        stake.castShadow = true;
        g.add(stake);
        const sAO = makeContactAO(THREE, 0.22, 0.22, 0.68);
        sAO.position.set(b.x, 0.012, b.z);
        g.add(sAO);
      }
    }
    g.add(makeContactAO(THREE, w + 0.72, d + 0.55, 0.78));
    g.position.copy(V(planX, planY, gY(planX, planY)));
    g.rotation.y = yaw;
    g.scale.setScalar(scale);
    root.add(g);
    return g;
  };
  // Orient open tent doorways (-Z local) toward the sunny camp road clearing!
  buildTent('camp_tent_command', -2.15, 5.2, -2.42, 1.04, true);
  buildTent('camp_tent_store', 1.25, 8.2, 2.75, 0.88, true);

  // Midground Tactical Map & Field Radio Table (`map_table.glb` + props resting FLUSH on measured tabletop height)
  const tablePos = [0.64, 1.75, gY(0.64, 1.75)];
  const mapTable = spawnMapTable(tablePos, { parent: root, yaw: -0.28, scale: 0.74, solid: true, name: 'camp_radio_table' });
  mapTable.updateMatrixWorld(true);
  const tblOrigin = V(...tablePos);
  const ray = new THREE.Raycaster(new THREE.Vector3(tblOrigin.x, tblOrigin.y + 2.0, tblOrigin.z), new THREE.Vector3(0, -1, 0));
  const tblHits = ray.intersectObject(mapTable, true).filter(
    h => !/_ao_shadow|_outline/.test(h.object.name || '') && (h.point.y - tblOrigin.y) > 0.28 && (h.point.y - tblOrigin.y) < 1.25
  );
  const tblTopZ = tblHits.length ? (tblHits[0].point.y - tblOrigin.y) : 0.60;

  spawnRadio([0.78, 1.88, gY(0.78, 1.88) + tblTopZ], { parent: root, yaw: -0.45, scale: 1.0, name: 'camp_field_radio' });
  spawnDiary([0.48, 1.65, gY(0.48, 1.65) + tblTopZ], { parent: root, yaw: 0.28, scale: 1.05, name: 'camp_war_diary' });
  spawnBinocs([0.32, 1.82, gY(0.32, 1.82) + tblTopZ], { parent: root, yaw: 0.75, scale: 1.15, name: 'camp_binoculars' });

  const sheetGeo = new THREE.PlaneGeometry(0.62, 0.44);
  sheetGeo.rotateX(-Math.PI / 2);
  const mapSheet = new THREE.Mesh(sheetGeo, new THREE.MeshStandardMaterial({ map: makeFieldMapTex(THREE), roughness: 0.86 }));
  mapSheet.name = 'camp_tactical_map_sheet';
  mapSheet.position.copy(V(0.62, 1.60, gY(0.62, 1.60) + tblTopZ + 0.008));
  mapSheet.rotation.y = -0.22;
  root.add(mapSheet);

  // Brass Hurricane Storm Lantern builder (wire cage ribs, translucent smoked glass, tiny glowing amber wick bead)
  const buildBrassLantern = (name, sc = 1.0) => {
    const lg = new THREE.Group(); lg.name = name;
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.084, 0.056, 12), brassMat);
    base.position.y = 0.028; base.castShadow = true; lg.add(base);

    const glassMat = new THREE.MeshStandardMaterial({
      color: isDay ? '#f4dfb0' : '#ffe5a8',
      emissive: '#ff9632',
      emissiveIntensity: isDay ? 0.28 : 2.1,
      roughness: 0.18,
      transparent: isDay,
      opacity: isDay ? 0.72 : 1.0
    });
    const globe = new THREE.Mesh(new THREE.SphereGeometry(0.052, 14, 10), glassMat);
    globe.scale.set(0.95, 1.35, 0.95);
    globe.position.y = 0.125; globe.name = `${name}_globe`;
    if (!isDay) globe.userData.role = 'lamp';
    lg.add(globe);

    // Subtle internal warm filament bead visible inside glass chimney
    const wick = new THREE.Mesh(
      new THREE.SphereGeometry(0.016, 8, 8),
      new THREE.MeshBasicMaterial({ color: '#ffae42', toneMapped: false })
    );
    wick.position.y = 0.118; lg.add(wick);

    // Three brass wire guard bars
    for (let r = 0; r < 3; r++) {
      const ang = (r / 3) * Math.PI * 2;
      const rib = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.15, 5), brassMat);
      rib.position.set(Math.cos(ang) * 0.062, 0.125, Math.sin(ang) * 0.062);
      lg.add(rib);
    }

    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.078, 0.055, 12), brassMat);
    cap.position.y = 0.222; cap.castShadow = true; lg.add(cap);
    lg.scale.setScalar(sc);
    return lg;
  };

  // Brass Hurricane Table Lantern on tabletop corner (subtle warm glow that never competes with the sun!)
  const tableLantern = buildBrassLantern('camp_table_lantern', 1.0);
  tableLantern.position.copy(V(0.90, 1.52, gY(0.90, 1.52) + tblTopZ));
  if (isDay) {
    const subtleTableFill = new THREE.PointLight('#ff9f44', 0.22, 1.35, 2);
    subtleTableFill.position.set(0, 0.14, 0);
    tableLantern.add(subtleTableFill);
  } else if (ctx.place?.light === 'night') {
    const nightTablePool = new THREE.PointLight('#ff9e42', 1.25, 3.4, 2);
    nightTablePool.position.set(0, 0.20, 0);
    tableLantern.add(nightTablePool);
  }
  root.add(tableLantern);

  // Midground Defensive Burlap Sandbag Wall, Supply Crates & Barrels
  for (let i = 0; i < 6; i++) {
    const sx = -2.2 + i * 0.56;
    const sy = 2.45 + Math.sin(i * 0.55) * 0.14;
    spawnSandbag([sx, sy, gY(sx, sy)], { parent: root, yaw: -0.15 + i * 0.06, scale: 0.92, solid: true, name: `camp_sandbag_${i}` });
  }
  for (const [cx, cy, cz, yaw] of [
    [-0.22, 2.35, 0, 0.18],
    [-0.18, 2.36, 0.21, -0.10],
    [-2.75, 2.25, 0, 0.42],
    [1.62, 2.55, 0, -0.25],
    [1.64, 2.52, 0.21, 0.15]
  ]) {
    spawnCrate([cx, cy, gY(cx, cy) + cz], { parent: root, yaw, solid: true, shadow: cz === 0 });
  }
  for (const [bx, by, yaw, scale] of [
    [-2.55, 2.85, 0.2, 0.92],
    [-2.02, 2.95, -0.15, 0.84],
    [1.52, 1.85, 0.4, 0.88]
  ]) {
    makeBarrel(`camp_barrel_${bx}_${by}`, bx, by, yaw, scale);
  }

  // Tall Timber Field-Radio Mast with Crossbar, Swallowtail Pennant & Guy Wires
  const mast = new THREE.Group(); mast.name = 'camp_signal_mast';
  const mastPole = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.078, 4.5, 10), timberMat);
  mastPole.position.y = 2.25; mastPole.castShadow = true; mast.add(mastPole);
  const mastArm = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.085, 0.095), timberMat);
  mastArm.position.set(0, 3.92, 0); mastArm.castShadow = true; mast.add(mastArm);
  const flagShape = new THREE.Shape();
  flagShape.moveTo(0, 0.21);
  flagShape.lineTo(0.86, 0.08);
  flagShape.lineTo(0.66, 0.0);
  flagShape.lineTo(0.86, -0.08);
  flagShape.lineTo(0, -0.21);
  flagShape.closePath();
  const flag = new THREE.Mesh(
    new THREE.ShapeGeometry(flagShape),
    new THREE.MeshStandardMaterial({ color: '#a33b28', roughness: 0.90, side: THREE.DoubleSide })
  );
  flag.position.set(0.18, 3.68, 0.02); mast.add(flag);

  const mastLantern = buildBrassLantern('signal_lamp', 1.25);
  mastLantern.position.set(-0.52, 3.60, 0); mast.add(mastLantern);
  const mastWarm = new THREE.PointLight('#ffad61', isDay ? 0.14 : 3.6, isDay ? 1.6 : 11, 2);
  mastWarm.position.set(-0.52, 3.74, 0); mast.add(mastWarm);
  for (const [gx, gy] of [[-1.7, -0.8], [1.7, -0.8], [0.0, 1.85]]) {
    const a = new THREE.Vector3(0, 3.88, 0), b = new THREE.Vector3(gx, 0.08, -gy);
    const rope = new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(a, b), 3, 0.014, 5), ropeMat);
    rope.castShadow = true;
    mast.add(rope);
  }
  mast.add(makeContactAO(THREE, 0.50, 0.50, 0.72));
  mast.position.copy(V(-0.82, 7.2, gY(-0.82, 7.2)));
  root.add(mast);

  // Camp Timber Lamp Post beside command tent entrance (brass cage + subtle day practical glow)
  const lantern = new THREE.Group(); lantern.name = 'camp_lantern';
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.056, 2.35, 10), timberMat);
  pole.position.y = 1.175; pole.castShadow = true; lantern.add(pole);
  const lArm = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.05, 0.05), timberMat);
  lArm.position.set(0.14, 2.22, 0); lArm.castShadow = true; lantern.add(lArm);
  const postLantern = buildBrassLantern('lantern', 1.25);
  postLantern.position.set(0.24, 1.92, 0); lantern.add(postLantern);
  const warm = new THREE.PointLight('#ffae63', isDay ? 0.16 : 3.2, isDay ? 1.8 : 10, 2);
  warm.position.set(0.24, 2.06, 0); lantern.add(warm);
  lantern.add(makeContactAO(THREE, 0.42, 0.42, 0.72));
  lantern.position.copy(V(-1.05, 4.05, gY(-1.05, 4.05)));
  root.add(lantern);

  // Parked Hero Military Flatbed Truck framing Right Side of Camp (enhanced paint/metal, tire dust & ground shadow)
  const heroTruck = await buildHeroTruck(THREE, ctx, {
    name: 'wheat_parked_truck',
    pos: [2.85, 5.55, gY(2.85, 5.55)],
    yaw: 1.98,
    registerSolids: true,
    registerBedOnly: false
  });
  heroTruck.traverse(n => {
    if (!n.isMesh || !n.material || /_ao_shadow|_outline/.test(n.name || '')) return;
    if (/wheel|tire/i.test(n.name || '')) {
      const gClone = n.geometry.clone();
      applyBaseDirtGradient(THREE, gClone, 0.45, '#b26b42', '#ffffff');
      n.geometry = gClone;
      for (const m of Array.isArray(n.material) ? n.material : [n.material]) {
        if (!m || m.transparent) continue;
        m.vertexColors = true;
        if (m.color) m.color.set('#554a42');
        if ('roughness' in m) m.roughness = 0.90;
        if ('metalness' in m) m.metalness = 0.0;
        m.needsUpdate = true;
      }
      return;
    }
    const mats = Array.isArray(n.material) ? n.material : [n.material];
    const hasPaint = mats.some(m => m && !m.transparent && !/glass|window|windshield|bumper|grill|mirror|light|rim|metal/i.test(m.name || n.name || ''));
    if (hasPaint && !/glass|window|windshield/i.test(n.name || '')) {
      const gClone = n.geometry.clone();
      applyBaseDirtGradient(THREE, gClone, 0.24, '#9b6442', '#ffffff');
      n.geometry = gClone;
    }
    for (const m of mats) {
      if (!m || m.transparent || /glass|window|windshield/i.test(m.name || n.name || '')) continue;
      const isTrim = /bumper|grill|mirror|light|rim|metal/i.test(m.name || n.name || '');
      if (isTrim) {
        if ('metalness' in m) m.metalness = 0.68;
        if ('roughness' in m) m.roughness = 0.30;
        if ('envMapIntensity' in m) m.envMapIntensity = 0.72;
      } else {
        m.vertexColors = true;
        if ('roughness' in m) m.roughness = Math.min(m.roughness ?? 0.8, 0.44);
        if ('metalness' in m) m.metalness = 0.16;
        if ('envMapIntensity' in m) m.envMapIntensity = 0.58;
      }
      m.needsUpdate = true;
    }
  });
  // Strong chassis belly shadow + 4 individual wheel ground contact shadows beneath truck tires
  const bellyAO = makeContactAO(THREE, 2.35, 4.75, 0.82);
  bellyAO.position.set(0, 0.015, 0);
  heroTruck.add(bellyAO);
  for (const [wx, wz] of [[-0.86, -1.35], [0.86, -1.35], [-0.86, 1.32], [0.86, 1.32]]) {
    const tireAO = makeContactAO(THREE, 0.65, 0.85, 0.84);
    tireAO.position.set(wx, 0.018, wz);
    heroTruck.add(tireAO);
  }
  root.add(heroTruck);

  // 7. LAYER 3 — BACKGROUND: Wheat Paddock behind rear fence, Eucalyptus Trees, Grazing Emus
  for (let gx = -10.5; gx <= 9.5; gx += 1.25) {
    for (let gy = 10.6; gy <= 16.5; gy += 1.25) {
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
    [-8.6, 12.2, 1.12, 1.4],
    [5.2, 12.6, 1.04, 2.1],
    [-1.4, 18.8, 0.96, 1.1],
    [-9.2, 17.5, 1.18, 2.5],
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
    [-6.2, 11.4, 1.2, 1.1],
    [4.4, 8.6, 0.9, 0.92]
  ]) {
    spawnBush([bx, by, gY(bx, by)], { parent: root, yaw, scale: sc });
  }

  // Smaller distant Emu flock farther out on the paddock ridge so it reads as distant movement, not large black silhouettes
  const emuFlock = buildEmuFlock(THREE, ctx, {
    count: 6,
    baseX: 1.2,
    baseY: 22.5,
    spreadX: 18.5,
    spreadY: 6.5,
    yaw: Math.PI * 0.84,
    groundY: gY
  });
  const distLift = new THREE.Color('#9a846b');
  for (const bird of emuFlock.children) {
    bird.scale.multiplyScalar(0.54);
    bird.traverse(n => {
      if (!n.isMesh || !n.material) return;
      for (const m of Array.isArray(n.material) ? n.material : [n.material]) {
        if (m && m.transparent && m.opacity < 0.4) { m.opacity = 0.16; continue; }
        if (m && m.color && m.isMeshStandardMaterial) {
          m.color.lerp(distLift, 0.42);
          m.needsUpdate = true;
        }
      }
    });
  }
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
