// SET S2: THE 25-FOOT MOLASSES TSUNAMI WAVE & ELEVATED TRAIN COLLAPSE
// Built with Kit3D PBR steel, procedural curling wave mesh, shattered el-train girders, and debris.

export async function build(THREE, scene, film, ctx) {
  const { B2T, toon } = ctx;
  const V = (x, y, z) => B2T([x, y, z]);
  const root = new THREE.Group();
  root.name = 'molasses_wave';

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

  const box = (w, d, h, x, y, z, mat, name, role = 'metal', yaw = 0, roll = 0, pitch = 0) => {
    const m = add(new THREE.BoxGeometry(w, h, d), mat, name, role, V(x, y, z + h / 2));
    m.rotation.y = yaw;
    m.rotation.z = roll;
    m.rotation.x = pitch;
    return m;
  };

  const RL = (kind, c, o = {}) => ctx.relief ? ctx.relief(kind, c, o) : toon(c);
  const MT = (kind, o = {}) => ctx.pbr ? ctx.pbr.metal(kind, o) : toon(o.toon || o.color || '#3c4470');

  const M = {
    cobble: RL('stone', '#38332f', { scale: 1.5 }),
    steelBeam: MT('steel', { color: '#2d3340', rough: 0.35, rust: 0.15, toon: '#252936' }),
    tankTorn: MT('iron', { color: '#32231b', rough: 0.45, rust: 0.3, toon: '#2e1c14' }),
    rivetFlying: MT('steel', { color: '#e6a440', rough: 0.2, toon: '#e69030' }),
    waveDeep: new THREE.MeshStandardMaterial({ color: 0x140602, roughness: 0.06, metalness: 0.3 }),
    waveFoam: new THREE.MeshStandardMaterial({ color: 0x4a2a18, roughness: 0.25, metalness: 0.1 }),
    woodSplinter: RL('wood', '#784d2b', { scale: 0.9 }),
    dustSmoke: new THREE.MeshBasicMaterial({ color: 0x6e6258, transparent: true, opacity: 0.35 })
  };

  // 1. Cobblestone ground
  const streetGeo = new THREE.PlaneGeometry(36, 36);
  const street = add(streetGeo, M.cobble, 'street_ground', 'ground', V(0, 0, 0));
  street.rotation.x = -Math.PI / 2;

  // 2. Ruptured Tank Fragments (Background: x = 6 to 10, y = 4 to 8)
  // Exploded curved steel sheets peeled back like shrapnel
  for (let i = 0; i < 4; i++) {
    const plateGeo = new THREE.BoxGeometry(0.15, 3.5, 6.0);
    const ang = -0.5 + i * 0.4;
    const px = 7.0 + Math.sin(ang) * 2.0;
    const py = 5.0 + Math.cos(ang) * 2.0;
    const pMesh = add(plateGeo, M.tankTorn, `torn_plate_${i}`, 'metal', V(px, py, 3.0));
    pMesh.rotation.y = ang + 0.3;
    pMesh.rotation.z = (i % 2 === 0 ? 0.35 : -0.28);
  }

  // 3. THE 25-FOOT CURLING MOLASSES WAVE FRONT (7.5 meters tall)
  // Procedural wave shape rolling forward from East to West (Y = 2 to -2, X = 4 to -4)
  const waveW = 16.0;
  const waveH = 7.5;
  const waveSegments = 32;

  // Custom extruded curved wave geometry
  const waveShape = new THREE.Shape();
  waveShape.moveTo(-4.0, 0.0);
  waveShape.lineTo(3.5, 0.0);
  // Forward curl of the surge
  waveShape.quadraticCurveTo(2.8, 4.5, 0.5, 6.8);
  waveShape.quadraticCurveTo(-0.6, 7.8, -1.8, 7.2);
  waveShape.quadraticCurveTo(-0.8, 5.8, 0.2, 5.0);
  waveShape.quadraticCurveTo(-1.5, 2.5, -4.0, 0.0);

  const extrudeSettings = {
    steps: 1,
    depth: waveW,
    bevelEnabled: true,
    bevelThickness: 0.6,
    bevelSize: 0.4,
    bevelSegments: 4
  };
  const waveGeo = new THREE.ExtrudeGeometry(waveShape, extrudeSettings);
  const waveMesh = add(waveGeo, M.waveDeep, 'molasses_tidal_wave', 'liquid', V(0.0, -waveW / 2, 0.0));
  waveMesh.rotation.y = Math.PI / 2; // Orient surge across the street

  // Frothing, churning syrup crest layer
  const crestGeo = new THREE.CylinderGeometry(0.8, 1.4, waveW + 1.0, 16);
  const crestMesh = add(crestGeo, M.waveFoam, 'wave_froth_crest', 'liquid', V(-1.2, 0.0, 7.1));
  crestMesh.rotation.x = Math.PI / 2;

  // 4. ATLANTIC AVENUE ELEVATED TRAIN GIRDER COLLAPSE
  // Steel trestle pillars and bent I-beams framed safely in the midground/background
  // Upright girder pillar (standing)
  box(0.5, 0.5, 7.0, -4.8, -3.0, 0.0, M.steelBeam, 'el_pillar_standing', 'metal');
  box(0.5, 0.5, 7.0, -4.8, 4.0, 0.0, M.steelBeam, 'el_pillar_standing_north', 'metal');

  // Sheared / bent girder pillar (bent at 35 degrees by the wave force, placed in the background)
  const shearedPillar = box(0.45, 0.45, 6.5, -3.8, 2.5, 0.0, M.steelBeam, 'el_pillar_bent', 'metal', 0.2, 0.35);

  // Heavy steel cross girder track bed buckling downward
  const buckledBed = box(1.0, 9.0, 0.5, -4.2, 0.5, 6.2, M.steelBeam, 'el_track_bed_buckled', 'metal', 0.1, -0.18);

  // Dangling rail tracks
  box(0.12, 10.0, 0.18, -2.5, 0.0, 6.6, M.steelBeam, 'el_rail_1', 'metal', 0.1, -0.25);
  box(0.12, 10.0, 0.18, -3.1, 0.0, 6.6, M.steelBeam, 'el_rail_2', 'metal', 0.1, -0.25);

  // 5. Flying Rivets & Debris Projectiles (The "Machine Gun" Rivet Burst)
  const rivetSeeds = [
    [-1.2, 1.8, 4.2], [-0.5, -2.2, 5.0], [0.8, 0.4, 6.1],
    [-2.0, 2.5, 3.5], [-1.5, -1.2, 4.8], [0.2, -3.0, 5.5],
    [-2.6, 0.8, 2.8], [-0.8, 3.2, 6.0]
  ];
  for (let idx = 0; idx < rivetSeeds.length; idx++) {
    const [rx, ry, rz] = rivetSeeds[idx];
    const rGeo = new THREE.SphereGeometry(0.14, 8, 8);
    const rMesh = add(rGeo, M.rivetFlying, `shrapnel_rivet_${idx}`, 'metal', V(rx, ry, rz));

    // Motion streak behind high-speed rivet
    const streakGeo = new THREE.CylinderGeometry(0.04, 0.01, 1.2, 6);
    const streakMesh = add(streakGeo, M.rivetFlying, `rivet_streak_${idx}`, 'fx', V(rx + 0.6, ry, rz));
    streakMesh.rotation.z = Math.PI / 2;
  }

  // 6. Smashed Wooden Wagon and Building Kindling in the Wave
  // Splintered timber beams tumbling in the syrup
  box(0.2, 2.8, 0.2, -0.5, 1.5, 3.8, M.woodSplinter, 'broken_timber_1', 'wood', 0.5, 0.35, -0.4);
  box(0.25, 2.4, 0.15, -1.0, -1.8, 4.2, M.woodSplinter, 'broken_timber_2', 'wood', -0.3, -0.5, 0.6);
  // Broken wagon wheel protruding from wave
  const wheelGeo = new THREE.TorusGeometry(0.7, 0.08, 8, 16);
  const wheelMesh = add(wheelGeo, M.woodSplinter, 'smashed_wagon_wheel', 'wood', V(-1.1, 0.5, 4.5));
  wheelMesh.rotation.x = 0.8;
  wheelMesh.rotation.y = 0.4;

  scene.add(root);
  return {
    anchors: {
      wave_crest: V(-1.2, 0.0, 7.1),
      street_escape: V(-4.8, 0.0, 0.0),
      el_trestle: V(-2.8, 0.0, 6.2)
    }
  };
}
