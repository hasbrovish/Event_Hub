#!/usr/bin/env bash
# Start only PostgreSQL and wait until it accepts connections.
# Persistence: data lives in the Docker volume until `docker compose down -v`.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v docker >/dev/null 2>&1; then
  echo "Error: docker not found. Install Docker Desktop (or Docker Engine) and try again."
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "Error: Docker daemon is not running. Start Docker Desktop (or the docker service) and try again."
  exit 1
fi

docker compose up -d postgres

echo "Waiting for Postgres (eventhub-pg) to become ready…"
for i in $(seq 1 60); do
  if docker compose exec -T postgres pg_isready -U eventhub -d eventhub >/dev/null 2>&1; then
    echo "Postgres is ready on port ${POSTGRES_PORT:-5432} (host) → 5432 (container)."
    docker compose ps postgres
    exit 0
  fi
  sleep 1
done

echo "Timeout: Postgres did not become ready. Logs:"
docker compose logs postgres --tail 50
exit 1
