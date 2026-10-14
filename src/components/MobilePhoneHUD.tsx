import React, { useState, useEffect } from 'react';
import { SessionState } from '../services/liveSession';
import { ChatModule } from './ChatModule';
import { MissionsModule } from './MissionsModule';
import { TikTokIntroModal } from './TikTokIntroModal';
import mahiAvatarImg from '../assets/images/mahi_avatar_hud_1791944268688.jpg';
import {
  Mic,
  MessageSquare,
  Calendar,
  Calculator,
  CloudSun,
  Settings,
  PhoneOff,
  Wifi,
  Battery,
  Sparkles,
  Radio,
  Home,
  Smile,
  Heart,
  Shield,
  Compass,
  ArrowRight,
  Sun,
  BellRing,
  Video,
  Monitor
} from 'lucide-react';

interface MobilePhoneHUDProps {
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
}

export const MobilePhoneHUD: React.FC<MobilePhoneHUDProps> = ({
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
}) => {
  const [currentTab, setCurrentTab] = useState<'home' | 'chat' | 'missions' | 'settings'>('home');
  const [activeEmotion, setActiveEmotion] = useState<'Happy' | 'Calm' | 'Caring' | 'Serious'>('Happy');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showTikTokModal, setShowTikTokModal] = useState(false);
  const [currentTime, setCurrentTime] = useState('8:49');

  // NPT Clock (UTC+5:45)
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const isLive = state === 'listening' || state === 'speaking' || state === 'connecting';
  const characterScale = 1 + (state === 'speaking' ? mahiVolume * 0.25 : 0);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-screen bg-[#020206] text-white p-2 sm:p-6 overflow-hidden font-display select-none">
      
      {/* TikTok Intro Modal */}
      {showTikTokModal && (
        <TikTokIntroModal
          onClose={() => setShowTikTokModal(false)}
          selectedVoice={selectedVoice}
        />
      )}

      {/* Smartphone Frame Mockup */}
      <div className="relative w-full max-w-[395px] h-[840px] bg-[#05050c] rounded-[48px] border-[10px] border-zinc-900 shadow-[0_0_70px_rgba(6,182,212,0.3)] overflow-hidden flex flex-col justify-between">
        
        {/* Status Bar */}
        <div className="relative z-40 w-full h-8 px-6 flex items-center justify-between bg-black/40 backdrop-blur-md text-[11px] font-mono text-zinc-300">
          <span className="font-semibold text-white">{currentTime} (NPT)</span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] tracking-tighter text-cyan-300 font-bold">Sakraul</span>
            <Wifi className="w-3.5 h-3.5 text-zinc-300" />
            <div className="flex items-center gap-1">
              <span className="text-[10px]">98%</span>
              <Battery className="w-4 h-4 text-zinc-300" />
            </div>
          </div>
        </div>

        {/* Top Header */}
        <div className="relative z-30 px-5 pt-2 pb-1 flex items-center justify-between">
          <div>
            <h1 className="font-extrabold text-base tracking-widest text-white bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-100 to-cyan-400">
              JARVIS • MAHI
            </h1>
            <p className="text-[9px] text-cyan-400/80 tracking-widest uppercase font-mono">
              SAKRAUL, NEPAL 🇳🇵
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Creator Intro Button */}
            <button
              onClick={() => setShowTikTokModal(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 text-white text-[10px] font-bold shadow-md shadow-pink-600/30 cursor-pointer animate-bounce"
            >
              <Video className="w-3 h-3" />
              <span>TikTok Intro</span>
            </button>

            {onToggleLayout && (
              <button
                onClick={onToggleLayout}
                title="Switch to Cyberpunk Hologram HUD"
                className="p-2 rounded-xl glass-panel border border-cyan-500/30 text-cyan-300 hover:text-white cursor-pointer transition-colors"
              >
                <Monitor className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => setShowSettingsModal(true)}
              className="p-2 rounded-xl glass-panel border border-white/10 text-zinc-300 hover:text-white cursor-pointer"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main View Area */}
        <div className="relative z-20 flex-1 flex flex-col overflow-y-auto no-scrollbar px-5 py-2 space-y-3">
          
          {currentTab === 'home' ? (
            <>
              {/* Central Character Animated Display Frame */}
              <div
                className="relative w-full h-52 rounded-3xl overflow-hidden glass-panel border-2 border-cyan-500/40 shadow-2xl shadow-cyan-500/20 flex items-center justify-center group animate-float transition-transform duration-100"
                style={{ transform: `scale(${characterScale})` }}
              >
                
                {/* Top-Left Badge */}
                <div className="absolute top-3 left-3 z-30 px-2.5 py-1 rounded-xl glass-panel bg-black/60 border border-cyan-500/30 text-[9px] font-mono">
                  <span className="text-cyan-300 font-bold block">MAHI AI</span>
                  <span className="text-zinc-400 text-[8px]">Sakraul Companion</span>
                </div>

                {/* Top-Right Badge */}
                <div className="absolute top-3 right-3 z-30 px-2.5 py-1 rounded-xl glass-panel bg-black/60 border border-cyan-500/30 text-[9px] font-mono flex items-center gap-1.5">
                  <span className="text-cyan-300 font-semibold">Bikram Sambat</span>
                  <BellRing className="w-3 h-3 text-cyan-400 animate-bounce" />
                </div>

                <img
                  src={mahiAvatarImg || '/mahi_avatar.jpg'}
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.src.endsWith('/mahi_avatar.jpg')) {
                      target.src = '/mahi_avatar.jpg';
                    }
                  }}
                  alt="Mahi Character"
                  className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-700 animate-pulse-slow"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#05050c] via-transparent to-transparent opacity-70 pointer-events-none" />

                {state === 'speaking' && (
                  <div className="absolute inset-0 border-3 border-cyan-400 rounded-3xl animate-pulse pointer-events-none" />
                )}
              </div>

              {/* Sakraul Weather & Festival Greeting Card */}
              <div
                onClick={() => onTriggerPrompt('JARVIS, check Sakraul weather and upcoming Nepali festivals for Sanam.')}
                className="p-3.5 rounded-2xl glass-panel border border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 via-zinc-900/60 to-cyan-950/40 flex items-center justify-between shadow-lg cursor-pointer hover:border-cyan-400 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 flex-shrink-0">
                    <Sun className="w-5 h-5 animate-spin-slow" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Sakraul, Sarlahi Weather & Festivals</h4>
                    <p className="text-[11px] text-zinc-300 font-light">"जय श्री राम, Sanam! Apna khayal rakhna ❤️"</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-cyan-400" />
              </div>

              {/* 4 App Card Shortcut Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => setCurrentTab('chat')}
                  className="p-3 rounded-2xl glass-panel border border-cyan-500/30 bg-zinc-900/40 hover:bg-cyan-950/30 text-left transition-all group cursor-pointer flex flex-col justify-between h-20"
                >
                  <div className="flex items-center justify-between">
                    <MessageSquare className="w-5 h-5 text-cyan-400" />
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-cyan-300 transition-colors" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">Chat</h5>
                    <p className="text-[10px] text-zinc-400">Talk to Sanam's Mahi</p>
                  </div>
                </button>

                <button
                  onClick={() => setCurrentTab('missions')}
                  className="p-3 rounded-2xl glass-panel border border-purple-500/30 bg-zinc-900/40 hover:bg-purple-950/30 text-left transition-all group cursor-pointer flex flex-col justify-between h-20"
                >
                  <div className="flex items-center justify-between">
                    <Calendar className="w-5 h-5 text-purple-400" />
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-purple-300 transition-colors" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">Missions</h5>
                    <p className="text-[10px] text-zinc-400">Plan & Do</p>
                  </div>
                </button>

                <button
                  onClick={() => onTriggerPrompt('JARVIS, open device tools and calculator.')}
                  className="p-3 rounded-2xl glass-panel border border-amber-500/30 bg-zinc-900/40 hover:bg-amber-950/30 text-left transition-all group cursor-pointer flex flex-col justify-between h-20"
                >
                  <div className="flex items-center justify-between">
                    <Calculator className="w-5 h-5 text-amber-400" />
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-amber-300 transition-colors" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">Tools</h5>
                    <p className="text-[10px] text-zinc-400">Apps & Utilities</p>
                  </div>
                </button>

                <button
                  onClick={() => onTriggerPrompt('JARVIS, give me weather updates for Sakraul Sarlahi.')}
                  className="p-3 rounded-2xl glass-panel border border-teal-500/30 bg-zinc-900/40 hover:bg-teal-950/30 text-left transition-all group cursor-pointer flex flex-col justify-between h-20"
                >
                  <div className="flex items-center justify-between">
                    <CloudSun className="w-5 h-5 text-teal-400" />
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-teal-300 transition-colors" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">Weather</h5>
                    <p className="text-[10px] text-zinc-400">Sakraul, Nepal</p>
                  </div>
                </button>
              </div>

              {/* Emotion Selection Pills */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                {[
                  { name: 'Happy', icon: Smile, prompt: 'जय श्री राम Sanam! Aaj ka din kaisa hai?' },
                  { name: 'Calm', icon: Compass, prompt: 'Mahi, let us have a calm relaxing chat.' },
                  { name: 'Caring', icon: Heart, prompt: 'Mahi, offer me warm comforting advice, Apna khayal rakhna.' },
                  { name: 'Serious', icon: Shield, prompt: 'Mahi, give me a serious focused update.' },
                ].map((emo, idx) => {
                  const Icon = emo.icon;
                  const isSel = activeEmotion === emo.name;
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setActiveEmotion(emo.name as any);
                        onTriggerPrompt(emo.prompt);
                      }}
                      className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                        isSel
                          ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-500/30 border border-cyan-400'
                          : 'glass-panel bg-zinc-900/50 text-zinc-300 hover:text-white border border-white/10'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{emo.name}</span>
                    </button>
                  );
                })}
              </div>
            </>
          ) : currentTab === 'chat' ? (
            <ChatModule emotion={activeEmotion} />
          ) : currentTab === 'missions' ? (
            <MissionsModule />
          ) : (
            <div className="flex flex-col h-full justify-center p-6 glass-panel rounded-3xl border border-cyan-500/30 space-y-4">
              <h3 className="text-sm font-bold text-cyan-300">JARVIS • MAHI Settings</h3>
              <p className="text-xs text-zinc-300">Home Location: <strong className="text-white">Sakraul, Sarlahi, Nepal</strong></p>
              <p className="text-xs text-zinc-300">User Address: <strong className="text-white">Sanam</strong></p>
              <p className="text-xs text-zinc-300">Voice Persona: <strong className="text-white">{selectedVoice}</strong></p>
              <div className="grid grid-cols-2 gap-2">
                {['Aoede', 'Kore', 'Zephyr', 'Charon'].map((v) => (
                  <button
                    key={v}
                    onClick={() => onVoiceChange(v)}
                    className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                      selectedVoice === v ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200' : 'bg-white/5 border-white/10 text-zinc-300'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentTab('home')}
                className="mt-4 py-2.5 rounded-xl bg-cyan-600 text-white text-xs font-semibold cursor-pointer"
              >
                Back to Home
              </button>
            </div>
          )}

        </div>

        {/* Bottom Control Row (Type, Tap to Talk, Mute) */}
        <div className="relative z-30 px-6 py-2 bg-black/60 backdrop-blur-md flex items-center justify-between border-t border-white/10">
          <button
            onClick={() => setCurrentTab('chat')}
            className="flex flex-col items-center gap-1 text-zinc-400 hover:text-cyan-300 transition-colors cursor-pointer"
          >
            <div className="w-10 h-10 rounded-2xl glass-panel flex items-center justify-center border border-white/10">
              <MessageSquare className="w-4 h-4" />
            </div>
            <span className="text-[9px] font-mono">Type</span>
          </button>

          {/* Central Glowing TAP TO TALK Button */}
          <div className="relative flex items-center justify-center -mt-6">
            {isLive && (
              <div className="absolute -inset-3 rounded-full bg-cyan-500/30 animate-ping pointer-events-none" />
            )}
            <button
              onClick={onToggleSession}
              className={`relative w-20 h-20 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all transform active:scale-95 cursor-pointer z-10 ${
                isLive
                  ? 'bg-gradient-to-tr from-rose-600 to-red-600 text-white shadow-rose-600/50 border-2 border-rose-400'
                  : 'bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-cyan-600/60 border-2 border-cyan-300'
              }`}
            >
              <Mic className={`w-7 h-7 ${isLive ? 'animate-bounce' : 'animate-pulse'}`} />
              <span className="text-[8px] font-extrabold tracking-widest uppercase font-mono mt-0.5">
                {isLive ? 'End' : 'Talk'}
              </span>
            </button>
          </div>

          <button
            onClick={onToggleMute}
            className="flex flex-col items-center gap-1 text-zinc-400 hover:text-cyan-300 transition-colors cursor-pointer"
          >
            <div className={`w-10 h-10 rounded-2xl glass-panel flex items-center justify-center border ${isMuted ? 'border-amber-500 text-amber-400 bg-amber-500/10' : 'border-white/10'}`}>
              <Mic className="w-4 h-4" />
            </div>
            <span className="text-[9px] font-mono">{isMuted ? 'Muted' : 'Mute'}</span>
          </button>
        </div>

        {/* Bottom Navigation Tab Bar Dock */}
        <div className="relative z-30 w-full h-14 bg-black/90 px-6 flex items-center justify-around border-t border-white/10 text-xs">
          <button
            onClick={() => setCurrentTab('home')}
            className={`flex flex-col items-center gap-1 ${currentTab === 'home' ? 'text-cyan-400 font-bold' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            <Home className="w-4 h-4" />
            <span className="text-[9px]">Home</span>
          </button>

          <button
            onClick={() => setCurrentTab('chat')}
            className={`flex flex-col items-center gap-1 ${currentTab === 'chat' ? 'text-cyan-400 font-bold' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            <MessageSquare className="w-4 h-4" />
            <span className="text-[9px]">Chat</span>
          </button>

          <button
            onClick={() => setCurrentTab('missions')}
            className={`flex flex-col items-center gap-1 ${currentTab === 'missions' ? 'text-cyan-400 font-bold' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            <Calendar className="w-4 h-4" />
            <span className="text-[9px]">Missions</span>
          </button>

          <button
            onClick={() => setCurrentTab('settings')}
            className={`flex flex-col items-center gap-1 ${currentTab === 'settings' ? 'text-cyan-400 font-bold' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            <Settings className="w-4 h-4" />
            <span className="text-[9px]">Settings</span>
          </button>
        </div>

      </div>

    </div>
  );
};
