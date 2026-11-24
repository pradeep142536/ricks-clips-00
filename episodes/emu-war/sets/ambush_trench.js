// SET 2: DUSTY AMBUSH TRENCH (Western Australia, 1932)
// Dug-out earth trench with stacked sandbag parapet, timber revetment shoring,
// duckboard walkway, firmly mounted Lewis Machine Gun on swivel tripod,
// and a stampeding herd of 3D sprinting emus charging across the red horizon.

import { buildEmuFlock } from './emu_flock.js';

export async function build(THREE, scene, film, ctx) {
  const { B2T, toon, pbr, relief, sky, trees } = ctx;
  const V = (x, y, z) => B2T([x, y, z]);
  const root = new THREE.Group();
  root.name = 'ambush_trench';

  // 1. DYNAMIC SKY
  if (sky?.clouds) {
    sky.clouds({
      kind: 'clear-day',
      seed: 1932,
      coverage: 0.30,
      scale: 1.2,
      sunDir: [0.45, 0.70, 0.40]
    });
  }

  const RL = (kind, c, o = {}) => relief ? relief(kind, c, o) : toon(c);
  const MT = (kind, o = {}) => pbr ? pbr.metal(kind, o) : toon(o.toon || o.color || '#3c4470');

  const M = {
    redSoil: RL('mud', '#a24224', { scale: 1.8 }),
    sandbagBurlap: new THREE.MeshStandardMaterial({ color: 0xc8b68a, roughness: 0.85, metalness: 0.05 }),
    trenchTimber: RL('wood', '#583e28', { scale: 1.1 }),
    duckboardWood: RL('wood', '#6a4a30', { scale: 0.9 }),
    gunSteel: MT('steel', { color: '#18191e', rough: 0.32, toon: '#141518' }),
    gunBrass: MT('brass', { color: '#caa034', rough: 0.35, toon: '#b28a28' }),
    spentBrass: MT('brass', { color: '#d8b248', rough: 0.25, toon: '#c49e38' }),
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

  // 2. SURROUNDING DESERT GROUND & EMBANKMENT
  const groundGeo = new THREE.PlaneGeometry(50, 50);
  const ground = add(groundGeo, M.redSoil, 'desert_soil_field', 'ground', V(0, 8, 0));
  ground.rotation.x = -Math.PI / 2;

  // 3. EXCAVATED TRENCH SHORING & TIMBER REVETMENTS
  // Duckboard floor for soldiers inside the trench (standing at z = -0.35m)
  for (let b = -4; b <= 4; b += 0.85) {
    box(0.80, 1.4, 0.04, b, 0.0, -0.34, M.duckboardWood, `duckboard_${b}`, 'wood');
  }
  // Front trench revetment wall (vertical timber shoring planks)
  for (let px = -5.0; px <= 5.0; px += 0.28) {
    box(0.26, 0.08, 1.35, px, 0.85, -0.40, M.trenchTimber, `revetment_plank_${px}`, 'wood');
  }

  // 4. STACKED SANDBAG PARAPET (Rounded burlap sandbag rows)
  const bagGeo = new THREE.BoxGeometry(0.55, 0.32, 0.18);
  for (let row = 0; row < 3; row++) {
    const zOffset = 0.85 + row * 0.17;
    for (let bx = -4.8; bx <= 4.8; bx += 0.52) {
      const stagger = (row % 2) * 0.25;
      const bag = add(bagGeo, M.sandbagBurlap, `sandbag_${row}_${bx}`, 'prop', V(bx + stagger, 0.88, zOffset));
      bag.rotation.z = (Math.sin(bx * 3) * 0.04);
      bag.rotation.x = 0.08;
    }
  }

  // 5. PARAPET-MOUNTED LEWIS MACHINE GUN ON PINTLE TRIPOD
  const gunMount = new THREE.Group();
  gunMount.name = 'trench_lewis_gun_mount';
  gunMount.position.copy(V(0.0, 0.82, 1.15));

  // Brass pintle & steel tripod legs
  const tripodHead = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.18, 12), M.gunBrass);
  tripodHead.position.y = 0.09;
  gunMount.add(tripodHead);

  // Lewis Machine Gun
  const gunBody = new THREE.Group();
  gunBody.name = 'lewis_gun_body';
  gunBody.position.y = 0.18;

  // Barrel Cooling Shroud & Muzzle
  const shroud = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.95, 16), M.gunSteel);
  shroud.rotation.x = Math.PI / 2;
  shroud.position.set(0, 0, -0.36);
  shroud.castShadow = true;
  gunBody.add(shroud);

  const muzzle = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.12, 16), M.gunSteel);
  muzzle.rotation.x = -Math.PI / 2;
  muzzle.position.set(0, 0, -0.88);
  gunBody.add(muzzle);

  // Receiver & 97-round Pan Drum
  const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.38), M.gunSteel);
  receiver.position.set(0, 0, 0.12);
  gunBody.add(receiver);

  const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.05, 18), M.gunSteel);
  drum.position.set(0, 0.085, 0.05);
  gunBody.add(drum);

  // Spade grips (Where gunner's hands lock on)
  const spadeBar = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.16, 8), M.gunSteel);
  spadeBar.position.set(0, 0.0, 0.35);
  gunBody.add(spadeBar);

  gunMount.add(gunBody);
  root.add(gunMount);

  // 6. SCATTERED SPENT BRASS CARTRIDGES
  const casingGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.055, 6);
  for (let c = 0; c < 24; c++) {
    const cx = -0.5 + Math.sin(c * 4.2) * 0.7;
    const cy = 0.4 + Math.cos(c * 3.1) * 0.4;
    const casing = add(casingGeo, M.spentBrass, `spent_casing_${c}`, 'prop', V(cx, cy, -0.32));
    casing.rotation.set(Math.PI / 2, c * 0.5, Math.sin(c));
  }

  // 7. CHARGING STAMPEDE OF 3D EMU FLOCK (Charging from the horizon toward the trench)
  const chargingEmus = buildEmuFlock(THREE, ctx, {
    count: 18,
    baseX: 0.0,
    baseY: 10.5,
    spreadX: 16.0,
    spreadY: 6.0,
    yaw: Math.PI // Full frontal charge toward the soldiers
  });
  root.add(chargingEmus);

  // 8. PROCEDURAL HORIZON TREES
  if (trees?.tree) {
    trees.tree({ kind: 'cypress', at: [-8.5, 16.0, 0], seed: 77, height: 8.5 });
    trees.tree({ kind: 'olive', at: [9.2, 18.0, 0], seed: 88, height: 6.5 });
  }

  // 9. CONTACT AO SHADOW FOR GUNNER
  const gunnerAO = add(new THREE.PlaneGeometry(0.65, 0.35), M.contactAO, 'gunner_trench_ao', 'shadow', V(0.0, 0.2, -0.33));
  gunnerAO.rotation.x = -Math.PI / 2;

  scene.add(root);

  return {
    anchors: {
      gunner_station: V(0.0, 0.2, -0.35),
      meredith_trench: V(1.2, 0.1, -0.35),
      gun_grip: V(0.0, 0.82, 1.33),
      emu_charge: V(0.0, 10.5, 0.0)
    },
    update: (time, dt) => {
      chargingEmus.userData.update && chargingEmus.userData.update(time);
    }
  };
}
