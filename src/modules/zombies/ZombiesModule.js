/**
 * ZombiesModule - Расширенная орда (13 типов врагов), снаряды, лужи кислоты,
 * взрывы камикадзе, щиты, призыв некроманта, волны, безопасный спавн и бонусы.
 */
import { EVENTS, GAME_SETTINGS } from '../../core/Constants.js';

export const ZOMBIE_TYPES = {
  WALKER: 'walker',
  RUNNER: 'runner',
  CRAWLER: 'crawler',
  HELLHOUND: 'hellhound',
  SPITTER: 'spitter',
  BOMBER: 'bomber',
  SHIELD: 'shield',
  HAZMAT: 'hazmat',
  PHANTOM: 'phantom',
  SCREAMER: 'screamer',
  BRUTE: 'brute',
  NECROMANCER: 'necromancer',
  BOSS: 'boss'
};

const ENEMY_PROFILES = {
  walker:      { radius: 17, hpMul: 1.0,  spdBase: 86,  spdRand: 28, dmg: 32, cd: 1150, pts: 60 },
  runner:      { radius: 16, hpMul: 0.85, spdBase: 162, spdRand: 34, dmg: 28, cd: 950,  pts: 75 },
  crawler:     { radius: 13, hpMul: 0.65, spdBase: 112, spdRand: 26, dmg: 22, cd: 900,  pts: 65 },
  hellhound:   { radius: 15, hpMul: 0.72, spdBase: 205, spdRand: 35, dmg: 36, cd: 750,  pts: 85 },
  spitter:     { radius: 16, hpMul: 0.85, spdBase: 76,  spdRand: 20, dmg: 20, cd: 2200, pts: 90, ranged: true, rangeMin: 210, rangeMax: 390 },
  bomber:      { radius: 19, hpMul: 1.1,  spdBase: 118, spdRand: 22, dmg: 52, cd: 900,  pts: 110, explodeRadius: 115 },
  shield:      { radius: 20, hpMul: 1.9,  spdBase: 72,  spdRand: 16, dmg: 38, cd: 1250, pts: 130, armoredFront: true },
  hazmat:      { radius: 18, hpMul: 1.45, spdBase: 82,  spdRand: 18, dmg: 30, cd: 1150, pts: 110, dropsAcid: true },
  phantom:     { radius: 16, hpMul: 0.9,  spdBase: 128, spdRand: 28, dmg: 34, cd: 950,  pts: 120, dashes: true },
  screamer:    { radius: 17, hpMul: 1.25, spdBase: 92,  spdRand: 20, dmg: 26, cd: 1100, pts: 140, auraRadius: 210 },
  brute:       { radius: 23, hpMul: 2.6,  spdBase: 68,  spdRand: 14, dmg: 50, cd: 1400, pts: 160 },
  necromancer: { radius: 19, hpMul: 2.1,  spdBase: 72,  spdRand: 16, dmg: 26, cd: 2400, pts: 220, ranged: true, rangeMin: 260, rangeMax: 440, summons: true },
  boss:        { radius: 29, hpMul: 5.5,  spdBase: 94,  spdRand: 12, dmg: 60, cd: 1150, pts: 500, dashes: true }
};

export class ZombiesModule {
  constructor() {
    this.name = 'zombies';
    this.engine = null;

    this.zombies = [];
    this.enemyProjectiles = [];
    this.hazardPools = [];
    this.powerUps = [];
    this.activeEffects = {
      instaKill: 0,
      doublePoints: 0
    };

    this.currentRound = 1;
    this.zombiesToSpawn = 0;
    this.zombiesAlive = 0;
    this.maxActiveZombies = 30;
    this.spawnTimer = 0;
    this.spawnInterval = 1100;
    this.bossPending = false;
    this.lastHazardDamageTime = 0;

    this.roundBreak = false;
    this.breakTimer = 0;
    this.breakDuration = 5000;
  }

  init(engine) {
    this.engine = engine;
    this.startRound(1);

    this.engine.bus.on(EVENTS.GAME_RESTART, () => {
      this.reset();
    });

    this.engine.bus.on(EVENTS.PLAYER_REVIVE, () => {
      const player = this.engine.getModule('player');
      if (!player) return;
      this.enemyProjectiles = [];
      this.hazardPools = [];
      this.applyRayGunSplash(player.x, player.y, 9999, 240);
      const visuals = this.engine.getModule('visuals');
      if (visuals) {
        visuals.addFloatingText('ДОДЕП: ВТОРОЙ ШАНС!', player.x, player.y - 42, '#00ffaa', 1.8);
        visuals.flashScreen('#00ffaa', 0.55);
        visuals.addScreenShake(8, 0.35);
      }
    });

    this.engine.bus.on(EVENTS.LUDKA_REWARD, (reward) => {
      if (!reward) return;
      const player = this.engine.getModule('player');
      if (!player) return;

      if (reward.instaKill) {
        this.activeEffects.instaKill = 15;
        this.engine.bus.emit('powerup:activated', { type: 'insta_kill', duration: 15 });
      }
      if (reward.doublePoints) {
        this.activeEffects.doublePoints = 20;
        this.engine.bus.emit('powerup:activated', { type: 'double_points', duration: 20 });
      }
      if (reward.nuke) {
        this.triggerNuke(player);
      }
    });
  }

