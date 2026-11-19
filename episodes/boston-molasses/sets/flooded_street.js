export function build(scene, THREE) {
  const root = new THREE.Group();
  root.name = 'flooded_street';

  // Ground cobblestones
  const groundGeo = new THREE.PlaneGeometry(30, 30);
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x1f1a17, roughness: 0.9 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  root.add(ground);

  // Waist-deep viscous molasses fluid layer
  const fluidGeo = new THREE.PlaneGeometry(28, 28, 16, 16);
  const fluidMat = new THREE.MeshStandardMaterial({ color: 0x140602, roughness: 0.12, metalness: 0.45 });
  const fluid = new THREE.Mesh(fluidGeo, fluidMat);
  fluid.position.set(0, 0, 0.45);
  root.add(fluid);

  // Overturned wooden delivery wagon half submerged
  const wagon = new THREE.Group();
  const bedGeo = new THREE.BoxGeometry(2.4, 1.3, 0.25);
  const bedMat = new THREE.MeshStandardMaterial({ color: 0x5a3d28, roughness: 0.8 });
  const bed = new THREE.Mesh(bedGeo, bedMat);
  wagon.add(bed);

  const wheelGeo = new THREE.TorusGeometry(0.5, 0.06, 8, 16);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x221a14, roughness: 0.7 });
  const w1 = new THREE.Mesh(wheelGeo, wheelMat);
  w1.position.set(-1.0, 0.7, 0.3);
  wagon.add(w1);
  const w2 = new THREE.Mesh(wheelGeo, wheelMat);
  w2.position.set(1.0, 0.7, 0.3);
  wagon.add(w2);

  wagon.rotation.z = 0.35;
  wagon.rotation.x = -0.2;
  wagon.position.set(2.2, 2.5, 0.4);
  root.add(wagon);

  // Damaged lamppost leaning in the syrup
  const lampGeo = new THREE.CylinderGeometry(0.05, 0.07, 3.0, 8);
  const lampMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8 });
  const lamp = new THREE.Mesh(lampGeo, lampMat);
  lamp.rotation.x = Math.PI / 2 + 0.25;
  lamp.rotation.y = 0.15;
  lamp.position.set(-2.8, 1.8, 1.4);
  root.add(lamp);

  // Brick townhouses lining the street
  const rowGeo = new THREE.BoxGeometry(6, 0.8, 8);
  const rowMat = new THREE.MeshStandardMaterial({ color: 0x6e2c22, roughness: 0.9 });
  const row = new THREE.Mesh(rowGeo, rowMat);
  row.position.set(-5.5, 4.0, 4.0);
  root.add(row);

  // Ambient & directional lighting
  const sun = new THREE.DirectionalLight(0xffddaa, 1.3);
  sun.position.set(4, -6, 8);
  root.add(sun);
  const amb = new THREE.AmbientLight(0x706060, 0.7);
  root.add(amb);

  scene.add(root);

  return { root, fluid, wagon };
}

export function update(f, t, R) {
  if (!R) return;
  // Slow viscous undulations across the cooling syrup lake
  if (R.fluid) {
    R.fluid.position.z = 0.45 + Math.sin(t * 1.8) * 0.02;
  }
  // Wagon gently bobbing in the thick syrup
  if (R.wagon) {
    R.wagon.rotation.z = 0.35 + Math.sin(t * 1.2) * 0.015;
  }
}
