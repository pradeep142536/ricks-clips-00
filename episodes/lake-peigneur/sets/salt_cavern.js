// SET: Diamond Crystal Salt Mine (1,300ft Underground) — High-Detail Animated Edition
// Massive cathedral salt caverns, carved crystalline halite pillars, narrow-gauge ore tracks,
// electric mining carts, hanging industrial strip lamps, ceiling puncture with spinning 14-inch diamond drill,
// streaming high-pressure brine cascade, and floating crystalline dust particles.

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

  // 1. Salt Cavern Floor (Textured white halite bed)
  box('salt_floor', 'stone', 100, 60, 0.4, [0, 0, -0.4], '#e2e7eb', { cast: false, mat: 'salt' });

  // 2. Cathedral Salt Pillars (50ft tall carved salt monoliths)
  const saltCols = ['#edf2f6', '#dce3e8', '#cad4db'];
  for (const px of [-14.0, 0.0, 14.0]) {
    for (const py of [8.0, 22.0]) {
      const col = saltCols[(Math.abs(Math.floor(px + py))) % saltCols.length];
      box('salt_pillar', 'stone', 6.0, 6.0, 16.0, [px, py, 0.0], col, { mat: 'salt' });
      box('pillar_base', 'stone', 6.8, 6.8, 1.4, [px, py, 0.0], '#bcc7d1');
      box('pillar_capital', 'stone', 6.8, 6.8, 1.4, [px, py, 14.6], '#bcc7d1');
    }
  }

  // 3. Salt Mine Arched Ceiling (16m Overhead Vault)
  box('salt_ceiling', 'stone', 100, 60, 2.5, [0, 10.0, 16.0], '#cfd7de', { mat: 'salt' });

  // 4. Hero Puncture Site: 14-inch rotating drill bit penetrating ceiling
  const punctureSite = new THREE.Group();
  punctureSite.position.copy(B2T([2.0, 3.5, 14.0]));
  scene.add(punctureSite);

  // Ceiling rock fracture rim
  const fracRim = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.6, 0.8, 16), toon('#1a1d24'));
  punctureSite.add(fracRim);

  // 14-Inch Diamond Drill Bit (ANIMATED ROTATION & PUSH)
  const drillBit = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 3.5, 16), toon('#4b515c'));
  drillBit.position.set(0, -1.2, 0);
  punctureSite.add(drillBit);

  // Serrated Cutting Teeth on bit tip
  const drillTeeth = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.34, 0.6, 12), toon('#d99436'));
  drillTeeth.position.set(0, -2.6, 0);
  punctureSite.add(drillTeeth);

  // 5. Streaming High-Pressure Brine/Water Jet & Floor Splash (ANIMATED)
  const waterStream = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.22, 12.0, 12),
    new THREE.MeshBasicMaterial({ color: '#594029', transparent: true, opacity: 0.85 })
  );
  waterStream.position.copy(B2T([2.0, 3.5, 6.0]));
  scene.add(waterStream);

  // Floor water splash ring expanding
  const splashRing = new THREE.Mesh(
    new THREE.RingGeometry(0.3, 1.8, 24),
    new THREE.MeshBasicMaterial({ color: '#8c6b4d', side: THREE.DoubleSide, transparent: true, opacity: 0.7 })
  );
  splashRing.rotation.x = -Math.PI / 2;
  splashRing.position.copy(B2T([2.0, 3.5, 0.02]));
  scene.add(splashRing);

  // 6. Narrow Gauge Mining Rail Tracks
  box('rail_left', 'steel', 70.0, 0.08, 0.16, [0, 2.0, 0.0], '#3a3d45');
  box('rail_right', 'steel', 70.0, 0.08, 0.16, [0, 3.6, 0.0], '#3a3d45');
  for (let rx = -32.0; rx <= 32.0; rx += 1.8) {
    box('rail_tie', 'wood', 0.38, 2.2, 0.12, [rx, 2.8, -0.05], '#453528');
  }

  // 7. Electric Ore Carts
  box('ore_cart_body', 'metal', 3.2, 1.9, 1.3, [-3.2, 2.8, 0.3], '#782d24');
  box('ore_cart_rim', 'metal', 3.3, 2.0, 0.15, [-3.2, 2.8, 1.55], '#252830');
  for (const ox of [-0.9, 0.0, 0.9]) {
    box('salt_chunk', 'stone', 0.75, 0.75, 0.65, [-3.2 + ox, 2.8, 1.3], '#ffffff');
  }

  // 8. Overhead Industrial Strip Lamps (ANIMATED SWAY)
  const lampGroups = [];
  for (const lx of [-10.0, 0.0, 10.0]) {
    const lg = new THREE.Group();
    lg.position.copy(B2T([lx, 0.5, 14.0]));
    scene.add(lg);
    lampGroups.push(lg);

    const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 6.0, 8), toon('#1a1a1a'));
    cable.position.set(0, -3.0, 0);
    lg.add(cable);

    const fixture = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.35, 0.3), toon('#ffeb66'));
    fixture.position.set(0, -6.0, 0);
    lg.add(fixture);

    // Warm mining light cone on floor
    const spot = new THREE.Mesh(new THREE.CircleGeometry(4.5, 24), new THREE.MeshBasicMaterial({ color: '#ffea88', transparent: true, opacity: 0.12 }));
    spot.rotation.x = -Math.PI / 2;
    spot.position.copy(B2T([lx, 0.5, 0.01]));
    scene.add(spot);
  }

  // 9. Floating Crystalline Dust Particles
  const dustCount = 80;
  const dustGeo = new THREE.BufferGeometry();
  const dustPos = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    dustPos[i * 3 + 0] = (Math.random() - 0.5) * 20.0;
    dustPos[i * 3 + 1] = Math.random() * 6.0 + 0.5;
    dustPos[i * 3 + 2] = (Math.random() - 0.5) * 14.0;
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dustMat = new THREE.PointsMaterial({ color: '#ffffff', size: 0.12, transparent: true, opacity: 0.65 });
  const dustPoints = new THREE.Points(dustGeo, dustMat);
  scene.add(dustPoints);

  // CONTINUOUS ANIMATION HOOK
  return {
    update: (f, t, R) => {
      // 1. 14-inch drill bit spins at ceiling puncture & vibrates
      drillBit.rotation.y = t * 22.0;
      drillTeeth.rotation.y = t * 22.0;
      drillBit.position.x = (Math.random() - 0.5) * 0.02;

      // 2. Leaking brine water jet pulses & flows
      waterStream.scale.x = 1.0 + Math.sin(t * 18.0) * 0.18;
      waterStream.scale.z = 1.0 + Math.cos(t * 16.0) * 0.18;

      // 3. Floor splash ripple expands periodically
      const splashPhase = (t * 4.5) % 1.0;
      splashRing.scale.setScalar(0.8 + splashPhase * 2.2);
      splashRing.material.opacity = Math.max(0, 0.8 * (1.0 - splashPhase));

      // 4. Overhead mining lamps gently sway
      lampGroups.forEach((lg, idx) => {
        lg.rotation.z = Math.sin(t * 1.8 + idx * 1.3) * 0.04;
      });

      // 5. Crystalline dust motes gently drift
      const pos = dustGeo.attributes.position.array;
      for (let i = 0; i < dustCount; i++) {
        pos[i * 3 + 1] += Math.sin(t * 1.2 + i) * 0.003;
        pos[i * 3 + 0] += Math.cos(t * 0.9 + i) * 0.002;
      }
      dustGeo.attributes.position.needsUpdate = true;
    },
    anchors: {
      salt_cavern: [0, 2.0, 0.8],
      puncture: [2.0, 3.5, 14.0],
      ore_cart: [-3.2, 2.8, 0.8]
    }
  };
}