  reset() {
    this.zombies = [];
    this.enemyProjectiles = [];
    this.hazardPools = [];
    this.powerUps = [];
    this.activeEffects.instaKill = 0;
    this.activeEffects.doublePoints = 0;
    this.spawnTimer = this.engine ? this.engine.now() : 0;
    this.breakTimer = 0;
    this.lastHazardDamageTime = 0;
    this.roundBreak = false;
    this.startRound(1);
  }

  startRound(roundNum) {
    this.currentRound = roundNum;
    this.roundBreak = false;
    this.spawnTimer = this.engine ? this.engine.now() : 0;

    this.isDogRound = roundNum % 5 === 0;
    this.isBossRound = !this.isDogRound && roundNum % 4 === 0;
    this.bossPending = this.isBossRound;

    this.zombiesToSpawn = this.isDogRound
      ? Math.floor(10 + roundNum * 3)
      : Math.floor(8 + roundNum * 4);

    this.zombiesAlive = this.zombiesToSpawn;
    this.spawnInterval = Math.max(600, 1500 - roundNum * 60);

    this.engine.bus.emit(EVENTS.ROUND_START, {
      roundNumber: this.currentRound,
      isDogRound: this.isDogRound
    });
  }

  selectZombieType() {
    if (this.isDogRound) {
      return Math.random() < 0.78 ? ZOMBIE_TYPES.HELLHOUND : ZOMBIE_TYPES.PHANTOM;
    }

    if (this.bossPending && this.zombiesToSpawn <= 6) {
      this.bossPending = false;
      return ZOMBIE_TYPES.BOSS;
    }

    const r = this.currentRound;
    const roll = Math.random();

    if (r === 1) {
      if (roll < 0.16) return ZOMBIE_TYPES.RUNNER;
      if (roll < 0.34) return ZOMBIE_TYPES.CRAWLER;
      if (roll < 0.44) return ZOMBIE_TYPES.SPITTER;
      if (roll < 0.51) return ZOMBIE_TYPES.BOMBER;
      return ZOMBIE_TYPES.WALKER;
    }

    if (r === 2) {
      if (roll < 0.16) return ZOMBIE_TYPES.RUNNER;
      if (roll < 0.28) return ZOMBIE_TYPES.CRAWLER;
      if (roll < 0.39) return ZOMBIE_TYPES.SPITTER;
      if (roll < 0.49) return ZOMBIE_TYPES.BOMBER;
      if (roll < 0.59) return ZOMBIE_TYPES.HAZMAT;
      if (roll < 0.69) return ZOMBIE_TYPES.SHIELD;
      if (roll < 0.77) return ZOMBIE_TYPES.HELLHOUND;
      return ZOMBIE_TYPES.WALKER;
    }

    // 3+ волны: полный зоопарк мутантов!
    if (r >= 4 && roll < 0.06) return ZOMBIE_TYPES.NECROMANCER;
    if (roll < 0.13) return ZOMBIE_TYPES.SCREAMER;
    if (roll < 0.21) return ZOMBIE_TYPES.PHANTOM;
    if (roll < 0.29) return ZOMBIE_TYPES.BRUTE;
    if (roll < 0.39) return ZOMBIE_TYPES.SHIELD;
    if (roll < 0.48) return ZOMBIE_TYPES.BOMBER;
    if (roll < 0.57) return ZOMBIE_TYPES.HAZMAT;
    if (roll < 0.67) return ZOMBIE_TYPES.SPITTER;
    if (roll < 0.76) return ZOMBIE_TYPES.HELLHOUND;
    if (roll < 0.85) return ZOMBIE_TYPES.RUNNER;
    if (roll < 0.92) return ZOMBIE_TYPES.CRAWLER;
    return ZOMBIE_TYPES.WALKER;
  }

  moveZombieSafely(z, dx, dy, map) {
    if (!map) {
      z.x += dx;
      z.y += dy;
      return;
    }
    if (dx !== 0 && !map.checkCollision(z.x + dx, z.y, z.radius)) {
      z.x += dx;
    }
    if (dy !== 0 && !map.checkCollision(z.x, z.y + dy, z.radius)) {
      z.y += dy;
    }
  }

