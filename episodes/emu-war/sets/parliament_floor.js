// SET 6: AUSTRALIAN PARLIAMENT FLOOR (Canberra, December 1932)
// Australian Federal Parliament chamber: mahogany timber benches, green ministerial leather,
// polished brass mace and railings, humiliated Major Meredith testifying,
// and a triumphant, smug 3D emu standing on the bench wearing a golden military medal.

import { buildEmu } from './emu_flock.js';

export async function build(THREE, scene, film, ctx) {
  const { B2T, toon, pbr, relief } = ctx;
  const V = (x, y, z) => B2T([x, y, z]);
  const root = new THREE.Group();
  root.name = 'parliament_floor';

  const RL = (kind, c, o = {}) => relief ? relief(kind, c, o) : toon(c);
  const MT = (kind, o = {}) => pbr ? pbr.metal(kind, o) : toon(o.toon || o.color || '#3c4470');

  const M = {
    mahoganyWood: RL('wood', '#462414', { scale: 1.0 }),
    greenCarpet: RL('mud', '#1c3622', { scale: 1.6 }),
    chamberStoneWall: RL('stone', '#585248', { scale: 1.5 }),
    brassMace: MT('brass', { color: '#d8aa32', rough: 0.25, toon: '#c09628' }),
    goldMedal: MT('gold', { color: '#ffc820', rough: 0.2, toon: '#e6b218' }),
    medalRibbon: new THREE.MeshStandardMaterial({ color: 0x9e2020, roughness: 0.7 }),
    lampGlow: new THREE.MeshBasicMaterial({ color: 0xffe6a0 }),
    contactAO: new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.55 })
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

  const box = (w, d, h, x, y, z, mat, name, role = 'prop', parent = root) => {
    return add(new THREE.BoxGeometry(w, h, d), mat, name, role, V(x, y, z + h / 2), parent);
  };

  // 1. CHAMBER WALLS & GREEN LEATHER CARPET FLOOR
  box(20, 16, 0.1, 0, 4, -0.05, M.greenCarpet, 'parliament_carpet', 'ground');
  box(20, 0.4, 6.0, 0, 10.0, 0, M.mahoganyWood, 'chamber_back_wood_wall', 'wood');
  box(0.4, 16, 6.0, -8.0, 4.0, 0, M.mahoganyWood, 'chamber_left_wood_wall', 'wood');
  box(0.4, 16, 6.0, 8.0, 4.0, 0, M.mahoganyWood, 'chamber_right_wood_wall', 'wood');

  // 2. PARLIAMENTARY BENCHES (Tiered mahogany seating)
  for (let tier = 0; tier < 3; tier++) {
    const yPos = 3.5 + tier * 1.6;
    const zPos = tier * 0.35;
    // Opposition benches (Left)
    box(4.5, 0.75, 0.45, -4.2, yPos, zPos, M.mahoganyWood, `bench_left_${tier}`, 'wood');
    box(4.5, 0.12, 0.55, -4.2, yPos + 0.35, zPos + 0.45, M.mahoganyWood, `bench_back_left_${tier}`, 'wood');

    // Government benches (Right)
    box(4.5, 0.75, 0.45, 4.2, yPos, zPos, M.mahoganyWood, `bench_right_${tier}`, 'wood');
    box(4.5, 0.12, 0.55, 4.2, yPos + 0.35, zPos + 0.45, M.mahoganyWood, `bench_back_right_${tier}`, 'wood');
  }

  // 3. SPEAKER'S ROSTRUM & TABLE OF THE HOUSE
  box(2.8, 1.6, 0.85, 0.0, 2.5, 0.0, M.mahoganyWood, 'table_of_the_house', 'wood');
  box(2.2, 1.2, 1.45, 0.0, 7.8, 0.4, M.mahoganyWood, 'speakers_rostrum', 'wood');

  // 4. POLISHED BRASS PARLIAMENTARY MACE ON TABLE
  const mace = add(new THREE.CylinderGeometry(0.025, 0.025, 1.4, 12), M.brassMace, 'parliament_mace_shaft', 'metal', V(0.0, 2.5, 0.88));
  mace.rotation.z = Math.PI / 2;
  const maceHead = add(new THREE.SphereGeometry(0.08, 16, 12), M.brassMace, 'parliament_mace_crown', 'metal', V(0.68, 2.5, 0.88));

  // Brass railings
  for (const rx of [-1.8, 1.8]) {
    const rail = add(new THREE.CylinderGeometry(0.03, 0.03, 3.2, 8), M.brassMace, `brass_railing_${rx}`, 'metal', V(rx, 4.0, 0.95));
    rail.rotation.x = Math.PI / 2;
  }

  // 5. WARM CHANDELIER PENDANT LAMPS
  for (const ly of [2.0, 6.0]) {
    const rod = add(new THREE.CylinderGeometry(0.015, 0.015, 1.8, 6), M.brassMace, `lamp_rod_${ly}`, 'metal', V(0.0, ly, 4.2));
    const dome = add(new THREE.ConeGeometry(0.45, 0.35, 16, 1, true), M.brassMace, `lamp_dome_${ly}`, 'metal', V(0.0, ly, 3.4));
    dome.rotation.x = Math.PI;
    const bulb = add(new THREE.SphereGeometry(0.12, 12, 8), M.lampGlow, `lamp_bulb_${ly}`, 'lamp', V(0.0, ly, 3.3));
  }

  // 6. TRIUMPHANT 3D EMU WEARING GOLD MILITARY MEDAL (The Ironic Payoff!)
  const victorEmu = buildEmu(THREE, ctx, {
    pos: [0.0, 2.5, 0.85], // Standing proudly on the central table!
    yaw: 0.0, // Facing the ministers and camera
    scale: 1.1,
    running: false
  });

  // Golden Medal around the Emu's neck
  const ribbonCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.06, 1.55, 0.32),
    new THREE.Vector3(0.0, 1.35, 0.42),
    new THREE.Vector3(-0.06, 1.55, 0.32)
  ]);
  const ribbonMesh = new THREE.Mesh(new THREE.TubeGeometry(ribbonCurve, 12, 0.018, 6), M.medalRibbon);
  victorEmu.add(ribbonMesh);

  const medalDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.014, 18), M.goldMedal);
  medalDisc.rotation.x = 0.25;
  medalDisc.position.set(0.0, 1.32, 0.44);
  victorEmu.add(medalDisc);

  root.add(victorEmu);

  // 7. CONTACT AO SHADOWS
  const meredithAO = add(new THREE.PlaneGeometry(0.7, 0.35), M.contactAO, 'meredith_parliament_ao', 'shadow', V(-1.2, 1.5, 0.01));
  meredithAO.rotation.x = -Math.PI / 2;

  scene.add(root);

  return {
    anchors: {
      meredith_podium: V(-1.2, 1.5, 0.0),
      table_center: V(0.0, 2.5, 0.85),
      speakers_chair: V(0.0, 7.8, 1.45)
    },
    update: (time, dt) => {
      // Subtle proud head tilt and bob
      const emuHead = victorEmu.getObjectByName('emu_head_group');
      if (emuHead) {
        emuHead.rotation.z = Math.sin(time * 2.5) * 0.08;
        emuHead.rotation.x = Math.cos(time * 2.0) * 0.05;
      }
    }
  };
}
