# Local PostgreSQL (no Docker)

Use this when **Docker Desktop is not allowed** on a corporate laptop. The app only needs a reachable Postgres **16** (or **14+**) on `127.0.0.1` with a database and user that match `backend/.env`.

---

## 1. Install PostgreSQL on your machine

Pick one channel your IT allows:

| Platform | Options |
|----------|--------|
| **macOS** | [Postgres.app](https://postgresapp.com/) (simple), or **Homebrew**: `brew install postgresql@16` then `brew services start postgresql@16` |
| **Windows** | [EDB installer](https://www.postgresql.org/download/windows/) or a vendor-approved build |
| **Linux** | `sudo apt install postgresql` (Debian/Ubuntu) or your distro package |

Ensure the server listens on **`localhost` / `127.0.0.1`** and port **`5432`** (default), or note the port for `.env`.

---

## 2. Create role and database (once)

**Automated (from repo root):**

```bash
./scripts/setup-db.sh
```

If the default superuser `postgres` does not exist (common on Homebrew Mac), set your OS user:

```bash
export PGUSER=$(whoami)
./scripts/setup-db.sh
```

**Manual:** connect as superuser and run:

```bash
psql -h 127.0.0.1 -p 5432 -U postgres -f scripts/init_local_db.sql
```

Or paste the SQL from `scripts/init_local_db.sql` into any SQL client.

If your admin gives you an **existing** database URL instead, skip this and only edit `backend/.env`.

---

## 3. Point the API at Postgres

In **`backend/.env`** (copy from `backend/.env.example` if needed), set:

```env
DATABASE_URL=postgresql+asyncpg://eventhub:eventhub@127.0.0.1:5432/eventhub
SYNC_DATABASE_URL=postgresql+psycopg2://eventhub:eventhub@127.0.0.1:5432/eventhub
```

Change **host**, **port**, **user**, **password**, or **database name** if your install differs.

---

## 4. Migrate and run

```bash
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/alembic upgrade head
.venv/bin/python -m scripts.seed_demo_events   # optional
.venv/bin/python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Check [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health) → **`"db":"connected"`**.

Frontend (from `frontend/`): `npm run dev` → [http://127.0.0.1:8080](http://127.0.0.1:8080).

---

## 5. Corporate shared database

If IT provisions **one shared Postgres** (not on your laptop), use the URL they provide in **`DATABASE_URL`** / **`SYNC_DATABASE_URL`** (async uses `+asyncpg`, sync uses `+psycopg2`). You still run **`alembic upgrade head`** against that database if you’re allowed to apply migrations.

---

## Scripts that assume Docker

- `./scripts/docker-up.sh` and `docker compose` — **skip** these.
- `./scripts/run-backend.sh` / `./scripts/run-all.sh` — they only *try* Docker; if it fails, start Postgres yourself, then run **`alembic upgrade head`** and **uvicorn** manually (steps above).

---

## Troubleshooting

| Issue | What to check |
|-------|----------------|
| `connection refused` | Postgres service running? Correct port in `.env`? |
| `password authentication failed` | User/password in `.env` match the role you created? |
| `database "eventhub" does not exist` | Run `scripts/init_local_db.sql` or create DB manually. |
| Port **5432** in use | Another app uses it; change Postgres `port` in `postgresql.conf` **or** map a different port and update `.env`. |
