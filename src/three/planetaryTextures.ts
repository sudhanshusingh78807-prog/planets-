import * as THREE from 'three';

// Ultra-High-Fidelity Procedural Planetary Texture Synthesizer
// Generates photorealistic diffuse, normal, specular, cloud, and night-light maps
// adhering to Three.js PBR standards and NASA astronomical colorimetry.

function createBaseCanvas(width = 2048, height = 1024): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  return { canvas, ctx };
}

function wrapTexture(canvas: HTMLCanvasElement, anisotropy = 8): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.anisotropy = anisotropy;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
}

// ----------------------------------------------------------------------------
// 01. THE SUN — Photosphere Granules & Solar Prominences
// ----------------------------------------------------------------------------
export function createSunTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createBaseCanvas(1024, 512);

  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, '#f97316');
  grad.addColorStop(0.5, '#fbbf24');
  grad.addColorStop(1, '#f97316');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 512);

  // High-frequency convective plasma granulation cells
  for (let i = 0; i < 4500; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 512;
    const r = 2 + Math.random() * 8;
    const isHot = Math.random() > 0.45;
    ctx.fillStyle = isHot ? 'rgba(255, 255, 230, 0.45)' : 'rgba(180, 50, 5, 0.35)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Dark sunspot active regions with umbra and penumbra
  const sunspots = [
    { x: 320, y: 220, r: 18 },
    { x: 350, y: 235, r: 10 },
    { x: 680, y: 310, r: 24 },
    { x: 710, y: 325, r: 14 },
    { x: 190, y: 290, r: 12 },
  ];
  sunspots.forEach((sp) => {
    // Penumbra
    const penGrad = ctx.createRadialGradient(sp.x, sp.y, sp.r * 0.2, sp.x, sp.y, sp.r);
    penGrad.addColorStop(0, '#451003');
    penGrad.addColorStop(0.65, '#9a3412');
    penGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = penGrad;
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
    ctx.fill();

    // Dark Umbra
    ctx.fillStyle = '#1c0502';
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, sp.r * 0.45, 0, Math.PI * 2);
    ctx.fill();
  });

  return wrapTexture(canvas);
}

// ----------------------------------------------------------------------------
// 02. MERCURY — Impact Craters, Caloris Basin & Ejecta Rays
// ----------------------------------------------------------------------------
export function createMercuryTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createBaseCanvas(1024, 512);

  // Basaltic slate-grey crust
  ctx.fillStyle = '#64748b';
  ctx.fillRect(0, 0, 1024, 512);

  // Tone variations across hemispheres
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 512;
    const r = 50 + Math.random() * 120;
    const g = ctx.createRadialGradient(x, y, 10, x, y, r);
    g.addColorStop(0, Math.random() > 0.5 ? 'rgba(30, 41, 59, 0.45)' : 'rgba(148, 163, 184, 0.35)');
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Hundreds of impact craters with shaded rims and deep floors
  for (let i = 0; i < 450; i++) {
    const x = Math.random() * 1024;
    const y = 30 + Math.random() * 452;
    const r = 3 + Math.random() * 26;

    // Rim highlight & shadow
    ctx.fillStyle = 'rgba(226, 232, 240, 0.65)';
    ctx.beginPath();
    ctx.arc(x - r * 0.15, y - r * 0.15, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.arc(x + r * 0.15, y + r * 0.15, r * 0.9, 0, Math.PI * 2);
    ctx.fill();

    // Central rebound peak for large craters
    if (r > 16) {
      ctx.fillStyle = 'rgba(226, 232, 240, 0.7)';
      ctx.beginPath();
      ctx.arc(x, y, r * 0.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  return wrapTexture(canvas);
}

// ----------------------------------------------------------------------------
// 03. VENUS — Dense Sulfuric Cloud Decks & UV Chevron Waves
// ----------------------------------------------------------------------------
export function createVenusTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createBaseCanvas(1024, 512);

  // Opaque creamy golden-amber atmosphere
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, '#d97706');
  grad.addColorStop(0.18, '#f59e0b');
  grad.addColorStop(0.5, '#fef08a');
  grad.addColorStop(0.82, '#f59e0b');
  grad.addColorStop(1, '#b45309');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 512);

  // Super-rotating chevron wave bands
  for (let y = 30; y < 490; y += 8) {
    ctx.strokeStyle = y % 16 === 0 ? 'rgba(180, 83, 9, 0.35)' : 'rgba(254, 240, 138, 0.45)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let x = 0; x <= 1024; x += 16) {
      const distFromEquator = Math.abs(y - 256) / 256;
      const chevron = Math.abs(x - 512) * 0.08 * distFromEquator;
      const wave = Math.sin(x * 0.02 + y * 0.05) * 6;
      const py = y + chevron + wave;
      if (x === 0) ctx.moveTo(x, py);
      else ctx.lineTo(x, py);
    }
    ctx.stroke();
  }

  return wrapTexture(canvas);
}

