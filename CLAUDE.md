# Postgres Feature Lab (E-commerce demo)

## Purpose
A learning project. Each phase demos ONE PostgreSQL feature on a tiny e-commerce backend.
The goal is to see each feature work and understand why it exists, not to build a real shop.

## Golden rules
1. **Simplicity first.** Each phase = 2-3 endpoints + 1 script, maximum. No auth, no validation libraries, no layers (no repositories, services, DI containers). Route handler -> Prisma or raw SQL -> JSON response.
2. **Do only what the current phase's CLAUDE.md says.** If you think of an extra capability, add one line to `docs/ideas.md` and move on.
3. **Stop at the end of each phase.** Never start the next phase on your own.
4. **Don't trust memory for versions or config.** Prisma, pgvector, pg_mooncake, pgai and Electric SQL all change quickly. Check the current official docs (web search) before writing config, and record the versions you used in the phase doc.
5. If something in a phase is blocked (extension won't install, API changed), do not invent a workaround silently. Write what happened in the phase doc and use the fallback listed in the phase file.

## Stack
- Node.js (current LTS), TypeScript, Express
- Prisma ORM
- PostgreSQL 17 in Docker Compose (custom image: PostGIS base + pgvector)
- `tsx` for running TypeScript, `dotenv` for env

## Prisma vs raw SQL
Prisma cannot express most of these features. The split is:
- **Prisma**: base models, plain CRUD, migration history.
- **Raw SQL inside migrations**: extensions, GIN/GiST/HNSW indexes, generated columns, unlogged tables, special column types. Create with `npx prisma migrate dev --create-only`, edit the generated `migration.sql`, then apply.
- **`prisma.$queryRaw` / `$executeRaw` (tagged template literals only)** for queries that use special operators. Never build SQL by string concatenation.
- Columns Prisma doesn't understand are declared in `schema.prisma` with `Unsupported("...")` and marked optional, so migrations don't drift. Never read or write them through the normal Prisma client API.

## Layout
```
docker/Dockerfile.postgres
docker-compose.yml
prisma/schema.prisma
src/
  server.ts              # Express app, mounts feature routers
  db.ts                  # single PrismaClient export
  features/
    01-jsonb/            # CLAUDE.md + routes.ts (+ scripts)
    02-fulltext/
    ...
scripts/                 # seed and benchmark scripts
docs/
  NN-feature.md          # short note per phase
  ideas.md               # parking lot for out-of-scope ideas
```
Each feature folder contains its own `CLAUDE.md` with the spec for that phase.

## Per-phase workflow
1. Read this file, then the phase file in `src/features/<phase>/CLAUDE.md`.
2. Implement exactly what it lists.
3. Run the "Verify" steps and paste the key output into `docs/NN-feature.md`.
4. The doc note has four short sections: **What it is**, **The SQL that matters**, **What I measured**, **Gotchas**.
5. Tick the checkbox below, commit, stop.

## npm scripts (created in phase 00)
`db:up`, `db:down`, `db:reset`, `migrate`, `seed`, `dev`

## Progress
- [x] 00 Foundation
- [ ] 01 JSONB
- [ ] 02 Full-text search
- [ ] 03 pgvector
- [ ] 04 pgai (optional)
- [ ] 05 PostGIS
- [ ] 06 Unlogged tables
- [ ] 07 Time-series (pg_mooncake)
- [ ] 08 Electric SQL
- [ ] 09 Postgres as a message queue
