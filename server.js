import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { gzipSync, gzip } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { WebSocketServer, WebSocket } from 'ws';
import { packState } from './src/game/codec.js';
import { World } from './src/game/World.js';
import { MAPS, HEROES, MAX_PLAYERS } from './src/game/catalog.js';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml' };
const validName = name => String(name || 'Выживший').replace(/[\x00-\x1f<>]/g, '').trim().slice(0, 20) || 'Выживший';
const MAX_BACKLOG = 65536;

// Control messages survive temporary congestion; stale snapshots are expendable.
function send(peer, data, serialized) {
  if (!peer || peer.readyState !== WebSocket.OPEN) return;
  if (peer.transport === 'http') { peer.send(data); return; }
  peer.controlQueue ||= [];
  if (data.type === 'state') {
    if (!peer.controlQueue.length && peer.bufferedAmount < MAX_BACKLOG) peer.send(serialized || JSON.stringify(data));
    return;
  }
  if (data.type === 'room') peer.controlQueue = peer.controlQueue.filter(item => item.type !== 'room');
  if (peer.controlQueue.length >= 32) { peer.close(1013, 'Соединение слишком медленное. Переподключитесь'); return; }
  peer.controlQueue.push(data);
  flush(peer);
}
function flush(peer) {
  if (peer.transport === 'http' || peer.readyState !== WebSocket.OPEN) return;
  while (peer.controlQueue?.length && peer.bufferedAmount < MAX_BACKLOG) peer.send(JSON.stringify(peer.controlQueue.shift()));
}
async function readBody(req) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 4096) throw new Error('Слишком большой запрос');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

