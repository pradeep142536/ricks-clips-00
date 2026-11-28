// Shared Option (A) Procedural Hero Props + Cached GLB Clone Helpers
// Zero duplicate hero primitive code across episode sets.

export function makeMatteMat(THREE, hex, rough = 0.84, metal = 0.05) {
  return new THREE.MeshStandardMaterial({
    color: hex,
    roughness: Math.max(0.75, rough),
    metalness: Math.min(0.45, metal)
  });
}

let walnutTexCache = null;
function makeWalnutTex(THREE) {
  if (walnutTexCache) return walnutTexCache;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#6c4224';
  g.fillRect(0, 0, 128, 128);
  for (let y = 0; y < 128; y += 3) {
    const shade = Math.sin(y * 0.35) * 14 + Math.cos(y * 0.13) * 10;
    const r = Math.max(40, Math.min(150, 108 + shade));
    const gr = Math.max(25, Math.min(100, 66 + shade * 0.6));
    const b = Math.max(15, Math.min(60, 36 + shade * 0.35));
    g.fillStyle = `rgb(${r | 0},${gr | 0},${b | 0})`;
    g.fillRect(0, y, 128, 2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  walnutTexCache = tex;
  return tex;
}

/**
 * Approved Option (A): 1914 Mark I Lewis Machine Gun + 3-leg Folding Tripod.
 * Charcoal weathered gunmetal (#2b2f33), cooling-shroud ribs, walnut wood grain stock,
 * fluted 47-round top pan magazine with brushed brass latch, dark steel tripod legs.
 * Pivot strictly at bottom of tripod feet (y = 0); muzzle aimed toward +Z (or rotated via yaw).
 */
export function buildLewisGun(THREE, ctx, opts = {}) {
  const g = new THREE.Group();
  g.name = opts.name || 'lewis_machine_gun_option_a';
  const mountH = opts.mountHeight ?? 0.88;
  const barrelPitch = opts.pitch ?? 0.03;

  const gunMetal = new THREE.MeshStandardMaterial({ color: '#2b2f33', roughness: 0.65, metalness: 0.35 });
  const shroudSteel = new THREE.MeshStandardMaterial({ color: '#424952', roughness: 0.58, metalness: 0.40 });
  const tripodSteel = new THREE.MeshStandardMaterial({ color: '#31363d', roughness: 0.68, metalness: 0.32 });
  const brassMat = new THREE.MeshStandardMaterial({ color: '#a88a46', roughness: 0.56, metalness: 0.45 });
  const walnutMat = new THREE.MeshStandardMaterial({ map: makeWalnutTex(THREE), color: '#d8b89a', roughness: 0.84, metalness: 0.0 });

  // 1. Dark Steel Tripod Legs (all three touch exactly y = 0)
  const tripod = new THREE.Group();
  tripod.name = 'lewis_tripod';
  const pintleY = Math.max(0.28, mountH - 0.14);

  const legSpecs = [
    [0.0, 0.34],      // Front leg (+Z toward fire line)
    [-0.30, -0.28],   // Rear-left leg
    [0.30, -0.28]     // Rear-right leg
  ];
  for (let i = 0; i < legSpecs.length; i++) {
    const [fx, fz] = legSpecs[i];
    const start = new THREE.Vector3(0, pintleY, 0);
    const end = new THREE.Vector3(fx, 0.02, fz);
    const dir = end.clone().sub(start);
    const len = dir.length();
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.015, len, 8), tripodSteel);
    leg.position.copy(start).addScaledVector(dir, 0.5);
    leg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    leg.castShadow = true;
    tripod.add(leg);

    const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.044, 0.022, 8), tripodSteel);
    pad.position.set(fx, 0.011, fz);
    tripod.add(pad);
  }

  // Traversing bar between rear legs
  const brace = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.54, 8), tripodSteel);
  brace.rotation.z = Math.PI / 2;
  brace.position.set(0, 0.12, -0.22);
  tripod.add(brace);

  // Brushed brass pintle collar & swivel cradle
  const pintle = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.052, 0.14, 12), brassMat);
  pintle.position.set(0, pintleY + 0.05, 0);
  pintle.castShadow = true;
  tripod.add(pintle);

  const cradle = new THREE.Mesh(new THREE.BoxGeometry(0.092, 0.092, 0.125), tripodSteel);
  cradle.position.set(0, mountH - 0.03, 0);
  tripod.add(cradle);
  g.add(tripod);

  // 2. Receiver, Finned Barrel Cooling Shroud, Fluted Top Pan Magazine & Walnut Buttstock
  const gun = new THREE.Group();
  gun.name = 'lewis_gun_receiver';
  gun.position.set(0, mountH + 0.02, 0.02);
  gun.rotation.x = barrelPitch;

  // Tubular aluminum cooling shroud (signature fat Lewis barrel) -> +Z is forward muzzle
  const shroud = new THREE.Mesh(new THREE.CylinderGeometry(0.054, 0.056, 0.72, 18), shroudSteel);
  shroud.rotation.x = Math.PI / 2;
  shroud.position.set(0, 0.01, 0.36);
  shroud.castShadow = true;
  gun.add(shroud);

  // Raised radial cooling-shroud bands/ribs + longitudinal flute ribs for metallic edge catch
  for (const rz of [0.06, 0.22, 0.38, 0.54, 0.68]) {
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.060, 0.060, 0.018, 16), gunMetal);
    band.rotation.x = Math.PI / 2;
    band.position.set(0, 0.01, rz);
    gun.add(band);
  }
  for (let ri = 0; ri < 8; ri++) {
    const a = (ri / 8) * Math.PI * 2;
    const rib = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.008, 0.66), gunMetal);
    rib.position.set(Math.cos(a) * 0.056, 0.01 + Math.sin(a) * 0.056, 0.36);
    rib.rotation.z = a;
    gun.add(rib);
  }

  // Tapered muzzle nozzle, protruding inner rifle barrel tip, & front blade sight
  const muzzle = new THREE.Mesh(new THREE.ConeGeometry(0.058, 0.10, 14), gunMetal);
  muzzle.rotation.x = -Math.PI / 2;
  muzzle.position.set(0, 0.01, 0.76);
  gun.add(muzzle);

  const innerBore = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.09, 10), shroudSteel);
  innerBore.rotation.x = Math.PI / 2;
  innerBore.position.set(0, 0.01, 0.80);
  gun.add(innerBore);

  const frontSight = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.048, 0.022), brassMat);
  frontSight.position.set(0, 0.078, 0.66);
  gun.add(frontSight);

  // Lower gas return cylinder under shroud
  const gasTube = new THREE.Mesh(new THREE.CylinderGeometry(0.020, 0.020, 0.62, 10), gunMetal);
  gasTube.rotation.x = Math.PI / 2;
  gasTube.position.set(0, -0.055, 0.30);
  gun.add(gasTube);

  // Rectangular receiver & brushed brass cocking handle
  const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.078, 0.105, 0.34), gunMetal);
  receiver.position.set(0, 0.005, -0.10);
  receiver.castShadow = true;
  gun.add(receiver);

  const rearSight = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.036, 0.036), shroudSteel);
  rearSight.position.set(0, 0.074, -0.23);
  gun.add(rearSight);

  const cockingHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.085, 8), brassMat);
  cockingHandle.rotation.z = Math.PI / 2;
  cockingHandle.position.set(0.06, 0.02, -0.06);
  gun.add(cockingHandle);

  // Fluted 47-round flat pan magazine mounted horizontally on top + brushed brass center latch
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.165, 0.168, 0.052, 24), gunMetal);
  drum.position.set(0, 0.088, -0.06);
  drum.castShadow = true;
  gun.add(drum);

  const drumRim = new THREE.Mesh(new THREE.TorusGeometry(0.164, 0.008, 6, 24), shroudSteel);
  drumRim.rotation.x = Math.PI / 2;
  drumRim.position.set(0, 0.114, -0.06);
  gun.add(drumRim);

  for (let fi = 0; fi < 12; fi++) {
    const fa = (fi / 12) * Math.PI * 2;
    const flute = new THREE.Mesh(new THREE.BoxGeometry(0.011, 0.008, 0.29), shroudSteel);
    flute.position.set(0, 0.117, -0.06);
    flute.rotation.y = fa;
    gun.add(flute);
  }

  const drumCap = new THREE.Mesh(new THREE.CylinderGeometry(0.044, 0.048, 0.064, 14), brassMat);
  drumCap.position.set(0, 0.092, -0.06);
  gun.add(drumCap);

  const drumLatch = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.014, 0.022), brassMat);
  drumLatch.position.set(0, 0.126, -0.06);
  drumLatch.rotation.y = 0.45;
  gun.add(drumLatch);

  // Pistol/spade rear grip & textured walnut buttstock with brass buttplate
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.12, 0.046), walnutMat);
  grip.position.set(0, -0.075, -0.20);
  grip.rotation.x = 0.25;
  gun.add(grip);

  const butt = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.115, 0.28), walnutMat);
  butt.position.set(0, -0.025, -0.38);
  butt.rotation.x = 0.08;
  butt.castShadow = true;
  gun.add(butt);

  const buttPlate = new THREE.Mesh(new THREE.BoxGeometry(0.050, 0.118, 0.014), brassMat);
  buttPlate.position.set(0, -0.036, -0.52);
  buttPlate.rotation.x = 0.08;
  gun.add(buttPlate);

  g.add(gun);

  if (opts.pos && ctx.B2T) g.position.copy(ctx.B2T(opts.pos));
  if (opts.yaw != null) g.rotation.y = opts.yaw;
  return g;
}

