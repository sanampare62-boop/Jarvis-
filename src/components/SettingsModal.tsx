import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Mic,
  ShieldAlert,
  ShieldCheck,
  Play,
  Square,
  Wifi,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Sliders,
  Settings as SettingsIcon,
  Info,
  Volume2,
  VolumeX,
  Globe,
  Gauge,
  Music
} from 'lucide-react';

interface SettingsModalProps {
  onClose: () => void;
  selectedVoice: string;
  onVoiceChange: (voice: string) => void;
  isListening: boolean;
  onStopListening: () => void;
  voiceSpeed?: number;
  onVoiceSpeedChange?: (speed: number) => void;
  voiceVolume?: number;
  onVoiceVolumeChange?: (vol: number) => void;
  voicePitch?: number;
  onVoicePitchChange?: (pitch: number) => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
  languagePreference?: string;
  onLanguageChange?: (lang: string) => void;
}

interface ApiTestResult {
  ok: boolean;
  model?: string;
  latencyMs?: number;
  message?: string;
  sampleOutput?: string;
  error?: string;
  errorType?: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  onClose,
  selectedVoice,
  onVoiceChange,
  isListening,
  onStopListening,
  voiceSpeed = 1.0,
  onVoiceSpeedChange,
  voiceVolume = 1.0,
  onVoiceVolumeChange,
  voicePitch = 1.0,
  onVoicePitchChange,
  isMuted = false,
  onToggleMute,
  languagePreference = 'hinglish_nepali',
  onLanguageChange,
}) => {
  const [activeTab, setActiveTab] = useState<'voice' | 'mic' | 'api' | 'about'>('voice');

  // Microphone Status & Test State
  const [micPermissionGranted, setMicPermissionGranted] = useState<boolean | null>(null);
  const [isTestingMic, setIsTestingMic] = useState<boolean>(false);
  const [micTestVolume, setMicTestVolume] = useState<number>(0);
  const [micTestDetails, setMicTestDetails] = useState<string | null>(null);
  const [micError, setMicError] = useState<string | null>(null);

  // Gemini API Connection State
  const [isTestingApi, setIsTestingApi] = useState<boolean>(false);
  const [apiResult, setApiResult] = useState<ApiTestResult | null>(null);
  const [serverHealth, setServerHealth] = useState<{ hasKey: boolean; model: string } | null>(null);

  // Voice Test State
  const [isTestingVoice, setIsTestingVoice] = useState<boolean>(false);
  const [voiceTestStatus, setVoiceTestStatus] = useState<string | null>(null);

  // Local Voice Settings (synchronized with props & localStorage)
  const [localSpeed, setLocalSpeed] = useState<number>(() => {
    const saved = localStorage.getItem('mahi_voice_speed');
    return saved ? parseFloat(saved) : voiceSpeed;
  });
  const [localVolume, setLocalVolume] = useState<number>(() => {
    const saved = localStorage.getItem('mahi_voice_volume');
    return saved ? parseFloat(saved) : voiceVolume;
  });
  const [localPitch, setLocalPitch] = useState<number>(() => {
    const saved = localStorage.getItem('mahi_voice_pitch');
    return saved ? parseFloat(saved) : voicePitch;
  });
  const [localLang, setLocalLang] = useState<string>(() => {
    return localStorage.getItem('mahi_language_preference') || languagePreference;
  });

  // Audio test refs
  const testStreamRef = useRef<MediaStream | null>(null);
  const testAudioCtxRef = useRef<AudioContext | null>(null);
  const testAnimFrameRef = useRef<number | null>(null);
  const voiceTestSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Check Android or Browser mic permission status on mount
  useEffect(() => {
    checkPermissionStatus();

    const handleAndroidMicChange = (e: any) => {
      const granted = e.detail?.granted;
      setMicPermissionGranted(granted);
      if (granted) {
        setMicError(null);
      }
    };
    window.addEventListener('micPermissionChanged', handleAndroidMicChange);

    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        setServerHealth({ hasKey: !!data.hasKey, model: data.model || 'gemini-3.8-live' });
      })
      .catch((err) => console.warn('Health check error:', err));

    return () => {
      window.removeEventListener('micPermissionChanged', handleAndroidMicChange);
      stopMicTest();
      stopVoiceTest();
    };
  }, []);

  const checkPermissionStatus = async () => {
    const androidBridge = (window as any).AndroidBridge;
    if (androidBridge && typeof androidBridge.hasMicrophonePermission === 'function') {
      const isGranted = androidBridge.hasMicrophonePermission();
      setMicPermissionGranted(isGranted);
      return;
    }

    if (navigator.permissions && navigator.permissions.query) {
      try {
        const status = await navigator.permissions.query({ name: 'microphone' as any });
        setMicPermissionGranted(status.state === 'granted');
        status.onchange = () => {
          setMicPermissionGranted(status.state === 'granted');
        };
      } catch {
        setMicPermissionGranted(null);
      }
    }
  };

  const handleRequestPermission = async () => {
    setMicError(null);
    const androidBridge = (window as any).AndroidBridge;

    if (androidBridge && typeof androidBridge.requestMicrophonePermission === 'function') {
      androidBridge.requestMicrophonePermission();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicPermissionGranted(true);
      stream.getTracks().forEach((t) => t.stop());
    } catch (err: any) {
      setMicPermissionGranted(false);
      setMicError(err?.message || 'Permission denied by user or browser.');
    }
  };

  const handleOpenAndroidSettings = () => {
    const androidBridge = (window as any).AndroidBridge;
    if (androidBridge && typeof androidBridge.openAppSettings === 'function') {
      androidBridge.openAppSettings();
    } else {
      alert('To enable microphone: Open Android Settings > Apps > JARVIS • MAHI > Permissions > Microphone > Allow.');
    }
  };

  const startMicTest = async () => {
    setMicError(null);
    setMicTestDetails(null);
    setIsTestingMic(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      testStreamRef.current = stream;
      setMicPermissionGranted(true);

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      testAudioCtxRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      setMicTestDetails('Microphone input is active! Speak to test volume meter.');

      const updateMeter = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const normalized = Math.min(100, Math.round((average / 255) * 160));
        setMicTestVolume(normalized);

        testAnimFrameRef.current = requestAnimationFrame(updateMeter);
      };

      updateMeter();
    } catch (err: any) {
      console.error('Mic test error:', err);
      setIsTestingMic(false);
      setMicPermissionGranted(false);
      setMicError(err?.message || 'Failed to initialize microphone for test.');
    }
  };

  const stopMicTest = () => {
    if (testAnimFrameRef.current) {
      cancelAnimationFrame(testAnimFrameRef.current);
      testAnimFrameRef.current = null;
    }
    if (testStreamRef.current) {
      testStreamRef.current.getTracks().forEach((track) => track.stop());
      testStreamRef.current = null;
    }
    if (testAudioCtxRef.current) {
      try {
        testAudioCtxRef.current.close();
      } catch {}
      testAudioCtxRef.current = null;
    }
    setIsTestingMic(false);
    setMicTestVolume(0);
  };

  const stopVoiceTest = () => {
    if (voiceTestSourceRef.current) {
      try {
        voiceTestSourceRef.current.stop();
        voiceTestSourceRef.current.disconnect();
      } catch {}
      voiceTestSourceRef.current = null;
    }
    if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    setIsTestingVoice(false);
    setVoiceTestStatus(null);
  };

  const runVoiceTest = async () => {
    stopVoiceTest();
    setIsTestingVoice(true);
    setVoiceTestStatus('Generating speech sample...');

    try {
      const res = await fetch('/api/tts/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voiceName: selectedVoice, language: localLang }),
      });

      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      if (!data.audio) throw new Error('No audio returned');

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();

      const binary = atob(data.audio);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      const decoded = await ctx.decodeAudioData(bytes.buffer);
      const source = ctx.createBufferSource();
      source.buffer = decoded;
      source.playbackRate.value = localSpeed;

      const gain = ctx.createGain();
      gain.gain.value = isMuted ? 0 : localVolume;

      source.connect(gain);
      gain.connect(ctx.destination);

      source.onended = () => {
        setIsTestingVoice(false);
        setVoiceTestStatus(null);
      };

      source.start(0);
      voiceTestSourceRef.current = source;
      setVoiceTestStatus(`"${data.sampleText || 'Speaking...'}"`);
    } catch (err: any) {
      console.warn('Backend TTS test failed, trying SpeechSynthesis fallback:', err);
      fallbackVoiceTest();
    }
  };

  const fallbackVoiceTest = () => {
    if (!('speechSynthesis' in window)) {
      setVoiceTestStatus('Speech synthesis is not supported on this browser.');
      setIsTestingVoice(false);
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const sampleText =
        localLang === 'nepali'
          ? 'जय श्री राम, Sanam! म MAHI हुँ, तपाईंको voice साथी। आज तपाईंलाई कस्तो छ? ❤️'
          : localLang === 'english'
          ? "Hello Sanam! I'm MAHI, your personal AI companion. Everything is ready for you! ❤️"
          : 'जय श्री राम, Sanam! Main hoon MAHI, aapki emotional companion. Kaise hain aap aaj? ❤️';

      const utterance = new SpeechSynthesisUtterance(sampleText);
      utterance.rate = localSpeed;
      utterance.pitch = localPitch;
      utterance.volume = isMuted ? 0 : localVolume;

      const voices = window.speechSynthesis.getVoices();
      const voiceMatch = voices.find(
        (v) => v.lang.includes('hi') || v.lang.includes('ne') || v.lang.includes('en-IN') || v.lang.includes('en')
      );
      if (voiceMatch) utterance.voice = voiceMatch;

      utterance.onstart = () => {
        setIsTestingVoice(true);
        setVoiceTestStatus(`"${sampleText}"`);
      };

      utterance.onend = () => {
        setIsTestingVoice(false);
        setVoiceTestStatus(null);
      };

      utterance.onerror = () => {
        setIsTestingVoice(false);
        setVoiceTestStatus(null);
      };

      window.speechSynthesis.speak(utterance);
    } catch {
      setIsTestingVoice(false);
      setVoiceTestStatus('Voice playback failed. Please check device sound.');
    }
  };

  const handleSpeedChange = (speed: number) => {
    setLocalSpeed(speed);
    localStorage.setItem('mahi_voice_speed', speed.toString());
    onVoiceSpeedChange?.(speed);
  };

  const handleVolumeChange = (vol: number) => {
    setLocalVolume(vol);
    localStorage.setItem('mahi_voice_volume', vol.toString());
    onVoiceVolumeChange?.(vol);
  };

  const handlePitchChange = (pitch: number) => {
    setLocalPitch(pitch);
    localStorage.setItem('mahi_voice_pitch', pitch.toString());
    onVoicePitchChange?.(pitch);
  };

  const handleLanguageChange = (lang: string) => {
    setLocalLang(lang);
    localStorage.setItem('mahi_language_preference', lang);
    onLanguageChange?.(lang);
  };

  const runApiTest = async () => {
    setIsTestingApi(true);
    setApiResult(null);

    try {
      const res = await fetch('/api/test-connection');
      const data = await res.json();
      setApiResult(data);
    } catch (err: any) {
      setApiResult({
        ok: false,
        errorType: 'NETWORK_ERROR',
        error: `Could not reach backend server: ${err?.message || 'Check network connection'}`,
      });
    } finally {
      setIsTestingApi(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md select-none font-display">
      <div className="relative w-full max-w-md bg-zinc-950 rounded-3xl border border-cyan-500/40 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
              <SettingsIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Voice &amp; System Settings</h3>
              <p className="text-[10px] text-cyan-400 font-mono">JARVIS • MAHI AI Companion</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopVoiceTest();
              stopMicTest();
              onClose();
            }}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 bg-black/40 text-xs font-semibold">
          {[
            { id: 'voice', label: 'Voice Engine', icon: Sliders },
            { id: 'mic', label: 'Microphone', icon: Mic },
            { id: 'api', label: 'Gemini API', icon: Sparkles },
            { id: 'about', label: 'About', icon: Info },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                  isActive
                    ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20 font-bold'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="text-[11px]">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs no-scrollbar">
          {/* TAB 1: VOICE ENGINE SETTINGS */}
          {activeTab === 'voice' && (
            <div className="space-y-4">
              {/* Persona Selector */}
              <div>
                <label className="text-zinc-300 font-bold text-xs flex items-center justify-between mb-2">
                  <span>Female Voice Persona:</span>
                  <span className="text-cyan-400 font-mono text-[10px]">Active: {selectedVoice}</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { name: 'Aoede', desc: 'Warm, soft & natural female voice (Recommended)' },
                    { name: 'Kore', desc: 'Calm, gentle & empathetic female voice' },
                    { name: 'Zephyr', desc: 'Bright, lively & cheerful female voice' },
                    { name: 'Leda', desc: 'Youthful, friendly & expressive female voice' },
                    { name: 'Charon', desc: 'Deep, calm, steady tone' },
                    { name: 'Puck', desc: 'Energetic, upbeat tone' },
                  ].map((v) => (
                    <button
                      key={v.name}
                      onClick={() => onVoiceChange(v.name)}
                      className={`p-2.5 rounded-2xl text-left border transition-all cursor-pointer ${
                        selectedVoice === v.name
                          ? 'bg-gradient-to-r from-cyan-600/30 to-blue-600/30 border-cyan-400 text-white shadow-lg shadow-cyan-500/20'
                          : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <div className="font-bold text-xs text-white">{v.name}</div>
                      <div className="text-[10px] text-zinc-400 leading-tight mt-0.5">{v.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Language Preference with Memory */}
              <div className="p-3.5 rounded-2xl glass-panel border border-cyan-500/30 bg-black/40 space-y-2">
                <label className="font-bold text-white text-xs flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Language Preference (Saved):</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'hinglish_nepali', label: '🇳🇵🇮🇳 Nepali + Hindi' },
                    { id: 'hindi', label: '🇮🇳 Hindi & Hinglish' },
                    { id: 'nepali', label: '🇳🇵 Authentic Nepali' },
                    { id: 'english', label: '🇬🇧 Fluent English' },
                  ].map((lang) => (
                    <button
                      key={lang.id}
                      onClick={() => handleLanguageChange(lang.id)}
                      className={`py-2 px-2.5 rounded-xl text-left text-xs font-semibold border transition-all cursor-pointer ${
                        localLang === lang.id
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                          : 'bg-white/5 border-white/10 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Speed Slider */}
              <div className="p-3.5 rounded-2xl glass-panel border border-white/10 bg-zinc-900/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Speaking Speed:</span>
                  </span>
                  <span className="text-cyan-300 font-mono font-bold text-xs">{localSpeed.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.75"
                  max="1.5"
                  step="0.05"
                  value={localSpeed}
                  onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <div className="flex justify-between gap-1 pt-1">
                  {[
                    { label: 'Gentle (0.85x)', val: 0.85 },
                    { label: 'Normal (1.0x)', val: 1.0 },
                    { label: 'Fast (1.25x)', val: 1.25 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => handleSpeedChange(preset.val)}
                      className={`flex-1 py-1 rounded-lg text-[10px] font-mono border transition-all ${
                        Math.abs(localSpeed - preset.val) < 0.03
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                          : 'bg-white/5 border-white/5 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Volume Slider & Mute Toggle */}
              <div className="p-3.5 rounded-2xl glass-panel border border-white/10 bg-zinc-900/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
                    <span>Voice Output Volume:</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-300 font-mono font-bold text-xs">{isMuted ? 'Muted' : `${Math.round(localVolume * 100)}%`}</span>
                    {onToggleMute && (
                      <button
                        onClick={onToggleMute}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all ${
                          isMuted ? 'bg-rose-500/20 border-rose-500 text-rose-300' : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {isMuted ? 'Unmute' : 'Mute'}
                      </button>
                    )}
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  disabled={isMuted}
                  value={isMuted ? 0 : localVolume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer disabled:opacity-40"
                />
              </div>

              {/* Pitch Slider (where supported) */}
              <div className="p-3.5 rounded-2xl glass-panel border border-white/10 bg-zinc-900/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Music className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Voice Pitch (Tone):</span>
                  </span>
                  <span className="text-cyan-300 font-mono font-bold text-xs">{localPitch.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.3"
                  step="0.05"
                  value={localPitch}
                  onChange={(e) => handlePitchChange(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Real-Time Voice Test Card */}
              <div className="p-4 rounded-2xl glass-panel border border-cyan-500/40 bg-gradient-to-r from-cyan-950/40 via-zinc-900/60 to-cyan-950/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                    <span>Test Voice Personality</span>
                  </span>
                  {isTestingVoice && (
                    <span className="text-[10px] text-cyan-300 font-mono font-bold animate-pulse">
                      SPEAKING...
                    </span>
                  )}
                </div>

                {voiceTestStatus && (
                  <p className="p-2.5 rounded-xl bg-black/40 border border-cyan-500/20 text-[11px] text-cyan-200 italic font-light leading-relaxed">
                    {voiceTestStatus}
                  </p>
                )}

                <div className="flex gap-2">
                  {!isTestingVoice ? (
                    <button
                      onClick={runVoiceTest}
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/30 cursor-pointer transition-all active:scale-95"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>Play Test Voice ({selectedVoice})</span>
                    </button>
                  ) : (
                    <button
                      onClick={stopVoiceTest}
                      className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 cursor-pointer transition-all"
                    >
                      <Square className="w-4 h-4 fill-current" />
                      <span>Stop Voice Test</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MICROPHONE */}
          {activeTab === 'mic' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl glass-panel border border-white/10 bg-zinc-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-300">Microphone Permission:</span>
                  <div className="flex items-center gap-1.5">
                    {micPermissionGranted === true ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-bold bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Granted</span>
                      </span>
                    ) : micPermissionGranted === false ? (
                      <span className="inline-flex items-center gap-1 text-rose-400 font-bold bg-rose-950/50 px-2 py-0.5 rounded-full border border-rose-500/30">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Denied</span>
                      </span>
                    ) : (
                      <span className="text-zinc-400 font-medium">Checking...</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                  <span>Live Assistant Status:</span>
                  <span className={isListening ? 'text-cyan-300 font-bold flex items-center gap-1' : 'text-zinc-500'}>
                    {isListening ? (
                      <>
                        <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
                        <span>Active Session</span>
                      </>
                    ) : (
                      'Idle / Standby'
                    )}
                  </span>
                </div>
              </div>

              {micError && (
                <div className="p-3 rounded-2xl bg-rose-950/80 border border-rose-500/60 text-rose-200 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold">Microphone Access Error</p>
                    <p className="text-[11px] text-rose-300">{micError}</p>
                  </div>
                </div>
              )}

              <div className="p-4 rounded-2xl glass-panel border border-cyan-500/30 bg-black/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Mic className="w-4 h-4 text-cyan-400" />
                    <span>Real-Time Mic Test</span>
                  </span>
                  {isTestingMic && (
                    <span className="text-[10px] font-mono text-cyan-300 animate-pulse font-bold">
                      INPUT LEVEL: {micTestVolume}%
                    </span>
                  )}
                </div>

                <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden border border-white/10 p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-pink-500 rounded-full transition-all duration-75"
                    style={{ width: `${isTestingMic ? Math.max(3, micTestVolume) : 0}%` }}
                  />
                </div>

                {micTestDetails && (
                  <p className="text-[10px] font-mono text-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{micTestDetails}</span>
                  </p>
                )}

                <div className="flex gap-2 pt-1">
                  {!isTestingMic ? (
                    <button
                      onClick={startMicTest}
                      className="flex-1 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Start Mic Test</span>
                    </button>
                  ) : (
                    <button
                      onClick={stopMicTest}
                      className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>Stop Test</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2 pt-1">
                {micPermissionGranted !== true && (
                  <button
                    onClick={handleRequestPermission}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold tracking-wide shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Mic className="w-4 h-4" />
                    <span>Grant Microphone Permission</span>
                  </button>
                )}

                <button
                  onClick={handleOpenAndroidSettings}
                  className="w-full py-2.5 rounded-xl glass-panel border border-white/10 hover:bg-white/5 text-zinc-300 hover:text-white font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <SettingsIcon className="w-4 h-4" />
                  <span>Open Android App Settings</span>
                </button>

                {isListening && (
                  <button
                    onClick={onStopListening}
                    className="w-full py-2.5 rounded-xl bg-rose-600/30 border border-rose-500 text-rose-200 hover:bg-rose-600/40 font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Square className="w-4 h-4 fill-current" />
                    <span>Stop Current Live Session</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: GEMINI API */}
          {activeTab === 'api' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl glass-panel border border-white/10 bg-zinc-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-300">Backend API Key:</span>
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-bold bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Configured in Server</span>
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                  <span>Speech-to-Speech Engine:</span>
                  <span className="text-cyan-300 font-mono font-bold">gemini-3.8-live</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl glass-panel border border-cyan-500/30 bg-black/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Wifi className="w-4 h-4 text-cyan-400" />
                    <span>Gemini API Health Check</span>
                  </span>
                  <button
                    onClick={runApiTest}
                    disabled={isTestingApi}
                    className="px-3 py-1 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${isTestingApi ? 'animate-spin' : ''}`} />
                    <span>{isTestingApi ? 'Testing...' : 'Test Connection'}</span>
                  </button>
                </div>

                {apiResult && (
                  <div
                    className={`p-3 rounded-xl border text-[11px] space-y-1.5 ${
                      apiResult.ok
                        ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                        : 'bg-rose-950/50 border-rose-500/40 text-rose-200'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span>{apiResult.ok ? 'Connection Verified' : 'Test Failed'}</span>
                      {apiResult.latencyMs && (
                        <span className="font-mono text-[10px]">{apiResult.latencyMs}ms</span>
                      )}
                    </div>
                    <p>{apiResult.ok ? apiResult.message : apiResult.error}</p>
                    {apiResult.sampleOutput && (
                      <p className="text-[10px] text-zinc-400 italic font-mono">
                        Response: "{apiResult.sampleOutput}"
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: ABOUT */}
          {activeTab === 'about' && (
            <div className="space-y-3 text-center py-2">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-cyan-500 to-blue-600 mx-auto flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div>
                <h4 className="font-extrabold text-base text-white">JARVIS • MAHI</h4>
                <p className="text-xs text-cyan-400 font-mono">Version 10.0 • Ultra-Realistic Voice Engine</p>
              </div>
              <p className="text-xs text-zinc-300 font-medium">Created with AI for Sanam</p>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-[11px] text-zinc-400 text-left space-y-1">
                <div><strong>Home:</strong> Sakraul, Sarlahi, Nepal (NPT UTC+5:45)</div>
                <div><strong>Live Model:</strong> gemini-3.8-live (Native Audio)</div>
                <div><strong>TTS Model:</strong> gemini-3.8-flash-lite-tts</div>
                <div><strong>Persona:</strong> Warm, gentle, expressive female voice</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/10 bg-zinc-900/60 flex justify-end">
          <button
            onClick={() => {
              stopVoiceTest();
              stopMicTest();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs cursor-pointer shadow-md"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
