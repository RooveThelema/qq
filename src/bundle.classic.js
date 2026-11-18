/* Автоматически сгенерированный автономный бандл: HTTP(S) и file:// */
(function() {
  if (window.__BLINOV_BOOTED__) return;
  const __modules = Object.create(null);
  const __cache = Object.create(null);
  function __require(id) {
    if (__cache[id]) return __cache[id].exports;
    const mod = { exports: {} };
    __cache[id] = mod;
    if (!__modules[id]) throw new Error('Classic bundle missing module: ' + id);
    __modules[id](mod.exports, __require);
    return mod.exports;
  }

  __modules['src/game/catalog.js'] = function(__exports, __require) {
const MAX_PLAYERS = 10;

const RUN_MODES = {
  classic: { name: 'Вылазка', duration: 600, description: '10 минут · быстрый бой со Стражем' },
  expedition: { name: 'Экспедиция', duration: 1200, description: '20 минут · задания, элиты и финальная осада' },
  endless: { name: 'Бесконечная ночь', duration: 0, description: 'Без лимита · растущая сложность и рекорд' },
};
const INTERACTABLES = {
  cache: { name: 'Тайник', icon: '▣', color: '#efbf70', action: 'Открыть · опыт и улучшение' },
  medic: { name: 'Медстанция', icon: '+', color: '#8dd3bc', action: 'Восстановить здоровье отряда' },
  turret: { name: 'Турель', icon: '⌁', color: '#8fd8ef', action: 'Активировать на 25 секунд' },
  shrine: { name: 'Обелиск риска', icon: '◇', color: '#c3b3ff', action: 'Вызвать элиту · награда за победу' },
};
const EVOLUTIONS = {
  gun: { passive: 'damage', name: 'Штормовой калибр' }, orbit: { passive: 'armor', name: 'Стальной рой' },
  pulse: { passive: 'regen', name: 'Сердце бури' }, lightning: { passive: 'haste', name: 'Грозовая сеть' },
  rocket: { passive: 'vitality', name: 'Армагеддон' }, frost: { passive: 'magnet', name: 'Вечная мерзлота' },
  beam: { passive: 'damage', name: 'Солнечное копьё' }, mine: { passive: 'armor', name: 'Минный бастион' },
};
const MAPS = {
  outpost: { id: 'outpost', name: 'Рубеж-09', tag: 'ЗАБРОШЕННЫЙ КОМПЛЕКС', description: 'Открытый плац, укрытия и широкие проходы.', color: '#83c9b2', ground: '#142321', grid: '#243a34', obstacle: '#344e43', width: 2800, height: 2200, seed: 91 },
  forest: { id: 'forest', name: 'Тихая чаща', tag: 'ЗАРАЖЁННЫЙ ЛЕС', description: 'Кольцевые тропы между островками леса.', color: '#b1cf77', ground: '#18251b', grid: '#293b26', obstacle: '#3e5835', width: 3000, height: 2400, seed: 304 },
  desert: { id: 'desert', name: 'Мёртвый сигнал', tag: 'ПУСТОШЬ', description: 'Большой простор и обломки старой станции.', color: '#e6b97e', ground: '#302920', grid: '#494032', obstacle: '#6c5943', width: 3200, height: 2400, seed: 77 },
};

const HEROES = {
  ranger: { name: 'Следопыт', mark: '01', description: 'Точная стрельба · урон +20%', color: '#8dd3bc', weapon: 'gun', hp: 110, damage: 1.2, speed: 230 },
  engineer: { name: 'Инженер', mark: '02', description: 'Орбитальные дроны · броня +2', color: '#efbf70', weapon: 'orbit', hp: 120, damage: 1, speed: 215 },
  medic: { name: 'Проводник', mark: '03', description: 'Энергокольцо · восстановление HP', color: '#a5b7f2', weapon: 'pulse', hp: 100, damage: 1, speed: 235 },
  scout: { name: 'Искра', mark: '04', description: 'Криоген · быстрый сбор опыта', color: '#8fd8ef', weapon: 'frost', hp: 90, damage: 1, speed: 260 },
  sentinel: { name: 'Часовой', mark: '05', description: 'Лазер · высокий запас здоровья', color: '#ef9aa5', weapon: 'beam', hp: 145, damage: 1.05, speed: 205 },
};

const WEAPONS = {
  beam: { name: 'Лучевой излучатель', icon: '╱', description: 'Пробивает всех врагов на линии огня', color: '#ef9aa5' },
  mine: { name: 'Минный заградитель', icon: '✺', description: 'Оставляет мины на пути преследователей', color: '#e6b97e' },
  gun: { name: 'Импульсная винтовка', icon: '⌁', description: 'Автоогонь в ближайшую цель', color: '#ffce81' },
  orbit: { name: 'Орбитальные дроны', icon: '◎', description: 'Дроны вращаются и режут орду', color: '#8dd3bc' },
  pulse: { name: 'Энергокольцо', icon: '◉', description: 'Периодическая волна вокруг героя', color: '#a5b7f2' },
  lightning: { name: 'Цепная молния', icon: 'ϟ', description: 'Разряд перескакивает между врагами', color: '#c3b3ff' },
  rocket: { name: 'Ракетная установка', icon: '↗', description: 'Самонаводящиеся ракеты со взрывом', color: '#f59175' },
  frost: { name: 'Криоген', icon: '❄', description: 'Ледяной залп замедляет врагов', color: '#8fd8ef' },
};

const UPGRADES = [
  ...Object.entries(WEAPONS).map(([id, w]) => ({ id, name: w.name, icon: w.icon, description: w.description, max: Infinity, type: 'weapon', color: w.color })),
  { id: 'precision', name: 'Меткий глаз', icon: '⌖', description: 'Шанс крита: 7% / 14% / 19%…; растёт с каждым уровнем', max: Infinity, type: 'passive', color: '#efbf70' },
  { id: 'ferocity', name: 'Жестокость', icon: '✧', description: '+25% урона при критическом попадании', max: Infinity, type: 'passive', color: '#ef9aa5' },
  { id: 'vampire', name: 'Вампиризм', icon: '♥', description: 'Каждое убийство восстанавливает ещё 0,4 HP', max: Infinity, type: 'passive', color: '#ef9aa5' },
  { id: 'thorns', name: 'Шипы', icon: '✺', description: '+6 ответного урона врагам в радиусе 120 при ранении', max: Infinity, type: 'passive', color: '#e6b97e' },
  { id: 'dodge', name: 'Уклонение', icon: '◌', description: 'Шанс избежать урона: 6% / 11% / 15%…; растёт с каждым уровнем', max: Infinity, type: 'passive', color: '#8dd3bc' },
  { id: 'dash', name: 'Второе дыхание', icon: '↯', description: '+15% к скорости перезарядки рывка', max: Infinity, type: 'passive', color: '#8fd8ef' },
  { id: 'area', name: 'Резонанс', icon: '◯', description: '+10% к площади волн, взрывов и ширине лазера', max: Infinity, type: 'passive', color: '#c3b3ff' },
  { id: 'velocity', name: 'Баллистика', icon: '➶', description: '+12% к скорости и дальности снарядов', max: Infinity, type: 'passive', color: '#8fd8ef' },
  { id: 'execution', name: 'Добивание', icon: '†', description: '+15% урона врагам с менее чем 35% здоровья', max: Infinity, type: 'passive', color: '#ef9aa5' },
  { id: 'rescue', name: 'Полевой спасатель', icon: '✚', description: '+25% к скорости подъёма раненого союзника', max: Infinity, type: 'passive', color: '#8dd3bc' },
  { id: 'damage', name: 'Усилитель', icon: '✦', description: '+18% к урону всего оружия', max: Infinity, type: 'passive', color: '#efbf70' },
  { id: 'haste', name: 'Разгон', icon: '»', description: '+12% к скорости всех атак', max: Infinity, type: 'passive', color: '#efbf70' },
  { id: 'speed', name: 'Лёгкий шаг', icon: '↟', description: '+10% к скорости передвижения', max: Infinity, type: 'passive', color: '#8dd3bc' },
  { id: 'vitality', name: 'Жизненная сила', icon: '+', description: '+25 максимального HP и лечение 40 HP', max: Infinity, type: 'passive', color: '#8dd3bc' },
  { id: 'magnet', name: 'Магнит', icon: '⊕', description: '+50 к радиусу сбора опыта', max: Infinity, type: 'passive', color: '#a5b7f2' },
  { id: 'armor', name: 'Бронепластины', icon: '⬡', description: 'Входящий урон уменьшается на 2', max: Infinity, type: 'passive', color: '#a5b7f2' },
  { id: 'regen', name: 'Регенерация', icon: '♡', description: 'Восстановление 0,6 HP в секунду', max: Infinity, type: 'passive', color: '#8dd3bc' },
];

const ENEMIES = {
  splitter: { name: 'Носитель', hp: 110, speed: 54, radius: 20, damage: 16, xp: 7, color: '#d8a9d9' },
  leech: { name: 'Регенератор', hp: 95, speed: 65, radius: 17, damage: 14, xp: 8, color: '#69d8c3' },
  walker: { name: 'Заражённый', hp: 30, speed: 61, radius: 14, damage: 13, xp: 2, color: '#b2c46c' },
  runner: { name: 'Ловчий', hp: 23, speed: 125, radius: 11, damage: 10, xp: 3, color: '#e3b36f' },
  tank: { name: 'Громила', hp: 180, speed: 43, radius: 24, damage: 24, xp: 9, color: '#b997b6' },
  spitter: { name: 'Плевун', hp: 66, speed: 52, radius: 16, damage: 12, xp: 5, color: '#92cb9b' },
  charger: { name: 'Таран', hp: 85, speed: 72, radius: 18, damage: 20, xp: 6, color: '#de8372' },
  boss: { name: 'СТРАЖ РУБЕЖА', hp: 2200, speed: 48, radius: 47, damage: 28, xp: 65, color: '#ed977e' },
};

function seededRandom(seed) {
  let n = seed >>> 0;
  return () => { n = (Math.imul(n, 1664525) + 1013904223) >>> 0; return n / 4294967296; };
}

function makeObstacles(mapId) {
  const m = MAPS[mapId] || MAPS.outpost;
  const random = seededRandom(m.seed);
  const obstacles = [];
  // Spacious rings keep the spawn and four escape lanes clear.
  for (let i = 0; i < 27; i++) {
    const angle = i * 2.399963;
    const distance = 410 + random() * 700;
    const x = m.width / 2 + Math.cos(angle) * distance;
    const y = m.height / 2 + Math.sin(angle) * distance * 0.79;
    if (Math.abs(x - m.width / 2) < 110 || Math.abs(y - m.height / 2) < 100) continue;
    obstacles.push({ x, y, r: m.id === 'forest' ? 30 + random() * 26 : 26 + random() * 25, variant: i % 3 });
  }
  return obstacles;
}

function xpRequired(level) { return 25 + level * 12 + level * level * 2; }
function formatTime(seconds) { return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`; }

__exports.MAX_PLAYERS = MAX_PLAYERS; __exports.RUN_MODES = RUN_MODES; __exports.INTERACTABLES = INTERACTABLES; __exports.EVOLUTIONS = EVOLUTIONS; __exports.MAPS = MAPS; __exports.HEROES = HEROES; __exports.WEAPONS = WEAPONS; __exports.UPGRADES = UPGRADES; __exports.ENEMIES = ENEMIES; __exports.seededRandom = seededRandom; __exports.makeObstacles = makeObstacles; __exports.xpRequired = xpRequired; __exports.formatTime = formatTime;
  };

  __modules['src/game/SpatialGrid.js'] = function(__exports, __require) {
/** Reusable broad phase. Queries return candidates, callers do precise checks. */
class SpatialGrid {
  constructor(size = 96) { this.size = size; this.cells = new Map(); this.pool = []; }
  rebuild(entities) {
    for (const bucket of this.cells.values()) { bucket.length = 0; this.pool.push(bucket); }
    this.cells.clear();
    for (const e of entities) {
      if (e.hp <= 0) continue;
      const key = Math.floor(e.x / this.size) + Math.floor(e.y / this.size) * 65536;
      let bucket = this.cells.get(key);
      if (!bucket) { bucket = this.pool.pop() || []; this.cells.set(key, bucket); }
      bucket.push(e);
    }
  }
  insert(e) {
    const key = Math.floor(e.x / this.size) + Math.floor(e.y / this.size) * 65536;
    let bucket = this.cells.get(key);
    if (!bucket) { bucket = this.pool.pop() || []; this.cells.set(key, bucket); }
    bucket.push(e);
  }
  relocate(e, oldX, oldY) {
    const oldKey = Math.floor(oldX / this.size) + Math.floor(oldY / this.size) * 65536;
    const newKey = Math.floor(e.x / this.size) + Math.floor(e.y / this.size) * 65536;
    if (oldKey === newKey) return;
    const bucket = this.cells.get(oldKey), index = bucket?.indexOf(e) ?? -1;
    if (index >= 0) bucket.splice(index, 1);
    this.insert(e);
  }
  query(x, y, radius, result = []) {
    result.length = 0;
    const minX = Math.floor((x - radius) / this.size), maxX = Math.floor((x + radius) / this.size);
    const minY = Math.floor((y - radius) / this.size), maxY = Math.floor((y + radius) / this.size);
    for (let cy = minY; cy <= maxY; cy++) for (let cx = minX; cx <= maxX; cx++) {
      const bucket = this.cells.get(cx + cy * 65536);
      if (bucket) for (const e of bucket) result.push(e);
    }
    return result;
  }
}

__exports.SpatialGrid = SpatialGrid;
  };

  __modules['src/game/Director.js'] = function(__exports, __require) {
const { INTERACTABLES, RUN_MODES } = __require('src/game/catalog.js');
/** Bounded world events. All progress and rewards are server-authoritative. */
class Director {
  constructor(world, mode) {
    this.world = world; this.mode = RUN_MODES[mode] ? mode : 'classic';
    this.duration = RUN_MODES[this.mode].duration;
    this.completed = 0; this.nextEvent = 35; this.nextHazard = 75;
    this.event = null; this.hazards = []; this.notice = ''; this.noticeUntil = 0;
    this.objects = [];
    const kinds = ['cache', 'medic', 'turret', 'shrine', 'cache', 'turret', 'medic', 'shrine'];
    for (let i = 0; i < kinds.length; i++) {
      const angle = (i % 4) * Math.PI / 2;
      const r = i < 4 ? 215 : 650;
      const node = { id: world.nextId++, kind: kinds[i], x: world.map.width / 2 + Math.cos(angle) * r, y: world.map.height / 2 + Math.sin(angle) * r, cooldown: 0, active: 0, shots: 0, used: false };
      this.objects.push(node);
    }
  }
  tell(message) { this.notice = message; this.noticeUntil = this.world.time + 7; }
  reward() {
    const w = this.world;
    this.completed++;
    w.giveXp(20 + this.completed * 8);
    for (const p of w.players.values()) { p.pending++; w.offer(p); p.hp = Math.min(p.maxHp, p.hp + 25); }
    this.tell('Задание выполнено! Отряд получил опыт, лечение и улучшение.');
    this.event = null; this.nextEvent = w.time + 55;
  }
  interact(id) {
    const w = this.world, p = w.players.get(id);
    if (w.status !== 'playing' || !p || p.dead || !p.connected) return false;
    let node, best = 100;
    for (const item of this.objects) {
      const d = Math.hypot(item.x - p.x, item.y - p.y);
      if (!item.used && item.cooldown <= 0 && d < best) { best = d; node = item; }
    }
    if (!node) return false;
    if (node.kind === 'cache') {
      node.used = true;
      w.giveXp(18 + Math.floor(w.time / 30));
      for (const member of w.players.values()) { member.pending++; w.offer(member); }
      this.tell('Тайник открыт: каждый боец получает улучшение.');
      if (this.event?.kind === 'supply' && this.event.target === node.id) this.reward();
    } else if (node.kind === 'medic') {
      node.cooldown = 70;
      for (const member of w.players.values()) if (!member.dead) member.hp = Math.min(member.maxHp, member.hp + member.maxHp * .45);
      this.tell('Медстанция восстановила здоровье отряда.');
    } else if (node.kind === 'turret') {
      node.active = 25; node.cooldown = 65; node.owner = p.id;
      this.tell('Турель прикрывает отряд в течение 25 секунд.');
    } else if (node.kind === 'shrine') {
      if (!w.spawn('tank', node.x + 140, node.y)) return false;
      const e = w.enemies.at(-1); e.elite = true; e.reward = true; e.hp *= 4; e.maxHp = e.hp; e.speed *= 1.25;
      node.cooldown = 100;
      this.tell('Обелиск пробудил элиту! Победи её ради улучшения.');
    }
    w.effect('pulse', node.x, node.y, 90, INTERACTABLES[node.kind].color);
    return true;
  }
  tick(dt, alive) {
    const w = this.world;
    for (const node of this.objects) {
      node.cooldown = Math.max(0, node.cooldown - dt); node.active = Math.max(0, node.active - dt); node.shots -= dt;
      if (node.active > 0 && node.shots <= 0) {
        const owner = w.players.get(node.owner);
        let target, best = 480 * 480;
        for (const e of w.enemies) { const d = (e.x - node.x) ** 2 + (e.y - node.y) ** 2; if (e.hp > 0 && d < best) { target = e; best = d; } }
        if (target) { w.effect('lightning', node.x, node.y, 0, '#8fd8ef', { toX: target.x, toY: target.y }); w.hurt(target, 45 + w.time / 12, owner); }
        node.shots = .35;
      }
    }
    if (!this.event && w.time >= this.nextEvent) {
      const kinds = ['relay', 'hunt', 'supply'];
      const choices = kinds.filter(k => k !== this.previousKind);
      const kind = choices[Math.floor(w.random() * choices.length)]; this.previousKind = kind;
      const node = this.objects[Math.floor(w.random() * this.objects.length)];
      this.event = { kind, x: node.x, y: node.y, progress: 0, goal: kind === 'hunt' ? 35 + this.completed * 5 : kind === 'relay' ? 16 : 1, endsAt: w.time + 85, startKills: w.kills };
      if (kind === 'supply') { const cache = this.objects.filter(n => n.kind === 'cache')[Math.floor(w.random() * 2)]; cache.used = false; this.event.x = cache.x; this.event.y = cache.y; this.event.target = cache.id; }
      this.tell(kind === 'relay' ? 'Сигнал SOS: удерживайте зону ретранслятора. Вдвоём быстрее!' : kind === 'hunt' ? 'Прорыв орды: выполните заказ на уничтожение врагов.' : 'Разведка обнаружила припасы! Доберитесь до отмеченного тайника.');
    }
    if (this.event) {
      const e = this.event;
      if (e.kind === 'relay') e.progress += dt * Math.min(2, alive.filter(p => Math.hypot(p.x - e.x, p.y - e.y) < 145).length);
      if (e.kind === 'hunt') e.progress = w.kills - e.startKills;
      if (e.progress >= e.goal) this.reward();
      else if (w.time >= e.endsAt) { this.event = null; this.nextEvent = w.time + 30; this.tell('Сигнал потерян. Следующее задание скоро появится.'); }
    }
    if (w.time >= this.nextHazard) {
      this.nextHazard = w.time + 32 + w.random() * 18;
      const p = alive[Math.floor(w.random() * alive.length)];
      for (let i = 0; i < 3; i++) this.hazards.push({ id: w.nextId++, x: p.x + (w.random() - .5) * 480, y: p.y + (w.random() - .5) * 480, radius: 78, ttl: 2.7 });
    }
    for (const hazard of this.hazards) {
      hazard.ttl -= dt;
      if (hazard.ttl > 0) continue;
      w.effect('blast', hazard.x, hazard.y, hazard.radius, '#f59175');
      for (const p of alive) if (Math.hypot(p.x - hazard.x, p.y - hazard.y) < hazard.radius) w.damagePlayer(p, 24);
      for (const e of w.enemies) if (Math.hypot(e.x - hazard.x, e.y - hazard.y) < hazard.radius + e.radius) w.hurt(e, 160, null);
    }
    this.hazards = this.hazards.filter(h => h.ttl > 0);
  }
  snapshot() {
    return { runMode: this.mode, duration: this.duration, completed: this.completed,
      event: this.event ? { ...this.event, progress: Math.round(this.event.progress * 10) / 10 } : null,
      notice: this.world.time < this.noticeUntil ? this.notice : '',
      objects: this.objects.map(({ shots, owner, ...n }) => ({ ...n, cooldown: Math.ceil(n.cooldown), active: Math.ceil(n.active) })),
      hazards: this.hazards.map(h => ({ ...h, ttl: Math.round(h.ttl * 10) / 10 })) };
  }
}

__exports.Director = Director;
  };

  __modules['src/game/World.js'] = function(__exports, __require) {
const { MAPS, HEROES, ENEMIES, UPGRADES, makeObstacles, seededRandom, xpRequired, EVOLUTIONS } = __require('src/game/catalog.js');
const { SpatialGrid } = __require('src/game/SpatialGrid.js');
const { Director } = __require('src/game/Director.js');
const distanceSq = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
const nearest = (items, from, range = Infinity, skip) => { let best, d = range * range; for (const e of items) { if (e.hp <= 0 || skip?.has(e.id)) continue; const n = distanceSq(e, from); if (n < d) { d = n; best = e; } } return best; };

const TAU = Math.PI * 2;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

/** The exact same simulation runs on the server and in offline solo mode. */
class World {
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

__exports.World = World;
  };

  __modules['src/ui/MotionBuffer.js'] = function(__exports, __require) {
/** Interpolate server positions, with at most 100ms of extrapolation on packet gaps. */
class MotionBuffer {
  constructor() { this.clear(); }
  clear() { this.frames = []; this.interval = 1 / 15; this.lastAt = null; }
  push(state, now) {
    if (this.frames.length && state.time < this.frames.at(-1).time) this.clear();
    if (this.frames.at(-1)?.time === state.time) return;
    if (this.lastAt !== null) this.interval = this.interval * .8 + Math.min(.3, now - this.lastAt) * .2;
    this.lastAt = now;
    const positions = new Map();
    for (const [prefix, list] of [['p', state.players], ['e', state.enemies], ['b', state.bullets]]) for (const e of list) positions.set(prefix + e.id, e);
    this.frames.push({ time: state.time, at: now, positions });
    if (this.frames.length > 8) this.frames.shift();
  }
  sample(entity, prefix, now, immediate = false) {
    const frames = this.frames, last = frames.at(-1);
    if (!last || frames.length < 2) return entity;
    const delay = immediate ? 0 : Math.max(.067, Math.min(.2, this.interval * 1.15));
    const time = last.time + Math.min(.1, Math.max(0, now - last.at)) - delay;
    let a = frames[0], b = last;
    for (let i = 1; i < frames.length; i++) { a = frames[i - 1]; b = frames[i]; if (b.time >= time) break; }
    const key = prefix + entity.id, from = a.positions.get(key), to = b.positions.get(key);
    if (!from || !to || Math.hypot(to.x - from.x, to.y - from.y) > 220) return entity;
    const span = b.time - a.time;
    const ratio = Math.max(0, Math.min(1 + .1 / Math.max(.01, span), (time - a.time) / Math.max(.01, span)));
    return { x: from.x + (to.x - from.x) * ratio, y: from.y + (to.y - from.y) * ratio };
  }
}

__exports.MotionBuffer = MotionBuffer;
  };

  __modules['src/ui/Renderer.js'] = function(__exports, __require) {
const { MAPS, HEROES, ENEMIES, WEAPONS, seededRandom, makeObstacles, INTERACTABLES } = __require('src/game/catalog.js');
const { MotionBuffer } = __require('src/ui/MotionBuffer.js');
const TAU = Math.PI * 2;
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const mix = (a, b, t) => a + (b - a) * t;

function circle(ctx, x, y, r, fill, stroke, width = 1) {
  ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, TAU);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
}
function line(ctx, x, y, xx, yy, color, width = 1) {
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(xx, yy); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
}
function roundRect(ctx, x, y, w, h, radius, fill, stroke) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, radius);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
}

/** Canvas-only presentation. Authoritative game state is never changed here. */
class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.camera = { x: 1400, y: 1100, zoom: 1 };
    this.mapId = 'outpost';
    this.state = null;
    this.localPlayerId = '';
    this.drawPositions = new Map();
    this.motion = new MotionBuffer(); this.online = false; this.lowQuality = false;
    this.clock = 0;
    this.snapshotAt = 0;
    this.followedId = '';
    this.map = MAPS.outpost;
    this.prepareMap();
    this.resize();
    this.onResize = () => this.resize();
    window.addEventListener('resize', this.onResize);
  }

  resize() {
    this.width = Math.max(1, window.innerWidth);
    this.height = Math.max(1, window.innerHeight);
    this.dpr = Math.min(this.lowQuality ? 1 : 1.5, window.devicePixelRatio || 1);
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.vignettes = null;
  }

  setMap(mapId) {
    if (this.state || !MAPS[mapId] || this.mapId === mapId) return;
    this.mapId = mapId;
    this.map = MAPS[mapId];
    this.prepareMap();
  }

  prepareMap() {
    this.groundLayer = null;
    this.obstacles = makeObstacles(this.mapId);
    const random = seededRandom(this.map.seed + 840);
    this.marks = Array.from({ length: 530 }, () => ({ x: random() * this.map.width, y: random() * this.map.height, r: 1 + random() * 3, a: random() * TAU, v: random() }));
    this.demoGems = Array.from({ length: 16 }, (_, i) => ({ id: i, x: this.map.width / 2 + Math.cos(i * 2.4) * (95 + random() * 300), y: this.map.height / 2 + Math.sin(i * 2.4) * (95 + random() * 240), value: 2, kind: 'xp' }));
  }

  setState(state, localPlayerId) {
    if (!state) {
      if (this.state) this.drawPositions.clear();
      this.state = null; this.motion.clear();
      this.localPlayerId = '';
      this.followedId = '';
      return;
    }
    if (state.mapId !== this.mapId) { this.mapId = state.mapId; this.map = MAPS[state.mapId] || MAPS.outpost; this.prepareMap(); this.drawPositions.clear(); this.followedId = ''; }
    if (this.online) this.motion.push(state, this.clock);
    this.state = state;
    this.localPlayerId = localPlayerId;
    this.snapshotAt = this.clock;
  }

  position(entity, prefix, alpha) {
    if (this.online) return this.motion.sample(entity, prefix, this.clock, prefix === 'p' && entity.id === this.localPlayerId);
    const id = `${prefix}${entity.id}`;
    let p = this.drawPositions.get(id);
    if (!p || Math.hypot(entity.x - p.x, entity.y - p.y) > 220) { p = { x: entity.x, y: entity.y, seen: this.clock }; this.drawPositions.set(id, p); }
    else { p.x = mix(p.x, entity.x, alpha); p.y = mix(p.y, entity.y, alpha); p.seen = this.clock; }
    return p;
  }

  visible(x, y, r = 60) { return x + r > this.bounds.left && x - r < this.bounds.right && y + r > this.bounds.top && y - r < this.bounds.bottom; }

  render(dt = 1 / 60) {
    dt = clamp(dt || 0, 0, 0.1);
    this.clock += dt;
    const c = this.ctx;
    const w = this.width;
    const h = this.height;
    const menu = !this.state;
    let state = this.state;
    if (menu) state = this.attractState();
    const renderTime = state.time + (state.status === 'playing' ? Math.min(0.1, this.clock - this.snapshotAt) : 0);
    const local = state.players.find(p => p.id === this.localPlayerId) || state.players[0];
    const target = local ? { ...local, ...this.position(local, 'p', 1 - Math.exp(-dt * 24)) } : { x: this.map.width / 2, y: this.map.height / 2 };
    const zoom = menu ? clamp(Math.min(w / 1400, h / 850), 0.7, 1.1) : clamp(Math.min(w / 1250, h / 780), 0.72, 1.08);
    this.camera.zoom = mix(this.camera.zoom, zoom, 1 - Math.exp(-dt * 8));
    const z = this.camera.zoom;
    const wantedX = target.x + (menu ? w * 0.03 / z : 0);
    const wantedY = target.y + (menu ? -h * 0.14 / z : 0);
    if (this.followedId !== target.id) { this.camera.x = wantedX; this.camera.y = wantedY; this.followedId = target.id; }
    else { this.camera.x = mix(this.camera.x, wantedX, 1 - Math.exp(-dt * 9)); this.camera.y = mix(this.camera.y, wantedY, 1 - Math.exp(-dt * 9)); }
    this.bounds = { left: this.camera.x - w / (2 * z), right: this.camera.x + w / (2 * z), top: this.camera.y - h / (2 * z), bottom: this.camera.y + h / (2 * z) };
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    c.fillStyle = '#0c1514'; c.fillRect(0, 0, w, h);
    c.save(); c.translate(w / 2, h / 2); c.scale(z, z); c.translate(-this.camera.x, -this.camera.y);
    this.drawGround(c, renderTime);
    const alpha = menu ? 1 : 1 - Math.exp(-dt * 24);
    for (const gem of state.gems) if (this.visible(gem.x, gem.y, 25)) this.drawGem(c, gem, renderTime);
    this.drawActivities(c, state, renderTime);
    // Objects are sorted by their feet for a small amount of top-down depth.
    const entities = [
      ...this.obstacles.map(ob => ({ type: 'obstacle', entity: ob, x: ob.x, y: ob.y })),
      ...state.enemies.map(e => { const p = this.position(e, 'e', alpha); return { type: 'enemy', entity: e, x: p.x, y: p.y }; }),
      ...state.players.map(p => { const pos = this.position(p, 'p', alpha); return { type: 'player', entity: p, x: pos.x, y: pos.y }; }),
    ].filter(item => this.visible(item.x, item.y, 150)).sort((a, b) => a.y - b.y);
    for (const item of entities) {
      if (!this.visible(item.x, item.y, 150)) continue;
      if (item.type === 'obstacle') this.drawObstacle(c, item.entity);
      else if (item.type === 'enemy') this.drawEnemy(c, item.entity, item.x, item.y, renderTime, state.players);
      else this.drawPlayer(c, item.entity, item.x, item.y, renderTime, item.entity.id === this.localPlayerId || menu);
    }
    for (const b of state.bullets) {
      const p = this.position(b, 'b', alpha);
      if (this.visible(p.x, p.y, 35)) this.drawBullet(c, b, p.x, p.y, renderTime);
    }
    for (const fx of state.effects) this.drawEffect(c, fx, renderTime);
    this.drawBoundary(c, renderTime);
    c.restore();
    if (!this.vignettes) this.vignettes = [false, true].map(isMenu => {
      const gradient = c.createRadialGradient(w * .5, h * .5, Math.min(w, h) * .12, w * .5, h * .5, Math.max(w, h) * .69);
      gradient.addColorStop(0, '#020a0900'); gradient.addColorStop(1, isMenu ? '#020908dc' : '#02090882'); return gradient;
    });
    c.fillStyle = this.vignettes[+menu]; c.fillRect(0, 0, w, h);
    if (menu) {
      const shade = c.createLinearGradient(0, 0, w, 0);
      shade.addColorStop(0, '#07100fd9'); shade.addColorStop(0.42, '#07100f44'); shade.addColorStop(1, '#07100f99');
      c.fillStyle = shade; c.fillRect(0, 0, w, h);
    } else {
      this.drawTeammateArrows(c, state, local);
      this.drawObjectiveArrow(c, state, local);
      if (w > 650 && state.status !== 'lobby') this.drawMinimap(c, state);
      if (local && !local.dead && local.hp / local.maxHp < 0.28) {
        c.strokeStyle = `rgba(222,93,70,${0.2 + Math.sin(this.clock * 4) * 0.08})`; c.lineWidth = 9; c.strokeRect(0, 0, w, h);
      }
    }
    if (Math.floor(this.clock * 2) !== Math.floor((this.clock - dt) * 2)) for (const [id, p] of this.drawPositions) if (this.clock - p.seen > 2) this.drawPositions.delete(id);
  }

  attractState() {
    const t = this.clock;
    const cx = this.map.width / 2;
    const cy = this.map.height / 2;
    const p = { id: 'demo', name: '', hero: 'ranger', color: '#8dd3bc', x: cx + Math.sin(t * 0.35) * 12, y: cy + Math.cos(t * 0.3) * 10, angle: -t * 0.2, hp: 110, maxHp: 110, weapons: { gun: 2, orbit: 2 }, connected: true, shield: 0 };
    const enemies = Array.from({ length: 14 }, (_, i) => {
      const angle = i * 2.4 + t * (i % 2 ? 0.035 : -0.025);
      const r = 210 + i % 4 * 85 + Math.sin(t * 0.4 + i) * 15;
      const type = ['walker', 'runner', 'walker', 'spitter', 'tank', 'charger'][i % 6];
      return { id: i, type, x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r * 0.7, hp: ENEMIES[type].hp, maxHp: ENEMIES[type].hp, radius: ENEMIES[type].radius };
    });
    const bullets = Array.from({ length: 3 }, (_, i) => { const a = p.angle; const r = ((t * 220 + i * 120) % 400) + 24; return { id: i, x: p.x + Math.cos(a) * r, y: p.y + Math.sin(a) * r, vx: Math.cos(a) * 650, vy: Math.sin(a) * 650, type: 'gun' }; });
    return { time: t, status: 'attract', players: [p], enemies, bullets, gems: this.demoGems, effects: [] };
  }

  drawGround(c, time) {
    if (!this.groundLayer) {
      const layer = document.createElement('canvas'); layer.width = this.map.width; layer.height = this.map.height;
      const bounds = this.bounds;
      this.bounds = { left: 0, top: 0, right: this.map.width, bottom: this.map.height };
      this.paintGround(layer.getContext('2d', { alpha: false }), 0);
      this.bounds = bounds; this.groundLayer = layer;
    }
    c.drawImage(this.groundLayer, 0, 0);
  }

  drawActivities(c, state, time) {
    for (const n of state.objects || []) {
      if (!this.visible(n.x, n.y, 100)) continue;
      const config = INTERACTABLES[n.kind], color = n.used || n.cooldown > 0 && !n.active ? '#61716a' : config.color;
      circle(c, n.x, n.y, 29, '#0a171be6', color, 2);
      if (n.active) circle(c, n.x, n.y, 36 + Math.sin(time * 4) * 3, null, color);
      c.textAlign = 'center'; c.font = 'bold 24px system-ui'; c.fillStyle = color; c.fillText(config.icon, n.x, n.y + 8);
      c.font = '10px system-ui'; c.fillText(n.used ? 'ПУСТО' : n.cooldown > 0 ? `${config.name} · ${n.active || n.cooldown}с` : config.name, n.x, n.y - 41);
    }
    const event = state.event;
    if (event && event.kind !== 'hunt') {
      circle(c, event.x, event.y, event.kind === 'relay' ? 145 : 65, '#efbf7010', '#efbf7088', 2);
      c.font = 'bold 12px system-ui'; c.textAlign = 'center'; c.fillStyle = '#efbf70'; c.fillText(event.kind === 'relay' ? 'УДЕРЖИВАЙТЕ ЗОНУ' : 'ПРИПАСЫ · E', event.x, event.y - 76);
    }
    for (const h of state.hazards || []) {
      circle(c, h.x, h.y, h.radius, '#f5917520', '#f59175', 2);
      circle(c, h.x, h.y, h.radius * Math.max(0, 1 - h.ttl / 2.7), '#f5917538');
      c.textAlign = 'center'; c.font = 'bold 24px system-ui'; c.fillStyle = '#f59175'; c.fillText('!', h.x, h.y + 8);
    }
  }

  paintGround(c, time) {
    const m = this.map;
    const cx = m.width / 2;
    const cy = m.height / 2;
    c.fillStyle = m.ground; c.fillRect(0, 0, m.width, m.height);
    const terrain = c.createRadialGradient(cx, cy, 80, cx, cy, 1700);
    terrain.addColorStop(0, m.id === 'desert' ? '#493a2866' : '#36564755'); terrain.addColorStop(1, '#08100c55');
    c.fillStyle = terrain; c.fillRect(0, 0, m.width, m.height);
    // The arena's route layout mirrors the collision-free central cross and rings.
    c.lineWidth = m.id === 'forest' ? 105 : 132;
    c.strokeStyle = m.id === 'forest' ? '#35432a42' : m.id === 'desert' ? '#66503928' : '#45564920';
    c.beginPath(); c.ellipse(cx, cy, 610, 490, 0, 0, TAU); c.stroke();
    c.lineWidth = 150;
    c.beginPath(); c.moveTo(cx, 0); c.lineTo(cx, m.height); c.moveTo(0, cy); c.lineTo(m.width, cy); c.stroke();
    if (m.id === 'outpost') {
      const startX = Math.max(0, Math.floor(this.bounds.left / 80) * 80);
      const startY = Math.max(0, Math.floor(this.bounds.top / 80) * 80);
      c.beginPath(); c.strokeStyle = '#6e8c7020'; c.lineWidth = 1;
      for (let x = startX; x < Math.min(m.width, this.bounds.right); x += 80) { c.moveTo(x, Math.max(0, this.bounds.top)); c.lineTo(x, Math.min(m.height, this.bounds.bottom)); }
      for (let y = startY; y < Math.min(m.height, this.bounds.bottom); y += 80) { c.moveTo(Math.max(0, this.bounds.left), y); c.lineTo(Math.min(m.width, this.bounds.right), y); }
      c.stroke();
      for (let i = -7; i <= 7; i++) { c.fillStyle = '#b8ca8b2d'; c.fillRect(cx - 4, cy + i * 120, 8, 32); c.fillRect(cx + i * 120, cy - 4, 32, 8); }
      c.strokeStyle = '#8fa56c2b'; c.lineWidth = 2; c.setLineDash([16, 18]); c.strokeRect(cx - 310, cy - 260, 620, 520); c.setLineDash([]);
    }
    for (const p of this.marks) {
      if (!this.visible(p.x, p.y, 20)) continue;
      c.save(); c.translate(p.x, p.y); c.rotate(p.a);
      if (m.id === 'forest') {
        c.strokeStyle = p.v > 0.5 ? '#8c9c5730' : '#121c163f'; c.lineWidth = 1.5;
        c.beginPath(); c.moveTo(-5, 2); c.lineTo(-3, -5); c.moveTo(0, 4); c.lineTo(1, -7); c.moveTo(5, 1); c.lineTo(4, -4); c.stroke();
      } else if (m.id === 'desert') {
        c.strokeStyle = '#bba17515'; c.lineWidth = 1; c.beginPath(); c.ellipse(0, 0, p.r * 6, p.r, 0, 0, Math.PI); c.stroke();
      } else { c.fillStyle = p.v > 0.7 ? '#8caa6b22' : '#080f0e44'; c.fillRect(0, 0, p.r * 2, 1.4); }
      c.restore();
    }
    // Faded extraction/deployment pad anchors the arena spatially.
    circle(c, cx, cy, 126, '#0c181733', '#82b79a24', 3);
    circle(c, cx, cy, 111, null, '#82b79a18', 1);
    c.save(); c.translate(cx, cy); c.strokeStyle = '#b0d4ad27'; c.lineWidth = 2;
    for (let i = 0; i < 4; i++) { c.rotate(Math.PI / 2); c.beginPath(); c.moveTo(89, -20); c.lineTo(106, -20); c.lineTo(106, 20); c.lineTo(89, 20); c.stroke(); }
    c.font = '600 32px ui-monospace, monospace'; c.fillStyle = '#a6c3a822'; c.textAlign = 'center'; c.fillText(m.id === 'outpost' ? '09' : m.id === 'forest' ? '03' : '07', 0, 11);
    c.font = '8px ui-monospace, monospace'; c.fillText('ПОСЛЕДНИЙ РУБЕЖ', 0, 61); c.restore();
    // Small signal lamps keep the open routes readable.
    for (let i = 0; i < 4; i++) { const a = i * TAU / 4; const x = cx + Math.cos(a) * 300; const y = cy + Math.sin(a) * 300; if (this.visible(x, y)) { circle(c, x, y, 8, '#0a1513', '#526659'); circle(c, x, y, 2.5, i === Math.floor(time / 2) % 4 ? '#dfb270' : '#83c9b2'); } }
  }

  drawObstacle(c, ob) {
    const r = ob.r;
    c.save(); c.translate(ob.x, ob.y);
    c.fillStyle = '#050b0966'; c.beginPath(); c.ellipse(8, 11, r * 1.15, r * 0.75, 0, 0, TAU); c.fill();
    if (this.mapId === 'forest') {
      const color = ['#2f4930', '#3a5030', '#304731'][ob.variant];
      c.fillStyle = '#4c4230'; c.fillRect(-6, -2, 12, 25);
      for (let i = 0; i < 3; i++) { const rr = r * (1 - i * 0.19); c.fillStyle = i === 2 ? '#547044' : color; c.beginPath(); c.moveTo(0, -rr - i * 9); c.lineTo(rr, rr * 0.5 - i * 9); c.lineTo(rr * 0.35, rr * 0.46 - i * 9); c.lineTo(0, rr * 0.7 - i * 9); c.lineTo(-rr * 0.4, rr * 0.45 - i * 9); c.lineTo(-rr, rr * 0.5 - i * 9); c.closePath(); c.fill(); }
      line(c, -r * 0.62, -8, -4, -r * 0.8, '#71875442', 2);
    } else if (this.mapId === 'desert') {
      c.beginPath(); c.moveTo(-r, -r * 0.25); c.lineTo(-r * 0.45, -r * 0.83); c.lineTo(r * 0.45, -r * 0.7); c.lineTo(r, -r * 0.1); c.lineTo(r * 0.7, r * 0.64); c.lineTo(-r * 0.5, r * 0.7); c.closePath(); c.fillStyle = '#6c5a44'; c.fill(); c.strokeStyle = '#9d84613b'; c.stroke();
      c.beginPath(); c.moveTo(-r, -r * 0.25); c.lineTo(-r * 0.15, -r * 0.14); c.lineTo(r * 0.45, -r * 0.7); c.lineTo(-r * 0.45, -r * 0.83); c.closePath(); c.fillStyle = '#827052'; c.fill();
      line(c, -r * 0.15, -r * 0.14, r * 0.7, r * 0.64, '#423a30', 2);
      if (ob.variant === 1) { c.fillStyle = '#b0a483'; c.fillRect(-15, -3, 27, 3); c.fillStyle = '#6e8c7d'; c.fillRect(-6, -8, 12, 14); }
    } else {
      const color = ['#405648', '#435346', '#4c5744'][ob.variant];
      roundRect(c, -r, -r * 0.68 + 8, r * 2, r * 1.36, 3, '#26372e', '#172b22');
      roundRect(c, -r, -r * 0.68, r * 2, r * 1.36, 3, color, '#72836a66');
      c.strokeStyle = '#243a2d'; c.lineWidth = 5; c.strokeRect(-r + 8, -r * 0.68 + 7, r * 2 - 16, r * 1.36 - 14);
      line(c, -r + 10, -r * 0.68 + 10, r - 10, r * 0.68 - 10, '#67745b70', 2);
      line(c, r - 10, -r * 0.68 + 10, -r + 10, r * 0.68 - 10, '#67745b70', 2);
      c.fillStyle = '#b9b17c'; c.fillRect(-r + 3, -r * 0.68 + 3, 6, 3); c.fillRect(r - 9, r * 0.68 - 6, 6, 3);
      c.font = '7px ui-monospace, monospace'; c.textAlign = 'center'; c.fillStyle = '#c1ce9c91'; c.fillText('R / 09', 0, 2);
    }
    c.restore();
  }

  drawGem(c, g, t) {
    const chest = g.kind === 'chest';
    const heal = g.kind === 'heal';
    const color = chest ? '#efbd70' : heal ? '#e89d8e' : g.value > 5 ? '#b8a4ef' : '#8dd3bc';
    const r = chest ? 10 : heal ? 7 : g.value > 5 ? 5.5 : 4;
    const pulse = 1 + Math.sin(t * 3 + g.id) * 0.1;
    c.save(); c.translate(g.x, g.y);
    circle(c, 0, 0, r * 2.3 * pulse, `${color}12`);
    if (chest) { roundRect(c, -9, -6, 18, 13, 2, '#79613b', color); c.fillStyle = color; c.fillRect(-2, -2, 4, 5); line(c, -8, -1, 8, -1, color); }
    else if (heal) { c.fillStyle = color; c.fillRect(-2, -6, 4, 12); c.fillRect(-6, -2, 12, 4); }
    else { c.rotate(Math.PI / 4); c.fillStyle = color; c.fillRect(-r / 1.4, -r / 1.4, r * 1.4, r * 1.4); c.fillStyle = '#e5fff066'; c.fillRect(-r / 1.4, -r / 1.4, r * 1.4, r / 2); }
    c.restore();
  }

  drawPlayer(c, p, x, y, t, local) {
    c.save(); c.translate(x, y);
    const color = p.color || HEROES[p.hero]?.color || '#8dd3bc';
    if (p.dead) {
      circle(c, 0, 0, 24, '#1c2523cc', `${color}88`, 2);
      line(c, -6, -6, 6, 6, color, 3); line(c, 6, -6, -6, 6, color, 3);
      c.strokeStyle = color; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, 31, -Math.PI / 2, -Math.PI / 2 + TAU * clamp((p.revive || 0) / 3, 0, 1)); c.stroke();
      c.font = '9px system-ui, sans-serif'; c.textAlign = 'center'; c.fillStyle = '#f1d9c5'; c.fillText(p.connected ? 'ПОМОГИ МНЕ' : 'НЕТ СВЯЗИ', 0, -39);
      c.restore(); return;
    }
    if (local) { circle(c, 0, 3, 24, '#8dd3bc0a', '#8dd3bc38'); c.strokeStyle = '#8dd3bc70'; c.lineWidth = 2; for (let i = 0; i < 4; i++) { const a = i * TAU / 4; line(c, Math.cos(a) * 28, Math.sin(a) * 28 + 3, Math.cos(a) * 32, Math.sin(a) * 32 + 3, '#8dd3bc85', 2); } }
    if (p.shield > 0) circle(c, 0, 0, 25 + Math.sin(t * 10) * 1.5, `${color}09`, `${color}${Math.floor((0.3 + Math.sin(t * 12) * 0.12) * 255).toString(16).padStart(2, '0')}`, 1.5);
    if (p.weapons?.orbit) {
      circle(c, 0, 0, 84, null, `${color}11`);
      const count = Math.min(12, p.weapons.orbit + (p.evolved?.orbit ? 3 : 0) + 1);
      for (let i = 0; i < count; i++) {
        const a = t * 2.4 + i * TAU / count;
        const ox = Math.cos(a) * 84; const oy = Math.sin(a) * 84;
        c.save(); c.translate(ox, oy); c.rotate(a + Math.PI / 2); c.fillStyle = '#080e0d'; c.fillRect(-6, -8, 12, 17); c.fillStyle = '#aad8c4'; c.fillRect(-4, -7, 8, 13); c.fillStyle = '#dcfff0'; c.fillRect(-2, -9, 4, 5); line(c, -3, 6, -3, 21, '#8dd3bc33', 3); c.restore();
      }
    }
    circle(c, 4, 9, 16, '#02090670');
    c.save(); c.rotate(p.angle || 0);
    const step = Math.sin(t * 14 + (p.id?.length || 0)) * 2;
    roundRect(c, -9 + step, -13, 13, 8, 2, '#172326'); roundRect(c, -9 - step, 5, 13, 8, 2, '#172326');
    roundRect(c, -14, -8, 10, 16, 3, '#243732', '#527164');
    c.fillStyle = color; c.beginPath(); c.ellipse(0, 0, 13, 11, 0, 0, TAU); c.fill();
    roundRect(c, -7, -7, 13, 14, 3, '#344b43', '#78978a');
    roundRect(c, 1, -4, 11, 8, 3, '#99ac91');
    c.fillStyle = '#1b2c2b'; c.fillRect(11, -4, 22, 7); c.fillStyle = '#879789'; c.fillRect(13, -3, 17, 3); c.fillStyle = color; c.fillRect(28, -2, 5, 2);
    c.fillStyle = '#c6c6a4'; c.fillRect(6, -10, 10, 5); c.fillRect(8, 7, 10, 4);
    circle(c, -1, -1, 7.2, '#9fb3a0', '#202f2b', 1.5); c.fillStyle = '#1e3433'; c.fillRect(0, -6, 6, 9); c.fillStyle = color; c.fillRect(5, -4, 2, 5);
    c.restore();
    if (!p.connected) { c.fillStyle = '#0c1414a0'; c.fillRect(-20, -20, 40, 40); }
    if (p.name) {
      c.textAlign = 'center'; c.font = `${local ? '600' : '500'} 10px system-ui, sans-serif`; c.fillStyle = '#06100f'; c.fillText(p.name, 1, -32); c.fillStyle = local ? '#dceee1' : color; c.fillText(p.name, 0, -33);
      roundRect(c, -21, -26, 42, 3, 1, '#0a1411'); roundRect(c, -21, -26, 42 * clamp(p.hp / p.maxHp, 0, 1), 3, 1, color);
    }
    c.restore();
  }

  drawEnemy(c, e, x, y, t, players) {
    const config = ENEMIES[e.type] || ENEMIES.walker;
    const r = e.radius || config.radius;
    let target = players.find(p => !p.dead) || { x: x - 1, y };
    for (const p of players) if (!p.dead && Math.hypot(p.x - x, p.y - y) < Math.hypot(target.x - x, target.y - y)) target = p;
    const angle = Math.atan2(target.y - y, target.x - x);
    c.save(); c.translate(x, y);
    if (e.type === 'charger' && e.charge > 0.5) {
      c.save(); c.rotate(Math.atan2(e.vy || 0, e.vx || 1));
      c.fillStyle = '#f1866333'; c.beginPath(); c.moveTo(0, -12); c.lineTo(200, -30); c.lineTo(200, 30); c.lineTo(0, 12); c.closePath(); c.fill(); line(c, 0, 0, 200, 0, '#f08e6d77', 1); c.restore();
    }
    circle(c, 3, r * 0.42, r * 0.95, '#0209075c');
    if (e.elite) circle(c, 0, 0, r + 8, null, '#efbf70', 2);
    if (e.slow) circle(c, 0, 0, r + 5, '#8fd8ef18', '#8fd8ef55');
    c.rotate(angle);
    const color = e.flash ? '#f3edc6' : e.slow ? '#7cacb0' : config.color;
    const step = Math.sin(t * (e.type === 'runner' ? 21 : 10) + e.id) * 3;
    if (this.lowQuality && e.type !== 'boss') {
      circle(c, 0, 0, r * .85, color); line(c, r * .3, 0, r, 0, '#17261e', 3);
    } else if (e.type === 'boss') {
      for (let i = 0; i < 7; i++) { const a = i * TAU / 7; c.save(); c.rotate(a + t * 0.12); c.fillStyle = '#a66352'; c.beginPath(); c.moveTo(r * 0.6, -8); c.lineTo(r * 1.23, 0); c.lineTo(r * 0.6, 8); c.closePath(); c.fill(); c.restore(); }
      circle(c, 0, 0, r, '#5b4742', color, 2.5); circle(c, 1, 0, r * 0.73, '#97694f', '#d19a72', 2); circle(c, 5, 0, r * 0.42, color); circle(c, 13, 0, r * 0.16, '#3b3430');
      line(c, 4, -r * 0.65, r * 0.65, -r * 0.3, '#2c3027', 7); line(c, 4, r * 0.65, r * 0.65, r * 0.3, '#2c3027', 7);
      circle(c, r * 0.6, -r * 0.22, 4, '#fff2c8'); circle(c, r * 0.6, r * 0.22, 4, '#fff2c8');
    } else if (e.type === 'tank') {
      roundRect(c, -r * 0.7, -r * 0.8, r * 1.4, r * 1.6, 7, '#625061', color);
      circle(c, 4, 0, r * 0.65, color); c.fillStyle = '#554552'; c.fillRect(-8, -r, 13, 10); c.fillRect(-8, r - 10, 13, 10); line(c, 8, -8, 15, -5, '#e2bdb3', 2); line(c, 8, 8, 15, 5, '#e2bdb3', 2);
    } else if (e.type === 'spitter') {
      circle(c, -4, 0, r, '#466b43', color); circle(c, -5, -6, 7, color); circle(c, -9, 5, 6, '#b0cd7e'); circle(c, 8, 0, 8, '#a3bf76'); circle(c, 13, 0, 3.5, '#2a4027');
      circle(c, -6, 0, 3 + Math.sin(t * 4) * 0.7, '#d5de88');
    } else if (e.type === 'splitter') {
      circle(c, 0, 0, r, '#634d6c', color, 2);
      for (let i = 0; i < 3; i++) { const a = i * TAU / 3; circle(c, Math.cos(a) * r * .5, Math.sin(a) * r * .5, 6, color); }
    } else if (e.type === 'leech') {
      circle(c, 0, 0, r, '#254b43', color, 2); line(c, -8, 0, 8, 0, color, 4); line(c, 0, -8, 0, 8, color, 4);
    } else if (e.type === 'charger') {
      roundRect(c, -r, -r * 0.65, r * 1.7, r * 1.3, 4, '#8c5143', color);
      c.fillStyle = color; c.beginPath(); c.moveTo(r * 1.2, 0); c.lineTo(r * 0.4, -r * 0.9); c.lineTo(r * 0.4, r * 0.9); c.closePath(); c.fill(); line(c, 8, -7, 14, -5, '#fde0a3', 2); line(c, 8, 7, 14, 5, '#fde0a3', 2);
    } else {
      c.fillStyle = '#47563e'; c.fillRect(-6 + step, -r * 0.82, 9, 5); c.fillRect(-6 - step, r * 0.82 - 5, 9, 5);
      c.fillStyle = color; c.beginPath(); c.ellipse(0, 0, r * (e.type === 'runner' ? 1 : 0.86), r * 0.72, 0, 0, TAU); c.fill();
      c.strokeStyle = '#18261d'; c.lineWidth = 1.5; c.stroke();
      line(c, 1, -r * 0.55, r * 1.2, -r * 0.7 + step, color, 4); line(c, 1, r * 0.55, r * 1.2, r * 0.7 - step, color, 4);
      circle(c, r * 0.5, 0, r * 0.52, e.type === 'runner' ? '#d2a869' : '#99ab68');
      circle(c, r * 0.8, -3, 1.4, '#e4ac77'); circle(c, r * 0.8, 3, 1.4, '#e4ac77');
      line(c, -r * 0.5, -3, 1, 3, '#4b623a', 2);
    }
    c.rotate(-angle);
    if (e.type === 'boss' || e.hp < e.maxHp * 0.9 && e.type === 'tank') {
      const bw = e.type === 'boss' ? 96 : 44;
      roundRect(c, -bw / 2, -r - 19, bw, 4, 1, '#08110f'); roundRect(c, -bw / 2, -r - 19, bw * clamp(e.hp / e.maxHp, 0, 1), 4, 1, config.color);
      if (e.type === 'boss') { c.font = '600 9px system-ui, sans-serif'; c.textAlign = 'center'; c.fillStyle = '#f0c6aa'; c.fillText('СТРАЖ РУБЕЖА', 0, -r - 26); }
    }
    c.restore();
  }

  drawBullet(c, b, x, y) {
    if (b.type === 'mine') { circle(c, x, y, 10, '#31291d', '#e6b97e', 2); circle(c, x, y, 3, '#efbf70'); return; }
    const color = b.type === 'enemy' ? '#e29a74' : WEAPONS[b.type]?.color || '#efc783';
    const angle = Math.atan2(b.vy || 0, b.vx || 0);
    c.save(); c.translate(x, y); c.rotate(angle);
    if (b.type === 'enemy') { circle(c, 0, 0, 10, '#e29a7416'); circle(c, 0, 0, b.radius || 6, '#ad5d45', '#edb07a', 1.5); circle(c, -1.5, -1.5, 2, '#f7cca1'); }
    else if (b.type === 'rocket') { line(c, -28, 0, -4, 0, '#f5917533', 6); line(c, -16, 0, -4, 0, '#e9ba75', 3); c.fillStyle = '#c7d0b9'; c.fillRect(-5, -3, 12, 6); c.fillStyle = color; c.fillRect(5, -2, 3, 4); }
    else { line(c, -17, 0, 2, 0, `${color}25`, b.type === 'frost' ? 7 : 5); line(c, -8, 0, 4, 0, color, b.type === 'frost' ? 3.5 : 2.5); circle(c, 3, 0, 1.8, '#fff3d1'); }
    c.restore();
  }

  drawEffect(c, fx) {
    if (!this.visible(fx.x, fx.y, (fx.radius || 0) + 70) && fx.kind !== 'lightning') return;
    const color = fx.color || '#8dd3bc';
    const progress = 1 - clamp(fx.ttl / (fx.kind === 'ping' ? 4 : fx.kind === 'lightning' ? 0.24 : 0.5), 0, 1);
    c.save(); c.globalAlpha = (1 - progress) * 0.9;
    if (fx.kind === 'lightning') {
      const random = seededRandom(fx.id);
      c.beginPath(); c.moveTo(fx.x, fx.y);
      for (let i = 1; i <= 7; i++) { const t = i / 7; c.lineTo(mix(fx.x, fx.toX, t) + (i === 7 ? 0 : (random() - 0.5) * 22), mix(fx.y, fx.toY, t) + (i === 7 ? 0 : (random() - 0.5) * 22)); }
      c.strokeStyle = `${color}55`; c.lineWidth = 7; c.stroke(); c.strokeStyle = color; c.lineWidth = 2; c.stroke();
    } else {
      const r = fx.radius * (0.3 + progress * 0.7);
      circle(c, fx.x, fx.y, r, `${color}08`, color, fx.kind === 'blast' ? 3 : 2);
      circle(c, fx.x, fx.y, Math.max(0, r - 10), null, `${color}55`, 1);
      if (fx.kind === 'blast') for (let i = 0; i < 8; i++) { const a = i * TAU / 8 + fx.id; line(c, fx.x + Math.cos(a) * r * 0.55, fx.y + Math.sin(a) * r * 0.55, fx.x + Math.cos(a) * r, fx.y + Math.sin(a) * r, color, 2); }
    }
    c.restore();
  }

  drawBoundary(c, time) {
    const m = this.map;
    c.strokeStyle = '#162b22'; c.lineWidth = 28; c.strokeRect(14, 14, m.width - 28, m.height - 28);
    c.strokeStyle = '#a5ba7b38'; c.lineWidth = 2; c.setLineDash([12, 12]); c.strokeRect(29, 29, m.width - 58, m.height - 58); c.setLineDash([]);
    const alpha = 0.3 + Math.sin(time * 1.5) * 0.1;
    c.strokeStyle = `rgba(179,181,118,${alpha})`; c.lineWidth = 1; c.strokeRect(35, 35, m.width - 70, m.height - 70);
  }

  drawTeammateArrows(c, state, local) {
    if (!local) return;
    const w = this.width; const h = this.height; const z = this.camera.zoom;
    for (const p of state.players) {
      if (p.id === local.id) continue;
      const x = (p.x - this.camera.x) * z + w / 2; const y = (p.y - this.camera.y) * z + h / 2;
      if (x > 32 && x < w - 32 && y > 110 && y < h - 85) continue;
      const dx = x - w / 2; const dy = y - h / 2;
      const ratio = Math.min((w / 2 - 30) / Math.max(1, Math.abs(dx)), (h / 2 - 95) / Math.max(1, Math.abs(dy)));
      const px = w / 2 + dx * ratio; const py = h / 2 + dy * ratio;
      const color = p.dead ? '#e8a18b' : p.color || '#8dd3bc';
      c.save(); c.translate(px, py); c.rotate(Math.atan2(dy, dx)); c.fillStyle = color; c.beginPath(); c.moveTo(7, 0); c.lineTo(-5, -5); c.lineTo(-3, 0); c.lineTo(-5, 5); c.closePath(); c.fill(); c.restore();
      c.font = '9px system-ui, sans-serif'; c.textAlign = 'center'; c.fillStyle = color; c.fillText(`${p.dead ? '+ ' : ''}${p.name} · ${Math.round(Math.hypot(p.x - local.x, p.y - local.y) / 40)}м`, px, py + 17);
    }
  }

  drawObjectiveArrow(c, state, local) {
    if (!local) return;
    const targets = (state.effects || []).filter(fx => fx.kind === 'ping').map(fx => ({ ...fx, label: 'МЕТКА ОТРЯДА' }));
    if (state.event && state.event.kind !== 'hunt') targets.push({ ...state.event, color: '#efbf70', label: 'ЗАДАНИЕ' });
    for (const target of targets) {
      const x = (target.x - this.camera.x) * this.camera.zoom, y = (target.y - this.camera.y) * this.camera.zoom;
      const maxX = this.width / 2 - 48, maxY = this.height / 2 - 130;
      const ratio = Math.min(1, maxX / Math.max(1, Math.abs(x)), Math.max(20, maxY) / Math.max(1, Math.abs(y)));
      if (ratio >= 1) continue;
      const px = this.width / 2 + x * ratio, py = this.height / 2 + y * ratio;
      c.save(); c.translate(px, py); c.rotate(Math.atan2(y, x));
      c.fillStyle = target.color; c.beginPath(); c.moveTo(10, 0); c.lineTo(-6, -7); c.lineTo(-3, 0); c.lineTo(-6, 7); c.closePath(); c.fill(); c.restore();
      c.font = '9px system-ui'; c.textAlign = 'center'; c.fillStyle = target.color;
      c.fillText(`${target.label} · ${Math.round(Math.hypot(target.x - local.x, target.y - local.y) / 40)}м`, px, py + 21);
    }
  }

  drawMinimap(c, state) {
    const w = 140; const h = Math.round(w * this.map.height / this.map.width);
    const x = this.width - w - 20; const y = 110;
    c.save(); c.translate(x, y);
    roundRect(c, 0, 0, w, h, 5, '#081311bf', '#83c9b22a');
    const sx = w / this.map.width; const sy = h / this.map.height;
    c.fillStyle = '#71866b55';
    for (const ob of this.obstacles) circle(c, ob.x * sx, ob.y * sy, Math.max(1, ob.r * sx), '#71866b55');
    const bw = this.width / this.camera.zoom * sx; const bh = this.height / this.camera.zoom * sy;
    c.strokeStyle = '#a8c6ad35'; c.lineWidth = 1; c.strokeRect(clamp(this.camera.x * sx - bw / 2, 0, w), clamp(this.camera.y * sy - bh / 2, 0, h), Math.min(w, bw), Math.min(h, bh));
    for (const n of state.objects || []) if (!n.used) circle(c, n.x * sx, n.y * sy, 2, INTERACTABLES[n.kind].color);
    if (state.event && state.event.kind !== 'hunt') circle(c, state.event.x * sx, state.event.y * sy, 5, null, '#efbf70', 2);
    for (const e of state.enemies) if (e.type === 'boss') circle(c, e.x * sx, e.y * sy, 3.5, '#e99b7b');
    for (const fx of state.effects) if (fx.kind === 'ping') circle(c, fx.x * sx, fx.y * sy, 5, null, fx.color, 2);
    for (const p of state.players) { circle(c, p.x * sx, p.y * sy, p.id === this.localPlayerId ? 3.2 : 2.5, p.dead ? '#e89985' : p.color || '#8dd3bc', '#071411', 1); }
    c.font = '8px ui-monospace, monospace'; c.textAlign = 'right'; c.fillStyle = '#a6c3a884'; c.fillText(this.map.name.toUpperCase(), w - 5, h - 7); c.restore();
  }
}

__exports.Renderer = Renderer;
  };

  __modules['src/game/codec.js'] = function(__exports, __require) {
// Complete, independently decodable frames: dropping a stale frame is safe.
function packState(state) {
  return { ...state, packed: 1,
    enemies: state.enemies.map(e => [e.id, e.type, e.x, e.y, e.hp, e.maxHp, e.radius, +e.flash | (+e.slow << 1) | (+!!e.elite << 2), Math.round((e.charge || 0) * 100), Math.round((e.vx || 0) * 100), Math.round((e.vy || 0) * 100)]),
    bullets: state.bullets.map(b => [b.id, b.x, b.y, b.vx, b.vy, b.type, b.radius]),
    gems: state.gems.map(g => [g.id, g.x, g.y, g.value, g.kind]),
  };
}
function unpackState(state) {
  if (!state?.packed) return state;
  const { packed, ...rest } = state;
  return { ...rest,
    enemies: state.enemies.map(e => ({ id: e[0], type: e[1], x: e[2], y: e[3], hp: e[4], maxHp: e[5], radius: e[6], flash: !!(e[7] & 1), slow: !!(e[7] & 2), elite: !!(e[7] & 4), charge: e[8] / 100, vx: e[9] / 100, vy: e[10] / 100 })),
    bullets: state.bullets.map(b => ({ id: b[0], x: b[1], y: b[2], vx: b[3], vy: b[4], type: b[5], radius: b[6] })),
    gems: state.gems.map(g => ({ id: g[0], x: g[1], y: g[2], value: g[3], kind: g[4] })),
  };
}

__exports.packState = packState; __exports.unpackState = unpackState;
  };

  __modules['src/ui/NetworkClient.js'] = function(__exports, __require) {
const { unpackState } = __require('src/game/codec.js');
const SESSION_KEY = 'frontier_session_v1';
const readSession = () => { try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; } };
const storeSession = value => { try { value ? sessionStorage.setItem(SESSION_KEY, JSON.stringify(value)) : sessionStorage.removeItem(SESSION_KEY); } catch { /* Private browsing may disable storage. */ } };
const nonce = () => [...crypto.getRandomValues(new Uint8Array(16))].map(n => n.toString(16).padStart(2, '0')).join('');

/** One authoritative session, with bounded WebSocket and same-origin HTTP transports. */
class NetworkClient {
  constructor(callbacks = {}) {
    this.callbacks = callbacks;
    this.ws = null;
    this.id = ''; this.token = ''; this.room = null; this.transport = '';
    this.latency = 0; this.generation = 0; this.retries = 0;
    this.connected = false; this.lastReceived = 0; this.reconnectSince = 0; this.initialSince = 0;
    this.controls = new Map(); this.latestInput = { type: 'input', x: 0, y: 0 }; this.pendingDash = null;
    this.lastAction = null; this.httpConnection = ''; this.inFlight = false;
    this.forceHttp = new URLSearchParams(location.search).get('transport') === 'http';
  }

  restore() {
    const saved = readSession();
    if (!saved?.token || Date.now() - saved.savedAt > 2 * 60 * 60 * 1000) { storeSession(null); return false; }
    this.token = saved.token; this.id = saved.id || ''; this.transport = saved.transport || '';
    this.reconnectSince = Date.now();
    const action = { type: 'resume', token: this.token };
    if (this.forceHttp || this.transport === 'http') this.openHttp(action); else this.open(action);
    return true;
  }

  connect(action) {
    this.disconnect(false);
    this.lastAction = { ...action, requestId: action.requestId || nonce() };
    this.initialSince = Date.now(); this.retries = 0;
    if (this.forceHttp) this.openHttp(this.lastAction); else this.open(this.lastAction);
  }

  retry() {
    if (this.token) {
      this.reconnectSince = Date.now();
      // Retry uses the fallback directly: another stuck socket should not delay it.
      this.openHttp({ type: 'resume', token: this.token });
    } else if (this.lastAction) {
      this.initialSince = Date.now();
      this.openHttp(this.lastAction);
    }
  }

  clearTransport() {
    ++this.generation;
    clearTimeout(this.connectTimer); clearTimeout(this.reconnectTimer); clearTimeout(this.pollTimer);
    clearInterval(this.pingTimer); clearInterval(this.watchdogTimer);
    this.controller?.abort(); this.controller = null; this.inFlight = false;
    if (this.ws) { this.ws.onclose = null; this.ws.onmessage = null; this.ws.onerror = null; try { this.ws.close(); } catch {} }
    this.ws = null;
  }

  open(action) {
    this.clearTransport();
    const generation = this.generation;
    this.connected = false;
    if (location.protocol === 'file:') { this.fail('Для совместной игры запусти npm run share и открой адрес игры из терминала. Одиночный режим доступен прямо сейчас.'); return; }
    this.transport = 'websocket'; this.callbacks.onTransport?.('websocket');
    this.callbacks.onStatus?.(this.token ? 'reconnecting' : 'connecting');
    const url = new URL('/ws', location.href); url.protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(url);
    this.ws = ws; this.lastReceived = Date.now();
    const fallback = () => {
      if (generation !== this.generation) return;
      this.openHttp(this.token ? { type: 'resume', token: this.token } : action);
    };
    this.connectTimer = setTimeout(fallback, 5500);
    ws.onopen = () => { if (generation === this.generation) ws.send(JSON.stringify({ ...action, compact: true })); else ws.close(); };
    ws.onmessage = event => {
      if (generation !== this.generation) return;
      let message; try { message = JSON.parse(event.data); } catch { return; }
      this.lastReceived = Date.now(); this.receive(message);
    };
    ws.onerror = () => {};
    ws.onclose = event => {
      if (generation !== this.generation) return;
      if (event.code === 4001) { this.expire('Эта игровая сессия открыта в другой вкладке'); return; }
      fallback();
    };
    this.pingTimer = setInterval(() => this.send({ type: 'ping', at: Date.now() }), 2500);
    this.watchdogTimer = setInterval(() => {
      if (generation !== this.generation) return;
      this.flushWebSocket();
      // TCP can remain OPEN through a broken tunnel: only app messages prove liveness.
      if (this.connected && Date.now() - this.lastReceived > 7000) fallback();
    }, 250);
  }

  receive(message) {
    if (message.state) message.state = unpackState(message.state);
    if (message.type === 'welcome') {
      clearTimeout(this.connectTimer);
      this.connected = true; this.retries = 0; this.reconnectSince = 0;
      this.token = message.token; this.id = message.id; this.room = message.room;
      storeSession({ token: this.token, id: this.id, transport: this.transport, savedAt: Date.now() });
      this.callbacks.onStatus?.('connected');
      this.callbacks.onWelcome?.(message);
      this.flushWebSocket();
    }
    if (message.type === 'room') { this.room = message.room; this.callbacks.onRoom?.(message.room); }
    if (message.type === 'state') {
      if (message.room) { this.room = message.room; this.callbacks.onRoom?.(message.room); }
      this.callbacks.onState?.(message.state);
    }
    if (message.type === 'ack') this.controls.delete(message.commandId);
    if (message.type === 'pong') { this.latency = Math.max(0, Date.now() - Number(message.at)); this.callbacks.onLatency?.(this.latency); }
    if (message.type === 'error') {
      if (!this.token) this.fail(message.message || 'Не удалось подключиться');
      else this.callbacks.onError?.(message.message || 'Не удалось выполнить действие');
    }
    if (message.type === 'expired') this.expire(message.message || 'Комната закрыта');
  }

  openHttp(action) {
    this.clearTransport();
    if (location.protocol === 'file:') { this.fail('Открой адрес игры через npm run share или npm start.'); return; }
    this.connected = false; this.transport = 'http'; this.httpConnection = nonce();
    this.callbacks.onTransport?.('http'); this.callbacks.onStatus?.(this.token ? 'reconnecting' : 'connecting');
    this.httpInitial = action;
    this.lastReceived = Date.now();
    const generation = this.generation;
    const remaining = this.token ? 27000 : Math.max(1, 15000 - (Date.now() - this.initialSince));
    this.connectTimer = setTimeout(() => {
      if (generation !== this.generation || this.connected) return;
      if (this.token) this.expire('Связь с сервером потеряна. Проверь, что игра и туннель ещё запущены.');
      else this.fail('Не удалось подключиться за 15 секунд. Нажми «Повторить» или проверь, что адрес туннеля ещё работает.');
    }, remaining);
    this.pollHttp();
  }

  async pollHttp() {
    if (this.inFlight || this.transport !== 'http') return;
    const generation = this.generation;
    this.inFlight = true;
    const started = Date.now();
    const controller = new AbortController(); this.controller = controller;
    const timeout = setTimeout(() => controller.abort(), 5000);
    const controls = [...this.controls.values()].slice(0, 12).map(item => item.message);
    const input = { ...this.latestInput };
    const dash = this.pendingDash;
    if (dash) { input.dash = true; input.commandId = dash; }
    const body = this.httpInitial ? { ...this.httpInitial } : { messages: [...controls, input] };
    delete body.token;
    body.connection = this.httpConnection; body.compact = true;
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (this.token) headers.Authorization = `Bearer ${this.token}`;
      const response = await fetch('/api/transport', { method: 'POST', headers, body: JSON.stringify(body), signal: controller.signal, cache: 'no-store', credentials: 'same-origin' });
      const data = await response.json();
      if (generation !== this.generation) return;
      if (!response.ok && !Array.isArray(data.messages)) throw new Error('Сервер не поддерживает резервное соединение. Перезапусти npm run share с новой версией игры.');
      this.lastReceived = Date.now(); this.retries = 0; this.httpInitial = null;
      for (const message of data.messages || []) { this.receive(message); if (generation !== this.generation) return; }
      if (data.room) { this.room = data.room; this.callbacks.onRoom?.(data.room); }
      if (data.state) this.callbacks.onState?.(unpackState(data.state));
      if (dash === this.pendingDash) this.pendingDash = null;
      if (this.token && !this.connected) { this.connected = true; this.reconnectSince = 0; clearTimeout(this.connectTimer); this.callbacks.onStatus?.('connected'); }
      this.latency = Date.now() - started; this.callbacks.onLatency?.(this.latency);
      this.pollTimer = setTimeout(() => this.pollHttp(), this.controls.size ? 0 : this.room?.phase === 'playing' ? Math.max(0, 66 - (Date.now() - started)) : 600);
    } catch (err) {
      if (generation !== this.generation) return;
      this.connected = false;
      this.reconnectSince ||= Date.now();
      this.callbacks.onStatus?.(this.token ? 'reconnecting' : 'connecting');
      if ((!this.token && Date.now() - this.initialSince >= 15000) || (this.token && Date.now() - this.reconnectSince >= 27000)) {
        if (this.token) this.expire('Связь с сервером потеряна. Проверь, что игра и туннель ещё запущены.');
        else this.fail('Сервер не отвечает. Проверь адрес туннеля и нажми «Повторить».');
      } else this.pollTimer = setTimeout(() => this.pollHttp(), Math.min(1500, 300 * ++this.retries));
    } finally {
      clearTimeout(timeout);
      if (generation === this.generation) { this.inFlight = false; this.controller = null; }
    }
  }

  flushWebSocket() {
    if (this.transport !== 'websocket' || !this.connected || this.ws?.readyState !== WebSocket.OPEN || this.ws.bufferedAmount >= 32768) return;
    for (const control of this.controls.values()) {
      if (this.ws.bufferedAmount >= 32768) break;
      if (Date.now() - control.sent < 1500) continue;
      this.ws.send(JSON.stringify(control.message)); control.sent = Date.now();
    }
  }

  send(message) {
    if (message.type === 'input') {
      this.latestInput = { type: 'input', x: message.x, y: message.y };
      if (message.dash) this.pendingDash ||= nonce();
      if (this.transport === 'websocket' && this.connected && this.ws?.readyState === WebSocket.OPEN && this.ws.bufferedAmount < 32768) {
        const key = `${message.x}:${message.y}`;
        if (!this.pendingDash && key === this.lastInputKey && Date.now() - this.lastInputAt < 120) return;
        this.lastInputKey = key; this.lastInputAt = Date.now();
        this.ws.send(JSON.stringify({ ...message, ...(this.pendingDash ? { dash: true, commandId: this.pendingDash } : {}) }));
        this.pendingDash = null;
      }
      return;
    }
    if (message.type === 'ping') { if (this.transport === 'websocket' && this.ws?.readyState === WebSocket.OPEN && this.ws.bufferedAmount < 32768) this.ws.send(JSON.stringify(message)); return; }
    const commandId = message.commandId || nonce();
    if (this.controls.size >= 24) { this.callbacks.onStatus?.('slow'); return; }
    this.controls.set(commandId, { message: { ...message, commandId }, sent: 0 });
    if (this.transport === 'websocket') this.flushWebSocket();
    else if (this.transport === 'http' && !this.inFlight) { clearTimeout(this.pollTimer); this.pollHttp(); }
  }

  fail(message) {
    this.clearTransport(); this.connected = false;
    this.callbacks.onStatus?.('error'); this.callbacks.onError?.(message);
  }

  expire(message) {
    this.disconnect(false); this.callbacks.onExpired?.(message);
  }

  disconnect(notify = true) {
    if (notify && this.token) {
      if (this.transport === 'http') {
        fetch('/api/transport', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.token}` }, body: JSON.stringify({ connection: this.httpConnection, messages: [{ type: 'leave' }] }), keepalive: true }).catch(() => {});
      } else if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify({ type: 'leave' }));
    }
    this.clearTransport(); this.connected = false; this.token = ''; this.id = ''; this.room = null;
    this.controls.clear(); this.latestInput = { type: 'input', x: 0, y: 0 }; this.pendingDash = null;
    this.reconnectSince = 0; this.retries = 0;
    storeSession(null);
  }
}

