/**
 * Общие константы, события и конфигурация арсенала игры.
 */

export const EVENTS = {
  // Игрок
  PLAYER_MOVED: 'player:moved',
  PLAYER_DAMAGED: 'player:damaged',
  PLAYER_HEALED: 'player:healed',
  PLAYER_DIED: 'player:died',
  PLAYER_REVIVE: 'player:revive',
  PLAYER_POINTS_CHANGED: 'player:points_changed',

  // Оружие и стрельба
  WEAPON_FIRED: 'weapon:fired',
  WEAPON_RELOAD_START: 'weapon:reload_start',
  WEAPON_RELOAD_DONE: 'weapon:reload_done',
  WEAPON_CHANGED: 'weapon:changed',
  BULLET_SPAWNED: 'bullet:spawned',
  BULLET_HIT: 'bullet:hit',

  // Враги (Зомби)
  ZOMBIE_SPAWNED: 'zombie:spawned',
  ZOMBIE_DAMAGED: 'zombie:damaged',
  ZOMBIE_KILLED: 'zombie:killed',
  ZOMBIE_ATTACK: 'zombie:attack',

  // Раунды и волны
  ROUND_START: 'round:start',
  ROUND_CLEARED: 'round:cleared',

  // Mystery Box (Сундук)
  MYSTERY_BOX_INTERACT: 'mystery_box:interact',
  MYSTERY_BOX_SPINNING: 'mystery_box:spinning',
  MYSTERY_BOX_READY: 'mystery_box:ready',
  MYSTERY_BOX_TAKEN: 'mystery_box:taken',

  // Мини-игры: Лудка (Додеп 777) и Сапёр
  LUDKA_REQUEST: 'ludka:request',
  LUDKA_OPEN: 'ludka:open',
  LUDKA_REWARD: 'ludka:reward',
  SAPER_REQUEST: 'saper:request',
  SAPER_OPEN: 'saper:open',
  DODEP_OFFER: 'dodep:offer',
  DODEP_ACTIVATED: 'dodep:activated',

  // Визуал и FX
  FX_BLOOD: 'fx:blood',
  FX_MUZZLE_FLASH: 'fx:muzzle_flash',
  FX_FLOATING_TEXT: 'fx:floating_text',

  // HUD, Интерфейс и Состояние
  HUD_PROMPT: 'hud:prompt',
  HUD_HITMARKER: 'hud:hitmarker',
  GAME_PAUSE_CHANGED: 'game:pause_changed',
  GAME_RESTART: 'game:restart'
};

export const WEAPON_CONFIGS = {
  m1911: {
    id: 'm1911',
    name: 'M1911',
    damage: 28,
    fireRate: 360,
    magSize: 8,
    reserveAmmo: 40,
    reloadTime: 1300,
    bulletSpeed: 980,
    spread: 0.04,
    automatic: false
  },
  olympia: {
    id: 'olympia',
    name: 'Olympia (Дробовик)',
    damage: 22,
    pellets: 6,
    fireRate: 580,
    magSize: 2,
    reserveAmmo: 42,
    reloadTime: 2000,
    bulletSpeed: 880,
    spread: 0.22,
    automatic: false
  },
  m14: {
    id: 'm14',
    name: 'M14 (Винтовка)',
    damage: 52,
    fireRate: 280,
    magSize: 10,
    reserveAmmo: 90,
    reloadTime: 1700,
    bulletSpeed: 1150,
    spread: 0.02,
    automatic: false
  },
  mp40: {
    id: 'mp40',
    name: 'MP40',
    damage: 34,
    fireRate: 105,
    magSize: 32,
    reserveAmmo: 192,
    reloadTime: 2000,
    bulletSpeed: 1020,
    spread: 0.08,
    automatic: true
  },
  ak47: {
    id: 'ak47',
    name: 'АК-47 «Калаш»',
    damage: 48,
    fireRate: 115,
    magSize: 30,
    reserveAmmo: 210,
    reloadTime: 1900,
    bulletSpeed: 1120,
    spread: 0.06,
    automatic: true,
    color: '#ffbb44'
  },
  minigun: {
    id: 'minigun',
    name: 'Миниган «Жнец»',
    damage: 38,
    fireRate: 60,
    magSize: 100,
    reserveAmmo: 300,
    reloadTime: 2600,
    bulletSpeed: 1150,
    spread: 0.14,
    automatic: true,
    color: '#ff9922'
  },
  raygun: {
    id: 'raygun',
    name: 'Ray Gun (Чудо-оружие)',
    damage: 300,
    fireRate: 240,
    magSize: 20,
    reserveAmmo: 160,
    reloadTime: 2300,
    bulletSpeed: 1200,
    spread: 0.01,
    splashRadius: 65,
    automatic: true,
    color: '#00ff88'
  }
};

export const GAME_SETTINGS = {
  BASE_WIDTH: 1280,
  BASE_HEIGHT: 720,
  MYSTERY_BOX_COST: 950,
  LUDKA_SPIN_COST: 450,
  DODEP_SPIN_COST: 250,
  SAPER_MID_COST: 200,
  SAPER_HIGH_COST: 400,
  POINTS: {
    HIT: 10,
    KILL: 60,
    HEADSHOT: 100,
    MELEE: 130
  }
};
