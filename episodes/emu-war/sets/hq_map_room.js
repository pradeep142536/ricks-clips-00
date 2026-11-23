// SET 2: MILITARY HQ MAP ROOM (Royal Australian Artillery Field Headquarters)
// Warm tungsten lamp light, large tactical map planning table with Western Australia maps,
// wooden officer chairs, green banker lamp, filing cabinets, corkboard with military orders.

export async function build(THREE, scene, film, ctx) {
  const { B2T, toon } = ctx;
  const V = (x, y, z) => B2T([x, y, z]);
  const root = new THREE.Group();
  root.name = 'hq_map_room';

  const RL = (kind, c, o = {}) => ctx.relief ? ctx.relief(kind, c, o) : toon(c);
  const MT = (kind, o = {}) => ctx.pbr ? ctx.pbr.metal(kind, o) : toon(o.toon || o.color || '#3c4470');

  const M = {
    woodFloor: RL('wood', '#4a331e', { scale: 1.3 }),
    plasterWall: RL('stone', '#c7beaf', { scale: 0.8 }),
    woodTrim: RL('wood', '#382515', { scale: 1.0 }),
    mapTableWood: RL('wood', '#573820', { scale: 1.1 }),
    mapPaper: new THREE.MeshStandardMaterial({ color: 0xdecbb0, roughness: 0.9, metalness: 0.05 }),
    leatherChair: new THREE.MeshStandardMaterial({ color: 0x2b1c14, roughness: 0.65, metalness: 0.1 }),
    brassLamp: MT('bronze', { color: '#c49a3c', rough: 0.3, toon: '#a88226' }),
    greenGlass: new THREE.MeshStandardMaterial({ color: 0x1f5c38, roughness: 0.2, metalness: 0.2 }),
    fileCabinetSteel: MT('iron', { color: '#454c46', rough: 0.5, toon: '#363d37' }),
    corkboard: RL('wood', '#997349', { scale: 1.0 }),
    lightBulb: new THREE.MeshBasicMaterial({ color: 0xffe89e })
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

  // 1. Hardwood Floor & Back Walls
  const floorGeo = new THREE.PlaneGeometry(16, 16);
  const floor = add(floorGeo, M.woodFloor, 'hq_floor', 'ground', V(0, 0, 0));
  floor.rotation.x = -Math.PI / 2;

  box(14, 0.25, 4.2, 0.0, 3.5, 0.0, M.plasterWall, 'hq_back_wall', 'wall');
  box(0.25, 8.0, 4.2, -6.0, 0.0, 0.0, M.plasterWall, 'hq_left_wall', 'wall');

  // Baseboard trim
  box(14, 0.08, 0.22, 0.0, 3.35, 0.0, M.woodTrim, 'hq_baseboard', 'wood');

  // 2. Large Tactical Map Planning Table
  box(3.2, 1.8, 0.10, 0.0, 1.2, 0.85, M.mapTableWood, 'map_table_top', 'wood');
  // 4 Table legs
  const legPositions = [[-1.45, 0.45], [1.45, 0.45], [-1.45, 1.95], [1.45, 1.95]];
  legPositions.forEach(([lx, ly], idx) => {
    box(0.12, 0.12, 0.85, lx, ly, 0.0, M.mapTableWood, `table_leg_${idx}`, 'wood');
  });

  // 3. Huge Western Australia Topographic Map unrolled on table
  box(2.8, 1.5, 0.02, 0.0, 1.2, 0.95, M.mapPaper, 'tactical_map_sheet', 'prop');
  // Brass corner map weights
  const weightPositions = [[-1.2, 0.6], [1.2, 0.6], [-1.2, 1.8], [1.2, 1.8]];
  weightPositions.forEach(([wx, wy], idx) => {
    add(new THREE.CylinderGeometry(0.045, 0.045, 0.06, 8), M.brassLamp, `map_weight_${idx}`, 'metal', V(wx, wy, 0.98));
  });

  // 4. Warm Tungsten Ceiling Lamp & Glow
  const lampCord = add(new THREE.CylinderGeometry(0.015, 0.015, 1.8, 6), M.brassLamp, 'lamp_cord', 'metal', V(0.0, 1.2, 3.2));
  const lampShade = add(new THREE.ConeGeometry(0.42, 0.32, 16), M.greenGlass, 'lamp_shade', 'prop', V(0.0, 1.2, 2.3));
  lampShade.rotation.x = Math.PI;
  const bulb = add(new THREE.SphereGeometry(0.1, 8, 8), M.lightBulb, 'lamp_bulb', 'light', V(0.0, 1.2, 2.15));

  const pointLight = new THREE.PointLight(0xffdf88, 2.8, 8.5);
  pointLight.position.copy(V(0.0, 1.2, 2.1));
  pointLight.castShadow = true;
  root.add(pointLight);

  // 5. Military Steel Filing Cabinets (Background Left)
  box(0.9, 0.7, 1.85, -4.2, 2.8, 0.0, M.fileCabinetSteel, 'file_cabinet_1', 'metal');
  box(0.9, 0.7, 1.85, -3.2, 2.8, 0.0, M.fileCabinetSteel, 'file_cabinet_2', 'metal');

  // 6. Corkboard with Military Orders & Pinned Telegrams
  box(2.4, 0.06, 1.4, 1.5, 3.32, 1.8, M.corkboard, 'hq_corkboard', 'wood');

  scene.add(root);
  return {
    anchors: {
      officer_spot: V(0.0, 0.2, 0.0),
      farmer_spot: V(-1.2, 0.3, 0.0),
      map_center: V(0.0, 1.2, 0.95)
    }
  };
}
