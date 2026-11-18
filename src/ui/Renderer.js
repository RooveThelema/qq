import { MAPS, HEROES, ENEMIES, WEAPONS, seededRandom, makeObstacles, INTERACTABLES } from '../game/catalog.js';

import { MotionBuffer } from './MotionBuffer.js';

const TAU = Math.PI * 2;
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const mix = (a, b, t) => a + (b - a) * t;

function circle(ctx, x, y, r, fill, stroke, width = 1) {
  ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, TAU);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
}
function line(ctx, x, y, xx, yy, color, width = 1) {
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(xx, yy); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
}
function roundRect(ctx, x, y, w, h, radius, fill, stroke) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, radius);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
}

/** Canvas-only presentation. Authoritative game state is never changed here. */
export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.camera = { x: 1400, y: 1100, zoom: 1 };
    this.mapId = 'outpost';
    this.state = null;
    this.localPlayerId = '';
    this.drawPositions = new Map();
    this.motion = new MotionBuffer(); this.online = false; this.lowQuality = false;
    this.clock = 0;
    this.snapshotAt = 0;
    this.followedId = '';
    this.map = MAPS.outpost;
    this.prepareMap();
    this.resize();
    this.onResize = () => this.resize();
    window.addEventListener('resize', this.onResize);
  }

  resize() {
    this.width = Math.max(1, window.innerWidth);
    this.height = Math.max(1, window.innerHeight);
    this.dpr = Math.min(this.lowQuality ? 1 : 1.5, window.devicePixelRatio || 1);
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.vignettes = null;
  }

  setMap(mapId) {
    if (this.state || !MAPS[mapId] || this.mapId === mapId) return;
    this.mapId = mapId;
    this.map = MAPS[mapId];
    this.prepareMap();
  }

  prepareMap() {
    this.groundLayer = null;
    this.obstacles = makeObstacles(this.mapId);
    const random = seededRandom(this.map.seed + 840);
    this.marks = Array.from({ length: 530 }, () => ({ x: random() * this.map.width, y: random() * this.map.height, r: 1 + random() * 3, a: random() * TAU, v: random() }));
    this.demoGems = Array.from({ length: 16 }, (_, i) => ({ id: i, x: this.map.width / 2 + Math.cos(i * 2.4) * (95 + random() * 300), y: this.map.height / 2 + Math.sin(i * 2.4) * (95 + random() * 240), value: 2, kind: 'xp' }));
  }

  setState(state, localPlayerId) {
    if (!state) {
      if (this.state) this.drawPositions.clear();
      this.state = null; this.motion.clear();
      this.localPlayerId = '';
      this.followedId = '';
      return;
    }
    if (state.mapId !== this.mapId) { this.mapId = state.mapId; this.map = MAPS[state.mapId] || MAPS.outpost; this.prepareMap(); this.drawPositions.clear(); this.followedId = ''; }
    if (this.online) this.motion.push(state, this.clock);
    this.state = state;
    this.localPlayerId = localPlayerId;
    this.snapshotAt = this.clock;
  }

  position(entity, prefix, alpha) {
    if (this.online) return this.motion.sample(entity, prefix, this.clock, prefix === 'p' && entity.id === this.localPlayerId);
    const id = `${prefix}${entity.id}`;
    let p = this.drawPositions.get(id);
    if (!p || Math.hypot(entity.x - p.x, entity.y - p.y) > 220) { p = { x: entity.x, y: entity.y, seen: this.clock }; this.drawPositions.set(id, p); }
    else { p.x = mix(p.x, entity.x, alpha); p.y = mix(p.y, entity.y, alpha); p.seen = this.clock; }
    return p;
  }

  visible(x, y, r = 60) { return x + r > this.bounds.left && x - r < this.bounds.right && y + r > this.bounds.top && y - r < this.bounds.bottom; }

  render(dt = 1 / 60) {
    dt = clamp(dt || 0, 0, 0.1);
    this.clock += dt;
    const c = this.ctx;
    const w = this.width;
    const h = this.height;
    const menu = !this.state;
    let state = this.state;
    if (menu) state = this.attractState();
    const renderTime = state.time + (state.status === 'playing' ? Math.min(0.1, this.clock - this.snapshotAt) : 0);
    const local = state.players.find(p => p.id === this.localPlayerId) || state.players[0];
    const target = local ? { ...local, ...this.position(local, 'p', 1 - Math.exp(-dt * 24)) } : { x: this.map.width / 2, y: this.map.height / 2 };
    const zoom = menu ? clamp(Math.min(w / 1400, h / 850), 0.7, 1.1) : clamp(Math.min(w / 1250, h / 780), 0.72, 1.08);
    this.camera.zoom = mix(this.camera.zoom, zoom, 1 - Math.exp(-dt * 8));
    const z = this.camera.zoom;
    const wantedX = target.x + (menu ? w * 0.03 / z : 0);
    const wantedY = target.y + (menu ? -h * 0.14 / z : 0);
    if (this.followedId !== target.id) { this.camera.x = wantedX; this.camera.y = wantedY; this.followedId = target.id; }
    else { this.camera.x = mix(this.camera.x, wantedX, 1 - Math.exp(-dt * 9)); this.camera.y = mix(this.camera.y, wantedY, 1 - Math.exp(-dt * 9)); }
    this.bounds = { left: this.camera.x - w / (2 * z), right: this.camera.x + w / (2 * z), top: this.camera.y - h / (2 * z), bottom: this.camera.y + h / (2 * z) };
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    c.fillStyle = '#0c1514'; c.fillRect(0, 0, w, h);
    c.save(); c.translate(w / 2, h / 2); c.scale(z, z); c.translate(-this.camera.x, -this.camera.y);
    this.drawGround(c, renderTime);
    const alpha = menu ? 1 : 1 - Math.exp(-dt * 24);
    for (const gem of state.gems) if (this.visible(gem.x, gem.y, 25)) this.drawGem(c, gem, renderTime);
    this.drawActivities(c, state, renderTime);
    // Objects are sorted by their feet for a small amount of top-down depth.
    const entities = [
      ...this.obstacles.map(ob => ({ type: 'obstacle', entity: ob, x: ob.x, y: ob.y })),
      ...state.enemies.map(e => { const p = this.position(e, 'e', alpha); return { type: 'enemy', entity: e, x: p.x, y: p.y }; }),
      ...state.players.map(p => { const pos = this.position(p, 'p', alpha); return { type: 'player', entity: p, x: pos.x, y: pos.y }; }),
    ].filter(item => this.visible(item.x, item.y, 150)).sort((a, b) => a.y - b.y);
    for (const item of entities) {
      if (!this.visible(item.x, item.y, 150)) continue;
      if (item.type === 'obstacle') this.drawObstacle(c, item.entity);
      else if (item.type === 'enemy') this.drawEnemy(c, item.entity, item.x, item.y, renderTime, state.players);
      else this.drawPlayer(c, item.entity, item.x, item.y, renderTime, item.entity.id === this.localPlayerId || menu);
    }
    for (const b of state.bullets) {
      const p = this.position(b, 'b', alpha);
      if (this.visible(p.x, p.y, 35)) this.drawBullet(c, b, p.x, p.y, renderTime);
    }
    for (const fx of state.effects) this.drawEffect(c, fx, renderTime);
    this.drawBoundary(c, renderTime);
    c.restore();
    if (!this.vignettes) this.vignettes = [false, true].map(isMenu => {
      const gradient = c.createRadialGradient(w * .5, h * .5, Math.min(w, h) * .12, w * .5, h * .5, Math.max(w, h) * .69);
      gradient.addColorStop(0, '#020a0900'); gradient.addColorStop(1, isMenu ? '#020908dc' : '#02090882'); return gradient;
    });
    c.fillStyle = this.vignettes[+menu]; c.fillRect(0, 0, w, h);
    if (menu) {
      const shade = c.createLinearGradient(0, 0, w, 0);
      shade.addColorStop(0, '#07100fd9'); shade.addColorStop(0.42, '#07100f44'); shade.addColorStop(1, '#07100f99');
      c.fillStyle = shade; c.fillRect(0, 0, w, h);
    } else {
      this.drawTeammateArrows(c, state, local);
      this.drawObjectiveArrow(c, state, local);
      if (w > 650 && state.status !== 'lobby') this.drawMinimap(c, state);
      if (local && !local.dead && local.hp / local.maxHp < 0.28) {
        c.strokeStyle = `rgba(222,93,70,${0.2 + Math.sin(this.clock * 4) * 0.08})`; c.lineWidth = 9; c.strokeRect(0, 0, w, h);
      }
    }
    if (Math.floor(this.clock * 2) !== Math.floor((this.clock - dt) * 2)) for (const [id, p] of this.drawPositions) if (this.clock - p.seen > 2) this.drawPositions.delete(id);
  }

  attractState() {
    const t = this.clock;
    const cx = this.map.width / 2;
    const cy = this.map.height / 2;
    const p = { id: 'demo', name: '', hero: 'ranger', color: '#8dd3bc', x: cx + Math.sin(t * 0.35) * 12, y: cy + Math.cos(t * 0.3) * 10, angle: -t * 0.2, hp: 110, maxHp: 110, weapons: { gun: 2, orbit: 2 }, connected: true, shield: 0 };
    const enemies = Array.from({ length: 14 }, (_, i) => {
      const angle = i * 2.4 + t * (i % 2 ? 0.035 : -0.025);
      const r = 210 + i % 4 * 85 + Math.sin(t * 0.4 + i) * 15;
      const type = ['walker', 'runner', 'walker', 'spitter', 'tank', 'charger'][i % 6];
      return { id: i, type, x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r * 0.7, hp: ENEMIES[type].hp, maxHp: ENEMIES[type].hp, radius: ENEMIES[type].radius };
    });
    const bullets = Array.from({ length: 3 }, (_, i) => { const a = p.angle; const r = ((t * 220 + i * 120) % 400) + 24; return { id: i, x: p.x + Math.cos(a) * r, y: p.y + Math.sin(a) * r, vx: Math.cos(a) * 650, vy: Math.sin(a) * 650, type: 'gun' }; });
    return { time: t, status: 'attract', players: [p], enemies, bullets, gems: this.demoGems, effects: [] };
  }

  drawGround(c, time) {
    if (!this.groundLayer) {
      const layer = document.createElement('canvas'); layer.width = this.map.width; layer.height = this.map.height;
      const bounds = this.bounds;
      this.bounds = { left: 0, top: 0, right: this.map.width, bottom: this.map.height };
      this.paintGround(layer.getContext('2d', { alpha: false }), 0);
      this.bounds = bounds; this.groundLayer = layer;
    }
    c.drawImage(this.groundLayer, 0, 0);
  }

  drawActivities(c, state, time) {
    for (const n of state.objects || []) {
      if (!this.visible(n.x, n.y, 100)) continue;
      const config = INTERACTABLES[n.kind], color = n.used || n.cooldown > 0 && !n.active ? '#61716a' : config.color;
      circle(c, n.x, n.y, 29, '#0a171be6', color, 2);
      if (n.active) circle(c, n.x, n.y, 36 + Math.sin(time * 4) * 3, null, color);
      c.textAlign = 'center'; c.font = 'bold 24px system-ui'; c.fillStyle = color; c.fillText(config.icon, n.x, n.y + 8);
      c.font = '10px system-ui'; c.fillText(n.used ? 'ПУСТО' : n.cooldown > 0 ? `${config.name} · ${n.active || n.cooldown}с` : config.name, n.x, n.y - 41);
    }
    const event = state.event;
    if (event && event.kind !== 'hunt') {
      circle(c, event.x, event.y, event.kind === 'relay' ? 145 : 65, '#efbf7010', '#efbf7088', 2);
      c.font = 'bold 12px system-ui'; c.textAlign = 'center'; c.fillStyle = '#efbf70'; c.fillText(event.kind === 'relay' ? 'УДЕРЖИВАЙТЕ ЗОНУ' : 'ПРИПАСЫ · E', event.x, event.y - 76);
    }
    for (const h of state.hazards || []) {
      circle(c, h.x, h.y, h.radius, '#f5917520', '#f59175', 2);
      circle(c, h.x, h.y, h.radius * Math.max(0, 1 - h.ttl / 2.7), '#f5917538');
      c.textAlign = 'center'; c.font = 'bold 24px system-ui'; c.fillStyle = '#f59175'; c.fillText('!', h.x, h.y + 8);
    }
  }

  paintGround(c, time) {
    const m = this.map;
    const cx = m.width / 2;
    const cy = m.height / 2;
    c.fillStyle = m.ground; c.fillRect(0, 0, m.width, m.height);
    const terrain = c.createRadialGradient(cx, cy, 80, cx, cy, 1700);
    terrain.addColorStop(0, m.id === 'desert' ? '#493a2866' : '#36564755'); terrain.addColorStop(1, '#08100c55');
    c.fillStyle = terrain; c.fillRect(0, 0, m.width, m.height);
    // The arena's route layout mirrors the collision-free central cross and rings.
    c.lineWidth = m.id === 'forest' ? 105 : 132;
    c.strokeStyle = m.id === 'forest' ? '#35432a42' : m.id === 'desert' ? '#66503928' : '#45564920';
    c.beginPath(); c.ellipse(cx, cy, 610, 490, 0, 0, TAU); c.stroke();
    c.lineWidth = 150;
    c.beginPath(); c.moveTo(cx, 0); c.lineTo(cx, m.height); c.moveTo(0, cy); c.lineTo(m.width, cy); c.stroke();
    if (m.id === 'outpost') {
      const startX = Math.max(0, Math.floor(this.bounds.left / 80) * 80);
      const startY = Math.max(0, Math.floor(this.bounds.top / 80) * 80);
      c.beginPath(); c.strokeStyle = '#6e8c7020'; c.lineWidth = 1;
      for (let x = startX; x < Math.min(m.width, this.bounds.right); x += 80) { c.moveTo(x, Math.max(0, this.bounds.top)); c.lineTo(x, Math.min(m.height, this.bounds.bottom)); }
      for (let y = startY; y < Math.min(m.height, this.bounds.bottom); y += 80) { c.moveTo(Math.max(0, this.bounds.left), y); c.lineTo(Math.min(m.width, this.bounds.right), y); }
      c.stroke();
      for (let i = -7; i <= 7; i++) { c.fillStyle = '#b8ca8b2d'; c.fillRect(cx - 4, cy + i * 120, 8, 32); c.fillRect(cx + i * 120, cy - 4, 32, 8); }
      c.strokeStyle = '#8fa56c2b'; c.lineWidth = 2; c.setLineDash([16, 18]); c.strokeRect(cx - 310, cy - 260, 620, 520); c.setLineDash([]);
    }
    for (const p of this.marks) {
      if (!this.visible(p.x, p.y, 20)) continue;
      c.save(); c.translate(p.x, p.y); c.rotate(p.a);
      if (m.id === 'forest') {
        c.strokeStyle = p.v > 0.5 ? '#8c9c5730' : '#121c163f'; c.lineWidth = 1.5;
        c.beginPath(); c.moveTo(-5, 2); c.lineTo(-3, -5); c.moveTo(0, 4); c.lineTo(1, -7); c.moveTo(5, 1); c.lineTo(4, -4); c.stroke();
      } else if (m.id === 'desert') {
        c.strokeStyle = '#bba17515'; c.lineWidth = 1; c.beginPath(); c.ellipse(0, 0, p.r * 6, p.r, 0, 0, Math.PI); c.stroke();
      } else { c.fillStyle = p.v > 0.7 ? '#8caa6b22' : '#080f0e44'; c.fillRect(0, 0, p.r * 2, 1.4); }
      c.restore();
    }
    // Faded extraction/deployment pad anchors the arena spatially.
    circle(c, cx, cy, 126, '#0c181733', '#82b79a24', 3);
    circle(c, cx, cy, 111, null, '#82b79a18', 1);
    c.save(); c.translate(cx, cy); c.strokeStyle = '#b0d4ad27'; c.lineWidth = 2;
    for (let i = 0; i < 4; i++) { c.rotate(Math.PI / 2); c.beginPath(); c.moveTo(89, -20); c.lineTo(106, -20); c.lineTo(106, 20); c.lineTo(89, 20); c.stroke(); }
    c.font = '600 32px ui-monospace, monospace'; c.fillStyle = '#a6c3a822'; c.textAlign = 'center'; c.fillText(m.id === 'outpost' ? '09' : m.id === 'forest' ? '03' : '07', 0, 11);
    c.font = '8px ui-monospace, monospace'; c.fillText('ПОСЛЕДНИЙ РУБЕЖ', 0, 61); c.restore();
    // Small signal lamps keep the open routes readable.
    for (let i = 0; i < 4; i++) { const a = i * TAU / 4; const x = cx + Math.cos(a) * 300; const y = cy + Math.sin(a) * 300; if (this.visible(x, y)) { circle(c, x, y, 8, '#0a1513', '#526659'); circle(c, x, y, 2.5, i === Math.floor(time / 2) % 4 ? '#dfb270' : '#83c9b2'); } }
  }

  drawObstacle(c, ob) {
    const r = ob.r;
    c.save(); c.translate(ob.x, ob.y);
    c.fillStyle = '#050b0966'; c.beginPath(); c.ellipse(8, 11, r * 1.15, r * 0.75, 0, 0, TAU); c.fill();
    if (this.mapId === 'forest') {
      const color = ['#2f4930', '#3a5030', '#304731'][ob.variant];
      c.fillStyle = '#4c4230'; c.fillRect(-6, -2, 12, 25);
      for (let i = 0; i < 3; i++) { const rr = r * (1 - i * 0.19); c.fillStyle = i === 2 ? '#547044' : color; c.beginPath(); c.moveTo(0, -rr - i * 9); c.lineTo(rr, rr * 0.5 - i * 9); c.lineTo(rr * 0.35, rr * 0.46 - i * 9); c.lineTo(0, rr * 0.7 - i * 9); c.lineTo(-rr * 0.4, rr * 0.45 - i * 9); c.lineTo(-rr, rr * 0.5 - i * 9); c.closePath(); c.fill(); }
      line(c, -r * 0.62, -8, -4, -r * 0.8, '#71875442', 2);
    } else if (this.mapId === 'desert') {
      c.beginPath(); c.moveTo(-r, -r * 0.25); c.lineTo(-r * 0.45, -r * 0.83); c.lineTo(r * 0.45, -r * 0.7); c.lineTo(r, -r * 0.1); c.lineTo(r * 0.7, r * 0.64); c.lineTo(-r * 0.5, r * 0.7); c.closePath(); c.fillStyle = '#6c5a44'; c.fill(); c.strokeStyle = '#9d84613b'; c.stroke();
      c.beginPath(); c.moveTo(-r, -r * 0.25); c.lineTo(-r * 0.15, -r * 0.14); c.lineTo(r * 0.45, -r * 0.7); c.lineTo(-r * 0.45, -r * 0.83); c.closePath(); c.fillStyle = '#827052'; c.fill();
      line(c, -r * 0.15, -r * 0.14, r * 0.7, r * 0.64, '#423a30', 2);
      if (ob.variant === 1) { c.fillStyle = '#b0a483'; c.fillRect(-15, -3, 27, 3); c.fillStyle = '#6e8c7d'; c.fillRect(-6, -8, 12, 14); }
    } else {
      const color = ['#405648', '#435346', '#4c5744'][ob.variant];
      roundRect(c, -r, -r * 0.68 + 8, r * 2, r * 1.36, 3, '#26372e', '#172b22');
      roundRect(c, -r, -r * 0.68, r * 2, r * 1.36, 3, color, '#72836a66');
      c.strokeStyle = '#243a2d'; c.lineWidth = 5; c.strokeRect(-r + 8, -r * 0.68 + 7, r * 2 - 16, r * 1.36 - 14);
      line(c, -r + 10, -r * 0.68 + 10, r - 10, r * 0.68 - 10, '#67745b70', 2);
      line(c, r - 10, -r * 0.68 + 10, -r + 10, r * 0.68 - 10, '#67745b70', 2);
      c.fillStyle = '#b9b17c'; c.fillRect(-r + 3, -r * 0.68 + 3, 6, 3); c.fillRect(r - 9, r * 0.68 - 6, 6, 3);
      c.font = '7px ui-monospace, monospace'; c.textAlign = 'center'; c.fillStyle = '#c1ce9c91'; c.fillText('R / 09', 0, 2);
    }
    c.restore();
  }

  drawGem(c, g, t) {
    const chest = g.kind === 'chest';
    const heal = g.kind === 'heal';
    const color = chest ? '#efbd70' : heal ? '#e89d8e' : g.value > 5 ? '#b8a4ef' : '#8dd3bc';
    const r = chest ? 10 : heal ? 7 : g.value > 5 ? 5.5 : 4;
    const pulse = 1 + Math.sin(t * 3 + g.id) * 0.1;
    c.save(); c.translate(g.x, g.y);
    circle(c, 0, 0, r * 2.3 * pulse, `${color}12`);
    if (chest) { roundRect(c, -9, -6, 18, 13, 2, '#79613b', color); c.fillStyle = color; c.fillRect(-2, -2, 4, 5); line(c, -8, -1, 8, -1, color); }
    else if (heal) { c.fillStyle = color; c.fillRect(-2, -6, 4, 12); c.fillRect(-6, -2, 12, 4); }
    else { c.rotate(Math.PI / 4); c.fillStyle = color; c.fillRect(-r / 1.4, -r / 1.4, r * 1.4, r * 1.4); c.fillStyle = '#e5fff066'; c.fillRect(-r / 1.4, -r / 1.4, r * 1.4, r / 2); }
    c.restore();
  }

  drawPlayer(c, p, x, y, t, local) {
    c.save(); c.translate(x, y);
    const color = p.color || HEROES[p.hero]?.color || '#8dd3bc';
    if (p.dead) {
      circle(c, 0, 0, 24, '#1c2523cc', `${color}88`, 2);
      line(c, -6, -6, 6, 6, color, 3); line(c, 6, -6, -6, 6, color, 3);
      c.strokeStyle = color; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, 31, -Math.PI / 2, -Math.PI / 2 + TAU * clamp((p.revive || 0) / 3, 0, 1)); c.stroke();
      c.font = '9px system-ui, sans-serif'; c.textAlign = 'center'; c.fillStyle = '#f1d9c5'; c.fillText(p.connected ? 'ПОМОГИ МНЕ' : 'НЕТ СВЯЗИ', 0, -39);
      c.restore(); return;
    }
    if (local) { circle(c, 0, 3, 24, '#8dd3bc0a', '#8dd3bc38'); c.strokeStyle = '#8dd3bc70'; c.lineWidth = 2; for (let i = 0; i < 4; i++) { const a = i * TAU / 4; line(c, Math.cos(a) * 28, Math.sin(a) * 28 + 3, Math.cos(a) * 32, Math.sin(a) * 32 + 3, '#8dd3bc85', 2); } }
    if (p.shield > 0) circle(c, 0, 0, 25 + Math.sin(t * 10) * 1.5, `${color}09`, `${color}${Math.floor((0.3 + Math.sin(t * 12) * 0.12) * 255).toString(16).padStart(2, '0')}`, 1.5);
    if (p.weapons?.orbit) {
      circle(c, 0, 0, 84, null, `${color}11`);
      const count = Math.min(12, p.weapons.orbit + (p.evolved?.orbit ? 3 : 0) + 1);
      for (let i = 0; i < count; i++) {
        const a = t * 2.4 + i * TAU / count;
        const ox = Math.cos(a) * 84; const oy = Math.sin(a) * 84;
        c.save(); c.translate(ox, oy); c.rotate(a + Math.PI / 2); c.fillStyle = '#080e0d'; c.fillRect(-6, -8, 12, 17); c.fillStyle = '#aad8c4'; c.fillRect(-4, -7, 8, 13); c.fillStyle = '#dcfff0'; c.fillRect(-2, -9, 4, 5); line(c, -3, 6, -3, 21, '#8dd3bc33', 3); c.restore();
      }
    }
    circle(c, 4, 9, 16, '#02090670');
    c.save(); c.rotate(p.angle || 0);
    const step = Math.sin(t * 14 + (p.id?.length || 0)) * 2;
    roundRect(c, -9 + step, -13, 13, 8, 2, '#172326'); roundRect(c, -9 - step, 5, 13, 8, 2, '#172326');
    roundRect(c, -14, -8, 10, 16, 3, '#243732', '#527164');
    c.fillStyle = color; c.beginPath(); c.ellipse(0, 0, 13, 11, 0, 0, TAU); c.fill();
    roundRect(c, -7, -7, 13, 14, 3, '#344b43', '#78978a');
    roundRect(c, 1, -4, 11, 8, 3, '#99ac91');
    c.fillStyle = '#1b2c2b'; c.fillRect(11, -4, 22, 7); c.fillStyle = '#879789'; c.fillRect(13, -3, 17, 3); c.fillStyle = color; c.fillRect(28, -2, 5, 2);
    c.fillStyle = '#c6c6a4'; c.fillRect(6, -10, 10, 5); c.fillRect(8, 7, 10, 4);
    circle(c, -1, -1, 7.2, '#9fb3a0', '#202f2b', 1.5); c.fillStyle = '#1e3433'; c.fillRect(0, -6, 6, 9); c.fillStyle = color; c.fillRect(5, -4, 2, 5);
    c.restore();
    if (!p.connected) { c.fillStyle = '#0c1414a0'; c.fillRect(-20, -20, 40, 40); }
    if (p.name) {
      c.textAlign = 'center'; c.font = `${local ? '600' : '500'} 10px system-ui, sans-serif`; c.fillStyle = '#06100f'; c.fillText(p.name, 1, -32); c.fillStyle = local ? '#dceee1' : color; c.fillText(p.name, 0, -33);
      roundRect(c, -21, -26, 42, 3, 1, '#0a1411'); roundRect(c, -21, -26, 42 * clamp(p.hp / p.maxHp, 0, 1), 3, 1, color);
    }
    c.restore();
  }

  drawEnemy(c, e, x, y, t, players) {
    const config = ENEMIES[e.type] || ENEMIES.walker;
    const r = e.radius || config.radius;
    let target = players.find(p => !p.dead) || { x: x - 1, y };
    for (const p of players) if (!p.dead && Math.hypot(p.x - x, p.y - y) < Math.hypot(target.x - x, target.y - y)) target = p;
    const angle = Math.atan2(target.y - y, target.x - x);
    c.save(); c.translate(x, y);
    if (e.type === 'charger' && e.charge > 0.5) {
      c.save(); c.rotate(Math.atan2(e.vy || 0, e.vx || 1));
      c.fillStyle = '#f1866333'; c.beginPath(); c.moveTo(0, -12); c.lineTo(200, -30); c.lineTo(200, 30); c.lineTo(0, 12); c.closePath(); c.fill(); line(c, 0, 0, 200, 0, '#f08e6d77', 1); c.restore();
    }
    circle(c, 3, r * 0.42, r * 0.95, '#0209075c');
    if (e.elite) circle(c, 0, 0, r + 8, null, '#efbf70', 2);
    if (e.slow) circle(c, 0, 0, r + 5, '#8fd8ef18', '#8fd8ef55');
    c.rotate(angle);
    const color = e.flash ? '#f3edc6' : e.slow ? '#7cacb0' : config.color;
    const step = Math.sin(t * (e.type === 'runner' ? 21 : 10) + e.id) * 3;
    if (this.lowQuality && e.type !== 'boss') {
      circle(c, 0, 0, r * .85, color); line(c, r * .3, 0, r, 0, '#17261e', 3);
    } else if (e.type === 'boss') {
      for (let i = 0; i < 7; i++) { const a = i * TAU / 7; c.save(); c.rotate(a + t * 0.12); c.fillStyle = '#a66352'; c.beginPath(); c.moveTo(r * 0.6, -8); c.lineTo(r * 1.23, 0); c.lineTo(r * 0.6, 8); c.closePath(); c.fill(); c.restore(); }
      circle(c, 0, 0, r, '#5b4742', color, 2.5); circle(c, 1, 0, r * 0.73, '#97694f', '#d19a72', 2); circle(c, 5, 0, r * 0.42, color); circle(c, 13, 0, r * 0.16, '#3b3430');
      line(c, 4, -r * 0.65, r * 0.65, -r * 0.3, '#2c3027', 7); line(c, 4, r * 0.65, r * 0.65, r * 0.3, '#2c3027', 7);
      circle(c, r * 0.6, -r * 0.22, 4, '#fff2c8'); circle(c, r * 0.6, r * 0.22, 4, '#fff2c8');
    } else if (e.type === 'tank') {
      roundRect(c, -r * 0.7, -r * 0.8, r * 1.4, r * 1.6, 7, '#625061', color);
      circle(c, 4, 0, r * 0.65, color); c.fillStyle = '#554552'; c.fillRect(-8, -r, 13, 10); c.fillRect(-8, r - 10, 13, 10); line(c, 8, -8, 15, -5, '#e2bdb3', 2); line(c, 8, 8, 15, 5, '#e2bdb3', 2);
    } else if (e.type === 'spitter') {
      circle(c, -4, 0, r, '#466b43', color); circle(c, -5, -6, 7, color); circle(c, -9, 5, 6, '#b0cd7e'); circle(c, 8, 0, 8, '#a3bf76'); circle(c, 13, 0, 3.5, '#2a4027');
      circle(c, -6, 0, 3 + Math.sin(t * 4) * 0.7, '#d5de88');
    } else if (e.type === 'splitter') {
      circle(c, 0, 0, r, '#634d6c', color, 2);
      for (let i = 0; i < 3; i++) { const a = i * TAU / 3; circle(c, Math.cos(a) * r * .5, Math.sin(a) * r * .5, 6, color); }
    } else if (e.type === 'leech') {
      circle(c, 0, 0, r, '#254b43', color, 2); line(c, -8, 0, 8, 0, color, 4); line(c, 0, -8, 0, 8, color, 4);
    } else if (e.type === 'charger') {
      roundRect(c, -r, -r * 0.65, r * 1.7, r * 1.3, 4, '#8c5143', color);
      c.fillStyle = color; c.beginPath(); c.moveTo(r * 1.2, 0); c.lineTo(r * 0.4, -r * 0.9); c.lineTo(r * 0.4, r * 0.9); c.closePath(); c.fill(); line(c, 8, -7, 14, -5, '#fde0a3', 2); line(c, 8, 7, 14, 5, '#fde0a3', 2);
    } else {
      c.fillStyle = '#47563e'; c.fillRect(-6 + step, -r * 0.82, 9, 5); c.fillRect(-6 - step, r * 0.82 - 5, 9, 5);
      c.fillStyle = color; c.beginPath(); c.ellipse(0, 0, r * (e.type === 'runner' ? 1 : 0.86), r * 0.72, 0, 0, TAU); c.fill();
      c.strokeStyle = '#18261d'; c.lineWidth = 1.5; c.stroke();
      line(c, 1, -r * 0.55, r * 1.2, -r * 0.7 + step, color, 4); line(c, 1, r * 0.55, r * 1.2, r * 0.7 - step, color, 4);
      circle(c, r * 0.5, 0, r * 0.52, e.type === 'runner' ? '#d2a869' : '#99ab68');
      circle(c, r * 0.8, -3, 1.4, '#e4ac77'); circle(c, r * 0.8, 3, 1.4, '#e4ac77');
      line(c, -r * 0.5, -3, 1, 3, '#4b623a', 2);
    }
    c.rotate(-angle);
    if (e.type === 'boss' || e.hp < e.maxHp * 0.9 && e.type === 'tank') {
      const bw = e.type === 'boss' ? 96 : 44;
      roundRect(c, -bw / 2, -r - 19, bw, 4, 1, '#08110f'); roundRect(c, -bw / 2, -r - 19, bw * clamp(e.hp / e.maxHp, 0, 1), 4, 1, config.color);
      if (e.type === 'boss') { c.font = '600 9px system-ui, sans-serif'; c.textAlign = 'center'; c.fillStyle = '#f0c6aa'; c.fillText('СТРАЖ РУБЕЖА', 0, -r - 26); }
    }
    c.restore();
  }

  drawBullet(c, b, x, y) {
    if (b.type === 'mine') { circle(c, x, y, 10, '#31291d', '#e6b97e', 2); circle(c, x, y, 3, '#efbf70'); return; }
    const color = b.type === 'enemy' ? '#e29a74' : WEAPONS[b.type]?.color || '#efc783';
    const angle = Math.atan2(b.vy || 0, b.vx || 0);
    c.save(); c.translate(x, y); c.rotate(angle);
    if (b.type === 'enemy') { circle(c, 0, 0, 10, '#e29a7416'); circle(c, 0, 0, b.radius || 6, '#ad5d45', '#edb07a', 1.5); circle(c, -1.5, -1.5, 2, '#f7cca1'); }
    else if (b.type === 'rocket') { line(c, -28, 0, -4, 0, '#f5917533', 6); line(c, -16, 0, -4, 0, '#e9ba75', 3); c.fillStyle = '#c7d0b9'; c.fillRect(-5, -3, 12, 6); c.fillStyle = color; c.fillRect(5, -2, 3, 4); }
    else { line(c, -17, 0, 2, 0, `${color}25`, b.type === 'frost' ? 7 : 5); line(c, -8, 0, 4, 0, color, b.type === 'frost' ? 3.5 : 2.5); circle(c, 3, 0, 1.8, '#fff3d1'); }
    c.restore();
  }

  drawEffect(c, fx) {
    if (!this.visible(fx.x, fx.y, (fx.radius || 0) + 70) && fx.kind !== 'lightning') return;
    const color = fx.color || '#8dd3bc';
    const progress = 1 - clamp(fx.ttl / (fx.kind === 'ping' ? 4 : fx.kind === 'lightning' ? 0.24 : 0.5), 0, 1);
    c.save(); c.globalAlpha = (1 - progress) * 0.9;
    if (fx.kind === 'lightning') {
      const random = seededRandom(fx.id);
      c.beginPath(); c.moveTo(fx.x, fx.y);
      for (let i = 1; i <= 7; i++) { const t = i / 7; c.lineTo(mix(fx.x, fx.toX, t) + (i === 7 ? 0 : (random() - 0.5) * 22), mix(fx.y, fx.toY, t) + (i === 7 ? 0 : (random() - 0.5) * 22)); }
      c.strokeStyle = `${color}55`; c.lineWidth = 7; c.stroke(); c.strokeStyle = color; c.lineWidth = 2; c.stroke();
    } else {
      const r = fx.radius * (0.3 + progress * 0.7);
      circle(c, fx.x, fx.y, r, `${color}08`, color, fx.kind === 'blast' ? 3 : 2);
      circle(c, fx.x, fx.y, Math.max(0, r - 10), null, `${color}55`, 1);
      if (fx.kind === 'blast') for (let i = 0; i < 8; i++) { const a = i * TAU / 8 + fx.id; line(c, fx.x + Math.cos(a) * r * 0.55, fx.y + Math.sin(a) * r * 0.55, fx.x + Math.cos(a) * r, fx.y + Math.sin(a) * r, color, 2); }
    }
    c.restore();
  }

  drawBoundary(c, time) {
    const m = this.map;
    c.strokeStyle = '#162b22'; c.lineWidth = 28; c.strokeRect(14, 14, m.width - 28, m.height - 28);
    c.strokeStyle = '#a5ba7b38'; c.lineWidth = 2; c.setLineDash([12, 12]); c.strokeRect(29, 29, m.width - 58, m.height - 58); c.setLineDash([]);
    const alpha = 0.3 + Math.sin(time * 1.5) * 0.1;
    c.strokeStyle = `rgba(179,181,118,${alpha})`; c.lineWidth = 1; c.strokeRect(35, 35, m.width - 70, m.height - 70);
  }

  drawTeammateArrows(c, state, local) {
    if (!local) return;
    const w = this.width; const h = this.height; const z = this.camera.zoom;
    for (const p of state.players) {
      if (p.id === local.id) continue;
      const x = (p.x - this.camera.x) * z + w / 2; const y = (p.y - this.camera.y) * z + h / 2;
      if (x > 32 && x < w - 32 && y > 110 && y < h - 85) continue;
      const dx = x - w / 2; const dy = y - h / 2;
      const ratio = Math.min((w / 2 - 30) / Math.max(1, Math.abs(dx)), (h / 2 - 95) / Math.max(1, Math.abs(dy)));
      const px = w / 2 + dx * ratio; const py = h / 2 + dy * ratio;
      const color = p.dead ? '#e8a18b' : p.color || '#8dd3bc';
      c.save(); c.translate(px, py); c.rotate(Math.atan2(dy, dx)); c.fillStyle = color; c.beginPath(); c.moveTo(7, 0); c.lineTo(-5, -5); c.lineTo(-3, 0); c.lineTo(-5, 5); c.closePath(); c.fill(); c.restore();
      c.font = '9px system-ui, sans-serif'; c.textAlign = 'center'; c.fillStyle = color; c.fillText(`${p.dead ? '+ ' : ''}${p.name} · ${Math.round(Math.hypot(p.x - local.x, p.y - local.y) / 40)}м`, px, py + 17);
    }
  }

  drawObjectiveArrow(c, state, local) {
    if (!local) return;
    const targets = (state.effects || []).filter(fx => fx.kind === 'ping').map(fx => ({ ...fx, label: 'МЕТКА ОТРЯДА' }));
    if (state.event && state.event.kind !== 'hunt') targets.push({ ...state.event, color: '#efbf70', label: 'ЗАДАНИЕ' });
    for (const target of targets) {
      const x = (target.x - this.camera.x) * this.camera.zoom, y = (target.y - this.camera.y) * this.camera.zoom;
      const maxX = this.width / 2 - 48, maxY = this.height / 2 - 130;
      const ratio = Math.min(1, maxX / Math.max(1, Math.abs(x)), Math.max(20, maxY) / Math.max(1, Math.abs(y)));
      if (ratio >= 1) continue;
      const px = this.width / 2 + x * ratio, py = this.height / 2 + y * ratio;
      c.save(); c.translate(px, py); c.rotate(Math.atan2(y, x));
      c.fillStyle = target.color; c.beginPath(); c.moveTo(10, 0); c.lineTo(-6, -7); c.lineTo(-3, 0); c.lineTo(-6, 7); c.closePath(); c.fill(); c.restore();
      c.font = '9px system-ui'; c.textAlign = 'center'; c.fillStyle = target.color;
      c.fillText(`${target.label} · ${Math.round(Math.hypot(target.x - local.x, target.y - local.y) / 40)}м`, px, py + 21);
    }
  }

  drawMinimap(c, state) {
    const w = 140; const h = Math.round(w * this.map.height / this.map.width);
    const x = this.width - w - 20; const y = 110;
    c.save(); c.translate(x, y);
    roundRect(c, 0, 0, w, h, 5, '#081311bf', '#83c9b22a');
    const sx = w / this.map.width; const sy = h / this.map.height;
    c.fillStyle = '#71866b55';
    for (const ob of this.obstacles) circle(c, ob.x * sx, ob.y * sy, Math.max(1, ob.r * sx), '#71866b55');
    const bw = this.width / this.camera.zoom * sx; const bh = this.height / this.camera.zoom * sy;
    c.strokeStyle = '#a8c6ad35'; c.lineWidth = 1; c.strokeRect(clamp(this.camera.x * sx - bw / 2, 0, w), clamp(this.camera.y * sy - bh / 2, 0, h), Math.min(w, bw), Math.min(h, bh));
    for (const n of state.objects || []) if (!n.used) circle(c, n.x * sx, n.y * sy, 2, INTERACTABLES[n.kind].color);
    if (state.event && state.event.kind !== 'hunt') circle(c, state.event.x * sx, state.event.y * sy, 5, null, '#efbf70', 2);
    for (const e of state.enemies) if (e.type === 'boss') circle(c, e.x * sx, e.y * sy, 3.5, '#e99b7b');
    for (const fx of state.effects) if (fx.kind === 'ping') circle(c, fx.x * sx, fx.y * sy, 5, null, fx.color, 2);
    for (const p of state.players) { circle(c, p.x * sx, p.y * sy, p.id === this.localPlayerId ? 3.2 : 2.5, p.dead ? '#e89985' : p.color || '#8dd3bc', '#071411', 1); }
    c.font = '8px ui-monospace, monospace'; c.textAlign = 'right'; c.fillStyle = '#a6c3a884'; c.fillText(this.map.name.toUpperCase(), w - 5, h - 7); c.restore();
  }
}
