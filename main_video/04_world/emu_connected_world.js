// THE ARMY THAT LOST A WAR TO BIRDS — one continuous Western Australian world.
// Plan coordinates are metres: [x, forward, up].  This module intentionally
// builds the full map once.  It is not a collection of unrelated backgrounds.
export function build(THREE, scene, film, ctx) {
  const { B2T, toon } = ctx;
  const P = (x, z, y = 0) => B2T([x, z, y]);
  const root = new THREE.Group(); root.name = 'emu_war_connected_world_440m_x_420m';
  scene.add(root);
  const add = (geometry, material, name, role, position, parent = root) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name; mesh.userData.role = role; mesh.position.copy(position);
    mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  };
  const relief = (kind, colour, options = {}) => ctx.relief ? ctx.relief(kind, colour, options) : toon(colour);
  const metal = (kind, colour, options = {}) => ctx.pbr ? ctx.pbr.metal(kind, { color: colour, toon: colour, rough: options.rough ?? .48, rust: options.rust ?? .1 }) : toon(colour);
  const M = {
    earth: relief('earth', '#87512e', { scale: 4.0 }), earthHi: relief('earth', '#b7753c', { scale: 2.4 }),
    road: relief('earth', '#a86d3f', { scale: 2.2 }), wheat: relief('grass', '#bb9134', { scale: 1.0 }), wheatHi: relief('grass', '#ebc95d', { scale: .75 }),
    scrub: relief('foliage', '#536b32', { scale: 1.3 }), leafHi: relief('foliage', '#75914a', { scale: 1.0 }), bark: relief('wood', '#5c3823', { scale: 1.1 }),
    wood: relief('wood', '#7d4c27', { scale: 1.0 }), woodHi: relief('wood', '#b2753a', { scale: .85 }), canvas: relief('cloth', '#747355', { scale: .8 }),
    plaster: relief('plaster', '#ddd1aa', { scale: .8 }), roof: relief('paint', '#9b4b31', { scale: .75 }),
    iron: metal('iron', '#273843', { rough: .55, rust: .22 }), steel: metal('steel', '#7d9498', { rough: .27 }), water: metal('steel', '#4a8792', { rough: .16 }),
    shadow: toon('#30271e'), emu: relief('feather', '#443a31', { scale: .55 }), emuHi: relief('feather', '#83715a', { scale: .55 })
  };
  const box = (w, d, h, x, z, y, material, name, role = 'prop', yaw = 0, parent = root) => {
    const mesh = add(new THREE.BoxGeometry(w, h, d), material, name, role, P(x, z, y + h / 2), parent);
    mesh.rotation.y = yaw; return mesh;
  };
  const beam = (a, b, radius, material, name, role = 'prop', parent = root) => {
    const A = P(a[0], a[1], a[2]), B = P(b[0], b[1], b[2]), delta = B.clone().sub(A);
    const mesh = add(new THREE.CylinderGeometry(radius, radius, delta.length(), 9), material, name, role, A.clone().add(B).multiplyScalar(.5), parent);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize()); return mesh;
  };
  const disc = (radius, x, z, y, material, name, role = 'ground') => {
    const mesh = add(new THREE.CircleGeometry(radius, 28), material, name, role, P(x, z, y)); mesh.rotation.x = -Math.PI / 2; return mesh;
  };
  const road = (a, b, width, name, material = M.road) => {
    const dx = b[0] - a[0], dz = b[1] - a[1], length = Math.hypot(dx, dz);
    const mesh = box(width, length, .12, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, .02, material, name, 'road', Math.atan2(dx, -dz));
    mesh.receiveShadow = true; return mesh;
  };

  // Continuous ground and six physical paths.  Location coordinates match world_map.json exactly.
  const ground = add(new THREE.PlaneGeometry(440, 420, 24, 24), M.earth, 'continuous_outback_ground', 'ground', P(0, 50, 0));
  ground.rotation.x = -Math.PI / 2;
  for (let x = -205; x <= 205; x += 18) for (let z = -145; z <= 245; z += 17) {
    const r = .16 + Math.abs(Math.sin(x * .13 + z * .07)) * .65;
    disc(r, x + Math.sin(z) * 3, z + Math.cos(x) * 2, .018, (x + z) % 3 ? M.earthHi : M.scrub, `ground_clod_${x}_${z}`);
  }
  road([-150, -70], [-65, -22], 4.2, 'farm_track');
  road([-65, -22], [45, -45], 5.0, 'supply_road');
  road([45, -45], [5, 110], 5.0, 'campion_road');
  road([5, 110], [-85, 145], 3.5, 'dam_track');
  road([5, 110], [85, 155], 12.0, 'emu_run_scrub', M.earthHi);
  road([-85, 145], [-25, 220], 3.0, 'fence_maintenance_track');

  // Roadside rocks and scrub break up the open ground and give every wide shot
  // readable foreground depth without changing the shared map coordinates.
  const rock = (x, z, sx, sy, sz, name) => {
    const mesh = add(new THREE.DodecahedronGeometry(1, 0), M.earthHi, name, 'rock', P(x, z, sy * .45));
    mesh.scale.set(sx, sy, sz); mesh.rotation.set(.12 * Math.sin(x), .2 * Math.cos(z), .18 * Math.sin(z)); return mesh;
  };
  [[-118,-61,1.2,.45,.8],[-98,-43,.8,.32,.55],[-12,-33,1.5,.5,.7],[28,-18,.9,.38,.6],
   [-4,78,1.1,.42,.8],[26,105,.7,.3,.5],[-108,119,1.4,.5,.9],[-52,170,.9,.34,.65],
   [54,182,1.6,.48,.85],[112,143,1.1,.4,.7],[-76,228,1.3,.46,.7]].forEach((v, i) => rock(...v, `roadside_rock_${i}`));
  [[-133,-52],[-115,-30],[-92,15],[58,3],[104,55],[118,116],[-139,184],[46,211]].forEach((p, i) => {
    const g = new THREE.Group(); g.name = `scrub_cluster_${i}`; root.add(g);
    for (let j = 0; j < 7; j++) {
      const r = .35 + (j % 3) * .12;
      add(new THREE.SphereGeometry(r, 8, 6), j % 2 ? M.scrub : M.leafHi, `scrub_${i}_${j}`, 'foliage', P(p[0] + Math.sin(j * 2.4) * .9, p[1] + Math.cos(j * 1.8) * .8, r), g);
    }
  });

  // Wheat field: broad rows plus individual stalks prevent a flat tiled floor.
  for (let z = -72; z <= 25; z += 3.0) for (let x = -130; x <= -2; x += 2.4) {
    const damaged = (x > -55 && x < -16 && z > -42 && z < -5);
    if (damaged && Math.sin(x * 1.9 + z) > -.2) continue;
    const height = 1.0 + .35 * Math.abs(Math.sin(x + z));
    beam([x, z, .05], [x + .12 * Math.sin(z), z + .08 * Math.cos(x), height], .035, (x + z) % 7 ? M.wheat : M.wheatHi, `wheat_${x}_${z}`, 'wheat');
  }

  const tree = (x, z, height, scale, name) => {
    const g = new THREE.Group(); g.name = name; root.add(g);
    beam([x, z, 0], [x + .45, z - .2, height], .26 * scale, M.bark, `${name}_trunk`, 'tree', g);
    for (let i = 0; i < 4; i++) beam([x + .25, z, height * .46], [x + Math.sin(i * 1.7) * 1.6 * scale, z + Math.cos(i * 1.9) * 1.5 * scale, height * (.72 + (i % 2) * .12)], .11 * scale, M.bark, `${name}_branch_${i}`, 'tree', g);
    for (let i = 0; i < 13; i++) {
      const angle = i * 2.399, ring = .45 + (i % 4) * .2;
      const crown = add(new THREE.SphereGeometry((.7 + (i % 3) * .18) * scale, 9, 7), i % 3 ? M.scrub : M.leafHi, `${name}_crown_${i}`, 'foliage', P(x + Math.cos(angle) * ring * 2.6 * scale, z + Math.sin(angle) * ring * 2.0 * scale, height * .76 + (i % 5) * .42 * scale), g);
      crown.scale.set(1.0 + (i % 2) * .32, .72, 1.0 + (i % 3) * .22);
    }
  };
  [[-190,-125,10,1.15],[-170,5,8,.9],[-125,55,11,1.1],[112,-110,12,1.25],[145,75,9,.85],[165,192,12,1.1],[-190,180,10,.9],[-15,245,13,1.1]].forEach((v,i)=>tree(...v, `eucalyptus_${i}`));

  // Farmhouse and visible water tank share the map with every later shot.
  box(12, 8, 4.5, -150, -70, 0, M.plaster, 'farmhouse_main', 'building');
  box(13.6, 9.5, .65, -150, -70, 4.45, M.roof, 'farmhouse_roof', 'building');
  box(2.1, .25, 2.4, -150, -65.85, .05, M.wood, 'farmhouse_door', 'building');
  [-154, -146].forEach((x, i) => box(2, .22, 1.5, x, -65.85, 1.7, M.iron, `farm_window_${i}`, 'building'));
  const tank = add(new THREE.CylinderGeometry(2.8, 2.8, 5.7, 20), M.steel, 'farm_water_tank', 'landmark', P(-132, -48, 2.85));
  for (let i = 0; i < 13; i++) beam([-134.6 + i * .43, -48, .2], [-134.6 + i * .43, -48, 5.55], .035, M.iron, `tank_rib_${i}`, 'landmark');

  // Staging area: a readable, proportioned 1930s truck, crates and Lewis gun.
  box(5.0, 2.15, .75, 45, -45, .65, M.iron, 'truck_chassis', 'truck');
  box(1.85, 2.05, 1.55, 46.45, -45, 1.4, M.canvas, 'truck_cab', 'truck');
  box(2.25, 2.05, 1.15, 43.0, -45, 1.4, M.iron, 'truck_bed', 'truck');
  for (const x of [43.4, 46.5]) { const wheel = add(new THREE.CylinderGeometry(.58, .58, .28, 16), M.shadow, `truck_wheel_${x}`, 'truck', P(x, -46.18, .58)); wheel.rotation.z = Math.PI / 2; }
  [[38,-51],[40,-51],[38,-48]].forEach((p,i)=>box(1.15,1.15,1.0,p[0],p[1],0,M.woodHi,`ammo_crate_${i}`,'prop'));
  beam([35,-42,.18],[35,-42,1.45],.11,M.steel,'lewis_tripod','gun');
  beam([35,-42,1.15],[33.9,-43.0,.08],.065,M.iron,'lewis_leg_l','gun'); beam([35,-42,1.15],[36.1,-43.0,.08],.065,M.iron,'lewis_leg_r','gun');
  box(1.1,.42,.35,35,-42,1.45,M.iron,'lewis_receiver','gun'); beam([35,-42,1.58],[38,-42,1.58],.075,M.steel,'lewis_barrel','gun');
  const drum = add(new THREE.CylinderGeometry(.42,.42,.12,20), M.iron, 'lewis_drum', 'gun', P(35,-42,1.88)); drum.rotation.x = Math.PI / 2;

  // Watering point and windmill: a deliberate ambush landmark, not a blue square.
  const dam = add(new THREE.CircleGeometry(10, 40), M.water, 'watering_dam', 'landmark', P(-85,145,.08)); dam.rotation.x = -Math.PI / 2;
  for (let i=0;i<36;i++) { const a=i/36*Math.PI*2; beam([-85+Math.cos(a)*11,145+Math.sin(a)*8,.04],[-85+Math.cos(a)*12,145+Math.sin(a)*9,.72],.045,M.scrub,`dam_reed_${i}`,'foliage'); }
  beam([-64,132,0],[-64,132,8],.14,M.iron,'windmill_tower','landmark');
  for(let i=0;i<4;i++) beam([-64,132,7.4],[-64+Math.cos(i*Math.PI/2)*2,132+Math.sin(i*Math.PI/2)*2,7.4],.06,M.steel,`windmill_blade_${i}`,'landmark');

  // Ending fence: every post is physically in the shared map and casts a long shadow.
  for (let x=-120; x<=90; x+=4.5) { box(.16,.16,2.05,x,220,0,M.wood,`fence_post_${x}`,'fence'); beam([x-2.25,220,1.22],[x+2.25,220,1.22],.032,M.steel,`fence_wire_a_${x}`,'fence'); beam([x-2.25,220,1.67],[x+2.25,220,1.67],.032,M.steel,`fence_wire_b_${x}`,'fence'); }

  // Emus are genuine 3D world residents.  The animated close models come later,
  // but these establish flock scale, body proportions and ground contact now.
  const emu = (x, z, s, name) => {
    const g = new THREE.Group(); g.name=name; root.add(g);
    const body = add(new THREE.SphereGeometry(.78*s,13,9),M.emu,`${name}_body`,'emu',P(x,z,1.05*s),g); body.scale.set(1.25,.76,1.18);
    beam([x+.35*s,z,1.35*s],[x+.55*s,z,2.62*s],.16*s,M.emuHi,`${name}_neck`,'emu',g);
    add(new THREE.SphereGeometry(.23*s,10,8),M.emu,`${name}_head`,'emu',P(x+.62*s,z,2.76*s),g);
    beam([x+.77*s,z,2.76*s],[x+1.08*s,z,2.70*s],.05*s,M.woodHi,`${name}_beak`,'emu',g);
    [-.24,.24].forEach((dx,i)=>{ beam([x+dx*s,z-.12,1.0*s],[x+(dx+.06)*s,z-.12,.05],.052*s,M.emu,`${name}_leg_${i}`,'emu',g); beam([x+(dx+.06)*s,z-.12,.05],[x+(dx+.24)*s,z-.12,.05],.028*s,M.emu,`${name}_toe_${i}`,'emu',g); });
    return g;
  };
  const emus = [[-48,-20,1.0],[-42,-11,.8],[-33,-13,.7],[17,116,.9],[28,122,.75],[42,133,.65],[75,152,.75],[87,162,.62],[96,147,.55]].map((v,i)=>emu(...v,`flock_emu_${i}`));
  const dust = new THREE.Group(); dust.name='moving_dust'; root.add(dust);
  for(let i=0;i<28;i++) add(new THREE.SphereGeometry(.06+(i%4)*.035,7,6),M.earthHi,`dust_${i}`,'fx',P(-18+i*1.5,112+(i%5)*1.4,.12+(i%3)*.1),dust);
  return {
    update: (_f, t) => { dust.position.x = Math.sin(t*.7)*.9; emus.forEach((e,i)=>{ e.position.x=Math.sin(t*2+i)*.035; e.position.y=Math.abs(Math.sin(t*4+i))*.025; }); },
    anchors: { farmhouse:P(-150,-70,2), water_tank:P(-132,-48,3), truck:P(45,-45,1), lewis_gun:P(35,-42,1.55), dam:P(-85,145,.2), windmill:P(-64,132,7), hill_gun_position:P(5,110,1), fence_line:P(-25,220,1.4), emu_flock:P(17,116,1.5) }
  };
}
