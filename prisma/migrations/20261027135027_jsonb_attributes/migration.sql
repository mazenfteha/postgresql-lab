-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "attributes" JSONB NOT NULL DEFAULT '{}';

-- CreateIndex
CREATE INDEX "product_attributes_gin" ON "Product" USING GIN ("attributes" jsonb_path_ops);
