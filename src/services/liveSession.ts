import { AudioRecorder } from './audioRecorder';
import { AudioStreamer } from './audioStreamer';

export type SessionState = 'disconnected' | 'connecting' | 'listening' | 'speaking';

export interface ToolCallEvent {
  id: string;
  name: string;
  args: {
    url?: string;
    title?: string;
    reason?: string;
    action?: string;
    message?: string;
    [key: string]: any;
  };
}

export interface LiveSessionCallbacks {
  onStateChange: (state: SessionState) => void;
  onToolCall: (event: ToolCallEvent) => void;
  onError: (error: string) => void;
  onUserVolume?: (volume: number) => void;
  onMahiVolume?: (volume: number) => void;
  onInterrupted?: () => void;
}

export class LiveSession {
  private ws: WebSocket | null = null;
  private recorder: AudioRecorder | null = null;
  private streamer: AudioStreamer | null = null;
  private state: SessionState = 'disconnected';
  private callbacks: LiveSessionCallbacks;
  private volumeMonitorInterval: any = null;
  private selectedVoice: string = 'Aoede';
  private isExplicitlyClosed: boolean = false;

  constructor(callbacks: LiveSessionCallbacks) {
    this.callbacks = callbacks;
  }

  public getState(): SessionState {
    return this.state;
  }

  public getSelectedVoice(): string {
    return this.selectedVoice;
  }

  private setState(newState: SessionState) {
    if (this.state !== newState) {
      this.state = newState;
      this.callbacks.onStateChange(newState);
    }
  }

  public async start(voiceName: string = 'Aoede') {
    if (this.state !== 'disconnected') return;
    this.selectedVoice = voiceName;
    this.isExplicitlyClosed = false;
    this.setState('connecting');

    try {
      // 1. Initialize streamer
      this.streamer = new AudioStreamer((isPlaying) => {
        if (this.state === 'connecting' || this.state === 'disconnected') return;
        this.setState(isPlaying ? 'speaking' : 'listening');
      });
      this.streamer.init();

      // 2. Initialize recorder
      this.recorder = new AudioRecorder((base64Audio) => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(
            JSON.stringify({
              type: 'audio',
              audio: base64Audio,
            })
          );
        }
      });

      // 3. Request mic permissions and start recording
      await this.recorder.start();

      // 4. Connect WebSocket
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('[LiveSession] WebSocket opened');
        this.ws?.send(JSON.stringify({ type: 'init', voice: this.selectedVoice }));
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === 'ready') {
            console.log('[LiveSession] Gemini Live ready:', msg);
            this.setState('listening');
          } else if (msg.type === 'audio' && msg.audio) {
            this.streamer?.queueAudioChunk(msg.audio);
          } else if (msg.type === 'interrupted') {
            console.log('[LiveSession] Interrupted by user');
            this.streamer?.stop();
            this.setState('listening');
            this.callbacks.onInterrupted?.();
          } else if (msg.type === 'turn_complete') {
            // Waiting for remaining scheduled audio chunks
          } else if (msg.type === 'tool_call') {
            this.callbacks.onToolCall({
              id: msg.id,
              name: msg.name,
              args: msg.args || {},
            });
          } else if (msg.type === 'error') {
            console.error('[LiveSession] Server error:', msg.error);
            this.callbacks.onError(msg.error);
          } else if (msg.type === 'session_closed') {
            if (!this.isExplicitlyClosed) {
              this.stop();
            }
          }
        } catch (e) {
          console.error('[LiveSession] Error processing ws message:', e);
        }
      };

      this.ws.onerror = (e) => {
        console.error('[LiveSession] WebSocket connection error occurred');
        this.callbacks.onError('Voice connection error. Please ensure your Gemini API Key is configured in Settings > Secrets.');
      };

      this.ws.onclose = () => {
        console.log('[LiveSession] WebSocket closed');
        if (!this.isExplicitlyClosed) {
          this.stop();
        }
      };

      // 5. Start audio volume monitoring for reactive visuals
      this.volumeMonitorInterval = setInterval(() => {
        if (this.callbacks.onUserVolume && this.recorder) {
          this.callbacks.onUserVolume(this.recorder.getVolume());
        }
        if (this.callbacks.onMahiVolume && this.streamer) {
          this.callbacks.onMahiVolume(this.streamer.getVolume());
        }
      }, 40);
    } catch (err: any) {
      console.error('[LiveSession] Failed to start:', err);
      this.stop();
      const isPermissionDenied =
        err?.name === 'NotAllowedError' ||
        err?.name === 'SecurityError' ||
        err?.message?.toLowerCase().includes('permission') ||
        err?.message?.toLowerCase().includes('denied');

      if (isPermissionDenied) {
        this.callbacks.onError(
          'Microphone permission was denied. Tap Settings > Microphone to grant permission or use Android App Settings.'
        );
      } else {
        this.callbacks.onError(err?.message || 'Could not access microphone or connect');
      }
    }
  }

  public setMuted(muted: boolean) {
    this.recorder?.setMuted(muted);
  }

  public getIsMuted(): boolean {
    return this.recorder?.getIsMuted() || false;
  }

  public interrupt() {
    this.streamer?.stop();
    this.setState('listening');
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'interrupt' }));
    }
  }

  public switchVoice(voice: string) {
    this.selectedVoice = voice;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'init', voice }));
    }
  }

  public getRecorder(): AudioRecorder | null {
    return this.recorder;
  }

  public getStreamer(): AudioStreamer | null {
    return this.streamer;
  }

  public stop() {
    this.isExplicitlyClosed = true;
    if (this.volumeMonitorInterval) {
      clearInterval(this.volumeMonitorInterval);
      this.volumeMonitorInterval = null;
    }

    if (this.recorder) {
      this.recorder.stop();
      this.recorder = null;
    }

    if (this.streamer) {
      this.streamer.destroy();
      this.streamer = null;
    }

    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }

    this.setState('disconnected');
  }
}
