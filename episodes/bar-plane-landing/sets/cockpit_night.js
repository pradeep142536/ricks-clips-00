// 1956 Midnight Over-the-Wing Exterior Tracking Shot (Zero boxy green cockpit — crisp ink-outlined vintage_prop_plane weaving past clouds & towers with saturated cobalt night fill >= 0.45).
export async function build(THREE, scene, film, ctx) {
  const grp = new THREE.Group();
  grp.name = 'cockpit_night';

  if (ctx.sky && ctx.sky.clouds) {
    ctx.sky.clouds({
      kind: 'night-storm',
      colors: {
        top: '#0c1538', mid: '#1f3164', hor: '#3c548f', sun: '#c4d8ff',
        lit: '#829cd6', shade: '#172344', rim: '#c4d8ff',
        core: '#091230', body: '#1c2b5c', slit: '#7b94cf', srim: '#b4cbff', under: '#2c3d6a', scud: '#101834', rain: '#223158'
      },
      storm: { rainAmt: 0.0, underAmt: 0.22 },
      opacity: 0.80,
      minEl: -6,
      maxEl: 24
    });
  }

  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(2.6, 20, 14),
    new THREE.MeshBasicMaterial({ color: '#fff3d6', toneMapped: false, fog: false })
  );
  moon.userData.noExport = true;
  moon.position.set(10, 14, -64);
  grp.add(moon);

  const wingFill = new THREE.DirectionalLight('#c4daff', 1.75);
  wingFill.position.set(8, 12, -10);
  grp.add(wingFill);

  const plane = await ctx.assets.spawn('vintage_prop_plane', {
    pos: [0.0, 2.2, 0.0],
    axis: 'length',
    meters: 7.50,
    yaw: Math.PI,
    keepMetal: true,
    shadow: false,
    parent: grp,
    solid: false
  });
  plane.rotation.order = 'YXZ';
  let propNode = null;
  plane.traverse(o => {
    if (/_propeller$|^propeller$/i.test(o.name)) propNode = o;
  });

  // Soft volumetric night clouds rushing backward
  const cloudMats = [
    new THREE.MeshStandardMaterial({ color: '#334878', roughness: 0.96, metalness: 0.0, transparent: true, opacity: 0.78 }),
    new THREE.MeshStandardMaterial({ color: '#233359', roughness: 0.98, metalness: 0.0, transparent: true, opacity: 0.84 })
  ];
  const cloudPuffs = [];
  const puffSpecs = [
    [-5.8, 10, -2.5, 2.4, 0], [5.4, 16, -2.0, 2.8, 1], [-4.5, 22, 2.8, 1.9, 0],
    [4.9, 28, 1.5, 2.3, 1], [-6.8, 34, -0.5, 3.0, 0], [6.2, 40, -1.8, 2.6, 1]
  ];
  for (const [cx, cy, cz, cr, mIdx] of puffSpecs) {
    const cl = new THREE.Group();
    const s1 = new THREE.Mesh(new THREE.SphereGeometry(cr, 14, 10), cloudMats[mIdx]);
    const s2 = new THREE.Mesh(new THREE.SphereGeometry(cr * 0.72, 12, 8), cloudMats[mIdx]);
    s2.position.set(cr * 0.65, cr * 0.15, cr * 0.1);
    const s3 = new THREE.Mesh(new THREE.SphereGeometry(cr * 0.68, 12, 8), cloudMats[mIdx]);
    s3.position.set(-cr * 0.62, -cr * 0.1, -cr * 0.15);
    cl.add(s1, s2, s3);
    cl.scale.set(1.4, 0.58, 1.1);
    cl.position.copy(ctx.B2T([cx, cy, cz]));
    cl.userData.noExport = true;
    grp.add(cl);
    cloudPuffs.push({ obj: cl, cx, cy0: cy, cz });
  }

  const towers = [];
  for (const [x, y, z, h, yaw] of [[-11.5, 22, -26, 24, 0.08], [11.0, 26, -26, 26, -0.06], [-14.0, 38, -26, 28, 0.12], [13.5, 42, -26, 27, -0.09]]) {
    const tw = await ctx.assets.spawn('nyc_skyscraper', { pos: [x, y, z], axis: 'height', meters: h, yaw, minRoughness: 0.78, parent: grp, solid: false });
    towers.push({ obj: tw, x, y0: y, z });
  }

  scene.add(grp);

  return {
    anchors: {
      plane_wing: () => [plane.position.x, -plane.position.z, plane.position.y + 1.0]
    },
    update(f) {
      if (propNode) propNode.rotation.z = (f * 1.55) % (Math.PI * 2);
      const u = (f - 705) * 0.075;
      const bank = Math.sin(u) * 0.28;
      const heave = Math.sin(u * 0.8) * 0.35;
      const swayX = Math.cos(u) * 0.55;
      plane.position.copy(ctx.B2T([swayX, 2.2, heave]));
      plane.rotation.set(-0.04, Math.PI - swayX * 0.06, bank);

      for (const cp of cloudPuffs) {
        const yRun = ((cp.cy0 - (f - 700) * 0.45 + 48) % 48) + 2;
        cp.obj.position.copy(ctx.B2T([cp.cx, yRun, cp.cz]));
      }
      for (const tw of towers) {
        const yRun = ((tw.y0 - 12 - (f - 700) * 0.32 + 52) % 52) + 12;
        tw.obj.position.copy(ctx.B2T([tw.x, yRun, tw.z]));
      }
    }
  };
}
