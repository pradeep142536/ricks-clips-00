// HERO OBJECT: 1930s Australian Military Flatbed Truck (Chevrolet/Morris-Commercial)
// Mounted with Lewis Machine Gun on swivel tripod (10+ distinct named physical parts).
// Features PBR materials, wooden grain, canvas texture, steel brackets, and detailed gun components.

export function buildHeroTruck(THREE, ctx, options = {}) {
  const { B2T, toon } = ctx;
  const V = (x, y, z) => B2T([x, y, z]);
  const truck = new THREE.Group();
  truck.name = 'hero_military_truck';

  const RL = (kind, c, o = {}) => ctx.relief ? ctx.relief(kind, c, o) : toon(c);
  const MT = (kind, o = {}) => ctx.pbr ? ctx.pbr.metal(kind, o) : toon(o.toon || o.color || '#3c4470');

  const M = {
    steelChassis: MT('iron', { color: '#2a2c30', rough: 0.45, rust: 0.25, toon: '#222326' }),
    canvasCab: RL('cloth', '#4a4832', { scale: 1.2 }),
    canvasRoof: RL('cloth', '#3e3d2b', { scale: 1.2 }),
    woodBed: RL('wood', '#6e4a2c', { scale: 1.0 }),
    woodPlank: RL('wood', '#583b22', { scale: 1.0 }),
    rubberTire: new THREE.MeshStandardMaterial({ color: 0x1f1f22, roughness: 0.85, metalness: 0.05 }),
    wheelSpoke: MT('iron', { color: '#42454a', rough: 0.4, toon: '#383a3e' }),
    lewisGunSteel: MT('steel', { color: '#1c1d22', rough: 0.35, toon: '#16171b' }),
    gunBrass: MT('bronze', { color: '#bfa034', rough: 0.3, toon: '#a88a28' }),
    exhaustRust: MT('iron', { color: '#63351d', rough: 0.7, rust: 0.6, toon: '#522b17' }),
    windshieldGlass: new THREE.MeshStandardMaterial({ color: 0xc4d8e2, roughness: 0.15, metalness: 0.4, transparent: true, opacity: 0.65 }),
    ammoCrateWood: RL('wood', '#855938', { scale: 0.9 })
  };

  const add = (geo, mat, name, role, p, parent = truck) => {
    const m = new THREE.Mesh(geo, mat);
    m.name = name;
    m.userData.role = role;
    if (p) m.position.copy(p);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  };

  const box = (w, d, h, x, y, z, mat, name, role = 'prop', parent = truck) => {
    return add(new THREE.BoxGeometry(w, h, d), mat, name, role, V(x, y, z + h / 2), parent);
  };

  // 1. STEEL CHASSIS RAILS (2 parallel longitudinal steel I-beams)
  box(0.12, 4.4, 0.18, -0.42, 0.0, 0.45, M.steelChassis, 'truck_chassis_rail_left', 'metal');
  box(0.12, 4.4, 0.18, 0.42, 0.0, 0.45, M.steelChassis, 'truck_chassis_rail_right', 'metal');
  box(0.96, 0.12, 0.14, 0.0, -1.8, 0.45, M.steelChassis, 'truck_chassis_cross_front', 'metal');
  box(0.96, 0.12, 0.14, 0.0, 1.8, 0.45, M.steelChassis, 'truck_chassis_cross_rear', 'metal');

  // 2. SPOKED ARTILLERY WHEELS (4 wheels with heavy rubber tread and spokes)
  const wheelPositions = [
    [-0.78, 1.35], [0.78, 1.35],  // front wheels
    [-0.78, -1.25], [0.78, -1.25]  // rear wheels
  ];
  wheelPositions.forEach(([wx, wy], idx) => {
    const tire = add(new THREE.CylinderGeometry(0.42, 0.42, 0.22, 16), M.rubberTire, `truck_wheel_tire_${idx}`, 'prop', V(wx, wy, 0.42));
    tire.rotation.z = Math.PI / 2;
    // Hub and spokes
    const hub = add(new THREE.CylinderGeometry(0.12, 0.12, 0.24, 12), M.wheelSpoke, `truck_wheel_hub_${idx}`, 'metal', V(wx, wy, 0.42));
    hub.rotation.z = Math.PI / 2;
  });

  // 3. CANVAS DRIVER CAB (vintage 1930s open-sided canvas cab)
  box(1.5, 1.2, 1.1, 0.0, 0.85, 0.60, M.canvasCab, 'truck_canvas_cab_body', 'cloth');
  box(1.54, 1.24, 0.08, 0.0, 0.85, 1.70, M.canvasRoof, 'truck_canvas_cab_roof', 'cloth');
  // Hood / Engine Cowling
  box(1.1, 1.4, 0.75, 0.0, 1.85, 0.55, M.steelChassis, 'truck_engine_hood', 'metal');
  // Radiator Grille
  box(0.85, 0.08, 0.70, 0.0, 2.56, 0.55, M.steelChassis, 'truck_radiator_grille', 'metal');

  // 4. CRACKED SPLIT WINDSHIELD
  box(1.35, 0.04, 0.45, 0.0, 1.25, 1.42, M.windshieldGlass, 'truck_windshield_glass', 'glass');
  box(1.38, 0.06, 0.04, 0.0, 1.25, 1.20, M.steelChassis, 'truck_windshield_frame_bottom', 'metal');
  box(1.38, 0.06, 0.04, 0.0, 1.25, 1.65, M.steelChassis, 'truck_windshield_frame_top', 'metal');
  box(0.04, 0.06, 0.45, 0.0, 1.25, 1.42, M.steelChassis, 'truck_windshield_center_divider', 'metal');

  // 5. WOODEN TRUCK BED (timber planks with side stakes)
  box(1.8, 2.4, 0.08, 0.0, -0.95, 0.65, M.woodBed, 'truck_wooden_bed_floor', 'wood');
  // Side wooden stake-racks
  box(0.06, 2.38, 0.35, -0.88, -0.95, 0.85, M.woodPlank, 'truck_wooden_rack_left', 'wood');
  box(0.06, 2.38, 0.35, 0.88, -0.95, 0.85, M.woodPlank, 'truck_wooden_rack_right', 'wood');
  box(1.78, 0.06, 0.35, 0.0, -2.12, 0.85, M.woodPlank, 'truck_wooden_tailgate', 'wood');

  // 6. SWIVEL TRIPOD MOUNT (bolted in center of bed)
  const tripodBase = add(new THREE.CylinderGeometry(0.08, 0.25, 0.65, 8), M.steelChassis, 'truck_swivel_tripod_pedestal', 'metal', V(0.0, -0.65, 0.98));
  const swivelHead = add(new THREE.SphereGeometry(0.09, 8, 8), M.steelChassis, 'truck_swivel_tripod_head', 'metal', V(0.0, -0.65, 1.32));

  // 7. LEWIS MACHINE GUN (cooling shroud, pan drum magazine, spade grip)
  const gunGroup = new THREE.Group();
  gunGroup.name = 'mounted_lewis_gun';
  gunGroup.position.copy(V(0.0, -0.65, 1.34));
  if (options.gunPitch) gunGroup.rotation.x = options.gunPitch;
  if (options.gunYaw) gunGroup.rotation.y = options.gunYaw;

  // Aluminum finned barrel cooling shroud
  const shroud = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.95, 12), M.lewisGunSteel);
  shroud.name = 'truck_barrel_shroud';
  shroud.rotation.x = Math.PI / 2;
  shroud.position.set(0, 0, -0.35);
  gunGroup.add(shroud);

  // Muzzle cone
  const muzzle = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.12, 12), M.lewisGunSteel);
  muzzle.name = 'truck_barrel_muzzle';
  muzzle.rotation.x = -Math.PI / 2;
  muzzle.position.set(0, 0, -0.85);
  gunGroup.add(muzzle);

  // Receiver body
  const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.38), M.lewisGunSteel);
  receiver.name = 'truck_gun_receiver';
  receiver.position.set(0, 0, 0.12);
  gunGroup.add(receiver);

  // Circular pan drum magazine (97-round aerial drum)
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.05, 16), M.lewisGunSteel);
  drum.name = 'truck_drum_magazine';
  drum.position.set(0, 0.09, 0.06);
  gunGroup.add(drum);

  // Spade grip
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.16, 8), M.lewisGunSteel);
  grip.name = 'truck_spade_grip';
  grip.position.set(0, -0.02, 0.34);
  gunGroup.add(grip);

  truck.add(gunGroup);

  // 8. AMMUNITION CRATES (stencilled wooden crates on bed)
  box(0.55, 0.38, 0.28, -0.45, -1.5, 0.82, M.ammoCrateWood, 'truck_ammo_crate_1', 'wood');
  box(0.55, 0.38, 0.28, -0.42, -1.5, 1.10, M.ammoCrateWood, 'truck_ammo_crate_2', 'wood');
  box(0.55, 0.38, 0.28, 0.42, -1.55, 0.82, M.ammoCrateWood, 'truck_ammo_crate_3', 'wood');

  // 9. RUSTED SIDE EXHAUST PIPE
  const exhaust = add(new THREE.CylinderGeometry(0.045, 0.045, 2.2, 8), M.exhaustRust, 'truck_exhaust_pipe', 'metal', V(0.55, 0.2, 0.35));
  exhaust.rotation.x = Math.PI / 2;

  // 10. HEADLAMPS (2 brass/steel round front lights)
  const lampL = add(new THREE.CylinderGeometry(0.11, 0.08, 0.14, 12), M.steelChassis, 'truck_headlamp_left', 'metal', V(-0.48, 2.45, 0.72));
  lampL.rotation.x = Math.PI / 2;
  const lampR = add(new THREE.CylinderGeometry(0.11, 0.08, 0.14, 12), M.steelChassis, 'truck_headlamp_right', 'metal', V(0.48, 2.45, 0.72));
  lampR.rotation.x = Math.PI / 2;

  if (options.pos) {
    truck.position.copy(V(...options.pos));
  }
  if (options.yaw) {
    truck.rotation.y = options.yaw;
  }
  return truck;
}