/**
 * Approved Option (A): 1.55m Farm Pitchfork (Ash wood handle + forged 3-tine steel fork).
 * Pivot strictly at ground ferrule/handle base (y = 0).
 */
export function buildPitchfork(THREE, ctx, opts = {}) {
  const g = new THREE.Group();
  g.name = opts.name || 'pitchfork_option_a';
  const wood = makeMatteMat(THREE, '#8b6a46', 0.88, 0.0);
  const iron = makeMatteMat(THREE, '#42474e', 0.80, 0.32);

  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.019, 1.15, 8), wood);
  handle.position.y = 0.575;
  handle.castShadow = true;
  g.add(handle);

  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.020, 0.08, 8), iron);
  collar.position.y = 1.16;
  g.add(collar);

  const crossbar = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.022, 0.022), iron);
  crossbar.position.y = 1.21;
  g.add(crossbar);

  for (const tx of [-0.11, 0.0, 0.11]) {
    const tine = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.009, 0.34, 6), iron);
    tine.position.set(tx, 1.38, 0.015);
    tine.rotation.x = -0.08;
    tine.castShadow = true;
    g.add(tine);
  }

  if (opts.pos && ctx.B2T) g.position.copy(ctx.B2T(opts.pos));
  if (opts.yaw != null) g.rotation.y = opts.yaw;
  if (opts.tilt != null) g.rotation.z = opts.tilt;
  return g;
}

