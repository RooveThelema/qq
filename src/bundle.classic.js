/* Автоматически сгенерированный classic-бандл для file:// fallback */
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

  __modules['src/core/Constants.js'] = function(__exports, __require) {
/**
 * Общие константы, события и конфигурация арсенала игры.
 */

const EVENTS = {
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

const WEAPON_CONFIGS = {
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

const GAME_SETTINGS = {
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

__exports.EVENTS = EVENTS; __exports.WEAPON_CONFIGS = WEAPON_CONFIGS; __exports.GAME_SETTINGS = GAME_SETTINGS;
  };

  __modules['src/core/Engine.js'] = function(__exports, __require) {
/**
 * Engine - Главный игровой движок: Game Loop, камера, пауза, рендер,
 * клавиатурный ввод и мобильное сенсорное управление (Touch Controls).
 */
const { EVENTS } = __require('src/core/Constants.js');
class Engine {
  constructor(canvas, bus) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.bus = bus;

    this.modules = new Map();
    this.moduleList = [];

    this.isRunning = false;
    this.isPaused = false;
    this.pauseReasons = new Set();
    this.gameTimeMs = 0;
    this.lastTime = 0;
    this.dpr = 1;

    // Состояние камеры (следит за игроком)
    this.camera = {
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
      zoom: 1.0,
      lerpSpeed: 0.1
    };

    // Состояние ввода
    this.input = {
      keys: {},
      mouse: {
        screenX: window.innerWidth / 2,
        screenY: window.innerHeight / 2,
        worldX: 0,
        worldY: 0,
        isDown: false,
        isRightDown: false
      }
    };

    // Мобильный сенсорный ввод (активируется при реальном касании холста)
    this.touch = {
      enabled: false,
      joystick: {
        active: false,
        touchId: null,
        baseX: 120,
        baseY: 0,
        curX: 120,
        curY: 0,
        radius: 54
      },
      aimTouchId: null,
      buttons: []
    };

    this.initCanvas();
    this.setupInputs();
    this.setupTouchControls();
  }

  /**
   * Игровое время в миллисекундах (не тикает во время паузы / рекламы / лудки)
   */
  now() {
    return this.gameTimeMs;
  }

  /**
   * Управление паузой с поддержкой нескольких независимых источников (реклама, лудка, меню паузы)
   */
  setPaused(paused, reason = 'manual') {
    if (paused) {
      this.pauseReasons.add(reason);
    } else {
      this.pauseReasons.delete(reason);
    }

    const nextPaused = this.pauseReasons.size > 0;
    if (nextPaused !== this.isPaused) {
      this.isPaused = nextPaused;
      if (this.isPaused) {
        this.clearInputs();
      }
      this.bus.emit(EVENTS.GAME_PAUSE_CHANGED, {
        isPaused: this.isPaused,
        reasons: Array.from(this.pauseReasons)
      });
    }
  }

  clearInputs() {
    this.input.keys = {};
    this.input.mouse.isDown = false;
    this.input.mouse.isRightDown = false;
    this.touch.joystick.active = false;
    this.touch.joystick.touchId = null;
    this.touch.joystick.curX = this.touch.joystick.baseX;
    this.touch.joystick.curY = this.touch.joystick.baseY;
    this.touch.aimTouchId = null;
    for (const btn of this.touch.buttons) {
      btn.touchId = null;
    }
  }

  initCanvas() {
    const resize = () => {
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.canvas.width = window.innerWidth * this.dpr;
      this.canvas.height = window.innerHeight * this.dpr;
      this.canvas.style.width = `${window.innerWidth}px`;
      this.canvas.style.height = `${window.innerHeight}px`;
      this.ctx.imageSmoothingEnabled = false;

      this.touch.joystick.baseY = window.innerHeight - 130;
      this.touch.joystick.curY = this.touch.joystick.baseY;
      this.updateTouchButtonsLayout();
    };
    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', () => setTimeout(resize, 100));
    resize();
  }

  updateTouchButtonsLayout() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    this.touch.buttons = [
      { id: 'fire', label: 'ОГОНЬ', key: 'virtual_fire', x: w - 90, y: h - 110, r: 42, color: '#ff3333' },
      { id: 'reload', label: 'R', key: 'r', x: w - 85, y: h - 215, r: 28, color: '#ffaa00' },
      { id: 'interact', label: 'F', key: 'f', x: w - 175, y: h - 115, r: 30, color: '#ffd700' },
      { id: 'switch', label: 'Q', key: 'q', x: w - 165, y: h - 200, r: 26, color: '#33ccff' },
      { id: 'sprint', label: 'RUN', key: 'shift', x: 230, y: h - 110, r: 28, color: '#00ff88' }
    ];
  }

  setupInputs() {
    const codeAliasMap = {
      KeyW: 'w',
      KeyA: 'a',
      KeyS: 's',
      KeyD: 'd',
      KeyR: 'r',
      KeyF: 'f',
      KeyQ: 'q',
      ShiftLeft: 'shift',
      ShiftRight: 'shift',
      Digit1: '1',
      Digit2: '2'
    };

    window.addEventListener('keydown', (e) => {
      if (this.isPaused) return;
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target?.isContentEditable) return;
      if (e.key) this.input.keys[e.key.toLowerCase()] = true;
      if (e.code) {
        this.input.keys[e.code] = true;
        this.input.keys[e.code.toLowerCase()] = true;
        const alias = codeAliasMap[e.code];
        if (alias) this.input.keys[alias] = true;
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.key) this.input.keys[e.key.toLowerCase()] = false;
      if (e.code) {
        this.input.keys[e.code] = false;
        this.input.keys[e.code.toLowerCase()] = false;
        const alias = codeAliasMap[e.code];
        if (alias) this.input.keys[alias] = false;
      }
    });

    window.addEventListener('mousemove', (e) => {
      this.input.mouse.screenX = e.clientX;
      this.input.mouse.screenY = e.clientY;
      this.updateMouseWorldCoords();
    });

    this.canvas.addEventListener('mousedown', (e) => {
      if (document.activeElement && document.activeElement !== document.body && typeof document.activeElement.blur === 'function') {
        document.activeElement.blur();
      }
      if (this.isPaused) return;
      if (e.button === 0) this.input.mouse.isDown = true;
      if (e.button === 2) this.input.mouse.isRightDown = true;
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.input.mouse.isDown = false;
      if (e.button === 2) this.input.mouse.isRightDown = false;
    });

    window.addEventListener('blur', () => {
      this.clearInputs();
    });

    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  setupTouchControls() {
    const handleTouchStart = (e) => {
      if (this.isPaused) return;
      e.preventDefault();
      this.touch.enabled = true;
      const rect = this.canvas.getBoundingClientRect();

      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        const tx = t.clientX - rect.left;
        const ty = t.clientY - rect.top;

        let hitButton = false;
        for (const btn of this.touch.buttons) {
          const dist = Math.hypot(tx - btn.x, ty - btn.y);
          if (dist <= btn.r + 10) {
            btn.touchId = t.identifier;
            this.input.keys[btn.key] = true;
            hitButton = true;
            break;
          }
        }
        if (hitButton) continue;

        if (tx < window.innerWidth * 0.45 && !this.touch.joystick.active) {
          this.touch.joystick.active = true;
          this.touch.joystick.touchId = t.identifier;
          this.touch.joystick.baseX = tx;
          this.touch.joystick.baseY = ty;
          this.touch.joystick.curX = tx;
          this.touch.joystick.curY = ty;
          continue;
        }

        if (tx >= window.innerWidth * 0.45 && this.touch.aimTouchId === null) {
          this.touch.aimTouchId = t.identifier;
          this.input.mouse.screenX = tx;
          this.input.mouse.screenY = ty;
          this.input.mouse.isDown = true;
          this.updateMouseWorldCoords();
        }
      }
    };

    const handleTouchMove = (e) => {
      if (this.isPaused) return;
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();

      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        const tx = t.clientX - rect.left;
        const ty = t.clientY - rect.top;

        if (this.touch.joystick.active && t.identifier === this.touch.joystick.touchId) {
          const dx = tx - this.touch.joystick.baseX;
          const dy = ty - this.touch.joystick.baseY;
          const dist = Math.hypot(dx, dy);
          const maxR = this.touch.joystick.radius;

          if (dist > maxR) {
            this.touch.joystick.curX = this.touch.joystick.baseX + (dx / dist) * maxR;
            this.touch.joystick.curY = this.touch.joystick.baseY + (dy / dist) * maxR;
          } else {
            this.touch.joystick.curX = tx;
            this.touch.joystick.curY = ty;
          }

          const deadZone = 12;
          this.input.keys['w'] = dy < -deadZone;
          this.input.keys['s'] = dy > deadZone;
          this.input.keys['a'] = dx < -deadZone;
          this.input.keys['d'] = dx > deadZone;
        }

        if (t.identifier === this.touch.aimTouchId) {
          this.input.mouse.screenX = tx;
          this.input.mouse.screenY = ty;
          this.updateMouseWorldCoords();
        }
      }
    };

    const handleTouchEnd = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];

        for (const btn of this.touch.buttons) {
          if (btn.touchId === t.identifier) {
            btn.touchId = null;
            this.input.keys[btn.key] = false;
          }
        }

        if (this.touch.joystick.active && t.identifier === this.touch.joystick.touchId) {
          this.touch.joystick.active = false;
          this.touch.joystick.touchId = null;
          this.touch.joystick.curX = this.touch.joystick.baseX;
          this.touch.joystick.curY = this.touch.joystick.baseY;
          this.input.keys['w'] = false;
          this.input.keys['s'] = false;
          this.input.keys['a'] = false;
          this.input.keys['d'] = false;
        }

        if (t.identifier === this.touch.aimTouchId) {
          this.touch.aimTouchId = null;
          this.input.mouse.isDown = false;
        }
      }
    };

    this.canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    this.canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });
  }

  updateMouseWorldCoords() {
    const world = this.screenToWorld(this.input.mouse.screenX, this.input.mouse.screenY);
    this.input.mouse.worldX = world.x;
    this.input.mouse.worldY = world.y;
  }

  screenToWorld(screenX, screenY) {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    return {
      x: (screenX - cx) / this.camera.zoom + this.camera.x,
      y: (screenY - cy) / this.camera.zoom + this.camera.y
    };
  }

  worldToScreen(worldX, worldY) {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    return {
      x: (worldX - this.camera.x) * this.camera.zoom + cx,
      y: (worldY - this.camera.y) * this.camera.zoom + cy
    };
  }

  registerModule(module) {
    if (!module.name) {
      throw new Error('Модуль должен иметь свойство name!');
    }
    this.modules.set(module.name, module);
    this.moduleList.push(module);
  }

  getModule(name) {
    return this.modules.get(name);
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this.loop.bind(this));
  }

  stop() {
    this.isRunning = false;
  }

  loop(currentTime) {
    if (!this.isRunning) return;

    let dt = (currentTime - this.lastTime) / 1000;
    dt = Math.min(dt, 0.1);
    this.lastTime = currentTime;

    this.update(dt);
    this.render();

    requestAnimationFrame(this.loop.bind(this));
  }

  update(dt) {
    if (!this.isPaused) {
      this.gameTimeMs += dt * 1000;
      this.camera.x += (this.camera.targetX - this.camera.x) * this.camera.lerpSpeed;
      this.camera.y += (this.camera.targetY - this.camera.y) * this.camera.lerpSpeed;
      this.updateMouseWorldCoords();
    }

    for (const mod of this.moduleList) {
      if (typeof mod.update === 'function' && (!this.isPaused || mod.alwaysUpdate)) {
        try {
          mod.update(dt);
        } catch (err) {
          console.error(`[Engine] Ошибка в update модуля ${mod.name}:`, err);
        }
      }
    }
  }

  render() {
    const ctx = this.ctx;
    const w = window.innerWidth;
    const h = window.innerHeight;

    ctx.save();
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // 1. Рендер игрового мира со смещением камеры
    ctx.save();
    const cx = w / 2;
    const cy = h / 2;
    ctx.translate(cx, cy);
    ctx.scale(this.camera.zoom, this.camera.zoom);
    ctx.translate(-this.camera.x, -this.camera.y);

    for (const mod of this.moduleList) {
      if (typeof mod.renderFloor === 'function') {
        try {
          mod.renderFloor(ctx, this.camera);
        } catch (err) {
          console.error(`[Engine] Ошибка в renderFloor модуля ${mod.name}:`, err);
        }
      }
    }

    for (const mod of this.moduleList) {
      if (typeof mod.render === 'function') {
        try {
          mod.render(ctx, this.camera);
        } catch (err) {
          console.error(`[Engine] Ошибка в render модуля ${mod.name}:`, err);
        }
      }
    }
    ctx.restore();

    // 2. Рендер UI поверх мира
    for (const mod of this.moduleList) {
      if (typeof mod.renderUI === 'function') {
        try {
          mod.renderUI(ctx, w, h);
        } catch (err) {
          console.error(`[Engine] Ошибка в renderUI модуля ${mod.name}:`, err);
        }
      }
    }

    // 3. Сенсорные элементы управления
    if (this.touch.enabled && !this.isPaused) {
      this.renderTouchControls(ctx);
    }

    ctx.restore();
  }

  renderTouchControls(ctx) {
    ctx.save();

    const joy = this.touch.joystick;
    const bx = joy.baseX;
    const by = joy.baseY;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 3;
    ctx.fillStyle = 'rgba(15, 20, 25, 0.4)';
    ctx.beginPath();
    ctx.arc(bx, by, joy.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = joy.active ? 'rgba(0, 229, 255, 0.65)' : 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(joy.curX, joy.curY, 24, 0, Math.PI * 2);
    ctx.fill();

    for (const btn of this.touch.buttons) {
      const isPressed = Boolean(btn.touchId !== null && btn.touchId !== undefined);

      ctx.fillStyle = isPressed ? btn.color : 'rgba(20, 25, 30, 0.65)';
      ctx.strokeStyle = btn.color;
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.arc(btn.x, btn.y, btn.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = isPressed ? '#000000' : '#ffffff';
      ctx.font = `bold ${Math.round(btn.r * 0.44)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(btn.label, btn.x, btn.y);
    }

    ctx.restore();
  }
}

__exports.Engine = Engine;
  };

  __modules['src/core/EventBus.js'] = function(__exports, __require) {
/**
 * EventBus - Центральная шина событий игры.
 * Позволяет модулям общаться полностью асинхронно и независимо друг от друга.
 */
class EventBus {
  constructor(debug = false) {
    this.listeners = new Map();
    this.debug = debug;
  }

  /**
   * Подписаться на событие
   * @param {string} event Название события (из Constants.EVENTS)
   * @param {Function} callback Функция-обработчик
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  /**
   * Одноразовая подписка
   */
  once(event, callback) {
    const unbind = this.on(event, (data) => {
      unbind();
      callback(data);
    });
    return unbind;
  }

  /**
   * Отписаться от события
   */
  off(event, callback) {
    if (!this.listeners.has(event)) return;
    this.listeners.get(event).delete(callback);
  }

  /**
   * Отправить событие с данными всем подписчикам
   * @param {string} event Название события
   * @param {any} data Данные события
   */
  emit(event, data) {
    if (this.debug) {
      console.log(`[EventBus] ${event}`, data);
    }
    if (!this.listeners.has(event)) return;

    for (const callback of this.listeners.get(event)) {
      try {
        callback(data);
      } catch (err) {
        console.error(`[EventBus Error] Ошибка в обработчике события '${event}':`, err);
      }
    }
  }

  /**
   * Очистить всех подписчиков
   */
  clear() {
    this.listeners.clear();
  }
}

__exports.EventBus = EventBus;
  };

  __modules['src/core/Loader.js'] = function(__exports, __require) {
/**
 * Loader - Поэтапный загрузчик модулей игры.
 */
class Loader {
  constructor(engine) {
    this.engine = engine;
    this.stages = [];

    this.overlay = document.getElementById('loader-overlay');
    this.stageTitle = document.getElementById('loading-stage');
    this.stageDetails = document.getElementById('loading-details');
    this.progressBar = document.getElementById('loading-bar');
    this.percentLabel = document.getElementById('loading-percent');
    this.consoleLog = document.getElementById('loading-log');
  }

  addStage(title, details, taskFn) {
    this.stages.push({ title, details, taskFn });
  }

  logMessage(msg) {
    if (!this.consoleLog) return;
    const line = document.createElement('div');
    const time = new Date().toTimeString().split(' ')[0];
    line.textContent = `[${time}] ${msg}`;
    this.consoleLog.appendChild(line);
    this.consoleLog.scrollTop = this.consoleLog.scrollHeight;
  }

  updateUI(percent, title, details) {
    if (this.progressBar) this.progressBar.style.width = `${percent}%`;
    if (this.percentLabel) this.percentLabel.textContent = `${Math.round(percent)}%`;
    if (this.stageTitle) this.stageTitle.textContent = title;
    if (this.stageDetails) this.stageDetails.textContent = details;
  }

  async run() {
    const total = this.stages.length;
    this.logMessage('Запуск Call of Duty: Zombies 2D...');

    for (let i = 0; i < total; i++) {
      const stage = this.stages[i];
      const startPercent = (i / total) * 100;
      const targetPercent = ((i + 1) / total) * 100;

      this.updateUI(startPercent, stage.title, stage.details);
      this.logMessage(`[${i + 1}/${total}] ${stage.title}`);

      try {
        await stage.taskFn(this.engine);
        await new Promise((r) => setTimeout(r, 40));
      } catch (err) {
        this.logMessage(`ОШИБКА: ${stage.title}: ${err.message}`);
        console.error(err);
      }

      this.updateUI(targetPercent, stage.title, 'Готово');
    }

    this.logMessage('Все системы готовы к бою.');
    this.updateUI(100, 'Готово к бою', 'Добро пожаловать в бункер...');

    await new Promise((r) => setTimeout(r, 180));

    if (this.overlay) {
      this.overlay.classList.add('hidden');
    }

    this.engine.start();
  }
}

__exports.Loader = Loader;
  };

  __modules['src/modules/map/MapModule.js'] = function(__exports, __require) {
/**
 * MapModule - Бункер Nacht der Untoten: стены, коллизии, открываемые завалы,
 * настенное оружие, точки спавна зомби, терминалы Лудки/Сапёра и сеточная BFS-навигация.
 */
const { EVENTS } = __require('src/core/Constants.js');
class MapModule {
  constructor() {
    this.name = 'map';
    this.engine = null;

    this.width = 2800;
    this.height = 2000;
    this.minX = -1400;
    this.minY = -1000;

    // Параметры навигационной сетки для BFS flow-field
    this.cellSize = 20;
    this.gridCols = Math.floor(this.width / this.cellSize);  // 140
    this.gridRows = Math.floor(this.height / this.cellSize); // 100
    this.walkableGrid = new Uint8Array(this.gridCols * this.gridRows);
    this.distGrid = new Int16Array(this.gridCols * this.gridRows);
    this.distGrid.fill(-1);
    this.lastFlowTargetCell = -1;
    this.flowDirty = true;

    this.baseWalls = [
      // Внешние стены по периметру (2800x2000)
      { x: -1400, y: -1000, w: 2800, h: 40 },
      { x: -1400, y: 960, w: 2800, h: 40 },
      { x: -1400, y: -1000, w: 40, h: 2000 },
      { x: 1360, y: -1000, w: 40, h: 2000 },

      // Верхняя перегородка: вход в Северный Реактор / Био-Лабораторию (y = -480)
      { x: -1360, y: -480, w: 500, h: 30 },
      { x: -720, y: -480, w: 780, h: 30 },
      { x: 200, y: -480, w: 700, h: 30 },
      { x: 1040, y: -480, w: 320, h: 30 },

      // Нижняя перегородка: вход в Южный Казино-Сейф / Зал Лудки (y = 450)
      { x: -1360, y: 450, w: 500, h: 30 },
      { x: -720, y: 450, w: 780, h: 30 },
      { x: 200, y: 450, w: 700, h: 30 },
      { x: 1040, y: 450, w: 320, h: 30 },

      // Перегородка: Стартовый Бункер <-> Центральный Арсенал (x = -240)
      { x: -240, y: -450, w: 30, h: 360 },
      { x: -240, y: 90, w: 30, h: 360 },

      // Перегородка: Центральный Арсенал <-> Восточный Ангар (x = 560)
      { x: 560, y: -450, w: 30, h: 360 },
      { x: 560, y: 90, w: 30, h: 360 },

      // Перемычка внутри Северной Лаборатории
      { x: -10, y: -960, w: 30, h: 280 },
      // Перемычка внутри Южного Зала Лудки
      { x: -10, y: 680, w: 30, h: 280 },

      // Колонны Стартового Бункера
      { x: -1020, y: -250, w: 90, h: 90 },
      { x: -1020, y: 160, w: 90, h: 90 },
      { x: -580, y: -45, w: 90, h: 90 },

      // Колонны Центрального Арсенала
      { x: 20, y: -240, w: 85, h: 85 },
      { x: 280, y: 155, w: 85, h: 85 },

      // Грузовые блоки Восточного Ангара
      { x: 840, y: -260, w: 140, h: 80 },
      { x: 840, y: 180, w: 140, h: 80 },
      { x: 1100, y: -45, w: 90, h: 90 },

      // Реакторные ядра Северного крыла
      { x: -820, y: -790, w: 100, h: 100 },
      { x: -320, y: -790, w: 100, h: 100 },
      { x: 380, y: -790, w: 100, h: 100 },
      { x: 960, y: -790, w: 100, h: 100 },

      // Колонны Сейфа в Южном крыле
      { x: -820, y: 660, w: 100, h: 100 },
      { x: -320, y: 660, w: 100, h: 100 },
      { x: 380, y: 660, w: 100, h: 100 },
      { x: 960, y: 660, w: 100, h: 100 }
    ];

    this.doors = [
      {
        id: 'door_arsenal',
        name: 'Проход в Арсенал',
        cost: 750,
        x: -240,
        y: -90,
        w: 30,
        h: 180,
        isOpen: false
      },
      {
        id: 'door_north_spawn',
        name: 'Северный Реактор',
        cost: 750,
        x: -860,
        y: -480,
        w: 140,
        h: 30,
        isOpen: false
      },
      {
        id: 'door_south_spawn',
        name: 'Зал Лудки 777',
        cost: 750,
        x: -860,
        y: 450,
        w: 140,
        h: 30,
        isOpen: false
      },
      {
        id: 'door_east_hangar',
        name: 'Восточный Ангар',
        cost: 1000,
        x: 560,
        y: -90,
        w: 30,
        h: 180,
        isOpen: false
      },
      {
        id: 'door_north_arsenal',
        name: 'Шлюз Лаборатории',
        cost: 900,
        x: 60,
        y: -480,
        w: 140,
        h: 30,
        isOpen: false
      },
      {
        id: 'door_south_casino',
        name: 'Южный Шлюз Сейфа',
        cost: 900,
        x: 60,
        y: 450,
        w: 140,
        h: 30,
        isOpen: false
      },
      {
        id: 'door_north_hangar',
        name: 'Спуск в Ангар (Сев.)',
        cost: 1000,
        x: 900,
        y: -480,
        w: 140,
        h: 30,
        isOpen: false
      },
      {
        id: 'door_south_hangar',
        name: 'Спуск в Ангар (Юж.)',
        cost: 1000,
        x: 900,
        y: 450,
        w: 140,
        h: 30,
        isOpen: false
      }
    ];

    // 20 окон и проломов спавна зомби по всему периметру большого бункера
    this.spawnPoints = [
      // Стартовый бункер (доступны с 1-го раунда!)
      { x: -1335, y: -330, wallSide: 'left', zone: 'spawn', name: 'Западное окно #1' },
      { x: -1335, y: -110, wallSide: 'left', zone: 'spawn', name: 'Западное окно #2' },
      { x: -1335, y: 110, wallSide: 'left', zone: 'spawn', name: 'Западное окно #3' },
      { x: -1335, y: 330, wallSide: 'left', zone: 'spawn', name: 'Западное окно #4' },

      // Северный Реактор / Лаборатория
      { x: -1335, y: -720, wallSide: 'left', zone: 'north_lab', name: 'СЗ угол лаборатории' },
      { x: -1080, y: -935, wallSide: 'top', zone: 'north_lab', name: 'Северный пролом #1' },
      { x: -560, y: -935, wallSide: 'top', zone: 'north_lab', name: 'Северный пролом #2' },
      { x: 180, y: -935, wallSide: 'top', zone: 'north_lab', name: 'Северный пролом #3' },
      { x: 700, y: -935, wallSide: 'top', zone: 'north_lab', name: 'Северный пролом #4' },
      { x: 1160, y: -935, wallSide: 'top', zone: 'north_lab', name: 'Северный пролом #5' },

      // Южный Зал Лудки
      { x: -1335, y: 720, wallSide: 'left', zone: 'south_casino', name: 'ЮЗ угол зала лудки' },
      { x: -1080, y: 935, wallSide: 'bottom', zone: 'south_casino', name: 'Южный пролом #1' },
      { x: -560, y: 935, wallSide: 'bottom', zone: 'south_casino', name: 'Южный пролом #2' },
      { x: 180, y: 935, wallSide: 'bottom', zone: 'south_casino', name: 'Южный пролом #3' },
      { x: 700, y: 935, wallSide: 'bottom', zone: 'south_casino', name: 'Южный пролом #4' },
      { x: 1160, y: 935, wallSide: 'bottom', zone: 'south_casino', name: 'Южный пролом #5' },

      // Восточный Ангар
      { x: 1335, y: -720, wallSide: 'right', zone: 'hangar', name: 'СВ шлюз' },
      { x: 1335, y: -220, wallSide: 'right', zone: 'hangar', name: 'Восточные ворота (Сев.)' },
      { x: 1335, y: 220, wallSide: 'right', zone: 'hangar', name: 'Восточные ворота (Юж.)' },
      { x: 1335, y: 720, wallSide: 'right', zone: 'hangar', name: 'ЮВ шлюз' }
    ];

    // Точки Mystery Box по разным крыльям
    this.boxSpawnLocations = [
      { x: 130, y: -400, w: 90, h: 45, name: 'Центральный Арсенал' },
      { x: 1140, y: -380, w: 90, h: 45, name: 'Восточный Ангар' },
      { x: -560, y: -910, w: 90, h: 45, name: 'Северный Реактор' },
      { x: 560, y: 860, w: 90, h: 45, name: 'Южный Казино-Сейф' },
      { x: -1200, y: -410, w: 90, h: 45, name: 'Уголок стартового бункера' }
    ];
    this.mysteryBoxPos = { ...this.boxSpawnLocations[0] };

    // Терминалы Лудки 777 в каждом крупном крыле
    this.ludkaTerminals = [
      { id: 'terminal_spawn', name: 'ТЕРМИНАЛ ЛУДКИ', x: -560, y: -420, w: 68, h: 36 },
      { id: 'terminal_arsenal', name: 'ТЕРМИНАЛ ЛУДКИ', x: 160, y: 380, w: 68, h: 36 },
      { id: 'terminal_north', name: 'ТЕРМИНАЛ ЛУДКИ', x: 640, y: -920, w: 68, h: 36 },
      { id: 'terminal_casino', name: 'ТЕРМИНАЛ ЛУДКИ', x: -520, y: 880, w: 68, h: 36 }
    ];
    this.memeTerminals = this.ludkaTerminals;

    // Терминалы Сапёра (Минное поле)
    this.saperTerminals = [
      { id: 'saper_spawn', name: 'ТЕРМИНАЛ САПЁРА', x: -560, y: 380, w: 68, h: 36 },
      { id: 'saper_arsenal', name: 'ТЕРМИНАЛ САПЁРА', x: -120, y: -420, w: 68, h: 36 },
      { id: 'saper_casino', name: 'ТЕРМИНАЛ САПЁРА', x: 160, y: 880, w: 68, h: 36 }
    ];

    // Настенное оружие (Wall Buys)
    this.wallBuys = [
      {
        weaponId: 'olympia',
        name: 'Olympia (Дробовик)',
        cost: 500,
        ammoCost: 250,
        x: -1345,
        y: -220,
        w: 15,
        h: 70
      },
      {
        weaponId: 'm14',
        name: 'M14 (Винтовка)',
        cost: 500,
        ammoCost: 250,
        x: -1345,
        y: 220,
        w: 15,
        h: 70
      },
      {
        weaponId: 'mp40',
        name: 'MP40 (Автомат)',
        cost: 1000,
        ammoCost: 500,
        x: 340,
        y: -435,
        w: 70,
        h: 15
      },
      {
        weaponId: 'ak47',
        name: 'АК-47 «Калаш»',
        cost: 1600,
        ammoCost: 800,
        x: 1345,
        y: 0,
        w: 15,
        h: 70
      }
    ];

    this.ambientDecals = [
      { x: -920, y: -180, r: 46, color: 'rgba(70, 10, 10, 0.4)' },
      { x: -720, y: 140, r: 62, color: 'rgba(55, 8, 8, 0.45)' },
      { x: 150, y: -110, r: 54, color: 'rgba(65, 12, 12, 0.35)' },
      { x: 950, y: -80, r: 50, color: 'rgba(50, 5, 5, 0.38)' },
      { x: -450, y: -700, r: 45, color: 'rgba(20, 90, 40, 0.25)' },
      { x: 250, y: 740, r: 55, color: 'rgba(60, 10, 10, 0.38)' }
    ];

    this.rebuildWalls();
  }

  init(engine) {
    this.engine = engine;
    this.rebuildWalls();

    engine.bus.on(EVENTS.GAME_RESTART, () => {
      this.reset();
    });
  }

  reset() {
    for (const door of this.doors) {
      door.isOpen = false;
    }
    this.mysteryBoxPos = { ...this.boxSpawnLocations[0] };
    this.rebuildWalls();
  }

  rebuildWalls() {
    this.walls = [...this.baseWalls];
    for (const door of this.doors) {
      if (!door.isOpen) {
        this.walls.push({ x: door.x, y: door.y, w: door.w, h: door.h });
      }
    }
    this.buildCollisionGrid();
  }

  buildCollisionGrid() {
    const cs = this.cellSize;
    const cols = this.gridCols;
    const rows = this.gridRows;

    for (let r = 0; r < rows; r++) {
      const cy = this.minY + r * cs + cs * 0.5;
      for (let c = 0; c < cols; c++) {
        const cx = this.minX + c * cs + cs * 0.5;
        this.walkableGrid[r * cols + c] = this.checkCollision(cx, cy, 14) ? 0 : 1;
      }
    }

    this.flowDirty = true;
    this.lastFlowTargetCell = -1;
  }

  worldToCell(x, y) {
    const col = Math.max(0, Math.min(this.gridCols - 1, Math.floor((x - this.minX) / this.cellSize)));
    const row = Math.max(0, Math.min(this.gridRows - 1, Math.floor((y - this.minY) / this.cellSize)));
    return { col, row, idx: row * this.gridCols + col };
  }

  /**
   * Построение BFS flow-field от позиции игрока. Гарантирует обход колонн, стен и поиск открытых дверей.
   */
  ensureFlowField(targetX, targetY) {
    const targetCell = this.worldToCell(targetX, targetY);
    if (!this.flowDirty && targetCell.idx === this.lastFlowTargetCell) {
      return;
    }

    this.flowDirty = false;
    this.lastFlowTargetCell = targetCell.idx;
    this.distGrid.fill(-1);

    // Если игрок чуть задел непроходимую ячейку края, ищем ближайшую проходимую
    let startIdx = targetCell.idx;
    if (!this.walkableGrid[startIdx]) {
      const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]];
      for (const [dc, dr] of dirs) {
        const nc = targetCell.col + dc;
        const nr = targetCell.row + dr;
        if (nc >= 0 && nc < this.gridCols && nr >= 0 && nr < this.gridRows) {
          const nIdx = nr * this.gridCols + nc;
          if (this.walkableGrid[nIdx]) {
            startIdx = nIdx;
            break;
          }
        }
      }
    }

    if (!this.walkableGrid[startIdx]) return;

    const queue = new Int32Array(this.gridCols * this.gridRows);
    let head = 0;
    let tail = 0;

    this.distGrid[startIdx] = 0;
    queue[tail++] = startIdx;

    const cols = this.gridCols;
    const rows = this.gridRows;

    while (head < tail) {
      const cur = queue[head++];
      const curDist = this.distGrid[cur];
      const r = Math.floor(cur / cols);
      const c = cur % cols;

      // 4-связные соседи для точных расстояний без прорезания углов стен
      if (c > 0) {
        const ni = cur - 1;
        if (this.walkableGrid[ni] && this.distGrid[ni] === -1) {
          this.distGrid[ni] = curDist + 1;
          queue[tail++] = ni;
        }
      }
      if (c + 1 < cols) {
        const ni = cur + 1;
        if (this.walkableGrid[ni] && this.distGrid[ni] === -1) {
          this.distGrid[ni] = curDist + 1;
          queue[tail++] = ni;
        }
      }
      if (r > 0) {
        const ni = cur - cols;
        if (this.walkableGrid[ni] && this.distGrid[ni] === -1) {
          this.distGrid[ni] = curDist + 1;
          queue[tail++] = ni;
        }
      }
      if (r + 1 < rows) {
        const ni = cur + cols;
        if (this.walkableGrid[ni] && this.distGrid[ni] === -1) {
          this.distGrid[ni] = curDist + 1;
          queue[tail++] = ni;
        }
      }
    }
  }

  /**
   * Проверяет, достижима ли точка (x, y) от текущей цели (игрока) через открытые проходы.
   */
  isReachable(x, y, targetX, targetY) {
    this.ensureFlowField(targetX, targetY);
    const cell = this.worldToCell(x, y);
    if (this.distGrid[cell.idx] >= 0) return true;

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nc = cell.col + dc;
        const nr = cell.row + dr;
        if (nc >= 0 && nc < this.gridCols && nr >= 0 && nr < this.gridRows) {
          if (this.distGrid[nr * this.gridCols + nc] >= 0) return true;
        }
      }
    }
    return false;
  }

  /**
   * Проверка прямой видимости между двумя точками без стен на пути.
   */
  hasLineOfSight(x1, y1, x2, y2, radius = 14) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.hypot(dx, dy);
    if (dist < 1) return true;

    const step = 16;
    const steps = Math.ceil(dist / step);
    const sx = dx / steps;
    const sy = dy / steps;

    for (let i = 1; i < steps; i++) {
      if (this.checkCollision(x1 + sx * i, y1 + sy * i, radius)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Возвращает нормализованный вектор движения к игроку с обходом стен и колонн.
   */
  getFlowDirection(x, y, targetX, targetY) {
    const dx = targetX - x;
    const dy = targetY - y;
    const dist = Math.hypot(dx, dy);
    if (dist < 1) return { x: 0, y: 0 };

    if (this.hasLineOfSight(x, y, targetX, targetY, 14)) {
      return { x: dx / dist, y: dy / dist };
    }

    this.ensureFlowField(targetX, targetY);
    const cell = this.worldToCell(x, y);
    const cols = this.gridCols;
    const rows = this.gridRows;

    let bestDist = Infinity;
    let bestCol = cell.col;
    let bestRow = cell.row;

    // Если текущая ячейка невалидна, ищем ближайшую достижимую
    const curD = this.distGrid[cell.idx];
    if (curD >= 0) {
      bestDist = curD;
    }

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dc === 0 && dr === 0) continue;
        const nc = cell.col + dc;
        const nr = cell.row + dr;
        if (nc < 0 || nc >= cols || nr < 0 || nr >= rows) continue;

        const nIdx = nr * cols + nc;
        const nDist = this.distGrid[nIdx];
        if (nDist < 0) continue;

        // Запрещаем срезать угол по диагонали через стену
        if (dc !== 0 && dr !== 0) {
          const adj1 = this.walkableGrid[cell.row * cols + nc];
          const adj2 = this.walkableGrid[nr * cols + cell.col];
          if (!adj1 || !adj2) continue;
        }

        if (nDist < bestDist) {
          bestDist = nDist;
          bestCol = nc;
          bestRow = nr;
        }
      }
    }

    if (bestCol === cell.col && bestRow === cell.row) {
      return { x: dx / dist, y: dy / dist };
    }

    const wx = this.minX + bestCol * this.cellSize + this.cellSize * 0.5;
    const wy = this.minY + bestRow * this.cellSize + this.cellSize * 0.5;
    const vx = wx - x;
    const vy = wy - y;
    const vLen = Math.hypot(vx, vy) || 1;
    return { x: vx / vLen, y: vy / vLen };
  }

  openDoor(doorId) {
    const door = this.doors.find(d => d.id === doorId);
    if (!door || door.isOpen) return false;

    door.isOpen = true;
    const multiplayer = this.engine?.getModule('multiplayer');
    if (multiplayer?.room && !multiplayer.isHost) multiplayer.send({type:'door', id:doorId});
    this.rebuildWalls();

    const bus = this.engine?.bus;
    if (bus) {
      bus.emit(EVENTS.FX_BLOOD, { x: door.x + door.w / 2, y: door.y + door.h / 2, count: 2 });
      bus.emit('hud:prompt', null);
    }
    const visuals = this.engine?.getModule('visuals');
    if (visuals) {
      visuals.addFloatingText(`${door.name.toUpperCase()} ОТКРЫТО!`, door.x, door.y + door.h / 2, '#66ff66', 1.4);
      visuals.addScreenShake(6.0, 0.3);
      visuals.playSfx('boxReady');
    }

    return true;
  }

  /**
   * Проверка столкновения круглой сущности со стенами и завалами
   */
  checkCollision(x, y, radius) {
    for (const wall of this.walls) {
      const closestX = Math.max(wall.x, Math.min(x, wall.x + wall.w));
      const closestY = Math.max(wall.y, Math.min(y, wall.y + wall.h));

      const dx = x - closestX;
      const dy = y - closestY;
      if (dx * dx + dy * dy < radius * radius) {
        return true;
      }
    }
    return false;
  }

  render(ctx) {
    ctx.save();

    // 1. Пол бункера (бетонные плиты)
    ctx.fillStyle = '#14171a';
    ctx.fillRect(this.minX, this.minY, this.width, this.height);

    ctx.strokeStyle = '#1d2126';
    ctx.lineWidth = 2;
    const tileSize = 80;
    const maxX = this.minX + this.width;
    const maxY = this.minY + this.height;
    ctx.beginPath();
    for (let x = this.minX; x <= maxX; x += tileSize) {
      ctx.moveTo(x, this.minY);
      ctx.lineTo(x, maxY);
    }
    for (let y = this.minY; y <= maxY; y += tileSize) {
      ctx.moveTo(this.minX, y);
      ctx.lineTo(maxX, y);
    }
    ctx.stroke();

    // Разметка зон на полу
    ctx.fillStyle = 'rgba(255, 255, 255, 0.045)';
    ctx.font = '900 44px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SPAWN BUNKER', -800, 15);
    ctx.fillText('ARSENAL & BOX', 160, 15);
    ctx.fillText('EAST HANGAR', 960, 15);
    ctx.fillText('NORTH REACTOR', 0, -720);
    ctx.fillText('CASINO VAULT 777', 0, 740);

    // 2. Засохшие пятна крови на полу
    for (const d of this.ambientDecals) {
      ctx.fillStyle = d.color;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Меловые контуры настенного оружия (Wall Buys)
    for (const wb of this.wallBuys) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(wb.x - wb.w / 2, wb.y - wb.h / 2, wb.w, wb.h);
      ctx.setLineDash([]);

      ctx.fillStyle = 'rgba(255, 235, 150, 0.85)';
      ctx.font = 'bold 11px monospace';
      if (wb.w > wb.h) {
        ctx.textAlign = 'center';
        ctx.fillText(`${wb.name.split(' ')[0]} [${wb.cost}]`, wb.x, wb.y + (wb.y < 0 ? 24 : -18));
      } else {
        ctx.textAlign = wb.x < 0 ? 'left' : 'right';
        ctx.fillText(`${wb.name.split(' ')[0]} [${wb.cost}]`, wb.x < 0 ? wb.x + 18 : wb.x - 18, wb.y + 4);
      }
    }

    // 4. Стены и колонны
    for (const wall of this.baseWalls) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.fillRect(wall.x + 8, wall.y + 8, wall.w, wall.h);

      ctx.fillStyle = '#2c3138';
      ctx.fillRect(wall.x, wall.y, wall.w, wall.h);

      ctx.fillStyle = '#424954';
      ctx.fillRect(wall.x, wall.y, wall.w, 4);
      ctx.fillRect(wall.x, wall.y, 4, wall.h);

      ctx.strokeStyle = '#181b1f';
      ctx.lineWidth = 2;
      ctx.strokeRect(wall.x, wall.y, wall.w, wall.h);
    }

    // 5. Двери / завалы
    for (const door of this.doors) {
      const horiz = door.w > door.h;
      if (door.isOpen) {
        ctx.fillStyle = 'rgba(40, 30, 20, 0.4)';
        ctx.fillRect(door.x - (horiz ? 0 : 10), door.y - (horiz ? 10 : 0), door.w + (horiz ? 0 : 20), door.h + (horiz ? 20 : 0));
        ctx.strokeStyle = 'rgba(100, 80, 50, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(door.x - (horiz ? 0 : 10), door.y - (horiz ? 10 : 0), door.w + (horiz ? 0 : 20), door.h + (horiz ? 20 : 0));
      } else {
        ctx.fillStyle = '#4a3319';
        ctx.fillRect(door.x, door.y, door.w, door.h);

        ctx.strokeStyle = '#2b1d0c';
        ctx.lineWidth = 3;
        if (horiz) {
          for (let dx = 0; dx < door.w; dx += 24) {
            ctx.strokeRect(door.x + dx + 2, door.y + 2, 20, door.h - 4);
          }
        } else {
          for (let dy = 0; dy < door.h; dy += 24) {
            ctx.strokeRect(door.x + 2, door.y + dy + 2, door.w - 4, 20);
          }
        }

        ctx.strokeStyle = '#e6b800';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(door.x, door.y);
        ctx.lineTo(door.x + door.w, door.y + door.h);
        ctx.moveTo(door.x, door.y + door.h);
        ctx.lineTo(door.x + door.w, door.y);
        ctx.stroke();

        const cx = door.x + door.w / 2;
        const cy = door.y + door.h / 2;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.88)';
        ctx.fillRect(cx - 50, cy - 12, 100, 24);
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(cx - 50, cy - 12, 100, 24);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`[F] ${door.cost}`, cx, cy + 5);
      }
    }

    // 6. Окна спавна на стенах периметра
    for (const sp of this.spawnPoints) {
      let wx = sp.x;
      let wy = sp.y;
      let ww = 44;
      let wh = 24;

      if (sp.wallSide === 'left') {
        wx = this.minX + 22;
        wy = sp.y - 26;
        ww = 26;
        wh = 52;
      } else if (sp.wallSide === 'right') {
        wx = this.minX + this.width - 48;
        wy = sp.y - 26;
        ww = 26;
        wh = 52;
      } else if (sp.wallSide === 'top') {
        wx = sp.x - 26;
        wy = this.minY + 22;
        ww = 52;
        wh = 26;
      } else if (sp.wallSide === 'bottom') {
        wx = sp.x - 26;
        wy = this.minY + this.height - 48;
        ww = 52;
        wh = 26;
      }

      // Темный проем в стене
      ctx.fillStyle = '#060708';
      ctx.fillRect(wx, wy, ww, wh);
      ctx.strokeStyle = '#5a3a1e';
      ctx.lineWidth = 3;
      ctx.strokeRect(wx, wy, ww, wh);

      // Доски баррикады
      ctx.strokeStyle = '#734a26';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(wx + 2, wy + 4);
      ctx.lineTo(wx + ww - 2, wy + wh - 4);
      ctx.moveTo(wx + 2, wy + wh - 4);
      ctx.lineTo(wx + ww - 2, wy + 4);
      ctx.stroke();

      // Красное свечение пролома
      ctx.fillStyle = 'rgba(255, 30, 30, 0.22)';
      ctx.beginPath();
      ctx.arc(wx + ww / 2, wy + wh / 2, 26, 0, Math.PI * 2);
      ctx.fill();
    }

    // 7. Терминалы Лудки и Сапёра
    const pulse = 0.65 + Math.sin(performance.now() * 0.005) * 0.35;
    for (const term of this.ludkaTerminals) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.fillRect(term.x + 4, term.y + 4, term.w, term.h);

      ctx.fillStyle = '#14161a';
      ctx.strokeStyle = `rgba(200, 155, 60, ${pulse})`;
      ctx.lineWidth = 2;
      ctx.fillRect(term.x, term.y, term.w, term.h);
      ctx.strokeRect(term.x, term.y, term.w, term.h);

      ctx.fillStyle = `rgba(140, 29, 29, ${0.22 + pulse * 0.16})`;
      ctx.fillRect(term.x + 6, term.y + 6, term.w - 12, term.h - 12);

      ctx.fillStyle = '#e0b858';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('ЛУДКА', term.x + term.w / 2, term.y + 22);
    }

    for (const term of this.saperTerminals) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.fillRect(term.x + 4, term.y + 4, term.w, term.h);

      ctx.fillStyle = '#111914';
      ctx.strokeStyle = `rgba(94, 168, 100, ${pulse})`;
      ctx.lineWidth = 2;
      ctx.fillRect(term.x, term.y, term.w, term.h);
      ctx.strokeRect(term.x, term.y, term.w, term.h);

      ctx.fillStyle = `rgba(42, 110, 56, ${0.22 + pulse * 0.16})`;
      ctx.fillRect(term.x + 6, term.y + 6, term.w - 12, term.h - 12);

      ctx.fillStyle = '#9fe0a6';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('САПЁР', term.x + term.w / 2, term.y + 22);
    }

    // 8. Подсветка зоны Mystery Box
    const box = this.mysteryBoxPos;
    ctx.strokeStyle = 'rgba(100, 200, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 6]);
    ctx.strokeRect(box.x - 15, box.y - 15, box.w + 30, box.h + 30);
    ctx.setLineDash([]);

    ctx.restore();
  }
}

__exports.MapModule = MapModule;
  };

  __modules['src/modules/player/PlayerModule.js'] = function(__exports, __require) {
/**
 * PlayerModule - Контроллер персонажа, стрельба с сабстепами без туннелирования,
 * арсенал, стамина, регенерация HP, взаимодействие с окружением и очки.
 */
const { EVENTS, WEAPON_CONFIGS, GAME_SETTINGS } = __require('src/core/Constants.js');
class PlayerModule {
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

__exports.PlayerModule = PlayerModule;
  };

  __modules['src/modules/mystery_box/MysteryBoxModule.js'] = function(__exports, __require) {
/**
 * MysteryBoxModule - Таинственный сундук за очки (950).
 * Рулетка случайного оружия, луч света, выпадение плюшевого мишки (Teddy Bear)
 * со зловещим смехом и перемещением ящика по бункеру.
 */
const { EVENTS, WEAPON_CONFIGS, GAME_SETTINGS } = __require('src/core/Constants.js');
class MysteryBoxModule {
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

__exports.MysteryBoxModule = MysteryBoxModule;
  };

  __modules['src/modules/zombies/ZombiesModule.js'] = function(__exports, __require) {
/**
 * ZombiesModule - Расширенная орда (13 типов врагов), снаряды, лужи кислоты,
 * взрывы камикадзе, щиты, призыв некроманта, волны, безопасный спавн и бонусы.
 */
const { EVENTS, GAME_SETTINGS } = __require('src/core/Constants.js');
const ZOMBIE_TYPES = {
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

class ZombiesModule {
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

__exports.ZOMBIE_TYPES = ZOMBIE_TYPES; __exports.ZombiesModule = ZombiesModule;
  };

  __modules['src/modules/visuals/VisualsModule.js'] = function(__exports, __require) {
/**
 * VisualsModule - Визуальные эффекты, частицы, декали крови на полу,
 * гильзы, плазменные взрывы Ray Gun, освещение бункера и процедурный звук.
 */
const { EVENTS } = __require('src/core/Constants.js');
class VisualsModule {
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

__exports.VisualsModule = VisualsModule;
  };

  __modules['src/modules/hud/HudAudio.js'] = function(__exports, __require) {
/** Мягкие синтезированные звуковые подсказки. */
class HudAudio {
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

__exports.HudAudio = HudAudio;
  };

  __modules['src/modules/hud/ChalkRenderer.js'] = function(__exports, __require) {
/**
 * ChalkRenderer - Процедурная отрисовка культовых меловых черточек (Tally Marks)
 * в стиле Call of Duty: Zombies (Nacht der Untoten / Kino der Toten).
 *
 * Логика отображения:
 * - Раунды 1-4: Вертикальные меловые штрихи (I, II, III, IIII)
 * - Раунд 5: 4 вертикальных штриха + диагональное перечеркивание (Bundled 5)
 * - Раунды 6-9: Связка из 5 + оставшиеся штрихи (1..4)
 * - Раунд 10: Две полные перечеркнутые связки (5 + 5)
 * - Раунд 11+: Кровавое число с подтеками + микро-черточки или римские цифры
 */

class ChalkRenderer {
  /**
   * Отрисовка черточек раунда
   * @param {CanvasRenderingContext2D} ctx 
   * @param {number} x Координата X
   * @param {number} y Координата Y (базовая линия)
   * @param {number} round Номер раунда
   * @param {number} scale Масштаб
   * @param {number} alpha Прозрачность
   * @param {string} color Цвет черточек (по умолчанию кроваво-красный)
   */
  static drawRoundTallies(ctx, x, y, round, scale = 1.0, alpha = 1.0, color = '#ff2b2b') {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

    // Свечение крови / раскаленного мела
    ctx.shadowColor = '#800000';
    ctx.shadowBlur = 10 * scale;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const strokeHeight = 44 * scale;
    const strokeSpacing = 11 * scale;
    const bundleWidth = 4 * strokeSpacing;

    if (round <= 10) {
      const fullBundles = Math.floor(round / 5);
      const remainder = round % 5;
      let curX = x;

      // Рисуем полные связки по 5
      for (let b = 0; b < fullBundles; b++) {
        this.drawBundle(ctx, curX, y, strokeHeight, strokeSpacing, scale);
        curX += bundleWidth + 18 * scale;
      }

      // Рисуем оставшиеся одиночные штрихи (1..4)
      for (let i = 0; i < remainder; i++) {
        this.drawSingleStroke(ctx, curX + i * strokeSpacing, y, strokeHeight, scale, i);
      }
    } else {
      // Для раундов > 10: стилизованные крупные цифры с кровавыми подтеками
      ctx.font = `900 ${Math.round(52 * scale)}px "Courier New", monospace`;
      ctx.textAlign = 'left';
      ctx.fillText(`${round}`, x, y + 6 * scale);

      // Маленькие декоративные черточки под числом
      const miniRemainder = (round % 5) || 5;
      let subX = x;
      for (let i = 0; i < miniRemainder; i++) {
        this.drawSingleStroke(ctx, subX + i * 8 * scale, y + 18 * scale, 14 * scale, scale * 0.45, i);
      }
    }

    ctx.restore();
  }

  /**
   * Отрисовка одной вертикальной черточки мела с естественной кривизной и шероховатостью
   */
  static drawSingleStroke(ctx, x, y, height, scale, seed = 0) {
    const tilt = ((seed % 3) - 1) * 1.5 * scale;
    ctx.lineWidth = (3.6 + ((seed * 13) % 1.5)) * scale;

    ctx.beginPath();
    ctx.moveTo(x + tilt, y - height);
    // Легкий изгиб посередине для эффекта рисования от руки
    const midJitter = (((seed * 7) % 5) - 2) * 0.8 * scale;
    ctx.quadraticCurveTo(x + midJitter, y - height * 0.5, x - tilt * 0.5, y);
    ctx.stroke();

    // Небольшая меловая клякса / нажим в начале и конце
    ctx.beginPath();
    ctx.arc(x + tilt, y - height, ctx.lineWidth * 0.5, 0, Math.PI * 2);
    ctx.arc(x - tilt * 0.5, y, ctx.lineWidth * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Отрисовка полной группы из 5 черточек (4 вертикальные + 1 диагональный слэш)
   */
  static drawBundle(ctx, x, y, height, spacing, scale) {
    // 4 вертикальных штриха
    for (let i = 0; i < 4; i++) {
      this.drawSingleStroke(ctx, x + i * spacing, y, height, scale, i);
    }

    // Диагональное перечеркивание слева-направо снизу-вверх (или сверху-слева вниз-вправо)
    ctx.lineWidth = 4.2 * scale;
    ctx.beginPath();
    const startX = x - 4 * scale;
    const startY = y - height * 0.15;
    const endX = x + 3 * spacing + 6 * scale;
    const endY = y - height * 0.88;

    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(
      (startX + endX) * 0.5,
      (startY + endY) * 0.5 - 2 * scale,
      endX,
      endY
    );
    ctx.stroke();
  }

  /**
   * Отрисовка брызг крови и капель под раундом
   */
  static drawBloodDrips(ctx, x, y, count = 3, scale = 1.0) {
    ctx.save();
    ctx.fillStyle = '#8b0000';
    ctx.strokeStyle = '#5c0000';
    for (let i = 0; i < count; i++) {
      const dropX = x + (i * 18 - 8) * scale;
      const dropY = y + (8 + (i * 7) % 12) * scale;
      const dropLen = (6 + (i * 11) % 14) * scale;

      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.moveTo(dropX, y);
      ctx.lineTo(dropX, dropY);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(dropX, dropY, 2.5 * scale, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

__exports.ChalkRenderer = ChalkRenderer;
  };

  __modules['src/modules/hud/HudModule.js'] = function(__exports, __require) {
/**
 * HudModule - Классический интерфейс Call of Duty: Zombies:
 * меловые черточки раунда, очки, здоровье/стамина, патроны, прицел,
 * хитмаркеры, табло [TAB], рестарт, пауза и переключение звука.
 */
const { EVENTS } = __require('src/core/Constants.js');
const { HudAudio } = __require('src/modules/hud/HudAudio.js');
const { ChalkRenderer } = __require('src/modules/hud/ChalkRenderer.js');
class HudModule {
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

__exports.HudModule = HudModule;
  };

  __modules['src/modules/memes/MemeLudkaModule.js'] = function(__exports, __require) {
/**
 * MemeLudkaModule - Терминал Лудки 777, система Додепа в стиле CoD Zombies и меню паузы
 * (без мем-вставок и рекламных окон).
 */
const { EVENTS, WEAPON_CONFIGS, GAME_SETTINGS } = __require('src/core/Constants.js');
const FREE_HUD_SPIN_COOLDOWN_MS = 20000;
const TERMINAL_COOLDOWN_MS = 12000;

const REEL_SYMBOLS = [
  {
    id: 'coins',
    label: 'РЕЗЕРВ',
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="13" stroke="#a8935c" stroke-width="2.2" fill="#1b1811"/><circle cx="20" cy="20" r="8.5" stroke="#75643b" stroke-width="1.2" stroke-dasharray="3 2"/><path d="M20 13V27M16 17H23C24.5 17 24.5 20 23 20H17C15.5 20 15.5 23 17 23H24" stroke="#d4bc7c" stroke-width="1.8" stroke-linecap="square"/></svg>`
  },
  {
    id: 'cash',
    label: 'ОЧКИ+',
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="10" width="28" height="20" rx="1.5" stroke="#c89b3c" stroke-width="2" fill="#211b0e"/><path d="M6 16H34M16 10V30M24 10V30" stroke="#7d6127" stroke-width="1.4"/><rect x="17" y="17" width="6" height="6" fill="#e0b858"/></svg>`
  },
  {
    id: 'jackpot',
    label: '777',
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><polygon points="20,4 35,14 29,34 11,34 5,14" stroke="#e6b84d" stroke-width="2" fill="#261d0b"/><text x="20" y="25" text-anchor="middle" fill="#f3d27a" font-family="Courier New, monospace" font-size="11" font-weight="bold">777</text></svg>`
  },
  {
    id: 'weapon',
    label: 'СТВОЛ',
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="12" stroke="#9aa4b2" stroke-width="1.8"/><circle cx="20" cy="20" r="4" stroke="#d5dde8" stroke-width="1.5"/><path d="M20 4V12M20 28V36M4 20H12M28 20H36" stroke="#d5dde8" stroke-width="2"/></svg>`
  },
  {
    id: 'wonder',
    label: 'СПЕЦ',
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="14" stroke="#5da872" stroke-width="1.8" fill="#0f1f14"/><circle cx="20" cy="20" r="3" fill="#8de0a4"/><path d="M20 14L15 8A12 12 0 0 1 25 8L20 14ZM15 22L8 25A12 12 0 0 1 8 17L15 22ZM25 22L32 17A12 12 0 0 1 32 25L25 22Z" fill="#6cc485"/></svg>`
  },
  {
    id: 'god',
    label: 'БУСТ',
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><polygon points="22,5 10,22 19,22 17,35 30,18 21,18" stroke="#e09f3e" stroke-width="1.8" fill="#3a280e"/></svg>`
  },
  {
    id: 'empty',
    label: 'ПУСТО',
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="8" width="24" height="24" rx="1.5" stroke="#4f5661" stroke-width="1.8" stroke-dasharray="4 3"/><path d="M13 20H27" stroke="#6c7582" stroke-width="2.4"/></svg>`
  },
  {
    id: 'scam',
    label: 'ШТРАФ',
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><polygon points="20,6 34,32 6,32" stroke="#c93636" stroke-width="2" fill="#2b0f0f"/><path d="M20 15V23M20 26.5V28.5" stroke="#f0a8a8" stroke-width="2.2"/></svg>`
  }
];

class MemeLudkaModule {
  constructor() {
    this.name = 'meme_ludka';
    this.engine = null;
    this.alwaysUpdate = true;

    this.mode = 'none'; // 'none' | 'ludka' | 'pause'
    this.ludkaRafId = null;
    this.riskRafId = null;
    this.pendingReward = null;
    this.rewardCommitted = false;
    this.isSpinning = false;
    this.isRisking = false;
    this.pendingRevive = false;
    this.deathRevives = 0;

    this.luckStreak = 1.0;
    this.nextFreeHudSpinAt = 0;
    this.terminalCooldowns = new Map();

    // Система ДОДЕПА (ходьба, боевые действия, смерть)
    this.walkDistAccum = 0;
    this.lastWalkX = null;
    this.lastWalkY = null;
    this.actionHeat = 0;
    this.lastDodepOfferAt = -999999;
    this.dodepOffer = null;
    this.nextTimedDodep = 45000;

    this.dom = {};
  }

  init(engine) {
    this.engine = engine;
    this.cacheDom();
    this.bindEvents();
    this.syncSoundButtonText();

    this.dom.quickbar?.classList.remove('hidden');

    const bus = engine.bus;

    bus.on(EVENTS.LUDKA_REQUEST, (opts = {}) => {
      const player = this.engine.getModule('player');
      if (player && player.isDead && !opts.reviveOnComplete) return;
      this.openLudkaDirect(opts);
    });

    bus.on(EVENTS.PLAYER_MOVED, (pos) => {
      if (!pos || this.mode !== 'none' || this.engine.isPaused) return;
      if (this.lastWalkX === null) {
        this.lastWalkX = pos.x;
        this.lastWalkY = pos.y;
        return;
      }
      const step = Math.hypot(pos.x - this.lastWalkX, pos.y - this.lastWalkY);
      this.lastWalkX = pos.x;
      this.lastWalkY = pos.y;
      if (step > 0.5 && step < 200) {
        this.walkDistAccum += step;
        if (this.walkDistAccum >= 320) {
          if (this.triggerDodepOffer('НАЙДЕН ЖЕТОН ДОДЕПА', true)) {
            this.walkDistAccum = 0;
          } else {
            this.walkDistAccum = 320;
          }
        }
      }
    });

    bus.on(EVENTS.ZOMBIE_KILLED, (data) => {
      this.addActionHeat(data?.isHeadshot ? 2 : 1, 'СЕРИЯ УБИЙСТВ — ДОДЕП', false);
    });

    bus.on(EVENTS.WEAPON_RELOAD_START, () => {
      this.addActionHeat(2, 'ПЕРЕЗАРЯДКА — ДОДЕП', true);
    });

    bus.on(EVENTS.PLAYER_POINTS_CHANGED, (data) => {
      if (this.dom.ludkaBalance) {
        this.dom.ludkaBalance.textContent = `${data.points}`;
      }
      if (data?.delta < 0 && this.mode === 'none') {
        this.triggerDodepOffer('ОТБИТЬ РАСХОД В ДОДЕПЕ', false);
      }
    });

    bus.on(EVENTS.PLAYER_DAMAGED, (data) => {
      const player = this.engine.getModule('player');
      if (player && !player.isDead && player.hp > 0 && player.hp <= 55 && data?.amount > 0) {
        this.triggerDodepOffer('КРИТИЧЕСКИЙ HP — ДОДЕП', true);
      }
    });

    bus.on(EVENTS.PLAYER_DIED, () => {
      this.hideDodepOffer();
      setTimeout(() => {
        const player = this.engine.getModule('player');
        if (player && player.isDead && this.mode === 'none') {
          this.updateGameOverButtons();
          this.dom.gameoverActions?.classList.remove('hidden');
        }
      }, 450);
    });

    bus.on(EVENTS.PLAYER_REVIVE, () => {
      this.dom.gameoverActions?.classList.add('hidden');
    });

    bus.on(EVENTS.GAME_RESTART, () => {
      this.deathRevives = 0;
      this.pendingRevive = false;
      this.luckStreak = 1.0;
      this.nextFreeHudSpinAt = 0;
      this.terminalCooldowns.clear();
      this.walkDistAccum = 0;
      this.lastWalkX = null;
      this.lastWalkY = null;
      this.actionHeat = 0;
      this.lastDodepOfferAt = -999999;
      this.nextTimedDodep = this.engine.now() + 45000;
      this.closeDodepGame?.();
      this.hideDodepOffer();
      this.dom.gameoverActions?.classList.add('hidden');
    });
  }

  cacheDom() {
    const q = (id) => document.getElementById(id);
    this.dom = {
      quickbar: q('hud-quickbar'),
      btnOpenLudka: q('btn-open-ludka'),
      btnToggleMute: q('btn-toggle-mute'),
      btnOpenPause: q('btn-open-pause'),

      btnDodepOffer: q('btn-dodep-offer'),
      dodepReasonText: q('dodep-reason-text'),

      gameoverActions: q('gameover-actions'),
      btnReviveAd: q('btn-revive-ad'),
      btnRestartGame: q('btn-restart-game'),

      ludkaModal: q('ludka-modal'),
      ludkaBalance: q('ludka-balance'),
      ludkaStreak: q('ludka-streak'),
      reels: [q('ludka-reel-0'), q('ludka-reel-1'), q('ludka-reel-2')],
      resultBox: q('ludka-result-box'),
      resultTitle: q('ludka-result-title'),
      resultDesc: q('ludka-result-desc'),
      riskMeter: q('ludka-risk-meter'),
      riskPointer: q('risk-pointer'),
      btnClaim: q('btn-ludka-claim'),
      btnRisk: q('btn-ludka-risk'),
      btnSpinFree: q('btn-ludka-spin-free'),
      btnDodepSpin: q('btn-ludka-dodep'),
      btnSpinPaid: q('btn-ludka-spin-paid'),
      btnToSaper: q('btn-ludka-to-saper'),
      btnLudkaClose: q('btn-ludka-close'),

      pauseModal: q('pause-modal'),
      chkSoundOn: q('chk-sound-on'),
      btnPauseResume: q('btn-pause-resume'),
      btnPauseLudka: q('btn-pause-ludka'),
      btnPauseSaper: q('btn-pause-saper'),
      btnPauseRestart: q('btn-pause-restart')
    };
  }

  bindEvents() {
    this.dom.btnOpenLudka?.addEventListener('click', (e) => {
      e.currentTarget?.blur?.();
      const player = this.engine.getModule('player');
      if (player && player.isDead) return;
      this.openLudkaDirect({ source: 'hud' });
    });

    this.dom.btnDodepOffer?.addEventListener('click', (e) => {
      e.currentTarget?.blur?.();
      this.activateDodepOffer();
    });

    this.dom.btnToggleMute?.addEventListener('click', (e) => {
      e.currentTarget?.blur?.();
      this.toggleSound();
    });

    this.dom.btnOpenPause?.addEventListener('click', (e) => {
      e.currentTarget?.blur?.();
      if (this.mode === 'none' && !this.engine.isPaused) {
        this.openPause();
      } else if (this.mode === 'pause') {
        this.closePause();
      }
    });

    this.dom.btnRestartGame?.addEventListener('click', () => {
      this.engine.getModule('hud')?.restartGame();
    });

    this.dom.btnReviveAd?.addEventListener('click', () => {
      this.handleDeathDodep();
    });

    // Кнопки терминала ЛУДКИ
    this.dom.btnClaim?.addEventListener('click', () => {
      this.commitPendingReward();
      this.closeLudka();
    });

    this.dom.btnRisk?.addEventListener('click', () => {
      this.startRiskGamble();
    });

    this.dom.btnSpinFree?.addEventListener('click', () => {
      if (!this.isFreeHudSpinReady()) return;
      this.commitPendingReward();
      this.nextFreeHudSpinAt = Date.now() + FREE_HUD_SPIN_COOLDOWN_MS;
      this.startLudkaSpin(true);
    });

    this.dom.btnDodepSpin?.addEventListener('click', () => {
      this.commitPendingReward();
      const player = this.engine.getModule('player');
      const cost = GAME_SETTINGS.DODEP_SPIN_COST;
      if (!player || !player.spendPoints(cost)) {
        this.engine.getModule('hud')?.audio?.playDenied();
        return;
      }
      this.startLudkaSpin(true);
    });

    this.dom.btnSpinPaid?.addEventListener('click', () => {
      this.commitPendingReward();
      const player = this.engine.getModule('player');
      if (!player || !player.spendPoints(GAME_SETTINGS.LUDKA_SPIN_COST)) {
        this.engine.getModule('hud')?.audio?.playDenied();
        return;
      }
      this.startLudkaSpin(false);
    });

    this.dom.btnToSaper?.addEventListener('click', () => {
      if (this.isSpinning || this.isRisking) return;
      this.commitPendingReward();
      this.closeLudka();
      this.engine.bus.emit(EVENTS.SAPER_REQUEST, { source: 'ludka_switch' });
    });

    this.dom.btnLudkaClose?.addEventListener('click', () => {
      if (this.isSpinning || this.isRisking) return;
      this.commitPendingReward();
      this.closeLudka();
    });

    // Пауза
    this.dom.chkSoundOn?.addEventListener('change', (e) => {
      const wantOn = e.target.checked;
      const hud = this.engine.getModule('hud');
      if (hud && hud.audio.isMuted === wantOn) {
        this.toggleSound();
      }
    });

    this.dom.btnPauseResume?.addEventListener('click', () => {
      this.closePause();
    });

    this.dom.btnPauseLudka?.addEventListener('click', () => {
      this.closePause();
      this.openLudkaDirect({ source: 'pause' });
    });

    this.dom.btnPauseSaper?.addEventListener('click', () => {
      this.closePause();
      this.engine.bus.emit(EVENTS.SAPER_REQUEST, { source: 'pause' });
    });

    this.dom.btnPauseRestart?.addEventListener('click', () => {
      this.closePause();
      this.engine.getModule('hud')?.restartGame();
    });

    // Горячие клавиши
    window.addEventListener('keydown', (e) => {
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target?.isContentEditable) return;

      const code = e.code;

      if (code === 'Escape' || code === 'KeyP') {
        if (this.mode === 'pause') {
          e.preventDefault();
          this.closePause();
          return;
        }
        if (code === 'Escape' && this.mode === 'ludka') {
          if (!this.isSpinning && !this.isRisking) {
            e.preventDefault();
            this.commitPendingReward();
            this.closeLudka();
          }
          return;
        }
        if (this.mode === 'none' && !this.engine.isPaused) {
          const player = this.engine.getModule('player');
          if (player && !player.isDead) {
            e.preventDefault();
            this.openPause();
          }
        }
        return;
      }

      if (code === 'KeyM') {
        this.toggleSound();
        return;
      }

      if (code === 'KeyG' && this.mode === 'none' && !this.engine.isPaused) {
        const player = this.engine.getModule('player');
        if (player && !player.isDead) {
          e.preventDefault();
          this.openLudkaDirect({ source: 'hotkey' });
        }
        return;
      }

      if (code === 'KeyH' && this.mode === 'none' && !this.engine.isPaused) {
        const player = this.engine.getModule('player');
        if (player && !player.isDead && this.dodepOffer) {
          e.preventDefault();
          this.activateDodepOffer();
        }
      }
    });
  }

  // ==========================================
  // СИСТЕМА ДОДЕПА (БЕЗ МЕМОВ)
  // ==========================================

  isFreeHudSpinReady() {
    return Date.now() >= this.nextFreeHudSpinAt;
  }

  getFreeHudCooldownSec() {
    return Math.max(0, Math.ceil((this.nextFreeHudSpinAt - Date.now()) / 1000));
  }

  getTerminalCooldownSec(terminalId) {
    const until = this.terminalCooldowns.get(terminalId) || 0;
    return Math.max(0, Math.ceil((until - Date.now()) / 1000));
  }

  getDeathDodepCost() {
    if (this.deathRevives === 0) return 0;
    return 400 + (this.deathRevives - 1) * 300;
  }

  updateGameOverButtons() {
    if (!this.dom.btnReviveAd) return;
    this.dom.btnReviveAd.classList.remove('hidden');

    const player = this.engine.getModule('player');
    const cost = this.getDeathDodepCost();
    if (cost === 0) {
      this.dom.btnReviveAd.textContent = 'ДОДЕП: ВЕРНУТЬСЯ В БОЙ (БЕСПЛ.)';
    } else if ((player?.points || 0) >= cost) {
      this.dom.btnReviveAd.textContent = `ДОДЕП ЗА ОЧКИ [${cost}] → В БОЙ`;
    } else {
      this.dom.btnReviveAd.textContent = 'ЭКСТРЕННЫЙ ДОДЕП → В БОЙ';
    }
  }

  handleDeathDodep() {
    const player = this.engine.getModule('player');
    const cost = this.getDeathDodepCost();
    this.dom.gameoverActions?.classList.add('hidden');
    this.deathRevives++;
    this.pendingRevive = true;

    if (cost > 0 && player && player.spendPoints(cost)) {
      this.engine.bus.emit(EVENTS.DODEP_ACTIVATED, { source: 'death_paid', cost });
    } else {
      this.engine.bus.emit(EVENTS.DODEP_ACTIVATED, { source: 'death_free', cost: 0 });
    }
    this.openLudka(true, true);
  }

  addActionHeat(amount, reason, isFree) {
    if (this.mode !== 'none' || this.engine.isPaused || this.dodepOffer) return;
    this.actionHeat += amount;
    if (this.actionHeat >= 5) {
      if (this.triggerDodepOffer(reason, isFree)) {
        this.actionHeat = 0;
      }
    }
  }

  triggerDodepOffer(reason, isFree = false) {
    if (this.mode !== 'none' || this.engine.isPaused) return false;
    const now = this.engine.now();
    if (now - this.lastDodepOfferAt < 9500) return false;

    const player = this.engine.getModule('player');
    if (!player || player.isDead) return false;

    this.lastDodepOfferAt = now;
    const freeSpin = Boolean(isFree || player.points < GAME_SETTINGS.DODEP_SPIN_COST);
    this.dodepOffer = {
      reason,
      isFree: freeSpin,
      expiresAtMs: now + 16000
    };

    if (this.dom.dodepReasonText) {
      this.dom.dodepReasonText.textContent = freeSpin
        ? `${reason} (БЕСПЛ.)`
        : `${reason} [${GAME_SETTINGS.DODEP_SPIN_COST}]`;
    }
    this.dom.btnDodepOffer?.classList.remove('hidden');
    this.engine.getModule('hud')?.audio?.playReelTick(880);
    this.engine.bus.emit(EVENTS.DODEP_OFFER, { ...this.dodepOffer });
    return true;
  }

  hideDodepOffer() {
    this.dodepOffer = null;
    this.dom.btnDodepOffer?.classList.add('hidden');
  }

  activateDodepOffer() {
    if (!this.dodepOffer || this.mode !== 'none' || this.engine.isPaused) return;
    const offer = this.dodepOffer;
    this.hideDodepOffer();

    const player = this.engine.getModule('player');
    if (!player || player.isDead) return;

    this.engine.bus.emit(EVENTS.DODEP_ACTIVATED, { source: 'live_offer', reason: offer.reason });

    if (!offer.isFree) {
      player.spendPoints(GAME_SETTINGS.DODEP_SPIN_COST);
    }
    const variant = Math.floor(Math.random() * 2);
    if (variant === 0) this.openLudka(true, true);
    else this.startDodepGame(variant);
  }

  startDodepGame(variant) {
    this.mode = 'dodep_game';
    this.engine.setPaused(true, 'dodep_game');
    const overlay = document.createElement('div');
    overlay.className = 'modal-backdrop dodep-game';
    overlay.innerHTML = `<div class="dodep-game-panel"><h2>${variant === 1 ? 'ДОДЕП: ПОЛЁТ' : 'ДОДЕП: ОХОТА'}</h2><p>${variant === 1 ? 'Нажмите на поле или пробел, чтобы начать и подлетать. Пролетайте между колоннами!' : 'Нажимайте на появляющиеся мишени за 20 секунд!'}</p><div class="dodep-game-score">Очки: 0</div><canvas width="480" height="260"></canvas><p class="dodep-game-message"></p><button class="btn-ludka btn-claim hidden">ЗАБРАТЬ НАГРАДУ</button></div>`;
    document.body.appendChild(overlay);
    const canvas = overlay.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const scoreEl = overlay.querySelector('.dodep-game-score');
    const message = overlay.querySelector('.dodep-game-message');
    const button = overlay.querySelector('button');
    let score = 0, ended = false, frame = 0, last = performance.now(), elapsed = 0;
    let bird = 130, velocity = 0, pipes = [], spawn = 1.5, started = false;
    let target = { x: 240, y: 130 };
    const player = this.engine.getModule('player');
    const finish = () => {
      if (ended) return;
      ended = true;
      const coins = 100 + score * (variant === 1 ? 150 : 50);
      player.addRawPoints(coins);
      let bonus = '';
      if (score >= 5) {
        player.hp = Math.min(player.maxHp, player.hp + 40);
        player.engine.bus.emit(EVENTS.PLAYER_HEALED, { currentHp: player.hp, maxHp: player.maxHp });
        player.invulnTimer = Math.max(player.invulnTimer, 10);
        bonus = ' + лечение и бессмертие на 10 секунд';
      }
      message.textContent = `Награда: ${coins} очков${bonus}`;
      button.classList.remove('hidden');
    };
    const close = () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('keydown', key);
      overlay.remove();
      this.mode = 'none';
      this.engine.setPaused(false, 'dodep_game');
      this.closeDodepGame = null;
    };
    this.closeDodepGame = close;
    button.addEventListener('click', close);
    const flap = () => { if (!ended && variant === 1) { started = true; velocity = -180; } };
    const key = e => { if (e.code === 'Space' && !ended) { e.preventDefault(); flap(); } };
    window.addEventListener('keydown', key);
    canvas.addEventListener('pointerdown', e => {
      if (ended) return;
      if (variant === 1) { flap(); return; }
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * canvas.width / rect.width;
      const y = (e.clientY - rect.top) * canvas.height / rect.height;
      if (Math.hypot(x - target.x, y - target.y) < 27) {
        score++; scoreEl.textContent = `Очки: ${score}`;
        target = { x: 30 + Math.random() * 420, y: 30 + Math.random() * 200 };
      }
    });
    const draw = now => {
      if (!overlay.isConnected || ended) return;
      const dt = Math.min(.05, (now - last) / 1000); last = now; elapsed += dt;
      ctx.fillStyle = '#17232a'; ctx.fillRect(0, 0, 480, 260);
      if (variant === 1 && !started) {
        elapsed = 0;
        ctx.fillStyle = '#ffe28a'; ctx.beginPath(); ctx.arc(90, bird, 10, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#eee5cf'; ctx.font = '16px sans-serif'; ctx.fillText('Нажмите, чтобы начать', 150, 135);
      } else if (variant === 1) {
        velocity += 330 * dt; bird += velocity * dt; spawn -= dt;
        if (spawn <= 0) { pipes.push({ x: 480, gap: 75 + Math.random() * 110, scored: false }); spawn = 2.6; }
        ctx.fillStyle = '#7ac489';
        for (const pipe of pipes) {
          pipe.x -= 75 * dt;
          ctx.fillRect(pipe.x, 0, 42, pipe.gap - 68); ctx.fillRect(pipe.x, pipe.gap + 68, 42, 260);
          if (!pipe.scored && pipe.x + 42 < 90) { pipe.scored = true; score++; scoreEl.textContent = `Очки: ${score}`; }
          if (pipe.x < 102 && pipe.x + 42 > 78 && (bird < pipe.gap - 58 || bird > pipe.gap + 58)) finish();
        }
        pipes = pipes.filter(pipe => pipe.x > -45);
        ctx.fillStyle = '#ffe28a'; ctx.beginPath(); ctx.arc(90, bird, 10, 0, Math.PI * 2); ctx.fill();
        if (bird < 10 || bird > 250 || elapsed >= 45) finish();
      } else {
        ctx.fillStyle = '#eebf70'; ctx.beginPath(); ctx.arc(target.x, target.y, 25, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#8d4444'; ctx.beginPath(); ctx.arc(target.x, target.y, 12, 0, Math.PI * 2); ctx.fill();
        message.textContent = `Осталось: ${Math.max(0, Math.ceil(20 - elapsed))} с`;
        if (elapsed >= 20) finish();
      }
      if (!ended) frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
  }

  openLudkaDirect(opts = {}) {
    if (this.mode !== 'none' || this.engine.isPaused) return;
    const source = opts.source || 'hud';
    const terminalId = opts.terminalId || null;

    if (source === 'terminal' && terminalId) {
      const cd = this.getTerminalCooldownSec(terminalId);
      if (cd === 0) {
        this.terminalCooldowns.set(terminalId, Date.now() + TERMINAL_COOLDOWN_MS);
        this.openLudka(true, true);
        return;
      }
      this.openLudka(true, false);
      return;
    }

    if (this.isFreeHudSpinReady()) {
      this.nextFreeHudSpinAt = Date.now() + FREE_HUD_SPIN_COOLDOWN_MS;
      this.openLudka(Boolean(opts.isDodep), true);
      return;
    }

    this.openLudka(Boolean(opts.isDodep), false);
  }

  update() {
    if (!this.engine.isPaused && this.mode === 'none' && !this.dodepOffer && this.engine.now() >= this.nextTimedDodep) {
      if (this.triggerDodepOffer('БОНУСНЫЙ ДОДЕП', true)) this.nextTimedDodep = this.engine.now() + 45000;
    }
    if (this.dodepOffer && this.mode === 'none' && !this.engine.isPaused) {
      if (this.engine.now() >= this.dodepOffer.expiresAtMs) {
        this.hideDodepOffer();
      }
    }
  }

  syncSoundButtonText() {
    const hud = this.engine?.getModule('hud');
    const isMuted = Boolean(hud?.audio?.isMuted);
    if (this.dom.btnToggleMute) {
      this.dom.btnToggleMute.textContent = isMuted ? 'ЗВУК: ВЫКЛ' : 'ЗВУК: ВКЛ';
    }
    if (this.dom.chkSoundOn) {
      this.dom.chkSoundOn.checked = !isMuted;
    }
  }

  toggleSound() {
    const hud = this.engine.getModule('hud');
    if (!hud) return;
    hud.toggleMute();
    this.syncSoundButtonText();
  }

  // ==========================================
  // ПАУЗА
  // ==========================================

  openPause() {
    if (this.mode !== 'none' || this.engine.isPaused) return;
    this.mode = 'pause';
    this.engine.setPaused(true, 'pause_menu');
    this.syncSoundButtonText();
    this.dom.pauseModal?.classList.remove('hidden');
  }

  closePause() {
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
    this.dom.pauseModal?.classList.add('hidden');
    this.mode = 'none';
    this.engine.setPaused(false, 'pause_menu');
  }

  // ==========================================
  // ТЕРМИНАЛ ЛУДКИ 777
  // ==========================================

  openLudka(isDodep = false, autoSpin = true) {
    this.mode = 'ludka';
    this.engine.setPaused(true, 'ludka');
    this.hideDodepOffer();

    const player = this.engine.getModule('player');
    if (this.dom.ludkaBalance) this.dom.ludkaBalance.textContent = `${player?.points ?? 0}`;
    if (this.dom.ludkaStreak) this.dom.ludkaStreak.textContent = `x${this.luckStreak.toFixed(2)}`;

    this.dom.ludkaModal?.classList.remove('hidden');
    this.engine.bus.emit(EVENTS.LUDKA_OPEN, { isDodep });

    if (autoSpin) {
      this.startLudkaSpin(isDodep);
    } else {
      this.showIdleLudkaState();
    }
  }

  showIdleLudkaState() {
    this.pendingReward = null;
    this.rewardCommitted = true;
    this.dom.riskMeter?.classList.add('hidden');
    this.dom.resultBox?.classList.remove('win', 'scam');

    const cd = this.getFreeHudCooldownSec();
    if (this.dom.resultTitle) {
      this.dom.resultTitle.textContent = 'ТЕРМИНАЛ ГОТОВ';
    }
    if (this.dom.resultDesc) {
      this.dom.resultDesc.textContent = cd > 0
        ? `Бесплатный спин через ${cd}с. Можно крутить за очки или перейти в «Сапёр».`
        : 'Доступен бесплатный спин или крутка за очки.';
    }

    this.hideAllLudkaButtons();
    const player = this.engine.getModule('player');
    const points = player?.points || 0;

    if (this.isFreeHudSpinReady()) {
      this.dom.btnSpinFree?.classList.remove('hidden');
    }
    if (this.dom.btnDodepSpin) {
      this.dom.btnDodepSpin.classList.remove('hidden');
      this.dom.btnDodepSpin.disabled = points < GAME_SETTINGS.DODEP_SPIN_COST;
      this.dom.btnDodepSpin.textContent = `ДОДЕП [${GAME_SETTINGS.DODEP_SPIN_COST}]`;
    }
    if (this.dom.btnSpinPaid) {
      this.dom.btnSpinPaid.classList.remove('hidden');
      this.dom.btnSpinPaid.disabled = points < GAME_SETTINGS.LUDKA_SPIN_COST;
    }
    this.dom.btnToSaper?.classList.remove('hidden');
    this.dom.btnLudkaClose?.classList.remove('hidden');
  }

  closeLudka() {
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
    cancelAnimationFrame(this.ludkaRafId);
    cancelAnimationFrame(this.riskRafId);
    this.stopSpinMeme?.();
    this.isSpinning = false;
    this.isRisking = false;
    this.dom.ludkaModal?.classList.add('hidden');
    this.mode = 'none';

    if (this.pendingRevive) {
      this.pendingRevive = false;
      this.engine.bus.emit(EVENTS.PLAYER_REVIVE, {});
    }

    this.engine.setPaused(false, 'ludka');
  }

  rollLudkaOutcome(isDodep = false) {
    const streakBoost = Math.min(0.03, (this.luckStreak - 1.0) * 0.02);
    const dodepEdge = isDodep ? 0.02 : 0;
    const r = Math.random();
    const mult = this.luckStreak;

    if (r < 0.025 + streakBoost * 0.3 + dodepEdge * 0.4) {
      const coins = Math.round(3500 * mult / 50) * 50;
      return {
        kind: 'jackpot',
        reels: ['jackpot', 'jackpot', 'jackpot'],
        title: `ДЖЕКПОТ 777: +${coins} ОЧКОВ`,
        desc: 'Активирован бонус x2 очки на 20 сек.',
        coins,
        doublePoints: true,
        canRisk: false,
        isLoss: false
      };
    }

    if (r < 0.07 + streakBoost + dodepEdge) {
      const pick = Math.random() < 0.55 ? WEAPON_CONFIGS.raygun : WEAPON_CONFIGS.minigun;
      const bonusCoins = Math.round(300 * mult / 50) * 50;
      return {
        kind: 'wonder_weapon',
        reels: ['wonder', 'wonder', 'wonder'],
        title: `ВЫДАНО: ${pick.name}`,
        desc: `Дополнительное начисление: +${bonusCoins} очков`,
        weaponConfig: pick,
        coins: bonusCoins,
        canRisk: false,
        isLoss: false
      };
    }

    if (r < 0.12 + dodepEdge) {
      const coins = Math.round(400 * mult / 50) * 50;
      return {
        kind: 'god_combo',
        reels: ['god', 'god', 'god'],
        title: `ПОЛНОЕ СНАБЖЕНИЕ: +${coins} ОЧКОВ`,
        desc: 'Боекомплект, восстановление HP и Insta-Kill (15с)',
        coins,
        maxAmmo: true,
        instaKill: true,
        fullHeal: true,
        canRisk: true,
        isLoss: false
      };
    }

    if (r < 0.25 + dodepEdge) {
      const pool = [WEAPON_CONFIGS.ak47, WEAPON_CONFIGS.mp40, WEAPON_CONFIGS.olympia, WEAPON_CONFIGS.m14];
      const wp = pool[Math.floor(Math.random() * pool.length)];
      const bonusCoins = Math.round(150 * mult / 50) * 50;
      return {
        kind: 'weapon',
        reels: ['weapon', 'weapon', 'weapon'],
        title: `ОРУЖИЕ: ${wp.name}`,
        desc: `Дополнительно: +${bonusCoins} очков. Докрут на спец-оружие — 30%`,
        weaponConfig: wp,
        coins: bonusCoins,
        canRisk: true,
        isLoss: false
      };
    }

    if (r < 0.42) {
      const coins = Math.round(550 * mult / 50) * 50;
      return {
        kind: 'cash_mid',
        reels: ['cash', 'cash', 'cash'],
        title: `НАЧИСЛЕНИЕ: +${coins} ОЧКОВ`,
        desc: 'Можно забрать или рискнуть на удвоение x2 (30%)',
        coins,
        canRisk: true,
        isLoss: false
      };
    }

    if (r < 0.62) {
      const coins = Math.round(200 * mult / 50) * 50;
      return {
        kind: 'coins',
        reels: ['coins', 'coins', 'coins'],
        title: `РЕЗЕРВ: +${coins} ОЧКОВ`,
        desc: 'Доступен рискованный докрут x2 (шанс 30%)',
        coins,
        canRisk: true,
        isLoss: false
      };
    }

    if (r < 0.80) {
      return {
        kind: 'empty',
        reels: ['jackpot', 'jackpot', 'empty'],
        title: 'ПУСТАЯ ЯЧЕЙКА (+50 ОЧКОВ)',
        desc: 'Третий барабан не совпал. Серия удачи сброшена',
        coins: 50,
        canRisk: false,
        isLoss: true,
        resetStreak: true
      };
    }

    return {
      kind: 'scam',
      reels: ['scam', 'scam', 'scam'],
      title: 'ШТРАФ ТЕРМИНАЛА: -150 ОЧКОВ',
      desc: 'Списание со счёта. Серия удачи сброшена',
      coins: -150,
      canRisk: false,
      isLoss: true,
      resetStreak: true
    };
  }

  hideAllLudkaButtons() {
    this.dom.btnClaim?.classList.add('hidden');
    this.dom.btnRisk?.classList.add('hidden');
    this.dom.btnSpinFree?.classList.add('hidden');
    this.dom.btnDodepSpin?.classList.add('hidden');
    this.dom.btnSpinPaid?.classList.add('hidden');
    this.dom.btnToSaper?.classList.add('hidden');
    this.dom.btnLudkaClose?.classList.add('hidden');
  }

  showSpinMeme() {
    const overlay = document.createElement('div');
    overlay.className = 'spin-meme-overlay';
    const video = document.createElement('video');
    video.playsInline = true;
    video.autoplay = true;
    video.controls = true;
    overlay.append(video);
    this.stopSpinMeme?.();
    this.dom.ludkaModal?.appendChild(overlay);
    let closed = false;
    let memes = [];
    const pick = items => items[Math.floor(Math.random() * items.length)];
    const finish = () => {
      if (closed) return;
      closed = true;
      video.pause();
      video.removeAttribute('src');
      video.load();
      overlay.remove();
      if (this.stopSpinMeme === finish) this.stopSpinMeme = null;
    };
    this.stopSpinMeme = finish;
    const showImage = () => {
      if (closed || !video.isConnected) return;
      const img = document.createElement('img');
      img.alt = 'Мем';
      const images = memes.filter(item => item.type === 'image');
      if (!images.length) { finish(); return; }
      img.src = pick(images).src;
      img.onerror = finish;
      video.replaceWith(img);
    };
    video.loop = true;
    video.addEventListener('error', showImage, { once: true });
    fetch('./api/memes').then(response => { if (!response.ok) throw new Error('API unavailable'); return response.json(); }).catch(() => fetch('./memes.json').then(response => response.json())).then(data => {
      if (closed) return;
      memes = data.memes || [];
      const videos = memes.filter(item => item.type === 'video');
      const images = memes.filter(item => item.type === 'image');
      if (!videos.length && !images.length) { finish(); return; }
      if (images.length && (!videos.length || Math.random() < 0.5)) { showImage(); return; }
      video.src = pick(videos).src;
      video.play().catch(() => { video.muted = true; video.play().catch(showImage); });
    }).catch(finish);
  }

  startLudkaSpin(isDodep = false) {
    if (this.isSpinning || this.isRisking) return;
    this.isSpinning = true;
    this.showSpinMeme();
    const player = this.engine.getModule('player');
    if (player && !player.isDead) player.invulnTimer = Math.max(player.invulnTimer, 10);
    this.pendingReward = this.rollLudkaOutcome(isDodep);
    this.pendingReward.isDodep = isDodep;
    this.rewardCommitted = false;

    this.hideAllLudkaButtons();
    this.dom.riskMeter?.classList.add('hidden');
    this.dom.resultBox?.classList.remove('win', 'scam');
    if (this.dom.resultTitle) {
      this.dom.resultTitle.textContent = isDodep ? 'ЗАПУСК ДОДЕПА...' : 'ЗАПУСК БАРАБАНОВ...';
    }
    if (this.dom.resultDesc) {
      this.dom.resultDesc.textContent = 'Определение результата';
    }

    const audio = this.engine.getModule('hud')?.audio;
    const targetIds = this.pendingReward.reels;
    const stopTimes = [950, 1750, 2900];
    const spinCycles = [3, 5, 8];
    const startMs = performance.now();

    const stripsData = this.dom.reels.map((reelEl, idx) => {
      reelEl?.classList.remove('locked');
      const cellH = reelEl?.clientHeight || 110;
      const strip = reelEl?.querySelector('.reel-strip');
      if (!strip) return null;

      strip.innerHTML = '';
      const totalItems = spinCycles[idx] * REEL_SYMBOLS.length + 1;
      const cells = [];

      for (let k = 0; k < totalItems - 1; k++) {
        cells.push(REEL_SYMBOLS[k % REEL_SYMBOLS.length]);
      }
      const targetSymbol = REEL_SYMBOLS.find((s) => s.id === targetIds[idx]) || REEL_SYMBOLS[0];
      cells.push(targetSymbol);

      for (const sym of cells) {
        const cell = document.createElement('div');
        cell.className = 'reel-cell';
        cell.style.height = `${cellH}px`;
        cell.innerHTML = `<div class="reel-svg">${sym.svg}</div><div class="reel-tag">${sym.label}</div>`;
        strip.appendChild(cell);
      }

      const endOffset = (cells.length - 1) * cellH;
      strip.style.transform = 'translateY(0px)';
      return { reelEl, strip, cellH, endOffset, locked: false, lastTickStep: -1 };
    });

    const animate = () => {
      if (this.mode !== 'ludka') return;
      const elapsed = performance.now() - startMs;
      let allDone = true;

      stripsData.forEach((data, idx) => {
        if (!data) return;
        const t = Math.min(1, elapsed / stopTimes[idx]);
        const eased = 1 - Math.pow(1 - t, 4);
        const curY = data.endOffset * eased;
        data.strip.style.transform = `translateY(-${curY}px)`;

        const stepIdx = Math.floor(curY / data.cellH);
        if (stepIdx !== data.lastTickStep && !data.locked) {
          data.lastTickStep = stepIdx;
          if (idx === 2 || !stripsData[idx + 1]?.locked) {
            audio?.playReelTick(520 + idx * 90);
          }
        }

        if (t >= 1) {
          if (!data.locked) {
            data.locked = true;
            data.reelEl?.classList.add('locked');
            audio?.playReelLock(idx);
          }
        } else {
          allDone = false;
        }
      });

      if (!allDone) {
        this.ludkaRafId = requestAnimationFrame(animate);
      } else {
        this.onLudkaSpinFinished();
      }
    };

    this.ludkaRafId = requestAnimationFrame(animate);
  }

  refreshActionButtonsAfterOutcome() {
    const reward = this.pendingReward;
    const player = this.engine.getModule('player');
    const projectedPoints = Math.max(0, (player?.points || 0) + (reward?.coins || 0));

    if (reward?.isLoss) {
      this.dom.btnClaim?.classList.add('hidden');
      this.dom.btnLudkaClose?.classList.remove('hidden');
    } else {
      this.dom.btnClaim?.classList.remove('hidden');
      this.dom.btnLudkaClose?.classList.add('hidden');
    }

    if (this.isFreeHudSpinReady()) {
      this.dom.btnSpinFree?.classList.remove('hidden');
    } else {
      this.dom.btnSpinFree?.classList.add('hidden');
    }

    if (this.dom.btnDodepSpin) {
      this.dom.btnDodepSpin.classList.remove('hidden');
      this.dom.btnDodepSpin.textContent = `ДОДЕП [${GAME_SETTINGS.DODEP_SPIN_COST}]`;
      this.dom.btnDodepSpin.disabled = projectedPoints < GAME_SETTINGS.DODEP_SPIN_COST;
    }

    if (reward?.canRisk) {
      this.dom.btnRisk?.classList.remove('hidden');
    }

    if (this.dom.btnSpinPaid) {
      this.dom.btnSpinPaid.classList.remove('hidden');
      this.dom.btnSpinPaid.disabled = projectedPoints < GAME_SETTINGS.LUDKA_SPIN_COST;
    }

    this.dom.btnToSaper?.classList.remove('hidden');
  }

  onLudkaSpinFinished() {
    this.isSpinning = false;
    const reward = this.pendingReward;
    if (!reward) return;

    const audio = this.engine.getModule('hud')?.audio;
    this.dom.resultBox?.classList.remove('win', 'scam');

    if (reward.isLoss) {
      audio?.playScam();
      this.dom.resultBox?.classList.add('scam');
      if (reward.resetStreak) {
        this.luckStreak = 1.0;
        if (this.dom.ludkaStreak) this.dom.ludkaStreak.textContent = 'x1.00';
      }
    } else {
      audio?.playJackpot();
      this.dom.resultBox?.classList.add('win');
      this.luckStreak = Math.min(1.6, Number((this.luckStreak + 0.08).toFixed(2)));
      if (this.dom.ludkaStreak) this.dom.ludkaStreak.textContent = `x${this.luckStreak.toFixed(2)}`;
    }

    if (this.dom.resultTitle) this.dom.resultTitle.textContent = reward.title;
    if (this.dom.resultDesc) this.dom.resultDesc.textContent = reward.desc;

    this.refreshActionButtonsAfterOutcome();
  }

  startRiskGamble() {
    if (this.isSpinning || this.isRisking || !this.pendingReward?.canRisk) return;
    this.isRisking = true;
    this.hideAllLudkaButtons();
    this.dom.riskMeter?.classList.remove('hidden');

    if (this.dom.resultTitle) this.dom.resultTitle.textContent = 'ДОКРУТ x2 (ШАНС 30%)...';
    if (this.dom.resultDesc) this.dom.resultDesc.textContent = '70% сгорание ставки, 30% удвоение или спец-оружие';

    const audio = this.engine.getModule('hud')?.audio;
    const won = Math.random() < 0.30;
    const targetPct = won ? (74 + Math.random() * 22) : (6 + Math.random() * 58);
    const startMs = performance.now();
    const duration = 1650;
    let lastBeep = 0;

    const tick = () => {
      if (this.mode !== 'ludka') return;
      const elapsed = performance.now() - startMs;
      const t = Math.min(1, elapsed / duration);
      const swing = Math.sin(t * Math.PI * 10) * (1 - t) * 42;
      const pos = Math.max(2, Math.min(98, t * targetPct + (1 - t) * 50 + swing));

      if (this.dom.riskPointer) {
        this.dom.riskPointer.style.left = `calc(${pos}% - 2px)`;
      }

      if (elapsed - lastBeep > 110) {
        lastBeep = elapsed;
        audio?.playReelTick(won ? 760 : 640);
      }

      if (t < 1) {
        this.riskRafId = requestAnimationFrame(tick);
      } else {
        this.finishRiskGamble(won);
      }
    };

    this.riskRafId = requestAnimationFrame(tick);
  }

  finishRiskGamble(won) {
    this.isRisking = false;
    const audio = this.engine.getModule('hud')?.audio;
    const cur = this.pendingReward;
    if (!cur) return;

    this.dom.resultBox?.classList.remove('win', 'scam');

    if (won) {
      audio?.playJackpot();
      this.dom.resultBox?.classList.add('win');

      if (cur.kind === 'weapon') {
        const ultraWp = Math.random() < 0.55 ? WEAPON_CONFIGS.raygun : WEAPON_CONFIGS.minigun;
        const newCoins = (cur.coins || 0) + 900;
        this.pendingReward = {
          kind: 'wonder_weapon',
          weaponConfig: ultraWp,
          coins: newCoins,
          title: `ДОКРУТ УСПЕШЕН: ${ultraWp.name} + ${newCoins} ОЧКОВ`,
          desc: 'Оружие улучшено до спец-класса',
          canRisk: false,
          isLoss: false,
          risked: true,
          riskWon: true
        };
      } else {
        const doubled = Math.max(400, (cur.coins || 300) * 2);
        this.pendingReward = {
          ...cur,
          coins: doubled,
          doublePoints: true,
          title: `УДВОЕНИЕ x2: +${doubled} ОЧКОВ`,
          desc: 'Награда удвоена + 20с x2 Очки',
          canRisk: false,
          isLoss: false,
          risked: true,
          riskWon: true
        };
      }
    } else {
      audio?.playScam();
      this.dom.resultBox?.classList.add('scam');
      this.luckStreak = 1.0;
      if (this.dom.ludkaStreak) this.dom.ludkaStreak.textContent = 'x1.00';
      this.pendingReward = {
        kind: 'scam',
        coins: 0,
        doublePoints: false,
        title: 'СГОРЕЛО (70%)',
        desc: 'Ставка обнулена. Можно сделать ещё додеп',
        canRisk: false,
        isLoss: true,
        risked: true,
        riskWon: false
      };
    }

    if (this.dom.resultTitle) this.dom.resultTitle.textContent = this.pendingReward.title;
    if (this.dom.resultDesc) this.dom.resultDesc.textContent = this.pendingReward.desc;

    this.refreshActionButtonsAfterOutcome();
  }

  commitPendingReward() {
    if (!this.pendingReward || this.rewardCommitted) return;
    this.rewardCommitted = true;

    const r = this.pendingReward;
    let label = '';
    if (r.weaponConfig) {
      label = `+${r.weaponConfig.name}`;
    } else if (r.coins > 0) {
      label = `+${r.coins} ОЧКОВ`;
    } else if (r.coins < 0) {
      label = `${r.coins} ОЧКОВ`;
    }

    this.engine.bus.emit(EVENTS.LUDKA_REWARD, {
      ...r,
      label
    });
  }
}

__exports.MemeLudkaModule = MemeLudkaModule;
  };

  __modules['src/modules/minigames/SaperModule.js'] = function(__exports, __require) {
/**
 * SaperModule - Мини-игра «Сапёр» 5x5 в стиле бункера CoD Zombies.
 * Открывай безопасные клетки без попадания на бомбы, чтобы забрать очки и снабжение.
 */
const { EVENTS, WEAPON_CONFIGS, GAME_SETTINGS } = __require('src/core/Constants.js');
const GRID_SIZE = 5;
const TOTAL_CELLS = GRID_SIZE * GRID_SIZE;

const SAPER_PRESETS = {
  5: {
    mines: 5,
    cost: 0,
    rewardCoins: 350,
    maxAmmo: false,
    weaponBonus: false,
    title: 'РАЗВЕДКА (5 МИН)'
  },
  7: {
    mines: 7,
    cost: GAME_SETTINGS.SAPER_MID_COST,
    rewardCoins: 1050,
    maxAmmo: true,
    weaponBonus: false,
    title: 'ПРОРЫВ (7 МИН)'
  },
  10: {
    mines: 10,
    cost: GAME_SETTINGS.SAPER_HIGH_COST,
    rewardCoins: 2100,
    maxAmmo: true,
    weaponBonus: true,
    title: 'ШТУРМ (10 МИН)'
  }
};

const BOMB_SVG = `<svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="13" cy="16" r="7.5" fill="#2a1111" stroke="#f07878" stroke-width="1.8"/><path d="M17.5 10.5L21 7M20.5 5.5L23.5 8.5M10 13.5C10.5 12 12 11.2 13.5 11.2" stroke="#f3c46b" stroke-width="1.6" stroke-linecap="round"/></svg>`;

const FLAG_SVG = `<svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 23V5M8 6L21 10.5L8 15" stroke="#e6b84d" stroke-width="1.8" fill="rgba(200,155,60,0.35)" stroke-linejoin="round"/><path d="M5.5 23H11.5" stroke="#aeb6c2" stroke-width="1.8" stroke-linecap="square"/></svg>`;

const DEFUSED_SVG = `<svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="14" cy="14" r="8" fill="#132919" stroke="#5ea864" stroke-width="1.7"/><path d="M10 14.5L13 17.5L18.5 11" stroke="#9be3a3" stroke-width="2" stroke-linecap="square"/></svg>`;

class SaperModule {
  constructor() {
    this.name = 'saper';
    this.engine = null;
    this.alwaysUpdate = true;

    this.isOpen = false;
    this.mineCount = 5;
    this.status = 'ready'; // 'ready' | 'playing' | 'won' | 'lost'
    this.flagMode = false;
    this.minesPlaced = false;
    this.safeRevealed = 0;
    this.stakePaid = 0;
    this.cells = [];
    this.dom = {};
  }

  init(engine) {
    this.engine = engine;
    this.cacheDom();
    this.bindEvents();
    this.resetBoard(5);

    const bus = engine.bus;

    bus.on(EVENTS.SAPER_REQUEST, () => {
      const player = this.engine.getModule('player');
      if (player && player.isDead) return;
      this.open();
    });

    bus.on(EVENTS.PLAYER_POINTS_CHANGED, (data) => {
      if (this.dom.balance) {
        this.dom.balance.textContent = `${data.points}`;
      }
    });

    bus.on(EVENTS.PLAYER_DIED, () => {
      if (this.isOpen) this.close();
    });

    bus.on(EVENTS.GAME_RESTART, () => {
      if (this.isOpen) this.close();
      this.resetBoard(5);
    });
  }

  cacheDom() {
    const q = (id) => document.getElementById(id);
    this.dom = {
      modal: q('saper-modal'),
      btnOpenHud: q('btn-open-saper'),
      balance: q('saper-balance'),
      minesLeft: q('saper-mines-left'),
      progress: q('saper-progress'),
      modesWrap: q('saper-modes'),
      grid: q('saper-grid'),
      resultBox: q('saper-result-box'),
      resultTitle: q('saper-result-title'),
      resultDesc: q('saper-result-desc'),
      btnFlagMode: q('btn-saper-flag-mode'),
      btnRestart: q('btn-saper-restart'),
      btnToLudka: q('btn-saper-to-ludka'),
      btnClose: q('btn-saper-close')
    };
  }

  bindEvents() {
    this.dom.btnOpenHud?.addEventListener('click', (e) => {
      e.currentTarget?.blur?.();
      const player = this.engine.getModule('player');
      if (player && player.isDead) return;
      if (!this.isOpen && !this.engine.isPaused) {
        this.open();
      }
    });

    this.dom.modesWrap?.addEventListener('click', (e) => {
      const btn = e.target?.closest?.('[data-mines]');
      if (!btn) return;
      const count = Number(btn.dataset.mines);
      if (!SAPER_PRESETS[count]) return;
      if (this.status === 'playing') {
        this.setResultState(
          null,
          'СНАЧАЛА ЗАВЕРШИТЕ РАУНД',
          'Игра уже начата: откройте безопасные клетки или нажмите «НОВОЕ ПОЛЕ».'
        );
        return;
      }
      this.resetBoard(count);
    });

    this.dom.btnFlagMode?.addEventListener('click', () => {
      this.flagMode = !this.flagMode;
      this.syncFlagModeBtn();
    });

    this.dom.btnRestart?.addEventListener('click', () => {
      this.resetBoard(this.mineCount);
    });

    this.dom.btnToLudka?.addEventListener('click', () => {
      this.close();
      this.engine.bus.emit(EVENTS.LUDKA_REQUEST, { source: 'saper_switch', isDodep: false });
    });

    this.dom.btnClose?.addEventListener('click', () => {
      this.close();
    });

    window.addEventListener('keydown', (e) => {
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target?.isContentEditable) return;

      if (e.code === 'Escape' && this.isOpen) {
        e.preventDefault();
        this.close();
        return;
      }

      if (e.code === 'KeyB') {
        const player = this.engine.getModule('player');
        if (player && player.isDead) return;
        if (this.isOpen) {
          e.preventDefault();
          this.close();
        } else if (!this.engine.isPaused) {
          e.preventDefault();
          this.open();
        }
      }
    });
  }

  getPreset(count = this.mineCount) {
    return SAPER_PRESETS[count] || SAPER_PRESETS[5];
  }

  open() {
    if (this.isOpen) return;
    const ludkaMod = this.engine.getModule('meme_ludka');
    if (ludkaMod && ludkaMod.mode === 'pause') {
      ludkaMod.closePause();
    } else if (this.engine.isPaused) {
      return;
    }

    this.isOpen = true;
    this.engine.setPaused(true, 'saper');

    const player = this.engine.getModule('player');
    if (this.dom.balance) this.dom.balance.textContent = `${player?.points ?? 0}`;

    if (this.status === 'won' || this.status === 'lost') {
      this.resetBoard(this.mineCount);
    } else {
      this.renderBoard();
    }

    this.dom.modal?.classList.remove('hidden');
    this.engine.bus.emit(EVENTS.SAPER_OPEN, { mineCount: this.mineCount });
  }

  close() {
    if (!this.isOpen) return;
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
    this.isOpen = false;
    this.dom.modal?.classList.add('hidden');
    this.engine.setPaused(false, 'saper');
  }

  resetBoard(mineCount = this.mineCount) {
    const preset = this.getPreset(mineCount);
    this.mineCount = preset.mines;
    this.status = 'ready';
    this.minesPlaced = false;
    this.safeRevealed = 0;
    this.stakePaid = 0;
    this.cells = Array.from({ length: TOTAL_CELLS }, (_, idx) => ({
      idx,
      r: Math.floor(idx / GRID_SIZE),
      c: idx % GRID_SIZE,
      isMine: false,
      revealed: false,
      flagged: false,
      detonated: false,
      adj: 0
    }));

    this.syncModeButtons();
    this.syncFlagModeBtn();
    this.updateStatsHeader();

    const safeTarget = TOTAL_CELLS - this.mineCount;
    const stakeLabel = preset.cost > 0 ? `Ставка [${preset.cost}] спишется при первом клике.` : 'Бесплатный запуск.';
    this.setResultState(
      null,
      'ПОЛЕ ГОТОВО К РАЗМИНИРОВАНИЮ',
      `${stakeLabel} Откройте ${safeTarget} нужных клеток. Бомба = проигрыш.`
    );
    this.renderBoard();
  }

  syncModeButtons() {
    const buttons = this.dom.modesWrap?.querySelectorAll?.('[data-mines]') || [];
    for (const btn of buttons) {
      btn.classList.toggle('active', Number(btn.dataset.mines) === this.mineCount);
    }
  }

  syncFlagModeBtn() {
    if (!this.dom.btnFlagMode) return;
    this.dom.btnFlagMode.classList.toggle('active', this.flagMode);
    this.dom.btnFlagMode.textContent = this.flagMode ? 'РЕЖИМ: ФЛАГ' : 'РЕЖИМ: ОТКРЫТЬ';
  }

  updateStatsHeader() {
    const flagsCount = this.cells.filter((cell) => cell.flagged).length;
    const safeTarget = TOTAL_CELLS - this.mineCount;
    if (this.dom.minesLeft) {
      this.dom.minesLeft.textContent = `${Math.max(0, this.mineCount - flagsCount)}`;
    }
    if (this.dom.progress) {
      this.dom.progress.textContent = `${this.safeRevealed}/${safeTarget}`;
    }
    const player = this.engine?.getModule?.('player');
    if (this.dom.balance && player) {
      this.dom.balance.textContent = `${player.points}`;
    }
  }

  setResultState(stateClass, title, desc) {
    if (this.dom.resultBox) {
      this.dom.resultBox.classList.remove('win', 'scam');
      if (stateClass) this.dom.resultBox.classList.add(stateClass);
    }
    if (this.dom.resultTitle) this.dom.resultTitle.textContent = title;
    if (this.dom.resultDesc) this.dom.resultDesc.textContent = desc;
  }

  getNeighbors(r, c) {
    const out = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
          out.push(this.cells[nr * GRID_SIZE + nc]);
        }
      }
    }
    return out;
  }

  countPreviewReveal(startIdx) {
    const start = this.cells[startIdx];
    if (!start || start.isMine) return 0;
    const queue = [start];
    const seen = new Set([startIdx]);
    while (queue.length > 0) {
      const cur = queue.shift();
      if (cur.adj === 0) {
        for (const n of this.getNeighbors(cur.r, cur.c)) {
          if (!n.isMine && !seen.has(n.idx)) {
            seen.add(n.idx);
            queue.push(n);
          }
        }
      }
    }
    return seen.size;
  }

  placeMinesAvoiding(firstIdx) {
    const first = this.cells[firstIdx];
    const safeTarget = TOTAL_CELLS - this.mineCount;
    const ringSet = new Set([firstIdx, ...this.getNeighbors(first.r, first.c).map((n) => n.idx)]);

    const tryLayout = (excludedSet) => {
      for (const cell of this.cells) {
        cell.isMine = false;
        cell.adj = 0;
      }
      const candidates = this.cells
        .filter((cell) => !excludedSet.has(cell.idx))
        .map((cell) => cell.idx);

      for (let i = candidates.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
      }
      for (let m = 0; m < this.mineCount && m < candidates.length; m++) {
        this.cells[candidates[m]].isMine = true;
      }
      for (const cell of this.cells) {
        if (!cell.isMine) {
          cell.adj = this.getNeighbors(cell.r, cell.c).reduce((cnt, n) => cnt + (n.isMine ? 1 : 0), 0);
        }
      }
      return this.countPreviewReveal(firstIdx);
    };

    const singleExcluded = new Set([firstIdx]);
    let chosen = false;

    // Prefer an opening pocket that reveals >= 3 cells without solving the whole board on click 1
    for (let attempt = 0; attempt < 24; attempt++) {
      const excluded = attempt < 12 ? ringSet : singleExcluded;
      const revealed = tryLayout(excluded);
      if (revealed >= 2 && revealed <= safeTarget - 4) {
        chosen = true;
        break;
      }
    }

    if (!chosen) {
      for (let attempt = 0; attempt < 16; attempt++) {
        const revealed = tryLayout(singleExcluded);
        if (revealed >= 1 && revealed < safeTarget) {
          chosen = true;
          break;
        }
      }
    }

    if (!chosen) {
      tryLayout(singleExcluded);
    }

    this.minesPlaced = true;
  }

  handleCellClick(idx) {
    if (this.status === 'won' || this.status === 'lost') return;
    const cell = this.cells[idx];
    if (!cell || cell.revealed) return;

    if (this.flagMode) {
      this.toggleFlag(idx);
      return;
    }

    if (cell.flagged) return;

    if (!this.minesPlaced) {
      const preset = this.getPreset();
      const player = this.engine.getModule('player');
      if (preset.cost > 0) {
        if (!player || !player.spendPoints(preset.cost)) {
          this.engine.getModule('hud')?.audio?.playDenied();
          this.setResultState(
            'scam',
            'НЕ ХВАТАЕТ ОЧКОВ',
            `Для режима ${preset.title} нужно ${preset.cost} очков. Выберите 5 МИН (бесплатно).`
          );
          return;
        }
        this.stakePaid = preset.cost;
      }
      this.placeMinesAvoiding(idx);
      this.status = 'playing';
    }

    if (cell.isMine) {
      this.triggerLoss(idx);
      return;
    }

    this.revealSafeRegion(idx);

    const safeTarget = TOTAL_CELLS - this.mineCount;
    if (this.safeRevealed >= safeTarget) {
      this.triggerWin();
      return;
    }

    const audio = this.engine.getModule('hud')?.audio;
    audio?.playReelTick?.(640 + this.safeRevealed * 16);
    this.updateStatsHeader();
    this.setResultState(
      null,
      `ОТКРЫТО: ${this.safeRevealed} / ${safeTarget}`,
      'Продолжайте выбирать безопасные клетки. ПКМ ставит флаг на подозрительную клетку.'
    );
    this.renderBoard();
  }

  toggleFlag(idx) {
    if (this.status === 'won' || this.status === 'lost') return;
    const cell = this.cells[idx];
    if (!cell || cell.revealed) return;

    cell.flagged = !cell.flagged;
    this.engine.getModule('hud')?.audio?.playReelTick?.(cell.flagged ? 520 : 420);
    this.updateStatsHeader();
    this.renderBoard();
  }

  revealSafeRegion(startIdx) {
    const queue = [this.cells[startIdx]];
    const seen = new Set([startIdx]);

    while (queue.length > 0) {
      const cur = queue.shift();
      if (cur.revealed || cur.isMine || cur.flagged) continue;

      cur.revealed = true;
      this.safeRevealed++;

      if (cur.adj === 0) {
        for (const n of this.getNeighbors(cur.r, cur.c)) {
          if (!n.revealed && !n.isMine && !n.flagged && !seen.has(n.idx)) {
            seen.add(n.idx);
            queue.push(n);
          }
        }
      }
    }
  }

  triggerLoss(detonatedIdx) {
    this.status = 'lost';
    for (const cell of this.cells) {
      if (cell.isMine) {
        cell.revealed = true;
        cell.flagged = false;
        cell.detonated = cell.idx === detonatedIdx;
      }
    }

    this.engine.getModule('hud')?.audio?.playScam();
    this.updateStatsHeader();
    this.setResultState(
      'scam',
      'ПРОИГРЫШ! СРАБОТАЛА БОМБА',
      'Вы нажали на заминированную клетку. Нажмите «НОВОЕ ПОЛЕ» для повторной попытки.'
    );
    this.renderBoard();
  }

  triggerWin() {
    this.status = 'won';
    for (const cell of this.cells) {
      if (cell.isMine) {
        cell.flagged = true;
      }
    }

    const preset = this.getPreset();
    let weaponConfig = null;
    if (preset.weaponBonus) {
      const pool = [WEAPON_CONFIGS.raygun, WEAPON_CONFIGS.minigun, WEAPON_CONFIGS.ak47, WEAPON_CONFIGS.mp40];
      weaponConfig = pool[Math.floor(Math.random() * pool.length)];
    }

    this.engine.getModule('hud')?.audio?.playJackpot();
    this.engine.bus.emit(EVENTS.LUDKA_REWARD, {
      kind: 'saper_win',
      title: weaponConfig
        ? `САПЁР ${preset.mines} МИН: +${preset.rewardCoins} ОЧК. + ${weaponConfig.name}`
        : `САПЁР ${preset.mines} МИН: ПОБЕДА +${preset.rewardCoins} ОЧКОВ`,
      coins: preset.rewardCoins,
      maxAmmo: preset.maxAmmo,
      weaponConfig,
      label: weaponConfig
        ? `САПЁР ПОБЕДА +${preset.rewardCoins} + ${weaponConfig.name}`
        : `САПЁР ПОБЕДА +${preset.rewardCoins} ОЧКОВ`
    });

    this.updateStatsHeader();
    const extra = [
      preset.maxAmmo ? 'полный боекомплект' : '',
      weaponConfig ? `ствол ${weaponConfig.name}` : ''
    ].filter(Boolean).join(', ');
    this.setResultState(
      'win',
      `ПОБЕДА! +${preset.rewardCoins} ОЧКОВ`,
      extra ? `Минное поле зачищено! Выдано: ${extra}.` : 'Все безопасные клетки открыты без единого подрыва.'
    );
    this.renderBoard();
  }

  renderBoard() {
    const grid = this.dom.grid;
    if (!grid) return;

    grid.innerHTML = '';
    for (const cell of this.cells) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'saper-cell';
      btn.dataset.idx = `${cell.idx}`;

      if (cell.revealed) {
        if (cell.isMine) {
          btn.classList.add('is-mine');
          if (cell.detonated) btn.classList.add('is-detonated');
          btn.innerHTML = BOMB_SVG;
        } else {
          btn.classList.add('is-open');
          if (cell.adj > 0) {
            btn.classList.add(`num-${cell.adj}`);
            btn.textContent = `${cell.adj}`;
          }
        }
      } else if (cell.flagged) {
        btn.classList.add(this.status === 'won' ? 'is-defused' : 'is-flagged');
        btn.innerHTML = this.status === 'won' ? DEFUSED_SVG : FLAG_SVG;
      }

      btn.addEventListener('click', () => this.handleCellClick(cell.idx));
      btn.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        this.toggleFlag(cell.idx);
      });

      grid.appendChild(btn);
    }
  }
}

