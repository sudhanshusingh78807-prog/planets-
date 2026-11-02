import React, { useCallback, useEffect, useRef, useState } from 'react';
import Lenis from 'lenis';
import { ArrowUpRight } from 'lucide-react';
import { COSMOS_STAGES } from './data/cosmosData';
import { CosmosEngine } from './three/CosmosEngine';
import { soundEngine } from './utils/soundEngine';
import { TopBar } from './components/TopBar';
import { SideAudioTrigger } from './components/SideAudioTrigger';
import { KineticTypography } from './components/KineticTypography';
import { CustomCursor } from './components/CustomCursor';
import { WelcomePortal } from './components/WelcomePortal';
import { PlanetDetailDrawer } from './components/PlanetDetailDrawer';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<CosmosEngine | null>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const stageOverlayRefs = useRef<(HTMLDivElement | null)[]>([]);
  const activeStageRef = useRef<number>(0);
  const lastProgressRef = useRef<number>(0);

  const [activeStageIndex, setActiveStageIndex] = useState<number>(0);
  const [selectedDetailStageIndex, setSelectedDetailStageIndex] = useState<number | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);
  const [hoveredBody, setHoveredBody] = useState<string | null>(null);
  const [isWelcomeOpen, setIsWelcomeOpen] = useState<boolean>(true);
  const [isDiving, setIsDiving] = useState<boolean>(false);

  const handleOpenStageDetail = useCallback((stageIndex: number) => {
    soundEngine.playInteractionChime(1.18);
    const targetEl = sectionRefs.current[stageIndex];
    if (targetEl && lenisRef.current) {
      lenisRef.current.scrollTo(targetEl, { duration: 1.1 });
    }
    activeStageRef.current = stageIndex;
    setActiveStageIndex(stageIndex);
    setSelectedDetailStageIndex(stageIndex);
    engineRef.current?.setInspectMode(stageIndex);
    lenisRef.current?.stop();
  }, []);

  const handleCloseStageDetail = useCallback(() => {
    setSelectedDetailStageIndex(null);
    engineRef.current?.setInspectMode(null);
    lenisRef.current?.start();
  }, []);

  const handleNavigateDetailStage = useCallback((nextIndex: number) => {
    const targetEl = sectionRefs.current[nextIndex];
    if (targetEl && lenisRef.current) {
      lenisRef.current.start();
      lenisRef.current.scrollTo(targetEl, { immediate: true });
      lenisRef.current.stop();
    }
    const targetProgress = (nextIndex + 0.35) / COSMOS_STAGES.length;
    engineRef.current?.setScrollState(targetProgress, 0, false);
    activeStageRef.current = nextIndex;
    setActiveStageIndex(nextIndex);
    setSelectedDetailStageIndex(nextIndex);
    engineRef.current?.setInspectMode(nextIndex);
  }, []);

  // Initialize 3D Solar System & Galaxy WebGL Engine once
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);

    if (!canvasMountRef.current) return;

    const engine = new CosmosEngine(canvasMountRef.current, {
      onBodyHover: (label) => {
        setHoveredBody(label);
      },
      onBodyClick: (stageIdx) => {
        handleOpenStageDetail(stageIdx);
      },
      // Direct 120FPS 3D Depth Parallax on active typography overlay (zero React re-renders!)
      onScrollFrame: (_scrollProg, scrollVel, pointerX, pointerY) => {
        if (mq.matches) return;
        const currentEl = stageOverlayRefs.current[activeStageRef.current];
        if (currentEl) {
          const rx = (-pointerY * 7.5).toFixed(2);
          const ry = (pointerX * 9.5).toFixed(2);
          const skew = Math.max(-4, Math.min(4, scrollVel * 1.4)).toFixed(2);
          currentEl.style.transform = `perspective(1400px) rotateX(${rx}deg) rotateY(${ry}deg) skewY(${skew}deg)`;
        }
      },
    });
    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, [handleOpenStageDetail]);

  // Seamless Infinite Scroll Odyssey (Lenis with infinite loop support)
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.5,
      infinite: true,
    });
    lenisRef.current = lenis;
    lenis.stop();

    const syncCosmosScroll = (prog: number, vel: number) => {
      const wrappedDelta = Math.abs(prog - lastProgressRef.current);
      const isLoopWrap = wrappedDelta > 0.65;
      lastProgressRef.current = prog;

      const stageCount = COSMOS_STAGES.length;
      const stageIdx = Math.min(
        stageCount - 1,
        Math.max(0, Math.floor(prog * stageCount))
      );

      engineRef.current?.setScrollState(prog, vel, isLoopWrap);
      soundEngine.updateScroll(stageIdx % 6, vel);

      if (stageIdx !== activeStageRef.current) {
        activeStageRef.current = stageIdx;
        setActiveStageIndex(stageIdx);
      }
    };

    lenis.on('scroll', (e: { progress: number; velocity: number }) => {
      const prog = Number.isFinite(e.progress) ? e.progress : 0;
      const vel = Number.isFinite(e.velocity) ? e.velocity * 0.05 : 0;
      syncCosmosScroll(prog, vel);
    });

    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  const handleStartDive = useCallback(() => {
    if (isDiving) return;
    setIsDiving(true);
    setSoundEnabled(true);
    window.scrollTo(0, 0);

    engineRef.current?.triggerWelcomeDive(() => {
      setIsWelcomeOpen(false);
      lenisRef.current?.start();
    });
  }, [isDiving]);

  const handleSelectStage = useCallback(
    (index: number) => {
      if (selectedDetailStageIndex !== null) {
        handleCloseStageDetail();
      }
      const targetEl = sectionRefs.current[index];
      if (targetEl && lenisRef.current) {
        lenisRef.current.scrollTo(targetEl, { duration: 1.4 });
      } else if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth' });
      }
      activeStageRef.current = index;
      setActiveStageIndex(index);
    },
    [selectedDetailStageIndex, handleCloseStageDetail]
  );

  const handleToggleSound = useCallback(() => {
    const active = soundEngine.toggle();
    setSoundEnabled(active);
    if (active) {
      soundEngine.playInteractionChime(1.0);
    }
  }, []);

  const currentStage = COSMOS_STAGES[activeStageIndex] || COSMOS_STAGES[0];
  const selectedDetailStage =
    selectedDetailStageIndex !== null
      ? COSMOS_STAGES[selectedDetailStageIndex] || null
      : null;

  return (
    <div className="relative min-h-screen bg-[#020307] text-[#f4f7fb] selection:bg-sky-400/30">
      {/* Magnetic Custom Cursor with 3D Planet/Galaxy Hover Inspection */}
      <CustomCursor
        hoveredArtifact={hoveredBody}
        accentHex={currentStage.accentHex}
        reducedMotion={reducedMotion}
      />

      {/* Welcome Portal Overlay ("Start Diving In Space" + Hyperspace Warp Dive) */}
      <WelcomePortal
        isOpen={isWelcomeOpen}
        isDiving={isDiving}
        onStartDive={handleStartDive}
        reducedMotion={reducedMotion}
      />

      {/* Interactive Planetary & Galactic Dossier Drawer (With Entry & Exit Animations) */}
      <PlanetDetailDrawer
        selectedStage={selectedDetailStage}
        onClose={handleCloseStageDetail}
        onNavigateStage={handleNavigateDetailStage}
        reducedMotion={reducedMotion}
      />

      {/* Dedicated Isolated WebGL Canvas Mount Container */}
      <div
        ref={canvasMountRef}
        className="fixed inset-0 z-0 w-full h-full overflow-hidden"
        aria-hidden="true"
      />

      {/* Subtle Vignette Scrim keeping the central 3D planet vivid while anchoring edge typography */}
      <div
        className="fixed inset-0 z-10 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(2, 3, 7, 0.0) 0%, rgba(2, 3, 7, 0.28) 65%, rgba(2, 3, 7, 0.78) 100%)',
        }}
      />

      {/* Clean 3-Zone Top Bar (Reveals smoothly as the camera dives into the Solar System) */}
      <div
        className={`transition-all duration-1000 ease-out ${
          isWelcomeOpen && !isDiving
            ? 'opacity-0 -translate-y-6 pointer-events-none'
            : 'opacity-100 translate-y-0'
        }`}
      >
        <TopBar
          activeStageIndex={activeStageIndex}
          onSelectStage={handleSelectStage}
        />
      </div>

      {/* Minimal Side Music / Sound On-Off Trigger */}
      <SideAudioTrigger
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
      />

      {/* Unboxed 3D Depth-Layered Spatial Typography Overlays (Igloo / Lusion / Cartier style) */}
      <main
        className={`relative z-20 pointer-events-none transition-all duration-700 ease-out ${
          (isWelcomeOpen && !isDiving) || selectedDetailStage !== null
            ? 'opacity-0 scale-95 blur-md pointer-events-none'
            : 'opacity-100 scale-100 blur-0'
        }`}
      >
        {COSMOS_STAGES.map((stage, idx) => {
          const isStageActive = activeStageIndex === idx;
          const alignRight = stage.position[0] < 0;

          return (
            <section
              key={stage.id}
              id={`stage-${idx}`}
              ref={(el) => {
                sectionRefs.current[idx] = el;
              }}
              className="relative min-h-[112vh] w-full max-w-[1440px] mx-auto px-6 md:px-16 py-28 flex flex-col justify-center"
            >
              {/* Multi-Plane 3D Perspective Stage — Unboxed, Directly Overlaying the 3D Planet Horizon */}
              <div
                ref={(el) => {
                  stageOverlayRefs.current[idx] = el;
                }}
                onClick={() => handleOpenStageDetail(idx)}
                style={{
                  transformStyle: 'preserve-3d',
                  transition: 'opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                className={`group w-full max-w-3xl pointer-events-auto cursor-pointer flex flex-col ${
                  alignRight
                    ? 'md:ml-auto items-start md:items-end text-left md:text-right'
                    : 'items-start text-left'
                } ${isStageActive ? 'opacity-100' : 'opacity-25'}`}
              >
                {/* Plane -1 (Deep Z-Space Index & Orbit Classification) */}
                <div
                  style={{
                    transform: reducedMotion ? 'none' : 'translateZ(20px)',
                    textShadow: '0 8px 24px rgba(0, 0, 0, 0.95)',
                  }}
                  className="flex items-center gap-3 text-xs font-mono-tabular tracking-[0.22em] uppercase text-slate-300 mb-3"
                >
                  <span style={{ color: stage.accentHex }} className="font-semibold">
                    {stage.orderLabel}
                  </span>
                  <span aria-hidden="true" className="text-white/30">/</span>
                  <span>{stage.category}</span>
                </div>

                {/* Plane +1 & +2 (Monumental 3D Display Title + Editorial Italic Subtitle) */}
                <KineticTypography
                  stage={stage}
                  isActive={isStageActive}
                  reducedMotion={reducedMotion}
                  align={alignRight ? 'right' : 'left'}
                />

                {/* Plane +3 (Concise 1-Line Poetic Tagline Floating in Foreground Z-Space) */}
                <p
                  style={{
                    transform: reducedMotion ? 'none' : 'translateZ(95px)',
                    textShadow: '0 12px 32px rgba(0, 0, 0, 0.95)',
                  }}
                  className="mt-5 text-base md:text-lg leading-relaxed text-slate-100/90 font-light max-w-[44ch]"
                >
                  {stage.tagline}
                </p>

                {/* Plane +4 (Minimal Unboxed Telemetry Coordinates + Interactive Explore Trigger) */}
                <div
                  style={{
                    transform: reducedMotion ? 'none' : 'translateZ(115px)',
                    textShadow: '0 8px 24px rgba(0, 0, 0, 0.95)',
                  }}
                  className="mt-6 pt-3.5 border-t border-white/20 inline-flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-mono-tabular tracking-widest uppercase text-slate-200"
                >
                  <span style={{ color: stage.accentHex }} className="font-medium">
                    {stage.distanceLabel}
                  </span>
                  <span aria-hidden="true" className="text-white/30">·</span>
                  <span>{stage.diameterLabel}</span>
                  <span aria-hidden="true" className="text-white/30">·</span>
                  <span className="text-white font-semibold">{stage.periodLabel}</span>
                  <span aria-hidden="true" className="text-white/30">·</span>
                  <span
                    style={{ color: stage.accentHex }}
                    className="inline-flex items-center gap-1.5 font-semibold group-hover:translate-x-1 transition-transform duration-300"
                  >
                    <span>Inspect Dossier</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </section>
          );
        })}

        {/* Seamless Infinite Loop Bridge */}
        <section
          aria-hidden="true"
          className="relative h-[30vh] w-full flex items-center justify-center pointer-events-none"
        />
      </main>
    </div>
  );
}
