import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = __dirname;
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';

const poolConfig = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
      host: process.env.PGHOST || '127.0.0.1',
      port: Number(process.env.PGPORT || 5432),
      database: process.env.PGDATABASE || 'blinov_zombies',
      user: process.env.PGUSER || process.env.USER || 'roovethelema',
      ...(process.env.PGPASSWORD ? { password: process.env.PGPASSWORD } : {}),
    };

const pool = new Pool(poolConfig);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.m4v': 'video/mp4',
};

const MEME_VIDEO_EXTS = new Set(['.mp4', '.webm', '.mov', '.m4v', '.ogv']);
const MEME_IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif']);

function scanMemesDirectory() {
  const memesDir = path.join(ROOT, 'memes');
  if (!fs.existsSync(memesDir)) return [];

  const files = fs
    .readdirSync(memesDir, { withFileTypes: true })
    .filter((d) => d.isFile())
    .map((d) => d.name)
    .sort((a, b) => a.localeCompare(b));

  const seenHashes = new Set();
  const memes = [];

  for (const fileName of files) {
    const ext = path.extname(fileName).toLowerCase();
    const isVideo = MEME_VIDEO_EXTS.has(ext);
    const isImage = MEME_IMAGE_EXTS.has(ext);
    if (!isVideo && !isImage) continue;

    const fullPath = path.join(memesDir, fileName);
    const hash = crypto.createHash('sha256').update(fs.readFileSync(fullPath)).digest('hex');
    if (seenHashes.has(hash)) continue;
    seenHashes.add(hash);

    const numTag = String(memes.length + 1).padStart(2, '0');
    memes.push({
      id: `meme_${hash.slice(0, 10)}`,
      type: isVideo ? 'video' : 'image',
      src: `./memes/${encodeURIComponent(fileName)}`,
      title: `АРХИВ // ${numTag}`,
      caption: '',
      duration: isVideo ? 6 : 4,
    });
  }

  return memes;
}

