# 02 Full-text search

![Phase 02 animation](anim/02-fulltext.svg)

## What it is
Two kinds of search built into Postgres:
- **Full-text search (FTS):** text is split into normalized words ("lexemes": `headphones` → `headphon`, `cleaning` → `clean`) stored in a `tsvector`. Queries are `tsquery`s. Results can be ranked (`ts_rank`) and highlighted (`ts_headline`).
- **Trigram matching (`pg_trgm`):** strings are split into 3-letter chunks, so similar spellings share most chunks. This gives typo tolerance.

## The SQL that matters
```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
ALTER TABLE "Product" ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (to_tsvector('english', coalesce(name,'') || ' ' || coalesce(description,''))) STORED;
CREATE INDEX product_search_gin ON "Product" USING GIN (search_vector);
CREATE INDEX product_name_trgm  ON "Product" USING GIN (name gin_trgm_ops);

-- ranked search + highlighted snippet
SELECT name, ts_rank(search_vector, query) AS rank,
       ts_headline('english', description, query) AS snippet
FROM "Product", websearch_to_tsquery('english', 'wireless headphones') AS query
WHERE search_vector @@ query
ORDER BY rank DESC LIMIT 20;

-- typo-tolerant name search
SELECT name, word_similarity('wireles hedphones', name) AS word_sim
FROM "Product"
WHERE 'wireles hedphones' <% name
ORDER BY word_sim DESC LIMIT 20;
```

## What I measured
`npm run search:compare` with the term `headphones` on 5,000 products, 50 runs each:

| | rows | avg (incl. round trip) | plan | DB execution time |
|---|---|---|---|---|
| `ILIKE '%term%'` on name + description | 104 | 11.434 ms | Seq Scan | 9.649 ms |
| `search_vector @@ websearch_to_tsquery` | 104 | 1.431 ms | Bitmap Heap Scan (GIN) | 0.146 ms |

FTS is about 66× faster inside the DB. ILIKE has to run a substring match on every row, while FTS looks up the GIN index.

Fuzzy vs FTS:

| Query | `/search` (FTS) | `/search/fuzzy` (trigram) |
|---|---|---|
| `wireles hedphones` | nothing: the misspelled words aren't lexemes | "Mini Leather Wireless Headphones", `word_sim` 0.71 (`sim` 0.42) |
| `tnnis rackt` | nothing | "Lightweight Bamboo Tennis Racket", `word_sim` 0.58 (`sim` 0.23): only passes because the threshold was lowered to 0.5 |
| `cleaning` | "Deluxe Recycled Frying Pan…: easy to **clean**" (stemming: cleaning → clean) | nothing: fuzzy only looks at names, and "cleaning" isn't spelled like any name |

`sim` (plain `similarity`, whole name) stays low for long names. `word_sim` is the right score for a search box.

## Gotchas
- **`similarity()` / `%` vs `word_similarity()` / `<%`:** `similarity` compares the query with the *whole* name, so a short query against a long name scores low and falls below the default 0.3 threshold. `word_similarity` compares it with the best-matching part of the name. The fuzzy endpoint returns both scores so you can see the difference.
- **The default `word_similarity_threshold` (0.6) is too strict for short words with typos.** `tnnis rackt` vs "Tennis Racket" scores 0.58, because each typo breaks most trigrams of a 5-letter word. The fuzzy endpoint lowers it to 0.5 with `set_config(..., true)` (= `SET LOCAL`) inside a transaction, so the setting can't leak to other pooled connections.
- **Prisma vs generated columns:** Postgres stores the generation expression like a column default, so Prisma tried to `DROP DEFAULT` it, and Postgres rejected that. The fix is to mirror the exact expression (as `pg_get_expr` prints it) in `@default(dbgenerated("..."))`. If `migrate dev` asks for a migration name when you didn't change the schema, that's drift: stop and look.
- The generated column fills in automatically for existing rows and on every insert/update. No seed change is needed, and Prisma must never write to it (`Unsupported("tsvector")?`).
- All three GIN indexes are declared in `schema.prisma` so Prisma doesn't generate `DROP INDEX` later.
- The `english` config drops stop words ("the", "and", "for") and stems words, so `'english'` must be the same in the column and in the query.
