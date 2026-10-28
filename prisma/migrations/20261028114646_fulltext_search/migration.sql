-- Trigram matching (typo tolerance)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- AlterTable: generated column, Postgres keeps it in sync with name + description
ALTER TABLE "Product" ADD COLUMN "search_vector" tsvector
  GENERATED ALWAYS AS (to_tsvector('english', coalesce("name", '') || ' ' || coalesce("description", ''))) STORED;

-- CreateIndex
CREATE INDEX "product_search_gin" ON "Product" USING GIN ("search_vector");

-- CreateIndex
CREATE INDEX "product_name_trgm" ON "Product" USING GIN ("name" gin_trgm_ops);
