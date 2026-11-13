/**
 * DatabaseModule — интеграция с локальным PostgreSQL API и fallback-кешем в localStorage.
 * Позволяет запускаться на GitHub Pages без сервера и подключать локальную или удалённую БД.
 */
import { EVENTS } from '../../core/Constants.js';
import {
  getApiBaseUrl,
  getSavedNickname,
  isFileProtocol,
  saveNickname,
  setApiBaseUrl,
} from '../../config/apiConfig.js';

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

export class DatabaseModule {
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
