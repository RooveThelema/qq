/**
 * Engine - Главный игровой движок: Game Loop, камера, пауза, рендер,
 * клавиатурный ввод и мобильное сенсорное управление (Touch Controls).
 */
import { EVENTS } from './Constants.js';

export class Engine {
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
