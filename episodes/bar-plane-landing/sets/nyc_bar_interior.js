// 1956 Manhattan Tavern Interior (Warm tungsten wood wainscoting, bar counter, beer mugs, Poly Haven wine bottles, dartboard, animated 15:00 gold stopwatch, animated mug slam, and spinning 1950s headline newspaper).
export async function build(THREE, scene, film, ctx) {
  const grp = new THREE.Group();
  grp.name = 'nyc_bar_interior';

  const floorMat = ctx.relief ? ctx.relief('wood', '#684227', { scale: 1.8, seed: 3 }) : ctx.toon('#684227');
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(18, 16), floorMat);
  floor.name = 'bar_floor';
  floor.userData.role = 'wood';
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  grp.add(floor);

  const wallPlaster = ctx.relief ? ctx.relief('plaster', '#a47952', { scale: 2.2, seed: 7 }) : ctx.toon('#a47952');
  const wainscot = ctx.relief ? ctx.relief('wood', '#4a2815', { scale: 1.5, seed: 9 }) : ctx.toon('#4a2815');
  const ceilingMat = ctx.relief ? ctx.relief('wood', '#3d2213', { scale: 2.0, seed: 11 }) : ctx.toon('#3d2213');

  const addWall = (w, h, pos, ry, name) => {
    const g = new THREE.Group();
    g.name = name;
    const upper = new THREE.Mesh(new THREE.BoxGeometry(w, h - 1.35, 0.2), wallPlaster);
    upper.position.y = 1.35 + (h - 1.35) / 2;
    upper.receiveShadow = true;
    upper.userData.role = 'plaster';
    const lower = new THREE.Mesh(new THREE.BoxGeometry(w, 1.35, 0.24), wainscot);
    lower.position.y = 0.675;
    lower.receiveShadow = true;
    lower.userData.role = 'wood';
    g.add(upper, lower);
    g.position.copy(ctx.B2T(pos));
    g.rotation.y = ry;
    grp.add(g);
    return g;
  };

  addWall(15, 4.4, [0, 4.8, 0], 0, 'bar_back_wall');
  addWall(15, 4.4, [0, -6.2, 0], Math.PI, 'bar_front_wall');
  addWall(12, 4.4, [-6.4, -0.6, 0], Math.PI / 2, 'bar_left_wall');
  addWall(12, 4.4, [6.4, -0.6, 0], -Math.PI / 2, 'bar_right_wall');

  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(16, 13), ceilingMat);
  ceil.name = 'bar_ceiling';
  ceil.rotation.x = Math.PI / 2;
  ceil.position.set(0, 4.35, 0.6);
  grp.add(ceil);

  // Backlit frosted pub windows showing night street glow outside
  const winGlass = new THREE.MeshBasicMaterial({ color: '#ffcb7d', toneMapped: false });
  const winFrame = ctx.relief ? ctx.relief('wood', '#2e190d', { scale: 1.0 }) : ctx.toon('#2e190d');
  for (const wx of [-3.6, 3.6]) {
    const f = new THREE.Group();
    f.name = 'bar_window';
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.5), winGlass);
    pane.position.set(wx, 2.35, -4.67);
    const fr = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.7, 0.08), winFrame);
    fr.position.set(wx, 2.35, -4.71);
    const barV = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.55, 0.09), winFrame);
    barV.position.set(wx, 2.35, -4.66);
    const barH = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.06, 0.09), winFrame);
    barH.position.set(wx, 2.35, -4.66);
    ctx.outline?.(fr);
    f.add(fr, pane, barV, barH);
    grp.add(f);
  }

  // Mahogany back-bar shelves + Poly Haven wine_bottles + stacked glasses
  const shelfWood = ctx.relief ? ctx.relief('wood', '#3b1e0f', { scale: 1.4 }) : ctx.toon('#3b1e0f');
  const shelfBack = new THREE.Mesh(new THREE.BoxGeometry(3.8, 1.9, 0.14), shelfWood);
  shelfBack.position.copy(ctx.B2T([1.1, 4.58, 1.45]));
  ctx.outline?.(shelfBack);
  grp.add(shelfBack);
  for (const sz of [1.05, 1.62, 2.15]) {
    const plank = new THREE.Mesh(new THREE.BoxGeometry(3.75, 0.06, 0.34), wainscot);
    plank.position.copy(ctx.B2T([1.1, 4.46, sz]));
    ctx.outline?.(plank);
    grp.add(plank);
  }
  await ctx.assets.spawn('wine_bottles', { pos: [0.35, 4.40, 1.09], axis: 'height', meters: 0.34, parent: grp, solid: false });
  await ctx.assets.spawn('wine_bottles', { pos: [1.55, 4.40, 1.09], axis: 'height', meters: 0.34, yaw: 1.2, parent: grp, solid: false });
  await ctx.assets.spawn('wine_bottles', { pos: [0.95, 4.40, 1.66], axis: 'height', meters: 0.34, yaw: -0.7, parent: grp, solid: false });
  await ctx.assets.spawn('dartboard', { pos: [-1.85, 4.60, 2.28], axis: 'height', meters: 0.58, yaw: 0, parent: grp, solid: false });

  // O'Malley's Tavern chalkboard sign
  const signC = document.createElement('canvas');
  signC.width = 512; signC.height = 192;
  const sg = signC.getContext('2d');
  sg.fillStyle = '#1f2822'; sg.fillRect(0, 0, 512, 192);
  sg.strokeStyle = '#d4a64a'; sg.lineWidth = 10; sg.strokeRect(8, 8, 496, 176);
  sg.fillStyle = '#f8e6b8'; sg.textAlign = 'center'; sg.textBaseline = 'middle';
  sg.font = 'bold 46px Georgia, serif';
  sg.fillText("O'MALLEY'S TAVERN", 256, 70);
  sg.font = 'bold 28px Arial, sans-serif';
  sg.fillStyle = '#e89b46';
  sg.fillText("ST. NICHOLAS AVE • NYC 1956", 256, 132);
  const signTex = new THREE.CanvasTexture(signC);
  signTex.colorSpace = THREE.SRGBColorSpace;
  const pubSign = new THREE.Mesh(
    new THREE.BoxGeometry(2.6, 0.88, 0.08),
    new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.72, metalness: 0.05 })
  );
  pubSign.name = 'bar_sign';
  ctx.outline?.(pubSign);
  pubSign.position.copy(ctx.B2T([1.1, 4.65, 2.95]));
  grp.add(pubSign);

  // Brass pendant lamps
  const shadeMat = new THREE.MeshStandardMaterial({ color: '#9c6f2e', roughness: 0.42, metalness: 0.6 });
  const cordMat = new THREE.MeshStandardMaterial({ color: '#1b1715', roughness: 0.8 });
  for (const lx of [-2.4, 0.4, 2.6]) {
    const pl = new THREE.PointLight('#ffbf6e', 2.5, 11, 1.3);
    pl.position.copy(ctx.B2T([lx, 1.7, 3.25]));
    grp.add(pl);
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.9, 6), cordMat);
    cord.position.copy(ctx.B2T([lx, 1.7, 4.0]));
    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.20, 14, 1, true), shadeMat);
    shade.position.copy(ctx.B2T([lx, 1.7, 3.55]));
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.10, 12, 8),
      new THREE.MeshBasicMaterial({ color: '#ffe8b8', toneMapped: false })
    );
    bulb.name = 'pub_lamp_bulb';
    bulb.userData.role = 'lamp';
    bulb.position.copy(ctx.B2T([lx, 1.7, 3.47]));
    grp.add(cord, shade, bulb);
  }

  // Verified PBR .glb furniture: realistic 1.18m tall mahogany bar counters (2 abutted sections = 3.0m counter!) + flush countertop surface barTopZ
  const bar = await ctx.assets.spawn('bar_counter', {
    pos: [0.35, 2.55, 0],
    axis: 'height',
    meters: 1.18,
    yaw: 0,
    parent: grp,
    solid: true
  });
  await ctx.assets.spawn('bar_counter', {
    pos: [1.85, 2.55, 0],
    axis: 'height',
    meters: 1.18,
    yaw: 0,
    parent: grp,
    solid: true
  });
  const barH = (bar.userData.bbox && bar.userData.bbox.height) || 1.18;
  const barTopZ = +(barH * 0.892).toFixed(3); // exact mahogany slab height (below decorative bowl tip)

  for (const sx of [-0.05, 1.05, 2.15]) {
    await ctx.assets.spawn('bar_stool', { pos: [sx, 1.72, 0], axis: 'height', meters: 0.75, parent: grp, solid: true });
  }

  const table = await ctx.assets.spawn('pub_table', { pos: [-2.8, 2.35, 0], axis: 'width', meters: 1.20, parent: grp, solid: true });
  const tableH = (table.userData.bbox && table.userData.bbox.height) || 0.76;
  await ctx.assets.spawn('wooden_chair', { pos: [-3.75, 2.35, 0], axis: 'height', meters: 0.85, yaw: Math.PI / 2, parent: grp, solid: true });
  await ctx.assets.spawn('wooden_chair', { pos: [-1.85, 2.35, 0], axis: 'height', meters: 0.85, yaw: -Math.PI / 2, parent: grp, solid: true });

  const warmBeerTints = { lemonade_liquid: { color: '#cf7d16' }, pitcher_lemonade_liquid: { color: '#cf7d16' } };
  const heroMug = await ctx.assets.spawn('beer_mug', {
    pos: [-0.05, 2.38, barTopZ],
    axis: 'height',
    meters: 0.22,
    yaw: 0.2,
    partTints: warmBeerTints,
    parent: grp,
    solid: false
  });
  for (const [mx, my, mz, mh, myaw] of [[0.78, 2.48, barTopZ, 0.20, -0.5], [1.45, 2.42, barTopZ, 0.21, 0.8], [2.10, 2.46, barTopZ, 0.19, -0.3], [-2.78, 2.32, tableH, 0.21, 0.4]]) {
    await ctx.assets.spawn('beer_mug', { pos: [mx, my, mz], axis: 'height', meters: mh, yaw: myaw, partTints: warmBeerTints, parent: grp, solid: false });
  }

  // Hero Bar Counter Wine Bottle & Poly Haven Gold Pocket Stopwatch + "15:00" Gag Plaque FLUSH on counter top!
  await ctx.assets.spawn('wine_bottles', { pos: [1.75, 2.42, barTopZ], axis: 'height', meters: 0.30, yaw: 0.4, parent: grp, solid: false });
  const watchProp = await ctx.assets.spawn('stopwatch', {
    pos: [0.36, 2.38, barTopZ],
    axis: 'width',
    meters: 0.22,
    yaw: 0.0,
    keepMetal: true,
    parent: grp,
    solid: false
  });
  watchProp.rotation.x = -0.35;

  const timerSign = ctx.helpers.createGagSignOrLabel({
    title: '15:00',
    subtitle: 'NJ -> NYC BET',
    bg: '#fcf4de',
    border: '#231218',
    titleColor: '#b91c1c',
    subColor: '#231218',
    width_m: 0.34,
    height_m: 0.18
  });
  timerSign.name = 'stopwatch_bet_sign';
  ctx.outline?.(timerSign);
  timerSign.position.copy(ctx.B2T([0.36, 2.52, barTopZ + 0.40]));
  timerSign.visible = false;
  grp.add(timerSign);

  await ctx.assets.spawn('wooden_barrel', { pos: [-4.4, 3.85, 0], axis: 'height', meters: 0.92, parent: grp, solid: true });
  await ctx.assets.spawn('wooden_barrel', { pos: [3.85, 3.75, 0], axis: 'height', meters: 0.92, parent: grp, solid: true });
  await ctx.assets.spawn('framed_picture', { pos: [3.6, 4.62, 2.30], axis: 'width', meters: 0.65, yaw: 0, parent: grp, solid: false });

  // HERO GAG PROP: Spinning 1950s Front-Page Newspaper ("PILOT LANDS ON NYC STREET!", f=1475..1548)
  const newsC = document.createElement('canvas');
  newsC.width = 512; newsC.height = 640;
  const ng = newsC.getContext('2d');
  ng.fillStyle = '#efe7d2'; ng.fillRect(0, 0, 512, 640);
  ng.strokeStyle = '#231218'; ng.lineWidth = 12; ng.strokeRect(6, 6, 500, 628);
  ng.fillStyle = '#1d1c1a'; ng.fillRect(22, 24, 468, 56);
  ng.fillStyle = '#faf5e4'; ng.font = 'bold 28px Georgia, serif'; ng.textAlign = 'center'; ng.textBaseline = 'middle';
  ng.fillText('NEW YORK HERALD • 1956', 256, 52);
  ng.fillStyle = '#1d1c1a'; ng.font = '900 42px "Arial Black", Impact, sans-serif';
  ng.fillText('PILOT LANDS ON', 256, 128);
  ng.fillStyle = '#b91c1c';
  ng.fillText('NYC STREET!', 256, 180);
  // Halftone airplane-outside-bar illustration box
  ng.fillStyle = '#2b3648'; ng.fillRect(38, 220, 436, 220);
  ng.fillStyle = '#ffd57a'; ng.fillRect(58, 395, 396, 32);
  ng.fillStyle = '#e7d06b';
  ng.beginPath(); ng.ellipse(256, 330, 125, 22, -0.05, 0, Math.PI * 2); ng.fill();
  ng.fillRect(195, 286, 140, 14);
  ng.fillStyle = '#231218';
  for (let i = 0; i < 4; i++) ng.fillRect(38, 468 + i * 32, 436, 12);
  const newsTex = new THREE.CanvasTexture(newsC);
  newsTex.colorSpace = THREE.SRGBColorSpace;
  newsTex.anisotropy = 8;

  const newspaperMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.68, 0.85, 0.03),
    new THREE.MeshStandardMaterial({ map: newsTex, roughness: 0.78, emissiveMap: newsTex, emissive: '#ffffff', emissiveIntensity: 0.25 })
  );
  newspaperMesh.name = 'headline_newspaper_prop';
  ctx.outline?.(newspaperMesh);
  newspaperMesh.position.copy(ctx.B2T([0.15, -0.45, 1.38]));
  newspaperMesh.visible = false;
  grp.add(newspaperMesh);

  scene.add(grp);
  const smooth = x => { const t = Math.max(0, Math.min(1, x)); return t * t * (3 - 2 * t); };

  return {
    anchors: {
      bar_spot: [-0.05, 2.38, barTopZ],
      stopwatch_bet_sign: [0.36, 2.52, barTopZ + 0.22],
      headline_newspaper_prop: [0.15, -0.45, 1.38],
      patron_seat: [0.85, 0.45, 0]
    },
    update(f) {
      // Animated mug slam onto bar counter (f = 248..286 around "slammed his beer mug")
      if (f >= 245 && f <= 286) {
        const u = Math.max(0, Math.min(1, (f - 252) / 14));
        const drop = u < 0.7 ? (1 - u / 0.7) * 0.22 : Math.abs(Math.sin(((u - 0.7) / 0.3) * Math.PI)) * 0.04;
        heroMug.position.y = barTopZ + drop;
      } else {
        heroMug.position.y = barTopZ;
      }

      // Show "15:00" stopwatch sign during bet beat (f = 345..455)
      timerSign.visible = f >= 345 && f <= 455;
      if (timerSign.visible) {
        const pop = Math.min(1, (f - 345) / 6);
        timerSign.scale.setScalar(0.55 + 0.45 * smooth(pop));
      }

      // Spinning 1950s Front-Page Newspaper (f = 1480..1538 on "Headlines made him famous")
      newspaperMesh.visible = f >= 1478 && f <= 1538;
      if (newspaperMesh.visible) {
        const k = Math.min(1, (f - 1478) / 22);
        const ek = smooth(k);
        newspaperMesh.scale.setScalar(0.20 + 0.80 * ek);
        newspaperMesh.rotation.y = (1 - ek) * Math.PI * 4.0;
        newspaperMesh.rotation.z = Math.sin(k * Math.PI) * 0.14;
      }
    }
  };
}
