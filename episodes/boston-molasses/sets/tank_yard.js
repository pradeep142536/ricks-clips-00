export function build(scene, THREE) {
  const root = new THREE.Group();
  root.name = 'tank_yard';

  // Ground cobblestone street
  const groundGeo = new THREE.PlaneGeometry(30, 30);
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x3d352e, roughness: 0.85, metalness: 0.1 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.position.set(0, 0, 0);
  root.add(ground);

  // Giant 50-ft steel molasses tank (Commercial Street tank: 27m dia, 15m tall)
  const tankGeo = new THREE.CylinderGeometry(7.0, 7.0, 10.0, 32);
  const tankMat = new THREE.MeshStandardMaterial({ color: 0x4a2a1a, roughness: 0.6, metalness: 0.4 });
  const tank = new THREE.Mesh(tankGeo, tankMat);
  tank.rotation.x = Math.PI / 2;
  tank.position.set(2.0, 6.0, 5.0);
  root.add(tank);

  // Steel rivet bands around the tank
  for (let z of [1.5, 3.5, 5.5, 7.5, 9.0]) {
    const ringGeo = new THREE.TorusGeometry(7.05, 0.08, 8, 32);
    const ringMat = new THREE.MeshStandardMaterial({ color: 0x2e1b12, roughness: 0.7, metalness: 0.6 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.set(2.0, 6.0, z);
    root.add(ring);
  }

  // Molasses leak trickles running down the tank
  const leaks = [];
  for (let i = 0; i < 6; i++) {
    const leakGeo = new THREE.CylinderGeometry(0.04, 0.08, 4.0, 8);
    const leakMat = new THREE.MeshStandardMaterial({ color: 0x1f0f08, roughness: 0.2, metalness: 0.2 });
    const leak = new THREE.Mesh(leakGeo, leakMat);
    leak.rotation.x = Math.PI / 2;
    leak.position.set(2.0 + Math.sin(i * 1.0) * 6.9, 6.0 - Math.cos(i * 1.0) * 6.9, 2.5);
    root.add(leak);
    leaks.push(leak);
  }

  // Expanding sticky molasses pool at base
  const poolGeo = new THREE.CircleGeometry(4.5, 32);
  const poolMat = new THREE.MeshStandardMaterial({ color: 0x1a0a04, roughness: 0.15, metalness: 0.3 });
  const pool = new THREE.Mesh(poolGeo, poolMat);
  pool.position.set(0.5, 1.5, 0.02);
  root.add(pool);

  // 1919 Boston Red Brick Warehouse Facade
  const bldgGeo = new THREE.BoxGeometry(8, 0.6, 12);
  const bldgMat = new THREE.MeshStandardMaterial({ color: 0x8a382b, roughness: 0.9 });
  const bldg = new THREE.Mesh(bldgGeo, bldgMat);
  bldg.position.set(-6.5, 5.0, 6.0);
  root.add(bldg);

  // Gas street lamp
  const postGeo = new THREE.CylinderGeometry(0.06, 0.08, 3.2, 8);
  const postMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8 });
  const post = new THREE.Mesh(postGeo, postMat);
  post.rotation.x = Math.PI / 2;
  post.position.set(-2.5, 1.0, 1.6);
  root.add(post);

  // Ambient & Directional Lighting
  const sun = new THREE.DirectionalLight(0xffeedd, 1.4);
  sun.position.set(5, -8, 12);
  root.add(sun);
  const amb = new THREE.AmbientLight(0xb0c4de, 0.6);
  root.add(amb);

  scene.add(root);

  return { root, leaks, pool, tank };
}

export function update(f, t, R) {
  if (!R) return;
  // Subtle tank breathing / pressure vibration
  if (R.tank) {
    R.tank.scale.set(1.0 + Math.sin(t * 8.0) * 0.005, 1.0 + Math.sin(t * 8.0) * 0.005, 1.0);
  }
  // Leaks pulsing
  if (R.pool) {
    const s = 1.0 + Math.sin(t * 1.5) * 0.03;
    R.pool.scale.set(s, s, 1.0);
  }
}
