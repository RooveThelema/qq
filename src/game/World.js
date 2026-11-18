import { MAPS, HEROES, ENEMIES, UPGRADES, makeObstacles, seededRandom, xpRequired, EVOLUTIONS } from './catalog.js';

import { SpatialGrid } from './SpatialGrid.js';
import { Director } from './Director.js';

const distanceSq = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
const nearest = (items, from, range = Infinity, skip) => { let best, d = range * range; for (const e of items) { if (e.hp <= 0 || skip?.has(e.id)) continue; const n = distanceSq(e, from); if (n < d) { d = n; best = e; } } return best; };

const TAU = Math.PI * 2;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

/** The exact same simulation runs on the server and in offline solo mode. */
export class World {
  constructor(mapId = 'outpost', seed = Date.now(), mode = 'classic') {
    this.mapId = MAPS[mapId] ? mapId : 'outpost';
    this.map = MAPS[this.mapId];
    this.obstacles = makeObstacles(this.mapId);
    this.random = seededRandom(seed);
    this.players = new Map();
    this.enemies = [];
    this.bullets = [];
    this.gems = [];
    this.effects = [];
    this.time = 0;
    this.status = 'lobby';
    this.kills = 0;
    this.nextId = 1;
    this.spawnClock = 0;
    this.bossCount = 0;
    this.lastBoss = false;
    this.grid = new SpatialGrid(); this.candidates = []; this.enemyById = new Map();
    this.director = new Director(this, mode);
  }

  addPlayer(id, name, hero = 'ranger') {
    const type = HEROES[hero] ? hero : 'ranger';
    const h = HEROES[type];
    const index = this.players.size;
    const player = { id, name, hero: type, color: h.color, x: this.map.width / 2 + (index === 0 ? -45 : Math.cos(index * 2.399963) * (45 + Math.floor(index / 4) * 35)), y: this.map.height / 2 + Math.sin(index * 2.399963) * (45 + Math.floor(index / 4) * 35),
      hp: h.hp, maxHp: h.hp, level: 1, xp: 0, kills: 0, dead: false, connected: true, angle: -Math.PI / 2,
      weapons: { gun: 1, ...(type === 'ranger' ? {} : { [h.weapon]: 1 }) },
      upgrades: {}, options: [], pending: 0, revive: 0, dash: 0, shield: 2, input: { x: 0, y: 0 },
      cooldowns: {}, hitTimers: {}, dashTime: 0, damage: h.damage, armor: type === 'engineer' ? 2 : 0, regen: type === 'medic' ? 0.8 : 0, speed: h.speed, magnet: type === 'scout' ? 145 : 90, evolved: {} };
    this.players.set(id, player);
    return player;
  }

  setInput(id, input) {
    const p = this.players.get(id);
    if (!p || p.dead) return;
    const x = typeof input.x === 'number' && Number.isFinite(input.x) ? clamp(input.x, -1, 1) : 0;
    const y = typeof input.y === 'number' && Number.isFinite(input.y) ? clamp(input.y, -1, 1) : 0;
    const size = Math.max(1, Math.hypot(x, y));
    p.input = { x: x / size, y: y / size };
    if (input.dash === true && p.dash <= 0 && (x || y)) {
      p.dash = 4 / (1 + (p.upgrades.dash || 0) * .15);
      p.dashTime = 0.19;
      p.shield = Math.max(p.shield, 0.3);
    }
  }

  start() { if (this.status === 'lobby' && this.players.size) { this.status = 'playing'; this.spawnClock = 0.6; } }

  move(entity, dx, dy, radius) {
    for (const axis of ['x', 'y']) {
      entity[axis] += axis === 'x' ? dx : dy;
      entity[axis] = clamp(entity[axis], radius + 20, this.map[axis === 'x' ? 'width' : 'height'] - radius - 20);
      for (const ob of this.obstacles) {
        const dd = distanceSq(entity, ob);
        if (dd >= (ob.r + radius) ** 2) continue;
        const d = Math.sqrt(dd);
        if (d < ob.r + radius) entity[axis] += (entity[axis] >= ob[axis] ? 1 : -1) * (ob.r + radius - d + 0.1);
      }
    }
  }

  offer(p) {
    if (p.options.length || !p.pending) return;
    const valid = UPGRADES.filter(u => (u.type === 'weapon' ? p.weapons[u.id] || 0 : p.upgrades[u.id] || 0) < u.max);
    const options = [];
    while (valid.length && options.length < 3) options.push(valid.splice(Math.floor(this.random() * valid.length), 1)[0].id);
    p.options = options.length ? options : ['heal'];
  }

