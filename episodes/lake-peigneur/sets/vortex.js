// SET: The Lake Peigneur Vortex & Whirlpool (1980)
// Giant 1,300-ft whirlpool funnel, spiral water currents, collapsing mud shoreline, 100-ft steel freight barge tipping into drain, slumping pecan trees.

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
    const m = new THREE.Mesh(new THREE.CylinderGeometry(o.r2 ?? r, r, h, o.seg ?? 24), toon(col));
    m.position.copy(B2T([at[0], at[1], at[2] + h / 2]));
    return add(m, name, role, o);
  };

  // 1. Lake Water Surface & Outer Rim
  box('vortex_outer_lake', 'water', 140, 90, 0.4, [0, 0, -0.4], '#28544a', { cast: false, mat: 'water' });

  // 2. The Great Whirlpool Funnel (concentric descending vortex terraces)
  const vortexTiers = [
    { r: 24.0, r2: 20.0, h: 1.5, z: -1.5, col: '#23594e' },
    { r: 20.0, r2: 15.0, h: 2.2, z: -3.5, col: '#1f4a41' },
    { r: 15.0, r2: 10.0, h: 3.0, z: -6.2, col: '#183832' },
    { r: 10.0, r2: 5.5,  h: 4.0, z: -9.8, col: '#122622' },
    { r: 5.5,  r2: 1.5,  h: 6.0, z: -15.0, col: '#0a1412' }
  ];

  for (const t of vortexTiers) {
    cyl('vortex_funnel_tier', 'water', t.r, t.h, [0, 6.0, t.z], t.col, { r2: t.r2, cast: false });
  }

  // 3. White Churning Foam Rings & Spiral Streaks
  for (let a = 0; a < 6; a++) {
    const ang = (a / 6) * Math.PI * 2;
    const fx = Math.cos(ang) * 14.0;
    const fy = 6.0 + Math.sin(ang) * 14.0;
    box('foam_spiral_streak', 'foam', 6.0, 1.2, 0.15, [fx, fy, -1.8], '#e8f2f0', { rot: ang + 0.6, cast: false });
  }

  // 4. Hero Freight Barge (100-ft black steel barge tipped vertically on its nose)
  box('hero_barge_hull', 'steel', 3.8, 12.0, 1.8, [2.5, 7.0, -1.5], '#1e2124', { rot: 0.65, mat: 'metal' });
  box('barge_cargo_hold', 'steel', 3.2, 10.5, 0.5, [2.5, 7.0, -0.6], '#383d42', { rot: 0.65 });
  // White safety striping on barge bow
  box('barge_stripe', 'paint', 3.6, 0.6, 0.2, [2.5, 11.5, -0.4], '#e6b333', { rot: 0.65 });

  // 5. Collapsing Shoreline (Live Oak Gardens Botanical Park slumping into crater)
  // Stepped muddy mudslides
  box('mud_slump_1', 'earth', 45, 18, 2.5, [-18.0, 12.0, 0.0], '#5e432d', { mat: 'mud', rot: -0.15 });
  box('mud_slump_2', 'earth', 40, 14, 2.0, [-22.0, 15.0, 1.8], '#6e4f35', { mat: 'mud' });

  // Slumping Trees (pecan trees sliding with roots exposed)
  for (const tx of [-14.0, -20.0, -26.0]) {
    cyl('pecan_trunk_fallen', 'wood', 0.6, 6.5, [tx, 14.0, 1.0], '#3d2d20');
    cyl('pecan_foliage', 'leaf', 3.2, 3.0, [tx, 14.0, 5.0], '#345e34', { seg: 8 });
    // Root ball with dangling soil
    box('root_ball', 'earth', 1.8, 1.8, 1.4, [tx, 14.0, 0.4], '#453223');
  }

  // Glass Nursery Greenhouse sliding into mud
  box('greenhouse_frame', 'metal', 6.0, 4.0, 2.8, [-18.0, 18.0, 3.2], '#ffffff', { rot: -0.25 });
  box('greenhouse_glass', 'glass', 5.8, 3.8, 2.6, [-18.0, 18.0, 3.2], '#a3d2e6', { rot: -0.25 });
}
