/**
 * PlayerModule - Контроллер персонажа, стрельба с сабстепами без туннелирования,
 * арсенал, стамина, регенерация HP, взаимодействие с окружением и очки.
 */
import { EVENTS, WEAPON_CONFIGS, GAME_SETTINGS } from '../../core/Constants.js';

export class PlayerModule {
  constructor() {
    this.name = 'player';
    this.engine = null;

    this.x = -800;
    this.y = 0;
    this.radius = 18;
    this.baseSpeed = 235;
    this.sprintSpeed = 330;
    this.speed = this.baseSpeed;
    this.angle = 0;

    this.maxStamina = 100;
    this.stamina = 100;
    this.isSprinting = false;

    this.maxHp = 100;
    this.hp = 100;
    this.lastDamageTime = 0;
    this.regenDelay = 4000;
    this.invulnTimer = 0;
    this.isDead = false;

    this.points = 500;
    this.pointMultiplier = 1;
    this.doublePointsTimer = 0;

    this.weapons = [
      {
        ...WEAPON_CONFIGS.m1911,
        currentMag: WEAPON_CONFIGS.m1911.magSize,
        reserve: WEAPON_CONFIGS.m1911.reserveAmmo
      }
    ];
    this.currentWeaponIndex = 0;

    this.lastShotTime = -9999;
    this.lastDryFireTime = -9999;
    this.isReloading = false;
    this.reloadEndTime = 0;
    this.wasMouseDown = false;
    this.muzzleFlashTimer = 0;

    this.fKeyWasDown = false;
    this.switchKeyWasDown = false;
    this.nearInteractable = false;

    this.bullets = [];

    this.onWheel = () => {
      if (this.engine?.isPaused || this.isDead) return;
      if (this.weapons.length > 1) {
        this.switchWeapon((this.currentWeaponIndex + 1) % this.weapons.length);
      }
    };
  }

  init(engine) {
    this.engine = engine;
    const bus = engine.bus;

    bus.emit(EVENTS.PLAYER_POINTS_CHANGED, { points: this.points, delta: 0 });
    this.syncWeaponWithHud();

    bus.on(EVENTS.PLAYER_DAMAGED, (data) => {
      if (data && data.fromPlayer) return;
      this.takeDamage(data?.amount || 25);
    });

    bus.on(EVENTS.ZOMBIE_DAMAGED, () => {
      this.addPoints(GAME_SETTINGS.POINTS.HIT);
    });

    bus.on(EVENTS.ZOMBIE_KILLED, (data) => {
      const basePts = data && data.isHeadshot ? GAME_SETTINGS.POINTS.HEADSHOT : GAME_SETTINGS.POINTS.KILL;
      this.addPoints(basePts);
    });

    bus.on(EVENTS.MYSTERY_BOX_TAKEN, (weaponData) => {
      this.equipNewWeapon(weaponData);
    });

    bus.on(EVENTS.LUDKA_REWARD, (reward) => {
      if (!reward) return;
      if (reward.coins > 0) {
        this.addRawPoints(reward.coins);
      } else if (reward.coins < 0) {
        const loss = Math.min(this.points, Math.abs(reward.coins));
        if (loss > 0) {
          this.points -= loss;
          this.engine.bus.emit(EVENTS.PLAYER_POINTS_CHANGED, { points: this.points, delta: -loss });
        }
      }
      if (reward.weaponConfig) {
        this.equipNewWeapon(reward.weaponConfig);
      }
      if (reward.maxAmmo) {
        for (const w of this.weapons) {
          w.currentMag = w.magSize;
          w.reserve = w.reserveAmmo;
        }
        this.syncWeaponWithHud();
      }
      if (reward.fullHeal) {
        this.hp = this.maxHp;
        this.engine.bus.emit(EVENTS.PLAYER_HEALED, { currentHp: this.hp, maxHp: this.maxHp });
      }
    });

    bus.on('powerup:activated', (data) => {
      if (data.type === 'double_points') {
        this.pointMultiplier = 2;
        this.doublePointsTimer = data.duration || 20;
      }
    });

    bus.on(EVENTS.PLAYER_REVIVE, () => {
      this.revive();
    });

    bus.on(EVENTS.GAME_RESTART, () => {
      this.reset();
    });

    window.addEventListener('wheel', this.onWheel);
  }

