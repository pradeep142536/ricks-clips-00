// HERO VEHICLE: 1930s Military Flatbed Truck assembled around real CC0 Kenney `military_truck.glb`
// + CC0 `ammo_crate.glb` + Approved Option (A) `buildLewisGun` on swivel tripod.
// Computes exact bed floor height via Three.js Raycaster so crates, gun tripod, and riding gunner
// rest flush on the truck deck without clipping or floating.

import { buildLewisGun, makeMatteMat } from './procedural_props.mjs';

export async function buildHeroTruck(THREE, ctx, options = {}) {
  const { B2T } = ctx;
  const V = (x, y, z) => B2T([x, y, z]);
  const truck = new THREE.Group();
  truck.name = options.name || 'hero_military_truck';

  // 1. Spawn normalized textured CC0 1930s/1950s olive-drab pickup truck (length = 4.60m, minY = 0)
  const glbTruck = await ctx.assets.spawn('military_truck', {
    pos: [0, 0, 0],
    solid: false,
    shadowOpacity: 0.42
  });
  // Rotate glbTruck by Math.PI so cab (+Z raw) faces forward along plan +Y and rear bed (-Z raw) opens toward +Z_three (-Y plan)
  glbTruck.rotation.y = Math.PI;
  glbTruck.updateMatrixWorld(true);
  truck.add(glbTruck);

  // Measure exact flatbed cargo floor Y via Raycaster inside the open rear pocket
  const ray = new THREE.Raycaster(new THREE.Vector3(0, 2.5, 1.35), new THREE.Vector3(0, -1, 0));
  const hits = ray.intersectObject(glbTruck, true).filter(h => h.point.y > 0.35 && h.point.y < 1.35);
  const rawDeckY = hits.length ? hits[0].point.y : 0.70;
  const deckY = +Math.max(0.55, Math.min(1.05, rawDeckY)).toFixed(3);
  const topDeckY = deckY;
  truck.userData.deckY = topDeckY;

  // 2. CC0 Poly Haven Wooden Military Ammo Crates stacked neatly on front-left inside step-side bed
  const crate1 = await ctx.assets.spawn('ammo_crate', {
    solid: false,
    shadow: false
  });
  crate1.scale.multiplyScalar(0.82);
  crate1.position.set(-0.28, topDeckY, 0.72);
  crate1.rotation.y = 0.08;
  truck.add(crate1);

  const crate2 = crate1.clone(true);
  crate2.position.set(-0.28, topDeckY + 0.178, 0.72);
  crate2.rotation.y = -0.12;
  truck.add(crate2);

  // 3. Approved Option (A) Lewis Machine Gun on Pintle Tripod (front-right of bed)
  const gun = buildLewisGun(THREE, ctx, {
    mountHeight: 0.78,
    pitch: -0.04
  });
  gun.position.set(0.26, topDeckY, 0.80);
  gun.rotation.y = options.gunYaw ?? (-Math.PI * 0.65); // aimed over left bed rail toward flank emus, clear of gunner rear pocket
  truck.add(gun);

  // 4. Placement in Set
  if (options.pos) truck.position.copy(V(...options.pos));
  if (options.yaw != null) truck.rotation.y = options.yaw;
  truck.updateMatrixWorld(true);

  // 5. Register Collision Boxes
  if (ctx.assets && options.registerSolids !== false) {
    if (options.registerBedOnly) {
      // Allow actors to stand cleanly on the open rear bed pocket (`gunner` at rear deck),
      // while colliding against the front cab, ammo crate stack, and mounted Lewis gun.
      const cabBox = new THREE.Box3(
        new THREE.Vector3(-1.26, 0, -2.30),
        new THREE.Vector3(1.26, 2.20, 0.45)
      ).applyMatrix4(truck.matrixWorld);
      ctx.assets.registerSolid(`${truck.name}_cab`, cabBox);
      ctx.assets.registerSolid(`${truck.name}_crates`, crate1);
      ctx.assets.registerSolid(`${truck.name}_gun`, gun);
    } else {
      ctx.assets.registerSolid(truck.name, truck);
    }
  }

  // Wheel rotation + subtle suspension travel animation
  const baseY = truck.position.y;
  const wheels = [];
  glbTruck.traverse(n => {
    if (/wheel/i.test(n.name)) wheels.push(n);
  });

  truck.userData.update = (time, dt = 0.033, speed = 0) => {
    if (speed > 0) {
      wheels.forEach(w => { w.rotation.x += speed * dt * 2.2; });
      truck.position.y = baseY + Math.abs(Math.sin(time * 18.0)) * 0.025;
      truck.rotation.z = Math.sin(time * 11.0) * 0.015;
    }
  };

  return truck;
}
