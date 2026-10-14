import React, { useEffect, useRef } from 'react';
import { SessionState } from '../services/liveSession';
import { AudioRecorder } from '../services/audioRecorder';
import { AudioStreamer } from '../services/audioStreamer';

interface VoiceWaveformProps {
  state: SessionState;
  recorder: AudioRecorder | null;
  streamer: AudioStreamer | null;
}

export const VoiceWaveform: React.FC<VoiceWaveformProps> = ({ state, recorder, streamer }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let animationFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dataArray = new Uint8Array(64);

    const render = () => {
      // Pick audio source according to current active speaker
      if (state === 'speaking' && streamer) {
        streamer.getFrequencyData(dataArray);
      } else if (state === 'listening' && recorder) {
        recorder.getFrequencyData(dataArray);
      } else {
        // Idle gentle simulated wave
        const time = Date.now() * 0.003;
        for (let i = 0; i < dataArray.length; i++) {
          dataArray[i] = Math.max(10, Math.sin(time + i * 0.2) * 20 + 25);
        }
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barCount = 36;
      const spacing = 4;
      const totalWidth = canvas.width;
      const barWidth = (totalWidth - spacing * (barCount - 1)) / barCount;
      const halfHeight = canvas.height / 2;

      // Color scheme based on state
      const isMahi = state === 'speaking';
      const isListening = state === 'listening';

      for (let i = 0; i < barCount; i++) {
        // Map bar index to frequency array index (mirror around center for symmmetry)
        const sampleIdx = Math.abs(i - barCount / 2);
        const normSample = (dataArray[Math.floor(sampleIdx * 1.4)] || 0) / 255;

        // Dynamic height
        const minHeight = state === 'disconnected' ? 4 : 6;
        const barHeight = Math.max(minHeight, normSample * (canvas.height * 0.85));

        const x = i * (barWidth + spacing);
        const y = halfHeight - barHeight / 2;

        // Gradient for bars
        const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
        if (isMahi) {
          grad.addColorStop(0, '#f43f5e'); // Rose
          grad.addColorStop(0.5, '#ec4899'); // Pink
          grad.addColorStop(1, '#a855f7'); // Violet
        } else if (isListening) {
          grad.addColorStop(0, '#22d3ee'); // Cyan
          grad.addColorStop(0.5, '#06b6d4'); // Teal
          grad.addColorStop(1, '#3b82f6'); // Blue
        } else {
          grad.addColorStop(0, '#4b5563');
          grad.addColorStop(1, '#1f2937');
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        const radius = barWidth / 2;
        ctx.roundRect(x, y, barWidth, barHeight, radius);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [state, recorder, streamer]);

  return (
    <div className="w-full max-w-md mx-auto px-4 py-2 flex flex-col items-center">
      <div className="w-full h-12 flex items-center justify-center relative">
        <canvas
          ref={canvasRef}
          width={360}
          height={48}
          className="w-full max-w-xs h-12 drop-shadow-sm"
        />
      </div>
      <div className="flex items-center justify-between w-full max-w-xs px-2 text-[10px] tracking-wider text-zinc-500 font-display uppercase font-medium">
        <span>Low Hz</span>
        <span className="text-zinc-600">● 24kHz Live Stream ●</span>
        <span>High Hz</span>
      </div>
    </div>
  );
};