const BLOCKED_PREFIXES = ['/db', '/node_modules', '/scripts', '/.git', '/.github'];
const BLOCKED_FILES = new Set(['/server.js', '/package.json', '/package-lock.json', '/start-local.sh', '/.env']);

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function sendJson(res, status, payload) {
  setCorsHeaders(res);
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function readJsonBody(req, maxBytes = 32768) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(new Error('Payload too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8').trim();
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function sanitizeNickname(value) {
  const clean = String(value || 'BunkerFighter').trim().replace(/[<>]/g, '').slice(0, 32);
  return clean || 'BunkerFighter';
}

function clampInt(value, fallback = 0, max = 100000000) {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.min(max, n);
}

async function ensureSchema() {
  const schemaPath = path.join(ROOT, 'db', 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    const sql = fs.readFileSync(schemaPath, 'utf8');
    await pool.query(sql);
  }
}

const multiplayerRooms = new Map();
function multiplayerRoom(name) {
  if (!multiplayerRooms.has(name)) multiplayerRooms.set(name, { players: new Map(), host: null, world: null, events: [] });
  return multiplayerRooms.get(name);
}

async function handleApi(req, res, urlObj) {
  const pathname = urlObj.pathname;

  if (req.method === 'POST' && pathname === '/api/multiplayer') {
    const data = await readJsonBody(req, 524288);
    const roomName = String(data.room || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 24);
    const id = String(data.id || '').replace(/[^a-zA-Z0-9-]/g, '').slice(0, 64);
    if (!roomName || !id) return sendJson(res, 400, { error: 'Invalid room or player' });
    const oldRoom = multiplayerRooms.get(roomName);
    if (oldRoom) {
      for (const [key, player] of oldRoom.players) if (Date.now() - player.seen > 12000) oldRoom.players.delete(key);
      if (!oldRoom.players.size) multiplayerRooms.delete(roomName);
    }
    const exists = multiplayerRooms.has(roomName);
    if (data.action === 'create' && exists && multiplayerRooms.get(roomName).players.size) return sendJson(res, 409, { error: 'Комната уже существует' });
    if (data.action === 'join' && !exists) return sendJson(res, 404, { error: 'Комната не найдена' });
    const room = multiplayerRoom(roomName);
    const now = Date.now();
    for (const [key, player] of room.players) if (now - player.seen > 12000) room.players.delete(key);
    if (!room.players.has(room.host)) { room.host = room.players.keys().next().value || id; room.world = null; }
    if (data.leave) {
      room.players.delete(id);
      if (!room.players.size) multiplayerRooms.delete(roomName);
      return sendJson(res, 200, { ok: true });
    }
    room.players.set(id, { id, name: String(data.name || 'Игрок').slice(0, 20), x: Number(data.x) || 0, y: Number(data.y) || 0, angle: Number(data.angle) || 0, hp: Number(data.hp) || 0, seen: now });
    if (id === room.host && data.world) room.world = data.world;
    if (Array.isArray(data.events)) for (const event of data.events.slice(0, 50)) room.events.push({ ...event, from: id, seq: crypto.randomUUID(), time: now });
    room.events = room.events.filter(event => now - event.time < 5000).slice(-500);
    return sendJson(res, 200, { host: room.host, players: [...room.players.values()], world: room.world, events: room.events });
  }

  if (req.method === 'GET' && pathname === '/api/network') {
    const addresses = Object.values(os.networkInterfaces()).flat().filter(item => item && item.family === 'IPv4' && !item.internal).map(item => `http://${item.address}:${PORT}/`);
    return sendJson(res, 200, { addresses });
  }

  if (req.method === 'GET' && pathname === '/api/memes') {
    const memes = scanMemesDirectory();
    return sendJson(res, 200, { ok: true, memes });
  }

  if (req.method === 'GET' && pathname === '/api/health') {
    const result = await pool.query('SELECT current_database() AS database, NOW() AS server_time');
    return sendJson(res, 200, {
      ok: true,
      db: 'postgresql',
      database: result.rows[0]?.database || poolConfig.database,
      serverTime: result.rows[0]?.server_time,
    });
  }

  if (req.method === 'GET' && pathname === '/api/leaderboard') {
    const limit = Math.max(1, Math.min(50, clampInt(urlObj.searchParams.get('limit') || 15, 15, 50)));
    const [runsRes, profilesRes, ludkaRes, summaryRes] = await Promise.all([
      pool.query(
        `SELECT id, nickname, round_reached, kills, headshots, points_final, total_earned,
                shots_fired, ludka_spins, memes_watched, revived_used, survived_sec, created_at
         FROM game_runs
         ORDER BY round_reached DESC, total_earned DESC, kills DESC, created_at DESC
         LIMIT $1`,
        [limit]
      ),
      pool.query(
        `SELECT nickname, best_round, best_score, total_kills, total_headshots,
                total_coins_earned, ludka_spins, memes_watched, updated_at
         FROM player_profiles
         ORDER BY best_round DESC, best_score DESC
         LIMIT $1`,
        [limit]
      ),
      pool.query(
        `SELECT id, nickname, meme_id, meme_type, outcome_id, outcome_title,
                coins_delta, weapon_won, risked, risk_won, created_at
         FROM ludka_history
         ORDER BY created_at DESC
         LIMIT $1`,
        [limit]
      ),
      pool.query(
        `SELECT
           (SELECT COUNT(*)::int FROM game_runs) AS total_runs,
           (SELECT COALESCE(SUM(kills), 0)::bigint FROM game_runs) AS total_kills,
           (SELECT COALESCE(MAX(round_reached), 1)::int FROM game_runs) AS top_round,
           (SELECT COUNT(*)::int FROM ludka_history) AS total_ludka_spins`
      ),
    ]);

    return sendJson(res, 200, {
      ok: true,
      runs: runsRes.rows,
      profiles: profilesRes.rows,
      ludkaHistory: ludkaRes.rows,
      summary: summaryRes.rows[0] || {},
    });
  }

  if (req.method === 'POST' && pathname === '/api/runs') {
    const body = await readJsonBody(req);
    const nickname = sanitizeNickname(body.nickname);
    const roundReached = Math.max(1, clampInt(body.roundReached ?? body.round_reached, 1, 9999));
    const kills = clampInt(body.kills, 0);
    const headshots = clampInt(body.headshots, 0);
    const pointsFinal = clampInt(body.pointsFinal ?? body.points_final, 0);
    const totalEarned = Math.max(pointsFinal, clampInt(body.totalEarned ?? body.total_earned, 0));
    const shotsFired = clampInt(body.shotsFired ?? body.shots_fired, 0);
    const ludkaSpins = clampInt(body.ludkaSpins ?? body.ludka_spins, 0, 10000);
    const memesWatched = clampInt(body.memesWatched ?? body.memes_watched, 0, 10000);
    const revivedUsed = clampInt(body.revivedUsed ?? body.revived_used, 0, 1000);
    const survivedSec = clampInt(body.survivedSec ?? body.survived_sec, 0, 864000);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const insertRun = await client.query(
        `INSERT INTO game_runs (
           nickname, round_reached, kills, headshots, points_final, total_earned,
           shots_fired, ludka_spins, memes_watched, revived_used, survived_sec
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         RETURNING *`,
        [nickname, roundReached, kills, headshots, pointsFinal, totalEarned, shotsFired, ludkaSpins, memesWatched, revivedUsed, survivedSec]
      );

      await client.query(
        `INSERT INTO player_profiles (
           nickname, best_round, best_score, total_kills, total_headshots,
           total_coins_earned, ludka_spins, memes_watched, updated_at
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())
         ON CONFLICT (nickname) DO UPDATE SET
           best_round = GREATEST(player_profiles.best_round, EXCLUDED.best_round),
           best_score = GREATEST(player_profiles.best_score, EXCLUDED.best_score),
           total_kills = player_profiles.total_kills + EXCLUDED.total_kills,
           total_headshots = player_profiles.total_headshots + EXCLUDED.total_headshots,
           total_coins_earned = player_profiles.total_coins_earned + EXCLUDED.total_coins_earned,
           ludka_spins = player_profiles.ludka_spins + EXCLUDED.ludka_spins,
           memes_watched = player_profiles.memes_watched + EXCLUDED.memes_watched,
           updated_at = NOW()`,
        [nickname, roundReached, totalEarned, kills, headshots, totalEarned, ludkaSpins, memesWatched]
      );
      await client.query('COMMIT');

      return sendJson(res, 201, { ok: true, run: insertRun.rows[0] });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  if (req.method === 'POST' && pathname === '/api/ludka') {
    const body = await readJsonBody(req);
    const nickname = sanitizeNickname(body.nickname);
    const memeId = body.memeId ? String(body.memeId).slice(0, 80) : null;
    const memeType = body.memeType ? String(body.memeType).slice(0, 16) : null;
    const outcomeId = String(body.outcomeId || body.kind || 'unknown').slice(0, 64);
    const outcomeTitle = String(body.outcomeTitle || body.title || 'Лудка 777').slice(0, 120);
    const coinsDelta = Math.trunc(Number(body.coinsDelta ?? body.coins ?? 0)) || 0;
    const weaponWon = body.weaponWon ? String(body.weaponWon).slice(0, 32) : null;
    const risked = Boolean(body.risked);
    const riskWon = body.riskWon === undefined || body.riskWon === null ? null : Boolean(body.riskWon);

    const ins = await pool.query(
      `INSERT INTO ludka_history (
         nickname, meme_id, meme_type, outcome_id, outcome_title,
         coins_delta, weapon_won, risked, risk_won
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [nickname, memeId, memeType, outcomeId, outcomeTitle, coinsDelta, weaponWon, risked, riskWon]
    );

    return sendJson(res, 201, { ok: true, entry: ins.rows[0] });
  }

  return sendJson(res, 404, { ok: false, error: 'Not found' });
}

function serveStatic(req, res, urlPath) {
  let cleanPath = decodeURIComponent(urlPath);
  if (cleanPath === '/' || cleanPath === '') cleanPath = '/index.html';

  if (
    BLOCKED_FILES.has(cleanPath) ||
    BLOCKED_PREFIXES.some((prefix) => cleanPath === prefix || cleanPath.startsWith(`${prefix}/`))
  ) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  const rel = cleanPath.replace(/^\/+/, '');
  const fullPath = path.resolve(ROOT, rel);
  if (!fullPath.startsWith(ROOT + path.sep) && fullPath !== ROOT) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  if (!fs.existsSync(fullPath) || fs.statSync(fullPath).isDirectory()) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  const stat = fs.statSync(fullPath);
  const ext = path.extname(fullPath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  const rangeHeader = req.headers.range;

  if (rangeHeader && (ext === '.mp4' || ext === '.webm')) {
    const parts = rangeHeader.replace(/bytes=/, '').split('-');
    const start = Math.max(0, parseInt(parts[0], 10) || 0);
    const end = parts[1] ? Math.min(stat.size - 1, parseInt(parts[1], 10)) : stat.size - 1;
    if (start >= stat.size || start > end) {
      res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` });
      res.end();
      return;
    }
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${stat.size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': end - start + 1,
      'Content-Type': contentType,
    });
    fs.createReadStream(fullPath, { start, end }).pipe(res);
    return;
  }

  res.writeHead(200, {
    'Content-Type': contentType,
    'Content-Length': stat.size,
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'no-cache',
  });
  fs.createReadStream(fullPath).pipe(res);
}

const server = http.createServer(async (req, res) => {
  try {
    const urlObj = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

    if (req.method === 'OPTIONS' && urlObj.pathname.startsWith('/api/')) {
      setCorsHeaders(res);
      res.writeHead(204);
      res.end();
      return;
    }

    if (urlObj.pathname.startsWith('/api/')) {
      await handleApi(req, res, urlObj);
      return;
    }

    serveStatic(req, res, urlObj.pathname);
  } catch (err) {
    console.error('[server error]', err);
    if (!res.headersSent) {
      sendJson(res, 500, { ok: false, error: err.message || 'Internal Server Error' });
    }
  }
});

async function start() {
  try {
    await ensureSchema();
    console.log(`[DB] PostgreSQL connected (${poolConfig.database || 'DATABASE_URL'})`);
  } catch (err) {
    console.error('[DB WARNING] PostgreSQL init failed:', err.message);
  }

  server.listen(PORT, HOST, () => {
    console.log(`[SERVER] Call of Duty: Zombies 2D running at http://localhost:${PORT}/`);
  });
}

start();
