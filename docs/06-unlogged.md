# 06 Unlogged tables

**Deviation from the phase spec:** the spec says not to model the cache tables in `schema.prisma`. But Prisma treats unknown tables as drift and would generate `DROP TABLE` in every later migration. They're declared with `@@ignore` instead, which keeps them out of the Prisma client (raw SQL only). Chosen as option A on 2026-10-30. Prisma's own hint for `@@ignore`: "When using Prisma Migrate, this model will be kept in sync with the database schema, however, it will not be exposed in Prisma Client." The drift check confirmed it: the only generated line was the known HNSW `DROP INDEX`. Prisma also doesn't notice `UNLOGGED`.

## What it is
Every change to a normal table is first written to the **WAL** (write-ahead log), the crash journal that lets Postgres replay committed work after a power loss. An `UNLOGGED` table skips the WAL, so its writes are cheaper. But after a crash Postgres can't trust its contents, so it **empties the table** during recovery. Unlogged tables are also not copied to replicas.

## The SQL that matters
```sql
CREATE UNLOGGED TABLE cache_unlogged (key text PRIMARY KEY, value jsonb NOT NULL, expires_at timestamptz NOT NULL);
CREATE TABLE cache_logged (LIKE cache_unlogged INCLUDING ALL);   -- LIKE copies structure, not UNLOGGED

-- read-through cache (GET product:1 / SET product:1 ... EX 60)
SELECT value FROM cache_unlogged WHERE key = 'product:1' AND expires_at > now();
INSERT INTO cache_unlogged (key, value, expires_at)
VALUES ('product:1', '{...}', now() + interval '60 seconds')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, expires_at = EXCLUDED.expires_at;
```

## What I measured
**Cache endpoint:** the first `GET /products/1/cached` returns `X-Cache: MISS`, and the second (within 60 s) returns `X-Cache: HIT`.

**`npm run unlogged:bench`:** 100,000 upserts, then 100,000 again, batches of 1,000 (200 commits per table):

| table | insert | update | total | WAL written |
|---|---|---|---|---|
| `cache_logged` | 7.6 s | 7.1 s | 14.7 s | **67 MB** |
| `cache_unlogged` | 7.7 s | 7.6 s | 15.3 s | **1.1 MB** |

About **60× less WAL, but no speedup.** With big batches there are only 200 commits, so the WAL fsync wait is a tiny part of the run. Writing 67 MB sequentially is cheap. Most of the time goes to work that's identical for both tables: building arrays in Node, the round trip, parsing 1,000 JSON values per batch, and checking the primary key for `ON CONFLICT`. Unlogged pays off when WAL/commit waits are the bottleneck: many small commits, heavy write volume on a busy disk, or replication.

**Crash test** ([scripts/unlogged-crash.md](../scripts/unlogged-crash.md), `docker compose kill db`):

| | before kill | after restart |
|---|---|---|
| `cache_unlogged` | 2 (crash-test + cached `product:1`) | **0** |
| `cache_logged` | 1 | **1** |

The logs show crash recovery: `database system was not properly shut down; automatic recovery in progress` → `redo starts` → `redo done … distance=69751 kB`. About 68 MB of WAL was replayed, which is basically what the benchmark had just written for `cache_logged`.

## When Redis is still the better choice
When traffic is heavy or the database is already the bottleneck: Redis serves from RAM on a separate server (taking load *off* Postgres), and it evicts and expires keys by itself.

## Gotchas
- **A clean stop is not a crash.** After `docker compose stop` (shutdown checkpoint), unlogged data survives. Only an unclean stop (`kill`, power loss, OOM) empties it.
- **Unlogged ≠ automatically faster.** Measure. Here, batching had already removed most of the commit cost.
- **Windows PowerShell 5.1 mangles `\"`** in arguments passed to `docker`. The crash procedure uses `jsonb_build_object(...)` so no double quotes are needed.
- **The HNSW `DROP INDEX` appeared again** in the generated migration and was deleted by hand.
- **Stale cache:** with TTL only, a product update isn't visible for up to 60 s. TODO: trigger-based invalidation (next step).
