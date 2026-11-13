/**
 * main.js - Точка входа в игру Call of Duty: Zombies 2D.
 */
import { Engine } from './core/Engine.js';
import { EventBus } from './core/EventBus.js';
import { Loader } from './core/Loader.js';

import { MapModule } from './modules/map/MapModule.js';
import { PlayerModule } from './modules/player/PlayerModule.js';
import { MysteryBoxModule } from './modules/mystery_box/MysteryBoxModule.js';
import { ZombiesModule } from './modules/zombies/ZombiesModule.js';
import { VisualsModule } from './modules/visuals/VisualsModule.js';
import { HudModule } from './modules/hud/HudModule.js';
import { MemeLudkaModule } from './modules/memes/MemeLudkaModule.js';
import { SaperModule } from './modules/minigames/SaperModule.js';
import { DatabaseModule } from './modules/db/DatabaseModule.js';
import { MultiplayerModule } from './modules/multiplayer/MultiplayerModule.js';

async function bootstrap() {
  if (window.__BLINOV_BOOTED__) return;
  window.__BLINOV_BOOTED__ = true;

  const canvas = document.getElementById('gameCanvas');
  const bus = new EventBus(false);
  const engine = new Engine(canvas, bus);
  const loader = new Loader(engine);

  loader.addStage(
    'Бункер и маршруты',
    'Построение карты Nacht der Untoten и точек спавна...',
    async (eng) => {
      const map = new MapModule();
      eng.registerModule(map);
      await map.init(eng);
    }
  );

  loader.addStage(
    'Боец и арсенал',
    'Подготовка оружия, баллистики и Mystery Box...',
    async (eng) => {
      const player = new PlayerModule();
      eng.registerModule(player);
      await player.init(eng);

      const box = new MysteryBoxModule();
      eng.registerModule(box);
      await box.init(eng);
    }
  );

  loader.addStage(
    'Орда и волны',
    'Инициализация зомби, навигации и бонусов...',
    async (eng) => {
      const zombies = new ZombiesModule();
      eng.registerModule(zombies);
      await zombies.init(eng);
    }
  );

  loader.addStage(
    'Эффекты и звук',
    'Настройка освещения, крови, частиц и синтезатора...',
    async (eng) => {
      const visuals = new VisualsModule();
      eng.registerModule(visuals);
      await visuals.init(eng);
    }
  );

  loader.addStage(
    'Интерфейс и снабжение',
    'Подключение HUD, Лудки 777, Сапёра и базы данных...',
    async (eng) => {
      const hud = new HudModule();
      eng.registerModule(hud);
      await hud.init(eng);

      const memeLudka = new MemeLudkaModule();
      eng.registerModule(memeLudka);
      await memeLudka.init(eng);

      const saper = new SaperModule();
      eng.registerModule(saper);
      await saper.init(eng);

      const database = new DatabaseModule();
      eng.registerModule(database);
      await database.init(eng);
    }
  );

  await loader.run();

  const multiplayer = new MultiplayerModule();
  engine.registerModule(multiplayer);
  multiplayer.init(engine);

  const panel = document.createElement('div');
  panel.className = 'local-admin hidden';
  panel.innerHTML = '<strong>Панель управления</strong><select aria-label="Тип врага"></select><button type="button">Создать врага</button><span></span>';
  const select = panel.querySelector('select');
  for (const [value, label] of Object.entries({walker:'Зомби', runner:'Бегун', crawler:'Ползун', hellhound:'Адская гончая', spitter:'Плевун', bomber:'Камикадзе', shield:'Щитоносец', hazmat:'Мутант', phantom:'Фантом', screamer:'Крикун', brute:'Громила', necromancer:'Некромант', boss:'Босс'})) {
    select.add(new Option(label, value));
  }
  panel.querySelector('button').addEventListener('click', () => {
    const spawned = multiplayer.room && !multiplayer.isHost ? (multiplayer.send({type:'spawn', enemy:select.value}), true) : engine.getModule('zombies')?.spawnAdminZombie(select.value);
    panel.querySelector('span').textContent = spawned ? 'Враг создан' : 'Не удалось создать врага';
  });
  const adminRoom = document.createElement('input');
  adminRoom.placeholder = 'Название комнаты';
  const adminJoin = document.createElement('button');
  adminJoin.textContent = 'Войти в комнату';
  adminJoin.onclick = () => { multiplayer.connect('join', adminRoom.value); };
  panel.prepend(adminRoom, adminJoin);
  const targets = document.createElement('select');
  targets.setAttribute('aria-label', 'Игрок');
  const teleport = document.createElement('button');
  teleport.textContent = 'Перенести игрока ко мне';
  teleport.onclick = () => { const player = engine.getModule('player'); if (targets.value) multiplayer.send({type:'teleport', target:targets.value, x:player.x, y:player.y}); };
  panel.append(targets, teleport);
  setInterval(() => { const selected = targets.value; targets.replaceChildren(new Option('Выберите игрока', '')); for (const p of multiplayer.players) targets.add(new Option(p.name, p.id)); targets.value = selected || ''; }, 1000);
  document.body.appendChild(panel);
  window.addEventListener('keydown', event => {
    if (event.ctrlKey && event.shiftKey && event.code === 'KeyA') {
      event.preventDefault();
      panel.classList.toggle('hidden');
    }
  });

}

function startBootstrap() {
  bootstrap().catch((err) => {
    console.error('Fatal bootstrap error:', err);
    const details = document.getElementById('loading-details');
    if (details) details.textContent = `Ошибка запуска: ${err.message || err}`;
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startBootstrap, { once: true });
} else {
  startBootstrap();
}
