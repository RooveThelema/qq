import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { once } from 'node:events';
import { WebSocket } from 'ws';
import { createGameServer } from '../server.js';
import { xpRequired, MAX_PLAYERS } from '../src/game/catalog.js';

async function fixture(t, config = {}) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'frontier-test-'));
  const app = createGameServer({ scoresPath: path.join(dir, 'scores.json'), ...config });
  app.server.listen(0, '127.0.0.1');
  await once(app.server, 'listening');
  const address = `http://127.0.0.1:${app.server.address().port}`;
  const clients = [];
  t.after(async () => { for (const c of clients) c.ws.terminate(); await app.close(); await fs.rm(dir, { recursive: true, force: true }); });
  async function connect() {
    const ws = new WebSocket(address.replace('http:', 'ws:') + '/ws');
    const messages = [];
    const waiters = new Set();
    ws.on('message', raw => {
      const value = JSON.parse(raw.toString()); messages.push(value);
      for (const w of [...waiters]) if (messages.length - 1 >= w.after && w.predicate(value)) { clearTimeout(w.timer); waiters.delete(w); w.resolve(value); }
    });
    ws.on('error', () => {});
    await once(ws, 'open');
    const c = { ws, messages, mark: () => messages.length, send: value => ws.send(JSON.stringify(value)),
      wait(predicate, after = 0) {
        const found = messages.slice(after).find(predicate);
        if (found) return Promise.resolve(found);
        return new Promise((resolve, reject) => {
          const w = { predicate, after, resolve, timer: setTimeout(() => { waiters.delete(w); reject(new Error('Timed out waiting for WebSocket message')); }, 3500) };
          waiters.add(w);
        });
      } };
    clients.push(c); return c;
  }
  return { ...app, address, connect, dir };
}
async function create(c, overrides = {}) { c.send({ type: 'create', name: 'Командир', mapId: 'forest', hero: 'ranger', ...overrides }); return c.wait(m => m.type === 'welcome'); }
async function join(c, code, name = 'Друг') { c.send({ type: 'join', code, name, hero: 'engineer' }); return c.wait(m => m.type === 'welcome'); }

// Real sockets exercise the public protocol, not mock transport objects.
test('health works without PostgreSQL; only game assets are publicly served', async t => {
  const f = await fixture(t);
  assert.equal((await (await fetch(f.address + '/api/health')).json()).ok, true);
  for (const file of ['/server.js', '/package.json', '/.git/config', '/.env', '/data/scores.json', '/memes.json', '/memes/x.mp4', '/REPORT.docx', '/src/modules/memes/MemeLudkaModule.js']) {
    assert.equal((await fetch(f.address + file)).status, 404, file);
  }
  assert.equal((await fetch(f.address + '/src/game/World.js')).status, 200);
  assert.equal((await fetch(f.address + '/%E0%A4%A')).status, 400);
});

test('two players share one authoritative arena, readiness, movement, XP and upgrades', async t => {
  const f = await fixture(t);
  const a = await f.connect(); const aw = await create(a);
  const b = await f.connect(); const bw = await join(b, aw.room.code.toLowerCase(), '<Друг>');
  assert.equal(bw.room.code, aw.room.code);
  assert.equal(bw.room.players.length, 2);
  assert.equal(bw.state.players.find(p => p.id === bw.id).name, 'Друг');
  b.send({ type: 'start' }); await b.wait(m => m.type === 'error' && /командир/.test(m.message));
  a.send({ type: 'start' }); await a.wait(m => m.type === 'error' && /готовности/.test(m.message));
  b.send({ type: 'ready', ready: true });
  await a.wait(m => m.type === 'room' && m.room.players.find(p => p.id === bw.id)?.ready);
  a.send({ type: 'start' });
  await b.wait(m => m.type === 'state' && m.state.status === 'playing');
  const room = f.rooms.get(aw.room.code);
  room.world.spawnClock = 1e6;
  const initial = room.world.players.get(aw.id).x;
  a.send({ type: 'input', x: 1, y: 0, hp: 99999, world: { kills: 99999 } });
  await a.wait(m => m.type === 'state' && m.state.players.find(p => p.id === aw.id).x > initial + 8);
  assert.equal(room.world.kills, 0);
  assert.ok(room.world.players.get(aw.id).hp < 1000);
  const markerA = a.mark(); const markerB = b.mark();
  const stateA = await a.wait(m => m.type === 'state', markerA);
  const stateB = await b.wait(m => m.type === 'state' && m.state.time === stateA.state.time, markerB);
  assert.deepEqual(stateA.state, stateB.state, 'both clients receive the same authoritative snapshot');
  room.world.giveXp(xpRequired(1));
  const upgradeState = await b.wait(m => m.type === 'state' && m.state.players.every(p => p.level === 2));
  const player = upgradeState.state.players.find(p => p.id === bw.id);
  assert.equal(player.options.length, 3);
  b.send({ type: 'upgrade', option: 'admin' });
  b.send({ type: 'upgrade', option: player.options[0] });
  await b.wait(m => m.type === 'state' && m.state.players.find(p => p.id === bw.id).pending === 0, b.mark());
  assert.equal(room.world.players.get(aw.id).pending, 1);
  const late = await f.connect(); late.send({ type: 'join', code: aw.room.code });
  await late.wait(m => m.type === 'error' && /уже начался/.test(m.message));
});