  revive() {
    this.isDead = false;
    this.hp = this.maxHp;
    this.stamina = this.maxStamina;
    this.invulnTimer = 3.0;
    this.lastDamageTime = this.engine.now();
    this.isReloading = false;
    this.wasMouseDown = true;

    const wp = this.currentWeapon;
    if (wp && wp.currentMag <= 0) {
      wp.currentMag = wp.magSize;
      wp.reserve = Math.max(wp.reserve, wp.magSize * 2);
    }

    this.syncWeaponWithHud();
    this.engine.bus.emit(EVENTS.PLAYER_HEALED, { currentHp: this.hp, maxHp: this.maxHp });
  }

  reset() {
    this.x = -800;
    this.y = 0;
    this.hp = 100;
    this.isDead = false;
    this.invulnTimer = 0;
    this.points = 500;
    this.stamina = 100;
    this.pointMultiplier = 1;
    this.doublePointsTimer = 0;
    this.bullets = [];
    this.weapons = [
      {
        ...WEAPON_CONFIGS.m1911,
        currentMag: WEAPON_CONFIGS.m1911.magSize,
        reserve: WEAPON_CONFIGS.m1911.reserveAmmo
      }
    ];
    this.currentWeaponIndex = 0;
    this.isReloading = false;
    this.lastShotTime = -9999;
    this.muzzleFlashTimer = 0;
    this.wasMouseDown = true;
    this.engine.camera.x = this.x;
    this.engine.camera.y = this.y;
    this.engine.camera.targetX = this.x;
    this.engine.camera.targetY = this.y;
    this.engine.bus.emit(EVENTS.PLAYER_POINTS_CHANGED, { points: this.points, delta: 0 });
    this.syncWeaponWithHud();
  }

  get currentWeapon() {
    return this.weapons[this.currentWeaponIndex];
  }

  addPoints(amount) {
    const total = amount * this.pointMultiplier;
    this.points += total;
    this.engine.bus.emit(EVENTS.PLAYER_POINTS_CHANGED, {
      points: this.points,
      delta: total,
      multiplier: this.pointMultiplier
    });
    return total;
  }

  addRawPoints(amount) {
    this.points += amount;
    this.engine.bus.emit(EVENTS.PLAYER_POINTS_CHANGED, {
      points: this.points,
      delta: amount,
      multiplier: 1
    });
    return amount;
  }

  spendPoints(amount) {
    if (this.points >= amount) {
      this.points -= amount;
      this.engine.bus.emit(EVENTS.PLAYER_POINTS_CHANGED, { points: this.points, delta: -amount });
      return true;
    }
    return false;
  }

  takeDamage(amount) {
    if (this.isDead || this.invulnTimer > 0) return;
    this.hp -= amount;
    this.lastDamageTime = this.engine.now();

    if (this.hp <= 0) {
      this.hp = 0;
      this.isDead = true;
      this.engine.bus.emit(EVENTS.PLAYER_DIED, {});
    }

    this.engine.bus.emit(EVENTS.PLAYER_DAMAGED, {
      amount,
      currentHp: Math.round(this.hp),
      maxHp: this.maxHp,
      fromPlayer: true
    });
  }

  equipNewWeapon(weaponConfig) {
    const newWp = {
      ...weaponConfig,
      currentMag: weaponConfig.magSize,
      reserve: weaponConfig.reserveAmmo
    };

    const existingIndex = this.weapons.findIndex(w => w.id === newWp.id);
    if (existingIndex !== -1) {
      this.weapons[existingIndex].reserve = newWp.reserveAmmo;
      this.weapons[existingIndex].currentMag = newWp.magSize;
      this.currentWeaponIndex = existingIndex;
    } else if (this.weapons.length < 2) {
      this.weapons.push(newWp);
      this.currentWeaponIndex = this.weapons.length - 1;
    } else {
      this.weapons[this.currentWeaponIndex] = newWp;
    }

    this.isReloading = false;
    this.syncWeaponWithHud();
  }

  switchWeapon(targetIndex) {
    if (targetIndex < 0 || targetIndex >= this.weapons.length || targetIndex === this.currentWeaponIndex) {
      return;
    }
    this.currentWeaponIndex = targetIndex;
    this.isReloading = false;
    this.syncWeaponWithHud();
  }

  syncWeaponWithHud() {
    const wp = this.currentWeapon;
    this.engine.bus.emit(EVENTS.WEAPON_CHANGED, {
      id: wp.id,
      name: wp.name,
      currentAmmo: wp.currentMag,
      reserveAmmo: wp.reserve,
      magSize: wp.magSize
    });
  }

