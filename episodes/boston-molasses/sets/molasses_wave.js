export function build(scene, THREE) {
  const root = new THREE.Group();
  root.name = 'molasses_wave';

  // Ground
  const groundGeo = new THREE.PlaneGeometry(30, 30);
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x2b221b, roughness: 0.9 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  root.add(ground);

  // 25-foot curling molasses wave crest
  const waveGeo = new THREE.CylinderGeometry(4.0, 5.5, 14.0, 32, 1, false, 0, Math.PI * 0.9);
  const waveMat = new THREE.MeshStandardMaterial({ color: 0x1f0b04, roughness: 0.15, metalness: 0.35 });
  const wave = new THREE.Mesh(waveGeo, waveMat);
  wave.rotation.z = Math.PI / 2;
  wave.rotation.x = 0.4;
  wave.position.set(0, 3.5, 3.2);
  root.add(wave);

  // Wave froth & surge particles
  const surgeGeo = new THREE.SphereGeometry(0.35, 8, 8);
  const surgeMat = new THREE.MeshStandardMaterial({ color: 0x3d1a0b, roughness: 0.3 });
  const droplets = [];
  for (let i = 0; i < 20; i++) {
    const d = new THREE.Mesh(surgeGeo, surgeMat);
    d.position.set((Math.random() - 0.5) * 12, 1.5 + Math.random() * 2.5, 4.0 + Math.random() * 2.0);
    root.add(d);
    droplets.push({ mesh: d, ox: d.position.x, oz: d.position.z, spd: 1.5 + Math.random() * 2.0 });
  }

  // Boston Atlantic Avenue Elevated Railway Trestle
  const elGroup = new THREE.Group();
  for (let x of [-4.0, 0.0, 4.0]) {
    const colGeo = new THREE.BoxGeometry(0.35, 0.35, 5.0);
    const colMat = new THREE.MeshStandardMaterial({ color: 0x333b40, metalness: 0.8, roughness: 0.4 });
    const col = new THREE.Mesh(colGeo, colMat);
    col.position.set(x, 1.0, 2.5);
    elGroup.add(col);
  }
  // Girder beam
  const beamGeo = new THREE.BoxGeometry(14.0, 0.4, 0.5);
  const beamMat = new THREE.MeshStandardMaterial({ color: 0x333b40, metalness: 0.8, roughness: 0.4 });
  const beam = new THREE.Mesh(beamGeo, beamMat);
  beam.position.set(0, 1.0, 5.0);
  elGroup.add(beam);
  root.add(elGroup);

  // Lighting: dramatic warm-tinted daylight
  const sun = new THREE.DirectionalLight(0xffecd0, 1.6);
  sun.position.set(-6, -6, 10);
  root.add(sun);
  const amb = new THREE.AmbientLight(0x8b7d7b, 0.5);
  root.add(amb);

  scene.add(root);

  return { root, wave, droplets, elGroup };
}

export function update(f, t, R) {
  if (!R) return;
  // Surging rolling motion of the viscous wave
  if (R.wave) {
    R.wave.position.y = 3.5 + Math.sin(t * 3.0) * 0.4;
    R.wave.position.z = 3.2 + Math.cos(t * 2.0) * 0.25;
    R.wave.rotation.x = 0.4 + Math.sin(t * 2.5) * 0.12;
  }
  // Droplet spray animation
  if (R.droplets) {
    for (let d of R.droplets) {
      d.mesh.position.y -= 0.04 * d.spd;
      d.mesh.position.z += Math.sin(t * d.spd) * 0.02;
      if (d.mesh.position.y < 0.5) d.mesh.position.y = 4.5;
    }
  }
  // Elevated railway girder bending under impact
  if (R.elGroup) {
    R.elGroup.rotation.y = Math.sin(t * 4.0) * 0.03;
  }
}
