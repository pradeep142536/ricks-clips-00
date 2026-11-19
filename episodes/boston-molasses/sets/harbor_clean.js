export function build(scene, THREE) {
  const root = new THREE.Group();
  root.name = 'harbor_clean';

  // Brown stained harbor water
  const seaGeo = new THREE.PlaneGeometry(30, 30);
  const seaMat = new THREE.MeshStandardMaterial({ color: 0x2e2318, roughness: 0.2, metalness: 0.3 });
  const sea = new THREE.Mesh(seaGeo, seaMat);
  root.add(sea);

  // Wooden harbor dock pier
  const pierGeo = new THREE.BoxGeometry(10, 3.5, 0.4);
  const pierMat = new THREE.MeshStandardMaterial({ color: 0x544133, roughness: 0.85 });
  const pier = new THREE.Mesh(pierGeo, pierMat);
  pier.position.set(0, -2.5, 0.2);
  root.add(pier);

  // Wooden dock pilings
  for (let x of [-4, -2, 0, 2, 4]) {
    const pileGeo = new THREE.CylinderGeometry(0.18, 0.2, 2.5, 8);
    const pileMat = new THREE.MeshStandardMaterial({ color: 0x3b2d23, roughness: 0.9 });
    const pile = new THREE.Mesh(pileGeo, pileMat);
    pile.rotation.x = Math.PI / 2;
    pile.position.set(x, -0.8, -0.5);
    root.add(pile);
  }

  // Seawater fire hose jet stream
  const hoseGeo = new THREE.CylinderGeometry(0.08, 0.25, 6.0, 8);
  const hoseMat = new THREE.MeshStandardMaterial({ color: 0xcee8f5, roughness: 0.1, opacity: 0.85, transparent: true });
  const stream = new THREE.Mesh(hoseGeo, hoseMat);
  stream.rotation.x = 1.2;
  stream.rotation.z = -0.4;
  stream.position.set(-2.2, 1.5, 1.2);
  root.add(stream);

  // Foaming water impact ring
  const foamGeo = new THREE.RingGeometry(0.8, 1.8, 16);
  const foamMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, opacity: 0.7, transparent: true });
  const foam = new THREE.Mesh(foamGeo, foamMat);
  foam.position.set(0.8, 3.8, 0.05);
  root.add(foam);

  // Sunny afternoon sky lighting
  const sun = new THREE.DirectionalLight(0xfff5ea, 1.5);
  sun.position.set(6, -8, 10);
  root.add(sun);
  const amb = new THREE.AmbientLight(0x90a4ae, 0.6);
  root.add(amb);

  scene.add(root);

  return { root, sea, stream, foam };
}

export function update(f, t, R) {
  if (!R) return;
  // Water hose jet oscillating spray
  if (R.stream) {
    R.stream.rotation.z = -0.4 + Math.sin(t * 4.0) * 0.08;
    R.stream.rotation.x = 1.2 + Math.cos(t * 3.0) * 0.05;
  }
  // Pulsing seawater foam splash
  if (R.foam) {
    const s = 1.0 + Math.sin(t * 6.0) * 0.25;
    R.foam.scale.set(s, s, 1.0);
    R.foam.rotation.z = t * 1.5;
  }
}
