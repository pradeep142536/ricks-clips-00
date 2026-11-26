// SET 5: MILITARY HEADQUARTERS MAP ROOM (Perth, October 1932)
// Eliminates dark void walls: uses warm wood wainscot paneling, cream upper plaster walls,
// daylight window frames with golden light shafts, warm bounced tungsten lamp glow,
// and CC0 .glb props (map_table, wooden_chair, desk_lamp, field_radio, bookshelf, war_diary, window_frame).
// Actor spacing guarantees Major Meredith stands cleanly BEHIND the map table, zero clipping.

import { makeMatteMat, makePropSpawner } from './procedural_props.mjs';

export async function build(THREE, scene, film, ctx) {
  const { B2T } = ctx;
  const V = (x, y, z) => B2T([x, y, z]);
  const root = new THREE.Group();
  root.name = 'hq_map_room';

  const M = {
    floorOak: makeMatteMat(THREE, '#6a4a30', 0.84, 0.0),
    wainscot: makeMatteMat(THREE, '#53351f', 0.85, 0.0),
    upperWall: makeMatteMat(THREE, '#c8b99e', 0.92, 0.0),
    trimWood: makeMatteMat(THREE, '#3e2514', 0.84, 0.0),
    ceiling: makeMatteMat(THREE, '#dfd3bd', 0.95, 0.0),
    mapPaper: makeMatteMat(THREE, '#e6d3a7', 0.88, 0.0),
    mapInk: makeMatteMat(THREE, '#7c2b22', 0.85, 0.0),
    shaftMat: new THREE.MeshBasicMaterial({
      color: '#ffe6ae',
      transparent: true,
      opacity: 0.14,
      depthWrite: false,
      side: THREE.DoubleSide
    })
  };

  // Bright warm bounced interior fill so HQ never reads like a dark box
  const warmFill = new THREE.PointLight('#ffdca4', 3.2, 16, 1.4);
  warmFill.position.copy(V(0.0, 1.35, 2.75));
  scene.add(warmFill);
  const windowKey = new THREE.PointLight('#fff4d8', 2.4, 14, 1.2);
  windowKey.position.copy(V(-3.8, 2.8, 2.4));
  scene.add(windowKey);

  const box = (w, d, h, x, y, z, mat, name) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.name = name;
    m.position.copy(V(x, y, z + h / 2));
    m.receiveShadow = true;
    m.castShadow = true;
    root.add(m);
    return m;
  };

  // 1. Warm Timber Floor, Two-Tone Wood-Paneled Walls & Ceiling
  box(14, 12, 0.1, 0, 2.2, -0.1, M.floorOak, 'hq_wood_floor');
  box(14, 12, 0.1, 0, 2.2, 4.4, M.ceiling, 'hq_ceiling');
  // Back wall (y = 5.4m) - wainscot + cream plaster upper wall + chair rail
  box(14, 0.25, 1.4, 0, 5.4, 0, M.wainscot, 'hq_back_wainscot');
  box(14, 0.25, 3.0, 0, 5.4, 1.4, M.upperWall, 'hq_back_plaster');
  box(14, 0.30, 0.08, 0, 5.36, 1.4, M.trimWood, 'hq_back_rail');
  // Side walls (x = +-5.5m)
  for (const sx of [-5.5, 5.5]) {
    box(0.25, 12, 1.4, sx, 2.2, 0, M.wainscot, `hq_side_wainscot_${sx}`);
    box(0.25, 12, 3.0, sx, 2.2, 1.4, M.upperWall, `hq_side_plaster_${sx}`);
  }

  // Framed Strategy Wall Board behind Major Meredith
  box(2.6, 0.06, 1.5, 0.0, 5.24, 1.55, M.trimWood, 'hq_wall_map_frame');
  box(2.4, 0.07, 1.3, 0.0, 5.23, 1.65, M.mapPaper, 'hq_wall_map_sheet');
  box(0.45, 0.08, 0.10, -0.4, 5.22, 2.15, M.mapInk, 'hq_wall_pin_1');

  // 2. CC0 GLB Furniture & Props (table, chairs, bookshelf, window, desk_lamp, radio, war_diary)
  const [mapTable, spawnChair, spawnShelf, spawnWindow, deskLamp, fieldRadio, warDiary] = await Promise.all([
    ctx.assets.spawn('map_table', { pos: [0.0, 1.35, 0.0], parent: root, solid: true }),
    makePropSpawner(ctx, 'wooden_chair', { shadow: true }),
    makePropSpawner(ctx, 'bookshelf', { shadow: true }),
    makePropSpawner(ctx, 'window_frame', { shadow: false }),
    ctx.assets.spawn('desk_lamp', { pos: [0.76, 1.48, 0.642], parent: root, solid: false }),
    ctx.assets.spawn('field_radio', { pos: [-0.74, 1.52, 0.642], yaw: 0.35, parent: root, solid: false }),
    ctx.assets.spawn('war_diary', { pos: [0.35, 1.15, 0.642], yaw: -0.25, parent: root, solid: false })
  ]);
  void mapTable; void deskLamp; void fieldRadio; void warDiary;

  // Map sheet & markers resting flush on top of CC0 WoodenTable_01 (height = 0.6404m)
  const tableTopZ = 0.644;
  const mapSheet = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 0.56), M.mapPaper);
  mapSheet.rotation.x = -Math.PI / 2;
  mapSheet.position.copy(V(-0.08, 1.34, tableTopZ));
  mapSheet.receiveShadow = true;
  root.add(mapSheet);
  box(0.28, 0.05, 0.01, -0.25, 1.32, tableTopZ, M.mapInk, 'map_sector_line_1');
  box(0.06, 0.24, 0.01, 0.18, 1.36, tableTopZ, M.mapInk, 'map_sector_line_2');

  // Flanking chairs & wall archives
  spawnChair([-1.55, 1.85, 0.0], { parent: root, yaw: 0.65, solid: true });
  spawnChair([1.55, 1.85, 0.0], { parent: root, yaw: -0.65, solid: true });
  spawnShelf([-3.2, 4.95, 0.0], { parent: root, solid: true });
  spawnShelf([3.2, 4.95, 0.0], { parent: root, solid: true });

  // Daylight Window Frames + Soft Volumetric Light Shafts on Left Wall & Back-Left
  const winL = spawnWindow([-5.32, 2.2, 1.25], { parent: root, yaw: Math.PI / 2 });
  const shaft = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 3.8), M.shaftMat);
  shaft.position.copy(V(-3.6, 2.2, 1.75));
  shaft.rotation.set(0.35, Math.PI / 2, -0.45);
  shaft.userData.noExport = true;
  root.add(shaft);
  void winL;

  scene.add(root);

  return {
    anchors: {
      // Major Meredith stands cleanly BEHIND map_table (y: 0.96..1.74); farmer stands cleanly IN FRONT
      meredith_hq: V(0.35, 2.25, 0.0),
      farmer_hq: V(-0.85, 0.35, 0.0),
      table_spot: V(0.0, 1.35, 0.65)
    }
  };
}