  choose(id, option) {
    const p = this.players.get(id);
    if (!p || !p.options.includes(option) || this.status !== 'playing') return false;
    const u = UPGRADES.find(item => item.id === option);
    if (u?.type === 'weapon') p.weapons[option] = (p.weapons[option] || 0) + 1;
    else if (u) {
      p.upgrades[option] = (p.upgrades[option] || 0) + 1;
      if (option === 'damage') p.damage += 0.18;
      if (option === 'speed') p.speed += HEROES[p.hero].speed * 0.1;
      if (option === 'vitality') { p.maxHp += 25; p.hp = Math.min(p.maxHp, p.hp + 40); }
      if (option === 'magnet') p.magnet += 50;
      if (option === 'armor') p.armor += 2;
      if (option === 'regen') p.regen += 0.6;
    } else p.hp = p.maxHp;
    p.pending--;
    p.options = [];
    p.shield = Math.max(p.shield, 1.5);
    this.evolve(p);
    this.offer(p);
    return true;
  }

  evolve(p) {
    for (const [weapon, evolution] of Object.entries(EVOLUTIONS)) {
      if (p.weapons[weapon] >= 5 && p.upgrades[evolution.passive] >= 3 && !p.evolved[weapon]) {
        p.evolved[weapon] = true;
        this.director.tell(`${p.name}: эволюция «${evolution.name}»!`);
        this.effect('pulse', p.x, p.y, 180, p.color);
      }
    }
  }

  interact(id) { return this.director.interact(id); }

  giveXp(amount) {
    for (const p of this.players.values()) {
      p.xp += amount;
      while (p.xp >= xpRequired(p.level)) {
        p.xp -= xpRequired(p.level);
        p.level++;
        p.pending++;
        p.hp = Math.min(p.maxHp, p.hp + 8);
        p.shield = Math.max(p.shield, 3);
        this.offer(p);
      }
    }
  }

  spawn(type, x, y) {
    const c = ENEMIES[type];
    if (!c) return false;
    if (this.enemies.length >= 260) {
      if (type !== 'boss') return false;
      // A full horde must never prevent an objective boss from appearing.
      const expendable = this.enemies.findIndex(e => e.type !== 'boss');
      if (expendable < 0) return false;
      this.enemies.splice(expendable, 1);
    }
    const alive = [...this.players.values()].filter(p => !p.dead && p.connected);
    const target = alive[Math.floor(this.random() * alive.length)];
    if (!target) return false;
    if (x === undefined) {
      let safe = false;
      for (let attempt = 0; attempt < (type === 'boss' ? 24 : 4); attempt++) {
        const angle = this.random() * TAU;
        const radius = 690 + this.random() * 140;
        x = clamp(target.x + Math.cos(angle) * radius, 55, this.map.width - 55);
        y = clamp(target.y + Math.sin(angle) * radius, 55, this.map.height - 55);
        if (!alive.some(p => Math.hypot(p.x - x, p.y - y) < 350) && !this.obstacles.some(ob => Math.hypot(ob.x - x, ob.y - y) < ob.r + c.radius)) { safe = true; break; }
      }
      if (!safe) return false;
    }
    const scale = 1 + this.time / 230 + Math.max(0, alive.length - 1) * 0.45;
    const hp = Math.round(c.hp * scale);
    this.enemies.push({ id: this.nextId++, type, x, y, hp, maxHp: hp, radius: c.radius, speed: c.speed * (1 + Math.min(0.45, this.time / 1200)), damage: c.damage, slow: 0, attack: 1 + this.random() * 2, charge: 0, vx: 0, vy: 0, flash: 0 });
    if (this.bulletPhase) this.grid.insert(this.enemies.at(-1));
    return true;
  }

