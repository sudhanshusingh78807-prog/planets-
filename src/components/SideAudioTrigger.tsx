import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';

interface SideAudioTriggerProps {
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const SideAudioTrigger: React.FC<SideAudioTriggerProps> = ({
  soundEnabled,
  onToggleSound,
}) => {
  return (
    <div className="fixed right-6 bottom-7 z-40">
      <button
        type="button"
        onClick={onToggleSound}
        onMouseEnter={() => soundEngine.playHoverTick()}
        aria-label={soundEnabled ? 'Mute Cosmic Soundscape' : 'Enable Cosmic Soundscape'}
        className="liquid-glass-pill flex items-center gap-3 px-4 py-2.5 rounded-full text-xs font-medium text-white cursor-pointer group"
      >
        <div className="flex items-end gap-[3px] h-3.5 w-4">
          <span
            className={`w-[2.5px] bg-sky-400 rounded-full origin-bottom transition-transform duration-300 ${
              soundEnabled ? 'h-3.5 animate-eq-1' : 'h-1'
            }`}
          />
          <span
            className={`w-[2.5px] bg-indigo-400 rounded-full origin-bottom transition-transform duration-300 ${
              soundEnabled ? 'h-3.5 animate-eq-2' : 'h-1.5'
            }`}
          />
          <span
            className={`w-[2.5px] bg-amber-300 rounded-full origin-bottom transition-transform duration-300 ${
              soundEnabled ? 'h-3.5 animate-eq-3' : 'h-1'
            }`}
          />
          <span
            className={`w-[2.5px] bg-purple-400 rounded-full origin-bottom transition-transform duration-300 ${
              soundEnabled ? 'h-3.5 animate-eq-4' : 'h-1.5'
            }`}
          />
        </div>

        <span className="font-mono-tabular text-[11px] tracking-wider uppercase whitespace-nowrap">
          {soundEnabled ? 'Sound On' : 'Sound Off'}
        </span>

        {soundEnabled ? (
          <Volume2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
        ) : (
          <VolumeX className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors shrink-0" />
        )}
      </button>
    </div>
  );
};
