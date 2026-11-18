import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/game/World.js';
import { EVOLUTIONS, ENEMIES } from '../src/game/catalog.js';
import { SpatialGrid } from '../src/game/SpatialGrid.js';
import { packState, unpackState } from '../src/game/codec.js';
import { MotionBuffer } from '../src/ui/MotionBuffer.js';
const setup = (mode = 'expedition') => {
  const w = new World('outpost', 42, mode); w.addPlayer('a', 'А'); w.addPlayer('b', 'Б'); w.start(); w.spawnClock = 1e6; return w;
};
const advance = (w, seconds) => { for (let i = 0; i < seconds * 30; i++) w.tick(1 / 30); };

test('spatial queries never omit a circle collision, including cell boundaries', () => {
  const grid = new SpatialGrid(), enemies = [];
  for (let i = 0; i < 260; i++) enemies.push({ id: i, x: (i * 137) % 2900, y: (i * 53) % 2100, hp: 1, radius: 47 });
  grid.rebuild(enemies);
  for (let x = 0; x < 2900; x += 47) for (let y = 0; y < 2100; y += 71) {
    const found = new Set(grid.query(x, y, 60));
    for (const e of enemies) if (Math.hypot(e.x - x, e.y - y) <= e.radius + 7) assert.ok(found.has(e));
  }
  grid.rebuild([]); assert.equal(grid.query(0, 0, 10000).length, 0);
});

test('eight weapon evolutions require their own passive and cannot stack repeatedly', () => {
  const w = setup(), p = w.players.get('a');
  for (const [weapon, config] of Object.entries(EVOLUTIONS)) {
    p.weapons[weapon] = 5; p.upgrades[config.passive] = 2; w.evolve(p); assert.ok(!p.evolved[weapon]);
    p.upgrades[config.passive] = 3; w.evolve(p); assert.equal(p.evolved[weapon], true);
  }
  const count = w.effects.length; w.evolve(p); assert.equal(w.effects.length, count);
});

test('laser pierces targets and mines damage nearby pursuers', () => {
  for (const weapon of ['beam', 'mine']) {
    const w = setup(), p = w.players.get('a'); w.players.get('b').weapons = {}; w.obstacles = [];
    p.weapons = { [weapon]: 3 }; w.spawn('tank', p.x + (weapon === 'mine' ? 20 : 100), p.y);
    w.spawn('tank', p.x + 180, p.y); const [a, b] = w.enemies;
    advance(w, 1);
    assert.ok(a.hp < a.maxHp, weapon);
    if (weapon === 'beam') assert.ok(b.hp < b.maxHp, 'beam pierces a second target');
  }
});

test('interactions enforce proximity, living players, cooldowns and one reward per cache', () => {
  const w = setup(), a = w.players.get('a'), b = w.players.get('b'), cache = w.director.objects.find(n => n.kind === 'cache');
  assert.equal(w.interact('a'), false); a.x = cache.x; a.y = cache.y;
  assert.equal(w.interact('a'), true); const pending = a.pending; assert.ok(pending > 0); assert.equal(b.pending, pending);
  assert.equal(w.interact('a'), false); assert.equal(a.pending, pending);
  const med = w.director.objects.find(n => n.kind === 'medic'); a.x = med.x; a.y = med.y; a.hp = b.hp = 10;
  a.dead = true; assert.equal(w.interact('a'), false); a.dead = false;
  assert.equal(w.interact('a'), true); assert.ok(a.hp > 10 && b.hp > 10); assert.equal(w.interact('a'), false);
  w.status = 'gameover'; assert.equal(w.interact('a'), false);
});

test('turret fires for its owner; shrine elite rewards the whole team only on death', () => {
  const w = setup(), p = w.players.get('a'); for (const p of w.players.values()) p.weapons = {};
  const turret = w.director.objects.find(n => n.kind === 'turret'); p.x = turret.x; p.y = turret.y;
  w.spawn('tank', p.x + 200, p.y); const enemy = w.enemies[0];
  assert.ok(w.interact('a')); advance(w, 1); assert.ok(enemy.hp < enemy.maxHp);
  const shrine = w.director.objects.find(n => n.kind === 'shrine'); p.x = shrine.x; p.y = shrine.y;
  assert.ok(w.interact('a')); const elite = w.enemies.at(-1); assert.ok(elite.elite && elite.reward);
  const before = p.pending; w.hurt(elite, 1e9, p); assert.equal(p.pending, before + 1); w.hurt(elite, 1e9, p); assert.equal(p.pending, before + 1);
});

test('relay advances twice as quickly together and gives each player a reward', () => {
  const w = setup(), [a, b] = [...w.players.values()];
  w.director.event = { kind: 'relay', x: a.x, y: a.y, progress: 0, goal: 16, endsAt: 90 };
  advance(w, 4); assert.ok(w.director.event.progress >= 7.9);
  advance(w, 4.1); assert.equal(w.director.completed, 1); assert.equal(w.director.event, null); assert.ok(a.pending && b.pending);
});

