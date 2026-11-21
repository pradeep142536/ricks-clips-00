// GREAT EMU WAR — 1932 Western Australian wheat field.
// Dense 3D storyboard set: the story objects are deliberately readable at phone size.
export function build(THREE, scene, film, ctx) {
  const { B2T, toon } = ctx;
  const V = (x, y, z) => B2T([x, y, z]);
  const root = new THREE.Group(); root.name = 'emu_field';
  if (ctx.sky?.clouds) ctx.sky.clouds({ kind: ctx.place?.sky_kind || 'clear-day', seed: 1932, coverage: 0.42, scale: 1.25, cirrus: true, sunDir: [-0.35, 0.75, 0.22] });
  const add = (geo, mat, name, role, p, parent = root) => { const m = new THREE.Mesh(geo, mat); m.name = name; m.userData.role = role; m.position.copy(p); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m; };
  const box = (w, d, h, x, y, z, mat, name, role = 'wood', yaw = 0) => { const m = add(new THREE.BoxGeometry(w, h, d), mat, name, role, V(x, y, z + h / 2)); m.rotation.y = yaw; return m; };
  const beam = (a, b, r, mat, name, role = 'wood') => { const va = V(...a), vb = V(...b), d = vb.clone().sub(va); const m = add(new THREE.CylinderGeometry(r, r, d.length(), 8), mat, name, role, va.clone().add(vb).multiplyScalar(.5)); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); return m; };
  const RL = (kind, c, o = {}) => ctx.relief ? ctx.relief(kind, c, o) : toon(c);
  const PM = (kind, c, o = {}) => ctx.pbr ? ctx.pbr.metal(kind, { color: c, toon: c, rough: o.rough ?? .42, rust: o.rust ?? .12 }) : toon(c);
  const M = {
    soil: RL('earth', '#6f472d', { scale: 1.35 }), soil2: RL('earth', '#8d5b35', { scale: 1.1 }), wheat: RL('grass', '#c89c3e', { scale: .8 }), wheatHi: RL('grass', '#e0bd62', { scale: .65 }), grass: RL('foliage', '#58733c', { scale: 1.1 }), wood: RL('wood', '#654128', { scale: 1.0 }), woodHi: RL('wood', '#9b6737', { scale: .9 }), metal: PM('iron', '#263545'), metalHi: PM('steel', '#788b94', { rough: .25 }), canvas: RL('cloth', '#72836c', { scale: .7 }), red: RL('paint', '#a53f2f', { scale: .7 }), water: PM('steel', '#4b91a1', { rough: .18 }), white: RL('plaster', '#e7dfca', { scale: .7 }), dark: PM('iron', '#172235'), emu: RL('feather', '#252b27', { scale: .7 }), emuHi: RL('feather', '#596052', { scale: .6 }), dust: RL('earth', '#d6aa73', { scale: .6 })
  };
  const ground = add(new THREE.PlaneGeometry(40, 42), M.soil, 'dry_red_soil', 'ground', V(0, 5, 0)); ground.rotation.x = -Math.PI / 2;
  for (let i = 0; i < 42; i++) { const x = -16 + (i * 1.73) % 32, y = -2 + (i * 3.1) % 28; box(.12, .42, .08, x, y, .02, i % 2 ? M.soil2 : M.grass, `soil_clod_${i}`, 'ground', (i % 5) * .2); }
  // Wheat rows: broad readable bands plus individual heads for depth.
  for (let row = -8; row <= 10; row += 1.5) { for (let i = -12; i <= 12; i += 1.05) { const x = i + Math.sin(row * 2.1 + i) * .14, y = row + 9; beam([x, y, .05], [x + .05, y, 1.0 + (i % 3) * .12], .028, i % 3 ? M.wheat : M.wheatHi, `wheat_stalk_${row}_${i}`, 'foliage'); } }
  // Long fence and gates explain the historical problem visually.
  for (let x = -17; x <= 17; x += 2.4) { box(.18, .18, 2.0, x, 12, 0, M.wood, `fence_post_${x}`, 'wood'); }
  for (const z of [1.25, 1.75]) beam([-17, 12, z], [17, 12, z], .045, M.woodHi, `fence_wire_${z}`, 'metal');
  box(3.2, .18, 1.7, 5.6, 12, .0, M.woodHi, 'wide_farm_gate', 'wood');
  // Farmhouse with porch, windows, roof, chimney and water tank.
  box(7.0, 4.2, 3.8, -9, 13.5, 0, M.white, 'farmhouse', 'plaster');
  box(7.6, 4.8, .35, -9, 13.5, 3.8, M.red, 'farmhouse_roof', 'roof', .08);
  box(.9, .18, 1.25, -10.7, 11.35, 1.1, M.dark, 'farmhouse_window_left', 'glass'); box(.9, .18, 1.25, -7.2, 11.35, 1.1, M.dark, 'farmhouse_window_right', 'glass');
  box(.9, .18, 2.0, -9, 11.35, 0, M.woodHi, 'farmhouse_door', 'wood'); box(.35, .35, 1.3, -6.2, 14.2, 4.0, M.red, 'farmhouse_chimney', 'brick');
  const tank = add(new THREE.CylinderGeometry(1.5, 1.5, 3.0, 20), M.metalHi, 'corrugated_water_tank', 'metal', V(-2.6, 13.2, 1.5)); tank.rotation.z = Math.PI / 2;
  for (let i = 0; i < 7; i++) beam([-3.3 + i * .22, 13.2, .1], [-3.3 + i * .22, 13.2, 2.9], .025, M.metal, `tank_rib_${i}`, 'metal');
  // 1930s military truck, placed independently from the soldier cards.
  box(4.6, 2.2, .75, 1.6, 3.6, .8, M.metal, 'army_truck_chassis', 'metal'); box(1.7, 2.0, 1.5, 3.0, 3.9, 1.5, M.canvas, 'army_truck_cab', 'cloth'); box(2.1, 2.1, 1.0, .1, 3.6, 1.5, M.metalHi, 'army_truck_bonnet', 'metal');
  for (const x of [0, 3.1]) { const w = add(new THREE.CylinderGeometry(.55, .55, .24, 16), M.dark, `truck_wheel_${x}`, 'rubber', V(x, 2.55, .55)); w.rotation.z = Math.PI / 2; }
  box(.12, 2.2, 1.9, 1.2, 3.6, 1.55, M.woodHi, 'truck_bed_headboard', 'wood');
  // Machine-gun tripod, receiver, barrel and ammunition box.
  beam([0.4, 4.9, .95], [0.4, 4.9, 2.0], .10, M.metalHi, 'gun_tripod_center', 'metal'); beam([0.4, 4.9, 1.1], [-.6, 4.0, .05], .06, M.metal, 'gun_leg_l', 'metal'); beam([0.4, 4.9, 1.1], [1.4, 4.0, .05], .06, M.metal, 'gun_leg_r', 'metal');
  box(1.0, .38, .35, .4, 4.9, 2.15, M.metal, 'lewis_gun_receiver', 'metal'); beam([.85, 4.9, 2.22], [2.7, 4.9, 2.22], .075, M.metalHi, 'lewis_gun_barrel', 'metal'); box(.7, .9, .55, -.2, 4.9, .05, M.woodHi, 'ammunition_box', 'wood');
  // Emus: 3D silhouettes with long legs, necks and readable beaks.
  const emu = (x, y, s, name) => { const g = new THREE.Group(); g.name = name; root.add(g); const body = add(new THREE.SphereGeometry(.7 * s, 12, 8), M.emu, `${name}_body`, 'animal', V(x, y, 1.25 * s), g); body.scale.set(1.2, .72, 1.35); const neck = add(new THREE.CylinderGeometry(.16 * s, .22 * s, 1.35 * s, 10), M.emuHi, `${name}_neck`, 'animal', V(x + .38 * s, y, 2.25 * s), g); neck.rotation.z = -.18; add(new THREE.SphereGeometry(.28 * s, 10, 8), M.emu, `${name}_head`, 'animal', V(x + .62 * s, y, 3.0 * s), g); beam([x + .78 * s, y, 3.0 * s], [x + 1.15 * s, y, 2.96 * s], .055 * s, M.red, `${name}_beak`, 'animal'); for (const dx of [-.28, .28]) beam([x + dx * s, y, .9 * s], [x + dx * s + .08, y, .05], .065 * s, M.emu, `${name}_leg_${dx}`, 'animal'); return g; };
  const emus = [emu(-6, 6, 1.0, 'emu_near'), emu(-2.8, 8, .75, 'emu_mid_a'), emu(2.4, 9, .62, 'emu_mid_b'), emu(7, 8.5, .55, 'emu_far'), emu(10, 10, .45, 'emu_far_b')];
  // Eucalyptus trees and distant hills create a clean sky horizon instead of empty blue.
  for (const [x, y, h] of [[-15, 17, 7], [14, 17, 8], [18, 20, 5]]) { beam([x, y, 0], [x - .2, y, h], .25, M.wood, `gum_tree_trunk_${x}`, 'wood'); for (let i = 0; i < 7; i++) add(new THREE.SphereGeometry(1.0 + (i % 3) * .25, 10, 8), M.grass, `gum_tree_canopy_${x}_${i}`, 'foliage', V(x + Math.sin(i) * 1.2, y + Math.cos(i) * 1.0, h + (i % 3) * .55)); }
  for (let i = 0; i < 8; i++) { const x = -18 + i * 5; box(5.0, 1.5, 2.5 + (i % 3) * .7, x, 23, 0, i % 2 ? M.grass : M.soil2, `distant_hill_${i}`, 'ground'); }
  const dust = new THREE.Group(); dust.name = 'wind_dust'; root.add(dust); for (let i = 0; i < 18; i++) add(new THREE.SphereGeometry(.035 + (i % 3) * .018, 6, 6), M.dust, `dust_${i}`, 'fx', V(-10 + i * 1.2, 5 + (i % 4) * 2, .25 + (i % 3) * .3), dust);
  scene.add(root);
  return { update: (f, t) => { dust.position.x = Math.sin(t * .45) * .18; for (const g of emus) g.position.x = Math.sin(t * .8 + g.position.y) * .025; }, anchors: { gun: V(.4, 4.9, 2.2), water_tank: V(-2.6, 13.2, 2), gate: V(5.6, 12, 1), emu: V(-6, 6, 1.4) } };
}
