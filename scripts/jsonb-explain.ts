import { prisma } from "../src/db.js";

// Same containment query as GET /products/by-attributes, run with and without the GIN index.
const filter = JSON.stringify({ color: "red" });

type PlanRow = { "QUERY PLAN": string };
type Db = Pick<typeof prisma, "$queryRaw">;

const explain = (db: Db) =>
  db.$queryRaw<PlanRow[]>`
    EXPLAIN (ANALYZE, BUFFERS)
    SELECT id, name FROM "Product" WHERE attributes @> ${filter}::jsonb`;

const print = (label: string, plan: PlanRow[]) => {
  const lines = plan.map((r) => r["QUERY PLAN"]);
  console.log(`\n=== ${label} ===`);
  console.log(lines.join("\n"));
  return {
    scan: lines.find((l) => l.includes("Scan"))?.trim().split("  ")[0] ?? "?",
    time: lines.find((l) => l.startsWith("Execution Time")) ?? "?",
  };
};

class Rollback extends Error {}

await prisma.$executeRaw`ANALYZE "Product"`;
console.log(`filter: ${filter}`);

const withIndex = print("WITH GIN index", await explain(prisma));

// DROP INDEX is transactional in Postgres: drop, measure, then roll back so the index comes back.
let withoutIndex = { scan: "?", time: "?" };
try {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`DROP INDEX product_attributes_gin`;
    withoutIndex = print("WITHOUT index (rolled back)", await explain(tx));
    throw new Rollback();
  });
} catch (e) {
  if (!(e instanceof Rollback)) throw e;
}

console.log("\n=== Summary ===");
console.table({ "with index": withIndex, "without index": withoutIndex });
await prisma.$disconnect();
