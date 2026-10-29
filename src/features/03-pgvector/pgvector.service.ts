import { prisma } from "../../db.js";
import { embed, toVector } from "./embed.js";

type Neighbor = { id: number; name: string; category: string; description: string; distance: number };

// Nearest by cosine distance (<=>, 0 = same direction). ORDER BY <=> against a constant vector lets HNSW be used.
const nearest = (vec: string, limit: number, excludeId: number) =>
  prisma.$queryRaw<Neighbor[]>`
    SELECT id, name, category, description, embedding <=> ${vec}::vector AS distance
    FROM "Product"
    WHERE embedding IS NOT NULL AND id <> ${excludeId}
    ORDER BY embedding <=> ${vec}::vector
    LIMIT ${limit}`;

// Two queries instead of a self-join: read this product's vector, then search with it as a constant.
export async function similar(id: number) {
  const rows = await prisma.$queryRaw<{ id: number; name: string; embedding: string | null }[]>`
    SELECT id, name, embedding::text AS embedding FROM "Product" WHERE id = ${id}`;
  const product = rows[0];
  if (!product?.embedding) return null;
  return { product: { id: product.id, name: product.name }, similar: await nearest(product.embedding, 5, id) };
}

// Embed the query text with the same model, then find the closest products.
export async function semantic(q: string) {
  const [v] = await embed([q]);
  return nearest(toVector(v), 10, -1);
}
