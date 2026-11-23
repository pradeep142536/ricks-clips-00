// SET 3: DUSTY AMBUSH TRENCH (Campion Dam Ambush Site, November 1932)
// Dugout earth trench, burlap sandbag parapet, dry Outback scrub bushes,
// tripod-mounted Lewis machine gun overlooking open desert flats.

export async function build(THREE, scene, film, ctx) {
  const { B2T, toon } = ctx;
  const V = (x, y, z) => B2T([x, y, z]);
  const root = new THREE.Group();
  root.name = 'ambush_trench';

  if (ctx.sky?.clouds) ctx.sky.clouds({
    kind: ctx.place?.sky_kind || 'clear-day',
    seed: 1932,
    coverage: 0.15,
    scale: 1.1,
    sunDir: [0.4, 0.7, 0.4]
  });

  const RL = (kind, c, o = {}) => ctx.relief ? ctx.relief(kind, c, o) : toon(c);
  const MT = (kind, o = {}) => ctx.pbr ? ctx.pbr.metal(kind, o) : toon(o.toon || o.color || '#3c4470');

  const M = {
    redSoil: RL('stone', '#9c4322', { scale: 1.5 }),
    trenchWall: RL('stone', '#75331a', { scale: 1.2 }),
    sandbag: RL('cloth', '#b89f74', { scale: 0.9 }),
    sandbagDark: RL('cloth', '#9c845c', { scale: 0.9 }),
    scrubDry: new THREE.MeshStandardMaterial({ color: 0x6e633d, roughness: 0.95, metalness: 0.05 }),
    lewisSteel: MT('steel', { color: '#1a1b1f', rough: 0.35, toon: '#16171b' }),
    brassCartridge: MT('bronze', { color: '#d4aa3b', rough: 0.25, toon: '#b89228' }),
    woodTrenchPlank: RL('wood', '#5c3e24', { scale: 1.0 })
  };

  const add = (geo, mat, name, role, p, parent = root) => {
    const m = new THREE.Mesh(geo, mat);
    m.name = name;
    m.userData.role = role;
    if (p) m.position.copy(p);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  };

  const box = (w, d, h, x, y, z, mat, name, role = 'prop') => {
    return add(new THREE.BoxGeometry(w, h, d), mat, name, role, V(x, y, z + h / 2));
  };

  // 1. Surrounding Desert Ground
  const groundGeo = new THREE.PlaneGeometry(36, 36);
  const ground = add(groundGeo, M.redSoil, 'desert_surface', 'ground', V(0, 0, 0.75));
  ground.rotation.x = -Math.PI / 2;

  // 2. Sunken Trench Floor (-0.75m deep)
  const trenchFloor = add(new THREE.PlaneGeometry(8, 2.5), M.woodTrenchPlank, 'trench_duckboard_floor', 'ground', V(0, -0.6, 0.0));
  trenchFloor.rotation.x = -Math.PI / 2;

  // Trench Earth Back Wall
  box(8.2, 0.5, 0.95, 0.0, -1.85, 0.0, M.trenchWall, 'trench_back_berm', 'stone');

  // 3. Sandbag Parapet Wall (2 tiers of sandbags stacked at the parapet edge)
  const sandbagGeo = new THREE.BoxGeometry(0.55, 0.28, 0.18);
  for (let sx = -3.8; sx <= 3.8; sx += 0.52) {
    // Tier 1
    const b1 = add(sandbagGeo, (Math.abs(sx) % 1.0 > 0.4 ? M.sandbag : M.sandbagDark), `sandbag_t1_${sx}`, 'cloth', V(sx, 0.65, 0.85));
    b1.rotation.y = (Math.sin(sx * 4) * 0.12);
    // Tier 2
    const b2 = add(sandbagGeo, (Math.abs(sx) % 1.0 > 0.4 ? M.sandbagDark : M.sandbag), `sandbag_t2_${sx}`, 'cloth', V(sx + 0.26, 0.68, 1.02));
    b2.rotation.y = -(Math.sin(sx * 4) * 0.12);
  }

  // 4. Ground-Mounted Lewis Machine Gun on Sandbags
  const gunRoot = new THREE.Group();
  gunRoot.name = 'ambush_lewis_gun';
  gunRoot.position.copy(V(0.0, 0.6, 1.15));

  // Barrel shroud resting on sandbag
  const shroud = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.95, 12), M.lewisSteel);
  shroud.rotation.x = Math.PI / 2;
  shroud.position.set(0, 0, -0.35);
  gunRoot.add(shroud);

  // Muzzle cone
  const muzzle = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.12, 12), M.lewisSteel);
  muzzle.rotation.x = -Math.PI / 2;
  muzzle.position.set(0, 0, -0.85);
  gunRoot.add(muzzle);

  // Receiver & Top Drum Magazine
  const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.38), M.lewisSteel);
  receiver.position.set(0, 0, 0.12);
  gunRoot.add(receiver);

  const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.05, 16), M.lewisSteel);
  drum.position.set(0, 0.09, 0.06);
  gunRoot.add(drum);

  // Spade grip
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.16, 8), M.lewisSteel);
  grip.position.set(0, -0.02, 0.34);
  gunRoot.add(grip);

  // Scattered spent brass cartridges
  for (let i = 0; i < 12; i++) {
    const cx = -0.35 + (i * 0.06) + (Math.sin(i * 3) * 0.05);
    const cy = 0.45 + (Math.cos(i * 2) * 0.1);
    const cart = add(new THREE.CylinderGeometry(0.012, 0.012, 0.055, 6), M.brassCartridge, `spent_brass_${i}`, 'metal', V(cx, cy, 0.88));
    cart.rotation.z = Math.PI / 2 + (i * 0.3);
  }

  root.add(gunRoot);

  // 5. Desert Scrub Tufts (Foreground / Parapet flanking)
  const scrubGeo = new THREE.DodecahedronGeometry(0.35, 0);
  const scrubPositions = [[-2.5, 1.2], [2.2, 1.4], [-4.2, 0.8], [4.5, 0.9]];
  scrubPositions.forEach(([sx, sy], idx) => {
    add(scrubGeo, M.scrubDry, `desert_scrub_${idx}`, 'plant', V(sx, sy, 0.85));
  });

  scene.add(root);
  return {
    anchors: {
      gunner_stand: V(-0.3, -0.4, 0.0),
      officer_stand: V(1.2, -0.5, 0.0),
      aim_direction: V(0.0, 8.0, 1.1)
    }
  };
}
