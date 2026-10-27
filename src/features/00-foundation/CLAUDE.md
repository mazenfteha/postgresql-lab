# Phase 00: Foundation

## Goal
A running Express + Prisma + Postgres skeleton with a seeded product catalog. Nothing Postgres-fancy yet.

## Build
1. `package.json` with TypeScript, Express, Prisma, `@prisma/client`, `tsx`, `dotenv`. Check current Prisma docs for setup (config file and client generation have changed between major versions).
2. `docker/Dockerfile.postgres`: start from a PostGIS image (PostgreSQL 17) and add `pgvector` (use the `postgresql-17-pgvector` apt package if available, otherwise build from source per the pgvector README).
3. `docker-compose.yml`: one `db` service built from that Dockerfile, port 5432, named volume, healthcheck. Leave a commented-out place for extra services (Electric later).
4. `prisma/schema.prisma` with only these models:
   - `Product`: id, name, description, price (Decimal), category, createdAt
   - `Customer`: id, name, email
   - `Order` and `OrderItem`: minimal, just enough to feel like a shop
5. `src/db.ts` exports one PrismaClient. `src/server.ts` is Express with `GET /health` (runs `SELECT 1`).
6. `scripts/seed.ts`: ~5,000 products with realistic names, descriptions and categories (a small hardcoded word list plus random combination is fine, no faker needed unless you want it). Also ~50 customers.
7. npm scripts: `db:up`, `db:down`, `db:reset`, `migrate`, `seed`, `dev`.
8. Create `docs/00-foundation.md` and `docs/ideas.md`.

## Do NOT
- Add auth, validation libraries, a service layer, tests, or linting setup.
- Create any extension, special index or special column. Later phases do that.

## Verify
- `npm run db:up && npm run migrate && npm run seed && npm run dev`
- `curl localhost:3000/health` returns ok
- Row count query shows ~5,000 products

## Done when
The Verify steps pass and the checkbox for phase 00 is ticked in the root `CLAUDE.md`.
