/**
 * AmbientSound generates a gentle, emotional background lofi piano/chord atmosphere
 * using Web Audio API oscillators when Mahi is speaking or active.
 */

export class AmbientSound {
  private audioCtx: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private oscillators: OscillatorNode[] = [];
  private isPlaying: boolean = false;

  public start() {
    if (this.isPlaying) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      this.gainNode = this.audioCtx.createGain();
      this.gainNode.gain.setValueAtTime(0.03, this.audioCtx.currentTime); // very soft, gentle background
      this.gainNode.connect(this.audioCtx.destination);

      // Play a soothing emotional chord progression (Fmaj7 / Am / C / G)
      const frequencies = [174.61, 220.00, 261.63, 329.63]; // F3, A3, C4, E4 (Fmaj7 chord)

      this.oscillators = frequencies.map((freq) => {
        const osc = this.audioCtx!.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.audioCtx!.currentTime);

        const lfo = this.audioCtx!.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(0.1, this.audioCtx!.currentTime); // slow breathing vibrato

        const lfoGain = this.audioCtx!.createGain();
        lfoGain.gain.setValueAtTime(3.0, this.audioCtx!.currentTime);

        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfo.start();

        osc.connect(this.gainNode!);
        osc.start();
        return osc;
      });

      this.isPlaying = true;
    } catch (err) {
      console.warn('Ambient sound failed to start:', err);
    }
  }

  public stop() {
    if (!this.isPlaying) return;
    try {
      for (const osc of this.oscillators) {
        try {
          osc.stop();
          osc.disconnect();
        } catch {}
      }
      this.oscillators = [];
      if (this.gainNode) {
        this.gainNode.disconnect();
        this.gainNode = null;
      }
      if (this.audioCtx) {
        this.audioCtx.close();
        this.audioCtx = null;
      }
    } catch {}
    this.isPlaying = false;
  }
}

export const ambientSound = new AmbientSound();
