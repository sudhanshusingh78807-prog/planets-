# ASTRALIS COSMOS — Immersive 3D Solar System & Deep Space Odyssey

**Explore Beyond Reality.** An award-level interactive 3D WebGL journey across our Solar System, moons, gas giants, the Milky Way barred spiral galaxy, Andromeda, and the Cosmic Web.

---

## Features

- **Welcome Portal ("Start Diving In Space")**:
  - 3D perspective-reactive title stage with character-staggered kinetic reveals and rotating celestial astrolabe geometry.
  - Magnetic liquid-glass **"Start Diving In Space"** trigger that initiates a synchronized 3D camera warp dive, radial light-speed streaks, and Web Audio harmonic swell directly into the Sun's corona.
- **Photorealistic 3D Planetary Graphics**:
  - Real NASA/USGS/Voyager/Cassini photographic texture maps (`public/textures/`) combined with procedural 2048×1024 PBR maps.
  - Authentic normal/bump elevation relief, ocean specular reflectivity, independent floating cloud layer on Earth, and concentric Saturn rings (Cassini Division & Encke Gap).
  - Physically accurate single-source stellar illumination (`DirectionalLight`) and Fresnel Rayleigh horizon scattering.
- **Interactive Drag-to-Rotate Physics**:
  - Click or touch and drag any planet to inspect its 3D surface topology and cloud layers with rotational inertia.
- **Multi-Plane 3D Depth Typography**:
  - Spatial Z-layered typography (`translateZ(20px)` to `translateZ(115px)`) hovering across the horizon of each celestial body at 120 FPS.
- **Infinite Scroll Odyssey**:
  - Powered by Lenis smooth scrolling (`infinite: true`) and a Catmull-Rom 3D camera spline that loops seamlessly from the Cosmic Web back to the Sun.
- **100% Procedural Web Audio Soundscape**:
  - Real-time harmonic cosmic drone synthesizer with scroll-velocity filter modulation and interactive chimes.

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4
- **3D & WebGL**: Three.js (Custom GLSL Shaders for Solar Granulation, Rayleigh Atmosphere Halos, and Spiral Galaxy Particle Systems)
- **Motion & Scroll**: Motion (`motion/react`), GSAP, Lenis Smooth Scroll
- **Audio**: Web Audio API Procedural Synthesizer

---

## Local Development

```bash
# Install dependencies
npm install

# Start development server on port 3000
npm run dev

# Build for production
npm run build
```
