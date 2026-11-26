// 1956 Midnight Manhattan Skyline Airspace (Saturated cobalt night sky >= 0.45, dim avenue dot grid + Hudson sheen, inked PBR nyc_skyscraper towers + Art Deco spires, nose-forward prop plane).
export async function build(THREE, scene, film, ctx) {
  const grp = new THREE.Group();
  grp.name = 'manhattan_sky_night';

  const cityGround = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    ctx.relief ? ctx.relief('stone', '#121b30', { scale: 4.5 }) : ctx.toon('#121b30')
  );
  cityGround.rotation.x = -Math.PI / 2;
  cityGround.position.y = -18;
  grp.add(cityGround);

  const river = new THREE.Mesh(
    new THREE.PlaneGeometry(44, 180),
    new THREE.MeshStandardMaterial({ color: '#0f2345', roughness: 0.22, metalness: 0.58 })
  );
  river.rotation.x = -Math.PI / 2;
  river.position.set(-28, -17.95, -24);
  grp.add(river);

  const sheenMat = new THREE.MeshBasicMaterial({ color: '#39629e', transparent: true, opacity: 0.30, toneMapped: false });
  for (let rz = -60; rz <= 12; rz += 6.5) {
    const glint = new THREE.Mesh(new THREE.PlaneGeometry(7.5 + (Math.abs(rz) % 5), 0.55), sheenMat);
    glint.rotation.x = -Math.PI / 2;
    glint.position.set(-22 + ((rz * 3) % 7), -17.92, rz);
    grp.add(glint);
  }

  // Soft dim Manhattan city street-light dots (zero neon grid stripes)
  const warmDotMat = new THREE.MeshBasicMaterial({ color: '#d4a660', transparent: true, opacity: 0.56, toneMapped: false });
  const paleDotMat = new THREE.MeshBasicMaterial({ color: '#94b2d8', transparent: true, opacity: 0.42, toneMapped: false });
  const tailDotMat = new THREE.MeshBasicMaterial({ color: '#a8443e', transparent: true, opacity: 0.46, toneMapped: false });
  const dotGeo = new THREE.CircleGeometry(0.16, 6);
  for (const ax of [-12, -5.5, 0.5, 6.5, 13, 19]) {
    for (let cz = -74; cz <= 16; cz += 2.8) {
      const h = Math.abs(Math.round(ax * 31 + cz * 17));
      if (h % 5 === 0) continue;
      const dot = new THREE.Mesh(dotGeo, (h % 7 === 0) ? tailDotMat : (h % 3 === 0 ? paleDotMat : warmDotMat));
      dot.rotation.x = -Math.PI / 2;
      dot.position.set(ax + ((h % 3) - 1) * 0.28, -17.89, cz);
      grp.add(dot);
    }
  }

  if (ctx.sky && ctx.sky.clouds) {
    ctx.sky.clouds({
      kind: 'night-storm',
      colors: {
        top: '#0c1538', mid: '#1f3164', hor: '#3c548f', sun: '#c4d8ff',
        lit: '#829cd6', shade: '#172344', rim: '#c4d8ff',
        core: '#091230', body: '#1c2b5c', slit: '#7b94cf', srim: '#b4cbff', under: '#2c3d6a', scud: '#101834', rain: '#223158'
      },
      storm: { rainAmt: 0.0, underAmt: 0.22 },
      opacity: 0.74,
      minEl: -4,
      maxEl: 20
    });
  }
  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(2.8, 20, 14),
    new THREE.MeshBasicMaterial({ color: '#fff3d6', toneMapped: false, fog: false })
  );
  moon.name = 'nyc_moon';
  moon.userData.noExport = true;
  moon.position.set(-16, 16, -68);
  grp.add(moon);

  const makeWinTex = (seed, wallHex) => {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 512;
    const g = c.getContext('2d');
    g.fillStyle = wallHex; g.fillRect(0, 0, 256, 512);
    for (let r = 0; r < 34; r++) {
      for (let col = 0; col < 12; col++) {
        const hash = ((r * 73 + col * 131 + seed * 37) % 100);
        g.fillStyle = hash < 18 ? '#ffe28a' : (hash < 36 ? '#ffd068' : (hash < 46 ? '#b7dcff' : '#10192b'));
        g.fillRect(12 + col * 20, 12 + r * 14.5, 12, 9);
      }
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  };
  const facadeMats = [
    new THREE.MeshStandardMaterial({ map: makeWinTex(1, '#2d374f'), emissiveMap: makeWinTex(1, '#000000'), emissive: '#ffd580', emissiveIntensity: 0.62, roughness: 0.75 }),
    new THREE.MeshStandardMaterial({ map: makeWinTex(2, '#3d3440'), emissiveMap: makeWinTex(2, '#000000'), emissive: '#ffcf70', emissiveIntensity: 0.62, roughness: 0.78 }),
    new THREE.MeshStandardMaterial({ map: makeWinTex(3, '#253145'), emissiveMap: makeWinTex(3, '#000000'), emissive: '#a8d0ff', emissiveIntensity: 0.56, roughness: 0.72 })
  ];
  const spireMat = new THREE.MeshStandardMaterial({ color: '#8695b0', roughness: 0.45, metalness: 0.5 });
  const waterTankMat = new THREE.MeshStandardMaterial({ color: '#78573d', roughness: 0.85 });
  const beaconMat = new THREE.MeshBasicMaterial({ color: '#ff4238', toneMapped: false });

  for (const [x, y, z, h, yaw] of [[-11.5, 12, -18, 28, 0.05], [11.5, 14, -18, 30, -0.04], [-14.5, 26, -18, 34, 0.12], [13.5, 28, -18, 29, -0.10], [-10.5, 40, -18, 36, 0.02], [12.0, 42, -18, 32, 0.08]]) {
    await ctx.assets.spawn('nyc_skyscraper', { pos: [x, y, z], axis: 'height', meters: h, yaw, minRoughness: 0.78, parent: grp, solid: false });
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 8), beaconMat);
    b.position.copy(ctx.B2T([x, y, z + h + 0.35]));
    b.userData.noExport = true;
    grp.add(b);
  }

  for (const [x, y, z, w, d, h, mIdx, hasSpire, hasTank] of [
    [-17.5, 18, -18, 6.2, 6.2, 33, 0, true, false], [17.0, 20, -18, 5.8, 5.8, 31, 1, false, true],
    [-7.8, 22, -18, 4.8, 4.8, 24, 2, false, true], [8.2, 23, -18, 5.2, 5.2, 25, 0, false, true],
    [-19.5, 35, -18, 7.0, 7.0, 41, 1, true, false], [18.5, 37, -18, 6.5, 6.5, 39, 2, true, false]
  ]) {
    const fMat = facadeMats[mIdx];
    const base = new THREE.Mesh(new THREE.BoxGeometry(w, h * 0.72, d), fMat);
    base.position.copy(ctx.B2T([x, y, z + h * 0.36]));
    const tier2 = new THREE.Mesh(new THREE.BoxGeometry(w * 0.70, h * 0.28, d * 0.70), fMat);
    tier2.position.copy(ctx.B2T([x, y, z + h * 0.86]));
    ctx.outline?.(base); ctx.outline?.(tier2);
    grp.add(base, tier2);
    if (hasSpire) {
      const spire = new THREE.Mesh(new THREE.ConeGeometry(w * 0.18, 5.5, 8), spireMat);
      spire.position.copy(ctx.B2T([x, y, z + h + 2.75]));
      ctx.outline?.(spire);
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.30, 8, 6), beaconMat);
      b.position.copy(ctx.B2T([x, y, z + h + 5.6]));
      grp.add(spire, b);
    }
    if (hasTank) {
      const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 1.8, 10), waterTankMat);
      tank.position.copy(ctx.B2T([x + 0.8, y, z + h + 1.1]));
      const roof = new THREE.Mesh(new THREE.ConeGeometry(1.05, 0.8, 10), waterTankMat);
      roof.position.copy(ctx.B2T([x + 0.8, y, z + h + 2.4]));
      ctx.outline?.(tank);
      grp.add(tank, roof);
    }
  }

  const plane = await ctx.assets.spawn('vintage_prop_plane', {
    pos: [0, 8.0, 2.2], axis: 'length', meters: 7.50, yaw: Math.PI, keepMetal: true, shadow: false, parent: grp, solid: false
  });
  plane.rotation.order = 'YXZ';
  let propNode = null;
  plane.traverse(o => { if (/_propeller$|^propeller$/i.test(o.name)) propNode = o; });

  // Volumetric clouds brushing past wingtips during early over-the-wing pass (f=716..800)
  const rushMat = new THREE.MeshStandardMaterial({ color: '#334878', roughness: 0.96, transparent: true, opacity: 0.78 });
  const rushClouds = [];
  for (const [cx, cy, cz, r] of [[-5.6, 12, 1.5, 2.1], [5.8, 17, 2.8, 2.4], [-4.8, 24, 3.6, 1.8], [5.0, 30, 1.2, 2.2]]) {
    const cg = new THREE.Group();
    cg.add(new THREE.Mesh(new THREE.SphereGeometry(r, 12, 8), rushMat));
    const s2 = new THREE.Mesh(new THREE.SphereGeometry(r * 0.7, 10, 8), rushMat);
    s2.position.set(r * 0.65, r * 0.1, 0);
    cg.add(s2);
    cg.scale.set(1.4, 0.55, 1.1);
    cg.position.copy(ctx.B2T([cx, cy, cz]));
    cg.userData.noExport = true;
    grp.add(cg);
    rushClouds.push({ obj: cg, cx, cy0: cy, cz });
  }

  scene.add(grp);

  return {
    anchors: {
      plane_fly: () => [plane.position.x, -plane.position.z, plane.position.y]
    },
    update(f) {
      if (propNode) propNode.rotation.z = (f * 1.45) % (Math.PI * 2);
      const u = Math.max(0, Math.min(1, (f - 716) / 205));
      const px = Math.sin(u * Math.PI * 2.4) * 2.5;
      const py = 7.5 + u * 30.0;
      const pz = 2.6 - u * 1.4 + Math.sin(u * Math.PI * 3.0) * 0.6;
      plane.position.copy(ctx.B2T([px, py, pz]));
      const roll = Math.cos(u * Math.PI * 2.4) * 0.28;
      const dive = u > 0.76 ? 0.22 * (u - 0.76) / 0.24 : -0.04;
      plane.rotation.set(dive, Math.PI - px * 0.05, roll);
      for (const rc of rushClouds) {
        rc.obj.position.copy(ctx.B2T([rc.cx, rc.cy0 + u * 8.0, rc.cz]));
      }
    }
  };
}
