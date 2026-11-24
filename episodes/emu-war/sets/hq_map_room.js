// SET 5: MILITARY HEADQUARTERS MAP ROOM (Perth, October 1932)
// Australian Army HQ: warm tungsten pendant lamp, tactical battle map of Western Australia,
// brass magnifying glass, telegraph transceiver, timber plotting table, and officer chairs.

export async function build(THREE, scene, film, ctx) {
  const { B2T, toon, pbr, relief } = ctx;
  const V = (x, y, z) => B2T([x, y, z]);
  const root = new THREE.Group();
  root.name = 'hq_map_room';

  const RL = (kind, c, o = {}) => relief ? relief(kind, c, o) : toon(c);
  const MT = (kind, o = {}) => pbr ? pbr.metal(kind, o) : toon(o.toon || o.color || '#3c4470');

  const M = {
    floorWood: RL('wood', '#523824', { scale: 1.2 }),
    wallPlaster: RL('plaster', '#8a7d6b', { scale: 1.6 }),
    tableOak: RL('wood', '#68482e', { scale: 1.0 }),
    mapPaper: new THREE.MeshStandardMaterial({ color: 0xdec89e, roughness: 0.85, metalness: 0.0 }),
    mapInk: new THREE.MeshBasicMaterial({ color: 0x5a2a22 }),
    brassLamp: MT('brass', { color: '#d8aa32', rough: 0.28, toon: '#c09628' }),
    lampShadeGreen: new THREE.MeshStandardMaterial({ color: 0x1e4828, roughness: 0.35, metalness: 0.1 }),
    lampGlow: new THREE.MeshBasicMaterial({ color: 0xfff0b8 }),
    contactAO: new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.55 })
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

  const box = (w, d, h, x, y, z, mat, name, role = 'prop', parent = root) => {
    return add(new THREE.BoxGeometry(w, h, d), mat, name, role, V(x, y, z + h / 2), parent);
  };

  // 1. HARDWOOD FLOOR & OFFICE WALLS
  box(16, 14, 0.1, 0, 3, -0.05, M.floorWood, 'hq_wood_floor', 'ground');
  box(16, 0.3, 4.8, 0, 8.5, 0, M.wallPlaster, 'hq_back_wall', 'wood');
  box(0.3, 14, 4.8, -7.5, 3, 0, M.wallPlaster, 'hq_left_wall', 'wood');
  box(0.3, 14, 4.8, 7.5, 3, 0, M.wallPlaster, 'hq_right_wall', 'wood');

  // 2. LARGE PLOTTING TABLE & CHAIRS
  box(2.8, 1.8, 0.08, 0.0, 1.2, 0.82, M.tableOak, 'plotting_table_top', 'wood');
  // 4 Table legs
  for (const lx of [-1.25, 1.25]) {
    for (const ly of [0.45, 1.95]) {
      box(0.10, 0.10, 0.82, lx, ly, 0.0, M.tableOak, `table_leg_${lx}_${ly}`, 'wood');
    }
  }

  // 3. TACTICAL MILITARY MAP OF CAMPION WHEATBELT
  const mapMesh = add(new THREE.PlaneGeometry(2.2, 1.4), M.mapPaper, 'campion_tactical_map', 'prop', V(0.0, 1.2, 0.87));
  mapMesh.rotation.x = -Math.PI / 2;

  // Red and blue tactical map arrows / markers
  box(0.4, 0.08, 0.01, -0.4, 1.1, 0.88, M.mapInk, 'tactical_marker_1', 'prop');
  box(0.08, 0.35, 0.01, 0.3, 1.3, 0.88, M.mapInk, 'tactical_marker_2', 'prop');

  // Brass Magnifying Glass on Table
  const glassRim = add(new THREE.TorusGeometry(0.11, 0.018, 8, 20), M.brassLamp, 'magnifying_rim', 'metal', V(0.65, 0.9, 0.89));
  glassRim.rotation.x = Math.PI / 2;
  const glassHandle = add(new THREE.CylinderGeometry(0.014, 0.014, 0.22, 8), M.tableOak, 'magnifying_handle', 'wood', V(0.65, 0.72, 0.89));
  glassHandle.rotation.x = Math.PI / 2;

  // 4. WARM OVERHEAD PENDANT SHADE LAMP (Direct dramatic lighting pool)
  const lampCord = add(new THREE.CylinderGeometry(0.008, 0.008, 2.2, 6), M.brassLamp, 'lamp_cord', 'metal', V(0.0, 1.2, 3.2));
  const lampShade = add(new THREE.ConeGeometry(0.48, 0.28, 16, 1, true), M.lampShadeGreen, 'lamp_shade', 'prop', V(0.0, 1.2, 2.2));
  lampShade.rotation.x = Math.PI;
  const lampBulb = add(new THREE.SphereGeometry(0.09, 12, 8), M.lampGlow, 'lamp_glowing_bulb', 'lamp', V(0.0, 1.2, 2.12));

  // Light pool on table
  const lightPool = add(new THREE.CircleGeometry(1.6, 24), new THREE.MeshBasicMaterial({ color: 0xffecb0, transparent: true, opacity: 0.18 }), 'table_light_pool', 'fx', V(0.0, 1.2, 0.88));
  lightPool.rotation.x = -Math.PI / 2;

  // 5. CONTACT AO SHADOWS
  const meredithAO = add(new THREE.PlaneGeometry(0.7, 0.35), M.contactAO, 'meredith_hq_ao', 'shadow', V(-0.6, 0.1, 0.01));
  meredithAO.rotation.x = -Math.PI / 2;
  const farmerAO = add(new THREE.PlaneGeometry(0.7, 0.35), M.contactAO, 'farmer_hq_ao', 'shadow', V(0.6, 0.1, 0.01));
  farmerAO.rotation.x = -Math.PI / 2;

  scene.add(root);

  return {
    anchors: {
      meredith_hq: V(-0.6, 0.1, 0.0),
      farmer_hq: V(0.6, 0.1, 0.0),
      table_spot: V(0.0, 1.2, 0.87)
    }
  };
}
