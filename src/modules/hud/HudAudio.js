/** Мягкие синтезированные звуковые подсказки. */
export class HudAudio {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.lastHeartbeatTime = 0;
    const unlock = () => this.ensureContext();
    for (const event of ['pointerdown', 'touchstart', 'keydown']) window.addEventListener(event, unlock, { once: true });
  }

  ensureContext() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!this.ctx && AudioCtx) this.ctx = new AudioCtx();
      if (this.ctx?.state === 'suspended') this.ctx.resume().catch(() => {});
      return this.ctx;
    } catch { return null; }
  }

  note(frequency, duration = 0.12, volume = 0.035, delay = 0) {
    if (this.isMuted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const start = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.01);
  }

  playRoundStart() { this.note(262, .3); this.note(330, .3, .03, .14); this.note(392, .4, .03, .28); }
  playRoundCleared() { this.note(330, .25); this.note(392, .25, .03, .12); this.note(523, .4, .03, .24); }
  playHitMarker(lethal) { this.note(lethal ? 440 : 330, .08, .018); }
  playPointsTick() { this.note(523, .07, .012); }
  playHeartbeat(severity = 1) { if (Date.now() - this.lastHeartbeatTime < 900) return; this.lastHeartbeatTime = Date.now(); this.note(110, .2, .02 * Math.min(1, severity)); }
  playDryFire() { this.note(220, .08, .018); }
  playDenied() { this.note(196, .18, .025); }
  playGameOver() { this.note(330, .3); this.note(262, .4, .03, .2); this.note(220, .5, .03, .4); }
  playTeddyLaugh() { this.note(392, .16); this.note(330, .2, .025, .15); }
  playReelTick() { this.note(392, .055, .012); }
  playReelLock(index = 0) { this.note([262, 330, 392][index] || 392, .2, .025); }
  playJackpot() { this.playRoundCleared(); }
  playScam() { this.playDenied(); }
}
