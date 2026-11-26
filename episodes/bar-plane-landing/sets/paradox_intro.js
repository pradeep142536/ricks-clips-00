// Paradox Intro Set (0:00-0:05.8): Warm lamp-lit evidence desk + cobalt prison bars + "20 YEARS PRISON" heavy iron padlock + crumpled $100 bill.
export async function build(THREE, scene, film, ctx) {
  const grp = new THREE.Group();
  grp.name = 'paradox_intro';

  // Stone courthouse/lockup floor & deep paneled rear wall (zero black voids, readable night fill)
  const floorMat = ctx.relief ? ctx.relief('wood', '#4a3222', { scale: 1.8, seed: 2 }) : ctx.toon('#4a3222');
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(18, 16), floorMat);
  floor.name = 'paradox_floor';
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  grp.add(floor);

  const wallMat = ctx.relief ? ctx.relief('stone', '#2d374c', { scale: 2.4, seed: 8 }) : ctx.toon('#2d374c');
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(14, 4.8, 0.25), wallMat);
  backWall.position.copy(ctx.B2T([0, 3.8, 2.4]));
  backWall.receiveShadow = true;
  grp.add(backWall);

  // Backlit barred iron cell window in background casting cobalt night ambiance
  const moonWin = new THREE.Mesh(
    new THREE.PlaneGeometry(2.4, 2.0),
    new THREE.MeshBasicMaterial({ color: '#4d73bd', toneMapped: false })
  );
  moonWin.position.copy(ctx.B2T([-1.35, 3.64, 2.55]));
  grp.add(moonWin);
  const ironBarMat = new THREE.MeshStandardMaterial({ color: '#1b2028', roughness: 0.65, metalness: 0.55 });
  for (let i = -3; i <= 3; i++) {
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 2.05, 8), ironBarMat);
    bar.position.copy(ctx.B2T([-1.35 + i * 0.32, 3.60, 2.55]));
    ctx.outline?.(bar);
    grp.add(bar);
  }
  const winRim = new THREE.Mesh(new THREE.BoxGeometry(2.55, 0.12, 0.14), ironBarMat);
  winRim.position.copy(ctx.B2T([-1.35, 3.58, 1.55]));
  ctx.outline?.(winRim);
  grp.add(winRim);

  // Warm amber overhead/desk lighting + cobalt moonlight rim
  const warmDesk = new THREE.PointLight('#ffca74', 3.4, 9, 1.25);
  warmDesk.position.copy(ctx.B2T([0.45, -0.35, 1.75]));
  grp.add(warmDesk);
  const coolMoon = new THREE.PointLight('#6a95ff', 2.2, 12, 1.3);
  coolMoon.position.copy(ctx.B2T([-1.8, 2.8, 2.6]));
  grp.add(coolMoon);

  // Verified PBR .glb Evidence Table + Desk Lamp + Law Books + Barrels + Gate Latch + Files + Bottles
  const table = await ctx.assets.spawn('map_table', {
    pos: [0.05, 0.25, 0],
    axis: 'length',
    meters: 2.15,
    yaw: 0,
    parent: grp,
    solid: true
  });
  const tableH = (table.userData.bbox && table.userData.bbox.height) || 0.78;

  await ctx.assets.spawn('desk_lamp', {
    pos: [-0.82, 0.38, tableH],
    axis: 'height',
    meters: 0.48,
    parent: grp,
    solid: false
  });
  await ctx.assets.spawn('office_notepads', {
    pos: [0.76, 0.42, tableH],
    axis: 'width',
    meters: 0.34,
    yaw: -0.35,
    parent: grp,
    solid: false
  });
  await ctx.assets.spawn('gate_latch', {
    pos: [-0.62, 0.08, tableH],
    axis: 'width',
    meters: 0.28,
    yaw: 0.42,
    parent: grp,
    solid: false
  });
  await ctx.assets.spawn('wooden_barrel', {
    pos: [-2.15, 2.45, 0],
    axis: 'height',
    meters: 0.92,
    parent: grp,
    solid: true
  });
  await ctx.assets.spawn('wooden_barrel', {
    pos: [2.25, 2.55, 0],
    axis: 'height',
    meters: 0.92,
    parent: grp,
    solid: true
  });
  await ctx.assets.spawn('bookshelf', {
    pos: [2.45, 3.35, 0],
    axis: 'height',
    meters: 2.20,
    yaw: -0.25,
    parent: grp,
    solid: true
  });
  await ctx.assets.spawn('framed_picture', {
    pos: [1.35, 3.62, 2.35],
    axis: 'width',
    meters: 0.68,
    parent: grp,
    solid: false
  });

  // HERO GAG PROP #1: Heavy Iron Padlock labeled "20 YEARS PRISON" standing upright on desk
  const padlockGrp = new THREE.Group();
  padlockGrp.name = 'prison_padlock_prop';
  const castIronMat = ctx.relief
    ? ctx.relief('stone', '#373e4a', { scale: 2.6, seed: 29 })
    : new THREE.MeshStandardMaterial({ color: '#373e4a', roughness: 0.68, metalness: 0.48 });
  const steelMat = new THREE.MeshStandardMaterial({ color: '#bfc7d5', roughness: 0.36, metalness: 0.72 });
  const brassMat = new THREE.MeshStandardMaterial({ color: '#dca93a', roughness: 0.42, metalness: 0.65 });

  const lockBody = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.34, 0.14), castIronMat);
  lockBody.position.set(0, 0.17, 0);
  lockBody.castShadow = true;
  const lockBand = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.045, 0.15), brassMat);
  lockBand.position.set(0, 0.035, 0);
  const shackle = new THREE.Mesh(new THREE.TorusGeometry(0.125, 0.030, 12, 24, Math.PI), steelMat);
  shackle.position.set(0, 0.34, 0);
  const keyhole = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.15, 14), brassMat);
  keyhole.rotation.x = Math.PI / 2;
  keyhole.position.set(0, 0.085, 0.01);

  const labelPlate = ctx.helpers.createGagSignOrLabel({
    title: '20 YEARS',
    subtitle: 'PRISON',
    bg: '#1c212b',
    border: '#d6a23e',
    titleColor: '#ffe07d',
    subColor: '#ff5d55',
    width_m: 0.36,
    height_m: 0.17
  });
  labelPlate.position.set(0, 0.225, 0.068);

  padlockGrp.add(lockBody, lockBand, shackle, keyhole, labelPlate);
  ctx.outline?.(padlockGrp);
  padlockGrp.position.copy(ctx.B2T([-0.14, 0.18, tableH]));
  padlockGrp.rotation.y = 0.22;
  padlockGrp.rotation.x = -0.06;
  grp.add(padlockGrp);

  // HERO GAG PROP #2: Crumpled $100 Bill beside padlock
  const billCanvas = document.createElement('canvas');
  billCanvas.width = 512; billCanvas.height = 240;
  const bg = billCanvas.getContext('2d');
  bg.fillStyle = '#c8dfb8'; bg.fillRect(0, 0, 512, 240);
  bg.strokeStyle = '#1f4d2c'; bg.lineWidth = 14; bg.strokeRect(12, 12, 488, 216);
  bg.strokeStyle = '#326e41'; bg.lineWidth = 3; bg.strokeRect(24, 24, 464, 192);
  bg.fillStyle = '#194726';
  bg.beginPath(); bg.ellipse(256, 120, 58, 72, 0, 0, Math.PI * 2); bg.fill();
  bg.fillStyle = '#d4e8c4';
  bg.beginPath(); bg.arc(256, 102, 24, 0, Math.PI * 2); bg.fill();
  bg.beginPath(); bg.ellipse(256, 154, 34, 22, 0, 0, Math.PI * 2); bg.fill();
  bg.fillStyle = '#143c20'; bg.textAlign = 'center'; bg.textBaseline = 'middle';
  bg.font = '900 72px "Arial Black", Impact, sans-serif';
  bg.fillText('$100', 102, 122);
  bg.fillText('$100', 410, 122);
  bg.font = 'bold 20px Georgia, serif';
  bg.fillText('ONE HUNDRED BUCKS', 256, 200);
  const billTex = new THREE.CanvasTexture(billCanvas);
  billTex.colorSpace = THREE.SRGBColorSpace;
  billTex.anisotropy = 8;

  const billGeo = new THREE.BoxGeometry(0.32, 0.022, 0.16, 10, 1, 6);
  const bPos = billGeo.attributes.position;
  for (let i = 0; i < bPos.count; i++) {
    const x = bPos.getX(i), z = bPos.getZ(i);
    bPos.setY(i, bPos.getY(i) + Math.sin(x * 26.0 + z * 18.0) * 0.008 + Math.cos(z * 32.0) * 0.005);
  }
  billGeo.computeVertexNormals();
  const billMesh = new THREE.Mesh(
    billGeo,
    new THREE.MeshStandardMaterial({ map: billTex, roughness: 0.85, metalness: 0.02, emissiveMap: billTex, emissive: '#ffffff', emissiveIntensity: 0.16 })
  );
  billMesh.name = 'hundred_dollar_bill_prop';
  ctx.outline?.(billMesh);
  billMesh.position.copy(ctx.B2T([0.28, 0.10, tableH + 0.02]));
  billMesh.rotation.y = -0.32;
  grp.add(billMesh);

  scene.add(grp);
  return {
    anchors: {
      prison_padlock_prop: [-0.14, 0.18, tableH + 0.22],
      hundred_dollar_bill_prop: [0.28, 0.10, tableH + 0.04],
      map_table: [0.05, 0.25, tableH]
    },
    update(f) {
      // Gentle emphasis tilt & sparkle lift on "$100" bill when paradox twist hits (f = 95..170)
      if (f >= 92 && f <= 170) {
        const u = Math.min(1, (f - 92) / 10);
        billMesh.position.y = tableH + 0.025 + Math.sin(u * Math.PI) * 0.015;
      }
    }
  };
}
