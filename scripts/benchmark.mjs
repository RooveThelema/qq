import { performance } from 'node:perf_hooks';
import { gzipSync } from 'node:zlib';
import { packState } from '../src/game/codec.js';
const { World } = await import(process.argv[2] || '../src/game/World.js');
const w = new World('outpost', 42); w.obstacles = [];
// Fixed combat scenario, excluding optional missions and map collision.
if (w.director) w.director.tick = () => {};
for (let i = 0; i < 4; i++) {
  const p = w.addPlayer('p' + i, 'Test');
  p.weapons = { gun: 5, orbit: 5, pulse: 5, lightning: 5, rocket: 5, frost: 5 }; p.maxHp = p.hp = 1e9;
}
w.start(); w.time = 400; w.spawnClock = 1e9; w.bossCount = 4;
const samples = [];
for (let t = 0; t < 1200; t++) {
  while (w.enemies.length < 250) w.spawn('tank', 1400 + Math.cos(w.nextId * 2.4) * 400, 1100 + Math.sin(w.nextId * 2.4) * 400);
  const start = performance.now(); w.tick(1/30); if (t % 2 === 0) JSON.stringify(w.snapshot());
  if (t > 100) samples.push(performance.now() - start);
}
samples.sort((a, b) => a - b);
const raw = JSON.stringify(w.snapshot()), packed = JSON.stringify(packState(w.snapshot()));
console.log(JSON.stringify({ scenario: '4 players, 250 enemies, six max-level weapons', medianMs: +samples[Math.floor(samples.length * .5)].toFixed(3), p95Ms: +samples[Math.floor(samples.length * .95)].toFixed(3), rawBytes: Buffer.byteLength(raw), packedBytes: Buffer.byteLength(packed), gzipBytes: gzipSync(packed).length }, null, 2));
