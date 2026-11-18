import { WebSocket } from 'ws';
import assert from 'node:assert/strict';

const base = new URL(process.argv[2] || 'http://127.0.0.1:3000');
if (!['http:', 'https:'].includes(base.protocol)) throw new Error('Укажи HTTP/HTTPS-адрес игры');
const socketUrl = new URL('/ws', base); socketUrl.protocol = base.protocol === 'https:' ? 'wss:' : 'ws:';
const clients = [];
async function connect() {
  const ws = new WebSocket(socketUrl, { handshakeTimeout: 15000 });
  ws.on('error', () => {});
  const messages = []; const waiters = new Set();
  const client = { ws, messages, send: m => ws.send(JSON.stringify(m)), mark: () => messages.length,
    wait(predicate, after = 0) {
      const found = messages.slice(after).find(predicate);
      if (found) return Promise.resolve(found);
      return new Promise((resolve, reject) => {
        const waiter = { predicate, after, resolve, timer: setTimeout(() => { waiters.delete(waiter); reject(new Error('Сервер не прислал ожидаемое сообщение')); }, 15000) };
        waiters.add(waiter);
      });
    } };
  clients.push(client);
  ws.on('message', raw => {
    const m = JSON.parse(raw.toString()); messages.push(m);
    for (const w of [...waiters]) if (messages.length - 1 >= w.after && w.predicate(m)) { clearTimeout(w.timer); waiters.delete(w); w.resolve(m); }
  });
  await new Promise((resolve, reject) => { ws.once('open', resolve); ws.once('error', reject); });
  ws.on('error', () => {});
  return client;
}
try {
  const health = await (await fetch(new URL('/api/health', base), { signal: AbortSignal.timeout(15000) })).json();
  assert.equal(health.game, 'last-frontier'); console.log('✓ HTTP/HTTPS: сервер игры доступен');
  const a = await connect(); a.send({ type: 'create', name: 'Проверка 1', mapId: 'outpost', hero: 'ranger' });
  const host = await a.wait(m => m.type === 'welcome');
  const b = await connect(); b.send({ type: 'join', code: host.room.code, name: 'Проверка 2', hero: 'engineer' });
  const guest = await b.wait(m => m.type === 'welcome');
  assert.equal(guest.room.players.length, 2); console.log('✓ WS/WSS: два игрока вошли в общую комнату');
  b.send({ type: 'ready', ready: true });
  await a.wait(m => m.type === 'room' && m.room.players.some(p => p.id === guest.id && p.ready));
  a.send({ type: 'start' });
  const started = await a.wait(m => m.type === 'state' && m.state.status === 'playing');
  const x = started.state.players.find(p => p.id === host.id).x;
  // Send repeated inputs: a tunnel may add more than the 400ms input timeout.
  const input = setInterval(() => a.send({ type: 'input', x: 1, y: 0 }), 60);
  let moved;
  try { moved = await a.wait(m => m.type === 'state' && m.state.players.find(p => p.id === host.id).x > x + 12); }
  finally { clearInterval(input); }
  const expectedSnapshot = JSON.stringify(moved.state);
  const matched = await b.wait(m => m.type === 'state' && JSON.stringify(m.state) === expectedSnapshot);
  assert.deepEqual(matched.state, moved.state); console.log('✓ Общий бой и движение синхронизированы у двух клиентов');
  const mark = b.mark(); a.send({ type: 'leave' });
  await b.wait(m => m.type === 'room' && m.room.players.length === 1, mark);
  b.send({ type: 'leave' }); await b.wait(m => m.type === 'left');
  console.log('✓ Тестовая комната закрыта; чужие комнаты не затронуты');
  console.log(`ПРОВЕРКА ПРОЙДЕНА: ${base.origin}`);
} catch (error) { console.error('ПРОВЕРКА НЕ ПРОЙДЕНА:', error.message); process.exitCode = 1; }
finally {
  for (const c of clients) { if (c.ws.readyState === WebSocket.OPEN) { c.send({ type: 'leave' }); c.ws.close(); } else c.ws.terminate(); }
}
