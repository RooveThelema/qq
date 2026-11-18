/** Interpolate server positions, with at most 100ms of extrapolation on packet gaps. */
export class MotionBuffer {
  constructor() { this.clear(); }
  clear() { this.frames = []; this.interval = 1 / 15; this.lastAt = null; }
  push(state, now) {
    if (this.frames.length && state.time < this.frames.at(-1).time) this.clear();
    if (this.frames.at(-1)?.time === state.time) return;
    if (this.lastAt !== null) this.interval = this.interval * .8 + Math.min(.3, now - this.lastAt) * .2;
    this.lastAt = now;
    const positions = new Map();
    for (const [prefix, list] of [['p', state.players], ['e', state.enemies], ['b', state.bullets]]) for (const e of list) positions.set(prefix + e.id, e);
    this.frames.push({ time: state.time, at: now, positions });
    if (this.frames.length > 8) this.frames.shift();
  }
  sample(entity, prefix, now, immediate = false) {
    const frames = this.frames, last = frames.at(-1);
    if (!last || frames.length < 2) return entity;
    const delay = immediate ? 0 : Math.max(.067, Math.min(.2, this.interval * 1.15));
    const time = last.time + Math.min(.1, Math.max(0, now - last.at)) - delay;
    let a = frames[0], b = last;
    for (let i = 1; i < frames.length; i++) { a = frames[i - 1]; b = frames[i]; if (b.time >= time) break; }
    const key = prefix + entity.id, from = a.positions.get(key), to = b.positions.get(key);
    if (!from || !to || Math.hypot(to.x - from.x, to.y - from.y) > 220) return entity;
    const span = b.time - a.time;
    const ratio = Math.max(0, Math.min(1 + .1 / Math.max(.01, span), (time - a.time) / Math.max(.01, span)));
    return { x: from.x + (to.x - from.x) * ratio, y: from.y + (to.y - from.y) * ratio };
  }
}
