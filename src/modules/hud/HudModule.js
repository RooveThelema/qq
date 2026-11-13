/**
 * HudModule - Классический интерфейс Call of Duty: Zombies:
 * меловые черточки раунда, очки, здоровье/стамина, патроны, прицел,
 * хитмаркеры, табло [TAB], рестарт, пауза и переключение звука.
 */
import { EVENTS } from '../../core/Constants.js';
import { HudAudio } from './HudAudio.js';
import { ChalkRenderer } from './ChalkRenderer.js';

export class HudModule {
  constructor() {
    this.name = 'hud';
    this.engine = null;
    this.alwaysUpdate = true;

    this.audio = new HudAudio();

    this.points = 500;
    this.displayedPoints = 500;
    this.scorePunch = 1.0;

    this.round = 1;
    this.roundState = 'active';
    this.zombiesRemaining = 0;

    this.hp = 100;
    this.maxHp = 100;
    this.isDead = false;

    this.weapon = {
      name: 'M1911',
      currentAmmo: 8,
      reserveAmmo: 40,
      magSize: 8,
      isReloading: false
    };
    this.reloadStartTime = 0;
    this.reloadDuration = 1300;

    this.interactionPrompt = null;
    this.promptShake = 0;
    this.promptError = false;

    this.floatingPoints = [];
    this.hitMarker = {
      active: false,
      alpha: 0,
      isLethal: false,
      timer: 0
    };

    this.roundSplash = null;
    this.roundClearedSplash = null;

    this.bloodVignetteIntensity = 0;
    this.crosshairSpread = 0;
    this.lastShotTime = 0;

    this.stats = {
      kills: 0,
      headshots: 0,
      totalEarned: 500,
      roundsSurvived: 1,
      shotsFired: 0
    };

    this.showScoreboard = false;
    this.gameOverFade = 0;
    this.tallyGlowTime = 0;

    this.stamina = 100;
    this.maxStamina = 100;
    this.activeInstaKill = 0;
    this.activeDoublePoints = 0;
  }

  restartGame() {
    this.isDead = false;
    this.gameOverFade = 0;
    this.hp = 100;
    this.points = 500;
    this.displayedPoints = 500;
    this.scorePunch = 1.0;
    this.round = 1;
    this.roundState = 'active';
    this.bloodVignetteIntensity = 0;
    this.roundSplash = null;
    this.roundClearedSplash = null;
    this.floatingPoints = [];
    this.interactionPrompt = null;
    this.hitMarker.active = false;
    this.activeInstaKill = 0;
    this.activeDoublePoints = 0;
    this.showScoreboard = false;
    this.stats = {
      kills: 0,
      headshots: 0,
      totalEarned: 500,
      roundsSurvived: 1,
      shotsFired: 0
    };
    this.engine.clearInputs();
    this.engine.bus.emit(EVENTS.GAME_RESTART, {});
  }

  toggleMute() {
    const nextMuted = !this.audio.isMuted;
    this.audio.isMuted = nextMuted;
    const visuals = this.engine?.getModule('visuals');
    if (visuals) {
      visuals.soundEnabled = !nextMuted;
    }
    return nextMuted;
  }

