import { performance } from "node:perf_hooks";
import { prisma } from "../src/db.js";

// Same term, two ways: substring match (ILIKE) vs full-text search (tsvector + GIN).
const term = process.argv[2] ?? "headphones";
const RUNS = 50;
const like = `%${term}%`;

const ilike = () =>
  prisma.$queryRaw<{ id: number }[]>`
    SELECT id FROM "Product" WHERE name ILIKE ${like} OR description ILIKE ${like}`;
const fts = () =>
  prisma.$queryRaw<{ id: number }[]>`
    SELECT id FROM "Product" WHERE search_vector @@ websearch_to_tsquery('english', ${term})`;

const time = async (run: () => Promise<{ id: number }[]>) => {
  const rows = (await run()).length; // warm-up + row count
  const start = performance.now();
  for (let i = 0; i < RUNS; i++) await run();
  return { rows, avg_ms: +((performance.now() - start) / RUNS).toFixed(3) };
};

type PlanRow = { "QUERY PLAN": string };
const planSummary = (plan: PlanRow[]) => {
  const lines = plan.map((r) => r["QUERY PLAN"]);
  return {
    plan: lines.find((l) => l.includes("Scan"))?.trim().split("  ")[0] ?? "?",
    exec: lines.find((l) => l.startsWith("Execution Time")) ?? "?",
  };
};

await prisma.$executeRaw`ANALYZE "Product"`;
console.log(`term: "${term}", ${RUNS} runs each (avg includes the Node <-> DB round trip)\n`);

const ilikeTime = await time(ilike);
const ftsTime = await time(fts);

const ilikePlan = planSummary(await prisma.$queryRaw<PlanRow[]>`
  EXPLAIN ANALYZE SELECT id FROM "Product" WHERE name ILIKE ${like} OR description ILIKE ${like}`);
const ftsPlan = planSummary(await prisma.$queryRaw<PlanRow[]>`
  EXPLAIN ANALYZE SELECT id FROM "Product" WHERE search_vector @@ websearch_to_tsquery('english', ${term})`);

console.table({
  "ILIKE '%term%'": { ...ilikeTime, ...ilikePlan },
  "tsvector @@ tsquery": { ...ftsTime, ...ftsPlan },
});
await prisma.$disconnect();
