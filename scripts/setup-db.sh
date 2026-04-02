#!/usr/bin/env bash
# Create eventhub role/database (local Postgres) and run Alembic. No Docker required.
# Prerequisite: PostgreSQL listening on PGHOST:PGPORT (default 127.0.0.1:5432).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

export PGHOST="${PGHOST:-127.0.0.1}"
export PGPORT="${PGPORT:-5432}"
# Superuser for init script (adjust if your install uses your macOS username)
export PGUSER="${PGUSER:-postgres}"

find_psql() {
  command -v psql && return
  for p in /opt/homebrew/bin/psql /usr/local/bin/psql; do
    [ -x "$p" ] && echo "$p" && return
  done
  for p in /Applications/Postgres.app/Contents/Versions/*/bin/psql; do
    [ -x "$p" ] && echo "$p" && return
  done
  return 1
}

PSQL=$(find_psql) || {
  echo "Error: psql not found. Install PostgreSQL client tools or add Postgres.app bin to PATH."
  echo "See planning/LOCAL_POSTGRES_SETUP.md"
  exit 1
}

echo "Using psql: $PSQL (host=$PGHOST port=$PGPORT user=$PGUSER)"
if ! "$PSQL" -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d postgres -c "SELECT 1" >/dev/null 2>&1; then
  echo "Error: cannot connect as $PGUSER to postgres on $PGHOST:$PGPORT"
  echo "Try: export PGUSER=your_superuser   # e.g. your mac login for Homebrew postgres"
  exit 1
fi

echo "Applying scripts/init_local_db.sql …"
"$PSQL" -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d postgres -f "$ROOT/scripts/init_local_db.sql" || true
# "already exists" on CREATE DATABASE is OK if DB was created earlier

cd "$ROOT/backend"
if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created backend/.env from .env.example"
fi
if [ ! -d .venv ]; then
  python3 -m venv .venv
  .venv/bin/pip install -q -r requirements.txt
fi

echo "Running alembic upgrade head …"
.venv/bin/alembic upgrade head

echo "Optional seed: .venv/bin/python -m scripts.seed_demo_events"
echo "Done. Check: curl -s http://127.0.0.1:8000/health"
