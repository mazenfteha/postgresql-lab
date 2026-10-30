-- (Prisma generated "DROP INDEX product_embedding_hnsw" here: removed, Prisma 6 can't describe HNSW)

-- UNLOGGED: writes skip the WAL (faster), but the table is emptied after a crash. Prisma can't express this.
CREATE UNLOGGED TABLE "cache_unlogged" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "cache_unlogged_pkey" PRIMARY KEY ("key")
);

-- Identical columns + primary key, but a normal (logged, crash-safe) table, for comparison.
-- LIKE copies the structure, not the UNLOGGED property. The PK index gets the name "cache_logged_pkey".
CREATE TABLE "cache_logged" (LIKE "cache_unlogged" INCLUDING ALL);
