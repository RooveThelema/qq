/**
 * MemeLudkaModule - Терминал Лудки 777, система Додепа в стиле CoD Zombies и меню паузы
 * (без мем-вставок и рекламных окон).
 */
import { EVENTS, WEAPON_CONFIGS, GAME_SETTINGS } from '../../core/Constants.js';

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

export class MemeLudkaModule {
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
    video.addEventListener('ended', showImage, { once: true });
    video.addEventListener('error', showImage, { once: true });
    fetch('./api/memes').then(response => { if (!response.ok) throw new Error('API unavailable'); return response.json(); }).catch(() => fetch('./memes.json').then(response => response.json())).then(data => {
      if (closed) return;
      memes = data.memes || [];
      const videos = memes.filter(item => item.type === 'video');
      if (!videos.length) { showImage(); return; }
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
