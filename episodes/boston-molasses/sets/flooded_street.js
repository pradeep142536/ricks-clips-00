// SET S3: FLOODED NORTH END COMMERCIAL STREET (AFTERMATH)
// Waist-deep hardening molasses lake, knocked-over wagons, tilted gas lamp, and splintered houses.

export async function build(THREE, scene, film, ctx) {
  const { B2T, toon } = ctx;
  const V = (x, y, z) => B2T([x, y, z]);
  const root = new THREE.Group();
  root.name = 'flooded_street';
  if (ctx.sky?.clouds) ctx.sky.clouds({
    kind: ctx.place?.sky_kind || 'dusk-storm',
    seed: 1919,
    coverage: 0.85,
    scale: 1.1,
    sunDir: [-0.35, 0.6, 0.3]
  });

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

  const box = (w, d, h, x, y, z, mat, name, role = 'wood', yaw = 0, roll = 0, pitch = 0) => {
    const m = add(new THREE.BoxGeometry(w, h, d), mat, name, role, V(x, y, z + h / 2));
    m.rotation.y = yaw;
    m.rotation.z = roll;
    m.rotation.x = pitch;
    return m;
  };

  const RL = (kind, c, o = {}) => ctx.relief ? ctx.relief(kind, c, o) : toon(c);
  const MT = (kind, o = {}) => ctx.pbr ? ctx.pbr.metal(kind, o) : toon(o.toon || o.color || '#3c4470');

  const M = {
    cobble: RL('stone', '#2c2724', { scale: 1.5 }),
    brick: RL('stone', '#722e24', { scale: 1.2 }),
    brickShattered: RL('stone', '#5c241c', { scale: 0.9 }),
    woodPlank: RL('wood', '#6b4629', { scale: 1.0 }),
    woodHardened: RL('wood', '#422816', { scale: 1.0 }),
    ironLamp: MT('iron', { color: '#181a20', rough: 0.35, toon: '#16171d' }),
    molassesDeep: new THREE.MeshStandardMaterial({ color: 0x120602, roughness: 0.05, metalness: 0.35 }),
    molassesCrust: new THREE.MeshStandardMaterial({ color: 0x241107, roughness: 0.38, metalness: 0.15 }),
    debrisSplinter: RL('wood', '#8a5c36', { scale: 0.8 }),
    curbStone: RL('stone', '#4e4842', { scale: 0.8 })
  };

  // 1. Street Bed & Sidewalks
  const streetGeo = new THREE.PlaneGeometry(36, 36);
  const street = add(streetGeo, M.cobble, 'street_ground', 'ground', V(0, 0, 0));
  street.rotation.x = -Math.PI / 2;

  // 2. THE VISCOUS MOLASSES FLOOD LAKE (0.65m deep across the whole street)
  // Deep reflective molasses layer
  const floodGeo = new THREE.PlaneGeometry(35.5, 35.5);
  const flood = add(floodGeo, M.molassesDeep, 'molasses_flood_surface', 'liquid', V(0, 0, 0.65));
  flood.rotation.x = -Math.PI / 2;

  // Thick cooling molasses crust patches along the curbs
  for (let cy = -12.0; cy <= 12.0; cy += 4.5) {
    const crustGeo = new THREE.CircleGeometry(1.8, 16);
    const crustL = add(crustGeo, M.molassesCrust, `molasses_crust_l_${cy}`, 'liquid', V(-3.2, cy, 0.66));
    crustL.rotation.x = -Math.PI / 2;
    const crustR = add(crustGeo, M.molassesCrust, `molasses_crust_r_${cy}`, 'liquid', V(3.2, cy + 1.2, 0.66));
    crustR.rotation.x = -Math.PI / 2;
  }

  // 3. Knocked-over North End Wooden Buildings & Rowhouse
  // Tilted brick house wall knocked off foundation (West side)
  const knockedWall = box(0.8, 8.5, 7.5, -6.5, -1.0, 0.3, M.brick, 'knocked_brick_wall', 'brick', 0.08, -0.15);
  // Splintered timber porch collapsed into the syrup
  box(2.2, 4.0, 0.3, -4.6, -1.2, 0.55, M.woodPlank, 'collapsed_porch', 'wood', 0.12, 0.22);

  // 4. OVERTURNED HORSE-DRAWN DELIVERY WAGON
  // Wagon body tilted upside-down in the 2-ft molasses pool
  const wagonBox = box(1.8, 3.2, 0.9, 0.8, 1.2, 0.45, M.woodHardened, 'overturned_wagon_body', 'wood', 0.35, 0.65, -0.2);
  // Broken splintered wheels sticking up out of the syrup
  const w1Geo = new THREE.TorusGeometry(0.65, 0.06, 8, 16);
  const w1Mesh = add(w1Geo, M.woodPlank, 'stuck_wagon_wheel_1', 'wood', V(0.2, 2.5, 1.4));
  w1Mesh.rotation.x = 0.5;
  w1Mesh.rotation.y = 0.8;

  const w2Geo = new THREE.TorusGeometry(0.65, 0.06, 8, 16);
  const w2Mesh = add(w2Geo, M.woodPlank, 'stuck_wagon_wheel_2', 'wood', V(1.4, 0.0, 1.2));
  w2Mesh.rotation.x = -0.4;
  w2Mesh.rotation.z = 0.9;

  // 5. TILTING BOSTON GAS STREET LAMP
  // Tilted at a 28-degree angle by the flood surge
  const lampPoleGeo = new THREE.CylinderGeometry(0.08, 0.12, 3.4, 10);
  const lamp = add(lampPoleGeo, M.ironLamp, 'tilted_gas_lamp', 'metal', V(-2.4, -2.5, 1.4));
  lamp.rotation.z = 0.45; // Lean into the street
  lamp.rotation.y = 0.1;
  const lampHeadGeo = new THREE.OctahedronGeometry(0.28, 0);
  const lampHead = add(lampHeadGeo, M.ironLamp, 'tilted_lamp_head', 'metal', V(-1.7, -2.5, 2.8));
  lampHead.rotation.z = 0.45;

  // 6. Half-Submerged Barrels and Floating Urban Debris
  const stuckBarrel = (x, y, roll = 0.4, pitch = 0.2) => {
    const bGeo = new THREE.CylinderGeometry(0.42, 0.46, 1.0, 14);
    const bMesh = add(bGeo, M.woodHardened, 'submerged_barrel', 'wood', V(x, y, 0.55));
    bMesh.rotation.z = roll;
    bMesh.rotation.x = pitch;
  };
  stuckBarrel(-1.2, -3.8, 0.5, 0.2);
  stuckBarrel(2.2, 3.5, -0.6, 0.3);
  stuckBarrel(-0.4, 4.2, 0.8, -0.2);

  // Floating wooden planks and kindling debris
  box(0.3, 2.2, 0.08, -1.8, 2.0, 0.67, M.debrisSplinter, 'floating_plank_1', 'wood', 0.4);
  box(0.25, 1.8, 0.08, 1.2, -2.2, 0.68, M.debrisSplinter, 'floating_plank_2', 'wood', -0.5);
  box(0.4, 1.4, 0.1, 0.0, -1.0, 0.69, M.debrisSplinter, 'floating_crate_lid', 'wood', 0.15);

  // Rebuild the far street as a readable 1919 neighbourhood: facade planes,
  // windows, rooflines and practical lamps add the layered 3D background seen
  // in the approved references instead of a flat wall behind the flood.
  for (const [x, y, w, h] of [[-13, 10, 5, 7], [-7, 12, 4, 6], [7, 13, 5, 8], [13, 11, 4, 6]]) {
    box(w, 1.0, h, x, y, 0, M.brick, `street_rowhouse_${x}`, 'brick');
    for (let wx = -w * 0.3; wx <= w * 0.3; wx += 0.75) {
      for (let wz = 1.4; wz < h - 0.4; wz += 1.45) box(0.28, 0.08, 0.42, x + wx, y - 0.54, wz, M.ironLamp, `street_window_${x}_${wx}_${wz}`, 'metal');
    }
    box(0.32, 0.35, 1.3, x + w * 0.28, y + 0.2, h, M.brickShattered, `street_chimney_${x}`, 'brick');
  }
  for (const [x, y] of [[-10, 5], [-4, 6], [5, 6], [11, 5]]) {
    add(new THREE.CylinderGeometry(0.07, 0.1, 3.2, 8), M.ironLamp, `street_gas_pole_${x}`, 'metal', V(x, y, 1.6));
    add(new THREE.SphereGeometry(0.2, 10, 8), M.curbStone, `street_gas_globe_${x}`, 'light', V(x, y, 3.25));
  }
  for (const [x, y, z] of [[-8, 2.8, 1.2], [6, 1.5, 1.0], [10, -2.0, 0.9]]) {
    box(1.5, 1.1, z, x, y, 0.7, M.woodPlank, `street_rescue_crate_${x}`, 'wood');
    box(1.6, 0.06, 0.06, x, y - 0.56, 1.1, M.ironLamp, `street_crate_band_${x}`, 'metal');
  }

  scene.add(root);
  return {
    anchors: {
      wagon_wreckage: V(0.8, 1.2, 0.65),
      tilted_lamp: V(-2.4, -2.5, 0.65),
      porch_shelter: V(-4.6, -1.2, 0.65)
    }
  };
}
