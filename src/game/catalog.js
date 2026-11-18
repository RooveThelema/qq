export const MAX_PLAYERS = 10;

export const RUN_MODES = {
  classic: { name: 'Вылазка', duration: 600, description: '10 минут · быстрый бой со Стражем' },
  expedition: { name: 'Экспедиция', duration: 1200, description: '20 минут · задания, элиты и финальная осада' },
  endless: { name: 'Бесконечная ночь', duration: 0, description: 'Без лимита · растущая сложность и рекорд' },
};
export const INTERACTABLES = {
  cache: { name: 'Тайник', icon: '▣', color: '#efbf70', action: 'Открыть · опыт и улучшение' },
  medic: { name: 'Медстанция', icon: '+', color: '#8dd3bc', action: 'Восстановить здоровье отряда' },
  turret: { name: 'Турель', icon: '⌁', color: '#8fd8ef', action: 'Активировать на 25 секунд' },
  shrine: { name: 'Обелиск риска', icon: '◇', color: '#c3b3ff', action: 'Вызвать элиту · награда за победу' },
};
export const EVOLUTIONS = {
  gun: { passive: 'damage', name: 'Штормовой калибр' }, orbit: { passive: 'armor', name: 'Стальной рой' },
  pulse: { passive: 'regen', name: 'Сердце бури' }, lightning: { passive: 'haste', name: 'Грозовая сеть' },
  rocket: { passive: 'vitality', name: 'Армагеддон' }, frost: { passive: 'magnet', name: 'Вечная мерзлота' },
  beam: { passive: 'damage', name: 'Солнечное копьё' }, mine: { passive: 'armor', name: 'Минный бастион' },
};
export const MAPS = {
  outpost: { id: 'outpost', name: 'Рубеж-09', tag: 'ЗАБРОШЕННЫЙ КОМПЛЕКС', description: 'Открытый плац, укрытия и широкие проходы.', color: '#83c9b2', ground: '#142321', grid: '#243a34', obstacle: '#344e43', width: 2800, height: 2200, seed: 91 },
  forest: { id: 'forest', name: 'Тихая чаща', tag: 'ЗАРАЖЁННЫЙ ЛЕС', description: 'Кольцевые тропы между островками леса.', color: '#b1cf77', ground: '#18251b', grid: '#293b26', obstacle: '#3e5835', width: 3000, height: 2400, seed: 304 },
  desert: { id: 'desert', name: 'Мёртвый сигнал', tag: 'ПУСТОШЬ', description: 'Большой простор и обломки старой станции.', color: '#e6b97e', ground: '#302920', grid: '#494032', obstacle: '#6c5943', width: 3200, height: 2400, seed: 77 },
};

export const HEROES = {
  ranger: { name: 'Следопыт', mark: '01', description: 'Точная стрельба · урон +20%', color: '#8dd3bc', weapon: 'gun', hp: 110, damage: 1.2, speed: 230 },
  engineer: { name: 'Инженер', mark: '02', description: 'Орбитальные дроны · броня +2', color: '#efbf70', weapon: 'orbit', hp: 120, damage: 1, speed: 215 },
  medic: { name: 'Проводник', mark: '03', description: 'Энергокольцо · восстановление HP', color: '#a5b7f2', weapon: 'pulse', hp: 100, damage: 1, speed: 235 },
  scout: { name: 'Искра', mark: '04', description: 'Криоген · быстрый сбор опыта', color: '#8fd8ef', weapon: 'frost', hp: 90, damage: 1, speed: 260 },
  sentinel: { name: 'Часовой', mark: '05', description: 'Лазер · высокий запас здоровья', color: '#ef9aa5', weapon: 'beam', hp: 145, damage: 1.05, speed: 205 },
};

export const WEAPONS = {
  beam: { name: 'Лучевой излучатель', icon: '╱', description: 'Пробивает всех врагов на линии огня', color: '#ef9aa5' },
  mine: { name: 'Минный заградитель', icon: '✺', description: 'Оставляет мины на пути преследователей', color: '#e6b97e' },
  gun: { name: 'Импульсная винтовка', icon: '⌁', description: 'Автоогонь в ближайшую цель', color: '#ffce81' },
  orbit: { name: 'Орбитальные дроны', icon: '◎', description: 'Дроны вращаются и режут орду', color: '#8dd3bc' },
  pulse: { name: 'Энергокольцо', icon: '◉', description: 'Периодическая волна вокруг героя', color: '#a5b7f2' },
  lightning: { name: 'Цепная молния', icon: 'ϟ', description: 'Разряд перескакивает между врагами', color: '#c3b3ff' },
  rocket: { name: 'Ракетная установка', icon: '↗', description: 'Самонаводящиеся ракеты со взрывом', color: '#f59175' },
  frost: { name: 'Криоген', icon: '❄', description: 'Ледяной залп замедляет врагов', color: '#8fd8ef' },
};

export const UPGRADES = [
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

export const ENEMIES = {
  splitter: { name: 'Носитель', hp: 110, speed: 54, radius: 20, damage: 16, xp: 7, color: '#d8a9d9' },
  leech: { name: 'Регенератор', hp: 95, speed: 65, radius: 17, damage: 14, xp: 8, color: '#69d8c3' },
  walker: { name: 'Заражённый', hp: 30, speed: 61, radius: 14, damage: 13, xp: 2, color: '#b2c46c' },
  runner: { name: 'Ловчий', hp: 23, speed: 125, radius: 11, damage: 10, xp: 3, color: '#e3b36f' },
  tank: { name: 'Громила', hp: 180, speed: 43, radius: 24, damage: 24, xp: 9, color: '#b997b6' },
  spitter: { name: 'Плевун', hp: 66, speed: 52, radius: 16, damage: 12, xp: 5, color: '#92cb9b' },
  charger: { name: 'Таран', hp: 85, speed: 72, radius: 18, damage: 20, xp: 6, color: '#de8372' },
  boss: { name: 'СТРАЖ РУБЕЖА', hp: 2200, speed: 48, radius: 47, damage: 28, xp: 65, color: '#ed977e' },
};

export function seededRandom(seed) {
  let n = seed >>> 0;
  return () => { n = (Math.imul(n, 1664525) + 1013904223) >>> 0; return n / 4294967296; };
}

export function makeObstacles(mapId) {
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

export function xpRequired(level) { return 25 + level * 12 + level * level * 2; }
export function formatTime(seconds) { return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`; }
