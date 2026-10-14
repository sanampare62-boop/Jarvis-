/**
 * AudioStreamer handles low-latency 24kHz PCM audio playback from Gemini Live API.
 * Uses Web Audio API with scheduled buffer queuing for gapless playback,
 * AnalyserNode for audio visualization, and instant interruption support.
 */

export class AudioStreamer {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private nextStartTime: number = 0;
  private activeSources: AudioBufferSourceNode[] = [];
  private isRunning: boolean = false;
  private onPlaybackStateChange?: (isPlaying: boolean) => void;
  private checkInterval: any = null;

  constructor(onPlaybackStateChange?: (isPlaying: boolean) => void) {
    this.onPlaybackStateChange = onPlaybackStateChange;
  }

  public init() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass({ sampleRate: 24000 });
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;
      this.analyser.connect(this.audioCtx.destination);
    }

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    if (!this.checkInterval) {
      this.checkInterval = setInterval(() => {
        this.updatePlaybackState();
      }, 50);
    }
  }

  private updatePlaybackState() {
    if (!this.audioCtx) return;
    const nowPlaying = this.activeSources.length > 0 && this.audioCtx.currentTime < this.nextStartTime;
    if (nowPlaying !== this.isRunning) {
      this.isRunning = nowPlaying;
      this.onPlaybackStateChange?.(nowPlaying);
    }
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public getVolume(): number {
    if (!this.analyser || !this.isRunning) return 0;
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i];
    }
    return sum / data.length / 255;
  }

  public getFrequencyData(array: Uint8Array): void {
    if (!this.analyser) {
      array.fill(0);
      return;
    }
    this.analyser.getByteFrequencyData(array as any);
  }

  /**
   * Enqueue a chunk of base64-encoded raw 16-bit PCM little-endian 24kHz audio
   */
  public queueAudioChunk(base64Chunk: string) {
    this.init();
    if (!this.audioCtx || !this.analyser) return;

    try {
      const binaryString = atob(base64Chunk);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const numSamples = Math.floor(len / 2);
      if (numSamples <= 0) return;

      const dataView = new DataView(bytes.buffer);
      const float32Array = new Float32Array(numSamples);

      for (let i = 0; i < numSamples; i++) {
        const int16 = dataView.getInt16(i * 2, true); // true = little endian
        float32Array[i] = int16 / (int16 < 0 ? 32768 : 32767);
      }

      const audioBuffer = this.audioCtx.createBuffer(1, numSamples, 24000);
      audioBuffer.copyToChannel(float32Array, 0);

      const source = this.audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.analyser);

      const currentTime = this.audioCtx.currentTime;
      if (this.nextStartTime < currentTime) {
        this.nextStartTime = currentTime + 0.02; // tiny safety margin to prevent glitching
      }

      source.start(this.nextStartTime);
      this.nextStartTime += audioBuffer.duration;
      this.activeSources.push(source);

      this.updatePlaybackState();

      source.onended = () => {
        const idx = this.activeSources.indexOf(source);
        if (idx !== -1) {
          this.activeSources.splice(idx, 1);
        }
        this.updatePlaybackState();
      };
    } catch (err) {
      console.error('Error queuing audio chunk:', err);
    }
  }

  /**
   * Immediately stops all currently playing and scheduled audio sources (used on interruption)
   */
  public stop() {
    for (const source of this.activeSources) {
      try {
        source.stop();
        source.disconnect();
      } catch {}
    }
    this.activeSources = [];
    if (this.audioCtx) {
      this.nextStartTime = this.audioCtx.currentTime;
    }
    this.updatePlaybackState();
  }

  public destroy() {
    this.stop();
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    if (this.audioCtx) {
      try {
        this.audioCtx.close();
      } catch {}
      this.audioCtx = null;
    }
  }
}