  pickSpawnLocation() {
    const map = this.engine.getModule('map');
    const player = this.engine.getModule('player');
    const allSpawns = map ? map.spawnPoints : [{ x: -1335, y: -330 }];

    let reachableSpawns = allSpawns;
    if (map && player && typeof map.isReachable === 'function') {
      const filtered = allSpawns.filter((sp) => map.isReachable(sp.x, sp.y, player.x, player.y));
      if (filtered.length > 0) reachableSpawns = filtered;
    }

    let candidates = reachableSpawns;
    if (player) {
      // Стараемся спавнить в окнах неподалеку (240..1300px), чтобы орда не бежала через всю карту 30 секунд
      const nearbyFar = reachableSpawns.filter((sp) => {
        const d = Math.hypot(sp.x - player.x, sp.y - player.y);
        return d >= 240 && d <= 1350;
      });
      if (nearbyFar.length > 0) {
        candidates = nearbyFar;
      } else {
        const farSpawns = reachableSpawns.filter((sp) => Math.hypot(sp.x - player.x, sp.y - player.y) >= 240);
        if (farSpawns.length > 0) {
          candidates = farSpawns;
        } else {
          candidates = [...reachableSpawns]
            .sort((a, b) => Math.hypot(b.x - player.x, b.y - player.y) - Math.hypot(a.x - player.x, a.y - player.y))
            .slice(0, 1);
        }
      }
    }

    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  createZombieEntity(type, x, y) {
    const map = this.engine.getModule('map');
    const prof = ENEMY_PROFILES[type] || ENEMY_PROFILES.walker;
    const baseRoundHp = 100 + (this.currentRound - 1) * 58;
    const hp = Math.round(baseRoundHp * prof.hpMul);
    const speed = prof.spdBase + Math.random() * prof.spdRand + Math.min(45, this.currentRound * 3.5);

    let spawnX = x + (Math.random() - 0.5) * 18;
    let spawnY = y + (Math.random() - 0.5) * 18;
    if (map && map.checkCollision(spawnX, spawnY, prof.radius)) {
      spawnX = x;
      spawnY = y;
    }

    const now = this.engine ? this.engine.now() : 0;
    return {
      id: Math.random().toString(36).slice(2, 11),
      type,
      x: spawnX,
      y: spawnY,
      radius: prof.radius,
      hp,
      maxHp: hp,
      speed,
      damage: prof.dmg,
      attackCooldown: prof.cd,
      lastAttackTime: now - 500,
      lastAbilityTime: now + Math.random() * 1200,
      angle: 0,
      spawnFade: 0,
      walkAnimPhase: Math.random() * Math.PI * 2,
      legPhase: 0,
      attackProgress: 0,
      hitStun: 0,
      hitFlashTime: 0,
      hasted: false
    };
  }

  spawnAdminZombie(type) {
    if (!ENEMY_PROFILES[type]) return false;
    const sp = this.pickSpawnLocation();
    if (!sp) return false;
    const zombie = this.createZombieEntity(type, sp.x, sp.y);
    this.zombies.push(zombie);
    this.zombiesAlive++;
    if (this.roundBreak) this.roundBreak = false;
    this.engine.bus.emit(EVENTS.ZOMBIE_SPAWNED, zombie);
    return true;
  }

  spawnZombie() {
    if (this.zombiesToSpawn <= 0) return;
    const sp = this.pickSpawnLocation();
    const type = this.selectZombieType();
    const zombie = this.createZombieEntity(type, sp.x, sp.y);

    this.zombies.push(zombie);
    this.zombiesToSpawn--;
    this.engine.bus.emit(EVENTS.ZOMBIE_SPAWNED, zombie);
  }

  triggerBomberExplosion(z) {
    const player = this.engine.getModule('player');
    const visuals = this.engine.getModule('visuals');
    const radius = ENEMY_PROFILES.bomber.explodeRadius;

    if (visuals) {
      visuals.plasmaRings.push({ x: z.x, y: z.y, radius: 10, maxRadius: radius, alpha: 1.0 });
      visuals.addFloatingText('БУМ!', z.x, z.y - 25, '#ff7722', 1.6);
      visuals.addScreenShake(7.5, 0.25);
      visuals.playSfx('raygun');
    }

    if (player && !player.isDead) {
      const pDist = Math.hypot(player.x - z.x, player.y - z.y);
      if (pDist < radius) {
        const dmg = Math.round(52 * (1 - pDist / (radius * 1.25)));
        if (dmg > 5) {
          this.engine.bus.emit(EVENTS.PLAYER_DAMAGED, { amount: dmg });
        }
      }
    }

    // Взрыв камикадзе калечит и соседних зомби
    for (let i = this.zombies.length - 1; i >= 0; i--) {
      const other = this.zombies[i];
      if (!other || other.id === z.id) continue;
      const dist = Math.hypot(other.x - z.x, other.y - z.y);
      if (dist <= radius) {
        other.hp -= 120;
        other.hitFlashTime = 0.1;
        if (other.hp <= 0) {
          this.killZombieAtIndex(i, false, true);
        }
      }
    }
  }

  killZombieAtIndex(index, isHeadshot = false, fromExplosion = false) {
    const z = this.zombies[index];
    if (!z) return;

    const deathX = z.x;
    const deathY = z.y;
    const type = z.type;
    const prof = ENEMY_PROFILES[type] || ENEMY_PROFILES.walker;

    this.zombies.splice(index, 1);
    this.zombiesAlive = Math.max(0, this.zombiesAlive - 1);

    if (type === ZOMBIE_TYPES.BOMBER && !fromExplosion) {
      this.triggerBomberExplosion(z);
    }

    if (type === ZOMBIE_TYPES.HAZMAT) {
      this.hazardPools.push({
        x: deathX,
        y: deathY,
        radius: 56,
        life: 5.5,
        damage: 14,
        color: '#88ff22'
      });
    }

    const player = this.engine.getModule('player');
    const mult = player ? player.pointMultiplier : 1;
    const basePts = isHeadshot ? Math.round(prof.pts * 1.5) : prof.pts;
    const pointsEarned = basePts * mult;

    this.engine.bus.emit(EVENTS.FX_BLOOD, {
      x: deathX,
      y: deathY,
      count: type === ZOMBIE_TYPES.BOSS ? 30 : 18,
      isDeath: true
    });

    this.engine.bus.emit(EVENTS.ZOMBIE_KILLED, {
      id: z.id,
      type,
      x: deathX,
      y: deathY,
      isHeadshot,
      pointsEarned
    });

    if (Math.random() < (type === ZOMBIE_TYPES.BOSS ? 0.9 : 0.055)) {
      this.spawnPowerUp(deathX, deathY);
    }

    if (this.zombiesAlive <= 0 && !this.roundBreak) {
      this.roundBreak = true;
      this.breakTimer = this.engine.now();
      this.engine.bus.emit(EVENTS.ROUND_CLEARED, { roundNumber: this.currentRound });
    }
  }

  applyRayGunSplash(hitX, hitY, baseDamage, radius = 65, excludeId = null) {
    const splashDmg = this.activeEffects.instaKill > 0 ? 99999 : Math.round(baseDamage * 0.65);

    for (let i = this.zombies.length - 1; i >= 0; i--) {
      const z = this.zombies[i];
      if (!z || z.id === excludeId) continue;

      const dist = Math.hypot(z.x - hitX, z.y - hitY);
      if (dist <= radius + z.radius) {
        z.hp -= splashDmg;
        z.hitFlashTime = 0.08;

        this.engine.bus.emit(EVENTS.FX_BLOOD, { x: z.x, y: z.y, count: 4 });
        this.engine.bus.emit(EVENTS.ZOMBIE_DAMAGED, {
          id: z.id,
          amount: splashDmg,
          isInstaKill: this.activeEffects.instaKill > 0,
          remainingHp: z.hp
        });

        if (z.hp <= 0) {
          this.killZombieAtIndex(i, false);
        }
      }
    }
  }

  checkBulletHit(bullet) {
    const map = this.engine.getModule('map');

    for (let i = this.zombies.length - 1; i >= 0; i--) {
      const z = this.zombies[i];
      const dist = Math.hypot(z.x - bullet.x, z.y - bullet.y);

      if (dist < z.radius + 6) {
        const multiplayer = this.engine.getModule('multiplayer');
        if (multiplayer?.room && !multiplayer.isHost) { multiplayer.send({type:'hit', id:z.id, damage:bullet.damage}); return true; }
        const isInsta = this.activeEffects.instaKill > 0;
        let dmg = isInsta ? 99999 : bullet.damage;

        const bSpeed = Math.hypot(bullet.vx, bullet.vy) || 1;
        const bx = bullet.vx / bSpeed;
        const by = bullet.vy / bSpeed;

        // Щитоносец блокирует 70% обычного урона спереди!
        let shieldBlocked = false;
        if (z.type === ZOMBIE_TYPES.SHIELD && !bullet.isRayGun && !isInsta) {
          const facingDot = bx * Math.cos(z.angle) + by * Math.sin(z.angle);
          if (facingDot < -0.25) {
            dmg = Math.max(4, Math.round(dmg * 0.3));
            shieldBlocked = true;
          }
        }

        z.hp -= dmg;
        z.hitFlashTime = 0.08;
        z.hitStun = shieldBlocked ? 0.02 : 0.06;

        this.moveZombieSafely(z, bx * (shieldBlocked ? 1.5 : 4), by * (shieldBlocked ? 1.5 : 4), map);

        const isHeadshot = !shieldBlocked && (dist < z.radius * 0.55 || Math.random() < 0.14);

        this.engine.bus.emit(EVENTS.FX_BLOOD, { x: z.x, y: z.y, count: shieldBlocked ? 2 : 6 });
        if (shieldBlocked) {
          this.engine.getModule('visuals')?.addFloatingText('ЩИТ!', z.x, z.y - 26, '#ffdd55', 0.9);
        }

        this.engine.bus.emit(EVENTS.ZOMBIE_DAMAGED, {
          id: z.id,
          amount: dmg,
          isInstaKill: isInsta,
          remainingHp: z.hp
        });

        if (bullet.isRayGun) {
          this.engine.bus.emit(EVENTS.BULLET_HIT, {
            x: bullet.x,
            y: bullet.y,
            targetType: 'zombie',
            isRayGun: true,
            splashRadius: bullet.splashRadius || 65
          });
        }

        const hitZombieId = z.id;
        if (z.hp <= 0) {
          this.killZombieAtIndex(i, isHeadshot);
        }

        if (bullet.isRayGun) {
          this.applyRayGunSplash(bullet.x, bullet.y, bullet.damage, bullet.splashRadius || 65, hitZombieId);
        }

        return true;
      }
    }
    return false;
  }

  spawnPowerUp(x, y) {
    const types = ['max_ammo', 'insta_kill', 'nuke', 'double_points'];
    const type = types[Math.floor(Math.random() * types.length)];
    this.powerUps.push({ type, x, y, life: 25, pulsePhase: 0 });
  }

  triggerNuke(player) {
    const bus = this.engine.bus;
    const visuals = this.engine.getModule('visuals');
    const count = this.zombies.length;

    for (const z of this.zombies) {
      bus.emit(EVENTS.FX_BLOOD, { x: z.x, y: z.y, count: 12, isDeath: true });
    }
    this.zombies = [];
    this.enemyProjectiles = [];
    this.zombiesAlive = Math.max(0, this.zombiesAlive - count);
    if (player) player.addPoints(400);

    if (visuals) {
      visuals.flashScreen('#ffffff', 0.8);
      visuals.addScreenShake(10, 0.5);
    }

    if (this.zombiesAlive <= 0 && !this.roundBreak) {
      this.roundBreak = true;
      this.breakTimer = this.engine.now();
      bus.emit(EVENTS.ROUND_CLEARED, { roundNumber: this.currentRound });
    }
  }

  collectPowerUp(pw, player) {
    const bus = this.engine.bus;
    const visuals = this.engine.getModule('visuals');

    if (pw.type === 'max_ammo') {
      for (const w of player.weapons) {
        w.reserve = w.reserveAmmo;
        w.currentMag = w.magSize;
      }
      player.syncWeaponWithHud();
      bus.emit('powerup:activated', { type: 'max_ammo', duration: 0 });
      visuals?.addFloatingText('MAX AMMO!', pw.x, pw.y - 30, '#33ccff', 2.0);
      visuals?.playSfx('boxReady');
    } else if (pw.type === 'insta_kill') {
      this.activeEffects.instaKill = 15;
      bus.emit('powerup:activated', { type: 'insta_kill', duration: 15 });
      visuals?.addFloatingText('INSTA-KILL!', pw.x, pw.y - 30, '#ff3333', 2.0);
      visuals?.flashScreen('#ff2222', 0.3);
    } else if (pw.type === 'double_points') {
      this.activeEffects.doublePoints = 20;
      bus.emit('powerup:activated', { type: 'double_points', duration: 20 });
      visuals?.addFloatingText('DOUBLE POINTS (x2)!', pw.x, pw.y - 30, '#ffff33', 2.0);
    } else if (pw.type === 'nuke') {
      this.triggerNuke(player);
      bus.emit('powerup:activated', { type: 'nuke', duration: 0 });
      visuals?.addFloatingText('KABOOM! +400', pw.x, pw.y - 30, '#ffaa00', 2.4);
    }
  }

  spawnEnemyProjectile(x, y, angle, speed, damage, color, radius = 6) {
    this.enemyProjectiles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      damage,
      color,
      radius,
      life: 2.2
    });
  }

  handleSpecialAbilities(z, dist, dx, dy, now, map, player) {
    const prof = ENEMY_PROFILES[z.type];
    if (!prof) return false;

    // 1. Дальний бой: Плевун и Некромант
    if (prof.ranged && dist <= prof.rangeMax && map?.hasLineOfSight(z.x, z.y, player.x, player.y, 10)) {
      z.angle = Math.atan2(dy, dx);
      if (now - z.lastAttackTime >= z.attackCooldown) {
        z.lastAttackTime = now;
        z.attackProgress = 1.0;

        if (z.type === ZOMBIE_TYPES.SPITTER) {
          this.spawnEnemyProjectile(z.x, z.y, z.angle, 390, z.damage, '#77ff33', 7);
        } else if (z.type === ZOMBIE_TYPES.NECROMANCER) {
          for (const offset of [-0.22, 0, 0.22]) {
            this.spawnEnemyProjectile(z.x, z.y, z.angle + offset, 340, z.damage, '#38bdf8', 7);
          }
        }
      }

      // Если враг уже на комфортной дистанции — притормаживает и стреляет
      if (dist >= prof.rangeMin) {
        return true;
      }
    }

    // 2. Некромант призывает подмогу раз в 6.5с
    if (prof.summons && now - z.lastAbilityTime >= 6500 && this.zombies.length < this.maxActiveZombies) {
      z.lastAbilityTime = now;
      const summonCount = this.zombies.length + 2 <= this.maxActiveZombies ? 2 : 1;
      for (let k = 0; k < summonCount; k++) {
        const ang = Math.random() * Math.PI * 2;
        const minion = this.createZombieEntity(ZOMBIE_TYPES.CRAWLER, z.x + Math.cos(ang) * 34, z.y + Math.sin(ang) * 34);
        this.zombies.push(minion);
        this.zombiesAlive++;
      }
      this.engine.getModule('visuals')?.addFloatingText('ПРИЗЫВ!', z.x, z.y - 32, '#38bdf8', 1.2);
    }

    // 3. Теневой рывок Фантома и Альфа-Босса
    if (prof.dashes && dist > 90 && dist < 340 && now - z.lastAbilityTime >= 3600) {
      z.lastAbilityTime = now;
      const dirX = dx / (dist || 1);
      const dirY = dy / (dist || 1);
      for (let step = 0; step < 5; step++) {
        this.moveZombieSafely(z, dirX * 16, dirY * 16, map);
      }
    }

    return false;
  }

  update(dt) {
    const multiplayer = this.engine.getModule('multiplayer');
    if (multiplayer?.room && !multiplayer.isHost) return;
    const now = this.engine.now();

    if (this.activeEffects.instaKill > 0) this.activeEffects.instaKill = Math.max(0, this.activeEffects.instaKill - dt);
    if (this.activeEffects.doublePoints > 0) this.activeEffects.doublePoints = Math.max(0, this.activeEffects.doublePoints - dt);

    const player = this.engine.getModule('player');
    const map = this.engine.getModule('map');

    // Бонусы на полу
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const pw = this.powerUps[i];
      pw.life -= dt;
      pw.pulsePhase += dt * 4;
      if (player && !player.isDead && Math.hypot(player.x - pw.x, player.y - pw.y) < player.radius + 18) {
        this.collectPowerUp(pw, player);
        this.powerUps.splice(i, 1);
        continue;
      }
      if (pw.life <= 0) this.powerUps.splice(i, 1);
    }

    // Кислотные лужи от Хим-мутантов
    for (let i = this.hazardPools.length - 1; i >= 0; i--) {
      const pool = this.hazardPools[i];
      pool.life -= dt;
      if (player && !player.isDead && Math.hypot(player.x - pool.x, player.y - pool.y) < pool.radius + player.radius - 4) {
        if (now - this.lastHazardDamageTime >= 550) {
          this.lastHazardDamageTime = now;
          this.engine.bus.emit(EVENTS.PLAYER_DAMAGED, { amount: pool.damage });
        }
      }
      if (pool.life <= 0) this.hazardPools.splice(i, 1);
    }

    // Снаряды плевунов и некромантов
    for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
      const pr = this.enemyProjectiles[i];
      pr.x += pr.vx * dt;
      pr.y += pr.vy * dt;
      pr.life -= dt;

      if (map && map.checkCollision(pr.x, pr.y, pr.radius)) {
        this.enemyProjectiles.splice(i, 1);
        continue;
      }
      if (player && !player.isDead && Math.hypot(player.x - pr.x, player.y - pr.y) < player.radius + pr.radius) {
        this.engine.bus.emit(EVENTS.PLAYER_DAMAGED, { amount: pr.damage });
        this.enemyProjectiles.splice(i, 1);
        continue;
      }
      if (pr.life <= 0) this.enemyProjectiles.splice(i, 1);
    }

    if (this.roundBreak) {
      if (now - this.breakTimer >= this.breakDuration) {
        this.startRound(this.currentRound + 1);
      }
      return;
    }

    // Пакетный спавн орды (по 1-2 врага на высоких волнах)
    if (this.zombiesToSpawn > 0 && this.zombies.length < this.maxActiveZombies && now - this.spawnTimer >= this.spawnInterval) {
      const burst = this.currentRound >= 3 ? Math.min(2, this.zombiesToSpawn, this.maxActiveZombies - this.zombies.length) : 1;
      for (let b = 0; b < burst; b++) {
        this.spawnZombie();
      }
      this.spawnTimer = now;
    }

    if (!player || player.isDead) return;

    // Аура ускорения от Крикунов (Screamer)
    const screamers = this.zombies.filter((item) => item.type === ZOMBIE_TYPES.SCREAMER);
    for (const z of this.zombies) {
      z.hasted = false;
      for (const scr of screamers) {
        if (scr.id !== z.id && Math.hypot(z.x - scr.x, z.y - scr.y) <= ENEMY_PROFILES.screamer.auraRadius) {
          z.hasted = true;
          break;
        }
      }
    }

    // Основной ИИ врагов
    for (let i = this.zombies.length - 1; i >= 0; i--) {
      const z = this.zombies[i];
      if (!z) continue;

      if (z.spawnFade < 1) z.spawnFade = Math.min(1, z.spawnFade + dt * 3);
      if (z.hitFlashTime > 0) z.hitFlashTime -= dt;
      if (z.hitStun > 0) z.hitStun -= dt;
      if (z.attackProgress > 0) z.attackProgress = Math.max(0, z.attackProgress - dt * 2.8);

      const dx = player.x - z.x;
      const dy = player.y - z.y;
      const dist = Math.hypot(dx, dy);

      const effSpeed = z.hasted ? z.speed * 1.35 : z.speed;
      z.walkAnimPhase += dt * (effSpeed / 12);
      z.legPhase += dt * (effSpeed / 8);

      if (z.hitStun > 0) {
        z.angle = Math.atan2(dy, dx);
        continue;
      }

      // Камикадзе взрывается при сближении
      if (z.type === ZOMBIE_TYPES.BOMBER && dist <= z.radius + player.radius + 14) {
        this.killZombieAtIndex(i, false, true);
        this.triggerBomberExplosion(z);
        continue;
      }

      const holdPos = this.handleSpecialAbilities(z, dist, dx, dy, now, map, player);
      const stopDist = z.radius + player.radius - 2;

      if (!holdPos && dist > stopDist) {
        const dir = map ? map.getFlowDirection(z.x, z.y, player.x, player.y) : { x: dx / dist, y: dy / dist };
        z.angle = Math.atan2(dir.y, dir.x);
        this.moveZombieSafely(z, dir.x * effSpeed * dt, dir.y * effSpeed * dt, map);

        if (z.type === ZOMBIE_TYPES.CRAWLER && Math.random() < 0.14) {
          this.engine.bus.emit(EVENTS.FX_BLOOD, { x: z.x, y: z.y, count: 1 });
        }
      } else if (dist <= stopDist) {
        z.angle = Math.atan2(dy, dx);
        if (now - z.lastAttackTime >= z.attackCooldown) {
          z.lastAttackTime = now;
          z.attackProgress = 1.0;
          this.engine.bus.emit(EVENTS.PLAYER_DAMAGED, { amount: z.damage });
        }
      }
    }

    // Безопасное разделение толпы
    for (let i = 0; i < this.zombies.length; i++) {
      for (let j = i + 1; j < this.zombies.length; j++) {
        const z1 = this.zombies[i];
        const z2 = this.zombies[j];
        const sepDx = z2.x - z1.x;
        const sepDy = z2.y - z1.y;
        const sepDist = Math.hypot(sepDx, sepDy);
        const minDist = z1.radius + z2.radius;

        if (sepDist < minDist && sepDist > 0.001) {
          const overlap = (minDist - sepDist) * 0.48;
          const nx = (sepDx / sepDist) * overlap;
          const ny = (sepDy / sepDist) * overlap;
          this.moveZombieSafely(z1, -nx, -ny, map);
          this.moveZombieSafely(z2, nx, ny, map);
        }
      }
    }
  }

  renderPowerUps(ctx) {
    for (const pw of this.powerUps) {
      if (pw.life < 4 && Math.sin(pw.life * 12) < 0) continue;
      ctx.save();
      ctx.translate(pw.x, pw.y);
      const pulse = 1 + Math.sin(pw.pulsePhase) * 0.15;
      ctx.scale(pulse, pulse);
      ctx.shadowColor = '#00ffcc';
      ctx.shadowBlur = 14;
      ctx.fillStyle = '#112211';
      ctx.strokeStyle = '#00ff88';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const labels = { max_ammo: 'AMMO', insta_kill: 'KILL', nuke: 'NUKE', double_points: 'x2' };
      ctx.fillText(labels[pw.type] || '★', 0, 0);
      ctx.restore();
    }
  }

  renderBodyByType(ctx, z, isFlashing) {
    if (z.type === ZOMBIE_TYPES.HELLHOUND) {
      const flame = ctx.createRadialGradient(0, 0, 4, 0, 0, z.radius + 10);
      flame.addColorStop(0, '#ffcc00');
      flame.addColorStop(0.5, '#ff4400');
      flame.addColorStop(1, 'rgba(255, 0, 0, 0)');
      ctx.fillStyle = flame;
      ctx.beginPath();
      ctx.arc(0, 0, z.radius + 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = isFlashing ? '#ffffff' : '#1f130b';
      ctx.beginPath();
      ctx.ellipse(0, 0, z.radius, z.radius * 0.65, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffff55';
      ctx.fillRect(6, -5, 3, 3);
      ctx.fillRect(6, 2, 3, 3);
      return;
    }

    if (z.type === ZOMBIE_TYPES.CRAWLER) {
      const armReach = Math.sin(z.walkAnimPhase) * 5;
      ctx.fillStyle = isFlashing ? '#ffffff' : '#3d4d35';
      ctx.fillRect(4 + armReach, -11, 11, 4);
      ctx.fillRect(4 - armReach, 7, 11, 4);

      ctx.fillStyle = isFlashing ? '#ffffff' : '#2b3b24';
      ctx.beginPath();
      ctx.arc(0, 0, z.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffee44';
      ctx.fillRect(4, -4, 2.5, 2.5);
      ctx.fillRect(4, 2, 2.5, 2.5);
      return;
    }

    const colorMap = {
      walker:      { body: '#2e3d29', head: '#577549', eye: '#ffea00', arm: '#4d693f' },
      runner:      { body: '#4a211c', head: '#7a332a', eye: '#ff3300', arm: '#662b23' },
      spitter:     { body: '#1f4a22', head: '#48a832', eye: '#99ff33', arm: '#3a7a2b' },
      bomber:      { body: '#5a280a', head: '#c2591b', eye: '#ffea00', arm: '#8a3d12' },
      shield:      { body: '#263238', head: '#455a64', eye: '#ff5252', arm: '#37474f' },
      hazmat:      { body: '#857712', head: '#d4be1e', eye: '#ccff00', arm: '#a39218' },
      phantom:     { body: '#2d1c4d', head: '#623ba8', eye: '#e879f9', arm: '#4c2c85' },
      screamer:    { body: '#52153d', head: '#b82584', eye: '#ff77cc', arm: '#8f1d66' },
      brute:       { body: '#4a1212', head: '#7d2020', eye: '#ff0000', arm: '#631919' },
      necromancer: { body: '#0f2f3d', head: '#1e6b85', eye: '#38bdf8', arm: '#154e63' },
      boss:        { body: '#3b0707', head: '#8f1111', eye: '#ffbe0b', arm: '#6b0c0c' }
    };
    const pal = colorMap[z.type] || colorMap.walker;

    if (z.type === ZOMBIE_TYPES.PHANTOM) ctx.globalAlpha *= 0.62;

    if (z.type === ZOMBIE_TYPES.SCREAMER) {
      ctx.strokeStyle = 'rgba(244, 114, 182, 0.25)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, z.radius + 10 + Math.sin(performance.now() * 0.01) * 4, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (z.type === ZOMBIE_TYPES.BOMBER) {
      const blink = 0.4 + Math.abs(Math.sin(performance.now() * 0.012)) * 0.6;
      ctx.fillStyle = `rgba(255, 110, 0, ${blink * 0.45})`;
      ctx.beginPath();
      ctx.arc(0, 0, z.radius + 8, 0, Math.PI * 2);
      ctx.fill();
    }

    const legSwing = Math.sin(z.legPhase) * (z.type === ZOMBIE_TYPES.RUNNER ? 7 : 4);
    ctx.fillStyle = '#181e17';
    ctx.fillRect(-6 + legSwing, -z.radius * 0.65, 8, 4);
    ctx.fillRect(-6 - legSwing, z.radius * 0.65 - 4, 8, 4);

    const attackOffset = z.attackProgress * 8;
    const handSwing = Math.sin(z.walkAnimPhase) * 4;
    ctx.fillStyle = isFlashing ? '#ffffff' : pal.arm;
    ctx.fillRect(z.radius * 0.45 + attackOffset, -9 + handSwing, 13, 4.5);
    ctx.fillRect(z.radius * 0.45 + attackOffset, 4 - handSwing, 13, 4.5);

    ctx.fillStyle = isFlashing ? '#ffffff' : pal.body;
    ctx.beginPath();
    ctx.arc(0, 0, z.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = z.hasted ? '#ff66cc' : '#111612';
    ctx.lineWidth = z.hasted ? 3 : 2;
    ctx.stroke();

    ctx.fillStyle = isFlashing ? '#ffffff' : pal.head;
    ctx.beginPath();
    ctx.arc(-1, 0, z.radius * 0.56, 0, Math.PI * 2);
    ctx.fill();

    // Бронещит спереди у Щитоносца
    if (z.type === ZOMBIE_TYPES.SHIELD) {
      ctx.fillStyle = '#90a4ae';
      ctx.strokeStyle = '#cfd8dc';
      ctx.lineWidth = 2;
      ctx.fillRect(z.radius - 2, -z.radius * 0.9, 6, z.radius * 1.8);
      ctx.strokeRect(z.radius - 2, -z.radius * 0.9, 6, z.radius * 1.8);
    }

    // Корона у Альфа-Босса
    if (z.type === ZOMBIE_TYPES.BOSS) {
      ctx.strokeStyle = '#ffbe0b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, z.radius + 5, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = pal.eye;
    ctx.shadowColor = pal.eye;
    ctx.shadowBlur = 6;
    ctx.fillRect(4, -5, 3, 3);
    ctx.fillRect(4, 2, 3, 3);
    ctx.shadowBlur = 0;
  }

  render(ctx) {
    // 0. Кислотные лужи
    for (const pool of this.hazardPools) {
      ctx.save();
      ctx.globalAlpha = Math.min(0.65, pool.life / 2);
      ctx.fillStyle = 'rgba(120, 255, 40, 0.32)';
      ctx.strokeStyle = '#88ff22';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pool.x, pool.y, pool.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    this.renderPowerUps(ctx);

    // 1. Враги
    for (const z of this.zombies) {
      ctx.save();
      ctx.globalAlpha = Math.max(0.15, z.spawnFade ?? 1);
      ctx.translate(z.x, z.y);
      ctx.rotate(z.angle);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
      ctx.beginPath();
      ctx.ellipse(2, 3, z.radius, z.radius * 0.85, 0, 0, Math.PI * 2);
      ctx.fill();

      this.renderBodyByType(ctx, z, z.hitFlashTime > 0);

      if (z.hp < z.maxHp) {
        ctx.rotate(-z.angle);
        const bw = Math.max(32, z.radius * 1.8);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
        ctx.fillRect(-bw / 2, -z.radius - 11, bw, 5);
        ctx.fillStyle = z.type === ZOMBIE_TYPES.BOSS ? '#ffbe0b' : '#cc2222';
        ctx.fillRect(-bw / 2, -z.radius - 11, bw * Math.max(0, z.hp / z.maxHp), 5);
      }

      ctx.restore();
    }

    // 2. Снаряды врагов
    for (const pr of this.enemyProjectiles) {
      ctx.save();
      ctx.fillStyle = pr.color;
      ctx.shadowColor = pr.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(pr.x, pr.y, pr.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}
