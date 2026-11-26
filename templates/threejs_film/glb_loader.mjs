// GLB_LOADER (Cinema Standard V3.0): Asset-First 3D .glb loader, auto-normalizer, matte stylizer, comic ink outlines, forward-axis alignment, 9:16 safe-zone check, AO grounder, and clearance checker.
// Used by all episode set modules via ctx.assets (injected by film.js) or direct import.
import * as THREE from './vendor/three.module.js';
import { GLTFLoader } from './vendor/GLTFLoader.js';

const loader = new GLTFLoader();
const rawCache = new Map();
const outlineGeoCache = new WeakMap();
const outlineMatCache = new Map();
let aoShadowTex = null;

function getAOShadowTex() {
  if (aoShadowTex) return aoShadowTex;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 6, 64, 64, 62);
  gr.addColorStop(0.0, 'rgba(20, 12, 18, 0.85)');
  gr.addColorStop(0.55, 'rgba(20, 12, 18, 0.42)');
  gr.addColorStop(1.0, 'rgba(20, 12, 18, 0.0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  aoShadowTex = new THREE.CanvasTexture(c);
  aoShadowTex.colorSpace = THREE.SRGBColorSpace;
  return aoShadowTex;
}

/**
 * Resolves a manifest asset id or relative path to a fetchable URL under /assets/.
 */