/**
 * Approved Option (A): Carved Mahogany Parliament Lectern + Brass Dispatch Box (1.15m height).
 * Pivot strictly at floor base (y = 0).
 */
export function buildDispatchBox(THREE, ctx, opts = {}) {
  const g = new THREE.Group();
  g.name = opts.name || 'dispatch_box_option_a';
  const mahogany = makeMatteMat(THREE, '#4a2315', 0.82, 0.0);
  const trimWood = makeMatteMat(THREE, '#62311e', 0.84, 0.0);
  const brass = makeMatteMat(THREE, '#c89e34', 0.76, 0.42);
  const leather = makeMatteMat(THREE, '#284a2d', 0.88, 0.0);

  const base = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.10, 0.54), mahogany);
  base.position.y = 0.05;
  base.castShadow = true;
  base.receiveShadow = true;
  g.add(base);

  const plinth = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.80, 0.42), mahogany);
  plinth.position.y = 0.50;
  plinth.castShadow = true;
  g.add(plinth);

  const frontPanel = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.60, 0.44), trimWood);
  frontPanel.position.y = 0.50;
  g.add(frontPanel);

  const topDeck = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.08, 0.56), trimWood);
  topDeck.position.y = 0.94;
  topDeck.castShadow = true;
  g.add(topDeck);

  // Green inlaid lectern pad + brass bound Dispatch Box resting atop
  const pad = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.02, 0.44), leather);
  pad.position.y = 0.99;
  g.add(pad);

  const box = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.16, 0.26), mahogany);
  box.position.y = 1.07;
  box.castShadow = true;
  g.add(box);

  for (const bx of [-0.14, 0.14]) {
    const clasp = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.17, 0.27), brass);
    clasp.position.set(bx, 1.07, 0);
    g.add(clasp);
  }

  if (opts.pos && ctx.B2T) g.position.copy(ctx.B2T(opts.pos));
  if (opts.yaw != null) g.rotation.y = opts.yaw;
  return g;
}