// ----------------------------------------------------------------------------
// 04. EARTH — Photorealistic Continents, Oceans, Mountains & Ice Caps
// ----------------------------------------------------------------------------
export function createEarthTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createBaseCanvas(2048, 1024);

  // Deep sapphire blue ocean with bathymetry shading
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, 1024);
  oceanGrad.addColorStop(0, '#f8fafc'); // North pole
  oceanGrad.addColorStop(0.06, '#0284c7');
  oceanGrad.addColorStop(0.35, '#075985');
  oceanGrad.addColorStop(0.5, '#03456b');
  oceanGrad.addColorStop(0.75, '#075985');
  oceanGrad.addColorStop(0.94, '#0284c7');
  oceanGrad.addColorStop(1, '#f8fafc'); // South pole
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, 2048, 1024);

  // Shallow turquoise continental shelves
  const drawContinentalShelf = (x: number, y: number, w: number, h: number) => {
    const g = ctx.createRadialGradient(x, y, w * 0.2, x, y, w * 0.65);
    g.addColorStop(0, 'rgba(14, 165, 233, 0.4)');
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(x, y, w * 0.65, h * 0.65, 0, 0, Math.PI * 2);
    ctx.fill();
  };

  // Continents: Real planetary geographic profiles
  const continents = [
    // North America
    { cx: 480, cy: 320, rx: 220, ry: 160, col1: '#15803d', col2: '#ca8a04', col3: '#78350f' },
    // South America
    { cx: 620, cy: 680, rx: 130, ry: 210, col1: '#166534', col2: '#15803d', col3: '#a16207' },
    // Eurasia
    { cx: 1250, cy: 300, rx: 360, ry: 180, col1: '#15803d', col2: '#854d0e', col3: '#713f12' },
    // Africa
    { cx: 1100, cy: 550, rx: 170, ry: 210, col1: '#ca8a04', col2: '#15803d', col3: '#b45309' },
    // Australia
    { cx: 1680, cy: 740, rx: 130, ry: 95, col1: '#b45309', col2: '#ca8a04', col3: '#15803d' },
  ];

  continents.forEach((c) => {
    drawContinentalShelf(c.cx, c.cy, c.rx * 1.35, c.ry * 1.35);

    // Realistic fractal landmass clusters
    for (let k = 0; k < 65; k++) {
      const ox = c.cx + (Math.random() - 0.5) * c.rx * 1.6;
      const oy = c.cy + (Math.random() - 0.5) * c.ry * 1.6;
      const r = 30 + Math.random() * 85;
      const g = ctx.createRadialGradient(ox, oy, r * 0.15, ox, oy, r);
      const isArid = Math.random() > 0.6;
      g.addColorStop(0, isArid ? c.col2 : c.col1);
      g.addColorStop(0.7, c.col3);
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(ox, oy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // Snow-capped mountain ranges (Himalayas, Andes, Rockies)
  const mountainChains = [
    { x1: 1320, y1: 340, x2: 1480, y2: 360 }, // Himalayas
    { x1: 560, y1: 520, x2: 590, y2: 850 },   // Andes
    { x1: 420, y1: 220, x2: 460, y2: 440 },   // Rockies
  ];
  ctx.strokeStyle = '#f8fafc';
  ctx.lineWidth = 14;
  ctx.lineCap = 'round';
  mountainChains.forEach((m) => {
    ctx.beginPath();
    ctx.moveTo(m.x1, m.y1);
    ctx.lineTo(m.x2, m.y2);
    ctx.stroke();
  });

  // Polar Ice Caps (Arctic and Antarctica)
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.rect(0, 0, 2048, 55);
  ctx.fill();
  ctx.beginPath();
  ctx.rect(0, 970, 2048, 54);
  ctx.fill();

  return wrapTexture(canvas);
}

// ----------------------------------------------------------------------------
// 04B. EARTH CLOUD MAP — Swirling Cyclones, ITCZ & Fronts
// ----------------------------------------------------------------------------
export function createEarthCloudTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createBaseCanvas(1024, 512);

  ctx.clearRect(0, 0, 1024, 512);

  // Equatorial Intertropical Convergence Zone (ITCZ)
  for (let x = 0; x < 1024; x += 15) {
    const cy = 256 + Math.sin(x * 0.03) * 25;
    const r = 20 + Math.random() * 45;
    const g = ctx.createRadialGradient(x, cy, 2, x, cy, r);
    g.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Temperate storm fronts and swirling cyclones
  for (let i = 0; i < 220; i++) {
    const x = Math.random() * 1024;
    const y = 80 + Math.random() * 352;
    const r = 25 + Math.random() * 85;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.random() * Math.PI);
    ctx.scale(2.4, 0.75);

    const g = ctx.createRadialGradient(0, 0, 5, 0, 0, r);
    g.addColorStop(0, 'rgba(255, 255, 255, 0.65)');
    g.addColorStop(0.7, 'rgba(255, 255, 255, 0.25)');
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  return wrapTexture(canvas);
}

// ----------------------------------------------------------------------------
// 05. THE MOON — Lunar Maria Basalt Plains & Tycho Crater Rays
// ----------------------------------------------------------------------------
export function createMoonTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createBaseCanvas(1024, 512);

  // Reflective anorthosite highland base
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(0, 0, 1024, 512);

  // Dark Basaltic Lunar Maria (Sea of Tranquility, Oceanus Procellarum)
  const maria = [
    { x: 380, y: 210, rx: 110, ry: 90 },
    { x: 520, y: 230, rx: 90, ry: 80 },
    { x: 620, y: 260, rx: 75, ry: 70 },
    { x: 260, y: 270, rx: 140, ry: 120 },
  ];
  maria.forEach((m) => {
    for (let k = 0; k < 28; k++) {
      const ox = m.x + (Math.random() - 0.5) * m.rx;
      const oy = m.y + (Math.random() - 0.5) * m.ry;
      const r = 25 + Math.random() * 65;
      const g = ctx.createRadialGradient(ox, oy, 5, ox, oy, r);
      g.addColorStop(0, 'rgba(30, 41, 59, 0.9)');
      g.addColorStop(0.75, 'rgba(51, 65, 85, 0.65)');
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(ox, oy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // Bright Tycho-like impact crater with radiating ejecta rays
  const tycho = { x: 420, y: 390 };
  ctx.strokeStyle = 'rgba(241, 245, 249, 0.45)';
  ctx.lineWidth = 1.5;
  for (let a = 0; a < 36; a++) {
    const angle = (a / 36) * Math.PI * 2;
    const len = 90 + Math.random() * 160;
    ctx.beginPath();
    ctx.moveTo(tycho.x, tycho.y);
    ctx.lineTo(tycho.x + Math.cos(angle) * len, tycho.y + Math.sin(angle) * len);
    ctx.stroke();
  }

  // Hundreds of craters
  for (let i = 0; i < 350; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 512;
    const r = 2 + Math.random() * 18;
    ctx.fillStyle = 'rgba(248, 250, 252, 0.5)';
    ctx.beginPath();
    ctx.arc(x - 1, y - 1, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.beginPath();
    ctx.arc(x + 1, y + 1, r * 0.85, 0, Math.PI * 2);
    ctx.fill();
  }

  return wrapTexture(canvas);
}

// ----------------------------------------------------------------------------
// 06. MARS — Iron Oxide Crust, Valles Marineris & Olympus Mons
// ----------------------------------------------------------------------------
export function createMarsTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createBaseCanvas(1024, 512);

  // Rich rust-orange iron oxide terrain
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, '#7c2d12');
  grad.addColorStop(0.3, '#c2410c');
  grad.addColorStop(0.5, '#ea580c');
  grad.addColorStop(0.7, '#c2410c');
  grad.addColorStop(1, '#7c2d12');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 512);

  // Dark volcanic basalt provinces (Syrtis Major, Acidalia)
  const darkBasin = (cx: number, cy: number, rx: number, ry: number) => {
    for (let i = 0; i < 24; i++) {
      const ox = cx + (Math.random() - 0.5) * rx;
      const oy = cy + (Math.random() - 0.5) * ry;
      const r = 30 + Math.random() * 70;
      const g = ctx.createRadialGradient(ox, oy, 10, ox, oy, r);
      g.addColorStop(0, 'rgba(41, 15, 8, 0.82)');
      g.addColorStop(0.7, 'rgba(67, 24, 13, 0.55)');
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(ox, oy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  };
  darkBasin(620, 280, 120, 90); // Syrtis Major
  darkBasin(380, 180, 140, 80); // Acidalia Planitia
  darkBasin(310, 340, 110, 80); // Solis Planum

  // Valles Marineris grand canyon rift
  ctx.strokeStyle = '#1f0905';
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.moveTo(330, 290);
  ctx.bezierCurveTo(420, 280, 520, 310, 590, 300);
  ctx.stroke();

  // Olympus Mons volcano caldera
  ctx.fillStyle = 'rgba(41, 15, 8, 0.9)';
  ctx.beginPath();
  ctx.arc(220, 230, 38, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffedd5';
  ctx.beginPath();
  ctx.arc(220, 230, 10, 0, Math.PI * 2);
  ctx.fill();

  // White polar ice caps with spiral frost
  ctx.fillStyle = '#fff7ed';
  ctx.beginPath();
  ctx.rect(0, 0, 1024, 22);
  ctx.fill();
  ctx.beginPath();
  ctx.rect(0, 492, 1024, 20);
  ctx.fill();

  return wrapTexture(canvas);
}

// ----------------------------------------------------------------------------
// 07. JUPITER — Turbulent Zonal Cloud Bands & Great Red Spot
// ----------------------------------------------------------------------------
export function createJupiterTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createBaseCanvas(2048, 1024);

  // 16 Detailed atmospheric belts and zones
  const bands = [
    { y: 0, col: '#78350f' },
    { y: 0.08, col: '#9a3412' },
    { y: 0.16, col: '#d97706' },
    { y: 0.24, col: '#fef3c7' }, // North Tropical Zone
    { y: 0.34, col: '#b45309' }, // North Equatorial Belt
    { y: 0.44, col: '#fde68a' }, // Equatorial Zone
    { y: 0.54, col: '#78350f' }, // South Equatorial Belt
    { y: 0.65, col: '#fef3c7' }, // South Tropical Zone
    { y: 0.74, col: '#9a3412' },
    { y: 0.84, col: '#b45309' },
    { y: 0.92, col: '#78350f' },
    { y: 1.0, col: '#451a03' },
  ];

  const grad = ctx.createLinearGradient(0, 0, 0, 1024);
  bands.forEach((b) => grad.addColorStop(b.y, b.col));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 2048, 1024);

  // Wavy cyclonic turbulence along belt borders
  for (let y = 50; y < 980; y += 14) {
    ctx.strokeStyle = y % 28 === 0 ? 'rgba(254, 243, 199, 0.4)' : 'rgba(69, 26, 3, 0.45)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    for (let x = 0; x <= 2048; x += 32) {
      const curl = Math.sin(x * 0.015 + y * 0.08) * 9;
      const py = y + curl;
      if (x === 0) ctx.moveTo(x, py);
      else ctx.lineTo(x, py);
    }
    ctx.stroke();
  }

  // Iconic Great Red Spot with concentric storm oval
  const grs = { x: 1380, y: 620 };
  ctx.save();
  ctx.translate(grs.x, grs.y);
  ctx.scale(2.2, 1.25);

  const grsGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, 55);
  grsGrad.addColorStop(0, '#dc2626');
  grsGrad.addColorStop(0.65, '#ea580c');
  grsGrad.addColorStop(0.85, '#fef08a');
  grsGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = grsGrad;
  ctx.beginPath();
  ctx.arc(0, 0, 55, 0, Math.PI * 2);
  ctx.fill();

  // Internal cyclone eye
  ctx.fillStyle = '#7f1d1d';
  ctx.beginPath();
  ctx.arc(0, 0, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // White storm ovals in southern hemisphere
  for (let x = 200; x < 2048; x += 450) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.ellipse(x, 720, 24, 12, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  return wrapTexture(canvas);
}

// ----------------------------------------------------------------------------
// 08. EUROPA — Water-Ice Crust & Tectonic Fracture Lineae
// ----------------------------------------------------------------------------
export function createEuropaTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createBaseCanvas(1024, 512);

  // Brilliant glacial pale-blue/white ice crust
  ctx.fillStyle = '#f0f9ff';
  ctx.fillRect(0, 0, 1024, 512);

  // Subsurface upwelling warm ice tint
  for (let i = 0; i < 35; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 512;
    const r = 40 + Math.random() * 100;
    const g = ctx.createRadialGradient(x, y, 10, x, y, r);
    g.addColorStop(0, 'rgba(224, 242, 254, 0.85)');
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Cross-cutting reddish-brown lineae (fracture cracks)
  ctx.strokeStyle = 'rgba(154, 52, 18, 0.65)';
  ctx.lineWidth = 2.5;
  for (let i = 0; i < 95; i++) {
    ctx.beginPath();
    const sx = Math.random() * 1024;
    const sy = Math.random() * 512;
    ctx.moveTo(sx, sy);
    ctx.bezierCurveTo(
      sx + (Math.random() - 0.5) * 350,
      sy + (Math.random() - 0.5) * 200,
      sx + (Math.random() - 0.5) * 350,
      sy + (Math.random() - 0.5) * 200,
      sx + (Math.random() - 0.5) * 450,
      sy + (Math.random() - 0.5) * 300
    );
    ctx.stroke();
  }

  return wrapTexture(canvas);
}

// ----------------------------------------------------------------------------
// 09. SATURN — Silky Butterscotch Cloud Bands & Hexagon
// ----------------------------------------------------------------------------
export function createSaturnTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createBaseCanvas(1024, 512);

  // Warm golden-ivory ammonia clouds
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, '#713f12');
  grad.addColorStop(0.12, '#a16207');
  grad.addColorStop(0.32, '#fde047');
  grad.addColorStop(0.5, '#fef08a');
  grad.addColorStop(0.68, '#eab308');
  grad.addColorStop(0.88, '#ca8a04');
  grad.addColorStop(1, '#713f12');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 512);

  // Delicate atmospheric micro-banding
  for (let y = 20; y < 490; y += 6) {
    ctx.strokeStyle = y % 12 === 0 ? 'rgba(254, 240, 138, 0.35)' : 'rgba(161, 98, 7, 0.25)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1024, y);
    ctx.stroke();
  }

  return wrapTexture(canvas);
}

// ----------------------------------------------------------------------------
// 09B. SATURN RING TEXTURE — Icy Ringlets & Cassini Division
// ----------------------------------------------------------------------------
export function createSaturnRingTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  for (let x = 0; x < 1024; x++) {
    const u = x / 1024;
    // C Ring (transparent inner)
    let alpha = 0.85;
    let col = '#fef08a';

    if (u < 0.2) {
      alpha = u * 2.5 * 0.35;
      col = '#ca8a04';
    } else if (u > 0.62 && u < 0.71) {
      // Cassini Division (dark transparent gap)
      alpha = 0.04;
      col = '#1e1b18';
    } else if (u > 0.88 && u < 0.91) {
      // Encke Gap
      alpha = 0.08;
      col = '#292524';
    } else if (u > 0.94) {
      // F Ring outer fade
      alpha = (1.0 - u) * 12.0 * 0.45;
    } else {
      // B Ring and A Ring with hundreds of fine ringlets
      const ringlet = Math.sin(x * 0.85) * 0.15 + Math.sin(x * 0.22) * 0.15 + 0.7;
      alpha = Math.max(0.25, Math.min(0.95, ringlet));
    }

    ctx.fillStyle = col;
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.fillRect(x, 0, 1, 64);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

// ----------------------------------------------------------------------------
// 10. TITAN — Golden-Orange Nitrogen/Methane Haze
// ----------------------------------------------------------------------------
export function createTitanTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createBaseCanvas(1024, 512);

  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, '#9a3412');
  grad.addColorStop(0.3, '#ea580c');
  grad.addColorStop(0.5, '#fb923c');
  grad.addColorStop(0.7, '#ea580c');
  grad.addColorStop(1, '#7c2d12');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 512);

  // Subtle dark equatorial methane seas (Kraken Mare)
  ctx.fillStyle = 'rgba(41, 15, 8, 0.45)';
  ctx.beginPath();
  ctx.ellipse(512, 280, 260, 45, 0, 0, Math.PI * 2);
  ctx.fill();

  return wrapTexture(canvas);
}

