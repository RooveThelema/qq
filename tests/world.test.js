import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/game/World.js';
import { MAPS, HEROES, makeObstacles, xpRequired } from '../src/game/catalog.js';

function world(map = 'outpost') {
  const w = new World(map, 42);
  w.spawnClock = 1e6;
  return w;
}
function advance(w, seconds) { for (let i = 0; i < Math.ceil(seconds * 30); i++) w.tick(1 / 30); }

test('each location has deterministic obstacles, open spawn, and unique dimensions/theme', () => {
  const dimensions = new Set();
  for (const id of Object.keys(MAPS)) {
    const w = world(id);
    const p = w.addPlayer('p', 'Тест');
    assert.deepEqual(w.obstacles, makeObstacles(id));
    assert.ok(w.obstacles.length >= 15);
    assert.ok(w.obstacles.every(ob => Math.hypot(p.x - ob.x, p.y - ob.y) > ob.r + 20));
    dimensions.add(`${w.map.width}x${w.map.height}`);
  }
  assert.equal(dimensions.size, 3);
  assert.equal(world('invalid').mapId, 'outpost');
});

test('automatic shooting kills enemies and produces collectable experience without fire input', () => {
  const w = world();
  const p = w.addPlayer('p', 'Тест');
  w.start(); w.spawnClock = 1e6;
  w.spawn('walker', p.x + 115, p.y);
  advance(w, 1.2);
  assert.equal(w.kills, 1);
  assert.equal(p.kills, 1);
  assert.ok(w.gems.length || p.xp > 0);
  if (w.gems.length) { p.x = w.gems[0].x; p.y = w.gems[0].y; advance(w, 0.1); }
  assert.ok(p.xp > 0);
});

test('all six weapons can damage a target and do not need manual firing', () => {
  for (const weapon of ['gun', 'orbit', 'pulse', 'lightning', 'rocket', 'frost']) {
    const w = world();
    const p = w.addPlayer('p', 'Тест');
    p.weapons = { [weapon]: 3 };
    w.start(); w.spawnClock = 1e6;
    w.spawn('tank', p.x + (weapon === 'orbit' ? 84 : 100), p.y);
    const enemy = w.enemies[0];
    const hp = enemy.hp;
    advance(w, 2);
    assert.ok(enemy.hp < hp, `${weapon} should damage a target`);
  }
});

test('collecting a gem shares XP and level-up options with the whole team', () => {
  const w = world();
  const a = w.addPlayer('a', 'А');
  const b = w.addPlayer('b', 'Б', 'engineer');
  w.start(); w.spawnClock = 1e6;
  w.gems.push({ id: 900, x: a.x, y: a.y, value: xpRequired(1), kind: 'xp' });
  advance(w, 0.1);
  assert.equal(a.level, 2); assert.equal(b.level, 2);
  assert.equal(a.options.length, 3); assert.equal(b.options.length, 3);
  assert.equal(new Set(a.options).size, 3);
  assert.equal(w.choose('a', 'admin-kill-all'), false);
  const option = a.options[0];
  assert.equal(w.choose('a', option), true);
  assert.equal(a.pending, 0);
  assert.equal(a.options.length, 0);
  assert.ok((a.weapons[option] || a.upgrades[option]) > 0);
  assert.equal(w.choose('a', option), false, 'an upgrade cannot be claimed twice');
});

test('movement input is finite and normalized; dash respects cooldown and world bounds', () => {
  const w = world();
  const p = w.addPlayer('p', 'Тест');
  w.obstacles = [];
  w.start(); w.spawnClock = 1e6;
  w.setInput('p', { x: Infinity, y: NaN });
  assert.deepEqual(p.input, { x: 0, y: 0 });
  w.setInput('p', { x: 9999, y: 9999 });
  assert.ok(Math.hypot(p.input.x, p.input.y) <= 1.000001);
  const x = p.x;
  w.tick(0.1);
  assert.ok(p.x - x <= HEROES.ranger.speed * 0.1);
  w.setInput('p', { x: 1, y: 0, dash: true });
  assert.equal(p.dash, 4);
  w.tick(0.1);
  const cooldown = p.dash;
  w.setInput('p', { x: 1, y: 0, dash: true });
  assert.equal(p.dash, cooldown);
  p.x = w.map.width - 36;
  w.tick(0.1);
  assert.ok(p.x <= w.map.width - 35);
});

test('a nearby living teammate revives a fallen player after three seconds', () => {
  const w = world();
  const a = w.addPlayer('a', 'А');
  const b = w.addPlayer('b', 'Б');
  w.start(); w.spawnClock = 1e6;
  a.shield = 0;
  w.damagePlayer(a, 9999);
  assert.equal(a.dead, true);
  advance(w, 3.1);
  assert.equal(a.dead, false);
  assert.ok(a.hp > 0);
  assert.ok(a.shield > 0);
  b.shield = 0; a.shield = 0;
  w.damagePlayer(a, 9999); w.damagePlayer(b, 9999);
  w.tick(1 / 30);
  assert.equal(w.status, 'gameover');
});

test('boss waves and victory have a defined ten-minute objective', () => {
  const w = world();
  w.addPlayer('p', 'Тест'); w.start(); w.spawnClock = 1e6;
  w.time = 119.99; w.tick(1 / 30);
  assert.equal(w.enemies.filter(e => e.type === 'boss').length, 1);
  w.time = 599.99; w.bossCount = 4; w.lastBoss = true;
  w.tick(1 / 30);
  assert.equal(w.status, 'playing', 'surviving ten minutes does not skip a living boss');
  w.enemies = [];
  w.tick(1 / 30);
  assert.equal(w.status, 'victory');
});

test('snapshots contain display data without private input/cooldown state', () => {
  const w = world();
  w.addPlayer('p', '<Тест>');
  const snapshot = w.snapshot();
  assert.equal(snapshot.players[0].id, 'p');
  assert.equal(snapshot.players[0].input, undefined);
  assert.equal(snapshot.players[0].hitTimers, undefined);
  assert.doesNotThrow(() => JSON.stringify(snapshot));
});

test('an enemy cap cannot skip objective bosses, including the final guardian', () => {
  const w = world();
  w.addPlayer('p', 'Тест'); w.start(); w.spawnClock = 1e6;
  for (let i = 0; i < 260; i++) w.spawn('walker', 100 + i % 20 * 30, 100 + Math.floor(i / 20) * 30);
  assert.equal(w.enemies.length, 260);
  w.time = 119.99;
  w.tick(1 / 30);
  assert.ok(w.enemies.some(e => e.type === 'boss'));
  assert.equal(w.bossCount, 1);
  w.enemies = w.enemies.filter(e => e.type !== 'boss');
  while (w.enemies.length < 260) w.spawn('walker', 100, 100);
  w.time = 539.99; w.bossCount = 4;
  w.tick(1 / 30);
  assert.equal(w.lastBoss, true);
  assert.ok(w.enemies.some(e => e.type === 'boss'));
  assert.ok(w.enemies.length <= 260);
});
