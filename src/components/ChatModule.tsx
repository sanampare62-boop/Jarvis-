import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Bot, User, Trash2 } from 'lucide-react';

interface Message {
  sender: 'user' | 'mahi';
  text: string;
  time: string;
}

interface ChatModuleProps {
  emotion: string;
}

export const ChatModule: React.FC<ChatModuleProps> = ({ emotion }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'mahi',
      text: "Hello! I'm JARVIS • MAHI. Ask me anything in English, Hindi, or Hinglish — study help, code generation, translation, or just friendly banter! 💙",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userText, emotion }),
      });
      const data = await res.json();
      const mahiMsg: Message = {
        sender: 'mahi',
        text: data.text || "I'm always here for you!",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, mahiMsg]);
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

  return (
    <div className="flex flex-col h-full w-full max-w-2xl mx-auto glass-panel rounded-3xl border border-cyan-500/30 overflow-hidden shadow-2xl bg-zinc-950/80">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-cyan-500/20 flex items-center justify-between bg-zinc-900/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">MAHI AI Brain</h3>
            <p className="text-[10px] text-cyan-400 font-mono">Multilingual • Code • Study • General Knowledge</p>
          </div>
        </div>
        <button
          onClick={() => setMessages([])}
          className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          title="Clear Chat"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {messages.map((m, idx) => (
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
              className={`max-w-md p-3 rounded-2xl text-xs leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-cyan-600/20 border border-cyan-500/30 text-cyan-100 rounded-tr-none'
                  : 'glass-panel text-zinc-200 rounded-tl-none border border-white/10'
              }`}
            >
              <p className="whitespace-pre-wrap">{m.text}</p>
              <span className="text-[9px] text-zinc-500 mt-1 block text-right">{m.time}</span>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono">
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            <span>Mahi is thinking...</span>
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
          placeholder="Ask Mahi anything (English, Hindi, Hinglish, Code)..."
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
