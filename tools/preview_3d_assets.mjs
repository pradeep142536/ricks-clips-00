#!/usr/bin/env node
/**
 * 3D Asset Studio Previewer for the RicksClips Asset-First Pipeline.
 *
 * Usage:
 *   node tools/preview_3d_assets.mjs [episodes/<ep>/asset_manifest.json] [--all-library] [--id <item_id>]
 *
 * Outputs:
 *   - GLB library items    -> assets/3d_library/previews/<item_id>.png (512x512)
 *   - Procedural items     -> episodes/<ep>/out/previews/<item_id>.png (512x512)
 *   - Master contact sheet -> episodes/<ep>/out/previews/all_assets_grid.png
 */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const KIT = path.join(ROOT, 'templates', 'threejs_film');
const LIB_DIR = path.join(ROOT, 'assets', '3d_library');
const LIB_PREVIEWS = path.join(LIB_DIR, 'previews');
const CATALOG_PATH = path.join(LIB_DIR, 'catalog.json');

const args = process.argv.slice(2);
const has = k => args.includes(k);
const val = (k, d) => { const i = args.indexOf(k); return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : d; };

const manifestArg = args.find(a => !a.startsWith('--'));
const onlyId = val('--id', null);
const allLib = has('--all-library') || !manifestArg;

let manifest = null;
let epDir = null;
let epOutPreviews = null;

if (manifestArg) {
  let mp = path.resolve(manifestArg);
  if (fs.existsSync(mp) && fs.statSync(mp).isDirectory()) {
    mp = path.join(mp, 'asset_manifest.json');
  }
  if (!fs.existsSync(mp)) {
    console.error('Manifest not found:', mp);
    process.exit(1);
  }
  manifest = JSON.parse(fs.readFileSync(mp, 'utf8'));
  epDir = path.dirname(mp);
  epOutPreviews = path.join(epDir, 'out', 'previews');
  fs.mkdirSync(epOutPreviews, { recursive: true });
}
fs.mkdirSync(LIB_PREVIEWS, { recursive: true });

// Assemble target asset list
const items = [];
const seenIds = new Set();

if (manifest && Array.isArray(manifest.items)) {
  for (const it of manifest.items) {
    if (onlyId && it.id !== onlyId) continue;
    seenIds.add(it.id);
    const isProc = !!(it.fallback_required || it.approved_option || /^approved_option/.test(it.status || '') || /^missing/.test(it.status || ''));
    items.push({
      id: it.id,
      name: it.name || it.id,
      category: it.category || 'prop',
      target_axis: it.target_axis || 'height',
      target_meters: Number(it.target_meters || 1.0),
      keep_metal: !!it.keep_metal,
      matte_roughness: it.matte_roughness ?? 0.82,
      library_path: it.library_path,
      isProcedural: isProc,
      outPath: isProc && epOutPreviews
        ? path.join(epOutPreviews, `${it.id}.png`)
        : path.join(LIB_PREVIEWS, `${it.id}.png`)
    });
  }
}

if (allLib && fs.existsSync(CATALOG_PATH)) {
  const cat = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
  for (const [id, entry] of Object.entries(cat.assets || {})) {
    if (seenIds.has(id) || (onlyId && id !== onlyId)) continue;
    const abs = path.join(ROOT, entry.library_path || '');
    if (!fs.existsSync(abs)) continue;
    seenIds.add(id);
    items.push({
      id,
      name: id,
      category: entry.category || 'prop',
      target_axis: 'height',
      target_meters: 1.0,
      keep_metal: false,
      matte_roughness: 0.82,
      library_path: entry.library_path,
      isProcedural: false,
      outPath: path.join(LIB_PREVIEWS, `${id}.png`)
    });
  }
}

if (!items.length) {
  console.log('No items found to preview.');
  process.exit(0);
}

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.bin': 'application/octet-stream',
  '.svg': 'image/svg+xml'
};

