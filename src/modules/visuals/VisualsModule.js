/**
 * VisualsModule - Визуальные эффекты, частицы, декали крови на полу,
 * гильзы, плазменные взрывы Ray Gun, освещение бункера и процедурный звук.
 */
import { EVENTS } from '../../core/Constants.js';

export class VisualsModule {
  constructor() {
    this.name = 'visuals';
    this.engine = null;

    this.decalCanvas = null;
    this.decalCtx = null;
    this.arenaWidth = 1800;
    this.arenaHeight = 1400;

    this.particles = [];
    this.casings = [];
    this.plasmaRings = [];
    this.floatingTexts = [];
    this.muzzleFlashes = [];

    this.shakeTime = 0;
    this.shakeIntensity = 0;
    this.screenDamageVignette = 0;
    this.screenFlashAlpha = 0;
    this.screenFlashColor = '#ffffff';

    this.lightFlicker = 1.0;

    this.audioCtx = null;
    this.soundEnabled = true;
  }

  init(engine) {
    this.engine = engine;
    const bus = engine.bus;

    const map = engine.getModule('map');
    if (map) {
      this.arenaWidth = map.width;
      this.arenaHeight = map.height;
    }

    this.initDecalCanvas();

    const initAudio = () => {
      try {
        const AudioClass = window.AudioContext || window.webkitAudioContext;
        if (AudioClass && !this.audioCtx) {
          this.audioCtx = new AudioClass();
        }
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
          this.audioCtx.resume();
        }
      } catch (e) {
        // Игнорируем ограничения автозапуска
      }
      if (this.audioCtx && this.audioCtx.state === 'running') {
        window.removeEventListener('pointerdown', initAudio);
        window.removeEventListener('touchstart', initAudio);
        window.removeEventListener('keydown', initAudio);
      }
    };
    window.addEventListener('pointerdown', initAudio);
    window.addEventListener('touchstart', initAudio);
    window.addEventListener('keydown', initAudio);

    bus.on(EVENTS.FX_BLOOD, (data) => {
      this.spawnBloodSplatter(data.x, data.y, data.count || 8, data.isDeath || false);
      if (data.isDeath) {
        this.addScreenShake(3.2, 0.18);
        this.playSfx('zombieDeath');
      } else {
        this.playSfx('fleshHit');
      }
    });

    bus.on(EVENTS.ZOMBIE_DAMAGED, (data) => {
      const zModule = this.engine.getModule('zombies');
      const z = zModule?.zombies.find((item) => item.id === data.id);
      if (z) {
        const text = data.isInstaKill ? 'INSTA!' : `-${data.amount}`;
        this.addFloatingText(text, z.x, z.y - 20, data.isInstaKill ? '#ffaa00' : '#ff4444');
      }
    });

    bus.on(EVENTS.ZOMBIE_KILLED, (data) => {
      const pts = data.pointsEarned || 60;
      const label = data.isHeadshot ? `HEADSHOT +${pts}` : `+${pts}`;
      this.addFloatingText(label, data.x, data.y - 30, data.isHeadshot ? '#ffea00' : '#ffd700', data.isHeadshot ? 1.45 : 1.25);
    });

    bus.on(EVENTS.WEAPON_FIRED, () => {
      const player = this.engine.getModule('player');
      if (player) {
        this.spawnMuzzleFlash(player.x, player.y, player.angle);
        this.spawnShellCasing(player.x, player.y, player.angle);
        this.addScreenShake(1.8, 0.1);
        this.playSfx('gunshot');
      }
    });

    bus.on(EVENTS.BULLET_HIT, (data) => {
      if (data && data.isRayGun) {
        this.plasmaRings.push({
          x: data.x,
          y: data.y,
          radius: 8,
          maxRadius: data.splashRadius || 65,
          alpha: 1.0
        });
        this.addScreenShake(4.0, 0.15);
      }
    });

    bus.on(EVENTS.WEAPON_RELOAD_START, () => {
      this.playSfx('reloadStart');
    });