  update(dt) {
    if (this.isDead) return;

    if (this.invulnTimer > 0) {
      this.invulnTimer = Math.max(0, this.invulnTimer - dt);
    }

    if (this.doublePointsTimer > 0) {
      this.doublePointsTimer -= dt;
      if (this.doublePointsTimer <= 0) {
        this.pointMultiplier = 1;
      }
    }

    this.handleMovement(dt);
    this.handleAiming();
    this.handleWeaponSwitch();
    this.handleShooting();
    this.handleReloading();
    this.handleRegen(dt);
    this.handleInteractions();
    this.updateBullets(dt);

    if (this.muzzleFlashTimer > 0) {
      this.muzzleFlashTimer -= dt;
    }

    const mouse = this.engine.input.mouse;
    const lookLead = 0.12;
    this.engine.camera.targetX = this.x + (mouse.worldX - this.x) * lookLead;
    this.engine.camera.targetY = this.y + (mouse.worldY - this.y) * lookLead;

    this.engine.bus.emit(EVENTS.PLAYER_MOVED, {
      x: this.x,
      y: this.y,
      angle: this.angle,
      hp: this.hp,
      points: this.points,
      stamina: this.stamina,
      maxStamina: this.maxStamina,
      isSprinting: this.isSprinting
    });
  }

  handleMovement(dt) {
    const keys = this.engine.input.keys;
    let dx = 0;
    let dy = 0;

    if (keys['w'] || keys['keyw'] || keys['arrowup']) dy -= 1;
    if (keys['s'] || keys['keys'] || keys['arrowdown']) dy += 1;
    if (keys['a'] || keys['keya'] || keys['arrowleft']) dx -= 1;
    if (keys['d'] || keys['keyd'] || keys['arrowright']) dx += 1;

    const isShiftDown = Boolean(keys['shift'] || keys['shiftleft'] || keys['shiftright'] || keys['virtual_sprint']);
    const isMoving = (dx !== 0 || dy !== 0);

    if (isShiftDown && isMoving && this.stamina > 4) {
      this.isSprinting = true;
      this.speed = this.sprintSpeed;
      this.stamina = Math.max(0, this.stamina - 28 * dt);
    } else {
      this.isSprinting = false;
      this.speed = this.baseSpeed;
      this.stamina = Math.min(this.maxStamina, this.stamina + 20 * dt);
    }

    if (dx !== 0 && dy !== 0) {
      const len = Math.hypot(dx, dy);
      dx /= len;
      dy /= len;
    }

    const nextX = this.x + dx * this.speed * dt;
    const nextY = this.y + dy * this.speed * dt;

    const map = this.engine.getModule('map');
    if (map) {
      if (!map.checkCollision(nextX, this.y, this.radius)) {
        this.x = nextX;
      }
      if (!map.checkCollision(this.x, nextY, this.radius)) {
        this.y = nextY;
      }
    } else {
      this.x = nextX;
      this.y = nextY;
    }
  }

  handleAiming() {
    const mouse = this.engine.input.mouse;
    this.angle = Math.atan2(mouse.worldY - this.y, mouse.worldX - this.x);
  }

  handleWeaponSwitch() {
    const keys = this.engine.input.keys;

    if ((keys['1'] || keys['digit1']) && this.weapons[0]) {
      this.switchWeapon(0);
    }
    if ((keys['2'] || keys['digit2']) && this.weapons[1]) {
      this.switchWeapon(1);
    }

    const qDown = Boolean(keys['q'] || keys['keyq'] || keys['virtual_switch']);
    if (qDown && !this.switchKeyWasDown && this.weapons.length > 1) {
      this.switchWeapon((this.currentWeaponIndex + 1) % this.weapons.length);
    }
    this.switchKeyWasDown = qDown;
  }