export function resolveAssetUrl(ref, manifest) {
  if (!ref) throw new Error('glb_loader: missing asset ref or url');
  if (/^(https?:|\/)/.test(ref)) return ref;
  if (manifest && manifest.items) {
    const item = manifest.items.find(x => x.id === ref || x.file === ref || x.library_path === ref);
    if (item && item.library_path) {
      const p = String(item.library_path).replace(/\\/g, '/').replace(/^\/?assets\//, '');
      return `/assets/${p}`;
    }
  }
  const clean = String(ref).replace(/\\/g, '/').replace(/^\/?assets\//, '');
  if (clean.startsWith('3d_library/')) return `/assets/${clean}`;
  return `/assets/3d_library/${clean}`;
}

/**
 * Clones a loaded GLTF scene safely with independent per-instance materials.
 */
function cloneDeep(src) {
  const clone = src.clone(true);
  clone.traverse(node => {
    if (!node.isMesh) return;
    if (Array.isArray(node.material)) {
      node.material = node.material.map(m => (m && typeof m.clone === 'function' ? m.clone() : m));
    } else if (node.material && typeof node.material.clone === 'function') {
      node.material = node.material.clone();
    }
  });
  return clone;
}

/**
 * Loads and caches the raw GLTF scene from URL.
 */
export async function loadRawGLB(url) {
  if (!rawCache.has(url)) {
    rawCache.set(url, loader.loadAsync(url).then(gltf => gltf.scene));
  }
  const scene = await rawCache.get(url);
  return cloneDeep(scene);
}

/**
 * Normalizes a Three.js Object3D so:
 * 1) Its target axis (height, length, width, or max) scales cleanly to exact meters.
 * 2) Its pivot sits at bottom-center: XZ centered on (0,0), bottom (min.y) flush at y = 0.
 */
export function normalizeModel(inner, opts = {}) {
  inner.updateMatrixWorld(true);
  const rawBox = new THREE.Box3().setFromObject(inner);
  const rawSize = new THREE.Vector3();
  rawBox.getSize(rawSize);

  const axis = opts.axis || (opts.length_m ? 'length' : opts.width_m ? 'width' : opts.max_m ? 'max' : 'height');
  const meters = opts.meters ?? opts.height_m ?? opts.length_m ?? opts.width_m ?? opts.max_m ?? opts.height ?? opts.length ?? 1.0;

  let refDim = rawSize.y;
  if (axis === 'length') refDim = Math.max(rawSize.x, rawSize.z);
  else if (axis === 'width') refDim = Math.min(rawSize.x, rawSize.z) > 1e-4 ? rawSize.x : Math.max(rawSize.x, rawSize.z);
  else if (axis === 'max') refDim = Math.max(rawSize.x, rawSize.y, rawSize.z);

  if (refDim > 1e-5 && meters > 0) {
    const s = meters / refDim;
    inner.scale.multiplyScalar(s);
  }

  inner.updateMatrixWorld(true);
  const scaledBox = new THREE.Box3().setFromObject(inner);
  const center = new THREE.Vector3();
  const size = new THREE.Vector3();
  scaledBox.getCenter(center);
  scaledBox.getSize(size);

  if (!opts.keepXZ) {
    inner.position.x -= center.x;
    inner.position.z -= center.z;
  }
  inner.position.y -= scaledBox.min.y; // Pivot strictly at bottom y = 0 so object rests flat on surfaces
  inner.updateMatrixWorld(true);

  const wrapper = new THREE.Group();
  wrapper.name = opts.name || inner.name || 'normalized_glb';
  wrapper.add(inner);

  const finalBox = new THREE.Box3().setFromObject(wrapper);
  const fSize = new THREE.Vector3();
  finalBox.getSize(fSize);
  wrapper.userData.bbox = {
    width: +fSize.x.toFixed(4),
    height: +fSize.y.toFixed(4),
    depth: +fSize.z.toFixed(4),
    minY: +finalBox.min.y.toFixed(4)
  };
  return wrapper;
}

/**
 * Resolves optional per-material tint/style match rule from opts.partTints.
 */
function matchPartRule(matName, nodeName, partTints) {
  if (!partTints || typeof partTints !== 'object') return null;
  const hay = `${matName || ''} ${nodeName || ''}`;
  for (const [pat, rule] of Object.entries(partTints)) {
    try {
      if (new RegExp(pat, 'i').test(hay)) return rule;
    } catch {
      if (hay.toLowerCase().includes(pat.toLowerCase())) return rule;
    }
  }
  return null;
}

/**
 * Applies a unified stylized matte PBR pass, clamping harsh plastic/balloon glare
 * so 3D assets match the crisp 2D RicksClips characters.
 * Preserves transparent/glass (alphaMode: BLEND, transparent, opacity < 1) and emissiveMap materials.
 */
export function unifyArtStyle(root, opts = {}) {
  const minRough = opts.minRoughness ?? 0.78;
  const maxMetal = opts.maxMetalness ?? 0.12;
  const cast = opts.castShadow ?? true;
  const recv = opts.receiveShadow ?? true;
  const tint = opts.tint ? new THREE.Color(opts.tint) : null;

  root.traverse(node => {
    if (!node.isMesh || node.userData.isInkOutline) return;
    node.castShadow = cast;
    node.receiveShadow = recv;
    if (opts.role && !node.userData.role) node.userData.role = opts.role;

    const mats = Array.isArray(node.material) ? node.material : [node.material];
    for (const m of mats) {
      if (!m) continue;

      const isGlassOrTransparent = !!(
        m.transparent ||
        (m.opacity != null && m.opacity < 0.99) ||
        m.alphaMap ||
        /glass|window|windshield/i.test(m.name || '')
      );
      const hasEmissive = !!(
        m.emissiveMap ||
        (m.emissive && (m.emissive.r + m.emissive.g + m.emissive.b) > 0.05) ||
        /flame/i.test(m.name || '')
      );

      // NEVER flatten or darken transparent glass, alphaMode: BLEND surfaces, or emissive flames/lamps
      if (isGlassOrTransparent || hasEmissive) {
        if (isGlassOrTransparent && !hasEmissive) {
          node.castShadow = false;
        }
        continue;
      }

      if ('clearcoat' in m) {
        m.clearcoat = 0;
        m.clearcoatRoughness = 1.0;
      }

      const partRule = matchPartRule(m.name, node.name, opts.partTints);
      const partObj = typeof partRule === 'string' ? { tint: partRule } : partRule;

      const isMetallic = opts.keepMetal && (m.metalness ?? 0) >= 0.30;
      if ('specularIntensity' in m) {
        m.specularIntensity = isMetallic ? 0.45 : 0.15;
      }
      if ('roughness' in m) {
        if (partObj && partObj.roughness != null) {
          m.roughness = partObj.roughness;
        } else {
          m.roughness = isMetallic
            ? Math.max(m.roughness ?? 0.45, opts.minMetalRoughness ?? 0.42)
            : Math.max(m.roughness ?? 0.85, minRough);
        }
      }
      if ('metalness' in m) {
        if (partObj && partObj.metalness != null) {
          m.metalness = partObj.metalness;
        } else {
          m.metalness = opts.keepMetal ? Math.min(m.metalness ?? 0.8, 0.85) : Math.min(m.metalness ?? 0, maxMetal);
        }
      }
      if ('envMapIntensity' in m) {
        m.envMapIntensity = isMetallic ? 0.55 : 0.25;
      }

      if (partObj && partObj.color && m.color) {
        m.color.set(partObj.color);
      } else if (partObj && partObj.tint && m.color) {
        m.color.multiply(new THREE.Color(partObj.tint));
      } else {
        if (tint && m.color) m.color.multiply(tint);
        if (opts.color && m.color) m.color.set(opts.color);
      }
      m.needsUpdate = true;
    }
  });
  return root;
}

/**
 * Builds a smoothed-normal BufferGeometry clone so inverted-hull comic ink outlines
 * extrude continuously across hard 90-degree edges (walls, crates, vehicles, signs).
 */
function getSmoothedOutlineGeometry(srcGeo) {
  if (!srcGeo || !srcGeo.attributes || !srcGeo.attributes.position) return null;
  if (outlineGeoCache.has(srcGeo)) return outlineGeoCache.get(srcGeo);
  const pos = srcGeo.attributes.position;
  if (pos.count > 35000) return null; // skip dense high-poly leaf/foliage clusters
  const geom = srcGeo.clone();
  if (!geom.attributes.normal) geom.computeVertexNormals();
  const pAttr = geom.attributes.position;
  const nAttr = geom.attributes.normal;
  const accum = new Map();
  for (let i = 0; i < pAttr.count; i++) {
    const key = `${Math.round(pAttr.getX(i) * 1e4)},${Math.round(pAttr.getY(i) * 1e4)},${Math.round(pAttr.getZ(i) * 1e4)}`;
    let acc = accum.get(key);
    if (!acc) {
      acc = [0, 0, 0];
      accum.set(key, acc);
    }
    acc[0] += nAttr.getX(i);
    acc[1] += nAttr.getY(i);
    acc[2] += nAttr.getZ(i);
  }
  const smoothN = new Float32Array(pAttr.count * 3);
  for (let i = 0; i < pAttr.count; i++) {
    const key = `${Math.round(pAttr.getX(i) * 1e4)},${Math.round(pAttr.getY(i) * 1e4)},${Math.round(pAttr.getZ(i) * 1e4)}`;
    const acc = accum.get(key);
    const len = Math.hypot(acc[0], acc[1], acc[2]) || 1;
    smoothN[i * 3] = acc[0] / len;
    smoothN[i * 3 + 1] = acc[1] / len;
    smoothN[i * 3 + 2] = acc[2] / len;
  }
  geom.setAttribute('normal', new THREE.BufferAttribute(smoothN, 3));
  outlineGeoCache.set(srcGeo, geom);
  return geom;
}

/**
 * Shared camera-distance-scaled BackSide comic ink outline material (V3.0).
 */
function getInkOutlineMaterial(opts = {}) {
  const color = opts.outlineColor || '#231218';
  const thickness = +(opts.outlineScale ?? 0.0024).toFixed(5);
  const minW = +(opts.outlineMin ?? 0.003).toFixed(5);
  const maxW = +(opts.outlineMax ?? 0.036).toFixed(5);
  const key = `${color}|${thickness}|${minW}|${maxW}`;
  if (outlineMatCache.has(key)) return outlineMatCache.get(key);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: true,
    fog: true,
    toneMapped: false,
    uniforms: THREE.UniformsUtils.merge([
      THREE.UniformsLib.fog,
      {
        uColor: { value: new THREE.Color(color) },
        uScale: { value: thickness },
        uMin: { value: minW },
        uMax: { value: maxW }
      }
    ]),
    vertexShader: `uniform float uScale, uMin, uMax;
      #include <fog_pars_vertex>
      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        float dist = length(mvPosition.xyz);
        vec3 n = normalize(normalMatrix * normal);
        float push = clamp(dist * uScale, uMin, uMax);
        mvPosition.xyz += n * push;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: `uniform vec3 uColor;
      #include <fog_pars_fragment>
      void main() {
        gl_FragColor = vec4(uColor, 1.0);
        #include <fog_fragment>
      }`
  });
  outlineMatCache.set(key, mat);
  return mat;
}

/**
 * Attaches clean camera-distance-scaled black comic ink outlines (inverted hull) to 3D hero props,
 * furniture, doors, vehicles, and buildings (skipping glass, emissive bulbs, and foliage clusters).
 */
export function addInkOutlines(root, opts = {}) {
  if (!root || opts.outline === false) return root;
  if (/tree|bush|grass|wheat|foliage|leaves|cloud/i.test(root.name || '')) return root;
  const mat = getInkOutlineMaterial(opts);
  const targets = [];
  root.traverse(node => {
    if (!node.isMesh || node.isInstancedMesh || node.userData.isInkOutline || node.userData.noExport) return;
    const mats = Array.isArray(node.material) ? node.material : [node.material];
    const skip = mats.some(m => !m || m.transparent || (m.opacity != null && m.opacity < 0.98) || m.alphaTest > 0.1 || m.emissiveMap || (m.emissive && (m.emissive.r + m.emissive.g + m.emissive.b) > 0.15));
    if (skip) return;
    targets.push(node);
  });
  for (const node of targets) {
    if (node.children && node.children.some(c => c.userData && c.userData.isInkOutline)) continue;
    const hullGeo = getSmoothedOutlineGeometry(node.geometry);
    if (!hullGeo) continue;
    const hull = new THREE.Mesh(hullGeo, mat);
    hull.name = `${node.name || 'mesh'}_ink_outline`;
    hull.userData.isInkOutline = true;
    hull.userData.noExport = true;
    hull.castShadow = false;
    hull.receiveShadow = false;
    node.add(hull);
  }
  return root;
}

/**
 * Infers a vehicle/creature's local forward yaw offset from named nose/tail nodes (default local +Z -> 0).
 */
export function detectForwardAxis(root) {
  let noseZ = 0, tailZ = 0, noseX = 0, tailX = 0, hits = 0;
  const p = new THREE.Vector3();
  if (root && root.updateMatrixWorld) root.updateMatrixWorld(true);
  root && root.traverse(o => {
    const n = o.name || '';
    if (!n) return;
    if (/propeller|nose|headlight|grille|beak|snout/i.test(n)) {
      o.getWorldPosition(p);
      noseZ += p.z; noseX += p.x; hits++;
    } else if (/tail|rudder|exhaust|rear/i.test(n)) {
      o.getWorldPosition(p);
      tailZ += p.z; tailX += p.x; hits++;
    }
  });
  if (hits > 0 && Math.hypot(noseX - tailX, noseZ - tailZ) > 0.05) {
    return Math.atan2(noseX - tailX, noseZ - tailZ);
  }
  return 0;
}

/**
 * V3.0 Forward-Axis Guardrail: Orients a moving vehicle or creature so its front/nose strictly matches
 * its velocity vector (Three.js vector or {x,y,z}; pass opts.planCoords=true for Blender [dx,dy,dz]).
 */
export function alignForwardToVelocity(obj, vel, opts = {}) {
  if (!obj || !vel) return obj;
  let vx, vy, vz;
  if (Array.isArray(vel)) {
    vx = vel[0] || 0;
    if (opts.planCoords) {
      vz = -(vel[1] || 0);
      vy = vel[2] || 0;
    } else {
      vy = vel[1] || 0;
      vz = vel[2] || 0;
    }
  } else {
    vx = vel.x || 0;
    vy = vel.y || 0;
    vz = vel.z || 0;
  }
  const horiz = Math.hypot(vx, vz);
  if (horiz < 1e-4 && Math.abs(vy) < 1e-4) return obj;
  const fwdOffset = opts.forwardOffset ?? obj.userData?.forwardYawOffset ?? 0;
  obj.rotation.order = 'YXZ';
  if (horiz >= 1e-4) {
    obj.rotation.y = Math.atan2(vx, vz) - fwdOffset;
  }
  if (opts.pitch !== false) {
    const rawPitch = -Math.atan2(vy, Math.max(horiz, 1e-4));
    const maxP = opts.maxPitch ?? 0.55;
    obj.rotation.x = Math.max(-maxP, Math.min(maxP, rawPitch));
  }
  if (opts.roll != null) obj.rotation.z = opts.roll;
  return obj;
}

/**
 * V3.0 9:16 Safe-Zone Check: Confirms a readable world point sits inside the central 80% horizontal
 * band [0.10..0.90] so labels, gag buttons, and signs are never clipped off vertical edges.
 */
export function isInSafeZone9x16(worldPos, camera, ratio = 0.80) {
  if (!worldPos || !camera) return { ok: false, x: null, y: null };
  const p = worldPos.clone().project(camera);
  if (p.z < -1 || p.z > 1) return { ok: false, x: null, y: null };
  const sx = (p.x + 1) * 0.5;
  const sy = (1 - p.y) * 0.5;
  const pad = (1 - ratio) * 0.5;
  return { ok: sx >= pad && sx <= 1 - pad && sy >= 0.06 && sy <= 0.84, x: +sx.toFixed(3), y: +sy.toFixed(3) };
}

/**
 * Attaches a soft contact AO drop shadow beneath the normalized y = 0 base.
 */
export function attachContactShadow(group, opts = {}) {
  const b = group.userData.bbox || { width: 1.0, depth: 1.0 };
  const w = Math.max(0.25, b.width * (opts.shadowScale ?? 1.18));
  const d = Math.max(0.25, b.depth * (opts.shadowScale ?? 1.18));
  const mat = new THREE.MeshBasicMaterial({
    map: getAOShadowTex(),
    transparent: true,
    opacity: opts.shadowOpacity ?? 0.36,
    depthWrite: false,
    toneMapped: false
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
  mesh.name = `${group.name}_ao_shadow`;
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.008;
  mesh.userData.noExport = true;
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  group.add(mesh);
  return mesh;
}

/**
 * Builds the ctx.assets helper injected into every set's build(THREE, scene, film, ctx).
 */
export function createAssetHelper(manifest, B2T, defaultOpts = {}) {
  const placedSolids = [];

  function findSpec(id) {
    if (!manifest || !manifest.items) return null;
    return manifest.items.find(x => x.id === id) || null;
  }

  async function spawn(idOrFile, opts = {}) {
    const spec = findSpec(idOrFile);
    const url = resolveAssetUrl(idOrFile, manifest);
    const raw = await loadRawGLB(url);

    const normOpts = {
      name: opts.name || (spec ? spec.id : idOrFile),
      axis: opts.axis || (spec && spec.target_axis) || 'height',
      meters: opts.meters ?? (spec && spec.target_meters) ?? 1.0,
      keepXZ: !!opts.keepXZ
    };
    const group = normalizeModel(raw, normOpts);
    unifyArtStyle(group, {
      minRoughness: opts.minRoughness ?? (spec && spec.matte_roughness) ?? 0.80,
      maxMetalness: opts.maxMetalness ?? (spec && spec.max_metalness) ?? 0.12,
      keepMetal: opts.keepMetal ?? (spec && (spec.keep_metal || spec.category === 'metal')) ?? false,
      tint: opts.tint ?? (spec && spec.tint),
      color: opts.color ?? (spec && spec.color_override),
      partTints: opts.partTints ?? (spec && spec.part_tints),
      role: opts.role || (spec && spec.role) || 'prop',
      castShadow: opts.castShadow ?? true,
      receiveShadow: opts.receiveShadow ?? true
    });

    const useOutline = (opts.outline ?? defaultOpts.outline ?? (spec && spec.outline)) !== false;
    if (useOutline) {
      addInkOutlines(group, {
        outlineColor: opts.outlineColor || (spec && spec.outline_color),
        outlineScale: opts.outlineScale ?? (spec && spec.outline_scale),
        outlineMin: opts.outlineMin,
        outlineMax: opts.outlineMax
      });
    }
    group.userData.forwardYawOffset = opts.forwardOffset ?? detectForwardAxis(group);

    if (opts.shadow !== false) {
      attachContactShadow(group, opts);
    }

    if (opts.pos) {
      const p = B2T ? B2T(opts.pos) : new THREE.Vector3(opts.pos[0], opts.pos[2] || 0, -opts.pos[1]);
      group.position.copy(p);
    }
    if (opts.yaw != null) group.rotation.y = opts.yaw;
    else if (opts.rotY != null) group.rotation.y = opts.rotY;
    if (opts.rotX != null) group.rotation.x = opts.rotX;
    if (opts.rotZ != null) group.rotation.z = opts.rotZ;

    if (opts.solid !== false) {
      group.updateMatrixWorld(true);
      const bx = new THREE.Box3().setFromObject(group);
      placedSolids.push({ id: group.name, box: bx, group });
    }
    if (opts.parent) opts.parent.add(group);
    return group;
  }

  /**
   * Registers an explicit solid object for actor-prop collision verification.
   */
  function registerSolid(id, objOrBox) {
    if (objOrBox instanceof THREE.Box3) {
      placedSolids.push({ id, box: objOrBox.clone(), group: null });
    } else if (objOrBox && objOrBox.isObject3D) {
      objOrBox.updateMatrixWorld(true);
      const bx = new THREE.Box3().setFromObject(objOrBox);
      placedSolids.push({ id, box: bx, group: objOrBox });
    }
  }

  /**
   * Checks 2D actor horizontal + vertical clearance against solid props.
   * Returns list of violations if any actor overlaps a solid box above foot level.
   */
  function checkActorClearance(actorName, planPos, actorHeight = 1.7, radius = 0.28) {
    const p3 = B2T ? B2T(planPos) : new THREE.Vector3(planPos[0], planPos[2] || 0, -planPos[1]);
    const footY = p3.y;
    const headY = p3.y + actorHeight;
    const hits = [];
    for (const s of placedSolids) {
      const b = s.group ? new THREE.Box3().setFromObject(s.group) : s.box;
      if (!b || b.isEmpty()) continue;
      // Ignore floor/surface props strictly at or below actor's soles (+8cm step tolerance)
      if (b.max.y <= footY + 0.08 || b.min.y >= headY - 0.05) continue;
      const cx = Math.max(b.min.x, Math.min(p3.x, b.max.x));
      const cz = Math.max(b.min.z, Math.min(p3.z, b.max.z));
      const dx = p3.x - cx;
      const dz = p3.z - cz;
      const dist = Math.hypot(dx, dz);
      if (dist < radius) {
        hits.push({
          actor: actorName,
          solid: s.id,
          clearance_m: +dist.toFixed(3),
          required_m: radius,
          overlap_m: +(radius - dist).toFixed(3)
        });
      }
    }
    return hits;
  }

  return {
    manifest,
    placedSolids,
    spawn,
    resolveUrl: ref => resolveAssetUrl(ref, manifest),
    loadRawGLB,
    normalizeModel,
    unifyArtStyle,
    addInkOutlines,
    detectForwardAxis,
    alignForwardToVelocity,
    isInSafeZone9x16,
    attachContactShadow,
    registerSolid,
    checkActorClearance
  };
}
