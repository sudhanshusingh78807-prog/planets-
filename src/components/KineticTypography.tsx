import React, { useState } from 'react';
import { CelestialStage } from '../data/cosmosData';

interface KineticTypographyProps {
  stage: CelestialStage;
  isActive: boolean;
  reducedMotion: boolean;
  align: 'left' | 'right';
}

export const KineticTypography: React.FC<KineticTypographyProps> = ({
  stage,
  isActive,
  reducedMotion,
  align,
}) => {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const words = stage.name.split(' ');
  const HeadingTag = stage.index === 0 ? 'h1' : 'h2';

  return (
    <div
      className={`perspective-stage select-none flex flex-col ${
        align === 'right' ? 'items-start md:items-end text-left md:text-right' : 'items-start text-left'
      }`}
    >
      {/* Plane +1 (Foreground Monumental Sculpted Display Title overlapping the planet horizon) */}
      <HeadingTag
        aria-label={`${stage.name} — ${stage.subtitle}`}
        style={{
          transform: reducedMotion ? 'none' : 'translateZ(55px)',
          textShadow: '0 24px 64px rgba(0, 0, 0, 0.95), 0 4px 18px rgba(0, 0, 0, 0.85)',
        }}
        className={`font-display font-extrabold tracking-[-0.04em] leading-[0.88] text-[clamp(3.25rem,7.8vw,7.25rem)] text-white flex flex-wrap ${
          align === 'right' ? 'justify-start md:justify-end' : 'justify-start'
        } gap-x-[0.22em] gap-y-1`}
      >
        <span className="sr-only">{stage.name}</span>
        {words.map((word, wIdx) => (
          <span key={wIdx} aria-hidden="true" className="inline-flex whitespace-nowrap">
            {word.split('').map((char, cIdx) => {
              const key = `${wIdx}-${cIdx}`;
              const isHovered = hoveredKey === key;
              const delayMs = (wIdx * 4 + cIdx) * 24;

              const transformStyle = reducedMotion
                ? 'none'
                : isHovered
                ? 'translate3d(0, -10px, 42px) rotateX(-14deg) scale(1.1)'
                : isActive
                ? 'translate3d(0, 0px, 0px) rotateX(0deg) scale(1)'
                : 'translate3d(0, 48px, -65px) rotateX(45deg) scale(0.9)';

              return (
                <span
                  key={key}
                  onMouseEnter={() => setHoveredKey(key)}
                  onMouseLeave={() => setHoveredKey(null)}
                  style={{
                    transform: transformStyle,
                    opacity: reducedMotion || isActive ? 1 : 0.15,
                    transitionDelay: isHovered ? '0ms' : `${delayMs}ms`,
                    color: isHovered ? stage.accentHex : undefined,
                    textShadow: isHovered
                      ? `0 0 36px ${stage.accentHex}, 0 16px 40px rgba(0,0,0,0.9)`
                      : undefined,
                  }}
                  className="char-3d cursor-default"
                >
                  {char}
                </span>
              );
            })}
          </span>
        ))}
      </HeadingTag>

      {/* Plane +2 (Floating Luxury Editorial Subtitle in Deeper Z-Space) */}
      <p
        style={{
          transform: reducedMotion ? 'none' : 'translateZ(85px)',
          color: stage.accentHex,
          textShadow: '0 10px 30px rgba(0, 0, 0, 0.95)',
        }}
        className="mt-2 font-editorial italic font-medium text-[clamp(1.6rem,3vw,2.65rem)] leading-none tracking-wide"
      >
        {stage.subtitle}
      </p>
    </div>
  );
};