    bus.on(EVENTS.WEAPON_RELOAD_DONE, () => {
      this.playSfx('reloadDone');
    });

    bus.on(EVENTS.PLAYER_DAMAGED, () => {
      this.screenDamageVignette = 1.0;
      this.addScreenShake(7.0, 0.3);
      this.playSfx('playerHurt');
    });

    bus.on(EVENTS.ROUND_START, () => {
      this.flashScreen('#ff2222', 0.35);
    });

    bus.on(EVENTS.ROUND_CLEARED, () => {
      this.flashScreen('#ffffff', 0.25);
    });

    bus.on(EVENTS.MYSTERY_BOX_SPINNING, () => {
      this.playSfx('boxSpin');
    });

    bus.on(EVENTS.MYSTERY_BOX_READY, (wp) => {
      this.playSfx('boxReady');
      const box = this.engine.getModule('mystery_box');
      if (box) {
        this.addFloatingText(`${wp.name}!`, box.x + 40, box.y - 40, '#00ffcc', 1.5);
      }
    });

    bus.on(EVENTS.LUDKA_REWARD, (reward) => {
      const player = this.engine.getModule('player');
      if (!player || !reward) return;
      if (reward.label) {
        this.addFloatingText(reward.label, player.x, player.y - 42, '#00ff88', 1.6);
      }
      this.flashScreen('#ffd700', 0.28);
    });

