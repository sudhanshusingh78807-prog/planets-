import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { COSMOS_STAGES, CelestialStage } from '../data/cosmosData';
import {
  ATMOSPHERE_HALO_FRAGMENT,
  ATMOSPHERE_HALO_VERTEX,
  GALAXY_PARTICLE_FRAGMENT,
  GALAXY_PARTICLE_VERTEX,
  SOLAR_SURFACE_FRAGMENT,
  SOLAR_SURFACE_VERTEX,
} from './shaders';
import {
  createEarthCloudTexture,
  createEarthTexture,
  createEuropaTexture,
  createJupiterTexture,
  createMarsTexture,
  createMercuryTexture,
  createMoonTexture,
  createNeptuneTexture,
  createPlutoTexture,
  createSaturnRingTexture,
  createSaturnTexture,
  createSunTexture,
  createTitanTexture,
  createUranusTexture,
  createVenusTexture,
} from './planetaryTextures';

const _vec3A = new THREE.Vector3();
const _vec3B = new THREE.Vector3();
const _dummy = new THREE.Object3D();
const _color = new THREE.Color();

export interface CosmosEngineCallbacks {
  onBodyHover?: (label: string | null) => void;
  onBodyClick?: (stageIndex: number, name: string) => void;
  onScrollFrame?: (scrollProgress: number, scrollVelocity: number, pointerX: number, pointerY: number) => void;
}

export class CosmosEngine {
  private container: HTMLElement;
  private callbacks: CosmosEngineCallbacks;
  public readonly isSoftwareGl: boolean;

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private clock = new THREE.Clock();
  private frameId = 0;
  private isDisposed = false;

  // Cyclic closed-loop camera spline for true infinite scroll
  private cameraCurve!: THREE.CatmullRomCurve3;
  private lookAtCurve!: THREE.CatmullRomCurve3;
  private targetScroll = 0;
  private currentScroll = 0;
  private scrollVelocity = 0;
  private pointerNormalized = new THREE.Vector2(0, 0);
  private smoothedPointer = new THREE.Vector2(0, 0);
  private pulseBoost = 0;
  private reducedMotion = false;

  // Welcome Portal & Hyperspace Dive Choreography
  private welcomeCameraOffset = new THREE.Vector3(0, 6.2, 24.0);
  private targetWelcomeOffset = new THREE.Vector3(0, 6.2, 24.0);
  private warpFovBoost = 0;
  private targetWarpFovBoost = 0;
  private isWelcomeMode = true;

  // 3D Planet Detail Inspection Camera Framing
  private inspectCamOffset = new THREE.Vector3(0, 0, 0);
  private targetInspectCamOffset = new THREE.Vector3(0, 0, 0);
  private inspectLookOffset = new THREE.Vector3(0, 0, 0);
  private targetInspectLookOffset = new THREE.Vector3(0, 0, 0);

  // User Interactive Drag-to-Rotate Planet Physics
  private isDragging = false;
  private dragStartPos = new THREE.Vector2(0, 0);
  private dragDelta = new THREE.Vector2(0, 0);
  private planetUserRotation = new THREE.Vector2(0, 0);
  private planetUserVelocity = new THREE.Vector2(0, 0);

  // Dynamic lights
  private sunLight!: THREE.DirectionalLight;
  private localFillLight?: THREE.PointLight;
  private hemiLight!: THREE.HemisphereLight;
  private fog!: THREE.FogExp2;

  // Custom shader materials updated per frame
  private solarMat!: THREE.ShaderMaterial;
  private galaxyMaterials: THREE.ShaderMaterial[] = [];

  // Animated celestial groups & meshes
  private stageGroups: THREE.Group[] = [];
  private rotatingGlobes: { mesh: THREE.Object3D; speed: number; isMainPlanet?: boolean }[] = [];
  private orbitingBodies: { pivot: THREE.Object3D; speed: number }[] = [];

  // Raycasting
  private raycaster = new THREE.Raycaster();
  private interactableMeshes: THREE.Object3D[] = [];
  private lastRaycastTime = 0;
  private currentHoveredLabel: string | null = null;

