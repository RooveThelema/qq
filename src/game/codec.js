// Complete, independently decodable frames: dropping a stale frame is safe.
export function packState(state) {
  return { ...state, packed: 1,
    enemies: state.enemies.map(e => [e.id, e.type, e.x, e.y, e.hp, e.maxHp, e.radius, +e.flash | (+e.slow << 1) | (+!!e.elite << 2), Math.round((e.charge || 0) * 100), Math.round((e.vx || 0) * 100), Math.round((e.vy || 0) * 100)]),
    bullets: state.bullets.map(b => [b.id, b.x, b.y, b.vx, b.vy, b.type, b.radius]),
    gems: state.gems.map(g => [g.id, g.x, g.y, g.value, g.kind]),
  };
}
export function unpackState(state) {
  if (!state?.packed) return state;
  const { packed, ...rest } = state;
  return { ...rest,
    enemies: state.enemies.map(e => ({ id: e[0], type: e[1], x: e[2], y: e[3], hp: e[4], maxHp: e[5], radius: e[6], flash: !!(e[7] & 1), slow: !!(e[7] & 2), elite: !!(e[7] & 4), charge: e[8] / 100, vx: e[9] / 100, vy: e[10] / 100 })),
    bullets: state.bullets.map(b => ({ id: b[0], x: b[1], y: b[2], vx: b[3], vy: b[4], type: b[5], radius: b[6] })),
    gems: state.gems.map(g => ({ id: g[0], x: g[1], y: g[2], value: g[3], kind: g[4] })),
  };
}
