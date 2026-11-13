/**
 * SaperModule - Мини-игра «Сапёр» 5x5 в стиле бункера CoD Zombies.
 * Открывай безопасные клетки без попадания на бомбы, чтобы забрать очки и снабжение.
 */
import { EVENTS, WEAPON_CONFIGS, GAME_SETTINGS } from '../../core/Constants.js';

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

export class SaperModule {
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
