// Ultra-Realistic 3D fBm Domain-Warped Planetary, Solar, Ring & Galactic GLSL Shaders

export const COMMON_NOISE_GLSL = /* glsl */ `
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
  }

  float fbm(vec3 p) {
    float value = 0.0;
    float amp = 0.5;
    float freq = 1.0;
    for (int i = 0; i < 5; i++) {
      value += amp * snoise(p * freq);
      freq *= 2.07;
      amp *= 0.48;
    }
    return value;
  }

  float ridgedFbm(vec3 p) {
    float value = 0.0;
    float amp = 0.5;
    float freq = 1.0;
    for (int i = 0; i < 4; i++) {
      float n = 1.0 - abs(snoise(p * freq));
      value += amp * (n * n);
      freq *= 2.15;
      amp *= 0.48;
    }
    return value;
  }
`;

export const SOLAR_SURFACE_VERTEX = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec3 vObjPos;
  varying float vNoise;

  uniform float uTime;
  uniform float uPulse;

  ${COMMON_NOISE_GLSL}

  void main() {
    vUv = uv;
    vObjPos = normalize(position);
    float n1 = fbm(vObjPos * 2.8 + vec3(uTime * 0.25));
    float n2 = ridgedFbm(vObjPos * 5.5 - vec3(uTime * 0.4)) * 0.6;
    vNoise = n1 + n2;

    vec3 displaced = position + normal * (vNoise * (0.06 + uPulse * 0.12));
    vec4 worldPos = modelMatrix * vec4(displaced, 1.0);
    vWorldPosition = worldPos.xyz;
    vNormal = normalize(normalMatrix * normal);

    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

export const SOLAR_SURFACE_FRAGMENT = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec3 vObjPos;
  varying float vNoise;

  uniform float uTime;

  ${COMMON_NOISE_GLSL}

  void main() {
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    vec3 N = normalize(vNormal);
    float NoV = max(0.0, dot(N, viewDir));
    float fresnel = pow(1.0 - NoV, 2.2);

    // High-frequency solar granulation cells
    float cells = ridgedFbm(vObjPos * 14.0 + vec3(uTime * 0.45));
    float sunspots = smoothstep(0.45, 0.72, snoise(vObjPos * 3.5 - vec3(uTime * 0.1)));

    vec3 umbra = vec3(0.45, 0.06, 0.01);
    vec3 plasmaOrange = vec3(1.0, 0.42, 0.04);
    vec3 hotGold = vec3(1.0, 0.82, 0.25);
    vec3 whiteCore = vec3(1.0, 0.98, 0.9);

    float intensity = clamp(vNoise * 0.55 + cells * 0.65 - sunspots * 0.55, 0.0, 1.4);
    vec3 col = mix(umbra, plasmaOrange, smoothstep(0.0, 0.45, intensity));
    col = mix(col, hotGold, smoothstep(0.42, 0.85, intensity));
    col = mix(col, whiteCore, smoothstep(0.82, 1.25, intensity));

    // Coronal limb brightening
    col += vec3(1.0, 0.65, 0.18) * fresnel * 1.65;

    gl_FragColor = vec4(col, 1.0);
  }
`;

export const PLANET_REALISTIC_VERTEX = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec3 vObjPos;

  void main() {
    vUv = uv;
    vObjPos = normalize(position);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    vNormal = normalize( mat3(modelMatrix) * normal );
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

export const PLANET_REALISTIC_FRAGMENT = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec3 vObjPos;

  uniform float uTime;
  uniform int uPreset;
  uniform vec3 uSunDir;
  uniform vec3 uAtmosphereColor;

  ${COMMON_NOISE_GLSL}

  // Evaluate surface elevation for procedural 3D bump mapping
  float getSurfaceHeight(vec3 p) {
    if (uPreset == 1 || uPreset == 4) {
      // Mercury & Moon: Heavily cratered regolith + ridged basins
      float craters = ridgedFbm(p * 6.5) * 0.65 + fbm(p * 16.0) * 0.35;
      return craters;
    }
    if (uPreset == 3) {
      // Earth: Continental plates + mountain chains
      vec3 warp = p + 0.22 * vec3(snoise(p * 2.2), snoise(p * 2.2 + 10.0), snoise(p * 2.2 + 20.0));
      return fbm(warp * 2.3) + ridgedFbm(warp * 8.0) * 0.22;
    }
    if (uPreset == 5) {
      // Mars: Valles Marineris canyons & shield volcanoes
      return fbm(p * 3.2) * 0.7 + ridgedFbm(p * 9.5) * 0.4;
    }
    if (uPreset == 7) {
      // Europa: Crisscrossing ice fracture ridges
      return ridgedFbm(p * 11.0);
    }
    // Gas giants & ice worlds: subtle zonal band height
    return snoise(vec3(p.x * 2.0, p.y * 14.0, p.z * 2.0)) * 0.18;
  }

  void main() {
    vec3 P = normalize(vObjPos);
    vec3 V = normalize(cameraPosition - vWorldPosition);
    vec3 L = normalize(uSunDir);

    // Perturb surface normal via finite-difference gradient in 3D sphere space
    float eps = 0.006;
    float h0 = getSurfaceHeight(P);
    float hx = getSurfaceHeight(normalize(P + vec3(eps, 0.0, 0.0)));
    float hy = getSurfaceHeight(normalize(P + vec3(0.0, eps, 0.0)));
    float hz = getSurfaceHeight(normalize(P + vec3(0.0, 0.0, eps)));
    vec3 grad = vec3(hx - h0, hy - h0, hz - h0) / eps;

    float bumpStrength = (uPreset == 1 || uPreset == 4 || uPreset == 5) ? 0.16 : (uPreset == 3 || uPreset == 7) ? 0.11 : 0.035;
    vec3 N = normalize(vNormal - grad * bumpStrength);

    float NoL = dot(N, L);
    float diffuse = smoothstep(-0.12, 0.88, NoL);
    float NoV = max(0.0, dot(N, V));
    float fresnel = pow(1.0 - NoV, 3.2);

    vec3 albedo = vec3(0.5);
    float roughness = 0.75;
    vec3 nightEmission = vec3(0.0);
    float cloudAlpha = 0.0;

    if (uPreset == 1) {
      // MERCURY: Metallic slate craters & bright ejecta rays
      float n = fbm(P * 4.2);
      float rays = ridgedFbm(P * 12.0);
      albedo = mix(vec3(0.24, 0.25, 0.28), vec3(0.56, 0.58, 0.62), smoothstep(-0.3, 0.5, n));
      albedo = mix(albedo, vec3(0.82, 0.84, 0.88), smoothstep(0.58, 0.85, rays) * 0.55);
      roughness = 0.55;
    } else if (uPreset == 2) {
      // VENUS: Super-rotating golden sulfuric cloud streams
      vec3 q = vec3(P.x + uTime * 0.05, P.y * 5.2, P.z - uTime * 0.05);
      float swirl = fbm(q + vec3(0.0, snoise(P * 3.5) * 0.8, 0.0));
      albedo = mix(vec3(0.68, 0.36, 0.08), vec3(0.95, 0.74, 0.32), smoothstep(-0.4, 0.55, swirl));
      albedo = mix(albedo, vec3(1.0, 0.92, 0.68), smoothstep(0.3, 0.75, swirl));
      roughness = 0.35;
    } else if (uPreset == 3) {
      // EARTH: Oceans, Continents, Polar Ice, Swirling Clouds, and Night City Lights
      float landMask = smoothstep(0.02, 0.09, h0);
      float coastal = smoothstep(-0.06, 0.04, h0);
      vec3 deepOcean = vec3(0.015, 0.09, 0.26);
      vec3 shallowSea = vec3(0.03, 0.32, 0.52);
      vec3 oceanCol = mix(deepOcean, shallowSea, coastal);

      float lat = abs(P.y);
      float moisture = fbm(P * 4.5 + 7.0);
      vec3 forest = vec3(0.06, 0.28, 0.11);
      vec3 savannah = vec3(0.52, 0.42, 0.18);
      vec3 mountain = vec3(0.38, 0.35, 0.32);
      vec3 landCol = mix(forest, savannah, smoothstep(-0.2, 0.4, moisture));
      landCol = mix(landCol, mountain, smoothstep(0.32, 0.65, h0));

      // Polar ice caps
      float iceMask = smoothstep(0.76, 0.88, lat + h0 * 0.15);
      albedo = mix(oceanCol, landCol, landMask);
      albedo = mix(albedo, vec3(0.94, 0.97, 1.0), iceMask);

      // Dynamic tropospheric cloud layer with shadow casting
      vec3 cloudPos = P * 3.4 + vec3(uTime * 0.025, 0.0, -uTime * 0.018);
      float cloudNoise = fbm(cloudPos + vec3(fbm(cloudPos * 1.8) * 0.65));
      cloudAlpha = smoothstep(0.08, 0.52, cloudNoise) * 0.88;
      float cloudShadow = smoothstep(0.08, 0.52, fbm(cloudPos - L * 0.04));
      albedo *= (1.0 - cloudShadow * 0.35 * (1.0 - cloudAlpha));
      albedo = mix(albedo, vec3(0.98, 0.99, 1.0), cloudAlpha);

      roughness = mix(0.14, 0.78, max(landMask, cloudAlpha));

      // Night-side golden city light networks on continents
      float nightMask = smoothstep(0.02, -0.25, NoL) * landMask * (1.0 - iceMask) * (1.0 - cloudAlpha * 0.75);
      float cityGrid = smoothstep(0.52, 0.74, ridgedFbm(P * 28.0)) * smoothstep(0.1, 0.55, snoise(P * 6.0));
      nightEmission = vec3(1.0, 0.72, 0.28) * cityGrid * nightMask * 1.9;
    } else if (uPreset == 4) {
      // THE MOON (LUNA): Dark basaltic maria & bright crater highlands
      float maria = smoothstep(-0.25, 0.25, snoise(P * 1.8));
      float craters = ridgedFbm(P * 9.0);
      vec3 mareCol = vec3(0.22, 0.24, 0.27);
      vec3 highlandCol = vec3(0.62, 0.64, 0.68);
      albedo = mix(mareCol, highlandCol, maria);
      albedo = mix(albedo, vec3(0.86, 0.88, 0.91), smoothstep(0.55, 0.85, craters) * 0.5);
      roughness = 0.85;
    } else if (uPreset == 5) {
      // MARS: Rust iron-oxide desert, dark Syrtis basalt, & polar ice caps
      float basalt = fbm(P * 2.6);
      float canyon = ridgedFbm(P * 8.5);
      vec3 rust = vec3(0.76, 0.28, 0.11);
      vec3 ochre = vec3(0.88, 0.48, 0.22);
      vec3 darkBasalt = vec3(0.32, 0.14, 0.08);
      albedo = mix(darkBasalt, rust, smoothstep(-0.4, 0.2, basalt));
      albedo = mix(albedo, ochre, smoothstep(0.15, 0.65, canyon));
      float polar = smoothstep(0.84, 0.92, abs(P.y) + snoise(P * 10.0) * 0.04);
      albedo = mix(albedo, vec3(0.95, 0.93, 0.9), polar);
      roughness = 0.78;
    } else if (uPreset == 6) {
      // JUPITER: Turbulent zonal ammonia bands & Great Red Spot vortex
      float warp = fbm(vec3(P.x * 2.5 + uTime * 0.03, P.y * 8.0, P.z * 2.5)) * 0.16;
      float bandCoord = P.y * 16.0 + warp * 5.0;
      float band1 = sin(bandCoord);
      float band2 = cos(bandCoord * 2.1 + fbm(P * 6.0) * 2.0);

      vec3 zoneCream = vec3(0.95, 0.89, 0.76);
      vec3 beltOchre = vec3(0.78, 0.44, 0.18);
      vec3 beltUmber = vec3(0.48, 0.22, 0.09);
      albedo = mix(beltOchre, zoneCream, smoothstep(-0.5, 0.5, band1));
      albedo = mix(albedo, beltUmber, smoothstep(0.25, 0.85, band2) * 0.65);

      // Great Red Spot anticyclonic storm
      vec3 spotCenter = normalize(vec3(0.55, -0.34, 0.76));
      vec3 diff = P - spotCenter;
      diff.y *= 1.85;
      float spotDist = length(diff);
      float spotMask = 1.0 - smoothstep(0.08, 0.24, spotDist);
      float spotSwirl = sin(spotDist * 45.0 - uTime * 1.5 + snoise(P * 12.0) * 3.0) * 0.5 + 0.5;
      vec3 redSpotCol = mix(vec3(0.75, 0.16, 0.08), vec3(0.96, 0.42, 0.22), spotSwirl);
      albedo = mix(albedo, redSpotCol, spotMask);
      roughness = 0.28;
    } else if (uPreset == 7) {
      // EUROPA: Glacial water-ice crust with reddish tectonic lineae
      float cracks = ridgedFbm(P * 12.0);
      float fineCracks = ridgedFbm(P * 26.0);
      vec3 iceBlue = vec3(0.82, 0.93, 0.98);
      vec3 pureIce = vec3(0.96, 0.98, 1.0);
      vec3 lineae = vec3(0.58, 0.24, 0.14);
      albedo = mix(iceBlue, pureIce, smoothstep(0.2, 0.6, cracks));
      albedo = mix(albedo, lineae, smoothstep(0.68, 0.82, fineCracks) * 0.75);
      roughness = 0.18;
    } else if (uPreset == 8) {
      // SATURN: Silky golden-ivory ammonia bands
      float warp = fbm(vec3(P.x * 2.0, P.y * 10.0, P.z * 2.0)) * 0.08;
      float bands = sin(P.y * 22.0 + warp * 6.0);
      vec3 paleGold = vec3(0.96, 0.88, 0.68);
      vec3 warmAmber = vec3(0.78, 0.62, 0.36);
      vec3 polarHex = vec3(0.42, 0.54, 0.58);
      albedo = mix(warmAmber, paleGold, smoothstep(-0.6, 0.6, bands));
      albedo = mix(albedo, polarHex, smoothstep(0.82, 0.96, abs(P.y)));
      // Subtle ring shadow band across northern tropics
      float ringShadowBand = exp(-pow((P.y - 0.22) * 14.0, 2.0)) * 0.42;
      albedo *= (1.0 - ringShadowBand);
      roughness = 0.26;
    } else if (uPreset == 9) {
      // TITAN: Dense orange tholin haze over dark methane seas
      float haze = fbm(P * 3.0 + vec3(uTime * 0.02));
      albedo = mix(vec3(0.68, 0.32, 0.06), vec3(0.96, 0.62, 0.22), smoothstep(-0.4, 0.5, haze));
      roughness = 0.22;
    } else if (uPreset == 10) {
      // URANUS: Smooth aquamarine methane ice giant
      float bands = sin(P.x * 14.0 + snoise(P * 4.0) * 0.5);
      albedo = mix(vec3(0.28, 0.78, 0.86), vec3(0.64, 0.94, 0.98), smoothstep(-0.6, 0.6, bands));
      roughness = 0.22;
    } else if (uPreset == 11) {
      // NEPTUNE: Deep cobalt-azure supersonic winds & white methane cirrus streaks
      float warp = fbm(vec3(P.x * 3.0 + uTime * 0.06, P.y * 9.0, P.z * 3.0));
      float bands = sin(P.y * 18.0 + warp * 3.5);
      vec3 deepCobalt = vec3(0.06, 0.18, 0.62);
      vec3 brightAzure = vec3(0.16, 0.44, 0.92);
      albedo = mix(deepCobalt, brightAzure, smoothstep(-0.5, 0.5, bands));
      float cirrus = smoothstep(0.62, 0.82, ridgedFbm(vec3(P.x * 4.0 + uTime * 0.08, P.y * 16.0, P.z * 4.0)));
      albedo = mix(albedo, vec3(0.9, 0.96, 1.0), cirrus * 0.65);
      roughness = 0.24;
    } else {
      // PLUTO: Charcoal tholin plains & bright Tombaugh Regio nitrogen glacier heart
      float n = fbm(P * 3.5);
      albedo = mix(vec3(0.28, 0.22, 0.2), vec3(0.68, 0.62, 0.58), smoothstep(-0.3, 0.4, n));
      vec3 heartCenter = normalize(vec3(0.35, -0.05, 0.93));
      float heartMask = 1.0 - smoothstep(0.18, 0.42, distance(P, heartCenter));
      albedo = mix(albedo, vec3(0.95, 0.94, 0.92), heartMask);
      roughness = 0.65;
    }

    // Specular Blinn-Phong solar highlight (stronger on oceans & ice crusts)
    vec3 H = normalize(L + V);
    float shininess = mix(96.0, 12.0, roughness);
    float specStrength = (1.0 - roughness) * 0.95;
    float spec = pow(max(0.0, dot(N, H)), shininess) * specStrength * max(0.0, NoL);

    // Warm Sunset Terminator Scattering along the twilight horizon
    float terminatorZone = exp(-pow((NoL - 0.02) * 5.2, 2.0)) * smoothstep(-0.3, 0.2, NoL);
    vec3 sunsetScatter = mix(uAtmosphereColor, vec3(1.0, 0.42, 0.12), 0.55) * terminatorZone * 0.48;

    // Atmospheric Rayleigh Limb Scattering
    float daySideWeight = smoothstep(-0.45, 0.45, NoL);
    vec3 limbGlow = uAtmosphereColor * fresnel * (0.35 + daySideWeight * 1.15);

    // Subtle ambient fill on the shadow side so full sphere silhouette stays legible
    float ambient = 0.065;
    vec3 litColor = albedo * (diffuse + ambient) + sunsetScatter + vec3(1.0, 0.97, 0.92) * spec + limbGlow + nightEmission;

    gl_FragColor = vec4(litColor, 1.0);
  }
`;

export const ATMOSPHERE_HALO_VERTEX = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vWorldNormal;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const ATMOSPHERE_HALO_FRAGMENT = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vWorldNormal;

  uniform vec3 uGlowColor;
  uniform float uIntensity;
  uniform vec3 uSunDir;

  void main() {
    vec3 viewDir = normalize(vViewPosition);
    float NoV = max(0.0, dot(vNormal, viewDir));
    float rim = pow(1.0 - NoV, 3.8);
    float sunFacing = smoothstep(-0.2, 0.7, dot(vWorldNormal, normalize(uSunDir)));
    float glow = rim * uIntensity * (0.12 + 0.88 * sunFacing);
    gl_FragColor = vec4(uGlowColor * 1.25, clamp(glow, 0.0, 0.95));
  }
`;

export const SATURN_RING_VERTEX = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldPos;
  varying vec3 vLocalPos;

  void main() {
    vUv = uv;
    vLocalPos = position;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

export const SATURN_RING_FRAGMENT = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldPos;
  varying vec3 vLocalPos;

  uniform vec3 uColorInner;
  uniform vec3 uColorOuter;
  uniform float uInnerRadius;
  uniform float uOuterRadius;

  void main() {
    float r = length(vLocalPos.xy);
    float u = clamp((r - uInnerRadius) / max(0.001, uOuterRadius - uInnerRadius), 0.0, 1.0);

    // High-frequency concentric icy ringlets + Cassini & Encke divisions
    float ringlets = sin(u * 190.0) * 0.25 + sin(u * 62.0) * 0.35 + 0.55;
    float cassiniGap = 1.0 - exp(-pow((u - 0.67) * 38.0, 2.0)) * 0.92;
    float enckeGap = 1.0 - exp(-pow((u - 0.88) * 65.0, 2.0)) * 0.78;
    float cRingFade = smoothstep(0.0, 0.18, u);
    float outerFade = 1.0 - smoothstep(0.93, 1.0, u);

    vec3 col = mix(uColorInner, uColorOuter, u + sin(u * 28.0) * 0.12);
    float alpha = clamp(ringlets * cassiniGap * enckeGap * cRingFade * outerFade * 0.88, 0.0, 0.92);

    if (alpha < 0.02) discard;
    gl_FragColor = vec4(col * 1.15, alpha);
  }
`;

export const GALAXY_PARTICLE_VERTEX = /* glsl */ `
  attribute float aScale;
  attribute vec3 aCustomColor;
  varying vec3 vColor;
  varying float vAlpha;

  uniform float uTime;
  uniform float uSpinSpeed;

  void main() {
    vec3 pos = position;
    float distFromCenter = length(pos.xz);
    float angleOffset = uTime * uSpinSpeed * (1.8 / (distFromCenter + 0.8));
    float s = sin(angleOffset);
    float c = cos(angleOffset);

    vec2 rotatedXZ = vec2(pos.x * c - pos.z * s, pos.x * s + pos.z * c);
    pos.x = rotatedXZ.x;
    pos.z = rotatedXZ.y;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    float viewDist = -mvPosition.z;

    gl_PointSize = clamp((aScale * 165.0) / max(1.0, viewDist), 1.4, 15.0);
    gl_Position = projectionMatrix * mvPosition;

    vColor = aCustomColor;
    vAlpha = smoothstep(145.0, 8.0, viewDist) * smoothstep(0.5, 3.0, viewDist);
  }
`;

export const GALAXY_PARTICLE_FRAGMENT = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;
    float glow = pow(1.0 - d * 2.0, 2.2);
    gl_FragColor = vec4(vColor * 1.45, glow * vAlpha * 0.92);
  }
`;
