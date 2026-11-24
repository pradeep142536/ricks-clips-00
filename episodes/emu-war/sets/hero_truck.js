// HERO OBJECT: 1930s Australian Military Flatbed Truck (Morris-Commercial / Chevrolet 30-cwt)
// Fully detailed model (15+ articulated sub-components):
// Chassis rails, curved steel fenders, spoked artillery wheels, louvred engine hood,
// brass radiator cap, split-pane windshield, vintage canvas cab with wooden steering wheel,
// slatted timber flatbed with corner brackets, and mounted Lewis Machine Gun on swivel tripod.

export function buildHeroTruck(THREE, ctx, options = {}) {
  const { B2T, toon, pbr, relief } = ctx;
  const V = (x, y, z) => B2T([x, y, z]);
  const truck = new THREE.Group();
  truck.name = 'hero_military_truck';

  const RL = (kind, c, o = {}) => ctx.relief ? ctx.relief(kind, c, o) : toon(c);
  const MT = (kind, o = {}) => ctx.pbr ? ctx.pbr.metal(kind, o) : toon(o.toon || o.color || '#3c4470');

  const M = {
    steelChassis: MT('iron', { color: '#2a2c32', rough: 0.45, rust: 0.2, toon: '#202226' }),
    fenderKhaki: new THREE.MeshStandardMaterial({ color: 0x484632, roughness: 0.55, metalness: 0.25 }),
    canvasCab: RL('wood', '#3c3a28', { scale: 1.2 }),
    woodBed: RL('wood', '#684528', { scale: 1.0 }),
    woodPlank: RL('wood', '#563820', { scale: 1.0 }),
    rubberTire: new THREE.MeshStandardMaterial({ color: 0x1b1c1e, roughness: 0.88, metalness: 0.05 }),
    wheelSpoke: MT('iron', { color: '#3e4248', rough: 0.4, toon: '#34363a' }),
    brassDetail: MT('brass', { color: '#cfa234', rough: 0.3, toon: '#b88f28' }),
    lewisGunSteel: MT('steel', { color: '#18191d', rough: 0.32, toon: '#141518' }),
    exhaustRust: MT('iron', { color: '#5a2e16', rough: 0.75, rust: 0.65, toon: '#4c2612' }),
    windshieldGlass: new THREE.MeshStandardMaterial({ color: 0xb8d4e2, roughness: 0.12, metalness: 0.5, transparent: true, opacity: 0.6 }),
    ammoCrateWood: RL('wood', '#7c5234', { scale: 0.85 }),
    leatherSeat: new THREE.MeshStandardMaterial({ color: 0x3d2618, roughness: 0.65, metalness: 0.1 }),
    shadowMat: new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.55 })
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

  // 1. STEEL CHASSIS & FRONT CHANNEL BUMPER
  box(0.12, 4.6, 0.18, -0.44, 0.0, 0.45, M.steelChassis, 'truck_chassis_rail_left', 'metal');
  box(0.12, 4.6, 0.18, 0.44, 0.0, 0.45, M.steelChassis, 'truck_chassis_rail_right', 'metal');
  box(1.7, 0.14, 0.16, 0.0, 2.38, 0.45, M.steelChassis, 'truck_front_bumper', 'metal');
  box(1.0, 0.12, 0.14, 0.0, -2.18, 0.45, M.steelChassis, 'truck_rear_crossmember', 'metal');

  // 2. SPOKED ARTILLERY WHEELS (4 rotatable wheel assemblies)
  const wheels = [];
  const wheelPositions = [
    [-0.82, 1.35], [0.82, 1.35],   // Front
    [-0.82, -1.25], [0.82, -1.25]  // Rear
  ];
  wheelPositions.forEach(([wx, wy], idx) => {
    const wheelGroup = new THREE.Group();
    wheelGroup.name = `truck_wheel_group_${idx}`;
    wheelGroup.position.copy(V(wx, wy, 0.45));

    // Heavy rubber tire with tread bevels
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.24, 20), M.rubberTire);
    tire.rotation.z = Math.PI / 2;
    tire.castShadow = true;
    wheelGroup.add(tire);

    // Steel Hub & Rim
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.25, 18), M.wheelSpoke);
    rim.rotation.z = Math.PI / 2;
    wheelGroup.add(rim);

    // Spokes (6 cross spokes)
    for (let k = 0; k < 6; k++) {
      const sp = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.58), M.wheelSpoke);
      sp.rotation.x = k * Math.PI / 6;
      wheelGroup.add(sp);
    }

    // Brass Hubcap
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.28, 12), M.brassDetail);
    cap.rotation.z = Math.PI / 2;
    wheelGroup.add(cap);

    truck.add(wheelGroup);
    wheels.push(wheelGroup);
  });

  // 3. CURVED STEEL FENDERS (Wheel Arches)
  for (const s of [-1, 1]) {
    const fenderShape = new THREE.Shape();
    fenderShape.moveTo(-0.16, 0);
    fenderShape.absarc(0, 0, 0.54, Math.PI, 0, true);
    fenderShape.lineTo(0.56, -0.22);
    fenderShape.lineTo(0.56, -0.26);
    fenderShape.absarc(0, 0, 0.58, 0, Math.PI, false);
    fenderShape.closePath();

    const fenderGeo = new THREE.ExtrudeGeometry(fenderShape, { depth: 0.32, bevelEnabled: false });
    const fender = new THREE.Mesh(fenderGeo, M.fenderKhaki);
    fender.position.copy(V(s * 0.88 - (s > 0 ? 0.32 : 0), 1.35, 0.45));
    fender.rotation.y = s > 0 ? 0 : Math.PI;
    fender.castShadow = true;
    truck.add(fender);
  }

  // 4. ENGINE HOOD & RADIATOR GRILLE
  box(1.05, 1.45, 0.78, 0.0, 1.62, 0.55, M.fenderKhaki, 'truck_engine_hood', 'metal');
  // Radiator Shell & Louvers
  box(0.92, 0.08, 0.74, 0.0, 2.36, 0.55, M.steelChassis, 'truck_radiator_shell', 'metal');
  for (let l = 0; l < 8; l++) {
    box(0.78, 0.02, 0.04, 0.0, 2.41, 0.62 + l * 0.08, M.brassDetail, `truck_radiator_slat_${l}`, 'metal');
  }
  // Brass Radiator Cap
  const radCap = add(new THREE.CylinderGeometry(0.04, 0.04, 0.08, 12), M.brassDetail, 'truck_radiator_cap', 'metal', V(0.0, 2.34, 1.34));

  // 5. SPLIT-PANE WINDSHIELD & CAB
  box(1.48, 1.15, 1.15, 0.0, 0.65, 0.62, M.canvasCab, 'truck_cab_body', 'cloth');
  box(1.54, 1.25, 0.08, 0.0, 0.65, 1.78, M.canvasCab, 'truck_cab_roof', 'cloth');
  // Leather Bench Seat
  box(1.36, 0.48, 0.22, 0.0, 0.45, 0.72, M.leatherSeat, 'truck_cab_bench_seat', 'prop');
  // Wooden Steering Wheel
  const wheelMount = add(new THREE.CylinderGeometry(0.025, 0.025, 0.52, 8), M.steelChassis, 'truck_steering_column', 'metal', V(0.36, 0.82, 1.05));
  wheelMount.rotation.x = -0.55;
  const steerRim = add(new THREE.TorusGeometry(0.18, 0.022, 8, 20), M.ammoCrateWood, 'truck_steering_wheel', 'wood', V(0.36, 0.68, 1.25));
  steerRim.rotation.x = 0.55;

  // Split-pane glass windshield
  box(1.38, 0.03, 0.48, 0.0, 1.18, 1.48, M.windshieldGlass, 'truck_windshield_glass', 'glass');
  box(1.42, 0.05, 0.04, 0.0, 1.18, 1.22, M.steelChassis, 'truck_windshield_frame_bottom', 'metal');
  box(1.42, 0.05, 0.04, 0.0, 1.18, 1.72, M.steelChassis, 'truck_windshield_frame_top', 'metal');
  box(0.04, 0.05, 0.50, 0.0, 1.18, 1.47, M.steelChassis, 'truck_windshield_center_divider', 'metal');

  // 6. SLATTED TIMBER TRUCK BED (with stake-racks)
  box(1.88, 2.45, 0.09, 0.0, -1.05, 0.68, M.woodBed, 'truck_wooden_bed_floor', 'wood');
  // Side wooden stake-racks (individual slatted planks)
  for (let p = 0; p < 3; p++) {
    box(0.04, 2.42, 0.10, -0.92, -1.05, 0.78 + p * 0.12, M.woodPlank, `truck_rack_left_slat_${p}`, 'wood');
    box(0.04, 2.42, 0.10, 0.92, -1.05, 0.78 + p * 0.12, M.woodPlank, `truck_rack_right_slat_${p}`, 'wood');
  }
  // Vertical stake posts
  for (const sx of [-0.92, 0.92]) {
    for (const sy of [-2.2, -1.05, 0.1]) {
      box(0.06, 0.06, 0.46, sx, sy, 0.75, M.woodPlank, `truck_rack_post_${sx}_${sy}`, 'wood');
    }
  }

  // 7. SWIVEL TRIPOD PEDESTAL
  const tripodGroup = new THREE.Group();
  tripodGroup.position.copy(V(0.0, -0.75, 0.77));

  // Geared brass azimuth ring on steel base
  const baseFlange = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.06, 16), M.steelChassis);
  tripodGroup.add(baseFlange);
  const azimuthRing = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.024, 8, 24), M.brassDetail);
  azimuthRing.rotation.x = Math.PI / 2;
  azimuthRing.position.y = 0.04;
  tripodGroup.add(azimuthRing);

  // Heavy center pedestal
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.12, 0.62, 12), M.steelChassis);
  pedestal.position.y = 0.34;
  tripodGroup.add(pedestal);

  // Swivel yoke
  const yoke = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.18), M.brassDetail);
  yoke.position.y = 0.68;
  tripodGroup.add(yoke);

  // 8. MOUNTED LEWIS MACHINE GUN (Detailed cooling shroud, drum mag, spade grip)
  const gunGroup = new THREE.Group();
  gunGroup.name = 'mounted_lewis_gun';
  gunGroup.position.y = 0.74;

  if (options.gunPitch) gunGroup.rotation.x = options.gunPitch;
  if (options.gunYaw) gunGroup.rotation.y = options.gunYaw;

  // Finned aluminum barrel cooling shroud
  const shroud = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.062, 0.98, 16), M.lewisGunSteel);
  shroud.rotation.x = Math.PI / 2;
  shroud.position.set(0, 0, -0.38);
  shroud.castShadow = true;
  gunGroup.add(shroud);

  // Muzzle flash-hider cone
  const muzzle = new THREE.Mesh(new THREE.ConeGeometry(0.078, 0.14, 16), M.lewisGunSteel);
  muzzle.rotation.x = -Math.PI / 2;
  muzzle.position.set(0, 0, -0.92);
  gunGroup.add(muzzle);

  // Receiver body
  const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.14, 0.42), M.lewisGunSteel);
  receiver.position.set(0, 0, 0.14);
  gunGroup.add(receiver);

  // 97-round Pan Drum Magazine
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.055, 20), M.lewisGunSteel);
  drum.position.set(0, 0.10, 0.06);
  gunGroup.add(drum);

  // Spade grip
  const gripBar = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.16, 8), M.lewisGunSteel);
  gripBar.position.set(0, -0.01, 0.38);
  gunGroup.add(gripBar);

  tripodGroup.add(gunGroup);
  truck.add(tripodGroup);

  // 9. AMMUNITION CRATES ON BED
  box(0.55, 0.38, 0.28, -0.48, -1.6, 0.85, M.ammoCrateWood, 'truck_ammo_crate_1', 'wood');
  box(0.55, 0.38, 0.28, -0.45, -1.6, 1.13, M.ammoCrateWood, 'truck_ammo_crate_2', 'wood');
  box(0.55, 0.38, 0.28, 0.46, -1.65, 0.85, M.ammoCrateWood, 'truck_ammo_crate_3', 'wood');

  // 10. FRONT HEADLAMPS (2 round brass-rimmed lamps)
  for (const s of [-1, 1]) {
    const lamp = add(new THREE.CylinderGeometry(0.11, 0.08, 0.14, 14), M.steelChassis, `truck_headlamp_${s}`, 'metal', V(s * 0.52, 2.38, 0.74));
    lamp.rotation.x = Math.PI / 2;
    const rim = add(new THREE.TorusGeometry(0.105, 0.016, 8, 16), M.brassDetail, `truck_headlamp_rim_${s}`, 'metal', V(s * 0.52, 2.45, 0.74));
  }

  // 11. GROUND CONTACT SHADOW
  const shadow = add(new THREE.PlaneGeometry(2.4, 5.2), M.shadowMat, 'truck_contact_shadow', 'shadow', V(0.0, 0.0, 0.01));
  shadow.rotation.x = -Math.PI / 2;

  if (options.pos) {
    truck.position.copy(V(...options.pos));
  }
  if (options.yaw) {
    truck.rotation.y = options.yaw;
  }

  // Animation Update function
  truck.userData.update = (time, dt = 0.033, speed = 0) => {
    if (speed > 0) {
      // Rotate wheels
      wheels.forEach(w => {
        w.children[0].rotation.x += speed * dt * 4.5;
      });
      // Chassis road vibration bounce
      truck.position.y = (options.pos ? options.pos[2] : 0.0) + Math.sin(time * 28) * 0.015;
    }
  };

  return truck;
}
