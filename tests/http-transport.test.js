import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { once } from 'node:events';
import { gunzipSync } from 'node:zlib';
import { WebSocket } from 'ws';
import { xpRequired } from '../src/game/catalog.js';
import { createGameServer } from '../server.js';

async function fixture(t) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'frontier-http-'));
  const app = createGameServer({ scoresPath: path.join(dir, 'scores.json') });
  app.server.listen(0, '127.0.0.1'); await once(app.server, 'listening');
  const base = `http://127.0.0.1:${app.server.address().port}`;
  const sockets = [];
  t.after(async () => { for (const ws of sockets) ws.terminate(); await app.close(); await fs.rm(dir, { recursive: true, force: true }); });
  async function request(body = { messages: [] }, token = '') {
    const res = await fetch(base + '/api/transport', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body) });
    const result = await res.json(); return { status: res.status, ...result };
  }
  async function socket() {
    const ws = new WebSocket(base.replace('http:', 'ws:') + '/ws'); sockets.push(ws);
    const received = []; ws.on('message', data => received.push(JSON.parse(data.toString())));
    await once(ws, 'open');
    return { ws, received, send: m => ws.send(JSON.stringify(m)), async wait(predicate) { for (let i = 0; i < 100; i++) { const found = received.find(predicate); if (found) return found; await new Promise(r => setTimeout(r, 20)); } throw new Error('Expected WebSocket message was not received'); } };
  }
  return { ...app, base, request, socket };
}
const welcome = result => result.messages?.find(m => m.type === 'welcome');

test('HTTP fallback and WebSocket players share a ready lobby, movement, XP and upgrades', async t => {
  const f = await fixture(t);
  const initial = await f.request({ type: 'create', name: 'Firefox / HTTP', hero: 'ranger', mapId: 'desert' });
  assert.equal(initial.status, 200); const host = welcome(initial); assert.ok(host?.token);
  const guest = await f.socket(); guest.send({ type: 'join', code: host.room.code, name: 'WebSocket' });
  const peer = await guest.wait(m => m.type === 'welcome');
  let polled = await f.request(undefined, host.token);
  assert.equal(polled.room.players.length, 2);
  guest.send({ type: 'ready', ready: true });
  await guest.wait(m => m.type === 'room' && m.room.players.find(p => p.id === peer.id).ready);
  polled = await f.request(undefined, host.token);
  assert.equal(polled.room.players.find(p => p.id === peer.id).ready, true);
  const playing = await f.request({ messages: [{ type: 'start' }] }, host.token);
  assert.equal(playing.state.status, 'playing');
  await guest.wait(m => m.type === 'state' && m.state.status === 'playing');
  const x = playing.state.players.find(p => p.id === host.id).x;
  await f.request({ messages: [{ type: 'input', x: 1, y: 0 }] }, host.token);
  await guest.wait(m => m.type === 'state' && m.state.players.find(p => p.id === host.id).x > x + 8);
  const world = f.rooms.get(host.room.code).world; world.giveXp(xpRequired(1));
  polled = await f.request(undefined, host.token);
  const p = polled.state.players.find(p => p.id === host.id); assert.equal(p.level, 2); assert.equal(p.options.length, 3);
  const chosen = await f.request({ messages: [{ type: 'upgrade', option: p.options[0] }] }, host.token);
  assert.equal(chosen.state.players.find(p => p.id === host.id).pending, 0);
  await f.request({ messages: [{ type: 'leave' }] }, host.token);
  const room = await guest.wait(m => m.type === 'room' && m.room.players.length === 1 && m.room.owner === peer.id);
  assert.equal(room.room.players[0].id, peer.id);
});