const STUDIO_HTML = `<!doctype html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;background:#e8eaed;overflow:hidden">
<canvas id="gl" width="512" height="512" style="display:block"></canvas>
<script type="module">
import * as THREE from '/kit/vendor/three.module.js';
import { createAssetHelper, normalizeModel, unifyArtStyle } from '/kit/glb_loader.mjs';

// ─── Gold-model compatibility studio override ──────────────────────────────────
// Keep ONLY gold sandbag burlap texture override; all upgraded 8 items use real
// textured PBR .glb files or upgraded scene builders rendered via glb_loader.mjs.
const STUDIO_OVERRIDES = {
  sandbag(obj) {
    const burlap = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#b5a07a'),
      roughness: 0.94,
      metalness: 0.0,
      bumpScale: 0.4,
    });
    const bc = document.createElement('canvas'); bc.width = bc.height = 64;
    const bg = bc.getContext('2d');
    for (let y = 0; y < 64; y += 4) {
      for (let x = 0; x < 64; x += 4) {
        const v = ((x + y) % 8 < 4) ? 180 : 210;
        bg.fillStyle = \`rgb(\${v},\${v},\${v})\`;
        bg.fillRect(x, y, 4, 4);
      }
    }
    burlap.bumpMap = new THREE.CanvasTexture(bc);
    burlap.bumpMap.wrapS = burlap.bumpMap.wrapT = THREE.RepeatWrapping;
    burlap.bumpMap.repeat.set(3, 3);
    obj.traverse(n => {
      if (!n.isMesh) return;
      const mats = Array.isArray(n.material) ? n.material : [n.material];
      mats.forEach(m => { if (m && m.map) { m.map.dispose(); m.map = null; } });
      n.material = burlap;
    });
  },
};
// ─── End studio overrides ────────────────────────────────────────────────────

const W = 512, H = 512;
const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setSize(W, H, false);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#e8eaed');

// Neutral RicksClips matte studio lighting
scene.add(new THREE.HemisphereLight('#ffffff', '#b8bcc4', 1.45));
const key = new THREE.DirectionalLight('#fff8ed', 1.9);
key.position.set(6, 10, 7);
key.castShadow = true;
key.shadow.mapSize.set(1024, 1024);
key.shadow.camera.near = 0.2;
key.shadow.camera.far = 40;
key.shadow.bias = -0.0005;
key.shadow.radius = 4;
scene.add(key);

const rim = new THREE.DirectionalLight('#dce8ff', 0.55);
rim.position.set(-6, 5, -6);
scene.add(rim);

// Soft ground receiver catching clean shadow (studio neutral backdrop)
const floor = new THREE.Mesh(
  new THREE.CircleGeometry(90, 48),
  new THREE.MeshStandardMaterial({ color: '#dcdfe4', roughness: 0.96, metalness: 0.0 })
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// Subtle radial contact shadow disc under center
function makeGroundDisc() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 4, 64, 64, 60);
  gr.addColorStop(0.0, 'rgba(30, 34, 42, 0.34)');
  gr.addColorStop(0.55, 'rgba(30, 34, 42, 0.14)');
  gr.addColorStop(1.0, 'rgba(30, 34, 42, 0.0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}
const shadowDisc = new THREE.Mesh(
  new THREE.PlaneGeometry(1, 1),
  new THREE.MeshBasicMaterial({ map: makeGroundDisc(), transparent: true, depthWrite: false })
);
shadowDisc.rotation.x = -Math.PI / 2;
shadowDisc.position.y = 0.003;
scene.add(shadowDisc);

const cam = new THREE.PerspectiveCamera(36, 1.0, 0.01, 200);
const holder = new THREE.Group();
scene.add(holder);

const B2T = p => new THREE.Vector3(p[0], p[2] || 0, -p[1]);
const ctxBase = { THREE, B2T, toon: c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85 }) };

let procMods = null;
async function getProcMods(hasEp) {
  if (procMods || !hasEp) return procMods;
  const props = await import('/ep/sets/procedural_props.mjs').catch(() => null);
  const emus = await import('/ep/sets/emu_flock.js').catch(() => null);
  procMods = { props, emus };
  return procMods;
}

function buildProceduralItem(spec, mods) {
  const { id, target_axis, target_meters } = spec;
  let raw = null;
  if (id === 'lewis_machine_gun' && mods.props?.buildLewisGun) {
    raw = mods.props.buildLewisGun(THREE, ctxBase, { mountHeight: 0.56, pitch: -0.02 });
  } else if (id === 'pitchfork' && mods.props?.buildPitchfork) {
    raw = mods.props.buildPitchfork(THREE, ctxBase, { tilt: 0.08 });
  } else if (id === 'dispatch_box' && mods.props?.buildDispatchBox) {
    raw = mods.props.buildDispatchBox(THREE, ctxBase, {});
  } else if (id === 'emu' && mods.emus?.buildEmu) {
    raw = mods.emus.buildEmu(THREE, ctxBase, { running: false, scale: 1.0 });
    raw.userData.update && raw.userData.update(0.4);
    raw.traverse(n => { if (n.isMesh && n.userData?.noExport) n.visible = false; });
  }
  if (!raw) throw new Error('No procedural builder available for ' + id);
  const norm = normalizeModel(raw, { name: id, axis: target_axis, meters: target_meters });
  unifyArtStyle(norm, {
    minRoughness: spec.matte_roughness ?? 0.84,
    keepMetal: spec.keep_metal,
    castShadow: true,
    receiveShadow: true
  });
  return norm;
}

window.renderStudioItem = async (spec, manifest, hasEp) => {
  holder.clear();
  const helper = createAssetHelper(manifest, B2T);
  let obj;
  if (spec.isProcedural) {
    const mods = await getProcMods(hasEp);
    obj = buildProceduralItem(spec, mods);
  } else {
    obj = await helper.spawn(spec.id, {
      pos: [0, 0, 0],
      axis: spec.target_axis,
      meters: spec.target_meters,
      keepMetal: spec.keep_metal,
      minRoughness: spec.matte_roughness ?? 0.82,
      shadow: false, // studio scene has its own floor + contact shadow disc
      solid: false
    });
  }

  // Apply per-asset studio override (material fix, geometry swap, etc.)
  const overrideFn = STUDIO_OVERRIDES[spec.id];
  if (overrideFn) {
    try { overrideFn(obj, THREE); } catch(e) { console.error('[studio override]', spec.id, e); }
  }

  holder.add(obj);
  obj.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(obj);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  // Match directional shadow frustum tightly to asset bounds
  const maxExt = Math.max(size.x, size.y, size.z, 0.1);
  const d = maxExt * 1.4;
  key.shadow.camera.left = -d;
  key.shadow.camera.right = d;
  key.shadow.camera.top = d;
  key.shadow.camera.bottom = -d;
  key.shadow.camera.updateProjectionMatrix();

  shadowDisc.scale.set(Math.max(0.1, size.x * 1.35), Math.max(0.1, size.z * 1.35), 1);
  shadowDisc.position.set(center.x, 0.003, center.z);

  // 3/4 isometric studio camera auto-framed with comfortable margin (avoids top/bottom clipping on tall vertical tools)
  const fovRad = THREE.MathUtils.degToRad(cam.fov);
  const sphere = new THREE.Sphere();
  box.getBoundingSphere(sphere);
  const r = Math.max(sphere.radius, size.y * 0.56, 0.08);
  const dist = (r / Math.sin(fovRad / 2)) * 1.12;
  const az = THREE.MathUtils.degToRad(38);
  const el = THREE.MathUtils.degToRad(23);

  cam.near = Math.max(0.005, dist * 0.05);
  cam.far = Math.max(50, dist * 12);
  cam.updateProjectionMatrix();
  cam.position.set(
    center.x + dist * Math.cos(el) * Math.sin(az),
    center.y + dist * Math.sin(el),
    center.z + dist * Math.cos(el) * Math.cos(az)
  );
  cam.lookAt(center.x, center.y, center.z);

  renderer.render(scene, cam);

  // Stamp WebGL render + bottom-corner ID & real-world size badge onto 2D output canvas
  const out = document.createElement('canvas');
  out.width = W;
  out.height = H;
  const ctx = out.getContext('2d');
  ctx.drawImage(canvas, 0, 0, W, H);

  const label = spec.id + ' — ' + Number(spec.target_meters).toFixed(2) + 'm';
  ctx.font = '700 17px "Segoe UI", Arial, sans-serif';
  const tw = ctx.measureText(label).width;
  const padX = 12, padY = 7, bx = W - tw - padX * 2 - 14, by = H - 42;
  ctx.fillStyle = 'rgba(26, 28, 34, 0.84)';
  ctx.beginPath();
  ctx.roundRect(bx, by, tw + padX * 2, 28, 6);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, bx + padX, by + 15);

  return out.toDataURL('image/png').split(',')[1];
};

window.stitchGrid = async (entries, titleText) => {
  const cols = Math.min(5, Math.max(1, Math.ceil(Math.sqrt(entries.length))));
  const rows = Math.ceil(entries.length / cols);
  const tile = 384;
  const gap = 16;
  const hdr = 72;
  const pad = 20;
  const Wg = pad * 2 + cols * tile + (cols - 1) * gap;
  const Hg = pad * 2 + hdr + rows * tile + (rows - 1) * gap;

  const c = document.createElement('canvas');
  c.width = Wg;
  c.height = Hg;
  const g = c.getContext('2d');
  g.fillStyle = '#f3f4f6';
  g.fillRect(0, 0, Wg, Hg);

  g.fillStyle = '#1f2329';
  g.font = '800 28px "Segoe UI", Arial, sans-serif';
  g.fillText(titleText, pad, pad + 28);
  g.fillStyle = '#57606a';
  g.font = '600 15px "Segoe UI", Arial, sans-serif';
  g.fillText('Normalized bottom-center pivot (y=0), RicksClips matte PBR lighting, exact target meters', pad, pad + 54);

  for (let i = 0; i < entries.length; i++) {
    const col = i % cols, row = Math.floor(i / cols);
    const x = pad + col * (tile + gap);
    const y = pad + hdr + row * (tile + gap);
    const im = new Image();
    im.src = 'data:image/png;base64,' + entries[i].b64;
    await im.decode();
    g.drawImage(im, x, y, tile, tile);
    g.strokeStyle = '#c8cdd4';
    g.lineWidth = 2;
    g.strokeRect(x, y, tile, tile);

    // Top-left type pill (GLB vs Option A Procedural)
    const tag = entries[i].isProcedural ? 'PROCEDURAL (A)' : 'CC0 .GLB';
    g.font = '700 12px "Segoe UI", Arial, sans-serif';
    const tw = g.measureText(tag).width;
    g.fillStyle = entries[i].isProcedural ? '#9a5814' : '#1f6feb';
    g.beginPath();
    g.roundRect(x + 10, y + 10, tw + 14, 22, 4);
    g.fill();
    g.fillStyle = '#ffffff';
    g.textBaseline = 'middle';
    g.fillText(tag, x + 17, y + 21);
  }
  return c.toDataURL('image/png').split(',')[1];
};
</script>
</body>
</html>`;

