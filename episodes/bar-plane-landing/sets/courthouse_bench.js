// 1956 NYC Night Courtroom Bench (0:45.8-0:49.6): Rich walnut paneling, cobalt tall windows, oak judge desk, slamming wooden gavel + sound block, printed $100 FINE citation ticket in 80% safe zone.
export async function build(THREE, scene, film, ctx) {
  const grp = new THREE.Group();
  grp.name = 'courthouse_bench';

  const floorMat = ctx.relief ? ctx.relief('wood', '#5c3c24', { scale: 1.8, seed: 17 }) : ctx.toon('#5c3c24');
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(18, 16), floorMat);
  floor.name = 'court_floor';
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  grp.add(floor);

  const wallWood = ctx.relief ? ctx.relief('wood', '#4b2b18', { scale: 1.6, seed: 21 }) : ctx.toon('#4b2b18');
  const wallPlaster = ctx.relief ? ctx.relief('plaster', '#8c755c', { scale: 2.0, seed: 25 }) : ctx.toon('#8c755c');
  const addWall = (w, h, pos, ry) => {
    const g = new THREE.Group();
    const upper = new THREE.Mesh(new THREE.BoxGeometry(w, h - 1.5, 0.22), wallPlaster);
    upper.position.y = 1.5 + (h - 1.5) / 2;
    const lower = new THREE.Mesh(new THREE.BoxGeometry(w, 1.5, 0.26), wallWood);
    lower.position.y = 0.75;
    g.add(upper, lower);
    g.position.copy(ctx.B2T(pos));
    g.rotation.y = ry;
    grp.add(g);
  };
  addWall(15, 4.6, [0, 4.6, 0], 0);
  addWall(12, 4.6, [-6.0, 0, 0], Math.PI / 2);
  addWall(12, 4.6, [6.0, 0, 0], -Math.PI / 2);

  // Tall cobalt-lit arched night windows behind courthouse bench (keeps night scene bright & expressive)
  const nightGlassMat = new THREE.MeshBasicMaterial({ color: '#5b84d4', toneMapped: false });
  for (const wx of [-3.0, 3.0]) {
    const win = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.3), nightGlassMat);
    win.position.copy(ctx.B2T([wx, 4.44, 2.5]));
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.78, 2.48, 0.08), wallWood);
    frame.position.copy(ctx.B2T([wx, 4.48, 2.5]));
    ctx.outline?.(frame);
    grp.add(frame, win);
  }

  const warmKey = new THREE.PointLight('#ffcf80', 3.6, 12, 1.25);
  warmKey.position.copy(ctx.B2T([0.0, -0.4, 2.4]));
  grp.add(warmKey);

  // Verified PBR .glb Courtroom Furniture (map_table judge desk, bookshelves, pillars, gallery benches, chairs, lamp, legal notepads)
  const judgeDesk = await ctx.assets.spawn('map_table', { pos: [0.0, 0.55, 0], axis: 'length', meters: 2.20, parent: grp, solid: true });
  const deskH = (judgeDesk.userData.bbox && judgeDesk.userData.bbox.height) || 0.78;

  await ctx.assets.spawn('desk_lamp', { pos: [-0.88, 0.65, deskH], axis: 'height', meters: 0.48, parent: grp, solid: false });
  await ctx.assets.spawn('office_notepads', { pos: [-0.46, 0.45, deskH], axis: 'width', meters: 0.34, yaw: 0.25, parent: grp, solid: false });
  await ctx.assets.spawn('bookshelf', { pos: [-2.6, 3.85, 0], axis: 'height', meters: 2.25, parent: grp, solid: true });
  await ctx.assets.spawn('bookshelf', { pos: [2.6, 3.85, 0], axis: 'height', meters: 2.25, parent: grp, solid: true });
  await ctx.assets.spawn('chamber_column', { pos: [-4.4, 4.0, 0], axis: 'height', meters: 4.2, parent: grp, solid: true });
  await ctx.assets.spawn('chamber_column', { pos: [4.4, 4.0, 0], axis: 'height', meters: 4.2, parent: grp, solid: true });
  await ctx.assets.spawn('wooden_bench', { pos: [-2.7, -1.6, 0], axis: 'length', meters: 2.4, yaw: Math.PI / 2, parent: grp, solid: true });
  await ctx.assets.spawn('wooden_bench', { pos: [2.7, -1.6, 0], axis: 'length', meters: 2.4, yaw: -Math.PI / 2, parent: grp, solid: true });
  await ctx.assets.spawn('wooden_chair', { pos: [0.0, 2.35, 0], axis: 'height', meters: 0.88, yaw: 0, parent: grp, solid: true });
  await ctx.assets.spawn('framed_picture', { pos: [0.0, 4.42, 2.75], axis: 'width', meters: 0.82, parent: grp, solid: false });

  // HERO GAG PROP #1: Turned Walnut Judge Gavel + Sound Block on Desk
  const gavelWood = ctx.relief ? ctx.relief('wood', '#5c3118', { scale: 2.0, seed: 31 }) : new THREE.MeshStandardMaterial({ color: '#5c3118', roughness: 0.65 });
  const brassBand = new THREE.MeshStandardMaterial({ color: '#dfad3c', roughness: 0.35, metalness: 0.72 });

  const soundBlock = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.055, 20), gavelWood);
  soundBlock.name = 'gavel_sound_block';
  ctx.outline?.(soundBlock);
  soundBlock.position.copy(ctx.B2T([-0.24, 0.26, deskH + 0.028]));
  grp.add(soundBlock);

  const gavelPivot = new THREE.Group();
  gavelPivot.name = 'court_judge_gavel';
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.024, 0.36, 12), gavelWood);
  handle.rotation.z = Math.PI / 2;
  handle.position.set(0.18, 0, 0);
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.068, 0.16, 16), gavelWood);
  head.rotation.x = Math.PI / 2;
  head.position.set(0.36, 0, 0);
  const ring1 = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.072, 0.022, 16), brassBand);
  ring1.rotation.x = Math.PI / 2;
  ring1.position.set(0.36, 0, 0.052);
  const ring2 = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.072, 0.022, 16), brassBand);
  ring2.rotation.x = Math.PI / 2;
  ring2.position.set(0.36, 0, -0.052);
  gavelPivot.add(handle, head, ring1, ring2);
  ctx.outline?.(gavelPivot);
  gavelPivot.position.copy(ctx.B2T([-0.60, 0.26, deskH + 0.095]));
  grp.add(gavelPivot);

  // HERO GAG PROP #2: Physical Printed "$100 FINE" Court Paper Ticket tilted cleanly toward camera (Centered in 80% safe zone!)
  const fCan = document.createElement('canvas');
  fCan.width = 512; fCan.height = 640;
  const fg = fCan.getContext('2d');
  fg.fillStyle = '#fcf4de'; fg.fillRect(0, 0, 512, 640);
  fg.strokeStyle = '#231218'; fg.lineWidth = 14; fg.strokeRect(7, 7, 498, 626);
  fg.fillStyle = '#1f2836'; fg.fillRect(24, 26, 464, 72);
  fg.fillStyle = '#fde68a'; fg.font = 'bold 34px Arial, sans-serif'; fg.textAlign = 'center'; fg.textBaseline = 'middle';
  fg.fillText('NYC NIGHT COURT • 1956', 256, 62);
  fg.fillStyle = '#231218'; fg.font = 'bold 28px Georgia, serif';
  fg.fillText('AIRPLANE ON ST. NICHOLAS AVE', 256, 146);
  fg.fillStyle = '#4a3d35'; fg.font = 'bold 24px Arial, sans-serif';
  fg.fillText('OWNER CHARGES: DROPPED', 256, 198);
  fg.fillStyle = '#b91c1c'; fg.font = '900 108px "Arial Black", Impact, sans-serif';
  fg.fillText('$100', 256, 330);
  fg.fillText('FINE', 256, 442);
  fg.save();
  fg.translate(256, 548); fg.rotate(-0.08);
  fg.strokeStyle = '#b91c1c'; fg.lineWidth = 8; fg.strokeRect(-145, -36, 290, 72);
  fg.fillStyle = '#b91c1c'; fg.font = '900 42px "Arial Black", sans-serif';
  fg.fillText('CASE CLOSED', 0, 2);
  fg.restore();
  const fineTex = new THREE.CanvasTexture(fCan);
  fineTex.colorSpace = THREE.SRGBColorSpace;
  fineTex.anisotropy = 8;
  const fineTicket = new THREE.Mesh(
    new THREE.BoxGeometry(0.46, 0.024, 0.58),
    new THREE.MeshStandardMaterial({ map: fineTex, roughness: 0.78, emissiveMap: fineTex, emissive: '#ffffff', emissiveIntensity: 0.24 })
  );
  fineTicket.name = 'fine_ticket_board';
  ctx.outline?.(fineTicket);
  fineTicket.position.copy(ctx.B2T([0.36, 0.24, deskH + 0.24]));
  fineTicket.rotation.set(0.75, -0.14, 0.0); // +X rotation turns top +Y face toward +Z camera!
  grp.add(fineTicket);

  scene.add(grp);
  const smooth = x => { const t = Math.max(0, Math.min(1, x)); return t * t * (3 - 2 * t); };

  return {
    anchors: {
      court_judge_gavel: [-0.24, 0.26, deskH + 0.08],
      fine_ticket_board: [0.36, 0.24, deskH + 0.24]
    },
    update(f) {
      // Raise gavel cleanly then SLAM onto sound block on f = 1396..1422 ("slammed his gavel")
      if (f < 1390) {
        gavelPivot.rotation.z = 0.58;
      } else if (f <= 1412) {
        const u = Math.min(1, (f - 1390) / 18);
        // Wind up slightly then snap down fast
        const ang = u < 0.35 ? 0.58 + (u / 0.35) * 0.24 : 0.82 * (1 - Math.pow((u - 0.35) / 0.65, 2.4));
        gavelPivot.rotation.z = Math.max(-0.02, ang);
      } else if (f <= 1428) {
        const b = (f - 1412) / 16;
        gavelPivot.rotation.z = Math.abs(Math.sin(b * Math.PI * 2)) * 0.12 * (1 - b);
      } else {
        gavelPivot.rotation.z = 0.0;
      }

      // Pop up "$100 FINE" citation ticket crisply on "handed Tommy a hundred-dollar fine" (f >= 1434)
      if (f >= 1434) {
        const k = smooth(Math.min(1, (f - 1434) / 8));
        fineTicket.scale.setScalar(0.65 + 0.35 * k);
      } else {
        fineTicket.scale.setScalar(0.65);
      }
    }
  };
}
