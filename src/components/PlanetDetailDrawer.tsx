import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ArrowLeft,
  ArrowRight,
  Compass,
  Orbit,
  Sparkles,
  Layers,
  Gauge,
} from 'lucide-react';
import { CelestialStage, COSMOS_STAGES } from '../data/cosmosData';
import { soundEngine } from '../utils/soundEngine';

interface PlanetDetailDrawerProps {
  selectedStage: CelestialStage | null;
  onClose: () => void;
  onNavigateStage: (index: number) => void;
  reducedMotion: boolean;
}

export const PlanetDetailDrawer: React.FC<PlanetDetailDrawerProps> = ({
  selectedStage,
  onClose,
  onNavigateStage,
  reducedMotion,
}) => {
  // Close on Escape key
  useEffect(() => {
    if (!selectedStage) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        soundEngine.playInteractionChime(0.82);
        onClose();
      } else if (e.key === 'ArrowRight') {
        soundEngine.playHoverTick();
        onNavigateStage((selectedStage.index + 1) % COSMOS_STAGES.length);
      } else if (e.key === 'ArrowLeft') {
        soundEngine.playHoverTick();
        onNavigateStage(
          (selectedStage.index - 1 + COSMOS_STAGES.length) % COSMOS_STAGES.length
        );
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedStage, onClose, onNavigateStage]);

  return (
    <AnimatePresence mode="wait">
      {selectedStage && (
        <motion.div
          key="planet-dossier-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{
            opacity: 0,
            transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
          }}
          className="fixed inset-0 z-40 pointer-events-none flex items-center justify-end"
        >
          {/* Left-Side Interactive 3D Planet Inspection Zone (Allows dragging the 3D planet while open, or double-clicking backdrop to close) */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24, transition: { duration: 0.35 } }}
            transition={{ duration: 0.65, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="hidden lg:flex flex-col justify-between h-full flex-1 p-12 pointer-events-none select-none"
          >
            <div className="mt-16 flex items-center gap-3 text-xs font-mono-tabular tracking-[0.22em] uppercase text-slate-300/90">
              <Orbit
                className="w-4 h-4 animate-spin"
                style={{
                  color: selectedStage.accentHex,
                  animationDuration: '14s',
                }}
              />
              <span>LIVE 3D TELEMETRY LOCK</span>
              <span aria-hidden="true" className="text-white/25">·</span>
              <span style={{ color: selectedStage.accentHex }}>
                DRAG GLOBE TO ROTATE TOPOLOGY
              </span>
            </div>

            <div className="mb-8 flex items-center gap-4">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playInteractionChime(0.82);
                  onClose();
                }}
                onMouseEnter={() => soundEngine.playHoverTick()}
                className="pointer-events-auto liquid-glass-pill px-5 py-2.5 rounded-full text-xs font-mono-tabular tracking-[0.2em] uppercase text-slate-200 hover:text-white flex items-center gap-2.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Resume Cosmic Scroll (ESC)</span>
              </button>
            </div>
          </motion.div>

          {/* Right-Side Liquid-Glass Astrophysical Dossier Panel */}
          <motion.aside
            key={`dossier-panel-${selectedStage.id}`}
            role="dialog"
            aria-modal="true"
            aria-label={`${selectedStage.name} Astrophysical Dossier`}
            initial={
              reducedMotion
                ? { opacity: 0 }
                : { opacity: 0, x: 110, scale: 0.96, filter: 'blur(12px)' }
            }
            animate={
              reducedMotion
                ? { opacity: 1 }
                : { opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' }
            }
            exit={
              reducedMotion
                ? { opacity: 0 }
                : {
                    opacity: 0,
                    x: 95,
                    scale: 0.96,
                    filter: 'blur(10px)',
                    transition: { duration: 0.42, ease: [0.32, 0, 0.67, 0] },
                  }
            }
            transition={{
              duration: 0.68,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="pointer-events-auto relative w-full md:w-[540px] lg:w-[600px] h-full max-h-screen overflow-y-auto liquid-glass-panel border-l border-white/15 px-6 py-8 md:px-10 md:py-10 flex flex-col justify-between text-[#f4f7fb] shadow-[-32px_0_80px_rgba(0,0,0,0.85)]"
            style={{
              background:
                'linear-gradient(155deg, rgba(10, 15, 30, 0.84) 0%, rgba(4, 6, 14, 0.94) 100%)',
            }}
          >
            {/* Ambient Planet Accent Horizon Glow inside Drawer */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl opacity-25"
              style={{ backgroundColor: selectedStage.accentHex }}
            />

            {/* Top Header Row: Stage Order + Animated Exit Button */}
            <div>
              <div className="flex items-center justify-between gap-4 pb-6 border-b border-white/10">
                <div className="flex items-center gap-2.5 text-xs font-mono-tabular tracking-[0.22em] uppercase text-slate-300">
                  <Compass
                    className="w-3.5 h-3.5"
                    style={{ color: selectedStage.accentHex }}
                  />
                  <span
                    style={{ color: selectedStage.accentHex }}
                    className="font-semibold"
                  >
                    {selectedStage.orderLabel}
                  </span>
                  <span aria-hidden="true" className="text-white/25">/</span>
                  <span>{selectedStage.category}</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playInteractionChime(0.82);
                    onClose();
                  }}
                  onMouseEnter={() => soundEngine.playHoverTick()}
                  aria-label="Close planetary dossier"
                  className="group liquid-glass-pill px-4 py-2 rounded-full text-xs font-mono-tabular tracking-[0.18em] uppercase text-slate-200 hover:text-white flex items-center gap-2 cursor-pointer"
                >
                  <span>Exit</span>
                  <X className="w-3.5 h-3.5 transition-transform duration-300 group-hover:rotate-90" />
                </button>
              </div>

              {/* Staggered Title & Editorial Subtitle */}
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="mt-7"
              >
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <h2 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight text-white">
                    {selectedStage.name}
                  </h2>
                  <span
                    style={{ color: selectedStage.accentHex }}
                    className="font-editorial italic text-2xl md:text-3xl font-light"
                  >
                    {selectedStage.subtitle}
                  </span>
                </div>

                <p className="mt-4 text-sm md:text-base leading-relaxed text-slate-200/90 font-normal">
                  {selectedStage.overview}
                </p>
              </motion.div>

              {/* 6-Point Astrophysical Telemetry Matrix */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
                className="mt-7 pt-6 border-t border-white/10"
              >
                <div className="flex items-center gap-2 text-xs font-mono-tabular tracking-[0.2em] uppercase text-slate-400 mb-4">
                  <Gauge
                    className="w-3.5 h-3.5"
                    style={{ color: selectedStage.accentHex }}
                  />
                  <span>ORBITAL &amp; PHYSICAL TELEMETRY</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-5 gap-x-6">
                  <div>
                    <div className="text-[11px] font-mono-tabular uppercase tracking-wider text-slate-400">
                      Heliocentric Distance
                    </div>
                    <div
                      style={{ color: selectedStage.accentHex }}
                      className="mt-1 font-mono-tabular text-sm md:text-base font-semibold"
                    >
                      {selectedStage.distanceLabel}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] font-mono-tabular uppercase tracking-wider text-slate-400">
                      Equatorial Span
                    </div>
                    <div className="mt-1 font-mono-tabular text-sm md:text-base font-semibold text-white">
                      {selectedStage.diameterLabel}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] font-mono-tabular uppercase tracking-wider text-slate-400">
                      Cycle / Period
                    </div>
                    <div className="mt-1 font-mono-tabular text-sm md:text-base font-semibold text-white">
                      {selectedStage.periodLabel}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] font-mono-tabular uppercase tracking-wider text-slate-400">
                      Surface Gravity
                    </div>
                    <div className="mt-1 font-mono-tabular text-sm md:text-base font-semibold text-slate-100">
                      {selectedStage.gravity}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] font-mono-tabular uppercase tracking-wider text-slate-400">
                      Thermal Regime
                    </div>
                    <div className="mt-1 font-mono-tabular text-sm md:text-base font-semibold text-slate-100">
                      {selectedStage.surfaceTemp}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] font-mono-tabular uppercase tracking-wider text-slate-400">
                      Axial Obliquity
                    </div>
                    <div className="mt-1 font-mono-tabular text-sm md:text-base font-semibold text-slate-100">
                      {selectedStage.axialTilt}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Atmospheric & Bulk Chemical Composition Bars */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
                className="mt-7 pt-6 border-t border-white/10"
              >
                <div className="flex items-center justify-between text-xs font-mono-tabular tracking-[0.2em] uppercase text-slate-400 mb-4">
                  <div className="flex items-center gap-2">
                    <Layers
                      className="w-3.5 h-3.5"
                      style={{ color: selectedStage.accentHex }}
                    />
                    <span>SPECTRAL COMPOSITION &amp; INTERIOR</span>
                  </div>
                  <span className="text-slate-300">{selectedStage.moonsCount}</span>
                </div>

                <p className="text-xs font-mono-tabular text-slate-300 mb-4">
                  Structure: <span className="text-white">{selectedStage.coreStructure}</span>
                </p>

                <div className="space-y-3.5">
                  {selectedStage.composition.map((item, idx) => (
                    <div key={item.label}>
                      <div className="flex items-center justify-between text-xs font-mono-tabular mb-1.5">
                        <div className="flex items-center gap-2">
                          <span
                            style={{ color: selectedStage.accentHex }}
                            className="font-semibold"
                          >
                            {item.formula}
                          </span>
                          <span className="text-white/30">·</span>
                          <span className="text-slate-200">{item.label}</span>
                        </div>
                        <span className="text-white font-semibold">
                          {item.percentage}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.max(4, item.percentage)}%` }}
                          transition={{
                            duration: 0.85,
                            delay: 0.3 + idx * 0.08,
                            ease: [0.16, 1, 0.3, 1],
                          }}
                          style={{ backgroundColor: selectedStage.accentHex }}
                          className="h-full rounded-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Signature Planetary Phenomena */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.32, ease: [0.16, 1, 0.3, 1] }}
                className="mt-7 pt-6 border-t border-white/10"
              >
                <div className="flex items-center gap-2 text-xs font-mono-tabular tracking-[0.2em] uppercase text-slate-400 mb-3.5">
                  <Sparkles
                    className="w-3.5 h-3.5"
                    style={{ color: selectedStage.accentHex }}
                  />
                  <span>SIGNATURE ASTROPHYSICAL PHENOMENA</span>
                </div>

                <ul className="space-y-2.5">
                  {selectedStage.phenomena.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 text-xs md:text-sm text-slate-200/90 leading-relaxed"
                    >
                      <span
                        style={{ color: selectedStage.accentHex }}
                        className="font-mono-tabular text-xs mt-0.5"
                      >
                        0{i + 1}
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>

            {/* Bottom Sequential Celestial Navigation Footer */}
            <div className="mt-8 pt-5 border-t border-white/15 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playInteractionChime(0.95);
                  const prevIdx =
                    (selectedStage.index - 1 + COSMOS_STAGES.length) %
                    COSMOS_STAGES.length;
                  onNavigateStage(prevIdx);
                }}
                onMouseEnter={() => soundEngine.playHoverTick()}
                className="liquid-glass-pill px-4 py-2.5 rounded-full text-xs font-mono-tabular tracking-wider uppercase text-slate-200 hover:text-white flex items-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>
                  {
                    COSMOS_STAGES[
                      (selectedStage.index - 1 + COSMOS_STAGES.length) %
                        COSMOS_STAGES.length
                    ].name
                  }
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundEngine.playInteractionChime(1.12);
                  const nextIdx =
                    (selectedStage.index + 1) % COSMOS_STAGES.length;
                  onNavigateStage(nextIdx);
                }}
                onMouseEnter={() => soundEngine.playHoverTick()}
                className="liquid-glass-pill px-4 py-2.5 rounded-full text-xs font-mono-tabular tracking-wider uppercase text-slate-200 hover:text-white flex items-center gap-2 cursor-pointer"
              >
                <span>
                  {
                    COSMOS_STAGES[
                      (selectedStage.index + 1) % COSMOS_STAGES.length
                    ].name
                  }
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