let chromium;
const pwFallback = [
  process.env.PLAYWRIGHT_DIR,
  path.join(ROOT, 'github_render_repo', 'templates', 'threejs_film', 'node_modules', 'playwright'),
  '/opt/node-tools/node_modules/playwright',
  path.join(ROOT, 'node_modules', 'playwright')
].filter(Boolean).find(p => fs.existsSync(p));
try {
  ({ chromium } = await import('playwright'));
} catch {
  const req = createRequire(path.join(KIT, 'render.mjs'));
  ({ chromium } = req(pwFallback));
}

const server = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  if (u === '/studio.html') {
    res.writeHead(200, { 'content-type': 'text/html', 'cache-control': 'no-store' });
    return res.end(STUDIO_HTML);
  }
  const m = /^\/(kit|assets|ep)\/(.*)$/.exec(u);
  if (!m) { res.writeHead(404); return res.end('not found'); }
  const rootMap = { kit: KIT, assets: path.join(ROOT, 'assets'), ep: epDir || ROOT };
  const f = path.normalize(path.join(rootMap[m[1]], m[2]));
  if (!f.startsWith(rootMap[m[1]]) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) {
    res.writeHead(404);
    return res.end('not found');
  }
  res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' });
  fs.createReadStream(f).pipe(res);
});

