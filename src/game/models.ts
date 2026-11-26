import * as THREE from 'three';

export interface PlayerRig {
  root: THREE.Group;
  visualGroup: THREE.Group;
  bodyGroup: THREE.Group;
  headGroup: THREE.Group;
  leftArmPivot: THREE.Group;
  rightArmPivot: THREE.Group;
  leftLegPivot: THREE.Group;
  rightLegPivot: THREE.Group;
  thrusterLeft: THREE.Mesh;
  thrusterRight: THREE.Mesh;
  bodyMaterials: THREE.MeshStandardMaterial[];
}

/**
 * Builds a cute, animated 11-part composite 3D Obby Runner character
 * with bottom-center pivot at y = 0.
 */
export function createPlayerCharacter(): PlayerRig {
  const root = new THREE.Group();
  const visualGroup = new THREE.Group();
  root.add(visualGroup);

  const hoodieMat = new THREE.MeshStandardMaterial({
    color: 0x0ea5e9, // Bright Sky Blue hoodie
    roughness: 0.45,
    metalness: 0.05,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: 0xf97316, // Vibrant Coral Orange trim/cap
    roughness: 0.4,
    metalness: 0.08,
  });
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xffedd5,
    roughness: 0.55,
    metalness: 0.02,
  });
  const whiteMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.35,
    metalness: 0.05,
  });
  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.2,
    metalness: 0.15,
  });
  const packMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.3,
    metalness: 0.65,
  });
  const glowMat = new THREE.MeshStandardMaterial({
    color: 0x22d3ee,
    emissive: 0x06b6d4,
    emissiveIntensity: 1.2,
    roughness: 0.2,
    metalness: 0.3,
  });
  const blushMat = new THREE.MeshStandardMaterial({
    color: 0xfb7185,
    roughness: 0.6,
    metalness: 0.0,
  });

  const bodyGroup = new THREE.Group();
  bodyGroup.position.y = 0.56;
  visualGroup.add(bodyGroup);

  // 1. Torso (rounded capsule/cylinder feel)
  const torso = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.35, 0.62, 16),
    hoodieMat
  );
  torso.position.y = 0.31;
  torso.castShadow = true;
  torso.receiveShadow = true;
  bodyGroup.add(torso);

  // 2. Belly badge / front patch
  const chestPatch = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.24, 0.08),
    whiteMat
  );
  chestPatch.position.set(0, 0.34, 0.29);
  chestPatch.castShadow = true;
  bodyGroup.add(chestPatch);

  // 3. Jetpack / Sky Booster Pack on back
  const backpack = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.44, 0.22),
    packMat
  );
  backpack.position.set(0, 0.34, -0.32);
  backpack.castShadow = true;
  bodyGroup.add(backpack);

  const thrusterLeft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.09, 0.14, 12),
    glowMat
  );
  thrusterLeft.position.set(-0.12, 0.08, -0.34);
  bodyGroup.add(thrusterLeft);

  const thrusterRight = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.09, 0.14, 12),
    glowMat
  );
  thrusterRight.position.set(0.12, 0.08, -0.34);
  bodyGroup.add(thrusterRight);

  // 4. Head Group
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.72, 0);
  bodyGroup.add(headGroup);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.34, 20, 18),
    skinMat
  );
  head.position.y = 0.28;
  head.castShadow = true;
  head.receiveShadow = true;
  headGroup.add(head);

  // 5. Explorer Cap + Visor Brim
  const capCrown = new THREE.Mesh(
    new THREE.SphereGeometry(0.355, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.52),
    accentMat
  );
  capCrown.position.y = 0.31;
  capCrown.rotation.x = -0.15;
  capCrown.castShadow = true;
  headGroup.add(capCrown);

  const capBrim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.34, 0.36, 0.06, 16, 1, false, -0.9, 1.8),
    accentMat
  );
  capBrim.position.set(0, 0.34, 0.14);
  capBrim.rotation.x = 0.15;
  capBrim.castShadow = true;
  headGroup.add(capBrim);

  // 6. Eyes & Cheeks (front is +Z)
  const eyeGeo = new THREE.SphereGeometry(0.048, 12, 12);
  const leftEye = new THREE.Mesh(eyeGeo, darkMat);
  leftEye.position.set(-0.12, 0.27, 0.3);
  leftEye.scale.set(1, 1.25, 0.7);
  headGroup.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeo, darkMat);
  rightEye.position.set(0.12, 0.27, 0.3);
  rightEye.scale.set(1, 1.25, 0.7);
  headGroup.add(rightEye);

  const eyeShineGeo = new THREE.SphereGeometry(0.018, 8, 8);
  const leftShine = new THREE.Mesh(eyeShineGeo, whiteMat);
  leftShine.position.set(-0.105, 0.295, 0.335);
  headGroup.add(leftShine);

  const rightShine = new THREE.Mesh(eyeShineGeo, whiteMat);
  rightShine.position.set(0.135, 0.295, 0.335);
  headGroup.add(rightShine);

  const cheekGeo = new THREE.SphereGeometry(0.042, 10, 10);
  const leftCheek = new THREE.Mesh(cheekGeo, blushMat);
  leftCheek.position.set(-0.2, 0.2, 0.26);
  leftCheek.scale.set(1.2, 0.7, 0.6);
  headGroup.add(leftCheek);

  const rightCheek = new THREE.Mesh(cheekGeo, blushMat);
  rightCheek.position.set(0.2, 0.2, 0.26);
  rightCheek.scale.set(1.2, 0.7, 0.6);
  headGroup.add(rightCheek);

  // 7. Arms
  const createArm = (side: -1 | 1): THREE.Group => {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.42, 0.54, 0);
    const sleeve = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.095, 0.26, 6, 10),
      hoodieMat
    );
    sleeve.position.y = -0.15;
    sleeve.castShadow = true;
    pivot.add(sleeve);

    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.095, 10, 10), skinMat);
    hand.position.y = -0.34;
    hand.castShadow = true;
    pivot.add(hand);
    return pivot;
  };

  const leftArmPivot = createArm(-1);
  const rightArmPivot = createArm(1);
  bodyGroup.add(leftArmPivot);
  bodyGroup.add(rightArmPivot);

  // 8. Legs + Sneakers
  const createLeg = (side: -1 | 1): THREE.Group => {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.16, 0.56, 0);
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.09, 0.4, 12),
      darkMat
    );
    leg.position.y = -0.22;
    leg.castShadow = true;
    pivot.add(leg);

    const shoe = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.14, 0.32),
      whiteMat
    );
    shoe.position.set(0, -0.49, 0.05);
    shoe.castShadow = true;
    pivot.add(shoe);

    const shoeTrim = new THREE.Mesh(
      new THREE.BoxGeometry(0.23, 0.05, 0.33),
      accentMat
    );
    shoeTrim.position.set(0, -0.53, 0.05);
    pivot.add(shoeTrim);

    return pivot;
  };

  const leftLegPivot = createLeg(-1);
  const rightLegPivot = createLeg(1);
  visualGroup.add(leftLegPivot);
  visualGroup.add(rightLegPivot);

  return {
    root,
    visualGroup,
    bodyGroup,
    headGroup,
    leftArmPivot,
    rightArmPivot,
    leftLegPivot,
    rightLegPivot,
    thrusterLeft,
    thrusterRight,
    bodyMaterials: [hoodieMat, accentMat, whiteMat, skinMat],
  };
}

