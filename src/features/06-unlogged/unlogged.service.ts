import { prisma } from "../../db.js";

const TTL_SECONDS = 60;

// Only rows that haven't expired count. No cleanup job: expired rows are just overwritten on the next miss.
async function cacheGet(key: string) {
  const rows = await prisma.$queryRaw<{ value: unknown }[]>`
    SELECT value FROM cache_unlogged WHERE key = ${key} AND expires_at > now()`;
  return rows[0]?.value;
}

const cacheSet = (key: string, value: unknown) =>
  prisma.$executeRaw`
    INSERT INTO cache_unlogged (key, value, expires_at)
    VALUES (${key}, ${JSON.stringify(value)}::jsonb, now() + make_interval(secs => ${TTL_SECONDS}))
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, expires_at = EXCLUDED.expires_at`;

// Read-through cache: try the unlogged table, else load with Prisma and store it for 60s.
export async function cachedProduct(id: number) {
  const key = `product:${id}`;
  const hit = await cacheGet(key);
  if (hit) return { cache: "HIT" as const, product: hit };

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return null;
  await cacheSet(key, product);
  return { cache: "MISS" as const, product };
}
