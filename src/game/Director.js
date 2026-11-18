import { INTERACTABLES, RUN_MODES } from './catalog.js';

/** Bounded world events. All progress and rewards are server-authoritative. */
export class Director {
  constructor(world, mode) {
    this.world = world; this.mode = RUN_MODES[mode] ? mode : 'classic';
    this.duration = RUN_MODES[this.mode].duration;
    this.completed = 0; this.nextEvent = 35; this.nextHazard = 75;
    this.event = null; this.hazards = []; this.notice = ''; this.noticeUntil = 0;
    this.objects = [];
    const kinds = ['cache', 'medic', 'turret', 'shrine', 'cache', 'turret', 'medic', 'shrine'];
    for (let i = 0; i < kinds.length; i++) {
      const angle = (i % 4) * Math.PI / 2;
      const r = i < 4 ? 215 : 650;
      const node = { id: world.nextId++, kind: kinds[i], x: world.map.width / 2 + Math.cos(angle) * r, y: world.map.height / 2 + Math.sin(angle) * r, cooldown: 0, active: 0, shots: 0, used: false };
      this.objects.push(node);
    }
  }
  tell(message) { this.notice = message; this.noticeUntil = this.world.time + 7; }
  reward() {
    const w = this.world;
    this.completed++;
    w.giveXp(20 + this.completed * 8);
    for (const p of w.players.values()) { p.pending++; w.offer(p); p.hp = Math.min(p.maxHp, p.hp + 25); }
    this.tell('Задание выполнено! Отряд получил опыт, лечение и улучшение.');
    this.event = null; this.nextEvent = w.time + 55;
  }
  interact(id) {
    const w = this.world, p = w.players.get(id);
    if (w.status !== 'playing' || !p || p.dead || !p.connected) return false;
    let node, best = 100;
    for (const item of this.objects) {
      const d = Math.hypot(item.x - p.x, item.y - p.y);
      if (!item.used && item.cooldown <= 0 && d < best) { best = d; node = item; }
    }
    if (!node) return false;
    if (node.kind === 'cache') {
      node.used = true;
      w.giveXp(18 + Math.floor(w.time / 30));
      for (const member of w.players.values()) { member.pending++; w.offer(member); }
      this.tell('Тайник открыт: каждый боец получает улучшение.');
      if (this.event?.kind === 'supply' && this.event.target === node.id) this.reward();
    } else if (node.kind === 'medic') {
      node.cooldown = 70;
      for (const member of w.players.values()) if (!member.dead) member.hp = Math.min(member.maxHp, member.hp + member.maxHp * .45);
      this.tell('Медстанция восстановила здоровье отряда.');
    } else if (node.kind === 'turret') {
      node.active = 25; node.cooldown = 65; node.owner = p.id;
      this.tell('Турель прикрывает отряд в течение 25 секунд.');
    } else if (node.kind === 'shrine') {
      if (!w.spawn('tank', node.x + 140, node.y)) return false;
      const e = w.enemies.at(-1); e.elite = true; e.reward = true; e.hp *= 4; e.maxHp = e.hp; e.speed *= 1.25;
      node.cooldown = 100;
      this.tell('Обелиск пробудил элиту! Победи её ради улучшения.');
    }
    w.effect('pulse', node.x, node.y, 90, INTERACTABLES[node.kind].color);
    return true;
  }
  tick(dt, alive) {
    const w = this.world;
    for (const node of this.objects) {
      node.cooldown = Math.max(0, node.cooldown - dt); node.active = Math.max(0, node.active - dt); node.shots -= dt;
      if (node.active > 0 && node.shots <= 0) {
        const owner = w.players.get(node.owner);
        let target, best = 480 * 480;
        for (const e of w.enemies) { const d = (e.x - node.x) ** 2 + (e.y - node.y) ** 2; if (e.hp > 0 && d < best) { target = e; best = d; } }
        if (target) { w.effect('lightning', node.x, node.y, 0, '#8fd8ef', { toX: target.x, toY: target.y }); w.hurt(target, 45 + w.time / 12, owner); }
        node.shots = .35;
      }
    }
    if (!this.event && w.time >= this.nextEvent) {
      const kinds = ['relay', 'hunt', 'supply'];
      const choices = kinds.filter(k => k !== this.previousKind);
      const kind = choices[Math.floor(w.random() * choices.length)]; this.previousKind = kind;
      const node = this.objects[Math.floor(w.random() * this.objects.length)];
      this.event = { kind, x: node.x, y: node.y, progress: 0, goal: kind === 'hunt' ? 35 + this.completed * 5 : kind === 'relay' ? 16 : 1, endsAt: w.time + 85, startKills: w.kills };
      if (kind === 'supply') { const cache = this.objects.filter(n => n.kind === 'cache')[Math.floor(w.random() * 2)]; cache.used = false; this.event.x = cache.x; this.event.y = cache.y; this.event.target = cache.id; }
      this.tell(kind === 'relay' ? 'Сигнал SOS: удерживайте зону ретранслятора. Вдвоём быстрее!' : kind === 'hunt' ? 'Прорыв орды: выполните заказ на уничтожение врагов.' : 'Разведка обнаружила припасы! Доберитесь до отмеченного тайника.');
    }
    if (this.event) {
      const e = this.event;
      if (e.kind === 'relay') e.progress += dt * Math.min(2, alive.filter(p => Math.hypot(p.x - e.x, p.y - e.y) < 145).length);
      if (e.kind === 'hunt') e.progress = w.kills - e.startKills;
      if (e.progress >= e.goal) this.reward();
      else if (w.time >= e.endsAt) { this.event = null; this.nextEvent = w.time + 30; this.tell('Сигнал потерян. Следующее задание скоро появится.'); }
    }
    if (w.time >= this.nextHazard) {
      this.nextHazard = w.time + 32 + w.random() * 18;
      const p = alive[Math.floor(w.random() * alive.length)];
      for (let i = 0; i < 3; i++) this.hazards.push({ id: w.nextId++, x: p.x + (w.random() - .5) * 480, y: p.y + (w.random() - .5) * 480, radius: 78, ttl: 2.7 });
    }
    for (const hazard of this.hazards) {
      hazard.ttl -= dt;
      if (hazard.ttl > 0) continue;
      w.effect('blast', hazard.x, hazard.y, hazard.radius, '#f59175');
      for (const p of alive) if (Math.hypot(p.x - hazard.x, p.y - hazard.y) < hazard.radius) w.damagePlayer(p, 24);
      for (const e of w.enemies) if (Math.hypot(e.x - hazard.x, e.y - hazard.y) < hazard.radius + e.radius) w.hurt(e, 160, null);
    }
    this.hazards = this.hazards.filter(h => h.ttl > 0);
  }
  snapshot() {
    return { runMode: this.mode, duration: this.duration, completed: this.completed,
      event: this.event ? { ...this.event, progress: Math.round(this.event.progress * 10) / 10 } : null,
      notice: this.world.time < this.noticeUntil ? this.notice : '',
      objects: this.objects.map(({ shots, owner, ...n }) => ({ ...n, cooldown: Math.ceil(n.cooldown), active: Math.ceil(n.active) })),
      hazards: this.hazards.map(h => ({ ...h, ttl: Math.round(h.ttl * 10) / 10 })) };
  }
}
