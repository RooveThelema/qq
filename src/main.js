import { World } from './game/World.js';
import { MAPS, HEROES, WEAPONS, UPGRADES, formatTime, xpRequired, RUN_MODES, INTERACTABLES, EVOLUTIONS, MAX_PLAYERS } from './game/catalog.js';
import { Renderer } from './ui/Renderer.js';
import { NetworkClient } from './ui/NetworkClient.js';

function bootstrap() {
  if (window.__BLINOV_BOOTED__) return;
  window.__BLINOV_BOOTED__ = true;
  const dom = new Map();
  const $ = selector => { let node = dom.get(selector); if (!node?.isConnected) { node = document.querySelector(selector); if (node) dom.set(selector, node); } return node; };
  const safe = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const read = (key, fallback) => { try { return localStorage.getItem(key) || fallback; } catch { return fallback; } };
  const save = (key, value) => { try { localStorage.setItem(key, value); } catch { /* Storage is optional. */ } };
  const avatar = (hero, size = 42) => `<svg class="hero-avatar" width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true"><path d="M12 52v-9c0-8 8-14 20-14s20 6 20 14v9" fill="currentColor" opacity=".26"/><path d="M19 25c0-14 26-14 26 0v11H19Z" fill="currentColor"/><path d="M16 25h32v9H16Z" fill="#14211b"/><path d="M22 27h20v4H22Z" fill="currentColor"/><path d="M22 42v13M42 42v13M25 47h14" stroke="currentColor" stroke-width="3"/>${hero === 'engineer' ? '<circle cx="51" cy="19" r="5" fill="currentColor"/><circle cx="13" cy="19" r="5" fill="currentColor"/>' : hero === 'medic' ? '<path d="M29 43h6v4h4v6h-4v4h-6v-4h-4v-6h4Z" fill="currentColor"/>' : '<path d="m44 40 12 9-4 6-12-9Z" fill="currentColor"/>'}</svg>`;
  let selectedMap = read('frontier_map', 'outpost'); if (!MAPS[selectedMap]) selectedMap = 'outpost';
  let selectedHero = read('frontier_hero', 'ranger'); if (!HEROES[selectedHero]) selectedHero = 'ranger';
  let selectedRun = read('frontier_run', 'expedition'); if (!RUN_MODES[selectedRun]) selectedRun = 'expedition';
  let mode = '', screen = 'menu', world = null, state = null, room = null, localId = '', modalKind = '', connectionStatus = 'idle';
  let upgradeKey = '', upgradePending = false, resultKey = '', lobbyKey = '', lastHud = 0, inputClock = 0, soloClock = 0, lastTime = performance.now();
  let publicUrl = '', lanAddresses = [], toastTimer, connectionTimer, transport = '', sound = read('frontier_sound', 'off') === 'on', audio, lastKills = 0, ping = 0;
  const keys = new Set();
  const stick = { active: false, id: null, x: 0, y: 0, baseX: 0, baseY: 0 };
  let dashPressed = false;
  // Some tunnel welcome pages replace the query string. The fragment survives
  // that redirect, so invitations carry the room in both places.
  const inviteCode = (new URLSearchParams(location.search).get('room') || new URLSearchParams(location.hash.slice(1)).get('room') || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  $('#app').innerHTML = `
    <header class="site-header" id="site-header">
      <a class="brand" href="#" aria-label="Последний рубеж — главное меню"><span class="brand-mark"><i></i><i></i><i></i><i></i></span><span>ПОСЛЕДНИЙ РУБЕЖ<small>CO-OP SURVIVAL / V3.1</small></span></a>
      <nav class="header-actions"><span class="server-status" id="server-status"><i></i>Проверяем связь</span><button class="text-button" id="scores-open">Рекорды</button><button class="icon-button" id="help-open" aria-label="Как играть">?</button><button class="icon-button sound-toggle" aria-label="Включить звук">♪</button></nav>
    </header>
    <main class="menu screen" id="menu-screen">
      <section class="intro"><div class="eyebrow"><span class="tiny-cross">+</span> СИГНАЛ ОБНАРУЖЕН <span class="eyebrow-line"></span> 01 / 03</div><h1>ПОСЛЕДНИЙ<br><span>РУБЕЖ<span class="title-period">.</span></span></h1><p class="intro-copy">Орда приближается.<br>Один — боец. Вместе — последний рубеж.</p><div class="intro-tags"><span><i class="live-dot"></i>1–10 ИГРОКОВ</span><span>АВТОСТРЕЛЬБА</span><span>10 / 20 МИН / ∞</span></div><div class="mission-copy"><span class="mission-number">01</span><p><strong>Двигайся. Прокачивайся. Выживай.</strong><br>Оружие стреляет само. Ты выбираешь маршрут,<br class="desktop-only">улучшения и тех, с кем дойдёшь до конца.</p></div><div class="intro-coordinate">56°50′ N &nbsp; 60°36′ E <span>ЗОНА КАРАНТИНА</span></div></section>
      <section class="setup-panel"><div class="panel-top"><span class="eyebrow">ПОДГОТОВКА К ВЫЛАЗКЕ</span><span class="panel-corner">↗</span></div>
        <label class="field-label" for="nickname"><span>01</span> ПОЗЫВНОЙ</label><input id="nickname" class="input nickname-input" maxlength="20" autocomplete="nickname" placeholder="Как тебя зовут?" value="${safe(read('frontier_name', 'Выживший'))}">
        <div class="field-label"><span>02</span> ТВОЙ БОЕЦ</div><div class="hero-options" id="hero-options">${Object.entries(HEROES).map(([id, h]) => `<button class="hero-card ${selectedHero === id ? 'selected' : ''}" data-hero="${id}" aria-pressed="${selectedHero === id}" style="--hero-color:${h.color}">${avatar(id)}<strong>${h.name}</strong><small>${h.mark} / ${id === 'ranger' ? 'УРОН' : id === 'engineer' ? 'ЗАЩИТА' : id === 'medic' ? 'РЕГЕНЕРАЦИЯ' : id === 'scout' ? 'СКОРОСТЬ' : 'ЛАЗЕР'}</small></button>`).join('')}</div><div class="choice-description" id="hero-description">${HEROES[selectedHero].description}</div>
        <div class="field-label"><span>03</span> МЕСТО ВЫСАДКИ</div><div class="map-options" id="map-options">${Object.values(MAPS).map((m, i) => `<button class="map-card ${selectedMap === m.id ? 'selected' : ''}" data-map="${m.id}" aria-pressed="${selectedMap === m.id}" style="--map-color:${m.color}"><span class="map-art map-art-${m.id}"><i></i><i></i><i></i><i></i><b>0${i + 1}</b></span><strong>${m.name}</strong><small>${m.tag}</small></button>`).join('')}</div><p class="choice-description map-description" id="map-description">${MAPS[selectedMap].description}</p>
        <label class="field-label" for="run-mode"><span>04</span> ДЛИТЕЛЬНОСТЬ ОПЕРАЦИИ</label><select class="input run-select" id="run-mode">${Object.entries(RUN_MODES).map(([id, m]) => `<option value="${id}" ${id === selectedRun ? 'selected' : ''}>${m.name} · ${m.duration ? m.duration / 60 + ' мин' : '∞'}</option>`).join('')}</select><p class="choice-description" id="run-description">${RUN_MODES[selectedRun].description}</p>
        <button class="button primary online-button" id="create-room"><span class="button-icon">↗</span><span>Собрать отряд<small>СОЗДАТЬ КОМНАТУ · ДО 10 ИГРОКОВ</small></span><span class="button-arrow">→</span></button>
        <div class="join-row"><label class="visually-hidden" for="room-code">Код комнаты</label><input class="input code-input" id="room-code" placeholder="КОД КОМНАТЫ" maxlength="6" autocomplete="off" spellcheck="false" value="${safe(inviteCode)}"><button class="button secondary" id="join-room">Войти <span>→</span></button></div>
        <div class="solo-row"><button class="text-button" id="solo-play">Или отправиться одному <span>→</span></button><span>БЕЗ ПОДКЛЮЧЕНИЯ</span></div>
        <div class="invite-note ${inviteCode ? '' : 'hidden'}" id="invite-note">Тебя пригласили в отряд <strong>${safe(inviteCode)}</strong>. Выбери бойца и нажми «Войти».</div>
      </section>
      <footer class="menu-footer"><span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> ДВИЖЕНИЕ <b>·</b> <kbd>SPACE</kbd> РЫВОК</span><span>ОРУЖИЕ СТРЕЛЯЕТ АВТОМАТИЧЕСКИ <i>↗</i></span></footer>
    </main>
    <section class="lobby screen hidden" id="lobby-screen"><div class="lobby-heading"><span class="eyebrow">СВЯЗЬ УСТАНОВЛЕНА / ЛОББИ</span><h2>Вместе до<br><em>последнего.</em></h2><p>Пригласи друзей. Отметьте готовность.<br>Командир даст сигнал к высадке.</p><div class="lobby-map"><span class="live-dot"></span><div><small>МЕСТО ВЫСАДКИ</small><strong id="lobby-map-name"></strong></div></div><button class="text-button" id="lobby-leave">← Покинуть отряд</button></div><div class="lobby-panel"><div class="panel-top"><span class="eyebrow">ТВОЙ ОТРЯД</span><span id="lobby-count">1 / 10</span></div><div class="transport-status" id="transport-status"></div><div id="squad-list"></div><div class="invite-block"><label class="field-label" for="invite-link">ПРИГЛАШЕНИЕ ДЛЯ ДРУГА</label><div class="share-row"><input class="input" readonly id="invite-link" aria-label="Ссылка для друга"><button class="icon-button" id="copy-link" aria-label="Скопировать приглашение">⧉</button></div><div class="room-code-line"><span>КОД КОМНАТЫ</span><button class="room-code-value" id="copy-code" aria-label="Скопировать код комнаты"></button></div><p class="share-hint" id="share-hint"></p></div><button class="button primary" id="lobby-action"></button><p class="lobby-tip" id="lobby-tip"></p></div></section>
    <section class="game-hud hidden" id="game-hud" aria-label="Состояние игры"><div class="xp-track"><div id="xp-fill"></div></div><div class="hud-top"><div class="health-panel"><span class="eyebrow" id="hud-name">ВЫЖИВШИЙ</span><div class="hp-numbers"><span class="health-cross">+</span><strong id="hp-value">100</strong><span id="hp-max">/ 100</span><span class="level-tag" id="hud-level">УР. 1</span></div><div class="health-track"><div id="hp-fill"></div></div><small class="xp-caption" id="xp-caption"></small></div><div class="timer-panel"><small id="timer-objective">ДОЖИТЬ ДО ЭВАКУАЦИИ</small><strong id="hud-time">00:00</strong><span id="hud-duration">/ 20:00</span><p id="hud-mode"></p></div><div class="hud-top-right"><div class="kill-counter"><small>УНИЧТОЖЕНО</small><strong id="hud-kills">0</strong></div><button class="icon-button" id="pause-open" aria-label="Игровое меню">Ⅱ</button></div></div><div class="teammates" id="teammates"></div><div class="boss-bar hidden" id="boss-bar"><span>СТРАЖ РУБЕЖА</span><div><i id="boss-fill"></i></div></div><div class="activity-panel" id="activity-panel"></div><div class="interaction-bar"><button id="interact-button" class="button secondary hidden"></button><button id="mark-button" class="icon-button" aria-label="Метка для отряда (Q)">⌖</button></div><div class="hud-bottom"><div><div class="weapon-label">АРСЕНАЛ <span>АВТООГОНЬ АКТИВЕН</span></div><div class="weapon-slots" id="weapon-slots"></div><div class="skill-slots" id="skill-slots" aria-label="Активные навыки"></div></div><button class="dash-button" id="dash-button" aria-label="Рывок"><span>↟</span><strong id="dash-label">РЫВОК</strong><small>SPACE / SHIFT</small><i id="dash-fill"></i></button></div><div class="dead-notice hidden" id="dead-notice"></div><div class="game-tip" id="game-tip"><span>WASD</span> Двигайся &nbsp;·&nbsp; <span>E</span> Взаимодействие &nbsp;·&nbsp; <span>Q</span> Метка &nbsp;·&nbsp; <span>SPACE</span> Рывок</div></section>
    <div class="joystick hidden" id="joystick"><div></div></div>
    <div class="connection-banner hidden" id="connection-banner" role="status"><i class="live-dot"></i><span id="connection-message">Подключаемся к отряду…</span><button class="text-button hidden" id="connection-retry">Повторить</button><button class="text-button" id="connection-leave">В меню</button></div>
    <div class="modal-backdrop hidden" id="modal-backdrop"><section class="modal" id="modal" role="dialog" aria-modal="true" aria-label="Игровое меню"></section></div>
    <div class="toast hidden" id="toast" role="status"></div>
  `;
  const renderer = new Renderer($('#gameCanvas'));
  renderer.setMap?.(selectedMap);
  renderer.lowQuality = read('frontier_quality', 'auto') === 'low'; renderer.resize();

  function toast(message) { $('#toast').textContent = message; $('#toast').classList.remove('hidden'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.add('hidden'), 6000); }
  function playTone(freq = 420, duration = 0.055, gain = 0.025) {
    if (!sound) return;
    try { audio ||= new (window.AudioContext || window.webkitAudioContext)(); audio.resume(); const oscillator = audio.createOscillator(), volume = audio.createGain(); oscillator.type = 'triangle'; oscillator.frequency.value = freq; volume.gain.setValueAtTime(gain, audio.currentTime); volume.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration); oscillator.connect(volume); volume.connect(audio.destination); oscillator.start(); oscillator.stop(audio.currentTime + duration); } catch { /* Audio is optional. */ }
  }
  function clearInput() { keys.clear(); stick.active = false; stick.x = 0; stick.y = 0; dashPressed = false; $('#joystick').classList.add('hidden'); if (mode === 'online') net.send({ type: 'input', x: 0, y: 0 }); if (world) world.setInput(localId, { x: 0, y: 0 }); }
  function setScreen(next) {
    screen = next;
    $('#menu-screen').classList.toggle('hidden', next !== 'menu'); $('#lobby-screen').classList.toggle('hidden', next !== 'lobby'); $('#game-hud').classList.toggle('hidden', next !== 'playing');
    $('#site-header').classList.toggle('hidden', next === 'playing'); $('#menu-vignette').classList.toggle('hidden', next === 'playing');
    document.body.classList.toggle('in-game', next === 'playing'); clearInput();
  }
  function hideModal() { modalKind = ''; $('#modal-backdrop').classList.add('hidden'); $('#modal').innerHTML = ''; upgradeKey = ''; clearInput(); }
  function showModal(kind, html, wide = false) {
    if (modalKind !== kind) clearInput();
    modalKind = kind; $('#modal').classList.toggle('modal-wide', wide); $('#modal').innerHTML = html; $('#modal-backdrop').classList.remove('hidden');
    $('#modal').querySelector('button:not(:disabled)')?.focus({ preventScroll: true });
  }
  function player() { return state?.players.find(p => p.id === localId); }
  function resetMenu() {
    net.disconnect(); world = null; state = null; room = null; localId = ''; mode = ''; lobbyKey = ''; resultKey = ''; lastKills = 0; connectionStatus = 'idle';
    hideModal(); setScreen('menu'); renderer.setState(null, ''); showConnectionStatus('idle'); transport = ''; renderTransport();
    try { const url = new URL(location.href); url.searchParams.delete('room'); const hash = new URLSearchParams(url.hash.slice(1)); hash.delete('room'); url.hash = hash.toString(); history.replaceState(null, '', url); } catch { /* file:// */ }
  }
  function setConnecting(busy) { $('#create-room').disabled = busy; $('#join-room').disabled = busy; $('#create-room').classList.toggle('loading', busy); }
  function renderTransport() {
    const label = transport === 'http' ? 'Резервное соединение' : transport === 'websocket' ? 'Прямое соединение' : '';
    $('#transport-status').textContent = label ? `${label} · ${transport === 'http' ? 'HTTP' : 'WebSocket'}` : '';
    $('#transport-status').classList.toggle('reserve', transport === 'http');
    if (connectionStatus === 'connected') $('#server-status').innerHTML = `<i></i>${transport === 'http' ? 'На связи · резерв' : 'Отряд на связи'}`;
  }
  function showConnectionStatus(status) {
    connectionStatus = status; clearTimeout(connectionTimer);
    const pending = status === 'connecting' || status === 'reconnecting';
    setConnecting(pending && !state);
    const messages = {
      connecting: 'Подключаемся к отряду. Проверяем доступный способ связи…',
      reconnecting: 'Восстанавливаем связь… Твой боец ждёт на сервере.',
      slow: 'Соединение занимает дольше обычного. Можно повторить попытку или вернуться в меню.',
      error: 'Связь с сервером не установлена. Проверь адрес игры и попробуй ещё раз.',
    };
    const visible = Object.hasOwn(messages, status);
    $('#connection-banner').classList.toggle('hidden', !visible);
    $('#connection-message').textContent = messages[status] || '';
    $('#connection-retry').classList.toggle('hidden', !['reconnecting', 'slow', 'error'].includes(status));
    if (pending) connectionTimer = setTimeout(() => showConnectionStatus('slow'), 15000);
    renderTransport();
    if (room?.phase === 'lobby') renderLobby();
  }
  function applyRoom(next) {
    if (!next || !Array.isArray(next.players)) return;
    room = next;
    if (room.phase === 'lobby') {
      if (modalKind === 'result') hideModal();
      if (screen !== 'lobby') setScreen('lobby');
      renderLobby();
    }
  }
  const net = new NetworkClient({
    onWelcome(m) {
      mode = 'online'; renderer.online = true; world = null; localId = m.id; room = m.room; lobbyKey = ''; resultKey = ''; setConnecting(false);
      if (modalKind === 'pause') hideModal();
      try { const url = new URL(location.href); url.searchParams.set('room', room.code); url.hash = `room=${room.code}`; history.replaceState(null, '', url); } catch { /* file:// */ }
      updateState(m.state); renderLobby(); refreshNetwork();
      if (m.resumed) toast('Связь восстановлена. Ты снова в отряде.');
    },
    onRoom(next) { applyRoom(next); },
    onState(next, metadata) { if (mode === 'online') { if (metadata) applyRoom(metadata); updateState(next); } },
    onStatus(status) { if (status === 'idle' && connectionStatus === 'error') return; showConnectionStatus(status); },
    onTransport(name) { transport = name; renderTransport(); if (state) renderHud(); },
    onLatency(value) { ping = value; if (state) renderHud(); },
    onError(message) { setConnecting(false); if (!net.connected) showConnectionStatus('error'); toast(message); },
    onExpired(message) { resetMenu(); toast(message); },
  });

  async function refreshNetwork() {
    if (location.protocol === 'file:') { $('#server-status').innerHTML = '<i class="offline-dot"></i>Одиночный режим'; return; }
    try {
      const response = await fetch('/api/network', { signal: AbortSignal.timeout(4000) });
      if (!response.ok) throw new Error('offline');
      const data = await response.json(); publicUrl = /^https?:\/\//.test(data.publicUrl || '') ? data.publicUrl : ''; lanAddresses = data.addresses || [];
      if (connectionStatus === 'connected') renderTransport(); else $('#server-status').innerHTML = '<i></i>Сервер на связи';
      if (room) updateShareLink();
    } catch { if (connectionStatus === 'connected') renderTransport(); else $('#server-status').innerHTML = '<i class="offline-dot"></i>Одиночный режим'; }
  }
  function shareUrl() {
    const isLocal = ['localhost', '127.0.0.1', '0.0.0.0', '[::1]'].includes(location.hostname);
    const base = isLocal && publicUrl ? publicUrl : location.href;
    try { const url = new URL(base); url.search = ''; url.searchParams.set('room', room?.code || ''); url.hash = `room=${room?.code || ''}`; return url.href; } catch { return ''; }
  }
  function updateShareLink() {
    if (!room) return;
    const link = shareUrl(); if ($('#invite-link').value !== link) $('#invite-link').value = link; $('#copy-code').textContent = room.code;
    const isLocal = ['localhost', '127.0.0.1', '0.0.0.0', '[::1]'].includes(location.hostname);
    $('#share-hint').textContent = isLocal && !publicUrl ? 'Для друга через интернет: запусти npm run share. Публичная ссылка появится здесь автоматически.' : 'Отправь ссылку другу. Он выберет бойца и войдёт в твой отряд.';
  }
  async function copyText(text, input) {
    try { await navigator.clipboard.writeText(text); toast('Скопировано — отправь другу!'); } catch {
      toast('Скопируй выделенный текст: Ctrl+C или удержание на телефоне.');
      clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.add('hidden'), 20000);
      let field = input?.value === text ? input : null;
      if (!field) { field = document.createElement('input'); field.className = 'input clipboard-input'; field.readOnly = true; field.value = text; field.setAttribute('aria-label', 'Текст для копирования'); $('#toast').appendChild(field); }
      field.focus(); field.select(); field.setSelectionRange(0, text.length);
    }
  }
  function renderLobby() {
    if (!room || screen === 'playing' && state?.status !== 'lobby') return;
    const hash = JSON.stringify(room) + localId + connectionStatus;
    if (hash === lobbyKey) return;
    lobbyKey = hash; if (screen !== 'lobby') setScreen('lobby');
    $('#lobby-map-name').textContent = `${RUN_MODES[room.runMode || 'classic'].name} · ${MAPS[room.mapId]?.name}` || room.mapId;
    $('#lobby-count').textContent = `${room.players.length} / ${MAX_PLAYERS}`;
    $('#squad-list').innerHTML = Array.from({ length: MAX_PLAYERS }, (_, i) => {
      const p = room.players[i];
      if (!p) return `<div class="squad-row empty"><span class="empty-avatar">+</span><div><strong>Место для друга</strong><small>ОЖИДАНИЕ ПОДКЛЮЧЕНИЯ</small></div><span class="slot-number">0${i + 1}</span></div>`;
      const h = HEROES[p.hero] || HEROES.ranger;
      return `<div class="squad-row" style="--hero-color:${h.color}">${avatar(p.hero, 48)}<div><strong>${safe(p.name)} ${p.id === localId ? '<span class="you-tag">ТЫ</span>' : ''}</strong><small>${safe(h.name)} ${p.id === room.owner ? ' / КОМАНДИР' : ''}</small></div><span class="ready-status ${p.connected && (p.ready || p.id === room.owner) ? 'is-ready' : ''}">${!p.connected ? 'НЕТ СВЯЗИ' : p.ready || p.id === room.owner ? '✓ ГОТОВ' : 'НЕ ГОТОВ'}</span></div>`;
    }).join('');
    const owner = room.owner === localId, me = room.players.find(p => p.id === localId), allReady = room.players.every(p => p.connected && (p.ready || p.id === room.owner));
    const action = $('#lobby-action'); action.disabled = connectionStatus !== 'connected' || (owner && !allReady); action.innerHTML = owner ? `Начать вылазку <span class="button-arrow">→</span>` : `${me?.ready ? '✓ Я готов · отменить' : 'Я готов к высадке'} <span class="button-arrow">→</span>`;
    $('#lobby-tip').textContent = owner ? allReady ? 'Отряд готов. Можно начинать — или пригласить ещё друзей.' : 'Ожидаем, пока каждый боец отметит готовность.' : me?.ready ? 'Ожидаем сигнала командира.' : 'Нажми «Я готов», когда будешь готов начать.';
    updateShareLink(); renderer.setMap?.(room.mapId);
  }
  function startSolo() {
    if (mode === 'online') net.disconnect();
    world = new World(selectedMap, Date.now(), selectedRun); localId = 'solo'; soloClock = 0; world.addPlayer(localId, nickname(), selectedHero); world.start(); mode = 'solo'; renderer.online = false; room = null; resultKey = ''; lastKills = 0;
    hideModal(); setScreen('playing'); updateState(world.snapshot()); playTone(660, 0.15);
  }
  function nickname() { const name = $('#nickname').value.trim().slice(0, 20) || 'Выживший'; save('frontier_name', name); return name; }
  function updateState(next) {
    state = next; renderer.setState(state, localId);
    if (state.status === 'lobby') {
      if (mode === 'online' && room?.phase === 'lobby') {
        const previous = new Map(room.players.map(p => [p.id, p]));
        const roster = state.players.map(p => ({ ...previous.get(p.id), id: p.id, name: p.name, hero: p.hero, connected: p.connected !== false, ready: previous.get(p.id)?.ready || false }));
        applyRoom({ ...room, mapId: state.mapId, players: roster });
      }
      if (screen !== 'lobby') setScreen('lobby');
      return;
    }
    if (screen !== 'playing') { setScreen('playing'); hideModal(); }
    renderHud();
    if (state.kills > lastKills) playTone(200 + Math.min(500, state.kills % 8 * 50));
    lastKills = state.kills;
    if (state.status === 'gameover' || state.status === 'victory') { showResult(); return; }
    const p = player();
    if (p?.options.length && !p.dead && (!modalKind || modalKind === 'upgrade')) renderUpgrades(p);
    else if (modalKind === 'upgrade') hideModal();
  }
  function renderHud() {
    const p = player(); if (!p || !state) return;
    $('#hud-name').textContent = p.name; $('#hp-value').textContent = Math.ceil(p.hp); $('#hp-max').textContent = `/ ${p.maxHp}`;
    $('#hp-fill').style.width = `${Math.max(0, p.hp / p.maxHp * 100)}%`; $('#hp-fill').classList.toggle('low', p.hp < p.maxHp * .3);
    $('#hud-level').textContent = `УР. ${p.level}`; $('#xp-fill').style.width = `${p.xp / xpRequired(p.level) * 100}%`; $('#xp-caption').textContent = `${p.xp} / ${xpRequired(p.level)} XP`;
    $('#timer-objective').textContent = !state.duration ? 'БЕСКОНЕЧНАЯ НОЧЬ' : state.time >= state.duration ? 'УНИЧТОЖЬТЕ СТРАЖА' : 'ДОЖИТЬ ДО ЭВАКУАЦИИ';
    $('#hud-duration').textContent = state.duration ? `/ ${formatTime(state.duration)}` : '/ ∞';
    const event = state.event;
    const names = { relay: 'Ретранслятор · удерживайте зону', hunt: 'Заказ · уничтожайте орду', supply: 'Припасы · откройте тайник' };
    const activity = `${event ? `<strong>${names[event.kind]}</strong><span>${Math.floor(event.progress)} / ${event.goal} · осталось ${formatTime(Math.max(0, event.endsAt - state.time))}</span><div class="activity-track"><i style="width:${Math.min(100, event.progress / event.goal * 100)}%"></i></div>${event.kind !== 'hunt' ? `<small>До цели ${Math.round(Math.hypot(p.x - event.x, p.y - event.y) / 40)} м · следуйте жёлтой метке</small>` : ''}` : `<strong>Исследуйте арену</strong><span>Заданий выполнено: ${state.completed || 0} · тайники дают улучшения</span>`}${state.notice ? `<p>${safe(state.notice)}</p>` : ''}`;
    if ($('#activity-panel').innerHTML !== activity) $('#activity-panel').innerHTML = activity;
    const node = (state.objects || []).filter(n => !n.used && n.cooldown <= 0 && Math.hypot(n.x - p.x, n.y - p.y) < 100).sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0];
    $('#interact-button').classList.toggle('hidden', !node || p.dead);
    if (node) $('#interact-button').textContent = `E · ${INTERACTABLES[node.kind].action}`;
    $('#mark-button').classList.toggle('hidden', mode !== 'online');
    $('#hud-time').textContent = formatTime(state.time); $('#hud-mode').textContent = mode === 'online' ? `ОТРЯД ${room?.code || ''} · ${ping} MS${transport === 'http' ? ' · РЕЗЕРВ' : ''}` : `${MAPS[state.mapId].name} · СОЛО`;
    $('#hud-kills').textContent = state.kills;
    const teammatesHtml = state.players.filter(other => other.id !== localId).map(other => `<div class="teammate ${other.dead ? 'is-down' : ''}"><span class="teammate-dot" style="background:${other.color}"></span><div><strong>${safe(other.name)}</strong><small>${!other.connected ? 'ВОССТАНОВЛЕНИЕ СВЯЗИ' : other.dead ? `НУЖНА ПОМОЩЬ · ${Math.floor(other.revive / 3 * 100)}%` : `${Math.ceil(other.hp)} / ${other.maxHp} HP · УР. ${other.level}`}</small><div class="teammate-hp"><i style="width:${other.hp / other.maxHp * 100}%;background:${other.color}"></i></div></div></div>`).join('');
    if ($('#teammates').innerHTML !== teammatesHtml) $('#teammates').innerHTML = teammatesHtml;
    const weaponsHtml = Object.entries(p.weapons).map(([id, level]) => `<div class="weapon-slot" title="${safe(p.evolved?.[id] ? EVOLUTIONS[id].name : WEAPONS[id]?.name)} · уровень ${level}" style="--weapon-color:${WEAPONS[id]?.color || p.color}"><span>${p.evolved?.[id] ? '✦' : WEAPONS[id]?.icon || '✦'}</span><small>УР. ${level}</small></div>`).join('');
    if ($('#weapon-slots').innerHTML !== weaponsHtml) $('#weapon-slots').innerHTML = weaponsHtml;
    const skillsHtml = Object.entries(p.upgrades).map(([id, level]) => { const u = UPGRADES.find(u => u.id === id); return `<span class="skill-chip" title="${safe(u?.name)}: ${safe(u?.description)}">${u?.icon || '✦'} ${safe(u?.name)} <b>${level}</b></span>`; }).join('');
    if ($('#skill-slots').innerHTML !== skillsHtml) $('#skill-slots').innerHTML = skillsHtml;
    $('#dash-label').textContent = p.dash > 0 ? `${p.dash.toFixed(1)} c` : 'РЫВОК'; $('#dash-button').classList.toggle('cooldown', p.dash > 0); $('#dash-fill').style.width = `${Math.max(0, 1 - p.dash / (4 / (1 + (p.upgrades.dash || 0) * .15))) * 100}%`;
    $('#dead-notice').classList.toggle('hidden', !p.dead);
    if (p.dead) $('#dead-notice').innerHTML = `<strong>БОЕЦ РАНЕН</strong><span>${mode === 'online' ? 'Союзник может поднять тебя: достаточно постоять рядом 3 секунды.' : 'Забег завершён.'}</span><div><i style="width:${p.revive / 3 * 100}%"></i></div>`;
    const bosses = state.enemies.filter(e => e.type === 'boss');
    $('#boss-bar').classList.toggle('hidden', bosses.length === 0);
    if (bosses.length) $('#boss-fill').style.width = `${bosses.reduce((s, b) => s + b.hp, 0) / bosses.reduce((s, b) => s + b.maxHp, 0) * 100}%`;
    $('#game-tip').classList.toggle('hidden', state.time > 22 || p.dead || Object.keys(p.weapons).length > 4);
  }
  function renderUpgrades(p) {
    const signature = `${p.level}:${p.pending}:${p.options.join(',')}`;
    if (upgradeKey === signature && modalKind === 'upgrade') return;
    upgradeKey = signature; upgradePending = false;
    playTone(880, 0.22, .04);
    showModal('upgrade', `<div class="modal-kicker">НОВЫЙ УРОВЕНЬ / ${p.level}</div><h2>Стань сильнее<span class="orange">.</span></h2><p class="modal-copy">Выбери одно улучшение. Оружие и навыки без лимита слотов и уровней.${p.pending > 1 ? ` Осталось выбрать: ${p.pending}.` : ''}<br>${mode === 'online' ? 'Отряд продолжает бой. Автоогонь остаётся активным.' : 'Время остановлено — выбери свой следующий шаг.'}</p><div class="upgrade-options">${p.options.map((id, i) => {
      const u = UPGRADES.find(item => item.id === id) || { id: 'heal', name: 'Полное восстановление', icon: '+', description: 'Восстановить всё здоровье', color: '#8dd3bc' };
      const current = u.type === 'weapon' ? p.weapons[id] || 0 : p.upgrades[id] || 0;
      return `<button class="upgrade-card" data-upgrade="${safe(id)}" style="--upgrade-color:${u.color}"><div><span class="upgrade-icon">${u.icon}</span><span class="upgrade-type">${u.type === 'weapon' ? current ? 'УСИЛЕНИЕ ОРУЖИЯ' : 'НОВОЕ ОРУЖИЕ' : 'УЛУЧШЕНИЕ'}</span></div><h3>${u.name}</h3><p>${u.description}${u.type === 'weapon' ? `<br><small>Эволюция: оружие V + ${UPGRADES.find(item => item.id === EVOLUTIONS[id]?.passive)?.name} III</small>` : ''}</p><footer><span>${current ? `УР. ${current} → ${current + 1}` : 'ПОЛУЧИТЬ'} · ∞</span><kbd>${i + 1}</kbd></footer></button>`;
    }).join('')}</div>`, true);
  }
  function chooseUpgrade(option) {
    if (upgradePending) return;
    upgradePending = true; clearInput();
    $('#modal').querySelectorAll('[data-upgrade]').forEach(button => { button.disabled = true; });
    if (mode === 'solo') { world.choose(localId, option); upgradeKey = ''; updateState(world.snapshot()); }
    else net.send({ type: 'upgrade', option });
  }
  function showResult() {
    const hash = `${state.status}:${Math.floor(state.time)}:${room?.owner || ''}`;
    if (resultKey === hash && modalKind === 'result') return;
    resultKey = hash;
    const won = state.status === 'victory';
    showModal('result', `<div class="modal-kicker">${won ? 'СИГНАЛ ПРИНЯТ / ЭВАКУАЦИЯ' : 'СВЯЗЬ ПРЕРВАНА / КОНЕЦ ЗАБЕГА'}</div><h2>${won ? 'Рубеж удержан' : 'До последнего'}<span class="orange">.</span></h2><p class="modal-copy">${won ? 'Вы пережили орду и остановили Стража. Отряд возвращается домой.' : 'Каждый забег — новая сборка. Перегруппируйся и попробуй снова.'}</p><div class="result-numbers"><div><strong>${formatTime(state.time)}</strong><small>ВРЕМЯ ВЫЖИВАНИЯ</small></div><div><strong>${state.kills}</strong><small>УНИЧТОЖЕНО</small></div><div><strong>${Math.max(...state.players.map(p => p.level))}</strong><small>МАКС. УРОВЕНЬ</small></div></div><div class="result-players">${state.players.map(p => `<div><strong style="color:${p.color}">${safe(p.name)}</strong><span>${p.kills} устранений · ур. ${p.level}</span></div>`).join('')}</div><button class="button primary" id="result-restart" ${mode === 'online' && room?.owner !== localId ? 'disabled' : ''}>${mode === 'online' ? room?.owner === localId ? 'Вернуться в лобби' : 'Ожидаем командира отряда' : 'Ещё один забег'} <span>→</span></button><button class="text-button modal-back" id="result-leave">Вернуться в главное меню</button>`);
    if (mode === 'solo') {
      let best; try { best = JSON.parse(read('frontier_best', 'null')); } catch { best = null; }
      if (!best || state.time > best.time) save('frontier_best', JSON.stringify({ time: Math.floor(state.time), kills: state.kills, level: player()?.level || 1, map: state.mapId }));
    }
  }
  function showHelp() {
    showModal('help', `<button class="modal-close icon-button" data-close aria-label="Закрыть">×</button><div class="modal-kicker">ПОЛЕВОЙ СПРАВОЧНИК</div><h2>Выживаем вместе<span class="orange">.</span></h2><div class="help-section"><h3>Оружие делает своё дело. Ты — своё.</h3><p>Перемещайся, обходи орду и собирай кристаллы опыта. На новом уровне выбирай оружие или улучшение. Опыт общий для отряда, а сборка у каждого своя. Выбирай вылазку на 10 минут, экспедицию на 20 минут или бесконечную ночь. В конечных режимах нужно также победить всех Стражей.</p><div class="help-keys"><span><kbd>WASD</kbd> / <kbd>↑←↓→</kbd> движение</span><span><kbd>SPACE</kbd> / <kbd>SHIFT</kbd> рывок</span><span><kbd>E</kbd> взаимодействие</span><span><kbd>Q</kbd> метка отряду</span><span><kbd>ESC</kbd> меню</span><span><kbd>1</kbd><kbd>2</kbd><kbd>3</kbd> выбор улучшения</span></div><p>На телефоне: веди пальцем по арене для движения, нажимай «Рывок». Раненого союзника можно поднять, постояв рядом 3 секунды.</p></div><div class="help-section"><h3>Каждая вылазка — новые решения</h3><p>Тайники дают улучшение каждому. Медстанции лечат отряд, турели прикрывают 25 секунд, обелиски вызывают элиту с наградой. Нажми E рядом с объектом или кнопку на экране. Выполняй задания: удержание зоны, заказ на орду и поиск припасов. Жёлтая метка показывает цель. Красные круги предупреждают об ударах — они опасны и для врагов.</p><p>Оружие V уровня эволюционирует при нужном пассивном улучшении III уровня. Рецепт указан на карточке оружия. Все 25 видов оружия и навыков можно собрать одновременно и улучшать без ограничения уровней. Для каждого следующего уровня героя требуется больше опыта. Носители распадаются на ловчих, регенераторы лечат орду, золотая обводка обозначает элиту.</p></div><div class="help-section"><h3>С другом через интернет — без VPS</h3><ol><li>В папке проекта запусти <code>npm run share</code>.</li><li>Открой публичную HTTPS-ссылку из терминала.</li><li>Нажми «Собрать отряд» и отправь другу приглашение из лобби.</li><li>Друг выбирает бойца и входит. Все отмечают готовность, командир запускает забег.</li></ol><p class="help-note">Оставь компьютер, игру и туннель включёнными. При новом запуске туннеля ссылка может измениться. Если сеть блокирует адрес туннеля, попробуй другой доступный туннель с поддержкой WebSocket.</p></div><div class="help-section"><h3>В одной Wi-Fi-сети</h3><p>Достаточно <code>npm start</code>. Друг открывает адрес твоего компьютера и входит по коду комнаты.</p><div class="lan-links">${lanAddresses.length ? lanAddresses.map(address => `<code>${safe(address)}</code>`).join('') : '<span>Адреса локальной сети появятся после запуска сервера.</span>'}</div></div><button class="button secondary" data-close>Понятно <span>→</span></button>`);
  }
  async function showScores() {
    showModal('scores', '<button class="modal-close icon-button" data-close aria-label="Закрыть">×</button><div class="modal-kicker">ЖУРНАЛ ОПЕРАЦИЙ</div><h2>Лучшие вылазки<span class="orange">.</span></h2><p class="modal-copy">Загружаем записи сервера…</p>');
    let runs = [];
    try { const response = await fetch('/api/leaderboard', { signal: AbortSignal.timeout(4000) }); if (response.ok) runs = (await response.json()).runs || []; } catch { /* Solo score still available. */ }
    if (modalKind !== 'scores') return;
    let best; try { best = JSON.parse(read('frontier_best', 'null')); } catch { best = null; }
    showModal('scores', `<button class="modal-close icon-button" data-close aria-label="Закрыть">×</button><div class="modal-kicker">ЖУРНАЛ ОПЕРАЦИЙ</div><h2>Лучшие вылазки<span class="orange">.</span></h2><p class="modal-copy">Результаты завершённых сетевых забегов на этом сервере.</p><div class="score-list">${runs.length ? runs.slice(0, 10).map((r, i) => `<div class="score-row"><b>${String(i + 1).padStart(2, '0')}</b><div><strong>${safe((r.players || []).map(p => p.name).join(', '))}</strong><small>${safe(MAPS[r.map]?.name || r.map)} · ${safe(RUN_MODES[r.runMode || 'classic']?.name || '')} ${r.victory ? ' / ПОБЕДА' : ''}</small></div><span>${formatTime(r.time)}<small>${r.kills} устранений</small></span></div>`).join('') : '<p class="empty-scores">Пока здесь тихо. Заверши первый сетевой забег — и твой отряд откроет журнал.</p>'}</div>${best ? `<div class="personal-best"><small>ТВОЙ ЛУЧШИЙ ОДИНОЧНЫЙ ЗАБЕГ</small><strong>${formatTime(best.time)} <span>· ${best.kills} устранений · ур. ${best.level}</span></strong></div>` : ''}<button class="button secondary" data-close>Назад <span>→</span></button>`);
  }
  function showPause() {
    if (screen !== 'playing' || ['result', 'upgrade'].includes(modalKind)) return;
    showModal('pause', `<div class="modal-kicker">${mode === 'online' ? 'ОТРЯД НА СВЯЗИ' : 'ПАУЗА'}</div><h2>Перевести дух<span class="orange">.</span></h2><p class="modal-copy">${mode === 'online' ? 'Сетевая игра продолжается. Твоё оружие стреляет автоматически, пока ты в меню.' : 'Время остановлено. Возвращайся, когда будешь готов.'}</p><button class="button primary" data-close>Продолжить <span>→</span></button><button class="button secondary" id="pause-sound">Звук: ${sound ? 'включён' : 'выключен'} <span>♪</span></button><button class="button secondary" id="pause-quality">Графика: ${renderer.lowQuality ? 'экономная' : 'обычная'}</button><button class="text-button modal-back" id="pause-leave">Покинуть забег</button>`);
  }
  function toggleSound() { sound = !sound; save('frontier_sound', sound ? 'on' : 'off'); $('.sound-toggle').classList.toggle('muted', !sound); $('.sound-toggle').setAttribute('aria-label', sound ? 'Выключить звук' : 'Включить звук'); if (sound) playTone(600, .12); if (modalKind === 'pause') $('#pause-sound').innerHTML = `Звук: ${sound ? 'включён' : 'выключен'} <span>♪</span>`; }

  $('#run-mode').onchange = event => { selectedRun = event.target.value; save('frontier_run', selectedRun); $('#run-description').textContent = RUN_MODES[selectedRun].description; };
  function interact() { if (screen !== 'playing' || modalKind || player()?.dead) return; if (mode === 'solo') { world.interact(localId); updateState(world.snapshot()); } else net.send({ type: 'interact' }); }
  function mark() { if (screen === 'playing' && !modalKind && mode === 'online') net.send({ type: 'ping-mark' }); }
  $('#interact-button').onclick = interact; $('#mark-button').onclick = mark;
  $('#hero-options').addEventListener('click', event => { const button = event.target.closest('[data-hero]'); if (!button) return; selectedHero = button.dataset.hero; save('frontier_hero', selectedHero); $('#hero-options').querySelectorAll('button').forEach(b => { b.classList.toggle('selected', b === button); b.setAttribute('aria-pressed', String(b === button)); }); $('#hero-description').textContent = HEROES[selectedHero].description; playTone(380, .05); });
  $('#map-options').addEventListener('click', event => { const button = event.target.closest('[data-map]'); if (!button) return; selectedMap = button.dataset.map; save('frontier_map', selectedMap); $('#map-options').querySelectorAll('button').forEach(b => { b.classList.toggle('selected', b === button); b.setAttribute('aria-pressed', String(b === button)); }); $('#map-description').textContent = MAPS[selectedMap].description; renderer.setMap?.(selectedMap); playTone(380, .05); });
  $('#create-room').onclick = () => { clearInput(); net.connect({ type: 'create', name: nickname(), hero: selectedHero, mapId: selectedMap, runMode: selectedRun }); };
  $('#join-room').onclick = () => { const code = $('#room-code').value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6); if (code.length !== 6) return toast('Введи код комнаты из шести символов. Друг найдёт его в лобби.'); clearInput(); net.connect({ type: 'join', code, name: nickname(), hero: selectedHero }); };
  $('#room-code').addEventListener('input', event => { event.target.value = event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6); });
  $('#room-code').addEventListener('keydown', event => { if (event.key === 'Enter') $('#join-room').click(); });
  $('#solo-play').onclick = startSolo; $('#lobby-leave').onclick = resetMenu; $('#connection-leave').onclick = resetMenu;
  $('#connection-retry').onclick = () => { showConnectionStatus('connecting'); net.retry(); };
  $('#lobby-action').onclick = () => { const me = room?.players.find(p => p.id === localId); net.send(room?.owner === localId ? { type: 'start' } : { type: 'ready', ready: !me?.ready }); };
  $('#copy-link').onclick = () => { updateShareLink(); copyText($('#invite-link').value, $('#invite-link')); };
  $('#copy-code').onclick = () => copyText(room?.code || '', $('#invite-link'));
  $('#invite-link').onclick = event => event.target.select();
  $('#help-open').onclick = showHelp; $('#scores-open').onclick = showScores; $('#pause-open').onclick = showPause;
  $('.sound-toggle').onclick = toggleSound; $('.sound-toggle').classList.toggle('muted', !sound);
  $('.brand').onclick = event => { event.preventDefault(); if (screen === 'menu') return; if (screen === 'playing') showPause(); else resetMenu(); };
  $('#modal-backdrop').addEventListener('click', event => {
    const target = event.target.closest('button'); if (!target) return;
    if (target.hasAttribute('data-close')) { hideModal(); if (state) updateState(state); }
    if (target.dataset.upgrade) chooseUpgrade(target.dataset.upgrade);
    if (target.id === 'result-restart') { if (mode === 'solo') startSolo(); else net.send({ type: 'restart' }); }
    if (['result-leave', 'pause-leave'].includes(target.id)) resetMenu();
    if (target.id === 'pause-sound') toggleSound();
    if (target.id === 'pause-quality') { renderer.lowQuality = !renderer.lowQuality; renderer.resize(); save('frontier_quality', renderer.lowQuality ? 'low' : 'auto'); target.textContent = `Графика: ${renderer.lowQuality ? 'экономная' : 'обычная'}`; }
  });
  $('#dash-button').addEventListener('pointerdown', event => { event.preventDefault(); dashPressed = true; playTone(320, .08); });
  window.addEventListener('keydown', event => {
    if (modalKind && event.code === 'Tab') {
      const buttons = [...$('#modal').querySelectorAll('button:not(:disabled),input:not(:disabled),a[href]')];
      if (buttons.length) {
        const current = buttons.indexOf(document.activeElement);
        if (event.shiftKey && current <= 0) { event.preventDefault(); buttons[buttons.length - 1].focus(); }
        else if (!event.shiftKey && (current === -1 || current === buttons.length - 1)) { event.preventDefault(); buttons[0].focus(); }
      }
      return;
    }
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target?.tagName)) return;
    if (event.code === 'Escape') { event.preventDefault(); if (['help', 'scores', 'pause'].includes(modalKind)) { hideModal(); if (state) updateState(state); } else showPause(); return; }
    if (event.code === 'KeyM' && !event.repeat) { toggleSound(); return; }
    if (modalKind === 'upgrade' && /^Digit[123]$/.test(event.code)) { const p = player(); if (p?.options[Number(event.code.slice(-1)) - 1]) chooseUpgrade(p.options[Number(event.code.slice(-1)) - 1]); return; }
    if (screen !== 'playing' || modalKind) return;
    if (event.code === 'KeyE' && !event.repeat) { event.preventDefault(); interact(); }
    if (event.code === 'KeyQ' && !event.repeat) { event.preventDefault(); mark(); }
    if (['Space', 'ShiftLeft', 'ShiftRight'].includes(event.code)) { event.preventDefault(); if (!event.repeat) dashPressed = true; }
    if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight'].includes(event.code)) { event.preventDefault(); keys.add(event.code); }
  });
  window.addEventListener('keyup', event => keys.delete(event.code));
  window.addEventListener('blur', clearInput);
  document.addEventListener('visibilitychange', () => { clearInput(); if (document.hidden && mode === 'solo' && screen === 'playing' && !modalKind) showPause(); });
  const canvas = $('#gameCanvas');
  canvas.addEventListener('pointerdown', event => {
    if (event.pointerType === 'mouse' || screen !== 'playing' || modalKind || player()?.dead) return;
    event.preventDefault(); stick.active = true; stick.id = event.pointerId; stick.baseX = event.clientX; stick.baseY = event.clientY; stick.x = 0; stick.y = 0;
    canvas.setPointerCapture(event.pointerId); const joystick = $('#joystick'); joystick.classList.remove('hidden'); joystick.style.left = `${event.clientX}px`; joystick.style.top = `${event.clientY}px`; joystick.firstElementChild.style.transform = 'translate(-50%, -50%)';
  });
  canvas.addEventListener('pointermove', event => { if (!stick.active || event.pointerId !== stick.id) return; const dx = event.clientX - stick.baseX, dy = event.clientY - stick.baseY, length = Math.max(48, Math.hypot(dx, dy)); stick.x = dx / length; stick.y = dy / length; $('#joystick').firstElementChild.style.transform = `translate(calc(-50% + ${stick.x * 42}px), calc(-50% + ${stick.y * 42}px))`; });
  const endStick = event => { if (event.pointerId === stick.id) { stick.active = false; stick.x = 0; stick.y = 0; $('#joystick').classList.add('hidden'); } };
  canvas.addEventListener('pointerup', endStick); canvas.addEventListener('pointercancel', endStick); canvas.addEventListener('contextmenu', event => event.preventDefault());
  function input() {
    if (screen !== 'playing' || modalKind || connectionStatus === 'reconnecting' || player()?.dead) return { x: 0, y: 0, dash: false };
    let x = Number(keys.has('KeyD') || keys.has('ArrowRight')) - Number(keys.has('KeyA') || keys.has('ArrowLeft')) + stick.x;
    let y = Number(keys.has('KeyS') || keys.has('ArrowDown')) - Number(keys.has('KeyW') || keys.has('ArrowUp')) + stick.y;
    const length = Math.max(1, Math.hypot(x, y)); x /= length; y /= length;
    const dash = dashPressed; dashPressed = false;
    return { x, y, dash };
  }
  function frame(now) {
    const dt = Math.min(.05, Math.max(0, (now - lastTime) / 1000)); lastTime = now;
    if (mode === 'solo' && world && screen === 'playing') {
      const paused = !!modalKind || !!player()?.options.length;
      if (!paused && world.status === 'playing') {
        soloClock = Math.min(.1, soloClock + dt);
        if (soloClock >= 1 / 30) {
          world.setInput(localId, input());
          while (soloClock >= 1 / 30) { world.tick(1 / 30); soloClock -= 1 / 30; }
          state = world.snapshot(); renderer.setState(state, localId);
        }
      } else soloClock = 0;
      if (now - lastHud > 100) { lastHud = now; updateState(state || world.snapshot()); }
    }
    if (mode === 'online') { inputClock += dt; if (inputClock > 1 / 30) { inputClock = 0; net.send({ type: 'input', ...input() }); } }
    renderer.render(dt);
    requestAnimationFrame(frame);
  }
  refreshNetwork(); setInterval(() => { if (screen === 'lobby' || screen === 'menu') refreshNetwork(); }, 12000);
  if (net.restore()) connectionStatus = 'reconnecting';
  if (inviteCode) { $('#room-code').focus(); toast(`Приглашение в отряд ${inviteCode}. Выбери бойца и нажми «Войти».`); }
  requestAnimationFrame(frame);
  window.__FRONTIER_READY__ = true;
  window.dispatchEvent(new Event('frontier:ready'));
  // The small public API makes manual browser checks possible without altering gameplay.
  window.frontier = { get state() { return state; }, get mode() { return mode; }, get room() { return room; }, get localId() { return localId; } };
}

try { bootstrap(); } catch (err) { console.error(err); window.dispatchEvent(new CustomEvent('frontier:boot-error', { detail: 'Не удалось запустить игру. Попробуй повторить загрузку.' })); const app = document.getElementById('app'); if (app) app.innerHTML = '<div class="no-script">Не удалось запустить игру. Обнови страницу или запусти npm start.<br><small>' + String(err.message || err).replace(/[<>&]/g, '') + '</small></div>'; }
