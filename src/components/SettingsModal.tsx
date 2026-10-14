import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Mic,
  ShieldAlert,
  ShieldCheck,
  Play,
  Square,
  ExternalLink,
  Wifi,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Sliders,
  Settings as SettingsIcon,
  Info
} from 'lucide-react';

interface SettingsModalProps {
  onClose: () => void;
  selectedVoice: string;
  onVoiceChange: (voice: string) => void;
  isListening: boolean;
  onStopListening: () => void;
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
}) => {
  const [activeTab, setActiveTab] = useState<'mic' | 'api' | 'voice' | 'about'>('mic');

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

  // Audio test refs
  const testStreamRef = useRef<MediaStream | null>(null);
  const testAudioCtxRef = useRef<AudioContext | null>(null);
  const testAnimFrameRef = useRef<number | null>(null);

  // Check Android or Browser mic permission status on mount
  useEffect(() => {
    checkPermissionStatus();

    // Listen for custom event from Android WebView
    const handleAndroidMicChange = (e: any) => {
      const granted = e.detail?.granted;
      setMicPermissionGranted(granted);
      if (granted) {
        setMicError(null);
      }
    };
    window.addEventListener('micPermissionChanged', handleAndroidMicChange);

    // Check server API health
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        setServerHealth({ hasKey: !!data.hasKey, model: data.model || 'gemini-3.8-flash' });
      })
      .catch((err) => console.warn('Health check error:', err));

    return () => {
      window.removeEventListener('micPermissionChanged', handleAndroidMicChange);
      stopMicTest();
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
      // Release stream immediately
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
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      testStreamRef.current = stream;
      setMicPermissionGranted(true);

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx({ sampleRate: 16000 });
      testAudioCtxRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const track = stream.getAudioTracks()[0];
      const settings = track.getSettings ? track.getSettings() : {};
      setMicTestDetails(
        `Hardware: ${track.label || 'Default Microphone'} (${settings.sampleRate || 16000}Hz)`
      );

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setMicTestVolume(Math.min(100, Math.round((avg / 128) * 100)));
        testAnimFrameRef.current = requestAnimationFrame(updateVolume);
      };
      updateVolume();
    } catch (err: any) {
      stopMicTest();
      setMicPermissionGranted(false);
      setMicError(
        err?.message?.includes('denied') || err?.name === 'NotAllowedError'
          ? 'Microphone permission was denied. Tap "Open Android App Settings" to enable it.'
          : `Failed to access microphone: ${err?.message || 'Hardware unavailable'}`
      );
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
      <div className="relative w-full max-w-md bg-zinc-950 rounded-3xl border border-cyan-500/40 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
              <SettingsIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Settings & Diagnostics</h3>
              <p className="text-[10px] text-cyan-400 font-mono">JARVIS • MAHI AI System</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 bg-black/40 text-xs font-semibold">
          {[
            { id: 'mic', label: 'Microphone', icon: Mic },
            { id: 'api', label: 'Gemini API', icon: Sparkles },
            { id: 'voice', label: 'Voice Persona', icon: Sliders },
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
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* TAB 1: MICROPHONE */}
          {activeTab === 'mic' && (
            <div className="space-y-4">
              {/* Status Card */}
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

              {/* Error Message banner if any */}
              {micError && (
                <div className="p-3 rounded-2xl bg-rose-950/80 border border-rose-500/60 text-rose-200 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold">Microphone Access Error</p>
                    <p className="text-[11px] text-rose-300">{micError}</p>
                  </div>
                </div>
              )}

              {/* Live Mic Test Meter */}
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

                {/* Meter visual bar */}
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

              {/* Action Buttons */}
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
                  className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white font-medium flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Android App Settings</span>
                </button>

                {isListening && (
                  <button
                    onClick={onStopListening}
                    className="w-full py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/40 border border-rose-500/40 text-rose-300 text-xs font-semibold cursor-pointer"
                  >
                    Stop Current Listening Session
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: GEMINI API */}
          {activeTab === 'api' && (
            <div className="space-y-4">
              {/* Server Key Status */}
              <div className="p-4 rounded-2xl glass-panel border border-white/10 bg-zinc-900/40 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-300">Server Configuration:</span>
                  {serverHealth?.hasKey ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Configured</span>
                    </span>
                  ) : (
                    <span className="text-rose-400 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Missing Key</span>
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-zinc-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Chat Model:</span>
                    <span className="text-cyan-300 font-mono">gemini-3.8-flash</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Live Voice Model:</span>
                    <span className="text-cyan-300 font-mono">gemini-3.1-flash-live-preview</span>
                  </div>
                </div>
              </div>

              {/* Connection Test Box */}
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

              {/* Troubleshooting Instructions */}
              <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-white/5 text-[11px] text-zinc-400 space-y-1.5">
                <p className="font-bold text-zinc-300">Troubleshooting:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>API keys are stored securely on the server backend (never exposed in the APK).</li>
                  <li>Configure <code>GEMINI_API_KEY</code> in Google AI Studio Settings &gt; Secrets.</li>
                  <li>Ensure your device is connected to WiFi or mobile data.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 3: VOICE PERSONA */}
          {activeTab === 'voice' && (
            <div className="space-y-3">
              <p className="text-zinc-300 font-medium">Select Mahi's Voice Persona:</p>
              <div className="grid grid-cols-2 gap-2">
                {['Aoede', 'Kore', 'Zephyr', 'Charon'].map((v) => (
                  <button
                    key={v}
                    onClick={() => onVoiceChange(v)}
                    className={`py-3 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
                      selectedVoice === v
                        ? 'bg-gradient-to-r from-cyan-600/30 to-blue-600/30 border-cyan-400 text-white shadow-lg shadow-cyan-500/20'
                        : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-zinc-500 pt-2 leading-relaxed">
                <strong>Aoede:</strong> Warm, gentle, friendly female voice (Default).<br />
                <strong>Kore:</strong> Calm, clear, empathetic female voice.<br />
                <strong>Zephyr:</strong> Upbeat, bright, modern voice.
              </p>
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
                <p className="text-xs text-cyan-400 font-mono">Version 10.0 • Mobile Edition</p>
              </div>
              <p className="text-xs text-zinc-300 font-medium">Created with AI by Sanam</p>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-[11px] text-zinc-400 text-left space-y-1">
                <div><strong>Package:</strong> com.sanam.mahi</div>
                <div><strong>Location:</strong> Sakraul, Sarlahi, Nepal (NPT UTC+5:45)</div>
                <div><strong>Engine:</strong> Gemini Live &amp; Gemini 3.8 Flash</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/10 bg-zinc-900/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs cursor-pointer shadow-md"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