test('supply completion, hunting progress and mission expiration are authoritative', () => {
  const w = setup(), p = w.players.get('a'), node = w.director.objects.find(n => n.kind === 'cache');
  w.director.event = { kind: 'supply', target: node.id, endsAt: 85 }; p.x = node.x; p.y = node.y;
  w.interact('a'); assert.equal(w.director.completed, 1);
  w.director.event = { kind: 'hunt', startKills: w.kills, goal: 1, endsAt: 85 };
  w.spawn('walker', 100, 100); w.hurt(w.enemies.at(-1), 1e9, p); w.tick(1/30); assert.equal(w.director.completed, 2);
  w.director.event = { kind: 'relay', x: 0, y: 0, progress: 0, goal: 16, endsAt: w.time };
  w.tick(1/30); assert.equal(w.director.event, null); assert.equal(w.director.completed, 2);
});

test('hazards give warning then damage; splitters spawn three runners; leeches heal living allies', () => {
  const w = setup(), p = w.players.get('a'); p.weapons = {}; w.players.get('b').weapons = {}; p.shield = 0;
  w.director.hazards.push({ id: 1, x: p.x, y: p.y, radius: 78, ttl: .5 });
  const hp = p.hp; w.tick(.1); assert.equal(p.hp, hp); advance(w, .5); assert.ok(p.hp < hp); assert.equal(w.director.hazards.length, 0);
  w.spawn('splitter', 100, 100); w.hurt(w.enemies.at(-1), 1e9, p); assert.equal(w.enemies.filter(e => e.type === 'runner').length, 3);
  w.spawn('leech', 100, 100); const leech = w.enemies.at(-1); leech.attack = 0; const runner = w.enemies.find(e => e.type === 'runner'); runner.hp = 1;
  w.tick(.033); assert.ok(runner.hp > 1);
});

test('expedition lasts twenty minutes and endless never triggers victory', () => {
  const w = setup(); w.bossCount = 9; w.time = 600; w.tick(1/30); assert.equal(w.status, 'playing'); assert.equal(w.lastBoss, false);
  w.time = 1139.99; w.tick(1/30); assert.equal(w.lastBoss, true);
  w.time = 1200; w.enemies = []; w.tick(1/30); assert.equal(w.status, 'victory');
  const endless = setup('endless'); endless.time = 1201; endless.bossCount = 10; endless.tick(1/30);
  assert.equal(endless.status, 'playing'); assert.equal(endless.lastBoss, false); assert.equal(endless.snapshot().duration, 0);
});

test('compact snapshots preserve display fields and materially reduce crowded state size', () => {
  const w = setup();
  for (let i = 0; i < 250; i++) w.spawn('walker', 100 + i, 200);
  const state = w.snapshot(), packed = packState(state), decoded = unpackState(packed);
  assert.deepEqual(decoded, state);
  assert.ok(JSON.stringify(packed).length < JSON.stringify(state).length * .6);
  assert.equal(unpackState(state), state);
});

test('motion buffer interpolates missing packets, bounds extrapolation and resets for a new run', () => {
  const buffer = new MotionBuffer();
  const frame = (time, x) => ({ time, players: [{ id: 'a', x, y: 0 }], enemies: [], bullets: [] });
  buffer.push(frame(1, 0), 0); buffer.push(frame(1.1, 20), .1);
  const middle = buffer.sample({ id: 'a', x: 20, y: 0 }, 'p', .12); assert.ok(middle.x > 0 && middle.x < 20);
  assert.ok(buffer.sample({ id: 'a', x: 20, y: 0 }, 'p', 20, true).x <= 40.00001);
  buffer.push(frame(0, 500), .2); assert.equal(buffer.frames.length, 1);
});

test('a hazard killing the whole squad ends the run without invalid targeting', () => {
  const w = setup(), p = w.players.get('a');
  for (const member of w.players.values()) { member.hp = 1; member.shield = 0; }
  w.spawn('tank', p.x + 300, p.y);
  w.director.hazards.push({ id: 1, x: p.x, y: p.y, radius: 200, ttl: .01 });
  assert.doesNotThrow(() => w.tick(1/30)); assert.equal(w.status, 'gameover');
});

test('knockback updates broad-phase cells for later projectiles in the same tick', () => {
  const grid = new SpatialGrid(96), e = { x: 95, y: 95, hp: 10 };
  grid.rebuild([e]); e.x = 110; grid.relocate(e, 95, 95);
  assert.ok(grid.query(110, 95, 0).includes(e)); assert.equal(grid.query(95, 95, 0).length, 0);
});
