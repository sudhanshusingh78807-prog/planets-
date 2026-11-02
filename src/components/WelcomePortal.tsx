import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Compass, Sparkles, ArrowUpRight } from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';

interface WelcomePortalProps {
  isOpen: boolean;
  isDiving: boolean;
  onStartDive: () => void;
  reducedMotion: boolean;
}

export const WelcomePortal: React.FC<WelcomePortalProps> = ({
  isOpen,
  isDiving,
  onStartDive,
  reducedMotion,
}) => {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [pointerTilt, setPointerTilt] = useState({ x: 0, y: 0 });
  const [btnOffset, setBtnOffset] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!isOpen || reducedMotion) return;

    const handleMove = (e: PointerEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      setPointerTilt({ x: nx, y: ny });

      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const dist = Math.hypot(dx, dy);
        if (dist < 160) {
          const pull = (1 - dist / 160) * 0.32;
          setBtnOffset({ x: dx * pull, y: dy * pull });
        } else {
          setBtnOffset({ x: 0, y: 0 });
        }
      }
    };

    window.addEventListener('pointermove', handleMove, { passive: true });
    return () => window.removeEventListener('pointermove', handleMove);
  }, [isOpen, reducedMotion]);

  // Pre-compute radial hyperspace streak angles for the warp transition
  const warpStreaks = Array.from({ length: 28 }, (_, i) => ({
    id: i,
    angle: (i / 28) * 360,
    delay: (i % 5) * 0.03,
    length: 140 + (i % 4) * 65,
  }));

  const titleChars = 'ASTRALIS'.split('');
  const subTitleChars = 'COSMOS'.split('');

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="welcome-portal-overlay"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            transition: { duration: 0.85, ease: [0.16, 1, 0.3, 1] },
          }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-between overflow-hidden select-none px-6 py-8 md:px-14 md:py-10"
          style={{
            background: isDiving
              ? 'radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.14) 0%, rgba(2, 3, 7, 0.05) 60%, rgba(2, 3, 7, 0.0) 100%)'
              : 'radial-gradient(circle at 50% 50%, rgba(2, 3, 7, 0.32) 0%, rgba(2, 3, 7, 0.72) 58%, rgba(2, 3, 7, 0.94) 100%)',
            backdropFilter: isDiving ? 'blur(0px)' : 'blur(6px)',
            transition: 'background 1.1s cubic-bezier(0.16, 1, 0.3, 1), backdrop-filter 0.9s ease-out',
          }}
        >
          {/* Astrolabe Celestial Ring SVG Geometry in Deep Background */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
          >
            <motion.div
              animate={
                isDiving
                  ? { scale: 4.2, opacity: 0, rotate: 95 }
                  : {
                      scale: isHovered ? 1.06 : 1.0,
                      opacity: 0.45,
                      rotate: 360,
                    }
              }
              transition={
                isDiving
                  ? { duration: 1.45, ease: [0.16, 1, 0.3, 1] }
                  : {
                      rotate: { duration: 90, repeat: Infinity, ease: 'linear' },
                      scale: { duration: 0.8, ease: 'easeOut' },
                    }
              }
              className="relative w-[540px] h-[540px] md:w-[760px] md:h-[760px] rounded-full border border-white/10 flex items-center justify-center"
            >
              {/* Inner Dashed Ecliptic Orbit */}
              <div className="w-[76%] h-[76%] rounded-full border border-dashed border-sky-300/20 flex items-center justify-center">
                <div className="w-[68%] h-[68%] rounded-full border border-amber-300/15" />
              </div>

              {/* Cardinal Ascension Tick Marks */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-5 bg-sky-300/40" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-px h-5 bg-sky-300/40" />
              <div className="absolute left-0 top-1/2 -translate-y-1/2 h-px w-5 bg-sky-300/40" />
              <div className="absolute right-0 top-1/2 -translate-y-1/2 h-px w-5 bg-sky-300/40" />
            </motion.div>
          </div>

          {/* Hyperspace Light-Streak Tunnel (Activates when "Start Diving In Space" is clicked) */}
          {isDiving && !reducedMotion && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
            >
              {warpStreaks.map((streak) => (
                <div
                  key={streak.id}
                  style={{
                    transform: `rotate(${streak.angle}deg)`,
                  }}
                  className="absolute w-0 h-0 flex items-center justify-center"
                >
                  <motion.div
                    initial={{ x: 40, scaleX: 0.1, opacity: 0 }}
                    animate={{
                      x: [40, 520, 1200],
                      scaleX: [0.2, 3.6, 0.5],
                      opacity: [0, 0.95, 0],
                    }}
                    transition={{
                      duration: 1.25,
                      delay: streak.delay,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    style={{ width: `${streak.length}px` }}
                    className="h-[1.5px] rounded-full bg-gradient-to-r from-transparent via-sky-300 to-amber-200 shadow-[0_0_16px_rgba(56,189,248,0.9)]"
                  />
                </div>
              ))}

              {/* Central Gravitational Singularity Flash */}
              <motion.div
                initial={{ scale: 0.2, opacity: 0 }}
                animate={{
                  scale: [0.2, 2.8, 6.5],
                  opacity: [0, 0.85, 0],
                }}
                transition={{ duration: 1.35, ease: [0.16, 1, 0.3, 1] }}
                className="w-64 h-64 rounded-full bg-radial from-amber-200/70 via-sky-400/30 to-transparent blur-2xl"
              />
            </div>
          )}

          {/* Top Bar Row: Unboxed Editorial Coordinates */}
          <motion.div
            animate={isDiving ? { y: -40, opacity: 0 } : { y: 0, opacity: 1 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-[1440px] flex items-center justify-between text-xs font-mono-tabular tracking-[0.22em] uppercase text-slate-300/80"
          >
            <div className="flex items-center gap-3">
              <Compass className="w-3.5 h-3.5 text-amber-300" />
              <span>OBSERVATORY EPOCH J2000.0</span>
              <span aria-hidden="true" className="text-white/25">·</span>
              <span className="hidden sm:inline text-sky-300">16 CELESTIAL HORIZONS</span>
            </div>
            <div className="flex items-center gap-3">
              <span>RA 17H 45M 40S</span>
              <span aria-hidden="true" className="text-white/25">/</span>
              <span className="text-amber-300">SOL TO COSMIC WEB</span>
            </div>
          </motion.div>

          {/* Center Monumental 3D Perspective Stage */}
          <div
            style={{
              transform: reducedMotion
                ? 'none'
                : `perspective(1400px) rotateX(${(-pointerTilt.y * 6.5).toFixed(2)}deg) rotateY(${(pointerTilt.x * 8.5).toFixed(2)}deg)`,
              transformStyle: 'preserve-3d',
              transition: 'transform 0.15s ease-out',
            }}
            className="relative z-10 flex flex-col items-center text-center max-w-5xl mx-auto my-auto py-8"
          >
            {/* Kicker Metadata */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={
                isDiving
                  ? { opacity: 0, scale: 1.5, filter: 'blur(8px)' }
                  : { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }
              }
              transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
              style={{ transform: 'translateZ(35px)' }}
              className="flex items-center gap-3 text-xs md:text-sm font-mono-tabular tracking-[0.28em] uppercase text-amber-300/90 mb-5"
            >
              <span>INTERACTIVE 3D HELIOSPHERE &amp; DEEP SPACE</span>
              <span aria-hidden="true" className="text-white/30">·</span>
              <span className="text-sky-300">REAL-TIME WEBGL</span>
            </motion.div>

            {/* Primary 3D Character-Staggered Display Title */}
            <motion.h1
              animate={
                isDiving
                  ? {
                      scale: 2.35,
                      opacity: 0,
                      filter: 'blur(14px)',
                      letterSpacing: '0.35em',
                    }
                  : {
                      scale: 1,
                      opacity: 1,
                      filter: 'blur(0px)',
                      letterSpacing: '-0.03em',
                    }
              }
              transition={{ duration: 1.15, ease: [0.16, 1, 0.3, 1] }}
              style={{
                transform: 'translateZ(80px)',
                fontSize: 'clamp(3.2rem, 8.8vw, 7.8rem)',
                lineHeight: 0.92,
                textShadow: '0 24px 60px rgba(0, 0, 0, 0.92)',
              }}
              className="font-display font-extrabold text-white tracking-tight flex flex-wrap items-center justify-center gap-x-6"
            >
              <span className="inline-flex whitespace-nowrap">
                {titleChars.map((ch, idx) => (
                  <motion.span
                    key={`t1-${idx}`}
                    initial={{ opacity: 0, y: 40, rotateX: -65 }}
                    animate={{ opacity: 1, y: 0, rotateX: 0 }}
                    transition={{
                      duration: 0.85,
                      delay: 0.08 + idx * 0.04,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="inline-block"
                  >
                    {ch}
                  </motion.span>
                ))}
              </span>
              <span className="inline-flex whitespace-nowrap font-editorial italic font-light text-amber-200">
                {subTitleChars.map((ch, idx) => (
                  <motion.span
                    key={`t2-${idx}`}
                    initial={{ opacity: 0, y: 40, rotateX: -65 }}
                    animate={{ opacity: 1, y: 0, rotateX: 0 }}
                    transition={{
                      duration: 0.85,
                      delay: 0.36 + idx * 0.045,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="inline-block"
                  >
                    {ch}
                  </motion.span>
                ))}
              </span>
            </motion.h1>

            {/* Editorial Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={
                isDiving
                  ? { opacity: 0, y: -25, scale: 1.25 }
                  : { opacity: 1, y: 0, scale: 1 }
              }
              transition={{ duration: 0.85, delay: isDiving ? 0 : 0.45, ease: [0.16, 1, 0.3, 1] }}
              style={{
                transform: 'translateZ(55px)',
                textShadow: '0 10px 30px rgba(0, 0, 0, 0.95)',
              }}
              className="mt-6 text-base md:text-xl text-slate-200/90 font-light max-w-[46ch] leading-relaxed"
            >
              Journey across photorealistic worlds—from the boiling convective corona of our Sun to the spiraling stellar arms of the Milky Way.
            </motion.p>

            {/* Primary Interactive CTA Button: "Start Diving In Space" */}
            <motion.div
              initial={{ opacity: 0, y: 26 }}
              animate={
                isDiving
                  ? { scale: 1.85, opacity: 0, filter: 'blur(10px)' }
                  : { scale: 1, opacity: 1, y: 0, filter: 'blur(0px)' }
              }
              transition={{ duration: 0.85, delay: isDiving ? 0 : 0.6, ease: [0.16, 1, 0.3, 1] }}
              style={{
                transform: `translate3d(${btnOffset.x.toFixed(1)}px, ${btnOffset.y.toFixed(1)}px, 115px)`,
              }}
              className="mt-11 relative group"
            >
              {/* Outer Ambient Corona Glow */}
              <div
                aria-hidden="true"
                className={` -inset-2 rounded-full bg-gradient-to-r from-sky-400/40 via-amber-300/45 to-sky-400/40 blur-xl transition-opacity duration-500 ${
                  isHovered ? 'opacity-100' : 'opacity-55'
                }`}
              />

              <button
                ref={buttonRef}
                type="button"
                disabled={isDiving}
                onClick={() => {
                  soundEngine.playWarpSequence();
                  onStartDive();
                }}
                onMouseEnter={() => {
                  setIsHovered(true);
                  soundEngine.playHoverTick();
                }}
                onMouseLeave={() => {
                  setIsHovered(false);
                  setBtnOffset({ x: 0, y: 0 });
                }}
                className="relative px-9 py-5 md:px-11 md:py-5 rounded-full liquid-glass-pill text-white font-display text-sm md:text-base font-bold tracking-[0.18em] uppercase flex items-center gap-4 cursor-pointer overflow-hidden shadow-[0_0_50px_rgba(56,189,248,0.28)] border border-white/25 hover:border-amber-300/70 transition-all duration-300"
              >
                {/* Animated Shimmer Sweep */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out bg-gradient-to-r from-transparent via-white/25 to-transparent"
                />

                <Sparkles className="w-4 h-4 text-amber-300 transition-transform duration-500 group-hover:rotate-90 group-hover:scale-125" />
                <span>Start Diving In Space</span>
                <span className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-1 group-hover:bg-amber-300 group-hover:text-slate-950">
                  <ArrowUpRight className="w-4 h-4" />
                </span>
              </button>
            </motion.div>
          </div>

          {/* Bottom Bar Row: Interactive Capabilities & Audio Note */}
          <motion.div
            animate={isDiving ? { y: 40, opacity: 0 } : { y: 0, opacity: 1 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-[1440px] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono-tabular tracking-[0.18em] uppercase text-slate-400"
          >
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>DRAG ANY PLANET TO INSPECT 3D TOPOLOGY</span>
            </div>
            <div className="flex items-center gap-3">
              <span>INFINITE SCROLL LOOP</span>
              <span aria-hidden="true" className="text-white/25">·</span>
              <span className="text-slate-300">SPATIAL WEB AUDIO SYNTHESIS</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
