// 100% Procedural Web Audio API Spatial Soundscape Synthesizer

class NeuroSoundEngine {
  private ctx: AudioContext | null = null;
  private isEnabled = false;
  private masterGain: GainNode | null = null;
  private droneOsc1: OscillatorNode | null = null;
  private droneOsc2: OscillatorNode | null = null;
  private subOsc: OscillatorNode | null = null;
  private filterNode: BiquadFilterNode | null = null;

  private readonly sceneFrequencies: [number, number, number][] = [
    [55.0, 82.41, 110.0],    // 01 Portal: A1 + E2 + A2
    [65.41, 98.0, 146.83],   // 02 Awaken: C2 + G2 + D3
    [73.42, 110.0, 164.81],  // 03 Dimensions: D2 + A2 + E3
    [61.74, 92.5, 138.59],   // 04 The Core: B1 + F#2 + C#3
    [69.3, 103.83, 155.56],  // 05 Beyond: C#2 + G#2 + D#3
    [82.41, 123.47, 164.81], // 06 Finale: E2 + B2 + E3
  ];

  public toggle(): boolean {
    if (this.isEnabled) {
      this.disable();
      return false;
    } else {
      this.enable();
      return true;
    }
  }

  public enable(): void {
    if (this.isEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!this.ctx) {
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      if (!this.masterGain) {
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.001, this.ctx.currentTime);

        this.filterNode = this.ctx.createBiquadFilter();
        this.filterNode.type = 'lowpass';
        this.filterNode.frequency.setValueAtTime(240, this.ctx.currentTime);
        this.filterNode.Q.setValueAtTime(3.2, this.ctx.currentTime);

        this.droneOsc1 = this.ctx.createOscillator();
        this.droneOsc2 = this.ctx.createOscillator();
        this.subOsc = this.ctx.createOscillator();

        this.droneOsc1.type = 'sawtooth';
        this.droneOsc2.type = 'triangle';
        this.subOsc.type = 'sine';

        this.droneOsc1.frequency.setValueAtTime(55, this.ctx.currentTime);
        this.droneOsc2.frequency.setValueAtTime(82.41, this.ctx.currentTime);
        this.subOsc.frequency.setValueAtTime(55, this.ctx.currentTime);

        const osc1Gain = this.ctx.createGain();
        const osc2Gain = this.ctx.createGain();
        const subGain = this.ctx.createGain();

        osc1Gain.gain.value = 0.14;
        osc2Gain.gain.value = 0.18;
        subGain.gain.value = 0.28;

        this.droneOsc1.connect(osc1Gain);
        this.droneOsc2.connect(osc2Gain);
        this.subOsc.connect(subGain);

        osc1Gain.connect(this.filterNode);
        osc2Gain.connect(this.filterNode);
        subGain.connect(this.filterNode);

        this.filterNode.connect(this.masterGain);
        this.masterGain.connect(this.ctx.destination);

        this.droneOsc1.start();
        this.droneOsc2.start();
        this.subOsc.start();
      }

      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.exponentialRampToValueAtTime(0.18, this.ctx.currentTime + 0.6);
      this.isEnabled = true;
    } catch {
      this.isEnabled = false;
    }
  }

  public disable(): void {
    if (!this.isEnabled || !this.ctx || !this.masterGain) {
      this.isEnabled = false;
      return;
    }
    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
    this.isEnabled = false;
  }

  public updateScroll(sceneIndex: number, velocity: number): void {
    if (!this.isEnabled || !this.ctx || !this.filterNode || !this.droneOsc1 || !this.droneOsc2 || !this.subOsc) return;
    const now = this.ctx.currentTime;
    const freqs = this.sceneFrequencies[Math.max(0, Math.min(5, sceneIndex))] || this.sceneFrequencies[0];
    this.subOsc.frequency.setTargetAtTime(freqs[0], now, 0.4);
    this.droneOsc1.frequency.setTargetAtTime(freqs[1], now, 0.4);
    this.droneOsc2.frequency.setTargetAtTime(freqs[2], now, 0.4);

    const speedBoost = Math.min(900, Math.abs(velocity) * 320);
    this.filterNode.frequency.setTargetAtTime(220 + speedBoost, now, 0.12);
  }

  public playInteractionChime(pitchMultiplier = 1.0): void {
    if (!this.isEnabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      const baseFreq = 528 * pitchMultiplier;
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.498, now + 0.28);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.09, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.48);
    } catch {
      // Ignore audio errors on restricted devices
    }
  }

  public playHoverTick(): void {
    if (!this.isEnabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1240, now);
      osc.frequency.exponentialRampToValueAtTime(620, now + 0.045);

      gain.gain.setValueAtTime(0.035, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.055);
    } catch {
      // Ignore
    }
  }

  public playWarpSequence(): void {
    try {
      this.enable();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Sub-bass gravitational swell
      const sub = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(38, now);
      sub.frequency.exponentialRampToValueAtTime(110, now + 0.9);
      sub.frequency.exponentialRampToValueAtTime(55, now + 2.2);

      subGain.gain.setValueAtTime(0.001, now);
      subGain.gain.linearRampToValueAtTime(0.28, now + 0.45);
      subGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.3);

      sub.connect(subGain);
      subGain.connect(this.ctx.destination);
      sub.start(now);
      sub.stop(now + 2.35);

      // Shimmering harmonic fifths chord (A2, E3, B3, F#4)
      const shimmerFreqs = [220, 329.63, 493.88, 739.99];
      shimmerFreqs.forEach((f, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(f * 0.5, now + idx * 0.06);
        osc.frequency.exponentialRampToValueAtTime(f, now + 0.75 + idx * 0.06);

        g.gain.setValueAtTime(0.0001, now + idx * 0.06);
        g.gain.linearRampToValueAtTime(0.065 / (idx + 1), now + 0.5 + idx * 0.06);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 2.4);

        osc.connect(g);
        g.connect(this.ctx.destination);
        osc.start(now + idx * 0.06);
        osc.stop(now + 2.45);
      });
    } catch {
      // Ignore audio restrictions
    }
  }
}

export const soundEngine = new NeuroSoundEngine();