const port = await new Promise(ok => server.listen(0, '127.0.0.1', () => ok(server.address().port)));
const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox', '--headless=new', '--ignore-gpu-blocklist']
});

try {
  const page = await browser.newPage({ viewport: { width: 512, height: 512 }, deviceScaleFactor: 1 });
  page.on('console', m => { if (m.type() === 'error') console.error('[studio page]', m.text()); });
  page.on('pageerror', e => console.error('[studio error]', e.message));

  await page.goto(`http://127.0.0.1:${port}/studio.html`);

  const gridEntries = [];
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const b64 = await page.evaluate(
      ([spec, m, hasEp]) => window.renderStudioItem(spec, m, hasEp),
      [it, manifest, !!epDir]
    );
    fs.mkdirSync(path.dirname(it.outPath), { recursive: true });
    fs.writeFileSync(it.outPath, Buffer.from(b64, 'base64'));
    gridEntries.push({ id: it.id, b64, isProcedural: it.isProcedural });
    console.log(`[${i + 1}/${items.length}] ${it.id.padEnd(20)} (${it.target_meters.toFixed(2)}m) -> ${path.relative(ROOT, it.outPath)}`);
  }

  if (epOutPreviews && gridEntries.length > 0 && !onlyId) {
    const title = `RicksClips 3D Asset Studio — ${manifest.episode} (${gridEntries.length} items)`;
    const gridB64 = await page.evaluate(([e, t]) => window.stitchGrid(e, t), [gridEntries, title]);
    const gridPath = path.join(epOutPreviews, 'all_assets_grid.png');
    fs.writeFileSync(gridPath, Buffer.from(gridB64, 'base64'));
    console.log(`\nall_assets_grid -> ${gridPath} (${gridEntries.length} items)`);
  }
} finally {
  await browser.close();
  server.close();
}
