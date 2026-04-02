#!/usr/bin/env bash
# Start Postgres (Docker), apply migrations, run API on http://127.0.0.1:8000
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if command -v docker >/dev/null 2>&1; then
  docker compose up -d
  echo "Postgres: waiting for port 5432…"
  for _ in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15; do
    if command -v pg_isready >/dev/null 2>&1 && pg_isready -h 127.0.0.1 -p 5432 -q 2>/dev/null; then
      break
    fi
    sleep 1
  done
else
  echo "Warning: docker not found. Ensure PostgreSQL is running on 127.0.0.1:5432 (user/db: eventhub) or set DATABASE_URL in backend/.env"
fi

cd "$ROOT/backend"
if [ ! -d .venv ]; then
  python3 -m venv .venv
fi
.venv/bin/pip install -q -r requirements.txt
if [ ! -f .env ] && [ -f .env.example ]; then
  cp .env.example .env
  echo "Created backend/.env from .env.example"
fi
.venv/bin/alembic upgrade head
echo "Starting uvicorn on http://127.0.0.1:8000 (Ctrl+C to stop)"
exec .venv/bin/python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