  init(engine) {
    this.engine = engine;
    const bus = engine.bus;

    bus.on(EVENTS.PLAYER_MOVED, (data) => {
      if (data.stamina !== undefined) this.stamina = data.stamina;
      if (data.maxStamina !== undefined) this.maxStamina = data.maxStamina;
    });

    bus.on('powerup:activated', (data) => {
      if (data.type === 'insta_kill') this.activeInstaKill = data.duration || 15;
      if (data.type === 'double_points') this.activeDoublePoints = data.duration || 20;
    });

    bus.on('hud:teddy_laugh', () => {
      this.audio.playTeddyLaugh();
    });

    bus.on(EVENTS.PLAYER_POINTS_CHANGED, (data) => {
      const delta = data.delta || 0;
      this.points = data.points;
      if (delta > 0) {
        this.stats.totalEarned += delta;
        this.scorePunch = 1.35;
        this.audio.playPointsTick();

        this.floatingPoints.push({
          text: `+${delta}`,
          x: window.innerWidth - 70 + (Math.random() - 0.5) * 30,
          y: window.innerHeight - 130,
          alpha: 1.0,
          vy: -1.6 - Math.random() * 0.5,
          color: delta >= 100 ? '#ffea00' : '#88ff88',
          scale: delta >= 100 ? 1.3 : 1.0
        });
      } else if (delta < 0) {
        this.floatingPoints.push({
          text: `${delta}`,
          x: window.innerWidth - 70,
          y: window.innerHeight - 130,
          alpha: 1.0,
          vy: -1.2,
          color: '#ff4444',
          scale: 1.1
        });
      }
    });

    bus.on(EVENTS.PLAYER_DAMAGED, (data) => {
      this.hp = Math.max(0, data.currentHp !== undefined ? data.currentHp : this.hp - data.amount);
      this.bloodVignetteIntensity = Math.min(1.0, this.bloodVignetteIntensity + 0.45);
      this.crosshairSpread = Math.min(24, this.crosshairSpread + 10);
    });

    bus.on(EVENTS.PLAYER_HEALED, (data) => {
      this.hp = data.currentHp;
    });

    bus.on(EVENTS.PLAYER_DIED, () => {
      this.isDead = true;
      this.gameOverFade = 0;
      this.stats.roundsSurvived = this.round;
      this.audio.playGameOver();
    });

    bus.on(EVENTS.PLAYER_REVIVE, () => {
      this.isDead = false;
      this.gameOverFade = 0;
      this.hp = this.maxHp;
      this.bloodVignetteIntensity = 0;
    });

    bus.on(EVENTS.ROUND_START, (data) => {
      this.round = data.roundNumber || this.round;
      this.roundState = 'active';
      this.triggerRoundStartSplash(this.round, Boolean(data.isDogRound));
      this.audio.playRoundStart();
    });

    bus.on(EVENTS.ROUND_CLEARED, (data) => {
      this.roundState = 'cleared';
      this.triggerRoundClearedSplash(data.roundNumber || this.round);
      this.audio.playRoundCleared();
    });

    bus.on(EVENTS.ZOMBIE_DAMAGED, () => {
      this.triggerHitMarker(false);
      this.audio.playHitMarker(false);
    });

    bus.on(EVENTS.ZOMBIE_KILLED, (data) => {
      this.stats.kills++;
      if (data && data.isHeadshot) this.stats.headshots++;

      this.triggerHitMarker(true);
      this.audio.playHitMarker(true);
    });

    bus.on(EVENTS.WEAPON_CHANGED, (data) => {
      this.weapon.name = data.name || this.weapon.name;
      this.weapon.currentAmmo = data.currentAmmo;
      this.weapon.reserveAmmo = data.reserveAmmo;
      this.weapon.magSize = data.magSize || this.weapon.magSize;
      this.weapon.isReloading = false;
    });

    bus.on(EVENTS.WEAPON_FIRED, (data) => {
      this.weapon.currentAmmo = data.currentAmmo;
      this.weapon.reserveAmmo = data.reserveAmmo;
      this.stats.shotsFired++;
      this.crosshairSpread = Math.min(28, this.crosshairSpread + 8);
      this.lastShotTime = this.engine.now();
    });

    bus.on(EVENTS.WEAPON_RELOAD_START, (data) => {
      this.weapon.isReloading = true;
      this.reloadStartTime = this.engine.now();
      this.reloadDuration = (data && data.reloadTime) || 1500;
    });

    bus.on(EVENTS.WEAPON_RELOAD_DONE, (data) => {
      this.weapon.isReloading = false;
      this.weapon.currentAmmo = data.currentAmmo;
      this.weapon.reserveAmmo = data.reserveAmmo;
    });

    bus.on('hud:prompt', (promptText) => {
      this.interactionPrompt = promptText;
    });

    bus.on('hud:prompt_deny', () => {
      this.promptShake = 1.0;
      this.promptError = true;
      this.audio.playDenied();
      setTimeout(() => { this.promptError = false; }, 800);
    });

    window.addEventListener('keydown', (e) => {
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target?.isContentEditable) return;

      if (e.key === 'Tab') {
        e.preventDefault();
        if (!this.engine.isPaused && !this.isDead) {
          this.showScoreboard = true;
        }
      }
      if (this.isDead && !this.engine.isPaused && (e.code === 'Space' || e.code === 'KeyR')) {
        e.preventDefault();
        this.restartGame();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.key === 'Tab') {
        this.showScoreboard = false;
      }
    });
  }

  triggerHitMarker(isLethal) {
    this.hitMarker.active = true;
    this.hitMarker.isLethal = isLethal;
    this.hitMarker.alpha = 1.0;
    this.hitMarker.timer = 0.16;
  }

  triggerRoundStartSplash(roundNumber, isDogRound = false) {
    this.roundSplash = {
      title: isDogRound ? `РАУНД ${roundNumber} — ГОНЧИЕ!` : `РАУНД ${roundNumber}`,
      subtitle: isDogRound
        ? 'ОНИ ИДУТ ЗА ВАШИМИ ДУШАМИ...'
        : (roundNumber === 1 ? 'ВЫЖИВАЙТЕ В БУНКЕРЕ' : 'ВОЛНА ПРИБЛИЖАЕТСЯ...'),
      timer: 3.0,
      maxTimer: 3.0,
      scale: 1.8,
      alpha: 1.0
    };
  }

  triggerRoundClearedSplash(roundNumber) {
    this.roundClearedSplash = {
      title: `РАУНД ${roundNumber} ЗАЧИЩЕН`,
      subtitle: 'ПЕРЕДЫШКА МЕЖДУ ВОЛНАМИ',
      timer: 2.6,
      maxTimer: 2.6,
      scale: 1.4,
      alpha: 1.0
    };
  }

  update(dt) {
    this.tallyGlowTime += dt * 3;

    if (this.displayedPoints !== this.points) {
      const diff = this.points - this.displayedPoints;
      if (Math.abs(diff) < 2) {
        this.displayedPoints = this.points;
      } else {
        this.displayedPoints += Math.round(diff * Math.min(1, dt * 10));
      }
    }

    if (this.scorePunch > 1.0) {
      this.scorePunch += (1.0 - this.scorePunch) * dt * 9;
    }

    for (let i = this.floatingPoints.length - 1; i >= 0; i--) {
      const p = this.floatingPoints[i];
      p.y += p.vy;
      p.alpha -= dt * 1.35;
      if (p.alpha <= 0) {
        this.floatingPoints.splice(i, 1);
      }
    }

    if (this.isDead && this.gameOverFade < 1.0) {
      this.gameOverFade = Math.min(1.0, this.gameOverFade + dt * 0.9);
    }

    // При паузе (реклама/лудка/меню) игровые таймеры не тикают
    if (this.engine.isPaused) return;

    if (this.activeInstaKill > 0) this.activeInstaKill = Math.max(0, this.activeInstaKill - dt);
    if (this.activeDoublePoints > 0) this.activeDoublePoints = Math.max(0, this.activeDoublePoints - dt);

    if (this.hitMarker.active) {
      this.hitMarker.timer -= dt;
      this.hitMarker.alpha = Math.max(0, this.hitMarker.timer / 0.16);
      if (this.hitMarker.timer <= 0) {
        this.hitMarker.active = false;
      }
    }

    if (this.roundSplash) {
      this.roundSplash.timer -= dt;
      const progress = 1 - (this.roundSplash.timer / this.roundSplash.maxTimer);
      this.roundSplash.scale = 1.6 - progress * 0.45;
      if (this.roundSplash.timer < 0.6) {
        this.roundSplash.alpha = this.roundSplash.timer / 0.6;
      }
      if (this.roundSplash.timer <= 0) {
        this.roundSplash = null;
      }
    }

    if (this.roundClearedSplash) {
      this.roundClearedSplash.timer -= dt;
      if (this.roundClearedSplash.timer < 0.5) {
        this.roundClearedSplash.alpha = this.roundClearedSplash.timer / 0.5;
      }
      if (this.roundClearedSplash.timer <= 0) {
        this.roundClearedSplash = null;
      }
    }

    const missingHpFactor = Math.max(0, 1 - (this.hp / this.maxHp));
    const targetVignette = missingHpFactor * 0.85;
    this.bloodVignetteIntensity += (targetVignette - this.bloodVignetteIntensity) * dt * 3.5;

    if (this.hp <= 35 && !this.isDead) {
      const severity = 1 + (1 - this.hp / 35);
      this.audio.playHeartbeat(severity);
    }

    if (this.crosshairSpread > 0) {
      this.crosshairSpread += (0 - this.crosshairSpread) * dt * 10;
    }

    if (this.promptShake > 0) {
      this.promptShake -= dt * 2.5;
      if (this.promptShake < 0) this.promptShake = 0;
    }

    const zombiesMod = this.engine.getModule('zombies');
    if (zombiesMod) {
      this.zombiesRemaining = zombiesMod.zombiesAlive || 0;
    }
  }

  renderUI(ctx, width, height) {
    ctx.save();

    this.renderBloodVignette(ctx, width, height);

    if (!this.isDead) {
      this.renderRoundCounter(ctx, width, height);
      this.renderPointsScore(ctx, width, height);
      this.renderWeaponHud(ctx, width, height);
      this.renderHealthBar(ctx, width, height);
      this.renderInteractionPrompt(ctx, width, height);
      this.renderRoundBanners(ctx, width, height);

      if (!this.engine.isPaused) {
        this.renderCrosshairAndHitmarker(ctx);
      }

      if (this.showScoreboard && !this.engine.isPaused) {
        this.renderScoreboard(ctx, width, height);
      }
    } else {
      this.renderGameOverScreen(ctx, width, height);
    }

    ctx.restore();
  }

  renderBloodVignette(ctx, width, height) {
    if (this.bloodVignetteIntensity <= 0.02 && !this.isDead) return;

    ctx.save();
    let alpha = this.isDead ? Math.min(0.95, this.gameOverFade) : this.bloodVignetteIntensity;

    if (this.hp <= 35 && !this.isDead) {
      const pulse = Math.sin(performance.now() * 0.007) * 0.15 + 0.85;
      alpha *= pulse;
    }

    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.max(width, height) * 0.72;

    const grad = ctx.createRadialGradient(cx, cy, radius * 0.35, cx, cy, radius);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(0.65, `rgba(120, 10, 10, ${alpha * 0.35})`);
    grad.addColorStop(1, `rgba(90, 0, 0, ${alpha * 0.88})`);

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    if (this.bloodVignetteIntensity > 0.4) {
      ctx.fillStyle = `rgba(160, 0, 0, ${alpha * 0.4})`;
      ctx.beginPath();
      ctx.arc(0, 0, 180 * alpha, 0, Math.PI * 2);
      ctx.arc(width, 0, 180 * alpha, 0, Math.PI * 2);
      ctx.arc(0, height, 220 * alpha, 0, Math.PI * 2);
      ctx.arc(width, height, 220 * alpha, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  renderRoundCounter(ctx, width, height) {
    ctx.save();
    const baseX = 45;
    const baseY = height - 42;

    const flicker = Math.sin(this.tallyGlowTime) * 0.12 + 0.88;
    const chalkColor = this.roundState === 'cleared' ? '#ffaa33' : '#ff2b2b';

    ctx.font = '900 13px "Courier New", monospace';
    ctx.fillStyle = '#a83232';
    ctx.shadowColor = '#4a0000';
    ctx.shadowBlur = 6;
    ctx.fillText('РАУНД', baseX, baseY - 54);

    ChalkRenderer.drawRoundTallies(ctx, baseX, baseY, this.round, 1.1, flicker, chalkColor);
    ChalkRenderer.drawBloodDrips(ctx, baseX + 10, baseY + 6, 3, 1.0);

    if (this.zombiesRemaining > 0) {
      ctx.font = 'bold 12px "Courier New", monospace';
      ctx.fillStyle = 'rgba(255, 120, 120, 0.85)';
      ctx.shadowBlur = 0;
      ctx.fillText(`ВРАГОВ: ${this.zombiesRemaining}`, baseX, baseY + 24);
    }

    ctx.restore();
  }

  renderPointsScore(ctx, width, height) {
    ctx.save();
    const rightMargin = 45;
    const scoreY = height - 100;

    const scale = this.scorePunch;
    ctx.translate(width - rightMargin, scoreY);
    ctx.scale(scale, scale);

    ctx.font = '900 42px "Courier New", monospace';
    ctx.textAlign = 'right';
    ctx.fillStyle = '#f0fff0';
    ctx.shadowColor = '#4caf50';
    ctx.shadowBlur = 10 * scale;

    ctx.fillText(`${this.displayedPoints}`, 0, 0);

    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = '#81c784';
    ctx.shadowBlur = 0;
    ctx.fillText('ОЧКИ', 0, -36);

    ctx.restore();

    for (const fp of this.floatingPoints) {
      ctx.save();
      ctx.fillStyle = fp.color || '#ffff55';
      ctx.globalAlpha = fp.alpha;
      ctx.font = `bold ${Math.round(20 * (fp.scale || 1))}px "Courier New", monospace`;
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 5;
      ctx.textAlign = 'right';
      ctx.fillText(fp.text, fp.x, fp.y);
      ctx.restore();
    }
  }

  renderWeaponHud(ctx, width, height) {
    ctx.save();
    const rightMargin = 45;
    const baseY = height - 35;

    ctx.textAlign = 'right';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillStyle = '#b0b8bf';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 4;
    ctx.fillText(this.weapon.name.toUpperCase(), width - rightMargin, baseY - 32);

    const isLowAmmo = this.weapon.currentAmmo <= Math.max(2, Math.floor(this.weapon.magSize * 0.25));
    const pulseRed = isLowAmmo && Math.floor(performance.now() / 250) % 2 === 0;

    if (this.weapon.isReloading) {
      ctx.font = '900 24px "Courier New", monospace';
      ctx.fillStyle = '#ffb300';
      ctx.fillText('ПЕРЕЗАРЯДКА...', width - rightMargin, baseY);

      const now = this.engine.now();
      const elapsed = now - this.reloadStartTime;
      const progress = Math.min(1.0, Math.max(0, elapsed / this.reloadDuration));

      const ringX = width - rightMargin - 210;
      const ringY = baseY - 8;
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      ctx.arc(ringX, ringY, 12, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#ffb300';
      ctx.beginPath();
      ctx.arc(ringX, ringY, 12, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
      ctx.stroke();
    } else {
      ctx.font = '900 36px "Courier New", monospace';
      ctx.fillStyle = pulseRed ? '#ff2222' : '#ffffff';
      if (pulseRed) {
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 12;
      }
      ctx.fillText(`${this.weapon.currentAmmo} `, width - rightMargin - 78, baseY);

      ctx.font = 'bold 22px "Courier New", monospace';
      ctx.fillStyle = '#78909c';
      ctx.shadowBlur = 0;
      ctx.fillText(`/ ${this.weapon.reserveAmmo}`, width - rightMargin, baseY);

      if (isLowAmmo && this.weapon.reserveAmmo > 0) {
        ctx.font = 'bold 12px sans-serif';
        ctx.fillStyle = '#ff4444';
        ctx.fillText('[R] ПЕРЕЗАРЯДКА', width - rightMargin, baseY + 18);
      }
    }

    ctx.restore();
  }

  renderHealthBar(ctx) {
    ctx.save();
    const barX = 28;
    const barY = 34;
    const barW = 210;
    const barH = 12;

    const hpPercent = Math.max(0, Math.min(1, this.hp / this.maxHp));

    ctx.fillStyle = 'rgba(18, 20, 22, 0.85)';
    ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);

    ctx.strokeStyle = '#37474f';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(barX - 2, barY - 2, barW + 4, barH + 4);

    let hpColor = '#4caf50';
    if (hpPercent <= 0.6) hpColor = '#ff9800';
    if (hpPercent <= 0.3) hpColor = '#f44336';

    ctx.fillStyle = hpColor;
    ctx.shadowColor = hpColor;
    ctx.shadowBlur = hpPercent < 0.3 ? 8 : 0;
    ctx.fillRect(barX, barY, barW * hpPercent, barH);

    ctx.shadowBlur = 0;
    ctx.font = 'bold 11px "Courier New", monospace';
    ctx.fillStyle = '#90a4ae';
    let statusText = 'СТАТУС: В НОРМЕ';
    if (hpPercent <= 0.6) statusText = 'СТАТУС: РАНЕН';
    if (hpPercent <= 0.3) statusText = 'СТАТУС: КРИТИЧЕСКИЙ!';

    ctx.fillText(`${statusText} (${Math.round(this.hp)} HP)`, barX, barY - 7);

    const stPercent = Math.max(0, Math.min(1, (this.stamina || 100) / (this.maxStamina || 100)));
    ctx.fillStyle = 'rgba(18, 20, 22, 0.85)';
    ctx.fillRect(barX - 2, barY + barH + 4, barW + 4, 6);
    ctx.strokeStyle = '#263238';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX - 2, barY + barH + 4, barW + 4, 6);

    ctx.fillStyle = '#00e5ff';
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = stPercent < 0.25 ? 6 : 0;
    ctx.fillRect(barX, barY + barH + 5, barW * stPercent, 4);

    ctx.shadowBlur = 0;
    ctx.font = 'bold 9px sans-serif';
    ctx.fillStyle = '#80deea';
    ctx.fillText('СТАМИНА (SHIFT)', barX, barY + barH + 20);

    let powerUpY = barY + barH + 34;
    if (this.activeInstaKill > 0) {
      ctx.fillStyle = 'rgba(80, 10, 10, 0.85)';
      ctx.strokeStyle = '#ff3333';
      ctx.lineWidth = 1;
      ctx.fillRect(barX, powerUpY, 155, 20);
      ctx.strokeRect(barX, powerUpY, 155, 20);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`INSTA-KILL (${Math.ceil(this.activeInstaKill)}с)`, barX + 6, powerUpY + 14);
      powerUpY += 25;
    }

    if (this.activeDoublePoints > 0) {
      ctx.fillStyle = 'rgba(80, 70, 10, 0.85)';
      ctx.strokeStyle = '#ffff33';
      ctx.lineWidth = 1;
      ctx.fillRect(barX, powerUpY, 155, 20);
      ctx.strokeRect(barX, powerUpY, 155, 20);

      ctx.fillStyle = '#ffffaa';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`DOUBLE x2 (${Math.ceil(this.activeDoublePoints)}с)`, barX + 6, powerUpY + 14);
    }

    ctx.restore();
  }

  renderInteractionPrompt(ctx, width, height) {
    if (!this.interactionPrompt) return;

    ctx.save();
    let promptX = width / 2;
    const promptY = height / 2 + 88;

    if (this.promptShake > 0) {
      promptX += Math.sin(performance.now() * 0.05) * 8 * this.promptShake;
    }

    ctx.font = 'bold 15px sans-serif';
    const textWidth = ctx.measureText(this.interactionPrompt).width;
    const boxW = textWidth + 36;
    const boxH = 34;

    ctx.fillStyle = this.promptError ? 'rgba(80, 10, 10, 0.9)' : 'rgba(15, 18, 20, 0.88)';
    ctx.strokeStyle = this.promptError ? '#ff3333' : '#ffd700';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    this.traceRoundRect(ctx, promptX - boxW / 2, promptY - boxH / 2, boxW, boxH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 6;
    ctx.fillText(this.interactionPrompt, promptX, promptY);

    ctx.restore();
  }

  renderRoundBanners(ctx, width, height) {
    if (this.roundSplash) {
      ctx.save();
      const splash = this.roundSplash;
      ctx.globalAlpha = Math.max(0, Math.min(1, splash.alpha));

      const cx = width / 2;
      const cy = height * 0.36;

      ctx.translate(cx, cy);
      ctx.scale(splash.scale, splash.scale);

      const grad = ctx.createLinearGradient(-350, 0, 350, 0);
      grad.addColorStop(0, 'rgba(120, 0, 0, 0)');
      grad.addColorStop(0.5, 'rgba(160, 0, 0, 0.7)');
      grad.addColorStop(1, 'rgba(120, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(-350, -38, 700, 76);

      ctx.font = '900 44px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 24;
      ctx.fillText(splash.title, 0, 8);

      ctx.font = 'bold 14px sans-serif';
      ctx.fillStyle = '#ffaaaa';
      ctx.shadowBlur = 4;
      ctx.fillText(splash.subtitle, 0, 32);

      ctx.restore();
    }

    if (this.roundClearedSplash) {
      ctx.save();
      const splash = this.roundClearedSplash;
      ctx.globalAlpha = Math.max(0, Math.min(1, splash.alpha));

      const cx = width / 2;
      const cy = height * 0.36;

      ctx.translate(cx, cy);
      ctx.scale(splash.scale, splash.scale);

      ctx.font = '900 38px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffcc00';
      ctx.shadowColor = '#ff6600';
      ctx.shadowBlur = 18;
      ctx.fillText(splash.title, 0, 0);

      ctx.font = 'bold 13px sans-serif';
      ctx.fillStyle = '#e0e0e0';
      ctx.shadowBlur = 0;
      ctx.fillText(splash.subtitle, 0, 26);

      ctx.restore();
    }
  }

  renderCrosshairAndHitmarker(ctx) {
    const mouse = this.engine.input.mouse;
    const mx = mouse.screenX;
    const my = mouse.screenY;

    ctx.save();

    const spread = 7 + this.crosshairSpread;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(mx, my - spread - 7);
    ctx.lineTo(mx, my - spread);
    ctx.moveTo(mx, my + spread);
    ctx.lineTo(mx, my + spread + 7);
    ctx.moveTo(mx - spread - 7, my);
    ctx.lineTo(mx - spread, my);
    ctx.moveTo(mx + spread, my);
    ctx.lineTo(mx + spread + 7, my);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(mx, my, 1.5, 0, Math.PI * 2);
    ctx.fill();

    if (this.hitMarker.active) {
      ctx.globalAlpha = this.hitMarker.alpha;
      ctx.strokeStyle = this.hitMarker.isLethal ? '#ff1111' : '#ffffff';
      ctx.lineWidth = this.hitMarker.isLethal ? 2.5 : 2.0;

      const markerSize = this.hitMarker.isLethal ? 9 : 7;
      ctx.beginPath();
      ctx.moveTo(mx - markerSize, my - markerSize);
      ctx.lineTo(mx + markerSize, my + markerSize);
      ctx.moveTo(mx + markerSize, my - markerSize);
      ctx.lineTo(mx - markerSize, my + markerSize);
      ctx.stroke();
    }

    ctx.restore();
  }

  traceRoundRect(ctx, x, y, w, h, r) {
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(x, y, w, h, r);
      return;
    }
    const rad = Math.min(r, w / 2, h / 2);
    ctx.moveTo(x + rad, y);
    ctx.lineTo(x + w - rad, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
    ctx.lineTo(x + w, y + h - rad);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
    ctx.lineTo(x + rad, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
    ctx.lineTo(x, y + rad);
    ctx.quadraticCurveTo(x, y, x + rad, y);
  }

  renderScoreboard(ctx, width, height) {
    ctx.save();
    const cx = width / 2;
    const cy = height / 2;
    const boardW = 540;
    const boardH = 340;

    ctx.fillStyle = 'rgba(10, 12, 14, 0.92)';
    ctx.strokeStyle = '#455a64';
    ctx.lineWidth = 2;
    ctx.beginPath();
    this.traceRoundRect(ctx, cx - boardW / 2, cy - boardH / 2, boardW, boardH, 8);
    ctx.fill();
    ctx.stroke();

    ctx.font = '900 22px "Courier New", monospace';
    ctx.fillStyle = '#ff4444';
    ctx.textAlign = 'center';
    ctx.fillText('ТАКТИЧЕСКИЙ ОТЧЕТ БОЯ', cx, cy - boardH / 2 + 40);

    const rows = [
      ['ТЕКУЩИЙ РАУНД:', `${this.round}`],
      ['УБИТО ЗОМБИ:', `${this.stats.kills}`],
      ['ВЫСТРЕЛОВ В ГОЛОВУ:', `${this.stats.headshots}`],
      ['СДЕЛАНО ВЫСТРЕЛОВ:', `${this.stats.shotsFired}`],
      ['ТЕКУЩИЙ БАЛАНС ОЧКОВ:', `${this.points}`],
      ['ВСЕГО ЗАРАБОТАНО ОЧКОВ:', `${this.stats.totalEarned}`]
    ];

    ctx.font = 'bold 15px "Courier New", monospace';
    let lineY = cy - 80;
    for (const [label, val] of rows) {
      ctx.textAlign = 'left';
      ctx.fillStyle = '#b0bec5';
      ctx.fillText(label, cx - boardW / 2 + 50, lineY);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(val, cx + boardW / 2 - 50, lineY);
      lineY += 34;
    }

    ctx.restore();
  }

  renderGameOverScreen(ctx, width, height) {
    ctx.save();
    const alpha = this.gameOverFade;
    ctx.globalAlpha = alpha;

    ctx.fillStyle = 'rgba(10, 2, 2, 0.86)';
    ctx.fillRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2 - 60;

    ctx.font = '900 58px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff1111';
    ctx.shadowColor = '#660000';
    ctx.shadowBlur = 28;
    ctx.fillText('ВЫ ПОГИБЛИ', cx, cy - 30);

    ctx.shadowBlur = 0;
    ctx.font = 'bold 21px "Courier New", monospace';
    ctx.fillStyle = '#e0e0e0';
    ctx.fillText(`ВЫ ПЕРЕЖИЛИ РАУНДОВ: ${this.round}`, cx, cy + 25);

    ctx.font = '16px "Courier New", monospace';
    ctx.fillStyle = '#a0a0a0';
    ctx.fillText(`Убито зомби: ${this.stats.kills}  |  Хедшоты: ${this.stats.headshots}  |  Очки: ${this.stats.totalEarned}`, cx, cy + 58);

    ctx.restore();
  }
}
