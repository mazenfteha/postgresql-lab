# Phase 03: pgvector ("similar products")

## The e-commerce story
"Customers also viewed" and "find me something like this" depend on meaning, not keywords. Embeddings turn each product into a vector, and the database finds the nearest ones.

## Goal
Store an embedding per product, add an HNSW index, and expose a "similar products" endpoint plus a semantic search endpoint.

## Decision: where embeddings come from
Pick ONE and write the choice at the top of `docs/03-pgvector.md`:
- **A (default, free, offline):** a local model via `@huggingface/transformers` (Transformers.js) with a small sentence-embedding model. Check the current package name and a recommended small model in its docs. Note the output dimension and use it in the column type.
- **B:** a hosted embeddings API, if the user provides a key via env var.
Never hardcode an API key. If neither works, use option A.

## Build
1. Migration (`--create-only`, edit):
   - `CREATE EXTENSION IF NOT EXISTS vector;`
   - `ALTER TABLE "Product" ADD COLUMN embedding vector(<DIM>);`
   - `CREATE INDEX product_embedding_hnsw ON "Product" USING hnsw (embedding vector_cosine_ops);`
   In `schema.prisma`: `embedding Unsupported("vector(<DIM>)")?`
2. `scripts/embed-products.ts`: for every product without an embedding, embed `name + description` in batches and write it with `$executeRaw` (pass the vector as a string like `'[0.1,0.2,...]'::vector`).
3. Endpoints in `routes.ts`:
   - `GET /products/:id/similar`: nearest 5 by cosine distance (`<=>`), excluding itself.
   - `GET /search/semantic?q=`: embed the query text with the same model, return nearest 10.
4. Share one small `embed(text)` helper in this feature folder.

## Do NOT
- Build hybrid FTS+vector ranking, re-ranking, chunking, or a RAG pipeline.
- Tune HNSW parameters.

## Verify
- A "running shoes" product's similar list contains other shoes/sports items.
- `/search/semantic?q=something to keep my coffee hot` returns mugs/thermoses even if those words aren't in the text.

## Doc note (`docs/03-pgvector.md`)
Include the embedding model + dimension, one good semantic result, and one place FTS would have failed.
