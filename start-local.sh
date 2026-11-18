#!/usr/bin/env bash
set -euo pipefail
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"
if ! command -v node >/dev/null 2>&1; then
  echo 'Для запуска нужен Node.js версии 20 или новее.'
  exit 1
fi
if [ ! -d node_modules/ws ]; then
  npm ci --no-audit --no-fund
fi
if [ "${1:-}" = '--share' ]; then
  exec npm run share
fi
exec npm start
