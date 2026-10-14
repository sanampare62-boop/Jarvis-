import React, { useEffect } from 'react';
import { ExternalLink, Sparkles, Globe, X, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';

export interface ActionNotification {
  id: string;
  type: 'website' | 'action';
  title: string;
  url?: string;
  reason?: string;
  action?: string;
  message?: string;
  timestamp: number;
}

interface ActionToastProps {
  action: ActionNotification | null;
  onDismiss: () => void;
}

export const ActionToast: React.FC<ActionToastProps> = ({ action, onDismiss }) => {
  useEffect(() => {
    if (!action) return;

    // Trigger visual confetti if requested
    if (action.action === 'confetti' || action.action === 'hype_burst' || action.action === 'vibe_check') {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#ff2d78', '#a855f7', '#06b6d4', '#f59e0b'],
        });
      } catch {}
    }

    // Auto-dismiss after 8 seconds
    const timer = setTimeout(() => {
      onDismiss();
    }, 8000);

    return () => clearTimeout(timer);
  }, [action, onDismiss]);

  if (!action) return null;

  const handleOpenLink = () => {
    if (action.url) {
      window.open(action.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-md animate-float">
      <div className="relative p-4 rounded-2xl bg-gradient-to-r from-zinc-900/95 via-purple-950/90 to-zinc-900/95 border border-pink-500/40 shadow-2xl shadow-pink-500/20 backdrop-blur-xl overflow-hidden">
        {/* Glow flare */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-pink-500/20 text-pink-400 border border-pink-500/30 flex-shrink-0">
            {action.type === 'website' ? (
              <Globe className="w-5 h-5 animate-pulse" />
            ) : (
              <Sparkles className="w-5 h-5 text-amber-300 animate-spin-slow" />
            )}
          </div>

          <div className="flex-1 min-w-0 pr-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-extrabold tracking-widest text-pink-400 uppercase font-display flex items-center gap-1">
                <Zap className="w-3 h-3" /> MAHI ACTION EXECUTED
              </span>
            </div>

            <h4 className="text-sm font-bold text-white truncate mt-0.5">{action.title}</h4>

            {action.reason && (
              <p className="text-xs text-pink-200/90 italic mt-1 font-light leading-snug">
                "{action.reason}"
              </p>
            )}

            {action.message && (
              <p className="text-xs text-purple-200/90 mt-1 font-light leading-snug">
                {action.message}
              </p>
            )}

            {action.url && (
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={handleOpenLink}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white text-xs font-semibold shadow-md shadow-pink-600/30 transition-transform active:scale-95 cursor-pointer"
                >
                  <span>Launch Link</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] text-zinc-400 truncate max-w-[170px]">
                  {action.url}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={onDismiss}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
