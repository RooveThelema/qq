import { getApiBaseUrl, setApiBaseUrl } from '../../config/apiConfig.js';

export class MultiplayerModule {
  constructor() {
    this.name = 'multiplayer';
    this.alwaysUpdate = true;
    this.id = globalThis.crypto?.randomUUID?.() || `player-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    this.room = '';
    this.players = [];
    this.isHost = false;
    this.pending = [];
    this.seen = new Set();
    this.busy = false;
    this.lastPoll = 0;
  }
  init(engine) {
    this.engine = engine;
    const box = document.createElement('div');
    box.className = 'multiplayer-panel';
    box.innerHTML = `<button class="network-open" type="button">Совместная игра</button><span class="network-status">Одиночная игра</span><div class="network-dialog hidden"><div class="network-card"><div class="network-heading"><strong>Совместная игра</strong><button type="button" class="network-close" aria-label="Закрыть">×</button></div><p>Создайте комнату или войдите к другу.</p><label>Адрес сервера<input class="network-server" placeholder="https://адрес-сервера"></label><label>Ваше имя<input class="network-name" maxlength="20" placeholder="Игрок"></label><label>Название комнаты<input class="network-room" maxlength="24" placeholder="Например, bunker" autocomplete="off"></label><div class="network-actions"><button class="network-create" type="button">Создать комнату</button><button class="network-join" type="button">Войти в комнату</button><button class="network-leave hidden" type="button">Выйти из комнаты</button></div><p class="network-info">Название комнаты — латинские буквы и цифры.</p><div class="network-address"></div></div></div>`;
    document.body.appendChild(box);
    this.box = box;
    this.status = box.querySelector('.network-status');
    this.info = box.querySelector('.network-info');
    this.address = box.querySelector('.network-address');
    this.dialog = box.querySelector('.network-dialog');
    const server = box.querySelector('.network-server');
    server.value = getApiBaseUrl();
    const room = box.querySelector('.network-room');
    const name = box.querySelector('.network-name');
    this.openMenu = () => this.dialog.classList.remove('hidden');
    box.querySelector('.network-open').onclick = this.openMenu;
    box.querySelector('.network-close').onclick = () => this.dialog.classList.add('hidden');
    this.connect = (action, roomName = room.value) => {
      if (this.room || this.busy) return;
      const value = roomName.trim();
      if (!/^[a-zA-Z0-9_-]{1,24}$/.test(value)) { this.info.textContent = 'Введите название комнаты латинскими буквами или цифрами.'; return; }
      const api = server.value.trim();
      if (!api && (location.protocol === 'file:' || location.hostname.endsWith('.github.io'))) { this.info.textContent = 'Укажите адрес сервера игры.'; return; }
      if (api && location.protocol === 'https:' && !api.startsWith('https://')) { this.info.textContent = 'Для этой страницы нужен адрес сервера с https://'; return; }
      setApiBaseUrl(api);
      this.apiBase = getApiBaseUrl();
      room.value = value;
      this.room = value; this.playerName = name.value.trim() || 'Игрок';
      this.action = action; this.isHost = false; this.seen.clear(); this.pending = [];
      this.info.textContent = 'Подключаемся…'; this.poll();
    };
    box.querySelector('.network-create').onclick = () => this.connect('create');
    box.querySelector('.network-join').onclick = () => this.connect('join');
    box.querySelector('.network-leave').onclick = () => this.leave();
    const params = new URLSearchParams(location.search);
    if (params.get('room')) { room.value = params.get('room'); this.openMenu(); }
    this.apiBase = getApiBaseUrl();
    fetch(`${this.apiBase}/api/network`).then(r => r.ok ? r.json() : Promise.reject()).then(data => { this.addresses = data.addresses || []; }).catch(() => {});
    window.addEventListener('pagehide', () => this.leave());
  }
  leave() {
    if (this.room) navigator.sendBeacon(`${this.apiBase}/api/multiplayer`, new Blob([JSON.stringify({room:this.room,id:this.id,leave:true})], {type:'application/json'}));
    this.room = ''; this.isHost = false; this.players = []; this.pending = [];
    this.status.textContent = 'Одиночная игра';
    this.info.textContent = 'Вы вышли из комнаты.';
    this.address.textContent = '';
    this.box.querySelector('.network-leave').classList.add('hidden');
  }
  send(event) { if (this.room) this.pending.push(event); }
  update() {
    if (this.room && !this.busy && performance.now() - this.lastPoll > 120) this.poll();
    if (!this.room || this.isHost || this.engine.isPaused) return;
    const player = this.engine.getModule('player');
    const zombies = this.engine.getModule('zombies');
    if (!player || player.isDead || !zombies) return;
    const now = performance.now();
    for (const z of zombies.zombies) {
      if (Math.hypot(player.x-z.x, player.y-z.y) < player.radius + z.radius && now - (this.lastDamage || 0) > 1000) {
        player.takeDamage(z.damage || 20); this.lastDamage = now; break;
      }
    }
  }
  async poll() {
    if (!this.room || this.busy) return;
    this.busy = true; this.lastPoll = performance.now();
    const room = this.room;
    const player = this.engine.getModule('player');
    const zombies = this.engine.getModule('zombies');
    const map = this.engine.getModule('map');
    const events = this.pending.splice(0);
    const body = { room, action:this.action, id:this.id, name:this.playerName, x:player.x, y:player.y, angle:player.angle, hp:player.hp, events };
    if (this.isHost) body.world = { zombies:zombies.zombies, projectiles:zombies.enemyProjectiles, pools:zombies.hazardPools, powerUps:zombies.powerUps, round:zombies.currentRound, doors:map.doors.filter(d => d.isOpen).map(d => d.id) };
    try {
      const response = await fetch(`${this.apiBase}/api/multiplayer`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
      const data = await response.json().catch(() => ({}));
      if (response.status === 404 && this.action === 'create') { this.room = ''; this.action = null; this.info.textContent = 'Сервер мультиплеера не найден. Откройте актуальный адрес сервера игры и обновите страницу.'; return; }
      if (!response.ok) { if (this.action) { this.room = ''; this.action = null; this.info.textContent = data.error === 'Not found' ? 'Комната не найдена. Проверьте название и адрес сервера.' : (data.error || 'Не удалось войти'); return; } throw new Error('network'); }
      this.action = null;
      this.box.querySelector('.network-leave').classList.remove('hidden');
      this.info.textContent = `Вы в комнате «${room}». Друг должен открыть адрес вашего компьютера и войти с тем же названием.`;
      if (this.isHost || data.host === this.id) { const page = new URL(location.href); page.searchParams.set('room', room); if (this.apiBase) page.searchParams.set('api', this.apiBase); this.address.textContent = `Ссылка для друзей: ${page.toString()}`; }
      if (room !== this.room) return;
      this.isHost = data.host === this.id;
      this.players = data.players.filter(p => p.id !== this.id);
      this.status.textContent = `Комната ${room} · игроков: ${data.players.length}${this.isHost ? ' · ведущий' : ''}`;
      if (!this.isHost && data.world) {
        zombies.zombies = data.world.zombies || [];
        zombies.enemyProjectiles = data.world.projectiles || [];
        zombies.hazardPools = data.world.pools || [];
        zombies.powerUps = data.world.powerUps || [];
        zombies.currentRound = data.world.round;
        for (const door of data.world.doors || []) map.openDoor(door);
      }
      for (const event of data.events || []) {
        if (this.seen.has(event.seq)) continue;
        this.seen.add(event.seq);
        if (event.from === this.id) continue;
        if (event.type === 'hit' && this.isHost) {
          const index = zombies.zombies.findIndex(z => z.id === event.id);
          if (index >= 0) {
            const z = zombies.zombies[index]; z.hp -= Math.max(0, Math.min(1000, Number(event.damage) || 0)); z.hitFlashTime = .1;
            if (z.hp <= 0) zombies.killZombieAtIndex(index, false);
          }
        }
        if (event.type === 'spawn' && this.isHost) zombies.spawnAdminZombie(event.enemy);
        if (event.type === 'door' && this.isHost) map.openDoor(event.id);
        if (event.type === 'teleport' && event.target === this.id && Number.isFinite(event.x) && Number.isFinite(event.y)) {
          if (!map.checkCollision(event.x, event.y, player.radius)) { player.x = event.x; player.y = event.y; }
        }
      }
      if (this.seen.size > 1000) this.seen = new Set((data.events || []).map(e => e.seq));
    } catch { this.pending.unshift(...events); this.status.textContent = 'Нет связи с сервером'; this.info.textContent = 'Сервер недоступен. Запустите игру через npm start и откройте её адрес в браузере.'; }
    finally { this.busy = false; }
  }
  render(ctx) {
    if (!this.room) return;
    for (const p of this.players) {
      ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.angle);
      ctx.fillStyle = '#70c9e8'; ctx.beginPath(); ctx.arc(0,0,18,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#d5efff'; ctx.fillRect(8,-4,20,8); ctx.rotate(-p.angle);
      ctx.fillStyle = '#fff'; ctx.font = '14px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(p.name,0,-27); ctx.restore();
    }
  }
}
