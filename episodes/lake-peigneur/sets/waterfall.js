// SET: Delcambre Canal Reverse Waterfall & Geysers (1980)
// 150-foot muddy waterfall thundering over vertical cliff into empty lake bed, reversing canal flow, towering 400-ft geyser water plumes, popping steel barges.

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

  // 1. Lower Basin Floor (emptied muddy lake bed)
  box('basin_mud_floor', 'mud', 90, 60, 0.4, [0, 0, -6.0], '#423326', { cast: false, mat: 'mud' });

  // 2. 150-ft Vertical Mud Cliff (drop-off edge)
  box('cliff_face_vertical', 'mud', 70, 4.0, 8.0, [0, 10.0, -2.0], '#5e4836', { mat: 'mud' });
  box('cliff_upper_shelf', 'mud', 70, 20.0, 1.0, [0, 20.0, 5.5], '#69513d', { mat: 'mud' });

  // 3. Cascading Muddy Waterfall (roaring brown sheet pouring over cliff)
  box('waterfall_sheet', 'water', 35, 1.2, 7.5, [0, 10.2, -2.2], '#3a5448', { mat: 'water' });
  // Tumbling water foam lip
  cyl('waterfall_crest_foam', 'foam', 0.8, 35.0, [0, 10.2, 5.8], '#e3ebe8', { rot: 1.57, cast: false });
  // Base impact crash foam & mist mound
  cyl('waterfall_crash_foam', 'foam', 5.5, 2.2, [0, 9.5, -5.0], '#f0f7f5', { cast: false });

  // 4. Delcambre Canal Channel & Reverse Buoys (upper shelf)
  box('canal_water', 'water', 25, 22.0, 0.4, [0, 20.0, 5.4], '#2b6355', { cast: false, mat: 'water' });
  // Floating red channel buoys racing backward upstream
  for (const by of [14.0, 18.0, 22.0]) {
    cyl('canal_buoy_body', 'metal', 0.45, 1.4, [-4.0, by, 5.8], '#d9362b');
    // White foam wake behind backward-racing buoys
    box('buoy_wake', 'foam', 0.6, 2.5, 0.08, [-4.0, by + 1.6, 5.7], '#ffffff', { cast: false });
  }

  // 5. Giant Compressed Air Geyser Plumes (erupting 400ft from flooded shafts)
  for (const gx of [-16.0, 16.0]) {
    // Immense vertical water rocket plume
    cyl('geyser_column', 'water', 1.8, 22.0, [gx, 6.0, 5.0], '#eef5f2', { r2: 3.2, cast: false });
    // Spray mist rings around geyser
    cyl('geyser_mist_ring', 'foam', 4.5, 1.2, [gx, 6.0, 10.0], '#ffffff', { cast: false });
  }

  // 6. Popping Steel Barges (surfacing like rubber ducks)
  box('surfaced_barge_hull', 'steel', 3.6, 11.0, 1.6, [8.0, 2.0, -4.5], '#1f2226', { rot: 0.35, mat: 'metal' });
  // White foaming splash ring around surfaced barge
  cyl('barge_pop_splash', 'foam', 4.8, 0.8, [8.0, 2.0, -4.8], '#ffffff', { cast: false });
}
