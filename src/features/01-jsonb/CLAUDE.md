# Phase 01: JSONB (flexible product attributes)

## The e-commerce story
A laptop has RAM and CPU. A shirt has size and color. One fixed table can't hold both without 50 nullable columns. JSONB stores each product's own attributes in a single column and still lets you query and index inside it.

## Goal
Add an `attributes` JSONB column to products, query inside it, and show an index making that query fast.

## Build
1. Migration (create with `--create-only`, then edit):
   - `ALTER TABLE "Product" ADD COLUMN attributes jsonb NOT NULL DEFAULT '{}'`
   - `CREATE INDEX product_attributes_gin ON "Product" USING GIN (attributes jsonb_path_ops)`
   In `schema.prisma` declare it as `Json` (Prisma supports jsonb natively; the GIN index stays in raw SQL).
2. Update the seed script: give each product category its own attribute shape (e.g. electronics: `ram_gb`, `brand`; clothing: `size`, `color`; books: `author`, `pages`).
3. Endpoints in `routes.ts`:
   - `GET /products/by-attributes?filter={"color":"red"}`: containment query (`attributes @> $1::jsonb`) via `$queryRaw`.
   - `GET /products/:id/attributes`: returns attributes with one extracted field using `->>`.
4. `scripts/jsonb-explain.ts`: runs the containment query with `EXPLAIN (ANALYZE, BUFFERS)` twice, once with the GIN index and once after dropping it inside a transaction that is rolled back. Prints both timings.

## Do NOT
- Build a generic filter builder, nested-path query language, or jsonpath support.
- Add a JSON schema validator.

## Verify
- Containment query returns correct products for `{"color":"red"}`.
- The explain script shows a Bitmap/Index scan with the index and a Seq Scan without it.

## Doc note (`docs/01-jsonb.md`)
Include the two timings, and one sentence on when a normal column is better than JSONB.
