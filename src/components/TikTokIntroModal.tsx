import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, RotateCcw, AlertCircle, Heart, Share2, MessageCircle, X, Video, RefreshCw, Volume2 } from 'lucide-react';
import mahiAvatarImg from '../assets/images/mahi_avatar_hud_1791944268688.jpg';

interface TikTokIntroModalProps {
  onClose: () => void;
  selectedVoice?: string;
}

const INTRO_LINES = [
  "Hello everyone! Namaste! Main hoon MAHI, Sanam ka AI Assistant!",
  "Mujhe Sanam ne design aur develop kiya hai.",
  "Mera futuristic interface aur AI voice features meri pehchaan hain.",
  "Agar aapko bhi aisa AI Assistant chahiye, to video ko LIKE karein, comment mein MAHI likhein, aur Sanam ko support karein!",
  "Thank you, everyone! See you soon!"
];

const FULL_SCRIPT = INTRO_LINES.join(' ');

export const TikTokIntroModal: React.FC<TikTokIntroModalProps> = ({ onClose, selectedVoice = 'Aoede' }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [waveformLevels, setWaveformLevels] = useState<number[]>([10, 15, 20, 15, 25, 18, 12, 16, 22]);

  // Audio nodes and references
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const subtitleIntervalRef = useRef<any>(null);
  const playbackStartTimeRef = useRef<number>(0);
  const pauseOffsetRef = useRef<number>(0);

  // Initialize or resume AudioContext
  const getOrCreateAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioContextClass();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  // Convert base64 to ArrayBuffer
  const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  };

  // Waveform render loop
  const startWaveformLoop = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    const updateWaveform = () => {
      if (analyserRef.current && isPlaying && !isPaused) {
        const data = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(data);
        const bars: number[] = [];
        const step = Math.floor(data.length / 9);
        for (let i = 0; i < 9; i++) {
          const val = data[i * step] || 0;
          bars.push(Math.max(6, Math.min(38, (val / 255) * 40)));
        }
        setWaveformLevels(bars);
      } else if (isPlaying && !isPaused) {
        // Simulated responsive wave if fallback is used
        const t = Date.now() * 0.005;
        setWaveformLevels([
          Math.sin(t + 0) * 12 + 18,
          Math.sin(t + 1) * 14 + 20,
          Math.sin(t + 2) * 16 + 22,
          Math.sin(t + 3) * 18 + 24,
          Math.sin(t + 4) * 20 + 26,
          Math.sin(t + 5) * 18 + 24,
          Math.sin(t + 6) * 16 + 22,
          Math.sin(t + 7) * 14 + 20,
          Math.sin(t + 8) * 12 + 18,
        ]);
      } else {
        setWaveformLevels([6, 6, 6, 6, 6, 6, 6, 6, 6]);
      }
      animFrameRef.current = requestAnimationFrame(updateWaveform);
    };

    animFrameRef.current = requestAnimationFrame(updateWaveform);
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopPlayback();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioCtxRef.current) {
        try {
          audioCtxRef.current.close();
        } catch {}
      }
    };
  }, []);

  const stopPlayback = () => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      } catch {}
      sourceNodeRef.current = null;
    }
    if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    if (subtitleIntervalRef.current) {
      clearInterval(subtitleIntervalRef.current);
      subtitleIntervalRef.current = null;
    }
    setIsPlaying(false);
    setIsPaused(false);
    setIsLoading(false);
    pauseOffsetRef.current = 0;
  };

  const startSubtitleProgression = (totalDurationSec: number) => {
    if (subtitleIntervalRef.current) clearInterval(subtitleIntervalRef.current);
    const lineCount = INTRO_LINES.length;
    const stepDurationMs = Math.max(1200, (totalDurationSec * 1000) / lineCount);

    subtitleIntervalRef.current = setInterval(() => {
      setCurrentSentenceIndex((prev) => {
        if (prev < lineCount - 1) return prev + 1;
        clearInterval(subtitleIntervalRef.current);
        return prev;
      });
    }, stepDurationMs);
  };

  const playDecodedBuffer = (buffer: AudioBuffer, offsetSec: number = 0) => {
    const ctx = getOrCreateAudioContext();

    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      } catch {}
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 64;
    analyserRef.current = analyser;

    source.connect(analyser);
    analyser.connect(ctx.destination);

    sourceNodeRef.current = source;
    playbackStartTimeRef.current = ctx.currentTime - offsetSec;

    source.onended = () => {
      if (!isPaused) {
        setIsPlaying(false);
        setIsPaused(false);
        pauseOffsetRef.current = 0;
        setCurrentSentenceIndex(INTRO_LINES.length - 1);
        if (subtitleIntervalRef.current) clearInterval(subtitleIntervalRef.current);
      }
    };

    source.start(0, offsetSec);
    setIsPlaying(true);
    setIsPaused(false);
    setIsLoading(false);

    const remainingDuration = Math.max(1, buffer.duration - offsetSec);
    startSubtitleProgression(remainingDuration);
    startWaveformLoop();
  };

  // Reusable speakIntroduction function
  const speakIntroduction = async () => {
    setErrorMsg(null);
    setIsLoading(true);
    setCurrentSentenceIndex(0);

    const ctx = getOrCreateAudioContext();

    // If audio buffer is already cached in memory on client, replay directly
    if (audioBufferRef.current) {
      playDecodedBuffer(audioBufferRef.current, 0);
      return;
    }

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: FULL_SCRIPT, voiceName: selectedVoice }),
      });

      if (!res.ok) {
        throw new Error(`TTS server responded with status ${res.status}`);
      }

      const data = await res.json();
      if (!data.audio) {
        throw new Error('No audio returned from TTS service');
      }

      const arrayBuffer = base64ToArrayBuffer(data.audio);
      const decodedBuffer = await ctx.decodeAudioData(arrayBuffer);
      audioBufferRef.current = decodedBuffer;

      playDecodedBuffer(decodedBuffer, 0);
    } catch (err: any) {
      console.warn('Server TTS failed, activating fallback speech synthesis:', err);
      fallbackSpeechSynthesis();
    }
  };

  // Fallback to browser SpeechSynthesis
  const fallbackSpeechSynthesis = () => {
    setIsLoading(false);
    if (!('speechSynthesis' in window)) {
      setErrorMsg('Audio playback failed and speech synthesis is unsupported in this browser.');
      setIsPlaying(false);
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(FULL_SCRIPT);
      utterance.rate = 1.0;
      utterance.pitch = 1.1;

      const voices = window.speechSynthesis.getVoices();
      const hindiOrEnglishVoice = voices.find(
        (v) => v.lang.includes('hi') || v.lang.includes('en-IN') || v.lang.includes('en')
      );
      if (hindiOrEnglishVoice) {
        utterance.voice = hindiOrEnglishVoice;
      }

      utterance.onstart = () => {
        setIsPlaying(true);
        setIsPaused(false);
        startSubtitleProgression(18);
        startWaveformLoop();
      };

      utterance.onend = () => {
        setIsPlaying(false);
        setIsPaused(false);
        setCurrentSentenceIndex(INTRO_LINES.length - 1);
        if (subtitleIntervalRef.current) clearInterval(subtitleIntervalRef.current);
      };

      utterance.onerror = (e: SpeechSynthesisErrorEvent) => {
        // Do not treat user cancellation or interruption as a failure
        if (e.error === 'canceled' || e.error === 'interrupted') {
          return;
        }
        console.error('Speech synthesis error details:', e.error);
        setErrorMsg('Speech playback was interrupted. Tap Retry to play again.');
        setIsPlaying(false);
      };

      window.speechSynthesis.speak(utterance);
    } catch (fallbackErr: any) {
      console.error('Speech synthesis exception:', fallbackErr);
      setErrorMsg('Audio playback failed. Please check sound settings.');
      setIsPlaying(false);
    }
  };

  const handlePlayOrResume = () => {
    getOrCreateAudioContext();

    if (isPaused && audioBufferRef.current && audioCtxRef.current) {
      playDecodedBuffer(audioBufferRef.current, pauseOffsetRef.current);
      return;
    }

    if (isPaused && 'speechSynthesis' in window && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPlaying(true);
      setIsPaused(false);
      startWaveformLoop();
      return;
    }

    stopPlayback();
    speakIntroduction();
  };

  const handlePause = () => {
    if (sourceNodeRef.current && audioCtxRef.current) {
      pauseOffsetRef.current = audioCtxRef.current.currentTime - playbackStartTimeRef.current;
      try {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      } catch {}
      sourceNodeRef.current = null;
    }
    if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
    }
    if (subtitleIntervalRef.current) {
      clearInterval(subtitleIntervalRef.current);
    }
    setIsPlaying(false);
    setIsPaused(true);
  };

  const handleStop = () => {
    stopPlayback();
    setCurrentSentenceIndex(0);
    setWaveformLevels([6, 6, 6, 6, 6, 6, 6, 6, 6]);
  };

  const handleRetry = () => {
    stopPlayback();
    audioBufferRef.current = null; // force fresh generation
    speakIntroduction();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/90 backdrop-blur-xl select-none">
      {/* Vertical 9:16 TikTok / Reels Recording Frame */}
      <div className="relative w-full max-w-[360px] h-[720px] bg-[#05050c] rounded-[40px] border-4 border-cyan-500/50 shadow-[0_0_80px_rgba(6,182,212,0.4)] overflow-hidden flex flex-col justify-between">
        
        {/* Top Header */}
        <div className="relative z-30 p-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-pink-400 animate-pulse" />
            <span className="text-xs font-bold text-white font-mono tracking-wider">TikTok Creator Mode</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-2 py-0.5 rounded-full bg-cyan-950/70 border border-cyan-500/40 text-[9px] font-mono text-cyan-300 font-bold">
              {isLoading ? 'LOADING AUDIO...' : isPlaying ? 'SPEAKING' : isPaused ? 'PAUSED' : 'STANDBY'}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Central Character & Subtitle Viewport */}
        <div className="relative flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div
            className={`relative w-48 h-56 rounded-3xl overflow-hidden glass-panel border-2 border-cyan-400 shadow-2xl shadow-cyan-500/55 transition-transform duration-300 ${
              isPlaying ? 'scale-105' : 'scale-100'
            }`}
          >
            <img
              src={mahiAvatarImg || '/mahi_avatar.jpg'}
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.endsWith('/mahi_avatar.jpg')) {
                  target.src = '/mahi_avatar.jpg';
                }
              }}
              alt="Mahi TikTok Intro"
              className={`w-full h-full object-cover object-center ${isPlaying ? 'animate-pulse-slow' : ''}`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

            {isPlaying && (
              <div className="absolute inset-0 border-3 border-cyan-300 rounded-3xl animate-ping opacity-60 pointer-events-none" />
            )}
          </div>

          {/* Synchronized Subtitles */}
          <div className="mt-6 p-4 rounded-2xl glass-panel bg-black/80 border border-cyan-500/40 min-h-[96px] flex items-center justify-center shadow-xl w-full">
            <p className="text-sm font-bold text-cyan-100 leading-snug font-display">
              "{INTRO_LINES[currentSentenceIndex]}"
            </p>
          </div>

          {/* Error Banner with Retry */}
          {errorMsg && (
            <div className="mt-2.5 p-2 rounded-xl bg-rose-950/85 border border-rose-500 text-[10px] text-rose-200 flex items-center justify-between w-full">
              <div className="flex items-center gap-1.5 overflow-hidden">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                <span className="truncate">{errorMsg}</span>
              </div>
              <button
                onClick={handleRetry}
                className="ml-2 px-2 py-0.5 rounded bg-rose-800 text-white font-bold flex-shrink-0"
              >
                Retry
              </button>
            </div>
          )}

          {/* Real-Time Audio Frequency Waveform Animation */}
          <div className="flex items-end justify-center gap-1.5 mt-4 h-10 w-full px-4">
            {waveformLevels.map((h, i) => (
              <span
                key={i}
                className={`w-1.5 rounded-full transition-all duration-75 ${
                  isPlaying ? 'bg-gradient-to-t from-cyan-500 to-pink-500' : 'bg-zinc-600'
                }`}
                style={{ height: `${h}px` }}
              />
            ))}
          </div>
        </div>

        {/* TikTok Overlay Social Buttons */}
        <div className="absolute right-3 bottom-32 z-30 flex flex-col gap-4 items-center">
          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full bg-pink-600/80 flex items-center justify-center shadow-lg text-white">
              <Heart className="w-5 h-5 fill-current" />
            </div>
            <span className="text-[10px] font-bold text-white">12.5K</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full bg-cyan-600/80 flex items-center justify-center shadow-lg text-white">
              <MessageCircle className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-white">MAHI</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full bg-purple-600/80 flex items-center justify-center shadow-lg text-white">
              <Share2 className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-white">Share</span>
          </div>
        </div>

        {/* Bottom Playback Control Bar */}
        <div className="relative z-30 p-4 bg-black/90 backdrop-blur-xl flex items-center justify-center gap-3 border-t border-white/10">
          {!isPlaying && !isPaused ? (
            <button
              onClick={handlePlayOrResume}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-pink-600 to-cyan-600 text-white text-xs font-bold shadow-lg shadow-pink-600/40 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Play Intro</span>
                </>
              )}
            </button>
          ) : isPlaying ? (
            <button
              onClick={handlePause}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-600/40 cursor-pointer"
            >
              <Pause className="w-4 h-4" />
              <span>Pause</span>
            </button>
          ) : (
            <button
              onClick={handlePlayOrResume}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/40 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Resume</span>
            </button>
          )}

          <button
            onClick={handleStop}
            className="p-2.5 rounded-2xl glass-panel border border-white/10 text-zinc-300 hover:text-white cursor-pointer"
            title="Stop"
          >
            <Square className="w-4 h-4 fill-current" />
          </button>

          <button
            onClick={handleRetry}
            className="p-2.5 rounded-2xl glass-panel border border-white/10 text-cyan-300 hover:text-white cursor-pointer"
            title="Replay / Retry"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
