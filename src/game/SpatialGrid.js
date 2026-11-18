/** Reusable broad phase. Queries return candidates, callers do precise checks. */
export class SpatialGrid {
  constructor(size = 96) { this.size = size; this.cells = new Map(); this.pool = []; }
  rebuild(entities) {
    for (const bucket of this.cells.values()) { bucket.length = 0; this.pool.push(bucket); }
    this.cells.clear();
    for (const e of entities) {
      if (e.hp <= 0) continue;
      const key = Math.floor(e.x / this.size) + Math.floor(e.y / this.size) * 65536;
      let bucket = this.cells.get(key);
      if (!bucket) { bucket = this.pool.pop() || []; this.cells.set(key, bucket); }
      bucket.push(e);
    }
  }
  insert(e) {
    const key = Math.floor(e.x / this.size) + Math.floor(e.y / this.size) * 65536;
    let bucket = this.cells.get(key);
    if (!bucket) { bucket = this.pool.pop() || []; this.cells.set(key, bucket); }
    bucket.push(e);
  }
  relocate(e, oldX, oldY) {
    const oldKey = Math.floor(oldX / this.size) + Math.floor(oldY / this.size) * 65536;
    const newKey = Math.floor(e.x / this.size) + Math.floor(e.y / this.size) * 65536;
    if (oldKey === newKey) return;
    const bucket = this.cells.get(oldKey), index = bucket?.indexOf(e) ?? -1;
    if (index >= 0) bucket.splice(index, 1);
    this.insert(e);
  }
  query(x, y, radius, result = []) {
    result.length = 0;
    const minX = Math.floor((x - radius) / this.size), maxX = Math.floor((x + radius) / this.size);
    const minY = Math.floor((y - radius) / this.size), maxY = Math.floor((y + radius) / this.size);
    for (let cy = minY; cy <= maxY; cy++) for (let cx = minX; cx <= maxX; cx++) {
      const bucket = this.cells.get(cx + cy * 65536);
      if (bucket) for (const e of bucket) result.push(e);
    }
    return result;
  }
}
