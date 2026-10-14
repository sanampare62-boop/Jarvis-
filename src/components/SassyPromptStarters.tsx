import React from 'react';
import { Sparkles, MessageCircleHeart } from 'lucide-react';

interface SassyPromptStartersProps {
  onSelectPrompt: (promptText: string) => void;
  disabled?: boolean;
}

const STARTER_PROMPTS = [
  { label: '💅 Roast my screen time', text: 'Hey Mahi, roast me for being on my phone all day.' },
  { label: '🎵 Open Spotify for vibes', text: 'Mahi, open Spotify and give me some late night tracks.' },
  { label: '🎬 Open YouTube', text: 'Can you open YouTube for something funny?' },
  { label: '✨ Hype me up', text: 'Mahi, I need you to hype me up right now.' },
  { label: '👀 Why do people text "k"?', text: 'Why is receiving "k" the most passive aggressive thing ever?' },
  { label: '🎉 Vibe check me', text: 'Mahi, give me an official vibe check and celebrate.' },
  { label: '🔍 Search Google', text: 'Can you search Google for the deepest ocean facts?' },
];

export const SassyPromptStarters: React.FC<SassyPromptStartersProps> = ({ onSelectPrompt, disabled }) => {
  return (
    <div className="w-full max-w-lg mx-auto px-4 py-2">
      <div className="flex items-center gap-1.5 mb-2 px-1 text-xs text-zinc-400 font-display">
        <Sparkles className="w-3.5 h-3.5 text-pink-400" />
        <span className="font-semibold text-zinc-300">Say something sassy to Mahi:</span>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
        {STARTER_PROMPTS.map((starter, idx) => (
          <button
            key={idx}
            disabled={disabled}
            onClick={() => onSelectPrompt(starter.text)}
            className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium glass-panel bg-zinc-900/60 hover:bg-pink-950/40 border border-white/10 hover:border-pink-500/40 text-zinc-300 hover:text-white transition-all transform active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <MessageCircleHeart className="w-3 h-3 text-pink-400/80" />
            <span>{starter.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
