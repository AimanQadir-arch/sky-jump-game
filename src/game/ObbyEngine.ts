import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { soundEngine } from './audio';
import { getLevelById } from './levels';
import {
  CheckpointRig,
  createCheckpointBeacon,
  createCoinMesh,
  createFinishGate,
  createPlayerCharacter,
  createSkyScenery,
  FinishRig,
  PlayerRig,
  SkyScenery,
} from './models';
import { createProceduralTextures, ProceduralTextures } from './textures';
import { HudSnapshot, LevelCompleteStats, LevelDef, PlatformDef } from '../types/game';

// Reusable scratch math objects (zero GC in render loop)
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _camTarget = new THREE.Vector3();
const _camLook = new THREE.Vector3();

interface RuntimePlatform {
  def: PlatformDef;
  group: THREE.Group;
  topMesh: THREE.Mesh;
  baseMat: THREE.MeshStandardMaterial;
  topMat: THREE.MeshStandardMaterial;
  currentPos: THREE.Vector3;
  prevPos: THREE.Vector3;
  deltaPos: THREE.Vector3;
  halfSize: THREE.Vector3;
  // Disappearing state
  disappearState: 'solid' | 'shaking' | 'gone';
  disappearTimer: number;
  // Bounce animation
  bounceAnim: number;
  // Checkpoint rig
  checkpointRig?: CheckpointRig;
  // Finish rig
  finishRig?: FinishRig;
}

interface RuntimeObstacle {
  group: THREE.Group;
  position: THREE.Vector3;
  length: number;
  thickness: number;
  speed: number;
  blades: number;
  angle: number;
}

interface RuntimeCoin {
  group: THREE.Group;
  basePos: THREE.Vector3;
  collected: boolean;
  phase: number;
}

interface Particle {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  life: number;
  maxLife: number;
  active: boolean;
  gravity: number;
}

export interface ObbyEngineCallbacks {
  onHudUpdate: (hud: HudSnapshot) => void;
  onLevelComplete: (stats: LevelCompleteStats) => void;
}

export class ObbyEngine {
  private container: HTMLElement;
  private callbacks: ObbyEngineCallbacks;

  private isSoftwareGl: boolean;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private textures: ProceduralTextures;
  private scenery: SkyScenery;

  private sunLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;
  private rimLight: THREE.DirectionalLight;

  private playerRig: PlayerRig;
  private shadowPlane: THREE.Mesh;

  private levelGroup: THREE.Group;
  private particleGroup: THREE.Group;
  private particles: Particle[] = [];

  private currentLevel: LevelDef = getLevelById(1);
  private platforms: RuntimePlatform[] = [];
  private obstacles: RuntimeObstacle[] = [];
  private coins: RuntimeCoin[] = [];
  private sharedCoinMat: THREE.MeshStandardMaterial;

  // Player physics state
  private playerPos = new THREE.Vector3(0, 0, 0);
  private playerVel = new THREE.Vector3(0, 0, 0);
  private playerYaw = Math.PI; // Facing -Z initially
  private playerScale = new THREE.Vector3(1, 1, 1);
  private grounded = false;
  private standingPlatform: RuntimePlatform | null = null;
  private coyoteTimer = 0;
  private jumpBufferTimer = 0;
  private hitFlashTimer = 0;
  private hitstopTimer = 0;
  private shakeIntensity = 0;
  private knockbackTimer = 0;
  private runCycle = 0;

  // Game mode & progression state
  private mode: 'showcase' | 'playing' | 'paused' | 'celebrating' = 'showcase';
  private respawnPos = new THREE.Vector3(0, 0.2, 0);
  private checkpointReached = 0;
  private totalCheckpoints = 0;
  private score = 0;
  private coinsCollected = 0;
  private elapsedTime = 0;
  private falls = 0;
  private bestScores: Record<number, number> = {};
  private startZ = 0;
  private finishZ = -50;
  private maxProgress = 0;

  // Input state
  private keys = new Set<string>();
  private touchMove = { x: 0, z: 0 };
  private cameraYawOffset = 0;
  private isPointerDragging = false;
  private lastPointerX = 0;

  // Loop & timing
  private clock = new THREE.Clock();
  private totalTime = 0;
  private hudEmitAccum = 0;
  private frameId = 0;
  private disposed = false;