  handleShooting() {
    const now = this.engine.now();
    const wp = this.currentWeapon;
    const isMouseDown = Boolean(this.engine.input.mouse.isDown || this.engine.input.keys['virtual_fire']);

    const shouldFire = wp.automatic ? isMouseDown : (isMouseDown && !this.wasMouseDown);
    this.wasMouseDown = isMouseDown;

    if (!shouldFire) return;
    if (this.isReloading) return;
    if (now - this.lastShotTime < wp.fireRate) return;

    if (wp.currentMag <= 0) {
      if (wp.reserve > 0) {
        this.startReload();
      } else if (now - this.lastDryFireTime > 260) {
        this.lastDryFireTime = now;
        this.engine.getModule('hud')?.audio?.playDryFire();
      }
      return;
    }

    this.lastShotTime = now;
    wp.currentMag--;
    this.muzzleFlashTimer = 0.06;

    // Отдача по осям без клиппинга в стены
    const recoilDist = wp.id === 'olympia' ? 4.5 : (wp.id === 'raygun' ? 3.0 : 1.5);
    const map = this.engine.getModule('map');
    const recX = this.x - Math.cos(this.angle) * recoilDist;
    const recY = this.y - Math.sin(this.angle) * recoilDist;
    if (map) {
      if (!map.checkCollision(recX, this.y, this.radius)) this.x = recX;
      if (!map.checkCollision(this.x, recY, this.radius)) this.y = recY;
    } else {
      this.x = recX;
      this.y = recY;
    }

    const pellets = wp.pellets || 1;
    const barrelLength = this.radius + 14;
    const muzzleX = this.x + Math.cos(this.angle) * barrelLength;
    const muzzleY = this.y + Math.sin(this.angle) * barrelLength;

    for (let i = 0; i < pellets; i++) {
      const spreadAngle = this.angle + (Math.random() - 0.5) * (wp.spread || 0.05);
      const bullet = {
        x: muzzleX,
        y: muzzleY,
        vx: Math.cos(spreadAngle) * wp.bulletSpeed,
        vy: Math.sin(spreadAngle) * wp.bulletSpeed,
        damage: wp.damage,
        color: wp.color || '#ffee88',
        isRayGun: wp.id === 'raygun',
        splashRadius: wp.splashRadius || 0,
        life: 1.4
      };
      this.bullets.push(bullet);
      this.engine.bus.emit(EVENTS.BULLET_SPAWNED, bullet);
    }

    this.engine.bus.emit(EVENTS.WEAPON_FIRED, {
      weapon: wp.name,
      currentAmmo: wp.currentMag,
      reserveAmmo: wp.reserve,
      magSize: wp.magSize
    });

    if (wp.currentMag === 0 && wp.reserve > 0) {
      this.startReload();
    }
  }

  handleReloading() {
    const keys = this.engine.input.keys;
    if (keys['r'] || keys['keyr'] || keys['virtual_reload']) {
      this.startReload();
    }

    if (this.isReloading && this.engine.now() >= this.reloadEndTime) {
      const wp = this.currentWeapon;
      const needed = wp.magSize - wp.currentMag;
      const take = Math.min(needed, wp.reserve);
      wp.currentMag += take;
      wp.reserve -= take;
      this.isReloading = false;

      this.engine.bus.emit(EVENTS.WEAPON_RELOAD_DONE, {
        weapon: wp.name,
        currentAmmo: wp.currentMag,
        reserveAmmo: wp.reserve,
        magSize: wp.magSize
      });
    }
  }

  startReload() {
    const wp = this.currentWeapon;
    if (this.isReloading || wp.currentMag >= wp.magSize || wp.reserve <= 0) return;

    this.isReloading = true;
    this.reloadEndTime = this.engine.now() + wp.reloadTime;
    this.engine.bus.emit(EVENTS.WEAPON_RELOAD_START, {
      weapon: wp.name,
      reloadTime: wp.reloadTime
    });
  }

  handleRegen(dt) {
    if (this.hp < this.maxHp && this.engine.now() - this.lastDamageTime > this.regenDelay) {
      this.hp = Math.min(this.maxHp, this.hp + 26 * dt);
      this.engine.bus.emit(EVENTS.PLAYER_HEALED, { currentHp: Math.round(this.hp), maxHp: this.maxHp });
    }
  }