test('both polling clients see current roster/readiness without one-time room events', async t => {
  const f = await fixture(t);
  const host = welcome(await f.request({ type: 'create', name: 'Хозяин' }));
  const guest = welcome(await f.request({ type: 'join', code: host.room.code, name: 'Друг' }));
  await f.request({ messages: [{ type: 'ready', ready: true }] }, guest.token);
  // Deliberately ignore every control message; the authoritative room is in each response.
  const h = await f.request(undefined, host.token);
  const g = await f.request(undefined, guest.token);
  assert.equal(h.room.players.length, 2); assert.deepEqual(h.room, g.room);
  assert.equal(h.room.players.find(p => p.id === guest.id).ready, true);
  const resumed = welcome(await f.request({ type: 'resume' }, host.token));
  assert.equal(resumed.id, host.id);
  assert.equal(resumed.room.players.length, 2);
  const started = await f.request({ messages: [{ type: 'start' }] }, host.token);
  assert.equal(started.state.status, 'playing');
});

test('polling endpoints require a private Bearer token; public roster never exposes it', async t => {
  const f = await fixture(t);
  const host = welcome(await f.request({ type: 'create', name: 'Private' }));
  for (const token of ['', 'not-a-session']) {
    const bad = await f.request({ messages: [{ type: 'start' }] }, token);
    assert.ok(bad.status >= 400 || bad.messages?.some(m => ['error', 'expired'].includes(m.type)));
    assert.equal(f.rooms.get(host.room.code).world.status, 'lobby');
  }
  const poll = await f.request(undefined, host.token);
  assert.ok(!JSON.stringify(poll.room).includes(host.token));
  assert.ok(!JSON.stringify(poll.state).includes(host.token));
});

test('large browser assets are gzip-compressed and remain complete', async t => {
  const f = await fixture(t);
  const raw = await new Promise((resolve, reject) => http.get(f.base + '/src/bundle.classic.js', { headers: { 'Accept-Encoding': 'gzip' } }, res => {
    const chunks = []; res.on('data', c => chunks.push(c)); res.on('end', () => resolve({ headers: res.headers, bytes: Buffer.concat(chunks) })); res.on('error', reject);
  }).on('error', reject));
  assert.equal(raw.headers['content-encoding'], 'gzip');
  assert.match(raw.headers.vary, /Accept-Encoding/i);
  const decoded = gunzipSync(raw.bytes).toString(); assert.match(decoded, /frontier/);
  assert.ok(raw.bytes.length < Buffer.byteLength(decoded) * .5);
  const plain = await (await fetch(f.base + '/src/bundle.classic.js')).text(); assert.equal(decoded, plain);
});

test('a lost create response can be retried without creating a ghost room or player', async t => {
  const f = await fixture(t);
  const create = { type: 'create', name: 'Retry', requestId: 'unpredictable_retry_request_01' };
  const first = welcome(await f.request(create));
  const repeated = welcome(await f.request(create));
  assert.equal(repeated.id, first.id); assert.equal(repeated.token, first.token);
  assert.equal(repeated.room.code, first.room.code);
  assert.equal(f.rooms.size, 1); assert.equal(f.sessions.size, 1);
});

test('periodic snapshots repair roster/readiness when immediate room messages are missed', async t => {
  const f = await fixture(t);
  const host = await f.socket(); host.send({ type: 'create', name: 'Host' }); const h = await host.wait(m => m.type === 'welcome');
  const guest = await f.socket(); guest.send({ type: 'join', code: h.room.code, name: 'Guest' }); const g = await guest.wait(m => m.type === 'welcome');
  guest.send({ type: 'ready', ready: true });
  const repaired = await host.wait(m => m.type === 'state' && m.room?.players.length === 2 && m.room.players.find(p => p.id === g.id)?.ready);
  assert.equal(repaired.room.owner, h.id);
  assert.equal(repaired.state.status, 'lobby');
});

