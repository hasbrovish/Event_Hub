#!/usr/bin/env bash
# Start Postgres (Docker), apply migrations, run API on http://127.0.0.1:8000
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  docker compose up -d postgres
  echo "Postgres: waiting for container health…"
  for _ in $(seq 1 60); do
    if docker compose exec -T postgres pg_isready -U eventhub -d eventhub >/dev/null 2>&1; then
      break
    fi
    sleep 1
  done
else
  echo "Warning: Docker not installed or daemon not running."
  echo "  Install/start Docker Desktop, or run: ./scripts/docker-up.sh"
  echo "  Or point backend/.env DATABASE_URL at any Postgres on 127.0.0.1:5432 (user/db: eventhub)."
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