  handleInteractions() {
    const map = this.engine.getModule('map');
    if (!map) return;

    let nearAny = false;
    const keys = this.engine.input.keys;
    const fDown = Boolean(keys['f'] || keys['keyf'] || keys['virtual_interact']);
    const justPressedF = fDown && !this.fKeyWasDown;

    // 1. Настенное оружие
    if (map.wallBuys) {
      for (const wb of map.wallBuys) {
        const dist = Math.hypot(this.x - wb.x, this.y - wb.y);
        if (dist < 75) {
          nearAny = true;
          const config = WEAPON_CONFIGS[wb.weaponId];
          if (!config) continue;

          const ownedWp = this.weapons.find(w => w.id === wb.weaponId);

          if (ownedWp) {
            const isAmmoFull = ownedWp.reserve >= config.reserveAmmo && ownedWp.currentMag >= config.magSize;
            if (isAmmoFull) {
              this.engine.bus.emit('hud:prompt', `Боезапас ${config.name} полон`);
            } else {
              this.engine.bus.emit('hud:prompt', `[F] Патроны для ${config.name} [${wb.ammoCost} Очков]`);
              if (justPressedF) {
                if (this.spendPoints(wb.ammoCost)) {
                  ownedWp.reserve = config.reserveAmmo;
                  ownedWp.currentMag = config.magSize;
                  this.syncWeaponWithHud();
                } else {
                  this.engine.bus.emit('hud:prompt_deny', {});
                }
              }
            }
          } else {
            this.engine.bus.emit('hud:prompt', `[F] Купить ${config.name} [${wb.cost} Очков]`);
            if (justPressedF) {
              if (this.spendPoints(wb.cost)) {
                this.equipNewWeapon(config);
              } else {
                this.engine.bus.emit('hud:prompt_deny', {});
              }
            }
          }
          break;
        }
      }
    }

    // 2. Двери и завалы
    if (!nearAny && map.doors) {
      for (const door of map.doors) {
        if (door.isOpen) continue;
        const cx = door.x + door.w / 2;
        const cy = door.y + door.h / 2;
        const dist = Math.hypot(this.x - cx, this.y - cy);
        if (dist < 85) {
          nearAny = true;
          this.engine.bus.emit('hud:prompt', `[F] ${door.name} [${door.cost} Очков]`);
          if (justPressedF) {
            if (this.spendPoints(door.cost)) {
              map.openDoor(door.id);
            } else {
              this.engine.bus.emit('hud:prompt_deny', {});
            }
          }
          break;
        }
      }
    }

    // 3. Терминалы Лудки 777 и Сапёра
    const ludkaTerms = map.ludkaTerminals || map.memeTerminals;
    if (!nearAny && ludkaTerms) {
      const ludkaMod = this.engine.getModule('meme_ludka');
      for (const term of ludkaTerms) {
        const cx = term.x + term.w / 2;
        const cy = term.y + term.h / 2;
        const dist = Math.hypot(this.x - cx, this.y - cy);
        if (dist < 80) {
          nearAny = true;
          const cdSec = ludkaMod?.getTerminalCooldownSec?.(term.id) || 0;
          const prompt = cdSec > 0
            ? `[F] Терминал Лудки (Бесплатно через ${cdSec}с | Платно [250])`
            : `[F] Терминал Лудки (Бесплатный спин)`;
          this.engine.bus.emit('hud:prompt', prompt);
          if (justPressedF) {
            this.engine.bus.emit(EVENTS.LUDKA_REQUEST, { source: 'terminal', terminalId: term.id, isDodep: true });
          }
          break;
        }
      }
    }

    if (!nearAny && map.saperTerminals) {
      for (const term of map.saperTerminals) {
        const cx = term.x + term.w / 2;
        const cy = term.y + term.h / 2;
        const dist = Math.hypot(this.x - cx, this.y - cy);
        if (dist < 80) {
          nearAny = true;
          this.engine.bus.emit('hud:prompt', `[F] Терминал Сапёра (Минное поле)`);
          if (justPressedF) {
            this.engine.bus.emit(EVENTS.SAPER_REQUEST, { source: 'terminal', terminalId: term.id });
          }
          break;
        }
      }
    }

    this.fKeyWasDown = fDown;
    this.nearInteractable = nearAny;

    const box = this.engine.getModule('mystery_box');
    const nearBox = box ? box.isPlayerNear(this) : false;
    if (!nearAny && !nearBox) {
      this.engine.bus.emit('hud:prompt', null);
    }
  }