export interface CheckpointRig {
  group: THREE.Group;
  flagMesh: THREE.Mesh;
  ringMat: THREE.MeshStandardMaterial;
  flagMat: THREE.MeshStandardMaterial;
  orbMat: THREE.MeshStandardMaterial;
  activated: boolean;
}

export function createCheckpointBeacon(): CheckpointRig {
  const group = new THREE.Group();

  const ringMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 0.7,
    roughness: 0.25,
    metalness: 0.5,
  });

  const flagMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    emissive: 0x334155,
    emissiveIntensity: 0.35,
    roughness: 0.4,
    metalness: 0.1,
    side: THREE.DoubleSide,
  });

  const orbMat = new THREE.MeshStandardMaterial({
    color: 0x7dd3fc,
    emissive: 0x0ea5e9,
    emissiveIntensity: 0.8,
    roughness: 0.15,
    metalness: 0.4,
  });

  // Glowing ring on pad
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.15, 0.09, 10, 28),
    ringMat
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.06;
  group.add(ring);

  // Flagpole on side of pad
  const poleMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.25,
    metalness: 0.8,
  });
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.08, 2.5, 12),
    poleMat
  );
  pole.position.set(1.25, 1.25, 0);
  pole.castShadow = true;
  group.add(pole);

  // Pennant flag
  const flagShape = new THREE.Shape();
  flagShape.moveTo(0, 0);
  flagShape.lineTo(0.95, 0.25);
  flagShape.lineTo(0, 0.55);
  flagShape.closePath();
  const flagGeo = new THREE.ShapeGeometry(flagShape);
  const flagMesh = new THREE.Mesh(flagGeo, flagMat);
  flagMesh.position.set(1.28, 1.82, 0);
  flagMesh.castShadow = true;
  group.add(flagMesh);

  // Top orb
  const orb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 14), orbMat);
  orb.position.set(1.25, 2.55, 0);
  group.add(orb);

  return {
    group,
    flagMesh,
    ringMat,
    flagMat,
    orbMat,
    activated: false,
  };
}

