import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';
import { createInterface } from 'node:readline';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LAUNCHER = path.join(ROOT, 'scripts/share.mjs');
const DATA = path.join(ROOT, 'data');
const PUBLIC_FILE = path.join(DATA, 'public-url.json');
const PORT = Number(process.env.PORT || 3000);
const MIN_PROTOCOL = 2;
const localUrl = `http://127.0.0.1:${PORT}`;
const nullFile = process.platform === 'win32' ? 'NUL' : '/dev/null';
const argv = process.argv.slice(2);
const providerIndex = argv.indexOf('--provider');
const selected = argv.find(a => a.startsWith('--provider='))?.split('=')[1] || (providerIndex >= 0 ? argv[providerIndex + 1] : '') || (argv.includes('--cloudflare') ? 'cloudflare' : '') || process.env.TUNNEL_PROVIDER || '';
const provider = selected || 'serveo';
const restarting = argv.includes('--restart');
const providers = {
  serveo: { host: 'anonymous@serveo.net', ports: [443, 22], remote: 80, auth: 'keyboard-interactive', pattern: /https:\/\/[a-z0-9-]+\.(?:serveousercontent\.com|serveo\.net)/i },
  pinggy: { host: 'a@free.pinggy.io', ports: [443], remote: 0, auth: 'password', pattern: /https:\/\/[a-z0-9.-]+\.(?:pinggy-free\.link|pinggy\.link|pinggy\.online)/i },
  localhost: { host: 'nokey@localhost.run', ports: [22, 443], remote: 80, auth: 'none' },
};
let ownServer, tunnel, retry, monitor, consoleInput;
let stopping = false, publicUrl = '', attached = false, changingRoute = false;
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

