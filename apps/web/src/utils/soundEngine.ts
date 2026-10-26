// ─────────────────────────────────────────────
// SENTINEL Web — Web Audio API Synthesizer & Sound Engine
// ─────────────────────────────────────────────

import type { AlertSeverity } from '@sentinel/types';

class SoundEngine {
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.7; // 0.0 to 1.0
  private lastPlayedTimestamps: Map<string, number> = new Map();
  private readonly COOLDOWN_MS = 10_000; // 10s cooldown per alert/type

  constructor() {
    // Load persisted preferences
    if (typeof window !== 'undefined') {
      try {
        const savedMute = localStorage.getItem('sentinel_sound_muted');
        if (savedMute !== null) {
          this.isMuted = savedMute === 'true';
        }
        const savedVolume = localStorage.getItem('sentinel_sound_volume');
        if (savedVolume !== null) {
          this.volume = Math.max(0, Math.min(1, parseFloat(savedVolume)));
        }
      } catch {
        // Fallback to defaults if localStorage restricted
      }
    }
  }

  /**
   * Lazily initialize or resume AudioContext on user interaction.
   */
  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.audioCtx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }

    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      void this.audioCtx.resume();
    }

    return this.audioCtx;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public setIsMuted(muted: boolean): void {
    this.isMuted = muted;
    try {
      localStorage.setItem('sentinel_sound_muted', String(muted));
    } catch (e) {
      void e;
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    try {
      localStorage.setItem('sentinel_sound_volume', String(this.volume));
    } catch (e) {
      void e;
    }
  }

  /**
   * Play synthesized sound beacon for alert severity with anti-flooding cooldown.
   */
  public playAlertSound(severity: AlertSeverity, alertId?: string): void {
    if (this.isMuted || this.volume <= 0) return;

    // Anti-flooding check
    const key = alertId || severity;
    const now = Date.now();
    const lastPlayed = this.lastPlayedTimestamps.get(key) || 0;
    if (now - lastPlayed < this.COOLDOWN_MS) {
      return; // Cooldown active; suppress audio flood
    }
    this.lastPlayedTimestamps.set(key, now);

    this.synthesizeSound(severity);
  }

  /**
   * Play test audition sound bypassing cooldown.
   */
  public playTestSound(severity: AlertSeverity | 'RESOLVED'): void {
    if (this.isMuted) return;
    this.synthesizeSound(severity);
  }

  /**
   * Synthesize tone using Web Audio oscillator nodes.
   */
  private synthesizeSound(type: AlertSeverity | 'RESOLVED'): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(this.volume * 0.35, ctx.currentTime);
    masterGain.connect(ctx.destination);

    switch (type) {
      case 'CRITICAL':
        this.playCriticalAlarm(ctx, masterGain);
        break;
      case 'HIGH':
        this.playHighChime(ctx, masterGain);
        break;
      case 'WARNING':
        this.playWarningPing(ctx, masterGain);
        break;
      case 'RESOLVED':
        this.playResolvedAscendingTriad(ctx, masterGain);
        break;
      case 'INFO':
      default:
        this.playInfoPing(ctx, masterGain);
        break;
    }
  }

  // 🚨 CRITICAL: Rapid urgent dual-tone alternating pulse (880Hz / 659Hz)
  private playCriticalAlarm(ctx: AudioContext, destination: GainNode): void {
    const startTime = ctx.currentTime;
    const duration = 0.8;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, startTime);
    osc.frequency.setValueAtTime(659.25, startTime + 0.2);
    osc.frequency.setValueAtTime(880, startTime + 0.4);
    osc.frequency.setValueAtTime(659.25, startTime + 0.6);

    gain.gain.setValueAtTime(0.8, startTime);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

    osc.connect(gain);
    gain.connect(destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  // ⚠️ HIGH: Double-pip alert chime (660Hz -> 880Hz)
  private playHighChime(ctx: AudioContext, destination: GainNode): void {
    const startTime = ctx.currentTime;

    const playPip = (freq: number, delay: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime + delay);

      gain.gain.setValueAtTime(0.7, startTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + delay + 0.22);

      osc.connect(gain);
      gain.connect(destination);

      osc.start(startTime + delay);
      osc.stop(startTime + delay + 0.22);
    };

    playPip(660, 0);
    playPip(880, 0.18);
  }

  // 🔔 WARNING: Subtle single electronic ping (520Hz)
  private playWarningPing(ctx: AudioContext, destination: GainNode): void {
    const startTime = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, startTime); // C5

    gain.gain.setValueAtTime(0.6, startTime);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.35);

    osc.connect(gain);
    gain.connect(destination);

    osc.start(startTime);
    osc.stop(startTime + 0.35);
  }

  // ℹ️ INFO: Soft brief blip (440Hz)
  private playInfoPing(ctx: AudioContext, destination: GainNode): void {
    const startTime = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, startTime);

    gain.gain.setValueAtTime(0.4, startTime);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.18);

    osc.connect(gain);
    gain.connect(destination);

    osc.start(startTime);
    osc.stop(startTime + 0.18);
  }

  // ✅ RESOLVED: Pleasant ascending major triad (C5 -> E5 -> G5)
  private playResolvedAscendingTriad(ctx: AudioContext, destination: GainNode): void {
    const startTime = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime + idx * 0.1);

      gain.gain.setValueAtTime(0.5, startTime + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + idx * 0.1 + 0.3);

      osc.connect(gain);
      gain.connect(destination);

      osc.start(startTime + idx * 0.1);
      osc.stop(startTime + idx * 0.1 + 0.3);
    });
  }
}

export const soundEngine = new SoundEngine();
