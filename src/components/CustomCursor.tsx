import React, { useEffect, useRef, useState } from 'react';

interface CustomCursorProps {
  hoveredArtifact: string | null;
  accentHex: string;
  reducedMotion: boolean;
}

export const CustomCursor: React.FC<CustomCursorProps> = ({
  hoveredArtifact,
  accentHex,
  reducedMotion,
}) => {
  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches || reducedMotion) {
      setIsTouch(true);
      return;
    }

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;
    let rafId = 0;

    const onMove = (e: PointerEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
      }
    };

    const animateRing = () => {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
      }
      rafId = requestAnimationFrame(animateRing);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    rafId = requestAnimationFrame(animateRing);

    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(rafId);
    };
  }, [reducedMotion]);

  if (isTouch) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden hidden lg:block">
      {/* Center Precision Dot */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 -ml-1 -mt-1 w-2 h-2 rounded-full transition-colors duration-150"
        style={{ backgroundColor: accentHex }}
      />

      {/* Smooth Damped Outer Reticle + 3D Artifact Readout */}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 flex items-center"
        style={{ willChange: 'transform' }}
      >
        <div
          className={`-ml-5 -mt-5 w-10 h-10 rounded-full border transition-transform duration-200 flex items-center justify-center ${
            hoveredArtifact ? 'scale-150 border-white/80 bg-white/5' : 'scale-100 border-white/25'
          }`}
        />
        {hoveredArtifact && (
          <div className="ml-8 -mt-4 px-2.5 py-1 rounded bg-[#070a12]/95 border border-white/15 text-[11px] font-medium text-slate-100 whitespace-nowrap shadow-xl">
            {hoveredArtifact}
          </div>
        )}
      </div>
    </div>
  );
};