function readRecord() { try { return JSON.parse(fs.readFileSync(PUBLIC_FILE, 'utf8')); } catch { return null; } }
function live(pid) { try { if (!Number.isSafeInteger(pid) || pid < 2) return false; process.kill(pid, 0); return true; } catch { return false; } }
function ownedScript(pid, expected) {
  // Never signal an arbitrary PID from a stale file: validate command and checkout.
  if (!live(pid) || pid === process.pid) return false;
  try {
    const cwd = fs.realpathSync(`/proc/${pid}/cwd`);
    const args = fs.readFileSync(`/proc/${pid}/cmdline`, 'utf8').split('\0').filter(Boolean);
    return cwd === ROOT && /^(node|nodejs)(\.exe)?$/.test(path.basename(args[0])) && args.some(a => path.resolve(cwd, a) === expected);
  } catch { return false; }
}
function ownedLauncher(pid) { return ownedScript(pid, LAUNCHER); }
function processListensOnPort(pid) {
  try {
    const inodes = new Set();
    for (const file of ['/proc/net/tcp', '/proc/net/tcp6']) {
      for (const line of fs.readFileSync(file, 'utf8').trim().split('\n').slice(1)) {
        const fields = line.trim().split(/\s+/);
        if (fields[3] === '0A' && parseInt(fields[1].split(':').pop(), 16) === PORT) inodes.add(fields[9]);
      }
    }
    return fs.readdirSync(`/proc/${pid}/fd`).some(fd => {
      try { const inode = fs.readlinkSync(`/proc/${pid}/fd/${fd}`).match(/^socket:\[(\d+)\]$/)?.[1]; return inodes.has(inode); } catch { return false; }
    });
  } catch { return false; }
}
async function restartOldBackend() {
  let candidates = [];
  try {
    candidates = fs.readdirSync('/proc').filter(name => /^\d+$/.test(name)).map(Number).filter(pid => ownedScript(pid, path.join(ROOT, 'server.js')) && processListensOnPort(pid));
  } catch { /* Safe automatic replacement requires process ownership evidence. */ }
  if (candidates.length !== 1) throw new Error('Запущен старый сервер. Не удалось безопасно определить его процесс. Закрой прежний npm start / npm run share и запусти npm run share заново.');
  const pid = candidates[0];
  console.log(`[Обновление] Останавливаю старый сервер этого проекта на порту ${PORT}, PID ${pid}…`);
  process.kill(pid, 'SIGTERM');
  for (let i = 0; i < 60 && processListensOnPort(pid); i++) await delay(100);
  if (processListensOnPort(pid)) throw new Error('Старый сервер не освободил порт. Закрой его через Ctrl+C в исходном терминале и повтори npm run share.');
}
function clearPublicUrl() {
  try { if (readRecord()?.pid === process.pid) fs.unlinkSync(PUBLIC_FILE); } catch { /* Nothing to clear. */ }
}
function publishUrl(url, name) {
  if (publicUrl === url || stopping) return;
  publicUrl = url;
  const record = { url, provider: name, pid: process.pid, port: PORT, launcher: LAUNCHER, updatedAt: new Date().toISOString() };
  fs.writeFileSync(PUBLIC_FILE + '.tmp', JSON.stringify(record)); fs.renameSync(PUBLIC_FILE + '.tmp', PUBLIC_FILE);
  console.log(`\n${'═'.repeat(62)}\nИГРА В ИНТЕРНЕТЕ · ${name}\n${url}\n${'═'.repeat(62)}\nОткрой ссылку → создай комнату → отправь приглашение другу.\nОставь этот терминал и компьютер включёнными. Остановка: Ctrl+C.\n`);
  if (name === 'serveo' || name === 'pinggy') console.log('[Браузер] При первом открытии провайдер может показать свою страницу: нажми Continue / Visit Site. Затем откроется игра.');
  if (name === 'pinggy') console.log('[Pinggy] Бесплатная сессия ограничена примерно часом. После переподключения адрес изменится.');
  console.log('[Адрес] При обрыве связи переподключусь и напечатаю новый адрес. Его нужно отправить друзьям заново.');
  void checkPublic(url);
}
async function publicHealth(url, timeout = 8000) {
  const response = await fetch(new URL('/api/health', url), { signal: AbortSignal.timeout(timeout), headers: { 'User-Agent': 'LastFrontier-TunnelCheck/1.0', 'serveo-skip-browser-warning': 'true', 'X-Pinggy-No-Screen': '1' } });
  const data = await response.json();
  return response.ok && data.game === 'last-frontier' && Number(data.protocol) >= MIN_PROTOCOL;
}
async function retireLauncher(record) {
  if (!ownedLauncher(record.pid)) throw new Error('Не могу подтвердить принадлежность процесса проекту. Останови исходный туннель в его терминале через Ctrl+C.');
  console.log(`[Перезапуск] Закрываю прежний ${record.provider}, PID ${record.pid}…`);
  process.kill(record.pid, 'SIGTERM');
  for (let i = 0; i < 60 && live(record.pid); i++) await delay(100);
  if (live(record.pid)) throw new Error('Прежний туннель не завершился. Останови его через Ctrl+C в исходном терминале.');
}
async function restartRoute(name = provider) {
  if (changingRoute || stopping) return;
  changingRoute = true;
  try {
    if (!providers[name] && name !== 'cloudflare') throw new Error('Маршруты: serveo, pinggy, localhost, cloudflare');
    clearInterval(monitor); clearTimeout(retry);
    const current = readRecord();
    if (current && current.pid !== process.pid && live(current.pid)) await retireLauncher(current);
    const previous = tunnel;
    tunnel = null; // Ignore the outgoing child's automatic reconnect callback.
    previous?.kill('SIGTERM');
    clearPublicUrl(); publicUrl = ''; attached = false;
    await ensureServer();
    startAttempt(attemptsFor(name));
  } catch (error) {
    console.error('[Перезапуск]', error.message);
    const current = readRecord();
    if (current && live(current.pid) && current.pid !== process.pid) await watchExisting(current);
  } finally { changingRoute = false; }
}
function installConsole() {
  if (consoleInput || !process.stdin.isTTY) return;
  consoleInput = createInterface({ input: process.stdin, terminal: false });
  consoleInput.on('line', line => {
    const command = line.trim().toLowerCase();
    if (!command) return;
    if (/^(r|restart|--restart|перезапуск)$/.test(command)) {
      void restartRoute(readRecord()?.provider || provider);
    } else if (/^--provider=(serveo|pinggy|localhost|cloudflare)$/.test(command)) {
      void restartRoute(command.split('=')[1]);
    } else if (/^(url|ссылка)$/.test(command)) {
      console.log('[Актуальная ссылка]', readRecord()?.url || 'Туннель переподключается, адрес скоро появится.');
    } else {
      console.log('В этом окне: r или --restart + Enter — перезапуск; url — актуальная ссылка; --provider=pinggy — смена маршрута. Команды npm вводятся после Ctrl+C в обычной строке терминала.');
    }
  });
  console.log('[Управление] Введи r или --restart и нажми Enter для перезапуска; url — показать свежую ссылку.');
}
async function checkPublic(url) {
  for (let i = 0; i < 4 && !stopping && publicUrl === url; i++) {
    try { if (await publicHealth(url)) { console.log('[Проверка] Публичный HTTPS отвечает. Для проверки совместного боя: npm run test:online -- ' + url); return; } } catch { /* DNS may need a moment. */ }
    await delay(1500);
  }
  if (!stopping && publicUrl === url) console.log('[Проверка] Публичный адрес не отвечает из этой сети. Смена маршрута: npm run share -- --provider=pinggy --restart');
}
async function health() {
  let response;
  try { response = await fetch(localUrl + '/api/health', { signal: AbortSignal.timeout(1200) }); } catch { return false; }
  let data; try { data = await response.json(); } catch { /* Occupied by another service. */ }
  if (!response.ok || data?.game !== 'last-frontier') throw new Error(`Порт ${PORT} занят другой программой. Выбери другой: PORT=3001 npm run share`);
  if (!(Number(data.protocol) >= MIN_PROTOCOL)) {
    const error = new Error(`Запущен старый сервер игры (протокол ${data.protocol || 1}). Закрой прежний npm start / npm run share и запусти npm run share заново. Для безопасного автоматического обновления: npm run share -- --restart`);
    error.code = 'OUTDATED_SERVER'; throw error;
  }
  return true;
}
async function ensureServer() {
  try { if (await health()) { console.log(`[Сервер] Игра уже работает, протокол ${MIN_PROTOCOL}+: ${localUrl}`); return; } }
  catch (error) { if (error.code === 'OUTDATED_SERVER' && restarting) await restartOldBackend(); else throw error; }
  console.log('[Сервер] Собираю игру и запускаю локальный сервер…');
  const build = spawnSync(process.execPath, ['scripts/build-classic.mjs'], { cwd: ROOT, stdio: 'inherit' });
  if (build.status !== 0) throw new Error('Не удалось собрать игру');
  ownServer = spawn(process.execPath, ['server.js'], { cwd: ROOT, env: { ...process.env, PORT: String(PORT) }, stdio: ['ignore', 'inherit', 'inherit'] });
  ownServer.on('error', error => { console.error('[Сервер]', error.message); void stop(1); });
  ownServer.on('exit', code => { if (!stopping) { console.error(`[Сервер] Игра остановилась (код ${code}).`); void stop(1); } });
  for (let i = 0; i < 60 && !stopping; i++) { if (await health()) return; await delay(150); }
  throw new Error('Локальный сервер не запустился');
}
function sshEnvironment() {
  // Some anonymous providers request an empty password. Never read personal keys
  // and never open a graphical prompt or wait for hidden input.
  const askpass = path.join(DATA, process.platform === 'win32' ? 'ssh-empty-askpass.cmd' : 'ssh-empty-askpass.sh');
  fs.writeFileSync(askpass, process.platform === 'win32' ? '@echo.\r\n' : '#!/bin/sh\nprintf "\\n"\n', { mode: 0o700 });
  return { ...process.env, SSH_ASKPASS: askpass, SSH_ASKPASS_REQUIRE: 'force', DISPLAY: process.env.DISPLAY || ':0' };
}
function startAttempt(attempts, index = 0) {
  if (stopping) return;
  const attempt = attempts[index];
  if (!attempt) { console.error('Не удалось открыть туннель. Проверь интернет. Доступные маршруты: --provider=serveo, pinggy, localhost, cloudflare.'); void stop(1); return; }
  const { name, port } = attempt;
  console.log(`[Туннель] Подключаю ${name}${port ? ', SSH-порт ' + port : ''}…`);
  let command, args, env = process.env;
  if (name === 'cloudflare') {
    command = process.env.CLOUDFLARED || 'cloudflared'; args = ['tunnel', '--url', localUrl, '--no-autoupdate', '--protocol', 'http2'];
  } else {
    const config = providers[name];
    command = 'ssh';
    args = ['-T', '-F', nullFile, '-o', 'IdentityAgent=none', '-o', 'PubkeyAuthentication=no', '-o', `PreferredAuthentications=${config.auth}`, '-o', 'NumberOfPasswordPrompts=1', '-o', 'BatchMode=no',
      '-o', 'StrictHostKeyChecking=accept-new', '-o', `UserKnownHostsFile=${path.join(DATA, 'tunnel-known-hosts')}`, '-o', 'ConnectTimeout=10', '-o', 'ServerAliveInterval=20', '-o', 'ServerAliveCountMax=3', '-o', 'ExitOnForwardFailure=yes',
      '-p', String(port), '-R', `${config.remote}:127.0.0.1:${PORT}`, config.host];
    if (name === 'localhost') args.push('--', '--output', 'json');
    env = sshEnvironment();
  }
  let assigned = false, handled = false, buffer = '';
  const child = tunnel = spawn(command, args, { cwd: ROOT, env, stdio: ['ignore', 'pipe', 'pipe'] });
  const timeout = setTimeout(() => { if (!assigned && !stopping) { console.log('[Туннель] Провайдер не выдал адрес, пробую следующий маршрут…'); child.kill('SIGTERM'); } }, name === 'cloudflare' ? 45000 : 25000);
  const read = chunk => {
    buffer = (buffer + chunk.toString()).slice(-100000);
    let url;
    if (name === 'localhost') {
      for (const line of buffer.split('\n')) {
        try { const event = JSON.parse(line.trim()); if (event.type === 'run.localhost.tunnel.registered' && /^[a-zA-Z0-9.-]+$/.test(event.data?.address || '')) url = `https://${event.data.address}`; } catch { /* Provider banner. */ }
      }
    } else url = buffer.match(name === 'cloudflare' ? /https:\/\/[a-z0-9-]+\.trycloudflare\.com/ : providers[name].pattern)?.[0];
    if (url) { assigned = true; clearTimeout(timeout); publishUrl(url, name); }
    for (const line of chunk.toString().split('\n')) if (/^(ssh:|Permission denied|.+: Permission denied|Could not resolve)/i.test(line.trim())) console.log('[SSH]', line.trim().slice(0, 400));
  };
  child.stdout.on('data', read); child.stderr.on('data', read);
  const failed = () => {
    if (handled || stopping || tunnel !== child) return;
    handled = true; clearTimeout(timeout);
    if (assigned) { clearPublicUrl(); publicUrl = ''; console.log('[Туннель] Соединение потеряно. Переподключаюсь через 3 секунды…'); retry = setTimeout(() => startAttempt(attempts, index), 3000); }
    else startAttempt(attempts, index + 1);
  };
  child.on('error', error => { console.log(`[${name}] ${error.message}`); failed(); }); child.on('exit', failed);
}
function attemptsFor(name) {
  if (name === 'cloudflare') return [{ name }];
  const list = providers[name].ports.map(port => ({ name, port }));
  if (!selected && name === 'serveo') list.push({ name: 'pinggy', port: 443 });
  return list;
}
async function watchExisting(record) {
  attached = true;
  console.log(`\nТУННЕЛЬ УЖЕ РАБОТАЕТ · ${record.provider}\n${record.url}\nЭтот терминал теперь показывает состояние подключения.\nCtrl+C завершит только этот монитор; исходный туннель продолжит работать.\nПерезапуск в этом окне: r или --restart + Enter.\nИз обычной строки терминала: npm run share -- --provider=${provider} --restart\n`);
  let previousUrl = record.url, busy = false, count = 0;
  const poll = async () => {
    if (busy || stopping) return;
    busy = true;
    const current = readRecord();
    if (current && live(current.pid) && current.pid !== record.pid) {
      record = current; previousUrl = current.url;
      console.log(`[Монитор] Подключён новый туннель: ${current.provider} · ${current.url}`);
    }
    if (!live(record.pid) || !current) {
      if (count !== -1) console.log('[Монитор] Туннель остановлен или переподключается. Для нового запуска: Ctrl+C, затем npm run share.');
      count = -1; busy = false; return;
    }
    if (current.url !== previousUrl) { previousUrl = current.url; console.log('[Новый адрес]', current.url); }
    if (count++ % 3 === 0) {
      let ok = false;
      try { ok = await publicHealth(current.url, 5000); } catch { /* Report the route, not the local game. */ }
      const latest = readRecord();
      if (latest?.url !== current.url) {
        if (latest?.url) console.log('[Новый адрес]', latest.url);
      } else if (ok) console.log(`[Монитор ${new Date().toLocaleTimeString('ru-RU')}] HTTPS доступен · ${current.url}`);
      else console.log(`[Монитор] Не отвечает внешний маршрут: ${current.url}\nВведи r и Enter для новой ссылки. Локальная игра: ${localUrl}`);
    }
    busy = false;
  };
  monitor = setInterval(() => { void poll(); }, 5000); void poll();
}
async function stop(code = 0) {
  if (stopping) return;
  stopping = true; consoleInput?.close(); clearTimeout(retry); clearInterval(monitor); clearPublicUrl(); tunnel?.kill('SIGTERM');
  if (ownServer) {
    ownServer.kill('SIGTERM');
    await Promise.race([new Promise(resolve => ownServer.once('exit', resolve)), delay(1500)]);
    if (ownServer.exitCode === null) ownServer.kill('SIGKILL');
  }
  console.log(attached ? '\nМонитор остановлен. Исходный туннель работает.' : '\nТуннель закрыт.'); process.exit(code);
}
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => { void stop(); });
process.on('uncaughtException', error => { console.error(error.message); void stop(1); });
try {
  if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) throw new Error('PORT должен быть целым числом от 1 до 65535');
  if (!providers[provider] && provider !== 'cloudflare') throw new Error('Неизвестный провайдер. Выбери serveo, pinggy, localhost или cloudflare');
  fs.mkdirSync(DATA, { recursive: true });
  const existing = readRecord();
  if (existing && (existing.port || 3000) === PORT && live(existing.pid)) {
    if (restarting) {
      await retireLauncher(existing);
    } else {
      if (!(await health())) throw new Error('Туннель активен, но локальный сервер остановлен. Запусти npm run share -- --restart.');
      await watchExisting(existing);
    }
  }
  if (!attached) { await ensureServer(); startAttempt(attemptsFor(provider)); }
  installConsole();
} catch (error) { console.error(error.message); await stop(1); }
