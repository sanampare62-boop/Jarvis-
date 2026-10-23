import React, { useState, useEffect, useRef } from 'react';
import { SessionState } from '../services/liveSession';
import * as THREE from 'three';
import { ChatModule } from './ChatModule';
import { MissionsModule } from './MissionsModule';
import { TikTokIntroModal } from './TikTokIntroModal';
import { SettingsModal } from './SettingsModal';
import mahiAvatarImg from '../assets/images/mahi_avatar_hud_1791944268688.jpg';
import {
  MessageSquare,
  Mic,
  Info,
  Compass,
  Film,
  Calendar,
  Home,
  MoreHorizontal,
  Smile,
  Shield,
  Frown,
  Sparkles,
  Heart,
  Zap,
  Settings,
  X,
  Volume2,
  PhoneOff,
  Radio,
  Share2,
  SlidersHorizontal,
  Calculator,
  CloudSun,
  Video,
  Smartphone,
  Square
} from 'lucide-react';

interface MahiCharacterHUDProps {
  state: SessionState;
  isMuted: boolean;
  userVolume: number;
  mahiVolume: number;
  selectedVoice: string;
  onToggleSession: () => void;
  onToggleMute: () => void;
  onInterrupt: () => void;
  onVoiceChange: (voice: string) => void;
  onTriggerPrompt: (promptText: string) => void;
  onToggleLayout?: () => void;
  voiceSpeed?: number;
  onVoiceSpeedChange?: (speed: number) => void;
  voiceVolume?: number;
  onVoiceVolumeChange?: (vol: number) => void;
  voicePitch?: number;
  onVoicePitchChange?: (pitch: number) => void;
  languagePreference?: string;
  onLanguageChange?: (lang: string) => void;
}

