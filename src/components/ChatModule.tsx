import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Bot, User, Trash2, Volume2, VolumeX, Square, Play } from 'lucide-react';

interface Message {
  sender: 'user' | 'mahi';
  text: string;
  time: string;
}

interface ChatModuleProps {
  emotion: string;
  selectedVoice?: string;
}

export const ChatModule: React.FC<ChatModuleProps> = ({ emotion, selectedVoice = 'Aoede' }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'mahi',
      text: "जय श्री राम, Sanam! I'm JARVIS • MAHI. Ask me anything in English, Hindi, or Hinglish — weather in Sakraul, festival dates, study help, code generation, or friendly conversation! 💙",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState<boolean>(() => {
    return localStorage.getItem('mahi_chat_voice_output') !== 'false';
  });
  const [speakingMsgIndex, setSpeakingMsgIndex] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    return () => {
      stopSpeaking();
      if (audioCtxRef.current) {
        try {
          audioCtxRef.current.close();
        } catch {}
      }
    };
  }, []);

  const stopSpeaking = () => {
    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop();
        currentSourceRef.current.disconnect();
      } catch {}
      currentSourceRef.current = null;
    }
    if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    setSpeakingMsgIndex(null);
  };

  const speakText = async (text: string, index: number) => {
    stopSpeaking();
    setSpeakingMsgIndex(index);

    const voice = selectedVoice || localStorage.getItem('mahi_voice_persona') || 'Aoede';
    const speed = parseFloat(localStorage.getItem('mahi_voice_speed') || '1.0');
    const volume = parseFloat(localStorage.getItem('mahi_voice_volume') || '1.0');

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voiceName: voice, emotion }),
      });

      if (!res.ok) throw new Error(`TTS server responded ${res.status}`);
      const data = await res.json();
      if (!data.audio) throw new Error('No audio returned');

      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioContextClass();
      }
      if (audioCtxRef.current.state === 'suspended') {
        await audioCtxRef.current.resume();
      }

      const binary = atob(data.audio);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      const decoded = await audioCtxRef.current.decodeAudioData(bytes.buffer);
      const source = audioCtxRef.current.createBufferSource();
      source.buffer = decoded;
      source.playbackRate.value = speed;

      const gain = audioCtxRef.current.createGain();
      gain.gain.value = volume;

      source.connect(gain);
      gain.connect(audioCtxRef.current.destination);

      source.onended = () => {
        setSpeakingMsgIndex(null);
        currentSourceRef.current = null;
      };

      source.start(0);
      currentSourceRef.current = source;
    } catch (err) {
      console.warn('Backend TTS failed, using SpeechSynthesis fallback:', err);
      fallbackSpeech(text, index, speed, volume);
    }
  };

  const fallbackSpeech = (text: string, index: number, speed: number, volume: number) => {
    if (!('speechSynthesis' in window)) {
      setSpeakingMsgIndex(null);
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = speed;
      utterance.volume = volume;

      const voices = window.speechSynthesis.getVoices();
      const match = voices.find(
        (v) => v.lang.includes('hi') || v.lang.includes('ne') || v.lang.includes('en-IN') || v.lang.includes('en')
      );
      if (match) utterance.voice = match;

      utterance.onstart = () => setSpeakingMsgIndex(index);
      utterance.onend = () => setSpeakingMsgIndex(null);
      utterance.onerror = () => setSpeakingMsgIndex(null);

      window.speechSynthesis.speak(utterance);
    } catch {
      setSpeakingMsgIndex(null);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput('');
    const userMsg: Message = {
      sender: 'user',
      text: userText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const language = localStorage.getItem('mahi_language_preference') || 'hinglish_nepali';
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userText, emotion, language }),
      });
      const data = await res.json();
      const replyText = data.text || 'जय श्री राम, Sanam! Always here for you! 💙';
      const mahiMsg: Message = {
        sender: 'mahi',
        text: replyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => {
        const next = [...prev, mahiMsg];
        const newMsgIndex = next.length - 1;
        if (voiceOutputEnabled) {
          setTimeout(() => speakText(replyText, newMsgIndex), 100);
        }
        return next;
      });
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'mahi',
          text: "Oops, my neural link hiccuped! Let's try that again.",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVoiceOutput = () => {
    const next = !voiceOutputEnabled;
    setVoiceOutputEnabled(next);
    localStorage.setItem('mahi_chat_voice_output', next.toString());
    if (!next) {
      stopSpeaking();
    }
  };

  return (
    <div className="flex flex-col h-full w-full max-w-2xl mx-auto glass-panel rounded-3xl border border-cyan-500/30 overflow-hidden shadow-2xl bg-zinc-950/80">
      {/* Header */}
      <div className="px-4 py-3 border-b border-cyan-500/20 flex items-center justify-between bg-zinc-900/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">MAHI AI Brain</h3>
            <p className="text-[10px] text-cyan-400 font-mono">Ultra-Realistic Female Voice • Multilingual</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Voice Output Toggle */}
          <button
            onClick={toggleVoiceOutput}
            title={voiceOutputEnabled ? 'Voice Replies Active' : 'Voice Replies Muted'}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              voiceOutputEnabled
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
            }`}
          >
            {voiceOutputEnabled ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="text-[10px] hidden sm:inline">{voiceOutputEnabled ? 'Voice ON' : 'Voice OFF'}</span>
          </button>

          {speakingMsgIndex !== null && (
            <button
              onClick={stopSpeaking}
              title="Stop Speaking"
              className="flex items-center gap-1 px-2 py-1 rounded-xl bg-rose-600/30 border border-rose-500 text-rose-300 text-xs font-bold animate-pulse cursor-pointer"
            >
              <Square className="w-3 h-3 fill-current" />
              <span className="text-[10px]">Stop</span>
            </button>
          )}

          <button
            onClick={() => {
              stopSpeaking();
              setMessages([]);
            }}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            title="Clear Chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 no-scrollbar">
        {messages.map((m, idx) => {
          const isSpeaking = speakingMsgIndex === idx;
          return (
            <div
              key={idx}
              className={`flex items-start gap-2.5 ${m.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs flex-shrink-0 ${
                  m.sender === 'user' ? 'bg-cyan-600 text-white' : 'bg-pink-600/30 text-pink-300 border border-pink-500/40'
                }`}
              >
                {m.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>
              <div
                className={`max-w-md p-3 rounded-2xl text-xs leading-relaxed relative group ${
                  m.sender === 'user'
                    ? 'bg-cyan-600/20 border border-cyan-500/30 text-cyan-100 rounded-tr-none'
                    : isSpeaking
                    ? 'bg-cyan-950/40 border border-cyan-400 text-white rounded-tl-none shadow-md shadow-cyan-500/20'
                    : 'glass-panel text-zinc-200 rounded-tl-none border border-white/10'
                }`}
              >
                <p className="whitespace-pre-wrap">{m.text}</p>
                <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-white/5">
                  <span className="text-[9px] text-zinc-500 font-mono">{m.time}</span>
                  {m.sender === 'mahi' && (
                    <div className="flex items-center gap-1.5">
                      {isSpeaking ? (
                        <button
                          onClick={stopSpeaking}
                          className="text-[9px] font-mono text-cyan-300 flex items-center gap-1 bg-cyan-950/60 px-1.5 py-0.5 rounded-md border border-cyan-400/50 cursor-pointer"
                        >
                          <Square className="w-2.5 h-2.5 fill-current text-rose-400" />
                          <span>Stop</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => speakText(m.text, idx)}
                          title="Speak aloud"
                          className="opacity-70 hover:opacity-100 text-cyan-400 transition-opacity p-0.5 cursor-pointer"
                        >
                          <Volume2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono p-2">
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            <span>MAHI is thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-3 border-t border-cyan-500/20 bg-zinc-900/60 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Mahi anything (English, Hindi, Hinglish)..."
          className="flex-1 px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md disabled:opacity-40 cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
