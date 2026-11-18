import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/game/World.js';
import { UPGRADES, xpRequired } from '../src/game/catalog.js';
const setup = () => { const w = new World('outpost', 42); w.obstacles = []; const p = w.addPlayer('p', 'Тест'); w.start(); w.spawnClock = 1e6; return { w, p }; };
const take = (w, p, id) => { p.pending++; p.options = [id]; assert.equal(w.choose(p.id, id), true); };

test('XP curve slows early levels and grows increasingly at higher levels; overflow is preserved', () => {
  assert.deepEqual([1,2,3,4].map(xpRequired), [39,57,79,105]);
  for (let i = 1; i < 100; i++) assert.ok(xpRequired(i + 1) > xpRequired(i) && xpRequired(i) > 8 + i * 5);
  const { w, p } = setup(); w.giveXp(38); assert.equal(p.level, 1);
  w.giveXp(1 + xpRequired(2) + 7); assert.equal(p.level, 3); assert.equal(p.pending, 2); assert.equal(p.xp, 7);
});

test('all 25 skills can coexist, exceed old caps and remain in the offer pool', () => {
  const { w, p } = setup(); assert.equal(UPGRADES.length, 25);
  for (const u of UPGRADES) for (let i = 0; i < 12; i++) take(w, p, u.id);
  assert.equal(Object.keys(p.weapons).length, 8); assert.equal(Object.keys(p.upgrades).length, 17);
  assert.ok(Object.values(p.weapons).every(n => n >= 12)); assert.ok(Object.values(p.upgrades).every(n => n === 12));
  const seen = new Set(); for (let i = 0; i < 150; i++) { p.pending = 1; p.options = []; w.offer(p); for (const id of p.options) seen.add(id); }
  assert.equal(seen.size, 25); assert.ok(!seen.has('heal'));
  assert.equal(w.choose('p', 'not-offered'), false);
});

test('crit chance, crit damage and execution amplify hits; vampirism heals only on kills', () => {
  const { w, p } = setup(); w.spawn('tank', p.x+100, p.y); const e = w.enemies[0];
  p.upgrades = { precision: 1, ferocity: 2, execution: 2, vampire: 3 }; p.hp = 50; w.random = () => 0;
  e.hp = 50; w.hurt(e, 10, p); assert.ok(Math.abs(e.hp - 17.5) < .001); assert.equal(p.hp, 50);
  w.hurt(e, 100, p); assert.equal(p.hp, 51.2); w.hurt(e, 100, p); assert.equal(p.hp, 51.2);
});

test('evasion prevents hits and thorns retaliate without reviving a fatally wounded owner', () => {
  const { w, p } = setup(); p.shield = 0; p.upgrades.dodge = 1; w.random = () => 0;
  w.damagePlayer(p, 20); assert.equal(p.hp, p.maxHp);
  p.shield = 0; p.upgrades = { thorns: 2, vampire: 50 }; p.hp = 1;
  w.spawn('walker', p.x + 50, p.y); const e = w.enemies[0]; e.hp = 10;
  w.damagePlayer(p, 20); assert.ok(p.dead); assert.equal(p.hp, 0); assert.ok(e.hp <= 0);
});

test('dash and rescue skills change cooldown and cooperative revive time', () => {
  const { w, p } = setup(); take(w, p, 'dash'); w.setInput(p.id, { x: 1, y: 0, dash: true }); assert.ok(p.dash < 4);
  p.input = { x: 0, y: 0 }; const fallen = w.addPlayer('f', 'Раненый'); fallen.x = p.x; fallen.y = p.y; fallen.dead = true;
  p.upgrades.rescue = 4; for (let i = 0; i < 46; i++) w.tick(1/30);
  assert.equal(fallen.dead, false);
});

test('ballistics increases projectile velocity and resonance widens explosions', () => {
  const { w, p } = setup(); w.spawn('tank', p.x+100, p.y);
  w.fire(p, 'rocket', w.enemies[0], 1); const base = w.bullets[0];
  p.upgrades.velocity = 3; p.upgrades.area = 3; w.fire(p, 'rocket', w.enemies[0], 1); const improved = w.bullets[1];
  assert.ok(improved.vx > base.vx); assert.ok(improved.area > base.area);
});

test('very high weapon ranks keep projectile and drone work bounded while damage grows', () => {
  const { w, p } = setup(); p.weapons = { gun: 1000, frost: 1000, orbit: 1000, lightning: 1000 }; w.spawn('boss', p.x + 300, p.y);
  w.tick(1/30); assert.ok(w.bullets.length <= 24); assert.ok(w.enemies.every(e => Number.isFinite(e.hp)));
});