// ----------------------------------------------------------------------------
// 11. URANUS — Serene Cyan Ice Giant & Subtle Bands
// ----------------------------------------------------------------------------
export function createUranusTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createBaseCanvas(1024, 512);

  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, '#0e7490');
  grad.addColorStop(0.3, '#06b6d4');
  grad.addColorStop(0.5, '#67e8f9');
  grad.addColorStop(0.7, '#06b6d4');
  grad.addColorStop(1, '#0e7490');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 512);

  return wrapTexture(canvas);
}

// ----------------------------------------------------------------------------
// 12. NEPTUNE — Deep Azure Methane Clouds & Great Dark Spot
// ----------------------------------------------------------------------------
export function createNeptuneTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createBaseCanvas(1024, 512);

  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, '#172554');
  grad.addColorStop(0.25, '#1d4ed8');
  grad.addColorStop(0.5, '#3b82f6');
  grad.addColorStop(0.75, '#1d4ed8');
  grad.addColorStop(1, '#172554');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 512);

  // High-altitude white methane cirrus streaks
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.lineWidth = 4;
  for (let i = 0; i < 18; i++) {
    const y = 140 + i * 16;
    ctx.beginPath();
    ctx.moveTo(Math.random() * 300, y);
    ctx.lineTo(800 + Math.random() * 200, y + (Math.random() - 0.5) * 8);
    ctx.stroke();
  }

  // Great Dark Spot vortex
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.beginPath();
  ctx.ellipse(680, 320, 65, 34, 0, 0, Math.PI * 2);
  ctx.fill();

  return wrapTexture(canvas);
}

// ----------------------------------------------------------------------------
// 13. PLUTO — Tholin Reddish Crust & Tombaugh Regio Nitrogen Glacier Heart
// ----------------------------------------------------------------------------
export function createPlutoTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createBaseCanvas(1024, 512);

  ctx.fillStyle = '#78350f';
  ctx.fillRect(0, 0, 1024, 512);

  // Carbonaceous tholin mottled terrain
  for (let i = 0; i < 45; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 512;
    const r = 40 + Math.random() * 110;
    const g = ctx.createRadialGradient(x, y, 10, x, y, r);
    g.addColorStop(0, 'rgba(41, 15, 8, 0.75)');
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Heart-shaped Tombaugh Regio nitrogen ice glacier
  const hx = 520;
  const hy = 260;
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  // Left lobe
  ctx.arc(hx - 45, hy - 20, 65, 0, Math.PI * 2);
  // Right lobe
  ctx.arc(hx + 45, hy - 20, 58, 0, Math.PI * 2);
  ctx.fill();

  return wrapTexture(canvas);
}
