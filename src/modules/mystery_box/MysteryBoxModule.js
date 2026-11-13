/**
 * MysteryBoxModule - Таинственный сундук за очки (950).
 * Рулетка случайного оружия, луч света, выпадение плюшевого мишки (Teddy Bear)
 * со зловещим смехом и перемещением ящика по бункеру.
 */
import { EVENTS, WEAPON_CONFIGS, GAME_SETTINGS } from '../../core/Constants.js';

export class MysteryBoxModule {
  constructor() {
    this.name = 'mystery_box';
    this.engine = null;

    this.x = 480;
    this.y = -450;
    this.width = 90;
    this.height = 45;
    this.interactRadius = 85;

    // Состояние сундука: 'idle', 'spinning', 'ready', 'bear'
    this.state = 'idle';
    this.spinStartTime = 0;
    this.spinDuration = 3200;
    this.readyEndTime = 0;
    this.bearEndTime = 0;
    this.currentOfferedWeapon = null;
    this.isTeddyBear = false;

    this.weaponPool = Object.values(WEAPON_CONFIGS).filter(w => w.id !== 'm1911');
    this.displayIndex = 0;
    this.lastShuffleTime = 0;
    this.fKeyWasDown = false;
    this.showingPrompt = false;
  }

  init(engine) {
    this.engine = engine;
    this.syncWithMapStart();

    engine.bus.on(EVENTS.GAME_RESTART, () => {
      this.reset();
    });
  }

  syncWithMapStart() {
    const map = this.engine?.getModule('map');
    if (map && map.mysteryBoxPos) {
      this.x = map.mysteryBoxPos.x;
      this.y = map.mysteryBoxPos.y;
      this.width = map.mysteryBoxPos.w || 90;
      this.height = map.mysteryBoxPos.h || 45;
    }
  }

  reset() {
    this.state = 'idle';
    this.spinStartTime = 0;
    this.readyEndTime = 0;
    this.bearEndTime = 0;
    this.currentOfferedWeapon = null;
    this.isTeddyBear = false;
    this.showingPrompt = false;
    this.syncWithMapStart();
  }

  isPlayerNear(player) {
    if (!player) return false;
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    return Math.hypot(player.x - centerX, player.y - centerY) < this.interactRadius;
  }

  relocateBox() {
    const map = this.engine.getModule('map');
    if (!map || !map.boxSpawnLocations || map.boxSpawnLocations.length < 2) return;

    const otherLocations = map.boxSpawnLocations.filter(loc => loc.x !== this.x || loc.y !== this.y);
    const nextLoc = otherLocations[Math.floor(Math.random() * otherLocations.length)];

    this.x = nextLoc.x;
    this.y = nextLoc.y;
    map.mysteryBoxPos.x = nextLoc.x;
    map.mysteryBoxPos.y = nextLoc.y;

    const visuals = this.engine.getModule('visuals');
    if (visuals) {
      visuals.addFloatingText('ЯЩИК ПЕРЕМЕСТИЛСЯ!', this.x + 45, this.y - 20, '#ff4444', 1.5);
      visuals.addScreenShake(5, 0.3);
    }
  }

  update(dt) {
    const player = this.engine.getModule('player');
    if (!player || player.isDead) return;

    const isNear = this.isPlayerNear(player);
    const keys = this.engine.input.keys;
    const fDown = Boolean(keys['f'] || keys['keyf'] || keys['virtual_interact']);
    const justPressedF = fDown && !this.fKeyWasDown;
    this.fKeyWasDown = fDown;

    const now = this.engine.now();

    if (this.state === 'idle') {
      if (isNear && !player.nearInteractable) {
        this.showingPrompt = true;
        if (player.points >= GAME_SETTINGS.MYSTERY_BOX_COST) {
          this.engine.bus.emit('hud:prompt', `[F] Испытать удачу [${GAME_SETTINGS.MYSTERY_BOX_COST} Очков]`);
          if (justPressedF) {
            player.spendPoints(GAME_SETTINGS.MYSTERY_BOX_COST);
            this.state = 'spinning';
            this.spinStartTime = now;
            this.showingPrompt = false;
            this.engine.bus.emit('hud:prompt', null);
            this.engine.bus.emit(EVENTS.MYSTERY_BOX_SPINNING, {});
          }
        } else {
          this.engine.bus.emit('hud:prompt', `Нужно ${GAME_SETTINGS.MYSTERY_BOX_COST} Очков для сундука`);
          if (justPressedF) {
            this.engine.bus.emit('hud:prompt_deny', {});
          }
        }
      } else if (this.showingPrompt) {
        this.showingPrompt = false;
        if (!player.nearInteractable) {
          this.engine.bus.emit('hud:prompt', null);
        }
      }
    } else if (this.state === 'spinning') {
      if (now - this.lastShuffleTime > 75) {
        this.displayIndex = Math.floor(Math.random() * this.weaponPool.length);
        this.lastShuffleTime = now;
      }

      if (now - this.spinStartTime >= this.spinDuration) {
        const isBear = Math.random() < 0.08;
        if (isBear) {
          this.state = 'bear';
          this.isTeddyBear = true;
          this.bearEndTime = now + 2800;
          player.addPoints(GAME_SETTINGS.MYSTERY_BOX_COST);

          const visuals = this.engine.getModule('visuals');
          if (visuals) {
            visuals.addFloatingText('TEDDY BEAR! BYE BYE!', this.x + 45, this.y - 40, '#ff3333', 1.6);
            visuals.playSfx('zombieDeath');
          }
          this.engine.bus.emit('hud:teddy_laugh', {});
          return;
        }

        const roll = Math.random();
        if (roll < 0.16 && WEAPON_CONFIGS.raygun) {
          this.currentOfferedWeapon = WEAPON_CONFIGS.raygun;
        } else if (roll < 0.28 && WEAPON_CONFIGS.minigun) {
          this.currentOfferedWeapon = WEAPON_CONFIGS.minigun;
        } else {
          const standardWeapons = this.weaponPool.filter(w => w.id !== 'raygun' && w.id !== 'minigun');
          this.currentOfferedWeapon = standardWeapons[Math.floor(Math.random() * standardWeapons.length)];
        }

        this.state = 'ready';
        this.isTeddyBear = false;
        this.readyEndTime = now + 9000;
        this.engine.bus.emit(EVENTS.MYSTERY_BOX_READY, this.currentOfferedWeapon);
      }
    } else if (this.state === 'bear') {
      if (now >= this.bearEndTime) {
        this.state = 'idle';
        this.isTeddyBear = false;
        this.relocateBox();
      }
    } else if (this.state === 'ready') {
      if (isNear && this.currentOfferedWeapon) {
        this.showingPrompt = true;
        this.engine.bus.emit('hud:prompt', `[F] Забрать ${this.currentOfferedWeapon.name}`);
        if (justPressedF) {
          this.engine.bus.emit(EVENTS.MYSTERY_BOX_TAKEN, this.currentOfferedWeapon);
          this.state = 'idle';
          this.currentOfferedWeapon = null;
          this.showingPrompt = false;
          this.engine.bus.emit('hud:prompt', null);
        }
      } else if (this.showingPrompt) {
        this.showingPrompt = false;
        if (!player.nearInteractable) {
          this.engine.bus.emit('hud:prompt', null);
        }
      }

      if (now >= this.readyEndTime) {
        this.state = 'idle';
        this.currentOfferedWeapon = null;
        if (this.showingPrompt) {
          this.showingPrompt = false;
          this.engine.bus.emit('hud:prompt', null);
        }
      }
    }
  }