test('input times out when a browser stops sending it and cannot set positions or health', async t => {
  const f = await fixture(t);
  const a = await f.connect(); const aw = await create(a);
  a.send({ type: 'start' });
  await a.wait(m => m.type === 'state' && m.state.status === 'playing');
  const p = f.rooms.get(aw.room.code).world.players.get(aw.id);
  a.send({ type: 'input', x: 99999, y: 'Infinity', hp: 999999, position: { x: 0, y: 0 } });
  await a.wait(m => m.type === 'state' && m.state.time > 0.55);
  assert.deepEqual(p.input, { x: 0, y: 0 });
  assert.ok(p.x > 1000 && p.x < 2000);
  assert.ok(p.hp <= p.maxHp);
});

test('disconnect migrates ownership; secret-token resume restores player in the ongoing run', async t => {
  const f = await fixture(t);
  const a = await f.connect(); const aw = await create(a);
  const b = await f.connect(); const bw = await join(b, aw.room.code);
  b.send({ type: 'ready', ready: true });
  await a.wait(m => m.type === 'room' && m.room.players.find(p => p.id === bw.id)?.ready);
  a.send({ type: 'start' }); await b.wait(m => m.type === 'state' && m.state.status === 'playing');
  const marker = b.mark(); a.ws.close();
  await b.wait(m => m.type === 'room' && m.room.owner === bw.id && !m.room.players.find(p => p.id === aw.id).connected, marker);
  const resumed = await f.connect(); resumed.send({ type: 'resume', token: aw.token });
  const welcome = await resumed.wait(m => m.type === 'welcome');
  assert.equal(welcome.resumed, true); assert.equal(welcome.id, aw.id);
  assert.equal(welcome.state.status, 'playing'); assert.equal(welcome.room.players.length, 2);
  const stranger = await f.connect(); stranger.send({ type: 'resume', token: 'incorrect' });
  await stranger.wait(m => m.type === 'expired');
});

test('rooms accept ten players, reject an eleventh player, unknown codes, and expire abandoned sessions', async t => {
  const f = await fixture(t, { reconnectMs: 50 });
  const a = await f.connect(); const aw = await create(a);
  const peers = [a];
  for (let i = 0; i < MAX_PLAYERS - 1; i++) { const c = await f.connect(); peers.push(c); await join(c, aw.room.code, `Игрок${i}`); }
  assert.equal(f.rooms.get(aw.room.code).world.players.size, MAX_PLAYERS);
  const eleventh = await f.connect(); eleventh.send({ type: 'join', code: aw.room.code });
  await eleventh.wait(m => m.type === 'error' && /десять/.test(m.message));
  const missing = await f.connect(); missing.send({ type: 'join', code: 'QQQQQQ' });
  await missing.wait(m => m.type === 'error' && /не найдена/.test(m.message));
  for (const c of peers) c.ws.close();
  await new Promise(resolve => setTimeout(resolve, 160));
  assert.equal(f.rooms.size, 0); assert.equal(f.sessions.size, 0);
});

test('game over saves the real team result once; host can restart into a fresh lobby', async t => {
  const f = await fixture(t);
  const a = await f.connect(); const aw = await create(a);
  a.send({ type: 'start' }); await a.wait(m => m.type === 'state' && m.state.status === 'playing');
  const room = f.rooms.get(aw.room.code);
  const p = room.world.players.get(aw.id);
  p.shield = 0; room.world.damagePlayer(p, 99999);
  await a.wait(m => m.type === 'state' && m.state.status === 'gameover');
  const runs = (await (await fetch(f.address + '/api/leaderboard')).json()).runs;
  assert.equal(runs.length, 1); assert.equal(runs[0].players[0].name, 'Командир');
  const marker = a.mark(); a.send({ type: 'restart' });
  const restarted = await a.wait(m => m.type === 'state' && m.state.status === 'lobby', marker);
  assert.equal(restarted.state.time, 0); assert.equal(restarted.state.players[0].dead, false);
  assert.equal(restarted.state.players[0].level, 1);
  assert.equal((await (await fetch(f.address + '/api/leaderboard')).json()).runs.length, 1);
});

test('room broadcasts never expose resume tokens; a resumed socket supersedes its predecessor', async t => {
  const f = await fixture(t);
  const a = await f.connect(); const aw = await create(a);
  const b = await f.connect(); await join(b, aw.room.code);
  const marker = b.mark();
  const replacement = await f.connect(); replacement.send({ type: 'resume', token: aw.token });
  const welcomed = await replacement.wait(m => m.type === 'welcome');
  assert.equal(welcomed.id, aw.id);
  await b.wait(m => m.type === 'room', marker);
  assert.ok(!JSON.stringify(b.messages).includes(aw.token));
  assert.ok(!JSON.stringify(welcomed.state).includes(aw.token));
  assert.equal(welcomed.room.players.length, 2);
  await new Promise(resolve => setTimeout(resolve, 20));
  assert.notEqual(a.ws.readyState, WebSocket.OPEN);
});