  hurt(enemy, amount, owner, knock = 0) {
    if (enemy.hp <= 0) return;
    if (owner) {
      const precision = (owner.upgrades.precision || 0) * .08;
      if (precision && this.random() < precision / (1 + precision)) amount *= 2 + (owner.upgrades.ferocity || 0) * .25;
      if (enemy.hp < enemy.maxHp * .35) amount *= 1 + (owner.upgrades.execution || 0) * .15;
    }
    enemy.hp -= amount;
    enemy.flash = 0.12;
    if (knock && owner) {
      const oldX = enemy.x, oldY = enemy.y, d = Math.max(1, distance(enemy, owner));
      this.move(enemy, (enemy.x - owner.x) / d * knock, (enemy.y - owner.y) / d * knock, enemy.radius);
      if (this.bulletPhase) this.grid.relocate(enemy, oldX, oldY);
    }
    if (enemy.hp > 0) return;
    this.kills++;
    if (owner) { owner.kills++; if (!owner.dead && owner.hp > 0) owner.hp = Math.min(owner.maxHp, owner.hp + (owner.upgrades.vampire || 0) * .4); }
    const value = ENEMIES[enemy.type].xp * (enemy.elite ? 4 : 1);
    if (enemy.reward) { for (const p of this.players.values()) { p.pending++; this.offer(p); } this.director.tell('Элита побеждена! Отряд получает улучшение.'); }
    if (enemy.type === 'splitter') for (let i = 0; i < 3; i++) this.spawn('runner', enemy.x + Math.cos(i * TAU / 3) * 25, enemy.y + Math.sin(i * TAU / 3) * 25);
    if (this.gems.length >= 300) { const gem = this.gems[Math.floor(this.random() * this.gems.length)]; gem.value += value; }
    else this.gems.push({ id: this.nextId++, x: enemy.x, y: enemy.y, value, kind: enemy.type === 'boss' ? 'chest' : this.random() < 0.035 ? 'heal' : 'xp' });
    if (enemy.type === 'boss') this.effect('blast', enemy.x, enemy.y, 120, '#efb279');
  }

  damagePlayer(p, amount) {
    if (p.dead || p.shield > 0 || !p.connected) return;
    const dodge = (p.upgrades.dodge || 0) * .06;
    if (dodge && this.random() < dodge / (1 + dodge)) { p.shield = .2; return; }
    p.hp = Math.max(0, p.hp - Math.max(1, amount - p.armor));
    if (p.upgrades.thorns) {
      for (const e of this.enemies) if (distanceSq(e, p) < (120 + e.radius) ** 2) this.hurt(e, p.upgrades.thorns * 6, p);
    }
    p.shield = 0.75;
    if (p.hp <= 0) { p.dead = true; p.revive = 0; p.input = { x: 0, y: 0 }; this.effect('down', p.x, p.y, 50, p.color); }
  }

  effect(kind, x, y, radius, color, extra = {}) {
    this.effects.push({ id: this.nextId++, kind, x, y, radius, color, ttl: kind === 'lightning' ? 0.24 : 0.5, ...extra });
  }

  fire(p, type, target, level) {
    const angle = Math.atan2(target.y - p.y, target.x - p.x);
    const count = Math.min(12, type === 'gun' ? 1 + Math.floor(level / 2) : type === 'frost' ? level + 2 : 1);
    const velocity = 1 + (p.upgrades.velocity || 0) * .12;
    for (let i = 0; i < count; i++) {
      const a = angle + (i - (count - 1) / 2) * (type === 'frost' ? 0.17 : 0.1);
      this.bullets.push({ id: this.nextId++, x: p.x, y: p.y, vx: Math.cos(a) * (type === 'rocket' ? 320 : 650) * velocity, vy: Math.sin(a) * (type === 'rocket' ? 320 : 650) * velocity,
        owner: p.id, type, target: target.id, damage: (type === 'rocket' ? 65 + level * 22 : type === 'frost' ? 14 + level * 6 : 24 + level * 7) * p.damage,
        radius: type === 'rocket' ? 6 : 4, ttl: 1.8, level, velocity, area: Math.sqrt(1 + (p.upgrades.area || 0) * .1) });
    }
    p.angle = angle;
  }

