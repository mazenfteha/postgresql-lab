# 01 JSONB

![Phase 01 animation](anim/01-jsonb.svg)

## What it is
A `jsonb` column stores each product's own attributes (a shirt has `size`/`color`, a toy has `age_min`/`pieces`) without 50 nullable columns. Postgres stores it in a parsed binary form, so you can query inside it and index it.

## The SQL that matters
```sql
-- migration
ALTER TABLE "Product" ADD COLUMN "attributes" jsonb NOT NULL DEFAULT '{}';
CREATE INDEX product_attributes_gin ON "Product" USING GIN (attributes jsonb_path_ops);

-- containment: "attributes include all of these key/values" (can use the GIN index)
SELECT id, name FROM "Product" WHERE attributes @> '{"color":"red"}'::jsonb;

-- extract one field as text
SELECT attributes->>'color' AS color FROM "Product" WHERE id = 1;
```
`jsonb_path_ops` makes the index smaller and faster than the default `jsonb_ops`, but it only supports `@>` (plus jsonpath `@?`/`@@`), not key-exists operators like `?`.

## What I measured
`{"color":"red"}` matches 474 of 5,000 products.

| | Plan | Execution time |
|---|---|---|
| With GIN index | Bitmap Index Scan on `product_attributes_gin` → Bitmap Heap Scan (137 heap blocks, 140 buffers hit) | 0.423 ms |
| Without index | not captured (the output after the "WITHOUT index" heading was missing) | — |

The red products are spread over 137 heap pages, which is nearly the whole table. With a filter this unselective on a table this small, the index saves little. It pays off with selective filters (e.g. `{"color":"red","size":"XL"}`) and big tables.

## Gotchas
- The GIN index is also declared in `schema.prisma` (`@@index(..., type: Gin, ops: JsonbPathOps)`). Otherwise Prisma sees it as drift and would generate a `DROP INDEX` in the next migration.
- `DROP INDEX` is transactional in Postgres, so the explain script can drop it, measure and roll back safely.
- The seed now uses `TRUNCATE ... RESTART IDENTITY`, so ids start at 1 after every re-seed.
- **Use a normal column instead** when a field is on most rows and you filter, sort, join or constrain on it often (like `price` or `category`). You get real types, constraints, per-column statistics and cheap B-tree indexes.
- Types matter inside JSON: `{"age_min":"3"}` does not match `{"age_min":3}`.
- `jsonb_path_ops` only helps `@>` (and jsonpath). Range queries like `(attributes->>'weight_kg')::numeric > 2` need an expression index.
