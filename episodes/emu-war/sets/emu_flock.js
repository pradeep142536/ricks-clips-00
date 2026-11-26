// UPGRADED MATTE SHAGGY FEATHERED 3D EMU RIG
// Layered matte shaggy feather cards (`roughness >= 0.90`, `clearcoat: 0`), sculpted plumage torso,
// tapered shaggy S-neck, expressive cartoon eyes with eyelids, 3-segment feathered-thigh bird legs
// with backwards-bending hock joint & 3-toed feet, plus articulated stride & neck-bob animation.

let featherCardTex = null;
function getFeatherTex(THREE) {
  if (featherCardTex) return featherCardTex;
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  g.clearRect(0, 0, 256, 256);
  const cols = ['#564a3e', '#3d332b', '#6b5c4d', '#2b241f', '#786652'];
  for (let s = 0; s < 32; s++) {
    const x = 22 + (s / 31) * 212;
    const baseLen = 108 + Math.sin(s * 2.4) * 52 + ((s % 3) * 18);
    g.strokeStyle = cols[s % cols.length];
    g.lineWidth = 10 + (s % 4) * 2;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(128 + (x - 128) * 0.28, 14);
    g.quadraticCurveTo(x + Math.cos(s) * 10, 96, x + Math.sin(s * 1.7) * 16, 26 + baseLen);
    g.stroke();
    // Lighter tan feather shaft highlight along every other strand
    if (s % 2 === 0) {
      g.strokeStyle = 'rgba(150, 130, 102, 0.55)';
      g.lineWidth = 2.5;
      g.beginPath();
      g.moveTo(128 + (x - 128) * 0.28, 18);
      g.lineTo(x + Math.sin(s * 1.7) * 12, 18 + baseLen * 0.85);
      g.stroke();
    }
  }
  featherCardTex = new THREE.CanvasTexture(c);
  featherCardTex.colorSpace = THREE.SRGBColorSpace;
  return featherCardTex;
}

let bodyPlumageTex = null;
function getBodyPlumageTex(THREE) {
  if (bodyPlumageTex) return bodyPlumageTex;
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#473d34';
  g.fillRect(0, 0, 256, 256);
  const tones = ['#352d26', '#5a4d40', '#6a5b4b', '#2b241e', '#4d4137'];
  for (let i = 0; i < 420; i++) {
    const x = ((i * 53) % 256);
    const y = ((i * 89) % 256);
    g.strokeStyle = tones[i % tones.length];
    g.lineWidth = 3 + (i % 4);
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + Math.sin(i) * 5, y + 18 + (i % 14));
    g.stroke();
  }
  bodyPlumageTex = new THREE.CanvasTexture(c);
  bodyPlumageTex.colorSpace = THREE.SRGBColorSpace;
  bodyPlumageTex.wrapS = bodyPlumageTex.wrapT = THREE.RepeatWrapping;
  bodyPlumageTex.repeat.set(2, 2);
  return bodyPlumageTex;
}

/**
 * Builds a smoothly tapered S-curved geometry from (points[i], radii[i]) cross-section rings.
 */
