#!/usr/bin/env bash
# Start Postgres (Docker), migrate, API (8000), frontend (8080). From repo root.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "=== Event Hub: full stack ==="

if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  "$ROOT/scripts/docker-up.sh" || echo "⚠ docker-up.sh failed — fix Docker/logs, then run it again."
else
  echo "⚠ Docker daemon not available — start Docker Desktop, then: ./scripts/docker-up.sh"
  echo "  API will still start but /health may show db unreachable until Postgres runs."
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
if .venv/bin/alembic upgrade head 2>/dev/null; then
  echo "✓ Database migrations applied"
else
  echo "⚠ Skipped migrations (Postgres not reachable). After Docker is up: cd backend && .venv/bin/alembic upgrade head"
fi

api_up() { lsof -iTCP:8000 -sTCP:LISTEN >/dev/null 2>&1; }
fe_up() { lsof -iTCP:8080 -sTCP:LISTEN >/dev/null 2>&1; }

if api_up; then
  echo "✓ API already listening on http://127.0.0.1:8000"
else
  echo "Starting API on http://127.0.0.1:8000 …"
  (cd "$ROOT/backend" && exec .venv/bin/python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000) &
  sleep 2
  api_up && echo "✓ API started" || echo "⚠ API may still be starting; check terminal or logs"
fi

cd "$ROOT/frontend"
if [ ! -d node_modules ]; then
  npm install
fi

if fe_up; then
  echo "✓ Frontend already listening on http://127.0.0.1:8080"
else
  echo "Starting frontend on http://127.0.0.1:8080 …"
  npm run dev &
  sleep 2
  fe_up && echo "✓ Frontend started" || echo "⚠ Frontend may still be starting"
fi

echo ""
echo "Open:  http://127.0.0.1:8080"
echo "API:   http://127.0.0.1:8000/docs"
echo "Until /health shows db connected, run Docker and: ./scripts/docker-up.sh"