  constructor(container: HTMLElement, callbacks: CosmosEngineCallbacks = {}) {
    this.container = container;
    this.callbacks = callbacks;

    this.isSoftwareGl = (() => {
      try {
        const probeCanvas = document.createElement('canvas');
        const gl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.initRendererAndScene();
    this.initLighting();
    this.initCameraSplines();
    this.buildAllCelestialStages();
    this.buildDeepSpaceStarfield();

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.bindEvents();
    this.tick();
  }

  private initRendererAndScene(): void {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(width, height);

    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#020307');
    this.fog = new THREE.FogExp2('#020307', 0.007);
    this.scene.fog = this.fog;

    this.camera = new THREE.PerspectiveCamera(44, width / height, 0.1, 400);
    this.camera.position.set(...COSMOS_STAGES[0].cameraOffset);
    this.raycaster.layers.set(1);
  }

  private textureLoader = new THREE.TextureLoader();

  private loadTexture(url: string, isSRGB = true): THREE.Texture {
    const tex = this.textureLoader.load(url);
    tex.colorSpace = isSRGB ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    tex.anisotropy = 8;
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    return tex;
  }

  private initLighting(): void {
    // Key Sun Light: Single powerful directional starlight creating an authentic day/night terminator
    this.sunLight = new THREE.DirectionalLight(0xfff8ee, 4.2);
    this.sunLight.position.set(22, 6, 18);
    this.scene.add(this.sunLight);

    // Very subtle deep space starlight (low intensity so the dark hemisphere has genuine contrast)
    this.hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x010204, 0.08);
    this.scene.add(this.hemiLight);

    // Faint galactic rim fill light from the opposite side
    const galacticRim = new THREE.DirectionalLight(0x1e3a8a, 0.35);
    galacticRim.position.set(-20, -8, -16);
    this.scene.add(galacticRim);

    // Subtle local proximity fill light
    this.localFillLight = new THREE.PointLight(0x38bdf8, 1.2, 50, 1.6);
    this.scene.add(this.localFillLight);
  }

  private initCameraSplines(): void {
    const camPoints = COSMOS_STAGES.map((s) => new THREE.Vector3(...s.cameraOffset));
    const lookPoints = COSMOS_STAGES.map((s) => new THREE.Vector3(...s.lookAtOffset));

    this.cameraCurve = new THREE.CatmullRomCurve3(camPoints, false, 'catmullrom', 0.38);
    this.lookAtCurve = new THREE.CatmullRomCurve3(lookPoints, false, 'catmullrom', 0.38);
  }

  private createAtmosphereShell(radius: number, hexColor: string, intensity = 1.35): THREE.Mesh {
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uGlowColor: { value: new THREE.Color(hexColor) },
        uIntensity: { value: intensity },
        uSunDir: { value: new THREE.Vector3(22, 6, 18).normalize() },
      },
      vertexShader: ATMOSPHERE_HALO_VERTEX,
      fragmentShader: ATMOSPHERE_HALO_FRAGMENT,
      transparent: true,
      depthWrite: false,
      side: THREE.FrontSide,
      blending: THREE.AdditiveBlending,
    });
    return new THREE.Mesh(new THREE.SphereGeometry(radius * 1.018, 64, 64), mat);
  }

  private registerInteractable(mesh: THREE.Object3D, label: string, stageIndex: number): void {
    mesh.layers.enable(1);
    mesh.userData = { interactableLabel: label, stageIndex };
    this.interactableMeshes.push(mesh);
  }

  // ============================================================================
  // BUILD CELESTIAL STAGES WITH PHOTOREALISTIC GRAPHICS
  // ============================================================================
  private buildAllCelestialStages(): void {
    COSMOS_STAGES.forEach((stage, idx) => {
      const group = new THREE.Group();
      group.position.set(...stage.position);

      if (stage.bodyType === 'star') {
        this.buildSunStage(group, stage, idx);
      } else if (stage.bodyType === 'galaxy') {
        this.buildSpiralGalaxyStage(group, stage, idx);
      } else if (stage.bodyType === 'cosmic-web') {
        this.buildCosmicWebStage(group, stage, idx);
      } else {
        this.buildPhotorealisticPlanetStage(group, stage, idx);
      }

      this.stageGroups.push(group);
      this.scene.add(group);
    });
  }

  private buildSunStage(group: THREE.Group, stage: CelestialStage, idx: number): void {
    this.solarMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPulse: { value: 0 },
      },
      vertexShader: SOLAR_SURFACE_VERTEX,
      fragmentShader: SOLAR_SURFACE_FRAGMENT,
    });

    const sunSphere = new THREE.Mesh(new THREE.SphereGeometry(stage.radius, 128, 128), this.solarMat);
    this.registerInteractable(sunSphere, `${stage.name} — Click to Surge Solar Corona`, idx);
    group.add(sunSphere);
    this.rotatingGlobes.push({ mesh: sunSphere, speed: 0.04, isMainPlanet: true });

    // Multi-tier solar corona with additive blending
    const innerCorona = this.createAtmosphereShell(stage.radius * 1.025, '#fbbf24', 2.8);
    const outerCorona = this.createAtmosphereShell(stage.radius * 1.06, '#f97316', 1.8);
    group.add(innerCorona, outerCorona);
  }

  private buildPhotorealisticPlanetStage(group: THREE.Group, stage: CelestialStage, idx: number): void {
    if (stage.id === 'earth') {
      const earthDiff = this.loadTexture('/textures/earth.jpg');
      const earthNorm = this.loadTexture('/textures/earth_normal.jpg', false);
      const earthSpec = this.loadTexture('/textures/earth_specular.jpg', false);

      const earthMat = new THREE.MeshStandardMaterial({
        map: earthDiff,
        normalMap: earthNorm,
        normalScale: new THREE.Vector2(0.9, 0.9),
        roughnessMap: earthSpec,
        metalnessMap: earthSpec,
        roughness: 0.88,
        metalness: 0.12,
      });

      const globe = new THREE.Mesh(new THREE.SphereGeometry(stage.radius, 128, 128), earthMat);
      globe.rotation.z = THREE.MathUtils.degToRad(23.44); // 23.44° real Earth axial tilt
      this.registerInteractable(globe, `${stage.name} · ${stage.subtitle}`, idx);
      group.add(globe);
      this.rotatingGlobes.push({ mesh: globe, speed: 0.12, isMainPlanet: true });

      // Earth Cloud Layer (Floating above surface with realistic orbital speed offset)
      const cloudTex = this.loadTexture('/textures/earth_clouds.png');
      const cloudMat = new THREE.MeshStandardMaterial({
        map: cloudTex,
        transparent: true,
        opacity: 0.92,
        depthWrite: false,
        roughness: 1.0,
      });
      const cloudMesh = new THREE.Mesh(new THREE.SphereGeometry(stage.radius * 1.012, 96, 96), cloudMat);
      cloudMesh.rotation.z = THREE.MathUtils.degToRad(23.44);
      group.add(cloudMesh);
      this.rotatingGlobes.push({ mesh: cloudMesh, speed: 0.16, isMainPlanet: true });

      // Electric cyan atmospheric Rayleigh scattering rim
      const halo = this.createAtmosphereShell(stage.radius, '#38bdf8', 1.85);
      group.add(halo);

      // Luna in orbit around Earth
      const moonPivot = new THREE.Group();
      const moonDiff = this.loadTexture('/textures/moon.jpg');
      const moonMat = new THREE.MeshStandardMaterial({
        map: moonDiff,
        bumpMap: moonDiff,
        bumpScale: 0.08,
        roughness: 0.98,
        metalness: 0.0,
      });
      const moonMesh = new THREE.Mesh(new THREE.SphereGeometry(stage.radius * 0.27, 48, 48), moonMat);
      moonMesh.position.set(stage.radius * 2.3, 0.4, 0.8);
      moonPivot.add(moonMesh);
      group.add(moonPivot);
      this.orbitingBodies.push({ pivot: moonPivot, speed: 0.24 });
      return;
    }

    if (stage.id === 'luna') {
      const moonDiff = this.loadTexture('/textures/moon.jpg');
      const moonMat = new THREE.MeshStandardMaterial({
        map: moonDiff,
        bumpMap: moonDiff,
        bumpScale: 0.08,
        roughness: 0.98,
        metalness: 0.0,
      });
      const globe = new THREE.Mesh(new THREE.SphereGeometry(stage.radius, 96, 96), moonMat);
      globe.rotation.z = THREE.MathUtils.degToRad(6.68);
      this.registerInteractable(globe, `${stage.name} · ${stage.subtitle}`, idx);
      group.add(globe);
      this.rotatingGlobes.push({ mesh: globe, speed: 0.08, isMainPlanet: true });
      // Airless body: No atmosphere halo!
      return;
    }

    if (stage.id === 'mercury') {
      const mercDiff = this.loadTexture('/textures/mercury.jpg');
      const mercMat = new THREE.MeshStandardMaterial({
        map: mercDiff,
        bumpMap: mercDiff,
        bumpScale: 0.07,
        roughness: 0.94,
        metalness: 0.06,
      });
      const globe = new THREE.Mesh(new THREE.SphereGeometry(stage.radius, 96, 96), mercMat);
      globe.rotation.z = THREE.MathUtils.degToRad(2.04);
      this.registerInteractable(globe, `${stage.name} · ${stage.subtitle}`, idx);
      group.add(globe);
      this.rotatingGlobes.push({ mesh: globe, speed: 0.1, isMainPlanet: true });
      // Airless body: No atmosphere halo!
      return;
    }

    if (stage.id === 'venus') {
      const venusDiff = this.loadTexture('/textures/venus.jpg');
      const venusMat = new THREE.MeshStandardMaterial({
        map: venusDiff,
        roughness: 0.38,
        metalness: 0.05,
      });
      const globe = new THREE.Mesh(new THREE.SphereGeometry(stage.radius, 96, 96), venusMat);
      globe.rotation.z = THREE.MathUtils.degToRad(177.36);
      this.registerInteractable(globe, `${stage.name} · ${stage.subtitle}`, idx);
      group.add(globe);
      this.rotatingGlobes.push({ mesh: globe, speed: -0.06, isMainPlanet: true });

      const halo = this.createAtmosphereShell(stage.radius, '#f59e0b', 1.75);
      group.add(halo);
      return;
    }

    if (stage.id === 'mars') {
      const marsDiff = this.loadTexture('/textures/mars.jpg');
      const marsMat = new THREE.MeshStandardMaterial({
        map: marsDiff,
        bumpMap: marsDiff,
        bumpScale: 0.055,
        roughness: 0.88,
        metalness: 0.04,
      });
      const globe = new THREE.Mesh(new THREE.SphereGeometry(stage.radius, 96, 96), marsMat);
      globe.rotation.z = THREE.MathUtils.degToRad(25.19);
      this.registerInteractable(globe, `${stage.name} · ${stage.subtitle}`, idx);
      group.add(globe);
      this.rotatingGlobes.push({ mesh: globe, speed: 0.13, isMainPlanet: true });

      const halo = this.createAtmosphereShell(stage.radius, '#fb923c', 0.45);
      group.add(halo);

      // Phobos companion
      const phobosPivot = new THREE.Group();
      const phobosMat = new THREE.MeshStandardMaterial({
        map: marsDiff,
        roughness: 0.95,
      });
      const phobos = new THREE.Mesh(new THREE.SphereGeometry(0.24, 24, 24), phobosMat);
      phobos.position.set(stage.radius * 1.6, 0.2, 0.4);
      phobosPivot.add(phobos);
      group.add(phobosPivot);
      this.orbitingBodies.push({ pivot: phobosPivot, speed: 0.42 });
      return;
    }

    if (stage.id === 'jupiter') {
      const jupDiff = this.loadTexture('/textures/jupiter.jpg');
      const jupMat = new THREE.MeshStandardMaterial({
        map: jupDiff,
        roughness: 0.48,
        metalness: 0.0,
      });
      const globe = new THREE.Mesh(new THREE.SphereGeometry(stage.radius, 128, 128), jupMat);
      globe.rotation.z = THREE.MathUtils.degToRad(3.13);
      this.registerInteractable(globe, `${stage.name} · ${stage.subtitle}`, idx);
      group.add(globe);
      this.rotatingGlobes.push({ mesh: globe, speed: 0.18, isMainPlanet: true });

      // Io companion
      const ioPivot = new THREE.Group();
      const ioMat = new THREE.MeshStandardMaterial({
        map: this.loadTexture('/textures/mercury.jpg'),
        roughness: 0.7,
      });
      const io = new THREE.Mesh(new THREE.SphereGeometry(0.35, 32, 32), ioMat);
      io.position.set(stage.radius * 1.7, 0.3, 0.6);
      ioPivot.add(io);
      group.add(ioPivot);
      this.orbitingBodies.push({ pivot: ioPivot, speed: 0.36 });
      return;
    }

    if (stage.id === 'europa') {
      const europaTex = createEuropaTexture();
      const europaMat = new THREE.MeshStandardMaterial({
        map: europaTex,
        bumpMap: europaTex,
        bumpScale: 0.045,
        roughness: 0.22,
        metalness: 0.05,
      });
      const globe = new THREE.Mesh(new THREE.SphereGeometry(stage.radius, 96, 96), europaMat);
      this.registerInteractable(globe, `${stage.name} · ${stage.subtitle}`, idx);
      group.add(globe);
      this.rotatingGlobes.push({ mesh: globe, speed: 0.12, isMainPlanet: true });

      const halo = this.createAtmosphereShell(stage.radius, '#7dd3fc', 0.6);
      group.add(halo);
      return;
    }

    if (stage.id === 'saturn') {
      const saturnDiff = this.loadTexture('/textures/saturn.jpg');
      const saturnMat = new THREE.MeshStandardMaterial({
        map: saturnDiff,
        roughness: 0.45,
        metalness: 0.04,
      });
      const globe = new THREE.Mesh(new THREE.SphereGeometry(stage.radius, 96, 96), saturnMat);
      globe.rotation.z = THREE.MathUtils.degToRad(26.73);
      this.registerInteractable(globe, `${stage.name} · ${stage.subtitle}`, idx);
      group.add(globe);
      this.rotatingGlobes.push({ mesh: globe, speed: 0.14, isMainPlanet: true });

      // Rings with concentric radial UV mapping
      const innerR = stage.radius * 1.25;
      const outerR = stage.radius * 2.45;
      const ringGeo = new THREE.RingGeometry(innerR, outerR, 180);
      const pos = ringGeo.attributes.position;
      const uvs = ringGeo.attributes.uv;
      for (let i = 0; i < pos.count; i++) {
        const vx = pos.getX(i);
        const vy = pos.getY(i);
        const dist = Math.sqrt(vx * vx + vy * vy);
        const u = (dist - innerR) / (outerR - innerR);
        uvs.setXY(i, u, 0.5);
      }

      const ringTex = this.loadTexture('/textures/saturn_ring.png');
      const ringMat = new THREE.MeshStandardMaterial({
        map: ringTex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.95,
        roughness: 0.35,
        metalness: 0.1,
        depthWrite: false,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2.32;
      ringMesh.rotation.y = -0.22;
      group.add(ringMesh);

      const halo = this.createAtmosphereShell(stage.radius, '#fde68a', 0.85);
      group.add(halo);
      return;
    }

    if (stage.id === 'titan') {
      const titanTex = createTitanTexture();
      const titanMat = new THREE.MeshStandardMaterial({
        map: titanTex,
        roughness: 0.32,
        metalness: 0.02,
      });
      const globe = new THREE.Mesh(new THREE.SphereGeometry(stage.radius, 96, 96), titanMat);
      globe.rotation.z = THREE.MathUtils.degToRad(26.73);
      this.registerInteractable(globe, `${stage.name} · ${stage.subtitle}`, idx);
      group.add(globe);
      this.rotatingGlobes.push({ mesh: globe, speed: 0.11, isMainPlanet: true });

      // Dense opaque amber/orange haze
      const halo = this.createAtmosphereShell(stage.radius, '#d97706', 1.85);
      group.add(halo);
      return;
    }

    if (stage.id === 'uranus') {
      const uranDiff = this.loadTexture('/textures/uranus.jpg');
      const uranMat = new THREE.MeshStandardMaterial({
        map: uranDiff,
        roughness: 0.3,
        metalness: 0.02,
      });
      const globe = new THREE.Mesh(new THREE.SphereGeometry(stage.radius, 96, 96), uranMat);
      globe.rotation.z = THREE.MathUtils.degToRad(97.77); // Famous axial roll!
      this.registerInteractable(globe, `${stage.name} · ${stage.subtitle}`, idx);
      group.add(globe);
      this.rotatingGlobes.push({ mesh: globe, speed: 0.12, isMainPlanet: true });

      const halo = this.createAtmosphereShell(stage.radius, '#38bdf8', 1.15);
      group.add(halo);
      return;
    }

    if (stage.id === 'neptune') {
      const nepDiff = this.loadTexture('/textures/neptune.jpg');
      const nepMat = new THREE.MeshStandardMaterial({
        map: nepDiff,
        roughness: 0.28,
        metalness: 0.02,
      });
      const globe = new THREE.Mesh(new THREE.SphereGeometry(stage.radius, 96, 96), nepMat);
      globe.rotation.z = THREE.MathUtils.degToRad(28.32);
      this.registerInteractable(globe, `${stage.name} · ${stage.subtitle}`, idx);
      group.add(globe);
      this.rotatingGlobes.push({ mesh: globe, speed: 0.13, isMainPlanet: true });

      const halo = this.createAtmosphereShell(stage.radius, '#2563eb', 1.45);
      group.add(halo);
      return;
    }

    // Default (e.g. Pluto)
    const plutoTex = createPlutoTexture();
    const plutoMat = new THREE.MeshStandardMaterial({
      map: plutoTex,
      bumpMap: plutoTex,
      bumpScale: 0.065,
      roughness: 0.72,
      metalness: 0.05,
    });
    const globe = new THREE.Mesh(new THREE.SphereGeometry(stage.radius, 96, 96), plutoMat);
    globe.rotation.z = THREE.MathUtils.degToRad(122.53);
    this.registerInteractable(globe, `${stage.name} · ${stage.subtitle}`, idx);
    group.add(globe);
    this.rotatingGlobes.push({ mesh: globe, speed: 0.07, isMainPlanet: true });

    // Charon companion
    const charonPivot = new THREE.Group();
    const charonMat = new THREE.MeshStandardMaterial({
      map: this.loadTexture('/textures/moon.jpg'),
      roughness: 0.9,
    });
    const charon = new THREE.Mesh(new THREE.SphereGeometry(stage.radius * 0.45, 32, 32), charonMat);
    charon.position.set(stage.radius * 2.2, 0.2, 0.4);
    charonPivot.add(charon);
    group.add(charonPivot);
    this.orbitingBodies.push({ pivot: charonPivot, speed: 0.2 });
  }

  private buildSpiralGalaxyStage(group: THREE.Group, stage: CelestialStage, idx: number): void {
    const starCount = this.isSoftwareGl ? 4000 : 12000;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const scales = new Float32Array(starCount);

    const arms = stage.id === 'milky-way' ? 4 : 2;
    const coreColor = new THREE.Color(stage.id === 'milky-way' ? '#fff7ed' : '#fef08a');
    const armColor = new THREE.Color(stage.accentHex);
    const outerColor = new THREE.Color(stage.atmosphereHex);

    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      const radius = Math.pow(Math.random(), 1.55) * stage.radius;
      const spinAngle = radius * 1.38;
      const branchAngle = ((i % arms) / arms) * Math.PI * 2;

      const spread = (0.2 + radius * 0.08) * (Math.random() - 0.5) * 2.2;
      const randX = Math.pow(Math.random(), 2) * (Math.random() < 0.5 ? 1 : -1) * spread;
      const randY = (Math.random() - 0.5) * (0.42 / (1 + radius * 0.25));
      const randZ = Math.pow(Math.random(), 2) * (Math.random() < 0.5 ? 1 : -1) * spread;

      positions[i3] = Math.cos(branchAngle + spinAngle) * radius + randX;
      positions[i3 + 1] = randY;
      positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randZ;

      const ratio = radius / stage.radius;
      _color.copy(coreColor).lerp(armColor, Math.min(1, ratio * 1.4)).lerp(outerColor, ratio);
      colors[i3] = _color.r;
      colors[i3 + 1] = _color.g;
      colors[i3 + 2] = _color.b;

      scales[i] = (1.0 - ratio * 0.55) * (0.65 + Math.random() * 1.55);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aCustomColor', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uSpinSpeed: { value: stage.id === 'milky-way' ? 0.24 : -0.2 },
      },
      vertexShader: GALAXY_PARTICLE_VERTEX,
      fragmentShader: GALAXY_PARTICLE_FRAGMENT,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.galaxyMaterials.push(mat);

    const galaxyCloud = new THREE.Points(geo, mat);
    galaxyCloud.rotation.x = stage.id === 'milky-way' ? 0.4 : 0.56;
    galaxyCloud.rotation.z = stage.id === 'milky-way' ? -0.15 : 0.26;
    group.add(galaxyCloud);

    const coreHalo = this.createAtmosphereShell(1.65, '#fef08a', 2.2);
    this.registerInteractable(coreHalo, `${stage.name} Galactic Core`, idx);
    group.add(coreHalo);
  }

  private buildCosmicWebStage(group: THREE.Group, stage: CelestialStage, idx: number): void {
    const nodeCount = this.isSoftwareGl ? 2200 : 5600;
    const positions = new Float32Array(nodeCount * 3);
    const colors = new Float32Array(nodeCount * 3);
    const scales = new Float32Array(nodeCount);

    const colA = new THREE.Color('#f472b6');
    const colB = new THREE.Color('#38bdf8');
    const colC = new THREE.Color('#c084fc');

    for (let i = 0; i < nodeCount; i++) {
      const i3 = i * 3;
      const t = (i / nodeCount) * Math.PI * 16;
      const scatter = (Math.random() - 0.5) * 1.8;

      positions[i3] = Math.cos(t * 1.5) * 7.5 + Math.sin(t * 2.5) * 3.5 + scatter;
      positions[i3 + 1] = Math.sin(t * 2.0) * 5.2 + scatter;
      positions[i3 + 2] = Math.sin(t * 1.5) * 7.5 + Math.cos(t * 3.0) * 3.5 + scatter;

      _color.copy(i % 3 === 0 ? colA : i % 3 === 1 ? colB : colC);
      colors[i3] = _color.r;
      colors[i3 + 1] = _color.g;
      colors[i3 + 2] = _color.b;
      scales[i] = 0.75 + Math.random() * 1.85;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aCustomColor', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uSpinSpeed: { value: 0.08 },
      },
      vertexShader: GALAXY_PARTICLE_VERTEX,
      fragmentShader: GALAXY_PARTICLE_FRAGMENT,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.galaxyMaterials.push(mat);

    const webPoints = new THREE.Points(geo, mat);
    group.add(webPoints);

    const nexusCore = this.createAtmosphereShell(1.8, '#f472b6', 1.8);
    this.registerInteractable(nexusCore, `${stage.name} Supercluster`, idx);
    group.add(nexusCore);
  }

  private buildDeepSpaceStarfield(): void {
    const count = this.isSoftwareGl ? 1600 : 4500;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const scales = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const r = 10 + Math.random() * 48;
      const theta = Math.random() * Math.PI * 2;
      positions[i3] = Math.cos(theta) * r;
      positions[i3 + 1] = Math.sin(theta) * r * 0.75;
      positions[i3 + 2] = 25 - Math.random() * 510;

      _color.setHSL(0.55 + (Math.random() - 0.5) * 0.2, 0.65, 0.75 + Math.random() * 0.25);
      colors[i3] = _color.r;
      colors[i3 + 1] = _color.g;
      colors[i3 + 2] = _color.b;
      scales[i] = 0.4 + Math.random() * 1.2;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aCustomColor', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uSpinSpeed: { value: 0.01 },
      },
      vertexShader: GALAXY_PARTICLE_VERTEX,
      fragmentShader: GALAXY_PARTICLE_FRAGMENT,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.galaxyMaterials.push(mat);

    const stars = new THREE.Points(geo, mat);
    stars.frustumCulled = false;
    this.scene.add(stars);
  }

  // ============================================================================
  // PUBLIC CONTROLS & EVENT LISTENERS
  // ============================================================================
  public setScrollState(progress: number, velocity: number, isLoopWrap = false): void {
    const clamped = THREE.MathUtils.clamp(progress, 0, 1);
    this.targetScroll = clamped;
    if (isLoopWrap) {
      this.currentScroll = clamped;
    }
    this.scrollVelocity = THREE.MathUtils.clamp(velocity, -5, 5);
  }

  public triggerStagePulse(): void {
    this.pulseBoost = 1.65;
  }

  public setInspectMode(stageIndex: number | null): void {
    if (stageIndex === null) {
      this.targetInspectCamOffset.set(0, 0, 0);
      this.targetInspectLookOffset.set(0, 0, 0);
      this.pulseBoost = 0.9;
      return;
    }

    const stage = COSMOS_STAGES[stageIndex];
    if (!stage) return;

    this.pulseBoost = 1.85;
    const isDesktop = window.innerWidth >= 768;
    // Frame the planet on the left side of the viewport on desktop while zooming closer
    if (stage.bodyType === 'galaxy' || stage.bodyType === 'cosmic-web') {
      this.targetInspectCamOffset.set(isDesktop ? 2.4 : 0, -0.8, -4.2);
      this.targetInspectLookOffset.set(isDesktop ? 2.6 : 0, 0, 0);
    } else {
      const zoomZ = -Math.max(1.8, stage.radius * 0.85);
      this.targetInspectCamOffset.set(isDesktop ? 1.35 : 0, 0.05, zoomZ);
      this.targetInspectLookOffset.set(isDesktop ? 1.65 : 0, 0, 0);
    }
  }

  public triggerWelcomeDive(onComplete?: () => void): void {
    this.isWelcomeMode = false;
    this.pulseBoost = 2.8;
    this.targetWarpFovBoost = 32;
    this.targetWelcomeOffset.set(0, 0, 0);

    window.setTimeout(() => {
      this.targetWarpFovBoost = 0;
    }, 650);

    window.setTimeout(() => {
      onComplete?.();
    }, 1750);
  }

  private onPointerDown = (e: PointerEvent): void => {
    this.isDragging = true;
    this.dragStartPos.set(e.clientX, e.clientY);
    this.dragDelta.set(e.clientX, e.clientY);
  };

  private onPointerMove = (e: PointerEvent): void => {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    this.pointerNormalized.set(nx, ny);

    if (this.isDragging) {
      const dx = (e.clientX - this.dragDelta.x) * 0.006;
      const dy = (e.clientY - this.dragDelta.y) * 0.006;
      this.planetUserVelocity.x += dx;
      this.planetUserVelocity.y += dy;
      this.dragDelta.set(e.clientX, e.clientY);
    }

    const now = performance.now();
    if (now - this.lastRaycastTime > 75) {
      this.lastRaycastTime = now;
      this.raycaster.setFromCamera(this.pointerNormalized, this.camera);
      const hits = this.raycaster.intersectObjects(this.interactableMeshes, false);
      const hitLabel = hits.length > 0 ? (hits[0].object.userData.interactableLabel as string) : null;
      if (hitLabel !== this.currentHoveredLabel) {
        this.currentHoveredLabel = hitLabel;
        this.callbacks.onBodyHover?.(hitLabel);
      }
    }
  };

  private onPointerUp = (e: PointerEvent): void => {
    if (!this.isDragging) return;
    this.isDragging = false;

    // Only fire click inspection if the user did not drag the planet (> 7px)
    const moveDist = Math.hypot(
      e.clientX - this.dragStartPos.x,
      e.clientY - this.dragStartPos.y
    );
    if (moveDist < 7 && !this.isWelcomeMode) {
      const rect = this.renderer.domElement.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      this.pointerNormalized.set(nx, ny);

      this.raycaster.setFromCamera(this.pointerNormalized, this.camera);
      const hits = this.raycaster.intersectObjects(this.interactableMeshes, false);
      if (hits.length > 0) {
        const { interactableLabel, stageIndex } = hits[0].object.userData;
        this.triggerStagePulse();
        this.callbacks.onBodyClick?.(stageIndex, interactableLabel);
      }
    }
  };

  private onResize = (): void => {
    if (!this.container || this.isDisposed) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private bindEvents(): void {
    window.addEventListener('pointermove', this.onPointerMove, { passive: true });
    this.renderer.domElement.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('resize', this.onResize);
  }

  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    if (!gl || typeof gl.fenceSync !== 'function') {
      this.frameId = window.setTimeout(cb, 80);
      return;
    }
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.isDisposed) return;
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

  private tick = (): void => {
    if (this.isDisposed) return;

    const delta = Math.min(this.clock.getDelta(), 0.1);
    const elapsed = this.clock.getElapsedTime();
    const motionScale = this.reducedMotion ? 0.15 : 1.0;

    this.currentScroll = THREE.MathUtils.damp(this.currentScroll, this.targetScroll, 5.2, delta);
    this.scrollVelocity = THREE.MathUtils.damp(this.scrollVelocity, 0, 4.5, delta);
    this.smoothedPointer.x = THREE.MathUtils.damp(this.smoothedPointer.x, this.pointerNormalized.x, 5.2, delta);
    this.smoothedPointer.y = THREE.MathUtils.damp(this.smoothedPointer.y, this.pointerNormalized.y, 5.2, delta);
    this.pulseBoost = THREE.MathUtils.damp(this.pulseBoost, 0, 2.5, delta);

    // Smoothly interpolate Welcome Portal offset & Hyperspace FOV boost
    if (this.isWelcomeMode) {
      this.targetWelcomeOffset.set(
        Math.sin(elapsed * 0.35) * 2.2,
        5.8 + Math.cos(elapsed * 0.28) * 0.8,
        24.0
      );
    }
    this.welcomeCameraOffset.x = THREE.MathUtils.damp(this.welcomeCameraOffset.x, this.targetWelcomeOffset.x, 2.4, delta);
    this.welcomeCameraOffset.y = THREE.MathUtils.damp(this.welcomeCameraOffset.y, this.targetWelcomeOffset.y, 2.4, delta);
    this.welcomeCameraOffset.z = THREE.MathUtils.damp(this.welcomeCameraOffset.z, this.targetWelcomeOffset.z, 2.2, delta);
    this.warpFovBoost = THREE.MathUtils.damp(this.warpFovBoost, this.targetWarpFovBoost, 3.8, delta);

    // Smoothly interpolate 3D Planet Detail Inspection Camera Framing
    this.inspectCamOffset.x = THREE.MathUtils.damp(this.inspectCamOffset.x, this.targetInspectCamOffset.x, 4.2, delta);
    this.inspectCamOffset.y = THREE.MathUtils.damp(this.inspectCamOffset.y, this.targetInspectCamOffset.y, 4.2, delta);
    this.inspectCamOffset.z = THREE.MathUtils.damp(this.inspectCamOffset.z, this.targetInspectCamOffset.z, 4.2, delta);

    this.inspectLookOffset.x = THREE.MathUtils.damp(this.inspectLookOffset.x, this.targetInspectLookOffset.x, 4.2, delta);
    this.inspectLookOffset.y = THREE.MathUtils.damp(this.inspectLookOffset.y, this.targetInspectLookOffset.y, 4.2, delta);
    this.inspectLookOffset.z = THREE.MathUtils.damp(this.inspectLookOffset.z, this.targetInspectLookOffset.z, 4.2, delta);

    // Apply interactive drag-to-rotate inertia
    this.planetUserRotation.x += this.planetUserVelocity.x;
    this.planetUserRotation.y += this.planetUserVelocity.y;
    this.planetUserVelocity.multiplyScalar(0.92);

    // Notify UI overlay for 120fps zero-re-render 3D depth parallax
    this.callbacks.onScrollFrame?.(
      this.currentScroll,
      this.scrollVelocity,
      this.smoothedPointer.x,
      this.smoothedPointer.y
    );

    // Camera spline evaluation + welcome portal offset + detail inspection framing
    this.cameraCurve.getPointAt(this.currentScroll, _vec3A);
    this.lookAtCurve.getPointAt(this.currentScroll, _vec3B);

    _vec3A.add(this.welcomeCameraOffset);
    _vec3A.add(this.inspectCamOffset);
    _vec3B.add(this.inspectLookOffset);

    _vec3A.x += this.smoothedPointer.x * (this.isWelcomeMode ? 1.65 : 0.85);
    _vec3A.y += this.smoothedPointer.y * (this.isWelcomeMode ? 1.15 : 0.55);

    this.camera.position.copy(_vec3A);
    this.camera.lookAt(_vec3B);

    const targetFov = 44 + Math.min(6, Math.abs(this.scrollVelocity) * 1.6) + this.warpFovBoost;
    this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 5.5, delta);
    this.camera.updateProjectionMatrix();

    if (this.localFillLight) {
      this.localFillLight.position.set(
        this.camera.position.x + this.smoothedPointer.x * 4,
        this.camera.position.y + 2.5,
        this.camera.position.z - 3.5
      );
    }

    // Rotate planets with both continuous spin and user drag rotation
    for (let i = 0; i < this.rotatingGlobes.length; i++) {
      const item = this.rotatingGlobes[i];
      item.mesh.rotation.y += delta * item.speed * (1 + this.pulseBoost) * motionScale;
      if (item.isMainPlanet) {
        item.mesh.rotation.y += this.planetUserVelocity.x * 0.4;
        item.mesh.rotation.x += this.planetUserVelocity.y * 0.4;
      }
    }

    for (let i = 0; i < this.orbitingBodies.length; i++) {
      const item = this.orbitingBodies[i];
      item.pivot.rotation.y += delta * item.speed * motionScale;
    }

    if (this.solarMat) {
      this.solarMat.uniforms.uTime.value = elapsed * motionScale;
      this.solarMat.uniforms.uPulse.value = this.pulseBoost;
    }
    for (let i = 0; i < this.galaxyMaterials.length; i++) {
      this.galaxyMaterials[i].uniforms.uTime.value = elapsed * motionScale;
    }

    this.renderer.render(this.scene, this.camera);

    if (this.isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  };

  public dispose(): void {
    this.isDisposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    window.removeEventListener('pointermove', this.onPointerMove);
    this.renderer.domElement.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
  }
}
