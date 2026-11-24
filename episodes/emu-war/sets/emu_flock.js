// 3D STYLIZED EMU FLOCK: High-quality stylized 3D Australian Emus (Dromaius novaehollandiae)
// Articulated feathered body, S-curved neck, beaked head, expressive eyes, and running stick legs.
// Features procedural sprint kinematics (pumping legs, bobbing neck, forward sprint lean).

export function buildEmu(THREE, ctx, options = {}) {
  const { B2T, toon, pbr, relief } = ctx;
  const V = (x, y, z) => B2T([x, y, z]);
  const emu = new THREE.Group();
  emu.name = options.name || 'stylized_3d_emu';

  const M = {
    featherBody: pbr?.metal ? pbr.metal('wet', { color: '#38322c', rough: 0.85, toon: '#332e29' }) : toon('#38322c'),
    featherLayer: new THREE.MeshStandardMaterial({ color: 0x484038, roughness: 0.9, metalness: 0.0 }),
    neckSkin: new THREE.MeshStandardMaterial({ color: 0x5a5248, roughness: 0.75, metalness: 0.05 }),
    headSkin: new THREE.MeshStandardMaterial({ color: 0x3d3832, roughness: 0.8, metalness: 0.0 }),
    beakHorn: pbr?.metal ? pbr.metal('brass', { color: '#bfa034', rough: 0.4, toon: '#a88a28' }) : toon('#bfa034'),
    eyeWhite: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1, metalness: 0.1 }),
    eyePupil: new THREE.MeshBasicMaterial({ color: 0x111115 }),
    legStick: new THREE.MeshStandardMaterial({ color: 0x282422, roughness: 0.6, metalness: 0.1 }),
    shadowMat: new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.45 })
  };

  const scale = options.scale || 1.0;
  const mainGroup = new THREE.Group();
  mainGroup.scale.setScalar(scale);
  emu.add(mainGroup);

  // 1. Shaggy Feathered Body (Oval body with layered feather tufts)
  const bodyGroup = new THREE.Group();
  bodyGroup.name = 'emu_body_group';
  bodyGroup.position.set(0, 0.95, 0); // ~0.95m above ground

  const bodyMesh = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 12), M.featherBody);
  bodyMesh.scale.set(1.0, 0.85, 1.35); // aerodynamic oval bird body
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  bodyGroup.add(bodyMesh);

  // Feather frill layers around rump and flanks
  for (let s = -1; s <= 1; s += 2) {
    for (let f = 0; f < 5; f++) {
      const frill = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.28, 5), M.featherLayer);
      frill.position.set(s * 0.32, -0.05 + f * 0.04, -0.25 - f * 0.08);
      frill.rotation.set(-0.4, s * 0.35, s * 0.45);
      bodyGroup.add(frill);
    }
  }

  // 2. Flexible S-Curved Neck
  const neckCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.12, 0.38),
    new THREE.Vector3(0, 0.38, 0.52),
    new THREE.Vector3(0, 0.72, 0.44),
    new THREE.Vector3(0, 0.92, 0.36)
  ]);
  const neckMesh = new THREE.Mesh(new THREE.TubeGeometry(neckCurve, 16, 0.065, 8, false), M.neckSkin);
  neckMesh.castShadow = true;
  bodyGroup.add(neckMesh);

  // 3. Emu Head & Beak
  const headGroup = new THREE.Group();
  headGroup.name = 'emu_head_group';
  headGroup.position.set(0, 0.96, 0.38);

  const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.095, 12, 10), M.headSkin);
  headMesh.scale.set(0.9, 0.95, 1.25);
  headMesh.castShadow = true;
  headGroup.add(headMesh);

  // Sharp Horn Beak
  const beakMesh = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.18, 8), M.beakHorn);
  beakMesh.rotation.x = Math.PI / 2;
  beakMesh.position.set(0, -0.015, 0.18);
  beakMesh.castShadow = true;
  headGroup.add(beakMesh);

  // Expressive Eyes (Left & Right)
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 8), M.eyeWhite);
    eye.position.set(s * 0.075, 0.03, 0.04);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.016, 6, 6), M.eyePupil);
    pupil.position.set(s * 0.086, 0.03, 0.055);
    headGroup.add(eye);
    headGroup.add(pupil);
  }
  bodyGroup.add(headGroup);
  mainGroup.add(bodyGroup);

  // 4. Articulated Sprinting Stick Legs (Left & Right)
  const legs = [];
  for (const s of [-1, 1]) {
    const legGroup = new THREE.Group();
    legGroup.name = `emu_leg_${s > 0 ? 'r' : 'l'}`;
    legGroup.position.set(s * 0.16, 0.90, 0.0);

    // Thigh
    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.03, 0.42, 8), M.featherBody);
    thigh.position.set(0, -0.19, 0.0);
    thigh.castShadow = true;
    legGroup.add(thigh);

    // Shin (backward angle)
    const shinGroup = new THREE.Group();
    shinGroup.position.set(0, -0.38, 0.0);
    const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.018, 0.52, 8), M.legStick);
    shin.position.set(0, -0.24, -0.04);
    shin.rotation.x = 0.22;
    shin.castShadow = true;
    shinGroup.add(shin);

    // Foot (3 splayed running toes)
    const footGroup = new THREE.Group();
    footGroup.position.set(0, -0.50, -0.02);
    for (const a of [-0.3, 0.0, 0.3]) {
      const toe = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.014, 0.14), M.legStick);
      toe.position.set(Math.sin(a) * 0.06, 0, 0.06);
      toe.rotation.y = a;
      footGroup.add(toe);
    }
    shinGroup.add(footGroup);
    legGroup.add(shinGroup);

    mainGroup.add(legGroup);
    legs.push({ group: legGroup, shin: shinGroup, foot: footGroup, side: s });
  }

  // 5. Contact Shadow Disc on Ground
  const shadowMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 1.2), M.shadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.set(0, 0.01, 0);
  mainGroup.add(shadowMesh);

  // Initial Placement
  if (options.pos) {
    emu.position.copy(V(...options.pos));
  }
  if (options.yaw) {
    emu.rotation.y = options.yaw;
  }

  // Animation Update function
  const speed = options.runSpeed || 14.0;
  const phase = options.phase || Math.random() * Math.PI * 2;
  const isRunning = options.running ?? true;

  emu.userData.update = (time) => {
    if (!isRunning) return;
    const t = time * speed + phase;
    // Leg cycling
    legs[0].group.rotation.x = Math.sin(t) * 0.75;
    legs[1].group.rotation.x = -Math.sin(t) * 0.75;
    legs[0].shin.rotation.x = Math.max(0, -Math.cos(t)) * 0.8;
    legs[1].shin.rotation.x = Math.max(0, Math.cos(t)) * 0.8;

    // Body sprint bob & forward lean
    bodyGroup.position.y = 0.95 + Math.abs(Math.sin(t)) * 0.06;
    bodyGroup.rotation.x = 0.18 + Math.sin(t * 2) * 0.04;

    // Neck rhythmic bob
    neckMesh.rotation.x = Math.cos(t) * 0.12;
    headGroup.position.z = 0.38 + Math.sin(t) * 0.05;

    // Shadow pulsing with stride
    shadowMesh.scale.setScalar(0.9 + Math.abs(Math.sin(t)) * 0.2);
  };

  return emu;
}

// Spawns a charging/running flock of N emus across a target area
export function buildEmuFlock(THREE, ctx, options = {}) {
  const flock = new THREE.Group();
  flock.name = options.name || 'emu_flock';
  const count = options.count || 12;
  const spreadX = options.spreadX || 12.0;
  const spreadY = options.spreadY || 10.0;
  const baseX = options.baseX || 0.0;
  const baseY = options.baseY || 8.0;
  const emus = [];

  for (let i = 0; i < count; i++) {
    const rx = baseX + (Math.sin(i * 3.7) * (spreadX / 2));
    const ry = baseY + (Math.cos(i * 2.3) * (spreadY / 2));
    const scale = 0.88 + (Math.sin(i * 1.9) * 0.2);
    const emu = buildEmu(THREE, ctx, {
      pos: [rx, ry, 0.0],
      yaw: options.yaw ?? (Math.PI + (Math.sin(i) * 0.25)), // running toward/past camera
      scale,
      phase: i * 0.85,
      runSpeed: 14.0 + (i % 4) * 1.5,
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
