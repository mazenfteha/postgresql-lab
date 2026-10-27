# Phase 06: Unlogged tables (cache and counters)

## The e-commerce story
Popular product pages and "recently viewed" lists don't need to survive a crash. An UNLOGGED table skips the write-ahead log, so writes are much faster, at the cost of being emptied after a crash.

## Goal
A tiny key/value cache table in Postgres, a benchmark against a normal table, and a demonstration of data loss after a crash.

## Build
1. Migration (`--create-only`, edit). Create two identical tables:
   - `CREATE UNLOGGED TABLE cache_unlogged (key text PRIMARY KEY, value jsonb NOT NULL, expires_at timestamptz NOT NULL);`
   - `CREATE TABLE cache_logged (LIKE cache_unlogged INCLUDING ALL);`
   Do not model them in `schema.prisma`. Use `$queryRaw` / `$executeRaw` only.
2. Endpoint in `routes.ts`:
   - `GET /products/:id/cached`: look up `cache_unlogged`; on miss, load the product with Prisma, store it with a 60s expiry (`INSERT ... ON CONFLICT DO UPDATE`), return it with a header `X-Cache: HIT|MISS`.
3. `scripts/unlogged-bench.ts`: insert/update 100,000 rows into each table in the same way (batched) and print both durations.
4. `scripts/unlogged-crash.md` (a short manual procedure, not code): write a row to both tables, force an unclean stop of the Postgres container (`docker kill`, not `docker stop`), restart, and query both. Expected: the unlogged table is empty, the logged one kept its row.

## Do NOT
- Implement eviction, cache invalidation strategies, Redis-style commands, or a cleanup job.
- Use unlogged tables for any real business data.

## Verify
- Second request to `/products/:id/cached` returns `X-Cache: HIT`.
- Benchmark prints both timings; crash procedure result matches the expectation.

## Doc note (`docs/06-unlogged.md`)
Both timings, the crash result, and one sentence on when Redis is still the better choice.
