import { unpackState } from '../game/codec.js';

const SESSION_KEY = 'frontier_session_v1';
const readSession = () => { try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; } };
const storeSession = value => { try { value ? sessionStorage.setItem(SESSION_KEY, JSON.stringify(value)) : sessionStorage.removeItem(SESSION_KEY); } catch { /* Private browsing may disable storage. */ } };
const nonce = () => [...crypto.getRandomValues(new Uint8Array(16))].map(n => n.toString(16).padStart(2, '0')).join('');

/** One authoritative session, with bounded WebSocket and same-origin HTTP transports. */
export class NetworkClient {
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
