// SET 6: AUSTRALIAN PARLIAMENT FLOOR (House of Representatives, Canberra 1932)
// Polished mahogany debating benches, green leather parliamentary upholstery,
// dispatch boxes, brass railings, warm overhead courtroom chandeliers.

export async function build(THREE, scene, film, ctx) {
  const { B2T, toon } = ctx;
  const V = (x, y, z) => B2T([x, y, z]);
  const root = new THREE.Group();
  root.name = 'parliament_floor';

  const RL = (kind, c, o = {}) => ctx.relief ? ctx.relief(kind, c, o) : toon(c);
  const MT = (kind, o = {}) => ctx.pbr ? ctx.pbr.metal(kind, o) : toon(o.toon || o.color || '#3c4470');

  const M = {
    greenCarpet: RL('cloth', '#234a36', { scale: 1.2 }),
    woodMahogany: RL('wood', '#421d17', { scale: 1.1 }),
    woodPanels: RL('wood', '#57291f', { scale: 1.0 }),
    greenLeather: new THREE.MeshStandardMaterial({ color: 0x1f4732, roughness: 0.55, metalness: 0.1 }),
    brassRail: MT('bronze', { color: '#d4aa3b', rough: 0.25, toon: '#b89228' }),
    chandelierGlass: new THREE.MeshBasicMaterial({ color: 0xfff0c4 }),
    paperSheet: new THREE.MeshStandardMaterial({ color: 0xf5f0e6, roughness: 0.9 })
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

  // 1. Parliamentary Green Wool Carpet
  const floorGeo = new THREE.PlaneGeometry(18, 18);
  const floor = add(floorGeo, M.greenCarpet, 'parliament_carpet', 'ground', V(0, 0, 0));
  floor.rotation.x = -Math.PI / 2;

  // 2. Mahogany Wood Panelled Back Wall
  box(16, 0.3, 5.0, 0.0, 4.2, 0.0, M.woodPanels, 'parliament_back_wall', 'wall');

  // 3. Central Table of the House & Dispatch Boxes
  box(2.8, 1.4, 0.85, 0.0, 1.2, 0.0, M.woodMahogany, 'clerk_table', 'wood');
  // Two dispatch boxes (Government and Opposition)
  box(0.55, 0.42, 0.26, -0.75, 1.2, 0.85, M.brassRail, 'dispatch_box_opp', 'metal');
  box(0.55, 0.42, 0.26, 0.75, 1.2, 0.85, M.brassRail, 'dispatch_box_gov', 'metal');

  // Parliamentary Papers on table
  box(0.35, 0.25, 0.02, 0.0, 1.15, 0.86, M.paperSheet, 'hansard_inquiry_doc', 'prop');

  // 4. Tiered MP Benches with Green Leather
  // Left Benches (Government)
  box(1.2, 5.5, 0.45, -2.8, 1.0, 0.0, M.woodMahogany, 'bench_wood_L1', 'wood');
  box(0.9, 5.4, 0.12, -2.8, 1.0, 0.45, M.greenLeather, 'bench_cushion_L1', 'cloth');
  box(0.15, 5.5, 0.65, -3.3, 1.0, 0.45, M.greenLeather, 'bench_backrest_L1', 'cloth');

  box(1.2, 5.5, 0.45, -4.2, 1.0, 0.35, M.woodMahogany, 'bench_wood_L2', 'wood');
  box(0.9, 5.4, 0.12, -4.2, 1.0, 0.80, M.greenLeather, 'bench_cushion_L2', 'cloth');

  // Right Benches (Opposition)
  box(1.2, 5.5, 0.45, 2.8, 1.0, 0.0, M.woodMahogany, 'bench_wood_R1', 'wood');
  box(0.9, 5.4, 0.12, 2.8, 1.0, 0.45, M.greenLeather, 'bench_cushion_R1', 'cloth');
  box(0.15, 5.5, 0.65, 3.3, 1.0, 0.45, M.greenLeather, 'bench_backrest_R1', 'cloth');

  box(1.2, 5.5, 0.45, 4.2, 1.0, 0.35, M.woodMahogany, 'bench_wood_R2', 'wood');
  box(0.9, 5.4, 0.12, 4.2, 1.0, 0.80, M.greenLeather, 'bench_cushion_R2', 'cloth');

  // 5. Polished Brass Guard Railing
  box(6.5, 0.06, 0.95, 0.0, -1.8, 0.0, M.brassRail, 'bar_of_the_house_rail', 'metal');

  // 6. Overhead Warm Chandelier Lights
  const chandelier = add(new THREE.OctahedronGeometry(0.45, 1), M.chandelierGlass, 'parliament_chandelier', 'light', V(0.0, 1.2, 3.8));
  const parLight = new THREE.PointLight(0xffdf96, 2.6, 9.0);
  parLight.position.copy(V(0.0, 1.2, 3.6));
  root.add(parLight);

  scene.add(root);
  return {
    anchors: {
      politician_podium: V(0.75, 0.3, 0.0),
      clerk_seat: V(0.0, 1.8, 0.0),
      chamber_wide: V(0.0, -1.0, 0.0)
    }
  };
}
