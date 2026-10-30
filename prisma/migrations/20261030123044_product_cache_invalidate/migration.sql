-- (Prisma generated "DROP INDEX product_embedding_hnsw" here: removed, Prisma 6 can't describe HNSW)

-- Cache invalidation, delete-on-write: whenever a product row changes or is deleted,
-- drop its cached copy. Runs for EVERY writer (the API, Prisma Studio, psql, scripts).
-- Prisma doesn't manage functions/triggers, so this lives only in the migration.
CREATE FUNCTION product_cache_invalidate() RETURNS trigger AS $$
BEGIN
  DELETE FROM cache_unlogged WHERE key = 'product:' || OLD.id;
  RETURN NULL; -- AFTER trigger: the return value is ignored
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER product_cache_invalidate
AFTER UPDATE OR DELETE ON "Product"
FOR EACH ROW EXECUTE FUNCTION product_cache_invalidate();