  updateBullets(dt) {
    const map = this.engine.getModule('map');
    const zombies = this.engine.getModule('zombies');

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      const totalDx = b.vx * dt;
      const totalDy = b.vy * dt;
      const dist = Math.hypot(totalDx, totalDy);
      const steps = Math.max(1, Math.ceil(dist / 8));
      const stepDx = totalDx / steps;
      const stepDy = totalDy / steps;

      let destroyed = false;
      for (let s = 0; s < steps; s++) {
        b.x += stepDx;
        b.y += stepDy;

        if (map && map.checkCollision(b.x, b.y, 3)) {
          if (b.isRayGun && zombies && typeof zombies.applyRayGunSplash === 'function') {
            zombies.applyRayGunSplash(b.x, b.y, b.damage, b.splashRadius || 65);
          }
          this.engine.bus.emit(EVENTS.BULLET_HIT, {
            x: b.x,
            y: b.y,
            targetType: 'wall',
            isRayGun: b.isRayGun,
            splashRadius: b.splashRadius
          });
          destroyed = true;
          break;
        }

        if (zombies && typeof zombies.checkBulletHit === 'function') {
          if (zombies.checkBulletHit(b)) {
            destroyed = true;
            break;
          }
        }
      }

      b.life -= dt;
      if (destroyed || b.life <= 0) {
        this.bullets.splice(i, 1);
      }
    }
  }

  render(ctx) {
    // 1. Пули и трассеры
    for (const b of this.bullets) {
      ctx.save();
      if (b.isRayGun) {
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#00ff88';
        ctx.beginPath();
        ctx.arc(b.x, b.y, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(b.x, b.y, 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = b.color;
        ctx.shadowColor = '#ffaa33';
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    if (this.isDead) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    // 2. Световой конус фонарика
    const flashGrad = ctx.createRadialGradient(0, 0, 12, 0, 0, 320);
    flashGrad.addColorStop(0, 'rgba(255, 245, 200, 0.16)');
    flashGrad.addColorStop(0.55, 'rgba(255, 240, 180, 0.07)');
    flashGrad.addColorStop(1, 'rgba(255, 240, 180, 0)');

    ctx.fillStyle = flashGrad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 320, -0.38, 0.38);
    ctx.closePath();
    ctx.fill();

    // Щит неуязвимости при возрождении за мем-рекламу
    if (this.invulnTimer > 0) {
      ctx.strokeStyle = 'rgba(0, 255, 170, 0.75)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 7, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 3. Тень
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(3, 4, this.radius, this.radius * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // 4. Тело бойца
    ctx.fillStyle = '#3f4728';
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#222814';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 5. Оружие в руках
    const wp = this.currentWeapon;
    ctx.fillStyle = '#1c1c1c';
    if (wp.id === 'olympia' || wp.id === 'm14') {
      ctx.fillRect(8, 3, 24, 5);
      ctx.fillStyle = '#653c1e';
      ctx.fillRect(4, 3, 8, 5);
    } else if (wp.id === 'ak47') {
      ctx.fillStyle = '#202020';
      ctx.fillRect(8, 2.5, 23, 5);
      ctx.fillStyle = '#8b4513';
      ctx.fillRect(3, 3, 8, 5);
      ctx.fillRect(15, 6, 4, 7);
    } else if (wp.id === 'minigun') {
      ctx.fillStyle = '#333b44';
      ctx.fillRect(6, 0, 26, 9);
      ctx.fillStyle = '#ff9922';
      ctx.fillRect(26, 1, 6, 7);
    } else if (wp.id === 'raygun') {
      ctx.fillStyle = '#cc1111';
      ctx.fillRect(8, 2, 16, 7);
      ctx.fillStyle = '#00ff88';
      ctx.fillRect(16, 4, 8, 3);
    } else if (wp.id === 'mp40') {
      ctx.fillStyle = '#222';
      ctx.fillRect(8, 3, 20, 5);
      ctx.fillRect(14, 5, 4, 8);
    } else {
      ctx.fillStyle = '#2a2a2a';
      ctx.fillRect(8, 3, 14, 5);
    }

    // 6. Каска
    ctx.fillStyle = '#2d3319';
    ctx.beginPath();
    ctx.arc(-2, 0, this.radius * 0.58, 0, Math.PI * 2);
    ctx.fill();

    // 7. Вспышка выстрела
    if (this.muzzleFlashTimer > 0) {
      const muzzleX = (wp.id === 'olympia' || wp.id === 'm14' || wp.id === 'minigun' || wp.id === 'ak47') ? 32 : 24;
      ctx.fillStyle = wp.id === 'raygun' ? '#00ffaa' : '#ffea55';
      ctx.shadowColor = wp.id === 'raygun' ? '#00ffaa' : '#ff9900';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(muzzleX, 5, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
