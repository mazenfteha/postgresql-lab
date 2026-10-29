import { performance } from "node:perf_hooks";
import { prisma } from "../src/db.js";
import { embed, MODEL, toVector } from "../src/features/03-pgvector/embed.js";

// Embeds every product that has no embedding yet (safe to re-run).
const BATCH = 100;

const [{ total }] = await prisma.$queryRaw<{ total: number }[]>`
  SELECT count(*)::int AS total FROM "Product" WHERE embedding IS NULL`;
console.log(`model: ${MODEL} · products to embed: ${total} (first run downloads the model)`);

const start = performance.now();
let done = 0;
for (;;) {
  const rows = await prisma.$queryRaw<{ id: number; name: string; description: string }[]>`
    SELECT id, name, description FROM "Product" WHERE embedding IS NULL ORDER BY id LIMIT ${BATCH}`;
  if (rows.length === 0) break;

  const vectors = await embed(rows.map((r) => `${r.name}. ${r.description}`));
  await prisma.$transaction(
    rows.map((r, i) => prisma.$executeRaw`UPDATE "Product" SET embedding = ${toVector(vectors[i])}::vector WHERE id = ${r.id}`),
  );

  done += rows.length;
  console.log(`${done}/${total}`);
}

console.log(`done in ${((performance.now() - start) / 1000).toFixed(1)}s`);
await prisma.$disconnect();
