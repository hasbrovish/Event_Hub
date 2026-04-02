# Docker + Postgres for Event Hub

## What you get

- **PostgreSQL 16** in a container named **`eventhub-pg`**.
- **Persistent data** in the Docker volume **`eventhub_pg_data`** (see `docker-compose.yml`). Data survives `docker compose stop` and `docker compose down`. It is removed only if you run **`docker compose down -v`**.
- **Auto-restart**: the `postgres` service uses `restart: unless-stopped`, so after a machine reboot the DB comes back when Docker starts (e.g. Docker Desktop on macOS).

## Requirements

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Mac/Windows) or Docker Engine + Compose plugin (Linux).
- Docker **daemon running** before `docker compose up`.

## On any machine (first time)

From the **repository root**:

```bash
# Optional: custom host port if 5432 is busy (then fix backend/.env ports to match)
cp docker-compose.env.example .env

docker compose up -d postgres
# or:
./scripts/docker-up.sh
```

Then migrate and (optional) seed:

```bash
cd backend
cp -n .env.example .env
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/alembic upgrade head
.venv/bin/python -m scripts.seed_demo_events
```

Or run API + DB in one step from repo root:

```bash
./scripts/run-backend.sh
```

## Another developer / another laptop

1. Clone the same repo (any path).
2. Same commands as above — they get a **new empty volume** on that host unless you restore a backup.
3. Optional: set `COMPOSE_PROJECT_NAME=eventhub` in the shell or in a root `.env` so the Compose project name is stable (volume name becomes `eventhub_eventhub_pg_data` style depending on Compose version).

## Moving data between machines

- **Backup** (example, run on source machine):

  ```bash
  docker compose exec -T postgres pg_dump -U eventhub eventhub > eventhub-backup.sql
  ```

- **Restore** on target: start Postgres empty, then `psql` into the DB and import the SQL file (or use `pg_restore` if you used custom format). Exact steps depend on dump format; keep user `eventhub` / DB `eventhub` aligned with `backend/.env`.

## Troubleshooting

| Symptom | Check |
|--------|--------|
| `Cannot connect to Docker daemon` | Start Docker Desktop / `sudo systemctl start docker` |
| Port 5432 in use | Set `POSTGRES_PORT=5433` in root `.env` and update `DATABASE_URL` in `backend/.env` |
| API `db: unreachable` | `./scripts/docker-up.sh` and confirm `docker compose ps` shows **healthy** |

## Files

| File | Role |
|------|------|
| `docker-compose.yml` | Postgres service + named volume |
| `docker-compose.env.example` | Template for root `.env` (`POSTGRES_PORT`) |
| `scripts/docker-up.sh` | Start DB only + wait for `pg_isready` |
| `scripts/run-backend.sh` | DB + migrations + uvicorn |
