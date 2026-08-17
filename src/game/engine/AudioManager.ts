import type { AudioSettings } from "@/game/state/gameTypes";

type AudioContextConstructor = new () => AudioContext;

type BrowserWindow = Window & {
  AudioContext?: AudioContextConstructor;
  webkitAudioContext?: AudioContextConstructor;
};

export class AudioManager {
  private context: AudioContext | null = null;
  private musicOscillator: OscillatorNode | null = null;
  private musicGain: GainNode | null = null;
  private musicTimer: number | null = null;
  private engineOscillator: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;

  constructor(private readonly settings: AudioSettings) {}

  setSoundEnabled(enabled: boolean) {
    this.settings.soundEnabled = enabled;
    if (!enabled) this.stopEngine();
  }

  setMusicEnabled(enabled: boolean) {
    this.settings.musicEnabled = enabled;
    if (!enabled) this.stopMusic();
  }

  getSettings() {
    return { ...this.settings };
  }

  startMusic() {
    if (!this.settings.musicEnabled || this.musicOscillator) return;

    const context = this.ensureContext();
    if (!context) return;

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "triangle";
    oscillator.frequency.value = 110;
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.018, context.currentTime + 0.35);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();

    this.musicOscillator = oscillator;
    this.musicGain = gain;
    this.musicTimer = window.setInterval(() => {
      if (!this.musicOscillator || !this.context) return;
      const notes = [110, 130.81, 146.83, 123.47];
      const nextNote = notes[Math.floor(Date.now() / 1400) % notes.length];
      this.musicOscillator.frequency.setTargetAtTime(nextNote, this.context.currentTime, 0.12);
    }, 1400);
  }

  pauseMusic() {
    this.setMusicGain(0.0001);
  }

  resumeMusic() {
    if (this.settings.musicEnabled) this.startMusic();
    this.setMusicGain(0.018);
  }

  stopMusic() {
    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }

    if (this.musicOscillator && this.context) {
      try {
        this.musicOscillator.stop();
      } catch {
        // The oscillator may already be stopped by the browser.
      }
      this.musicOscillator.disconnect();
    }

    this.musicOscillator = null;
    this.musicGain?.disconnect();
    this.musicGain = null;
  }

  startEngine() {
    if (!this.settings.soundEnabled || this.engineOscillator) return;

    const context = this.ensureContext();
    if (!context) return;

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sawtooth";
    oscillator.frequency.value = 80;
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.018, context.currentTime + 0.2);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    this.engineOscillator = oscillator;
    this.engineGain = gain;
  }

  pauseEngine() {
    this.setEngineGain(0.0001);
  }

  resumeEngine() {
    if (this.settings.soundEnabled) this.startEngine();
    this.setEngineGain(0.018);
  }

  updateEngineSpeed(speed: number) {
    if (!this.engineOscillator || !this.engineGain || !this.context) return;

    const magnitude = Math.abs(speed);
    this.engineOscillator.frequency.setTargetAtTime(80 + magnitude * 0.8, this.context.currentTime, 0.04);
    this.engineGain.gain.setTargetAtTime(
      this.settings.soundEnabled ? Math.min(0.04, 0.008 + magnitude / 9000) : 0.0001,
      this.context.currentTime,
      0.04,
    );
  }

  stopEngine() {
    if (this.engineOscillator) {
      try {
        this.engineOscillator.stop();
      } catch {
        // The oscillator may already be stopped by the browser.
      }
      this.engineOscillator.disconnect();
    }

    this.engineOscillator = null;
    this.engineGain?.disconnect();
    this.engineGain = null;
  }

  playCollision() {
    this.playTone(90, 0.12, "sawtooth", 0.08);
  }

  playCollectible() {
    this.playTone(520, 0.1, "sine", 0.07);
    this.playTone(780, 0.14, "sine", 0.06, 0.08);
  }

  playComplete() {
    this.playTone(440, 0.12, "sine", 0.08);
    this.playTone(660, 0.16, "sine", 0.07, 0.12);
    this.playTone(880, 0.22, "sine", 0.06, 0.24);
  }

  playFailure() {
    this.playTone(150, 0.25, "sawtooth", 0.08);
  }

  destroy() {
    this.stopMusic();
    this.stopEngine();
    if (this.context) void this.context.close();
    this.context = null;
  }

  private playTone(frequency: number, duration: number, type: OscillatorType, volume: number, delay = 0) {
    if (!this.settings.soundEnabled) return;

    const context = this.ensureContext();
    if (!context) return;

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const startTime = context.currentTime + delay;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startTime);
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(startTime);
    oscillator.stop(startTime + duration + 0.02);
  }

  private ensureContext() {
    if (this.context) {
      if (this.context.state === "suspended") void this.context.resume();
      return this.context;
    }

    if (typeof window === "undefined") return null;
    const browserWindow = window as BrowserWindow;
    const AudioContextConstructor = browserWindow.AudioContext ?? browserWindow.webkitAudioContext;
    if (!AudioContextConstructor) return null;

    this.context = new AudioContextConstructor();
    return this.context;
  }

  private setMusicGain(value: number) {
    if (this.musicGain && this.context) this.musicGain.gain.setTargetAtTime(value, this.context.currentTime, 0.08);
  }

  private setEngineGain(value: number) {
    if (this.engineGain && this.context) this.engineGain.gain.setTargetAtTime(value, this.context.currentTime, 0.08);
  }
}
