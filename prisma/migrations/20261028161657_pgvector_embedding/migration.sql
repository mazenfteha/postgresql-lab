-- pgvector: vector type, distance operators, HNSW/IVFFlat indexes
CREATE EXTENSION IF NOT EXISTS vector;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "embedding" vector(384);

-- CreateIndex (not expressible in Prisma 6: delete any later "DROP INDEX product_embedding_hnsw")
CREATE INDEX product_embedding_hnsw ON "Product" USING hnsw (embedding vector_cosine_ops);
