# Work with Shop-bandoan Local Docker Dependencies

## Purpose

Safely use or change the local PostgreSQL and Redis environment defined at the
repository root.

## Use When

Use for local database/cache startup, Compose diagnostics, health checks, port
or credential configuration, or an approved Compose change.

## Current Compose Contract

- `postgres:17` runs as `shop_postgres` on `5432` with database `shopdb`.
- `redis:7-alpine` runs as `shop_redis` on `6379`.
- Both use named volumes and Docker health checks.
- Backend `.env.example` uses the matching local PostgreSQL/Redis addresses.
- The Compose file does not define an API service, frontend service, Dockerfile,
  CI workflow, or production deployment.

## Workflow

1. Run `docker compose config --quiet` before and after Compose edits.
2. Start local dependencies with `docker compose up -d` from the root.
3. Verify service health before attributing an application error to code.
4. Use `npx prisma migrate deploy` from `backend/` only after confirming the
   intended local database and migration state.
5. Use `/api/v1/health` to verify application-level PostgreSQL and Redis access
   when the API is running.

## Safety

- Treat current credentials and exposed ports as development-only.
- Never remove volumes, reset databases, or target another Docker context
  without explicit approval.
- Keep production containerization separate from dependency Compose changes.
- Do not hide Redis connection failures by adding unbounded retries; the current
  client intentionally uses lazy connect and limited retry behavior.
