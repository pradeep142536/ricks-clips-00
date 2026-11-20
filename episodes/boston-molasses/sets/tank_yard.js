// SET S1: BOSTON COMMERCIAL STREET & THE USAA MOLASSES TANK (January 1919)
// Built with full Kit3D PBR metals, normal relief on brick/cobblestone, contact shadows, and 30+ props.

export async function build(THREE, scene, film, ctx) {
  const { B2T, toon } = ctx;
  const V = (x, y, z) => B2T([x, y, z]);
  const root = new THREE.Group();
  root.name = 'tank_yard';

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

  const box = (w, d, h, x, y, z, mat, name, role = 'plaster', yaw = 0) => {
    const m = add(new THREE.BoxGeometry(w, h, d), mat, name, role, V(x, y, z + h / 2));
    m.rotation.y = yaw;
    return m;
  };

  // Materials & Shaders
  const RL = (kind, c, o = {}) => ctx.relief ? ctx.relief(kind, c, o) : toon(c);
  const MT = (kind, o = {}) => ctx.pbr ? ctx.pbr.metal(kind, o) : toon(o.toon || o.color || '#3c4470');

  const M = {
    cobble: RL('stone', '#443f3b', { scale: 1.4 }),
    curb: RL('stone', '#5c5650', { scale: 0.8 }),
    brick: RL('stone', '#8b382c', { scale: 1.2 }),
    brickDark: RL('stone', '#652920', { scale: 1.2 }),
    tankSteel: MT('iron', { color: '#3d2b22', rough: 0.42, rust: 0.35, toon: '#42281a' }),
    tankBand: MT('iron', { color: '#251b16', rough: 0.3, rust: 0.2, toon: '#25170f' }),
    rivet: MT('steel', { color: '#4a3528', rough: 0.35, toon: '#3a2015' }),
    molassesGloss: new THREE.MeshStandardMaterial({ color: 0x180a04, roughness: 0.08, metalness: 0.25 }),
    molassesWet: new THREE.MeshStandardMaterial({ color: 0x120703, roughness: 0.04, metalness: 0.35 }),
    woodPlank: RL('wood', '#855938', { scale: 1.1 }),
    woodDark: RL('wood', '#573822', { scale: 1.1 }),
    lampIron: MT('iron', { color: '#1a1c22', rough: 0.25, toon: '#181a20' }),
    lampGlow: new THREE.MeshBasicMaterial({ color: 0xffe6a8 }),
    tinBucket: MT('steel', { color: '#88929e', rough: 0.22, toon: '#78828e' }),
    paintBrown: new THREE.MeshStandardMaterial({ color: 0x5a341f, roughness: 0.6, metalness: 0.1 })
  };

  // Contact shadow texture
  const makeSoftTex = () => {
    const c = document.createElement('canvas');
    c.width = 64; c.height = 64;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(25, 12, 18, 0.6)');
    gr.addColorStop(1, 'rgba(25, 12, 18, 0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, 64, 64);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  const softTex = makeSoftTex();
  const contact = (x, y, rx, ry = rx, op = 0.5) => {
    const m = add(new THREE.CircleGeometry(1, 20),
      new THREE.MeshBasicMaterial({ map: softTex, color: 0x22110c, transparent: true, opacity: op, depthWrite: false }),
      'contact_shadow', 'fx', V(x, y, 0.02));
    m.rotation.x = -Math.PI / 2;
    m.scale.set(rx, ry, 1);
    m.castShadow = false;
    m.receiveShadow = false;
    m.renderOrder = 1;
    return m;
  };

  // 1. Street Ground (Cobblestone)
  const streetGeo = new THREE.PlaneGeometry(36, 36);
  const street = add(streetGeo, M.cobble, 'street_ground', 'ground', V(0, 0, 0));
  street.rotation.x = -Math.PI / 2;

  // Sidewalk Curb (X = -2.5 to -8.0)
  box(6.0, 30.0, 0.18, -5.5, 0.0, 0.0, M.curb, 'sidewalk_slab', 'stone');

  // 2. Giant USAA Molasses Tank (Commercial Street)
  // 50 ft (15m) tall, 27m diameter curved steel section
  // Positioned back and to the right so it forms a dramatic backdrop without blocking the camera line of sight
  const tankRadius = 9.0;
  const tankH = 15.0;
  const tankCenterX = 10.5;
  const tankCenterY = 7.5;

  const tankGeo = new THREE.CylinderGeometry(tankRadius, tankRadius, tankH, 48, 1, false, 0, Math.PI * 2);
  const tankMesh = add(tankGeo, M.tankSteel, 'molasses_tank', 'metal', V(tankCenterX, tankCenterY, tankH / 2));
  tankMesh.rotation.z = Math.PI; // vertical cylinder in Three.js coords

  // Rivet bands & Stiffener Rings (6 horizontal tiers)
  for (let tz = 1.8; tz < tankH; tz += 2.2) {
    const bandGeo = new THREE.CylinderGeometry(tankRadius + 0.04, tankRadius + 0.04, 0.22, 48, 1, true);
    add(bandGeo, M.tankBand, `tank_band_${tz}`, 'metal', V(tankCenterX, tankCenterY, tz));

    // Ring of 3D Rivet heads
    const rivetCount = 36;
    for (let r = 0; r < rivetCount; r++) {
      const ang = (r / rivetCount) * Math.PI * 2;
      const rx = tankCenterX + Math.cos(ang) * (tankRadius + 0.06);
      const ry = tankCenterY + Math.sin(ang) * (tankRadius + 0.06);
      const rivetGeo = new THREE.SphereGeometry(0.06, 6, 6);
      add(rivetGeo, M.rivet, `rivet_${tz}_${r}`, 'metal', V(rx, ry, tz));
    }
  }

  // Molasses Leak Streaks dripping down tank seam
  const leakPositions = [-0.8, -0.2, 0.5, 1.2, 2.0];
  for (const lx of leakPositions) {
    const leakGeo = new THREE.BoxGeometry(0.12, 0.08, 6.5);
    const ang = -0.45 + lx * 0.15;
    const px = tankCenterX + Math.cos(ang) * (tankRadius + 0.02);
    const py = tankCenterY + Math.sin(ang) * (tankRadius + 0.02);
    const leakMesh = add(leakGeo, M.molassesWet, 'molasses_leak_streak', 'liquid', V(px, py, 4.0));
    leakMesh.rotation.y = -ang;
  }

  // Brown "Cover-Up" Paint patch (where the company painted the tank to hide leaks)
  const patchGeo = new THREE.CylinderGeometry(tankRadius + 0.03, tankRadius + 0.03, 5.0, 16, 1, true, -0.6, 1.2);
  add(patchGeo, M.paintBrown, 'brown_coverup_patch', 'metal', V(tankCenterX, tankCenterY, 3.2));

  // Big viscous molasses pool on the cobblestones
  const poolGeo = new THREE.CircleGeometry(4.2, 28);
  const pool = add(poolGeo, M.molassesGloss, 'molasses_ground_pool', 'liquid', V(tankCenterX - 7.5, tankCenterY - 4.5, 0.03));
  pool.rotation.x = -Math.PI / 2;

  // Smaller trickling puddle near sidewalk
  const p2Geo = new THREE.CircleGeometry(1.6, 20);
  const p2 = add(p2Geo, M.molassesGloss, 'molasses_puddle_near', 'liquid', V(-1.0, 1.5, 0.025));
  p2.rotation.x = -Math.PI / 2;

  // 3. Red Brick Boston North End Warehouse Facades (West side)
  box(4.5, 18.0, 10.0, -8.5, 0.0, 0.0, M.brick, 'boston_warehouse', 'brick');
  // Stone window lintels & sills
  for (let wy = -6.0; wy <= 6.0; wy += 3.0) {
    for (let wz of [2.2, 5.5, 8.2]) {
      box(0.2, 1.2, 1.6, -6.3, wy, wz, M.woodDark, `window_frame_${wy}_${wz}`, 'wood');
      box(0.35, 1.4, 0.12, -6.2, wy, wz - 0.8, M.curb, `window_sill_${wy}_${wz}`, 'stone');
    }
  }

  // 4. Props & Street Furniture (Dense 1919 Atmosphere)
  // Wooden Staging / Work Ladder leaning near the tank
  box(0.08, 0.08, 4.5, tankCenterX - 8.2, tankCenterY - 3.8, 0.0, M.woodPlank, 'ladder_rail_l', 'wood', 0.25);
  box(0.08, 0.08, 4.5, tankCenterX - 8.2, tankCenterY - 3.2, 0.0, M.woodPlank, 'ladder_rail_r', 'wood', 0.25);
  for (let rz = 0.4; rz < 4.0; rz += 0.4) {
    box(0.06, 0.6, 0.04, tankCenterX - 8.2, tankCenterY - 3.5, rz, M.woodPlank, `rung_${rz}`, 'wood', 0.25);
  }

  // Molasses wooden barrels with iron hoops
  const barrel = (x, y, yaw = 0) => {
    const bGeo = new THREE.CylinderGeometry(0.42, 0.46, 1.0, 14);
    const bMesh = add(bGeo, M.woodDark, 'wooden_barrel', 'wood', V(x, y, 0.5));
    bMesh.rotation.y = yaw;
    // Iron hoops
    const h1 = add(new THREE.TorusGeometry(0.45, 0.03, 6, 14), M.tankBand, 'hoop_top', 'metal', V(x, y, 0.8));
    const h2 = add(new THREE.TorusGeometry(0.45, 0.03, 6, 14), M.tankBand, 'hoop_bot', 'metal', V(x, y, 0.2));
    contact(x, y, 0.55, 0.55, 0.6);
  };
  barrel(-2.2, -1.8, 0.2);
  barrel(-1.4, -2.2, -0.4);
  barrel(-2.0, -2.8, 0.8);
  barrel(1.5, 4.2, 0.3);
  barrel(2.2, 3.8, -0.2);

  // Stack of wooden cargo crates
  box(0.9, 0.9, 0.8, -2.5, -4.5, 0.0, M.woodPlank, 'cargo_crate_1', 'wood', 0.1);
  box(0.85, 0.85, 0.75, -2.4, -4.5, 0.8, M.woodPlank, 'cargo_crate_2', 'wood', -0.15);
  contact(-2.5, -4.5, 1.2, 1.2, 0.65);

  // Kid's tin collection bucket near the leak
  const buckGeo = new THREE.CylinderGeometry(0.22, 0.16, 0.35, 12);
  add(buckGeo, M.tinBucket, 'syrup_tin_bucket', 'metal', V(-0.6, 1.2, 0.18));
  contact(-0.6, 1.2, 0.25, 0.25, 0.4);

  // Boston 1919 Gas Street Lamp
  const lampPoleGeo = new THREE.CylinderGeometry(0.08, 0.12, 3.4, 10);
  add(lampPoleGeo, M.lampIron, 'gas_lamp_pole', 'metal', V(-2.6, 2.8, 1.7));
  const lampHeadGeo = new THREE.OctahedronGeometry(0.3, 0);
  add(lampHeadGeo, M.lampIron, 'gas_lamp_casing', 'metal', V(-2.6, 2.8, 3.4));
  const lampLight = new THREE.PointLight(0xffe090, 1.8, 7.0);
  lampLight.name = 'gas_lamp_light';
  lampLight.position.copy(V(-2.6, 2.8, 3.4));
  root.add(lampLight);
  contact(-2.6, 2.8, 0.35, 0.35, 0.5);

  scene.add(root);
  return {
    anchors: {
      tank_ladder: V(tankCenterX - 8.2, tankCenterY - 3.5, 0.0),
      leak_spot: V(-0.8, 1.2, 0.0),
      sidewalk_safe: V(-3.5, 0.0, 0.18)
    }
  };
}
