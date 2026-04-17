-- Run as PostgreSQL superuser, e.g.:
--   psql -h 127.0.0.1 -p 5432 -U postgres -f scripts/init_local_db.sql
-- Matches default backend/.env.example (user/password/db: eventhub).
-- If "already exists" appears, the role or DB is already there — continue with alembic.

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'eventhub') THEN
    CREATE ROLE eventhub WITH LOGIN PASSWORD 'eventhub';
  END IF;
END
$$;

CREATE DATABASE eventhub OWNER eventhub;

\c eventhub
GRANT ALL ON SCHEMA public TO eventhub;
