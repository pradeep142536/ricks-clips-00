// REUSABLE CINEMA-GRADE PROP & ENVIRONMENT HELPERS FOR THREE.JS
// Enforces RicksClips Cinema Standard V3.0 (in-world gag props, tactile labels, and matte PBR look).

export function createHelpers(THREE) {
  // 1. Soft Radial Contact Shadow Texture
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 128;
  shadowCanvas.height = 128;
  const sg = shadowCanvas.getContext('2d');
  const grad = sg.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
  grad.addColorStop(0.4, 'rgba(0, 0, 0, 0.45)');
  grad.addColorStop(0.8, 'rgba(0, 0, 0, 0.12)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
  sg.fillStyle = grad;
  sg.fillRect(0, 0, 128, 128);
  const shadowTex = new THREE.CanvasTexture(shadowCanvas);

  const createContactShadow = (radius, opacity = 0.55) => {
    const mat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: opacity,
      depthWrite: false
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(radius * 2, radius * 2), mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.001;
    return mesh;
  };

  // 2. Ultra-Crisp Compact 3D Price Badge (Zero 9:16 Clipping / Zero Caption Collision)
  const createCompactBadge = ({
    price,
    label = null,
    accent = '#ffd15c',
    bg = 'rgba(15, 23, 42, 0.92)',
    border = '#334155',
    isHero = false
  }) => {
    const canvas = document.createElement('canvas');
    canvas.width = 384;
    canvas.height = 200;
    const g = canvas.getContext('2d');

    // Smooth rounded capsule/pill
    const r = 24;
    g.fillStyle = bg;
    g.beginPath();
    g.roundRect(8, 8, 368, 184, r);
    g.fill();

    // Metallic / glowing border
    g.lineWidth = isHero ? 8 : 5;
    g.strokeStyle = isHero ? '#ff2244' : border;
    g.stroke();

    // Price typography (large, bold, high contrast)
    g.fillStyle = isHero ? '#ffffff' : accent;
    g.font = 'bold 88px "Segoe UI", Roboto, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';

    if (label) {
      g.fillText(price, 192, 78);
      g.fillStyle = '#94a3b8';
      g.font = '600 42px "Segoe UI", Roboto, sans-serif';
      g.fillText(label.toUpperCase(), 192, 142);
    } else {
      g.fillText(price, 192, 100);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 8;
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false });
    // Compact physical footprint: 0.19m wide by 0.10m high (55% smaller than legacy)
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.19, 0.10), mat);
    mesh.name = `badge_${price.replace('$', '')}`;
    return mesh;
  };

  // 3. Realistic Contoured 3D Paper Coffee Cup with Cardboard Sleeve & Sip Lid
  const createDetailedCoffeeCup = ({
    rTop = 0.046,
    rBot = 0.034,
    height = 0.15,
    price = '$3.00',
    label = 'Small',
    isDecoy = false
  }) => {
    const grp = new THREE.Group();
    grp.name = `cup_${label.toLowerCase()}`;

    // Materials
    const cupMat = new THREE.MeshStandardMaterial({
      color: 0xf6f3ed,
      roughness: 0.65,
      metalness: 0.05
    });
    const sleeveMat = new THREE.MeshStandardMaterial({
      color: 0xb58b5f,
      roughness: 0.88,
      metalness: 0.0
    });
    const lidMat = new THREE.MeshStandardMaterial({
      color: 0x1e1e24,
      roughness: 0.45,
      metalness: 0.1
    });

    // 1. Tapered Cup Body
    const cupGeo = new THREE.CylinderGeometry(rTop, rBot, height, 32, 1, false);
    const cupMesh = new THREE.Mesh(cupGeo, cupMat);
    cupMesh.position.y = height / 2;
    cupMesh.castShadow = true;
    grp.add(cupMesh);

    // Rolled Top Paper Rim
    const rimGeo = new THREE.TorusGeometry(rTop * 1.01, 0.0028, 12, 32);
    const rimMesh = new THREE.Mesh(rimGeo, cupMat);
    rimMesh.rotation.x = Math.PI / 2;
    rimMesh.position.y = height;
    grp.add(rimMesh);

    // 2. Corrugated Kraft Heat Sleeve
    const sleeveH = height * 0.44;
    const sTop = rBot + (rTop - rBot) * 0.74;
    const sBot = rBot + (rTop - rBot) * 0.30;
    const sleeveGeo = new THREE.CylinderGeometry(sTop * 1.025, sBot * 1.025, sleeveH, 32);
    const sleeveMesh = new THREE.Mesh(sleeveGeo, sleeveMat);
    sleeveMesh.position.y = height * 0.52;
    sleeveMesh.castShadow = true;
    grp.add(sleeveMesh);

    // 3. Beveled Drinking Lid with Raised Sip Spout
    const lidBaseGeo = new THREE.CylinderGeometry(rTop * 1.05, rTop * 1.05, 0.014, 32);
    const lidBase = new THREE.Mesh(lidBaseGeo, lidMat);
    lidBase.position.y = height + 0.007;
    grp.add(lidBase);

    const lidTopGeo = new THREE.CylinderGeometry(rTop * 0.94, rTop * 1.02, 0.012, 32);
    const lidTop = new THREE.Mesh(lidTopGeo, lidMat);
    lidTop.position.y = height + 0.018;
    grp.add(lidTop);

    // Raised Sip Slot
    const spoutGeo = new THREE.BoxGeometry(rTop * 0.45, 0.008, rTop * 0.22);
    const spout = new THREE.Mesh(spoutGeo, lidMat);
    spout.position.set(0, height + 0.024, rTop * 0.65);
    grp.add(spout);

    // 4. Grounded Contact Shadow Decal
    const shadow = createContactShadow(rBot * 1.6, 0.55);
    grp.add(shadow);

    // 5. Compact 3D Price Badge Hovering Above Cup
    const badge = createCompactBadge({
      price,
      label,
      accent: isDecoy ? '#ff4d6d' : '#f8fafc',
      bg: isDecoy ? 'rgba(38, 12, 20, 0.95)' : 'rgba(15, 23, 42, 0.92)',
      border: isDecoy ? '#ff2244' : '#475569',
      isHero: isDecoy
    });
    badge.position.set(0, height + 0.12, 0);
    grp.add(badge);
    grp.userData.badge = badge;

    return grp;
  };

  // 4. Clustered Organic Popcorn Tub (No Smooth Domes)
  const createDetailedPopcornTub = ({
    rTop = 0.085,
    rBot = 0.060,
    height = 0.22,
    price = '$5.00',
    label = 'Small',
    isDecoy = false
  }) => {
    const grp = new THREE.Group();
    grp.name = `popcorn_${label.toLowerCase()}`;

    // Red & White Striped Canvas Material
    const stripeCanvas = document.createElement('canvas');
    stripeCanvas.width = 256;
    stripeCanvas.height = 64;
    const ctx = stripeCanvas.getContext('2d');
    const w = 256 / 8;
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#dc2626' : '#f8fafc';
      ctx.fillRect(i * w, 0, w, 64);
    }
    const stripeTex = new THREE.CanvasTexture(stripeCanvas);
    stripeTex.wrapS = THREE.RepeatWrapping;
    stripeTex.repeat.set(4, 1);

    const tubMat = new THREE.MeshStandardMaterial({
      map: stripeTex,
      roughness: 0.6,
      metalness: 0.05
    });

    // Tub Body
    const tubGeo = new THREE.CylinderGeometry(rTop, rBot, height, 32);
    const tubMesh = new THREE.Mesh(tubGeo, tubMat);
    tubMesh.position.y = height / 2;
    tubMesh.castShadow = true;
    grp.add(tubMesh);

    // Rolled Top Paper Rim
    const rimGeo = new THREE.TorusGeometry(rTop * 1.01, 0.0035, 12, 32);
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    rimMesh.rotation.x = Math.PI / 2;
    rimMesh.position.y = height;
    grp.add(rimMesh);

    // Clustered Organic Popcorn Kernels (Multi-Sphere Fluffy Heap)
    const popcornGroup = new THREE.Group();
    popcornGroup.position.y = height + 0.005;

    const kernelMat1 = new THREE.MeshStandardMaterial({ color: 0xfff1aa, roughness: 0.85 });
    const kernelMat2 = new THREE.MeshStandardMaterial({ color: 0xf5d061, roughness: 0.75 }); // butter
    const kernelMat3 = new THREE.MeshStandardMaterial({ color: 0xd9822b, roughness: 0.90 }); // toasted core

    const kernelGeo = new THREE.DodecahedronGeometry(0.016, 1);

    // Generate 55 clustered fluffy kernels
    const seedPoints = [];
    const count = Math.round(50 * (rTop / 0.07));
    for (let i = 0; i < count; i++) {
      const rad = (Math.random() * 0.85) * (rTop * 0.95);
      const theta = Math.random() * Math.PI * 2;
      const x = Math.cos(theta) * rad;
      const z = Math.sin(theta) * rad;
      const distRatio = rad / rTop;
      const y = Math.max(0, (1.0 - distRatio * 0.9) * (height * 0.32) + (Math.random() - 0.5) * 0.02);

      const m = new THREE.Mesh(kernelGeo, Math.random() > 0.4 ? kernelMat1 : (Math.random() > 0.3 ? kernelMat2 : kernelMat3));
      m.position.set(x, y, z);
      const s = 0.75 + Math.random() * 0.55;
      m.scale.set(s, s * (0.8 + Math.random() * 0.4), s);
      m.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      m.castShadow = true;
      popcornGroup.add(m);
    }
    grp.add(popcornGroup);

    // Contact shadow
    const shadow = createContactShadow(rBot * 1.5, 0.55);
    grp.add(shadow);

    // Price Badge
    const badge = createCompactBadge({
      price,
      label,
      accent: isDecoy ? '#ff4d6d' : '#ffd15c',
      bg: isDecoy ? 'rgba(38, 12, 20, 0.95)' : 'rgba(24, 18, 30, 0.95)',
      border: isDecoy ? '#ff2244' : '#eab308',
      isHero: isDecoy
    });
    badge.position.set(0, height + 0.16, 0);
    grp.add(badge);
    grp.userData.badge = badge;

    return grp;
  };

  // 5. Volumetric Light Cone (Warm Atmospheric Lighting without Clutter)
  const createVolumetricCone = ({
    rTop = 0.05,
    rBot = 0.75,
    height = 2.0,
    color = 0xffe099,
    opacity = 0.14
  }) => {
    const geo = new THREE.ConeGeometry(rBot, height, 24, 1, true);
    const mat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: opacity,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const cone = new THREE.Mesh(geo, mat);
    cone.rotation.x = Math.PI; // point downwards
    cone.position.y = -height / 2;
    return cone;
  };

  // 6. V3.0 Physical In-World Gag Sign / Plaque (No floating 2D UI text boxes!)
  const createGagSignOrLabel = ({
    title = 'NOTICE',
    subtitle = '',
    bg = '#fcf4de',
    border = '#231218',
    titleColor = '#b91c1c',
    subColor = '#231218',
    width_m = 0.76,
    height_m = 0.44
  } = {}) => {
    const c = document.createElement('canvas');
    c.width = 512; c.height = Math.max(192, Math.round(512 * (height_m / width_m)));
    const g = c.getContext('2d');
    g.fillStyle = bg; g.fillRect(0, 0, c.width, c.height);
    g.strokeStyle = border; g.lineWidth = 14; g.strokeRect(7, 7, c.width - 14, c.height - 14);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = titleColor;
    g.font = `900 ${Math.round(c.height * (subtitle ? 0.30 : 0.40))}px "Arial Black", Impact, sans-serif`;
    g.fillText(title, c.width / 2, subtitle ? c.height * 0.40 : c.height * 0.50);
    if (subtitle) {
      g.fillStyle = subColor;
      g.font = `bold ${Math.round(c.height * 0.16)}px Arial, sans-serif`;
      g.fillText(subtitle, c.width / 2, c.height * 0.74);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(width_m, height_m, 0.035),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.78, metalness: 0.04, emissiveMap: tex, emissive: '#ffffff', emissiveIntensity: 0.25 })
    );
    mesh.name = `gag_sign_${title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
    mesh.castShadow = true;
    return mesh;
  };

  // 7. V3.0 Tactile Red Gag Button (e.g. "FIRE EMPLOYEE", "EJECT", "PANIC")
  const createBigRedButton = ({ label = 'FIRE EMPLOYEE', width_m = 0.42 } = {}) => {
    const grp = new THREE.Group();
    grp.name = `gag_button_${label.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
    const baseMat = new THREE.MeshStandardMaterial({ color: '#39414a', roughness: 0.65, metalness: 0.35 });
    const rimMat = new THREE.MeshStandardMaterial({ color: '#c8a84a', roughness: 0.48, metalness: 0.6 });
    const btnMat = new THREE.MeshStandardMaterial({ color: '#d92626', roughness: 0.45, emissive: '#6e0e0e', emissiveIntensity: 0.35 });
    const base = new THREE.Mesh(new THREE.BoxGeometry(width_m, width_m * 0.18, width_m * 0.78), baseMat);
    base.position.y = width_m * 0.09;
    base.castShadow = true;
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(width_m * 0.25, width_m * 0.27, width_m * 0.06, 20), rimMat);
    collar.position.set(0, width_m * 0.20, -width_m * 0.06);
    const dome = new THREE.Mesh(new THREE.CylinderGeometry(width_m * 0.21, width_m * 0.21, width_m * 0.10, 20), btnMat);
    dome.name = 'button_plunger';
    dome.position.set(0, width_m * 0.26, -width_m * 0.06);
    const plaque = createGagSignOrLabel({ title: label, bg: '#1e242b', border: '#c8a84a', titleColor: '#fde68a', width_m: width_m * 0.88, height_m: width_m * 0.20 });
    plaque.rotation.x = -Math.PI * 0.35;
    plaque.position.set(0, width_m * 0.20, width_m * 0.28);
    grp.add(base, collar, dome, plaque);
    grp.userData.plunger = dome;
    return grp;
  };

  // 8. V3.0 Physical Paper/Dossier/Newspaper Prop
  const createDocumentProp = ({ header = 'CLASSIFIED', lines = ['TOP SECRET', 'DO NOT OPEN'], stamp = 'APPROVED', width_m = 0.32 } = {}) => {
    const c = document.createElement('canvas');
    c.width = 384; c.height = 480;
    const g = c.getContext('2d');
    g.fillStyle = '#faf3e0'; g.fillRect(0, 0, 384, 480);
    g.strokeStyle = '#231218'; g.lineWidth = 10; g.strokeRect(5, 5, 374, 470);
    g.fillStyle = '#231218'; g.fillRect(20, 22, 344, 58);
    g.fillStyle = '#faf3e0'; g.font = 'bold 34px Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(header, 192, 51);
    g.fillStyle = '#33292c'; g.font = 'bold 26px Arial, sans-serif';
    lines.slice(0, 4).forEach((ln, idx) => g.fillText(ln, 192, 132 + idx * 46));
    for (let i = 0; i < 4; i++) {
      g.fillStyle = '#bfb49f'; g.fillRect(42, 305 + i * 24, i === 3 ? 190 : 300, 10);
    }
    if (stamp) {
      g.save();
      g.translate(220, 380); g.rotate(-0.22);
      g.strokeStyle = '#c82323'; g.lineWidth = 6; g.strokeRect(-95, -28, 190, 56);
      g.fillStyle = '#c82323'; g.font = '900 30px "Arial Black", sans-serif';
      g.fillText(stamp, 0, 2);
      g.restore();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const doc = new THREE.Mesh(
      new THREE.BoxGeometry(width_m, 0.015, width_m * 1.25),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85, metalness: 0.0 })
    );
    doc.name = `gag_doc_${header.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
    doc.castShadow = true;
    return doc;
  };

  return {
    createContactShadow,
    createCompactBadge,
    createDetailedCoffeeCup,
    createDetailedPopcornTub,
    createVolumetricCone,
    createGagSignOrLabel,
    createBigRedButton,
    createDocumentProp
  };
}