test('congested WebSocket queues lobby control updates instead of silently losing them', async t => {
  const f = await fixture(t);
  const host = await f.socket(); host.send({ type: 'create', name: 'Slow host' }); const h = await host.wait(m => m.type === 'welcome');
  const serverPeer = f.sessions.get(h.token).ws;
  let congested = true;
  Object.defineProperty(serverPeer, 'bufferedAmount', { configurable: true, get: () => congested ? 100000 : 0 });
  const guest = await f.socket(); guest.send({ type: 'join', code: h.room.code, name: 'Friend' }); const g = await guest.wait(m => m.type === 'welcome');
  guest.send({ type: 'ready', ready: true });
  await guest.wait(m => m.type === 'room' && m.room.players.find(p => p.id === g.id)?.ready);
  congested = false;
  const recovered = await host.wait(m => m.type === 'room' && m.room.players.length === 2 && m.room.players.find(p => p.id === g.id)?.ready);
  assert.equal(recovered.room.code, h.room.code);
});

test('compact HTTP and WebSocket clients share interactions and preserve expedition on restart', async t => {
  const f = await fixture(t);
  const host = welcome(await f.request({ type: 'create', compact: true, runMode: 'expedition', name: 'Compact' }));
  assert.equal(host.state.packed, 1); assert.equal(host.room.runMode, 'expedition');
  const guest = await f.socket(); guest.send({ type: 'join', compact: true, code: host.room.code });
  const peer = await guest.wait(m => m.type === 'welcome'); assert.equal(peer.state.packed, 1);
  guest.send({ type: 'ready', ready: true }); await guest.wait(m => m.type === 'room' && m.room.players.find(p => p.id === peer.id)?.ready);
  await f.request({ messages: [{ type: 'start' }] }, host.token);
  const world = f.rooms.get(host.room.code).world, p = world.players.get(host.id), cache = world.director.objects.find(n => n.kind === 'cache');
  p.x = cache.x; p.y = cache.y;
  const command = { messages: [{ type: 'interact', commandId: 'one-interaction' }] };
  const reward = await f.request(command, host.token); const pending = reward.state.players.find(p => p.id === host.id).pending;
  assert.ok(pending > 0);
  const retry = await f.request(command, host.token); assert.equal(retry.state.players.find(p => p.id === host.id).pending, pending);
  await guest.wait(m => m.type === 'state' && m.state.players.find(p => p.id === peer.id)?.pending === pending);
  world.status = 'gameover';
  await f.request({ messages: [{ type: 'restart' }] }, host.token);
  assert.equal(f.rooms.get(host.room.code).world.director.mode, 'expedition');
  assert.equal(f.rooms.get(host.room.code).world.director.duration, 1200);
});

test('ten simultaneous players share readiness, combat and slower XP through HTTP and WebSocket', async t => {
  const f = await fixture(t), host = await f.socket(); host.send({ type: 'create', name: 'Host' });
  const h = await host.wait(m => m.type === 'welcome');
  const guests = [];
  for (let i = 0; i < 9; i++) guests.push(welcome(await f.request({ type: 'join', code: h.room.code, name: `Guest ${i}` })));
  for (const g of guests) await f.request({ messages: [{ type: 'ready', ready: true }] }, g.token);
  const roster = await host.wait(m => m.type === 'room' && m.room.players.length === 10 && m.room.players.every(p => p.ready));
  assert.equal(roster.room.players.length, 10);
  host.send({ type: 'start' }); await host.wait(m => m.type === 'state' && m.state.status === 'playing');
  const world = f.rooms.get(h.room.code).world; world.spawnClock = 1e6; world.giveXp(xpRequired(1));
  for (const g of guests) {
    const snapshot = await f.request({ messages: [{ type: 'input', x: 1, y: 0 }] }, g.token);
    assert.equal(snapshot.state.players.length, 10); assert.ok(snapshot.state.players.every(p => p.level === 2));
    const me = snapshot.state.players.find(p => p.id === g.id);
    await f.request({ messages: [{ type: 'upgrade', option: me.options[0] }] }, g.token);
  }
  const shared = await host.wait(m => m.type === 'state' && m.state.players.filter(p => p.id !== h.id).every(p => p.pending === 0));
  assert.equal(shared.state.players.length, 10);
});