export const MahiCharacterHUD: React.FC<MahiCharacterHUDProps> = ({
  state,
  isMuted,
  userVolume,
  mahiVolume,
  selectedVoice,
  onToggleSession,
  onToggleMute,
  onInterrupt,
  onVoiceChange,
  onTriggerPrompt,
  onToggleLayout,
  voiceSpeed = 1.0,
  onVoiceSpeedChange,
  voiceVolume = 1.0,
  onVoiceVolumeChange,
  voicePitch = 1.0,
  onVoicePitchChange,
  languagePreference = 'hinglish_nepali',
  onLanguageChange,
}) => {
  const [activeExpression, setActiveExpression] = useState<'Happy' | 'Serious' | 'Sad' | 'Playful' | 'Caring' | 'Excited'>('Happy');
  const [activeTab, setActiveTab] = useState<string>('Voice Engine');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showTikTokModal, setShowTikTokModal] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const [calcInput, setCalcInput] = useState('25 * 4');
  const [calcResult, setCalcResult] = useState('100');

  const [speakingSpeed, setSpeakingSpeed] = useState<number>(1.0);
  const [expressiveness, setExpressiveness] = useState<number>(0.85);
  const [emotionalIntensity, setEmotionalIntensity] = useState<number>(0.9);

  const canvasContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const particleGeo = new THREE.BufferGeometry();
    const count = 300;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 10;
      positions[i + 1] = (Math.random() - 0.5) * 10;
      positions[i + 2] = (Math.random() - 0.5) * 5;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x06b6d4,
      size: 0.04,
      transparent: true,
      opacity: 0.7,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    const ringGeo = new THREE.TorusGeometry(2.4, 0.015, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.4 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 3;
    scene.add(ring);

    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      const time = clock.getElapsedTime();
      particles.rotation.y = time * 0.05;
      ring.rotation.z = time * 0.2 * speakingSpeed;

      const vol = state === 'speaking' ? mahiVolume * emotionalIntensity : state === 'listening' ? userVolume : 0;
      const scale = 1 + vol * 0.35;
      ring.scale.set(scale, scale, scale);

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [state, mahiVolume, userVolume, speakingSpeed, emotionalIntensity]);

  const expressions = [
    { name: 'Happy', icon: Smile, prompt: 'JARVIS, give me a warm, bright, cheerful greeting!' },
    { name: 'Serious', icon: Shield, prompt: 'JARVIS, give me a calm, composed, serious announcement.' },
    { name: 'Sad', icon: Frown, prompt: 'JARVIS, speak with a gentle, compassionate, comforting tone.' },
    { name: 'Playful', icon: Sparkles, prompt: 'JARVIS, let us have a relaxed, spontaneous, friendly chat.' },
    { name: 'Caring', icon: Heart, prompt: 'JARVIS, offer tender, reassuring, emotionally connected comfort.' },
    { name: 'Excited', icon: Zap, prompt: 'JARVIS, express energetic, enthusiastic excitement!' },
  ] as const;

  const sidebarItems = [
    { name: 'Chat', icon: MessageSquare },
    { name: 'Voice Engine', icon: Mic },
    { name: 'Missions', icon: Calendar },
    { name: 'Calculator & Tools', icon: Calculator },
    { name: 'YouTube / Media', icon: Film, prompt: 'JARVIS, search YouTube for relaxing lo-fi songs and play them.' },
    { name: 'Study & Code', icon: Compass, prompt: 'JARVIS, help me study physics and write clean code.' },
    { name: 'Weather', icon: CloudSun, prompt: 'JARVIS, give me the latest weather and breaking news.' },
    { name: 'More...', icon: MoreHorizontal },
  ];

  const isLive = state === 'listening' || state === 'speaking' || state === 'connecting';

  return (
    <div className="relative flex flex-col h-screen w-screen overflow-hidden bg-[#05050c] text-white select-none font-display">
      {/* TikTok Intro Modal */}
      {showTikTokModal && (
        <TikTokIntroModal
          onClose={() => setShowTikTokModal(false)}
          selectedVoice={selectedVoice}
        />
      )}

      <div ref={canvasContainerRef} className="absolute inset-0 pointer-events-none z-0 overflow-hidden" />

      {/* Cybernetic Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-cyan-600/10 rounded-full blur-[150px]" />
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-pink-600/10 rounded-full blur-[120px]" />
      </div>

      {/* Top Header */}
      <header className="relative z-30 w-full px-6 pt-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 shadow-lg shadow-cyan-500/30 border border-cyan-400/40">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="font-extrabold text-xl tracking-wider text-white bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-100 to-cyan-400">
              JARVIS • MAHI
            </h1>
            <p className="text-[10px] text-cyan-400/80 tracking-widest uppercase font-mono">
              Ultimate AI Companion v10.0 • Sakraul, Nepal 🇳🇵
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* TikTok Creator Intro Button */}
          <button
            onClick={() => setShowTikTokModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 text-white text-xs font-bold shadow-md shadow-pink-600/30 cursor-pointer hover:scale-105 transition-all"
          >
            <Video className="w-3.5 h-3.5" />
            <span>TikTok Intro</span>
          </button>

          {/* Switch to Phone / TikTok Layout */}
          {onToggleLayout && (
            <button
              onClick={onToggleLayout}
              title="Switch to Mobile / TikTok 9:16 Layout"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-panel border border-cyan-500/30 text-cyan-300 hover:text-white text-xs font-medium cursor-pointer transition-all hover:border-cyan-400"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Phone View</span>
            </button>
          )}

          <button
            onClick={() => {
              setIsScreenSharing(!isScreenSharing);
              onTriggerPrompt(isScreenSharing ? 'Screen share stopped' : 'JARVIS, screen sharing is active. Help me with my workflow!');
            }}
            className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              isScreenSharing
                ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/40 border border-pink-400'
                : 'glass-panel text-zinc-300 hover:text-white border border-white/10'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{isScreenSharing ? 'Screen Share Active' : 'Share Screen'}</span>
          </button>

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-panel border border-cyan-500/30">
            {state === 'speaking' ? (
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            ) : state === 'thinking' ? (
              <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-spin" />
            ) : state === 'listening' ? (
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            ) : (
              <Radio className={`w-3.5 h-3.5 ${isLive ? 'text-cyan-400 animate-pulse' : 'text-zinc-500'}`} />
            )}
            <span className="text-xs font-mono text-cyan-200 uppercase tracking-wider">
              {state === 'speaking'
                ? 'Speaking (Natural Voice)'
                : state === 'thinking'
                ? 'MAHI is thinking...'
                : state === 'listening'
                ? 'Listening to Sanam...'
                : state === 'connecting'
                ? 'Connecting...'
                : 'Standby'}
            </span>
          </div>

          {state === 'speaking' && (
            <button
              onClick={onInterrupt}
              title="Interrupt / Stop Speaking"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/40 animate-pulse cursor-pointer transition-all"
            >
              <Square className="w-3 h-3 fill-current" />
              <span>Interrupt</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Workspace Grid */}
      <div className="relative z-20 flex-1 flex flex-col md:flex-row items-center justify-between px-4 md:px-8 py-2 overflow-hidden gap-4">
        
        {/* Left Sidebar Menu */}
        <nav className="hidden lg:flex flex-col gap-2 w-52 glass-panel p-3 rounded-2xl border border-cyan-500/20 shadow-xl bg-zinc-950/60">
          <p className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase px-2 mb-1">
            System Modules
          </p>
          {sidebarItems.map((item, idx) => {
            const Icon = item.icon;
            const isActive = activeTab === item.name;
            return (
              <button
                key={idx}
                onClick={() => {
                  setActiveTab(item.name);
                  if (item.prompt) {
                    onTriggerPrompt(item.prompt);
                  }
                }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40 shadow-md'
                    : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-zinc-400'}`} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Central Stage: Conditional rendering of active module */}
        <div className="relative flex-1 flex flex-col items-center justify-center h-full max-w-2xl mx-auto w-full">
          {activeTab === 'Chat' ? (
            <ChatModule emotion={activeExpression} selectedVoice={selectedVoice} />
          ) : activeTab === 'Missions' ? (
            <MissionsModule />
          ) : activeTab === 'Calculator & Tools' ? (
            <div className="flex flex-col h-full w-full max-w-md mx-auto glass-panel rounded-3xl border border-cyan-500/30 p-5 bg-zinc-950/80 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Calculator className="w-4 h-4 text-cyan-400" />
                <span>Device Calculator & Helper</span>
              </h3>
              <div className="space-y-2">
                <input
                  type="text"
                  value={calcInput}
                  onChange={(e) => setCalcInput(e.target.value)}
                  placeholder="Enter math expression..."
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white font-mono"
                />
                <button
                  onClick={() => {
                    try {
                      // eslint-disable-next-line no-eval
                      const res = eval(calcInput);
                      setCalcResult(res.toString());
                    } catch {
                      setCalcResult('Invalid expression');
                    }
                  }}
                  className="w-full py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold cursor-pointer"
                >
                  Calculate
                </button>
                <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs font-mono text-cyan-200 text-center">
                  Result: {calcResult}
                </div>
              </div>
            </div>
          ) : (
            <div className="relative flex flex-col items-center justify-center h-full max-w-lg mx-auto">
              <div className="absolute top-2 left-2 z-30 max-w-xs p-3.5 rounded-2xl glass-panel bg-zinc-950/85 border border-cyan-500/40 shadow-2xl backdrop-blur-xl animate-float">
                <div className="flex items-start gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping mt-1" />
                  <div>
                    <h4 className="text-xs font-bold text-cyan-200 tracking-wider">JARVIS • MAHI Ultimate v10</h4>
                    <p className="text-[11px] text-zinc-300 mt-1 leading-relaxed font-light">
                      Emotional voice engine active. Tap Talk or switch to Chat / Missions in the sidebar! 💙
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative w-72 h-84 md:w-96 md:h-[380px] rounded-3xl overflow-hidden glass-panel border-2 border-cyan-500/40 shadow-2xl shadow-cyan-500/30 group">
                <img
                  src={mahiAvatarImg || '/mahi_avatar.jpg'}
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.src.endsWith('/mahi_avatar.jpg')) {
                      target.src = '/mahi_avatar.jpg';
                    }
                  }}
                  alt="JARVIS Mahi"
                  className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#05050c] via-transparent to-transparent opacity-80 pointer-events-none" />

                {state === 'speaking' && (
                  <div
                    className="absolute inset-0 border-3 border-cyan-400 rounded-3xl animate-pulse pointer-events-none"
                    style={{
                      boxShadow: `inset 0 0 ${25 + mahiVolume * emotionalIntensity * 70}px rgba(6, 182, 212, 0.9)`,
                    }}
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Panel: Expression & Mood Selector */}
        <div className="flex flex-col gap-2 w-full md:w-56 glass-panel p-3 rounded-2xl border border-cyan-500/20 shadow-xl bg-zinc-950/60">
          <p className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase px-2 mb-1">
            Emotional Tones
          </p>
          {expressions.map((exp, idx) => {
            const Icon = exp.icon;
            const isSelected = activeExpression === exp.name;
            return (
              <button
                key={idx}
                onClick={() => {
                  setActiveExpression(exp.name);
                  onTriggerPrompt(exp.prompt);
                }}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-cyan-600/30 to-pink-600/30 text-white border border-cyan-400/50 shadow-md'
                    : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-cyan-300' : 'text-zinc-400'}`} />
                  <span>{exp.name}</span>
                </div>
                {isSelected && <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />}
              </button>
            );
          })}
        </div>

      </div>

      {/* Settings Modal */}
      {showSettingsModal && (
        <SettingsModal
          onClose={() => setShowSettingsModal(false)}
          selectedVoice={selectedVoice}
          onVoiceChange={onVoiceChange}
          isListening={isLive}
          onStopListening={onToggleSession}
          voiceSpeed={voiceSpeed}
          onVoiceSpeedChange={onVoiceSpeedChange}
          voiceVolume={voiceVolume}
          onVoiceVolumeChange={onVoiceVolumeChange}
          voicePitch={voicePitch}
          onVoicePitchChange={onVoicePitchChange}
          isMuted={isMuted}
          onToggleMute={onToggleMute}
          languagePreference={languagePreference}
          onLanguageChange={onLanguageChange}
        />
      )}

      {/* Bottom Central HUD Control Ring */}
      <footer className="relative z-30 w-full px-6 py-4 flex flex-col items-center bg-gradient-to-t from-[#05050c] via-[#05050c]/90 to-transparent">
        <div className="flex items-center justify-center gap-6 md:gap-10">
          <button
            onClick={() => setShowSettingsModal(true)}
            className="flex flex-col items-center gap-1 text-zinc-400 hover:text-cyan-300 transition-colors cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl glass-panel flex items-center justify-center border border-white/10 hover:border-cyan-400/50">
              <Settings className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono tracking-wider">Voice Engine</span>
          </button>

          <button
            onClick={() => onVoiceChange(selectedVoice === 'Aoede' ? 'Kore' : 'Aoede')}
            className="flex flex-col items-center gap-1 text-zinc-400 hover:text-cyan-300 transition-colors cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl glass-panel flex items-center justify-center border border-white/10 hover:border-cyan-400/50">
              <Volume2 className="w-5 h-5 text-cyan-400" />
            </div>
            <span className="text-[10px] font-mono tracking-wider">{selectedVoice}</span>
          </button>

          {/* Central Prominent Tap-to-Talk Button */}
          <div className="relative flex items-center justify-center">
            {isLive && (
              <div className="absolute -inset-3 rounded-full bg-cyan-500/30 animate-ping pointer-events-none" />
            )}
            <button
              onClick={onToggleSession}
              aria-label={isLive ? 'End Call' : 'Tap to Talk'}
              className={`relative w-24 h-24 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all duration-300 transform active:scale-95 cursor-pointer z-10 ${
                isLive
                  ? 'bg-gradient-to-tr from-rose-600 to-red-600 text-white shadow-rose-600/50 border-2 border-rose-400'
                  : 'bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-cyan-600/60 border-2 border-cyan-300'
              }`}
            >
              {isLive ? <PhoneOff className="w-8 h-8" /> : <Mic className="w-8 h-8 animate-pulse" />}
              <span className="text-[10px] font-bold tracking-widest uppercase font-mono mt-1">
                {isLive ? 'End' : 'Tap to Talk'}
              </span>
            </button>
          </div>

          <button
            onClick={() => {
              setActiveTab('Chat');
            }}
            className="flex flex-col items-center gap-1 text-zinc-400 hover:text-cyan-300 transition-colors cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl glass-panel flex items-center justify-center border border-white/10 hover:border-cyan-400/50">
              <MessageSquare className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono tracking-wider">Chat</span>
          </button>

          <button
            onClick={onToggleMute}
            className="flex flex-col items-center gap-1 text-zinc-400 hover:text-cyan-300 transition-colors cursor-pointer"
          >
            <div className={`w-12 h-12 rounded-2xl glass-panel flex items-center justify-center border ${isMuted ? 'border-amber-500 text-amber-400 bg-amber-500/10' : 'border-white/10 hover:border-cyan-400/50'}`}>
              <X className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono tracking-wider">{isMuted ? 'Muted' : 'Mute'}</span>
          </button>
        </div>

        <div className="mt-3 flex items-center gap-2 text-[11px] text-zinc-500 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>JARVIS • MAHI Ultimate v10.0 • AI Brain • Missions • Calculator • Voice Engine</span>
        </div>
      </footer>
    </div>
  );
};
