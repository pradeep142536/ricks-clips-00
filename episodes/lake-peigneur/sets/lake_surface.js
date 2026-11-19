// SET: Lake Peigneur Surface (1980) — High-Detail Animated Edition
// Wide cinematic oil drilling platform (Wilson Brothers Rig 20), towering lattice steel derrick,
// spinning rotary table, reciprocating drill string, vibrating mud pumps, bobbing work skiff,
// undulating water surface with foam spray rings, and Louisiana cypress shoreline.

export function build(THREE, scene, film, ctx) {
  const { B2T, toon } = ctx, n = {};
  const add = (m, name, role, o = {}) => {
    n[name] = (n[name] || 0) + 1;
    m.name = n[name] > 1 ? `${name}_${String(n[name]).padStart(2, '0')}` : name;
    m.userData.role = role;
    if (o.mat) m.userData.mat = o.mat;
    m.castShadow = o.cast ?? true;
    m.receiveShadow = true;
    (o.parent || scene).add(m);
    return m;
  };

  const box = (name, role, w, d, h, at, col, o = {}) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), toon(col));
    m.position.copy(B2T([at[0], at[1], at[2] + h / 2]));
    if (o.rot) m.rotation.y = o.rot;
    return add(m, name, role, o);
  };

  const cyl = (name, role, r, h, at, col, o = {}) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(o.r2 ?? r, r, h, o.seg ?? 16), toon(col));
    m.position.copy(B2T([at[0], at[1], at[2] + h / 2]));
    return add(m, name, role, o);
  };

  // 1. Water Surface (Shallow Louisiana Lake with Animated Depth)
  const waterGeo = new THREE.PlaneGeometry(160, 120, 32, 24);
  const waterMat = toon('#24594c');
  waterMat.transparent = true;
  waterMat.opacity = 0.92;
  const waterMesh = new THREE.Mesh(waterGeo, waterMat);
  waterMesh.rotation.x = -Math.PI / 2;
  waterMesh.position.set(0, -0.05, 10);
  waterMesh.receiveShadow = true;
  scene.add(waterMesh);

  // Animated Water Foam / Ripple Rings around the drill entry point
  const foamGroup = new THREE.Group();
  foamGroup.position.copy(B2T([0, 3.8, -0.02]));
  scene.add(foamGroup);
  for (let r = 0.8; r <= 3.2; r += 0.8) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(r - 0.12, r + 0.12, 32),
      new THREE.MeshBasicMaterial({ color: '#7ad1b8', side: THREE.DoubleSide, transparent: true, opacity: 0.6 })
    );
    ring.rotation.x = -Math.PI / 2;
    foamGroup.add(ring);
  }

  // 2. Oil Drilling Platform (Wilson Brothers Rig 20)
  // Substructure & Pilings into Lake Bed
  for (const px of [-5.5, 5.5]) {
    for (const py of [0.0, 8.0]) {
      cyl('derrick_leg', 'steel', 0.45, 8.0, [px, py, -5.0], '#3a3e47');
      box('leg_cross', 'steel', 0.25, 4.0, 0.25, [px, py - 1.5, -1.5], '#2d3038', { rot: 0.7 });
    }
  }

  // Steel Deck Floor
  box('derrick_deck_sub', 'steel', 13.0, 11.0, 0.3, [0, 4.0, 0.15], '#2c2f36');
  box('derrick_deck', 'steel', 12.4, 10.4, 0.35, [0, 4.0, 0.45], '#e59d3b', { mat: 'metal' });

  // Safety Handrails
  // FIX: the front rail was a solid 12.4 x 0.9 m box 1.5 m in front of the camera (a yellow wall that hid every character). Open rail: top bar + posts.
  box('rail_front', 'steel', 12.4, 0.08, 0.08, [0, -1.1, 1.6], '#f2bf38');
  for (let px = -6.0; px <= 6.0; px += 2.0) box('rail_post', 'steel', 0.08, 0.08, 0.9, [px, -1.1, 0.8], '#f2bf38');
  box('rail_back', 'steel', 12.4, 0.08, 0.9, [0, 9.1, 0.8], '#f2bf38');
  box('rail_left', 'steel', 0.08, 10.4, 0.9, [-6.1, 4.0, 0.8], '#f2bf38');
  box('rail_right', 'steel', 0.08, 10.4, 0.9, [6.1, 4.0, 0.8], '#f2bf38');

  // 3. 50-ft Lattice Steel Derrick Tower (Towering Structure)
  const mastGroup = new THREE.Group();
  scene.add(mastGroup);

  // Tower 4 Main Vertical Steel Corner Columns
  const m1 = cyl('mast_1', 'steel', 0.18, 18.0, [-1.8, 2.2, 1.0], '#d99436', { parent: mastGroup });
  const m2 = cyl('mast_2', 'steel', 0.18, 18.0, [1.8, 2.2, 1.0], '#d99436', { parent: mastGroup });
  const m3 = cyl('mast_3', 'steel', 0.18, 18.0, [-1.8, 5.8, 1.0], '#d99436', { parent: mastGroup });
  const m4 = cyl('mast_4', 'steel', 0.18, 18.0, [1.8, 5.8, 1.0], '#d99436', { parent: mastGroup });

  // Derrick Horizontal Cross Girders & Diagonal X-Bracing
  for (let tz = 3.0; tz <= 17.0; tz += 2.5) {
    box('derrick_brace_front', 'steel', 3.8, 0.15, 0.2, [0, 2.2, tz], '#a86718', { parent: mastGroup });
    box('derrick_brace_back', 'steel', 3.8, 0.15, 0.2, [0, 5.8, tz], '#a86718', { parent: mastGroup });
    box('derrick_brace_left', 'steel', 0.15, 3.8, 0.2, [-1.8, 4.0, tz], '#a86718', { parent: mastGroup });
    box('derrick_brace_right', 'steel', 0.15, 3.8, 0.2, [1.8, 4.0, tz], '#a86718', { parent: mastGroup });
  }

  // Crown Block at the apex of the tower
  box('crown_block', 'steel', 2.8, 2.8, 1.0, [0, 4.0, 18.5], '#454952', { parent: mastGroup });
  cyl('crown_sheave', 'steel', 0.6, 0.4, [0, 4.0, 19.2], '#e59d3b', { parent: mastGroup });

  // Traveling Block & Hook suspended inside the tower (Animated vertically)
  const travelingBlock = new THREE.Group();
  travelingBlock.position.copy(B2T([0, 3.8, 11.0]));
  scene.add(travelingBlock);
  const tbBody = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.6, 1.4), toon('#bf382c'));
  travelingBlock.add(tbBody);
  const tbHook = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.12, 12, 24, Math.PI * 1.3), toon('#3a3e47'));
  tbHook.position.set(0, -1.1, 0);
  travelingBlock.add(tbHook);

  // 4. Rotary Table & Active Drill String (ANIMATED)
  const rotaryTable = cyl('rotary_table', 'steel', 1.4, 0.45, [0, 3.8, 0.8], '#1b1d24');
  // Rotary drive teeth
  for (let a = 0; a < 8; a++) {
    const ang = (a / 8) * Math.PI * 2;
    box('rotary_lug', 'steel', 0.2, 0.2, 0.2, [Math.cos(ang) * 1.1, 3.8 + Math.sin(ang) * 1.1, 1.05], '#d99436', { parent: rotaryTable });
  }

  // 14-Inch Drill Pipe Assembly (Spinning & Reciprocating)
  const drillPipe = cyl('drill_pipe_hero', 'steel', 0.24, 20.0, [0, 3.8, -3.0], '#636c7a', { mat: 'metal' });
  // Hexagonal Kelly Bar at the top of the pipe
  box('kelly_bar', 'steel', 0.38, 0.38, 6.0, [0, 3.8, 6.0], '#d99436', { parent: drillPipe });

  // 5. Machinery on Deck (Animated Vibration)
  const mudPump = new THREE.Group();
  mudPump.position.copy(B2T([-3.8, 6.2, 0.8]));
  scene.add(mudPump);
  const pumpBody = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.8, 1.6), toon('#2d4d3d'));
  pumpBody.position.set(0, 0.8, 0);
  mudPump.add(pumpBody);
  const pumpFlywheel = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.3, 16), toon('#d99436'));
  pumpFlywheel.rotation.z = Math.PI / 2;
  pumpFlywheel.position.set(-1.5, 0.8, 0);
  mudPump.add(pumpFlywheel);

  // Diesel Generator with Exhaust Pipe
  const generator = new THREE.Group();
  generator.position.copy(B2T([3.8, 6.4, 0.8]));
  scene.add(generator);
  const genBody = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.6, 1.4), toon('#a6382e'));
  genBody.position.set(0, 0.7, 0);
  generator.add(genBody);
  const genExhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.8, 12), toon('#1c1e24'));
  genExhaust.position.set(0.8, 1.6, 0.4);
  generator.add(genExhaust);

  // Pipe Racks with spare 14-inch drill casings
  box('pipe_rack', 'steel', 1.8, 4.4, 0.8, [4.5, 1.8, 0.8], '#3a3e47');
  for (let py = 0.2; py <= 3.6; py += 0.8) {
    cyl('spare_pipe', 'steel', 0.18, 8.0, [4.5, py, 1.3], '#525a66', { rot: Math.PI / 2 });
  }

  // 6. Wooden Fishing Pier on Left
  box('pier_deck', 'wood', 3.2, 22.0, 0.25, [-15.0, 4.0, 0.25], '#614631', { mat: 'wood' });
  for (let py = -6.0; py <= 14.0; py += 3.5) {
    cyl('pier_piling_l', 'wood', 0.24, 4.5, [-16.3, py, -1.8], '#3b281b');
    cyl('pier_piling_r', 'wood', 0.24, 4.5, [-13.7, py, -1.8], '#3b281b');
  }

  // 7. Work Skiff tied to Platform (Bobbing on water)
  const skiff = new THREE.Group();
  skiff.position.copy(B2T([7.5, 1.2, 0.05]));
  scene.add(skiff);
  const skiffHull = new THREE.Mesh(new THREE.BoxGeometry(1.8, 4.5, 0.8), toon('#b8bcc4'));
  skiffHull.position.set(0, 0.3, 0);
  skiff.add(skiffHull);
  const skiffBench = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 0.15), toon('#4a3728'));
  skiffBench.position.set(0, 0.5, 0.2);
  skiff.add(skiffBench);
  const skiffMotor = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.9), toon('#1c1e24'));
  skiffMotor.position.set(0, -2.1, 0.5);
  skiff.add(skiffMotor);

  // 8. Louisiana Shoreline Cypress Trees in background
  for (let i = -8; i <= 8; i++) {
    const tx = i * 8.5;
    const ty = 32.0 + (Math.abs(i) % 4) * 2.5;
    cyl('cypress_trunk', 'wood', 0.75, 8.0, [tx, ty, 0.0], '#45382b');
    cyl('cypress_foliage_1', 'leaf', 4.2, 3.0, [tx, ty, 6.0], '#243d24', { seg: 8 });
    cyl('cypress_foliage_2', 'leaf', 3.0, 2.6, [tx, ty, 8.2], '#2e4f2e', { seg: 8 });
    cyl('cypress_foliage_3', 'leaf', 1.8, 2.2, [tx, ty, 10.2], '#3d693d', { seg: 8 });
  }

  // FIX: characters stand at z = 0 but the deck top was at z = 0.8, so they were buried. Lower the whole rig by LIFT so the deck top is z = 0.
  const LIFT = -0.8;
  for (const o of scene.children) if (/^(derrick_deck|rail_|derrick_brace|crown_block|rotary_table|drill_pipe|pipe_rack|spare_pipe|leg_cross|derrick_leg)/.test(o.name) || o === mastGroup || o === travelingBlock || o === mudPump || o === generator) o.position.y += LIFT;

  // CONTINUOUS ANIMATION HOOK
  return {
    update: (f, t, R) => {
      // 1. Rotary table spins continuously
      rotaryTable.rotation.y = t * 7.5;

      // 2. Drill pipe spins & feeds downward into the lake floor
      drillPipe.rotation.y = t * 14.0;
      drillPipe.position.y = -3.0 + LIFT - Math.min(2.5, t * 0.35);

      // 3. Traveling block lowers smoothly inside derrick mast
      travelingBlock.position.y = 11.0 + LIFT - Math.min(4.0, t * 0.55);

      // 4. Mud pump piston flywheel spins & body vibrates
      pumpFlywheel.rotation.x = t * 18.0;
      pumpBody.position.y = 0.8 + Math.sin(t * 26.0) * 0.012;

      // 5. Generator engine vibration
      genBody.position.y = 0.7 + Math.sin(t * 32.0) * 0.008;

      // 6. Skiff bobs and pitches on lake waves
      skiff.position.y = 0.05 + Math.sin(t * 2.8) * 0.045;
      skiff.rotation.z = Math.sin(t * 2.1) * 0.035;
      skiff.rotation.x = Math.cos(t * 1.7) * 0.025;

      // 7. Water foam ring ripples pulse & rotate
      foamGroup.rotation.y = -t * 3.5;
      foamGroup.children.forEach((c, idx) => {
        c.scale.setScalar(1.0 + Math.sin(t * 6.0 + idx * 1.2) * 0.12);
      });
    },
    anchors: {
      derrick: [0, 4.0, 0.8],
      drill: [0, 3.8, 1.0],
      skiff: [7.5, 1.2, 0.4]
    }
  };
}
