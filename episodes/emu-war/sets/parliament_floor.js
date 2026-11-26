// SET 6: AUSTRALIAN PARLIAMENT FLOOR (Canberra, December 1932)
// Eliminates dark void background: bright warm cream/sandstone upper chamber walls + mahogany paneling,
// CC0 clerestory windows (`window_frame.glb`) casting golden daylight shafts, CC0 `chamber_column.glb`,
// CC0 `parliament_bench.glb` tiers, `bookshelf.glb`, `chandelier.glb`, Approved Option (A) `buildDispatchBox`
// mahogany lectern with brass trim, and triumphant matte feathered 3D Emu wearing gold military medal.

import { buildEmu } from './emu_flock.js';
import { buildDispatchBox, makeMatteMat, makePropSpawner } from './procedural_props.mjs';

export async function build(THREE, scene, film, ctx) {
  const { B2T } = ctx;
  const V = (x, y, z) => B2T([x, y, z]);
  const root = new THREE.Group();
  root.name = 'parliament_floor';

  const M = {
    greenCarpet: makeMatteMat(THREE, '#2a4f34', 0.92, 0.0),
    mahogany: makeMatteMat(THREE, '#562d1b', 0.84, 0.0),
    upperStone: makeMatteMat(THREE, '#b9ab92', 0.90, 0.0),
    ceilingPlaster: makeMatteMat(THREE, '#ddd2be', 0.94, 0.0),
    brassMace: makeMatteMat(THREE, '#cfa236', 0.76, 0.42),
    goldMedal: makeMatteMat(THREE, '#ecc232', 0.76, 0.45),
    ribbonRed: makeMatteMat(THREE, '#a82626', 0.86, 0.0),
    shaftMat: new THREE.MeshBasicMaterial({
      color: '#ffebb8',
      transparent: true,
      opacity: 0.14,
      depthWrite: false,
      side: THREE.DoubleSide
    })
  };

  // Warm overhead chamber fill so Parliament never appears dark or boxy
  const chamberFill = new THREE.PointLight('#ffe2b4', 3.4, 22, 1.3);
  chamberFill.position.copy(V(0.0, 2.2, 4.2));
  scene.add(chamberFill);
  const daylightL = new THREE.PointLight('#fff4de', 2.4, 18, 1.2);
  daylightL.position.copy(V(-4.8, 3.5, 3.8));
  scene.add(daylightL);

  const box = (w, d, h, x, y, z, mat, name) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.name = name;
    m.position.copy(V(x, y, z + h / 2));
    m.castShadow = true;
    m.receiveShadow = true;
    root.add(m);
    return m;
  };

  // 1. Chamber Architecture (Layered two-tone wood & stone walls, zero black void)
  box(18, 16, 0.1, 0, 3.5, -0.1, M.greenCarpet, 'parliament_carpet');
  box(18, 16, 0.1, 0, 3.5, 6.2, M.ceilingPlaster, 'parliament_ceiling');
  box(18, 0.35, 1.8, 0, 9.2, 0, M.mahogany, 'chamber_back_wainscot');
  box(18, 0.35, 4.4, 0, 9.2, 1.8, M.upperStone, 'chamber_back_stone');
  for (const sx of [-7.5, 7.5]) {
    box(0.35, 16, 1.8, sx, 3.5, 0, M.mahogany, `chamber_side_wainscot_${sx}`);
    box(0.35, 16, 4.4, sx, 3.5, 1.8, M.upperStone, `chamber_side_stone_${sx}`);
  }

  // 2. CC0 Chamber Props (Benches, Columns, Bookshelves, Windows, Chandeliers)
  const [spawnBench, spawnCol, spawnShelf, spawnWin, spawnChan, spawnTable] = await Promise.all([
    makePropSpawner(ctx, 'parliament_bench', { shadow: true, tint: '#865032' }),
    makePropSpawner(ctx, 'chamber_column', { shadow: true, tint: '#cabfa9' }),
    makePropSpawner(ctx, 'bookshelf', { shadow: true }),
    makePropSpawner(ctx, 'window_frame', { shadow: false }),
    makePropSpawner(ctx, 'chandelier', { shadow: false, keepMetal: true }),
    makePropSpawner(ctx, 'map_table', { shadow: true, tint: '#6f3e24' })
  ]);

  // Parliamentary Seating Benches (far left/right wings clear of center podium)
  for (const tier of [0, 1]) {
    const py = 4.2 + tier * 2.0;
    spawnBench([-4.5, py, 0.0], { parent: root, yaw: Math.PI / 2, solid: true, name: `bench_l_${tier}` });
    spawnBench([4.5, py, 0.0], { parent: root, yaw: -Math.PI / 2, solid: true, name: `bench_r_${tier}` });
  }

  // Side Colonnade Columns & Gallery Bookshelves
  for (const [cx, cy] of [[-6.4, 2.5], [6.4, 2.5], [-6.4, 7.0], [6.4, 7.0]]) {
    spawnCol([cx, cy, 0.0], { parent: root, scale: 0.72, solid: true });
  }
  spawnShelf([-2.4, 8.75, 0.0], { parent: root, solid: true });
  spawnShelf([2.4, 8.75, 0.0], { parent: root, solid: true });

  // Clerestory Windows & Soft Golden Light Shafts
  for (const wy of [2.5, 6.2]) {
    spawnWin([-7.25, wy, 2.4], { parent: root, yaw: Math.PI / 2 });
    const shaft = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 4.8), M.shaftMat);
    shaft.position.copy(V(-5.0, wy, 2.9));
    shaft.rotation.set(0.35, Math.PI / 2, -0.45);
    shaft.userData.noExport = true;
    root.add(shaft);
  }

  // Hanging Chandeliers
  spawnChan([0.0, 2.8, 4.4], { parent: root });
  spawnChan([0.0, 6.5, 4.4], { parent: root });

  // 3. Central Table of the House (CC0 WoodenTable_01 scaled nicely at py = 2.8m) & Mace
  spawnTable([0.0, 2.8, 0.0], { parent: root, solid: true, name: 'table_of_the_house' });
  const mace = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.1, 10), M.brassMace);
  mace.position.copy(V(-0.45, 2.75, 0.67));
  mace.rotation.z = Math.PI / 2;
  root.add(mace);
  const maceCrown = new THREE.Mesh(new THREE.SphereGeometry(0.065, 12, 10), M.brassMace);
  maceCrown.position.copy(V(0.10, 2.75, 0.67));
  root.add(maceCrown);

  // 4. Approved Option (A) Mahogany Lectern & Brass Dispatch Box (`0.0, 1.45, 0.0` in front-center)
  const lectern = buildDispatchBox(THREE, ctx, { pos: [0.0, 1.45, 0.0] });
  root.add(lectern);
  ctx.assets.registerSolid('parliament_dispatch_box', lectern);

  // 5. Triumphant Matte Feathered 3D Emu Wearing Gold Medal perched proudly on Table of the House
  const victorEmu = buildEmu(THREE, ctx, {
    pos: [0.35, 2.75, 0.642],
    yaw: 0.15,
    scale: 1.0,
    running: false
  });
  const ribbon = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.05, 1.52, 0.32),
    new THREE.Vector3(0.0, 1.32, 0.42),
    new THREE.Vector3(-0.05, 1.52, 0.32)
  ]);
  victorEmu.add(new THREE.Mesh(new THREE.TubeGeometry(ribbon, 10, 0.016, 6), M.ribbonRed));
  const medal = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.014, 14), M.goldMedal);
  medal.rotation.x = 0.25;
  medal.position.set(0.0, 1.30, 0.44);
  victorEmu.add(medal);
  root.add(victorEmu);

  scene.add(root);

  return {
    anchors: {
      meredith_podium: V(-0.95, 0.45, 0.0),
      mp_lectern: V(0.85, 0.75, 0.0),
      table_center: V(0.0, 2.8, 0.65)
    },
    update: (time) => {
      victorEmu.userData.update && victorEmu.userData.update(time);
    }
  };
}
