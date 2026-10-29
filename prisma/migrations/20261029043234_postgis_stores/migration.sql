-- PostGIS: geography/geometry types, ST_* functions, GiST support (already installed by the image; harmless)
CREATE EXTENSION IF NOT EXISTS postgis;

-- (Prisma generated "DROP INDEX product_embedding_hnsw" here: removed, Prisma 6 can't describe HNSW)

-- CreateTable
CREATE TABLE "Store" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "location" geography(Point, 4326) NOT NULL,

    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "store_location_gist" ON "Store" USING GIST ("location");