__exports.SaperModule = SaperModule;
  };

  __modules['src/config/apiConfig.js'] = function(__exports, __require) {
/**
 * Конфигурация подключения к PostgreSQL API-бэкенду.
 * На GitHub Pages или file:// без указанного сервера игра работает в автономном режиме с localStorage.
 */

const API_URL_STORAGE_KEY = 'blinov_api_url';
const NICKNAME_STORAGE_KEY = 'blinov_nickname';

function isFileProtocol() {
  return typeof window !== 'undefined' && window.location?.protocol === 'file:';
}

function normalizeApiUrl(rawUrl) {
  const clean = String(rawUrl || '').trim().replace(/\/+$/, '');
  if (!clean) return '';
  if (/^https?:\/\//i.test(clean)) return clean;
  return `http://${clean}`;
}

function getApiBaseUrl() {
  if (typeof window === 'undefined') return '';

  const params = new URLSearchParams(window.location.search || '');
  const queryApi = params.get('api');
  if (queryApi !== null) {
    const normalized = normalizeApiUrl(queryApi);
    if (normalized) {
      localStorage.setItem(API_URL_STORAGE_KEY, normalized);
      return normalized;
    }
    localStorage.removeItem(API_URL_STORAGE_KEY);
    return '';
  }

  const saved = normalizeApiUrl(localStorage.getItem(API_URL_STORAGE_KEY) || '');
  if (saved) return saved;

  const { protocol, hostname, origin, pathname } = window.location;
  const isStaticPagesHost = hostname.endsWith('.github.io') || hostname.endsWith('.pages.dev');
  const isSubpathStatic = pathname !== '/' && pathname !== '/index.html';
  if ((protocol === 'http:' || protocol === 'https:') && !isStaticPagesHost && !isSubpathStatic) {
    return origin;
  }

  return '';
}

function setApiBaseUrl(rawUrl) {
  const normalized = normalizeApiUrl(rawUrl);
  if (normalized) {
    localStorage.setItem(API_URL_STORAGE_KEY, normalized);
  } else {
    localStorage.removeItem(API_URL_STORAGE_KEY);
  }
  return normalized;
}

function getSavedNickname() {
  if (typeof localStorage === 'undefined') return 'BunkerFighter';
  const saved = (localStorage.getItem(NICKNAME_STORAGE_KEY) || '').trim();
  return saved || 'BunkerFighter';
}

function saveNickname(name) {
  const clean = String(name || 'BunkerFighter').trim().replace(/[<>]/g, '').slice(0, 32) || 'BunkerFighter';
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(NICKNAME_STORAGE_KEY, clean);
  }
  return clean;
}

__exports.isFileProtocol = isFileProtocol; __exports.normalizeApiUrl = normalizeApiUrl; __exports.getApiBaseUrl = getApiBaseUrl; __exports.setApiBaseUrl = setApiBaseUrl; __exports.getSavedNickname = getSavedNickname; __exports.saveNickname = saveNickname;
  };

  __modules['src/modules/db/DatabaseModule.js'] = function(__exports, __require) {
/**
 * DatabaseModule — интеграция с локальным PostgreSQL API и fallback-кешем в localStorage.
 * Позволяет запускаться на GitHub Pages без сервера и подключать локальную или удалённую БД.
 */
const { EVENTS } = __require('src/core/Constants.js');
const {
  getApiBaseUrl,
  getSavedNickname,
  isFileProtocol,
  saveNickname,
  setApiBaseUrl,
} = __require('src/config/apiConfig.js');
const LOCAL_RUNS_KEY = 'blinov_local_runs';
const LOCAL_LUDKA_KEY = 'blinov_local_ludka';

function isTypingInInput(target) {
  if (!target) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}

function readLocalJson(key) {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalJson(key, list) {
  try {
    localStorage.setItem(key, JSON.stringify(list.slice(0, 30)));
  } catch {
    // Игнорируем переполнение localStorage
  }
}

class DatabaseModule {
  constructor() {
    this.name = 'database';
    this.engine = null;
    this.apiUrl = getApiBaseUrl();
    this.dbConnected = false;
    this.dbName = 'blinov_zombies';
    this.isOpen = false;
    this.activeTab = 'runs';

    this.runStartedAt = Date.now();
    this.ludkaSpins = 0;
    this.memesWatched = 0;
    this.revivedUsed = 0;
    this.lastMeme = null;
    this.runSavedForDeath = false;

    this.dom = {};
  }

  async init(engine) {
    this.engine = engine;
    this.cacheDom();
    this.bindEvents();
    this.resetRunCounters();

    if (this.dom.nickInput) this.dom.nickInput.value = getSavedNickname();
    if (this.dom.apiInput) this.dom.apiInput.value = this.apiUrl;

    // Неблокирующая фоновая проверка соединения с PostgreSQL
    this.checkHealth().catch(() => {});
  }

  cacheDom() {
    this.dom = {
      modal: document.getElementById('leaderboard-modal'),
      btnHud: document.getElementById('btn-open-db'),
      btnPause: document.getElementById('btn-pause-db'),
      btnGameOver: document.getElementById('btn-gameover-db'),
      btnClose: document.getElementById('btn-db-close'),
      btnRefresh: document.getElementById('btn-db-refresh'),
      btnConnect: document.getElementById('btn-db-connect'),
      statusPill: document.getElementById('db-status-pill'),
      nickInput: document.getElementById('db-nickname-input'),
      apiInput: document.getElementById('db-api-url-input'),
      summaryRow: document.getElementById('db-summary-row'),
      tabRuns: document.getElementById('tab-db-runs'),
      tabLudka: document.getElementById('tab-db-ludka'),
      tableBody: document.getElementById('db-table-body'),
      tableHead: document.getElementById('db-table-head'),
      gameOverStatus: document.getElementById('gameover-db-status'),
      fileNotice: document.getElementById('db-file-notice'),
    };
  }

  bindEvents() {
    const bus = this.engine.bus;

    bus.on(EVENTS.LUDKA_REWARD, (data) => {
      this.ludkaSpins++;
      this.recordLudkaSpin(data).catch(() => {});
    });

    bus.on(EVENTS.PLAYER_REVIVE, () => {
      this.revivedUsed++;
      this.runSavedForDeath = false;
      if (this.dom.gameOverStatus) {
        this.dom.gameOverStatus.textContent = '';
      }
    });

    bus.on(EVENTS.GAME_RESTART, () => {
      this.resetRunCounters();
      if (this.dom.gameOverStatus) {
        this.dom.gameOverStatus.textContent = '';
      }
    });

    bus.on(EVENTS.PLAYER_DIED, () => {
      this.recordCompletedRun().catch(() => {});
    });

    this.dom.btnHud?.addEventListener('click', () => this.openModal());
    this.dom.btnPause?.addEventListener('click', () => {
      this.engine.getModule('meme_ludka')?.closePause();
      this.openModal();
    });
    this.dom.btnGameOver?.addEventListener('click', () => this.openModal());
    this.dom.btnClose?.addEventListener('click', () => this.closeModal());
    this.dom.btnRefresh?.addEventListener('click', () => this.refreshData());

    this.dom.btnConnect?.addEventListener('click', async () => {
      const nextUrl = setApiBaseUrl(this.dom.apiInput?.value || '');
      this.apiUrl = nextUrl;
      if (this.dom.apiInput) this.dom.apiInput.value = nextUrl;
      await this.checkHealth();
      await this.refreshData();
    });

    this.dom.nickInput?.addEventListener('change', () => {
      const clean = saveNickname(this.dom.nickInput.value);
      this.dom.nickInput.value = clean;
    });

    this.dom.tabRuns?.addEventListener('click', () => {
      this.activeTab = 'runs';
      this.renderActiveTabButtons();
      this.refreshData();
    });

    this.dom.tabLudka?.addEventListener('click', () => {
      this.activeTab = 'ludka';
      this.renderActiveTabButtons();
      this.refreshData();
    });

    window.addEventListener('keydown', (e) => {
      if (isTypingInInput(e.target)) {
        if (e.code === 'Escape' && this.isOpen) {
          e.preventDefault();
          this.closeModal();
        }
        return;
      }

      if (e.code === 'Escape' && this.isOpen) {
        e.preventDefault();
        this.closeModal();
        return;
      }

      if (e.code === 'KeyL') {
        const memeMode = this.engine.getModule('meme_ludka')?.mode;
        if (this.isOpen) {
          e.preventDefault();
          this.closeModal();
        } else if (memeMode === 'none' && !this.engine.isPaused) {
          e.preventDefault();
          this.openModal();
        }
      }
    });
  }

  resetRunCounters() {
    this.runStartedAt = Date.now();
    this.ludkaSpins = 0;
    this.memesWatched = 0;
    this.revivedUsed = 0;
    this.lastMeme = null;
    this.runSavedForDeath = false;
  }

  renderActiveTabButtons() {
    this.dom.tabRuns?.classList.toggle('active', this.activeTab === 'runs');
    this.dom.tabLudka?.classList.toggle('active', this.activeTab === 'ludka');
  }

  async apiFetch(path, options = {}) {
    if (!this.apiUrl) {
      throw new Error('API URL not configured');
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    try {
      const res = await fetch(`${this.apiUrl}${path}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  }

  async checkHealth() {
    if (!this.apiUrl) {
      this.dbConnected = false;
      this.updateStatusUI();
      return false;
    }

    try {
      const data = await this.apiFetch('/api/health');
      this.dbConnected = Boolean(data?.ok);
      this.dbName = data?.database || 'blinov_zombies';
    } catch {
      this.dbConnected = false;
    }
    this.updateStatusUI();
    return this.dbConnected;
  }

  updateStatusUI() {
    if (this.dom.statusPill) {
      this.dom.statusPill.classList.toggle('online', this.dbConnected);
      this.dom.statusPill.classList.toggle('offline', !this.dbConnected);
      this.dom.statusPill.textContent = this.dbConnected
        ? `БД: ОНЛАЙН (${this.dbName})`
        : 'ЛОКАЛЬНО (БД НЕ ПОДКЛЮЧЕНА)';
    }

    if (this.dom.fileNotice) {
      if (isFileProtocol()) {
        this.dom.fileNotice.classList.remove('hidden');
        this.dom.fileNotice.textContent =
          'Открыто через file:// — для записи в локальный PostgreSQL запустите ./start-local.sh и откройте http://localhost:3000/';
      } else {
        this.dom.fileNotice.classList.add('hidden');
      }
    }
  }

  getNickname() {
    return saveNickname(this.dom.nickInput?.value || getSavedNickname());
  }

  async recordCompletedRun() {
    if (this.runSavedForDeath) return;
    this.runSavedForDeath = true;

    const hud = this.engine.getModule('hud');
    const player = this.engine.getModule('player');
    const payload = {
      nickname: this.getNickname(),
      roundReached: Math.max(1, hud?.round || 1),
      kills: hud?.stats?.kills || 0,
      headshots: hud?.stats?.headshots || 0,
      pointsFinal: Math.max(0, player?.points ?? hud?.points ?? 0),
      totalEarned: hud?.stats?.totalEarned || 0,
      shotsFired: hud?.stats?.shotsFired || 0,
      ludkaSpins: this.ludkaSpins,
      memesWatched: this.memesWatched,
      revivedUsed: this.revivedUsed,
      survivedSec: Math.max(1, Math.round((Date.now() - this.runStartedAt) / 1000)),
      created_at: new Date().toISOString(),
    };

    const localRuns = readLocalJson(LOCAL_RUNS_KEY);
    localRuns.unshift({
      nickname: payload.nickname,
      round_reached: payload.roundReached,
      kills: payload.kills,
      headshots: payload.headshots,
      total_earned: payload.totalEarned,
      ludka_spins: payload.ludkaSpins,
      created_at: payload.created_at,
    });
    localRuns.sort((a, b) => (b.round_reached - a.round_reached) || (b.total_earned - a.total_earned));
    writeLocalJson(LOCAL_RUNS_KEY, localRuns);

    try {
      await this.apiFetch('/api/runs', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      this.dbConnected = true;
      this.updateStatusUI();
      if (this.dom.gameOverStatus) {
        this.dom.gameOverStatus.textContent = `Забег записан: ${payload.nickname} (Раунд ${payload.roundReached})`;
      }
    } catch {
      if (this.dom.gameOverStatus) {
        this.dom.gameOverStatus.textContent = `Сохранено локально: ${payload.nickname} (Раунд ${payload.roundReached})`;
      }
    }
  }

  async recordLudkaSpin(reward) {
    if (!reward) return;

    const entry = {
      nickname: this.getNickname(),
      memeId: this.lastMeme?.id || null,
      memeType: this.lastMeme?.type || null,
      outcomeId: reward.kind || 'unknown',
      outcomeTitle: reward.title || reward.label || 'Лудка 777',
      coinsDelta: Number(reward.coins || 0),
      weaponWon: reward.weaponConfig?.id || null,
      risked: Boolean(reward.risked),
      riskWon: reward.riskWon ?? null,
    };

    const localLudka = readLocalJson(LOCAL_LUDKA_KEY);
    localLudka.unshift({
      nickname: entry.nickname,
      outcome_title: entry.outcomeTitle,
      coins_delta: entry.coinsDelta,
      weapon_won: entry.weaponWon,
      risked: entry.risked,
      risk_won: entry.riskWon,
      created_at: new Date().toISOString(),
    });
    writeLocalJson(LOCAL_LUDKA_KEY, localLudka);

    try {
      await this.apiFetch('/api/ludka', {
        method: 'POST',
        body: JSON.stringify(entry),
      });
      this.dbConnected = true;
      this.updateStatusUI();
    } catch {
      // Локально уже сохранено
    }
  }

  openModal() {
    this.isOpen = true;
    this.engine.setPaused(true, 'leaderboard');
    this.dom.modal?.classList.remove('hidden');
    this.renderActiveTabButtons();
    this.updateStatusUI();
    this.refreshData();
  }

  closeModal() {
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
    this.isOpen = false;
    this.dom.modal?.classList.add('hidden');
    this.engine.setPaused(false, 'leaderboard');
  }

  async refreshData() {
    let payload = null;
    try {
      payload = await this.apiFetch('/api/leaderboard?limit=15');
      this.dbConnected = Boolean(payload?.ok);
    } catch {
      this.dbConnected = false;
    }
    this.updateStatusUI();

    if (payload?.ok) {
      this.renderSummary(payload.summary, true);
      if (this.activeTab === 'runs') {
        this.renderRunsTable(payload.runs || []);
      } else {
        this.renderLudkaTable(payload.ludkaHistory || []);
      }
      return;
    }

    const localRuns = readLocalJson(LOCAL_RUNS_KEY);
    const localLudka = readLocalJson(LOCAL_LUDKA_KEY);
    this.renderSummary({
      total_runs: localRuns.length,
      total_kills: localRuns.reduce((s, r) => s + (r.kills || 0), 0),
      top_round: localRuns.reduce((m, r) => Math.max(m, r.round_reached || 1), 1),
      total_ludka_spins: localLudka.length,
    }, false);

    if (this.activeTab === 'runs') {
      this.renderRunsTable(localRuns);
    } else {
      this.renderLudkaTable(localLudka);
    }
  }

  renderSummary(summary = {}, isLive = false) {
    if (!this.dom.summaryRow) return;
    const prefix = isLive ? 'СЕРВЕР' : 'ЛОКАЛЬНО';
    this.dom.summaryRow.textContent =
      `${prefix}: ЗАБЕГОВ ${summary.total_runs || 0} | МАКС. РАУНД ${summary.top_round || 1} | УБИТО ${summary.total_kills || 0} | ДОДЕПОВ ${summary.total_ludka_spins || 0}`;
  }

  clearAndBuildRow(cells) {
    const tr = document.createElement('tr');
    for (const value of cells) {
      const td = document.createElement('td');
      td.textContent = value;
      tr.appendChild(td);
    }
    return tr;
  }

  renderHeader(headers) {
    if (!this.dom.tableHead) return;
    this.dom.tableHead.innerHTML = '';
    const tr = document.createElement('tr');
    for (const label of headers) {
      const th = document.createElement('th');
      th.textContent = label;
      tr.appendChild(th);
    }
    this.dom.tableHead.appendChild(tr);
  }

  renderRunsTable(runs) {
    this.renderHeader(['#', 'Боец', 'Раунд', 'Убийства', 'Хедшоты', 'Очки всего', 'Лудки']);
    if (!this.dom.tableBody) return;
    this.dom.tableBody.innerHTML = '';

    if (!runs.length) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 7;
      td.textContent = 'Пока нет сохранённых забегов. Сыграйте раунд или подключите локальный сервер!';
      tr.appendChild(td);
      this.dom.tableBody.appendChild(tr);
      return;
    }

    runs.forEach((run, i) => {
      this.dom.tableBody.appendChild(
        this.clearAndBuildRow([
          `${i + 1}`,
          `${run.nickname || 'BunkerFighter'}`,
          `${run.round_reached ?? 1}`,
          `${run.kills ?? 0}`,
          `${run.headshots ?? 0}`,
          `${run.total_earned ?? 0}`,
          `${run.ludka_spins ?? 0}`,
        ])
      );
    });
  }

  renderLudkaTable(entries) {
    this.renderHeader(['Боец', 'Результат додепа', 'Очки', 'Оружие', 'Докрут x2']);
    if (!this.dom.tableBody) return;
    this.dom.tableBody.innerHTML = '';

    if (!entries.length) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 5;
      td.textContent = 'Пока нет записей додепов. Нажмите [G] в игре для запуска.';
      tr.appendChild(td);
      this.dom.tableBody.appendChild(tr);
      return;
    }

    entries.forEach((item) => {
      const riskLabel = item.risked ? (item.risk_won ? 'x2 ПОБЕДА' : 'СГОРЕЛО') : '—';
      const coins = Number(item.coins_delta || 0);
      this.dom.tableBody.appendChild(
        this.clearAndBuildRow([
          `${item.nickname || 'BunkerFighter'}`,
          `${item.outcome_title || item.outcome_id || 'Лудка'}`,
          `${coins >= 0 ? '+' : ''}${coins}`,
          `${item.weapon_won || '—'}`,
          riskLabel,
        ])
      );
    });
  }
}

__exports.DatabaseModule = DatabaseModule;
  };

  __modules['src/modules/multiplayer/MultiplayerModule.js'] = function(__exports, __require) {
const { getApiBaseUrl, setApiBaseUrl } = __require('src/config/apiConfig.js');
class MultiplayerModule {
  constructor() {
    this.name = 'multiplayer';
    this.alwaysUpdate = true;
    this.id = globalThis.crypto?.randomUUID?.() || `player-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    this.room = '';
    this.players = [];
    this.isHost = false;
    this.pending = [];
    this.seen = new Set();
    this.busy = false;
    this.lastPoll = 0;
  }
  init(engine) {
    this.engine = engine;
    const box = document.createElement('div');
    box.className = 'multiplayer-panel';
    box.innerHTML = `<button class="network-open" type="button">Совместная игра</button><span class="network-status">Одиночная игра</span><div class="network-dialog hidden"><div class="network-card"><div class="network-heading"><strong>Совместная игра</strong><button type="button" class="network-close" aria-label="Закрыть">×</button></div><p>Создайте комнату или войдите к другу.</p><label>Адрес сервера<input class="network-server" placeholder="https://адрес-сервера"></label><label>Ваше имя<input class="network-name" maxlength="20" placeholder="Игрок"></label><label>Название комнаты<input class="network-room" maxlength="24" placeholder="Например, bunker" autocomplete="off"></label><div class="network-actions"><button class="network-create" type="button">Создать комнату</button><button class="network-join" type="button">Войти в комнату</button><button class="network-leave hidden" type="button">Выйти из комнаты</button></div><p class="network-info">Название комнаты — латинские буквы и цифры.</p><div class="network-address"></div></div></div>`;
    document.body.appendChild(box);
    this.box = box;
    this.status = box.querySelector('.network-status');
    this.info = box.querySelector('.network-info');
    this.address = box.querySelector('.network-address');
    this.dialog = box.querySelector('.network-dialog');
    const server = box.querySelector('.network-server');
    server.value = getApiBaseUrl();
    const room = box.querySelector('.network-room');
    const name = box.querySelector('.network-name');
    this.openMenu = () => this.dialog.classList.remove('hidden');
    box.querySelector('.network-open').onclick = this.openMenu;
    box.querySelector('.network-close').onclick = () => this.dialog.classList.add('hidden');
    this.connect = (action, roomName = room.value) => {
      if (this.room || this.busy) return;
      const value = roomName.trim();
      if (!/^[a-zA-Z0-9_-]{1,24}$/.test(value)) { this.info.textContent = 'Введите название комнаты латинскими буквами или цифрами.'; return; }
      const api = server.value.trim();
      if (!api && (location.protocol === 'file:' || location.hostname.endsWith('.github.io'))) { this.info.textContent = 'Укажите адрес сервера игры.'; return; }
      if (api && location.protocol === 'https:' && !api.startsWith('https://')) { this.info.textContent = 'Для этой страницы нужен адрес сервера с https://'; return; }
      setApiBaseUrl(api);
      this.apiBase = getApiBaseUrl();
      room.value = value;
      this.room = value; this.playerName = name.value.trim() || 'Игрок';
      this.action = action; this.isHost = false; this.seen.clear(); this.pending = [];
      this.info.textContent = 'Подключаемся…'; this.poll();
    };
    box.querySelector('.network-create').onclick = () => this.connect('create');
    box.querySelector('.network-join').onclick = () => this.connect('join');
    box.querySelector('.network-leave').onclick = () => this.leave();
    const params = new URLSearchParams(location.search);
    if (params.get('room')) { room.value = params.get('room'); this.openMenu(); }
    this.apiBase = getApiBaseUrl();
    fetch(`${this.apiBase}/api/network`).then(r => r.ok ? r.json() : Promise.reject()).then(data => { this.addresses = data.addresses || []; }).catch(() => {});
    window.addEventListener('pagehide', () => this.leave());
  }
  leave() {
    if (this.room) navigator.sendBeacon(`${this.apiBase}/api/multiplayer`, new Blob([JSON.stringify({room:this.room,id:this.id,leave:true})], {type:'application/json'}));
    this.room = ''; this.isHost = false; this.players = []; this.pending = [];
    this.status.textContent = 'Одиночная игра';
    this.info.textContent = 'Вы вышли из комнаты.';
    this.address.textContent = '';
    this.box.querySelector('.network-leave').classList.add('hidden');
  }
  send(event) { if (this.room) this.pending.push(event); }
  update() {
    if (this.room && !this.busy && performance.now() - this.lastPoll > 120) this.poll();
    if (!this.room || this.isHost || this.engine.isPaused) return;
    const player = this.engine.getModule('player');
    const zombies = this.engine.getModule('zombies');
    if (!player || player.isDead || !zombies) return;
    const now = performance.now();
    for (const z of zombies.zombies) {
      if (Math.hypot(player.x-z.x, player.y-z.y) < player.radius + z.radius && now - (this.lastDamage || 0) > 1000) {
        player.takeDamage(z.damage || 20); this.lastDamage = now; break;
      }
    }
  }
  async poll() {
    if (!this.room || this.busy) return;
    this.busy = true; this.lastPoll = performance.now();
    const room = this.room;
    const player = this.engine.getModule('player');
    const zombies = this.engine.getModule('zombies');
    const map = this.engine.getModule('map');
    const events = this.pending.splice(0);
    const body = { room, action:this.action, id:this.id, name:this.playerName, x:player.x, y:player.y, angle:player.angle, hp:player.hp, events };
    if (this.isHost) body.world = { zombies:zombies.zombies, projectiles:zombies.enemyProjectiles, pools:zombies.hazardPools, powerUps:zombies.powerUps, round:zombies.currentRound, doors:map.doors.filter(d => d.isOpen).map(d => d.id) };
    try {
      const response = await fetch(`${this.apiBase}/api/multiplayer`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
      const data = await response.json().catch(() => ({}));
      if (response.status === 404 && this.action === 'create') { this.room = ''; this.action = null; this.info.textContent = 'Сервер мультиплеера не найден. Откройте актуальный адрес сервера игры и обновите страницу.'; return; }
      if (!response.ok) { if (this.action) { this.room = ''; this.action = null; this.info.textContent = data.error === 'Not found' ? 'Комната не найдена. Проверьте название и адрес сервера.' : (data.error || 'Не удалось войти'); return; } throw new Error('network'); }
      this.action = null;
      this.box.querySelector('.network-leave').classList.remove('hidden');
      this.info.textContent = `Вы в комнате «${room}». Друг должен открыть адрес вашего компьютера и войти с тем же названием.`;
      if (this.isHost || data.host === this.id) { const page = new URL(location.href); page.searchParams.set('room', room); if (this.apiBase) page.searchParams.set('api', this.apiBase); this.address.textContent = `Ссылка для друзей: ${page.toString()}`; }
      if (room !== this.room) return;
      this.isHost = data.host === this.id;
      this.players = data.players.filter(p => p.id !== this.id);
      this.status.textContent = `Комната ${room} · игроков: ${data.players.length}${this.isHost ? ' · ведущий' : ''}`;
      if (!this.isHost && data.world) {
        zombies.zombies = data.world.zombies || [];
        zombies.enemyProjectiles = data.world.projectiles || [];
        zombies.hazardPools = data.world.pools || [];
        zombies.powerUps = data.world.powerUps || [];
        zombies.currentRound = data.world.round;
        for (const door of data.world.doors || []) map.openDoor(door);
      }
      for (const event of data.events || []) {
        if (this.seen.has(event.seq)) continue;
        this.seen.add(event.seq);
        if (event.from === this.id) continue;
        if (event.type === 'hit' && this.isHost) {
          const index = zombies.zombies.findIndex(z => z.id === event.id);
          if (index >= 0) {
            const z = zombies.zombies[index]; z.hp -= Math.max(0, Math.min(1000, Number(event.damage) || 0)); z.hitFlashTime = .1;
            if (z.hp <= 0) zombies.killZombieAtIndex(index, false);
          }
        }
        if (event.type === 'spawn' && this.isHost) zombies.spawnAdminZombie(event.enemy);
        if (event.type === 'door' && this.isHost) map.openDoor(event.id);
        if (event.type === 'teleport' && event.target === this.id && Number.isFinite(event.x) && Number.isFinite(event.y)) {
          if (!map.checkCollision(event.x, event.y, player.radius)) { player.x = event.x; player.y = event.y; }
        }
      }
      if (this.seen.size > 1000) this.seen = new Set((data.events || []).map(e => e.seq));
    } catch { this.pending.unshift(...events); this.status.textContent = 'Нет связи с сервером'; this.info.textContent = 'Сервер недоступен. Запустите игру через npm start и откройте её адрес в браузере.'; }
    finally { this.busy = false; }
  }
  render(ctx) {
    if (!this.room) return;
    for (const p of this.players) {
      ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.angle);
      ctx.fillStyle = '#70c9e8'; ctx.beginPath(); ctx.arc(0,0,18,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#d5efff'; ctx.fillRect(8,-4,20,8); ctx.rotate(-p.angle);
      ctx.fillStyle = '#fff'; ctx.font = '14px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(p.name,0,-27); ctx.restore();
    }
  }
}

__exports.MultiplayerModule = MultiplayerModule;
  };

  __modules['src/main.js'] = function(__exports, __require) {
/**
 * main.js - Точка входа в игру Call of Duty: Zombies 2D.
 */
const { Engine } = __require('src/core/Engine.js');
const { EventBus } = __require('src/core/EventBus.js');
const { Loader } = __require('src/core/Loader.js');
const { MapModule } = __require('src/modules/map/MapModule.js');
const { PlayerModule } = __require('src/modules/player/PlayerModule.js');
const { MysteryBoxModule } = __require('src/modules/mystery_box/MysteryBoxModule.js');
const { ZombiesModule } = __require('src/modules/zombies/ZombiesModule.js');
const { VisualsModule } = __require('src/modules/visuals/VisualsModule.js');
const { HudModule } = __require('src/modules/hud/HudModule.js');
const { MemeLudkaModule } = __require('src/modules/memes/MemeLudkaModule.js');
const { SaperModule } = __require('src/modules/minigames/SaperModule.js');
const { DatabaseModule } = __require('src/modules/db/DatabaseModule.js');
const { MultiplayerModule } = __require('src/modules/multiplayer/MultiplayerModule.js');
async function bootstrap() {
  if (window.__BLINOV_BOOTED__) return;
  window.__BLINOV_BOOTED__ = true;

  const canvas = document.getElementById('gameCanvas');
  const bus = new EventBus(false);
  const engine = new Engine(canvas, bus);
  const loader = new Loader(engine);

  loader.addStage(
    'Бункер и маршруты',
    'Построение карты Nacht der Untoten и точек спавна...',
    async (eng) => {
      const map = new MapModule();
      eng.registerModule(map);
      await map.init(eng);
    }
  );

  loader.addStage(
    'Боец и арсенал',
    'Подготовка оружия, баллистики и Mystery Box...',
    async (eng) => {
      const player = new PlayerModule();
      eng.registerModule(player);
      await player.init(eng);

      const box = new MysteryBoxModule();
      eng.registerModule(box);
      await box.init(eng);
    }
  );

  loader.addStage(
    'Орда и волны',
    'Инициализация зомби, навигации и бонусов...',
    async (eng) => {
      const zombies = new ZombiesModule();
      eng.registerModule(zombies);
      await zombies.init(eng);
    }
  );

  loader.addStage(
    'Эффекты и звук',
    'Настройка освещения, крови, частиц и синтезатора...',
    async (eng) => {
      const visuals = new VisualsModule();
      eng.registerModule(visuals);
      await visuals.init(eng);
    }
  );

  loader.addStage(
    'Интерфейс и снабжение',
    'Подключение HUD, Лудки 777, Сапёра и базы данных...',
    async (eng) => {
      const hud = new HudModule();
      eng.registerModule(hud);
      await hud.init(eng);

      const memeLudka = new MemeLudkaModule();
      eng.registerModule(memeLudka);
      await memeLudka.init(eng);

      const saper = new SaperModule();
      eng.registerModule(saper);
      await saper.init(eng);

      const database = new DatabaseModule();
      eng.registerModule(database);
      await database.init(eng);
    }
  );

  await loader.run();

  const multiplayer = new MultiplayerModule();
  engine.registerModule(multiplayer);
  multiplayer.init(engine);

  const panel = document.createElement('div');
  panel.className = 'local-admin hidden';
  panel.innerHTML = '<strong>Панель управления</strong><select aria-label="Тип врага"></select><button type="button">Создать врага</button><span></span>';
  const select = panel.querySelector('select');
  for (const [value, label] of Object.entries({walker:'Зомби', runner:'Бегун', crawler:'Ползун', hellhound:'Адская гончая', spitter:'Плевун', bomber:'Камикадзе', shield:'Щитоносец', hazmat:'Мутант', phantom:'Фантом', screamer:'Крикун', brute:'Громила', necromancer:'Некромант', boss:'Босс'})) {
    select.add(new Option(label, value));
  }
  panel.querySelector('button').addEventListener('click', () => {
    const spawned = multiplayer.room && !multiplayer.isHost ? (multiplayer.send({type:'spawn', enemy:select.value}), true) : engine.getModule('zombies')?.spawnAdminZombie(select.value);
    panel.querySelector('span').textContent = spawned ? 'Враг создан' : 'Не удалось создать врага';
  });
  const adminRoom = document.createElement('input');
  adminRoom.placeholder = 'Название комнаты';
  const adminJoin = document.createElement('button');
  adminJoin.textContent = 'Войти в комнату';
  adminJoin.onclick = () => { multiplayer.connect('join', adminRoom.value); };
  panel.prepend(adminRoom, adminJoin);
  const targets = document.createElement('select');
  targets.setAttribute('aria-label', 'Игрок');
  const teleport = document.createElement('button');
  teleport.textContent = 'Перенести игрока ко мне';
  teleport.onclick = () => { const player = engine.getModule('player'); if (targets.value) multiplayer.send({type:'teleport', target:targets.value, x:player.x, y:player.y}); };
  panel.append(targets, teleport);
  setInterval(() => { const selected = targets.value; targets.replaceChildren(new Option('Выберите игрока', '')); for (const p of multiplayer.players) targets.add(new Option(p.name, p.id)); targets.value = selected || ''; }, 1000);
  document.body.appendChild(panel);
  window.addEventListener('keydown', event => {
    if (event.ctrlKey && event.shiftKey && event.code === 'KeyA') {
      event.preventDefault();
      panel.classList.toggle('hidden');
    }
  });

}

function startBootstrap() {
  bootstrap().catch((err) => {
    console.error('Fatal bootstrap error:', err);
    const details = document.getElementById('loading-details');
    if (details) details.textContent = `Ошибка запуска: ${err.message || err}`;
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startBootstrap, { once: true });
} else {
  startBootstrap();
}


  };

  __require('src/main.js');
})();
