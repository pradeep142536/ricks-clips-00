// SET S4: BOSTON HARBOR & FIREBOAT SALTWATER CLEANUP
// Timber wharf pier, brown molasses-stained harbor water, fireboat Engine 31, and high-pressure hose jets.

export async function build(THREE, scene, film, ctx) {
  const { B2T, toon } = ctx;
  const V = (x, y, z) => B2T([x, y, z]);
  const root = new THREE.Group();
  root.name = 'harbor_clean';
  if (ctx.sky?.clouds) ctx.sky.clouds({
    kind: ctx.place?.sky_kind || 'clear-day',
    seed: 1919,
    coverage: 0.62,
    scale: 1.0,
    cirrus: true,
    sunDir: [0.25, 0.8, -0.2]
  });

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

  const box = (w, d, h, x, y, z, mat, name, role = 'wood', yaw = 0, roll = 0, pitch = 0) => {
    const m = add(new THREE.BoxGeometry(w, h, d), mat, name, role, V(x, y, z + h / 2));
    m.rotation.y = yaw;
    m.rotation.z = roll;
    m.rotation.x = pitch;
    return m;
  };

  const RL = (kind, c, o = {}) => ctx.relief ? ctx.relief(kind, c, o) : toon(c);
  const MT = (kind, o = {}) => ctx.pbr ? ctx.pbr.metal(kind, o) : toon(o.toon || o.color || '#3c4470');

  const M = {
    pierPlank: RL('wood', '#584332', { scale: 1.2 }),
    pierTimber: RL('wood', '#3c2c20', { scale: 1.0 }),
    harborBrownWater: new THREE.MeshStandardMaterial({ color: 0x22130a, roughness: 0.12, metalness: 0.4 }),
    harborFoam: new THREE.MeshStandardMaterial({ color: 0x8a705a, roughness: 0.35, metalness: 0.1 }),
    fireboatHull: MT('iron', { color: '#82241d', rough: 0.38, toon: '#781c16' }),
    fireboatWhite: MT('iron', { color: '#e4dec8', rough: 0.4, toon: '#d8d2bc' }),
    brassMonitor: MT('brass', { color: '#d8a436', rough: 0.22, toon: '#d29a28' }),
    waterJet: new THREE.MeshBasicMaterial({ color: 0xd8eeff, transparent: true, opacity: 0.8 }),
    waterSpray: new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 }),
    canvasHose: new THREE.MeshStandardMaterial({ color: 0xc4b494, roughness: 0.75 }),
    bollardIron: MT('iron', { color: '#1a1b20', rough: 0.3, toon: '#18191e' })
  };

  // 1. TIMBER WHARF PIER (Left half: X = -10 to -0.5, Z = 1.2 above water)
  // Pier deck planks
  box(9.5, 30.0, 0.25, -5.2, 0.0, 1.2, M.pierPlank, 'pier_deck', 'wood');

  // Heavy timber pilings driven into harbor mud
  for (let py = -12.0; py <= 12.0; py += 3.0) {
    const pileGeo = new THREE.CylinderGeometry(0.24, 0.28, 3.8, 10);
    add(pileGeo, M.pierTimber, `piling_outer_${py}`, 'wood', V(-0.6, py, 0.6));
    add(pileGeo, M.pierTimber, `piling_inner_${py}`, 'wood', V(-5.0, py, 0.6));
    add(pileGeo, M.pierTimber, `piling_shore_${py}`, 'wood', V(-9.2, py, 0.6));

    // Cross-braces
    box(0.18, 2.9, 0.18, -0.6, py + 1.5, 0.4, M.pierTimber, `cross_brace_${py}`, 'wood', 0, 0.35);
  }

  // Cast iron mooring bollards along pier edge (clear of camera zone Y in [-3.5, 1.0])
  for (let by of [-8.0, -5.0, 3.5, 9.0]) {
    const bollardGeo = new THREE.CylinderGeometry(0.18, 0.16, 0.7, 10);
    add(bollardGeo, M.bollardIron, `bollard_${by}`, 'metal', V(-0.7, by, 1.55));
    const bollardCapGeo = new THREE.SphereGeometry(0.22, 10, 8);
    add(bollardCapGeo, M.bollardIron, `bollard_cap_${by}`, 'metal', V(-0.7, by, 1.9));
  }

  // 2. BROWN MOLASSES-STAINED BOSTON HARBOR WATER
  // The water line sits at Z = 0.0
  const oceanGeo = new THREE.PlaneGeometry(36, 36);
  const ocean = add(oceanGeo, M.harborBrownWater, 'molasses_stained_harbor', 'liquid', V(0, 0, 0.0));
  ocean.rotation.x = -Math.PI / 2;

  // Foamy churning syrup-water boundary along the pier
  const foamGeo = new THREE.PlaneGeometry(2.2, 30.0);
  const foam = add(foamGeo, M.harborFoam, 'harbor_foam_strip', 'liquid', V(0.4, 0.0, 0.02));
  foam.rotation.x = -Math.PI / 2;

  // 3. BOSTON FIREBOAT "ENGINE 31" (Moored at the wharf: X = 3.5, Y = 0.0)
  // Steel red-painted hull
  box(4.5, 14.0, 1.8, 4.0, 0.0, -0.2, M.fireboatHull, 'fireboat_hull', 'metal');
  // Bow taper
  box(3.2, 4.0, 1.8, 4.0, 7.5, -0.2, M.fireboatHull, 'fireboat_bow', 'metal', 0.2);
  // White wheelhouse & cabin
  box(3.2, 5.5, 2.0, 3.8, -1.0, 1.6, M.fireboatWhite, 'fireboat_cabin', 'metal');
  // Fireboat smokestack
  const stackGeo = new THREE.CylinderGeometry(0.4, 0.45, 2.4, 12);
  add(stackGeo, M.fireboatHull, 'fireboat_smokestack', 'metal', V(3.8, -2.5, 3.4));

  // 4. BRASS HIGH-PRESSURE DECK WATER MONITORS (Deluge Guns)
  const monitor = (x, y, z, aimAng = -0.5) => {
    // Pedestal
    const pedGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.9, 10);
    add(pedGeo, M.brassMonitor, 'monitor_pedestal', 'metal', V(x, y, z + 0.45));
    // Brass barrel nozzle
    const nozGeo = new THREE.CylinderGeometry(0.12, 0.07, 1.6, 10);
    const noz = add(nozGeo, M.brassMonitor, 'monitor_nozzle', 'metal', V(x, y, z + 1.1));
    noz.rotation.y = aimAng;
    noz.rotation.z = -0.6;

    // High pressure arcing seawater jet stream aimed low into the water/docks
    const jetGeo = new THREE.CylinderGeometry(0.04, 0.25, 6.0, 10);
    const jet = add(jetGeo, M.waterJet, 'seawater_jet_stream', 'fx', V(x - 2.5, y + 0.8, z + 0.6));
    jet.rotation.y = aimAng;
    jet.rotation.z = 0.5; // Angled down toward harbor water

    // Foaming splash cloud at contact point in the water
    const splashGeo = new THREE.SphereGeometry(1.2, 10, 8);
    add(splashGeo, M.waterSpray, 'seawater_spray_impact', 'fx', V(x - 4.5, y + 1.5, 0.3));
  };
  monitor(3.2, 2.5, 1.6, -0.4);
  monitor(3.2, -2.5, 1.6, -0.3);

  // 5. Heavy Canvas Fire Hoses Snaking Across the Wharf
  const hoseSpline = [
    [-0.5, 2.8, 1.34], [-2.0, 1.8, 1.34], [-3.8, 0.5, 1.34],
    [-4.5, -2.0, 1.34], [-5.5, -4.5, 1.34]
  ];
  for (let i = 0; i < hoseSpline.length - 1; i++) {
    const [x1, y1, z1] = hoseSpline[i];
    const [x2, y2, z2] = hoseSpline[i + 1];
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    const ang = Math.atan2(dy, dx);
    const hGeo = new THREE.CylinderGeometry(0.07, 0.07, len, 8);
    const hMesh = add(hGeo, M.canvasHose, `canvas_hose_seg_${i}`, 'cloth', V((x1 + x2) / 2, (y1 + y2) / 2, 1.35));
    hMesh.rotation.y = -ang;
    hMesh.rotation.z = Math.PI / 2;
  }

  scene.add(root);
  return {
    anchors: {
      dock_station: V(-2.5, 0.0, 1.33),
      fireboat_deck: V(2.2, 0.0, 1.6),
      harbor_edge: V(-0.6, 0.0, 1.33)
    }
  };
}
