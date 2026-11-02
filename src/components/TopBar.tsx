import React from 'react';
import { soundEngine } from '../utils/soundEngine';

interface TopBarProps {
  activeStageIndex: number;
  onSelectStage: (index: number) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeStageIndex,
  onSelectStage,
}) => {
  // 3-Zone Top Bar Contract:
  // Zone 1: Brand Wordmark
  // Zone 2: 5 concise single-line region jumps (Sun, Inner Planets, Gas Giants, Outer Rim, Galaxies)
  // Zone 3: 1 primary action (Warp to Milky Way / Solar Origin)
  const navRegions = [
    { label: '01. The Sun', stageIndex: 0, range: [0, 0] },
    { label: 'Inner Worlds', stageIndex: 3, range: [1, 5] },
    { label: 'Gas Giants & Moons', stageIndex: 8, range: [6, 9] },
    { label: 'Ice Frontier', stageIndex: 11, range: [10, 12] },
    { label: 'Milky Way & Deep Space', stageIndex: 13, range: [13, 15] },
  ];

  const isDeepSpace = activeStageIndex >= 13;

  return (
    <header className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between gap-8 px-6 md:px-12 py-4 liquid-glass-panel border-t-0 border-x-0">
      {/* Zone 1: Single text element wordmark */}
      <a
        href="#stage-0"
        onClick={(e) => {
          e.preventDefault();
          soundEngine.playInteractionChime(1.0);
          onSelectStage(0);
        }}
        className="font-display text-lg font-extrabold tracking-widest text-white whitespace-nowrap shrink-0 hover:text-amber-300 transition-colors"
      >
        ASTRALIS COSMOS
      </a>

      {/* Zone 2: 5 Single-Line Navigation Links */}
      <nav aria-label="Cosmic Regions" className="hidden md:flex items-center gap-8 text-xs tracking-wider">
        {navRegions.map((region) => {
          const isCurrent =
            activeStageIndex >= region.range[0] && activeStageIndex <= region.range[1];

          return (
            <a
              key={region.label}
              href={`#stage-${region.stageIndex}`}
              onClick={(e) => {
                e.preventDefault();
                soundEngine.playHoverTick();
                onSelectStage(region.stageIndex);
              }}
              onMouseEnter={() => soundEngine.playHoverTick()}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 border-b ${
                isCurrent
                  ? 'text-white font-semibold border-sky-400'
                  : 'text-slate-400 hover:text-white border-transparent'
              }`}
            >
              {region.label}
            </a>
          );
        })}
      </nav>

      {/* Zone 3: 1 Primary Action */}
      <div className="flex items-center shrink-0">
        <button
          type="button"
          onClick={() => {
            soundEngine.playInteractionChime(1.2);
            onSelectStage(isDeepSpace ? 0 : 13);
          }}
          onMouseEnter={() => soundEngine.playHoverTick()}
          className="liquid-glass-pill px-4 py-2 text-xs font-semibold text-white rounded-full whitespace-nowrap shrink-0 cursor-pointer"
        >
          {isDeepSpace ? 'Return to Solar System' : 'Enter Milky Way'}
        </button>
      </div>
    </header>
  );
};
