// 1956 Washington Heights NYC Street Night (Brick facade row, Poly Haven fire escapes & trash cans, saturated cobalt night fill >= 0.45, warm golden streetlamps, 4 vintage cars, tire-screech smoke, nose-forward Plane #1 & #2, police car siren).
export async function build(THREE, scene, film, ctx) {
  const grp = new THREE.Group();
  grp.name = 'nyc_street_night';

  const roadMat = ctx.relief ? ctx.relief('mud', '#2a3040', { scale: 2.2, seed: 13 }) : ctx.toon('#2a3040');
  const road = new THREE.Mesh(new THREE.PlaneGeometry(86, 22), roadMat);
  road.name = 'nyc_asphalt_road';
  road.userData.role = 'stone';
  road.rotation.x = -Math.PI / 2;
  road.receiveShadow = true;
  grp.add(road);

  const walkMat = ctx.relief ? ctx.relief('stone', '#626878', { scale: 1.8, seed: 19 }) : ctx.toon('#626878');
  const curbMat = ctx.relief ? ctx.relief('stone', '#788090', { scale: 1.4, seed: 23 }) : ctx.toon('#788090');
  const sidewalkN = new THREE.Mesh(new THREE.BoxGeometry(86, 0.16, 8.2), walkMat);
  sidewalkN.position.set(0, 0.08, -8.5);
  sidewalkN.receiveShadow = true;
  const curbN = new THREE.Mesh(new THREE.BoxGeometry(86, 0.18, 0.32), curbMat);
  curbN.position.set(0, 0.09, -4.45);
  const sidewalkS = new THREE.Mesh(new THREE.BoxGeometry(86, 0.16, 6.0), walkMat);
  sidewalkS.position.set(0, 0.08, 9.2);
  grp.add(sidewalkN, curbN, sidewalkS);

  const laneMat = new THREE.MeshStandardMaterial({ color: '#d8ab3e', roughness: 0.85 });
  for (let x = -28; x <= 28; x += 3.6) {
    const dash = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.18), laneMat);
    dash.rotation.x = -Math.PI / 2;
    dash.position.set(x, 0.015, 0.6);
    grp.add(dash);
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
      opacity: 0.72,
      minEl: 3,
      maxEl: 22
    });
  }

  // Row of 6 Manhattan brick townhouses + Poly Haven wrought-iron fire escapes + warm apartment windows
  const buildingSpecs = [
    [-21.5, 8.2, 9.8, '#855349'], [-14.2, 8.2, 10.6, '#966155'], [-7.0, 8.2, 9.6, '#9f695c'],
    [0.2, 8.2, 9.8, '#95584e'], [7.5, 8.2, 10.2, '#9f695c'], [14.8, 8.2, 9.5, '#86584f']
  ];
  const litWinMat = new THREE.MeshBasicMaterial({ color: '#ffd47d', toneMapped: false });
  for (const [bx, by, bh, tint] of buildingSpecs) {
    await ctx.assets.spawn('brick_building_facade', { pos: [bx, by, 0], axis: 'height', meters: bh, tint, yaw: 0, parent: grp, solid: true });
    for (const wx of [bx - 1.5, bx + 1.5]) {
      for (const wz of [4.2, 6.8]) {
        if ((Math.abs(Math.round(wx + wz)) % 3) !== 0) {
          const wPane = new THREE.Mesh(new THREE.PlaneGeometry(0.92, 1.25), litWinMat);
          wPane.position.copy(ctx.B2T([wx, 6.65, wz]));
          grp.add(wPane);
        }
      }
    }
  }
  await ctx.assets.spawn('fire_escape', { pos: [-7.0, 5.65, 2.2], axis: 'height', meters: 6.8, yaw: 0, keepMetal: true, parent: grp, solid: false });
  await ctx.assets.spawn('fire_escape', { pos: [7.5, 5.65, 2.2], axis: 'height', meters: 6.8, yaw: 0, keepMetal: true, parent: grp, solid: false });

  // O'MALLEY'S BAR glowing marquee + open tavern doorframe + foreground doorway trim
  const signC = document.createElement('canvas');
  signC.width = 512; signC.height = 128;
  const sg = signC.getContext('2d');
  sg.fillStyle = '#241418'; sg.fillRect(0, 0, 512, 128);
  sg.strokeStyle = '#ffbf5e'; sg.lineWidth = 8; sg.strokeRect(6, 6, 500, 116);
  sg.fillStyle = '#ffe599'; sg.font = 'bold 48px Arial, sans-serif'; sg.textAlign = 'center'; sg.textBaseline = 'middle';
  sg.fillText("O'MALLEY'S BAR", 256, 64);
  const barMarquee = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 0.78, 0.22),
    new THREE.MeshBasicMaterial({ map: Object.assign(new THREE.CanvasTexture(signC), { colorSpace: THREE.SRGBColorSpace }), toneMapped: false })
  );
  barMarquee.name = 'street_bar_marquee';
  ctx.outline?.(barMarquee);
  barMarquee.position.copy(ctx.B2T([0.2, 5.2, 3.0]));
  const barDoorGlow = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 2.2), new THREE.MeshBasicMaterial({ color: '#ffbd68', toneMapped: false }));
  barDoorGlow.position.copy(ctx.B2T([0.2, 6.55, 1.25]));
  grp.add(barMarquee, barDoorGlow);

  // 4 Street lamps with warm golden practical light pools
  const bulbMat = new THREE.MeshBasicMaterial({ color: '#ffe3a3', toneMapped: false });
  for (const lx of [-10.5, -4.6, 4.8, 11.2]) {
    await ctx.assets.spawn('street_lamp', { pos: [lx, 4.8, 0], axis: 'height', meters: 4.2, parent: grp, solid: true });
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), bulbMat);
    bulb.name = 'street_lamp_bulb';
    bulb.userData.role = 'lamp';
    bulb.position.copy(ctx.B2T([lx, 4.8, 3.85]));
    grp.add(bulb);
    const lgt = new THREE.PointLight('#ffd084', 4.6, 18, 1.2);
    lgt.position.copy(ctx.B2T([lx, 4.6, 3.7]));
    grp.add(lgt);
  }

  // Red fire hydrant & Poly Haven corrugated metal trash cans on curb
  const hydrantMat = new THREE.MeshStandardMaterial({ color: '#c42926', roughness: 0.52 });
  const hyd = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.17, 0.68, 10), hydrantMat);
  hyd.position.copy(ctx.B2T([3.4, 4.75, 0.50]));
  ctx.outline?.(hyd);
  const hydCap = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), hydrantMat);
  hydCap.position.copy(ctx.B2T([3.4, 4.75, 0.85]));
  grp.add(hyd, hydCap);
  await ctx.assets.spawn('metal_trash_can', { pos: [-2.4, 5.1, 0], axis: 'height', meters: 0.78, keepMetal: true, parent: grp, solid: false });

  // 4 Parked Vintage Cars
  await ctx.assets.spawn('vintage_sedan', { pos: [-7.4, 3.1, 0], axis: 'length', meters: 4.4, yaw: Math.PI / 2, tint: '#7a3330', keepMetal: true, parent: grp, solid: true });
  await ctx.assets.spawn('vintage_sedan', { pos: [8.4, 3.1, 0], axis: 'length', meters: 4.4, yaw: -Math.PI / 2, tint: '#36516b', keepMetal: true, parent: grp, solid: true });
  await ctx.assets.spawn('car', { pos: [-13.5, 3.1, 0], axis: 'length', meters: 4.3, yaw: Math.PI / 2, tint: '#bfb193', keepMetal: true, parent: grp, solid: true });
  await ctx.assets.spawn('vintage_sedan', { pos: [14.0, -5.2, 0], axis: 'length', meters: 4.4, yaw: -Math.PI / 2, tint: '#395a43', keepMetal: true, parent: grp, solid: true });

  // Plane #1 & Plane #2 aligned nose-first (-X direction along St. Nicholas Ave!)
  const plane1 = await ctx.assets.spawn('vintage_prop_plane', {
    pos: [1.2, 2.0, 0], axis: 'length', meters: 7.50, yaw: -Math.PI * 0.48, keepMetal: true, parent: grp, solid: false
  });
  plane1.rotation.order = 'YXZ';
  let prop1 = null;
  plane1.traverse(o => { if (/_propeller$|^propeller$/i.test(o.name)) prop1 = o; });

  const plane2 = await ctx.assets.spawn('vintage_prop_plane', {
    pos: [1.0, 2.0, 0], axis: 'length', meters: 7.50, yaw: -Math.PI * 0.48, tint: '#d9ecff', keepMetal: true, parent: grp, solid: false
  });
  plane2.rotation.order = 'YXZ';
  let prop2 = null;
  plane2.traverse(o => { if (/_propeller$|^propeller$/i.test(o.name)) prop2 = o; });
  plane2.visible = false;

  // 3D Tire-Screech Smoke Puffs during touchdown (f=1010..1125 & f=1640..1725)
  const smokeMat = new THREE.MeshStandardMaterial({ color: '#cdd6e3', roughness: 0.95, transparent: true, opacity: 0.72 });
  const skidSmoke = [];
  for (let i = 0; i < 6; i++) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(0.28 + (i % 2) * 0.14, 10, 8), smokeMat);
    puff.visible = false;
    grp.add(puff);
    skidSmoke.push(puff);
  }

  // Police Cruiser + Flashing Red/Blue Roof Beacon
  const copCar = await ctx.assets.spawn('vintage_police_car', {
    pos: [-2.55, 0.25, 0], axis: 'length', meters: 4.5, yaw: Math.PI * 0.42, keepMetal: true, parent: grp, solid: false
  });
  const sirenRed = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), new THREE.MeshBasicMaterial({ color: '#ff3038', toneMapped: false }));
  const sirenBlue = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), new THREE.MeshBasicMaterial({ color: '#3888ff', toneMapped: false }));
  sirenRed.position.set(-0.22, 1.52, 0.0);
  sirenBlue.position.set(0.22, 1.52, 0.0);
  const sirenLight = new THREE.PointLight('#ff3b40', 0, 12, 1.35);
  sirenLight.position.set(0, 1.75, 0);
  copCar.add(sirenRed, sirenBlue, sirenLight);
  copCar.visible = false;

  scene.add(grp);
  const smooth = x => { const t = Math.max(0, Math.min(1, x)); return t * t * (3 - 2 * t); };

  return {
    anchors: {
      plane_nose: [1.2, 2.0, 0.8],
      tire_touch: [1.3, 1.85, 0.35],
      police_siren: () => [copCar.position.x, -copCar.position.z, 1.55]
    },
    update(f, t) {
      if (f < 1605) {
        plane1.visible = true;
        plane2.visible = false;
        const u = smooth((f - 915) / 185);
        const touch = smooth((f - 915) / 105);
        const px = 15.0 * (1 - u) + 1.2 * u;
        const py = 2.02;
        const pz = 4.8 * (1 - touch);
        const pitch = (1 - touch) * 0.11;
        plane1.position.copy(ctx.B2T([px, py, pz]));
        plane1.rotation.set(pitch, -Math.PI * 0.48, (1 - touch) * 0.14);
        if (prop1) prop1.rotation.z = f < 1125 ? (f * 1.15) % (Math.PI * 2) : 0;

        const smokey = f >= 1015 && f <= 1110;
        for (let i = 0; i < skidSmoke.length; i++) {
          skidSmoke[i].visible = smokey;
          if (smokey) {
            const k = ((f - 1015) * 0.06 + i * 0.25) % 1.0;
            skidSmoke[i].position.copy(ctx.B2T([px + 0.5 + k * 2.4, py + ((i % 3) - 1) * 0.35, 0.22 + k * 0.55]));
            skidSmoke[i].scale.setScalar(0.6 + k * 1.1);
          }
        }
      } else {
        plane1.visible = false;
        plane2.visible = true;
        const u = smooth((f - 1622) / 56);
        const touch = smooth((f - 1622) / 40);
        const px = 9.5 * (1 - u) + 1.0 * u;
        const pz = 3.8 * (1 - touch);
        plane2.position.copy(ctx.B2T([px, 2.0, pz]));
        plane2.rotation.set((1 - touch) * 0.10, -Math.PI * 0.48, (1 - touch) * 0.14);
        if (prop2) prop2.rotation.z = f < 1715 ? (f * 1.35) % (Math.PI * 2) : 0;

        const smokey = f >= 1665 && f <= 1720;
        for (let i = 0; i < skidSmoke.length; i++) {
          skidSmoke[i].visible = smokey;
          if (smokey) {
            const k = ((f - 1665) * 0.08 + i * 0.25) % 1.0;
            skidSmoke[i].position.copy(ctx.B2T([px + 0.5 + k * 2.2, 2.0 + ((i % 3) - 1) * 0.35, 0.22 + k * 0.55]));
            skidSmoke[i].scale.setScalar(0.6 + k * 1.1);
          }
        }
      }

      if (f >= 1260 && f <= 1385) {
        copCar.visible = true;
        const uc = smooth((f - 1260) / 45);
        copCar.position.copy(ctx.B2T([-12.5 * (1 - uc) + (-2.55) * uc, 0.25, 0]));
        const flashR = Math.sin(t * 14.0) > 0;
        sirenRed.visible = flashR;
        sirenBlue.visible = !flashR;
        sirenLight.color.set(flashR ? '#ff2a38' : '#2f7eff');
        sirenLight.intensity = 4.4;
      } else {
        copCar.visible = false;
        sirenLight.intensity = 0;
      }
    }
  };
}