__exports.NetworkClient = NetworkClient;
  };

  __modules['src/main.js'] = function(__exports, __require) {
const { World } = __require('src/game/World.js');
const { MAPS, HEROES, WEAPONS, UPGRADES, formatTime, xpRequired, RUN_MODES, INTERACTABLES, EVOLUTIONS, MAX_PLAYERS } = __require('src/game/catalog.js');
const { Renderer } = __require('src/ui/Renderer.js');
const { NetworkClient } = __require('src/ui/NetworkClient.js');
function bootstrap() {
  if (window.__BLINOV_BOOTED__) return;
  window.__BLINOV_BOOTED__ = true;
  const dom = new Map();
  const $ = selector => { let node = dom.get(selector); if (!node?.isConnected) { node = document.querySelector(selector); if (node) dom.set(selector, node); } return node; };
  const safe = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const read = (key, fallback) => { try { return localStorage.getItem(key) || fallback; } catch { return fallback; } };
  const save = (key, value) => { try { localStorage.setItem(key, value); } catch { /* Storage is optional. */ } };
  const avatar = (hero, size = 42) => `<svg class="hero-avatar" width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true"><path d="M12 52v-9c0-8 8-14 20-14s20 6 20 14v9" fill="currentColor" opacity=".26"/><path d="M19 25c0-14 26-14 26 0v11H19Z" fill="currentColor"/><path d="M16 25h32v9H16Z" fill="#14211b"/><path d="M22 27h20v4H22Z" fill="currentColor"/><path d="M22 42v13M42 42v13M25 47h14" stroke="currentColor" stroke-width="3"/>${hero === 'engineer' ? '<circle cx="51" cy="19" r="5" fill="currentColor"/><circle cx="13" cy="19" r="5" fill="currentColor"/>' : hero === 'medic' ? '<path d="M29 43h6v4h4v6h-4v4h-6v-4h-4v-6h4Z" fill="currentColor"/>' : '<path d="m44 40 12 9-4 6-12-9Z" fill="currentColor"/>'}</svg>`;
  let selectedMap = read('frontier_map', 'outpost'); if (!MAPS[selectedMap]) selectedMap = 'outpost';
  let selectedHero = read('frontier_hero', 'ranger'); if (!HEROES[selectedHero]) selectedHero = 'ranger';
  let selectedRun = read('frontier_run', 'expedition'); if (!RUN_MODES[selectedRun]) selectedRun = 'expedition';
  let mode = '', screen = 'menu', world = null, state = null, room = null, localId = '', modalKind = '', connectionStatus = 'idle';
  let upgradeKey = '', upgradePending = false, resultKey = '', lobbyKey = '', lastHud = 0, inputClock = 0, soloClock = 0, lastTime = performance.now();
  let publicUrl = '', lanAddresses = [], toastTimer, connectionTimer, transport = '', sound = read('frontier_sound', 'off') === 'on', audio, lastKills = 0, ping = 0;
  const keys = new Set();
  const stick = { active: false, id: null, x: 0, y: 0, baseX: 0, baseY: 0 };
  let dashPressed = false;
  // Some tunnel welcome pages replace the query string. The fragment survives
  // that redirect, so invitations carry the room in both places.
  const inviteCode = (new URLSearchParams(location.search).get('room') || new URLSearchParams(location.hash.slice(1)).get('room') || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  $('#app').innerHTML = `
    <header class="site-header" id="site-header">
      <a class="brand" href="#" aria-label="Последний рубеж — главное меню"><span class="brand-mark"><i></i><i></i><i></i><i></i></span><span>ПОСЛЕДНИЙ РУБЕЖ<small>CO-OP SURVIVAL / V3.1</small></span></a>
      <nav class="header-actions"><span class="server-status" id="server-status"><i></i>Проверяем связь</span><button class="text-button" id="scores-open">Рекорды</button><button class="icon-button" id="help-open" aria-label="Как играть">?</button><button class="icon-button sound-toggle" aria-label="Включить звук">♪</button></nav>
    </header>
    <main class="menu screen" id="menu-screen">
      <section class="intro"><div class="eyebrow"><span class="tiny-cross">+</span> СИГНАЛ ОБНАРУЖЕН <span class="eyebrow-line"></span> 01 / 03</div><h1>ПОСЛЕДНИЙ<br><span>РУБЕЖ<span class="title-period">.</span></span></h1><p class="intro-copy">Орда приближается.<br>Один — боец. Вместе — последний рубеж.</p><div class="intro-tags"><span><i class="live-dot"></i>1–10 ИГРОКОВ</span><span>АВТОСТРЕЛЬБА</span><span>10 / 20 МИН / ∞</span></div><div class="mission-copy"><span class="mission-number">01</span><p><strong>Двигайся. Прокачивайся. Выживай.</strong><br>Оружие стреляет само. Ты выбираешь маршрут,<br class="desktop-only">улучшения и тех, с кем дойдёшь до конца.</p></div><div class="intro-coordinate">56°50′ N &nbsp; 60°36′ E <span>ЗОНА КАРАНТИНА</span></div></section>
      <section class="setup-panel"><div class="panel-top"><span class="eyebrow">ПОДГОТОВКА К ВЫЛАЗКЕ</span><span class="panel-corner">↗</span></div>
        <label class="field-label" for="nickname"><span>01</span> ПОЗЫВНОЙ</label><input id="nickname" class="input nickname-input" maxlength="20" autocomplete="nickname" placeholder="Как тебя зовут?" value="${safe(read('frontier_name', 'Выживший'))}">
        <div class="field-label"><span>02</span> ТВОЙ БОЕЦ</div><div class="hero-options" id="hero-options">${Object.entries(HEROES).map(([id, h]) => `<button class="hero-card ${selectedHero === id ? 'selected' : ''}" data-hero="${id}" aria-pressed="${selectedHero === id}" style="--hero-color:${h.color}">${avatar(id)}<strong>${h.name}</strong><small>${h.mark} / ${id === 'ranger' ? 'УРОН' : id === 'engineer' ? 'ЗАЩИТА' : id === 'medic' ? 'РЕГЕНЕРАЦИЯ' : id === 'scout' ? 'СКОРОСТЬ' : 'ЛАЗЕР'}</small></button>`).join('')}</div><div class="choice-description" id="hero-description">${HEROES[selectedHero].description}</div>
        <div class="field-label"><span>03</span> МЕСТО ВЫСАДКИ</div><div class="map-options" id="map-options">${Object.values(MAPS).map((m, i) => `<button class="map-card ${selectedMap === m.id ? 'selected' : ''}" data-map="${m.id}" aria-pressed="${selectedMap === m.id}" style="--map-color:${m.color}"><span class="map-art map-art-${m.id}"><i></i><i></i><i></i><i></i><b>0${i + 1}</b></span><strong>${m.name}</strong><small>${m.tag}</small></button>`).join('')}</div><p class="choice-description map-description" id="map-description">${MAPS[selectedMap].description}</p>
        <label class="field-label" for="run-mode"><span>04</span> ДЛИТЕЛЬНОСТЬ ОПЕРАЦИИ</label><select class="input run-select" id="run-mode">${Object.entries(RUN_MODES).map(([id, m]) => `<option value="${id}" ${id === selectedRun ? 'selected' : ''}>${m.name} · ${m.duration ? m.duration / 60 + ' мин' : '∞'}</option>`).join('')}</select><p class="choice-description" id="run-description">${RUN_MODES[selectedRun].description}</p>
        <button class="button primary online-button" id="create-room"><span class="button-icon">↗</span><span>Собрать отряд<small>СОЗДАТЬ КОМНАТУ · ДО 10 ИГРОКОВ</small></span><span class="button-arrow">→</span></button>
        <div class="join-row"><label class="visually-hidden" for="room-code">Код комнаты</label><input class="input code-input" id="room-code" placeholder="КОД КОМНАТЫ" maxlength="6" autocomplete="off" spellcheck="false" value="${safe(inviteCode)}"><button class="button secondary" id="join-room">Войти <span>→</span></button></div>
        <div class="solo-row"><button class="text-button" id="solo-play">Или отправиться одному <span>→</span></button><span>БЕЗ ПОДКЛЮЧЕНИЯ</span></div>
        <div class="invite-note ${inviteCode ? '' : 'hidden'}" id="invite-note">Тебя пригласили в отряд <strong>${safe(inviteCode)}</strong>. Выбери бойца и нажми «Войти».</div>
      </section>
      <footer class="menu-footer"><span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> ДВИЖЕНИЕ <b>·</b> <kbd>SPACE</kbd> РЫВОК</span><span>ОРУЖИЕ СТРЕЛЯЕТ АВТОМАТИЧЕСКИ <i>↗</i></span></footer>
    </main>
    <section class="lobby screen hidden" id="lobby-screen"><div class="lobby-heading"><span class="eyebrow">СВЯЗЬ УСТАНОВЛЕНА / ЛОББИ</span><h2>Вместе до<br><em>последнего.</em></h2><p>Пригласи друзей. Отметьте готовность.<br>Командир даст сигнал к высадке.</p><div class="lobby-map"><span class="live-dot"></span><div><small>МЕСТО ВЫСАДКИ</small><strong id="lobby-map-name"></strong></div></div><button class="text-button" id="lobby-leave">← Покинуть отряд</button></div><div class="lobby-panel"><div class="panel-top"><span class="eyebrow">ТВОЙ ОТРЯД</span><span id="lobby-count">1 / 10</span></div><div class="transport-status" id="transport-status"></div><div id="squad-list"></div><div class="invite-block"><label class="field-label" for="invite-link">ПРИГЛАШЕНИЕ ДЛЯ ДРУГА</label><div class="share-row"><input class="input" readonly id="invite-link" aria-label="Ссылка для друга"><button class="icon-button" id="copy-link" aria-label="Скопировать приглашение">⧉</button></div><div class="room-code-line"><span>КОД КОМНАТЫ</span><button class="room-code-value" id="copy-code" aria-label="Скопировать код комнаты"></button></div><p class="share-hint" id="share-hint"></p></div><button class="button primary" id="lobby-action"></button><p class="lobby-tip" id="lobby-tip"></p></div></section>
    <section class="game-hud hidden" id="game-hud" aria-label="Состояние игры"><div class="xp-track"><div id="xp-fill"></div></div><div class="hud-top"><div class="health-panel"><span class="eyebrow" id="hud-name">ВЫЖИВШИЙ</span><div class="hp-numbers"><span class="health-cross">+</span><strong id="hp-value">100</strong><span id="hp-max">/ 100</span><span class="level-tag" id="hud-level">УР. 1</span></div><div class="health-track"><div id="hp-fill"></div></div><small class="xp-caption" id="xp-caption"></small></div><div class="timer-panel"><small id="timer-objective">ДОЖИТЬ ДО ЭВАКУАЦИИ</small><strong id="hud-time">00:00</strong><span id="hud-duration">/ 20:00</span><p id="hud-mode"></p></div><div class="hud-top-right"><div class="kill-counter"><small>УНИЧТОЖЕНО</small><strong id="hud-kills">0</strong></div><button class="icon-button" id="pause-open" aria-label="Игровое меню">Ⅱ</button></div></div><div class="teammates" id="teammates"></div><div class="boss-bar hidden" id="boss-bar"><span>СТРАЖ РУБЕЖА</span><div><i id="boss-fill"></i></div></div><div class="activity-panel" id="activity-panel"></div><div class="interaction-bar"><button id="interact-button" class="button secondary hidden"></button><button id="mark-button" class="icon-button" aria-label="Метка для отряда (Q)">⌖</button></div><div class="hud-bottom"><div><div class="weapon-label">АРСЕНАЛ <span>АВТООГОНЬ АКТИВЕН</span></div><div class="weapon-slots" id="weapon-slots"></div><div class="skill-slots" id="skill-slots" aria-label="Активные навыки"></div></div><button class="dash-button" id="dash-button" aria-label="Рывок"><span>↟</span><strong id="dash-label">РЫВОК</strong><small>SPACE / SHIFT</small><i id="dash-fill"></i></button></div><div class="dead-notice hidden" id="dead-notice"></div><div class="game-tip" id="game-tip"><span>WASD</span> Двигайся &nbsp;·&nbsp; <span>E</span> Взаимодействие &nbsp;·&nbsp; <span>Q</span> Метка &nbsp;·&nbsp; <span>SPACE</span> Рывок</div></section>
    <div class="joystick hidden" id="joystick"><div></div></div>
    <div class="connection-banner hidden" id="connection-banner" role="status"><i class="live-dot"></i><span id="connection-message">Подключаемся к отряду…</span><button class="text-button hidden" id="connection-retry">Повторить</button><button class="text-button" id="connection-leave">В меню</button></div>
    <div class="modal-backdrop hidden" id="modal-backdrop"><section class="modal" id="modal" role="dialog" aria-modal="true" aria-label="Игровое меню"></section></div>
    <div class="toast hidden" id="toast" role="status"></div>
  `;
  const renderer = new Renderer($('#gameCanvas'));
  renderer.setMap?.(selectedMap);
  renderer.lowQuality = read('frontier_quality', 'auto') === 'low'; renderer.resize();

  function toast(message) { $('#toast').textContent = message; $('#toast').classList.remove('hidden'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.add('hidden'), 6000); }
  function playTone(freq = 420, duration = 0.055, gain = 0.025) {
    if (!sound) return;
    try { audio ||= new (window.AudioContext || window.webkitAudioContext)(); audio.resume(); const oscillator = audio.createOscillator(), volume = audio.createGain(); oscillator.type = 'triangle'; oscillator.frequency.value = freq; volume.gain.setValueAtTime(gain, audio.currentTime); volume.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration); oscillator.connect(volume); volume.connect(audio.destination); oscillator.start(); oscillator.stop(audio.currentTime + duration); } catch { /* Audio is optional. */ }
  }
  function clearInput() { keys.clear(); stick.active = false; stick.x = 0; stick.y = 0; dashPressed = false; $('#joystick').classList.add('hidden'); if (mode === 'online') net.send({ type: 'input', x: 0, y: 0 }); if (world) world.setInput(localId, { x: 0, y: 0 }); }
  function setScreen(next) {
    screen = next;
    $('#menu-screen').classList.toggle('hidden', next !== 'menu'); $('#lobby-screen').classList.toggle('hidden', next !== 'lobby'); $('#game-hud').classList.toggle('hidden', next !== 'playing');
    $('#site-header').classList.toggle('hidden', next === 'playing'); $('#menu-vignette').classList.toggle('hidden', next === 'playing');
    document.body.classList.toggle('in-game', next === 'playing'); clearInput();
  }
  function hideModal() { modalKind = ''; $('#modal-backdrop').classList.add('hidden'); $('#modal').innerHTML = ''; upgradeKey = ''; clearInput(); }
  function showModal(kind, html, wide = false) {
    if (modalKind !== kind) clearInput();
    modalKind = kind; $('#modal').classList.toggle('modal-wide', wide); $('#modal').innerHTML = html; $('#modal-backdrop').classList.remove('hidden');
    $('#modal').querySelector('button:not(:disabled)')?.focus({ preventScroll: true });
  }
  function player() { return state?.players.find(p => p.id === localId); }
  function resetMenu() {
    net.disconnect(); world = null; state = null; room = null; localId = ''; mode = ''; lobbyKey = ''; resultKey = ''; lastKills = 0; connectionStatus = 'idle';
    hideModal(); setScreen('menu'); renderer.setState(null, ''); showConnectionStatus('idle'); transport = ''; renderTransport();
    try { const url = new URL(location.href); url.searchParams.delete('room'); const hash = new URLSearchParams(url.hash.slice(1)); hash.delete('room'); url.hash = hash.toString(); history.replaceState(null, '', url); } catch { /* file:// */ }
  }
  function setConnecting(busy) { $('#create-room').disabled = busy; $('#join-room').disabled = busy; $('#create-room').classList.toggle('loading', busy); }
  function renderTransport() {
    const label = transport === 'http' ? 'Резервное соединение' : transport === 'websocket' ? 'Прямое соединение' : '';
    $('#transport-status').textContent = label ? `${label} · ${transport === 'http' ? 'HTTP' : 'WebSocket'}` : '';
    $('#transport-status').classList.toggle('reserve', transport === 'http');
    if (connectionStatus === 'connected') $('#server-status').innerHTML = `<i></i>${transport === 'http' ? 'На связи · резерв' : 'Отряд на связи'}`;
  }
  function showConnectionStatus(status) {
    connectionStatus = status; clearTimeout(connectionTimer);
    const pending = status === 'connecting' || status === 'reconnecting';
    setConnecting(pending && !state);
    const messages = {
      connecting: 'Подключаемся к отряду. Проверяем доступный способ связи…',
      reconnecting: 'Восстанавливаем связь… Твой боец ждёт на сервере.',
      slow: 'Соединение занимает дольше обычного. Можно повторить попытку или вернуться в меню.',
      error: 'Связь с сервером не установлена. Проверь адрес игры и попробуй ещё раз.',
    };
    const visible = Object.hasOwn(messages, status);
    $('#connection-banner').classList.toggle('hidden', !visible);
    $('#connection-message').textContent = messages[status] || '';
    $('#connection-retry').classList.toggle('hidden', !['reconnecting', 'slow', 'error'].includes(status));
    if (pending) connectionTimer = setTimeout(() => showConnectionStatus('slow'), 15000);
    renderTransport();
    if (room?.phase === 'lobby') renderLobby();
  }
  function applyRoom(next) {
    if (!next || !Array.isArray(next.players)) return;
    room = next;
    if (room.phase === 'lobby') {
      if (modalKind === 'result') hideModal();
      if (screen !== 'lobby') setScreen('lobby');
      renderLobby();
    }
  }
  const net = new NetworkClient({
    onWelcome(m) {
      mode = 'online'; renderer.online = true; world = null; localId = m.id; room = m.room; lobbyKey = ''; resultKey = ''; setConnecting(false);
      if (modalKind === 'pause') hideModal();
      try { const url = new URL(location.href); url.searchParams.set('room', room.code); url.hash = `room=${room.code}`; history.replaceState(null, '', url); } catch { /* file:// */ }
      updateState(m.state); renderLobby(); refreshNetwork();
      if (m.resumed) toast('Связь восстановлена. Ты снова в отряде.');
    },
    onRoom(next) { applyRoom(next); },
    onState(next, metadata) { if (mode === 'online') { if (metadata) applyRoom(metadata); updateState(next); } },
    onStatus(status) { if (status === 'idle' && connectionStatus === 'error') return; showConnectionStatus(status); },
    onTransport(name) { transport = name; renderTransport(); if (state) renderHud(); },
    onLatency(value) { ping = value; if (state) renderHud(); },
    onError(message) { setConnecting(false); if (!net.connected) showConnectionStatus('error'); toast(message); },
    onExpired(message) { resetMenu(); toast(message); },
  });

  async function refreshNetwork() {
    if (location.protocol === 'file:') { $('#server-status').innerHTML = '<i class="offline-dot"></i>Одиночный режим'; return; }
    try {
      const response = await fetch('/api/network', { signal: AbortSignal.timeout(4000) });
      if (!response.ok) throw new Error('offline');
      const data = await response.json(); publicUrl = /^https?:\/\//.test(data.publicUrl || '') ? data.publicUrl : ''; lanAddresses = data.addresses || [];
      if (connectionStatus === 'connected') renderTransport(); else $('#server-status').innerHTML = '<i></i>Сервер на связи';
      if (room) updateShareLink();
    } catch { if (connectionStatus === 'connected') renderTransport(); else $('#server-status').innerHTML = '<i class="offline-dot"></i>Одиночный режим'; }
  }
  function shareUrl() {
    const isLocal = ['localhost', '127.0.0.1', '0.0.0.0', '[::1]'].includes(location.hostname);
    const base = isLocal && publicUrl ? publicUrl : location.href;
    try { const url = new URL(base); url.search = ''; url.searchParams.set('room', room?.code || ''); url.hash = `room=${room?.code || ''}`; return url.href; } catch { return ''; }
  }
  function updateShareLink() {
    if (!room) return;
    const link = shareUrl(); if ($('#invite-link').value !== link) $('#invite-link').value = link; $('#copy-code').textContent = room.code;
    const isLocal = ['localhost', '127.0.0.1', '0.0.0.0', '[::1]'].includes(location.hostname);
    $('#share-hint').textContent = isLocal && !publicUrl ? 'Для друга через интернет: запусти npm run share. Публичная ссылка появится здесь автоматически.' : 'Отправь ссылку другу. Он выберет бойца и войдёт в твой отряд.';
  }
  async function copyText(text, input) {
    try { await navigator.clipboard.writeText(text); toast('Скопировано — отправь другу!'); } catch {
      toast('Скопируй выделенный текст: Ctrl+C или удержание на телефоне.');
      clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.add('hidden'), 20000);
      let field = input?.value === text ? input : null;
      if (!field) { field = document.createElement('input'); field.className = 'input clipboard-input'; field.readOnly = true; field.value = text; field.setAttribute('aria-label', 'Текст для копирования'); $('#toast').appendChild(field); }
      field.focus(); field.select(); field.setSelectionRange(0, text.length);
    }
  }
  function renderLobby() {
    if (!room || screen === 'playing' && state?.status !== 'lobby') return;
    const hash = JSON.stringify(room) + localId + connectionStatus;
    if (hash === lobbyKey) return;
    lobbyKey = hash; if (screen !== 'lobby') setScreen('lobby');
    $('#lobby-map-name').textContent = `${RUN_MODES[room.runMode || 'classic'].name} · ${MAPS[room.mapId]?.name}` || room.mapId;
    $('#lobby-count').textContent = `${room.players.length} / ${MAX_PLAYERS}`;
    $('#squad-list').innerHTML = Array.from({ length: MAX_PLAYERS }, (_, i) => {
      const p = room.players[i];
      if (!p) return `<div class="squad-row empty"><span class="empty-avatar">+</span><div><strong>Место для друга</strong><small>ОЖИДАНИЕ ПОДКЛЮЧЕНИЯ</small></div><span class="slot-number">0${i + 1}</span></div>`;
      const h = HEROES[p.hero] || HEROES.ranger;
      return `<div class="squad-row" style="--hero-color:${h.color}">${avatar(p.hero, 48)}<div><strong>${safe(p.name)} ${p.id === localId ? '<span class="you-tag">ТЫ</span>' : ''}</strong><small>${safe(h.name)} ${p.id === room.owner ? ' / КОМАНДИР' : ''}</small></div><span class="ready-status ${p.connected && (p.ready || p.id === room.owner) ? 'is-ready' : ''}">${!p.connected ? 'НЕТ СВЯЗИ' : p.ready || p.id === room.owner ? '✓ ГОТОВ' : 'НЕ ГОТОВ'}</span></div>`;
    }).join('');
    const owner = room.owner === localId, me = room.players.find(p => p.id === localId), allReady = room.players.every(p => p.connected && (p.ready || p.id === room.owner));
    const action = $('#lobby-action'); action.disabled = connectionStatus !== 'connected' || (owner && !allReady); action.innerHTML = owner ? `Начать вылазку <span class="button-arrow">→</span>` : `${me?.ready ? '✓ Я готов · отменить' : 'Я готов к высадке'} <span class="button-arrow">→</span>`;
    $('#lobby-tip').textContent = owner ? allReady ? 'Отряд готов. Можно начинать — или пригласить ещё друзей.' : 'Ожидаем, пока каждый боец отметит готовность.' : me?.ready ? 'Ожидаем сигнала командира.' : 'Нажми «Я готов», когда будешь готов начать.';
    updateShareLink(); renderer.setMap?.(room.mapId);
  }
  function startSolo() {
    if (mode === 'online') net.disconnect();
    world = new World(selectedMap, Date.now(), selectedRun); localId = 'solo'; soloClock = 0; world.addPlayer(localId, nickname(), selectedHero); world.start(); mode = 'solo'; renderer.online = false; room = null; resultKey = ''; lastKills = 0;
    hideModal(); setScreen('playing'); updateState(world.snapshot()); playTone(660, 0.15);
  }
  function nickname() { const name = $('#nickname').value.trim().slice(0, 20) || 'Выживший'; save('frontier_name', name); return name; }
  function updateState(next) {
    state = next; renderer.setState(state, localId);
    if (state.status === 'lobby') {
      if (mode === 'online' && room?.phase === 'lobby') {
        const previous = new Map(room.players.map(p => [p.id, p]));
        const roster = state.players.map(p => ({ ...previous.get(p.id), id: p.id, name: p.name, hero: p.hero, connected: p.connected !== false, ready: previous.get(p.id)?.ready || false }));
        applyRoom({ ...room, mapId: state.mapId, players: roster });
      }
      if (screen !== 'lobby') setScreen('lobby');
      return;
    }
    if (screen !== 'playing') { setScreen('playing'); hideModal(); }
    renderHud();
    if (state.kills > lastKills) playTone(200 + Math.min(500, state.kills % 8 * 50));
    lastKills = state.kills;
    if (state.status === 'gameover' || state.status === 'victory') { showResult(); return; }
    const p = player();
    if (p?.options.length && !p.dead && (!modalKind || modalKind === 'upgrade')) renderUpgrades(p);
    else if (modalKind === 'upgrade') hideModal();
  }
  function renderHud() {
    const p = player(); if (!p || !state) return;
    $('#hud-name').textContent = p.name; $('#hp-value').textContent = Math.ceil(p.hp); $('#hp-max').textContent = `/ ${p.maxHp}`;
    $('#hp-fill').style.width = `${Math.max(0, p.hp / p.maxHp * 100)}%`; $('#hp-fill').classList.toggle('low', p.hp < p.maxHp * .3);
    $('#hud-level').textContent = `УР. ${p.level}`; $('#xp-fill').style.width = `${p.xp / xpRequired(p.level) * 100}%`; $('#xp-caption').textContent = `${p.xp} / ${xpRequired(p.level)} XP`;
    $('#timer-objective').textContent = !state.duration ? 'БЕСКОНЕЧНАЯ НОЧЬ' : state.time >= state.duration ? 'УНИЧТОЖЬТЕ СТРАЖА' : 'ДОЖИТЬ ДО ЭВАКУАЦИИ';
    $('#hud-duration').textContent = state.duration ? `/ ${formatTime(state.duration)}` : '/ ∞';
    const event = state.event;
    const names = { relay: 'Ретранслятор · удерживайте зону', hunt: 'Заказ · уничтожайте орду', supply: 'Припасы · откройте тайник' };
    const activity = `${event ? `<strong>${names[event.kind]}</strong><span>${Math.floor(event.progress)} / ${event.goal} · осталось ${formatTime(Math.max(0, event.endsAt - state.time))}</span><div class="activity-track"><i style="width:${Math.min(100, event.progress / event.goal * 100)}%"></i></div>${event.kind !== 'hunt' ? `<small>До цели ${Math.round(Math.hypot(p.x - event.x, p.y - event.y) / 40)} м · следуйте жёлтой метке</small>` : ''}` : `<strong>Исследуйте арену</strong><span>Заданий выполнено: ${state.completed || 0} · тайники дают улучшения</span>`}${state.notice ? `<p>${safe(state.notice)}</p>` : ''}`;
    if ($('#activity-panel').innerHTML !== activity) $('#activity-panel').innerHTML = activity;
    const node = (state.objects || []).filter(n => !n.used && n.cooldown <= 0 && Math.hypot(n.x - p.x, n.y - p.y) < 100).sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0];
    $('#interact-button').classList.toggle('hidden', !node || p.dead);
    if (node) $('#interact-button').textContent = `E · ${INTERACTABLES[node.kind].action}`;
    $('#mark-button').classList.toggle('hidden', mode !== 'online');
    $('#hud-time').textContent = formatTime(state.time); $('#hud-mode').textContent = mode === 'online' ? `ОТРЯД ${room?.code || ''} · ${ping} MS${transport === 'http' ? ' · РЕЗЕРВ' : ''}` : `${MAPS[state.mapId].name} · СОЛО`;
    $('#hud-kills').textContent = state.kills;
    const teammatesHtml = state.players.filter(other => other.id !== localId).map(other => `<div class="teammate ${other.dead ? 'is-down' : ''}"><span class="teammate-dot" style="background:${other.color}"></span><div><strong>${safe(other.name)}</strong><small>${!other.connected ? 'ВОССТАНОВЛЕНИЕ СВЯЗИ' : other.dead ? `НУЖНА ПОМОЩЬ · ${Math.floor(other.revive / 3 * 100)}%` : `${Math.ceil(other.hp)} / ${other.maxHp} HP · УР. ${other.level}`}</small><div class="teammate-hp"><i style="width:${other.hp / other.maxHp * 100}%;background:${other.color}"></i></div></div></div>`).join('');
    if ($('#teammates').innerHTML !== teammatesHtml) $('#teammates').innerHTML = teammatesHtml;
    const weaponsHtml = Object.entries(p.weapons).map(([id, level]) => `<div class="weapon-slot" title="${safe(p.evolved?.[id] ? EVOLUTIONS[id].name : WEAPONS[id]?.name)} · уровень ${level}" style="--weapon-color:${WEAPONS[id]?.color || p.color}"><span>${p.evolved?.[id] ? '✦' : WEAPONS[id]?.icon || '✦'}</span><small>УР. ${level}</small></div>`).join('');
    if ($('#weapon-slots').innerHTML !== weaponsHtml) $('#weapon-slots').innerHTML = weaponsHtml;
    const skillsHtml = Object.entries(p.upgrades).map(([id, level]) => { const u = UPGRADES.find(u => u.id === id); return `<span class="skill-chip" title="${safe(u?.name)}: ${safe(u?.description)}">${u?.icon || '✦'} ${safe(u?.name)} <b>${level}</b></span>`; }).join('');
    if ($('#skill-slots').innerHTML !== skillsHtml) $('#skill-slots').innerHTML = skillsHtml;
    $('#dash-label').textContent = p.dash > 0 ? `${p.dash.toFixed(1)} c` : 'РЫВОК'; $('#dash-button').classList.toggle('cooldown', p.dash > 0); $('#dash-fill').style.width = `${Math.max(0, 1 - p.dash / (4 / (1 + (p.upgrades.dash || 0) * .15))) * 100}%`;
    $('#dead-notice').classList.toggle('hidden', !p.dead);
    if (p.dead) $('#dead-notice').innerHTML = `<strong>БОЕЦ РАНЕН</strong><span>${mode === 'online' ? 'Союзник может поднять тебя: достаточно постоять рядом 3 секунды.' : 'Забег завершён.'}</span><div><i style="width:${p.revive / 3 * 100}%"></i></div>`;
    const bosses = state.enemies.filter(e => e.type === 'boss');
    $('#boss-bar').classList.toggle('hidden', bosses.length === 0);
    if (bosses.length) $('#boss-fill').style.width = `${bosses.reduce((s, b) => s + b.hp, 0) / bosses.reduce((s, b) => s + b.maxHp, 0) * 100}%`;
    $('#game-tip').classList.toggle('hidden', state.time > 22 || p.dead || Object.keys(p.weapons).length > 4);
  }
  function renderUpgrades(p) {
    const signature = `${p.level}:${p.pending}:${p.options.join(',')}`;
    if (upgradeKey === signature && modalKind === 'upgrade') return;
    upgradeKey = signature; upgradePending = false;
    playTone(880, 0.22, .04);
    showModal('upgrade', `<div class="modal-kicker">НОВЫЙ УРОВЕНЬ / ${p.level}</div><h2>Стань сильнее<span class="orange">.</span></h2><p class="modal-copy">Выбери одно улучшение. Оружие и навыки без лимита слотов и уровней.${p.pending > 1 ? ` Осталось выбрать: ${p.pending}.` : ''}<br>${mode === 'online' ? 'Отряд продолжает бой. Автоогонь остаётся активным.' : 'Время остановлено — выбери свой следующий шаг.'}</p><div class="upgrade-options">${p.options.map((id, i) => {
      const u = UPGRADES.find(item => item.id === id) || { id: 'heal', name: 'Полное восстановление', icon: '+', description: 'Восстановить всё здоровье', color: '#8dd3bc' };
      const current = u.type === 'weapon' ? p.weapons[id] || 0 : p.upgrades[id] || 0;
      return `<button class="upgrade-card" data-upgrade="${safe(id)}" style="--upgrade-color:${u.color}"><div><span class="upgrade-icon">${u.icon}</span><span class="upgrade-type">${u.type === 'weapon' ? current ? 'УСИЛЕНИЕ ОРУЖИЯ' : 'НОВОЕ ОРУЖИЕ' : 'УЛУЧШЕНИЕ'}</span></div><h3>${u.name}</h3><p>${u.description}${u.type === 'weapon' ? `<br><small>Эволюция: оружие V + ${UPGRADES.find(item => item.id === EVOLUTIONS[id]?.passive)?.name} III</small>` : ''}</p><footer><span>${current ? `УР. ${current} → ${current + 1}` : 'ПОЛУЧИТЬ'} · ∞</span><kbd>${i + 1}</kbd></footer></button>`;
    }).join('')}</div>`, true);
  }
  function chooseUpgrade(option) {
    if (upgradePending) return;
    upgradePending = true; clearInput();
    $('#modal').querySelectorAll('[data-upgrade]').forEach(button => { button.disabled = true; });
    if (mode === 'solo') { world.choose(localId, option); upgradeKey = ''; updateState(world.snapshot()); }
    else net.send({ type: 'upgrade', option });
  }
  function showResult() {
    const hash = `${state.status}:${Math.floor(state.time)}:${room?.owner || ''}`;
    if (resultKey === hash && modalKind === 'result') return;
    resultKey = hash;
    const won = state.status === 'victory';
    showModal('result', `<div class="modal-kicker">${won ? 'СИГНАЛ ПРИНЯТ / ЭВАКУАЦИЯ' : 'СВЯЗЬ ПРЕРВАНА / КОНЕЦ ЗАБЕГА'}</div><h2>${won ? 'Рубеж удержан' : 'До последнего'}<span class="orange">.</span></h2><p class="modal-copy">${won ? 'Вы пережили орду и остановили Стража. Отряд возвращается домой.' : 'Каждый забег — новая сборка. Перегруппируйся и попробуй снова.'}</p><div class="result-numbers"><div><strong>${formatTime(state.time)}</strong><small>ВРЕМЯ ВЫЖИВАНИЯ</small></div><div><strong>${state.kills}</strong><small>УНИЧТОЖЕНО</small></div><div><strong>${Math.max(...state.players.map(p => p.level))}</strong><small>МАКС. УРОВЕНЬ</small></div></div><div class="result-players">${state.players.map(p => `<div><strong style="color:${p.color}">${safe(p.name)}</strong><span>${p.kills} устранений · ур. ${p.level}</span></div>`).join('')}</div><button class="button primary" id="result-restart" ${mode === 'online' && room?.owner !== localId ? 'disabled' : ''}>${mode === 'online' ? room?.owner === localId ? 'Вернуться в лобби' : 'Ожидаем командира отряда' : 'Ещё один забег'} <span>→</span></button><button class="text-button modal-back" id="result-leave">Вернуться в главное меню</button>`);
    if (mode === 'solo') {
      let best; try { best = JSON.parse(read('frontier_best', 'null')); } catch { best = null; }
      if (!best || state.time > best.time) save('frontier_best', JSON.stringify({ time: Math.floor(state.time), kills: state.kills, level: player()?.level || 1, map: state.mapId }));
    }
  }
  function showHelp() {
    showModal('help', `<button class="modal-close icon-button" data-close aria-label="Закрыть">×</button><div class="modal-kicker">ПОЛЕВОЙ СПРАВОЧНИК</div><h2>Выживаем вместе<span class="orange">.</span></h2><div class="help-section"><h3>Оружие делает своё дело. Ты — своё.</h3><p>Перемещайся, обходи орду и собирай кристаллы опыта. На новом уровне выбирай оружие или улучшение. Опыт общий для отряда, а сборка у каждого своя. Выбирай вылазку на 10 минут, экспедицию на 20 минут или бесконечную ночь. В конечных режимах нужно также победить всех Стражей.</p><div class="help-keys"><span><kbd>WASD</kbd> / <kbd>↑←↓→</kbd> движение</span><span><kbd>SPACE</kbd> / <kbd>SHIFT</kbd> рывок</span><span><kbd>E</kbd> взаимодействие</span><span><kbd>Q</kbd> метка отряду</span><span><kbd>ESC</kbd> меню</span><span><kbd>1</kbd><kbd>2</kbd><kbd>3</kbd> выбор улучшения</span></div><p>На телефоне: веди пальцем по арене для движения, нажимай «Рывок». Раненого союзника можно поднять, постояв рядом 3 секунды.</p></div><div class="help-section"><h3>Каждая вылазка — новые решения</h3><p>Тайники дают улучшение каждому. Медстанции лечат отряд, турели прикрывают 25 секунд, обелиски вызывают элиту с наградой. Нажми E рядом с объектом или кнопку на экране. Выполняй задания: удержание зоны, заказ на орду и поиск припасов. Жёлтая метка показывает цель. Красные круги предупреждают об ударах — они опасны и для врагов.</p><p>Оружие V уровня эволюционирует при нужном пассивном улучшении III уровня. Рецепт указан на карточке оружия. Все 25 видов оружия и навыков можно собрать одновременно и улучшать без ограничения уровней. Для каждого следующего уровня героя требуется больше опыта. Носители распадаются на ловчих, регенераторы лечат орду, золотая обводка обозначает элиту.</p></div><div class="help-section"><h3>С другом через интернет — без VPS</h3><ol><li>В папке проекта запусти <code>npm run share</code>.</li><li>Открой публичную HTTPS-ссылку из терминала.</li><li>Нажми «Собрать отряд» и отправь другу приглашение из лобби.</li><li>Друг выбирает бойца и входит. Все отмечают готовность, командир запускает забег.</li></ol><p class="help-note">Оставь компьютер, игру и туннель включёнными. При новом запуске туннеля ссылка может измениться. Если сеть блокирует адрес туннеля, попробуй другой доступный туннель с поддержкой WebSocket.</p></div><div class="help-section"><h3>В одной Wi-Fi-сети</h3><p>Достаточно <code>npm start</code>. Друг открывает адрес твоего компьютера и входит по коду комнаты.</p><div class="lan-links">${lanAddresses.length ? lanAddresses.map(address => `<code>${safe(address)}</code>`).join('') : '<span>Адреса локальной сети появятся после запуска сервера.</span>'}</div></div><button class="button secondary" data-close>Понятно <span>→</span></button>`);
  }
  async function showScores() {
    showModal('scores', '<button class="modal-close icon-button" data-close aria-label="Закрыть">×</button><div class="modal-kicker">ЖУРНАЛ ОПЕРАЦИЙ</div><h2>Лучшие вылазки<span class="orange">.</span></h2><p class="modal-copy">Загружаем записи сервера…</p>');
    let runs = [];
    try { const response = await fetch('/api/leaderboard', { signal: AbortSignal.timeout(4000) }); if (response.ok) runs = (await response.json()).runs || []; } catch { /* Solo score still available. */ }
    if (modalKind !== 'scores') return;
    let best; try { best = JSON.parse(read('frontier_best', 'null')); } catch { best = null; }
    showModal('scores', `<button class="modal-close icon-button" data-close aria-label="Закрыть">×</button><div class="modal-kicker">ЖУРНАЛ ОПЕРАЦИЙ</div><h2>Лучшие вылазки<span class="orange">.</span></h2><p class="modal-copy">Результаты завершённых сетевых забегов на этом сервере.</p><div class="score-list">${runs.length ? runs.slice(0, 10).map((r, i) => `<div class="score-row"><b>${String(i + 1).padStart(2, '0')}</b><div><strong>${safe((r.players || []).map(p => p.name).join(', '))}</strong><small>${safe(MAPS[r.map]?.name || r.map)} · ${safe(RUN_MODES[r.runMode || 'classic']?.name || '')} ${r.victory ? ' / ПОБЕДА' : ''}</small></div><span>${formatTime(r.time)}<small>${r.kills} устранений</small></span></div>`).join('') : '<p class="empty-scores">Пока здесь тихо. Заверши первый сетевой забег — и твой отряд откроет журнал.</p>'}</div>${best ? `<div class="personal-best"><small>ТВОЙ ЛУЧШИЙ ОДИНОЧНЫЙ ЗАБЕГ</small><strong>${formatTime(best.time)} <span>· ${best.kills} устранений · ур. ${best.level}</span></strong></div>` : ''}<button class="button secondary" data-close>Назад <span>→</span></button>`);
  }
  function showPause() {
    if (screen !== 'playing' || ['result', 'upgrade'].includes(modalKind)) return;
    showModal('pause', `<div class="modal-kicker">${mode === 'online' ? 'ОТРЯД НА СВЯЗИ' : 'ПАУЗА'}</div><h2>Перевести дух<span class="orange">.</span></h2><p class="modal-copy">${mode === 'online' ? 'Сетевая игра продолжается. Твоё оружие стреляет автоматически, пока ты в меню.' : 'Время остановлено. Возвращайся, когда будешь готов.'}</p><button class="button primary" data-close>Продолжить <span>→</span></button><button class="button secondary" id="pause-sound">Звук: ${sound ? 'включён' : 'выключен'} <span>♪</span></button><button class="button secondary" id="pause-quality">Графика: ${renderer.lowQuality ? 'экономная' : 'обычная'}</button><button class="text-button modal-back" id="pause-leave">Покинуть забег</button>`);
  }
  function toggleSound() { sound = !sound; save('frontier_sound', sound ? 'on' : 'off'); $('.sound-toggle').classList.toggle('muted', !sound); $('.sound-toggle').setAttribute('aria-label', sound ? 'Выключить звук' : 'Включить звук'); if (sound) playTone(600, .12); if (modalKind === 'pause') $('#pause-sound').innerHTML = `Звук: ${sound ? 'включён' : 'выключен'} <span>♪</span>`; }

  $('#run-mode').onchange = event => { selectedRun = event.target.value; save('frontier_run', selectedRun); $('#run-description').textContent = RUN_MODES[selectedRun].description; };
  function interact() { if (screen !== 'playing' || modalKind || player()?.dead) return; if (mode === 'solo') { world.interact(localId); updateState(world.snapshot()); } else net.send({ type: 'interact' }); }
  function mark() { if (screen === 'playing' && !modalKind && mode === 'online') net.send({ type: 'ping-mark' }); }
  $('#interact-button').onclick = interact; $('#mark-button').onclick = mark;
  $('#hero-options').addEventListener('click', event => { const button = event.target.closest('[data-hero]'); if (!button) return; selectedHero = button.dataset.hero; save('frontier_hero', selectedHero); $('#hero-options').querySelectorAll('button').forEach(b => { b.classList.toggle('selected', b === button); b.setAttribute('aria-pressed', String(b === button)); }); $('#hero-description').textContent = HEROES[selectedHero].description; playTone(380, .05); });
  $('#map-options').addEventListener('click', event => { const button = event.target.closest('[data-map]'); if (!button) return; selectedMap = button.dataset.map; save('frontier_map', selectedMap); $('#map-options').querySelectorAll('button').forEach(b => { b.classList.toggle('selected', b === button); b.setAttribute('aria-pressed', String(b === button)); }); $('#map-description').textContent = MAPS[selectedMap].description; renderer.setMap?.(selectedMap); playTone(380, .05); });
  $('#create-room').onclick = () => { clearInput(); net.connect({ type: 'create', name: nickname(), hero: selectedHero, mapId: selectedMap, runMode: selectedRun }); };
  $('#join-room').onclick = () => { const code = $('#room-code').value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6); if (code.length !== 6) return toast('Введи код комнаты из шести символов. Друг найдёт его в лобби.'); clearInput(); net.connect({ type: 'join', code, name: nickname(), hero: selectedHero }); };
  $('#room-code').addEventListener('input', event => { event.target.value = event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6); });
  $('#room-code').addEventListener('keydown', event => { if (event.key === 'Enter') $('#join-room').click(); });
  $('#solo-play').onclick = startSolo; $('#lobby-leave').onclick = resetMenu; $('#connection-leave').onclick = resetMenu;
  $('#connection-retry').onclick = () => { showConnectionStatus('connecting'); net.retry(); };
  $('#lobby-action').onclick = () => { const me = room?.players.find(p => p.id === localId); net.send(room?.owner === localId ? { type: 'start' } : { type: 'ready', ready: !me?.ready }); };
  $('#copy-link').onclick = () => { updateShareLink(); copyText($('#invite-link').value, $('#invite-link')); };
  $('#copy-code').onclick = () => copyText(room?.code || '', $('#invite-link'));
  $('#invite-link').onclick = event => event.target.select();
  $('#help-open').onclick = showHelp; $('#scores-open').onclick = showScores; $('#pause-open').onclick = showPause;
  $('.sound-toggle').onclick = toggleSound; $('.sound-toggle').classList.toggle('muted', !sound);
  $('.brand').onclick = event => { event.preventDefault(); if (screen === 'menu') return; if (screen === 'playing') showPause(); else resetMenu(); };
  $('#modal-backdrop').addEventListener('click', event => {
    const target = event.target.closest('button'); if (!target) return;
    if (target.hasAttribute('data-close')) { hideModal(); if (state) updateState(state); }
    if (target.dataset.upgrade) chooseUpgrade(target.dataset.upgrade);
    if (target.id === 'result-restart') { if (mode === 'solo') startSolo(); else net.send({ type: 'restart' }); }
    if (['result-leave', 'pause-leave'].includes(target.id)) resetMenu();
    if (target.id === 'pause-sound') toggleSound();
    if (target.id === 'pause-quality') { renderer.lowQuality = !renderer.lowQuality; renderer.resize(); save('frontier_quality', renderer.lowQuality ? 'low' : 'auto'); target.textContent = `Графика: ${renderer.lowQuality ? 'экономная' : 'обычная'}`; }
  });
  $('#dash-button').addEventListener('pointerdown', event => { event.preventDefault(); dashPressed = true; playTone(320, .08); });
  window.addEventListener('keydown', event => {
    if (modalKind && event.code === 'Tab') {
      const buttons = [...$('#modal').querySelectorAll('button:not(:disabled),input:not(:disabled),a[href]')];
      if (buttons.length) {
        const current = buttons.indexOf(document.activeElement);
        if (event.shiftKey && current <= 0) { event.preventDefault(); buttons[buttons.length - 1].focus(); }
        else if (!event.shiftKey && (current === -1 || current === buttons.length - 1)) { event.preventDefault(); buttons[0].focus(); }
      }
      return;
    }
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target?.tagName)) return;
    if (event.code === 'Escape') { event.preventDefault(); if (['help', 'scores', 'pause'].includes(modalKind)) { hideModal(); if (state) updateState(state); } else showPause(); return; }
    if (event.code === 'KeyM' && !event.repeat) { toggleSound(); return; }
    if (modalKind === 'upgrade' && /^Digit[123]$/.test(event.code)) { const p = player(); if (p?.options[Number(event.code.slice(-1)) - 1]) chooseUpgrade(p.options[Number(event.code.slice(-1)) - 1]); return; }
    if (screen !== 'playing' || modalKind) return;
    if (event.code === 'KeyE' && !event.repeat) { event.preventDefault(); interact(); }
    if (event.code === 'KeyQ' && !event.repeat) { event.preventDefault(); mark(); }
    if (['Space', 'ShiftLeft', 'ShiftRight'].includes(event.code)) { event.preventDefault(); if (!event.repeat) dashPressed = true; }
    if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight'].includes(event.code)) { event.preventDefault(); keys.add(event.code); }
  });
  window.addEventListener('keyup', event => keys.delete(event.code));
  window.addEventListener('blur', clearInput);
  document.addEventListener('visibilitychange', () => { clearInput(); if (document.hidden && mode === 'solo' && screen === 'playing' && !modalKind) showPause(); });
  const canvas = $('#gameCanvas');
  canvas.addEventListener('pointerdown', event => {
    if (event.pointerType === 'mouse' || screen !== 'playing' || modalKind || player()?.dead) return;
    event.preventDefault(); stick.active = true; stick.id = event.pointerId; stick.baseX = event.clientX; stick.baseY = event.clientY; stick.x = 0; stick.y = 0;
    canvas.setPointerCapture(event.pointerId); const joystick = $('#joystick'); joystick.classList.remove('hidden'); joystick.style.left = `${event.clientX}px`; joystick.style.top = `${event.clientY}px`; joystick.firstElementChild.style.transform = 'translate(-50%, -50%)';
  });
  canvas.addEventListener('pointermove', event => { if (!stick.active || event.pointerId !== stick.id) return; const dx = event.clientX - stick.baseX, dy = event.clientY - stick.baseY, length = Math.max(48, Math.hypot(dx, dy)); stick.x = dx / length; stick.y = dy / length; $('#joystick').firstElementChild.style.transform = `translate(calc(-50% + ${stick.x * 42}px), calc(-50% + ${stick.y * 42}px))`; });
  const endStick = event => { if (event.pointerId === stick.id) { stick.active = false; stick.x = 0; stick.y = 0; $('#joystick').classList.add('hidden'); } };
  canvas.addEventListener('pointerup', endStick); canvas.addEventListener('pointercancel', endStick); canvas.addEventListener('contextmenu', event => event.preventDefault());
  function input() {
    if (screen !== 'playing' || modalKind || connectionStatus === 'reconnecting' || player()?.dead) return { x: 0, y: 0, dash: false };
    let x = Number(keys.has('KeyD') || keys.has('ArrowRight')) - Number(keys.has('KeyA') || keys.has('ArrowLeft')) + stick.x;
    let y = Number(keys.has('KeyS') || keys.has('ArrowDown')) - Number(keys.has('KeyW') || keys.has('ArrowUp')) + stick.y;
    const length = Math.max(1, Math.hypot(x, y)); x /= length; y /= length;
    const dash = dashPressed; dashPressed = false;
    return { x, y, dash };
  }
  function frame(now) {
    const dt = Math.min(.05, Math.max(0, (now - lastTime) / 1000)); lastTime = now;
    if (mode === 'solo' && world && screen === 'playing') {
      const paused = !!modalKind || !!player()?.options.length;
      if (!paused && world.status === 'playing') {
        soloClock = Math.min(.1, soloClock + dt);
        if (soloClock >= 1 / 30) {
          world.setInput(localId, input());
          while (soloClock >= 1 / 30) { world.tick(1 / 30); soloClock -= 1 / 30; }
          state = world.snapshot(); renderer.setState(state, localId);
        }
      } else soloClock = 0;
      if (now - lastHud > 100) { lastHud = now; updateState(state || world.snapshot()); }
    }
    if (mode === 'online') { inputClock += dt; if (inputClock > 1 / 30) { inputClock = 0; net.send({ type: 'input', ...input() }); } }
    renderer.render(dt);
    requestAnimationFrame(frame);
  }
  refreshNetwork(); setInterval(() => { if (screen === 'lobby' || screen === 'menu') refreshNetwork(); }, 12000);
  if (net.restore()) connectionStatus = 'reconnecting';
  if (inviteCode) { $('#room-code').focus(); toast(`Приглашение в отряд ${inviteCode}. Выбери бойца и нажми «Войти».`); }
  requestAnimationFrame(frame);
  window.__FRONTIER_READY__ = true;
  window.dispatchEvent(new Event('frontier:ready'));
  // The small public API makes manual browser checks possible without altering gameplay.
  window.frontier = { get state() { return state; }, get mode() { return mode; }, get room() { return room; }, get localId() { return localId; } };
}

try { bootstrap(); } catch (err) { console.error(err); window.dispatchEvent(new CustomEvent('frontier:boot-error', { detail: 'Не удалось запустить игру. Попробуй повторить загрузку.' })); const app = document.getElementById('app'); if (app) app.innerHTML = '<div class="no-script">Не удалось запустить игру. Обнови страницу или запусти npm start.<br><small>' + String(err.message || err).replace(/[<>&]/g, '') + '</small></div>'; }


  };

  __require('src/main.js');
})();
