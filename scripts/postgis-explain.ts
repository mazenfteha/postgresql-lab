import { prisma } from "../src/db.js";

// EXPLAIN ANALYZE of the nearby query from central Cairo, 10 km radius.
const lat = 30.0444;
const lng = 31.2357;
const meters = 10_000;

type PlanRow = { "QUERY PLAN": string };
const print = (rows: PlanRow[]) => console.log(rows.map((r) => r["QUERY PLAN"]).join("\n"), "\n");

const explain = () =>
  prisma.$queryRaw<PlanRow[]>`
    EXPLAIN ANALYZE
    SELECT s.id, s.name, ST_Distance(s.location, q.p) AS meters
    FROM "Store" s, (SELECT ST_SetSRID(ST_MakePoint(${lng}::float8, ${lat}::float8), 4326)::geography AS p) q
    WHERE ST_DWithin(s.location, q.p, ${meters}::float8)
    ORDER BY ST_Distance(s.location, q.p)`;

await prisma.$executeRaw`ANALYZE "Store"`;

console.log("== 1. default plan (only ~200 rows: the planner may decide a Seq Scan is cheaper) ==");
print(await explain());

// SET LOCAL equivalent: only affects this transaction, so it can't leak to other pooled connections.
console.log("== 2. enable_seqscan = off: shows the GiST index can serve ST_DWithin ==");
const [, forced] = await prisma.$transaction([
  prisma.$queryRaw`SELECT set_config('enable_seqscan', 'off', true)`,
  explain(),
]);
print(forced);

await prisma.$disconnect();
