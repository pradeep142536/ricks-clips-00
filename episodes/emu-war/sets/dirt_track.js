// SET 3: BUMPY OUTBACK DIRT TRACK (High-Speed Pursuit)
// Dramatic purple/orange dusk-storm sky (Image 3 look), rutted red desert track,
// roadside telephone poles with sagging wire, moving hero truck with spinning wheels,
// and a galloping flock of 3D sprinting emus outrunning the military vehicle.

import { buildHeroTruck } from './hero_truck.js';
import { buildEmuFlock } from './emu_flock.js';

export async function build(THREE, scene, film, ctx) {
  const { B2T, toon, pbr, relief, sky, trees } = ctx;
  const V = (x, y, z) => B2T([x, y, z]);
  const root = new THREE.Group();
  root.name = 'dirt_track';

  // 1. BILLOWING DUSK-STORM SKY (The Image 3 aesthetic)
  if (sky?.clouds) {
    sky.clouds({
      kind: 'dusk-storm',
      seed: 1932,
      coverage: 0.50,
      scale: 1.4,
      sunDir: [0.35, 0.45, 0.65]
    });
  }

  const RL = (kind, c, o = {}) => relief ? relief(kind, c, o) : toon(c);
  const MT = (kind, o = {}) => pbr ? pbr.metal(kind, o) : toon(o.toon || o.color || '#3c4470');

  const M = {
    desertDirt: RL('mud', '#9e3e20', { scale: 2.2 }),
    trackWheelRuts: RL('mud', '#782d16', { scale: 1.5 }),
    poleTimber: RL('wood', '#563e2a', { scale: 1.2 }),
    poleWire: MT('steel', { color: '#4a505a', rough: 0.35, toon: '#404550' }),
    dustPuffMat: new THREE.MeshBasicMaterial({ color: 0xc89870, transparent: true, opacity: 0.35 }),
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

  // 2. OUTBACK RED EARTH TERRAIN & TRACK
  const groundGeo = new THREE.PlaneGeometry(60, 80);
  const ground = add(groundGeo, M.desertDirt, 'desert_dirt_ground', 'ground', V(0, 10, 0));
  ground.rotation.x = -Math.PI / 2;

  // Twin parallel wheel ruts of the dirt track
  for (const rx of [-0.85, 0.85]) {
    const rut = add(new THREE.PlaneGeometry(0.75, 75), M.trackWheelRuts, `track_rut_${rx}`, 'ground', V(rx, 10, 0.005));
    rut.rotation.x = -Math.PI / 2;
  }

  // 3. ROADSIDE TELEPHONE POLES (Crossarm + ceramic insulators + sagging wires)
  const poles = [];
  for (let py = -10; py <= 40; py += 15) {
    const poleGroup = new THREE.Group();
    // Main timber pole (5m tall)
    const poleMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 5.2, 10), M.poleTimber);
    poleMesh.position.y = 2.6;
    poleMesh.castShadow = true;
    poleGroup.add(poleMesh);

    // Crossarm
    const crossarm = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 0.12), M.poleTimber);
    crossarm.position.set(0, 4.8, 0);
    poleGroup.add(crossarm);

    // White ceramic insulators
    for (const ix of [-0.65, -0.22, 0.22, 0.65]) {
      const ins = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.12, 8), new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.1 }));
      ins.position.set(ix, 4.92, 0);
      poleGroup.add(ins);
    }
    poleGroup.position.copy(V(3.4, py, 0.0));
    root.add(poleGroup);
    poles.push(poleGroup);
  }

  // Sagging telegraph wire along the poles
  const wireCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(3.4, 4.9, 10.0),
    new THREE.Vector3(3.4, 4.4, -5.0),
    new THREE.Vector3(3.4, 4.9, -20.0),
    new THREE.Vector3(3.4, 4.4, -35.0)
  ]);
  const telWire = new THREE.Mesh(new THREE.TubeGeometry(wireCurve, 40, 0.008, 6), M.poleWire);
  root.add(telWire);

  // 4. MOVING HERO MILITARY TRUCK (Articulated with rotating wheels & vibration)
  const heroTruck = buildHeroTruck(THREE, ctx, {
    pos: [0.0, 1.5, 0.0],
    yaw: 0.0
  });
  root.add(heroTruck);

  // 5. TRAILING DUST PUFF PARTICLES BEHIND TRUCK WHEELS
  const dustParticles = [];
  const dustGeo = new THREE.DodecahedronGeometry(0.42, 1);
  for (let d = 0; d < 8; d++) {
    const dustPuff = add(dustGeo, M.dustPuffMat, `dust_puff_${d}`, 'fx', V(-0.6 + Math.sin(d) * 0.4, -1.8 - d * 0.8, 0.35 + d * 0.12));
    dustParticles.push(dustPuff);
  }

  // 6. SPRINTING 3D EMU FLOCK (Galloping alongside and ahead of the roaring truck)
  const pursuitEmus = buildEmuFlock(THREE, ctx, {
    count: 14,
    baseX: -2.8,
    baseY: 6.5,
    spreadX: 5.5,
    spreadY: 12.0,
    yaw: 0.0, // Running forward in pursuit direction
    runSpeed: 16.5
  });
  root.add(pursuitEmus);

  // 7. DISTANT TREES
  if (trees?.tree) {
    trees.tree({ kind: 'cypress', at: [-9.5, 25.0, 0], seed: 42, height: 9.0 });
    trees.tree({ kind: 'olive', at: [11.0, 30.0, 0], seed: 43, height: 7.0 });
  }

  scene.add(root);

  return {
    anchors: {
      truck_focus: V(0.0, 1.5, 1.4),
      chase_cam_rear: V(0.0, -4.5, 2.2),
      emu_lead: V(-2.8, 12.0, 0.0)
    },
    update: (time, dt = 0.033) => {
      // 1. Update truck wheels rotation & road vibration
      heroTruck.userData.update && heroTruck.userData.update(time, dt, 18.0);

      // 2. Update galloping emus
      pursuitEmus.userData.update && pursuitEmus.userData.update(time);

      // 3. Billow dust particles
      dustParticles.forEach((p, idx) => {
        p.scale.setScalar(1.0 + Math.sin(time * 8 + idx) * 0.35);
        p.position.y += Math.sin(time * 5 + idx) * 0.005;
      });
    }
  };
}
