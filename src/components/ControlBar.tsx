import React from 'react';
import { SessionState } from '../services/liveSession';
import { Mic, MicOff, PhoneCall, PhoneOff, Hand, Volume2 } from 'lucide-react';

interface ControlBarProps {
  state: SessionState;
  isMuted: boolean;
  userVolume: number;
  mahiVolume: number;
  onToggleSession: () => void;
  onToggleMute: () => void;
  onInterrupt: () => void;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  state,
  isMuted,
  userVolume,
  mahiVolume,
  onToggleSession,
  onToggleMute,
  onInterrupt,
}) => {
  const isLive = state === 'listening' || state === 'speaking';
  const isConnecting = state === 'connecting';

  return (
    <div className="w-full max-w-sm mx-auto px-4 pb-6 pt-2 flex flex-col items-center">
      {/* Dynamic Voice Level Bar when Live */}
      {isLive && (
        <div className="w-full max-w-xs mb-4 flex items-center justify-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-75 rounded-full ${
                state === 'speaking' ? 'bg-pink-500' : 'bg-cyan-400'
              }`}
              style={{
                width: `${Math.min(100, (state === 'speaking' ? mahiVolume : userVolume) * 220)}%`,
              }}
            />
          </div>
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
            {state === 'speaking' ? 'Output' : isMuted ? 'Muted' : 'Mic In'}
          </span>
        </div>
      )}

      {/* Main Control Actions */}
      <div className="flex items-center justify-center gap-6 w-full">
        {/* Left Action: Mic Mute / Unmute (only visible when connected) */}
        {isLive ? (
          <button
            onClick={onToggleMute}
            aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all transform active:scale-90 cursor-pointer ${
              isMuted
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-lg shadow-amber-500/20'
                : 'glass-panel text-zinc-300 hover:text-white hover:border-zinc-500'
            }`}
            title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
        ) : (
          <div className="w-12 h-12 opacity-0 pointer-events-none" />
        )}

        {/* Central Prominent Mic / Power Button */}
        <div className="relative flex items-center justify-center">
          {/* Outer Pulsing Ring */}
          {isLive && (
            <div
              className={`absolute -inset-2.5 rounded-full opacity-60 animate-ping pointer-events-none ${
                state === 'speaking' ? 'bg-pink-500/30' : 'bg-cyan-500/30'
              }`}
            />
          )}

          <button
            onClick={onToggleSession}
            disabled={isConnecting}
            aria-label={isLive ? 'End Voice Call' : 'Start Voice Call'}
            className={`relative w-20 h-20 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all duration-300 transform active:scale-95 cursor-pointer z-10 ${
              isLive
                ? 'bg-gradient-to-tr from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-rose-600/40 border border-rose-400/50'
                : isConnecting
                ? 'bg-zinc-800 text-zinc-400 border border-zinc-700 cursor-wait'
                : 'bg-gradient-to-tr from-pink-600 via-rose-600 to-violet-600 hover:from-pink-500 hover:to-rose-500 text-white shadow-pink-600/50 border border-pink-400/60'
            }`}
          >
            {isConnecting ? (
              <div className="w-7 h-7 border-3 border-white/20 border-t-white rounded-full animate-spin" />
            ) : isLive ? (
              <>
                <PhoneOff className="w-7 h-7" />
                <span className="text-[9px] font-bold tracking-wider uppercase font-display mt-0.5">
                  End Call
                </span>
              </>
            ) : (
              <>
                <PhoneCall className="w-7 h-7 animate-pulse" />
                <span className="text-[9px] font-extrabold tracking-wider uppercase font-display mt-0.5">
                  Talk
                </span>
              </>
            )}
          </button>
        </div>

        {/* Right Action: Interrupt button (when speaking) or status */}
        {isLive ? (
          <button
            onClick={onInterrupt}
            aria-label="Interrupt Mahi"
            className="w-12 h-12 rounded-2xl glass-panel text-zinc-300 hover:text-pink-300 hover:border-pink-500/40 flex flex-col items-center justify-center transition-all transform active:scale-90 cursor-pointer"
            title="Interrupt / Stop Mahi talking"
          >
            <Hand className="w-5 h-5" />
            <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-400 mt-0.5">
              Cut In
            </span>
          </button>
        ) : (
          <div className="w-12 h-12 opacity-0 pointer-events-none" />
        )}
      </div>

      <div className="mt-3 text-center">
        <span className="text-[11px] text-zinc-500 font-medium">
          {state === 'disconnected'
            ? 'Tap Talk to call Mahi directly'
            : state === 'connecting'
            ? 'Establishing Gemini Live session...'
            : isMuted
            ? 'Microphone is currently muted'
            : 'Voice active • Speak anytime to interrupt'}
        </span>
      </div>
    </div>
  );
};
