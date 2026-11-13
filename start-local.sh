#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

PGHOST="${PGHOST:-127.0.0.1}"
PGPORT="${PGPORT:-5432}"
PGUSER="${PGUSER:-${USER:-roovethelema}}"
PGDATABASE="${PGDATABASE:-blinov_zombies}"

echo "[1/4] Проверка PostgreSQL на ${PGHOST}:${PGPORT}..."
if ! pg_isready -h "$PGHOST" -p "$PGPORT" >/dev/null 2>&1; then
  echo "ОШИБКА: PostgreSQL не запущен на ${PGHOST}:${PGPORT}."
  echo "Запустите службу: sudo systemctl start postgresql"
  exit 1
fi

echo "[2/4] Проверка базы данных ${PGDATABASE}..."
if ! psql -U "$PGUSER" -h "$PGHOST" -p "$PGPORT" -lqt | cut -d \| -f 1 | grep -qw "$PGDATABASE"; then
  createdb -U "$PGUSER" -h "$PGHOST" -p "$PGPORT" -E UTF8 "$PGDATABASE"
fi
psql -U "$PGUSER" -h "$PGHOST" -p "$PGPORT" -d "$PGDATABASE" -f db/schema.sql >/dev/null

echo "[3/4] Проверка зависимостей Node.js и сборки офлайн-бандла..."
if [ ! -d node_modules ]; then
  npm install --no-audit --no-fund
fi
node scripts/build-classic.mjs

echo "[4/4] Запуск сервера игры и API на http://localhost:${PORT:-3000}/"
exec node server.js
