import React, { useMemo } from 'react';
import { SessionState } from '../services/liveSession';
import { Sparkles, Mic, MicOff, Volume2 } from 'lucide-react';

interface MahiOrbProps {
  state: SessionState;
  userVolume: number;
  mahiVolume: number;
  isMuted: boolean;
  onOrbClick: () => void;
}

export const MahiOrb: React.FC<MahiOrbProps> = ({
  state,
  userVolume,
  mahiVolume,
  isMuted,
  onOrbClick,
}) => {
  // Compute dynamic scale and glow based on volume and state
  const activeVolume = state === 'speaking' ? mahiVolume : state === 'listening' ? userVolume : 0;
  const clampedVol = Math.min(Math.max(activeVolume, 0), 1);

  // Dynamic scale factor based on speech amplitude
  const dynamicScale = 1 + clampedVol * 0.45;
  const auraOpacity = 0.4 + clampedVol * 0.6;
  const glowBlur = 20 + clampedVol * 60;

  // Color scheme per state
  const stateTheme = useMemo(() => {
    switch (state) {
      case 'speaking':
        return {
          coreGradient: 'from-pink-500 via-rose-500 to-fuchsia-600',
          outerGlow: 'rgba(244, 63, 94, 0.75)',
          ringColor: 'border-pink-500/70',
          accent: '#ec4899',
          label: 'MAHI IS TALKING',
          subLabel: 'Witty banter incoming...',
        };
      case 'listening':
        return {
          coreGradient: isMuted
            ? 'from-amber-600 via-orange-600 to-rose-700'
            : 'from-cyan-400 via-teal-400 to-indigo-500',
          outerGlow: isMuted ? 'rgba(245, 158, 11, 0.4)' : 'rgba(6, 182, 212, 0.6)',
          ringColor: isMuted ? 'border-amber-500/40' : 'border-cyan-400/60',
          accent: isMuted ? '#f59e0b' : '#06b6d4',
          label: isMuted ? 'MIC MUTED' : 'LISTENING TO YOU',
          subLabel: isMuted ? 'Tap to unmute & talk' : "Speak naturally, Mahi's tuned in",
        };
      case 'connecting':
        return {
          coreGradient: 'from-violet-500 via-purple-600 to-pink-600',
          outerGlow: 'rgba(168, 85, 247, 0.6)',
          ringColor: 'border-violet-400/50',
          accent: '#a855f7',
          label: 'CONNECTING LIVE...',
          subLabel: 'Warming up the sass...',
        };
      case 'disconnected':
      default:
        return {
          coreGradient: 'from-zinc-800 via-neutral-900 to-rose-950/40',
          outerGlow: 'rgba(244, 63, 94, 0.25)',
          ringColor: 'border-rose-500/20',
          accent: '#f43f5e',
          label: 'MAHI IS SLEEPING',
          subLabel: 'Tap the orb or mic to ignite',
        };
    }
  }, [state, isMuted]);

  return (
    <div className="relative flex flex-col items-center justify-center my-auto w-full max-w-sm mx-auto select-none">
      {/* Outer Glow Halo */}
      <div
        className="absolute w-72 h-72 md:w-84 md:h-84 rounded-full transition-all duration-200 pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${stateTheme.outerGlow} 0%, rgba(0,0,0,0) 70%)`,
          transform: `scale(${dynamicScale * 1.15})`,
          opacity: auraOpacity,
          filter: `blur(${glowBlur}px)`,
        }}
      />

      {/* Orbiting Rotating Energy Rings */}
      <div className="relative w-64 h-64 md:w-76 md:h-76 flex items-center justify-center">
        {/* Ring 1 - Outer segmented ring */}
        <div
          className={`absolute inset-0 rounded-full border border-dashed ${stateTheme.ringColor} transition-transform duration-700 pointer-events-none ${
            state !== 'disconnected' ? 'animate-spin-slow' : 'opacity-30'
          }`}
          style={{
            transform: `scale(${dynamicScale * 1.08})`,
            boxShadow: state !== 'disconnected' ? `0 0 20px ${stateTheme.accent}33` : 'none',
          }}
        />

        {/* Ring 2 - Reverse rotating ring with orbital dots */}
        <div
          className={`absolute inset-3 rounded-full border border-dotted ${stateTheme.ringColor} transition-all duration-500 pointer-events-none ${
            state !== 'disconnected' ? 'animate-spin-reverse' : 'opacity-20'
          }`}
          style={{
            transform: `scale(${dynamicScale * 1.02})`,
          }}
        >
          {state !== 'disconnected' && (
            <>
              <div
                className="absolute -top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full shadow-lg"
                style={{ backgroundColor: stateTheme.accent, boxShadow: `0 0 10px ${stateTheme.accent}` }}
              />
              <div
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full shadow-lg opacity-70"
                style={{ backgroundColor: stateTheme.accent }}
              />
            </>
          )}
        </div>

        {/* Dynamic Audio Waves Ring (when speaking or listening) */}
        {state !== 'disconnected' && (
          <div
            className="absolute inset-6 rounded-full border transition-all duration-100 pointer-events-none"
            style={{
              borderColor: `${stateTheme.accent}55`,
              transform: `scale(${1 + clampedVol * 0.25})`,
              opacity: 0.5 + clampedVol * 0.5,
            }}
          />
        )}

        {/* The Central Glowing Orb Body */}
        <button
          onClick={onOrbClick}
          aria-label={stateTheme.label}
          className={`relative w-44 h-44 md:w-52 md:h-52 rounded-full bg-gradient-to-tr ${stateTheme.coreGradient} shadow-2xl transition-all duration-300 transform active:scale-95 flex items-center justify-center cursor-pointer group overflow-hidden focus:outline-none`}
          style={{
            boxShadow: `0 0 ${glowBlur * 1.2}px ${stateTheme.outerGlow}, inset 0 0 25px rgba(255,255,255,0.35)`,
            transform: `scale(${dynamicScale})`,
          }}
        >
          {/* Glass specular shine highlight */}
          <div className="absolute -top-6 -left-6 w-36 h-36 rounded-full bg-white/20 blur-md pointer-events-none transform -rotate-45" />

          {/* Shimmer overlay */}
          <div className="absolute inset-0 bg-radial from-white/10 via-transparent to-black/30 pointer-events-none" />

          {/* Center Iconography & State Feedback */}
          <div className="relative z-10 flex flex-col items-center justify-center text-white text-center p-4">
            {state === 'disconnected' && (
              <div className="flex flex-col items-center space-y-2 opacity-90 group-hover:opacity-100 transition-opacity">
                <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                  <Sparkles className="w-6 h-6 text-pink-300 animate-pulse" />
                </div>
                <span className="text-xs font-semibold tracking-wider uppercase text-rose-200/90 font-display">
                  Tap to Start
                </span>
              </div>
            )}

            {state === 'connecting' && (
              <div className="flex flex-col items-center space-y-2">
                <div className="w-10 h-10 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                <span className="text-[11px] font-medium tracking-widest uppercase text-violet-200 font-display">
                  Syncing
                </span>
              </div>
            )}

            {state === 'listening' && (
              <div className="flex flex-col items-center space-y-1.5">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    isMuted
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                      : 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/50'
                  }`}
                  style={{
                    transform: `scale(${1 + userVolume * 0.3})`,
                  }}
                >
                  {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </div>
                <span className="text-[11px] font-semibold tracking-widest uppercase text-cyan-100 font-display">
                  {isMuted ? 'Muted' : 'Listening'}
                </span>
              </div>
            )}

            {state === 'speaking' && (
              <div className="flex flex-col items-center space-y-1.5">
                <div
                  className="w-12 h-12 rounded-full bg-pink-500/25 flex items-center justify-center border border-pink-300/60 shadow-lg"
                  style={{
                    transform: `scale(${1 + mahiVolume * 0.4})`,
                  }}
                >
                  <Volume2 className="w-7 h-7 text-pink-100 animate-pulse" />
                </div>
                <span className="text-[11px] font-extrabold tracking-widest uppercase text-pink-100 font-display">
                  Mahi
                </span>
              </div>
            )}
          </div>
        </button>
      </div>

      {/* State Status Banner */}
      <div className="mt-7 text-center">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full glass-pill text-xs font-semibold tracking-wider font-display border border-white/10 shadow-sm">
          <span
            className="w-2 h-2 rounded-full animate-ping"
            style={{ backgroundColor: stateTheme.accent }}
          />
          <span style={{ color: stateTheme.accent }}>{stateTheme.label}</span>
        </div>
        <p className="text-xs text-zinc-400 mt-1.5 font-light tracking-wide">{stateTheme.subLabel}</p>
      </div>
    </div>
  );
};