    bus.on(EVENTS.GAME_RESTART, () => {
      this.reset();
    });
  }

  reset() {
    this.particles = [];
    this.casings = [];
    this.plasmaRings = [];
    this.floatingTexts = [];
    this.muzzleFlashes = [];
    this.shakeTime = 0;
    this.shakeIntensity = 0;
    this.screenDamageVignette = 0;
    this.screenFlashAlpha = 0;
    if (this.decalCtx) {
      this.decalCtx.clearRect(0, 0, this.arenaWidth, this.arenaHeight);
    }
  }

  initDecalCanvas() {
    this.decalCanvas = document.createElement('canvas');
    this.decalCanvas.width = this.arenaWidth;
    this.decalCanvas.height = this.arenaHeight;
    this.decalCtx = this.decalCanvas.getContext('2d');
    this.decalCtx.clearRect(0, 0, this.arenaWidth, this.arenaHeight);
  }

  addScreenShake(intensity, duration) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeTime = Math.max(this.shakeTime, duration);
  }

  flashScreen(color, alpha) {
    this.screenFlashColor = color;
    this.screenFlashAlpha = alpha;
  }

  spawnBloodSplatter(x, y, count = 8, isDeath = false) {
    if (this.decalCtx) {
      const offsetX = x + this.arenaWidth / 2;
      const offsetY = y + this.arenaHeight / 2;

      this.decalCtx.save();
      this.decalCtx.fillStyle = isDeath ? '#5a0606' : '#720909';

      const poolRadius = isDeath ? 14 + Math.random() * 12 : 6 + Math.random() * 6;
      this.decalCtx.beginPath();
      this.decalCtx.arc(offsetX, offsetY, poolRadius, 0, Math.PI * 2);
      this.decalCtx.fill();

      const drops = isDeath ? 12 : 5;
      for (let i = 0; i < drops; i++) {
        const ang = Math.random() * Math.PI * 2;
        const dist = Math.random() * (isDeath ? 45 : 25);
        const r = 2 + Math.random() * 3.5;
        this.decalCtx.beginPath();
        this.decalCtx.arc(offsetX + Math.cos(ang) * dist, offsetY + Math.sin(ang) * dist, r, 0, Math.PI * 2);
        this.decalCtx.fill();
      }
      this.decalCtx.restore();
    }

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 160;
      this.particles.push({
        type: 'blood',
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2 + Math.random() * 2.5,
        color: Math.random() > 0.4 ? '#8b0000' : '#b22222',
        alpha: 1.0,
        decay: 1.2 + Math.random() * 0.8
      });
    }

    if (isDeath) {
      for (let i = 0; i < 4; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 70 + Math.random() * 110;
        this.particles.push({
          type: 'meat',
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: 3.5 + Math.random() * 2.5,
          color: '#3d0202',
          alpha: 1.0,
          decay: 0.6
        });
      }
    }
  }

  spawnMuzzleFlash(x, y, angle) {
    const barrelLength = 26;
    const fx = x + Math.cos(angle) * barrelLength;
    const fy = y + Math.sin(angle) * barrelLength;

    this.muzzleFlashes.push({
      x: fx,
      y: fy,
      angle,
      radius: 16 + Math.random() * 6,
      alpha: 1.0
    });

    for (let i = 0; i < 2; i++) {
      this.particles.push({
        type: 'smoke',
        x: fx,
        y: fy,
        vx: Math.cos(angle + (Math.random() - 0.5) * 0.5) * 35,
        vy: Math.sin(angle + (Math.random() - 0.5) * 0.5) * 35,
        radius: 4 + Math.random() * 4,
        color: '#666666',
        alpha: 0.5,
        decay: 1.4
      });
    }
  }

  spawnShellCasing(x, y, angle) {
    const ejectAngle = angle + Math.PI / 2 + (Math.random() - 0.5) * 0.3;
    const speed = 60 + Math.random() * 50;

    this.casings.push({
      x: x + Math.cos(angle) * 12,
      y: y + Math.sin(angle) * 12,
      vx: Math.cos(ejectAngle) * speed,
      vy: Math.sin(ejectAngle) * speed,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 20,
      life: 0.45
    });
  }

  addFloatingText(text, x, y, color = '#ffffff', scale = 1.0) {
    this.floatingTexts.push({
      text,
      x: x + (Math.random() - 0.5) * 16,
      y,
      color,
      scale,
      alpha: 1.0,
      vy: -32
    });
  }

  update(dt) {
    if (this.shakeTime > 0) {
      this.shakeTime -= dt;
      const rx = (Math.random() - 0.5) * 2 * this.shakeIntensity;
      const ry = (Math.random() - 0.5) * 2 * this.shakeIntensity;
      this.engine.camera.x += rx;
      this.engine.camera.y += ry;
    } else {
      this.shakeIntensity = 0;
    }

    if (this.screenDamageVignette > 0) {
      this.screenDamageVignette = Math.max(0, this.screenDamageVignette - dt * 1.4);
    }
    if (this.screenFlashAlpha > 0) {
      this.screenFlashAlpha = Math.max(0, this.screenFlashAlpha - dt * 1.8);
    }

    this.lightFlicker = 0.95 + Math.sin(performance.now() * 0.012) * 0.03 + (Math.random() > 0.985 ? -0.07 : 0);

    for (let i = this.plasmaRings.length - 1; i >= 0; i--) {
      const r = this.plasmaRings[i];
      r.radius += (r.maxRadius - r.radius) * Math.min(1, dt * 14);
      r.alpha -= dt * 3.8;
      if (r.alpha <= 0) {
        this.plasmaRings.splice(i, 1);
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.92;
      p.vy *= 0.92;
      p.alpha -= p.decay * dt;

      if (p.type === 'smoke') {
        p.radius += dt * 6;
      }

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    for (let i = this.casings.length - 1; i >= 0; i--) {
      const c = this.casings[i];
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.vx *= 0.88;
      c.vy *= 0.88;
      c.rotation += c.rotSpeed * dt;
      c.life -= dt;

      if (c.life <= 0) {
        if (this.decalCtx) {
          const ox = c.x + this.arenaWidth / 2;
          const oy = c.y + this.arenaHeight / 2;
          this.decalCtx.save();
          this.decalCtx.translate(ox, oy);
          this.decalCtx.rotate(c.rotation);
          this.decalCtx.fillStyle = '#caa338';
          this.decalCtx.fillRect(-3, -1, 6, 2.5);
          this.decalCtx.restore();
        }
        this.casings.splice(i, 1);
      }
    }

    for (let i = this.muzzleFlashes.length - 1; i >= 0; i--) {
      const mf = this.muzzleFlashes[i];
      mf.alpha -= dt * 12;
      if (mf.alpha <= 0) {
        this.muzzleFlashes.splice(i, 1);
      }
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy * dt;
      ft.alpha -= dt * 1.1;
      if (ft.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  renderFloor(ctx) {
    if (this.decalCanvas) {
      ctx.drawImage(this.decalCanvas, -this.arenaWidth / 2, -this.arenaHeight / 2);
    }
  }

  render(ctx) {
    ctx.save();

    for (const c of this.casings) {
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.rotation);
      ctx.fillStyle = '#f0c441';
      ctx.fillRect(-3, -1, 6, 2.5);
      ctx.restore();
    }

    for (const r of this.plasmaRings) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, r.alpha);
      ctx.strokeStyle = '#00ff88';
      ctx.fillStyle = 'rgba(0, 255, 136, 0.18)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    for (const mf of this.muzzleFlashes) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, mf.alpha);
      ctx.translate(mf.x, mf.y);
      ctx.rotate(mf.angle);

      const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, mf.radius);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.4, '#ffdd44');
      grad.addColorStop(1, 'rgba(255, 100, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, mf.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    for (const ft of this.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.font = `900 ${Math.round(14 * ft.scale)}px "Courier New", monospace`;
      ctx.fillStyle = ft.color;
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }

    ctx.restore();
  }

  renderUI(ctx, width, height) {
    ctx.save();

    // Атмосферное освещение бункера (видимость сбалансирована для комфортной игры)
    const player = this.engine.getModule('player');
    if (player) {
      const pScreen = this.engine.worldToScreen(player.x, player.y);
      const lightRadius = 480 * this.lightFlicker;

      const darkGrad = ctx.createRadialGradient(pScreen.x, pScreen.y, 90, pScreen.x, pScreen.y, lightRadius);
      darkGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      darkGrad.addColorStop(0.65, 'rgba(8, 10, 12, 0.34)');
      darkGrad.addColorStop(1, 'rgba(4, 5, 7, 0.68)');

      ctx.fillStyle = darkGrad;
      ctx.fillRect(0, 0, width, height);
    }

    let vignetteAlpha = this.screenDamageVignette;
    if (player && player.hp < 40 && !player.isDead) {
      const pulse = 0.35 + Math.sin(performance.now() * 0.008) * 0.25;
      vignetteAlpha = Math.max(vignetteAlpha, pulse);
    }

    if (vignetteAlpha > 0.02) {
      const bloodGrad = ctx.createRadialGradient(width / 2, height / 2, width * 0.3, width / 2, height / 2, width * 0.7);
      bloodGrad.addColorStop(0, 'rgba(180, 0, 0, 0)');
      bloodGrad.addColorStop(0.7, `rgba(180, 15, 15, ${vignetteAlpha * 0.4})`);
      bloodGrad.addColorStop(1, `rgba(130, 0, 0, ${vignetteAlpha * 0.85})`);

      ctx.fillStyle = bloodGrad;
      ctx.fillRect(0, 0, width, height);
    }

    if (this.screenFlashAlpha > 0.02) {
      ctx.fillStyle = this.screenFlashColor;
      ctx.globalAlpha = this.screenFlashAlpha;
      ctx.fillRect(0, 0, width, height);
    }

    ctx.restore();
  }

  playSfx(type) {
    if (!this.soundEnabled) return;
    const audio = this.engine?.getModule('hud')?.audio;
    if (!audio) return;
    const sounds = {
      gunshot: [185, 0.09, 0.025], fleshHit: [245, 0.09, 0.018],
      zombieDeath: [165, 0.18, 0.025], playerHurt: [147, 0.2, 0.025],
      reloadStart: [294, 0.1, 0.018], reloadDone: [392, 0.14, 0.02],
      boxSpin: [330, 0.2, 0.02], boxReady: [523, 0.25, 0.025]
    };
    if (sounds[type]) audio.note(...sounds[type]);
  }
}
