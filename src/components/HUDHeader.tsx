import React, { useState, useEffect } from 'react';
import { SessionState } from '../services/liveSession';
import { Sparkles, Info, Radio, Volume2, ShieldCheck, X } from 'lucide-react';

interface HUDHeaderProps {
  state: SessionState;
  selectedVoice: string;
  onVoiceChange: (voice: string) => void;
}

export const HUDHeader: React.FC<HUDHeaderProps> = ({
  state,
  selectedVoice,
  onVoiceChange,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showVoiceMenu, setShowVoiceMenu] = useState(false);

  useEffect(() => {
    let timer: any = null;
    if (state !== 'disconnected') {
      timer = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [state]);

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <header className="relative z-30 w-full px-4 pt-4 pb-2 flex items-center justify-between">
        {/* Brand Logo & Slogan */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-500 via-rose-500 to-violet-600 shadow-md shadow-pink-500/30">
            <Sparkles className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              {state !== 'disconnected' && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              )}
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  state !== 'disconnected' ? 'bg-cyan-400' : 'bg-zinc-600'
                }`}
              />
            </span>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-display font-extrabold text-lg tracking-wider text-white bg-clip-text text-transparent bg-gradient-to-r from-white via-pink-100 to-pink-400">
                MAHI
              </h1>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 font-semibold border border-pink-500/30 tracking-wider">
                SASSY AI
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 tracking-wide font-light hidden sm:block">
              Voice-to-Voice • Gemini Live 3.1
            </p>
          </div>
        </div>

        {/* Center Live Session Timer */}
        <div className="flex items-center gap-2">
          {state !== 'disconnected' ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-mono font-medium shadow-inner">
              <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              <span>{formatTimer(elapsedSeconds)}</span>
              <span className="text-[9px] uppercase tracking-wider text-rose-400 font-bold ml-1">
                LIVE
              </span>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full glass-panel text-zinc-500 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-zinc-600" />
              <span>STANDBY</span>
            </div>
          )}
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Voice Persona Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowVoiceMenu(!showVoiceMenu)}
              className="px-2.5 py-1.5 rounded-xl glass-panel text-xs font-medium text-zinc-300 hover:text-white flex items-center gap-1.5 hover:border-pink-500/40 transition-colors"
              title="Voice Persona"
            >
              <Volume2 className="w-3.5 h-3.5 text-pink-400" />
              <span className="hidden md:inline font-display">{selectedVoice}</span>
            </button>

            {showVoiceMenu && (
              <div className="absolute right-0 mt-2 w-48 p-2 rounded-2xl glass-panel bg-zinc-900/95 border border-zinc-700 shadow-2xl z-50">
                <p className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase px-2 py-1 font-display">
                  Sassy Voice Tone
                </p>
                <button
                  onClick={() => {
                    onVoiceChange('Aoede');
                    setShowVoiceMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs flex flex-col transition-colors ${
                    selectedVoice === 'Aoede'
                      ? 'bg-pink-500/20 text-pink-200 border border-pink-500/40'
                      : 'text-zinc-300 hover:bg-white/5'
                  }`}
                >
                  <span className="font-bold flex items-center justify-between">
                    Aoede
                    <span className="text-[9px] px-1 rounded bg-pink-500/30 text-pink-300">Default</span>
                  </span>
                  <span className="text-[10px] text-zinc-400">Playful, confident, sassy diva</span>
                </button>

                <button
                  onClick={() => {
                    onVoiceChange('Kore');
                    setShowVoiceMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs flex flex-col transition-colors mt-1 ${
                    selectedVoice === 'Kore'
                      ? 'bg-pink-500/20 text-pink-200 border border-pink-500/40'
                      : 'text-zinc-300 hover:bg-white/5'
                  }`}
                >
                  <span className="font-bold">Kore</span>
                  <span className="text-[10px] text-zinc-400">Youthful, breezy best friend</span>
                </button>

                <button
                  onClick={() => {
                    onVoiceChange('Zephyr');
                    setShowVoiceMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs flex flex-col transition-colors mt-1 ${
                    selectedVoice === 'Zephyr'
                      ? 'bg-pink-500/20 text-pink-200 border border-pink-500/40'
                      : 'text-zinc-300 hover:bg-white/5'
                  }`}
                >
                  <span className="font-bold">Zephyr</span>
                  <span className="text-[10px] text-zinc-400">Calm, witty & sarcastic</span>
                </button>
              </div>
            )}
          </div>

          {/* Info Modal Button */}
          <button
            onClick={() => setShowInfoModal(true)}
            className="p-2 rounded-xl glass-panel text-zinc-400 hover:text-white transition-colors"
            title="About Mahi"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Info / About Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md p-6 rounded-3xl glass-panel bg-zinc-950/95 border border-pink-500/30 shadow-2xl text-left">
            <button
              onClick={() => setShowInfoModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-violet-600 flex items-center justify-center shadow-lg shadow-pink-500/30">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-white">Meet Mahi</h3>
                <p className="text-xs text-pink-400">Your Sassy Voice AI Companion</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-zinc-300 leading-relaxed font-light">
              <p>
                Mahi is an audio-to-audio real-time AI powered by{' '}
                <strong className="text-white font-semibold">Gemini Live</strong>. There are no text
                chat boxes — you simply talk to her like a close, witty girlfriend on a phone call.
              </p>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center gap-2 text-pink-300 font-semibold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Sassy Personality</span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Confident, funny, slightly teasing, and never boring. She loves giving bold advice,
                  roasting procrastination, and hyping you up.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center gap-2 text-cyan-300 font-semibold">
                  <Radio className="w-4 h-4" />
                  <span>Voice Actions & Tool Calling</span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Ask Mahi: <em>"Hey Mahi, open Spotify for late night tracks"</em> or{' '}
                  <em>"Can you open YouTube for workout music?"</em> and she will trigger browser actions
                  instantly during the call!
                </p>
              </div>

              <div className="text-[11px] text-zinc-500 pt-1">
                Audio specifications: 16kHz PCM input • 24kHz HD Audio output • Full duplex streaming.
              </div>
            </div>

            <button
              onClick={() => setShowInfoModal(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-semibold text-xs tracking-wide shadow-lg shadow-pink-600/30 cursor-pointer"
            >
              Got It, Let's Banter!
            </button>
          </div>
        </div>
      )}
    </>
  );
};