  constructor(container: HTMLElement, callbacks: ObbyEngineCallbacks) {
    this.container = container;
    this.callbacks = callbacks;

    // 1. Software WebGL detection per Three.js skill standard
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Renderer setup
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2)
    );
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(
      container.clientWidth || window.innerWidth,
      container.clientHeight || window.innerHeight
    );
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    container.appendChild(this.renderer.domElement);

    // 3. Scene & Studio RoomEnvironment
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0xbae6fd, 0.0065);

    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(
      new RoomEnvironment(),
      0.04
    ).texture;
    pmremGenerator.dispose();

    // 4. Camera
    const aspect =
      (container.clientWidth || window.innerWidth) /
      (container.clientHeight || window.innerHeight);
    this.camera = new THREE.PerspectiveCamera(58, aspect, 0.1, 450);
    this.camera.position.set(0, 6, 10);

    // 5. Three-Point Warm/Cool Lighting Rig
    this.hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x0284c7, 0.85);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xfff7ed, 1.85);
    this.sunLight.position.set(16, 28, 14);
    this.sunLight.castShadow = !this.isSoftwareGl;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    const d = 24;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.camera.near = 1;
    this.sunLight.shadow.camera.far = 90;
    this.sunLight.shadow.bias = -0.0005;
    this.sunLight.shadow.normalBias = 0.02;
    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);

    this.rimLight = new THREE.DirectionalLight(0x7dd3fc, 0.65);
    this.rimLight.position.set(-14, 12, -20);
    this.scene.add(this.rimLight);

    // 6. Procedural Textures & Scenery
    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    this.textures = createProceduralTextures(maxAniso);
    this.scenery = createSkyScenery();
    this.scene.add(this.scenery.group);

    this.sharedCoinMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xd97706,
      emissiveIntensity: 0.28,
      roughness: 0.18,
      metalness: 0.88,
    });

    // 7. Player & Contact Shadow
    this.playerRig = createPlayerCharacter();
    this.scene.add(this.playerRig.root);

    this.shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(1.35, 1.35),
      new THREE.MeshBasicMaterial({
        map: this.textures.contactShadow,
        transparent: true,
        depthWrite: false,
        opacity: 0.55,
      })
    );
    this.shadowPlane.rotation.x = -Math.PI / 2;
    this.scene.add(this.shadowPlane);

    // 8. Level & Particle Containers
    this.levelGroup = new THREE.Group();
    this.scene.add(this.levelGroup);

    this.particleGroup = new THREE.Group();
    this.scene.add(this.particleGroup);
    this.initParticlePool();

    // 9. Load Level 1 in showcase mode
    this.loadLevel(1, 'showcase', {});

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    // 10. Event listeners
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
    this.renderer.domElement.addEventListener(
      'pointerdown',
      this.handleCanvasPointerDown
    );
    window.addEventListener('pointermove', this.handleCanvasPointerMove);
    window.addEventListener('pointerup', this.handleCanvasPointerUp);

    // Start loop
    this.clock.start();
    this.tick();
  }

  private initParticlePool(): void {
    const geo = new THREE.OctahedronGeometry(0.14, 0);
    for (let i = 0; i < 90; i++) {
      const mat = new THREE.MeshStandardMaterial({
        color: 0xfacc15,
        emissive: 0xfacc15,
        emissiveIntensity: 0.5,
        roughness: 0.3,
        metalness: 0.2,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.visible = false;
      this.particleGroup.add(mesh);
      this.particles.push({
        mesh,
        vel: new THREE.Vector3(),
        life: 0,
        maxLife: 0.6,
        active: false,
        gravity: 14,
      });
    }
  }

  private spawnParticles(
    origin: THREE.Vector3,
    colorHex: number,
    count: number,
    speed = 5.5,
    gravity = 14
  ): void {
    let spawned = 0;
    for (const p of this.particles) {
      if (!p.active) {
        p.active = true;
        p.life = 0;
        p.maxLife = 0.45 + Math.random() * 0.45;
        p.gravity = gravity;
        p.mesh.visible = true;
        p.mesh.position.copy(origin);
        p.mesh.scale.setScalar(0.8 + Math.random() * 0.8);
        const mat = p.mesh.material as THREE.MeshStandardMaterial;
        mat.color.setHex(colorHex);
        mat.emissive.setHex(colorHex);
        const angle = Math.random() * Math.PI * 2;
        const spd = (0.35 + Math.random() * 0.65) * speed;
        p.vel.set(
          Math.cos(angle) * spd,
          2.5 + Math.random() * speed * 0.9,
          Math.sin(angle) * spd
        );
        spawned++;
        if (spawned >= count) break;
      }
    }
  }

  public loadLevel(
    levelId: number,
    mode: 'showcase' | 'playing',
    bestScores: Record<number, number>
  ): void {
    this.bestScores = bestScores;
    this.clearLevelObjects();

    const level = getLevelById(levelId);
    this.currentLevel = level;
    this.mode = mode;

    // Update sky & fog colors to match level theme
    this.scenery.skyMat.uniforms.topColor.value.set(level.theme.skyTop);
    this.scenery.skyMat.uniforms.bottomColor.value.set(level.theme.skyBottom);
    this.scene.fog = new THREE.FogExp2(level.theme.fogColor, 0.0055);

    this.totalCheckpoints = level.platforms.filter(
      (p) => p.type === 'checkpoint'
    ).length;
    this.checkpointReached = 0;
    this.score = 0;
    this.coinsCollected = 0;
    this.elapsedTime = 0;
    this.falls = 0;
    this.maxProgress = 0;
    this.cameraYawOffset = 0;

    // Build platforms
    for (const pDef of level.platforms) {
      const rp = this.buildPlatform(pDef, level);
      this.platforms.push(rp);
      this.levelGroup.add(rp.group);
      if (pDef.type === 'finish') {
        this.finishZ = pDef.position[2];
      }
    }

    // Build rotating obstacles
    for (const oDef of level.obstacles) {
      const ro = this.buildObstacle(oDef, level);
      this.obstacles.push(ro);
      this.levelGroup.add(ro.group);
    }

    // Build coins
    for (let i = 0; i < level.coins.length; i++) {
      const cDef = level.coins[i];
      const mesh = createCoinMesh(this.sharedCoinMat);
      mesh.position.set(cDef.position[0], cDef.position[1], cDef.position[2]);
      this.levelGroup.add(mesh);
      this.coins.push({
        group: mesh,
        basePos: new THREE.Vector3(...cDef.position),
        collected: false,
        phase: i * 0.65,
      });
    }

    // Reset player at spawn
    this.startZ = level.spawn[2];
    this.respawnPos.set(level.spawn[0], level.spawn[1] + 0.15, level.spawn[2]);
    this.respawnPlayer(false);

    // Snap camera immediately on load
    if (mode === 'playing') {
      this.camera.position.set(
        this.playerPos.x,
        this.playerPos.y + 5.2,
        this.playerPos.z + 9.2
      );
      this.camera.lookAt(
        this.playerPos.x,
        this.playerPos.y + 1.2,
        this.playerPos.z - 2.0
      );
    }

    this.emitHud();
  }

  private clearLevelObjects(): void {
    for (const p of this.platforms) {
      p.group.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const m = child as THREE.Mesh;
          m.geometry.dispose();
          if (Array.isArray(m.material)) {
            m.material.forEach((mat) => mat.dispose());
          } else {
            m.material.dispose();
          }
        }
      });
      this.levelGroup.remove(p.group);
    }
    this.platforms = [];

    for (const o of this.obstacles) {
      o.group.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const m = child as THREE.Mesh;
          m.geometry.dispose();
          if (!Array.isArray(m.material)) m.material.dispose();
        }
      });
      this.levelGroup.remove(o.group);
    }
    this.obstacles = [];

    for (const c of this.coins) {
      c.group.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const m = child as THREE.Mesh;
          m.geometry.dispose();
          if (m.material !== this.sharedCoinMat && !Array.isArray(m.material)) {
            m.material.dispose();
          }
        }
      });
      this.levelGroup.remove(c.group);
    }
    this.coins = [];
  }

  private buildPlatform(def: PlatformDef, level: LevelDef): RuntimePlatform {
    const group = new THREE.Group();
    const [sx, sy, sz] = def.size;
    group.position.set(def.position[0], def.position[1], def.position[2]);

    // Color & texture per platform type
    let colorHex = def.color ?? level.theme.normalColor;
    let topTex = this.textures.platformTop;

    if (def.type === 'moving') {
      colorHex = def.color ?? level.theme.movingColor;
      topTex = this.textures.movingTop;
    } else if (def.type === 'disappearing') {
      colorHex = def.color ?? level.theme.disappearingColor;
      topTex = this.textures.disappearingTop;
    } else if (def.type === 'bounce') {
      colorHex = '#ec4899';
      topTex = this.textures.bounceTop;
    } else if (def.type === 'narrow') {
      colorHex = def.color ?? level.theme.narrowColor;
      topTex = this.textures.narrowTop;
    } else if (def.type === 'checkpoint') {
      colorHex = '#0ea5e9';
      topTex = this.textures.platformTop;
    } else if (def.type === 'finish') {
      colorHex = '#ffffff';
      topTex = this.textures.finishTop;
    }

    const baseColor = new THREE.Color(colorHex).multiplyScalar(0.72);
    const baseMat = new THREE.MeshStandardMaterial({
      color: baseColor,
      roughness: 0.6,
      metalness: 0.12,
    });
    const topMat = new THREE.MeshStandardMaterial({
      color: def.type === 'finish' || def.type === 'bounce' ? 0xffffff : colorHex,
      map: topTex,
      roughness: 0.32,
      metalness: 0.08,
    });

    // Main underside body
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(sx * 0.94, sy * 0.78, sz * 0.94),
      baseMat
    );
    body.position.y = -sy * 0.11;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Top walking cap (slightly wider architectural lip)
    const topMesh = new THREE.Mesh(
      new THREE.BoxGeometry(sx, sy * 0.26, sz),
      topMat
    );
    topMesh.position.y = sy * 0.37;
    topMesh.castShadow = true;
    topMesh.receiveShadow = true;
    group.add(topMesh);

    let checkpointRig: CheckpointRig | undefined;
    let finishRig: FinishRig | undefined;

    if (def.type === 'checkpoint') {
      checkpointRig = createCheckpointBeacon();
      checkpointRig.group.position.y = sy * 0.5;
      group.add(checkpointRig.group);
    } else if (def.type === 'finish') {
      finishRig = createFinishGate(sx);
      finishRig.group.position.y = sy * 0.5;
      group.add(finishRig.group);
    }

    return {
      def,
      group,
      topMesh,
      baseMat,
      topMat,
      currentPos: new THREE.Vector3(...def.position),
      prevPos: new THREE.Vector3(...def.position),
      deltaPos: new THREE.Vector3(),
      halfSize: new THREE.Vector3(sx / 2, sy / 2, sz / 2),
      disappearState: 'solid',
      disappearTimer: 0,
      bounceAnim: 0,
      checkpointRig,
      finishRig,
    };
  }

  private buildObstacle(
    def: LevelDef['obstacles'][number],
    level: LevelDef
  ): RuntimeObstacle {
    const group = new THREE.Group();
    group.position.set(def.position[0], def.position[1], def.position[2]);

    const hubMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.25,
      metalness: 0.75,
    });
    const barMat = new THREE.MeshStandardMaterial({
      color: def.color ?? level.theme.obstacleColor,
      emissive: 0x991b1b,
      emissiveIntensity: 0.35,
      roughness: 0.28,
      metalness: 0.3,
    });
    const tipMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.5,
      roughness: 0.2,
      metalness: 0.5,
    });

    const hub = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.52, 0.95, 16),
      hubMat
    );
    hub.castShadow = true;
    group.add(hub);

    const hubCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.4, 14, 12),
      tipMat
    );
    hubCap.position.y = 0.45;
    group.add(hubCap);

    const blades = def.blades ?? 1;
    for (let b = 0; b < blades; b++) {
      const barGroup = new THREE.Group();
      barGroup.rotation.y = (b * Math.PI) / blades;

      const bar = new THREE.Mesh(
        new THREE.CylinderGeometry(
          def.thickness * 0.5,
          def.thickness * 0.5,
          def.length,
          12
        ),
        barMat
      );
      bar.rotation.z = Math.PI / 2;
      bar.castShadow = true;
      barGroup.add(bar);

      for (const side of [-1, 1]) {
        const cap = new THREE.Mesh(
          new THREE.SphereGeometry(def.thickness * 0.62, 10, 10),
          tipMat
        );
        cap.position.x = side * (def.length * 0.5);
        barGroup.add(cap);
      }

      group.add(barGroup);
    }

    return {
      group,
      position: new THREE.Vector3(...def.position),
      length: def.length,
      thickness: def.thickness,
      speed: def.speed,
      blades,
      angle: def.phase ?? 0,
    };
  }

  public setMode(mode: 'showcase' | 'playing' | 'paused' | 'celebrating'): void {
    this.mode = mode;
    if (mode === 'playing') {
      this.keys.clear();
    }
  }

  public setTouchInput(x: number, z: number): void {
    this.touchMove.x = THREE.MathUtils.clamp(x, -1, 1);
    this.touchMove.z = THREE.MathUtils.clamp(z, -1, 1);
  }

  public triggerJump(): void {
    if (this.mode !== 'playing') return;
    this.jumpBufferTimer = 0.14;
  }

  private respawnPlayer(playSound = true): void {
    this.playerPos.copy(this.respawnPos);
    this.playerVel.set(0, 0, 0);
    this.playerYaw = Math.PI;
    this.playerScale.set(1, 1, 1);
    this.grounded = false;
    this.standingPlatform = null;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.knockbackTimer = 0;

    // Reset disappearing platforms so player never respawns into a missing tile
    for (const p of this.platforms) {
      if (p.def.type === 'disappearing') {
        p.disappearState = 'solid';
        p.disappearTimer = 0;
        p.group.visible = true;
        p.group.scale.set(1, 1, 1);
        p.topMat.emissive.setHex(0x000000);
      }
    }

    if (playSound) {
      soundEngine.playFall();
      this.spawnParticles(this.playerPos, 0x38bdf8, 12, 4.5, 8);
    }

    this.playerRig.root.position.copy(this.playerPos);
    this.playerRig.root.rotation.y = this.playerYaw;
  }

  private handleResize = (): void => {
    if (this.disposed) return;
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (this.mode !== 'playing') return;
    if (e.code === 'Space') {
      e.preventDefault();
      if (!e.repeat) {
        this.jumpBufferTimer = 0.14;
      }
    }
    this.keys.add(e.code);
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    this.keys.delete(e.code);
  };

  private handleBlur = (): void => {
    this.keys.clear();
    this.touchMove.x = 0;
    this.touchMove.z = 0;
  };

  private handleCanvasPointerDown = (e: PointerEvent): void => {
    if (this.mode !== 'playing') return;
    this.isPointerDragging = true;
    this.lastPointerX = e.clientX;
  };

  private handleCanvasPointerMove = (e: PointerEvent): void => {
    if (!this.isPointerDragging || this.mode !== 'playing') return;
    const dx = e.clientX - this.lastPointerX;
    this.lastPointerX = e.clientX;
    this.cameraYawOffset = THREE.MathUtils.clamp(
      this.cameraYawOffset - dx * 0.005,
      -0.85,
      0.85
    );
  };

  private handleCanvasPointerUp = (): void => {
    this.isPointerDragging = false;
  };

  private tick = (): void => {
    if (this.disposed) return;

    const rawDt = this.clock.getDelta();
    const dt = Math.min(rawDt, 0.05);
    this.totalTime += dt;

    this.updateScenery(dt);

    if (this.mode === 'playing') {
      if (this.hitstopTimer > 0) {
        this.hitstopTimer -= dt;
      } else {
        this.elapsedTime += dt;
        this.updatePlatforms(dt);
        this.updateObstacles(dt);
        this.updatePlayerPhysics(dt);
        this.updateCoins(dt);
      }
      this.updateParticles(dt);
      this.updateCamera(dt);
      this.updateShadowPlane();

      this.hudEmitAccum += dt;
      if (this.hudEmitAccum >= 0.08) {
        this.hudEmitAccum = 0;
        this.emitHud();
      }
    } else if (this.mode === 'celebrating') {
      this.updateCoins(dt);
      this.updateParticles(dt);
      this.updateCelebration(dt);
      this.updateShadowPlane();
    } else if (this.mode === 'showcase') {
      this.updatePlatforms(dt);
      this.updateObstacles(dt);
      this.updateCoins(dt);
      this.updateShowcaseCamera(dt);
      this.updateShadowPlane();
    }

    this.renderer.render(this.scene, this.camera);

    if (this.isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  };

  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) {
        if (sync) gl.deleteSync(sync);
        return;
      }
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private updateScenery(dt: number): void {
    for (const c of this.scenery.clouds) {
      c.mesh.position.x =
        c.baseX + Math.sin(this.totalTime * 0.14 * c.speed + c.baseX) * c.range;
    }
    for (const isl of this.scenery.islands) {
      isl.mesh.position.y =
        isl.baseY + Math.sin(this.totalTime * 0.55 + isl.phase) * 0.65;
    }
    for (const p of this.platforms) {
      if (p.finishRig) {
        p.finishRig.starCrystal.rotation.y += dt * 1.8;
        p.finishRig.starCrystal.position.y =
          2.0 + Math.sin(this.totalTime * 2.5) * 0.22;
        const pulse = 1 + Math.sin(this.totalTime * 3.5) * 0.06;
        p.finishRig.haloRing.scale.setScalar(pulse);
      }
      if (p.checkpointRig && p.checkpointRig.activated) {
        p.checkpointRig.flagMesh.rotation.y =
          Math.sin(this.totalTime * 4.5) * 0.22;
      }
    }
  }

  private updatePlatforms(dt: number): void {
    for (const p of this.platforms) {
      p.prevPos.copy(p.currentPos);

      if (p.def.type === 'moving' && p.def.moveOffset) {
        const spd = p.def.moveSpeed ?? 1.5;
        const phase = p.def.movePhase ?? 0;
        const factor = Math.sin(this.totalTime * spd + phase);
        p.currentPos.set(
          p.def.position[0] + p.def.moveOffset[0] * factor,
          p.def.position[1] + p.def.moveOffset[1] * factor,
          p.def.position[2] + p.def.moveOffset[2] * factor
        );
        p.group.position.copy(p.currentPos);
      }

      p.deltaPos.subVectors(p.currentPos, p.prevPos);

      if (p.def.type === 'disappearing') {
        if (p.disappearState === 'shaking') {
          p.disappearTimer += dt;
          const jitter = Math.sin(this.totalTime * 55) * 0.08;
          p.group.position.set(
            p.currentPos.x + jitter,
            p.currentPos.y,
            p.currentPos.z
          );
          const blink = Math.sin(this.totalTime * 24) > 0;
          p.topMat.emissive.setHex(blink ? 0xef4444 : 0xf59e0b);
          p.topMat.emissiveIntensity = 0.55;
          if (p.disappearTimer >= 0.85) {
            p.disappearState = 'gone';
            p.disappearTimer = 0;
            p.group.visible = false;
            p.group.position.copy(p.currentPos);
            p.topMat.emissive.setHex(0x000000);
            this.spawnParticles(p.currentPos, 0xfbbf24, 10, 3.8, 10);
          }
        } else if (p.disappearState === 'gone') {
          p.disappearTimer += dt;
          if (p.disappearTimer >= 2.2) {
            p.disappearState = 'solid';
            p.disappearTimer = 0;
            p.group.visible = true;
            p.group.scale.setScalar(0.2);
          }
        } else {
          p.group.scale.x = THREE.MathUtils.damp(p.group.scale.x, 1, 14, dt);
          p.group.scale.y = THREE.MathUtils.damp(p.group.scale.y, 1, 14, dt);
          p.group.scale.z = THREE.MathUtils.damp(p.group.scale.z, 1, 14, dt);
        }
      }

      if (p.bounceAnim > 0) {
        p.bounceAnim = Math.max(0, p.bounceAnim - dt * 4);
        const sy = 1 - Math.sin(p.bounceAnim * Math.PI) * 0.35;
        p.group.scale.set(1 + (1 - sy) * 0.25, sy, 1 + (1 - sy) * 0.25);
      } else if (p.def.type === 'bounce') {
        p.group.scale.set(1, 1, 1);
      }
    }
  }

  private updateObstacles(dt: number): void {
    for (const o of this.obstacles) {
      o.angle += o.speed * dt;
      o.group.rotation.y = o.angle;
    }
  }

  private updateCoins(dt: number): void {
    for (const c of this.coins) {
      if (c.collected) continue;
      c.group.rotation.y += dt * 2.8;
      c.group.position.y =
        c.basePos.y + Math.sin(this.totalTime * 3.0 + c.phase) * 0.18;

      if (this.mode === 'playing') {
        _v1.set(this.playerPos.x, this.playerPos.y + 0.85, this.playerPos.z);
        const dist = _v1.distanceTo(c.group.position);
        if (dist < 1.25) {
          c.collected = true;
          c.group.visible = false;
          this.coinsCollected += 1;
          this.score += 100;
          soundEngine.playCoin();
          this.spawnParticles(c.group.position, 0xfacc15, 14, 5.2, 10);
          this.emitHud();
        }
      }
    }
  }

  private updatePlayerPhysics(dt: number): void {
    // 1. Carry player with standing moving platform
    if (this.grounded && this.standingPlatform) {
      this.playerPos.add(this.standingPlatform.deltaPos);
    }

    // 2. Read movement input (keyboard + mobile touch)
    let moveX = this.touchMove.x;
    let moveZ = this.touchMove.z;

    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) moveX -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) moveX += 1;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) moveZ -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) moveZ += 1;

    // Gentle auto-return of dragged camera yaw when not dragging
    if (!this.isPointerDragging) {
      this.cameraYawOffset = THREE.MathUtils.damp(
        this.cameraYawOffset,
        0,
        2.5,
        dt
      );
    }

    const inputLen = Math.hypot(moveX, moveZ);
    if (inputLen > 1) {
      moveX /= inputLen;
      moveZ /= inputLen;
    }

    // Rotate input by subtle camera yaw offset
    const cosY = Math.cos(this.cameraYawOffset);
    const sinY = Math.sin(this.cameraYawOffset);
    const worldDirX = moveX * cosY + moveZ * sinY;
    const worldDirZ = -moveX * sinY + moveZ * cosY;

    const maxSpeed = 9.2;
    if (this.knockbackTimer > 0) {
      this.knockbackTimer -= dt;
    } else {
      const accel = this.grounded ? 18 : 10;
      this.playerVel.x = THREE.MathUtils.damp(
        this.playerVel.x,
        worldDirX * maxSpeed,
        accel,
        dt
      );
      this.playerVel.z = THREE.MathUtils.damp(
        this.playerVel.z,
        worldDirZ * maxSpeed,
        accel,
        dt
      );
    }

    // Smoothly turn character toward movement direction
    if (inputLen > 0.08 && this.knockbackTimer <= 0) {
      const targetYaw = Math.atan2(worldDirX, worldDirZ);
      let diff = targetYaw - this.playerYaw;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.playerYaw += diff * Math.min(1, dt * 14);
    }

    // 3. Coyote time & Jump buffering
    if (this.grounded) {
      this.coyoteTimer = 0.12;
    } else {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);
    }

    if (this.jumpBufferTimer > 0) {
      this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - dt);
    }

    if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
      this.playerVel.y = 13.8;
      this.grounded = false;
      this.standingPlatform = null;
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;
      this.playerScale.set(0.8, 1.26, 0.8);
      soundEngine.playJump();
      this.spawnParticles(this.playerPos, 0xffffff, 7, 3.2, 6);
    }

    // 4. Gravity & position integration
    this.playerVel.y -= 32.0 * dt;
    if (this.playerVel.y < -28) this.playerVel.y = -28;

    const prevY = this.playerPos.y;
    this.playerPos.x += this.playerVel.x * dt;
    this.playerPos.z += this.playerVel.z * dt;
    this.playerPos.y += this.playerVel.y * dt;

    // 5. Platform collision resolution
    const playerRadius = 0.36;
    const playerHeight = 1.65;
    let landedPlatform: RuntimePlatform | null = null;
    const wasGrounded = this.grounded;
    this.grounded = false;

    for (const p of this.platforms) {
      if (p.def.type === 'disappearing' && p.disappearState === 'gone') {
        continue;
      }

      const minX = p.currentPos.x - p.halfSize.x - playerRadius;
      const maxX = p.currentPos.x + p.halfSize.x + playerRadius;
      const minZ = p.currentPos.z - p.halfSize.z - playerRadius;
      const maxZ = p.currentPos.z + p.halfSize.z + playerRadius;
      const topY = p.currentPos.y + p.halfSize.y;
      const bottomY = p.currentPos.y - p.halfSize.y;

      const insideXZ =
        this.playerPos.x >= minX &&
        this.playerPos.x <= maxX &&
        this.playerPos.z >= minZ &&
        this.playerPos.z <= maxZ;

      if (!insideXZ) continue;

      // Landing on top surface
      if (
        this.playerVel.y <= 0 &&
        prevY >= topY - 0.32 &&
        this.playerPos.y <= topY + 0.08
      ) {
        this.playerPos.y = topY;
        this.playerVel.y = 0;
        this.grounded = true;
        landedPlatform = p;
      } else if (
        // Head bump on underside
        this.playerVel.y > 0 &&
        prevY + playerHeight <= bottomY + 0.25 &&
        this.playerPos.y + playerHeight >= bottomY
      ) {
        this.playerPos.y = bottomY - playerHeight;
        this.playerVel.y = -2;
      } else if (
        // Side push-out when overlapping vertical span of platform
        this.playerPos.y < topY - 0.12 &&
        this.playerPos.y + playerHeight > bottomY + 0.1
      ) {
        const penLeft = this.playerPos.x - minX;
        const penRight = maxX - this.playerPos.x;
        const penBack = this.playerPos.z - minZ;
        const penFront = maxZ - this.playerPos.z;
        const minPen = Math.min(penLeft, penRight, penBack, penFront);
        if (minPen === penLeft) {
          this.playerPos.x = minX;
          if (this.playerVel.x > 0) this.playerVel.x = 0;
        } else if (minPen === penRight) {
          this.playerPos.x = maxX;
          if (this.playerVel.x < 0) this.playerVel.x = 0;
        } else if (minPen === penBack) {
          this.playerPos.z = minZ;
          if (this.playerVel.z > 0) this.playerVel.z = 0;
        } else {
          this.playerPos.z = maxZ;
          if (this.playerVel.z < 0) this.playerVel.z = 0;
        }
      }
    }

    this.standingPlatform = landedPlatform;

    if (landedPlatform) {
      if (!wasGrounded) {
        this.playerScale.set(1.22, 0.78, 1.22);
        soundEngine.playLand();
      }
      this.handlePlatformTrigger(landedPlatform);
    }

    // 6. Rotating obstacle collision
    this.checkObstacleCollisions();

    // 7. Fall out-of-bounds respawn
    if (this.playerPos.y < this.currentLevel.fallLimitY) {
      this.falls += 1;
      this.respawnPlayer(true);
      this.emitHud();
    }

    // 8. Animate character limbs & squash/stretch
    this.animateCharacter(dt);

    // 9. Update progress along Z
    const totalDist = Math.max(1, Math.abs(this.finishZ - this.startZ));
    const covered = Math.max(0, this.startZ - this.playerPos.z);
    const pct = THREE.MathUtils.clamp(covered / totalDist, 0, 1);
    if (pct > this.maxProgress) this.maxProgress = pct;
  }

  private handlePlatformTrigger(p: RuntimePlatform): void {
    const def = p.def;

    if (def.type === 'disappearing' && p.disappearState === 'solid') {
      p.disappearState = 'shaking';
      p.disappearTimer = 0;
    }

    if (def.type === 'bounce') {
      this.playerVel.y = def.bounceForce ?? 20.5;
      this.grounded = false;
      this.standingPlatform = null;
      p.bounceAnim = 1.0;
      this.playerScale.set(0.75, 1.32, 0.75);
      soundEngine.playBounce();
      this.spawnParticles(this.playerPos, 0xf472b6, 14, 6.0, 8);
    }

    if (def.type === 'checkpoint' && p.checkpointRig && !p.checkpointRig.activated) {
      p.checkpointRig.activated = true;
      p.checkpointRig.ringMat.color.setHex(0x10b981);
      p.checkpointRig.ringMat.emissive.setHex(0x059669);
      p.checkpointRig.flagMat.color.setHex(0x34d399);
      p.checkpointRig.flagMat.emissive.setHex(0x10b981);
      p.checkpointRig.orbMat.color.setHex(0x6ee7b7);
      p.checkpointRig.orbMat.emissive.setHex(0x10b981);

      const cpIdx = def.checkpointIndex ?? this.checkpointReached + 1;
      if (cpIdx > this.checkpointReached) {
        this.checkpointReached = cpIdx;
        this.respawnPos.set(
          p.currentPos.x,
          p.currentPos.y + p.halfSize.y + 0.12,
          p.currentPos.z
        );
        this.score += 150;
        soundEngine.playCheckpoint();
        this.spawnParticles(this.playerPos, 0x34d399, 18, 6.2, 10);
        this.emitHud();
      }
    }

    if (def.type === 'finish' && this.mode === 'playing') {
      this.completeLevel();
    }
  }

  private checkObstacleCollisions(): void {
    const playerRadius = 0.36;
    const playerHeight = 1.55;

    for (const o of this.obstacles) {
      const barHalfThick = o.thickness * 0.52;
      if (
        this.playerPos.y + playerHeight < o.position.y - barHalfThick ||
        this.playerPos.y > o.position.y + barHalfThick
      ) {
        continue;
      }

      const dx = this.playerPos.x - o.position.x;
      const dz = this.playerPos.z - o.position.z;
      const halfLen = o.length * 0.5;

      for (let b = 0; b < o.blades; b++) {
        const bladeAngle = o.angle + (b * Math.PI) / o.blades;
        const cosA = Math.cos(-bladeAngle);
        const sinA = Math.sin(-bladeAngle);
        const localX = dx * cosA - dz * sinA;
        const localZ = dx * sinA + dz * cosA;

        const clampedX = THREE.MathUtils.clamp(localX, -halfLen, halfLen);
        const clampedZ = THREE.MathUtils.clamp(
          localZ,
          -barHalfThick,
          barHalfThick
        );
        const distSq =
          (localX - clampedX) * (localX - clampedX) +
          (localZ - clampedZ) * (localZ - clampedZ);

        if (distSq < playerRadius * playerRadius) {
          // Push player away from blade & apply knockback
          _v1.set(dx, 0, dz);
          if (_v1.lengthSq() < 0.01) _v1.set(0, 0, 1);
          _v1.normalize();

          this.playerVel.x = _v1.x * 10.5;
          this.playerVel.z = _v1.z * 10.5;
          this.playerVel.y = 7.2;
          this.grounded = false;
          this.standingPlatform = null;
          this.knockbackTimer = 0.28;
          this.hitFlashTimer = 0.25;
          this.hitstopTimer = 0.045;
          this.shakeIntensity = 0.35;
          this.score = Math.max(0, this.score - 50);

          soundEngine.playHit();
          this.spawnParticles(
            _v2.set(this.playerPos.x, this.playerPos.y + 0.8, this.playerPos.z),
            0xef4444,
            14,
            6.5,
            12
          );
          return;
        }
      }
    }
  }

  private completeLevel(): void {
    this.mode = 'celebrating';
    this.playerVel.set(0, 0, 0);
    soundEngine.playVictory();

    // Big celebratory confetti fountain!
    const confettiColors = [0xfacc15, 0x34d399, 0x38bdf8, 0xf472b6, 0xa855f7];
    for (let i = 0; i < 4; i++) {
      this.spawnParticles(
        _v1.set(this.playerPos.x, this.playerPos.y + 1.5, this.playerPos.z),
        confettiColors[i % confettiColors.length],
        16,
        8.5,
        10
      );
    }

    const timeBonus = Math.max(100, Math.round(600 - this.elapsedTime * 8));
    const fallPenalty = this.falls * 40;
    const finishBonus = 300;
    const finalScore = Math.max(
      100,
      this.score + finishBonus + timeBonus - fallPenalty
    );
    this.score = finalScore;

    const prevBest = this.bestScores[this.currentLevel.id] ?? 0;
    const isNewBest = finalScore > prevBest;
    const bestScore = Math.max(prevBest, finalScore);

    const coinRatio =
      this.currentLevel.coins.length > 0
        ? this.coinsCollected / this.currentLevel.coins.length
        : 1;
    let stars: 1 | 2 | 3 = 1;
    if (this.falls <= 2 && coinRatio >= 0.5) stars = 2;
    if (this.falls === 0 && coinRatio >= 0.75) stars = 3;

    this.emitHud();

    window.setTimeout(() => {
      if (this.disposed) return;
      this.callbacks.onLevelComplete({
        levelId: this.currentLevel.id,
        levelName: this.currentLevel.name,
        score: finalScore,
        bestScore,
        isNewBest,
        coinsCollected: this.coinsCollected,
        totalLevelCoins: this.currentLevel.coins.length,
        rewardCoins: this.currentLevel.rewardCoins,
        elapsedTime: this.elapsedTime,
        falls: this.falls,
        stars,
        hasNextLevel: this.currentLevel.id < 10,
      });
    }, 850);
  }

  private animateCharacter(dt: number): void {
    this.playerRig.root.position.copy(this.playerPos);
    this.playerRig.root.rotation.y = this.playerYaw;

    // Squash & stretch damping back to 1
    this.playerScale.x = THREE.MathUtils.damp(this.playerScale.x, 1, 14, dt);
    this.playerScale.y = THREE.MathUtils.damp(this.playerScale.y, 1, 14, dt);
    this.playerScale.z = THREE.MathUtils.damp(this.playerScale.z, 1, 14, dt);
    this.playerRig.visualGroup.scale.copy(this.playerScale);

    // Hit flash tint
    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= dt;
      const flash = Math.sin(this.totalTime * 45) > 0;
      for (const m of this.playerRig.bodyMaterials) {
        m.emissive.setHex(flash ? 0xef4444 : 0x000000);
        m.emissiveIntensity = flash ? 0.8 : 0;
      }
    } else {
      for (const m of this.playerRig.bodyMaterials) {
        m.emissive.setHex(0x000000);
        m.emissiveIntensity = 0;
      }
    }

    const horizSpeed = Math.hypot(this.playerVel.x, this.playerVel.z);

    if (!this.grounded) {
      // Airborne pose: arms raised excitedly, legs tucked slightly
      this.playerRig.leftArmPivot.rotation.x = THREE.MathUtils.damp(
        this.playerRig.leftArmPivot.rotation.x,
        -2.2,
        12,
        dt
      );
      this.playerRig.rightArmPivot.rotation.x = THREE.MathUtils.damp(
        this.playerRig.rightArmPivot.rotation.x,
        -2.2,
        12,
        dt
      );
      this.playerRig.leftLegPivot.rotation.x = THREE.MathUtils.damp(
        this.playerRig.leftLegPivot.rotation.x,
        0.45,
        10,
        dt
      );
      this.playerRig.rightLegPivot.rotation.x = THREE.MathUtils.damp(
        this.playerRig.rightLegPivot.rotation.x,
        -0.35,
        10,
        dt
      );
      this.playerRig.thrusterLeft.scale.y = 1.6;
      this.playerRig.thrusterRight.scale.y = 1.6;
    } else if (horizSpeed > 0.6) {
      // Running cycle
      this.runCycle += dt * horizSpeed * 1.65;
      const swing = Math.sin(this.runCycle) * 0.85;
      this.playerRig.leftLegPivot.rotation.x = swing;
      this.playerRig.rightLegPivot.rotation.x = -swing;
      this.playerRig.leftArmPivot.rotation.x = -swing * 0.8;
      this.playerRig.rightArmPivot.rotation.x = swing * 0.8;
      this.playerRig.bodyGroup.position.y =
        0.56 + Math.abs(Math.sin(this.runCycle)) * 0.07;
      this.playerRig.thrusterLeft.scale.y = 1.0;
      this.playerRig.thrusterRight.scale.y = 1.0;
    } else {
      // Cute idle breathing
      const breathe = Math.sin(this.totalTime * 3.2) * 0.03;
      this.playerRig.leftLegPivot.rotation.x = THREE.MathUtils.damp(
        this.playerRig.leftLegPivot.rotation.x,
        0,
        12,
        dt
      );
      this.playerRig.rightLegPivot.rotation.x = THREE.MathUtils.damp(
        this.playerRig.rightLegPivot.rotation.x,
        0,
        12,
        dt
      );
      this.playerRig.leftArmPivot.rotation.x = THREE.MathUtils.damp(
        this.playerRig.leftArmPivot.rotation.x,
        breathe,
        12,
        dt
      );
      this.playerRig.rightArmPivot.rotation.x = THREE.MathUtils.damp(
        this.playerRig.rightArmPivot.rotation.x,
        -breathe,
        12,
        dt
      );
      this.playerRig.bodyGroup.position.y = 0.56 + breathe * 0.6;
      this.playerRig.thrusterLeft.scale.y = 1.0;
      this.playerRig.thrusterRight.scale.y = 1.0;
    }
  }

  private updateCelebration(dt: number): void {
    // Joyful victory bounce & spin
    const hop = Math.abs(Math.sin(this.totalTime * 7.5)) * 0.9;
    this.playerRig.root.position.set(
      this.playerPos.x,
      this.playerPos.y + hop,
      this.playerPos.z
    );
    this.playerRig.root.rotation.y += dt * 5.0;
    this.playerRig.leftArmPivot.rotation.x = -2.5;
    this.playerRig.rightArmPivot.rotation.x = -2.5;
    this.updateCamera(dt);
  }

  private updateParticles(dt: number): void {
    for (const p of this.particles) {
      if (!p.active) continue;
      p.life += dt;
      if (p.life >= p.maxLife) {
        p.active = false;
        p.mesh.visible = false;
        continue;
      }
      p.vel.y -= p.gravity * dt;
      p.mesh.position.addScaledVector(p.vel, dt);
      p.mesh.rotation.x += dt * 7;
      p.mesh.rotation.y += dt * 9;
      const t = 1 - p.life / p.maxLife;
      p.mesh.scale.setScalar(Math.max(0.01, t));
    }
  }

  private updateCamera(dt: number): void {
    // Follow behind & above player, keeping player always visible during jumps
    const distBack = 9.4;
    const heightUp = 5.0;
    const offsetX = Math.sin(this.cameraYawOffset) * distBack;
    const offsetZ = Math.cos(this.cameraYawOffset) * distBack;

    _camTarget.set(
      this.playerPos.x * 0.72 + offsetX,
      this.playerPos.y + heightUp,
      this.playerPos.z + offsetZ
    );

    if (this.shakeIntensity > 0) {
      this.shakeIntensity = Math.max(0, this.shakeIntensity - dt * 1.8);
      _camTarget.x += (Math.random() - 0.5) * this.shakeIntensity;
      _camTarget.y += (Math.random() - 0.5) * this.shakeIntensity;
    }

    this.camera.position.x = THREE.MathUtils.damp(
      this.camera.position.x,
      _camTarget.x,
      7.5,
      dt
    );
    this.camera.position.y = THREE.MathUtils.damp(
      this.camera.position.y,
      _camTarget.y,
      5.5,
      dt
    );
    this.camera.position.z = THREE.MathUtils.damp(
      this.camera.position.z,
      _camTarget.z,
      7.5,
      dt
    );

    _camLook.set(
      this.playerPos.x * 0.85,
      this.playerPos.y + 1.35,
      this.playerPos.z - 2.6
    );
    this.camera.lookAt(_camLook);

    // Keep directional sun shadow frustum centered near player
    this.sunLight.position.set(
      this.playerPos.x + 16,
      this.playerPos.y + 28,
      this.playerPos.z + 14
    );
    this.sunLight.target.position.copy(this.playerPos);
  }

  private updateShowcaseCamera(dt: number): void {
    // Atmospheric panning camera over the sky course for the Title / Menu screen
    const panZ = -18 + Math.sin(this.totalTime * 0.22) * 16;
    const panX = Math.sin(this.totalTime * 0.3) * 10;
    _camTarget.set(panX, 9.5, panZ + 14);
    this.camera.position.x = THREE.MathUtils.damp(
      this.camera.position.x,
      _camTarget.x,
      3,
      dt
    );
    this.camera.position.y = THREE.MathUtils.damp(
      this.camera.position.y,
      _camTarget.y,
      3,
      dt
    );
    this.camera.position.z = THREE.MathUtils.damp(
      this.camera.position.z,
      _camTarget.z,
      3,
      dt
    );
    this.camera.lookAt(0, 1.8, panZ - 10);

    // Cute idle bob on player at start pad
    this.playerRig.root.position.copy(this.playerPos);
    this.playerRig.root.rotation.y = Math.sin(this.totalTime * 0.8) * 0.4;
    this.playerRig.bodyGroup.position.y =
      0.56 + Math.sin(this.totalTime * 3.0) * 0.04;
  }

  private updateShadowPlane(): void {
    // Cast a crisp downward contact shadow onto the highest platform directly under the player
    let highestTop = -9999;
    for (const p of this.platforms) {
      if (p.def.type === 'disappearing' && p.disappearState === 'gone') {
        continue;
      }
      const dx = Math.abs(this.playerPos.x - p.currentPos.x);
      const dz = Math.abs(this.playerPos.z - p.currentPos.z);
      if (dx <= p.halfSize.x + 0.3 && dz <= p.halfSize.z + 0.3) {
        const topY = p.currentPos.y + p.halfSize.y;
        if (topY <= this.playerPos.y + 0.25 && topY > highestTop) {
          highestTop = topY;
        }
      }
    }

    if (highestTop > -9000) {
      this.shadowPlane.visible = true;
      this.shadowPlane.position.set(
        this.playerPos.x,
        highestTop + 0.025,
        this.playerPos.z
      );
      const heightAbove = Math.max(0, this.playerPos.y - highestTop);
      const scale = THREE.MathUtils.clamp(1 - heightAbove * 0.09, 0.35, 1);
      this.shadowPlane.scale.setScalar(scale);
      (this.shadowPlane.material as THREE.MeshBasicMaterial).opacity =
        THREE.MathUtils.clamp(0.55 - heightAbove * 0.06, 0.12, 0.55);
    } else {
      this.shadowPlane.visible = false;
    }
  }

  private emitHud(): void {
    this.callbacks.onHudUpdate({
      levelId: this.currentLevel.id,
      levelName: this.currentLevel.name,
      score: this.score,
      coinsCollected: this.coinsCollected,
      totalLevelCoins: this.currentLevel.coins.length,
      progress: this.maxProgress,
      checkpointReached: this.checkpointReached,
      totalCheckpoints: this.totalCheckpoints,
      elapsedTime: this.elapsedTime,
      falls: this.falls,
    });
  }

  public dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    window.clearTimeout(this.frameId);

    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
    this.renderer.domElement.removeEventListener(
      'pointerdown',
      this.handleCanvasPointerDown
    );
    window.removeEventListener('pointermove', this.handleCanvasPointerMove);
    window.removeEventListener('pointerup', this.handleCanvasPointerUp);

    this.clearLevelObjects();
    this.textures.dispose();
    this.sharedCoinMat.dispose();
    this.scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const m = obj as THREE.Mesh;
        m.geometry?.dispose();
        if (Array.isArray(m.material)) {
          m.material.forEach((mat) => mat.dispose());
        } else {
          m.material?.dispose();
        }
      }
    });
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