  attack(p, dt) {
    const haste = 1 + (p.upgrades.haste || 0) * 0.12;
    const nearby = this.enemies;
    const target = nearest(nearby, p, 640);
    for (const [weapon, baseLevel] of Object.entries(p.weapons)) {
      const level = baseLevel + (p.evolved[weapon] ? 3 : 0);
      p.cooldowns[weapon] = (p.cooldowns[weapon] || 0) - dt;
      if (weapon === 'orbit') {
        const count = Math.min(12, level + 1);
        for (let i = 0; i < count; i++) {
          const angle = this.time * 2.4 + i * TAU / count;
          const orb = { x: p.x + Math.cos(angle) * 84, y: p.y + Math.sin(angle) * 84 };
          for (const e of nearby) {
            if (distanceSq(e, orb) < (e.radius + 13) ** 2 && (p.hitTimers[e.id] || 0) <= this.time) {
              this.hurt(e, (18 + level * 9) * p.damage, p, 6);
              p.hitTimers[e.id] = this.time + 0.4 / haste;
            }
          }
        }
        continue;
      }
      if (p.cooldowns[weapon] > 0 || !target && weapon !== 'mine') continue;
      if (weapon === 'beam') {
        const angle = Math.atan2(target.y - p.y, target.x - p.x), dx = Math.cos(angle), dy = Math.sin(angle);
        const reach = 570 + level * 25;
        for (const e of nearby) {
          const x = e.x - p.x, y = e.y - p.y, along = x * dx + y * dy;
          if (along > 0 && along < reach && Math.abs(x * dy - y * dx) < e.radius + (9 + level) * Math.sqrt(1 + (p.upgrades.area || 0) * .1)) this.hurt(e, (38 + level * 19) * p.damage, p);
        }
        this.effect('lightning', p.x, p.y, 0, '#ef9aa5', { toX: p.x + dx * reach, toY: p.y + dy * reach });
        p.angle = angle; p.cooldowns[weapon] = 1.5 / haste;
      } else if (weapon === 'mine') {
        this.bullets.push({ id: this.nextId++, x: p.x, y: p.y, vx: 0, vy: 0, owner: p.id, type: 'mine', damage: (65 + level * 24) * p.damage, radius: 14, ttl: 12, level, area: Math.sqrt(1 + (p.upgrades.area || 0) * .1) });
        p.cooldowns[weapon] = 2.8 / haste;
      } else if (weapon === 'pulse') {
        const radius = Math.min(900, 100 + level * 24) * Math.sqrt(1 + (p.upgrades.area || 0) * .1);
        for (const e of nearby) if (distanceSq(e, p) < (radius + e.radius) ** 2) this.hurt(e, (30 + level * 15) * p.damage, p, 25);
        this.effect('pulse', p.x, p.y, radius, '#a5b7f2');
        p.cooldowns[weapon] = 2.5 / haste;
      } else if (weapon === 'lightning') {
        let from = p;
        const struck = new Set();
        for (let i = 0; i < Math.min(16, level + 2); i++) {
          const next = nearest(nearby, from, i === 0 ? 550 : 230, struck);
          if (!next) break;
          this.effect('lightning', from.x, from.y, 0, '#c3b3ff', { toX: next.x, toY: next.y });
          this.hurt(next, (32 + level * 16) * p.damage, p);
          struck.add(next.id); from = next;
        }
        p.cooldowns[weapon] = 1.8 / haste;
      } else {
        this.fire(p, weapon, target, level);
        p.cooldowns[weapon] = (weapon === 'gun' ? Math.max(0.16, 0.47 - level * 0.035) : weapon === 'rocket' ? 2.1 : 1.5) / haste;
      }
    }
    if (Object.keys(p.hitTimers).length > 300) p.hitTimers = Object.fromEntries(Object.entries(p.hitTimers).filter(([, t]) => t > this.time));
  }