function buildTaperedNeckGeo(THREE, curve, rStart, rEnd, segs = 16, radial = 10) {
  const frames = curve.computeFrenetFrames(segs, false);
  const pos = [];
  const uvs = [];
  const idx = [];
  for (let i = 0; i <= segs; i++) {
    const u = i / segs;
    const p = curve.getPointAt(u);
    // Smooth wide feathered base tapering cleanly into slender upper neck
    const r = rStart + (rEnd - rStart) * Math.pow(u, 0.72);
    const N = frames.normals[i];
    const B = frames.binormals[i];
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      const ca = Math.cos(a), sa = Math.sin(a);
      const vx = p.x + r * (ca * N.x + sa * B.x);
      const vy = p.y + r * (ca * N.y + sa * B.y);
      const vz = p.z + r * (ca * N.z + sa * B.z);
      pos.push(vx, vy, vz);
      uvs.push(j / radial, u);
    }
  }
  const stride = radial + 1;
  for (let i = 0; i < segs; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * stride + j;
      const b = (i + 1) * stride + j;
      const c = (i + 1) * stride + j + 1;
      const d = i * stride + j + 1;
      idx.push(a, b, d, b, c, d);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

export function buildEmu(THREE, ctx, options = {}) {
  const { B2T } = ctx;
  const V = (x, y, z) => B2T([x, y, z]);
  const emu = new THREE.Group();
  emu.name = options.name || 'matte_feathered_emu';

  const fTex = getFeatherTex(THREE);
  const bTex = getBodyPlumageTex(THREE);
  const M = {
    featherBody: new THREE.MeshStandardMaterial({ map: bTex, color: 0xffffff, roughness: 0.94, metalness: 0.0 }),
    featherDark: new THREE.MeshStandardMaterial({ map: bTex, color: 0x8d8278, roughness: 0.95, metalness: 0.0 }),
    featherCard: new THREE.MeshStandardMaterial({
      map: fTex,
      transparent: false,
      alphaTest: 0.34,
      side: THREE.DoubleSide,
      roughness: 0.94,
      metalness: 0.0
    }),
    neckSkin: new THREE.MeshStandardMaterial({ map: bTex, color: 0xaba299, roughness: 0.92, metalness: 0.0 }),
    headSkin: new THREE.MeshStandardMaterial({ color: 0x453f3a, roughness: 0.90, metalness: 0.0 }),
    eyelidMat: new THREE.MeshStandardMaterial({ color: 0x584f47, roughness: 0.90, metalness: 0.0 }),
    beakHorn: new THREE.MeshStandardMaterial({ color: 0x9b8242, roughness: 0.84, metalness: 0.0 }),
    beakDark: new THREE.MeshStandardMaterial({ color: 0x4a3d24, roughness: 0.86, metalness: 0.0 }),
    eyeWhite: new THREE.MeshBasicMaterial({ color: 0xf7f3e8 }),
    eyePupil: new THREE.MeshBasicMaterial({ color: 0x161414 }),
    eyeGlint: new THREE.MeshBasicMaterial({ color: 0xffffff }),
    legScale: new THREE.MeshStandardMaterial({ color: 0x3a342e, roughness: 0.88, metalness: 0.0 }),
    clawMat: new THREE.MeshStandardMaterial({ color: 0x1d1a17, roughness: 0.85, metalness: 0.0 }),
    dustPuff: new THREE.MeshBasicMaterial({ color: 0xc88d58, transparent: true, opacity: 0.35, depthWrite: false }),
    shadowMat: new THREE.MeshBasicMaterial({ color: 0x1a1014, transparent: true, opacity: 0.34, depthWrite: false })
  };

  const scale = options.scale || 1.0;
  const mainGroup = new THREE.Group();
  mainGroup.scale.setScalar(scale);
  emu.add(mainGroup);

  // 1. Sculpted Organic Torso + Dense Layered Shaggy Feather Cards (chest, back, flanks, hips, tail)
  const bodyGroup = new THREE.Group();
  bodyGroup.name = 'emu_body_group';
  bodyGroup.position.set(0, 0.98, 0);

  const bodyMesh = new THREE.Mesh(new THREE.SphereGeometry(0.35, 18, 14), M.featherBody);
  bodyMesh.scale.set(0.88, 0.80, 1.38);
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  bodyGroup.add(bodyMesh);

  // Full shaggy plumage coverage via overlapping drooping feather cards
  const flankCardGeo = new THREE.PlaneGeometry(0.46, 0.44);
  for (const s of [-1, 1]) {
    // Upper + lower flank shingle layers
    for (let f = 0; f < 5; f++) {
      const card = new THREE.Mesh(flankCardGeo, M.featherCard);
      const zOff = 0.24 - f * 0.14;
      const tierY = (f % 2 === 0) ? 0.04 : -0.08;
      card.position.set(s * (0.29 - Math.abs(zOff) * 0.16), tierY, zOff);
      card.rotation.set(0.22, s * (1.28 - f * 0.07), -s * 0.22);
      card.castShadow = true;
      bodyGroup.add(card);
    }
    // High hip/rump overlapping cards
    for (let h = 0; h < 2; h++) {
      const hip = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.38), M.featherCard);
      hip.position.set(s * 0.20, 0.12 - h * 0.12, -0.26 - h * 0.12);
      hip.rotation.set(0.35, s * 0.90, -s * 0.20);
      bodyGroup.add(hip);
    }
  }
  // Dorsal spine mantle (overlapping along top back)
  for (let d = 0; d < 4; d++) {
    const mantle = new THREE.Mesh(new THREE.PlaneGeometry(0.48, 0.42), M.featherCard);
    mantle.position.set(0, 0.22 - d * 0.03, 0.18 - d * 0.19);
    mantle.rotation.set(-1.12 - d * 0.12, 0, 0);
    mantle.castShadow = true;
    bodyGroup.add(mantle);
  }
  // Breast & forward chest bib
  for (let c = 0; c < 4; c++) {
    const chest = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.38), M.featherCard);
    const xSpread = (c - 1.5) * 0.09;
    chest.position.set(xSpread, 0.02 - (c % 2) * 0.10, 0.43 - Math.abs(xSpread) * 0.18);
    chest.rotation.set(-0.22, xSpread * 0.85, 0);
    chest.castShadow = true;
    bodyGroup.add(chest);
  }
  // Drooping emu rear tail bustle
  for (let b = 0; b < 5; b++) {
    const bustle = new THREE.Mesh(new THREE.PlaneGeometry(0.40, 0.46), M.featherCard);
    const bx = (b - 2) * 0.08;
    bustle.position.set(bx, -0.04 - (b % 2) * 0.05, -0.49 + Math.abs(bx) * 0.2);
    bustle.rotation.set(0.48, (b - 2) * 0.34, 0);
    bustle.castShadow = true;
    bodyGroup.add(bustle);
  }

  // 2. Tapered Shaggy S-Neck + Expressive Head with Eyelids
  const neckPivot = new THREE.Group();
  neckPivot.name = 'emu_neck_pivot';
  neckPivot.position.set(0, 0.12, 0.34);

  const neckCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -0.02, 0.0),
    new THREE.Vector3(0, 0.18, 0.14),
    new THREE.Vector3(0, 0.44, 0.11),
    new THREE.Vector3(0, 0.68, 0.02),
    new THREE.Vector3(0, 0.82, 0.03)
  ]);
  const neckGeo = buildTaperedNeckGeo(THREE, neckCurve, 0.118, 0.046, 16, 10);
  const neckMesh = new THREE.Mesh(neckGeo, M.neckSkin);
  neckMesh.castShadow = true;
  neckPivot.add(neckMesh);

  // Shaggy feather collar + trailing neck ruff cards blending shoulder into S-neck
  for (let tier = 0; tier < 2; tier++) {
    const ty = 0.06 + tier * 0.16;
    const tz = 0.07 + tier * 0.04;
    const cardS = 0.34 - tier * 0.09;
    for (const ry of [0, Math.PI * 0.45, Math.PI, -Math.PI * 0.45]) {
      const ruff = new THREE.Mesh(new THREE.PlaneGeometry(cardS, cardS * 0.9), M.featherCard);
      ruff.position.set(Math.sin(ry) * (0.07 - tier * 0.02), ty, tz + Math.cos(ry) * (0.07 - tier * 0.02));
      ruff.rotation.set(0.18, ry, 0);
      neckPivot.add(ruff);
    }
  }

  const headGroup = new THREE.Group();
  headGroup.name = 'emu_head_group';
  headGroup.position.set(0, 0.83, 0.04);

  const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.088, 12, 10), M.headSkin);
  headMesh.scale.set(0.86, 0.90, 1.24);
  headMesh.castShadow = true;
  headGroup.add(headMesh);

  // Windswept crown & nape plumage tufts
  for (let cr = 0; cr < 3; cr++) {
    const plume = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.14), M.featherCard);
    plume.position.set((cr - 1) * 0.025, 0.075, -0.05);
    plume.rotation.set(-0.85, (cr - 1) * 0.35, 0);
    headGroup.add(plume);
  }

  // Sculpted upper & lower beak
  const upperBeak = new THREE.Mesh(new THREE.ConeGeometry(0.038, 0.17, 8), M.beakHorn);
  upperBeak.rotation.x = Math.PI / 2 + 0.06;
  upperBeak.position.set(0, -0.008, 0.165);
  upperBeak.scale.set(1.05, 1.0, 0.72);
  upperBeak.castShadow = true;
  headGroup.add(upperBeak);

  const lowerBeak = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.14, 7), M.beakDark);
  lowerBeak.rotation.x = Math.PI / 2 - 0.04;
  lowerBeak.position.set(0, -0.028, 0.145);
  lowerBeak.scale.set(0.95, 1.0, 0.55);
  headGroup.add(lowerBeak);

  // Expressive cartoon eyes with upper & lower eyelids
  for (const s of [-1, 1]) {
    const eyeGroup = new THREE.Group();
    eyeGroup.position.set(s * 0.068, 0.024, 0.046);
    const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.030, 10, 10), M.eyeWhite);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.017, 8, 8), M.eyePupil);
    pupil.position.set(s * 0.014, 0.0, 0.014);
    const glint = new THREE.Mesh(new THREE.SphereGeometry(0.006, 6, 6), M.eyeGlint);
    glint.position.set(s * 0.020, 0.008, 0.024);

    // Upper eyelid hood (slanted for lively cartoon emu expression)
    const upperLid = new THREE.Mesh(
      new THREE.SphereGeometry(0.033, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.46),
      M.eyelidMat
    );
    upperLid.rotation.set(-0.22, 0, s * -0.18);
    // Subtle lower eyelid rim
    const lowerLid = new THREE.Mesh(
      new THREE.SphereGeometry(0.032, 10, 6, 0, Math.PI * 2, Math.PI * 0.68, Math.PI * 0.32),
      M.eyelidMat
    );
    eyeGroup.add(sclera, pupil, glint, upperLid, lowerLid);
    headGroup.add(eyeGroup);
  }
  neckPivot.add(headGroup);
  bodyGroup.add(neckPivot);
  mainGroup.add(bodyGroup);

  // 3. Proper 3-Segment Bird Legs (Feathered Thigh -> Knee -> Hock-bent Shin -> Tarsus -> 3-Toed Foot)
  const legs = [];
  for (const s of [-1, 1]) {
    const hipGroup = new THREE.Group();
    hipGroup.name = `emu_leg_${s > 0 ? 'r' : 'l'}`;
    hipGroup.position.set(s * 0.16, 0.90, 0.0);

    // Segment 1: Feathered muscular drumstick thigh
    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.088, 0.052, 0.34, 10), M.featherDark);
    thigh.position.set(0, -0.15, 0.02);
    thigh.rotation.x = -0.18; // angles slightly forward toward bird knee
    thigh.castShadow = true;
    hipGroup.add(thigh);
    for (let tr = 0; tr < 3; tr++) {
      const thighRuff = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.30), M.featherCard);
      const a = (tr - 1) * 0.85;
      thighRuff.position.set(s * 0.04, -0.14, 0.01 + a * 0.04);
      thighRuff.rotation.set(0.1, s * 1.4 + a * 0.35, -s * 0.18);
      hipGroup.add(thighRuff);
    }

    // Segment 2: Scaly upper-lower leg around backward bird hock joint (knee -> hock -> ankle)
    const shinGroup = new THREE.Group();
    shinGroup.position.set(0, -0.31, 0.05);

    const upperShin = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.024, 0.30, 8), M.legScale);
    upperShin.position.set(0, -0.13, -0.05);
    upperShin.rotation.x = 0.36; // angles backward to hock joint at (y=-0.27, z=-0.10)
    upperShin.castShadow = true;
    shinGroup.add(upperShin);

    const hockKnob = new THREE.Mesh(new THREE.SphereGeometry(0.026, 8, 8), M.legScale);
    hockKnob.position.set(0, -0.27, -0.10);
    shinGroup.add(hockKnob);

    // Segment 3: Slender scaly lower tarsus angling forward/down to ground foot
    const lowerTarsus = new THREE.Mesh(new THREE.CylinderGeometry(0.023, 0.018, 0.34, 8), M.legScale);
    lowerTarsus.position.set(0, -0.43, -0.04);
    lowerTarsus.rotation.x = -0.32;
    lowerTarsus.castShadow = true;
    shinGroup.add(lowerTarsus);

    // 3-toed splayed foot resting squarely at y = 0 (total y = 0.90 - 0.31 - 0.59 = 0.00!)
    const footGroup = new THREE.Group();
    footGroup.position.set(0, -0.585, 0.01);
    for (const a of [-0.36, 0.0, 0.36]) {
      const toeLen = a === 0 ? 0.17 : 0.135;
      const toe = new THREE.Mesh(new THREE.CylinderGeometry(0.010, 0.013, toeLen, 6), M.legScale);
      toe.rotation.set(Math.PI / 2, 0, -a);
      toe.position.set(Math.sin(a) * (toeLen * 0.52), 0.011, Math.cos(a) * (toeLen * 0.52));
      toe.castShadow = true;
      footGroup.add(toe);

      const claw = new THREE.Mesh(new THREE.ConeGeometry(0.009, 0.032, 5), M.clawMat);
      claw.rotation.set(Math.PI / 2, 0, -a);
      claw.position.set(Math.sin(a) * (toeLen + 0.01), 0.009, Math.cos(a) * (toeLen + 0.01));
      footGroup.add(claw);
    }
    shinGroup.add(footGroup);
    hipGroup.add(shinGroup);
    mainGroup.add(hipGroup);
    legs.push({ group: hipGroup, shin: shinGroup, foot: footGroup, side: s });
  }

  // 4. Low Ground Foot-Kick Dust Puffs (Strictly at ground height y = 0.06m behind heels)
  const dustPuffs = [];
  if (options.running !== false) {
    for (let k = 0; k < 2; k++) {
      const puffMat = M.dustPuff.clone();
      const puff = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 0.25), puffMat);
      puff.rotation.x = -Math.PI / 2;
      puff.position.set((k === 0 ? -0.16 : 0.16), 0.04, -0.35 - k * 0.15);
      mainGroup.add(puff);
      dustPuffs.push({ mesh: puff, mat: puffMat });
    }
  }

  const shadowMesh = new THREE.Mesh(new THREE.CircleGeometry(0.48, 16), M.shadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.set(0, 0.012, 0);
  shadowMesh.userData.noExport = true;
  mainGroup.add(shadowMesh);

  if (options.pos) emu.position.copy(V(...options.pos));
  if (options.yaw != null) emu.rotation.y = options.yaw;

  const speed = options.runSpeed || 14.0;
  const phase = options.phase || Math.random() * Math.PI * 2;
  const isRunning = options.running ?? true;

  emu.userData.update = (time) => {
    if (!isRunning) {
      neckPivot.rotation.x = Math.sin(time * 2.1 + phase) * 0.06;
      headGroup.rotation.y = Math.sin(time * 1.4 + phase) * 0.12;
      return;
    }
    const t = time * speed + phase;
    legs[0].group.rotation.x = Math.sin(t) * 0.72;
    legs[1].group.rotation.x = -Math.sin(t) * 0.72;
    legs[0].shin.rotation.x = Math.max(0, -Math.cos(t)) * 0.65;
    legs[1].shin.rotation.x = Math.max(0, Math.cos(t)) * 0.65;

    // Rhythmic stride hop & forward dash lean
    bodyGroup.position.y = 0.98 + Math.abs(Math.sin(t)) * 0.075;
    bodyGroup.rotation.x = 0.14 + Math.sin(t * 2) * 0.05;

    // Natural head stabilization + counter-bobbing neck
    neckPivot.rotation.x = Math.cos(t) * 0.16 - 0.08;
    headGroup.rotation.x = -neckPivot.rotation.x * 0.65;
    headGroup.position.z = 0.04 + Math.sin(t) * 0.035;

    shadowMesh.scale.setScalar(0.9 + Math.abs(Math.sin(t)) * 0.18);

    dustPuffs.forEach((d, idx) => {
      const cyc = ((t / Math.PI + idx) % 2) / 2;
      d.mesh.position.z = -0.22 - cyc * 0.55;
      d.mesh.position.y = 0.03 + cyc * 0.12;
      d.mesh.scale.setScalar(0.55 + cyc * 1.15);
      d.mat.opacity = Math.max(0, 0.34 * (1 - cyc));
    });
  };

  return emu;
}