export interface FinishRig {
  group: THREE.Group;
  starCrystal: THREE.Mesh;
  haloRing: THREE.Mesh;
}

export function createFinishGate(width: number): FinishRig {
  const group = new THREE.Group();
  const span = Math.max(3.6, width * 0.72);
  const half = span / 2;

  const pillarMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.25,
    metalness: 0.35,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    emissive: 0xca8a04,
    emissiveIntensity: 0.45,
    roughness: 0.2,
    metalness: 0.85,
  });
  const archMat = new THREE.MeshStandardMaterial({
    color: 0x10b981,
    emissive: 0x059669,
    emissiveIntensity: 0.45,
    roughness: 0.25,
    metalness: 0.4,
  });

  // Left & Right Pillars + Base Plinths
  for (const side of [-1, 1]) {
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.45, 0.35, 16),
      goldMat
    );
    base.position.set(side * half, 0.175, 0);
    base.castShadow = true;
    group.add(base);

    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.26, 3.2, 16),
      pillarMat
    );
    pillar.position.set(side * half, 1.85, 0);
    pillar.castShadow = true;
    group.add(pillar);

    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 14, 14),
      goldMat
    );
    cap.position.set(side * half, 3.5, 0);
    group.add(cap);
  }

  // Overhead Crossbar Arch
  const crossbar = new THREE.Mesh(
    new THREE.BoxGeometry(span + 0.4, 0.52, 0.45),
    archMat
  );
  crossbar.position.set(0, 3.55, 0);
  crossbar.castShadow = true;
  group.add(crossbar);

  // Floating Golden Star Crystal in center
  const starCrystal = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.62, 0),
    goldMat
  );
  starCrystal.position.set(0, 2.0, 0);
  starCrystal.castShadow = true;
  group.add(starCrystal);

  // Celebration Halo Ring on podium
  const haloRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.45, 0.08, 10, 32),
    goldMat
  );
  haloRing.rotation.x = Math.PI / 2;
  haloRing.position.y = 0.08;
  group.add(haloRing);

  return { group, starCrystal, haloRing };
}

export function createCoinMesh(sharedMat: THREE.MeshStandardMaterial): THREE.Group {
  const group = new THREE.Group();

  const outer = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.42, 0.1, 20),
    sharedMat
  );
  outer.rotation.x = Math.PI / 2;
  outer.castShadow = true;
  group.add(outer);

  const innerMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.35,
    roughness: 0.2,
    metalness: 0.9,
  });

  const inner = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.24, 0.14),
    innerMat
  );
  inner.rotation.z = Math.PI / 4;
  group.add(inner);

  return group;
}

export interface SkyScenery {
  group: THREE.Group;
  clouds: { mesh: THREE.Group; speed: number; baseX: number; range: number }[];
  islands: { mesh: THREE.Group; baseY: number; phase: number }[];
  skyMat: THREE.ShaderMaterial;
}

