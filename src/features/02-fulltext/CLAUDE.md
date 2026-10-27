# Phase 02: Full-text search (product search box)

## The e-commerce story
A shopper types "wireles headphnes" into the search box. `LIKE '%term%'` is slow and has no ranking or typo handling. Postgres has real search built in.

## Goal
A ranked keyword search plus typo tolerance, entirely inside Postgres.

## Build
1. Migration (`--create-only`, edit):
   - `CREATE EXTENSION IF NOT EXISTS pg_trgm;`
   - Add a generated column: `search_vector tsvector GENERATED ALWAYS AS (to_tsvector('english', coalesce(name,'') || ' ' || coalesce(description,''))) STORED`
   - `CREATE INDEX product_search_gin ON "Product" USING GIN (search_vector);`
   - `CREATE INDEX product_name_trgm ON "Product" USING GIN (name gin_trgm_ops);`
   In `schema.prisma`, declare `search_vector Unsupported("tsvector")?` so Prisma doesn't try to manage it.
2. Endpoints in `routes.ts`:
   - `GET /search?q=` : ranked results using `websearch_to_tsquery` + `ts_rank`, plus `ts_headline` for a highlighted snippet. Limit 20.
   - `GET /search/fuzzy?q=` : typo-tolerant name search using `pg_trgm` (`similarity()` and the `%` operator). Limit 20.
3. `scripts/search-compare.ts`: time `ILIKE '%term%'` vs the tsvector query for the same term on the seeded data and print both.

## Do NOT
- Add pagination, filters, facets, autocomplete, or multiple languages.
- Install ParadeDB / `pg_search` here. It's a possible later experiment; log it in `docs/ideas.md`.

## Verify
- `/search?q=wireless headphones` returns relevant ranked rows with highlights.
- `/search/fuzzy?q=wireles hedphones` still returns sensible results.
- The compare script shows the tsvector query faster than ILIKE.

## Doc note (`docs/02-fulltext.md`)
Include the timing comparison and one example where fuzzy matching found something FTS did not (and vice versa).