/**
 * Approved Option (A): Brass Hurricane Storm Lantern with wire guard ribs, glass chimney, & subtle filament.
 * Pivot strictly at base bottom (y = 0).
 */
export function buildBrassLantern(THREE, opts = {}) {
  const isDay = opts.isDay ?? true;
  const sc = opts.scale ?? 1.0;
  const lg = new THREE.Group();
  lg.name = opts.name || 'brass_hurricane_lantern';

  const brassMat = new THREE.MeshStandardMaterial({ color: '#c9a148', roughness: 0.34, metalness: 0.68 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.084, 0.056, 12), brassMat);
  base.position.y = 0.028;
  base.castShadow = true;
  lg.add(base);

  const glassMat = new THREE.MeshStandardMaterial({
    color: isDay ? '#f4dfb0' : '#ffe5a8',
    emissive: '#ff9632',
    emissiveIntensity: isDay ? 0.42 : 1.9,
    roughness: 0.18,
    transparent: isDay,
    opacity: isDay ? 0.74 : 1.0
  });
  const globe = new THREE.Mesh(new THREE.SphereGeometry(0.052, 14, 10), glassMat);
  globe.scale.set(0.95, 1.35, 0.95);
  globe.position.y = 0.125;
  globe.name = `${lg.name}_globe`;
  if (!isDay) globe.userData.role = 'lamp';
  lg.add(globe);

  const wick = new THREE.Mesh(
    new THREE.SphereGeometry(0.016, 8, 8),
    new THREE.MeshBasicMaterial({ color: '#ffae42', toneMapped: false })
  );
  wick.position.y = 0.118;
  lg.add(wick);

  for (let r = 0; r < 3; r++) {
    const ang = (r / 3) * Math.PI * 2;
    const rib = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.15, 5), brassMat);
    rib.position.set(Math.cos(ang) * 0.062, 0.125, Math.sin(ang) * 0.062);
    lg.add(rib);
  }

  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.078, 0.055, 12), brassMat);
  cap.position.y = 0.222;
  cap.castShadow = true;
  lg.add(cap);

  if (opts.light) {
    const pt = new THREE.PointLight('#ff9f44', opts.lightIntensity ?? (isDay ? 0.24 : 1.45), opts.lightDistance ?? (isDay ? 1.8 : 4.2), 2);
    pt.position.set(0, 0.14, 0);
    lg.add(pt);
  }

  lg.scale.setScalar(sc);
  return lg;
}