export function createSkyScenery(): SkyScenery {
  const group = new THREE.Group();

  // Procedural sky dome with vibrant atmospheric gradient
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      topColor: { value: new THREE.Color('#0284c7') },
      bottomColor: { value: new THREE.Color('#bae6fd') },
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition).y;
        float t = clamp(h * 0.75 + 0.28, 0.0, 1.0);
        gl_FragColor = vec4(mix(bottomColor, topColor, pow(t, 0.75)), 1.0);
      }
    `,
  });

  const skyDome = new THREE.Mesh(
    new THREE.SphereGeometry(320, 24, 16),
    skyMat
  );
  group.add(skyDome);

  // Fluffy 3D Clouds
  const cloudMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.9,
    metalness: 0.0,
    emissive: 0xe0f2fe,
    emissiveIntensity: 0.18,
  });

  const clouds: { mesh: THREE.Group; speed: number; baseX: number; range: number }[] =
    [];
  const puffGeo = new THREE.SphereGeometry(1, 12, 10);

  for (let i = 0; i < 24; i++) {
    const cloud = new THREE.Group();
    const puffCount = 4 + (i % 3);
    for (let p = 0; p < puffCount; p++) {
      const puff = new THREE.Mesh(puffGeo, cloudMat);
      const scale = 1.8 + ((p * 7 + i) % 5) * 0.45;
      puff.scale.set(scale * 1.3, scale * 0.85, scale);
      puff.position.set(
        (p - puffCount / 2) * 2.1,
        Math.sin(p * 1.4) * 0.55,
        ((p % 2) - 0.5) * 1.1
      );
      cloud.add(puff);
    }

    const side = i % 2 === 0 ? -1 : 1;
    const baseX = side * (22 + (i % 5) * 14);
    const y = -8 + (i % 6) * 7.5;
    const z = -i * 12 + 25;
    cloud.position.set(baseX, y, z);
    const overallScale = 1.1 + (i % 4) * 0.4;
    cloud.scale.setScalar(overallScale);
    group.add(cloud);

    clouds.push({
      mesh: cloud,
      speed: 0.35 + (i % 5) * 0.12,
      baseX,
      range: 10 + (i % 3) * 4,
    });
  }

  // Distant Floating Sky Islands with trees & rock cones
  const rockMat = new THREE.MeshStandardMaterial({
    color: 0x92400e,
    roughness: 0.88,
    metalness: 0.05,
    flatShading: true,
  });
  const grassMat = new THREE.MeshStandardMaterial({
    color: 0x22c55e,
    roughness: 0.7,
    metalness: 0.02,
  });
  const trunkMat = new THREE.MeshStandardMaterial({
    color: 0x78350f,
    roughness: 0.9,
  });
  const leafMat = new THREE.MeshStandardMaterial({
    color: 0x16a34a,
    roughness: 0.65,
  });

  const islands: { mesh: THREE.Group; baseY: number; phase: number }[] = [];
  const islandPositions: [number, number, number, number][] = [
    [-28, -4, -18, 1.2],
    [32, 2, -36, 1.5],
    [-36, 6, -68, 1.4],
    [29, -6, -95, 1.3],
    [-30, 3, -128, 1.6],
    [35, 8, -162, 1.45],
    [-34, -2, -195, 1.55],
    [30, 5, -225, 1.35],
  ];

  islandPositions.forEach(([x, y, z, s], idx) => {
    const island = new THREE.Group();

    const underside = new THREE.Mesh(
      new THREE.ConeGeometry(4.2, 6.4, 7),
      rockMat
    );
    underside.rotation.x = Math.PI;
    underside.position.y = -3.2;
    island.add(underside);

    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(4.4, 4.1, 1.1, 8),
      grassMat
    );
    cap.position.y = 0.4;
    island.add(cap);

    // Composite stylized tree on each island
    const treeCount = 1 + (idx % 2);
    for (let t = 0; t < treeCount; t++) {
      const tx = t === 0 ? -1.1 : 1.3;
      const tz = t === 0 ? 0.5 : -0.8;
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.3, 1.8, 7),
        trunkMat
      );
      trunk.position.set(tx, 1.8, tz);
      island.add(trunk);

      const crown1 = new THREE.Mesh(
        new THREE.ConeGeometry(1.3, 1.9, 7),
        leafMat
      );
      crown1.position.set(tx, 3.1, tz);
      island.add(crown1);

      const crown2 = new THREE.Mesh(
        new THREE.ConeGeometry(0.95, 1.5, 7),
        leafMat
      );
      crown2.position.set(tx, 4.0, tz);
      island.add(crown2);
    }

    island.position.set(x, y, z);
    island.scale.setScalar(s);
    group.add(island);
    islands.push({ mesh: island, baseY: y, phase: idx * 0.9 });
  });

  return { group, clouds, islands, skyMat };
}
