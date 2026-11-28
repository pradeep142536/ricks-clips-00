// SET 3: BUMPY OUTBACK DIRT TRACK (High-Speed Pursuit)
// Uses Asset-First CC0 hero truck (`military_truck.glb` + `ammo_crate.glb` + Option A `buildLewisGun`),
// sculpted undulating rutted track (`terrain_outback.mjs`), matte feathered emu flank corridor
// (x <= -3.3, zero truck/soldier overlap), CC0 eucalyptus trees/rocks/bushes (no cypress),
// telegraph poles, and low ground tire wake (zero floating Dodecahedron sky/air balls).

import { buildHeroTruck } from './hero_truck.js';
import { buildEmuFlock } from './emu_flock.js';
import { makeMatteMat, makePropSpawner } from './procedural_props.mjs';
import { buildOutbackTerrain, buildOutbackHorizon, outbackHeight } from './terrain_outback.mjs';

export async function build(THREE, scene, film, ctx) {
  const { B2T, sky } = ctx;
  const V = (x, y, z) => B2T([x, y, z]);
  const root = new THREE.Group();
  root.name = 'dirt_track';

  if (sky?.clouds) {
    sky.clouds({
      kind: 'dusk-storm',
      seed: 1932,
      coverage: 0.74,
      scale: 1.32,
      puffs: true,
      minEl: 2,
      maxEl: 21,
      sunDir: [0.35, 0.42, 0.68],
      colors: {
        top: '#172746',
        mid: '#3f547d',
        hor: '#d99a68',
        sun: '#ffbd78',
        glow: 0.60,
        lit: '#b5b0ce',
        shade: '#273152',
        rim: '#ffe0ad',
        dark: 0.50
      },
      storm: {
        core: '#182746',
        body: '#425577',
        slit: '#d7a06e',
        srim: '#ffe0ad',
        under: '#84513e',
        scud: '#1c2947',
        rain: '#63738c',
        flash: '#e5edff',
        wallTop: 0.56,
        foot: 0.05,
        deck: 0.60,
        scudCov: 0.26,
        rainAmt: 0.08,
        underAmt: 0.85,
        rimAmt: 1.0,
        contrast: 0.65
      }
    });
  }

  // 1. Sculpted Undulating Outback Dirt Track Terrain + Deep Sunset Horizon Ridge
  root.add(buildOutbackTerrain(THREE, ctx, { mode: 'track', centerY: 12.0, sizeX: 76, sizeY: 96, segs: 96 }));
  // Keep the chase at dusk without the pink/magenta sunset-ridge palette.
  root.add(buildOutbackHorizon(THREE, { centerY: 12.0, sunset: false }));
  const gY = (px, py) => outbackHeight('track', px, py);

  const M = {
    poleWood: makeMatteMat(THREE, '#5a402a', 0.90, 0.0),
    poleWire: makeMatteMat(THREE, '#3a4048', 0.78, 0.25),
    insulator: makeMatteMat(THREE, '#ece8dc', 0.80, 0.0),
    wheelWake: new THREE.MeshBasicMaterial({ color: '#c48454', transparent: true, opacity: 0.28, depthWrite: false })
  };

  // 2. Roadside Telegraph Poles & Sagging Wire (along x = +4.2m on right shoulder)
  for (let py = -8; py <= 42; py += 14) {
    const pg = new THREE.Group();
    const gz = gY(4.2, py);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.14, 5.0, 8), M.poleWood);
    pole.position.y = 2.5;
    pole.castShadow = true;
    pg.add(pole);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.10, 0.10), M.poleWood);
    arm.position.set(0, 4.65, 0);
    pg.add(arm);
    for (const ix of [-0.55, 0.55]) {
      const ins = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.10, 6), M.insulator);
      ins.position.set(ix, 4.76, 0);
      pg.add(ins);
    }
    pg.position.copy(V(4.2, py, gz));
    root.add(pg);
  }
  const wireCurve = new THREE.CatmullRomCurve3([
    V(4.2, -8, 4.78 + gY(4.2, -8)),
    V(4.2, -1, 4.32 + gY(4.2, -1)),
    V(4.2, 6, 4.78 + gY(4.2, 6)),
    V(4.2, 13, 4.32 + gY(4.2, 13)),
    V(4.2, 20, 4.78 + gY(4.2, 20)),
    V(4.2, 34, 4.78 + gY(4.2, 34))
  ]);
  root.add(new THREE.Mesh(new THREE.TubeGeometry(wireCurve, 44, 0.009, 5), M.poleWire));

  // 3. CC0 Nature & Outback Road Dressing (Zero cypresses!)
  const [spawnRock, spawnBush, spawnGrass, spawnTree] = await Promise.all([
    makePropSpawner(ctx, 'outback_rock', { shadow: true }),
    makePropSpawner(ctx, 'dry_bush', { shadow: true, tint: '#867e46' }),
    makePropSpawner(ctx, 'dry_grass', { shadow: false, tint: '#be9344' }),
    makePropSpawner(ctx, 'eucalyptus_tree', { shadow: true, tint: '#757054' })
  ]);
  for (const [tx, ty, sc] of [[-9.5, 24, 1.15], [9.5, 28, 1.1], [-12.0, 12, 0.95]]) {
    spawnTree([tx, ty, gY(tx, ty)], { parent: root, scale: sc, yaw: tx, solid: true });
  }
  for (const [rx, ry, sc] of [[3.2, 5.5, 0.8], [-7.5, 4.0, 1.1], [5.4, 14.0, 1.0]]) {
    spawnRock([rx, ry, gY(rx, ry)], { parent: root, scale: sc, yaw: rx, solid: true });
  }
  for (const [bx, by] of [[3.6, 2.0], [-7.2, 8.5], [4.8, 10.5], [-8.4, 16.0]]) {
    spawnBush([bx, by, gY(bx, by)], { parent: root, scale: 0.85, yaw: bx });
  }
  for (let i = 0; i < 20; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const gx = side * (2.6 + (i % 5) * 1.1);
    const gy = -3 + i * 2.1;
    spawnGrass([gx, gy, gY(gx, gy)], { parent: root, yaw: i });
  }

  // 4. Hero Moving Military Truck (Cab + crate + gun registered, rear open bed deck kept clear for gunner!)
  const heroTruck = await buildHeroTruck(THREE, ctx, {
    name: 'chase_hero_truck',
    pos: [0.0, 1.5, Math.max(-0.08, gY(0.0, 1.5))],
    yaw: 0.0,
    gunYaw: -Math.PI * 0.65,
    registerSolids: true,
    registerBedOnly: true
  });
  root.add(heroTruck);

  // Subtle flat ground tire-wake dust ribbons trailing rear wheels (NOT floating spheres)
  const wakeRibbons = [];
  for (const sx of [-0.95, 0.95]) {
    const rib = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 3.6), M.wheelWake);
    rib.rotation.x = -Math.PI / 2;
    rib.position.copy(V(sx, -2.55, 0.03));
    rib.userData.noExport = true;
    root.add(rib);
    wakeRibbons.push(rib);
  }

  // 5. Matte Feathered Sprinting Emu Flock confined strictly to left corridor (x <= -3.3, clear of truck & actors!)
  const pursuitEmus = buildEmuFlock(THREE, ctx, {
    count: 12,
    baseX: -4.8,
    baseY: 6.5,
    spreadX: 2.6, // -6.1 .. -3.5 -> >= 2.2m from truck!
    spreadY: 12.0,
    yaw: Math.PI, // running along dirt track toward/beside camera
    runSpeed: 16.5,
    groundY: gY
  });
  root.add(pursuitEmus);

  scene.add(root);

  return {
    anchors: {
      truck_focus: V(0.0, 1.5, 1.3),
      gunner_bed: V(0.0, -0.05, heroTruck.userData.deckY || 0.89),
      chase_cam_rear: V(0.0, -4.5, 2.2),
      emu_lead: V(-4.4, 10.0, 0.0)
    },
    update: (time, dt = 0.033) => {
      heroTruck.userData.update && heroTruck.userData.update(time, dt, 16.0);
      pursuitEmus.userData.update && pursuitEmus.userData.update(time);
      wakeRibbons.forEach((r, idx) => {
        r.scale.set(1.0 + Math.sin(time * 9 + idx) * 0.12, 1.0 + Math.cos(time * 7) * 0.15, 1);
      });
    }
  };
}
