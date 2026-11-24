// SET 4: BROKEN FARM FENCE (Angry Wheat Farmer)
// Splintered timber fence, snapped barbed wire strands, trampled golden wheat,
// leaping 3D emus bursting through the gap, and sunset Outback dust.

import { buildEmu } from './emu_flock.js';

export async function build(THREE, scene, film, ctx) {
  const { B2T, toon, pbr, relief, sky, trees } = ctx;
  const V = (x, y, z) => B2T([x, y, z]);
  const root = new THREE.Group();
  root.name = 'broken_fence';

  // 1. SUNSET DUSK SKY
  if (sky?.clouds) {
    sky.clouds({
      kind: 'dusk-storm',
      seed: 1932,
      coverage: 0.40,
      scale: 1.3,
      sunDir: [0.30, 0.40, 0.70]
    });
  }

  const RL = (kind, c, o = {}) => relief ? relief(kind, c, o) : toon(c);
  const MT = (kind, o = {}) => pbr ? pbr.metal(kind, o) : toon(o.toon || o.color || '#3c4470');

  const M = {
    redSoil: RL('mud', '#9e3e20', { scale: 2.0 }),
    fenceTimber: RL('wood', '#583e28', { scale: 1.1 }),
    fenceSplinter: RL('wood', '#a47c52', { scale: 0.8 }),
    wireMetal: MT('steel', { color: '#525862', rough: 0.4, toon: '#484e58' }),
    wheatGold: new THREE.MeshStandardMaterial({ color: 0xdec068, roughness: 0.85, metalness: 0.05 }),
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

  // 2. RED EARTH GROUND
  const groundGeo = new THREE.PlaneGeometry(45, 45);
  const ground = add(groundGeo, M.redSoil, 'desert_soil_paddock', 'ground', V(0, 4, 0));
  ground.rotation.x = -Math.PI / 2;

  // 3. AUSTRALIAN PADDOCK FENCE WITH SPLINTERED BREACH GAP
  for (let fx = -8; fx <= 8; fx += 2.6) {
    if (Math.abs(fx) < 1.0) continue; // The breached fence gap where emus smashed through!
    box(0.18, 0.18, 1.4, fx, 0.8, 0.0, M.fenceTimber, `fence_post_${fx}`, 'wood');
    // Standing rails on either side
    box(2.6, 0.08, 0.14, fx > 0 ? fx + 1.3 : fx - 1.3, 0.8, 0.45, M.fenceTimber, `fence_rail_lo_${fx}`, 'wood');
    box(2.6, 0.08, 0.14, fx > 0 ? fx + 1.3 : fx - 1.3, 0.8, 0.98, M.fenceTimber, `fence_rail_hi_${fx}`, 'wood');
  }

  // Splintered shattered wooden rails in the center gap
  const splinter1 = box(1.2, 0.08, 0.12, -0.4, 0.8, 0.35, M.fenceSplinter, 'splintered_rail_1', 'wood');
  splinter1.rotation.z = 0.45;
  const splinter2 = box(1.4, 0.08, 0.12, 0.5, 0.75, 0.15, M.fenceSplinter, 'splintered_rail_2', 'wood');
  splinter2.rotation.z = -0.38;
  splinter2.rotation.x = 0.25;

  // Snapped coiled wire strands hanging loose
  for (const s of [-1, 1]) {
    const curlCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(s * 1.3, 0.8, 0.8),
      new THREE.Vector3(s * 0.9, 0.8, 0.5),
      new THREE.Vector3(s * 0.6, 0.7, 0.2)
    ]);
    add(new THREE.TubeGeometry(curlCurve, 16, 0.006, 6), M.wireMetal, `snapped_wire_${s}`, 'metal');
  }

  // 4. LEAPING 3D EMU BURSTING THROUGH THE GAP
  const leapingEmu = buildEmu(THREE, ctx, {
    pos: [0.2, 1.4, 0.35],
    yaw: Math.PI * 0.85,
    scale: 1.15,
    running: true,
    runSpeed: 18.0
  });
  root.add(leapingEmu);

  // 5. DISTANT TREES
  if (trees?.tree) {
    trees.tree({ kind: 'olive', at: [-6.5, 12.0, 0], seed: 55, height: 6.5 });
    trees.tree({ kind: 'cypress', at: [7.5, 14.0, 0], seed: 56, height: 9.0 });
  }

  // 6. CONTACT AO SHADOW FOR ANGRY FARMER
  const farmerAO = add(new THREE.PlaneGeometry(0.75, 0.4), M.contactAO, 'farmer_ao', 'shadow', V(-0.8, 0.0, 0.01));
  farmerAO.rotation.x = -Math.PI / 2;

  scene.add(root);

  return {
    anchors: {
      farmer_spot: V(-0.8, 0.0, 0.0),
      fence_breach: V(0.0, 0.8, 0.6),
      emu_leap: V(0.2, 1.4, 0.35)
    },
    update: (time, dt) => {
      leapingEmu.userData.update && leapingEmu.userData.update(time);
    }
  };
}