export function createGameServer({ scoresPath = path.join(ROOT, 'data', 'scores.json'), reconnectMs = 30000, maxRooms = 64 } = {}) {
  const rooms = new Map();
  const sessions = new Map();
  const attempts = new Map();
  const staticCache = new Map();
  let scores = [];
  let persist = Promise.resolve();
  let pool;
  let tickCount = 0;
  try { scores = JSON.parse(fs.readFileSync(scoresPath, 'utf8')).slice(0, 100); } catch { /* First launch. */ }
  if (process.env.DATABASE_URL) {
    import('pg').then(async ({ default: pg }) => {
      pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 3000 });
      pool.on('error', err => console.error('[DB]', err.message));
      await pool.query(fs.readFileSync(path.join(ROOT, 'db/schema.sql'), 'utf8'));
      console.log('[DB] PostgreSQL подключён');
    }).catch(err => console.error('[DB] Используется файловая таблица рекордов:', err.message));
  }

  function record(room) {
    if (room.saved) return;
    room.saved = true;
    const result = { id: crypto.randomUUID(), map: room.world.mapId, runMode: room.world.director.mode, completed: room.world.director.completed, time: Math.floor(room.world.time), kills: room.world.kills, victory: room.world.status === 'victory',
      players: [...room.world.players.values()].map(p => ({ name: p.name, hero: p.hero, kills: p.kills, level: p.level })), createdAt: new Date().toISOString() };
    scores.push(result);
    scores.sort((a, b) => Number(b.victory) - Number(a.victory) || b.time - a.time || b.kills - a.kills);
    scores = scores.slice(0, 100);
    const text = JSON.stringify(scores, null, 2);
    persist = persist.then(async () => {
      await fs.promises.mkdir(path.dirname(scoresPath), { recursive: true });
      await fs.promises.writeFile(scoresPath + '.tmp', text);
      await fs.promises.rename(scoresPath + '.tmp', scoresPath);
    }).catch(err => console.error('[scores]', err.message));
    if (pool) pool.query('INSERT INTO survivor_runs (id, map_id, survived_sec, kills, victory, players) VALUES ($1,$2,$3,$4,$5,$6)', [result.id, result.map, result.time, result.kills, result.victory, JSON.stringify(result.players)]).catch(err => console.error('[DB]', err.message));
  }

  function json(res, code, data, compress = false) {
    let body = Buffer.from(JSON.stringify(data));
    const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Vary': 'Accept-Encoding' };
    const finish = (bytes, compressed = false) => {
      if (res.destroyed) return;
      if (compressed) headers['Content-Encoding'] = 'gzip';
      headers['Content-Length'] = bytes.length;
      res.writeHead(code, headers); res.end(bytes);
    };
    if (compress && body.length > 512) gzip(body, { level: 3 }, (err, bytes) => finish(err ? body : bytes, !err));
    else finish(body);
  }

  const server = http.createServer(async (req, res) => {
    try {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Referrer-Policy', 'same-origin');
      const url = new URL(req.url, 'http://localhost');
      const acceptGzip = /\bgzip\b/.test(req.headers['accept-encoding'] || '');
      if (url.pathname === '/api/health') return json(res, 200, { ok: true, game: 'last-frontier', protocol: 2, transports: ['websocket', 'http'], rooms: rooms.size, players: sessions.size });
      if (url.pathname === '/api/transport') {
        if (req.method !== 'POST') return json(res, 405, { error: 'Используйте POST' });
        const body = await readBody(req);
        if (!body || typeof body !== 'object' || Array.isArray(body)) return json(res, 400, { error: 'Некорректный запрос' });
        let peer;
        const token = /^Bearer ([a-f0-9]{64})$/.exec(req.headers.authorization || '')?.[1];
        const s = token ? sessions.get(token) : null;
        const connectionId = typeof body.connection === 'string' ? body.connection.slice(0, 80) : '';
        if (['create', 'join'].includes(body.type)) {
          peer = httpPeer(connectionId); peer.compact = body.compact === true;
          processMessage(peer, body);
        } else {
          if (!s || !rooms.has(s.room)) return json(res, 410, { messages: [{ type: 'expired', message: 'Комната закрыта или время переподключения истекло' }] });
          if (body.type === 'resume') {
            peer = httpPeer(connectionId); peer.compact = body.compact === true;
            bind(peer, s, rooms.get(s.room), true);
          } else {
            peer = s.ws;
            if (!peer) { peer = httpPeer(connectionId); bind(peer, s, rooms.get(s.room), true); }
            if (peer.transport !== 'http' || connectionId && peer.connectionId && connectionId !== peer.connectionId) return json(res, 409, { messages: [{ type: 'expired', message: 'Сессия открыта в другом подключении' }] });
          }
          peer.lastSeen = Date.now();
          const messages = Array.isArray(body.messages) ? body.messages.slice(0, 16) : body.type && body.type !== 'resume' ? [body] : [];
          for (const message of messages) processMessage(peer, message);
        }
        const active = peer.session;
        const room = active && rooms.get(active.room);
        return json(res, 200, { messages: peer.messages.splice(0), ...(room ? { room: roomInfo(room), state: peer.compact ? packState(room.world.snapshot()) : room.world.snapshot() } : {}) }, acceptGzip);
      }
      if (url.pathname === '/api/leaderboard') return json(res, 200, { runs: scores.slice(0, 15) });
      if (url.pathname === '/api/network') {
        let publicUrl = process.env.PUBLIC_URL || '';
        try {
          const tunnel = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/public-url.json'), 'utf8'));
          if (Number.isInteger(tunnel.pid) && tunnel.pid > 0) { process.kill(tunnel.pid, 0); publicUrl ||= tunnel.url; }
        } catch { /* No live tunnel. */ }
        const port = server.address()?.port;
        const addresses = Object.values(os.networkInterfaces()).flat().filter(i => i && i.family === 'IPv4' && !i.internal).map(i => `http://${i.address}:${port}/`);
        return json(res, 200, { addresses, publicUrl });
      }
      if (!['GET', 'HEAD'].includes(req.method)) return json(res, 405, { error: 'Метод не поддерживается' });
      const clean = decodeURIComponent(url.pathname);
      if (!['/', '/index.html', '/styles.css', '/favicon.svg', '/src/main.js', '/src/bundle.classic.js'].includes(clean) && !/^\/src\/(game|ui)\/[a-zA-Z0-9_-]+\.js$/.test(clean)) return json(res, 404, { error: 'Файл не найден' });
      const full = path.join(ROOT, clean === '/' ? 'index.html' : clean);
      const stat = await fs.promises.stat(full);
      let cached = staticCache.get(full);
      if (!cached || cached.mtime !== stat.mtimeMs || cached.size !== stat.size) {
        const data = await fs.promises.readFile(full);
        cached = { mtime: stat.mtimeMs, size: stat.size, data, gzip: data.length > 512 ? gzipSync(data, { level: 6 }) : null, etag: `"${stat.size}-${Math.floor(stat.mtimeMs)}"` };
        staticCache.set(full, cached);
      }
      const headers = { 'Content-Type': MIME[path.extname(full)] || 'application/octet-stream', 'Cache-Control': 'no-cache', 'Vary': 'Accept-Encoding', 'ETag': cached.etag };
      if (req.headers['if-none-match'] === cached.etag) { res.writeHead(304, headers); return res.end(); }
      const data = acceptGzip && cached.gzip ? cached.gzip : cached.data;
      if (data === cached.gzip) headers['Content-Encoding'] = 'gzip';
      headers['Content-Length'] = data.length;
      res.writeHead(200, headers); res.end(req.method === 'HEAD' ? undefined : data);
    } catch (err) { if (!res.headersSent) json(res, err.code === 'ENOENT' ? 404 : 400, { error: 'Не удалось открыть ресурс' }); else res.end(); }
  });

  const wss = new WebSocketServer({ noServer: true, maxPayload: 4096,
    perMessageDeflate: { threshold: 1024, clientNoContextTakeover: true, serverNoContextTakeover: true, concurrencyLimit: 4, zlibDeflateOptions: { level: 3, memLevel: 5 } } });
  server.on('upgrade', (req, socket, head) => {
    if (new URL(req.url, 'http://localhost').pathname !== '/ws' || wss.clients.size >= 300) { socket.destroy(); return; }
    wss.handleUpgrade(req, socket, head, ws => wss.emit('connection', ws, req));
  });

  function roomInfo(room) {
    return { code: room.code, owner: room.owner, mapId: room.world.mapId, runMode: room.world.director.mode, phase: room.world.status,
      players: [...room.slots.values()].map(s => { const p = room.world.players.get(s.id); return { id: s.id, name: p.name, hero: p.hero, connected: !!s.ws, ready: s.ready }; }) };
  }
  function broadcast(room, data) {
    let plain, compact, packed;
    for (const s of room.slots.values()) {
      if (!s.ws) continue;
      if (data.type !== 'state') { send(s.ws, data); continue; }
      if (s.ws.transport === 'http') continue;
      // Serialize once per room and wire format, regardless of player count.
      if (s.ws.compact) { packed ||= { ...data, state: packState(data.state) }; compact ||= JSON.stringify(packed); send(s.ws, packed, compact); }
      else { plain ||= JSON.stringify(data); send(s.ws, data, plain); }
    }
  }
  function announce(room) { broadcast(room, { type: 'room', room: roomInfo(room) }); }
  function removeSession(s) {
    const room = rooms.get(s.room);
    if (s.ws) s.ws.session = null;
    sessions.delete(s.token);
    if (s.requestId) attempts.delete(s.requestId);
    if (!room) return;
    room.slots.delete(s.id); room.world.players.delete(s.id);
    if (room.owner === s.id) room.owner = [...room.slots.values()].find(item => item.ws)?.id || room.slots.keys().next().value;
    if (!room.slots.size) rooms.delete(room.code); else announce(room);
  }
  function resetWorld(room) {
    const world = new World(room.world.mapId, Date.now(), room.world.director.mode);
    for (const s of room.slots.values()) { const old = room.world.players.get(s.id); const p = world.addPlayer(s.id, old.name, old.hero); p.connected = !!s.ws; s.ready = s.id === room.owner; }
    room.world = world; room.saved = false;
  }
  function disconnected(peer) {
    const s = peer.session;
    if (!s || s.ws !== peer) return;
    s.ws = null; s.disconnectedAt = Date.now(); peer.session = null;
    const room = rooms.get(s.room);
    if (!room) return;
    const p = room.world.players.get(s.id);
    p.connected = false; p.input = { x: 0, y: 0 };
    if (room.owner === s.id) room.owner = [...room.slots.values()].find(item => item.ws)?.id || s.id;
    announce(room);
  }
  function httpPeer(connectionId) {
    return { transport: 'http', connectionId, readyState: WebSocket.OPEN, messages: [], session: null, lastSeen: Date.now(), windowStart: Date.now(), count: 0,
      send(message) { if (message.type === 'state') return; if (message.type === 'room') this.messages = this.messages.filter(m => m.type !== 'room'); this.messages.push(message); if (this.messages.length > 32) this.messages.shift(); },
      close() { this.readyState = WebSocket.CLOSED; disconnected(this); } };
  }
  function bind(peer, s, room, resumed = false) {
    if (s.ws && s.ws !== peer) { s.ws.session = null; s.ws.close(4001, 'Подключено в другой вкладке'); }
    s.ws = peer; s.disconnectedAt = 0; s.lastInput = Date.now(); peer.session = s;
    room.world.players.get(s.id).connected = true;
    send(peer, { type: 'welcome', id: s.id, token: s.token, resumed, room: roomInfo(room), state: peer.compact ? packState(room.world.snapshot()) : room.world.snapshot() });
    announce(room);
  }
  function processMessage(peer, m) {
    const now = Date.now();
    if (now - peer.windowStart > 1000) { peer.windowStart = now; peer.count = 0; }
    if (++peer.count > 100) { peer.close(1008, 'Слишком много запросов'); return; }
    const fail = message => send(peer, { type: 'error', message });
    if (!m || typeof m !== 'object' || Array.isArray(m)) return fail('Некорректное сообщение');
    if (m.type === 'ping') { send(peer, { type: 'pong', at: m.at }); return; }
    if (['create', 'join', 'resume'].includes(m.type)) {
      peer.compact = m.compact === true;
      if (peer.session) return fail('Сначала выйдите из текущей комнаты');
      // A retry after a lost handshake must not create a duplicate player.
      const requestId = typeof m.requestId === 'string' && /^[a-zA-Z0-9_-]{16,100}$/.test(m.requestId) ? m.requestId : '';
      const previous = requestId && sessions.get(attempts.get(requestId));
      if (previous && rooms.has(previous.room)) { bind(peer, previous, rooms.get(previous.room), true); return; }
      if (m.type === 'resume') {
        const s = sessions.get(String(m.token));
        if (!s || !rooms.has(s.room)) { send(peer, { type: 'expired', message: 'Комната закрыта или время переподключения истекло' }); return; }
        bind(peer, s, rooms.get(s.room), true); return;
      }
      let room;
      if (m.type === 'create') {
        if (rooms.size >= maxRooms) return fail('Сервер заполнен. Попробуйте позже');
        const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code;
        do { code = [...crypto.randomBytes(6)].map(n => alphabet[n % alphabet.length]).join(''); } while (rooms.has(code));
        room = { code, owner: '', slots: new Map(), world: new World(MAPS[m.mapId] ? m.mapId : 'outpost', Date.now(), m.runMode), saved: false, createdAt: now };
        rooms.set(code, room);
      } else {
        room = rooms.get(String(m.code || '').toUpperCase().trim());
        if (!room) return fail('Комната не найдена. Проверьте код и адрес сервера');
        if (room.world.status !== 'lobby') return fail('Забег уже начался. Дождитесь нового забега');
        if (room.slots.size >= MAX_PLAYERS) return fail('В комнате уже десять игроков');
      }
      const s = { id: crypto.randomUUID(), token: crypto.randomBytes(32).toString('hex'), room: room.code, ws: null, ready: !room.owner, lastInput: now, requestId, commands: new Set() };
      room.owner ||= s.id;
      room.slots.set(s.id, s); sessions.set(s.token, s);
      if (requestId) attempts.set(requestId, s.token);
      room.world.addPlayer(s.id, validName(m.name), HEROES[m.hero] ? m.hero : 'ranger');
      bind(peer, s, room); return;
    }
    const s = peer.session;
    if (!s) return fail('Сначала создайте комнату или войдите по коду');
    const room = rooms.get(s.room);
    if (!room) return;
    if (typeof m.commandId === 'string') {
      if (s.commands.has(m.commandId)) { send(peer, { type: 'ack', commandId: m.commandId }); return; }
      s.commands.add(m.commandId);
      if (s.commands.size > 128) s.commands.delete(s.commands.values().next().value);
      send(peer, { type: 'ack', commandId: m.commandId });
    }
    if (m.type === 'input') { room.world.setInput(s.id, m); s.lastInput = now; }
    if (m.type === 'interact') room.world.interact(s.id);
    if (m.type === 'ping-mark') { const p = room.world.players.get(s.id); if (p && !p.dead && room.world.time >= (s.nextMark || 0)) { room.world.effect('ping', p.x, p.y, 85, p.color, { ttl: 4 }); s.nextMark = room.world.time + 2; } }
    if (m.type === 'upgrade' && typeof m.option === 'string') room.world.choose(s.id, m.option);
    if (m.type === 'ready' && room.world.status === 'lobby') { s.ready = !!m.ready; announce(room); }
    if (m.type === 'start') {
      if (s.id !== room.owner) return fail('Забег запускает командир комнаты');
      if (room.world.status !== 'lobby') return;
      if ([...room.slots.values()].some(p => !p.ws || (!p.ready && p.id !== room.owner))) return fail('Дождитесь готовности всех игроков');
      room.world.start(); announce(room);
    }
    if (m.type === 'restart') {
      if (s.id !== room.owner) return fail('Новый забег запускает командир');
      if (!['gameover', 'victory'].includes(room.world.status)) return fail('Текущий забег ещё идёт');
      resetWorld(room); announce(room); broadcast(room, { type: 'state', state: room.world.snapshot(), room: roomInfo(room) });
    }
    if (m.type === 'leave') { removeSession(s); send(peer, { type: 'left' }); }
  }
  wss.on('connection', ws => {
    ws.transport = 'websocket'; ws.alive = true; ws.windowStart = Date.now(); ws.count = 0; ws.controlQueue = [];
    ws.on('error', () => {});
    ws.on('pong', () => { ws.alive = true; });
    ws.on('message', buffer => { try { processMessage(ws, JSON.parse(buffer.toString())); } catch { send(ws, { type: 'error', message: 'Некорректное сообщение' }); } });
    ws.on('close', () => disconnected(ws));
  });
  const timer = setInterval(() => {
    const now = Date.now();
    for (const s of sessions.values()) {
      if (s.ws?.transport === 'http' && now - s.ws.lastSeen > 10000) s.ws.close();
      if (!s.ws && now - s.disconnectedAt > reconnectMs) { removeSession(s); continue; }
      if (now - s.lastInput > (s.ws?.transport === 'http' ? 1500 : 400)) rooms.get(s.room)?.world.setInput(s.id, { x: 0, y: 0 });
      if (s.ws) flush(s.ws);
    }
    tickCount++;
    for (const room of rooms.values()) {
      room.world.tick(1 / 30);
      if (['gameover', 'victory'].includes(room.world.status)) record(room);
      // Waiting rooms need one small reconciliation per second, not 15 worlds/s.
      const cadence = room.world.status === 'playing' ? 2 : 30;
      if (tickCount % cadence === 0 && [...room.slots.values()].some(s => s.ws?.transport === 'websocket')) broadcast(room, { type: 'state', state: room.world.snapshot(), room: roomInfo(room) });
      if (now - room.createdAt > 2 * 60 * 60 * 1000) {
        for (const s of [...room.slots.values()]) { send(s.ws, { type: 'expired', message: 'Время комнаты истекло' }); const peer = s.ws; removeSession(s); peer?.close(); }
      }
    }
  }, 1000 / 30);
  const heartbeat = setInterval(() => {
    for (const ws of wss.clients) { if (!ws.alive) { ws.terminate(); continue; } ws.alive = false; ws.ping(); }
  }, 10000);
  async function close() {
    clearInterval(timer); clearInterval(heartbeat);
    for (const ws of wss.clients) ws.terminate();
    wss.close();
    await new Promise(resolve => server.close(resolve));
    await persist; await pool?.end();
  }
  return { server, rooms, sessions, close };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const app = createGameServer();
  const port = Number(process.env.PORT || 3000);
  app.server.listen(port, process.env.HOST || '0.0.0.0', () => console.log(`\nПОСЛЕДНИЙ РУБЕЖ · http://localhost:${app.server.address().port}/\nОнлайн: комнаты до 10 игроков. Интернет без VPS: npm run share\n`));
  app.server.on('error', err => { console.error('[server]', err.message); process.exit(1); });
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, async () => { await app.close(); process.exit(0); });
}