export function buildEmuFlock(THREE, ctx, options = {}) {
  const flock = new THREE.Group();
  flock.name = options.name || 'emu_flock';
  const count = options.count || 12;
  const spreadX = options.spreadX || 12.0;
  const spreadY = options.spreadY || 10.0;
  const baseX = options.baseX || 0.0;
  const baseY = options.baseY || 8.0;
  const groundAt = options.groundY || (() => 0);
  const emus = [];

  for (let i = 0; i < count; i++) {
    const rx = baseX + Math.sin(i * 3.7) * (spreadX / 2);
    const ry = baseY + Math.cos(i * 2.3) * (spreadY / 2);
    const rz = groundAt(rx, ry);
    const scale = 0.88 + Math.sin(i * 1.9) * 0.16;
    const emu = buildEmu(THREE, ctx, {
      pos: [rx, ry, rz],
      yaw: options.yaw ?? (Math.PI + Math.sin(i) * 0.25),
      scale,
      phase: i * 0.85,
      runSpeed: (options.runSpeed || 14.0) + (i % 4) * 1.4,
      running: true
    });
    flock.add(emu);
    emus.push(emu);
  }

  flock.userData.update = (time) => {
    emus.forEach(e => e.userData.update && e.userData.update(time));
  };
  return flock;
}
