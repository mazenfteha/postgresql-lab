import { performance } from "node:perf_hooks";
import { Prisma } from "@prisma/client";
import { prisma } from "../src/db.js";

// Same workload on both tables: 100,000 upserts (insert pass), then 100,000 again (update pass).
// Batches of 1,000 rows, one statement and one commit per batch.
const ROWS = 100_000;
const BATCH = 1_000;

// Table names can't be query parameters; these are fixed constants, never user input.
const TABLES = { cache_unlogged: Prisma.raw("cache_unlogged"), cache_logged: Prisma.raw("cache_logged") };

async function pass(table: Prisma.Sql, round: number) {
  for (let start = 0; start < ROWS; start += BATCH) {
    const keys: string[] = [];
    const values: string[] = [];
    for (let i = start; i < start + BATCH; i++) {
      keys.push(`bench:${i}`);
      values.push(JSON.stringify({ id: i, name: `Product ${i}`, price: (i % 500) + 0.99, round }));
    }
    await prisma.$executeRaw`
      INSERT INTO ${table} (key, value, expires_at)
      SELECT k, v::jsonb, now() + interval '60 seconds'
      FROM unnest(${keys}::text[], ${values}::text[]) AS t(k, v)
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, expires_at = EXCLUDED.expires_at`;
  }
}

// WAL position before/after tells how many bytes of crash journal each run wrote.
const walPos = async () => (await prisma.$queryRaw<{ lsn: string }[]>`SELECT pg_current_wal_lsn()::text AS lsn`)[0].lsn;
const walSince = async (lsn: string) =>
  (await prisma.$queryRaw<{ bytes: number }[]>`
    SELECT pg_wal_lsn_diff(pg_current_wal_lsn(), ${lsn}::pg_lsn)::float8 AS bytes`)[0].bytes;

async function run(name: keyof typeof TABLES) {
  const table = TABLES[name];
  await prisma.$executeRaw`TRUNCATE ${table}`;
  const lsn = await walPos();

  let t = performance.now();
  await pass(table, 1);
  const insert_ms = Math.round(performance.now() - t);

  t = performance.now();
  await pass(table, 2);
  const update_ms = Math.round(performance.now() - t);

  const wal_mb = +((await walSince(lsn)) / 1024 / 1024).toFixed(1);
  return { insert_ms, update_ms, total_ms: insert_ms + update_ms, wal_mb };
}

console.log(`${ROWS.toLocaleString()} rows per pass, batches of ${BATCH}, 2 passes (insert, then update)\n`);
const results = { cache_logged: await run("cache_logged"), cache_unlogged: await run("cache_unlogged") };
console.table(results);
console.log(`unlogged is ${(results.cache_logged.total_ms / results.cache_unlogged.total_ms).toFixed(1)}x faster`);

await prisma.$executeRaw`TRUNCATE cache_logged, cache_unlogged`;
await prisma.$disconnect();