  tick(dt) {
    if (this.status !== 'playing') return;
    dt = clamp(dt, 0, 0.1);
    const connected = [...this.players.values()].filter(p => p.connected);
    if (!connected.length) return;
    this.time += dt;
    for (const p of connected) {
      p.dash = Math.max(0, p.dash - dt);
      p.shield = Math.max(0, p.shield - dt);
      p.dashTime = Math.max(0, p.dashTime - dt);
      if (p.dead) {
        const helper = connected.find(other => !other.dead && distance(p, other) < 105);
        p.revive = helper ? p.revive + dt * (1 + (helper.upgrades.rescue || 0) * .25) : Math.max(0, p.revive - dt * 0.5);
        if (p.revive >= 3) { p.dead = false; p.hp = p.maxHp * 0.55; p.shield = 3; p.revive = 0; this.effect('pulse', p.x, p.y, 100, p.color); }
        continue;
      }
      p.hp = Math.min(p.maxHp, p.hp + p.regen * dt);
      this.move(p, p.input.x * p.speed * dt * (p.dashTime > 0 ? 4 : 1), p.input.y * p.speed * dt * (p.dashTime > 0 ? 4 : 1), 15);
      this.attack(p, dt);
    }
    const alive = connected.filter(p => !p.dead);
    if (!alive.length) { this.status = 'gameover'; return; }
    this.spawnClock -= dt;
    if (this.spawnClock <= 0) {
      this.spawnClock = Math.max(0.18, 1.05 - this.time / 600) / (1 + (alive.length - 1) * 0.35);
      const types = ['walker', 'walker', ...(this.time > 18 ? ['runner'] : []), ...(this.time > 50 ? ['tank'] : []), ...(this.time > 80 ? ['spitter'] : []), ...(this.time > 120 ? ['charger'] : []), ...(this.time > 160 ? ['splitter'] : []), ...(this.time > 200 ? ['leech'] : [])];
      for (let i = 0; i < Math.min(12, 2 + Math.floor(this.time / 100)); i++) {
        if (this.spawn(types[Math.floor(this.random() * types.length)]) && this.time > 240 && this.random() < Math.min(.2, this.time / 9000)) {
          const e = this.enemies.at(-1); e.elite = true; e.hp *= 2.5; e.maxHp = e.hp; e.speed *= 1.2;
        }
      }
    }
    const duration = this.director.duration;
    if (this.time >= (this.bossCount + 1) * 120 && (!duration || (this.bossCount + 1) * 120 < duration - 60) && this.spawn('boss')) this.bossCount++;
    if (duration && this.time >= duration - 60 && !this.lastBoss && this.spawn('boss')) this.lastBoss = true;
    this.director.tick(dt, alive);
    if (alive.every(p => p.dead)) { this.status = 'gameover'; return; }

    for (const e of this.enemies) {
      if (e.hp <= 0) continue;
      const target = nearest(alive, e);
      if (!target) continue;
      const d = Math.max(1, distance(e, target));
      e.slow = Math.max(0, e.slow - dt); e.flash = Math.max(0, e.flash - dt); e.attack -= dt;
      let speed = e.speed * (e.slow > 0 ? 0.45 : 1);
      if (e.type === 'spitter' && d < 320) speed *= d < 220 ? -0.45 : 0;
      if (e.type === 'leech' && e.attack <= 0) {
        for (const other of this.enemies) if (other.hp > 0 && distanceSq(e, other) < 180 ** 2) other.hp = Math.min(other.maxHp, other.hp + other.maxHp * .06);
        this.effect('pulse', e.x, e.y, 180, '#69d8c3'); e.attack = 4;
      }
      if (e.type === 'charger') {
        if (e.attack <= 0) { e.charge = 1; e.attack = 5; e.vx = (target.x - e.x) / d; e.vy = (target.y - e.y) / d; }
        e.charge = Math.max(0, e.charge - dt);
        if (e.charge > 0.5) speed = 0;
        else if (e.charge > 0) { this.move(e, e.vx * 420 * dt, e.vy * 420 * dt, e.radius); speed = 0; }
      }
      this.move(e, (target.x - e.x) / d * speed * dt, (target.y - e.y) / d * speed * dt, e.radius);
      if ((e.type === 'spitter' || e.type === 'boss') && e.attack <= 0) {
        const n = e.type === 'boss' ? 12 : 1;
        const angle = Math.atan2(target.y - e.y, target.x - e.x);
        for (let i = 0; i < n; i++) {
          const a = angle + i * TAU / n;
          this.bullets.push({ id: this.nextId++, x: e.x, y: e.y, vx: Math.cos(a) * 190, vy: Math.sin(a) * 190, owner: null, type: 'enemy', damage: e.damage, radius: 7, ttl: 4 });
        }
        e.attack = e.type === 'boss' ? 2.5 : 3;
      }
      for (const p of alive) if (distance(e, p) < e.radius + 15) this.damagePlayer(p, e.damage);
    }
    // Local separation keeps the horde readable without quadratic crowd checks.
    const cells = new Map();
    for (const e of this.enemies) {
      if (e.hp <= 0) continue;
      const cx = Math.floor(e.x / 90), cy = Math.floor(e.y / 90);
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
        for (const other of cells.get(cx + dx + (cy + dy) * 65536) || []) {
          const dd = distanceSq(e, other);
          if (dd >= ((e.radius + other.radius) * .85) ** 2) continue;
          const dist = Math.sqrt(dd);
          const gap = (e.radius + other.radius) * 0.85 - dist;
          if (gap <= 0) continue;
          const push = Math.min(2, gap * 0.22);
          const vx = dist > 0.01 ? (e.x - other.x) / dist : 1;
          const vy = dist > 0.01 ? (e.y - other.y) / dist : 0;
          e.x += vx * push; e.y += vy * push;
          other.x -= vx * push; other.y -= vy * push;
        }
      }
      const key = cx + cy * 65536;
      if (!cells.has(key)) cells.set(key, []);
      cells.get(key).push(e);
    }
    this.grid.rebuild(this.enemies); this.bulletPhase = true;
    this.enemyById.clear();
    for (const e of this.enemies) this.enemyById.set(e.id, e);
    for (const b of this.bullets) {
      b.ttl -= dt;
      if (b.type === 'rocket') {
        const target = this.enemyById.get(b.target);
        if (target) { const a = Math.atan2(target.y - b.y, target.x - b.x); b.vx = Math.cos(a) * 340 * (b.velocity || 1); b.vy = Math.sin(a) * 340 * (b.velocity || 1); }
      }
      b.x += b.vx * dt; b.y += b.vy * dt;
      if (this.obstacles.some(ob => distanceSq(ob, b) < (ob.r + b.radius) ** 2)) b.ttl = 0;
      if (b.ttl <= 0) continue;
      if (b.type === 'enemy') {
        for (const p of alive) if (distance(p, b) < 15 + b.radius) { this.damagePlayer(p, b.damage); b.ttl = 0; break; }
      } else {
        const owner = this.players.get(b.owner);
        for (const e of this.grid.query(b.x, b.y, b.radius + 60, this.candidates)) {
          if (e.hp <= 0 || distanceSq(e, b) > (e.radius + b.radius) ** 2) continue;
          if (b.type === 'rocket' || b.type === 'mine') {
            const radius = Math.min(900, 80 + b.level * 12) * (b.area || 1);
            for (const other of this.enemies) if (distance(other, b) < radius + other.radius) this.hurt(other, b.damage, owner, 10);
            this.effect('blast', b.x, b.y, radius, '#f59175');
          } else { this.hurt(e, b.damage, owner, 4); if (b.type === 'frost') e.slow = 2.5; }
          b.ttl = 0;
          break;
        }
      }
    }
    this.bulletPhase = false;
    this.enemies = this.enemies.filter(e => e.hp > 0);
    this.bullets = this.bullets.filter(b => b.ttl > 0).slice(-700);
    for (const gem of this.gems) {
      const collector = nearest(alive, gem);
      if (!collector) continue;
      const d = distance(collector, gem);
      if (d < collector.magnet + 35) {
        const step = Math.min(d, (200 + (collector.magnet + 35 - d) * 4) * dt);
        gem.x += (collector.x - gem.x) / Math.max(1, d) * step; gem.y += (collector.y - gem.y) / Math.max(1, d) * step;
      }
      if (d < 23) {
        gem.collected = true;
        this.giveXp(gem.value);
        if (gem.kind === 'heal' || gem.kind === 'chest') for (const p of alive) p.hp = Math.min(p.maxHp, p.hp + (gem.kind === 'chest' ? 35 : 18));
      }
    }
    this.gems = this.gems.filter(g => !g.collected);
    this.effects = this.effects.filter(e => (e.ttl -= dt) > 0).slice(-100);
    if (this.director.duration && this.time >= this.director.duration && this.lastBoss && !this.enemies.some(e => e.type === 'boss')) this.status = 'victory';
  }

  snapshot() {
    const round = n => Math.round(n * 10) / 10;
    return { ...this.director.snapshot(), mapId: this.mapId, time: Math.round(this.time * 1000) / 1000, status: this.status, kills: this.kills,
      players: [...this.players.values()].map(({ input, cooldowns, hitTimers, dashTime, damage, armor, regen, speed, magnet, ...p }) => ({ ...p, x: round(p.x), y: round(p.y), hp: round(p.hp), dash: round(p.dash), shield: round(p.shield), revive: round(p.revive) })),
      enemies: this.enemies.map(e => ({ id: e.id, type: e.type, x: round(e.x), y: round(e.y), hp: round(e.hp), maxHp: e.maxHp, radius: e.radius, elite: !!e.elite, flash: e.flash > 0, slow: e.slow > 0, charge: e.charge, vx: e.vx, vy: e.vy })),
      bullets: this.bullets.map(b => ({ id: b.id, x: round(b.x), y: round(b.y), vx: round(b.vx), vy: round(b.vy), type: b.type, radius: b.radius })),
      gems: this.gems.map(({ id, x, y, value, kind }) => ({ id, x: round(x), y: round(y), value, kind })), effects: this.effects.map(e => ({ ...e })) };
  }
}