  render(ctx) {
    ctx.save();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(this.x + 6, this.y + 6, this.width, this.height);

    ctx.fillStyle = '#382512';
    ctx.fillRect(this.x, this.y, this.width, this.height);

    ctx.strokeStyle = '#5a3f22';
    ctx.lineWidth = 3;
    ctx.strokeRect(this.x, this.y, this.width, this.height);

    ctx.fillStyle = '#18110b';
    ctx.fillRect(this.x + 8, this.y + 8, this.width - 16, this.height - 16);

    ctx.font = 'bold 22px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = this.state === 'idle' ? '#ffcc00' : (this.state === 'bear' ? '#ff2222' : '#88ffaa');
    ctx.shadowColor = this.state === 'idle' ? '#ffaa00' : (this.state === 'bear' ? '#ff0000' : '#00ff88');
    ctx.shadowBlur = 8;
    ctx.fillText(this.state === 'bear' ? '☠ ☠' : '? ?', this.x + this.width / 2, this.y + 30);
    ctx.shadowBlur = 0;

    if (this.state === 'spinning' || this.state === 'ready' || this.state === 'bear') {
      const beamHeight = 140;
      const isRayGun = this.currentOfferedWeapon && this.currentOfferedWeapon.id === 'raygun';
      const isBear = (this.state === 'bear');

      let beamColor = '255, 220, 80';
      if (isRayGun) beamColor = '0, 255, 136';
      if (isBear) beamColor = '255, 30, 30';

      const grad = ctx.createLinearGradient(0, this.y, 0, this.y - beamHeight);
      grad.addColorStop(0, `rgba(${beamColor}, 0.55)`);
      grad.addColorStop(0.7, `rgba(${beamColor}, 0.18)`);
      grad.addColorStop(1, `rgba(${beamColor}, 0)`);

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(this.x - 6, this.y);
      ctx.lineTo(this.x + this.width + 6, this.y);
      ctx.lineTo(this.x + this.width + 20, this.y - beamHeight);
      ctx.lineTo(this.x - 20, this.y - beamHeight);
      ctx.closePath();
      ctx.fill();

      const floatY = this.y - 48 + Math.sin(performance.now() * 0.005) * 6;

      if (isBear) {
        ctx.save();
        ctx.translate(this.x + this.width / 2, floatY);

        ctx.fillStyle = '#7a4e28';
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, Math.PI * 2);
        ctx.arc(-11, -11, 6, 0, Math.PI * 2);
        ctx.arc(11, -11, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ff1111';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 8;
        ctx.fillRect(-5, -3, 3, 3);
        ctx.fillRect(2, -3, 3, 3);

        ctx.font = '900 13px monospace';
        ctx.fillStyle = '#ff4444';
        ctx.textAlign = 'center';
        ctx.fillText('TEDDY BEAR!', 0, 26);
        ctx.restore();
      } else {
        const weaponToDraw = this.state === 'spinning' ? this.weaponPool[this.displayIndex] : this.currentOfferedWeapon;
        if (weaponToDraw) {
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = `rgb(${beamColor})`;
          ctx.shadowBlur = 14;
          ctx.font = 'bold 15px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(weaponToDraw.name, this.x + this.width / 2, floatY);

          if (this.state === 'ready') {
            const timeLeft = Math.max(0, Math.ceil((this.readyEndTime - this.engine.now()) / 1000));
            ctx.font = 'bold 11px monospace';
            ctx.fillStyle = '#ffaa33';
            ctx.shadowBlur = 0;
            ctx.fillText(`Забрать (${timeLeft}с)`, this.x + this.width / 2, floatY + 16);
          }
        }
      }
    }

    ctx.restore();
  }
}
