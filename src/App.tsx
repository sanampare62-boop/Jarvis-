/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LiveSession, SessionState, ToolCallEvent } from './services/liveSession';
import { MobilePhoneHUD } from './components/MobilePhoneHUD';
import { MahiCharacterHUD } from './components/MahiCharacterHUD';
import { ActionToast, ActionNotification } from './components/ActionToast';
import confetti from 'canvas-confetti';

export default function App() {
  const [sessionState, setSessionState] = useState<SessionState>('disconnected');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [userVolume, setUserVolume] = useState<number>(0);
  const [mahiVolume, setMahiVolume] = useState<number>(0);
  const [selectedVoice, setSelectedVoice] = useState<string>('Aoede');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<ActionNotification | null>(null);
  const [viewMode, setViewMode] = useState<'mobile' | 'desktop'>(() => {
    return (localStorage.getItem('mahi_view_mode') as 'mobile' | 'desktop') || 'mobile';
  });

  const sessionRef = useRef<LiveSession | null>(null);

  const getSession = useCallback(() => {
    if (!sessionRef.current) {
      sessionRef.current = new LiveSession({
        onStateChange: (newState) => {
          setSessionState(newState);
          if (newState === 'disconnected') {
            setUserVolume(0);
            setMahiVolume(0);
          }
        },
        onToolCall: (event: ToolCallEvent) => {
          console.log('[App] Handling tool call:', event);
          if (event.name === 'openWebsite') {
            const url = event.args.url || 'https://google.com';
            const title = event.args.title || 'Web Link';
            const reason = event.args.reason || 'Opened for you!';

            setActiveAction({
              id: event.id,
              type: 'website',
              title,
              url,
              reason,
              timestamp: Date.now(),
            });

            try {
              window.open(url, '_blank', 'noopener,noreferrer');
            } catch (err) {
              console.warn('Popup blocked:', err);
            }
          } else if (event.name === 'performAction') {
            const action = event.args.action || 'vibe_check';
            const title = event.args.title || 'Action Executed';
            const message = event.args.message || 'Mahi took care of it!';

            setActiveAction({
              id: event.id,
              type: 'action',
              title,
              action,
              message,
              timestamp: Date.now(),
            });

            confetti({
              particleCount: 90,
              spread: 75,
              origin: { y: 0.6 },
              colors: ['#06b6d4', '#ff2d78', '#a855f7', '#f59e0b'],
            });
          }
        },
        onError: (err) => {
          setErrorMessage(err);
          setSessionState('disconnected');
        },
        onUserVolume: (vol) => setUserVolume(vol),
        onMahiVolume: (vol) => setMahiVolume(vol),
        onInterrupted: () => console.log('Interrupted'),
      });
    }
    return sessionRef.current;
  }, []);

  useEffect(() => {
    return () => {
      if (sessionRef.current) {
        sessionRef.current.stop();
        sessionRef.current = null;
      }
    };
  }, []);

  const handleToggleSession = async () => {
    setErrorMessage(null);
    const session = getSession();

    if (sessionState === 'disconnected') {
      try {
        await session.start(selectedVoice);
      } catch (err: any) {
        setErrorMessage(err?.message || 'Failed to connect');
      }
    } else {
      session.stop();
    }
  };

  const handleToggleMute = () => {
    const session = getSession();
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    session.setMuted(nextMuted);
  };

  const handleInterrupt = () => {
    const session = getSession();
    session.interrupt();
  };

  const handleVoiceChange = (voice: string) => {
    setSelectedVoice(voice);
    if (sessionRef.current && sessionState !== 'disconnected') {
      sessionRef.current.switchVoice(voice);
    }
  };

  const handleTriggerPrompt = (promptText: string) => {
    if (sessionState === 'disconnected') {
      handleToggleSession();
    }
  };

  return (
    <>
      <ActionToast action={activeAction} onDismiss={() => setActiveAction(null)} />
      {errorMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 p-3 bg-rose-950/90 border border-rose-500 rounded-xl text-xs text-rose-200">
          {errorMessage}
          <button onClick={() => setErrorMessage(null)} className="ml-3 underline">Dismiss</button>
        </div>
      )}

      {viewMode === 'desktop' ? (
        <MahiCharacterHUD
          state={sessionState}
          isMuted={isMuted}
          userVolume={userVolume}
          mahiVolume={mahiVolume}
          selectedVoice={selectedVoice}
          onToggleSession={handleToggleSession}
          onToggleMute={handleToggleMute}
          onInterrupt={handleInterrupt}
          onVoiceChange={handleVoiceChange}
          onTriggerPrompt={handleTriggerPrompt}
          onToggleLayout={() => {
            setViewMode('mobile');
            localStorage.setItem('mahi_view_mode', 'mobile');
          }}
        />
      ) : (
        <MobilePhoneHUD
          state={sessionState}
          isMuted={isMuted}
          userVolume={userVolume}
          mahiVolume={mahiVolume}
          selectedVoice={selectedVoice}
          onToggleSession={handleToggleSession}
          onToggleMute={handleToggleMute}
          onInterrupt={handleInterrupt}
          onVoiceChange={handleVoiceChange}
          onTriggerPrompt={handleTriggerPrompt}
          onToggleLayout={() => {
            setViewMode('desktop');
            localStorage.setItem('mahi_view_mode', 'desktop');
          }}
        />
      )}
    </>
  );
}
