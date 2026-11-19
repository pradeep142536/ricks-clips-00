// SET: 3D Technical Cutaway Diagram / Subterranean Transition (1980)
// High-detail 3D cross-section schematic illustrating the drilling operation penetrating
// 1,300 feet of Earth strata: Lake Peigneur surface, soft lakebed silt, clay beds,
// anhydrite caprock, and the giant Diamond Crystal Salt Dome.

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

  // 1. Dark Technical Grid Studio
  box('studio_floor', 'grid', 60, 40, 0.2, [0, 0, -2.5], '#0a0e17', { cast: false });
  for (let gx = -16.0; gx <= 16.0; gx += 4.0) {
    box('grid_line_x', 'line', 0.05, 30.0, 0.02, [gx, 4.0, -2.48], '#162238', { cast: false });
  }

  // 2. 3D Cutaway Geologic Strata Block
  // Layer 1: Lake Water (Green-blue sheet at top)
  const lakeWater = box('schematic_lake', 'water', 16.0, 1.8, 0.5, [0, 4.0, 5.0], '#2d8c75', { mat: 'water' });

  // Layer 2: Lakebed Silt (Soft brown muck)
  box('schematic_silt', 'earth', 16.0, 1.8, 1.2, [0, 4.0, 3.8], '#4a382a');

  // Layer 3: Dense Clay & Sandstone (Ochre and rust strata)
  box('schematic_clay', 'earth', 16.0, 1.8, 1.6, [0, 4.0, 2.2], '#8c5a32');

  // Layer 4: Hard Anhydrite Caprock (Dark stone barrier)
  box('schematic_caprock', 'stone', 16.0, 1.8, 0.9, [0, 4.0, 1.3], '#52504d');

  // Layer 5: Giant Rock Salt Dome (1,300ft Underground — Crystalline Halite)
  box('schematic_salt_dome', 'salt', 16.0, 1.8, 4.5, [0, 4.0, -3.2], '#edf3f7', { mat: 'salt' });

  // Strata depth indicator lines on side of block
  for (let dz = 4.8; dz >= -3.0; dz -= 1.2) {
    box('depth_stripe', 'line', 16.1, 0.05, 0.06, [0, 3.08, dz], '#ffffff', { cast: false });
  }

  // 3. The 14-Inch Drill Path (Glowing Red Trajectory Vector)
  const drillPathGroup = new THREE.Group();
  drillPathGroup.position.copy(B2T([1.2, 3.9, 5.0]));
  scene.add(drillPathGroup);

  const drillLineMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.12, 1.0, 16),
    new THREE.MeshBasicMaterial({ color: '#ff3333' })
  );
  drillLineMesh.position.set(0, -0.5, 0);
  drillPathGroup.add(drillLineMesh);

  const drillArrow = new THREE.Mesh(
    new THREE.ConeGeometry(0.35, 0.7, 16),
    new THREE.MeshBasicMaterial({ color: '#ff1111' })
  );
  drillArrow.rotation.x = Math.PI;
  drillArrow.position.set(0, -1.0, 0);
  drillPathGroup.add(drillArrow);

  // 4. Salt Mine Cavern Void & Dissolution Whirlpool
  cyl('dissolved_void', 'void', 3.2, 2.8, [1.2, 4.0, -1.8], '#150805');
  
  // Swirling Blue Water Vectors inside the salt mine cavity
  const flowGroup = new THREE.Group();
  flowGroup.position.copy(B2T([1.2, 4.0, -1.8]));
  scene.add(flowGroup);

  for (let va = 0; va < 6; va++) {
    const vang = (va / 6) * Math.PI * 2;
    const vx = Math.cos(vang) * 1.8;
    const vz = Math.sin(vang) * 1.0;
    const arrow = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.12, 0.12),
      new THREE.MeshBasicMaterial({ color: '#00ccff' })
    );
    arrow.position.set(vx, 0, vz);
    arrow.rotation.y = vang + 0.8;
    flowGroup.add(arrow);
  }

  // 5. Technical Callout Plates & Depth Readout
  box('plate_surface', 'metal', 4.5, 0.08, 0.7, [5.2, 3.9, 5.0], '#182233');
  box('plate_1300ft', 'metal', 5.5, 0.08, 0.7, [-5.2, 3.9, -1.8], '#182233');

  // CONTINUOUS ANIMATION HOOK
  return {
    update: (f, t, R) => {
      // 1. Drill trajectory extends downward continuously from surface to salt dome
      const progress = Math.min(1.0, Math.max(0.05, (t - 6.0) / 2.2));
      const totalDepth = 7.0; // penetrates 7 units into the model
      const currentDepth = totalDepth * progress;
      drillLineMesh.scale.set(1.0, currentDepth, 1.0);
      drillLineMesh.position.set(0, -currentDepth / 2, 0);
      drillArrow.position.set(0, -currentDepth - 0.35, 0);

      // 2. Swirling water flow vectors inside the underground cavity spin rapidly
      flowGroup.rotation.y = t * 6.5;

      // 3. Drill arrow glow pulses
      drillArrow.material.color.setHex((Math.floor(t * 8) % 2 === 0) ? 0xff2222 : 0xff6666);
    },
    anchors: {
      diagram: [0, 4.0, 1.5],
      drill_tip: [1.2, 3.9, -1.8]
    }
  };
}
