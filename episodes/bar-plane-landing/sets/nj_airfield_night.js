// 1956 Moonlit New Jersey Airfield at 3 AM (Bright cobalt night fill >= 0.45, Poly Haven chainlink fence, hangar, control tower, nose-forward takeoff).
export async function build(THREE, scene, film, ctx) {
  const grp = new THREE.Group();
  grp.name = 'nj_airfield_night';

  const tarmacMat = ctx.relief ? ctx.relief('mud', '#2d3648', { scale: 2.8, seed: 5 }) : ctx.toon('#2d3648');
  const tarmac = new THREE.Mesh(new THREE.PlaneGeometry(76, 76), tarmacMat);
  tarmac.name = 'airfield_tarmac';
  tarmac.userData.role = 'stone';
  tarmac.rotation.x = -Math.PI / 2;
  tarmac.receiveShadow = true;
  grp.add(tarmac);

  const grassMat = ctx.relief ? ctx.relief('grass', '#233a35', { scale: 3.5, seed: 8 }) : ctx.toon('#233a35');
  const berm = new THREE.Mesh(new THREE.RingGeometry(24, 98, 48), grassMat);
  berm.rotation.x = -Math.PI / 2;
  berm.position.y = 0.02;
  berm.receiveShadow = true;
  grp.add(berm);

  const ridgeMat = new THREE.MeshBasicMaterial({ color: '#1c2b4a', fog: true });
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const m = new THREE.Mesh(new THREE.ConeGeometry(7 + (i % 3) * 3.5, 5.5 + (i % 4) * 2.2, 7), ridgeMat);
    m.position.set(Math.cos(a) * 56, 2.2, Math.sin(a) * 56);
    m.scale.set(2.6, 0.8, 1.4);
    m.userData.noExport = true;
    grp.add(m);
  }

  const stripeMat = new THREE.MeshStandardMaterial({ color: '#d8ad48', roughness: 0.85, metalness: 0.0 });
  for (let x = -22; x <= 30; x += 4.2) {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 0.24), stripeMat);
    s.rotation.x = -Math.PI / 2;
    s.position.copy(ctx.B2T([x, 4.5, 0.015]));
    s.receiveShadow = true;
    grp.add(s);
  }

  const edgeMat = new THREE.MeshBasicMaterial({ color: '#64c2ff', toneMapped: false });
  const amberMat = new THREE.MeshBasicMaterial({ color: '#ffbf52', toneMapped: false });
  for (let x = -20; x <= 28; x += 5.5) {
    for (const ry of [1.1, 8.2]) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.10, 8, 6), ry > 5 ? edgeMat : amberMat);
      m.position.copy(ctx.B2T([x, ry, 0.10]));
      m.userData.noExport = true;
      grp.add(m);
    }
  }

  // Saturated cobalt twilight sky + soft night clouds
  if (ctx.sky && ctx.sky.clouds) {
    ctx.sky.clouds({
      kind: 'night-storm',
      colors: {
        top: '#0c1538', mid: '#1f3164', hor: '#3c548f', sun: '#c4d8ff',
        lit: '#829cd6', shade: '#172344', rim: '#c4d8ff',
        core: '#091230', body: '#1c2b5c', slit: '#7b94cf', srim: '#b4cbff', under: '#2c3d6a', scud: '#101834', rain: '#223158'
      },
      storm: { rainAmt: 0.0, underAmt: 0.22 },
      opacity: 0.78,
      minEl: 3,
      maxEl: 22
    });
  }

  // Hangar + Poly Haven chainlink perimeter fence + fuel barrels + background planes
  await ctx.assets.spawn('airfield_hangar', {
    pos: [-10.2, 11.8, 0],
    axis: 'length',
    meters: 13.0,
    yaw: -0.22,
    parent: grp,
    solid: true
  });
  const hangarFlood = new THREE.PointLight('#ffd48c', 3.8, 18, 1.25);
  hangarFlood.position.copy(ctx.B2T([-7.8, 8.8, 4.2]));
  grp.add(hangarFlood);

  for (const fx of [-16.0, -12.4, -8.8, -5.2, -1.6, 2.0, 5.6, 9.2]) {
    await ctx.assets.spawn('chainlink_fence', {
      pos: [fx, 9.2, 0],
      axis: 'length',
      meters: 3.6,
      yaw: 0,
      parent: grp,
      solid: false
    });
  }

  await ctx.assets.spawn('vintage_prop_plane', {
    pos: [-6.8, 7.6, 0], axis: 'length', meters: 7.0, yaw: Math.PI * 0.22, tint: '#94a7b8', keepMetal: true, parent: grp, solid: false
  });
  await ctx.assets.spawn('vintage_prop_plane', {
    pos: [-15.2, 7.4, 0], axis: 'length', meters: 7.0, yaw: Math.PI * 0.35, tint: '#b87a5e', keepMetal: true, parent: grp, solid: false
  });

  await ctx.assets.spawn('wooden_barrel', { pos: [-4.8, 7.2, 0], axis: 'height', meters: 0.95, parent: grp, solid: false });
  await ctx.assets.spawn('wooden_barrel', { pos: [-4.0, 7.5, 0], axis: 'height', meters: 0.95, parent: grp, solid: false });
  await ctx.assets.spawn('field_radio', { pos: [-3.2, 6.9, 0], axis: 'height', meters: 0.72, parent: grp, solid: false });

  // Windsock pole
  const poleMat = new THREE.MeshStandardMaterial({ color: '#8a96a3', roughness: 0.6, metalness: 0.4 });
  const sockPole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 4.4, 8), poleMat);
  sockPole.position.copy(ctx.B2T([6.8, 8.6, 2.2]));
  ctx.outline?.(sockPole);
  const windsock = new THREE.Mesh(new THREE.ConeGeometry(0.24, 1.35, 10, 1, true), new THREE.MeshStandardMaterial({ color: '#e25a2b', roughness: 0.8 }));
  windsock.rotation.z = -Math.PI / 2;
  windsock.position.copy(ctx.B2T([7.45, 8.6, 4.2]));
  grp.add(sockPole, windsock);

  // Textured control tower with ink outline & warm lit observation cab
  const towerGrp = new THREE.Group();
  towerGrp.position.copy(ctx.B2T([11.5, 15.5, 0]));
  const towerBaseMat = ctx.relief ? ctx.relief('stone', '#666058', { scale: 2.0, seed: 41 }) : ctx.toon('#666058');
  const towerWoodMat = ctx.relief ? ctx.relief('wood', '#765e48', { scale: 2.2, seed: 44 }) : ctx.toon('#765e48');
  const towerSteelMat = new THREE.MeshStandardMaterial({ color: '#2e3642', roughness: 0.65, metalness: 0.45 });
  const towerRoofMat = new THREE.MeshStandardMaterial({ color: '#424d58', roughness: 0.72, metalness: 0.25 });

  const tBase = new THREE.Mesh(new THREE.BoxGeometry(3.8, 2.2, 3.8), towerBaseMat);
  tBase.position.y = 1.1;
  const tShaft = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 2.05, 7.2, 4), towerWoodMat);
  tShaft.rotation.y = Math.PI / 4;
  tShaft.position.y = 5.8;
  const tDeck = new THREE.Mesh(new THREE.BoxGeometry(4.1, 0.28, 4.1), towerBaseMat);
  tDeck.position.y = 9.45;
  const tCab = new THREE.Mesh(
    new THREE.CylinderGeometry(2.05, 1.75, 1.35, 8),
    new THREE.MeshStandardMaterial({ color: '#d8a45c', emissive: '#ffb85c', emissiveIntensity: 0.72, roughness: 0.25, metalness: 0.1 })
  );
  tCab.position.y = 10.25;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.11, 1.38, 0.11), towerSteelMat);
    mullion.position.set(Math.cos(a) * 1.92, 10.25, Math.sin(a) * 1.92);
    towerGrp.add(mullion);
  }
  const tRoof = new THREE.Mesh(new THREE.ConeGeometry(2.55, 1.05, 8), towerRoofMat);
  tRoof.position.y = 11.42;
  const tMast = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 1.1, 8), towerSteelMat);
  tMast.position.y = 12.25;
  const towerBeacon = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), new THREE.MeshBasicMaterial({ color: '#ff342e', toneMapped: false }));
  towerBeacon.position.y = 12.82;
  const towerCabLight = new THREE.PointLight('#ffbf6b', 2.8, 13, 1.3);
  towerCabLight.position.y = 10.3;
  towerGrp.add(tBase, tShaft, tDeck, tCab, tRoof, tMast, towerBeacon, towerCabLight);
  ctx.outline?.(towerGrp);
  grp.add(towerGrp);

  await ctx.assets.spawn('street_lamp', { pos: [-2.1, 5.2, 0], axis: 'height', meters: 4.2, yaw: 0.1, parent: grp, solid: true });
  const apronLight = new THREE.PointLight('#ffd288', 3.4, 15, 1.25);
  apronLight.position.copy(ctx.B2T([-2.1, 5.0, 3.8]));
  grp.add(apronLight);

  // Hero Single-Engine Propeller Plane: +Z nose aligned strictly with +X takeoff path!
  const plane = await ctx.assets.spawn('vintage_prop_plane', {
    pos: [2.6, 4.4, 0],
    axis: 'length',
    meters: 7.50,
    yaw: Math.PI * 0.54,
    keepMetal: true,
    parent: grp,
    solid: false
  });
  plane.rotation.order = 'YXZ';
  const basePlanePos = plane.position.clone();
  const basePlaneYaw = plane.rotation.y;
  let propNode = null;
  plane.traverse(o => {
    if (/_propeller$|^propeller$/i.test(o.name)) propNode = o;
  });

  scene.add(grp);
  const smooth = x => { const t = Math.max(0, Math.min(1, x)); return t * t * (3 - 2 * t); };

  return {
    anchors: {
      plane_cockpit: () => [plane.position.x, -plane.position.z, plane.position.y + 0.8],
      plane_prop: () => [plane.position.x + 1.2, -plane.position.z, plane.position.y + 0.9]
    },
    update(f, t) {
      windsock.rotation.y = Math.sin(t * 2.4) * 0.18;
      towerBeacon.visible = Math.sin(t * 4.0) > 0;
      if (propNode && f >= 630) {
        const spinSpd = f < 668 ? (f - 630) * 0.9 : 36.0;
        propNode.rotation.z = (f * spinSpd * 0.05) % (Math.PI * 2);
      }
      if (f <= 666) {
        plane.position.copy(basePlanePos);
        plane.rotation.set(0, basePlaneYaw, 0);
      } else {
        // Accelerate NOSE-FIRST along +X runway, lift cleanly off ground on f=666..730
        const u = smooth((f - 666) / 62);
        const climb = smooth((f - 684) / 44);
        const velX = 24.0;
        const velZ = -4.5;
        plane.position.set(
          basePlanePos.x + u * velX,
          basePlanePos.y + climb * 5.2,
          basePlanePos.z + u * velZ
        );
        if (ctx.alignForward) {
          ctx.alignForward(plane, [velX, climb * 5.2, velZ], { baseYaw: 0, maxPitch: 0.24 });
          plane.rotation.z = -climb * 0.08;
        } else {
          plane.rotation.set(-climb * 0.22, Math.atan2(velX, velZ), -climb * 0.06);
        }
      }
    }
  };
}
