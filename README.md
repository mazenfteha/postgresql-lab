# Postgres Feature Lab

A learning project: each phase demos **one PostgreSQL feature** on a tiny e-commerce backend (products, customers, orders). The goal is to see each feature work and understand why it exists, not to build a real shop.

**Stack:** Node.js · TypeScript · Express · Prisma 6 · PostgreSQL 17 (PostGIS + pgvector) in Docker

## Phases

| # | Feature | What it shows | Notes |
|---|---|---|---|
| 00 | Foundation | Express + Prisma + Postgres in Docker, 5,000 seeded products | [docs](docs/00-foundation.md) |
| 01 | JSONB | Per-category product attributes in one `jsonb` column + GIN index | [docs](docs/01-jsonb.md) |
| 02 | Full-text search | Ranked search with `tsvector`, typo-tolerant search with `pg_trgm` | [docs](docs/02-fulltext.md) |
| 03 | pgvector | Semantic search + "similar products" with local embeddings and an HNSW index | [docs](docs/03-pgvector.md) |
| 04 | pgai | _skipped: the project was archived in 2026_ | [notes](docs/04-pgai.md) |
| 05 | PostGIS | "Stores near me": `geography` points, `ST_DWithin` + GiST index | [docs](docs/05-postgis.md) |
| 06 | Unlogged tables | A Redis-like cache table without WAL, crash test, trigger-based invalidation | [docs](docs/06-unlogged.md) |

### 01 · JSONB

![Phase 01 animation: different attribute shapes in one jsonb column, GIN index lookup, and why selectivity matters](docs/anim/01-jsonb.svg)

### 02 · Full-text search

![Phase 02 animation: ILIKE scans every row, full-text search uses a GIN index, pg_trgm tolerates typos](docs/anim/02-fulltext.svg)

### 03 · pgvector

![Phase 03 animation: text becomes 384 numbers, nearest neighbours find similar products, semantic search answers where keywords return nothing](docs/anim/03-pgvector.svg)

### 05 · PostGIS

![Phase 05 animation: 200 stores around Cairo, the GiST bounding-box test then the exact distance check, nearest stores first](docs/anim/05-postgis.svg)

### 06 · Unlogged tables

![Phase 06 animation: unlogged writes skip the WAL, a crash empties the unlogged table, a trigger invalidates the cache on product updates](docs/anim/06-unlogged.svg)

## Run it

Requires Node 20+, Docker, and port 5433 free (the database is mapped there).

```bash
npm install
npm run db:up      # build + start Postgres (first build compiles pgvector)
npm run migrate    # apply migrations, generate the Prisma client
npm run seed       # 5,000 products, 50 customers
npm run embed      # phase 03: embeddings for every product (~3.5 min on CPU)
npm run seed:stores # phase 05: 200 stores around Cairo
npm run dev        # API on http://localhost:3000
```

Try the endpoints with the Postman collection in [`postman/`](postman/pg-lab.postman_collection.json) (one folder per phase).

## Layout

```
src/features/NN-name/   # one folder per phase: CLAUDE.md spec + routes / controller / service
scripts/                # seed and benchmark scripts
prisma/                 # schema + migrations (raw SQL for Postgres-specific features)
docs/NN-name.md         # what it is, the SQL that matters, what I measured, gotchas
docs/anim/              # one animated SVG per phase
```