/**
 * Approved Option (A): Spoked Weathered Timber & Iron-Tyre Bush Wagon Wheel (radius ~ 0.46m).
 * Upright in local XY plane (pivot at rim bottom y = 0) so yaw/tilt lean cleanly against posts/crates.
 */
export function buildWagonWheel(THREE, ctx, opts = {}) {
  const R = opts.radius ?? 0.46;
  const g = new THREE.Group();
  g.name = opts.name || 'wagon_wheel_option_a';

  const timber = new THREE.MeshStandardMaterial({ map: makeWalnutTex(THREE), color: '#b58d64', roughness: 0.88, metalness: 0.0 });
  const darkWood = makeMatteMat(THREE, '#6b4a2f', 0.90, 0.0);
  const ironRim = makeMatteMat(THREE, '#3a3430', 0.78, 0.38);

  const hubGroup = new THREE.Group();
  hubGroup.position.y = R;

  // Wooden felloe ring + outer rusted iron tire band
  const felloe = new THREE.Mesh(new THREE.TorusGeometry(R - 0.035, 0.032, 8, 28), timber);
  felloe.castShadow = felloe.receiveShadow = true;
  hubGroup.add(felloe);

  const tyre = new THREE.Mesh(new THREE.TorusGeometry(R - 0.008, 0.014, 6, 28), ironRim);
  tyre.castShadow = true;
  hubGroup.add(tyre);

  // Turned nave hub & iron bands
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.082, 0.19, 12), darkWood);
  hub.rotation.x = Math.PI / 2;
  hub.castShadow = true;
  hubGroup.add(hub);

  for (const hz of [-0.075, 0.075]) {
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.068, 0.025, 12), ironRim);
    collar.rotation.x = Math.PI / 2;
    collar.position.z = hz;
    hubGroup.add(collar);
  }

  // Ten tapered ash spokes
  const nSpokes = 10;
  for (let i = 0; i < nSpokes; i++) {
    const a = (i / nSpokes) * Math.PI * 2;
    const spokeLen = R - 0.095;
    const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.021, spokeLen, 7), timber);
    spoke.position.set(Math.cos(a) * (0.055 + spokeLen * 0.5), Math.sin(a) * (0.055 + spokeLen * 0.5), 0);
    spoke.rotation.z = a - Math.PI / 2;
    spoke.castShadow = true;
    hubGroup.add(spoke);
  }

  g.add(hubGroup);
  if (opts.pos && ctx?.B2T) g.position.copy(ctx.B2T(opts.pos));
  if (opts.yaw != null) g.rotation.y = opts.yaw;
  if (opts.lean != null) g.rotation.x = opts.lean;
  if (opts.tilt != null) g.rotation.z = opts.tilt;
  if (opts.scale != null) g.scale.setScalar(opts.scale);
  return g;
}

/**
 * Helper to spawn one normalized CC0 GLB prototype and place lightweight clones
 * without reloading/re-parsing from network.
 */
export async function makePropSpawner(ctx, id, protoOpts = {}) {
  const proto = await ctx.assets.spawn(id, {
    pos: [0, 0, 0],
    solid: false,
    shadow: protoOpts.shadow ?? true,
    keepMetal: protoOpts.keepMetal,
    tint: protoOpts.tint,
    minRoughness: protoOpts.minRoughness
  });
  return (planPos, opts = {}) => {
    const c = proto.clone(true);
    c.name = opts.name || `${id}_inst`;
    if (planPos && ctx.B2T) c.position.copy(ctx.B2T(planPos));
    if (opts.yaw != null) c.rotation.y = opts.yaw;
    if (opts.rotX != null) c.rotation.x = opts.rotX;
    if (opts.rotZ != null) c.rotation.z = opts.rotZ;
    if (opts.scale != null) c.scale.setScalar(opts.scale);
    if (opts.parent) opts.parent.add(c);
    if (opts.solid) ctx.assets.registerSolid(c.name, c);
    return c;
  };
}
