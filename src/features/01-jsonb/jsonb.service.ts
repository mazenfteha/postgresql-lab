import { Prisma } from "@prisma/client";
import { prisma } from "../../db.js";

type ProductRow = { id: number; name: string; category: string; price: Prisma.Decimal; attributes: Prisma.JsonValue };

// Containment: rows whose attributes include every key/value in `filter`. Uses the GIN index.
export async function findByAttributes(filter: Record<string, unknown>) {
  const json = JSON.stringify(filter);
  const [{ count }] = await prisma.$queryRaw<{ count: number }[]>`
    SELECT count(*)::int AS count FROM "Product" WHERE attributes @> ${json}::jsonb`;
  const products = await prisma.$queryRaw<ProductRow[]>`
    SELECT id, name, category, price, attributes
    FROM "Product"
    WHERE attributes @> ${json}::jsonb
    ORDER BY id
    LIMIT 50`;
  return { count, products };
}

// ->> extracts one field as text (-> would keep it as jsonb).
export async function getAttributes(id: number) {
  const rows = await prisma.$queryRaw<{ id: number; name: string; attributes: Prisma.JsonValue; color: string | null }[]>`
    SELECT id, name, attributes, attributes->>'color' AS color
    FROM "Product"
    WHERE id = ${id}`;
  return rows[0] ?? null;
}
